import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { supabase } from '../../supabaseClient';

interface ProviderFormProps {
  parlorId: string;
  caseId?: string;
  clientId?: string;
  onCancel: () => void;
  onDone: () => void;
}

const EftPaymentForm: React.FC<ProviderFormProps> = ({ parlorId, caseId, clientId, onCancel, onDone }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [reference, setReference] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast.error('Please enter a valid amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: created, error } = await supabase
        .from('payments')
        .insert({
          parlor_id: parlorId,
          case_id: caseId || null,
          client_id: clientId || null,
          description,
          amount: parsedAmount,
          method: proofFile ? 'pop' : 'eft',
          status: 'pending', // waits for staff to confirm funds landed
          transaction_id: reference || null,
        })
        .select('id')
        .single();

      if (error) throw error;

      if (proofFile && clientId) {
        const filePath = `${clientId}/${Date.now()}_${proofFile.name}`;
        const { error: uploadError } = await supabase.storage.from('client-documents').upload(filePath, proofFile);

        if (uploadError) {
          console.error('Failed to upload proof file', uploadError);
          toast.error('Payment created, but proof upload failed. Attach it manually later.');
        } else {
          const { data: publicUrlData } = supabase.storage.from('client-documents').getPublicUrl(filePath);
          const { data: userRes } = await supabase.auth.getUser();

          await supabase.from('client_documents').insert({
            client_id: clientId,
            document_type: 'proof_of_payment',
            file_name: proofFile.name,
            file_url: publicUrlData.publicUrl,
            file_size: proofFile.size,
            uploaded_by: userRes?.user?.id || null,
            notes: `Proof for payment ${created?.id || ''}`,
          });
        }
      }

      toast.success('EFT payment request created.');
      onDone();
    } catch (err: any) {
      console.error('Failed to create EFT payment', err);
      toast.error(err?.message || 'Failed to create payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1">Amount (ZAR)</label>
        <input
          type="number" step="0.01" min="0" required
          value={amount} onChange={(e) => setAmount(e.target.value)}
          className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-900 dark:text-white"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1">Description</label>
        <textarea
          rows={2} required value={description} onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-900 dark:text-white"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1">Bank Reference</label>
        <input
          type="text" value={reference} onChange={(e) => setReference(e.target.value)}
          className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-900 dark:text-white"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1">Proof of Payment (optional)</label>
        <input
          type="file" accept="image/*,application/pdf"
          onChange={(e) => setProofFile(e.target.files ? e.target.files[0] : null)}
          className="w-full text-sm text-slate-700 dark:text-gray-300"
        />
        {!clientId && proofFile && (
          <p className="text-xs text-amber-600 mt-1">No client linked to this case — the file will be skipped.</p>
        )}
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-900 dark:text-white">
          Back
        </button>
        <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">
          {isSubmitting ? 'Creating…' : 'Create Payment Request'}
        </button>
      </div>
    </form>
  );
};

export default EftPaymentForm;
