# LovedOne Demo App

LovedOne Demo App is a React + TypeScript Vite application backed by Supabase. It manages parlors, clients, cases, payments, and tasks with a database-first workflow.

## Key functionality

- Payment collection and tracking
  - Manual payment requests
  - Pay@ gateway support
  - EFT / Proof of Payment and Cash payment methods
  - Legacy payment alias normalization for backwards compatibility
- Client and case management with Supabase
  - Clients can be assigned a plan through the `plan_id` relation
  - Dependants are stored separately in the `dependants` table and linked to a client
- Task board with Supabase task loading and assignment
- Realtime payment updates via Supabase realtime channels

## Developer setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the dev server:
   ```bash
   npm run dev
   ```
3. Build for production:
   ```bash
   npm run build
   ```
4. Run lint:
   ```bash
   npm run lint
   ```

## Important notes

- Mock data has been removed; the app now relies on Supabase for client, task, and payment data.
- Client plan and dependant values are resolved from the database using the `clients.plan_id` and `dependants.client_id` relationships.
- Payment normalization is centralized in `src/types/payments.ts`.
- Payment-specific documentation lives in `src/components/Payments/PAYMENT_README.md`.
- Payment cleanup tasks are tracked in `PAYMENT_TODO.md`.
