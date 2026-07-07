-- 004_document_reports_and_blocked_users.sql
-- Documenta a estrutura já existente das tabelas public.reports e public.blocked_users.
-- Essas tabelas já existem e funcionam no banco; esta migration só registra a estrutura
-- real no repositório, fechando o "schema drift" identificado anteriormente.
-- Segura de rodar mesmo com as tabelas já existentes (usa IF NOT EXISTS / DROP...IF EXISTS).

-- ============================================================
-- Tabela: blocked_users
-- ============================================================

create table if not exists public.blocked_users (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid references auth.users (id) on delete cascade,
  blocked_id uuid references auth.users (id) on delete cascade,
  created_at timestamptz default now(),
  constraint blocked_users_blocker_id_blocked_id_key unique (blocker_id, blocked_id)
);

alter table public.blocked_users enable row level security;

drop policy if exists "Usuário gerencia seus bloqueios" on public.blocked_users;
create policy "Usuário gerencia seus bloqueios"
  on public.blocked_users
  for all
  using (blocker_id = auth.uid());

-- ============================================================
-- Tabela: reports
-- ============================================================

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.users (id),
  reported_id uuid not null references public.users (id),
  type text not null,
  category text not null,
  reason text,
  status text not null default 'pendente',
  created_at timestamptz not null default now(),
  reviewed_by uuid references public.users (id),
  reviewed_at timestamptz,
  resolution_note text
);

alter table public.reports enable row level security;

drop policy if exists "criar_denuncia_identidade" on public.reports;
create policy "criar_denuncia_identidade"
  on public.reports
  for insert
  with check (
    type = 'identidade' and reporter_id = auth.uid()
  );

drop policy if exists "criar_denuncia_conduta" on public.reports;
create policy "criar_denuncia_conduta"
  on public.reports
  for insert
  with check (
    type = 'conduta'
    and reporter_id = auth.uid()
    and exists (
      select 1 from connections
      where connections.status = 'accepted'::elus_request_status
        and (
          (connections.from_user_id = auth.uid() and connections.to_user_id = reports.reported_id)
          or
          (connections.from_user_id = reports.reported_id and connections.to_user_id = auth.uid())
        )
    )
  );

drop policy if exists "ler_denuncias_admin" on public.reports;
create policy "ler_denuncias_admin"
  on public.reports
  for select
  using (
    exists (select 1 from users u where u.id = auth.uid() and u.is_admin = true)
  );

drop policy if exists "decidir_denuncias_admin" on public.reports;
create policy "decidir_denuncias_admin"
  on public.reports
  for update
  using (
    exists (select 1 from users u where u.id = auth.uid() and u.is_admin = true)
  )
  with check (
    exists (select 1 from users u where u.id = auth.uid() and u.is_admin = true)
  );
