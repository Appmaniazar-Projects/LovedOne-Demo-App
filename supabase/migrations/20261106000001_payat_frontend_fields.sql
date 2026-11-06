-- Columns the Pay@ frontend and create-payat-reference rely on.
-- All "if not exists", so this is safe to run against the live schema
-- even where some of these were already added by hand.

alter table public.payments
  add column if not exists invoice_id uuid references public.invoices(id) on delete set null,
  add column if not exists reference text,
  add column if not exists payment_link text,
  add column if not exists payat_client_account_number text,
  add column if not exists provider text,
  add column if not exists provider_transaction_id text;

create index if not exists idx_payments_invoice_id on public.payments(invoice_id);

alter table public.payment_provider_config
  add column if not exists payat_prefix text;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'payment_provider_config_payat_prefix_format'
  ) then
    alter table public.payment_provider_config
      add constraint payment_provider_config_payat_prefix_format
      check (payat_prefix is null or payat_prefix ~ '^[0-9]{5}$');
  end if;
end $$;
