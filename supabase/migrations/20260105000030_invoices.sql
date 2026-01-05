begin;

create table if not exists public.invoice_counters (
  parlor_id uuid not null references public.parlors(id) on delete cascade,
  year integer not null,
  last_number integer not null default 0,
  updated_at timestamp with time zone not null default now(),
  constraint invoice_counters_pkey primary key (parlor_id, year)
);

create table if not exists public.invoices (
  id uuid not null default gen_random_uuid(),
  parlor_id uuid not null references public.parlors(id) on delete cascade,
  invoice_number text not null,
  status text not null default 'draft' check (status in ('draft','sent','paid','void','overdue')),
  amount numeric not null default 0,
  description text,
  client_id uuid references public.clients(id) on delete set null,
  case_id uuid references public.cases(id) on delete set null,
  issued_at timestamp with time zone not null default now(),
  due_at timestamp with time zone,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint invoices_pkey primary key (id),
  constraint invoices_invoice_number_unique unique (invoice_number)
);

create index if not exists invoices_parlor_id_idx on public.invoices(parlor_id);
create index if not exists invoices_client_id_idx on public.invoices(client_id);
create index if not exists invoices_case_id_idx on public.invoices(case_id);
create index if not exists invoices_status_idx on public.invoices(status);

create or replace function public.next_invoice_number(target_parlor_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_year integer;
  v_next integer;
  v_slug text;
begin
  if target_parlor_id is null then
    raise exception 'parlor_id is required';
  end if;

  v_year := extract(year from now())::int;

  select p.slug into v_slug
  from public.parlors p
  where p.id = target_parlor_id;

  if v_slug is null or btrim(v_slug) = '' then
    v_slug := 'PARLOR';
  end if;

  loop
    begin
      insert into public.invoice_counters (parlor_id, year, last_number)
      values (target_parlor_id, v_year, 0)
      on conflict (parlor_id, year) do nothing;

      update public.invoice_counters
      set last_number = last_number + 1,
          updated_at = now()
      where parlor_id = target_parlor_id
        and year = v_year
      returning last_number into v_next;

      exit;
    exception when serialization_failure or deadlock_detected then
      -- retry
    end;
  end loop;

  return 'INV-' || upper(v_slug) || '-' || v_year::text || '-' || lpad(v_next::text, 6, '0');
end;
$$;

create or replace function public.set_invoice_number_and_timestamps()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.invoice_number is null or btrim(new.invoice_number) = '' then
    new.invoice_number := public.next_invoice_number(new.parlor_id);
  end if;

  if new.created_at is null then
    new.created_at := now();
  end if;

  new.updated_at := now();

  if new.issued_at is null then
    new.issued_at := now();
  end if;

  if new.created_by is null then
    new.created_by := auth.uid();
  end if;

  return new;
end;
$$;

drop trigger if exists invoices_set_number on public.invoices;
create trigger invoices_set_number
before insert on public.invoices
for each row
execute function public.set_invoice_number_and_timestamps();

-- RLS
alter table public.invoices enable row level security;
alter table public.invoice_counters enable row level security;

-- Counters should not be directly accessible from the client.
revoke all on table public.invoice_counters from anon, authenticated;

drop policy if exists "invoices_select_same_parlor_or_super_admin" on public.invoices;
drop policy if exists "invoices_insert_same_parlor" on public.invoices;
drop policy if exists "invoices_update_same_parlor" on public.invoices;
drop policy if exists "invoices_delete_admin_only" on public.invoices;

create policy "invoices_select_same_parlor_or_super_admin"
on public.invoices
for select
to authenticated
using (
  public.is_super_admin()
  or (
    public.current_user_parlor_id() is not null
    and public.invoices.parlor_id = public.current_user_parlor_id()
  )
);

create policy "invoices_insert_same_parlor"
on public.invoices
for insert
to authenticated
with check (
  public.current_user_role() in ('staff','admin','super_admin')
  and (
    public.is_super_admin()
    or (
      public.current_user_parlor_id() is not null
      and public.invoices.parlor_id = public.current_user_parlor_id()
    )
  )
);

create policy "invoices_update_same_parlor"
on public.invoices
for update
to authenticated
using (
  public.current_user_role() in ('staff','admin','super_admin')
  and (
    public.is_super_admin()
    or (
      public.current_user_parlor_id() is not null
      and public.invoices.parlor_id = public.current_user_parlor_id()
    )
  )
)
with check (
  public.current_user_role() in ('staff','admin','super_admin')
  and (
    public.is_super_admin()
    or (
      public.current_user_parlor_id() is not null
      and public.invoices.parlor_id = public.current_user_parlor_id()
    )
  )
);

create policy "invoices_delete_admin_only"
on public.invoices
for delete
to authenticated
using (
  public.current_user_role() in ('admin','super_admin')
  and (
    public.is_super_admin()
    or (
      public.current_user_parlor_id() is not null
      and public.invoices.parlor_id = public.current_user_parlor_id()
    )
  )
);

commit;
