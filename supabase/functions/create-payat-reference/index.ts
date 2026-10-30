// Creates a Pay@ Request-to-Pay (RTP) for a parlour and records it as a
// pending payment. Which Pay@ account and endpoint are used depends on the
// parlour's payat_mode — see _shared/payat.ts.

import { createClient } from 'npm:@supabase/supabase-js@2.45.4';
import {
  corsHeaders, errorResponse, generateClientAccountNumber, getCaller, json,
  payatFetch, PayAtError, resolveParlourPayAt,
} from '../_shared/payat.ts';

const DAYS_VALID = 2;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  let paymentId: string | undefined;

  try {
    const caller = await getCaller(req, supabase);

    const {
      parlorId, caseId, clientId, invoiceId, amount, description,
      customerNameSurname, customerMobileNumber, customerEmail,
    } = await req.json();

    if (
      typeof parlorId !== 'string' ||
      typeof description !== 'string' || !description.trim() ||
      typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0
    ) {
      throw new PayAtError('Valid parlorId, amount and description are required');
    }

    // Service-role access bypasses RLS, so check the caller belongs to
    // this parlour (or is a super admin) before acting on it.
    if (caller.role !== 'super_admin' && caller.parlorId !== parlorId) {
      throw new PayAtError('Not allowed to collect payments for this parlour', 403);
    }

    const amountInCents = Math.round(amount * 100);
    if (!Number.isSafeInteger(amountInCents) || amountInCents <= 0) {
      throw new PayAtError('Invalid payment amount');
    }

    const payat = await resolveParlourPayAt(supabase, parlorId);

    // Pay@ requires the customer's name; fall back to the client record so
    // Pay@ can also send the family the payment link by SMS/email.
    const contact = {
      name: (customerNameSurname as string | undefined)?.trim(),
      mobile: (customerMobileNumber as string | undefined)?.trim(),
      email: (customerEmail as string | undefined)?.trim(),
    };

    if (clientId && (!contact.name || !contact.mobile || !contact.email)) {
      const { data: client } = await supabase
        .from('clients')
        .select('name, phone, email')
        .eq('id', clientId)
        .eq('parlor_id', parlorId)
        .maybeSingle();
      if (client) {
        contact.name ||= client.name?.trim();
        contact.mobile ||= client.phone?.trim();
        contact.email ||= client.email?.trim();
      }
    }

    if (!contact.name) {
      throw new PayAtError("The customer's name is required for a Pay@ payment");
    }

    // Local record first, so the Pay@ request carries a stable LovedOne ID.
    const { data: payment, error: insertError } = await supabase
      .from('payments')
      .insert({
        parlor_id: parlorId,
        case_id: caseId || null,
        client_id: clientId || null,
        invoice_id: invoiceId || null,
        description: description.trim(),
        amount,
        method: 'pay_at',
        provider: 'pay_at',
        payat_mode: payat.mode,
        status: 'pending',
      })
      .select('id')
      .single();

    if (insertError || !payment) {
      throw new PayAtError('Could not create payment record', 500, insertError);
    }
    paymentId = payment.id as string;

    const clientReferenceNumber = `LO-${paymentId}`;
    const token = await payat.token('rtp:create:single');
    const trimmedDescription = description.trim().slice(0, 256);

    // Retry with a fresh account number if Pay@ reports a clash (409).
    let rtpResponse: Response | undefined;
    let accountNumber = '';
    for (let attempt = 0; attempt < 3; attempt++) {
      accountNumber = generateClientAccountNumber();
      rtpResponse = await payatFetch(payat.rtpCreateUrl, token, {
        method: 'POST',
        body: JSON.stringify({
          clientReferenceNumber,
          clientAccountNumber: accountNumber,
          description: trimmedDescription,
          customerNameSurname: contact.name,
          ...(contact.mobile ? { customerMobileNumber: contact.mobile } : {}),
          ...(contact.email ? { customerEmail: contact.email } : {}),
          amount: amountInCents,
          minimumAmount: amountInCents,
          maximumAmount: amountInCents,
          daysValid: DAYS_VALID,
          lineItems: [{ description: trimmedDescription, amount: amountInCents }],
        }),
      });
      if (rtpResponse.status !== 409) break;
    }

    if (!rtpResponse!.ok) {
      const providerError = (await rtpResponse!.text()).slice(0, 1000);
      console.error('Pay@ RTP creation failed:', { status: rtpResponse!.status, providerError, paymentId, mode: payat.mode });
      await supabase.from('payments').update({ status: 'failed' }).eq('id', paymentId);
      return json({
        error: 'Pay@ could not create the payment request',
        paymentId,
        providerStatus: rtpResponse!.status,
        providerError,
      }, 502);
    }

    const rtp = await rtpResponse!.json();
    if (!rtp.requestToPayId || !rtp.sourceReference) {
      console.error('Pay@ response missing expected fields:', { paymentId, keys: Object.keys(rtp) });
      await supabase.from('payments').update({ status: 'failed' }).eq('id', paymentId);
      return json({ error: 'Pay@ returned an incomplete payment response', paymentId }, 502);
    }

    const expiresAt = new Date(Date.now() + DAYS_VALID * 24 * 60 * 60 * 1000).toISOString();

    const { error: updateError } = await supabase
      .from('payments')
      .update({
        reference: rtp.sourceReference,
        payment_reference: rtp.sourceReference,
        provider_transaction_id: String(rtp.requestToPayId),
        transaction_id: String(rtp.requestToPayId),
        payment_link: rtp.paymentLink ?? null,
        payat_client_account_number: accountNumber,
        client_reference_number: clientReferenceNumber,
        expires_at: expiresAt,
      })
      .eq('id', paymentId);

    if (updateError) {
      // The RTP exists at Pay@ even though saving it here failed.
      console.error('Pay@ created RTP but saving its response failed:', { paymentId, updateError });
      return json({ error: 'Pay@ created the request, but saving its details failed', paymentId, recoveryRequired: true }, 500);
    }

    return json({
      paymentId,
      reference: rtp.sourceReference,
      paymentLink: rtp.paymentLink ?? null,
      providerTransactionId: String(rtp.requestToPayId),
      accountNumber,
      expiresAt,
      mode: payat.mode,
      status: 'pending',
    }, 201);
  } catch (err) {
    if (paymentId && !(err instanceof PayAtError && err.status < 500)) {
      await supabase.from('payments').update({ status: 'failed' }).eq('id', paymentId);
    }
    return errorResponse(err, 'create-payat-reference');
  }
});
