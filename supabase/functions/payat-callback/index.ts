
// Phase 6: the only endpoint that depends on Pay@'s actual spec.
// For now this is MOCKED — signature verification is a stub, and the
// field names below are guesses based on the reference/amount pattern
// common to these systems. Once Pay@ shares the real webhook spec at
// the technical kickoff, only the `verifySignature` function and the
// shape of `PayAtCallbackPayload` need to change.
//
// Flow: Pay@ → this endpoint → validate → update payment →
//       reconcile invoice → (hook point for notifications, Phase 8)

import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// PLACEHOLDER shape — replace field names once Pay@'s spec is confirmed.
interface PayAtCallbackPayload {
  reference: string;
  providerTransactionId: string;
  amount: number;
  status: 'paid' | 'failed' | 'expired';
  paidAt?: string;
}

// PLACEHOLDER — Pay@'s real signature scheme is unconfirmed. Do not rely
// on this for production until confirmed at the kickoff. Currently just
// checks a shared secret header so the flow is testable end-to-end.
function verifySignature(req: Request, rawBody: string, webhookSecret: string | null): boolean {
  if (!webhookSecret) return true; // mock mode: no secret configured yet, allow through
  const provided = req.headers.get('x-payat-signature');
  // TODO: replace with Pay@'s actual HMAC/signature algorithm once known.
  return provided === webhookSecret;
}

serve(async (req) => {
  try {
    const rawBody = await req.text();
    const payload: PayAtCallbackPayload = JSON.parse(rawBody);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1. Find the pending payment by reference
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('id, invoice_id, parlor_id, amount, status')
      .eq('payment_reference', payload.reference)
      .eq('provider', 'pay_at')
      .single();

    if (paymentError || !payment) {
      return new Response(JSON.stringify({ error: 'Payment not found for reference' }), {
        status: 404,
      });
    }

    // 2. Verify signature against this parlour's configured secret
    const { data: providerConfig } = await supabase
      .from('parlor_payment_providers')
      .select('config')
      .eq('parlor_id', payment.parlor_id)
      .eq('provider', 'pay_at')
      .maybeSingle();

    if (!verifySignature(req, rawBody, providerConfig?.config?.webhook_secret ?? null)) {
      return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401 });
    }

    // 3. Idempotency guard — don't reprocess a payment already settled
    if (payment.status === 'completed' || payment.status === 'refunded') {
      return new Response(JSON.stringify({ ok: true, alreadyProcessed: true }));
    }

    // 4. Update the payment
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        status: payload.status === 'paid' ? 'completed' : payload.status,
        provider_transaction_id: payload.providerTransactionId,
        paid_at: payload.status === 'paid' ? payload.paidAt ?? new Date().toISOString() : null,
      })
      .eq('id', payment.id);

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), { status: 500 });
    }

    // 5. Reconcile the invoice, if this payment is linked to one
    if (payment.invoice_id && payload.status === 'paid') {
      const { data: invoice } = await supabase
        .from('invoices')
        .select('id, amount')
        .eq('id', payment.invoice_id)
        .single();

      if (invoice) {
        const { data: paidPayments } = await supabase
          .from('payments')
          .select('amount')
          .eq('invoice_id', invoice.id)
          .eq('status', 'paid');

        const totalPaid = (paidPayments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);

        if (totalPaid >= Number(invoice.amount)) {
          await supabase.from('invoices').update({ status: 'paid' }).eq('id', invoice.id);
        }
      }
    }

    // 6. Notification hook point (Phase 8 — not built yet).
    // e.g. await notifyStaff(payment.parlor_id, payment.id, payload.status);

    return new Response(JSON.stringify({ ok: true }));
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
