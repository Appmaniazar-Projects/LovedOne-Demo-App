import React, { useState } from 'react';
import { Plus, Edit, Trash2, Save, X, Users2, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../supabaseClient';
import { parseSaId, isValidSaPhone, ageFromDob } from '../../utils/saId';
import { DEPENDANT_RELATIONSHIPS, formatDate } from './clientShared';

export interface DependantRow {
  id: string;
  client_id: string;
  name: string;
  relationship: string;
  date_of_birth: string | null;
  id_number: string | null;
  contact_number: string | null;
  email: string | null;
  notes: string | null;
}

interface Props {
  clientId: string;
  dependants: DependantRow[];
  canDelete: boolean;
  onChange: (next: DependantRow[]) => void;
}

type Draft = { name: string; relationship: string; date_of_birth: string; id_number: string; contact_number: string };
const emptyDraft: Draft = { name: '', relationship: '', date_of_birth: '', id_number: '', contact_number: '' };

const cell = 'px-2 py-1.5 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-900 dark:text-white rounded text-sm w-full';

const DependantsSection: React.FC<Props> = ({ clientId, dependants, canDelete, onChange }) => {
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [saving, setSaving] = useState(false);

  const startEdit = (d?: DependantRow) => {
    setEditingId(d ? d.id : 'new');
    setDraft(
      d
        ? { name: d.name, relationship: d.relationship, date_of_birth: d.date_of_birth || '', id_number: d.id_number || d.notes?.match(/^ID:\s*(\d{13})/)?.[1] || '', contact_number: d.contact_number || '' }
        : emptyDraft,
    );
  };

  const setField = (field: keyof Draft, value: string) => {
    setDraft((prev) => {
      const next = { ...prev, [field]: value };
      if (field === 'id_number') {
        const info = parseSaId(value);
        if (info.valid && info.dateOfBirth) next.date_of_birth = info.dateOfBirth;
      }
      return next;
    });
  };

  const save = async () => {
    if (!draft.name.trim() || !draft.relationship) {
      toast.error('Name and relationship are required.');
      return;
    }
    if (draft.id_number && !parseSaId(draft.id_number).valid) {
      toast.error(parseSaId(draft.id_number).error || 'Invalid ID number');
      return;
    }
    if (draft.contact_number && !isValidSaPhone(draft.contact_number)) {
      toast.error('Invalid contact number');
      return;
    }

    const payload = {
      name: draft.name.trim(),
      relationship: draft.relationship,
      date_of_birth: draft.date_of_birth || null,
      id_number: draft.id_number || null,
      contact_number: draft.contact_number.replace(/[\s-]/g, '') || null,
    };

    setSaving(true);
    try {
      if (editingId === 'new') {
        const { data, error } = await supabase.from('dependants').insert({ ...payload, client_id: clientId }).select().single();
        if (error) throw error;
        onChange([...dependants, data as DependantRow]);
        toast.success('Dependant added');
      } else if (editingId) {
        const { data, error } = await supabase.from('dependants').update(payload).eq('id', editingId).select().single();
        if (error) throw error;
        onChange(dependants.map((d) => (d.id === editingId ? (data as DependantRow) : d)));
        toast.success('Dependant updated');
      }
      setEditingId(null);
    } catch (err: any) {
      console.error('Failed to save dependant', err);
      toast.error(err.message || 'Failed to save dependant');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (d: DependantRow) => {
    if (!window.confirm(`Remove ${d.name} as a dependant?`)) return;
    const { error } = await supabase.from('dependants').delete().eq('id', d.id);
    if (error) {
      toast.error(error.message || 'Failed to remove dependant');
      return;
    }
    onChange(dependants.filter((x) => x.id !== d.id));
    toast.success('Dependant removed');
  };

  const editRow = (
    <tr className="bg-blue-50/50 dark:bg-blue-900/10">
      <td className="p-2"><input className={cell} value={draft.name} onChange={(e) => setField('name', e.target.value)} placeholder="Full name *" /></td>
      <td className="p-2">
        <select className={cell} value={draft.relationship} onChange={(e) => setField('relationship', e.target.value)}>
          <option value="">Relationship *</option>
          {DEPENDANT_RELATIONSHIPS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </td>
      <td className="p-2"><input className={cell} inputMode="numeric" maxLength={13} value={draft.id_number} onChange={(e) => setField('id_number', e.target.value.replace(/\D/g, ''))} placeholder="SA ID" /></td>
      <td className="p-2"><input className={cell} type="date" value={draft.date_of_birth} onChange={(e) => setField('date_of_birth', e.target.value)} /></td>
      <td className="p-2"><input className={cell} type="tel" value={draft.contact_number} onChange={(e) => setField('contact_number', e.target.value)} placeholder="Contact" /></td>
      <td className="p-2 whitespace-nowrap text-right">
        <button onClick={save} disabled={saving} className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded disabled:opacity-50" aria-label="Save">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        </button>
        <button onClick={() => setEditingId(null)} className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" aria-label="Cancel">
          <X className="w-4 h-4" />
        </button>
      </td>
    </tr>
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
          <Users2 className="w-5 h-5 mr-2 text-blue-600" /> Dependants ({dependants.length})
        </h2>
        {editingId === null && (
          <button onClick={() => startEdit()} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm inline-flex items-center">
            <Plus className="w-4 h-4 mr-1" /> Add dependant
          </button>
        )}
      </div>

      {dependants.length === 0 && editingId !== 'new' ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">No dependants on this policy.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <th className="p-2 font-medium">Name</th>
                <th className="p-2 font-medium">Relationship</th>
                <th className="p-2 font-medium">ID number</th>
                <th className="p-2 font-medium">Date of birth</th>
                <th className="p-2 font-medium">Contact</th>
                <th className="p-2" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {dependants.map((d) =>
                editingId === d.id ? (
                  <React.Fragment key={d.id}>{editRow}</React.Fragment>
                ) : (
                  <tr key={d.id} className="text-gray-800 dark:text-gray-200">
                    <td className="p-2 font-medium">{d.name}</td>
                    <td className="p-2">{d.relationship}</td>
                    <td className="p-2 font-mono">{d.id_number || '—'}</td>
                    <td className="p-2">
                      {d.date_of_birth ? `${formatDate(d.date_of_birth)} (${ageFromDob(d.date_of_birth)})` : '—'}
                    </td>
                    <td className="p-2">{d.contact_number || '—'}</td>
                    <td className="p-2 whitespace-nowrap text-right">
                      {editingId === null && (
                        <>
                          <button onClick={() => startEdit(d)} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded" aria-label={`Edit ${d.name}`}>
                            <Edit className="w-4 h-4" />
                          </button>
                          {canDelete && (
                            <button onClick={() => remove(d)} className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded" aria-label={`Remove ${d.name}`}>
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ),
              )}
              {editingId === 'new' && editRow}
            </tbody>
          </table>
          {dependants.some((d) => !d.id_number && d.notes?.startsWith('ID:')) && (
            <p className="text-xs text-amber-600 mt-2">Some older dependants have their ID number saved in notes. Edit them to move it into the ID field.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default DependantsSection;
