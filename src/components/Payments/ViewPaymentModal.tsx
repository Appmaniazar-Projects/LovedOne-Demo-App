import React from 'react';
import { X } from 'lucide-react';
import { Payment } from '../../types';

interface ViewPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment | null;
}

const ViewPaymentModal: React.FC<ViewPaymentModalProps> = ({ isOpen, onClose, payment }) => {
  if (!isOpen || !payment) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg relative transition-colors duration-200">
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
                <p className="text-xl font-semibold text-slate-900 dark:text-white">
                  {formatCurrency(payment.amount)}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-gray-300 mb-1">Payment Method</h3>
                <p className="text-lg text-slate-900 dark:text-white">
                  {payment.method === 'card' ? 'Credit/Debit Card' : 
                   payment.method === 'eft' ? 'Bank Transfer' : 
                   payment.method === 'snapscan' ? 'SnapScan' :
                   payment.method?.charAt(0).toUpperCase() + payment.method?.slice(1) || 'N/A'}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-slate-500 dark:text-gray-300 mb-1">Transaction ID</h3>
                <p className="text-lg text-slate-900 dark:text-white font-mono">
                  {payment.transactionId || 'N/A'}
                </p>
              </div>
              
              {payment.caseId && (
                <div>
                  <h3 className="text-sm font-medium text-slate-500 dark:text-gray-300 mb-1">Case ID</h3>
                  <p className="text-lg text-slate-900 dark:text-white">{payment.caseId}</p>
                </div>
              )}
            </div>
            
            <div className="pt-4 border-t border-slate-200 dark:border-gray-700">
              <h3 className="text-sm font-medium text-slate-500 dark:text-gray-300 mb-1">Date Created</h3>
              <p className="text-slate-900 dark:text-gray-200">
                {payment.createdAt ? formatDate(payment.createdAt) : 'N/A'}
              </p>
            </div>
          </div>
          
          <div className="mt-8 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewPaymentModal;
