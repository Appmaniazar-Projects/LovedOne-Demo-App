// Receives Pay@ payment notifications.
//
// Payload shape is Pay@'s IntegratorPaymentNotificationDetailsModel (from
// the staging API docs). It is sent only when a payment is made, so there
// is no status field. Amounts are in cents.
//
// Auth: Pay@ calls this URL with an API-key header (WEBHOOK_KEY_HEADER).
//   • Each merchant-mode parlour has its own key; only its SHA-256 hash is
//     stored, in payment_provider_config.webhook_key_hash.
//   • LovedOne's own account (platform and integrator modes) uses the
//     PAYAT_PLATFORM_WEBHOOK_KEY function secret.
// The key decides which payments the notification may touch, so one
// parlour's key can never mark another parlour's payment as paid.
//
// Deploy with --no-verify-jwt: Pay@ doesn't send a Supabase JWT.

import { createClient } from 'npm:@supabase/supabase-js@2.45.4';
import { json, sha256Hex, timingSafeEqual, WEBHOOK_KEY_HEADER } from '../_shared/payat.ts';

interface PayAtNotification {
  accountNumber?: string;
  referenceNumber?: string;
  amountPaid: number; // cents
  merchantIdentifier?: string;
  settlementBatchId?: number;
  description?: string;
  customer?: string;
  businessName?: string;
  businessContactNumber?: string;
}

const SAFE_REF = /^[A-Za-z0-9-]{1,64}$/;

function parseNotification(input: unknown): PayAtNotification | null {
  if (!input || typeof input !== 'object') return null;
  const p = input as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === 'string' || typeof v === 'number') ? String(v).trim() : undefined;
  const amountPaid = typeof p.amountPaid === 'number' ? p.amountPaid : Number(p.amountPaid);
  const n: PayAtNotification = {
    accountNumber: str(p.accountNumber),
    referenceNumber: str(p.referenceNumber),
    amountPaid,
    merchantIdentifier: str(p.merchantIdentifier),
    settlementBatchId: typeof p.settlementBatchId === 'number' ? p.settlementBatchId : undefined,
    description: str(p.description),
    customer: str(p.customer),
    businessName: str(p.businessName),
    businessContactNumber: str(p.businessContactNumber),
  };
  if (!Number.isFinite(n.amountPaid)) return null;
  if (!n.accountNumber && !n.referenceNumber) return null;
  for (const ref of [n.accountNumber, n.referenceNumber]) {
    if (ref !== undefined && !SAFE_REF.test(ref)) return null;
  }
  return n;
}

// Which Pay@ account sent this, based on the key presented.
type Sender =
  | { kind: 'merchant'; parlorId: string }
  | { kind: 'platform' };

// deno-lint-ignore no-explicit-any
async function identifySender(req: Request, supabase: any): Promise<Sender | null> {
  const key = req.headers.get(WEBHOOK_KEY_HEADER)?.trim();
  if (!key) return null;

  const platformKey = Deno.env.get('PAYAT_PLATFORM_WEBHOOK_KEY');
  if (platformKey && timingSafeEqual(key, platformKey)) return { kind: 'platform' };

  const { data } = await supabase
    .from('payment_provider_config')
    .select('parlor_id')
    .eq('provider', 'pay_at')
    .eq('payat_mode', 'merchant')
    .eq('webhook_key_hash', await sha256Hex(key))
    .maybeSingle();

  return data ? { kind: 'merchant', parlorId: data.parlor_id } : null;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  try {
    // 1. Authenticate before looking anything up, so an unauthenticated
    //    caller can't probe which account numbers exist.
    const sender = await identifySender(req, supabase);
    if (!sender) return json({ success: false, error: 'Unauthorised' }, 401);

    let raw: unknown;
    try {
      raw = await req.json();
    } catch {
      return json({ success: false, error: 'Invalid JSON' }, 400);
    }
    const n = parseNotification(raw);
    if (!n) return json({ success: false, error: 'Invalid payload' }, 400);

    // 2. Find the payment. Pay@'s docs don't say whether accountNumber is
    //    our clientAccountNumber or the full sourceReference, so match
    //    either — but only within what this sender is allowed to touch.
    const filters: string[] = [];
    if (n.accountNumber) {
      filters.push(`payat_client_account_number.eq.${n.accountNumber}`, `reference.eq.${n.accountNumber}`);
    }
    if (n.referenceNumber) {
      filters.push(`client_reference_number.eq.${n.referenceNumber}`, `reference.eq.${n.referenceNumber}`);
    }

    let query = supabase
      .from('payments')
      .select('id, invoice_id, parlor_id, amount, status, payat_mode')
      .eq('provider', 'pay_at')
      .or(filters.join(','));

    query = sender.kind === 'merchant'
      ? query.eq('parlor_id', sender.parlorId).eq('payat_mode', 'merchant')
      : query.in('payat_mode', ['platform', 'integrator']);

    const { data: matches, error: findError } = await query.limit(2);
    if (findError) {
      console.error('payat-callback lookup failed:', findError);
      return json({ success: false, error: 'Lookup failed' }, 500);
    }

    const payment = matches?.length === 1 ? matches[0] : null;

    // Integrator notifications name the merchant; it must be this parlour's.
    if (payment && payment.payat_mode === 'integrator' && n.merchantIdentifier) {
      const { data: cfg } = await supabase
        .from('payment_provider_config')
        .select('payat_merchant_identifier')
        .eq('parlor_id', payment.parlor_id)
        .maybeSingle();
      if (cfg?.payat_merchant_identifier !== n.merchantIdentifier) {
        console.error('payat-callback merchant mismatch', { paymentId: payment.id, merchantIdentifier: n.merchantIdentifier });
        return json({ success: false, error: 'Merchant mismatch' }, 409);
      }
    }

    // 3. Log every authenticated notification exactly once. The unique
    //    index rejects replays, so a retried webhook can't apply twice.
    const dedupeKey = `notify:${n.accountNumber ?? ''}:${n.referenceNumber ?? ''}:${n.amountPaid}`;
    const { error: logError } = await supabase.from('payment_provider_details').insert({
      payment_id: payment?.id ?? null,
      provider: 'pay_at',
      provider_reference: n.referenceNumber ?? n.accountNumber,
      provider_transaction_id: dedupeKey,
      provider_payload: raw,
      paid_at: new Date().toISOString(),
    });

    if (logError) {
      if (logError.code === '23505') return json({ success: true, alreadyProcessed: true });
      console.error('payat-callback log insert failed:', logError);
      return json({ success: false, error: 'Could not log notification' }, 500);
    }

    if (!payment) {
      // Logged for follow-up. 200 so Pay@'s webhook test (mock data) passes
      // and real unmatched payments don't retry forever.
      console.warn('payat-callback: no unique payment for notification', {
        accountNumber: n.accountNumber, referenceNumber: n.referenceNumber, matches: matches?.length ?? 0,
      });
      return json({ success: true, matched: false });
    }

    if (payment.status === 'paid' || payment.status === 'refunded') {
      return json({ success: true, alreadyProcessed: true });
    }

    // 4. Amount check — a payment for the wrong amount is held for a person.
    const expectedCents = Math.round(Number(payment.amount) * 100);
    const amountMatches = Math.round(n.amountPaid) === expectedCents;
    if (!amountMatches) {
      console.error('Pay@ amount mismatch', { paymentId: payment.id, expectedCents, receivedCents: n.amountPaid });
    }
    const nextStatus = amountMatches ? 'paid' : 'awaiting_confirmation';

    const { error: updateError } = await supabase
      .from('payments')
      .update({ status: nextStatus, paid_at: amountMatches ? new Date().toISOString() : null })
      .eq('id', payment.id);

    if (updateError) {
      console.error('payat-callback update failed:', updateError);
      return json({ success: false, error: 'Could not update payment' }, 500);
    }

    // 5. Reconcile the linked invoice.
    if (payment.invoice_id && nextStatus === 'paid') {
      const { data: invoice } = await supabase
        .from('invoices').select('id, amount').eq('id', payment.invoice_id).single();
      if (invoice) {
        const { data: paid } = await supabase
          .from('payments').select('amount').eq('invoice_id', invoice.id).eq('status', 'paid');
        const totalPaid = (paid ?? []).reduce((sum: number, p: { amount: number }) => sum + Number(p.amount), 0);
        if (totalPaid >= Number(invoice.amount)) {
          await supabase.from('invoices').update({ status: 'paid' }).eq('id', invoice.id);
        }
      }
    }

    // 6. Notification hook point (Phase 8 — not built yet).

    return json({ success: true, matched: true, status: nextStatus });
  } catch (err) {
    console.error('payat-callback error:', err);
    return json({ success: false, error: 'Unexpected error' }, 500);
  }
});
