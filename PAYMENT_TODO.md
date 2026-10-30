# Payment Normalization Todo

## Done
- [x] Remove EasyPay checkout and deprecated EasyPay UI options
- [x] Keep Pay@ as the gateway-supported method and canonicalize legacy Pay@ values
- [x] Add a focused unit test for `normalizePaymentMethod()` and related helpers

## Pay@ multi-parlour (2026-10-30)
Built against Pay@'s staging API docs. Setup steps: `docs/PAYAT_SETUP.md`.
- [x] Per-parlour mode: `merchant` (parlour's own Pay@ credentials, stored AES-GCM encrypted), `integrator` (LovedOne on the parlour's behalf), `platform` (LovedOne's account, testing only)
- [x] `create-payat-reference` resolves the parlour's credentials/endpoint; amounts sent as integer cents; customer name required (falls back to the client record)
- [x] `payat-callback` handles Pay@'s real notification payload, authenticated by API-key header; each parlour's key only touches its own payments
- [x] `payat-admin` (super admin): test & save credentials, webhook keys, integrator sign-up links
- [x] Migration tested on a fresh DB and on top of the earlier prefix design (old enabled parlours are switched off until a mode is chosen)
- [ ] Integrator mode is untested against Pay@: our staging credentials don't have integrator scopes yet (asked Manuela)
- [ ] Confirm with Pay@'s webhook test that merchant-account notifications use the same payload as the integrator docs
- [ ] Integrator mode: poll `integrator/merchant/list/search` for KYC/AVS status instead of setting it by hand

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
