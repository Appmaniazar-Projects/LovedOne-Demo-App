# Payment Normalization Todo

## Done
- [x] Remove EasyPay checkout and deprecated EasyPay UI options
- [x] Keep Pay@ as the gateway-supported method and canonicalize legacy Pay@ values
- [x] Add a focused unit test for `normalizePaymentMethod()` and related helpers

## Immediate follow-up tasks
- [ ] Audit `src/components/Payments/RequestPaymentModal.tsx` for legacy payment values and keep only necessary manual options
- [ ] Review `supabase/functions/*` for `payat` vs `pay_at` and ensure `payment_reference` is set consistently
- [ ] Confirm `payment.status` values in existing DB rows match the union in `src/types/payments.ts`

## Cleanup work
- [ ] Remove unused legacy provider render code once the DB is fully canonical
- [ ] Consolidate payment method labels in a single shared helper if display requirements diverge
- [ ] Move `src/components/Payments/PAYMENT_README.md` into a broader developer docs folder if one exists

## Notes
- `pay_at` is the main gateway method; all legacy aliases should map to it when possible
- Keep `easypay` removed from the UI until the backend is explicitly reintroduced
