import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast, Toaster } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import LovedOneLogo from '../../assets/LovedOne_Logo_black.png';

/**
 * Landing page for team invites (and password resets). Supabase signs the
 * person in from the link in their email; here they choose a password,
 * then go on into their parlour.
 */
const SetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // The invite link's tokens are read from the URL by supabase-js; give it
    // a moment, and listen in case the session lands after first render.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setHasSession(true);
        setChecking(false);
      }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setHasSession(true);
      setTimeout(() => setChecking(false), 1500);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error('Use at least 8 characters.');
    if (password !== confirm) return toast.error('The passwords don\'t match.');
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) {
      toast.error(error.message || 'Could not set your password.');
      return;
    }
    toast.success('Password set. Welcome to LovedOne!');
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4">
      <Toaster position="top-center" />
      <div className="w-full max-w-sm bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <img src={LovedOneLogo} alt="LovedOne" className="w-24 h-24 object-contain mx-auto mb-4 dark:invert" />
        {checking ? (
          <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-slate-500" /></div>
        ) : !hasSession ? (
          <div className="text-center">
            <h1 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">This link has expired</h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">Invite links can only be used once and expire after a while. Ask your parlour admin to send a new invite.</p>
            <button onClick={() => navigate('/login', { replace: true })} className="px-4 py-2 bg-slate-800 text-white rounded-md">Go to login</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <h1 className="text-lg font-semibold text-slate-900 dark:text-white">Choose your password</h1>
              <p className="text-sm text-slate-600 dark:text-slate-300">You'll use it with your email to sign in from now on.</p>
            </div>
            <input type="password" placeholder="New password (8+ characters)" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white" autoFocus />
            <input type="password" placeholder="Confirm password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
            <button type="submit" disabled={saving} className="w-full px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-md disabled:opacity-50 inline-flex items-center justify-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Set password and continue
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default SetPasswordPage;
