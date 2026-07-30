-- ELUS · corrige 42501 em interest_card_views no INSERT/RETURNING/upsert
-- Migration 015
--
-- Causa: INSERT WITH CHECK passa, mas PostgREST/supabase-js faz RETURNING,
-- que exige SELECT RLS. A policy antiga só deixava o DONO do card ler views;
-- o viewer não via a própria linha → 42501.
--
-- Fix: policy SELECT adicional permitindo viewer_id = auth.uid().
-- Dono continua lendo todas as views dos próprios cards (policy existente).
--
-- REVERTER (015 down):
--   drop policy if exists "ler_propria_interest_card_view_como_viewer"
--     on public.interest_card_views;
-- Não apaga dados.

drop policy if exists "ler_propria_interest_card_view_como_viewer"
  on public.interest_card_views;
create policy "ler_propria_interest_card_view_como_viewer"
  on public.interest_card_views
  for select
  to authenticated
  using (viewer_id = auth.uid());

comment on policy "ler_propria_interest_card_view_como_viewer"
  on public.interest_card_views is
  'Viewer lê a própria linha (necessário para INSERT RETURNING / upsert).';
