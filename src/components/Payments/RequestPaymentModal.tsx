import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { startCheckout } from '@easypaypt/checkout-sdk';
import { supabase } from '../../supabaseClient'; // Assuming this is the correct path

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
      const manifest = await getCheckoutManifest(parseFloat(amount), description);
      
      // Hide the initial form and show the checkout container
      const form = document.getElementById('request-payment-form');
      if (form) form.style.display = 'none';

      checkoutInstance = startCheckout(manifest, {
        id: 'easypay-checkout-form',
        testing: true, // Use testing mode
        onSuccess: (result) => {
          console.log('Payment successful:', result);
          alert('Payment process completed successfully!');
          onClose(); // Close the modal on success
        },
        onClose: () => {
          console.log('Checkout closed by user.');
          onClose(); // Close the modal if the user closes the checkout UI
        }
      });

    } catch (error) {
      console.error('Failed to initiate payment:', error);
      alert('Failed to initiate payment. Please try again.');
      setIsProcessing(false);
    } 
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md relative transition-colors duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-6">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Request Payment</h2>
          <p className="text-slate-600 dark:text-gray-300 mb-6">Enter payment details to generate a payment request</p>
          
          <form id="request-payment-form" onSubmit={handleRequestPayment} className="space-y-4">
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
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
              <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
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

            <div id="checkout-container" className="hidden">
              <p className="text-sm text-slate-600 dark:text-gray-300 mb-4">Complete your payment using the form below:</p>
              <div id="easypay-checkout" className="w-full"></div>
            </div>

            <div id="form-actions" className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 dark:border-gray-600 rounded-lg text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
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
