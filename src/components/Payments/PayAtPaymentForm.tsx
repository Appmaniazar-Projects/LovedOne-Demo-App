import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Loader2, Copy, CheckCircle2, ExternalLink } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { supabase } from '../../supabaseClient';
import { invokeFunction } from './payatAdmin';
import type { CreatePayAtPaymentResponse } from '../../types/payments';

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
  // Pay@ needs the payer's name. With a client selected, the edge function
  // fills it (and phone/email) from the client record.
  const [customerName, setCustomerName] = useState('');
  const [step, setStep] = useState<Step>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reference, setReference] = useState<string | null>(null);
  const [paymentLink, setPaymentLink] = useState<string | null>(null);
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
      const data = await invokeFunction<CreatePayAtPaymentResponse>('create-payat-reference', {
        parlorId, caseId, clientId, amount: parsedAmount, description,
        customerNameSurname: customerName.trim() || undefined,
      });

      if (!data?.paymentId || !data?.reference) throw new Error('Unexpected response from Pay@ reference service');

      
      setReference(data.reference);
      setPaymentLink(data.paymentLink || null);
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

  const copyLink = () => {
    if (!paymentLink) return;
    navigator.clipboard.writeText(paymentLink);
    toast.success('Payment link copied.');
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
        {!clientId && (
          <div>
            <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1">Customer name</label>
            <input
              type="text" required value={customerName} onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Name and surname of the person paying"
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-900 dark:text-white"
            />
          </div>
        )}
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
          The family can pay with this reference at any Pay@ till or in their banking app, or online using the link or QR code.
          {clientId && ' If the client has a phone number or email on file, Pay@ also sends them the link.'}
        </p>
        <div className="flex items-center justify-center gap-2 py-4 px-4 bg-slate-50 dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700">
          <span className="text-2xl font-mono font-bold tracking-wider text-slate-900 dark:text-white">{reference}</span>
          <button onClick={copyReference} className="text-blue-600 dark:text-blue-400">
            <Copy className="w-5 h-5" />
          </button>
        </div>
        {paymentLink && (
          <div className="flex flex-col items-center gap-3">
            <div className="p-3 bg-white rounded-lg border border-slate-200">
              <QRCodeSVG value={paymentLink} size={160} />
            </div>
            <div className="flex items-center gap-4 text-sm">
              <button onClick={copyLink} className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                <Copy className="w-4 h-4" />
                Copy payment link
              </button>
              <a
                href={paymentLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
              >
                <ExternalLink className="w-4 h-4" />
                Open
              </a>
            </div>
          </div>
        )}
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