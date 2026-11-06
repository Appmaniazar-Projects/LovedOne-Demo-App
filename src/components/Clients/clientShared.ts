import { supabase } from '../../supabaseClient';
import { slugify } from '../../utils/slugify';

export const DEPENDANT_RELATIONSHIPS = ['Spouse', 'Child', 'Parent', 'Parent-in-law', 'Sibling', 'Grandchild', 'Extended Family', 'Other'];

export const CLIENT_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'lapsed', label: 'Lapsed' },
  { value: 'deceased', label: 'Deceased' },
] as const;

// Single source of truth for document types (also used by ClientDocuments).
export const CLIENT_DOCUMENT_TYPES = [
  { type: 'id_document', label: 'ID Document', description: 'Valid South African ID or Passport' },
  { type: 'proof_of_residence', label: 'Proof of Residence', description: 'Recent utility bill or bank statement' },
  { type: 'death_certificate', label: 'Death Certificate', description: 'Official death certificate (if applicable)' },
  { type: 'insurance_policy', label: 'Insurance Policy', description: 'Funeral insurance policy documents' },
  { type: 'marriage_certificate', label: 'Marriage Certificate', description: 'Marriage certificate (if applicable)' },
  { type: 'birth_certificate', label: 'Birth Certificate', description: 'Birth certificate (e.g. for child dependants)' },
  { type: 'other', label: 'Other Documents', description: 'Any additional supporting documents' },
];

export const STORAGE_BUCKET = 'clients';
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png']);

export function validateDocumentFile(file: File): string | null {
  if (file.size > MAX_UPLOAD_BYTES) return `${file.name} is larger than 5MB.`;
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (!ALLOWED_EXTENSIONS.has(ext)) return `${file.name}: only PDF, DOC, DOCX, JPG or PNG files are allowed.`;
  return null;
}

/** Upload one file to storage and record it in client_documents. */
export async function uploadClientDocument(params: {
  clientId: string;
  documentType: string;
  file: File;
  userId: string;
  notes?: string;
}) {
  const { clientId, documentType, file, userId, notes } = params;
  const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
  const path = `${clientId}/${documentType}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, file, { contentType: file.type || undefined, upsert: false });
  if (uploadError) throw uploadError;

  const { error: dbError } = await supabase.from('client_documents').insert({
    client_id: clientId,
    document_type: documentType,
    file_name: file.name,
    file_url: path,
    file_size: file.size,
    uploaded_by: userId,
    notes: notes || null,
  });
  if (dbError) {
    await supabase.storage.from(STORAGE_BUCKET).remove([path]);
    throw dbError;
  }
}

/**
 * URL segment for a client: readable name + id, so two clients with the
 * same name never open each other's record. e.g. "thabo-nkosi--<uuid>"
 */
export const clientSlug = (client: { id: string; name: string }) => `${slugify(client.name)}--${client.id}`;

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const clientIdFromSlug = (slug: string): string | null => {
  const m = slug.match(UUID_RE);
  return m ? m[0] : null;
};

export const formatZar = (n: number | string | null | undefined) =>
  new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(Number(n || 0));

export const formatDate = (d?: string | null) =>
  d ? new Date(d).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' }) : '—';
