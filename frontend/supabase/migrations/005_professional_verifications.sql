-- ELUS · verificação de registro profissional (pendência 5.2, decisão de 19/07/2026)
-- Verificação ASSISTIDA: o profissional informa conselho + número + nome de
-- registro; a equipe confere na consulta pública do conselho e aprova/rejeita.
-- Catálogo de conselhos: frontend/src/data/professionalCouncils.ts.

-- Status de rejeição (registro não confirmado na consulta pública).
alter type public.elus_verification_status add value if not exists 'rejected';

create table if not exists public.professional_verifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  -- Sigla do conselho (CRP, CRM, CREF, OAB...), conforme catálogo no app.
  council_id text not null,
  -- Número de registro informado pelo profissional.
  registration_number text not null,
  -- Nome completo como consta no registro do conselho.
  registered_name text not null,
  -- UF do registro (obrigatória para conselhos com consulta por estado).
  registration_state text not null default '',
  status public.elus_verification_status not null default 'in_review',
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references public.users (id) on delete set null,
  rejection_reason text,
  is_current boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists professional_verifications_user_id_idx
  on public.professional_verifications (user_id);

create index if not exists professional_verifications_status_idx
  on public.professional_verifications (status);

create unique index if not exists professional_verifications_one_current_idx
  on public.professional_verifications (user_id)
  where is_current = true;

alter table public.professional_verifications enable row level security;

drop policy if exists "ler_propria_verificacao_profissional"
  on public.professional_verifications;
create policy "ler_propria_verificacao_profissional"
  on public.professional_verifications
  for select
  using (user_id = auth.uid());

drop policy if exists "criar_propria_verificacao_profissional"
  on public.professional_verifications;
create policy "criar_propria_verificacao_profissional"
  on public.professional_verifications
  for insert
  with check (user_id = auth.uid());

drop policy if exists "atualizar_propria_verificacao_profissional"
  on public.professional_verifications;
create policy "atualizar_propria_verificacao_profissional"
  on public.professional_verifications
  for update
  using (user_id = auth.uid() and status <> 'verified');

-- Grant básico de tabela para o papel authenticated. RLS (acima) já
-- restringe por linha; sem este grant, o Postgres nega o acesso antes
-- mesmo de avaliar as policies ("permission denied for table").
grant select, insert, update on public.professional_verifications to authenticated;
