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

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg relative">
        <button onClick={onClose} className="absolute top-3 right-3 text-slate-500 hover:text-slate-800">
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-xl font-bold text-slate-900 mb-4">Payment Details</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-slate-500">Description</h3>
            <p className="text-lg text-slate-900">{payment.description}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-slate-500">Amount</h3>
              <p className="text-lg font-semibold text-slate-900">{formatCurrency(payment.amount)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-500">Status</h3>
              <p className={`text-lg font-semibold`}>{payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-500">Payment Method</h3>
              <p className="text-lg text-slate-900">{payment.method.toUpperCase()}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-500">Transaction ID</h3>
              <p className="text-lg text-slate-900 font-mono">{payment.transactionId || 'N/A'}</p>
            </div>
             <div>
              <h3 className="text-sm font-medium text-slate-500">Case ID</h3>
              <p className="text-lg text-slate-900">{payment.caseId || 'N/A'}</p>
            </div>
          </div>
           <div>
              <h3 className="text-sm font-medium text-slate-500">Date Created</h3>
              <p className="text-lg text-slate-900">{formatDate(payment.createdAt)}</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ViewPaymentModal;
