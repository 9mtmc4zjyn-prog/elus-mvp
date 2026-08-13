-- ELUS · sincroniza profiles.visibility_status a partir de verifications
-- Migration 022 — gravada no repo; aplicar só após confirmação (sem db push automático).
--
-- Bug: no client, loadRealUsers (AppContext.tsx) tenta descobrir o status
-- de verificação de OUTROS usuários lendo public.verifications direto —
-- mas a policy de SELECT ali (user_select_own_verification) só permite
-- ler a própria linha (auth.uid() = user_id), por design (dados de
-- verificação são privados). Resultado: pra qualquer usuário que não seja
-- o próprio logado, a query sempre volta 0 linhas, e o client cai no
-- fallback 'unverified' — ou seja, todo mundo aparece como não-verificado
-- pros outros, mesmo estando verified de verdade.
--
-- profiles.visibility_status já existe desde a migration 001 (com índice
-- dedicado) exatamente pra ser o canal público desse status, mas nunca foi
-- sincronizado com verifications. Esta migration liga essa sincronização.

create or replace function public.sync_profile_visibility_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_current then
    update public.profiles
    set visibility_status = case
      when new.status = 'verified' then 'verified'::public.elus_profile_visibility_status
      when new.status = 'in_review' then 'in_review'::public.elus_profile_visibility_status
      else 'unverified'::public.elus_profile_visibility_status
    end
    where id = new.user_id;
  end if;

  return new;
end;
$$;

drop trigger if exists verifications_sync_visibility_status_trg on public.verifications;
create trigger verifications_sync_visibility_status_trg
  after insert or update on public.verifications
  for each row
  execute function public.sync_profile_visibility_status();

-- Backfill pros usuários que já existem hoje.
update public.profiles p
set visibility_status = case
  when v.status = 'verified' then 'verified'::public.elus_profile_visibility_status
  when v.status = 'in_review' then 'in_review'::public.elus_profile_visibility_status
  else 'unverified'::public.elus_profile_visibility_status
end
from public.verifications v
where v.user_id = p.id
  and v.is_current = true;
