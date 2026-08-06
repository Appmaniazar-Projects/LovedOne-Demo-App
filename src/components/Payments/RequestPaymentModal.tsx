import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { toast } from 'react-hot-toast';
import { DeceasedProfile } from '../../types';
import { normalizePaymentMethod, PaymentMethod } from '../../types/payments';

interface RequestPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  parlorId: string;
  onPaymentCreated?: () => void;
}

// This function now calls our Supabase Edge Function to securely create a checkout session.
const RequestPaymentModal: React.FC<RequestPaymentModalProps> = ({ isOpen, onClose, parlorId, onPaymentCreated }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCaseId, setSelectedCaseId] = useState('');
  const [cases, setCases] = useState<DeceasedProfile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('eft_pop');
  const [proofFile, setProofFile] = useState<File | null>(null);

  useEffect(() => {
    if (isOpen && parlorId) {
      fetchCases();
    } else if (!isOpen) {
      // Reset form when modal closes
      setSelectedCaseId('');
      setCases([]);
      setAmount('');
      setDescription('');
      setSelectedMethod('eft_pop');
    }
  }, [isOpen, parlorId]);

  const fetchCases = async () => {
    try {
      const { data, error } = await supabase
        .from('cases')
        .select('id, deceased_name, case_status, client_id, created_at')
        .eq('parlor_id', parlorId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching cases:', error);
        return;
      }

      const mappedCases: DeceasedProfile[] = (data || []).map((row: any) => ({
        id: row.id,
        name: row.deceased_name || 'Unnamed case',
        dateOfBirth: new Date(), // Default value for missing field
        dateOfDeath: new Date(), // Default value for missing field
        picture: undefined,
        serviceType: 'burial' as const, // Default value
        serviceTypeId: undefined,
        status: (row.case_status || 'quote') as any,
        assignedDirector: '',
        clientId: row.client_id || '',
        planId: undefined,
        culturalRequirements: undefined,
        createdAt: row.created_at ? new Date(row.created_at) : new Date(),
        updatedAt: new Date(),
      }));

      setCases(mappedCases);
    } catch (error) {
      console.error('Error fetching cases:', error);
    }
  };

  if (!isOpen) return null;

  const handleRequestPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      if (!parlorId) {
        toast.error('Parlor is not loaded yet. Please try again in a moment.');
        return;
      }

      const parsedAmount = parseFloat(amount);
      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
        toast.error('Please enter a valid amount.');
        return;
      }

      const normalizedMethod = normalizePaymentMethod(selectedMethod);
      const { data: createdPayment, error } = await supabase
        .from('payments')
        .insert({
          amount: parsedAmount,
          description,
          method: normalizedMethod,
          status: 'pending',
          transaction_id: null,
          case_id: selectedCaseId || null,
          parlor_id: parlorId,
        })
        .select('id')
        .single();

      if (error) {
        console.error('Failed to create manual payment:', error);
        toast.error(error.message || 'Failed to create payment request.');
        return;
      }

      if (proofFile) {
        try {
          const targetCase = cases.find(c => c.id === (selectedCaseId || ''));
          const clientId = targetCase?.clientId || null;
          const filePath = `${clientId || parlorId}/${Date.now()}_${proofFile.name}`;

          const { error: uploadError } = await supabase.storage
            .from('client-documents')
            .upload(filePath, proofFile);

          if (uploadError) {
            console.error('Failed to upload proof file:', uploadError);
            toast.error('Failed to upload proof file, but payment was created.');
          } else {
            const { data: publicUrlData } = supabase.storage.from('client-documents').getPublicUrl(filePath);

            if (clientId) {
              let uploadedBy: string | null = null;
              try {
                const userRes = await supabase.auth.getUser();
                uploadedBy = (userRes.data as any)?.user?.id || null;
              } catch (e) {
                // ignore
              }

              const { error: docError } = await supabase
                .from('client_documents')
                .insert({
                  client_id: clientId,
                  document_type: 'proof_of_payment',
                  file_name: proofFile.name,
                  file_url: publicUrlData.publicUrl,
                  file_size: proofFile.size,
                  uploaded_by: uploadedBy,
                  notes: `Proof for payment ${createdPayment?.id || ''}`
                });

              if (docError) {
                console.error('Failed to create client document record:', docError);
                toast('Payment created, file uploaded, but failed to attach document record.');
              }
            } else {
              toast.success('Payment created and proof uploaded.');
            }
          }
        } catch (e) {
          console.error('Error uploading proof file:', e);
          toast.error('Payment created but failed to upload proof file.');
        }
      }

      toast.success('Manual payment request created.');
      onPaymentCreated?.();
      onClose();
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
              <p className="text-sm text-slate-600 dark:text-gray-300 mb-4">
                Pay@ covers most gateway payment methods. Use the manual request below for offline or legacy payment tracking.
              </p>
            </div>

            <div>
              <label htmlFor="method" className="block text-sm font-medium text-slate-900 dark:text-white mb-1">
                Manual Method
              </label>
              <select
                id="method"
                value={selectedMethod}
                onChange={(e) => setSelectedMethod(e.target.value as any)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white"
              >
                <option value="eft">Bank Transfer (EFT)</option>
                <option value="payat">Pay@</option>
                <option value="pop">Upload Proof of Payment (POP)</option>
              </select>

              {(selectedMethod === 'pop' || selectedMethod === 'eft_pop' || selectedMethod === 'eft') && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-slate-900 dark:text-white mb-1">Proof of Payment</label>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setProofFile(e.target.files ? e.target.files[0] : null)}
                    className="w-full text-sm text-slate-700"
                  />
                  <p className="text-xs text-slate-500 mt-1">Upload an image or PDF of the proof of payment.</p>
                </div>
              )}
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
              <label htmlFor="case" className="block text-sm font-medium text-slate-900 dark:text-white mb-1">
                Related Case (Optional)
              </label>
              <select
                id="case"
                value={selectedCaseId}
                onChange={(e) => setSelectedCaseId(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 dark:text-white"
              >
                <option value="">No case selected</option>
                {cases.map((caseItem) => (
                  <option key={caseItem.id} value={caseItem.id}>
                    {caseItem.name} - {caseItem.status.charAt(0).toUpperCase() + caseItem.status.slice(1)}
                  </option>
                ))}
              </select>
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

        </div>
      </div>
    </div>
  );
};

export default RequestPaymentModal;