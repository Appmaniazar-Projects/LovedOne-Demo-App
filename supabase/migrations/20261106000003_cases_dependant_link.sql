-- Link a case to the dependant who passed away. The case's client_id is
-- always the policy holder, so dependant cases show on the client's page.
alter table public.cases
  add column if not exists dependant_id uuid references public.dependants(id) on delete set null;

create index if not exists idx_cases_dependant_id on public.cases (dependant_id);
create index if not exists idx_cases_client_id on public.cases (client_id);
