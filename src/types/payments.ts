export type PaymentMethodCanonical = 'cash' | 'eft_pop' | 'pay_at';
export type PaymentMethodLegacy =
  | 'eft'
  | 'pop'
  | 'payat'
  | 'easypay'
  | 'card'
  | 'snapscan'
  | 'voucher'
  | 'pay_by_bank'
  | 'paybybank'
  | 'bank_transfer';

export type PaymentMethod = PaymentMethodCanonical | PaymentMethodLegacy;

// Matches the live `payments.status` CHECK constraint exactly.
// Note: 'partial' and 'overdue' are valid for cases.payment_status, not
// payments.status — don't reuse this type for that column.
export type PaymentStatus =
  | 'pending'
  | 'awaiting_confirmation'
  | 'paid'
  | 'failed'
  | 'expired'
  | 'refunded'
  | 'cancelled';

export const MANUALLY_UPDATABLE_METHODS: PaymentMethod[] = ['cash', 'eft_pop', 'eft', 'pop'];
export const GATEWAY_MANAGED_METHODS: PaymentMethod[] = ['pay_at', 'payat'];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash',
  eft_pop: 'EFT / Proof of Payment',
  pay_at: 'Pay@ (Card, Instant EFT, SnapScan, Retail Cash & more)',
  eft: 'EFT (legacy)',
  pop: 'Proof of Payment (POP)',
  payat: 'Pay@ (legacy)',
  easypay: 'EasyPay (legacy)',
  card: 'Card',
  snapscan: 'SnapScan',
  voucher: 'Voucher',
  pay_by_bank: 'Pay By Bank',
  paybybank: 'Pay By Bank (legacy)',
  bank_transfer: 'Bank Transfer',
};

const PAYMENT_METHOD_CANONICAL_ALIAS: Partial<Record<PaymentMethodLegacy, PaymentMethod>> = {
  eft: 'eft_pop',
  pop: 'eft_pop',
  payat: 'pay_at',
  easypay: 'pay_at',
  paybybank: 'pay_by_bank',
};

export const normalizePaymentMethod = (method: string | undefined | null): PaymentMethod | string => {
  const normalized = method?.toString().trim().toLowerCase();
  if (!normalized) return method || '';

  return PAYMENT_METHOD_CANONICAL_ALIAS[normalized as PaymentMethodLegacy] || normalized;
};

export const isPayAtMethod = (method: string | undefined | null): boolean => {
  const normalized = normalizePaymentMethod(method);
  return normalized === 'pay_at';
};

export const isEftPopMethod = (method: string | undefined | null): boolean => {
  const normalized = normalizePaymentMethod(method);
  return normalized === 'eft_pop';
};

export const getPaymentMethodLabel = (method: string | undefined | null): string => {
  if (!method) return 'N/A';
  const normalized = method.toString().trim().toLowerCase() as PaymentMethod;
  return PAYMENT_METHOD_LABELS[normalized] || normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

export interface Invoice {
  id: string;
  parlorId: string;
  clientId: string;
  caseId: string;
  invoiceNumber: string;
  description?: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'void' | 'overdue';
  issuedAt: string;
  dueAt?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  parlorId: string;
  clientId: string;
  invoiceId?: string; // new — links payment to an invoice
  caseId?: string; // legacy column on payments; prefer invoice.caseId going forward

  amount: number; // ZAR
  method: PaymentMethod;
  status: PaymentStatus;
  description?: string;

  // gateway fields — only populated when method = 'pay_at'
  reference?: string; // Pay@ reference shown to the customer (mocked until real integration)
  paymentReference?: string;
  provider?: 'pay_at';
  providerTransactionId?: string; // Pay@'s own transaction id, from callback
  expiresAt?: string;
  paidAt?: string;

  // eft_pop fields — only populated when method = 'eft_pop'
  proofOfPaymentUrl?: string;
  verifiedBy?: string;
  verifiedAt?: string;

  transactionId?: string; // legacy free-text column, kept for backward compat
  createdAt: string;
  updatedAt: string;
}

export type PayatOnboardingStatus = 'not_started' | 'link_sent' | 'kyc_pending' | 'approved';

export interface PaymentProviderConfig {
  id: string;
  parlorId: string;
  provider: 'pay_at';
  payatSubaccountRef?: string;   // replaces payatPrefix going forward
  onboardingStatus: PayatOnboardingStatus;
  onboardingNotes?: string;
  enabled: boolean;              // should only be true once onboardingStatus === 'approved' and payatSubaccountRef is set
  webhookSecret?: string;
  createdAt: string;
  updatedAt: string;
}
// Shape returned by the (initially mocked) create-payment endpoint.
// This is what Phase 3 in the plan returns, and what Phase 4's customer
// payment screen displays.
export interface CreatePayAtPaymentResponse {
  paymentId: string;
  reference: string;
  amount: number;
  status: Extract<PaymentStatus, 'pending'>;
  expiresAt?: string;
}

