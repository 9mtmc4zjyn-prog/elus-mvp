-- ELUS · rastreamento de leitura de conversas (badge de mensagem não lida)
-- Migration 023 — gravada no repo; aplicar só após confirmação (sem db push automático).
--
-- Uma coluna de "última leitura" por participante em conversations —
-- 2 colunas (from/to) em vez de tabela separada, seguindo o mesmo padrão
-- já usado pra participantes nessa tabela (from_user_id/to_user_id).
-- Null = nunca abriu a conversa.

alter table public.conversations
  add column if not exists from_user_read_at timestamptz,
  add column if not exists to_user_read_at timestamptz;

comment on column public.conversations.from_user_read_at is
  'Última vez que from_user_id abriu essa conversa. Null = nunca abriu.';
comment on column public.conversations.to_user_read_at is
  'Última vez que to_user_id abriu essa conversa. Null = nunca abriu.';

-- Ao enviar mensagem, o próprio remetente já "leu" até esse instante —
-- evita que a própria mensagem enviada apareça como não lida pra quem
-- a mandou. Substitui a function da migration 017 (trigger já existe
-- apontando pra ela, não precisa recriar o trigger).
create or replace function public.messages_touch_conversation()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.conversations
    set last_message_at = new.created_at,
        from_user_read_at = case
          when from_user_id = new.sender_id then new.created_at
          else from_user_read_at
        end,
        to_user_read_at = case
          when to_user_id = new.sender_id then new.created_at
          else to_user_read_at
        end
    where id = new.conversation_id;
  return new;
end;
$$;

-- Permite ao participante marcar a própria leitura. Nenhuma policy de
-- UPDATE existia em conversations até agora (migration 017: "conversa não
-- é editável pelo usuário", de propósito) — o GRANT abaixo, por coluna,
-- garante que mesmo com essa policy o cliente só consegue tocar nas 2
-- colunas de leitura, nunca em from_user_id/to_user_id/last_message_at
-- etc., mesmo que tente incluir esses campos na mesma chamada de UPDATE.
drop policy if exists "marcar_propria_conversa_como_lida" on public.conversations;
create policy "marcar_propria_conversa_como_lida"
  on public.conversations
  for update
  to authenticated
  using (from_user_id = auth.uid() or to_user_id = auth.uid())
  with check (from_user_id = auth.uid() or to_user_id = auth.uid());

grant update (from_user_read_at, to_user_read_at) on public.conversations to authenticated;
