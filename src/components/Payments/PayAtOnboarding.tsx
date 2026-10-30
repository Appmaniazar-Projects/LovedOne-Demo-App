import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Loader2, ShieldCheck, Copy, Save, KeyRound, PlugZap, Link2, AlertTriangle } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useOutletContext } from 'react-router-dom';
import { payatAdmin } from './payatAdmin';
import type { PayatMode, PayatOnboardingStatus } from '../../types/payments';

// Super-admin screen for connecting one parlour to Pay@. Each parlour picks
// how its payments are collected (see PAYAT_MODES). Secrets are handled by
// the payat-admin edge function and never read back into the browser.

interface ProviderConfigRow {
  id: string;
  parlor_id: string;
  provider: 'pay_at';
  payat_mode: PayatMode;
  payat_merchant_identifier: string | null;
  onboarding_status: PayatOnboardingStatus;
  onboarding_notes: string | null;
  enabled: boolean;
  credentials_configured: boolean;
  credentials_verified_at: string | null;
  webhook_key_created_at: string | null;
}

const CONFIG_COLUMNS =
  'id, parlor_id, provider, payat_mode, payat_merchant_identifier, onboarding_status, onboarding_notes, enabled, credentials_configured, credentials_verified_at, webhook_key_created_at';

const PAYAT_MODES: Record<PayatMode, { label: string; description: string }> = {
  merchant: {
    label: "Parlour's own Pay@ account",
    description:
      "The parlour signs up for Pay@Go itself and gives you its API client ID and secret. Payments settle straight to the parlour's bank account.",
  },
  integrator: {
    label: 'Through LovedOne (integrator)',
    description:
      "LovedOne sends the parlour a Pay@ sign-up link and creates payment requests on its behalf. Needs integrator access from Pay@, which isn't enabled yet.",
  },
  platform: {
    label: "LovedOne's test account",
    description:
      "Uses LovedOne's own Pay@ credentials. For testing only: every payment settles to LovedOne's bank account, not the parlour's.",
  },
};

const STATUS_LABELS: Record<PayatOnboardingStatus, string> = {
  not_started: 'Not started',
  link_sent: 'Sign-up link sent',
  kyc_pending: 'KYC pending with Pay@',
  approved: 'Approved',
};
const STATUS_ORDER: PayatOnboardingStatus[] = ['not_started', 'link_sent', 'kyc_pending', 'approved'];
const statusColors: Record<PayatOnboardingStatus, string> = {
  not_started: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300',
  link_sent: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400',
  kyc_pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400',
  approved: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400',
};

const inputClass =
  'w-full px-3 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-900 dark:text-white';
const labelClass = 'block text-sm font-medium text-slate-900 dark:text-white mb-1';
const secondaryButton =
  'px-3 py-2 border border-slate-300 dark:border-gray-600 rounded-lg text-sm text-slate-800 dark:text-gray-100 flex items-center gap-2 disabled:opacity-50';
const primaryButton = 'px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 disabled:opacity-50';

interface WebhookDetails {
  url: string;
  authType: string;
  headerName: string;
  apiKey?: string;
}

// Whether a parlour in this state can be switched on. Mirrors the
// payment_provider_config_ready_check constraint in the database.
function canEnable(c: Pick<ProviderConfigRow, 'onboarding_status' | 'payat_mode' | 'credentials_configured' | 'payat_merchant_identifier'>) {
  if (c.onboarding_status !== 'approved') return false;
  if (c.payat_mode === 'merchant') return c.credentials_configured;
  if (c.payat_mode === 'integrator') return !!c.payat_merchant_identifier;
  return true;
}

const copy = (value: string, what: string) => {
  navigator.clipboard.writeText(value);
  toast.success(`${what} copied.`);
};

const PayAtOnboarding: React.FC = () => {
  const outlet = useOutletContext<{ parlorId: string; parlorName: string }>();
  const parlorId = outlet?.parlorId || '';
  const parlorName = outlet?.parlorName || 'this parlour';

  const [checkingRole, setCheckingRole] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const [config, setConfig] = useState<ProviderConfigRow | null>(null);
  const [mode, setMode] = useState<PayatMode>('platform');
  const [notes, setNotes] = useState('');
  const [merchantIdentifier, setMerchantIdentifier] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [webhook, setWebhook] = useState<WebhookDetails | null>(null);
  const [signUpUrl, setSignUpUrl] = useState<string | null>(null);

  useEffect(() => {
    const checkRole = async () => {
      try {
        const { data: userRes } = await supabase.auth.getUser();
        const userId = userRes?.user?.id;
        if (!userId) return setIsSuperAdmin(false);
        const { data, error } = await supabase.from('users').select('role').eq('id', userId).single();
        if (error) throw error;
        setIsSuperAdmin(data?.role === 'super_admin');
      } catch (err) {
        console.error('Failed to resolve user role:', err);
        setIsSuperAdmin(false);
      } finally {
        setCheckingRole(false);
      }
    };
    checkRole();
  }, []);

  const fetchConfig = async () => {
    if (!parlorId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('payment_provider_config')
      .select(CONFIG_COLUMNS)
      .eq('parlor_id', parlorId)
      .eq('provider', 'pay_at')
      .maybeSingle();

    if (error) {
      console.error('Failed to fetch payment_provider_config:', error);
      toast.error('Failed to load Pay@ settings.');
    } else {
      const row = (data as ProviderConfigRow | null) ?? null;
      setConfig(row);
      setMode(row?.payat_mode ?? 'platform');
      setNotes(row?.onboarding_notes ?? '');
      setMerchantIdentifier(row?.payat_merchant_identifier ?? '');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isSuperAdmin && parlorId) fetchConfig();
    setWebhook(null);
    setSignUpUrl(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuperAdmin, parlorId]);

  // Browser-writable fields only. Credential and webhook flags are owned by
  // the payat-admin function (and column grants enforce that).
  const saveConfig = async (patch: Partial<ProviderConfigRow>, successMessage = 'Saved.') => {
    const next = {
      onboarding_status: config?.onboarding_status ?? 'not_started',
      payat_mode: config?.payat_mode ?? mode,
      payat_merchant_identifier: config?.payat_merchant_identifier ?? null,
      credentials_configured: config?.credentials_configured ?? false,
      ...patch,
    };
    const enabled = canEnable(next as ProviderConfigRow);

    setBusy('save');
    try {
      const fields = {
        payat_mode: next.payat_mode,
        payat_merchant_identifier: next.payat_merchant_identifier,
        onboarding_status: next.onboarding_status,
        onboarding_notes: patch.onboarding_notes ?? config?.onboarding_notes ?? null,
        enabled,
      };
      // Update when the row exists rather than upsert: Postgres checks the
      // readiness constraint against the would-be new row first, which
      // fails for parlours whose credentials were saved server-side.
      const { error } = config
        ? await supabase.from('payment_provider_config').update(fields).eq('id', config.id)
        : await supabase.from('payment_provider_config').insert({ parlor_id: parlorId, provider: 'pay_at', ...fields });
      if (error) throw error;
      toast.success(successMessage);
      await fetchConfig();
    } catch (err: any) {
      console.error('Failed to save payment_provider_config:', err);
      toast.error(err?.message || 'Failed to save.');
    } finally {
      setBusy(null);
    }
  };

  const runAction = async <T,>(key: string, fn: () => Promise<T>): Promise<T | undefined> => {
    setBusy(key);
    try {
      return await fn();
    } catch (err: any) {
      toast.error(err?.message || 'Something went wrong.');
      return undefined;
    } finally {
      setBusy(null);
    }
  };

  const handleModeChange = (next: PayatMode) => {
    setMode(next);
    setWebhook(null);
    setSignUpUrl(null);
    saveConfig({ payat_mode: next }, `Switched to: ${PAYAT_MODES[next].label}.`);
  };

  const handleSaveCredentials = async () => {
    const res = await runAction('credentials', () =>
      payatAdmin<{ message: string }>('save_credentials', parlorId, { clientId, clientSecret }),
    );
    if (res) {
      toast.success(res.message);
      setClientSecret('');
      await fetchConfig();
    }
  };

  const handleClearCredentials = async () => {
    const res = await runAction('clear', () => payatAdmin('clear_credentials', parlorId));
    if (res) {
      toast.success('Credentials removed. Pay@ is now off for this parlour.');
      await fetchConfig();
    }
  };

  const handleTest = async () => {
    const res = await runAction('test', () => payatAdmin<{ message: string }>('test_connection', parlorId));
    if (res) toast.success(res.message);
  };

  const handleWebhookKey = async () => {
    const res = await runAction('webhook', () => payatAdmin<{ webhook: WebhookDetails }>('generate_webhook_key', parlorId));
    if (res) {
      setWebhook(res.webhook);
      await fetchConfig();
    }
  };

  const handleWebhookDetails = async () => {
    const res = await runAction('webhook', () => payatAdmin<{ webhook: WebhookDetails }>('webhook_details', parlorId));
    if (res) setWebhook(res.webhook);
  };

  const handleSignupLink = async () => {
    const res = await runAction('signup', () =>
      payatAdmin<{ signUpUrl: string; merchantIdentifier: string }>('generate_signup_link', parlorId, {
        merchantIdentifier: merchantIdentifier || undefined,
      }),
    );
    if (res) {
      setSignUpUrl(res.signUpUrl);
      setMerchantIdentifier(res.merchantIdentifier);
      await fetchConfig();
    }
  };

  if (checkingRole || (isSuperAdmin && loading)) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }
  if (!isSuperAdmin) return null; // LovedOne-side view only.

  const status = config?.onboarding_status ?? 'not_started';
  const ready = config ? canEnable(config) : false;
  const missing =
    mode === 'merchant' && !config?.credentials_configured
      ? 'save the parlour\'s Pay@ credentials'
      : mode === 'integrator' && !config?.payat_merchant_identifier
        ? 'generate a sign-up link (sets the merchant identifier)'
        : null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 p-6 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            Pay@ setup
          </h2>
          <p className="text-sm text-slate-500 dark:text-gray-400">
            How {parlorName} collects Pay@ payments. Visible to super admins only.
          </p>
        </div>
        <span className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${config?.enabled ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'}`}>
          {config?.enabled ? 'Enabled' : 'Disabled'}
        </span>
      </div>

      {/* 1. Mode */}
      <fieldset className="space-y-2">
        <legend className={labelClass}>1. Payment account</legend>
        {(Object.keys(PAYAT_MODES) as PayatMode[]).map((m) => (
          <label
            key={m}
            className={`flex gap-3 p-3 rounded-lg border cursor-pointer ${mode === m ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-900/10' : 'border-slate-200 dark:border-gray-700'}`}
          >
            <input type="radio" name="payat-mode" className="mt-1" checked={mode === m} disabled={!!busy} onChange={() => handleModeChange(m)} />
            <span>
              <span className="block text-sm font-medium text-slate-900 dark:text-white">{PAYAT_MODES[m].label}</span>
              <span className="block text-xs text-slate-500 dark:text-gray-400">{PAYAT_MODES[m].description}</span>
            </span>
          </label>
        ))}
        {mode === 'platform' && (
          <p className="text-xs text-amber-700 dark:text-amber-400 flex items-start gap-1">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            Test mode: money paid for {parlorName} will settle to LovedOne&apos;s bank account.
          </p>
        )}
      </fieldset>

      {/* 2. Connection details per mode */}
      <section className="space-y-3">
        <h3 className={labelClass}>2. Connection</h3>

        {mode === 'merchant' && (
          <>
            <p className="text-xs text-slate-500 dark:text-gray-400">
              {config?.credentials_configured
                ? `Credentials saved${config.credentials_verified_at ? ` and last verified ${new Date(config.credentials_verified_at).toLocaleString()}` : ''}. Enter new ones below to replace them.`
                : "No credentials saved yet. The parlour finds these in Pay@Go under Account Settings → API Credentials."}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="payatClientId" className={labelClass}>Client ID</label>
                <input id="payatClientId" autoComplete="off" value={clientId} onChange={(e) => setClientId(e.target.value)} className={`${inputClass} font-mono`} />
              </div>
              <div>
                <label htmlFor="payatClientSecret" className={labelClass}>Client secret</label>
                <input id="payatClientSecret" type="password" autoComplete="new-password" value={clientSecret} onChange={(e) => setClientSecret(e.target.value)} className={`${inputClass} font-mono`} />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={handleSaveCredentials} disabled={!!busy || !clientId.trim() || !clientSecret.trim()} className={primaryButton}>
                {busy === 'credentials' ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                Test &amp; save credentials
              </button>
              {config?.credentials_configured && (
                <button onClick={handleClearCredentials} disabled={!!busy} className={secondaryButton}>
                  Remove credentials
                </button>
              )}
            </div>
          </>
        )}

        {mode === 'integrator' && (
          <>
            <div>
              <label htmlFor="merchantIdentifier" className={labelClass}>Pay@ merchant identifier</label>
              <input
                id="merchantIdentifier"
                value={merchantIdentifier}
                onChange={(e) => setMerchantIdentifier(e.target.value)}
                disabled={!!config?.payat_merchant_identifier}
                placeholder={`Leave blank to use lovedone-${parlorId.slice(0, 8)}`}
                className={`${inputClass} font-mono disabled:opacity-70`}
              />
              <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                Permanent once the parlour registers with Pay@.
              </p>
            </div>
            <button onClick={handleSignupLink} disabled={!!busy} className={primaryButton}>
              {busy === 'signup' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
              Generate Pay@ sign-up link
            </button>
            {signUpUrl && (
              <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-gray-900 rounded-lg border border-slate-200 dark:border-gray-700">
                <code className="text-xs break-all flex-1 text-slate-800 dark:text-gray-200">{signUpUrl}</code>
                <button onClick={() => copy(signUpUrl, 'Sign-up link')} className="text-blue-600 dark:text-blue-400" aria-label="Copy sign-up link">
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}

        {mode === 'platform' && (
          <p className="text-xs text-slate-500 dark:text-gray-400">
            Nothing to enter: this uses the PAYAT_CLIENT_ID and PAYAT_CLIENT_SECRET function secrets.
          </p>
        )}

        {config && (
          <button onClick={handleTest} disabled={!!busy} className={secondaryButton}>
            {busy === 'test' ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlugZap className="w-4 h-4" />}
            Test connection
          </button>
        )}
      </section>

      {/* 3. Webhook */}
      <section className="space-y-3">
        <h3 className={labelClass}>3. Payment notifications</h3>
        <p className="text-xs text-slate-500 dark:text-gray-400">
          {mode === 'merchant'
            ? "Add these in the parlour's Pay@Go account under Account Settings → Payment Notification Webhook."
            : "Configured once on LovedOne's own Pay@Go account. The API key is the PAYAT_PLATFORM_WEBHOOK_KEY function secret."}
        </p>
        <div className="flex flex-wrap gap-2">
          {mode === 'merchant' ? (
            <button onClick={handleWebhookKey} disabled={!!busy || !config} className={secondaryButton}>
              {busy === 'webhook' ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
              {config?.webhook_key_created_at ? 'Generate a new webhook key' : 'Generate webhook key'}
            </button>
          ) : (
            <button onClick={handleWebhookDetails} disabled={!!busy || !config} className={secondaryButton}>
              Show webhook details
            </button>
          )}
        </div>
        {mode === 'merchant' && config?.webhook_key_created_at && !webhook?.apiKey && (
          <p className="text-xs text-slate-500 dark:text-gray-400">
            A key was generated {new Date(config.webhook_key_created_at).toLocaleString()}. Generating a new one stops the old one working.
          </p>
        )}
        {webhook && (
          <dl className="text-sm grid grid-cols-[auto,1fr,auto] gap-x-3 gap-y-2 items-center p-3 bg-slate-50 dark:bg-gray-900 rounded-lg border border-slate-200 dark:border-gray-700">
            {[
              ['URL', webhook.url],
              ['Auth type', 'API key'],
              ['Header name', webhook.headerName],
              ...(webhook.apiKey ? [['API key', webhook.apiKey]] : []),
            ].map(([k, v]) => (
              <React.Fragment key={k}>
                <dt className="text-slate-500 dark:text-gray-400">{k}</dt>
                <dd className="font-mono text-xs break-all text-slate-900 dark:text-white">{v}</dd>
                <button onClick={() => copy(v, k)} className="text-blue-600 dark:text-blue-400" aria-label={`Copy ${k}`}>
                  <Copy className="w-4 h-4" />
                </button>
              </React.Fragment>
            ))}
            {webhook.apiKey && (
              <p className="col-span-3 text-xs text-amber-700 dark:text-amber-400">Copy the API key now — it won&apos;t be shown again.</p>
            )}
          </dl>
        )}
      </section>

      {/* 4. Status */}
      <section className="space-y-3">
        <h3 className={labelClass}>4. Onboarding status</h3>
        <div className="flex flex-wrap gap-2">
          {STATUS_ORDER.map((s) => (
            <button
              key={s}
              onClick={() => saveConfig({ onboarding_status: s })}
              disabled={!!busy}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-colors disabled:opacity-50 ${
                status === s ? 'bg-blue-600 text-white border-blue-600' : `${statusColors[s]} border-transparent hover:border-blue-400`
              }`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
        {status === 'approved' && !ready && missing && (
          <p className="text-xs text-amber-600">Marked approved, but Pay@ stays off until you {missing}.</p>
        )}
        <div>
          <label htmlFor="onboardingNotes" className={labelClass}>Notes</label>
          <textarea
            id="onboardingNotes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Sign-up link sent 30 Oct, waiting on bank verification"
            className={inputClass}
          />
        </div>
        <div className="flex justify-end">
          <button onClick={() => saveConfig({ onboarding_notes: notes || null })} disabled={!!busy} className={primaryButton}>
            {busy === 'save' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save notes
          </button>
        </div>
      </section>

      <p className="text-xs text-slate-400 pt-2 border-t border-slate-100 dark:border-gray-700">
        Pay@ switches on automatically once the status is Approved and the connection above is complete.
      </p>
    </div>
  );
};

export default PayAtOnboarding;
