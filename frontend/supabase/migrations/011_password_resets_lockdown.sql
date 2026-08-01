-- password_resets: remove acesso direto do cliente (anon/authenticated).
--
-- A migration 009 abriu SELECT e UPDATE com `USING (true)`, ou seja,
-- qualquer usuário com a chave anon do app conseguia listar a tabela
-- inteira e ler o reset_code de qualquer conta (falha de segurança: dava
-- pra sequestrar qualquer conta pelo fluxo de "esqueci minha senha" sem
-- nem precisar adivinhar o código).
--
-- A partir de agora, toda leitura/escrita em password_resets acontece
-- exclusivamente dentro da Edge Function `reset-password`, usando a
-- service role key (que ignora RLS). O app cliente não deve mais tocar
-- nesta tabela diretamente.

DROP POLICY IF EXISTS "allow_insert_password_resets" ON public.password_resets;
DROP POLICY IF EXISTS "allow_select_own_resets" ON public.password_resets;
DROP POLICY IF EXISTS "allow_update_own_resets" ON public.password_resets;

REVOKE SELECT, INSERT, UPDATE, DELETE ON public.password_resets FROM anon;
REVOKE SELECT, INSERT, UPDATE, DELETE ON public.password_resets FROM authenticated;

-- RLS continua ativa e agora sem nenhuma policy para anon/authenticated:
-- por padrão do Postgres, isso nega todo acesso a essas roles. Apenas
-- service_role (usada pela Edge Function) continua com acesso total,
-- pois service_role sempre ignora RLS.
ALTER TABLE public.password_resets ENABLE ROW LEVEL SECURITY;
