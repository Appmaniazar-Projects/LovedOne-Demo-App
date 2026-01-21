import React, { useEffect, useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { supabase } from '../../supabaseClient';

const SettingsPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');

  const [prefs, setPrefs] = useState({
    notifyPayments: true,
    notifyTasks: true,
    notifyCases: true,
  });

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError) {
          setError(authError.message);
          return;
        }

        const user = authData?.user;
        if (!user) {
          setError('You must be logged in to view settings.');
          return;
        }

        setEmail(user.email || '');

        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('full_name')
          .eq('id', user.id)
          .single();

        if (profileError) {
          setError(profileError.message);
          return;
        }

        setFullName(String(profile?.full_name || ''));

        try {
          const raw = localStorage.getItem(`settings:prefs:${user.id}`);
          if (raw) {
            const parsed = JSON.parse(raw) as Partial<typeof prefs>;
            setPrefs((prev) => ({ ...prev, ...parsed }));
          }
        } catch {
          // ignore
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const saveSettings = async () => {
    try {
      setSaving(true);
      setError(null);

      const { data: authData } = await supabase.auth.getUser();
      const user = authData?.user;
      if (!user) {
        setError('You must be logged in to save settings.');
        return;
      }

      const { error: updateError } = await supabase
        .from('users')
        .update({ full_name: fullName })
        .eq('id', user.id);

      if (updateError) {
        setError(updateError.message);
        return;
      }

      try {
        localStorage.setItem(`settings:prefs:${user.id}`, JSON.stringify(prefs));
      } catch {
        // ignore
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Settings</h1>
      <div className="bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 p-8 rounded-lg shadow-md transition-colors duration-200">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          </div>
        )}

        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Account Settings</h2>
        {loading ? (
          <p className="text-slate-600 dark:text-gray-300">Loading settings...</p>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-200 mb-1">Full name</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border bg-white dark:bg-gray-700 border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-200 mb-1">Email</label>
              <input
                value={email}
                disabled
                className="w-full px-3 py-2 rounded-lg border bg-slate-50 dark:bg-gray-700 border-slate-200 dark:border-gray-600 text-slate-700 dark:text-gray-300 disabled:opacity-80"
              />
            </div>
            <button
              onClick={saveSettings}
              disabled={saving}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
        
        <hr className="my-8 border-slate-200 dark:border-gray-700" />

        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Notification Settings</h2>
        <div className="space-y-3">
          <label className="flex items-center gap-3 text-slate-700 dark:text-gray-200">
            <input
              type="checkbox"
              checked={prefs.notifyPayments}
              onChange={(e) => setPrefs((p) => ({ ...p, notifyPayments: e.target.checked }))}
            />
            Payments
          </label>
          <label className="flex items-center gap-3 text-slate-700 dark:text-gray-200">
            <input
              type="checkbox"
              checked={prefs.notifyTasks}
              onChange={(e) => setPrefs((p) => ({ ...p, notifyTasks: e.target.checked }))}
            />
            Tasks
          </label>
          <label className="flex items-center gap-3 text-slate-700 dark:text-gray-200">
            <input
              type="checkbox"
              checked={prefs.notifyCases}
              onChange={(e) => setPrefs((p) => ({ ...p, notifyCases: e.target.checked }))}
            />
            Cases
          </label>
          <p className="text-sm text-slate-500 dark:text-gray-400">These preferences are stored locally for now.</p>
        </div>
        
        <hr className="my-8 border-slate-200 dark:border-gray-700" />

        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Theme Settings</h2>
        <div className="flex items-center justify-between">
          <p className="text-slate-600 dark:text-gray-300">Current theme: {theme}</p>
          <button
            onClick={toggleTheme}
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-gray-600 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
          >
            Toggle theme
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
