-- ELUS · bootstrap automático ao criar conta no Supabase Auth
-- Insere public.users, public.profiles e verificação inicial (unverified).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_name text;
begin
  user_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'name'), ''),
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    'Novo usuário ELUS'
  );

  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;

  insert into public.profiles (id, name)
  values (new.id, user_name)
  on conflict (id) do nothing;

  if not exists (
    select 1
    from public.verifications as v
    where v.user_id = new.id
      and v.is_current = true
  ) then
    insert into public.verifications (user_id, status, is_current)
    values (new.id, 'unverified', true);
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();
