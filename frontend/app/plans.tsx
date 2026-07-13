import React, { useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useApp } from '../src/context/AppContext';
import { Button } from '../src/components/Button';
import { useTheme } from '../src/theme/ThemeContext';

type VerificationPhase = 'verified' | 'in_review' | 'unverified';

type PlanKey =
  | 'essential'
  | 'plus'
  | 'premium'
  | 'businessLocal'
  | 'businessPro';

type PlanGroup = 'personal' | 'business';

type Plan = {
  key: PlanKey;
  group: PlanGroup;
  name: string;
  price: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  recommended?: boolean;
  premium?: boolean;
  features: string[];
};

const plans: Plan[] = [
  {
    key: 'essential',
    group: 'personal',
    name: 'Essencial',
    price: 'Grátis',
    description: 'Para começar a organizar suas conexões pessoais no ELUS.',
    icon: 'person-outline',
    features: [
      'Perfil básico',
      'Mapa inicial de conexões',
      'Organização simples da rede',
    ],
  },
  {
    key: 'plus',
    group: 'personal',
    name: 'ELUS Plus',
    price: 'R$ 19,90/mês',
    description: 'Para quem quer mais controle sobre vínculos, presença e relações.',
    icon: 'sparkles-outline',
    recommended: true,
    features: [
      'Árvore de conexões avançada',
      'Segmentos de relacionamento',
      'Sugestões inteligentes',
      'Mais filtros de proximidade',
    ],
  },
  {
    key: 'premium',
    group: 'personal',
    name: 'ELUS Premium',
    price: 'R$ 39,90/mês',
    description: 'Experiência completa para conexões estratégicas e rede ampliada.',
    icon: 'diamond-outline',
    premium: true,
    features: [
      'Radar de conexões completo',
      'Insights de rede',
      'Prioridade em novos recursos',
      'Experiência premium',
    ],
  },
  {
    key: 'businessLocal',
    group: 'business',
    name: 'Empresa Local',
    price: 'R$ 59,90/mês',
    description: 'Para empresas, profissionais e prestadores com presença local.',
    icon: 'business-outline',
    recommended: true,
    features: [
      'Perfil empresarial verificado',
      'Aparecer em buscas por serviço',
      'Presença no mapa local',
      'Solicitações de contato organizadas',
    ],
  },
  {
    key: 'businessPro',
    group: 'business',
    name: 'Empresa Pro',
    price: 'R$ 99,90/mês',
    description: 'Para empresas que querem destaque, inteligência e oportunidades.',
    icon: 'briefcase-outline',
    premium: true,
    features: [
      'Destaque em serviços próximos',
      'Múltiplas áreas de atuação',
      'Sugestões inteligentes por demanda',
      'Relatórios de interesse e presença',
    ],
  },
];

function normalizeText(value: string) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function getUserVerificationPhase(user: any): VerificationPhase {
  const status = normalizeText(String(user?.verificationStatus ?? ''));

  const verifiedStatuses = ['verified', 'verificado', 'approved', 'aprovado'];

  const inReviewStatuses = [
    'in_review',
    'review',
    'under_review',
    'awaiting',
    'awaiting_review',
    'aguardando',
    'aguardando_verificacao',
    'aguardando_verificação',
    'em_analise',
    'em_análise',
    'analysis_submitted',
    'submitted',
    'document_submitted',
    'documento_enviado',
    'doc_sent',
  ];

  if (verifiedStatuses.includes(status) || user?.verified === true) {
    return 'verified';
  }

  if (inReviewStatuses.includes(status)) {
    return 'in_review';
  }

  return 'unverified';
}

function Header() {
  const router = useRouter();
  const { colors } = useTheme();

  return (
    <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
      <Pressable
        onPress={() => router.back()}
        style={({ pressed }) => [
          styles.backButton,
          { borderColor: colors.border },
          pressed && styles.buttonPressed,
        ]}
      >
        <Ionicons name="chevron-back" size={22} color={colors.text} />
      </Pressable>

      <Text style={[styles.headerTitle, { color: colors.text }]}>ELUS</Text>

      <View style={styles.headerSpace} />
    </View>
  );
}

function HeroCard() {
  const { colors } = useTheme();

  return (
    <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.borderStrong }]}>
      <View style={styles.heroGlowOne} />
      <View style={styles.heroGlowTwo} />

      <View style={styles.heroTopRow}>
        <View>
          <Text style={[styles.heroEyebrow, { color: colors.accent }]}>Plano e presença</Text>
          <Text style={[styles.heroTitle, { color: colors.text }]}>Escolha como entrar no ELUS</Text>
        </View>

        <View style={styles.heroMiniRadar}>
          <View style={styles.miniRadarRingOne} />
          <View style={styles.miniRadarRingTwo} />
          <View style={[styles.miniRadarCore, { backgroundColor: colors.accent }]} />
        </View>
      </View>

      <Text style={[styles.heroText, { color: colors.textMuted }]}>
        Comece simples, valide sua identidade e evolua para recursos de rede,
        inteligência, presença local e oportunidades reais.
      </Text>

      <View style={styles.heroPills}>
        <View style={[styles.heroPill, { borderColor: colors.border }]}>
          <Ionicons name="person-outline" size={14} color={colors.accent} />
          <Text style={[styles.heroPillText, { color: colors.textMuted }]}>Pessoa</Text>
        </View>

        <View style={[styles.heroPill, { borderColor: colors.border }]}>
          <Ionicons name="business-outline" size={14} color={colors.warning} />
          <Text style={[styles.heroPillText, { color: colors.textMuted }]}>Empresa</Text>
        </View>

        <View style={[styles.heroPill, { borderColor: colors.border }]}>
          <Ionicons name="shield-checkmark-outline" size={14} color={colors.success} />
          <Text style={[styles.heroPillText, { color: colors.textMuted }]}>Validação</Text>
        </View>
      </View>
    </View>
  );
}

function PlansBlockedNotice({
  verificationPhase,
}: {
  verificationPhase: VerificationPhase;
}) {
  const { colors } = useTheme();

  return (
    <View style={styles.blockedNotice}>
      <View style={styles.blockedNoticeIcon}>
        <Ionicons name="lock-closed-outline" size={20} color={colors.danger} />
      </View>

      <View style={styles.blockedNoticeTextWrap}>
        <Text style={[styles.blockedNoticeTitle, { color: colors.text }]}>
          Planos bloqueados até a verificação
        </Text>

        <Text style={[styles.blockedNoticeText, { color: colors.textMuted }]}>
          {verificationPhase === 'in_review'
            ? 'Sua documentação está em análise. Até a aprovação final, planos, compras, anúncios e recursos pagos permanecem bloqueados.'
            : 'Para acessar planos, compras, anúncios ou recursos pagos, sua identidade precisa ser aprovada primeiro.'}
        </Text>

        <Text style={[styles.blockedNoticeText, { color: colors.textMuted }]}>
          Pagamento não substitui verificação e não libera contato automaticamente.
        </Text>
      </View>
    </View>
  );
}

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  const { colors } = useTheme();

  return (
    <View style={styles.sectionTitleWrap}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.sectionSubtitle, { color: colors.textSoft }]}>{subtitle}</Text>
    </View>
  );
}

function PlanCard({
  plan,
  selected,
  locked,
  onPress,
}: {
  plan: Plan;
  selected: boolean;
  locked: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();

  const iconColor = plan.group === 'business' ? colors.warning : colors.accent;
  const selectedBorder = plan.group === 'business' ? colors.warning : colors.accent;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.planCard,
        { backgroundColor: colors.surface, borderColor: colors.borderStrong },
        selected && {
          borderColor: selectedBorder,
          backgroundColor:
            plan.group === 'business'
              ? 'rgba(242,169,59,0.08)'
              : '#111B32',
        },
        locked && styles.lockedPlanCard,
        pressed && !locked && styles.cardPressed,
      ]}
    >
      {plan.recommended ? (
        <View
          style={[
            styles.recommendedBadge,
            { backgroundColor: colors.warning },
            plan.group === 'business' && { backgroundColor: colors.success },
            locked && styles.lockedBadge,
            locked && { borderColor: colors.border },
          ]}
        >
          <Text
            style={[
              styles.recommendedText,
              locked && { color: colors.textMuted },
            ]}
          >
            Recomendado
          </Text>
        </View>
      ) : null}

      {plan.premium ? (
        <View style={[styles.premiumBadge, { borderColor: colors.border }]}>
          <Text style={[styles.premiumText, { color: colors.textMuted }]}>Avançado</Text>
        </View>
      ) : null}

      <View style={styles.planHeader}>
        <View
          style={[
            styles.planIconWrap,
            {
              borderColor: `${iconColor}45`,
              backgroundColor: `${iconColor}12`,
            },
            selected && {
              borderColor: selectedBorder,
              backgroundColor: `${selectedBorder}20`,
            },
            locked && {
              borderColor: colors.border,
              backgroundColor: 'rgba(255,255,255,0.035)',
            },
          ]}
        >
          <Ionicons
            name={plan.icon}
            size={24}
            color={locked ? colors.textMuted : iconColor}
          />
        </View>

        <View style={styles.planTitleWrap}>
          <Text style={[styles.planName, { color: colors.text }, locked && { color: colors.textMuted }]}>
            {plan.name}
          </Text>

          <Text style={[styles.planPrice, { color: colors.warning }, locked && { color: colors.textSoft }]}>
            {plan.price}
          </Text>
        </View>

        <View
          style={[
            styles.radioOuter,
            selected && {
              borderColor: selectedBorder,
            },
            locked && styles.radioLocked,
          ]}
        >
          {locked ? (
            <Ionicons name="lock-closed-outline" size={13} color={colors.textMuted} />
          ) : selected ? (
            <View
              style={[
                styles.radioInner,
                {
                  backgroundColor: selectedBorder,
                },
              ]}
            />
          ) : null}
        </View>
      </View>

      <Text style={[styles.planDescription, { color: colors.textMuted }, locked && { color: colors.textSoft }]}>
        {plan.description}
      </Text>

      <View style={styles.featuresWrap}>
        {plan.features.map((feature) => (
          <View key={feature} style={styles.featureRow}>
            <View style={[styles.checkWrap, { backgroundColor: colors.warning }, locked && styles.lockedCheckWrap]}>
              <Ionicons
                name="checkmark"
                size={13}
                color={locked ? colors.textSoft : '#071019'}
              />
            </View>

            <Text style={[styles.featureText, { color: colors.text }, locked && { color: colors.textSoft }]}>
              {feature}
            </Text>
          </View>
        ))}
      </View>

      {locked ? (
        <View style={styles.lockedPlanPill}>
          <Ionicons name="lock-closed-outline" size={13} color={colors.danger} />
          <Text style={[styles.lockedPlanPillText, { color: colors.danger }]}>
            Bloqueado até a verificação
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export default function PlansScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useApp() as any;

  const [selectedPlan, setSelectedPlan] = useState<PlanKey>('plus');

  const verificationPhase = getUserVerificationPhase(user);
  const plansBlocked = verificationPhase !== 'verified';

  const personalPlans = plans.filter((plan) => plan.group === 'personal');
  const businessPlans = plans.filter((plan) => plan.group === 'business');

  function showBlockedPlanAlert() {
    Alert.alert(
      'Planos bloqueados',
      'Sua identidade precisa ser aprovada antes de acessar planos, compras, anúncios ou recursos pagos.\n\nPagamento não substitui verificação e não libera contato automaticamente.',
      [
        {
          text: 'Entendi',
          style: 'cancel',
        },
        {
          text: 'Verificar identidade agora',
          onPress: () => router.push('/verification' as never),
        },
      ]
    );
  }

  function handlePlanPress(planKey: PlanKey) {
    if (plansBlocked && planKey !== 'essential') {
      showBlockedPlanAlert();
      return;
    }

    if (plansBlocked && planKey === 'essential') {
      setSelectedPlan('essential');
      return;
    }

    setSelectedPlan(planKey);
  }

  function handleContinue() {
    if (plansBlocked) {
      router.push('/verification' as never);
      return;
    }

    router.back();
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />

      <Header />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleBlock}>
          <Text style={[styles.eyebrow, { color: colors.warning }]}>Planos ELUS</Text>
          <Text style={[styles.title, { color: colors.text }]}>
            {plansBlocked ? 'Verifique sua identidade' : 'Escolha seu plano'}
          </Text>

          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            {plansBlocked
              ? 'Planos e recursos pagos ficam disponíveis após aprovação da identidade.'
              : 'Defina como deseja começar no ELUS.'}
          </Text>
        </View>

        <HeroCard />

        {plansBlocked ? (
          <PlansBlockedNotice verificationPhase={verificationPhase} />
        ) : null}

        <SectionTitle
          title="Planos pessoais"
          subtitle="Para pessoas que querem organizar vínculos, presença e conexões reais."
        />

        {personalPlans.map((plan) => (
          <PlanCard
            key={plan.key}
            plan={plan}
            selected={plansBlocked ? plan.key === 'essential' : selectedPlan === plan.key}
            locked={plansBlocked && plan.key !== 'essential'}
            onPress={() => handlePlanPress(plan.key)}
          />
        ))}

        <SectionTitle
          title="Planos para empresas"
          subtitle="Para empresas, profissionais e serviços que querem presença local confiável."
        />

        {businessPlans.map((plan) => (
          <PlanCard
            key={plan.key}
            plan={plan}
            selected={!plansBlocked && selectedPlan === plan.key}
            locked={plansBlocked}
            onPress={() => handlePlanPress(plan.key)}
          />
        ))}

        <View style={styles.businessNotice}>
          <View style={styles.businessNoticeIcon}>
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.warning} />
          </View>

          <View style={styles.businessNoticeTextWrap}>
            <Text style={[styles.businessNoticeTitle, { color: colors.text }]}>
              Empresa também precisa de validação
            </Text>
            <Text style={[styles.businessNoticeText, { color: colors.textMuted }]}>
              Planos empresariais devem exigir identidade responsável, dados da empresa
              e validação para evitar serviços falsos ou perfis anônimos.
            </Text>
          </View>
        </View>

        <Button
          label={plansBlocked ? 'Verificar identidade agora' : 'Continuar'}
          variant={plansBlocked ? 'destructive' : 'primary'}
          icon={plansBlocked ? 'shield-checkmark-outline' : 'arrow-forward'}
          onPress={handleContinue}
        />

        <Text style={[styles.footerText, { color: colors.textSoft }]}>
          {plansBlocked
            ? 'Sua identidade precisa ser aprovada antes de qualquer compra, anúncio ou recurso pago.'
            : 'Você poderá alterar seu plano futuramente dentro do app.'}
        </Text>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  header: {
    height: 92,
    paddingTop: 44,
    paddingHorizontal: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
  },

  headerTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '900',
    letterSpacing: 5,
  },

  headerSpace: {
    width: 38,
    height: 38,
  },

  buttonPressed: {
    opacity: 0.72,
    transform: [{ scale: 0.97 }],
  },

  cardPressed: {
    opacity: 0.9,
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 34,
  },

  titleBlock: {
    marginBottom: 18,
  },

  eyebrow: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '800',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },

  title: {
    fontSize: 25,
    lineHeight: 31,
    fontWeight: '800',
    marginBottom: 5,
  },

  subtitle: {
    fontSize: 12,
    lineHeight: 18,
  },

  heroCard: {
    minHeight: 190,
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    marginBottom: 22,
    overflow: 'hidden',
  },

  heroGlowOne: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(38,217,255,0.08)',
    right: -58,
    top: -72,
  },

  heroGlowTwo: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(139,92,255,0.08)',
    left: -62,
    bottom: -76,
  },

  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  heroEyebrow: {
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 5,
  },

  heroTitle: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '800',
    maxWidth: 240,
  },

  heroMiniRadar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(38,217,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(38,217,255,0.20)',
  },

  miniRadarRingOne: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },

  miniRadarRingTwo: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(139,92,255,0.25)',
  },

  miniRadarCore: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },

  heroText: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 14,
  },

  heroPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  heroPill: {
    minHeight: 30,
    borderRadius: 15,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },

  heroPillText: {
    marginLeft: 6,
    fontSize: 10,
    fontWeight: '700',
  },

  blockedNotice: {
    borderRadius: 24,
    padding: 15,
    backgroundColor: 'rgba(255,107,107,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.30)',
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 22,
  },

  blockedNoticeIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,107,107,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.30)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  blockedNoticeTextWrap: {
    flex: 1,
  },

  blockedNoticeTitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
    marginBottom: 5,
  },

  blockedNoticeText: {
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 4,
  },

  sectionTitleWrap: {
    marginTop: 4,
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '800',
    marginBottom: 4,
  },

  sectionSubtitle: {
    fontSize: 11,
    lineHeight: 16,
  },

  planCard: {
    borderRadius: 26,
    padding: 16,
    borderWidth: 1,
    marginBottom: 14,
  },

  lockedPlanCard: {
    opacity: 0.78,
    backgroundColor: 'rgba(11,16,32,0.72)',
  },

  recommendedBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 14,
  },

  lockedBadge: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
  },

  recommendedText: {
    fontSize: 11,
    lineHeight: 14,
    color: '#15110A',
    fontWeight: '800',
  },

  premiumBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    marginBottom: 14,
  },

  premiumText: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '800',
  },

  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  planIconWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginRight: 13,
  },

  planTitleWrap: {
    flex: 1,
  },

  planName: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '800',
    marginBottom: 3,
  },

  planPrice: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '800',
  },

  radioOuter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: 'rgba(141,152,170,0.40)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },

  radioLocked: {
    borderColor: 'rgba(141,152,170,0.24)',
    backgroundColor: 'rgba(255,255,255,0.035)',
  },

  radioInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },

  planDescription: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },

  featuresWrap: {
    marginTop: 2,
  },

  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 9,
  },

  checkWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  lockedCheckWrap: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },

  featureText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },

  lockedPlanPill: {
    marginTop: 4,
    alignSelf: 'flex-start',
    minHeight: 30,
    borderRadius: 999,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,107,107,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.24)',
  },

  lockedPlanPillText: {
    marginLeft: 6,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '800',
  },

  businessNotice: {
    borderRadius: 24,
    padding: 15,
    backgroundColor: 'rgba(242,169,59,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(242,169,59,0.28)',
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 2,
    marginBottom: 18,
  },

  businessNoticeIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(242,169,59,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(242,169,59,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  businessNoticeTextWrap: {
    flex: 1,
  },

  businessNoticeTitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
    marginBottom: 5,
  },

  businessNoticeText: {
    fontSize: 11,
    lineHeight: 16,
  },

  footerText: {
    fontSize: 11,
    lineHeight: 17,
    textAlign: 'center',
    paddingHorizontal: 20,
  },

  bottomSpace: {
    height: 22,
  },
});
