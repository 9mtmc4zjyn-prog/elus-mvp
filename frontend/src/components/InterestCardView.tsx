import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useThemeColors } from '../theme/ThemeContext';
import type { InterestCardRow } from '../utils/interestCardsApi';
import {
  INTEREST_CARD_CATEGORY_LABELS,
  INTEREST_CARD_TYPE_META,
  formatInterestCardTimeRemaining,
  getInterestCardAccent,
} from '../utils/interestCardLabels';

type Props = {
  card: InterestCardRow;
  /** compact = badge na listagem; full = bloco no perfil */
  variant?: 'compact' | 'full';
};

export function InterestCardView({ card, variant = 'full' }: Props) {
  const colors = useThemeColors();
  const accent = getInterestCardAccent(card.type, colors);
  const meta = INTEREST_CARD_TYPE_META[card.type];
  const categoryLabel = INTEREST_CARD_CATEGORY_LABELS[card.category];
  const timeLabel = formatInterestCardTimeRemaining(card.expires_at);

  if (variant === 'compact') {
    return (
      <View
        style={[
          styles.compact,
          {
            borderColor: `${accent}66`,
            backgroundColor: `${accent}18`,
          },
        ]}
      >
        <Text style={styles.compactEmoji}>{meta.emoji}</Text>
        <Text style={[styles.compactText, { color: colors.text }]} numberOfLines={1}>
          {meta.label} · {categoryLabel}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.full,
        {
          borderColor: `${accent}55`,
          backgroundColor: `${accent}14`,
        },
      ]}
    >
      <View style={styles.fullHeader}>
        <Text style={styles.fullEmoji}>{meta.emoji}</Text>
        <View style={styles.fullHeaderText}>
          <Text style={[styles.fullType, { color: accent }]}>{meta.label}</Text>
          <Text style={[styles.fullCategory, { color: colors.text }]}>
            {categoryLabel}
          </Text>
        </View>
      </View>

      {card.description ? (
        <Text style={[styles.fullDescription, { color: colors.textMuted }]}>
          {card.description}
        </Text>
      ) : null}

      <Text style={[styles.fullTime, { color: colors.textSoft }]}>{timeLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  compact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: '100%',
  },
  compactEmoji: {
    fontSize: 13,
  },
  compactText: {
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
  full: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    gap: 8,
  },
  fullHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fullEmoji: {
    fontSize: 22,
  },
  fullHeaderText: {
    flex: 1,
    gap: 2,
  },
  fullType: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  fullCategory: {
    fontSize: 15,
    fontWeight: '600',
  },
  fullDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  fullTime: {
    fontSize: 12,
    fontWeight: '500',
  },
});
