# LovedOne

Funeral parlor management system: clients and dependants, cases, tasks, services and plans, documents, and payments (cash, EFT/proof of payment, and Pay@). React + TypeScript (Vite) frontend on Supabase.

- **Live:** https://tlosystems.co.za (TechPozi cPanel hosting)
- **Supabase project:** `aqudechdehicxtdzafgs`
- **Full handover and process guide:** the "LovedOne Handover" doc and "LovedOne System Document (v2)" in the LovedOne Demo App Claude project

## Setup

1. `npm install`
2. Create `.env` in the project root:
   ```
   VITE_SUPABASE_URL=https://aqudechdehicxtdzafgs.supabase.co
   VITE_SUPABASE_ANON_KEY=<Supabase → Settings → API → anon key>
   VITE_GOOGLE_PLACES_API_KEY=<Google Places key, for address autocomplete>
   ```
3. `npm run dev`, then open http://localhost:5173

## Deploy

1. `npm run build` with `.env` present. The env values are baked into the build.
2. Upload the contents of `dist/` to `public_html` on TechPozi (cPanel File Manager).
3. Hard-refresh the site afterwards.

## Database migrations

Run new files from `supabase/migrations/` by pasting them into the Supabase SQL editor.
**Don't use `supabase db push`:** the repo's migration history doesn't match the live database.

Recent migrations. Each one only adds what's missing, so they're safe to re-run:

| Migration | Adds |
| --- | --- |
| `20261106000001_payat_frontend_fields.sql` | Pay@ columns on `payments` and `payment_provider_config` |
| `20261106000002_client_fields.sql` | `clients.id_number`, `date_of_birth`, `policy_start_date`; `dependants.id_number` |
| `20261106000003_cases_dependant_link.sql` | `cases.dependant_id` |

## Edge Functions

```bash
supabase login
supabase link --project-ref aqudechdehicxtdzafgs
supabase functions deploy <name> --use-api
```

You need the Developer role (or higher) on the Supabase project. Secrets go in Supabase → Edge Functions → Secrets.

| Function | Purpose | State |
| --- | --- | --- |
| `create-payat-reference` | Create a Pay@ payment request (account number, link) | Working on Pay@ staging |
| `manage-staff` | Team page: list, invite (link, no email), new link, change role, remove | Built; deploy before use |
| `payat-callback` | Pay@ "paid" notification | **Mock:** waiting on Pay@'s spec |
| `payat-auth` | Checks Pay@ credentials | Diagnostic only |

Secrets: `PAYAT_CLIENT_ID`, `PAYAT_CLIENT_SECRET`.

Staff invites send **no email** (no SMTP is configured, and Supabase's built-in mailer only emails the Supabase project team). `manage-staff` generates the invite link, and the admin sends it on WhatsApp or copies it. Supabase settings:
- Add `https://tlosystems.co.za/set-password` and `http://localhost:5173/set-password` to Authentication → URL Configuration → Redirect URLs.
- Optional: raise the link lifetime (default 1 hour) under Authentication → Providers → Email → Email OTP Expiration (max 24 hours).
- If custom SMTP is set up later, invites could be emailed instead (`auth.admin.inviteUserByEmail`).

## Where things live

| Area | Code |
| --- | --- |
| Login and parlor routing | `src/App.tsx`, `src/components/Auth/` |
| Clients, dependants, documents | `src/components/Clients/` (`clientShared.ts` holds the shared helpers), `src/utils/saId.ts` |
| Cases | `src/components/Cases/CasesBoard.tsx`, `CreateCaseModal.tsx` |
| Payments and Pay@ | `src/components/Payments/`, `src/hooks/usePaymentStatus.ts` (see `PAYMENT_README.md`) |
| Team (staff management) | `src/components/Team/TeamPage.tsx`, `supabase/functions/manage-staff` |
| Types | `src/types/` |

## Roles

`super_admin` (LovedOne), `admin` and `staff` (parlor users), `viewer` (default for new logins, no access). A person's parlor access comes from `user_parlors`. Parlor admins manage their team on the **Team** page.

## Known gaps

The handover doc has the full ranked list. The main ones:
- Pay@ payments can't be confirmed as paid yet (`payat-callback` is a mock).
- Which identifier sends money to the right parlor (prefix or subaccount) still needs confirming with Pay@.
- There's no invoices screen.
- A case's `payment_status` isn't updated from actual payments.
- The header search shows placeholder results.
