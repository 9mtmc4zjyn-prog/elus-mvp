-- ELUS · guarda a data de nascimento em public.users (não só nos metadados de login)
-- Contexto: signup.tsx já valida idade mínima (18) e envia birth_date no
-- cadastro (options.data), mas esse valor ficava só em auth.users.raw_user_meta_data
-- — difícil de auditar depois. Esta migration:
--   1. Cria a coluna public.users.birth_date
--   2. Atualiza o trigger de bootstrap para gravar a data já na criação da conta
--   3. Faz backfill das contas que já existem, lendo o valor salvo nos metadados

alter table public.users
  add column if not exists birth_date date;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_name text;
  user_birth_date date;
begin
  user_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'name'), ''),
    nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
    'Novo usuário ELUS'
  );

  -- Cast protegido: se o valor vier ausente ou malformado, birth_date fica
  -- null em vez de travar a criação da conta.
  begin
    user_birth_date := nullif(trim(new.raw_user_meta_data->>'birth_date'), '')::date;
  exception when others then
    user_birth_date := null;
  end;

  insert into public.users (id, email, birth_date)
  values (new.id, new.email, user_birth_date)
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

-- Backfill: contas criadas antes desta migration, que já têm birth_date
-- nos metadados do Supabase Auth mas ainda não em public.users.
update public.users u
set birth_date = (au.raw_user_meta_data->>'birth_date')::date
from auth.users au
where au.id = u.id
  and u.birth_date is null
  and au.raw_user_meta_data ? 'birth_date'
  and trim(au.raw_user_meta_data->>'birth_date') ~ '^\d{4}-\d{2}-\d{2}$';
