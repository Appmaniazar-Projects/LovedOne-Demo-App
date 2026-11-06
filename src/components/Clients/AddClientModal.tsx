// src/components/Clients/AddClientModal.tsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Client } from './Clients';
import { toast } from 'react-hot-toast';
import { Plus, X, Upload, FileText, Shield, Users, Loader2 } from 'lucide-react';
import { Plan } from '../../types';
import GoogleAddressAutocomplete from '../GoogleAddressAutocomplete';
import { parseSaId, isValidSaPhone, isValidEmail } from '../../utils/saId';
import {
  DEPENDANT_RELATIONSHIPS,
  CLIENT_STATUSES,
  CLIENT_DOCUMENT_TYPES,
  validateDocumentFile,
  uploadClientDocument,
  formatZar,
} from './clientShared';

interface AddClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClientAdded: (newClient: Client) => void;
  parlorId: string;
}

interface DependantDraft {
  key: string;
  name: string;
  relationship: string;
  dateOfBirth: string;
  idNumber: string;
  contactNumber: string;
}

interface PendingDocument {
  key: string;
  documentType: string;
  file: File;
}

const inputCls =
  'w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-slate-900 dark:text-white rounded-lg';
const smallInputCls =
  'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-900 dark:text-white rounded-lg';
const labelCls = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';
const errCls = 'text-xs text-red-600 mt-1';

const newKey = () => Math.random().toString(36).slice(2);

const AddClientModal: React.FC<AddClientModalProps> = ({ isOpen, onClose, onClientAdded, parlorId }) => {
  // Section 1 — policy holder
  const [firstName, setFirstName] = useState('');
  const [surname, setSurname] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [culturalPreferences, setCulturalPreferences] = useState('');

  // Section 2 — plan
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [policyStartDate, setPolicyStartDate] = useState('');
  const [status, setStatus] = useState<'active' | 'lapsed' | 'deceased'>('active');

  // Section 3 — dependants
  const [dependants, setDependants] = useState<DependantDraft[]>([]);

  // Section 4 — documents
  const [docType, setDocType] = useState(CLIENT_DOCUMENT_TYPES[0].type);
  const [pendingDocs, setPendingDocs] = useState<PendingDocument[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const selectedPlan = plans.find((p) => p.id === selectedPlanId) || null;

  useEffect(() => {
    if (!isOpen || !parlorId) return;
    supabase
      .from('plans')
      .select('*')
      .eq('parlor_id', parlorId)
      .eq('is_active', true)
      .order('name')
      .then(({ data, error }) => {
        if (error) {
          console.error('Error fetching plans:', error);
          toast.error('Failed to load plans');
        } else {
          setPlans((data as Plan[]) || []);
        }
      });
  }, [isOpen, parlorId]);

  // Filling in a valid SA ID fills in the date of birth.
  const handleIdChange = (value: string) => {
    setIdNumber(value);
    const info = parseSaId(value);
    if (info.valid && info.dateOfBirth) setDateOfBirth(info.dateOfBirth);
  };

  const addDependant = () =>
    setDependants((d) => [...d, { key: newKey(), name: '', relationship: '', dateOfBirth: '', idNumber: '', contactNumber: '' }]);

  const updateDependant = (key: string, field: keyof DependantDraft, value: string) =>
    setDependants((list) =>
      list.map((d) => {
        if (d.key !== key) return d;
        const next = { ...d, [field]: value };
        if (field === 'idNumber') {
          const info = parseSaId(value);
          if (info.valid && info.dateOfBirth) next.dateOfBirth = info.dateOfBirth;
        }
        return next;
      }),
    );

  const removeDependant = (key: string) => setDependants((d) => d.filter((x) => x.key !== key));

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const accepted: PendingDocument[] = [];
    for (const file of files) {
      const problem = validateDocumentFile(file);
      if (problem) toast.error(problem);
      else accepted.push({ key: newKey(), documentType: docType, file });
    }
    setPendingDocs((p) => [...p, ...accepted]);
    e.target.value = '';
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!firstName.trim()) e.firstName = 'First name is required';
    if (!surname.trim()) e.surname = 'Surname is required';
    if (!phone.trim()) e.phone = 'Phone number is required';
    else if (!isValidSaPhone(phone)) e.phone = 'Enter a valid SA number, e.g. 0821234567';
    if (email.trim() && !isValidEmail(email)) e.email = 'Enter a valid email address';
    if (idNumber.trim()) {
      const info = parseSaId(idNumber);
      if (!info.valid) e.idNumber = info.error || 'Invalid ID number';
    }
    dependants.forEach((d, i) => {
      if (!d.name.trim()) e[`dep-${d.key}-name`] = `Dependant ${i + 1}: name is required`;
      if (!d.relationship) e[`dep-${d.key}-relationship`] = `Dependant ${i + 1}: relationship is required`;
      if (d.idNumber.trim() && !parseSaId(d.idNumber).valid) e[`dep-${d.key}-idNumber`] = parseSaId(d.idNumber).error!;
      if (d.contactNumber.trim() && !isValidSaPhone(d.contactNumber)) e[`dep-${d.key}-contactNumber`] = 'Invalid phone number';
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const resetForm = () => {
    setFirstName(''); setSurname(''); setIdNumber(''); setDateOfBirth(''); setPhone(''); setEmail('');
    setAddress(''); setCulturalPreferences(''); setSelectedPlanId(''); setPolicyStartDate(''); setStatus('active');
    setDependants([]); setPendingDocs([]); setDocType(CLIENT_DOCUMENT_TYPES[0].type); setErrors({}); setFormError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setFormError(null);
    if (!validate()) {
      toast.error('Please fix the highlighted fields.');
      return;
    }
    if (!parlorId) {
      setFormError('Parlor is not loaded yet. Please try again.');
      return;
    }

    setIsSubmitting(true);
    let createdClientId: string | null = null;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to create a client');

      const cleanId = idNumber.replace(/\s/g, '');

      // Prevent duplicate policy holders in this parlour.
      if (cleanId) {
        const { data: existing } = await supabase
          .from('clients')
          .select('id, name')
          .eq('parlor_id', parlorId)
          .eq('id_number', cleanId)
          .maybeSingle();
        if (existing) throw new Error(`A client with this ID number already exists (${existing.name}).`);
      }

      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .insert({
          name: `${firstName.trim()} ${surname.trim()}`,
          relationship: 'Policy Holder',
          id_number: cleanId || null,
          date_of_birth: dateOfBirth || null,
          email: email.trim() || null,
          phone: phone.replace(/[\s-]/g, ''),
          address: address.trim() || null,
          cultural_preferences: culturalPreferences.trim() || null,
          plan_id: selectedPlanId || null,
          policy_start_date: policyStartDate || null,
          status,
          user_id: user.id,
          parlor_id: parlorId,
        })
        .select()
        .single();
      if (clientError) throw clientError;
      createdClientId = clientData.id;

      let insertedDependants: any[] = [];
      if (dependants.length > 0) {
        const { data: depData, error: depError } = await supabase
          .from('dependants')
          .insert(
            dependants.map((d) => ({
              client_id: clientData.id,
              name: d.name.trim(),
              relationship: d.relationship,
              date_of_birth: d.dateOfBirth || null,
              id_number: d.idNumber.replace(/\s/g, '') || null,
              contact_number: d.contactNumber.replace(/[\s-]/g, '') || null,
            })),
          )
          .select();
        if (depError) throw depError;
        insertedDependants = depData || [];
      }

      // Documents: the client already exists at this point, so a failed
      // upload is reported but doesn't undo the client.
      const failedUploads: string[] = [];
      for (const doc of pendingDocs) {
        try {
          await uploadClientDocument({ clientId: clientData.id, documentType: doc.documentType, file: doc.file, userId: user.id });
        } catch (uploadErr) {
          console.error('Document upload failed:', uploadErr);
          failedUploads.push(doc.file.name);
        }
      }

      if (failedUploads.length > 0) {
        toast.error(`Client saved, but these documents failed to upload: ${failedUploads.join(', ')}. Upload them from the client's profile.`, { duration: 8000 });
      } else {
        toast.success('Client added successfully!');
      }

      onClientAdded({
        ...(clientData as Client),
        plan: selectedPlan,
        dependants: insertedDependants,
        document_count: pendingDocs.length - failedUploads.length,
      });
      resetForm();
      onClose();
    } catch (err: any) {
      console.error('Error adding client:', err);
      // Roll back a half-created client so a retry doesn't create duplicates.
      // Only admins may delete clients (RLS), so for staff this can fail —
      // in that case say so rather than inviting a duplicate retry.
      if (createdClientId) {
        const { error: rollbackError } = await supabase.from('clients').delete().eq('id', createdClientId);
        if (rollbackError) {
          const msg = `The client was saved, but adding dependants failed (${err.message}). Don't save again — open the client and add the dependants from their profile.`;
          setFormError(msg);
          toast.error(msg, { duration: 10000 });
          setIsSubmitting(false);
          return;
        }
      }
      setFormError(err.message || 'Failed to add client');
      toast.error(err.message || 'Failed to add client');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const docLabel = (type: string) => CLIENT_DOCUMENT_TYPES.find((d) => d.type === type)?.label || type;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="rounded-lg shadow-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 relative">
        <button onClick={handleClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" aria-label="Close">
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold mb-6 text-slate-900 dark:text-white">Add New Client</h2>

        <form onSubmit={handleSubmit} className="space-y-8" noValidate>
          {/* Section 1 — Policy holder */}
          <section className="border-b border-gray-200 dark:border-gray-700 pb-6">
            <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white flex items-center">
              <Users className="w-5 h-5 mr-2" /> Policy Holder Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>First name *</label>
                <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputCls} />
                {errors.firstName && <p className={errCls}>{errors.firstName}</p>}
              </div>
              <div>
                <label className={labelCls}>Surname *</label>
                <input type="text" value={surname} onChange={(e) => setSurname(e.target.value)} className={inputCls} />
                {errors.surname && <p className={errCls}>{errors.surname}</p>}
              </div>
              <div>
                <label className={labelCls}>SA ID number</label>
                <input type="text" inputMode="numeric" maxLength={13} value={idNumber} onChange={(e) => handleIdChange(e.target.value.replace(/\D/g, ''))} className={inputCls} placeholder="13 digits (recommended)" />
                {errors.idNumber && <p className={errCls}>{errors.idNumber}</p>}
              </div>
              <div>
                <label className={labelCls}>Date of birth</label>
                <input type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className={inputCls} />
                <p className="text-xs text-gray-500 mt-1">Filled in automatically from a valid ID number.</p>
              </div>
              <div>
                <label className={labelCls}>Phone number *</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} placeholder="0821234567" />
                {errors.phone && <p className={errCls}>{errors.phone}</p>}
              </div>
              <div>
                <label className={labelCls}>Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="Used for quotes and payment links" />
                {errors.email && <p className={errCls}>{errors.email}</p>}
              </div>
              <div className="md:col-span-2">
                <label className={labelCls}>Address</label>
                <GoogleAddressAutocomplete
                  value={address}
                  onChange={setAddress}
                  apiKey={import.meta.env.VITE_GOOGLE_PLACES_API_KEY}
                  placeholder="Enter address..."
                  className="w-full"
                />
              </div>
              <div className="md:col-span-2">
                <label className={labelCls}>Cultural / religious preferences</label>
                <textarea rows={2} value={culturalPreferences} onChange={(e) => setCulturalPreferences(e.target.value)} className={inputCls} placeholder="e.g. Christian service, burial within 3 days, home vigil" />
              </div>
            </div>
          </section>

          {/* Section 2 — Plan */}
          <section className="border-b border-gray-200 dark:border-gray-700 pb-6">
            <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white flex items-center">
              <Shield className="w-5 h-5 mr-2" /> Funeral Plan
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Plan</label>
                <select value={selectedPlanId} onChange={(e) => setSelectedPlanId(e.target.value)} className={inputCls}>
                  <option value="">No plan</option>
                  {plans.map((plan) => (
                    <option key={plan.id} value={plan.id}>{plan.name}</option>
                  ))}
                </select>
                {plans.length === 0 && <p className="text-xs text-gray-500 mt-1">No active plans set up for this parlour yet.</p>}
              </div>
              {selectedPlan ? (
                <div className="space-y-1 text-sm bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Monthly premium</span><span className="font-medium text-slate-900 dark:text-white">{formatZar(selectedPlan.monthly_premium)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-400">Cover amount</span><span className="font-medium text-slate-900 dark:text-white">{formatZar(selectedPlan.cover_amount)}</span></div>
                  {selectedPlan.description && <p className="text-xs text-gray-500 pt-1">{selectedPlan.description}</p>}
                </div>
              ) : <div />}
              <div>
                <label className={labelCls}>Policy start date</label>
                <input type="date" value={policyStartDate} onChange={(e) => setPolicyStartDate(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className={labelCls}>Policy status</label>
                <select value={status} onChange={(e) => setStatus(e.target.value as any)} className={inputCls}>
                  {CLIENT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>
          </section>

          {/* Section 3 — Dependants */}
          <section className="border-b border-gray-200 dark:border-gray-700 pb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center">
                <Users className="w-5 h-5 mr-2" /> Dependants ({dependants.length})
              </h3>
              <button type="button" onClick={addDependant} className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center text-sm">
                <Plus className="w-4 h-4 mr-1" /> Add dependant
              </button>
            </div>
            {dependants.length === 0 && <p className="text-sm text-gray-500">No dependants added.</p>}
            {dependants.map((d, i) => (
              <div key={d.key} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-slate-900 dark:text-white">Dependant {i + 1}</span>
                  <button type="button" onClick={() => removeDependant(d.key)} className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded" aria-label="Remove dependant">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className={labelCls}>Full name *</label>
                    <input type="text" value={d.name} onChange={(e) => updateDependant(d.key, 'name', e.target.value)} className={smallInputCls} />
                    {errors[`dep-${d.key}-name`] && <p className={errCls}>Required</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Relationship *</label>
                    <select value={d.relationship} onChange={(e) => updateDependant(d.key, 'relationship', e.target.value)} className={smallInputCls}>
                      <option value="">Select…</option>
                      {DEPENDANT_RELATIONSHIPS.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                    {errors[`dep-${d.key}-relationship`] && <p className={errCls}>Required</p>}
                  </div>
                  <div>
                    <label className={labelCls}>SA ID number</label>
                    <input type="text" inputMode="numeric" maxLength={13} value={d.idNumber} onChange={(e) => updateDependant(d.key, 'idNumber', e.target.value.replace(/\D/g, ''))} className={smallInputCls} />
                    {errors[`dep-${d.key}-idNumber`] && <p className={errCls}>{errors[`dep-${d.key}-idNumber`]}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>Date of birth</label>
                    <input type="date" value={d.dateOfBirth} onChange={(e) => updateDependant(d.key, 'dateOfBirth', e.target.value)} className={smallInputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Contact number</label>
                    <input type="tel" value={d.contactNumber} onChange={(e) => updateDependant(d.key, 'contactNumber', e.target.value)} className={smallInputCls} />
                    {errors[`dep-${d.key}-contactNumber`] && <p className={errCls}>{errors[`dep-${d.key}-contactNumber`]}</p>}
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* Section 4 — Documents */}
          <section className="pb-2">
            <h3 className="text-lg font-semibold mb-1 text-slate-900 dark:text-white flex items-center">
              <FileText className="w-5 h-5 mr-2" /> Initial Documents (optional)
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">PDF, DOC, DOCX, JPG or PNG up to 5MB. You can also add these later from the client's profile.</p>
            <div className="flex flex-col sm:flex-row gap-3 sm:items-end">
              <div className="flex-1">
                <label className={labelCls}>Document type</label>
                <select value={docType} onChange={(e) => setDocType(e.target.value)} className={inputCls}>
                  {CLIENT_DOCUMENT_TYPES.map((t) => <option key={t.type} value={t.type}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <input type="file" multiple accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={handleFiles} className="hidden" id="client-doc-upload" />
                <label htmlFor="client-doc-upload" className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 cursor-pointer inline-flex items-center">
                  <Upload className="w-4 h-4 mr-2" /> Choose files
                </label>
              </div>
            </div>
            {pendingDocs.length > 0 && (
              <ul className="mt-4 space-y-2">
                {pendingDocs.map((doc) => (
                  <li key={doc.key} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-2 rounded-lg text-sm">
                    <span className="truncate text-slate-900 dark:text-white">
                      <span className="text-gray-500">{docLabel(doc.documentType)}:</span> {doc.file.name}
                    </span>
                    <button type="button" onClick={() => setPendingDocs((p) => p.filter((x) => x.key !== doc.key))} className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded" aria-label="Remove file">
                      <X className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {formError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <strong className="font-bold">Error: </strong>{formError}
            </div>
          )}

          <div className="flex justify-end space-x-4">
            <button type="button" onClick={handleClose} className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-2">
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? 'Saving…' : 'Save Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddClientModal;
