// Shared Pay@ helpers for the edge functions.
//
// Everything that differs between parlours (which credentials, which
// endpoint, where the money goes) is resolved here from the parlour's
// payment_provider_config row, so create-payat-reference and payat-admin
// don't care which mode a parlour is in.

// deno-lint-ignore-file no-explicit-any
type SupabaseClient = any;

export type PayAtMode = 'platform' | 'merchant' | 'integrator';

// Defaults to staging. Set PAYAT_BASE_URL / PAYAT_TOKEN_URL as function
// secrets to point at production at go-live.
export const PAYAT_BASE_URL =
  Deno.env.get('PAYAT_BASE_URL') ?? 'https://staging-go.payat.co.za/yapi/v1';
export const PAYAT_TOKEN_URL =
  Deno.env.get('PAYAT_TOKEN_URL') ?? 'https://staging-go.payat.co.za/yapi/oauth/token';
export const PAYAT_API_VERSION = '1.4.0';

// Header Pay@ sends on each payment notification. Configure the webhook in
// Pay@Go with auth type "API key", this header name, and the key LovedOne
// generated for that account.
export const WEBHOOK_KEY_HEADER = 'x-lovedone-webhook-key';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export class PayAtError extends Error {
  constructor(message: string, public status = 400, public detail?: unknown) {
    super(message);
  }
}

// ── Crypto ────────────────────────────────────────────────────────────

function b64encode(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

function b64decode(s: string): Uint8Array<ArrayBuffer> {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}

function credentialsKey(): Promise<CryptoKey> {
  const raw = Deno.env.get('PAYAT_CREDENTIALS_KEY');
  if (!raw) throw new PayAtError('PAYAT_CREDENTIALS_KEY is not configured', 500);
  const bytes = b64decode(raw);
  if (bytes.length !== 32) {
    throw new PayAtError('PAYAT_CREDENTIALS_KEY must be 32 bytes, base64-encoded', 500);
  }
  return crypto.subtle.importKey('raw', bytes, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

// AES-256-GCM. Output is base64(iv || ciphertext+tag).
export async function encryptSecret(plain: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await credentialsKey(), new TextEncoder().encode(plain)),
  );
  const out = new Uint8Array(iv.length + ct.length);
  out.set(iv);
  out.set(ct, iv.length);
  return b64encode(out);
}

export async function decryptSecret(enc: string): Promise<string> {
  const bytes = b64decode(enc);
  const pt = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: bytes.slice(0, 12) },
    await credentialsKey(),
    bytes.slice(12),
  );
  return new TextDecoder().decode(pt);
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function timingSafeEqual(a: string, b: string): boolean {
  const ab = new TextEncoder().encode(a);
  const bb = new TextEncoder().encode(b);
  let diff = ab.length ^ bb.length;
  for (let i = 0; i < Math.max(ab.length, bb.length); i++) diff |= (ab[i] ?? 0) ^ (bb[i] ?? 0);
  return diff === 0;
}

export function randomToken(bytes = 32): string {
  return b64encode(crypto.getRandomValues(new Uint8Array(bytes)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// 12-digit RTP account number. Pay@ allows 1–14 digits and prepends the
// merchant's own prefix to form the payable sourceReference.
export function generateClientAccountNumber(): string {
  const v = crypto.getRandomValues(new Uint32Array(2));
  const n = (BigInt(v[0]) << 32n | BigInt(v[1])) % 1_000_000_000_000n;
  return n.toString().padStart(12, '0');
}

// ── OAuth ─────────────────────────────────────────────────────────────

// Tokens last an hour. Cache per client+scope for the life of a warm
// function instance so each payment doesn't cost an extra round trip.
const tokenCache = new Map<string, { token: string; expiresAt: number }>();

export async function getToken(clientId: string, clientSecret: string, scope: string): Promise<string> {
  const cacheKey = `${clientId}|${scope}`;
  const cached = tokenCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;

  const res = await fetch(PAYAT_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({ grant_type: 'client_credentials', scope }),
  });

  if (!res.ok) {
    console.error('Pay@ OAuth failed with status:', res.status);
    throw new PayAtError(
      res.status === 401
        ? 'Pay@ rejected the client ID or secret'
        : `Pay@ refused the token request (HTTP ${res.status}) — the credentials may not have the "${scope}" permission`,
      502,
    );
  }

  const data = await res.json();
  if (!data.access_token) throw new PayAtError('Pay@ did not return an access token', 502);

  tokenCache.set(cacheKey, {
    token: data.access_token,
    expiresAt: Date.now() + (Number(data.expires_in) || 3600) * 1000,
  });
  return data.access_token;
}

// ── Per-parlour resolution ───────────────────────────────────────────

export interface ParlourPayAt {
  mode: PayAtMode;
  config: Record<string, any>;
  // Fetches a bearer token with the given scope using the right credentials.
  token: (scope: string) => Promise<string>;
  rtpCreateUrl: string;
}

function platformCredentials(prefix: 'CLIENT' | 'INTEGRATOR_CLIENT') {
  const id = Deno.env.get(`PAYAT_${prefix}_ID`);
  const secret = Deno.env.get(`PAYAT_${prefix}_SECRET`);
  if (!id || !secret) {
    throw new PayAtError(`PAYAT_${prefix}_ID / PAYAT_${prefix}_SECRET function secrets are not configured`, 500);
  }
  return { id, secret };
}

export async function loadParlourConfig(supabase: SupabaseClient, parlorId: string) {
  const { data, error } = await supabase
    .from('payment_provider_config')
    .select('*')
    .eq('parlor_id', parlorId)
    .eq('provider', 'pay_at')
    .maybeSingle();
  if (error) throw new PayAtError('Could not load Pay@ configuration', 500, error);
  return data;
}

export async function loadMerchantCredentials(supabase: SupabaseClient, parlorId: string) {
  const { data, error } = await supabase
    .from('payment_provider_credentials')
    .select('client_id, client_secret_enc')
    .eq('parlor_id', parlorId)
    .eq('provider', 'pay_at')
    .maybeSingle();
  if (error) throw new PayAtError('Could not load Pay@ credentials', 500, error);
  if (!data) throw new PayAtError('This parlour has no Pay@ credentials saved', 400);
  return { id: data.client_id as string, secret: await decryptSecret(data.client_secret_enc) };
}

// Resolves how to talk to Pay@ for a parlour. With requireEnabled, only
// returns for parlours whose onboarding is complete.
export async function resolveParlourPayAt(
  supabase: SupabaseClient,
  parlorId: string,
  { requireEnabled = true } = {},
): Promise<ParlourPayAt> {
  const config = await loadParlourConfig(supabase, parlorId);
  if (!config) throw new PayAtError('Pay@ is not set up for this parlour', 400);
  if (requireEnabled && (!config.enabled || config.onboarding_status !== 'approved')) {
    throw new PayAtError('Pay@ is not enabled for this parlour yet', 400);
  }

  const mode = config.payat_mode as PayAtMode;

  if (mode === 'merchant') {
    const creds = await loadMerchantCredentials(supabase, parlorId);
    return {
      mode, config,
      token: (scope) => getToken(creds.id, creds.secret, scope),
      rtpCreateUrl: `${PAYAT_BASE_URL}/merchant/rtp/create/single`,
    };
  }

  if (mode === 'integrator') {
    if (!config.payat_merchant_identifier) {
      throw new PayAtError('This parlour has no Pay@ merchant identifier yet', 400);
    }
    const creds = platformCredentials('INTEGRATOR_CLIENT');
    return {
      mode, config,
      token: (scope) => getToken(creds.id, creds.secret, scope),
      rtpCreateUrl: `${PAYAT_BASE_URL}/integrator/rtp/create/single/${encodeURIComponent(config.payat_merchant_identifier)}`,
    };
  }

  // platform (testing)
  const creds = platformCredentials('CLIENT');
  return {
    mode: 'platform', config,
    token: (scope) => getToken(creds.id, creds.secret, scope),
    rtpCreateUrl: `${PAYAT_BASE_URL}/merchant/rtp/create/single`,
  };
}

export function payatFetch(url: string, token: string, init: RequestInit = {}) {
  return fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-API-VERSION': PAYAT_API_VERSION,
      ...(init.headers ?? {}),
    },
  });
}

// ── Caller auth ───────────────────────────────────────────────────────

// Verifies the Supabase JWT and returns the caller's role and parlour.
export async function getCaller(req: Request, admin: SupabaseClient) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) throw new PayAtError('Authentication required', 401);

  const { data, error } = await admin.auth.getUser(authHeader.replace(/^Bearer\s+/i, ''));
  if (error || !data?.user) throw new PayAtError('Invalid authentication', 401);

  const { data: profile } = await admin
    .from('users')
    .select('role, parlor_id')
    .eq('id', data.user.id)
    .maybeSingle();
  if (!profile) throw new PayAtError('No LovedOne user profile for this login', 403);

  return { userId: data.user.id as string, role: profile.role as string, parlorId: profile.parlor_id as string | null };
}

export function errorResponse(err: unknown, context: string) {
  if (err instanceof PayAtError) {
    if (err.status >= 500) console.error(`${context}:`, err.message, err.detail ?? '');
    return json({ error: err.message }, err.status);
  }
  console.error(`${context}:`, err);
  return json({ error: 'Unexpected error' }, 500);
}
