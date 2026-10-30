-- ─────────────────────────────────────────────────────────────
-- Pay@ multi-parlour schema.
--
-- Each parlour collects Pay@ payments in one of three modes:
--
--   platform   – LovedOne's own Pay@ account (PAYAT_CLIENT_ID/SECRET
--                function secrets). For testing only: every rand lands
--                in LovedOne's bank account, whichever parlour it was for.
--   merchant   – the parlour's own Pay@Go account. Its client ID and
--                secret are stored encrypted in payment_provider_credentials
--                and money settles straight to the parlour.
--   integrator – LovedOne's integrator account creating RTPs on behalf of
--                the parlour's merchantIdentifier. Needs integrator scopes
--                from Pay@ (not yet granted on staging).
--
-- Additive and idempotent: safe whether or not an earlier version of this
-- file (the prefix/subaccount design) was already applied.
-- ─────────────────────────────────────────────────────────────

begin;

create or replace function public.set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 1. Per-parlour Pay@ configuration ----------------------------------

create table if not exists public.payment_provider_config (
  id uuid primary key default gen_random_uuid(),
  parlor_id uuid not null references public.parlors(id),
  provider text not null default 'pay_at',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Parlours set up before modes existed must not silently fall into
-- 'platform' mode (money to LovedOne): switch them off until a super admin
-- picks their mode on the Pay@ setup screen.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'payment_provider_config'
      and column_name = 'payat_mode'
  ) then
    alter table public.payment_provider_config
      add column payat_mode text not null default 'platform';

    -- Only an existing table has these columns yet.
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public' and table_name = 'payment_provider_config'
        and column_name = 'enabled'
    ) then
      alter table public.payment_provider_config add column if not exists onboarding_notes text;
      execute $sql$
        update public.payment_provider_config
          set enabled = false,
              onboarding_notes = concat_ws(E'\n', onboarding_notes,
                'Pay@ switched off by the multi-parlour migration: choose this parlour''s payment account.')
          where enabled
      $sql$;
    end if;
  end if;
end $$;

alter table public.payment_provider_config
  add column if not exists payat_merchant_identifier text,
  add column if not exists onboarding_status text not null default 'not_started',
  add column if not exists onboarding_notes text,
  add column if not exists enabled boolean not null default false,
  -- Set only by the payat-admin function (service role), never by the browser.
  add column if not exists credentials_configured boolean not null default false,
  add column if not exists credentials_verified_at timestamptz,
  add column if not exists webhook_key_hash text,
  add column if not exists webhook_key_created_at timestamptz;

-- Constraints from the earlier prefix-based version of this migration.
alter table public.payment_provider_config
  drop constraint if exists payment_provider_config_prefix_check,
  drop constraint if exists payment_provider_config_enabled_check;

alter table public.payment_provider_config
  drop constraint if exists payment_provider_config_mode_check,
  add constraint payment_provider_config_mode_check
    check (payat_mode in ('platform', 'merchant', 'integrator'));

alter table public.payment_provider_config
  drop constraint if exists payment_provider_config_onboarding_status_check,
  add constraint payment_provider_config_onboarding_status_check
    check (onboarding_status in ('not_started', 'link_sent', 'kyc_pending', 'approved'));

-- Enabled only when the parlour's chosen mode has what it needs.
-- Mirrors canEnable() in PayAtOnboarding.tsx so it can't be bypassed.
alter table public.payment_provider_config
  drop constraint if exists payment_provider_config_ready_check,
  add constraint payment_provider_config_ready_check
    check (
      not enabled
      or (
        onboarding_status = 'approved'
        and (
          payat_mode = 'platform'
          or (payat_mode = 'merchant' and credentials_configured)
          or (payat_mode = 'integrator' and payat_merchant_identifier is not null)
        )
      )
    ) not valid;

create unique index if not exists idx_ppc_parlor_id
  on public.payment_provider_config(parlor_id);

-- A merchantIdentifier names exactly one parlour at Pay@.
create unique index if not exists idx_ppc_merchant_identifier
  on public.payment_provider_config(payat_merchant_identifier)
  where payat_merchant_identifier is not null;

drop trigger if exists trg_ppc_updated_at on public.payment_provider_config;
create trigger trg_ppc_updated_at before update on public.payment_provider_config
  for each row execute function public.set_updated_at();

alter table public.payment_provider_config enable row level security;

drop policy if exists "ppc_select_same_parlor_or_super_admin" on public.payment_provider_config;
create policy "ppc_select_same_parlor_or_super_admin"
on public.payment_provider_config
for select to authenticated
using (public.is_super_admin() or parlor_id = public.current_user_parlor_id());

drop policy if exists "ppc_write_super_admin" on public.payment_provider_config;
create policy "ppc_write_super_admin"
on public.payment_provider_config
for all to authenticated
using (public.is_super_admin())
with check (public.is_super_admin());

-- Column-level access. A column revoke is ignored while a table-level
-- grant exists, so drop the table grants and grant safe columns only.
-- The browser can never read the webhook key hash, and can never write
-- the credential/webhook flags that payat-admin owns.
revoke all on public.payment_provider_config from anon, authenticated;

grant select (
  id, parlor_id, provider, payat_mode, payat_merchant_identifier,
  onboarding_status, onboarding_notes, enabled,
  credentials_configured, credentials_verified_at, webhook_key_created_at,
  created_at, updated_at
) on public.payment_provider_config to authenticated;

grant insert (
  parlor_id, provider, payat_mode, payat_merchant_identifier,
  onboarding_status, onboarding_notes, enabled
) on public.payment_provider_config to authenticated;

grant update (
  payat_mode, payat_merchant_identifier,
  onboarding_status, onboarding_notes, enabled
) on public.payment_provider_config to authenticated;

-- 2. Encrypted per-parlour Pay@ credentials (merchant mode) -----------
--
-- client_secret_enc is AES-256-GCM ciphertext produced by the edge
-- functions with the PAYAT_CREDENTIALS_KEY function secret, so a database
-- dump alone doesn't expose any parlour's Pay@ secret.

create table if not exists public.payment_provider_credentials (
  parlor_id uuid not null references public.parlors(id) on delete cascade,
  provider text not null default 'pay_at',
  client_id text not null,
  client_secret_enc text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (parlor_id, provider)
);

drop trigger if exists trg_ppcred_updated_at on public.payment_provider_credentials;
create trigger trg_ppcred_updated_at before update on public.payment_provider_credentials
  for each row execute function public.set_updated_at();

-- Service role only: RLS on with no policies, and no grants.
alter table public.payment_provider_credentials enable row level security;
revoke all on public.payment_provider_credentials from anon, authenticated;

-- 3. Columns the Pay@ functions write on payments ----------------------

alter table public.payments
  add column if not exists provider text,
  add column if not exists payat_mode text,
  add column if not exists reference text,
  add column if not exists payment_reference text,
  add column if not exists payment_link text,
  add column if not exists payat_client_account_number text,
  add column if not exists client_reference_number text,
  add column if not exists provider_transaction_id text,
  add column if not exists expires_at timestamptz,
  add column if not exists paid_at timestamptz,
  add column if not exists invoice_id uuid references public.invoices(id);

create index if not exists idx_payments_reference on public.payments(reference);
create index if not exists idx_payments_invoice_id on public.payments(invoice_id);

-- The callback matches notifications on these, so they must be unique.
create unique index if not exists idx_payments_payat_account
  on public.payments(payat_client_account_number)
  where payat_client_account_number is not null;
create unique index if not exists idx_payments_client_reference
  on public.payments(client_reference_number)
  where client_reference_number is not null;

-- 4. Provider notification log -----------------------------------------

create table if not exists public.payment_provider_details (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid references public.payments(id) on delete cascade,
  provider text not null,
  provider_reference text,
  provider_transaction_id text,
  provider_payload jsonb,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

-- Unmatched notifications are logged too, so payment_id may be null.
alter table public.payment_provider_details alter column payment_id drop not null;

create index if not exists idx_ppd_payment_id on public.payment_provider_details(payment_id);
create unique index if not exists idx_ppd_dedupe
  on public.payment_provider_details(provider, provider_transaction_id)
  where provider_transaction_id is not null;

alter table public.payment_provider_details enable row level security;
revoke all on public.payment_provider_details from anon, authenticated;

commit;

-- ─────────────────────────────────────────────────────────────
-- Run these manually after applying:
--
-- a) Rows that would violate the readiness guard. Fix them, then:
--    alter table public.payment_provider_config
--      validate constraint payment_provider_config_ready_check;
--
--    select parlor_id, payat_mode, onboarding_status, credentials_configured,
--           payat_merchant_identifier
--    from public.payment_provider_config
--    where enabled and not (onboarding_status = 'approved' and (
--      payat_mode = 'platform'
--      or (payat_mode = 'merchant' and credentials_configured)
--      or (payat_mode = 'integrator' and payat_merchant_identifier is not null)));
--
-- b) The live payments.status constraint. The code writes 'pending',
--    'paid', 'failed', 'expired' and 'awaiting_confirmation':
--
--    select pg_get_constraintdef(oid) from pg_constraint
--    where conrelid = 'public.payments'::regclass and contype = 'c';
-- ─────────────────────────────────────────────────────────────
