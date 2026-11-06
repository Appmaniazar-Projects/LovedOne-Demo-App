// src/utils/payatFees.ts
// Pay@Go fee calculation. Rates come from the Pay@ Integrator terms:
//   3.5%  retail, 2.85% digital/online.
// OPEN DECISION: who pays? Set FEE_MODE below once Mr Tk confirms.
//   'parlour_absorbs' -> family pays the invoice amount; the fee is deducted from the parlour's settlement.
//   'pass_to_family'  -> family pays amount + fee; parlour receives the full invoice amount.
// Money is handled in cents (integers) to avoid floating point errors.

export type PayAtChannel = 'retail' | 'digital';
export type FeeMode = 'parlour_absorbs' | 'pass_to_family';

export const PAYAT_FEE_RATES: Record<PayAtChannel, number> = {
  retail: 0.035,
  digital: 0.0285,
};

export const FEE_MODE: FeeMode = 'parlour_absorbs'; // TODO: confirm with Mr Tk

export interface PayAtFeeBreakdown {
  invoiceCents: number;   // what the case/invoice is for
  feeCents: number;       // Pay@ fee
  customerPaysCents: number;
  parlourReceivesCents: number;
  rate: number;
  mode: FeeMode;
}

export function calculatePayAtFee(
  invoiceAmountRand: number,
  channel: PayAtChannel = 'digital',
  mode: FeeMode = FEE_MODE,
): PayAtFeeBreakdown {
  if (!Number.isFinite(invoiceAmountRand) || invoiceAmountRand <= 0) {
    throw new Error('Invoice amount must be a positive number');
  }
  const invoiceCents = Math.round(invoiceAmountRand * 100);
  const rate = PAYAT_FEE_RATES[channel];

  if (mode === 'pass_to_family') {
    // Gross up so that after Pay@ takes its percentage the parlour still gets the full invoice.
    const customerPaysCents = Math.ceil(invoiceCents / (1 - rate));
    const feeCents = customerPaysCents - invoiceCents;
    return { invoiceCents, feeCents, customerPaysCents, parlourReceivesCents: invoiceCents, rate, mode };
  }

  const feeCents = Math.round(invoiceCents * rate);
  return {
    invoiceCents,
    feeCents,
    customerPaysCents: invoiceCents,
    parlourReceivesCents: invoiceCents - feeCents,
    rate,
    mode,
  };
}

export const centsToRand = (c: number) => `R${(c / 100).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;