import React, { useCallback, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Loader2, UserPlus, Users, X, Mail, Trash2, Copy, Link2, MessageCircle } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { isValidEmail } from '../../utils/saId';

type Role = 'staff' | 'admin' | 'super_admin' | 'viewer';

interface Member {
  id: string;
  email: string | null;
  full_name: string | null;
  role: Role;
  pending: boolean;
  last_sign_in_at: string | null;
  is_self: boolean;
}

const ROLE_LABEL: Record<Role, string> = {
  admin: 'Admin',
  staff: 'Staff',
  super_admin: 'LovedOne super admin',
  viewer: 'No access',
};

const ROLE_HELP = {
  admin: 'Everything in this parlour, including managing the team and deleting records.',
  staff: 'Day-to-day work: clients, cases, tasks and payment requests. Can\'t delete clients or manage the team.',
};

const inputCls = 'w-full px-3 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-900 dark:text-white';

// The edge function's JSON error body sits behind error.context.
async function callManageStaff(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke('manage-staff', { body });
  if (error) {
    let message = error.message || 'Request failed';
    try {
      const parsed = await (error as any).context?.json?.();
      if (parsed?.error) message = parsed.error;
    } catch {
      /* not JSON */
    }
    throw new Error(message);
  }
  return data;
}

const TeamPage: React.FC = () => {
  const outlet = useOutletContext<{ parlorId: string; parlorName: string }>();
  const parlorId = outlet?.parlorId || '';
  const parlorName = outlet?.parlorName || 'this parlour';

  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'staff' | 'admin'>('staff');
  const [inviting, setInviting] = useState(false);
  // The invite link to hand over (no email is sent — see manage-staff).
  const [share, setShare] = useState<{ name: string; link: string } | null>(null);

  const load = useCallback(async () => {
    if (!parlorId) return;
    setLoading(true);
    setLoadError(null);
    try {
      const data = await callManageStaff({ action: 'list', parlorId });
      setMembers(data?.members || []);
    } catch (err: any) {
      setLoadError(err.message);
    } finally {
      setLoading(false);
    }
  }, [parlorId]);

  useEffect(() => {
    load();
  }, [load]);

  const resetInvite = () => {
    setFullName('');
    setEmail('');
    setRole('staff');
    setInviteOpen(false);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return toast.error('Enter their full name.');
    if (!isValidEmail(email)) return toast.error('Enter a valid email address.');
    setInviting(true);
    try {
      const result = await callManageStaff({
        action: 'invite',
        parlorId,
        fullName: fullName.trim(),
        email: email.trim(),
        role,
        redirectTo: `${window.location.origin}/set-password`,
      });
      const name = fullName.trim();
      resetInvite();
      if (result?.invited && result?.inviteLink) {
        setShare({ name, link: result.inviteLink });
      } else {
        toast.success(`${name} already had a LovedOne login and now has access to ${parlorName}.`, { duration: 6000 });
      }
      load();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setInviting(false);
    }
  };

  const changeRole = async (m: Member, next: 'staff' | 'admin') => {
    if (next === m.role) return;
    setBusyId(m.id);
    try {
      await callManageStaff({ action: 'set_role', parlorId, userId: m.id, role: next });
      setMembers((list) => list.map((x) => (x.id === m.id ? { ...x, role: next } : x)));
      toast.success(`${m.full_name || m.email} is now ${ROLE_LABEL[next].toLowerCase()}.`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const newLink = async (m: Member) => {
    setBusyId(m.id);
    try {
      const result = await callManageStaff({
        action: 'new_link',
        parlorId,
        userId: m.id,
        redirectTo: `${window.location.origin}/set-password`,
      });
      if (result?.inviteLink) setShare({ name: m.full_name || m.email || 'them', link: result.inviteLink });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const copyLink = async () => {
    if (!share) return;
    try {
      await navigator.clipboard.writeText(share.link);
      toast.success('Link copied.');
    } catch {
      toast.error('Could not copy. Select the link and copy it manually.');
    }
  };

  const whatsappText = share
    ? `Hi ${share.name.split(' ')[0]}, you've been added to ${parlorName} on LovedOne. Open this link to set your password and sign in (it expires soon, so please use it today): ${share.link}`
    : '';

  const remove = async (m: Member) => {
    if (!window.confirm(`Remove ${m.full_name || m.email} from ${parlorName}? They won't be able to open this parlour any more. Their login isn't deleted.`)) return;
    setBusyId(m.id);
    try {
      await callManageStaff({ action: 'remove', parlorId, userId: m.id });
      setMembers((list) => list.filter((x) => x.id !== m.id));
      toast.success('Removed from the team.');
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Team</h1>
          <p className="text-sm text-slate-600 dark:text-gray-400">People who can use {parlorName}.</p>
        </div>
        <button
          onClick={() => setInviteOpen(true)}
          className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
        >
          <UserPlus className="w-5 h-5 mr-2" /> Add team member
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-slate-200 dark:border-gray-700">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 text-blue-600 animate-spin" /></div>
        ) : loadError ? (
          <div className="p-6 text-center">
            <p className="text-red-600 mb-3">{loadError}</p>
            <button onClick={load} className="px-4 py-2 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-900 dark:text-white">Try again</button>
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-12 text-slate-500 dark:text-gray-400">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-60" />
            No one has been added to this parlour yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 dark:text-gray-400 border-b border-slate-200 dark:border-gray-700">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                {members.map((m) => {
                  const locked = m.is_self || m.role === 'super_admin';
                  return (
                    <tr key={m.id} className="text-slate-800 dark:text-gray-200">
                      <td className="px-4 py-3 font-medium">
                        {m.full_name || '—'} {m.is_self && <span className="text-xs text-slate-500">(you)</span>}
                      </td>
                      <td className="px-4 py-3">{m.email}</td>
                      <td className="px-4 py-3">
                        {locked ? (
                          ROLE_LABEL[m.role] || m.role
                        ) : (
                          <select
                            value={m.role === 'admin' ? 'admin' : 'staff'}
                            onChange={(e) => changeRole(m, e.target.value as 'staff' | 'admin')}
                            disabled={busyId === m.id}
                            className="px-2 py-1 bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded"
                          >
                            <option value="staff">Staff</option>
                            <option value="admin">Admin</option>
                          </select>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {m.pending ? (
                          <span className="inline-flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                              <Mail className="w-3 h-3" /> Not set up yet
                            </span>
                            {!locked && (
                              <button
                                onClick={() => newLink(m)}
                                disabled={busyId === m.id}
                                className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
                              >
                                <Link2 className="w-3 h-3" /> New link
                              </button>
                            )}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Active</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {!locked && (
                          <button
                            onClick={() => remove(m)}
                            disabled={busyId === m.id}
                            className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded disabled:opacity-50"
                            aria-label={`Remove ${m.full_name || m.email}`}
                          >
                            {busyId === m.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-500 dark:text-gray-400">
        A person's role applies everywhere they work: someone who is an admin here is also an admin at any other parlour they belong to.
      </p>

      {share && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-md p-6 relative">
            <button onClick={() => setShare(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600" aria-label="Close">
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Send {share.name} their link</h2>
            <p className="text-sm text-slate-600 dark:text-gray-300 mb-4">
              This link signs them in to set their password. Send it only to {share.name.split(' ')[0]}, and ask them to use it today: it expires (1 hour by default). If it runs out, use <strong>New link</strong> on the Team page.
            </p>
            <textarea readOnly value={share.link} rows={3} onFocus={(e) => e.currentTarget.select()} className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-gray-800 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-900 dark:text-white mb-4" />
            <div className="flex flex-wrap justify-end gap-2">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(whatsappText)}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
              >
                <MessageCircle className="w-4 h-4" /> Send on WhatsApp
              </a>
              <button onClick={copyLink} className="inline-flex items-center gap-1 px-4 py-2 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-900 dark:text-white">
                <Copy className="w-4 h-4" /> Copy link
              </button>
              <button onClick={() => setShare(null)} className="px-4 py-2 bg-blue-600 text-white rounded-lg">Done</button>
            </div>
          </div>
        </div>
      )}

      {inviteOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-2xl w-full max-w-md p-6 relative">
            <button onClick={resetInvite} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600" aria-label="Close">
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-1">Add team member</h2>
            <p className="text-sm text-slate-600 dark:text-gray-300 mb-5">
              You'll get a personal link to send them (e.g. on WhatsApp). They open it, set a password, and land straight in {parlorName}.
            </p>
            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1">Full name</label>
                <input className={inputCls} value={fullName} onChange={(e) => setFullName(e.target.value)} autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1">Email</label>
                <input type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-900 dark:text-white mb-2">Role</label>
                {(['staff', 'admin'] as const).map((r) => (
                  <label key={r} className="flex items-start gap-2 mb-2 cursor-pointer">
                    <input type="radio" name="role" checked={role === r} onChange={() => setRole(r)} className="mt-1" />
                    <span>
                      <span className="font-medium text-slate-900 dark:text-white">{ROLE_LABEL[r]}</span>
                      <span className="block text-xs text-slate-500 dark:text-gray-400">{ROLE_HELP[r]}</span>
                    </span>
                  </label>
                ))}
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={resetInvite} className="px-4 py-2 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-900 dark:text-white">Cancel</button>
                <button type="submit" disabled={inviting} className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 inline-flex items-center gap-2">
                  {inviting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {inviting ? 'Creating…' : 'Create invite link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamPage;
