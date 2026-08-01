// =============================================================
// ELUS — Regras de visita a perfil ("quem visitou seu perfil")
// Decisão de design de 19/07/2026 (pendência 5.1 do documento
// oficial v1), corrigida na mesma data: SEM modo anônimo, para
// ninguém. Recurso entra na Fase 2, junto com o Premium.
//
// Princípios:
// 1. Transparência total e simétrica: toda visita a perfil é
//    identificada. Não existe navegação anônima em nenhum plano.
// 2. Aviso explícito no onboarding e na primeira visita a um
//    perfil. Surpresa zero.
// 3. O que os planos diferenciam é o NÍVEL DE DETALHE do que se
//    vê sobre os próprios visitantes — nunca a possibilidade de
//    se esconder.
// =============================================================

import type { PlanKey } from '../data/pricing';

export const PROFILE_VISIT_RULES = {
  /** Toda visita é visível e identificada. */
  allVisitsIdentified: true,
  /** Não existe modo anônimo, em nenhum plano. */
  anonymousModeAvailable: false,
  /** Aviso explícito antes da primeira visita registrada. */
  requiresExplicitNotice: true,
} as const;

/** Texto do aviso de primeira visita (surpresa zero). */
export const PROFILE_VISIT_NOTICE =
  'No ELUS, visitas a perfis são sempre visíveis e identificadas — para ' +
  'todos, sem exceção. Ao visitar um perfil, a pessoa poderá saber que ' +
  'você esteve lá, assim como você poderá saber quem visitou o seu.';

/** Planos que veem a lista completa de visitantes. */
const FULL_VISITOR_LIST_PLANS: PlanKey[] = [
  'premium',
  'commercial',
  'businessPro',
];

export type VisitorViewLevel =
  /** Contador agregado, sem nomes (ex.: "5 visitas esta semana"). */
  | 'aggregate_count'
  /** Lista completa de visitantes + histórico + insights. */
  | 'full_list';

/** O que o usuário vê sobre os próprios visitantes, por plano. */
export function getVisitorViewLevel(plan: PlanKey): VisitorViewLevel {
  return FULL_VISITOR_LIST_PLANS.includes(plan)
    ? 'full_list'
    : 'aggregate_count';
}
