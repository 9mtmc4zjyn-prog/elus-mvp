-- Fase 1 do plano de IA do ELUS (Semanas 1-4): SEM IA externa.
-- Só schema de apoio para (a) ranking local por regras determinísticas
-- (parentesco / conterrâneos / grafo de confiança / proximidade) e
-- (b) log de interações com sugestões, para virar dataset de treino
-- nas Semanas 5-8.
--
-- Decisão de produto (confirmada com o dono do projeto em 27/07/2026):
-- NÃO coletamos rua/bairro. A Política de Privacidade já publicada
-- (app/privacy-policy.tsx) promete "apenas cidade e estado declarados,
-- nunca localização exata" — manter esse contrato. O ranking usa só
-- cidade/estado (atual e de origem/naturalidade).

-- 1) Sobrenome + origem (naturalidade) no perfil.
-- Campos opcionais (default ''), preenchidos pelo próprio usuário.
-- "origin_city"/"origin_state" = de onde a pessoa é (naturalidade),
-- diferente de "city"/"state" que já existem e guardam a localização
-- atual declarada.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS surname text NOT NULL DEFAULT '';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS origin_city text NOT NULL DEFAULT '';

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS origin_state text NOT NULL DEFAULT '';

-- 2) Log de sugestões (mostradas / aceitas / rejeitadas).
-- Cada linha é UM evento sobre UMA sugestão vista pelo usuário — não é
-- a conexão em si (essa já existe em connections/connection_requests).
-- Guarda o score e a prioridade que geraram a sugestão, para depois
-- correlacionar "que tipo de sugestão converte mais" (Semanas 5-8).
CREATE TABLE IF NOT EXISTS public.suggestion_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  suggested_user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  priority smallint NOT NULL,
  score integer NOT NULL,
  reason text NOT NULL DEFAULT '',
  action text NOT NULL CHECK (action IN ('shown', 'accepted', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT suggestion_events_no_self_reference CHECK (viewer_user_id <> suggested_user_id)
);

CREATE INDEX IF NOT EXISTS suggestion_events_viewer_idx
  ON public.suggestion_events (viewer_user_id);

CREATE INDEX IF NOT EXISTS suggestion_events_created_idx
  ON public.suggestion_events (created_at);

-- Sem GRANT, o INSERT/SELECT do cliente (chave anon/authenticated) falha
-- com 42501 mesmo com a policy de RLS certa — mesmo problema que a 009
-- teve com password_resets. Aqui só liberamos para "authenticated"
-- (usuário logado); "anon" não deveria nunca gravar evento de sugestão.
GRANT SELECT, INSERT ON public.suggestion_events TO authenticated;

ALTER TABLE public.suggestion_events ENABLE ROW LEVEL SECURITY;

-- Cada usuário só grava/lê os próprios eventos como "viewer". Nunca
-- expõe pra quem foi sugerido nem pra terceiros (mesmo padrão usado na
-- correção do password_resets: acesso restrito ao dono do dado, sem
-- `USING (true)`). Só INSERT + SELECT — log é append-only, sem
-- UPDATE/DELETE policy de propósito.
DROP POLICY IF EXISTS "insert_own_suggestion_events" ON public.suggestion_events;
CREATE POLICY "insert_own_suggestion_events" ON public.suggestion_events
  FOR INSERT
  WITH CHECK (viewer_user_id = auth.uid());

DROP POLICY IF EXISTS "select_own_suggestion_events" ON public.suggestion_events;
CREATE POLICY "select_own_suggestion_events" ON public.suggestion_events
  FOR SELECT
  USING (viewer_user_id = auth.uid());
