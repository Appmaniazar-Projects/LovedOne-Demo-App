import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Loader2, ShieldCheck, Copy, Save } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { useOutletContext } from 'react-router-dom';

// NOTE: this assumes the logged-in user's role is readable from
// `public.users.role` via supabase.auth.getUser(). If this app already
// has an auth/role context or hook (e.g. useAuth()), swap the role
// lookup below for that instead — this is just a self-contained
// fallback so the component works without knowing your exact setup.

type OnboardingStatus = 'not_started' | 'link_sent' | 'kyc_pending' | 'approved';

interface ProviderConfigRow {
  id: string;
  parlor_id: string;
  provider: 'pay_at';
  payat_subaccount_ref: string | null;
  onboarding_status: OnboardingStatus;
  onboarding_notes: string | null;
  enabled: boolean;
}

const STATUS_LABELS: Record<OnboardingStatus, string> = {
  not_started: 'Not started',
  link_sent: 'Sign-up link sent',
  kyc_pending: 'KYC pending with Pay@',
  approved: 'Approved',
};

const STATUS_ORDER: OnboardingStatus[] = ['not_started', 'link_sent', 'kyc_pending', 'approved'];

const statusColors: Record<OnboardingStatus, string> = {
  not_started: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300',
  link_sent: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400',
  kyc_pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400',
  approved: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400',
};

const PayAtOnboarding: React.FC = () => {
  const outlet = useOutletContext<{ parlorId: string; parlorName: string }>();
  const parlorId = outlet?.parlorId || '';

  const [checkingRole, setCheckingRole] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<ProviderConfigRow | null>(null);
  const [subaccountRef, setSubaccountRef] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const checkRole = async () => {
      try {
        const { data: userRes } = await supabase.auth.getUser();
        const userId = userRes?.user?.id;
        if (!userId) {
          setIsSuperAdmin(false);
          return;
        }
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
      .select('*')
      .eq('parlor_id', parlorId)
      .maybeSingle();

    if (error) {
      console.error('Failed to fetch payment_provider_config:', error);
      toast.error('Failed to load Pay@ onboarding status.');
    } else if (data) {
      setConfig(data as ProviderConfigRow);
      setSubaccountRef(data.payat_subaccount_ref || '');
      setNotes(data.onboarding_notes || '');
    } else {
      setConfig(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isSuperAdmin && parlorId) fetchConfig();
  }, [isSuperAdmin, parlorId]);

  const upsertConfig = async (patch: Partial<ProviderConfigRow>) => {
    setSaving(true);
    try {
      const { error } = await supabase.from('payment_provider_config').upsert(
        {
          parlor_id: parlorId,
          provider: 'pay_at',
          ...(config
            ? { id: config.id, onboarding_status: config.onboarding_status, enabled: config.enabled }
            : { onboarding_status: 'not_started', enabled: false }),
          ...patch,
        },
        { onConflict: 'parlor_id' },
      );

      if (error) throw error;
      toast.success('Saved.');
      fetchConfig();
    } catch (err: any) {
      console.error('Failed to save payment_provider_config:', err);
      toast.error(err?.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = (status: OnboardingStatus) => {
    // Guard: never let 'enabled' flip true unless approved + subaccount ref present.
    const nextEnabled = status === 'approved' && !!subaccountRef;
    upsertConfig({ onboarding_status: status, enabled: nextEnabled });
  };

  const handleSaveDetails = () => {
    const nextEnabled = config?.onboarding_status === 'approved' && !!subaccountRef;
    upsertConfig({ payat_subaccount_ref: subaccountRef || null, onboarding_notes: notes || null, enabled: nextEnabled });
  };

  const copySignupLink = () => {
    // Placeholder until the real Pay@Go sign-up link generation is wired
    // up (edge function / Pay@Go API). For now this is a manual step.
    const placeholder = `Pay@ sign-up link for ${outlet?.parlorName || 'this parlour'} — paste the real link from Pay@Go here once generated.`;
    navigator.clipboard.writeText(placeholder);
    toast('Copied placeholder — replace with the real Pay@Go link once that call is wired up.');
  };

  if (checkingRole || (isSuperAdmin && loading)) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null; // Not a LovedOne-side view for parlour staff — render nothing.
  }

  const status = config?.onboarding_status || 'not_started';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-slate-200 dark:border-gray-700 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            Pay@Go Onboarding
          </h2>
          <p className="text-sm text-slate-500 dark:text-gray-400">
            LovedOne-side status for {outlet?.parlorName || 'this parlour'}'s Pay@ subaccount. Visible to super admins only.
          </p>
        </div>
        <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${statusColors[status]}`}>
          {STATUS_LABELS[status]}
        </span>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1">Onboarding status</label>
        <div className="flex flex-wrap gap-2">
          {STATUS_ORDER.map((s) => (
            <button
              key={s}
              onClick={() => handleStatusChange(s)}
              disabled={saving}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-colors disabled:opacity-50 ${
                status === s
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-gray-700 text-slate-700 dark:text-gray-200 border-slate-300 dark:border-gray-600 hover:border-blue-400'
              }`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
        {status === 'approved' && !subaccountRef && (
          <p className="text-xs text-amber-600 mt-2">
            Marked approved but no subaccount reference is saved yet — Pay@ won't actually be enabled until you add it below.
          </p>
        )}
      </div>

      <div>
        <button
          onClick={copySignupLink}
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
        >
          <Copy className="w-4 h-4" />
          Copy sign-up link for this parlour
        </button>
      </div>

      <div>
        <label htmlFor="subaccountRef" className="block text-sm font-medium text-slate-900 dark:text-white mb-1">
          Pay@ subaccount reference
        </label>
        <input
          id="subaccountRef"
          type="text"
          value={subaccountRef}
          onChange={(e) => setSubaccountRef(e.target.value)}
          placeholder="Issued by Pay@ once KYC is approved"
          className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-900 dark:text-white"
        />
      </div>

      <div>
        <label htmlFor="onboardingNotes" className="block text-sm font-medium text-slate-900 dark:text-white mb-1">
          Notes
        </label>
        <textarea
          id="onboardingNotes"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Sign-up link sent 14 Sept, waiting on ID document"
          className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-900 dark:text-white"
        />
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSaveDetails}
          disabled={saving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save
        </button>
      </div>

      <p className="text-xs text-slate-400 pt-2 border-t border-slate-100 dark:border-gray-700">
        Pay@ for this parlour is {config?.enabled ? 'ENABLED' : 'disabled'} for customer-facing payments — this flips
        automatically to enabled only when status is "Approved" and a subaccount reference is saved.
      </p>
    </div>
  );
};

export default PayAtOnboarding;