import { supabase } from '../lib/supabase';
import { isCommonSurname } from '../data/commonSurnames';

/**
 * Fase 1 do plano de IA do ELUS (Semanas 1-4) — SEM IA externa.
 *
 * Ordena sugestões de conexão por regras determinísticas locais, em
 * cascata de prioridade (maior prioridade que bater "vence" — um
 * candidato não soma pontos de várias regras, fica com a melhor):
 *
 *   1. PARENTESCO      (mesmo sobrenome + origem/cidade cruzada)  -> 1000
 *   2. CONTERRÂNEOS     (mesma origem, cidade atual qualquer)      -> 900
 *   3. GRAFO DE CONFIANÇA (amigo de amigo — 2 saltos, kind=friend) -> 850
 *   4. GRAFO EXPANDIDO  (parente de amigo — 2 saltos, kind=family) -> 750
 *   5. PROXIMIDADE GEOGRÁFICA PURA (só cidade/estado atuais)       -> 100-400
 *
 * Importante: só usa cidade/estado (atual e de origem/naturalidade).
 * NÃO usa rua/bairro — a Política de Privacidade do ELUS promete que
 * a plataforma nunca coleta localização exata, só região aproximada
 * declarada pelo usuário (ver app/privacy-policy.tsx, seção 3).
 *
 * Todo score aqui é 100% calculado no dispositivo/servidor do ELUS a
 * partir de regras fixas — não há chamada a nenhuma API de IA externa
 * nesta fase (isso só entra na Fase 3, Semanas 9-12, depois de termos
 * dados reais de conversão coletados via `suggestion_events`).
 */

export type SuggestionCandidateInput = {
  id: string;
  surname?: string;
  city?: string;
  state?: string;
  originCity?: string;
  originState?: string;
};

export type RankedSuggestion<T extends SuggestionCandidateInput> = {
  candidate: T;
  score: number;
  priority: number;
  reason: string;
};

const PRIORITY_SCORE = {
  parentesco: 1000,
  // Mesmo sobrenome + origem cruzada, mas o sobrenome é comum demais no
  // Brasil (Silva, Souza, Oliveira...) pra ser um sinal forte sozinho.
  // Ainda fica acima de "amigo de amigo", porque nome + geografia batendo
  // é mais forte que só geografia, mas abaixo de "conterrâneos" puro —
  // não confiamos nele o bastante pra ser o sinal nº 1.
  parentescoSobrenomeComum: 870,
  conterraneos: 900,
  grafoConfianca: 850,
  grafoExpandido: 750,
  proximidadeCidade: 400,
  proximidadeEstado: 250,
  semSinal: 100,
} as const;

const COMBINING_DIACRITICS_REGEX = /[̀-ͯ]/g;

function normalize(value: string | undefined | null): string {
  return (value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(COMBINING_DIACRITICS_REGEX, ''); // remove acentos
}

function hasValue(value: string | undefined | null): boolean {
  return normalize(value).length > 0;
}

export type TwoHopMemberships = {
  friendOfFriendIds: Set<string>;
  familyOfFriendIds: Set<string>;
};

/**
 * Busca, a partir das conexões diretas (1 salto) do usuário, quem são
 * os "amigos de amigo" (kind=friend no segundo salto) e "parentes de
 * amigo" (kind=family no segundo salto). Só olha 2 saltos — igual ao
 * exemplo do plano (Paulo ↔ Pedro → Maria).
 */
export async function loadTwoHopGraphMemberships(
  viewerUserId: string
): Promise<TwoHopMemberships> {
  const empty: TwoHopMemberships = {
    friendOfFriendIds: new Set(),
    familyOfFriendIds: new Set(),
  };

  try {
    const { data: directRows } = await supabase
      .from('connections')
      .select('from_user_id, to_user_id')
      .or(`from_user_id.eq.${viewerUserId},to_user_id.eq.${viewerUserId}`);

    const directNeighborIds = new Set<string>();
    (directRows ?? []).forEach((row: any) => {
      const other =
        String(row.from_user_id) === viewerUserId ? row.to_user_id : row.from_user_id;
      if (other) directNeighborIds.add(String(other));
    });

    if (directNeighborIds.size === 0) return empty;

    const neighborIds = Array.from(directNeighborIds);

    const { data: secondHopRows } = await supabase
      .from('connections')
      .select('from_user_id, to_user_id, kind')
      .or(
        `from_user_id.in.(${neighborIds.join(',')}),to_user_id.in.(${neighborIds.join(',')})`
      );

    const friendOfFriendIds = new Set<string>();
    const familyOfFriendIds = new Set<string>();

    (secondHopRows ?? []).forEach((row: any) => {
      const fromId = String(row.from_user_id);
      const toId = String(row.to_user_id);
      const kind = row.kind as string;

      // Descobre o "terceiro elo" da ponte (quem não é o vizinho direto).
      const candidates = [fromId, toId].filter(
        (id) => id !== viewerUserId && !directNeighborIds.has(id)
      );

      candidates.forEach((candidateId) => {
        if (kind === 'friend') friendOfFriendIds.add(candidateId);
        if (kind === 'family') familyOfFriendIds.add(candidateId);
      });
    });

    return { friendOfFriendIds, familyOfFriendIds };
  } catch {
    return empty;
  }
}

/**
 * Calcula score/prioridade/motivo para UM candidato, dado o viewer e o
 * mapa de "amigo de amigo" / "parente de amigo" já carregado. Função
 * pura — não faz chamada de rede.
 */
export function scoreCandidate<T extends SuggestionCandidateInput>(
  viewer: SuggestionCandidateInput,
  candidate: T,
  graph?: TwoHopMemberships
): RankedSuggestion<T> {
  const viewerSurname = normalize(viewer.surname);
  const candidateSurname = normalize(candidate.surname);
  const sameSurname = hasValue(viewer.surname) && viewerSurname === candidateSurname;

  const viewerOriginKey = `${normalize(viewer.originCity)}|${normalize(viewer.originState)}`;
  const candidateOriginKey = `${normalize(candidate.originCity)}|${normalize(candidate.originState)}`;
  const hasViewerOrigin = hasValue(viewer.originCity) || hasValue(viewer.originState);
  const hasCandidateOrigin = hasValue(candidate.originCity) || hasValue(candidate.originState);

  // Prioridade 1 — parentesco: mesmo sobrenome + origem de um bate com
  // a cidade atual do outro (cruzado), ex.: João Silva (mora em BH) +
  // Maria Silva (origem BH).
  const viewerOriginMatchesCandidateCity =
    hasViewerOrigin &&
    normalize(viewer.originCity) === normalize(candidate.city) &&
    normalize(viewer.originState) === normalize(candidate.state);
  const candidateOriginMatchesViewerCity =
    hasCandidateOrigin &&
    normalize(candidate.originCity) === normalize(viewer.city) &&
    normalize(candidate.originState) === normalize(viewer.state);

  if (
    sameSurname &&
    (viewerOriginMatchesCandidateCity || candidateOriginMatchesViewerCity)
  ) {
    // Sobrenomes muito comuns (Silva, Souza, Oliveira...) geram falso
    // positivo de "parentesco" com facilidade — duas pessoas sem nenhum
    // parentesco real compartilham esse sobrenome o tempo todo. Rebaixa
    // a confiança do sinal nesse caso, sem descartá-lo.
    if (isCommonSurname(candidate.surname)) {
      return {
        candidate,
        score: PRIORITY_SCORE.parentescoSobrenomeComum,
        priority: 1,
        reason: `Mesmo sobrenome (${candidate.surname}, comum no Brasil) e origem/cidade compatíveis — parentesco possível, não confirmado`,
      };
    }

    return {
      candidate,
      score: PRIORITY_SCORE.parentesco,
      priority: 1,
      reason: `Mesmo sobrenome (${candidate.surname}) e origem/cidade compatíveis`,
    };
  }

  // Prioridade 2 — conterrâneos: mesma origem declarada, independente
  // de onde cada um mora hoje.
  if (hasViewerOrigin && hasCandidateOrigin && viewerOriginKey === candidateOriginKey) {
    return {
      candidate,
      score: PRIORITY_SCORE.conterraneos,
      priority: 2,
      reason: `Mesma origem (${candidate.originCity || candidate.originState})`,
    };
  }

  // Prioridade 3 — grafo de confiança: amigo de amigo.
  if (graph?.friendOfFriendIds.has(candidate.id)) {
    return {
      candidate,
      score: PRIORITY_SCORE.grafoConfianca,
      priority: 3,
      reason: 'Amigo de uma conexão sua',
    };
  }

  // Prioridade 4 — grafo expandido: parente de amigo.
  if (graph?.familyOfFriendIds.has(candidate.id)) {
    return {
      candidate,
      score: PRIORITY_SCORE.grafoExpandido,
      priority: 4,
      reason: 'Parente de uma conexão sua',
    };
  }

  // Prioridade 5 — proximidade geográfica pura (só cidade/estado atuais).
  const sameCity =
    hasValue(viewer.city) &&
    normalize(viewer.city) === normalize(candidate.city) &&
    hasValue(viewer.state) &&
    normalize(viewer.state) === normalize(candidate.state);
  const sameState = hasValue(viewer.state) && normalize(viewer.state) === normalize(candidate.state);

  if (sameCity) {
    return {
      candidate,
      score: PRIORITY_SCORE.proximidadeCidade,
      priority: 5,
      reason: `Mesma cidade (${candidate.city})`,
    };
  }

  if (sameState) {
    return {
      candidate,
      score: PRIORITY_SCORE.proximidadeEstado,
      priority: 5,
      reason: `Mesmo estado (${candidate.state})`,
    };
  }

  return {
    candidate,
    score: PRIORITY_SCORE.semSinal,
    priority: 5,
    reason: 'Sem sinal forte de afinidade ainda',
  };
}

/**
 * Ordena uma lista de candidatos para o usuário `viewer`, carregando o
 * grafo de 2 saltos (amigo de amigo / parente de amigo) uma única vez.
 * Use para montar a lista de sugestões (ex.: Home / radar).
 */
export async function rankSuggestions<T extends SuggestionCandidateInput>(
  viewerUserId: string,
  viewer: SuggestionCandidateInput,
  candidates: T[]
): Promise<RankedSuggestion<T>[]> {
  const graph = await loadTwoHopGraphMemberships(viewerUserId);

  return candidates
    .map((candidate) => scoreCandidate(viewer, candidate, graph))
    .sort((a, b) => b.score - a.score);
}

/**
 * Cota semanal de sugestões do plano Essencial (grátis), conforme o
 * roadmap oficial (planos-e-roadmap-oficial-v1.md, seção 3.2):
 * "Afinidades sugeridas pela IA: Essencial 3/semana, Plus+ ilimitadas".
 */
export const FREE_PLAN_WEEKLY_SUGGESTION_LIMIT = 3;

/**
 * Início da semana corrente (segunda-feira 00:00, horário local do
 * dispositivo). Usado só pra janela da cota — não precisa ser exato ao
 * segundo, só consistente entre chamadas na mesma semana.
 */
function getStartOfCurrentWeek(): Date {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = domingo ... 6 = sábado
  const daysSinceMonday = (dayOfWeek + 6) % 7;

  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - daysSinceMonday);

  return monday;
}

/**
 * IDs (distintos) de usuários já sugeridos ("shown") ao `viewerUserId`
 * desde o início da semana corrente. Usado para aplicar a cota do plano
 * Essencial: uma vez que o usuário já viu 3 sugestões na semana, mostra
 * de novo essas mesmas 3 em vez de gerar novas (a cota é de "sugestões
 * novas por semana", não de "quantas vezes a tela recarrega").
 *
 * Falha silenciosa (retorna vazio) — nunca deve travar a Home por causa
 * de uma consulta de cota.
 */
export async function getWeeklyShownSuggestionIds(
  viewerUserId: string
): Promise<Set<string>> {
  try {
    const { data, error } = await supabase
      .from('suggestion_events')
      .select('suggested_user_id')
      .eq('viewer_user_id', viewerUserId)
      .eq('action', 'shown')
      .gte('created_at', getStartOfCurrentWeek().toISOString());

    if (error) {
      console.error('getWeeklyShownSuggestionIds error:', error);
      return new Set();
    }

    return new Set((data ?? []).map((row: any) => String(row.suggested_user_id)));
  } catch (error) {
    console.error('getWeeklyShownSuggestionIds error:', error);
    return new Set();
  }
}

/**
 * Aplica a cota semanal do plano Essencial sobre uma lista já ordenada
 * de sugestões: mantém as que já foram mostradas essa semana (não conta
 * de novo contra a cota) e completa com sugestões novas só até o limite.
 * Para planos pagos (isFreePlan = false), não aplica nenhum corte aqui —
 * quem decide quantas mostrar é o chamador (hoje, a Home sempre corta em
 * 3 por espaço de tela, mas isso é UI, não cota de plano).
 */
export function applyFreePlanWeeklyQuota<T extends SuggestionCandidateInput>(
  ranked: RankedSuggestion<T>[],
  alreadyShownThisWeek: Set<string>,
  isFreePlan: boolean,
  limit: number = FREE_PLAN_WEEKLY_SUGGESTION_LIMIT
): RankedSuggestion<T>[] {
  if (!isFreePlan) {
    return ranked;
  }

  const alreadyGranted = ranked.filter((entry) =>
    alreadyShownThisWeek.has(entry.candidate.id)
  );
  const remainingSlots = Math.max(0, limit - alreadyShownThisWeek.size);
  const fresh = ranked
    .filter((entry) => !alreadyShownThisWeek.has(entry.candidate.id))
    .slice(0, remainingSlots);

  return [...alreadyGranted, ...fresh]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export type SuggestionEventAction = 'shown' | 'accepted' | 'rejected';

/**
 * Loga um evento de interação com uma sugestão (mostrada / aceita /
 * rejeitada) na tabela suggestion_events. Falha silenciosa: log é
 * "nice to have" para o dataset das Semanas 5-8, nunca deve travar o
 * fluxo principal do usuário.
 */
export async function logSuggestionEvent(params: {
  viewerUserId: string;
  suggestedUserId: string;
  priority: number;
  score: number;
  reason: string;
  action: SuggestionEventAction;
}): Promise<void> {
  if (params.viewerUserId === params.suggestedUserId) return;

  try {
    await supabase.from('suggestion_events').insert({
      viewer_user_id: params.viewerUserId,
      suggested_user_id: params.suggestedUserId,
      priority: params.priority,
      score: params.score,
      reason: params.reason,
      action: params.action,
    });
  } catch {
    // Não bloqueia a UI por causa de log.
  }
}
