-- ELUS · acesso de administrador à verificação de registro profissional
-- Segue o mesmo padrão de public.reports (migration 004): admin é o
-- usuário com public.users.is_admin = true. Sem estas policies, um admin
-- só enxerga a própria linha (política "ler/atualizar_propria_..."),
-- porque RLS é restritivo por padrão — cada policy nova soma acesso.

drop policy if exists "ler_verificacoes_profissionais_admin"
  on public.professional_verifications;
create policy "ler_verificacoes_profissionais_admin"
  on public.professional_verifications
  for select
  using (
    exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true)
  );

drop policy if exists "decidir_verificacoes_profissionais_admin"
  on public.professional_verifications;
create policy "decidir_verificacoes_profissionais_admin"
  on public.professional_verifications
  for update
  using (
    exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true)
  )
  with check (
    exists (select 1 from public.users u where u.id = auth.uid() and u.is_admin = true)
  );
