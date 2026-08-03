-- ─────────────────────────────────────────────────────────────
-- Modular payment module: core payments table, per-provider
-- audit trail, and per-parlour provider configuration.
-- Run after your existing parlors/cases/clients tables exist.
-- ─────────────────────────────────────────────────────────────

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  parlor_id uuid not null references parlors(id),
  case_id uuid references cases(id),
  client_id uuid references clients(id),
  description text not null,
  amount numeric(12,2) not null check (amount > 0),
  method text not null check (method in
    ('cash','eft','pop','payat','card','pay_by_bank','debit_order','snapscan','easypay')),
  status text not null default 'pending' check (status in
    ('pending','partial','completed','overdue','failed','refunded','reversed','expired')),
  transaction_id text,
  payment_reference text,      -- customer-facing reference (e.g. Pay@ account number)
  provider_reference text,     -- provider's own transaction/reference id
  expires_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_payments_parlor_id on payments(parlor_id);
create index if not exists idx_payments_status on payments(status);
create index if not exists idx_payments_payment_reference on payments(payment_reference);

-- One row per provider notification/callback received for a payment.
-- Doubles as an idempotency log (see payat-webhook function).
create table if not exists payment_provider_details (
  id uuid primary key default gen_random_uuid(),
  payment_id uuid not null references payments(id) on delete cascade,
  provider text not null,
  provider_reference text,
  provider_transaction_id text,
  provider_payload jsonb,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_ppd_payment_id on payment_provider_details(payment_id);
create unique index if not exists idx_ppd_dedupe
  on payment_provider_details(provider, provider_transaction_id)
  where provider_transaction_id is not null;

-- Per-parlour provider config, e.g. Pay@'s unique 5-digit prefix.
create table if not exists parlor_payment_providers (
  id uuid primary key default gen_random_uuid(),
  parlor_id uuid not null references parlors(id),
  provider text not null,
  is_enabled boolean not null default true,
  config jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (parlor_id, provider)
);

create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_payments_updated_at on payments;
create trigger trg_payments_updated_at before update on payments
  for each row execute function set_updated_at();

drop trigger if exists trg_ppp_updated_at on parlor_payment_providers;
create trigger trg_ppp_updated_at before update on parlor_payment_providers
  for each row execute function set_updated_at();

-- Example: enabling Pay@ for a parlour once they've received their prefix from Pay@
-- insert into parlor_payment_providers (parlor_id, provider, config)
-- values ('<parlor-uuid>', 'payat', '{"prefix": "12345"}');
