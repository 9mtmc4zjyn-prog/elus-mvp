-- ELUS · habilita Supabase Realtime para public.messages
-- Migration 018 — necessária para a Fase 3 (mensagens aparecerem na tela de
-- conversa aberta sem recarregar, via subscription filtrada por conversation_id).
--
-- Achado da Fase 0: nenhuma tabela do projeto estava na publicação
-- supabase_realtime antes desta migration — Realtime nunca foi usado aqui.
-- RLS de messages (017) já garante que só mensagens visíveis ao usuário
-- (participante, sem bloqueio ativo) chegam pelo Realtime também, porque
-- o Realtime respeita RLS por padrão.

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end
$$;
