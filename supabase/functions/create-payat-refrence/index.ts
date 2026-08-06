// supabase/functions/create-payat-reference/index.ts
//
// Generates a Pay@ account reference for a parlour and creates the
// corresponding pending payment row. Reference generation MUST stay
// server-side — see "Technical approach" in the Pay@ integration doc:
// "Generate references server-side only and validate numeric-only /
// 36-character rules."

import { serve } from 'https://deno.land/std@0.203.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const PAYAT_MAX_LENGTH = 36;

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { parlorId, caseId, clientId, amount, description } = await req.json();

    if (!parlorId || !amount || !description) {
      return new Response(JSON.stringify({ error: 'parlorId, amount and description are required' }), { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // 1. Look up the parlour's Pay@ prefix (assigned when they onboarded directly with Pay@).
    const { data: providerConfig, error: configError } = await supabase
      .from('payment_provider_config')
      .select('payat_prefix, enabled')
      .eq('parlor_id', parlorId)
      .eq('provider', 'pay_at')
      .single();

    if (configError || !providerConfig?.enabled) {
      return new Response(JSON.stringify({ error: 'Pay@ is not enabled for this parlour' }), { status: 400 });
    }

    const prefix = providerConfig.payat_prefix as string | undefined;
    if (!prefix || !/^\d{5}$/.test(prefix)) {
      return new Response(JSON.stringify({ error: 'Parlour is missing a valid 5-digit Pay@ prefix' }), { status: 500 });
    }

    // 2. Build a numeric-only reference: prefix + unique numeric suffix, capped at 36 chars.
    const suffix = generateNumericSuffix(PAYAT_MAX_LENGTH - prefix.length);
    const reference = `${prefix}${suffix}`;

    // TODO: confirm with Pay@ whether references expire, and if so the
    // default/expected TTL — this is one of the open questions in the doc
    // ("Can a reference be cancelled, regenerated, or given an expiry date?").
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    // 3. Create the pending payment row.
    const { data: payment, error: insertError } = await supabase
      .from('payments')
      .insert({
        parlor_id: parlorId,
        case_id: caseId || null,
        client_id: clientId || null,
        description,
        amount,
        method: 'pay_at',
        provider: 'pay_at',
        status: 'pending',
        reference: reference,
        expires_at: expiresAt,
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Failed to insert Pay@ payment', insertError);
      return new Response(JSON.stringify({ error: 'Failed to create payment' }), { status: 500 });
    }

    return new Response(
      JSON.stringify({ paymentId: payment.id, reference, expiresAt }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('create-payat-reference error', err);
    return new Response(JSON.stringify({ error: 'Unexpected error' }), { status: 500 });
  }
});

function generateNumericSuffix(maxLength: number): string {
  const timestampPart = Date.now().toString().slice(-10);
  const randomPart = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${timestampPart}${randomPart}`.slice(0, maxLength);
}