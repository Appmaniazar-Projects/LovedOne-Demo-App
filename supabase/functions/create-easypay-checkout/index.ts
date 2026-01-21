import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.7';

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type RequestBody = {
  amount?: number;
  description?: string;
  parlorId?: string;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
    });
  }

  try {
    const accountId = Deno.env.get('EASYPAY_ACCOUNT_ID');
    const apiKey = Deno.env.get('EASYPAY_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const env = (Deno.env.get('EASYPAY_ENV') ?? 'test').toLowerCase();
    const currency = (Deno.env.get('EASYPAY_CURRENCY') ?? 'EUR').toUpperCase();

    if (!accountId || !apiKey) {
      return new Response(
        JSON.stringify({
          error: 'Missing EasyPay credentials. Set EASYPAY_ACCOUNT_ID and EASYPAY_API_KEY in Supabase Function secrets.',
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(JSON.stringify({ error: 'Missing Supabase configuration' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = (await req.json()) as RequestBody;
    const amount = body?.amount;
    const description = body?.description ?? 'Payment';
    const parlorId = body?.parlorId;

    if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) {
      return new Response(JSON.stringify({ error: 'Invalid amount' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!parlorId) {
      return new Response(JSON.stringify({ error: 'Missing parlorId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const baseUrl = env === 'prod' || env === 'production' ? 'https://api.prod.easypay.pt' : 'https://api.test.easypay.pt';

    const orderKey = crypto.randomUUID();
    const transactionKey = orderKey;

    const authHeader = req.headers.get('authorization') ?? undefined;
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: authHeader ? { Authorization: authHeader } : {},
      },
    });

    const { error: paymentInsertError } = await supabaseClient
      .from('payments')
      .insert({
        amount: Math.round(amount * 100) / 100,
        description,
        method: 'easypay',
        status: 'pending',
        transaction_id: orderKey,
        case_id: null,
        parlor_id: parlorId,
      });

    if (paymentInsertError) {
      return new Response(
        JSON.stringify({
          error: 'Failed to create payment record',
          details: paymentInsertError,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    const payload = {
      type: ['single'],
      payment: {
        methods: ['cc'],
        type: 'sale',
        capture: {
          transaction_key: transactionKey,
          descriptive: description.slice(0, 255),
        },
        currency,
        expiration_time: null,
      },
      order: {
        items: [
          {
            description: description.slice(0, 255),
            quantity: 1,
            key: 'payment',
            value: Math.round(amount * 100) / 100,
          },
        ],
        key: orderKey,
        value: Math.round(amount * 100) / 100,
      },
    };

    const easypayRes = await fetch(`${baseUrl}/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        AccountId: accountId,
        ApiKey: apiKey,
      },
      body: JSON.stringify(payload),
    });

    const text = await easypayRes.text();
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    if (!easypayRes.ok) {
      await supabaseClient
        .from('payments')
        .update({ status: 'failed' })
        .eq('transaction_id', orderKey);

      return new Response(
        JSON.stringify({
          error: 'Failed to create EasyPay checkout session',
          status: easypayRes.status,
          details: data,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        },
      );
    }

    return new Response(JSON.stringify({ ...(data as Record<string, unknown>), transaction_id: orderKey }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err?.message ?? err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
