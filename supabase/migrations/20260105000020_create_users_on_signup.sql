begin;

create or replace function public.handle_auth_user_created()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.users (
    id,
    email,
    full_name,
    role,
    created_at,
    updated_at
  )
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'fullName',
      new.raw_user_meta_data ->> 'name',
      null
    ),
    'viewer',
    now(),
    now()
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

-- Ensure the trigger is set (idempotent)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_auth_user_created();

commit;
