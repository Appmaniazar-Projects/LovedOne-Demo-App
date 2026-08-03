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
  const config = {
    pending: {
      icon: <Clock className="w-4 h-4" />,
      color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
      label: 'Pending',
    },
    partial: {
      icon: <AlertTriangle className="w-4 h-4" />,
      color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300',
      label: 'Partial',
    },
    completed: {
      icon: <CheckCircle className="w-4 h-4" />,
      color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
      label: 'Paid',
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
    overdue: {
      icon: <AlertTriangle className="w-4 h-4" />,
      color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
      label: 'Overdue',
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
    reversed: {
      icon: <RotateCcw className="w-4 h-4" />,
      color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
      label: 'Reversed',
    },
    expired: {
      icon: <Ban className="w-4 h-4" />,
      color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
      label: 'Expired',
    },
  }[status];

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${config.color}`}>
      {config.icon}
      <span className="ml-1">{config.label}</span>

      {amountDue !== undefined && totalAmount !== undefined && status !== 'completed' && (
        <span className="ml-2 text-xs">
          R{amountDue.toFixed(2)} / R{totalAmount.toFixed(2)}
        </span>
      )}
    </span>
  );
};

export default PaymentStatusBadge;