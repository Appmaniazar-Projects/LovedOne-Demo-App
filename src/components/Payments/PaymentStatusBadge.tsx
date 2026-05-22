import React from 'react';
import { Clock, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface PaymentStatusBadgeProps {
  status: 'pending' | 'partial' | 'completed' | 'overdue';
  amountDue?: number;
  totalAmount?: number;
}

const PaymentStatusBadge: React.FC<PaymentStatusBadgeProps> = ({
  status,
  amountDue,
  totalAmount
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return {
          icon: <Clock className="w-4 h-4" />,
          color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
          label: 'Pending'
        };
      case 'partial':
        return {
          icon: <AlertTriangle className="w-4 h-4" />,
          color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300',
          label: 'Partial'
        };
      case 'completed':
        return {
          icon: <CheckCircle className="w-4 h-4" />,
          color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
          label: 'Completed'
        };
      case 'overdue':
        return {
          icon: <XCircle className="w-4 h-4" />,
          color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
          label: 'Overdue'
        };
      default:
        return {
          icon: <Clock className="w-4 h-4" />,
          color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300',
          label: 'Unknown'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
      {config.icon}
      <span className="ml-1">{config.label}</span>
      {amountDue !== undefined && totalAmount !== undefined && status !== 'completed' && (
        <span className="ml-2 text-xs">
          R{amountDue.toFixed(2)} / R{totalAmount.toFixed(2)}
        </span>
      )}
    </div>
  );
};

export default PaymentStatusBadge;
