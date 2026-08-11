import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';

import { Button } from '../src/components/Button';
import { CreateInterestCardModal } from '../src/components/CreateInterestCardModal';
import { InterestCardView } from '../src/components/InterestCardView';
import { useApp } from '../src/context/AppContext';
import { useThemeColors } from '../src/theme/ThemeContext';
import {
  canEndInterestCardEarly,
  evaluateCreateInterestCard,
  getInterestCardViewLevel,
  resolveInterestCardViewCount,
} from '../src/utils/interestCardRules';
import {
  endInterestCardEarly,
  fetchActiveInterestCards,
  fetchInterestCardViewCounts,
  type InterestCardRow,
} from '../src/utils/interestCardsApi';
import { getActivePlanKey } from '../src/utils/planTier';
import type { PlanKey } from '../src/data/pricing';

export default function InterestCardsScreen() {
  const router = useRouter();
  const { user } = useApp();
  const colors = useThemeColors();
  const isVerified = user?.verified === true || user?.verificationStatus === 'verified';

  const [cards, setCards] = useState<InterestCardRow[]>([]);
  const [viewCounts, setViewCounts] = useState<Map<string, number>>(new Map());
  const [planKey, setPlanKey] = useState<PlanKey>('essential');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [createVisible, setCreateVisible] = useState(false);
  const [endingId, setEndingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.id) return;

    const plan = await getActivePlanKey(user.id, user.plan);
    setPlanKey(plan);

    const active = await fetchActiveInterestCards(user.id);
    setCards(active);

    const counts = await fetchInterestCardViewCounts(active.map((c) => c.id));
    setViewCounts(counts);
  }, [user?.id, user?.plan]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        setLoading(true);
        await load();
        if (active) setLoading(false);
      })();
      return () => {
        active = false;
      };
    }, [load]),
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  function handleOpenCreate() {
    // Defesa extra: o botão já fica escondido pra quem não está verificado
    // (ver isVerified/verifyNotice abaixo), mas repete a checagem aqui
    // caso a função seja alcançada por outro caminho.
    if (!isVerified) {
      Alert.alert(
        'Verificação necessária',
        'Verifique sua identidade para criar cards de status.',
      );
      return;
    }

    const decision = evaluateCreateInterestCard(planKey, cards.length);
    if (!decision.allowed) {
      Alert.alert('Limite do plano', decision.reason);
      return;
    }
    setCreateVisible(true);
  }

  function handleEnd(card: InterestCardRow) {
    if (!canEndInterestCardEarly(planKey)) {
      Alert.alert(
        'Plano Essencial',
        'Neste plano o card não pode ser encerrado antes das 24 horas.',
      );
      return;
    }

    Alert.alert(
      'Encerrar card?',
      'O slot ficará livre para você criar outro. Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Encerrar',
          style: 'destructive',
          onPress: async () => {
            setEndingId(card.id);
            const { ok, error } = await endInterestCardEarly(card.id);
            setEndingId(null);
            if (!ok) {
              Alert.alert('Erro', error ?? 'Não foi possível encerrar.');
              return;
            }
            await load();
          },
        },
      ],
    );
  }

  const showEndButton = canEndInterestCardEarly(planKey);
  const viewLevel = getInterestCardViewLevel(planKey);

  return (
    <SafeAreaView
      style={[styles.screen, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <View
        style={[
          styles.header,
          { borderBottomColor: colors.border, backgroundColor: colors.background },
        ]}
      >
        <Pressable
          onPress={() => router.back()}
          style={[
            styles.backBtn,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.backText, { color: colors.text }]}>‹</Text>
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Meus cards</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <Text style={[styles.kicker, { color: colors.accent }]}>
            Status de interesse
          </Text>
          <Text style={[styles.title, { color: colors.text }]}>
            Cards ativos
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Ativo por 24 horas. Visualizações:{' '}
            {viewLevel === 'exact_count' ? 'contagem exata' : 'número agregado'}.
          </Text>

          {isVerified ? (
            <Button
              label="Criar novo card"
              variant="primary"
              onPress={handleOpenCreate}
              containerStyle={styles.createBtn}
            />
          ) : (
            <View
              style={[
                styles.verifyNotice,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.verifyNoticeText, { color: colors.textMuted }]}>
                Verifique sua identidade pra liberar os cards de status.
              </Text>
              <Button
                label="Verificar identidade"
                variant="secondary"
                onPress={() => router.push('/verification' as never)}
                containerStyle={styles.verifyNoticeBtn}
              />
            </View>
          )}

          {cards.length === 0 ? (
            <View
              style={[
                styles.empty,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                Nenhum card ativo
              </Text>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                Publique um “Procuro” ou “Ofereço” para sinalizar intenção no
                seu perfil e no Campo de Presença.
              </Text>
            </View>
          ) : (
            cards.map((card) => {
              const exact = viewCounts.get(card.id) ?? 0;
              const displayCount = resolveInterestCardViewCount(planKey, exact);
              return (
                <View
                  key={card.id}
                  style={[
                    styles.cardBlock,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <InterestCardView card={card} variant="full" />
                  <Text style={[styles.views, { color: colors.textMuted }]}>
                    {displayCount}{' '}
                    {displayCount === 1 ? 'visualização' : 'visualizações'}
                    {viewLevel === 'aggregate_count' && exact >= 5
                      ? ' (aproximado)'
                      : ''}
                  </Text>
                  {showEndButton ? (
                    <Button
                      label={
                        endingId === card.id ? 'Encerrando…' : 'Encerrar agora'
                      }
                      variant="destructiveSecondary"
                      disabled={endingId === card.id}
                      onPress={() => handleEnd(card)}
                    />
                  ) : (
                    <Text style={[styles.lockedHint, { color: colors.textSoft }]}>
                      No Essencial o card só termina ao completar 24 horas.
                    </Text>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      <CreateInterestCardModal
        visible={createVisible}
        userId={user.id}
        onClose={() => setCreateVisible(false)}
        onCreated={() => {
          void load();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    fontSize: 28,
    lineHeight: 30,
    marginTop: -2,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
  },
  headerSpacer: { width: 40 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 20,
    gap: 12,
    paddingBottom: 40,
  },
  kicker: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  createBtn: {
    marginTop: 4,
    marginBottom: 8,
  },
  verifyNotice: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    gap: 10,
    marginTop: 4,
    marginBottom: 8,
  },
  verifyNoticeText: {
    fontSize: 14,
    lineHeight: 20,
  },
  verifyNoticeBtn: {
    marginTop: 0,
  },
  empty: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
  },
  cardBlock: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 14,
    gap: 12,
  },
  views: {
    fontSize: 13,
    fontWeight: '600',
  },
  lockedHint: {
    fontSize: 12,
    lineHeight: 18,
  },
});
