# Pay@ setup (staging)

LovedOne connects each parlour to Pay@ in one of three modes, chosen per
parlour on the **Pay@ setup** screen (super admins only):

| Mode | Whose Pay@ account | Money settles to | Needs |
| --- | --- | --- | --- |
| Parlour's own Pay@ account (`merchant`) | The parlour's Pay@Go account | The parlour | The parlour's client ID + secret |
| Through LovedOne (`integrator`) | LovedOne's integrator account | The parlour | Integrator scopes from Pay@ (not yet granted) |
| LovedOne's test account (`platform`) | LovedOne's Pay@Go account | **LovedOne** | Nothing extra — testing only |

## 1. Apply the migration

Apply `supabase/migrations/20261029000001_payat_schema_alignment.sql`, then run
the two checks at the bottom of the file. Parlours that were enabled under the
earlier prefix-based setup are switched off until you choose their mode.

## 2. Function secrets

Set these on the Supabase project (`supabase secrets set NAME=value`, or
Dashboard → Edge Functions → Secrets). Never prefix them with `VITE_`.

| Secret | What it is |
| --- | --- |
| `PAYAT_CREDENTIALS_KEY` | 32 random bytes, base64. Encrypts parlours' Pay@ secrets. Generate once and keep it — changing it makes saved parlour credentials unreadable. PowerShell: `$b = New-Object byte[] 32; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); [Convert]::ToBase64String($b)` |
| `PAYAT_CLIENT_ID`, `PAYAT_CLIENT_SECRET` | LovedOne's own Pay@ credentials (platform mode) |
| `PAYAT_PLATFORM_WEBHOOK_KEY` | Any long random string. The API key Pay@ sends when notifying LovedOne's own account |
| `PAYAT_INTEGRATOR_CLIENT_ID`, `PAYAT_INTEGRATOR_CLIENT_SECRET` | Only once Pay@ grants integrator access |
| `PAYAT_BASE_URL`, `PAYAT_TOKEN_URL` | Optional. Default to staging; set for production at go-live |

## 3. Deploy the functions

```
supabase functions deploy create-payat-reference
supabase functions deploy payat-admin
supabase functions deploy payat-callback --no-verify-jwt
```

`payat-callback` must use `--no-verify-jwt`: Pay@ doesn't send a Supabase login
token. It is protected by the webhook API key instead.

## 4. Connect a parlour

**Parlour with its own Pay@ account**
1. The parlour signs up for Pay@Go and finds its client ID and secret under
   Account Settings → API Credentials.
2. On the Pay@ setup screen choose *Parlour's own Pay@ account*, enter them and
   click **Test & save credentials**. They are only saved if Pay@ accepts them.
3. Click **Generate webhook key**. In the parlour's Pay@Go account go to
   Account Settings → Payment Notification Webhook → Add Webhook and enter the
   URL, auth type **API key**, the header name and the key. The key is shown once.
4. Set the status to **Approved**. Pay@ switches on for that parlour.

**LovedOne's test account**
1. Choose *LovedOne's test account* and set the status to **Approved**.
2. Once, on LovedOne's own Pay@Go account (staging-go.payat.co.za → Account
   Settings → Add Webhook): the callback URL, auth type **API key**, header
   `x-lovedone-webhook-key`, value `PAYAT_PLATFORM_WEBHOOK_KEY`.

## 5. Test a payment

1. Collect a payment with **Pay@** for a client. You get a reference, a QR
   code and a payment link.
2. Pay it on staging, or use Pay@'s webhook test.
3. The payment turns **Paid** within seconds. A payment for the wrong amount
   is held as **Awaiting confirmation** instead.

Every notification Pay@ sends is logged in `payment_provider_details`,
including any that don't match a payment.
