import { supabase } from '../lib/supabase';
import type {
  InterestCardCategory,
  InterestCardType,
} from './interestCardRules';

export type InterestCardRow = {
  id: string;
  user_id: string;
  type: InterestCardType;
  category: InterestCardCategory;
  description: string | null;
  created_at: string;
  expires_at: string;
  ended_early_at: string | null;
};

function isActiveCard(row: InterestCardRow, now = Date.now()): boolean {
  if (row.ended_early_at) return false;
  return new Date(row.expires_at).getTime() > now;
}

/** Cards ativos de um usuário (não encerrados e dentro das 24h). */
export async function fetchActiveInterestCards(
  userId: string,
): Promise<InterestCardRow[]> {
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from('interest_cards')
    .select(
      'id, user_id, type, category, description, created_at, expires_at, ended_early_at',
    )
    .eq('user_id', userId)
    .is('ended_early_at', null)
    .gt('expires_at', nowIso)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('fetchActiveInterestCards:', error);
    return [];
  }

  return ((data ?? []) as InterestCardRow[]).filter((row) => isActiveCard(row));
}

/** Cards ativos de vários usuários (Campo de Presença). */
export async function fetchActiveInterestCardsForUsers(
  userIds: string[],
): Promise<Map<string, InterestCardRow[]>> {
  const result = new Map<string, InterestCardRow[]>();
  if (userIds.length === 0) return result;

  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from('interest_cards')
    .select(
      'id, user_id, type, category, description, created_at, expires_at, ended_early_at',
    )
    .in('user_id', userIds)
    .is('ended_early_at', null)
    .gt('expires_at', nowIso);

  if (error) {
    console.error('fetchActiveInterestCardsForUsers:', error);
    return result;
  }

  for (const row of (data ?? []) as InterestCardRow[]) {
    if (!isActiveCard(row)) continue;
    const list = result.get(row.user_id) ?? [];
    list.push(row);
    result.set(row.user_id, list);
  }

  return result;
}

export async function createInterestCard(input: {
  userId: string;
  type: InterestCardType;
  category: InterestCardCategory;
  description?: string;
}): Promise<{ card: InterestCardRow | null; error: string | null }> {
  const description =
    input.description && input.description.trim().length > 0
      ? input.description.trim()
      : null;

  // expires_at é forçado pelo trigger; enviamos placeholder válido.
  const placeholderExpires = new Date(
    Date.now() + 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data, error } = await supabase
    .from('interest_cards')
    .insert({
      user_id: input.userId,
      type: input.type,
      category: input.category,
      description,
      expires_at: placeholderExpires,
    })
    .select(
      'id, user_id, type, category, description, created_at, expires_at, ended_early_at',
    )
    .single();

  if (error) {
    console.error('createInterestCard:', error);
    return { card: null, error: error.message };
  }

  return { card: data as InterestCardRow, error: null };
}

export async function endInterestCardEarly(
  cardId: string,
): Promise<{ ok: boolean; error: string | null }> {
  const { error } = await supabase
    .from('interest_cards')
    .update({ ended_early_at: new Date().toISOString() })
    .eq('id', cardId)
    .is('ended_early_at', null);

  if (error) {
    console.error('endInterestCardEarly:', error);
    return { ok: false, error: error.message };
  }

  return { ok: true, error: null };
}

/** Contagem de visualizações por card (só o dono consegue ler as linhas). */
export async function fetchInterestCardViewCounts(
  cardIds: string[],
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (cardIds.length === 0) return counts;

  const { data, error } = await supabase
    .from('interest_card_views')
    .select('card_id')
    .in('card_id', cardIds);

  if (error) {
    console.error('fetchInterestCardViewCounts:', error);
    return counts;
  }

  for (const row of data ?? []) {
    const id = String((row as { card_id: string }).card_id);
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  return counts;
}

/**
 * Registra visualização (uma vez por par card+viewer).
 * Insert simples com returning mínimo — evita 42501 de SELECT RLS no
 * RETURNING quando a policy do viewer ainda não existia; com a migration
 * 015 o viewer também pode ler a própria linha. Duplicata (23505) = ok.
 */
export async function recordInterestCardViews(input: {
  cardIds: string[];
  viewerId: string;
}): Promise<void> {
  const uniqueIds = Array.from(new Set(input.cardIds.filter(Boolean)));
  if (uniqueIds.length === 0 || !input.viewerId) return;

  for (const cardId of uniqueIds) {
    const { error } = await supabase.from('interest_card_views').insert({
      card_id: cardId,
      viewer_id: input.viewerId,
    });

    if (error) {
      const code = (error as { code?: string }).code;
      if (code !== '23505') {
        console.warn('recordInterestCardViews:', error.message);
      }
    }
  }
}
