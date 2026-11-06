-- Fields the Clients screens now collect. Idempotent: safe on the live DB.

alter table public.clients
  add column if not exists id_number text,
  add column if not exists date_of_birth date,
  add column if not exists policy_start_date date,
  add column if not exists profile_picture_url text;

alter table public.dependants
  add column if not exists id_number text;

-- One policy holder per SA ID number within a parlour.
create unique index if not exists clients_parlor_id_number_unique
  on public.clients (parlor_id, id_number)
  where id_number is not null;

create index if not exists idx_clients_id_number on public.clients (id_number);

-- Move dependant ID numbers that were saved into notes as "ID: <13 digits>".
update public.dependants
set id_number = substring(notes from '^ID:\s*(\d{13})'),
    notes = nullif(btrim(regexp_replace(notes, '^ID:\s*\d{13}', '')), '')
where id_number is null
  and notes ~ '^ID:\s*\d{13}';
