import React, { useState, useEffect } from 'react';
import { X, RefreshCw } from 'lucide-react';
import {
  Payment,
  MANUALLY_UPDATABLE_METHODS,
  getPaymentMethodLabel,
  isPayAtMethod,
} from '../../types/payments';
import { supabase } from '../../supabaseClient';
import { toast } from 'react-hot-toast';
import { usePaymentStatus } from '../../hooks/usePaymentStatus';
import PayAtRequestDetails from './PayAtRequestDetails';

interface ViewPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment | null;
}

const ViewPaymentModal: React.FC<ViewPaymentModalProps> = ({ isOpen, onClose, payment: initialPayment }) => {
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [checking, setChecking] = useState(false);

  // Pay@ payments are settled by Pay@, so keep them live (Realtime + polling)
  // and allow an on-demand status check.
  const isPayAt = !!initialPayment && isPayAtMethod(initialPayment.method);
  const live = usePaymentStatus(isOpen && isPayAt && initialPayment ? initialPayment.id : null);
  const payment = isPayAt && live.payment && live.payment.id === initialPayment!.id
    ? { ...initialPayment!, ...live.payment, createdAt: initialPayment!.createdAt }
    : initialPayment;

  const handleCheckStatus = async () => {
    setChecking(true);
    await live.refresh();
    setChecking(false);
    toast.success('Status refreshed.');
  };
  const [documents, setDocuments] = useState<any[]>([]);

  useEffect(() => {
    const fetchDocs = async () => {
      if (!initialPayment?.clientId) return;
      try {
        const { data } = await supabase
          .from('client_documents')
          .select('*')
          .eq('client_id', initialPayment.clientId)
          .eq('document_type', 'proof_of_payment')
          .order('uploaded_at', { ascending: false });

        if (data) setDocuments(data as any[]);
      } catch (e) {
        console.error('Failed to fetch payment documents', e);
      }
    };

    fetchDocs();
  }, [initialPayment]);

  if (!isOpen || !payment) return null;

  // Never allow manual status changes on gateway (Pay@) payments.
  const canManuallyUpdate = !isPayAt && MANUALLY_UPDATABLE_METHODS.includes(payment.method);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }).format(amount);

  const formatDate = (dateValue: string) =>
    new Date(dateValue).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'refunded': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      case 'reversed': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
      case 'expired': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const methodLabel = getPaymentMethodLabel;

  const updatePaymentStatus = async (nextStatus: Payment['status']) => {
    if (!payment?.id) return;
    setIsUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from('payments')
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', payment.id);

      if (error) {
        toast.error(error.message || 'Failed to update payment status');
        return;
      }

      toast.success('Payment status updated');
      onClose();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update payment status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto relative transition-colors duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Payment Details</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(payment.status)}`}>
              {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
            </span>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-slate-500 dark:text-gray-300 mb-1">Description</h3>
              <p className="text-lg text-slate-900 dark:text-white">{payment.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-gray-300 mb-1">Amount</h3>
                <p className="text-xl font-semibold text-slate-900 dark:text-white">{formatCurrency(payment.amount)}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-gray-300 mb-1">Payment Method</h3>
                <p className="text-lg text-slate-900 dark:text-white">{methodLabel(payment.method)}</p>
              </div>

              {payment.paymentReference && !isPayAt && (
                <div>
                  <h3 className="text-sm font-medium text-slate-500 dark:text-gray-300 mb-1">
                    {isPayAtMethod(payment.method) ? 'Pay@ Reference' : 'Reference'}
                  </h3>
                  <p className="text-lg text-slate-900 dark:text-white font-mono">{payment.paymentReference}</p>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-gray-300 mb-1">Transaction ID</h3>
                <p className="text-lg text-slate-900 dark:text-white font-mono">{payment.transactionId || 'N/A'}</p>
              </div>

              {payment.caseId && (
                <div>
                  <h3 className="text-sm font-medium text-slate-500 dark:text-gray-300 mb-1">Case ID</h3>
                  <p className="text-lg text-slate-900 dark:text-white">{payment.caseId}</p>
                </div>
              )}
            </div>

            {isPayAt && (
              <div className="pt-4 border-t border-slate-200 dark:border-gray-700 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Pay@ payment request</h3>
                  <button
                    onClick={handleCheckStatus}
                    disabled={checking}
                    className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} /> Check status
                  </button>
                </div>
                {payment.status === 'paid' ? (
                  <p className="text-sm text-slate-700 dark:text-gray-200">
                    Paid via Pay@{payment.paidAt ? ` on ${formatDate(payment.paidAt)}` : ''}.
                    {payment.accountNumber || payment.paymentReference ? ` Reference: ${payment.accountNumber || payment.paymentReference}` : ''}
                  </p>
                ) : payment.status === 'pending' || payment.status === 'awaiting_confirmation' ? (
                  <PayAtRequestDetails
                    accountNumber={payment.accountNumber}
                    reference={payment.paymentReference || payment.reference}
                    paymentLink={payment.paymentLink}
                    expiresAt={payment.expiresAt}
                    amount={payment.amount}
                    description={payment.description}
                  />
                ) : (
                  <p className="text-sm text-slate-700 dark:text-gray-200">
                    This Pay@ request is {payment.status}. Create a new Pay@ request from Payments → Request Payment if the customer still needs to pay.
                  </p>
                )}
              </div>
            )}

            <div className="pt-4 border-t border-slate-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-slate-500 dark:text-gray-300 mb-1">Date Created</h3>
              <p className="text-slate-900 dark:text-gray-200">{payment.createdAt ? formatDate(payment.createdAt) : 'N/A'}</p>
            </div>

            {documents.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-slate-500 dark:text-gray-300 mb-1">Proofs / Documents</h3>
                <ul className="space-y-2">
                  {documents.map((doc) => (
                    <li key={doc.id} className="text-sm">
                      <a href={doc.file_url} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 underline">
                        {doc.file_name}
                      </a>
                      <div className="text-xs text-slate-500">Uploaded: {new Date(doc.uploaded_at).toLocaleString()}</div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-end">
            <div className="flex flex-wrap justify-end items-center gap-2">
              {canManuallyUpdate && payment.status !== 'paid' && (
                <button
                  disabled={isUpdatingStatus}
                  onClick={() => updatePaymentStatus('paid')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Mark Paid
                </button>
              )}
              {canManuallyUpdate && payment.status !== 'failed' && (
                <button
                  disabled={isUpdatingStatus}
                  onClick={() => updatePaymentStatus('failed')}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Mark Failed
                </button>
              )}
              {canManuallyUpdate && payment.status !== 'refunded' && (
                <button
                  disabled={isUpdatingStatus}
                  onClick={() => updatePaymentStatus('refunded')}
                  className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Mark Refunded
                </button>
              )}
              {!canManuallyUpdate && (
                <p className="text-sm text-slate-500 dark:text-gray-400 mr-2">
                  {isPayAtMethod(payment.method)
                    ? 'This payment updates automatically once Pay@ confirms it.'
                    : 'This payment is managed by the provider and updates automatically.'}
                </p>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewPaymentModal;