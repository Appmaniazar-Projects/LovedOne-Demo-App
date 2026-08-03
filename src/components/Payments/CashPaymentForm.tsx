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

const CashPaymentForm: React.FC<ProviderFormProps> = ({ parlorId, caseId, clientId, onCancel, onDone }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [receiptNumber, setReceiptNumber] = useState('');
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
      const { error } = await supabase.from('payments').insert({
        parlor_id: parlorId,
        case_id: caseId || null,
        client_id: clientId || null,
        description,
        amount: parsedAmount,
        method: 'cash',
        status: 'completed', // cash is confirmed at the point of collection
        transaction_id: receiptNumber || null,
        paid_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast.success('Cash payment recorded.');
      onDone();
    } catch (err: any) {
      console.error('Failed to record cash payment', err);
      toast.error(err?.message || 'Failed to record cash payment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1">Amount Received (ZAR)</label>
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
        <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1">Receipt Number (optional)</label>
        <input
          type="text" value={receiptNumber} onChange={(e) => setReceiptNumber(e.target.value)}
          className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-900 dark:text-white"
        />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-900 dark:text-white">
          Back
        </button>
        <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50">
          {isSubmitting ? 'Recording…' : 'Complete'}
        </button>
      </div>
    </form>
  );
};

export default CashPaymentForm;
