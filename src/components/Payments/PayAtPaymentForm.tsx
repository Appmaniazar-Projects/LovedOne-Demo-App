import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Loader2, Copy, CheckCircle2 } from 'lucide-react';
import { supabase } from '../../supabaseClient';

interface ProviderFormProps {
  parlorId: string;
  caseId?: string;
  clientId?: string;
  onCancel: () => void;
  onDone: () => void;
}

type Step = 'form' | 'awaiting_payment' | 'paid';

const PayAtPaymentForm: React.FC<ProviderFormProps> = ({ parlorId, caseId, clientId, onCancel, onDone }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [step, setStep] = useState<Step>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reference, setReference] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  useEffect(() => {
    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, []);

  const handleGenerateReference = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast.error('Please enter a valid amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      // Reference generation happens server-side (edge function) so the
      // Pay@ prefix and numeric-suffix logic never touch the client.
      const { data, error } = await supabase.functions.invoke('create-payat-reference', {
        body: { parlorId, caseId, clientId, amount: parsedAmount, description },
      });

      if (error) throw new Error(error.message || 'Failed to generate Pay@ reference');
      if (!data?.paymentId || !data?.reference) throw new Error('Unexpected response from Pay@ reference service');

      
      setReference(data.reference);
      setExpiresAt(data.expiresAt || null);
      setStep('awaiting_payment');
      subscribeToPaymentUpdates(data.paymentId);
    } catch (err: any) {
      console.error('Failed to generate Pay@ reference', err);
      toast.error(err?.message || 'Failed to generate Pay@ reference.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const subscribeToPaymentUpdates = (id: string) => {
    const channel = supabase
      .channel(`payat-payment:${id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'payments', filter: `id=eq.${id}` },
        (payload) => {
          const status = (payload.new as any)?.status;
          if (status === 'paid') {
            setStep('paid');
            toast.success('Payment confirmed by Pay@.');
          } else if (status === 'failed' || status === 'expired' || status === 'cancelled') {
            toast.error(`Payment ${status}.`);
          }
        },
      )
      .subscribe();

    channelRef.current = channel;
  };

  const copyReference = () => {
    if (!reference) return;
    navigator.clipboard.writeText(reference);
    toast.success('Reference copied.');
  };

  if (step === 'form') {
    return (
      <form onSubmit={handleGenerateReference} className="space-y-4">
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
        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onCancel} className="px-4 py-2 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-900 dark:text-white">
            Back
          </button>
          <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">
            {isSubmitting ? 'Generating…' : 'Generate Pay@ Reference'}
          </button>
        </div>
      </form>
    );
  }

  if (step === 'awaiting_payment') {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-slate-600 dark:text-gray-300">
          Give this reference to the customer to pay at any Pay@ retail store, or via the Pay@ app / QR.
        </p>
        <div className="flex items-center justify-center gap-2 py-4 px-4 bg-slate-50 dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700">
          <span className="text-2xl font-mono font-bold tracking-wider text-slate-900 dark:text-white">{reference}</span>
          <button onClick={copyReference} className="text-blue-600 dark:text-blue-400">
            <Copy className="w-5 h-5" />
          </button>
        </div>
        {expiresAt && (
          <p className="text-xs text-slate-500">Expires {new Date(expiresAt).toLocaleString()}</p>
        )}
        <div className="flex items-center justify-center gap-2 text-slate-500 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Waiting for payment confirmation…
        </div>
        <button
          onClick={onDone}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          Done — I'll check back later
        </button>
      </div>
    );
  }

  // step === 'paid'
  return (
    <div className="space-y-4 text-center py-4">
      <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
      <p className="text-lg font-medium text-slate-900 dark:text-white">Payment received</p>
      <button onClick={onDone} className="px-4 py-2 bg-blue-600 text-white rounded-lg">
        Close
      </button>
    </div>
  );
};

export default PayAtPaymentForm;