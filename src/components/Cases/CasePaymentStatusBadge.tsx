import React from 'react';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';

// cases.payment_status is a rollup of a case's overall payment position and
// is a DIFFERENT column/constraint to payments.status (see
// src/components/Payments/PaymentStatusBadge.tsx for the per-payment one).
// Don't merge these two components — their value sets don't overlap
// ('overdue'/'partial' here vs 'awaiting_confirmation'/'paid' there).
export type CasePaymentStatus = 'pending' | 'partial' | 'completed' | 'overdue';

interface CasePaymentStatusBadgeProps {
  status: CasePaymentStatus;
  amountDue?: number;
  totalAmount?: number;
}

const CASE_PAYMENT_STATUS_CONFIG: Record<
  CasePaymentStatus,
  { icon: JSX.Element; color: string; label: string }
> = {
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
  overdue: {
    icon: <AlertTriangle className="w-4 h-4" />,
    color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300',
    label: 'Overdue',
  },
};

const CasePaymentStatusBadge: React.FC<CasePaymentStatusBadgeProps> = ({
  status,
  amountDue,
  totalAmount,
}) => {
  const config = CASE_PAYMENT_STATUS_CONFIG[status];

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

export default CasePaymentStatusBadge;
