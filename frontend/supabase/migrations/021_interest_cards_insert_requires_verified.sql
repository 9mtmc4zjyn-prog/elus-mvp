-- ELUS · exige verificação de identidade também no INSERT de interest_cards
-- Migration 021 — gravada no repo; aplicar só após confirmação (sem db push automático).
--
-- Bug de enforcement: a policy de INSERT "inserir_proprio_interest_card"
-- (migration 013) só checava user_id = auth.uid(), sem exigir identidade
-- verificada — diferente da policy de SELECT "ler_interest_cards_verificado",
-- que já exige. Isso deixava só o client responsável por bloquear criação de
-- card por usuário não-verificado; alguém chamando a API do Supabase direto
-- (bypassando o app) ainda conseguia inserir uma linha.
--
-- Risco confirmado: a policy de SELECT de interest_cards não é escopada por
-- dono da linha — ela libera leitura de QUALQUER linha da tabela para
-- qualquer VIEWER verificado (using checa v.user_id = auth.uid() do
-- leitor, não do dono do card). Ou seja, uma linha "órfã" inserta por um
-- usuário não-verificado não aparece pra ele mesmo (ele não é verificado),
-- mas aparece normalmente pra outros usuários verificados navegando o Campo
-- de Presença (fetchActiveInterestCardsForUsers, em app/(tabs)/index.tsx),
-- que usa o client autenticado normal (sem service_role).
--
-- Esta migration alinha a policy de INSERT com a de SELECT, no mesmo padrão.

drop policy if exists "inserir_proprio_interest_card"
  on public.interest_cards;
create policy "inserir_proprio_interest_card"
  on public.interest_cards
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1
      from public.verifications v
      where v.user_id = auth.uid()
        and v.is_current = true
        and v.status = 'verified'
    )
  );
