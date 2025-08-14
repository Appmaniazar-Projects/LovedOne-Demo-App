// import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
// import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.0.0'
// import { corsHeaders } from '../_shared/cors.ts'

// // The structure of the webhook payload from Easypay
// interface EasypayWebhookPayload {
//   id: string; // This is the Easypay transaction ID
//   type: 'authorisation' | 'capture' | 'refund';
//   status: 'success' | 'failure';
//   // ... other properties may exist
// }

// serve(async (req) => {
//   // This is needed for CORS preflight requests.
//   if (req.method === 'OPTIONS') {
//     return new Response('ok', { headers: corsHeaders })
//   }

//   try {
//     // 1. Verify the request is from Easypay (CRITICAL)
//     // You must get a "Webhook Secret" from your Easypay dashboard.
//     // This secret is used to generate a signature that Easypay sends in the headers.
//     // You must verify this signature to ensure the request is authentic.
//     // Example header: `X-Easypay-Signature: <signature>`
//     const signature = req.headers.get('X-Easypay-Signature');
//     const webhookSecret = Deno.env.get('EASYPAY_WEBHOOK_SECRET');

//     // In a real implementation, you would use a library like `crypto` to
//     // create an HMAC hash of the request body using the secret, and then
//     // compare it to the signature from the header. This is a placeholder.
//     if (!signature || !webhookSecret) { // This check is a placeholder for real verification
//       console.warn('Missing signature or webhook secret. Cannot verify webhook authenticity.');
//       // For now, we'll proceed, but in production, you should return a 401 Unauthorized error.
//       // return new Response('Signature verification failed.', { status: 401 })
//     }

//     // 2. Parse the payload
//     const payload: EasypayWebhookPayload = await req.json();
//     console.log(`Received webhook for transaction ${payload.id} with status ${payload.status}`);

//     // 3. Update the database
//     const supabaseClient = createClient(
//       Deno.env.get('SUPABASE_URL') ?? '',
//       Deno.env.get('SUPABASE_ANON_KEY') ?? '',
//       { global: { headers: { Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` } } }
//     );

//     // Map Easypay status to our application's status
//     const newStatus = payload.status === 'success' ? 'completed' : 'failed';

//     const { data, error } = await supabaseClient
//       .from('payments')
//       .update({ status: newStatus, updated_at: new Date().toISOString() })
//       .eq('transaction_id', payload.id) // Match the payment by its transaction ID
//       .select()
//       .single();

//     if (error) {
//       console.error('Error updating payment status:', error);
//       throw error;
//     }

//     console.log(`Successfully updated payment ${data.id} to status: ${newStatus}`);

//     // 4. Respond to Easypay
//     return new Response(JSON.stringify({ received: true }), {
//       headers: { ...corsHeaders, 'Content-Type': 'application/json' },
//       status: 200,
//     });

//   } catch (err) {
//     console.error('Webhook processing error:', err.message);
//     return new Response(String(err?.message ?? err), {
//       headers: { ...corsHeaders, 'Content-Type': 'application/json' },
//       status: 400,
//     });
//   }
// });
