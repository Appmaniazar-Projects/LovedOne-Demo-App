import { normalizePaymentMethod, getPaymentMethodLabel, isPayAtMethod, isEftPopMethod } from './payments';

describe('Payment helpers', () => {
  it('normalizes legacy EFT and POP to eft_pop', () => {
    expect(normalizePaymentMethod('eft')).toBe('eft_pop');
    expect(normalizePaymentMethod('pop')).toBe('eft_pop');
  });

  it('normalizes legacy Pay@ aliases to pay_at', () => {
    expect(normalizePaymentMethod('payat')).toBe('pay_at');
  });

  it('normalizes paybybank to pay_by_bank', () => {
    expect(normalizePaymentMethod('paybybank')).toBe('pay_by_bank');
  });

  it('returns the original canonical method when already canonical', () => {
    expect(normalizePaymentMethod('cash')).toBe('cash');
    expect(normalizePaymentMethod('eft_pop')).toBe('eft_pop');
    expect(normalizePaymentMethod('pay_at')).toBe('pay_at');
  });

  it('returns expected labels for legacy and canonical methods', () => {
    expect(getPaymentMethodLabel('payat')).toBe('Pay@ (legacy)');
    expect(getPaymentMethodLabel('pay_at')).toBe('Pay@ (Card, Instant EFT, SnapScan, Retail Cash & more)');
    expect(getPaymentMethodLabel('eft')).toBe('EFT (legacy)');
    expect(getPaymentMethodLabel('eft_pop')).toBe('EFT / Proof of Payment');
  });

  it('detects Pay@ and EFT/POP methods correctly', () => {
    expect(isPayAtMethod('payat')).toBe(true);
    expect(isPayAtMethod('pay_at')).toBe(true);
    expect(isEftPopMethod('eft')).toBe(true);
    expect(isEftPopMethod('pop')).toBe(true);
    expect(isEftPopMethod('eft_pop')).toBe(true);
  });
});
