-- ELUS · Card de Status de Interesse (Ofereço / Procuro)
-- Migration 013 — gravada no repo; aplicar só após confirmação (sem db push automático).
--
-- Recurso: card temporário 24h no perfil. Não altera ranking do Campo de
-- Presença nem localização. Limites por plano (Essencial 1 imutável,
-- Plus 1 com encerramento antecipado, Premium 2, Comercial 3,
-- Empresa Pro 6 por unidade/CNPJ) e profundidade de visualizações
-- (agregado vs. exato) ficam na camada do app (Fase 2), lendo
-- public.subscriptions.plan_key — não neste schema.
--
-- Cor de UI "Ofereço" = theme purpleVivid (#A855F7); irrelevante aqui.

-- ============================================================
-- interest_cards
-- ============================================================

create table if not exists public.interest_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,

  type text not null,
  category text not null,
  description text,

  created_at timestamptz not null default now(),
  -- Sempre created_at + 24h; o trigger abaixo força no INSERT.
  expires_at timestamptz not null,
  -- Preenchido só se o plano permitir encerrar antes (Plus+); Essencial
  -- nunca deve gravar isso (enforcement na app; RLS só exige ownership).
  ended_early_at timestamptz,

  constraint interest_cards_type_check
    check (type in ('ofereco', 'procuro')),

  constraint interest_cards_category_check
    check (category in (
      'emprego',
      'servico',
      'networking',
      'moradia',
      'outro'
    )),

  constraint interest_cards_description_length_check
    check (
      description is null
      or char_length(description) <= 60
    ),

  constraint interest_cards_ended_early_window_check
    check (
      ended_early_at is null
      or (
        ended_early_at >= created_at
        and ended_early_at <= expires_at
      )
    )
);

create index if not exists interest_cards_user_id_idx
  on public.interest_cards (user_id);

create index if not exists interest_cards_expires_at_idx
  on public.interest_cards (expires_at);

-- Ativos: não encerrados e ainda dentro das 24h (útil pra listagens).
create index if not exists interest_cards_active_user_idx
  on public.interest_cards (user_id, expires_at)
  where ended_early_at is null;

comment on table public.interest_cards is
  'Card temporário Ofereço/Procuro (24h). Limites por plano na app.';

-- Força expires_at = created_at + 24 hours no INSERT (cliente não escolhe).
create or replace function public.interest_cards_set_expires_at()
returns trigger
language plpgsql
as $$
begin
  if new.created_at is null then
    new.created_at := now();
  end if;
  new.expires_at := new.created_at + interval '24 hours';
  return new;
end;
$$;

drop trigger if exists interest_cards_set_expires_at_trg
  on public.interest_cards;
create trigger interest_cards_set_expires_at_trg
  before insert on public.interest_cards
  for each row
  execute function public.interest_cards_set_expires_at();

-- Após criar, só ended_early_at pode mudar (e só de null → timestamp).
-- type/category/description/expires_at/user_id/created_at são imutáveis.
-- Update no-op (nenhuma coluna muda) é permitido.
create or replace function public.interest_cards_restrict_update()
returns trigger
language plpgsql
as $$
begin
  if new.user_id is distinct from old.user_id
     or new.type is distinct from old.type
     or new.category is distinct from old.category
     or new.description is distinct from old.description
     or new.created_at is distinct from old.created_at
     or new.expires_at is distinct from old.expires_at
  then
    raise exception
      'interest_cards: apenas ended_early_at pode ser atualizado';
  end if;

  if old.ended_early_at is not null
     and new.ended_early_at is distinct from old.ended_early_at
  then
    raise exception
      'interest_cards: ended_early_at já preenchido não pode ser alterado';
  end if;

  return new;
end;
$$;

drop trigger if exists interest_cards_restrict_update_trg
  on public.interest_cards;
create trigger interest_cards_restrict_update_trg
  before update on public.interest_cards
  for each row
  execute function public.interest_cards_restrict_update();

alter table public.interest_cards enable row level security;

-- Leitura: só usuário com verificação de identidade corrente aprovada
-- (mesmo gate de descoberta/conexão no app).
drop policy if exists "ler_interest_cards_verificado"
  on public.interest_cards;
create policy "ler_interest_cards_verificado"
  on public.interest_cards
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.verifications v
      where v.user_id = auth.uid()
        and v.is_current = true
        and v.status = 'verified'
    )
  );

drop policy if exists "inserir_proprio_interest_card"
  on public.interest_cards;
create policy "inserir_proprio_interest_card"
  on public.interest_cards
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- Encerrar antecipado = UPDATE de ended_early_at. Plano Essencial é
-- bloqueado na app; RLS só garante ownership.
drop policy if exists "atualizar_proprio_interest_card"
  on public.interest_cards;
create policy "atualizar_proprio_interest_card"
  on public.interest_cards
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Sem DELETE policy de propósito — card expira ou encerra via ended_early_at.

grant select, insert, update on public.interest_cards to authenticated;

-- ============================================================
-- interest_card_views
-- ============================================================

create table if not exists public.interest_card_views (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null
    references public.interest_cards (id) on delete cascade,
  viewer_id uuid not null
    references public.users (id) on delete cascade,
  viewed_at timestamptz not null default now(),

  constraint interest_card_views_unique_viewer
    unique (card_id, viewer_id)
  -- Anti-auto-view (viewer ≠ dono do card): sem CHECK no schema —
  -- a regra fica na policy RLS de INSERT abaixo e na camada do app.
);

create index if not exists interest_card_views_card_id_idx
  on public.interest_card_views (card_id);

create index if not exists interest_card_views_viewer_id_idx
  on public.interest_card_views (viewer_id);

comment on table public.interest_card_views is
  'Uma visualização por par (card, viewer). Só o dono do card lê as linhas.';

alter table public.interest_card_views enable row level security;

-- Insert: só a própria linha; viewer verificado; não conta visita no próprio card.
drop policy if exists "inserir_propria_interest_card_view"
  on public.interest_card_views;
create policy "inserir_propria_interest_card_view"
  on public.interest_card_views
  for insert
  to authenticated
  with check (
    viewer_id = auth.uid()
    and exists (
      select 1
      from public.verifications v
      where v.user_id = auth.uid()
        and v.is_current = true
        and v.status = 'verified'
    )
    and exists (
      select 1
      from public.interest_cards c
      where c.id = card_id
        and c.user_id <> auth.uid()
        and c.ended_early_at is null
        and c.expires_at > now()
    )
  );

-- Select linha a linha: só o dono do card (agregado vs. lista = app/plano).
drop policy if exists "ler_views_do_proprio_interest_card"
  on public.interest_card_views;
create policy "ler_views_do_proprio_interest_card"
  on public.interest_card_views
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.interest_cards c
      where c.id = card_id
        and c.user_id = auth.uid()
    )
  );

-- Sem UPDATE/DELETE — append-only; unique (card_id, viewer_id) impede duplicata.

grant select, insert on public.interest_card_views to authenticated;
