


export type PaymentMethod = 'cash' | 'eft_pop' | 'pay_at';

export type PaymentStatus =
  | 'pending'
  | 'awaiting_confirmation' // eft_pop: proof uploaded, not yet verified
  | 'paid'
  | 'failed'
  | 'expired'
  | 'refunded'
  | 'cancelled';

export const MANUALLY_UPDATABLE_METHODS: PaymentMethod[] = ['cash', 'eft_pop'];
export const GATEWAY_MANAGED_METHODS: PaymentMethod[] = ['pay_at'];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash',
  eft_pop: 'EFT / Proof of Payment',
  pay_at: 'Pay@ (Card, Instant EFT, SnapScan, Retail Cash & more)',
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

// One row per parlour — Pay@ is the only gateway now, so no per-method
// config table is needed.
export interface PaymentProviderConfig {
  id: string;
  parlorId: string;
  provider: 'pay_at';
  payatPrefix?: string;
  enabled: boolean;
  webhookSecret?: string; // set once Pay@ shares the signature scheme
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
