-- ELUS · Mensagens entre conexões aprovadas (chat 1:1)
-- Migration 017 — gravada no repo; aplicar só após confirmação (sem db push automático).
--
-- Recurso: texto puro, sem anexo, sem read receipts, sem gate de plano.
-- Uma conversa por connection (UNIQUE em connection_id). Elegibilidade e
-- bloqueio são reforçados no banco via trigger, não só na app (Fase 2).
--
-- Nomenclatura de participantes segue o padrão já usado em connections/
-- connection_requests/contact_requests/reports: from_user_id/to_user_id
-- (não user_a_id/user_b_id), copiados diretamente da connection na criação.

-- ============================================================
-- conversations
-- ============================================================

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  -- ON DELETE CASCADE: se a connection sumir (ex.: delete-account apaga
  -- connections no passo 1, sem tratar dependentes), a conversa some junto
  -- em vez de quebrar a exclusão de conta com erro de FK.
  connection_id uuid not null unique
    references public.connections (id) on delete cascade,
  from_user_id uuid not null references public.users (id) on delete cascade,
  to_user_id uuid not null references public.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  -- Atualizado só pelo trigger messages_touch_conversation (abaixo).
  last_message_at timestamptz,

  constraint conversations_no_self_reference check (from_user_id <> to_user_id)
);

create index if not exists conversations_from_user_id_idx
  on public.conversations (from_user_id);
create index if not exists conversations_to_user_id_idx
  on public.conversations (to_user_id);
create index if not exists conversations_last_message_at_idx
  on public.conversations (last_message_at desc);

comment on table public.conversations is
  'Uma conversa por connection accepted (connection_id é UNIQUE). Participantes copiados de connections na criação.';

-- ============================================================
-- messages
-- ============================================================

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null
    references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.users (id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now(),
  -- Soft delete reservado para moderação futura (Fase 4+, ex.: admin
  -- removendo conteúdo denunciado). Não implementar botão de apagar
  -- pelo próprio usuário nesta versão.
  deleted_at timestamptz,

  constraint messages_content_length_check
    check (
      char_length(trim(content)) > 0
      and char_length(trim(content)) <= 2000
    )
);

create index if not exists messages_conversation_id_idx
  on public.messages (conversation_id);
create index if not exists messages_conversation_created_idx
  on public.messages (conversation_id, created_at);

comment on table public.messages is
  'Mensagens de texto puro (sem anexo). Elegibilidade (connection accepted, sem bloqueio) validada por trigger BEFORE INSERT, não só por RLS.';

-- ============================================================
-- Helper: bloqueio ativo em qualquer direção
--
-- Precisa ser SECURITY DEFINER porque a policy de blocked_users
-- ("Usuário gerencia seus bloqueios", using blocker_id = auth.uid())
-- só deixa cada usuário ver os bloqueios que ELE MESMO criou. Sem
-- bypassar essa RLS aqui dentro, um trigger ou policy comum jamais
-- enxergaria um bloqueio feito pela outra pessoa contra o usuário atual.
-- ============================================================

create or replace function public.elus_has_active_block(user1 uuid, user2 uuid)
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.blocked_users b
    where (b.blocker_id = user1 and b.blocked_id = user2)
       or (b.blocker_id = user2 and b.blocked_id = user1)
  );
$$;

-- ============================================================
-- Trigger: valida connection na criação da conversa
-- ============================================================

create or replace function public.conversations_validate_connection()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  conn record;
begin
  select from_user_id, to_user_id, status
    into conn
    from public.connections
    where id = new.connection_id;

  if not found then
    raise exception 'conversations: connection_id inexistente';
  end if;

  if conn.status <> 'accepted' then
    raise exception 'conversations: connection precisa estar accepted';
  end if;

  if not (
    (conn.from_user_id = new.from_user_id and conn.to_user_id = new.to_user_id)
    or
    (conn.from_user_id = new.to_user_id and conn.to_user_id = new.from_user_id)
  ) then
    raise exception 'conversations: participantes não batem com a connection';
  end if;

  return new;
end;
$$;

drop trigger if exists conversations_validate_connection_trg
  on public.conversations;
create trigger conversations_validate_connection_trg
  before insert on public.conversations
  for each row
  execute function public.conversations_validate_connection();

-- ============================================================
-- Trigger: valida elegibilidade na criação de cada mensagem
-- (participante da conversa, connection ainda accepted, sem bloqueio)
-- ============================================================

create or replace function public.messages_validate_insert()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  conv record;
begin
  select c.from_user_id, c.to_user_id, cn.status as connection_status
    into conv
    from public.conversations c
    join public.connections cn on cn.id = c.connection_id
    where c.id = new.conversation_id;

  if not found then
    raise exception 'messages: conversation_id inexistente';
  end if;

  if new.sender_id <> conv.from_user_id and new.sender_id <> conv.to_user_id then
    raise exception 'messages: sender não é participante da conversa';
  end if;

  if conv.connection_status <> 'accepted' then
    raise exception 'messages: connection não está mais accepted';
  end if;

  if public.elus_has_active_block(conv.from_user_id, conv.to_user_id) then
    raise exception 'messages: bloqueio ativo entre os participantes';
  end if;

  return new;
end;
$$;

drop trigger if exists messages_validate_insert_trg on public.messages;
create trigger messages_validate_insert_trg
  before insert on public.messages
  for each row
  execute function public.messages_validate_insert();

-- ============================================================
-- Trigger: atualiza conversations.last_message_at a cada mensagem
-- (SECURITY DEFINER porque não existe policy de UPDATE para o
-- usuário comum em conversations — só este trigger deve tocar a coluna)
-- ============================================================

create or replace function public.messages_touch_conversation()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.conversations
    set last_message_at = new.created_at
    where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists messages_touch_conversation_trg on public.messages;
create trigger messages_touch_conversation_trg
  after insert on public.messages
  for each row
  execute function public.messages_touch_conversation();

-- ============================================================
-- RLS: conversations
-- ============================================================

alter table public.conversations enable row level security;

drop policy if exists "ler_propria_conversa" on public.conversations;
create policy "ler_propria_conversa"
  on public.conversations
  for select
  to authenticated
  using (
    (from_user_id = auth.uid() or to_user_id = auth.uid())
    and not public.elus_has_active_block(from_user_id, to_user_id)
  );

-- Validação pesada (connection accepted, participantes batem) fica no
-- trigger acima; esta policy só garante que quem cria é um dos dois.
drop policy if exists "criar_propria_conversa" on public.conversations;
create policy "criar_propria_conversa"
  on public.conversations
  for insert
  to authenticated
  with check (from_user_id = auth.uid() or to_user_id = auth.uid());

-- Sem UPDATE/DELETE policy de propósito: last_message_at só muda via
-- trigger SECURITY DEFINER; conversa não é editável/apagável pelo usuário.

grant select, insert on public.conversations to authenticated;

-- ============================================================
-- RLS: messages
-- ============================================================

alter table public.messages enable row level security;

drop policy if exists "ler_mensagens_da_propria_conversa" on public.messages;
create policy "ler_mensagens_da_propria_conversa"
  on public.messages
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.conversations c
      where c.id = messages.conversation_id
        and (c.from_user_id = auth.uid() or c.to_user_id = auth.uid())
        and not public.elus_has_active_block(c.from_user_id, c.to_user_id)
    )
  );

-- Validação pesada (participante, connection accepted, sem bloqueio) fica
-- no trigger BEFORE INSERT acima; esta policy só garante ownership básico.
drop policy if exists "inserir_propria_mensagem" on public.messages;
create policy "inserir_propria_mensagem"
  on public.messages
  for insert
  to authenticated
  with check (sender_id = auth.uid());

-- Sem UPDATE/DELETE policy de propósito nesta versão — sem apagar/editar
-- mensagem pelo usuário comum (deleted_at é só para moderação futura).

grant select, insert on public.messages to authenticated;

-- ============================================================
-- reports: coluna opcional para denunciar mensagem específica
-- ============================================================

alter table public.reports
  add column if not exists message_id uuid
    references public.messages (id) on delete set null;

create index if not exists reports_message_id_idx on public.reports (message_id);

comment on column public.reports.message_id is
  'Opcional. Se a mensagem for apagada depois, a denúncia continua existindo (SET NULL, não CASCADE) para fins de auditoria/moderação.';

-- Policies existentes de reports (criar_denuncia_conduta, criar_denuncia_identidade,
-- ler_denuncias_admin, decidir_denuncias_admin, ler_denuncias_proprias) não mudam.
-- criar_denuncia_conduta já exige connection accepted entre reporter e reported,
-- o que cobre denúncia de mensagem sem precisar de policy nova.
