begin;

create or replace function public.current_user_role()
returns text
language sql
stable
as $$
  select u.role from public.users u where u.id = auth.uid();
$$;

create or replace function public.current_user_parlor_id()
returns uuid
language sql
stable
as $$
  select u.parlor_id from public.users u where u.id = auth.uid();
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
as $$
  select public.current_user_role() = 'super_admin';
$$;

alter table public.users enable row level security;
alter table public.clients enable row level security;
alter table public.cases enable row level security;
alter table public.payments enable row level security;
alter table public.documents enable row level security;

alter table public.tasks enable row level security;
alter table public.client_documents enable row level security;
alter table public.parlors enable row level security;

alter table public.users force row level security;
alter table public.clients force row level security;
alter table public.cases force row level security;
alter table public.payments force row level security;
alter table public.documents force row level security;

alter table public.tasks force row level security;
alter table public.client_documents force row level security;
alter table public.parlors force row level security;

drop policy if exists "users_select_own" on public.users;
drop policy if exists "users_select_same_parlor_or_super_admin" on public.users;
drop policy if exists "users_update_own" on public.users;
drop policy if exists "clients_select_same_parlor_or_super_admin" on public.clients;
drop policy if exists "clients_insert_same_parlor" on public.clients;
drop policy if exists "clients_update_same_parlor" on public.clients;
drop policy if exists "clients_delete_admin_only" on public.clients;
drop policy if exists "cases_select_same_parlor_or_super_admin" on public.cases;
drop policy if exists "cases_insert_same_parlor" on public.cases;
drop policy if exists "cases_update_same_parlor" on public.cases;
drop policy if exists "cases_delete_admin_only" on public.cases;
drop policy if exists "payments_select_same_parlor_or_super_admin" on public.payments;
drop policy if exists "payments_insert_same_parlor" on public.payments;
drop policy if exists "payments_update_same_parlor" on public.payments;
drop policy if exists "payments_delete_admin_only" on public.payments;
drop policy if exists "documents_select_same_parlor_or_super_admin" on public.documents;
drop policy if exists "documents_insert_same_parlor" on public.documents;
drop policy if exists "documents_update_same_parlor" on public.documents;
drop policy if exists "documents_delete_admin_only" on public.documents;

create policy "users_select_own"
on public.users
for select
to authenticated
using (id = auth.uid());

create policy "users_select_same_parlor_or_super_admin"
on public.users
for select
to authenticated
using (
  public.is_super_admin()
  or (
    public.current_user_parlor_id() is not null
    and public.users.parlor_id = public.current_user_parlor_id()
  )
);

create policy "users_update_own"
on public.users
for update
to authenticated
using (id = auth.uid())
with check (
  id = auth.uid()
  and role = (select u.role from public.users u where u.id = auth.uid())
  and parlor_id is not distinct from (select u.parlor_id from public.users u where u.id = auth.uid())
  and email is not distinct from (select u.email from public.users u where u.id = auth.uid())
);

create policy "clients_select_same_parlor_or_super_admin"
on public.clients
for select
to authenticated
using (
  public.is_super_admin()
  or (
    public.current_user_parlor_id() is not null
    and public.clients.parlor_id = public.current_user_parlor_id()
  )
);

create policy "clients_insert_same_parlor"
on public.clients
for insert
to authenticated
with check (
  public.current_user_role() in ('staff','admin','super_admin')
  and (
    public.is_super_admin()
    or (
      public.current_user_parlor_id() is not null
      and public.clients.parlor_id = public.current_user_parlor_id()
    )
  )
);

create policy "clients_update_same_parlor"
on public.clients
for update
to authenticated
using (
  public.current_user_role() in ('staff','admin','super_admin')
  and (
    public.is_super_admin()
    or (
      public.current_user_parlor_id() is not null
      and public.clients.parlor_id = public.current_user_parlor_id()
    )
  )
)
with check (
  public.current_user_role() in ('staff','admin','super_admin')
  and (
    public.is_super_admin()
    or (
      public.current_user_parlor_id() is not null
      and public.clients.parlor_id = public.current_user_parlor_id()
    )
  )
);

create policy "clients_delete_admin_only"
on public.clients
for delete
to authenticated
using (
  public.current_user_role() in ('admin','super_admin')
  and (
    public.is_super_admin()
    or (
      public.current_user_parlor_id() is not null
      and public.clients.parlor_id = public.current_user_parlor_id()
    )
  )
);

create policy "cases_select_same_parlor_or_super_admin"
on public.cases
for select
to authenticated
using (
  public.is_super_admin()
  or (
    public.current_user_parlor_id() is not null
    and public.cases.parlor_id = public.current_user_parlor_id()
  )
);

create policy "cases_insert_same_parlor"
on public.cases
for insert
to authenticated
with check (
  public.current_user_role() in ('staff','admin','super_admin')
  and (
    public.is_super_admin()
    or (
      public.current_user_parlor_id() is not null
      and public.cases.parlor_id = public.current_user_parlor_id()
    )
  )
);

create policy "cases_update_same_parlor"
on public.cases
for update
to authenticated
using (
  public.current_user_role() in ('staff','admin','super_admin')
  and (
    public.is_super_admin()
    or (
      public.current_user_parlor_id() is not null
      and public.cases.parlor_id = public.current_user_parlor_id()
    )
  )
)
with check (
  public.current_user_role() in ('staff','admin','super_admin')
  and (
    public.is_super_admin()
    or (
      public.current_user_parlor_id() is not null
      and public.cases.parlor_id = public.current_user_parlor_id()
    )
  )
);

create policy "cases_delete_admin_only"
on public.cases
for delete
to authenticated
using (
  public.current_user_role() in ('admin','super_admin')
  and (
    public.is_super_admin()
    or (
      public.current_user_parlor_id() is not null
      and public.cases.parlor_id = public.current_user_parlor_id()
    )
  )
);

create policy "payments_select_same_parlor_or_super_admin"
on public.payments
for select
to authenticated
using (
  public.is_super_admin()
  or (
    public.current_user_parlor_id() is not null
    and public.payments.parlor_id = public.current_user_parlor_id()
  )
);

create policy "payments_insert_same_parlor"
on public.payments
for insert
to authenticated
with check (
  public.current_user_role() in ('staff','admin','super_admin')
  and (
    public.is_super_admin()
    or (
      public.current_user_parlor_id() is not null
      and public.payments.parlor_id = public.current_user_parlor_id()
    )
  )
);

create policy "payments_update_same_parlor"
on public.payments
for update
to authenticated
using (
  public.current_user_role() in ('staff','admin','super_admin')
  and (
    public.is_super_admin()
    or (
      public.current_user_parlor_id() is not null
      and public.payments.parlor_id = public.current_user_parlor_id()
    )
  )
)
with check (
  public.current_user_role() in ('staff','admin','super_admin')
  and (
    public.is_super_admin()
    or (
      public.current_user_parlor_id() is not null
      and public.payments.parlor_id = public.current_user_parlor_id()
    )
  )
);

create policy "payments_delete_admin_only"
on public.payments
for delete
to authenticated
using (
  public.current_user_role() in ('admin','super_admin')
  and (
    public.is_super_admin()
    or (
      public.current_user_parlor_id() is not null
      and public.payments.parlor_id = public.current_user_parlor_id()
    )
  )
);

create policy "documents_select_same_parlor_or_super_admin"
on public.documents
for select
to authenticated
using (
  public.is_super_admin()
  or (
    public.current_user_parlor_id() is not null
    and public.documents.parlor_id = public.current_user_parlor_id()
  )
);

create policy "documents_insert_same_parlor"
on public.documents
for insert
to authenticated
with check (
  public.current_user_role() in ('staff','admin','super_admin')
  and (
    public.is_super_admin()
    or (
      public.current_user_parlor_id() is not null
      and public.documents.parlor_id = public.current_user_parlor_id()
    )
  )
);

create policy "documents_update_same_parlor"
on public.documents
for update
to authenticated
using (
  public.current_user_role() in ('staff','admin','super_admin')
  and (
    public.is_super_admin()
    or (
      public.current_user_parlor_id() is not null
      and public.documents.parlor_id = public.current_user_parlor_id()
    )
  )
)
with check (
  public.current_user_role() in ('staff','admin','super_admin')
  and (
    public.is_super_admin()
    or (
      public.current_user_parlor_id() is not null
      and public.documents.parlor_id = public.current_user_parlor_id()
    )
  )
);

create policy "documents_delete_admin_only"
on public.documents
for delete
to authenticated
using (
  public.current_user_role() in ('admin','super_admin')
  and (
    public.is_super_admin()
    or (
      public.current_user_parlor_id() is not null
      and public.documents.parlor_id = public.current_user_parlor_id()
    )
  )
);

drop policy if exists "tasks_read_all" on public.tasks;
drop policy if exists "tasks_insert_same_parlor" on public.tasks;
drop policy if exists "tasks_update_same_parlor" on public.tasks;

create policy "tasks_select_same_parlor_or_super_admin"
on public.tasks
for select
to authenticated
using (
  public.is_super_admin()
  or (
    public.current_user_parlor_id() is not null
    and public.tasks.parlor_id = public.current_user_parlor_id()
  )
);

create policy "tasks_insert_same_parlor"
on public.tasks
for insert
to authenticated
with check (
  public.current_user_role() in ('staff','admin','super_admin')
  and (
    public.is_super_admin()
    or (
      public.current_user_parlor_id() is not null
      and public.tasks.parlor_id = public.current_user_parlor_id()
    )
  )
);

create policy "tasks_update_same_parlor"
on public.tasks
for update
to authenticated
using (
  public.current_user_role() in ('staff','admin','super_admin')
  and (
    public.is_super_admin()
    or (
      public.current_user_parlor_id() is not null
      and public.tasks.parlor_id = public.current_user_parlor_id()
    )
  )
)
with check (
  public.current_user_role() in ('staff','admin','super_admin')
  and (
    public.is_super_admin()
    or (
      public.current_user_parlor_id() is not null
      and public.tasks.parlor_id = public.current_user_parlor_id()
    )
  )
);

create policy "tasks_delete_admin_only"
on public.tasks
for delete
to authenticated
using (
  public.current_user_role() in ('admin','super_admin')
  and (
    public.is_super_admin()
    or (
      public.current_user_parlor_id() is not null
      and public.tasks.parlor_id = public.current_user_parlor_id()
    )
  )
);

drop policy if exists "client_documents_insert_same_parlor" on public.client_documents;
drop policy if exists "client_documents_delete_owner_or_admin" on public.client_documents;

create policy "client_documents_insert_same_parlor"
on public.client_documents
for insert
to authenticated
with check (
  public.current_user_role() in ('staff','admin','super_admin')
  and exists (
    select 1
    from public.clients c
    where c.id = public.client_documents.client_id
      and (
        public.is_super_admin()
        or (
          public.current_user_parlor_id() is not null
          and c.parlor_id = public.current_user_parlor_id()
        )
      )
  )
);

create policy "client_documents_delete_owner_or_admin"
on public.client_documents
for delete
to authenticated
using (
  uploaded_by = auth.uid()
  or (
    public.current_user_role() in ('admin','super_admin')
    and exists (
      select 1
      from public.clients c
      where c.id = public.client_documents.client_id
        and (
          public.is_super_admin()
          or (
            public.current_user_parlor_id() is not null
            and c.parlor_id = public.current_user_parlor_id()
          )
        )
    )
  )
);

commit;
