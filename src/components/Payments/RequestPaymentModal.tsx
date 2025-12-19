import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { startCheckout } from '@easypaypt/checkout-sdk';
import { supabase } from '../../supabaseClient'; // Assuming this is the correct path
import { toast } from 'react-hot-toast';

interface RequestPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// This function now calls our Supabase Edge Function to securely create a checkout session.
const getCheckoutManifest = async (amount: number, description: string) => {
  const { data, error } = await supabase.functions.invoke('create-easypay-checkout', {
    body: { amount, description },
  });

  if (error) {
    console.error('Failed to invoke Supabase function:', error);
    throw new Error(error.message || 'Failed to create checkout session');
  }

  return data;
};

const RequestPaymentModal: React.FC<RequestPaymentModalProps> = ({ isOpen, onClose }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [mode, setMode] = useState<'manual' | 'easypay'>('manual');
  let checkoutInstance: any = null;

  useEffect(() => {
    // Clean up the checkout form when the modal is closed or component unmounts
    return () => {
      if (checkoutInstance) {
        checkoutInstance.unmount();
      }
    };
  }, [checkoutInstance]);

  if (!isOpen) return null;

  const handleRequestPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const parsedAmount = parseFloat(amount);
      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        toast.error('Please enter a valid amount.');
        return;
      }

      if (mode === 'manual') {
        const { error } = await supabase
          .from('payments')
          .insert({
            amount: parsedAmount,
            description,
            method: 'eft',
            status: 'pending',
            transaction_id: null,
            case_id: null,
          });

        if (error) {
          console.error('Failed to create manual payment:', error);
          toast.error(error.message || 'Failed to create payment request.');
          return;
        }

        toast.success('Manual payment request created.');
        onClose();
        return;
      }

      const manifest = await getCheckoutManifest(parsedAmount, description);

      checkoutInstance = startCheckout(manifest, {
        id: 'easypay-checkout-form',
        testing: true,
        onSuccess: (result) => {
          console.log('Payment successful:', result);
          toast.success('Payment process completed successfully!');
          onClose();
        },
        onClose: () => {
          console.log('Checkout closed by user.');
          onClose();
        }
      });
    } catch (error) {
      console.error('Failed to initiate payment:', error);
      toast.error('Failed to initiate payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="rounded-lg shadow-2xl w-full max-w-md relative bg-white/30 dark:bg-gray-900/30 backdrop-blur-xl border border-white/20 dark:border-gray-700/50">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Request Payment</h2>
          <p className="text-slate-800 dark:text-gray-200 mb-6">Enter payment details to generate a payment request</p>
          
          <form id="request-payment-form" onSubmit={handleRequestPayment} className="space-y-4">
            <div>
              <label htmlFor="mode" className="block text-sm font-medium text-slate-900 dark:text-white mb-1">
                Payment Type
              </label>
              <select
                id="mode"
                value={mode}
                onChange={(e) => setMode(e.target.value as 'manual' | 'easypay')}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white"
              >
                <option value="manual">Manual / Offline (no gateway)</option>
                <option value="easypay">EasyPay (checkout)</option>
              </select>
            </div>

            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-slate-900 dark:text-white mb-1">
                Amount (ZAR)
              </label>
              <input
                type="number"
                id="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-900 dark:text-white mb-1">
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter a description for this payment"
                rows={3}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white"
                required
              />
            </div>

            {mode === 'easypay' && (
              <p className="text-sm text-slate-800 dark:text-gray-200">
                This will open the EasyPay checkout flow.
              </p>
            )}

            <div id="form-actions" className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isProcessing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isProcessing ? 'Processing...' : 'Request Payment'}
              </button>
            </div>
          </form>

          <div id="easypay-checkout-form" className="mt-4"></div>
        </div>
      </div>
    </div>
  );
};

export default RequestPaymentModal;
