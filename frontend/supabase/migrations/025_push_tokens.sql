-- ELUS · tokens de push notification por dispositivo
-- Migration 025 — gravada no repo; aplicar só após confirmação (sem db push automático).
--
-- Um token por dispositivo (não por usuário — a mesma pessoa pode logar
-- em mais de um aparelho, e um aparelho pode trocar de conta). UNIQUE em
-- token: se o mesmo device gerar o token de novo pra outra conta (logout
-- + login com conta diferente no mesmo aparelho), o upsert por token
-- reassocia pro novo user_id em vez de duplicar.

create table if not exists public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  token text not null,
  platform text not null check (platform in ('ios', 'android')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint push_tokens_unique_token unique (token)
);

create index if not exists push_tokens_user_id_idx on public.push_tokens (user_id);

comment on table public.push_tokens is
  'Token de push (Expo) por dispositivo. Enviado pela Edge Function push-notify, lida com service_role.';

alter table public.push_tokens enable row level security;

-- Cada usuário só gerencia os próprios tokens (registrar/atualizar/remover
-- no logout). A Edge Function que envia push usa service_role e não passa
-- por RLS.
drop policy if exists "gerencia_proprio_push_token" on public.push_tokens;
create policy "gerencia_proprio_push_token"
  on public.push_tokens
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, insert, update, delete on public.push_tokens to authenticated;
