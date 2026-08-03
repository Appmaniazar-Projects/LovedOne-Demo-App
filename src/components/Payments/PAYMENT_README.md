# Payment Integration Notes

## Goal
Centralize payment terminology and support both legacy database values and the new canonical payment method vocabulary.

## Canonical Types
In `src/types/payments.ts`:
- `PaymentMethodCanonical`: `cash`, `eft_pop`, `pay_at`
- `PaymentMethodLegacy`: legacy values still supported for back-compat
- `PaymentMethod`: union of canonical + legacy values
- `PaymentStatus`: includes current statuses and legacy strings like `paid`

## Normalization
Use these helpers to normalize and label methods:
- `normalizePaymentMethod(method)`
- `getPaymentMethodLabel(method)`
- `isPayAtMethod(method)`
- `isEftPopMethod(method)`

If a row arrives with legacy values like `eft`, `pop`, `payat`, or `paybybank`, we normalize it to canonical equivalents.

## Current Behavior
- `ViewPaymentModal` uses `getPaymentMethodLabel()` for payment method display.
- `CollectPaymentModal` only offers canonical collect methods: `cash`, `eft_pop`, and `pay_at`.
- `Payments.tsx` filters and renders legacy method values safely.
- `MANUALLY_UPDATABLE_METHODS` includes legacy EFT/POP values for manual status updates.
- Mock data has been removed; task and client flows now load data from Supabase only.

## Deployment Notes
- The database is the single source of truth for payments, clients, and tasks.
- `pay_at` is the current gateway method; `payat` is supported only as a canonically normalized legacy alias.
- `easypay` is no longer used in the UI or current payment flows.

## What next
1. Audit `payments` table migration and row-level security to enforce canonical values gradually.
2. Replace any remaining `payment.method === 'payat'` checks with `isPayAtMethod(payment.method)`.
3. Normalize `payment_reference` and `reference` values consistently in backend payloads.
4. Update tests or database seed data to use `eft_pop` and `pay_at`.

## Notes for future developers
- Don’t remove legacy method support until the DB has been migrated and existing rows rewritten.
- When adding new providers, add both canonical and legacy alias mapping in `src/types/payments.ts`.
- Keep UI filter options aligned with `PAYMENT_METHOD_LABELS`.
