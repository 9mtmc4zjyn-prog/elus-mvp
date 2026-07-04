-- Migration: 001_add_last_seen_at_to_profiles.sql
-- Objetivo: adicionar a coluna last_seen_at à tabela public.profiles,
-- usada para calcular presença/"online" dos usuários reais no app
-- (ver AppContext.tsx: loadRealUsers computa isOnline a partir dela,
-- e o app atualiza essa coluna sempre que volta para o primeiro plano).
--
-- NÃO EXECUTAR AUTOMATICAMENTE — revisar e rodar manualmente no Supabase
-- (SQL Editor ou via CLI de migrations) quando estiver pronto.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz NULL;

COMMENT ON COLUMN public.profiles.last_seen_at IS
  'Data/hora (UTC) do último momento em que o app do usuário esteve em primeiro plano. Nula para perfis que nunca sincronizaram esse dado. Usada para calcular presença "online" (ex.: últimos 5 minutos) na aba Campo e telas relacionadas.';
