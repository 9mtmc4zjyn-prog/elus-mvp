// =============================================================
// ELUS — Fonte única de verdade para preços
// Alinhado ao documento oficial v1 (19/07/2026):
// planos-e-roadmap-oficial-v1.md (raiz do repositório).
//
// Anúncios e microtransações foram REMOVIDOS do plano oficial
// (Anexo 1 do documento — hipótese futura com gate de reavaliação).
//
// Roadmap oficial (Fases 0–3):
//   Fase 1: essential + plus
//   Fase 2: + premium (e opção anual, ~17% off)
//   Fase 3: + commercial + businessPro
//
// Decisão 5.3 (19/07/2026): nome oficial "ELUS Plus"; R$ 19,90/mês
// com preço de fundador de R$ 14,90 para os primeiros 500
// assinantes da Fase 1 (ver FOUNDER_PRICE).
//
// Decisão de 19/07/2026: 6 planos reduzidos para 5. "Profissional"
// e "Empresa Local" foram fundidos em um único plano "Comercial"
// (R$ 54,90/mês) — os dois já entregavam o mesmo pacote de recursos,
// diferindo só no tipo de verificação exigida (registro em conselho
// profissional OU CNPJ). O plano Comercial aceita as duas formas.
// =============================================================

export type PlanKey =
  | 'essential'
  | 'plus'
  | 'premium'
  | 'commercial'
  | 'businessPro';

// -------------------------------------------------------------
// Fases de lançamento.
// Para avançar de fase, altere apenas CURRENT_LAUNCH_PHASE.
// Planos de fases futuras ficam ocultos na tela de planos.
// -------------------------------------------------------------

export const CURRENT_LAUNCH_PHASE = 1;

// -------------------------------------------------------------
// Build de submissão sem IAP.
// Enquanto o checkout real (react-native-iap / expo-in-app-purchases)
// não estiver implementado, mantenha true: esconde todos os planos
// pagos e o botão global "Planos" para evitar risco de rejeição pela
// App Store Guideline 3.1.1 (venda de recurso digital fora do IAP).
// Defina como false assim que o IAP estiver pronto e configurado no
// App Store Connect / Google Play Console.
// -------------------------------------------------------------

export const FREE_ONLY_BUILD = true;

/** Fase em que cada plano passa a ser vendido. */
export const PLAN_LAUNCH_PHASE: Record<PlanKey, number> = {
  essential: 1,
  plus: 1,
  premium: 2,
  commercial: 3,
  businessPro: 3,
};

/** Fase em que a opção anual passa a ser oferecida. */
export const ANNUAL_LAUNCH_PHASE = 2;

export function isPlanAvailable(
  key: PlanKey,
  phase: number = CURRENT_LAUNCH_PHASE,
): boolean {
  return PLAN_LAUNCH_PHASE[key] <= phase;
}

export function isAnnualAvailable(
  phase: number = CURRENT_LAUNCH_PHASE,
): boolean {
  return phase >= ANNUAL_LAUNCH_PHASE;
}

// -------------------------------------------------------------
// Preços oficiais v1.
// Anual = 10x o mensal (~17% de desconto), disponível na Fase 2.
// -------------------------------------------------------------

export type PlanPricing = {
  key: PlanKey;
  /** Preço mensal. 0 = grátis. */
  monthly: number;
  /** Preço anual (~17% off). null = sem opção anual. */
  annual: number | null;
  /** Unidades/filiais incluídas no plano. */
  includedUnits: number;
};

export const PLAN_PRICING: PlanPricing[] = [
  { key: 'essential', monthly: 0, annual: null, includedUnits: 1 },
  { key: 'plus', monthly: 19.9, annual: 199, includedUnits: 1 },
  { key: 'premium', monthly: 39.9, annual: 399, includedUnits: 1 },
  { key: 'commercial', monthly: 54.9, annual: 549, includedUnits: 1 },
  { key: 'businessPro', monthly: 99.9, annual: 999, includedUnits: 3 },
];

// -------------------------------------------------------------
// Preço de fundador (Fase 1) — decisão de 19/07/2026.
// Os primeiros 500 assinantes do ELUS Plus pagam R$ 14,90/mês,
// travado enquanto a assinatura permanecer ativa.
// -------------------------------------------------------------

export const FOUNDER_PRICE = {
  plan: 'plus' as PlanKey,
  monthly: 14.9,
  /** Limite de assinantes com direito ao preço de fundador. */
  maxSubscribers: 500,
  /** O preço vale enquanto a assinatura permanecer ativa. */
  lockedWhileActive: true,
} as const;

// -------------------------------------------------------------
// Filiais extras (apenas Empresa Pro) — desconto progressivo.
// O plano inclui 3 unidades; a partir da 4ª, cobra por filial.
// -------------------------------------------------------------

export type ExtraUnitTier = {
  /** Número da unidade onde o tier começa (ex.: 4 = 4ª filial). */
  fromUnit: number;
  /** Número da unidade onde o tier termina. null = sem limite. */
  toUnit: number | null;
  pricePerUnitMonthly: number;
};

export const EXTRA_UNIT_TIERS: ExtraUnitTier[] = [
  { fromUnit: 4, toUnit: 10, pricePerUnitMonthly: 12.9 },
  { fromUnit: 11, toUnit: 20, pricePerUnitMonthly: 9.9 },
  { fromUnit: 21, toUnit: null, pricePerUnitMonthly: 7.9 },
];

/** Acima deste total de unidades, oferecer "Empresa Rede" (sob consulta). */
export const NETWORK_PLAN_THRESHOLD = 30;

/**
 * Preço mensal total do Empresa Pro para uma rede com `totalUnits` unidades.
 * Ex.: 30 filiais => 99,90 + 7×12,90 + 10×9,90 + 10×7,90 = 368,20.
 */
export function calculateBusinessProMonthlyPrice(totalUnits: number): number {
  const basePlan = PLAN_PRICING.find(plan => plan.key === 'businessPro')!;
  let total = basePlan.monthly;

  for (let unit = basePlan.includedUnits + 1; unit <= totalUnits; unit++) {
    const tier = EXTRA_UNIT_TIERS.find(
      t => unit >= t.fromUnit && (t.toUnit === null || unit <= t.toUnit),
    );
    if (tier) {
      total += tier.pricePerUnitMonthly;
    }
  }

  return Math.round(total * 100) / 100;
}

// -------------------------------------------------------------
// Helpers
// -------------------------------------------------------------

export function getPlanPricing(key: PlanKey): PlanPricing | undefined {
  return PLAN_PRICING.find(plan => plan.key === key);
}

/** Formata valor em reais: 19.9 => "R$ 19,90". 0 => "Grátis". */
export function formatBRL(value: number): string {
  if (value === 0) {
    return 'Grátis';
  }
  return `R$ ${value.toFixed(2).replace('.', ',')}`;
}

/** Rótulo mensal: 19.9 => "R$ 19,90/mês". */
export function formatMonthly(value: number): string {
  return value === 0 ? 'Grátis' : `${formatBRL(value)}/mês`;
}
