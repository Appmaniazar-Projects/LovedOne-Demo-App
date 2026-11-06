import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext, Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import {
  ArrowLeft, Phone, Mail, MapPin, User as UserIcon, Edit, Save, X, Plus, Calendar, Shield, Contact, Heart, Briefcase, CreditCard,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import ClientDocuments from './ClientDocuments';
import DependantsSection, { DependantRow } from './DependantsSection';
import { getClientBySlug } from '../../utils/slugify';
import CreateCaseModal from '../Cases/CreateCaseModal';
import GoogleAddressAutocomplete from '../GoogleAddressAutocomplete';
import { Plan } from '../../types';
import { getPaymentMethodLabel } from '../../types/payments';
import PaymentStatusBadge from '../Payments/PaymentStatusBadge';
import { parseSaId, isValidSaPhone, isValidEmail, ageFromDob } from '../../utils/saId';
import { CLIENT_STATUSES, formatZar, formatDate } from './clientShared';

interface ClientRow {
  id: string;
  name: string;
  relationship: string | null;
  id_number: string | null;
  date_of_birth: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  cultural_preferences: string | null;
  profile_picture_url: string | null;
  plan_id: string | null;
  policy_start_date: string | null;
  status: 'active' | 'lapsed' | 'deceased';
  created_at: string;
  user_id: string | null;
  parlor_id: string;
}

type EditForm = Pick<
  ClientRow,
  'name' | 'id_number' | 'date_of_birth' | 'email' | 'phone' | 'address' | 'cultural_preferences' | 'plan_id' | 'policy_start_date' | 'status'
>;

const statusStyles: Record<string, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  lapsed: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  deceased: 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
};

const inputCls = 'w-full p-2 rounded border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white bg-white dark:bg-gray-700';

const Field: React.FC<{ icon: React.ReactNode; label: string; children: React.ReactNode }> = ({ icon, label, children }) => (
  <div className="flex items-start">
    <span className="mt-0.5 mr-3 flex-shrink-0">{icon}</span>
    <div className="w-full min-w-0">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <div className="text-gray-800 dark:text-gray-200 break-words">{children}</div>
    </div>
  </div>
);

const ClientDetails: React.FC = () => {
  const { clientSlug, parlorId: parlorKey } = useParams<{ clientSlug: string; parlorId: string }>();
  const outlet = useOutletContext<{ parlorId: string; parlorRouteKey: string } | undefined>();
  const parlorUuid = outlet?.parlorId || undefined;
  const parlorRouteKey = outlet?.parlorRouteKey || parlorKey || '';
  const navigate = useNavigate();

  const [client, setClient] = useState<ClientRow | null>(null);
  const [form, setForm] = useState<EditForm | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showCreateCaseModal, setShowCreateCaseModal] = useState(false);
  const [dependants, setDependants] = useState<DependantRow[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [cases, setCases] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);

  const isAdmin = userRole === 'admin' || userRole === 'super_admin';
  const plan = plans.find((p) => p.id === client?.plan_id) || null;

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('users').select('role').eq('id', user.id).maybeSingle();
      setUserRole(data?.role ?? null);
    })();
  }, []);

  const loadRelated = async (c: ClientRow) => {
    const [depRes, planRes, caseRes, payRes] = await Promise.all([
      supabase.from('dependants').select('*').eq('client_id', c.id).order('created_at'),
      supabase.from('plans').select('*').eq('parlor_id', c.parlor_id).order('name'),
      supabase.from('cases').select('id, deceased_name, case_status, created_at').eq('client_id', c.id).order('created_at', { ascending: false }),
      supabase.from('payments').select('id, description, amount, status, method, created_at').eq('client_id', c.id).order('created_at', { ascending: false }).limit(20),
    ]);
    if (depRes.error) console.error('Error fetching dependants:', depRes.error);
    setDependants((depRes.data as DependantRow[]) || []);
    setPlans((planRes.data as Plan[]) || []);
    if (caseRes.error) console.warn('Could not load cases for client:', caseRes.error.message);
    setCases(caseRes.data || []);
    if (payRes.error) console.warn('Could not load payments for client:', payRes.error.message);
    setPayments(payRes.data || []);
  };

  useEffect(() => {
    const fetchClient = async () => {
      if (!clientSlug) {
        setError('No client specified');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await getClientBySlug(clientSlug, supabase, parlorUuid);
        if (!data) throw new Error('Client not found. They may have been deleted, or the link is out of date.');
        setClient(data as ClientRow);
        await loadRelated(data as ClientRow);
      } catch (err: any) {
        console.error('Error fetching client:', err);
        setError(err.message || 'Failed to load client details');
      } finally {
        setLoading(false);
      }
    };
    fetchClient();
  }, [clientSlug, parlorUuid]);

  const startEditing = () => {
    if (!client) return;
    setForm({
      name: client.name,
      id_number: client.id_number,
      date_of_birth: client.date_of_birth,
      email: client.email,
      phone: client.phone,
      address: client.address,
      cultural_preferences: client.cultural_preferences,
      plan_id: client.plan_id,
      policy_start_date: client.policy_start_date,
      status: client.status,
    });
    setFormErrors({});
    setIsEditing(true);
  };

  const setField = (field: keyof EditForm, value: string) => {
    setForm((prev) => {
      if (!prev) return prev;
      const next = { ...prev, [field]: value } as EditForm;
      if (field === 'id_number') {
        const info = parseSaId(value);
        if (info.valid && info.dateOfBirth) next.date_of_birth = info.dateOfBirth;
      }
      return next;
    });
  };

  const validate = (f: EditForm) => {
    const e: Record<string, string> = {};
    if (!f.name?.trim()) e.name = 'Name is required';
    if (!f.phone?.trim()) e.phone = 'Phone number is required';
    else if (!isValidSaPhone(f.phone)) e.phone = 'Enter a valid SA number, e.g. 0821234567';
    if (f.email?.trim() && !isValidEmail(f.email)) e.email = 'Enter a valid email address';
    if (f.id_number?.trim()) {
      const info = parseSaId(f.id_number);
      if (!info.valid) e.id_number = info.error || 'Invalid ID number';
    }
    setFormErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!form || !client) return;
    if (!validate(form)) {
      toast.error('Please fix the highlighted fields.');
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .update({
          name: form.name.trim(),
          id_number: form.id_number?.replace(/\s/g, '') || null,
          date_of_birth: form.date_of_birth || null,
          email: form.email?.trim() || null,
          phone: form.phone?.replace(/[\s-]/g, '') || null,
          address: form.address?.trim() || null,
          cultural_preferences: form.cultural_preferences?.trim() || null,
          plan_id: form.plan_id || null,
          policy_start_date: form.policy_start_date || null,
          status: form.status,
        })
        .eq('id', client.id)
        .select()
        .single();
      if (error) throw error;
      setClient(data as ClientRow);
      setIsEditing(false);
      toast.success('Client updated');
    } catch (err: any) {
      console.error('Error updating client:', err);
      toast.error(err.message || 'Failed to update client');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || !client) return;
    const file = e.target.files[0];
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file.');
      return;
    }
    const filePath = `profile-pictures/${client.id}-${Date.now()}.${file.name.split('.').pop()}`;
    setUploading(true);
    try {
      const { error: uploadError } = await supabase.storage.from('client-profiles').upload(filePath, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('client-profiles').getPublicUrl(filePath);
      const { error: updateError } = await supabase.from('clients').update({ profile_picture_url: publicUrl }).eq('id', client.id);
      if (updateError) throw updateError;
      setClient((prev) => (prev ? { ...prev, profile_picture_url: publicUrl } : prev));
      toast.success('Profile picture updated');
    } catch (err: any) {
      console.error('Error uploading image:', err);
      toast.error(err.message || 'Failed to upload profile picture');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDeleteClient = async () => {
    if (!client || deleting) return;
    if (!window.confirm(`Delete ${client.name}? Their dependants and documents will also be removed. This cannot be undone.`)) return;
    setDeleting(true);
    const { error: deleteError } = await supabase.from('clients').delete().eq('id', client.id);
    if (deleteError) {
      toast.error(deleteError.message || 'Failed to delete client');
      setDeleting(false);
      return;
    }
    toast.success('Client deleted');
    navigate(`/${parlorRouteKey}/clients`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4" />
        <p className="text-gray-600 dark:text-gray-300">Loading client details…</p>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">{error || 'Client not found'}</div>
        <button onClick={() => navigate(`/${parlorRouteKey}/clients`)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Back to Clients
        </button>
      </div>
    );
  }

  const age = ageFromDob(client.date_of_birth);
  const editPlan = plans.find((p) => p.id === form?.plan_id) || null;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Top bar */}
      <div className="flex flex-wrap justify-between items-center gap-3">
        <button onClick={() => navigate(`/${parlorRouteKey}/clients`)} className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Clients
        </button>
        <div className="flex flex-wrap items-center gap-2">
          {!isEditing ? (
            <button onClick={startEditing} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Edit className="w-4 h-4 mr-2" /> Edit Client
            </button>
          ) : (
            <>
              <button onClick={handleSave} disabled={saving} className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                <Save className="w-4 h-4 mr-2" /> {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button onClick={() => setIsEditing(false)} className="flex items-center px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">
                <X className="w-4 h-4 mr-2" /> Cancel
              </button>
            </>
          )}
          {isAdmin && !isEditing && (
            <button onClick={handleDeleteClient} disabled={deleting} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
              {deleting ? 'Deleting…' : 'Delete Client'}
            </button>
          )}
          <button onClick={() => setShowCreateCaseModal(true)} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center">
            <Plus className="w-4 h-4 mr-2" /> Create Case
          </button>
        </div>
      </div>

      {/* Header + details */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-700 dark:to-blue-900 p-6 text-white">
          <div className="flex items-center">
            <div className="relative group mr-6">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center overflow-hidden">
                {client.profile_picture_url ? (
                  <img src={client.profile_picture_url} alt={client.name} className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-10 h-10" />
                )}
              </div>
              <label className={`absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${uploading ? 'opacity-100' : ''}`} title="Change profile picture">
                {uploading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Edit className="w-5 h-5 text-white" />}
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={uploading} />
              </label>
            </div>
            <div className="min-w-0 flex-1">
              {isEditing && form ? (
                <>
                  <input type="text" value={form.name} onChange={(e) => setField('name', e.target.value)} className="w-full max-w-md p-2 rounded border border-gray-300 text-gray-900 bg-white" />
                  {formErrors.name && <p className="text-xs text-red-200 mt-1">{formErrors.name}</p>}
                </>
              ) : (
                <h1 className="font-semibold text-2xl truncate">{client.name}</h1>
              )}
              <div className="flex flex-wrap items-center gap-2 mt-2 text-sm">
                <span className={`px-2 py-0.5 rounded-full font-medium ${statusStyles[client.status] || statusStyles.active}`}>
                  {CLIENT_STATUSES.find((s) => s.value === client.status)?.label || client.status}
                </span>
                <span className="text-blue-100">{plan ? plan.name : 'No plan'}</span>
                <span className="text-blue-200">· Policy holder</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Personal */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Personal</h2>
            <Field icon={<Contact className="w-5 h-5 text-indigo-600" />} label="SA ID number">
              {isEditing && form ? (
                <>
                  <input className={inputCls} inputMode="numeric" maxLength={13} value={form.id_number || ''} onChange={(e) => setField('id_number', e.target.value.replace(/\D/g, ''))} />
                  {formErrors.id_number && <p className="text-xs text-red-600 mt-1">{formErrors.id_number}</p>}
                </>
              ) : (
                <span className="font-mono">{client.id_number || '—'}</span>
              )}
            </Field>
            <Field icon={<Calendar className="w-5 h-5 text-purple-600" />} label="Date of birth">
              {isEditing && form ? (
                <input type="date" className={inputCls} value={form.date_of_birth || ''} onChange={(e) => setField('date_of_birth', e.target.value)} />
              ) : client.date_of_birth ? (
                `${formatDate(client.date_of_birth)}${age !== null ? ` (${age})` : ''}`
              ) : (
                '—'
              )}
            </Field>
            <Field icon={<Heart className="w-5 h-5 text-pink-600" />} label="Cultural / religious preferences">
              {isEditing && form ? (
                <textarea rows={3} className={inputCls} value={form.cultural_preferences || ''} onChange={(e) => setField('cultural_preferences', e.target.value)} />
              ) : (
                client.cultural_preferences || '—'
              )}
            </Field>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Contact</h2>
            <Field icon={<Phone className="w-5 h-5 text-green-600" />} label="Phone">
              {isEditing && form ? (
                <>
                  <input type="tel" className={inputCls} value={form.phone || ''} onChange={(e) => setField('phone', e.target.value)} />
                  {formErrors.phone && <p className="text-xs text-red-600 mt-1">{formErrors.phone}</p>}
                </>
              ) : client.phone ? (
                <a href={`tel:${client.phone}`} className="hover:underline">{client.phone}</a>
              ) : (
                '—'
              )}
            </Field>
            <Field icon={<Mail className="w-5 h-5 text-blue-600" />} label="Email">
              {isEditing && form ? (
                <>
                  <input type="email" className={inputCls} value={form.email || ''} onChange={(e) => setField('email', e.target.value)} />
                  {formErrors.email && <p className="text-xs text-red-600 mt-1">{formErrors.email}</p>}
                </>
              ) : client.email ? (
                <a href={`mailto:${client.email}`} className="hover:underline">{client.email}</a>
              ) : (
                '—'
              )}
            </Field>
            <Field icon={<MapPin className="w-5 h-5 text-red-600" />} label="Address">
              {isEditing && form ? (
                <GoogleAddressAutocomplete
                  value={form.address || ''}
                  onChange={(v: string) => setField('address', v)}
                  apiKey={import.meta.env.VITE_GOOGLE_PLACES_API_KEY}
                  placeholder="Enter address..."
                  className="w-full"
                />
              ) : (
                client.address || '—'
              )}
            </Field>
          </div>

          {/* Policy */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Policy</h2>
            <Field icon={<Shield className="w-5 h-5 text-blue-600" />} label="Plan">
              {isEditing && form ? (
                <>
                  <select className={inputCls} value={form.plan_id || ''} onChange={(e) => setField('plan_id', e.target.value)}>
                    <option value="">No plan</option>
                    {plans.filter((p) => p.is_active || p.id === client.plan_id).map((p) => (
                      <option key={p.id} value={p.id}>{p.name}{!p.is_active ? ' (inactive)' : ''}</option>
                    ))}
                  </select>
                  {editPlan && <p className="text-xs text-gray-500 mt-1">{formatZar(editPlan.monthly_premium)}/month · {formatZar(editPlan.cover_amount)} cover</p>}
                </>
              ) : plan ? (
                <>
                  <p className="font-medium">{plan.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{formatZar(plan.monthly_premium)}/month · {formatZar(plan.cover_amount)} cover</p>
                </>
              ) : (
                'No plan'
              )}
            </Field>
            <Field icon={<Briefcase className="w-5 h-5 text-amber-600" />} label="Policy status">
              {isEditing && form ? (
                <select className={inputCls} value={form.status} onChange={(e) => setField('status', e.target.value)}>
                  {CLIENT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              ) : (
                CLIENT_STATUSES.find((s) => s.value === client.status)?.label || client.status
              )}
            </Field>
            <Field icon={<Calendar className="w-5 h-5 text-teal-600" />} label="Policy start date">
              {isEditing && form ? (
                <input type="date" className={inputCls} value={form.policy_start_date || ''} onChange={(e) => setField('policy_start_date', e.target.value)} />
              ) : (
                formatDate(client.policy_start_date)
              )}
            </Field>
            <Field icon={<Calendar className="w-5 h-5 text-gray-500" />} label="Client since">
              {formatDate(client.created_at)}
            </Field>
          </div>
        </div>
      </div>

      {/* Dependants */}
      <DependantsSection clientId={client.id} dependants={dependants} canDelete={isAdmin} onChange={setDependants} />

      {/* Cases & payments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
            <Briefcase className="w-5 h-5 mr-2 text-purple-600" /> Cases ({cases.length})
          </h2>
          {cases.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No cases for this client yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-700">
              {cases.map((c) => (
                <li key={c.id} className="py-2 flex items-center justify-between text-sm">
                  <span className="text-gray-800 dark:text-gray-200 font-medium">{c.deceased_name || 'Unnamed case'}</span>
                  <span className="text-gray-500 dark:text-gray-400 capitalize">{c.case_status || '—'} · {formatDate(c.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
          {cases.length > 0 && (
            <Link to={`/${parlorRouteKey}/cases`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-3 inline-block">Open case board →</Link>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
            <CreditCard className="w-5 h-5 mr-2 text-green-600" /> Payments ({payments.length})
          </h2>
          {payments.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No payments recorded for this client.</p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-700">
              {payments.map((p) => (
                <li key={p.id} className="py-2 flex items-center justify-between gap-2 text-sm">
                  <div className="min-w-0">
                    <p className="text-gray-800 dark:text-gray-200 truncate">{p.description || getPaymentMethodLabel(p.method)}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{getPaymentMethodLabel(p.method)} · {formatDate(p.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-medium text-gray-900 dark:text-white">{formatZar(p.amount)}</span>
                    <PaymentStatusBadge status={p.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
          {payments.length > 0 && (
            <Link to={`/${parlorRouteKey}/payments`} className="text-sm text-blue-600 dark:text-blue-400 hover:underline mt-3 inline-block">Open payments →</Link>
          )}
        </div>
      </div>

      {/* Documents */}
      <ClientDocuments clientId={client.id} clientName={client.name} />

      <CreateCaseModal
        isOpen={showCreateCaseModal}
        onClose={() => setShowCreateCaseModal(false)}
        clientId={client.id}
        clientName={client.name}
        dependants={dependants}
        onCaseCreated={() => {
          toast.success('Case created successfully!');
          setShowCreateCaseModal(false);
          loadRelated(client);
        }}
        parlorId={client.parlor_id || ''}
      />
    </div>
  );
};

export default ClientDetails;
