-- ELUS · concede a service_role acesso de leitura pras tabelas que a
-- Edge Function push-notify precisa consultar
-- Migration 026 — gravada no repo; aplicar só após confirmação (sem db push automático).
--
-- Achado em teste: neste projeto, service_role NÃO tem GRANT implícito
-- em tabelas criadas via migration — só REFERENCES/TRIGGER/TRUNCATE por
-- padrão (confirmado via information_schema.role_table_grants). Mesmo
-- padrão já visto antes (script de teste batendo em "permission denied"
-- pra verifications/interest_cards com a JWT legada de service_role).
-- Cada tabela nova migration já concede explicitamente pra "authenticated"
-- — aqui concedemos SELECT pra "service_role" nas tabelas que a function
-- push-notify lê (mensagens/conversas/perfis/conexões/solicitações/tokens),
-- sem alterar nenhuma policy de RLS existente (service_role já ignora RLS
-- por BYPASSRLS; só faltava o GRANT de tabela).

grant select on public.messages to service_role;
grant select on public.conversations to service_role;
grant select on public.profiles to service_role;
grant select on public.push_tokens to service_role;
grant select on public.connections to service_role;
grant select on public.connection_requests to service_role;
grant select on public.contact_requests to service_role;
