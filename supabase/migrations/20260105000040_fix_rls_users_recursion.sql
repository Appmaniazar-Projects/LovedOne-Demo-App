begin;

-- Fix RLS recursion / stack depth exceeded:
-- RLS helper functions were querying public.users, while public.users policies call those helpers.
-- Make helpers SECURITY DEFINER and ensure the definer can bypass users RLS by NOT forcing RLS on public.users.

alter table public.users no force row level security;

create or replace function public.get_user_role(target_user_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select u.role from public.users u where u.id = target_user_id;
$$;

create or replace function public.get_user_parlor_id(target_user_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select u.parlor_id from public.users u where u.id = target_user_id;
$$;

create or replace function public.get_user_email(target_user_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select u.email from public.users u where u.id = target_user_id;
$$;

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.get_user_role(auth.uid());
$$;

create or replace function public.current_user_parlor_id()
returns uuid
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.get_user_parlor_id(auth.uid());
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select public.current_user_role() = 'super_admin';
$$;

-- Recreate users_update_own policy to avoid subqueries on public.users (which recurse)
drop policy if exists "users_update_own" on public.users;

create policy "users_update_own"
on public.users
for update
to authenticated
using (id = auth.uid())
with check (
  id = auth.uid()
  and role = public.get_user_role(auth.uid())
  and parlor_id is not distinct from public.get_user_parlor_id(auth.uid())
  and email is not distinct from public.get_user_email(auth.uid())
);

commit;
