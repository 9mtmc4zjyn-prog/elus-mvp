-- ELUS · corrige leitura de conversa pra usar relógio do servidor
-- Migration 024 — gravada no repo; aplicar só após confirmação (sem db push automático).
--
-- Bug encontrado em teste antes de ir pro app: a migration 023 fazia o
-- client gravar from/to_user_read_at com new Date() (relógio do próprio
-- aparelho). Se o relógio do device estiver atrasado em relação ao
-- servidor — nada incomum em celular real — o read_at gravado fica
-- ANTES de last_message_at (que usa now() do Postgres), e o badge de
-- "não lida" nunca some, mesmo com a conversa aberta.
--
-- Fix: function SECURITY DEFINER que sempre usa now() do servidor.
-- Com isso, o acesso direto de UPDATE aberto na 023 (policy + GRANT por
-- coluna) deixa de ser necessário — fecha os dois.

create or replace function public.mark_conversation_read(p_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.conversations
  set
    from_user_read_at = case when from_user_id = auth.uid() then now() else from_user_read_at end,
    to_user_read_at = case when to_user_id = auth.uid() then now() else to_user_read_at end
  where id = p_conversation_id
    and (from_user_id = auth.uid() or to_user_id = auth.uid());
end;
$$;

grant execute on function public.mark_conversation_read(uuid) to authenticated;

revoke update (from_user_read_at, to_user_read_at) on public.conversations from authenticated;
drop policy if exists "marcar_propria_conversa_como_lida" on public.conversations;
