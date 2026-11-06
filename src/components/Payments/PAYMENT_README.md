# Payments: developer notes

## Methods
- `pay_at`: the gateway method (Pay@Go). A request is created on the server; the family pays at a till, in a banking app, or by the link or QR.
- `eft_pop`: EFT / proof of payment, recorded by staff and marked Paid, Failed or Refunded by hand.
- `cash`: recorded by staff from Request Payment ("Cash"), then marked Paid by hand.
- Legacy values (`eft`, `pop`, `payat`, `easypay`, `paybybank`) are normalized by `normalizePaymentMethod()` in `src/types/payments.ts`.

## Pay@ flow in the code
1. **Payments → Request Payment** (`RequestPaymentModal.tsx`). When the parlor's `payment_provider_config.enabled` is true, Pay@ is the default and the modal renders `PayAtPaymentForm`.
2. `PayAtPaymentForm.tsx` prefills the customer (`clients`) and lists open invoices (`invoices`), then calls the `create-payat-reference` edge function.
3. The function checks the caller belongs to the parlor and reads `payat_prefix`. It inserts a `payments` row, gets an OAuth token, and calls Pay@ `merchant/rtp/create/single`. It saves `reference`, `payment_link`, `payat_client_account_number`, `provider_transaction_id` and `expires_at` (2 days).
4. The form shows the result with `PayAtRequestDetails.tsx` (QR, account number, link, share), and follows the status with `usePaymentStatus` (Realtime plus polling, with `refresh()` for "Check status").
5. `payat-callback` should mark the payment `paid` and the linked invoice paid once it's fully covered. **It is a mock until Pay@ shares its spec.**

## Rules
- `MANUALLY_UPDATABLE_METHODS` excludes Pay@. `ViewPaymentModal` also blocks manual status changes on Pay@ payments.
- Pay@ is enabled for a parlor only when its onboarding is `approved` and both the 5-digit prefix and the subaccount reference are saved (`PayAtOnboarding.tsx`, super admins only).
- Map raw `payments` rows with `mapPaymentRow()` (in `usePaymentStatus.ts`), so camelCase fields like `paymentLink` and `accountNumber` are filled in.

## Unused
- `CollectPaymentModal.tsx`, `CashPaymentForm.tsx`, `EftPaymentForm.tsx`: an older flow that nothing opens any more. Request Payment now covers Pay@, cash, EFT and POP, so these can be removed.

## Open work
See `PAYMENT_TODO.md`.
