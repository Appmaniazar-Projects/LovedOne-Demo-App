
import { serve } from 'https://deno.land/std@0.203.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const PAYAT_BASE_URL = 'https://staging-go.payat.co.za/yapi/v1';
const PAYAT_TOKEN_URL = 'https://staging-go.payat.co.za/yapi/oauth/token';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function generateAccountNumber(prefix: string): string {
  const values = new Uint32Array(1);
  crypto.getRandomValues(values);

  const suffix = (values[0] % 1_000_000_000)
    .toString()
    .padStart(9, '0');

  return `${prefix}${suffix}`;
}

async function getPayAtToken(): Promise<string> {
  const clientId = Deno.env.get('PAYAT_CLIENT_ID');
  const clientSecret = Deno.env.get('PAYAT_CLIENT_SECRET');

  if (!clientId || !clientSecret) {
    throw new Error('Pay@ credentials are not configured');
  }

  const basic = btoa(`${clientId}:${clientSecret}`);

  const response = await fetch(PAYAT_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'rtp:read rtp:create:single',
    }),
  });

  if (!response.ok) {
    console.error('Pay@ OAuth failed with status:', response.status);
    throw new Error('Could not authenticate with Pay@');
  }

  const result = await response.json();

  if (!result.access_token) {
    throw new Error('Pay@ did not return an access token');
  }

  return result.access_token;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  let paymentId: string | undefined;

  try {
    const authHeader = req.headers.get('Authorization');

    if (!authHeader) {
      return json({ error: 'Authentication required' }, 401);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      throw new Error('Supabase environment is not configured');
    }

    // Verify the caller's identity before using service-role access.
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } =
      await userClient.auth.getUser();

    if (userError || !userData.user) {
      return json({ error: 'Invalid authentication' }, 401);
    }

    const {
      parlorId,
      caseId,
      clientId,
      amount,
      description,
      customerNameSurname,
      customerMobileNumber,
      customerEmail,
    } = await req.json();

    if (
      typeof parlorId !== 'string' ||
      typeof description !== 'string' ||
      !description.trim() ||
      typeof amount !== 'number' ||
      !Number.isFinite(amount) ||
      amount <= 0
    ) {
      return json({
        error: 'Valid parlorId, amount and description are required',
      }, 400);
    }

    const amountInCents = Math.round(amount * 100);

    if (
      !Number.isSafeInteger(amountInCents) ||
      amountInCents <= 0
    ) {
      return json({ error: 'Invalid payment amount' }, 400);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Read the parlor's Pay@ configuration.
    const { data: config, error: configError } = await supabase
      .from('payment_provider_config')
      .select('payat_prefix, enabled')
      .eq('parlor_id', parlorId)
      .eq('provider', 'pay_at')
      .single();

    if (configError || !config?.enabled) {
      return json({ error: 'Pay@ is not enabled for this parlour' }, 400);
    }

    const prefix = config.payat_prefix;

    if (!prefix || !/^\d{5}$/.test(prefix)) {
      return json({
        error: 'Parlour needs a valid 5-digit Pay@ prefix',
      }, 400);
    }

    // Create a local record first so the provider request can be linked
    // to a stable LovedOne payment ID.
    const { data: payment, error: insertError } = await supabase
      .from('payments')
      .insert({
        parlor_id: parlorId,
        case_id: caseId || null,
        client_id: clientId || null,
        description: description.trim(),
        amount,
        method: 'pay_at',
        provider: 'pay_at',
        status: 'pending',
      })
      .select('id')
      .single();

    if (insertError || !payment) {
      console.error('Payment insert failed:', insertError);
      return json({ error: 'Could not create payment record' }, 500);
    }

    paymentId = payment.id;

    const token = await getPayAtToken();
    const accountNumber = generateAccountNumber(prefix);
    const clientReferenceNumber = `LO-${payment.id}`;

    const rtpPayload: Record<string, unknown> = {
      clientReferenceNumber,
      clientAccountNumber: accountNumber,
      description: description.trim().slice(0, 256),
      amount: String(amountInCents),
      minimumAmount: String(amountInCents),
      maximumAmount: String(amountInCents),
      daysValid: 2,
      lineItems: [{
        description: description.trim().slice(0, 256),
        amount: String(amountInCents),
      }],
    };

    if (customerNameSurname) {
      rtpPayload.customerNameSurname = customerNameSurname;
    }
    if (customerMobileNumber) {
      rtpPayload.customerMobileNumber = customerMobileNumber;
    }
    if (customerEmail) {
      rtpPayload.customerEmail = customerEmail;
    }

    const rtpResponse = await fetch(
      `${PAYAT_BASE_URL}/merchant/rtp/create/single`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'X-API-VERSION': '1.3.0',
        },
        body: JSON.stringify(rtpPayload),
      },
    );

    if (!rtpResponse.ok) {
      const providerError = await rtpResponse.text();

      // Log the provider status, not credentials or tokens.
      console.error('Pay@ RTP creation failed:', {
        status: rtpResponse.status,
        response: providerError.slice(0, 1000),
        paymentId,
      });

      await supabase
        .from('payments')
        .update({ status: 'failed' })
        .eq('id', paymentId);

      return json({
        error: 'Pay@ could not create the payment request',
        paymentId,
        providerStatus: rtpResponse.status,
      }, 502);
    }

    const rtp = await rtpResponse.json();

    if (!rtp.requestToPayId || !rtp.sourceReference || !rtp.paymentLink) {
      console.error('Pay@ response missing expected fields:', {
        paymentId,
        responseKeys: Object.keys(rtp),
      });

      await supabase
        .from('payments')
        .update({ status: 'failed' })
        .eq('id', paymentId);

      return json({
        error: 'Pay@ returned an incomplete payment response',
        paymentId,
      }, 502);
    }

    const expiresAt = new Date(
      Date.now() + 2 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const { error: updateError } = await supabase
      .from('payments')
      .update({
        reference: rtp.sourceReference,
        provider_transaction_id: String(rtp.requestToPayId),
        transaction_id: String(rtp.requestToPayId),
        payment_link: rtp.paymentLink,
        payat_client_account_number: accountNumber,
        expires_at: expiresAt,
        status: 'pending',
      })
      .eq('id', paymentId);

    if (updateError) {
      // The provider request may exist even if this database update fails.
      console.error('Pay@ created RTP but saving its response failed:', {
        paymentId,
        error: updateError,
      });

      return json({
        error: 'Pay@ created the request, but saving its details failed',
        paymentId,
        recoveryRequired: true,
      }, 500);
    }

    return json({
      paymentId,
      reference: rtp.sourceReference,
      paymentLink: rtp.paymentLink,
      providerTransactionId: String(rtp.requestToPayId),
      accountNumber,
      expiresAt,
      status: 'pending',
    }, 201);
  } catch (error) {
    console.error('create-payat-reference error:', error);

    return json({
      error: 'Unexpected error creating Pay@ payment',
      paymentId: paymentId ?? null,
    }, 500);
  }
});
