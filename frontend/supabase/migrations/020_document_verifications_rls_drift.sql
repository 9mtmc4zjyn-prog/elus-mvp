-- ELUS · documenta RLS e constraint já existentes em public.verifications (schema drift)
-- Migration 020 — gravada no repo; aplicar só após confirmação (sem db push automático).
--
-- A constraint UNIQUE(user_id) e as 3 policies abaixo já existem e funcionam
-- no banco remoto (confirmado via pg_constraint / pg_policies) — nenhuma
-- delas estava em migration versionada até agora. Esta migration só registra
-- a estrutura real no repositório, fechando o "schema drift" (mesmo padrão
-- de 004_document_reports_and_blocked_users.sql). Segura de rodar mesmo com
-- a constraint/policies já existentes.
--
-- NÃO muda nada do comportamento atual — só documenta.
--
-- Nota: UNIQUE(user_id) impede múltiplas linhas por usuário, o que torna o
-- índice parcial verifications_one_current_per_user_idx (migration 001)
-- redundante na prática hoje. Não alterado aqui (decisão de produto: não
-- restaurar histórico multi-tentativa nesta rodada).

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.verifications'::regclass
      and conname = 'verifications_user_id_key'
  ) then
    alter table public.verifications add constraint verifications_user_id_key unique (user_id);
  end if;
end
$$;

drop policy if exists "user_insert_own_verification" on public.verifications;
create policy "user_insert_own_verification"
  on public.verifications
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "user_select_own_verification" on public.verifications;
create policy "user_select_own_verification"
  on public.verifications
  for select
  using (auth.uid() = user_id);

drop policy if exists "user_update_own_verification" on public.verifications;
create policy "user_update_own_verification"
  on public.verifications
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id and status <> 'verified');
