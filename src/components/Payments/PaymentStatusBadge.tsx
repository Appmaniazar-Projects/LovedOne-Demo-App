import React from 'react';
import {
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RotateCcw,
  Ban,
} from 'lucide-react';
import { PaymentStatus } from '../../types';

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  amountDue?: number;
  totalAmount?: number;
}

const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({
  status,
  amountDue,
  totalAmount,
}) => {
  // Keys must match PaymentStatus exactly (src/types/payments.ts), which
  // mirrors the live `payments.status` CHECK constraint. Don't add
  // 'partial'/'overdue' here — those belong to cases.payment_status, not
  // payments.status.
  const config: Record<PaymentStatus, { icon: JSX.Element; color: string; label: string }> = {
    pending: {
      icon: <Clock className="w-4 h-4" />,
      color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
      label: 'Pending',
    },
    awaiting_confirmation: {
      icon: <AlertTriangle className="w-4 h-4" />,
      color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300',
      label: 'Awaiting Confirmation',
    },
    paid: {
      icon: <CheckCircle className="w-4 h-4" />,
      color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
      label: 'Paid',
    },
    cancelled: {
      icon: <Ban className="w-4 h-4" />,
      color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
      label: 'Cancelled',
    },
    failed: {
      icon: <XCircle className="w-4 h-4" />,
      color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
      label: 'Failed',
    },
    refunded: {
      icon: <RotateCcw className="w-4 h-4" />,
      color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
      label: 'Refunded',
    },
    expired: {
      icon: <Ban className="w-4 h-4" />,
      color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
      label: 'Expired',
    },
  };
  const statusConfig = config[status];

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${statusConfig.color}`}>
      {statusConfig.icon}
      <span className="ml-1">{statusConfig.label}</span>

      {amountDue !== undefined && totalAmount !== undefined && status !== 'paid' && (
        <span className="ml-2 text-xs">
          R{amountDue.toFixed(2)} / R{totalAmount.toFixed(2)}
        </span>
      )}
    </span>
  );
};

export default PaymentStatusBadge;