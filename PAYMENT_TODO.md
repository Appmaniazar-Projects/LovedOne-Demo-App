# Payments to-do

Last updated 6 Nov 2026. The ranked list of every open issue is in the LovedOne Handover doc.

## Done
- [x] Remove EasyPay checkout and deprecated EasyPay UI options
- [x] Keep Pay@ as the gateway method and canonicalize legacy Pay@ values
- [x] Unit test for `normalizePaymentMethod()` and related helpers
- [x] Request Payment uses the real Pay@ flow (it used to insert a manual row with method `payat`)
- [x] Show the Pay@ account number, payment link, QR, share and expiry; send customer details; link to an invoice
- [x] Live status (Realtime + polling) with a "Check status" button; clear failed/expired states
- [x] `create-payat-reference` checks the caller belongs to the parlor
- [x] Onboarding: 5-digit prefix field; Pay@ enabled only when approved + prefix + subaccount reference
- [x] `RequestPaymentModal`: manual options are Cash, EFT and POP (cash was missing from the UI); Pay@ goes through `PayAtPaymentForm`

## Blocked on Pay@ (questions sent to Manuela Li Yuk Lo)
- [ ] Rebuild `supabase/functions/payat-callback` to Pay@'s real notification spec and signature scheme
- [ ] Confirm which identifier routes funds to a parlor (prefix, subaccount, or both) and send it in the payment request if needed
- [ ] Generate the parlor sign-up link and read onboarding status via the API (currently manual)
- [ ] Daily settlement / reconciliation feed
- [ ] Switch `staging-go.payat.co.za` URLs to production at go-live

## Not blocked
- [ ] Invoices screen (create/list invoices; the table and `next_invoice_number()` already exist)
- [ ] Update `cases.payment_status` when a payment is saved or confirmed (`PaymentAlertService.updateCasePaymentStatus` exists but is never called)
- [ ] Confirm existing `payments.status` values in the live DB match `PaymentStatus` in `src/types/payments.ts`
- [ ] Remove the unused `CollectPaymentModal.tsx`, `CashPaymentForm.tsx`, `EftPaymentForm.tsx` (Request Payment replaced them)

## Notes
- `pay_at` is the gateway method; legacy aliases (`payat`, `easypay`) normalize to it.
- Keep `easypay` out of the UI unless the backend is reintroduced.
