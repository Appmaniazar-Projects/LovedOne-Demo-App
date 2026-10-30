// Super-admin actions for connecting a parlour to Pay@.
//
// POST { action, parlorId, ... }
//   save_credentials      { clientId, clientSecret } — tests them with Pay@,
//                         then stores the secret encrypted (merchant mode)
//   clear_credentials     — removes the parlour's stored credentials
//   test_connection       — fetches a Pay@ token with the parlour's setup
//   generate_webhook_key  — merchant mode: new webhook API key, shown once
//   webhook_details       — the URL/header to configure in Pay@Go
//   generate_signup_link  { merchantIdentifier? } — integrator mode
//
// Secrets never come back to the browser: the client secret is write-only
// and only a hash of each webhook key is kept.

import { createClient } from 'npm:@supabase/supabase-js@2.45.4';
import {
  corsHeaders, encryptSecret, errorResponse, getCaller, getToken, json,
  loadParlourConfig, PAYAT_BASE_URL, payatFetch, PayAtError, randomToken,
  resolveParlourPayAt, sha256Hex, WEBHOOK_KEY_HEADER,
} from '../_shared/payat.ts';

const MERCHANT_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{2,63}$/;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  try {
    const caller = await getCaller(req, supabase);
    if (caller.role !== 'super_admin') throw new PayAtError('Super admins only', 403);

    const body = await req.json();
    const { action, parlorId } = body ?? {};
    if (typeof parlorId !== 'string' || !parlorId) throw new PayAtError('parlorId is required');

    // Update the parlour's config row, creating it if needed. Not an
    // upsert: Postgres checks constraints against the would-be new row
    // (all defaults) before falling back to the update, which trips the
    // readiness check on partial patches.
    const ensureConfig = async (patch: Record<string, unknown> = {}) => {
      const { data: updated, error } = await supabase
        .from('payment_provider_config')
        .update(patch)
        .eq('parlor_id', parlorId)
        .select('id');
      if (error) throw new PayAtError('Could not save Pay@ configuration', 500, error);
      if (updated && updated.length > 0) return;

      const { error: insertError } = await supabase
        .from('payment_provider_config')
        .insert({ parlor_id: parlorId, provider: 'pay_at', ...patch });
      if (insertError) throw new PayAtError('Could not save Pay@ configuration', 500, insertError);
    };

    // Recompute `enabled` after the server changes something it depends on.
    // Same rule as the payment_provider_config_ready_check constraint.
    const syncEnabled = async () => {
      const c = await loadParlourConfig(supabase, parlorId);
      if (!c) return;
      const ready = c.onboarding_status === 'approved' && (
        c.payat_mode === 'platform' ||
        (c.payat_mode === 'merchant' && c.credentials_configured) ||
        (c.payat_mode === 'integrator' && !!c.payat_merchant_identifier)
      );
      if (ready !== c.enabled) await ensureConfig({ enabled: ready });
    };

    const webhookUrl = `${supabaseUrl}/functions/v1/payat-callback`;

    switch (action) {
      case 'save_credentials': {
        const clientId = String(body.clientId ?? '').trim();
        const clientSecret = String(body.clientSecret ?? '').trim();
        if (!clientId || !clientSecret) throw new PayAtError('Client ID and secret are both required');

        // Prove they work before storing anything.
        await getToken(clientId, clientSecret, 'rtp:create:single');

        const { error } = await supabase.from('payment_provider_credentials').upsert({
          parlor_id: parlorId,
          provider: 'pay_at',
          client_id: clientId,
          client_secret_enc: await encryptSecret(clientSecret),
        }, { onConflict: 'parlor_id,provider' });
        if (error) throw new PayAtError('Could not store credentials', 500, error);

        await ensureConfig({
          payat_mode: 'merchant',
          credentials_configured: true,
          credentials_verified_at: new Date().toISOString(),
        });
        await syncEnabled();
        return json({ ok: true, message: 'Pay@ accepted these credentials and they are saved.' });
      }

      case 'clear_credentials': {
        await supabase.from('payment_provider_credentials').delete().eq('parlor_id', parlorId).eq('provider', 'pay_at');
        await ensureConfig({ credentials_configured: false, credentials_verified_at: null, enabled: false });
        return json({ ok: true });
      }

      case 'test_connection': {
        const payat = await resolveParlourPayAt(supabase, parlorId, { requireEnabled: false });
        await payat.token('rtp:create:single');
        if (payat.mode === 'merchant') {
          await ensureConfig({ credentials_verified_at: new Date().toISOString() });
        }
        return json({ ok: true, mode: payat.mode, message: `Connected to Pay@ (${payat.mode} mode).` });
      }

      case 'generate_webhook_key': {
        const config = await loadParlourConfig(supabase, parlorId);
        if (config?.payat_mode !== 'merchant') {
          throw new PayAtError(
            'Only parlours with their own Pay@ account get their own webhook key. ' +
            "LovedOne's account uses the PAYAT_PLATFORM_WEBHOOK_KEY secret.",
          );
        }
        const key = randomToken();
        await ensureConfig({
          webhook_key_hash: await sha256Hex(key),
          webhook_key_created_at: new Date().toISOString(),
        });
        return json({
          ok: true,
          webhook: { url: webhookUrl, authType: 'API_KEY', headerName: WEBHOOK_KEY_HEADER, apiKey: key },
          message: "Copy this key now — it won't be shown again.",
        });
      }

      case 'webhook_details': {
        return json({ ok: true, webhook: { url: webhookUrl, authType: 'API_KEY', headerName: WEBHOOK_KEY_HEADER } });
      }

      case 'generate_signup_link': {
        const config = await loadParlourConfig(supabase, parlorId);
        if (config?.payat_mode !== 'integrator') {
          throw new PayAtError('Switch this parlour to integrator mode before generating a sign-up link');
        }

        const merchantIdentifier = String(
          body.merchantIdentifier ?? config.payat_merchant_identifier ?? `lovedone-${parlorId.slice(0, 8)}`,
        ).trim();
        if (!MERCHANT_ID_PATTERN.test(merchantIdentifier)) {
          throw new PayAtError('Merchant identifier: 3–64 letters, numbers, - or _');
        }

        const id = Deno.env.get('PAYAT_INTEGRATOR_CLIENT_ID');
        const secret = Deno.env.get('PAYAT_INTEGRATOR_CLIENT_SECRET');
        if (!id || !secret) {
          throw new PayAtError('Integrator credentials are not configured yet (PAYAT_INTEGRATOR_CLIENT_ID / _SECRET)', 500);
        }
        const token = await getToken(id, secret, 'signup:write');

        const { data: parlour } = await supabase.from('parlors').select('*').eq('id', parlorId).maybeSingle();
        const prefill: Record<string, string> = {};
        if (parlour?.name) prefill.businessName = parlour.name;
        if (parlour?.email) prefill.contactEmail = parlour.email;

        const res = await payatFetch(
          `${PAYAT_BASE_URL}/integrator/generate-merchant-signup-link/${encodeURIComponent(merchantIdentifier)}`,
          token,
          { method: 'POST', body: JSON.stringify(prefill) },
        );

        if (res.status === 409) {
          throw new PayAtError('That merchant identifier is already registered at Pay@ — a new link can’t be generated for it', 409);
        }
        if (!res.ok) {
          const detail = (await res.text()).slice(0, 500);
          throw new PayAtError(`Pay@ could not generate a sign-up link (HTTP ${res.status})`, 502, detail);
        }

        const result = await res.json();
        await ensureConfig({ payat_merchant_identifier: merchantIdentifier, onboarding_status: 'link_sent', enabled: false });
        return json({ ok: true, merchantIdentifier, signUpUrl: result.signUpUrl });
      }

      default:
        throw new PayAtError('Unknown action');
    }
  } catch (err) {
    return errorResponse(err, 'payat-admin');
  }
});
