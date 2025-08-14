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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-slate-500 hover:text-slate-800">
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-bold text-slate-900 mb-4">Request a Payment</h2>
        
        <form id="request-payment-form" onSubmit={handleRequestPayment} className="space-y-4">
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-slate-700">Amount (ZAR)</label>
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="e.g., 500.00"
              required
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-700">Description</label>
            <input
              type="text"
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="e.g., Payment for services"
              required
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 disabled:bg-blue-400"
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Proceed to Easypay'}
          </button>
        </form>

        {/* This is where the Easypay Checkout form will be rendered */}
        <div id="easypay-checkout-form"></div>

      </div>
    </div>
  );
};

export default RequestPaymentModal;
