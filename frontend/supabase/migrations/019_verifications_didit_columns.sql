-- ELUS · verificação de identidade instantânea via Didit (colunas novas)
-- Migration 019 — gravada no repo; aplicar só após confirmação (sem db push automático).
--
-- Adiciona verification_method (manual | didit) e didit_session_id em
-- verifications. Método instantâneo é ADIÇÃO ao fluxo manual já existente,
-- não substituição — usuário escolhe livremente entre os dois.
-- Retenção mínima: só guardamos o session_id da Didit; documento, selfie e
-- score de comparação facial ficam do lado do provedor, não no ELUS.

alter table public.verifications
  add column if not exists verification_method text not null default 'manual'
    check (verification_method in ('manual', 'didit')),
  add column if not exists didit_session_id text;

comment on column public.verifications.verification_method is
  'Como a verificação foi feita: manual (documento+selfie+revisão humana) ou didit (KYC instantâneo via provedor externo).';
comment on column public.verifications.didit_session_id is
  'ID da sessão na Didit, para correlacionar com o webhook. Não guardamos documento/selfie/score — isso fica só do lado da Didit.';
