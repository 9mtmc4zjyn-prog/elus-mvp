import { supabase } from '../lib/supabase';
import type { PlanKey } from '../data/pricing';
import type { PlanType } from '../context/AppContext';

const ACTIVE_SUBSCRIPTION_STATUSES = ['active', 'in_grace_period'];

/**
 * Mapeia o enum legado `public.users.plan` → PlanKey do roadmap.
 * Só usado quando não há linha atual em `subscriptions`.
 */
function legacyPlanToPlanKey(legacyPlan: PlanType): PlanKey {
  if (legacyPlan === 'premium_person') return 'premium';
  if (legacyPlan === 'premium_business') return 'businessPro';
  return 'essential';
}

/**
 * Plano ativo granular (`PlanKey`), fonte de verdade = `subscriptions`.
 *
 * Consulta `is_current` + status active/in_grace_period. Sem assinatura,
 * cai no campo legado `users.plan`. Falha de rede também cai no fallback —
 * nunca deve travar a tela por causa dessa checagem.
 *
 * Testes manuais (sem IAP): inserir linha em `subscriptions` com
 * store = 'manual' e o `plan_key` desejado.
 */
export async function getActivePlanKey(
  userId: string,
  legacyPlan: PlanType
): Promise<PlanKey> {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('plan_key')
      .eq('user_id', userId)
      .eq('is_current', true)
      .in('status', ACTIVE_SUBSCRIPTION_STATUSES)
      .maybeSingle();

    if (error) {
      console.error('getActivePlanKey query error:', error);
      return legacyPlanToPlanKey(legacyPlan);
    }

    if (data?.plan_key) {
      return data.plan_key as PlanKey;
    }

    return legacyPlanToPlanKey(legacyPlan);
  } catch (error) {
    console.error('getActivePlanKey error:', error);
    return legacyPlanToPlanKey(legacyPlan);
  }
}

/**
 * Diz se o usuário está no plano grátis (Essencial) de verdade.
 *
 * Consulta `public.subscriptions` — fonte de verdade real e granular
 * (plan_key: 'essential' | 'plus' | 'premium' | 'commercial' |
 * 'businessPro', conforme src/data/pricing.ts), escrita só pelo
 * service_role via webhook de loja/RevenueCat (ver migration 008)
 * ou seed manual (store = 'manual') para testes.
 *
 * NÃO usa só o campo legado `public.users.plan` (`free` /
 * `premium_person` / `premium_business`, em AppContext.tsx) porque esse
 * campo é anterior à estrutura de 5 planos do roadmap oficial e nunca
 * chega a valer "plus" ou "premium" — um assinante Plus de verdade
 * continuaria sendo lido como "free" se a checagem parasse por aí.
 *
 * Sem assinatura atual/ativa encontrada, cai pro campo legado como
 * fallback (cobre contas antigas ou concedidas manualmente antes de
 * `subscriptions` existir). Falha de rede também cai pro fallback —
 * nunca deve travar a tela por causa dessa checagem.
 */
export async function isFreeTierUser(
  userId: string,
  legacyPlan: PlanType
): Promise<boolean> {
  const planKey = await getActivePlanKey(userId, legacyPlan);
  return planKey === 'essential';
}
