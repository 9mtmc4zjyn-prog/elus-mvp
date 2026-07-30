// =============================================================
// ELUS — Regras do Card de Status de Interesse (Ofereço / Procuro)
// Fonte: spec fechada com Cleber (jul/2026). Limites por plano
// leem PlanKey de subscriptions via planTier.getActivePlanKey.
//
// Este arquivo NÃO grava no banco — só decide capacidade e
// profundidade de dado. A UI (Fase 3) consome daqui.
// =============================================================

import type { PlanKey } from '../data/pricing';

/** Tipos persistidos em public.interest_cards.type */
export type InterestCardType = 'ofereco' | 'procuro';

/** Categorias persistidas em public.interest_cards.category */
export type InterestCardCategory =
  | 'emprego'
  | 'servico'
  | 'networking'
  | 'moradia'
  | 'outro';

export const INTEREST_CARD_TYPES: readonly InterestCardType[] = [
  'ofereco',
  'procuro',
] as const;

export const INTEREST_CARD_CATEGORIES: readonly InterestCardCategory[] = [
  'emprego',
  'servico',
  'networking',
  'moradia',
  'outro',
] as const;

/** Duração fixa — sem seletor na UI. */
export const INTEREST_CARD_DURATION_HOURS = 24;

/** Limite de descrição (validar no client; CHECK no banco também). */
export const INTEREST_CARD_DESCRIPTION_MAX_LENGTH = 60;

/**
 * Cards simultâneos por plano (por conta), exceto Empresa Pro:
 * lá o teto é por unidade/CNPJ vinculado (ver abaixo).
 */
const MAX_ACTIVE_CARDS_BY_PLAN: Record<Exclude<PlanKey, 'businessPro'>, number> = {
  essential: 1,
  plus: 1,
  premium: 2,
  commercial: 3,
};

/** Empresa Pro: cards ativos por unidade/CNPJ vinculado. */
export const BUSINESS_PRO_CARDS_PER_UNIT = 6;

export type InterestCardViewLevel =
  /** Número agregado arredondado, sem quem visualizou. */
  | 'aggregate_count'
  /** Contagem exata (e, na Fase 3, detalhe por card). */
  | 'exact_count';

/**
 * Máximo de cards ativos simultâneos para o plano.
 *
 * @param linkedUnitCount Unidades/CNPJ vinculados ao perfil Empresa Pro.
 *   Ignorado nos demais planos. Default 1 (uma unidade).
 *   Ex.: businessPro com 3 unidades => 6 * 3 = 18.
 */
export function getMaxActiveInterestCards(
  plan: PlanKey,
  linkedUnitCount: number = 1,
): number {
  if (plan === 'businessPro') {
    const units = Number.isFinite(linkedUnitCount)
      ? Math.max(1, Math.floor(linkedUnitCount))
      : 1;
    return BUSINESS_PRO_CARDS_PER_UNIT * units;
  }
  return MAX_ACTIVE_CARDS_BY_PLAN[plan];
}

/** Essencial: imutável até expirar. Plus+: pode encerrar antes das 24h. */
export function canEndInterestCardEarly(plan: PlanKey): boolean {
  return plan !== 'essential';
}

/**
 * Conteúdo do card é imutável após criar em todos os planos
 * (bate com o trigger da migration 013). "Editar" = encerrar + recriar,
 * e isso só existe onde canEndInterestCardEarly é true.
 */
export function canEditInterestCardContent(_plan: PlanKey): boolean {
  return false;
}

/** Profundidade do dado de visualizações, por plano. */
export function getInterestCardViewLevel(plan: PlanKey): InterestCardViewLevel {
  if (plan === 'premium' || plan === 'commercial' || plan === 'businessPro') {
    return 'exact_count';
  }
  // Essential e Plus: agregado (Plus diferencia-se só pelo encerramento antecipado).
  return 'aggregate_count';
}

export function canCreateInterestCard(
  plan: PlanKey,
  activeCardCount: number,
  linkedUnitCount: number = 1,
): boolean {
  if (activeCardCount < 0) return false;
  return activeCardCount < getMaxActiveInterestCards(plan, linkedUnitCount);
}

export type InterestCardActionDenial =
  | { allowed: true }
  | { allowed: false; reason: string };

export function evaluateCreateInterestCard(
  plan: PlanKey,
  activeCardCount: number,
  linkedUnitCount: number = 1,
): InterestCardActionDenial {
  const max = getMaxActiveInterestCards(plan, linkedUnitCount);
  if (activeCardCount >= max) {
    return {
      allowed: false,
      reason:
        max <= 1
          ? 'Você já tem um card ativo. Aguarde expirar ou faça upgrade de plano.'
          : `Limite de ${max} cards ativos atingido neste plano.`,
    };
  }
  return { allowed: true };
}

export function evaluateEndInterestCardEarly(
  plan: PlanKey,
): InterestCardActionDenial {
  if (!canEndInterestCardEarly(plan)) {
    return {
      allowed: false,
      reason:
        'No plano Essencial o card não pode ser encerrado antes das 24 horas.',
    };
  }
  return { allowed: true };
}

/**
 * Contagem agregada arredondada para Essential/Plus.
 * Visitas de perfil ainda não têm UI — padrão provisório alinhado ao
 * espírito de "número agregado arredondado":
 *   0 → 0; 1–4 → valor exato; ≥5 → múltiplo de 5 para baixo.
 * Ajustar quando o padrão de "X visitas esta semana" existir de fato.
 */
export function formatAggregateInterestCardViews(exactCount: number): number {
  const n = Math.max(0, Math.floor(exactCount));
  if (n < 5) return n;
  return Math.floor(n / 5) * 5;
}

/** Valor a exibir na UI conforme o plano. */
export function resolveInterestCardViewCount(
  plan: PlanKey,
  exactCount: number,
): number {
  return getInterestCardViewLevel(plan) === 'exact_count'
    ? Math.max(0, Math.floor(exactCount))
    : formatAggregateInterestCardViews(exactCount);
}
