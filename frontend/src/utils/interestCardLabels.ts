import type { ThemeColors } from '../theme/theme';
import type {
  InterestCardCategory,
  InterestCardType,
} from './interestCardRules';

export const INTEREST_CARD_TYPE_META: Record<
  InterestCardType,
  { label: string; emoji: string }
> = {
  procuro: { label: 'Procuro', emoji: '🔍' },
  ofereco: { label: 'Ofereço', emoji: '📣' },
};

export const INTEREST_CARD_CATEGORY_LABELS: Record<InterestCardCategory, string> =
  {
    emprego: 'Emprego',
    servico: 'Serviço',
    networking: 'Networking',
    moradia: 'Moradia',
    outro: 'Outro',
  };

/** Procuro = accent azul; Ofereço = purpleVivid (rebrand). */
export function getInterestCardAccent(
  type: InterestCardType,
  colors: ThemeColors,
): string {
  return type === 'ofereco' ? colors.purpleVivid : colors.accent;
}

export function formatInterestCardTimeRemaining(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return 'Expirado';

  const totalMinutes = Math.floor(ms / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours >= 1) {
    return `${hours}h ${minutes}min restantes`;
  }
  return `${Math.max(1, minutes)}min restantes`;
}
