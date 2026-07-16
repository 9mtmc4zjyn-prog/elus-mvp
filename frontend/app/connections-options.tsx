import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, useThemeColors } from '../src/theme/ThemeContext';

const COLORS = {
  cyan: '#5E9EAB',
  gold: '#C49A45',
  goldSoft: 'rgba(196,154,69,0.10)',
  purple: '#8B7EA8',
  green: '#4A9A65',
};

type OptionItemProps = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  tag?: string;
  tone?: 'cyan' | 'gold' | 'purple' | 'green';
  onPress?: () => void;
};

function getToneColor(tone?: OptionItemProps['tone']) {
  switch (tone) {
    case 'gold':
      return COLORS.gold;
    case 'purple':
      return COLORS.purple;
    case 'green':
      return COLORS.green;
    case 'cyan':
    default:
      return COLORS.cyan;
  }
}

function Header() {
  const router = useRouter();
  const colors = useThemeColors();

  return (
    <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
      <Pressable
        onPress={() => router.back()}
        style={({ pressed }) => [
          styles.backButton,
          { backgroundColor: colors.surfaceSoft, borderColor: colors.border },
          pressed ? styles.buttonPressed : null,
        ]}
      >
        <Ionicons name="chevron-back" size={22} color={colors.text} />
      </Pressable>

      <Text style={[styles.headerLogo, { color: colors.text }]}>ELUS</Text>

      <View style={styles.headerSpace} />
    </View>
  );
}

function OptionItem({
  icon,
  title,
  description,
  tag,
  tone = 'cyan',
  onPress,
}: OptionItemProps) {
  const color = getToneColor(tone);
  const colors = useThemeColors();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.optionItem,
        { borderBottomColor: colors.border },
        pressed ? styles.optionItemPressed : null,
        pressed ? { backgroundColor: colors.surfaceSoft } : null,
      ]}
    >
      <View
        style={[
          styles.optionIconWrap,
          {
            backgroundColor: `${color}12`,
            borderColor: `${color}35`,
          },
        ]}
      >
        <Ionicons name={icon} size={17} color={color} />
      </View>

      <View style={styles.optionTextWrap}>
        <View style={styles.optionTitleRow}>
          <Text style={[styles.optionTitle, { color: colors.text }]}>{title}</Text>

          {tag ? (
            <View style={[styles.optionTag, { backgroundColor: colors.surfaceSoft, borderColor: colors.border }]}>
              <Text style={[styles.optionTagText, { color: colors.textMuted }]}>{tag}</Text>
            </View>
          ) : null}
        </View>

        <Text style={[styles.optionDescription, { color: colors.textSoft }]}>{description}</Text>
      </View>

      <Ionicons name="chevron-forward" size={17} color={colors.textSoft} />
    </Pressable>
  );
}

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const { colors } = useTheme();

  return (
    <View style={styles.sectionTitleWrap}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
      {subtitle ? <Text style={[styles.sectionSubtitle, { color: colors.textSoft }]}>{subtitle}</Text> : null}
    </View>
  );
}

function HeroCard() {
  const { colors } = useTheme();

  return (
    <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.borderStrong }]}>
      <View style={styles.heroRadar}>
        <View style={[styles.radarCircleOne, { borderColor: colors.border }]} />
        <View style={styles.radarCircleTwo} />
        <View style={styles.radarCenter}>
          <Ionicons name="options-outline" size={24} color={COLORS.cyan} />
        </View>
        <View style={[styles.radarDot, styles.radarDotOne]} />
        <View style={[styles.radarDot, styles.radarDotTwo]} />
        <View style={[styles.radarDot, styles.radarDotThree]} />
      </View>

      <View style={styles.heroTextWrap}>
        <Text style={styles.eyebrow}>Central ELUS</Text>
        <Text style={[styles.heroTitle, { color: colors.text }]}>OpÃ§Ãµes e sugestÃµes</Text>
        <Text style={[styles.heroDescription, { color: colors.textMuted }]}>
          Ajuste sua presenÃ§a, veja conexÃµes sugeridas e acompanhe recursos de confianÃ§a do app.
        </Text>
      </View>
    </View>
  );
}

function SecurityCard() {
  const { colors } = useTheme();

  return (
    <View style={styles.securityCard}>
      <View style={styles.securityHeader}>
        <View style={styles.securityIconWrap}>
          <Ionicons name="shield-checkmark-outline" size={23} color={COLORS.gold} />
        </View>

        <View style={styles.securityTextWrap}>
          <Text style={[styles.securityTitle, { color: colors.text }]}>ConfianÃ§a ELUS</Text>
          <Text style={[styles.securityDescription, { color: colors.textMuted }]}>
            ConexÃµes reais exigem identidade real. A verificaÃ§Ã£o protege quem expÃµe imagem,
            dados e presenÃ§a no app.
          </Text>
        </View>
      </View>

      <View style={styles.securityDivider} />

      <View style={styles.securityNotice}>
        <Text style={styles.noticeTitle}>Acesso limitado</Text>
        <Text style={[styles.noticeText, { color: colors.textMuted }]}>
          Perfis sem verificaÃ§Ã£o nÃ£o podem solicitar contato, acessar dados completos de outros
          perfis ou aparecer publicamente como identidade validada.
        </Text>
      </View>
    </View>
  );
}

export default function ConnectionsOptionsScreen() {
  const router = useRouter();
  const colors = useThemeColors();

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />

      <Header />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <HeroCard />

        <SectionTitle
          title="ConexÃµes"
          subtitle="Organize o que aparece para vocÃª sem transformar o ELUS em uma lista de perfis."
        />

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <OptionItem
            icon="people-outline"
            title="PÃ¡gina de conexÃµes"
            description="Veja conexÃµes humanas, empresas e serviÃ§os com contexto real."
            onPress={() => router.push('/(tabs)/connections')}
          />

          <OptionItem
            icon="sparkles-outline"
            title="SugestÃµes inteligentes"
            description="Entenda por que cada pessoa, empresa ou serviÃ§o apareceu para vocÃª."
            tag="IA"
            tone="purple"
          />

          <OptionItem
            icon="radio-outline"
            title="Campo de presenÃ§a"
            description="Priorize radar, mapa, contexto local e oportunidades prÃ³ximas."
            onPress={() => router.push('/(tabs)')}
          />
        </View>

        <SectionTitle
          title="ConfianÃ§a e seguranÃ§a"
          subtitle="A seguranÃ§a precisa parecer autoridade, validaÃ§Ã£o e proteÃ§Ã£o."
        />

        <SecurityCard />

        <SectionTitle
          title="Conta e plano"
          subtitle="O plano fica aqui dentro, sem ocupar a tela principal."
        />

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <OptionItem
            icon="person-circle-outline"
            title="Perfil e identidade"
            description="Ver status de identidade, foto, dados pÃºblicos e validaÃ§Ã£o oficial."
          />

          <OptionItem
            icon="shield-checkmark-outline"
            title="VerificaÃ§Ã£o oficial"
            description="Enviar documento com foto e selfie para validar a identidade."
            tag="SeguranÃ§a"
            tone="gold"
          />

          <OptionItem
            icon="diamond-outline"
            title="Planos ELUS"
            description="Gerencie limites, recursos e futuras opÃ§Ãµes de assinatura."
            tag="Free"
            tone="gold"
            onPress={() => router.push('/plans')}
          />
        </View>

        <SectionTitle
          title="AparÃªncia do app"
          subtitle="Ajustes para manter o ELUS premium, menor e menos parecido com app de paquera."
        />

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <OptionItem
            icon="text-outline"
            title="Tamanho visual"
            description="Reduzir letras, cards e fotos para priorizar o campo contextual."
          />

          <OptionItem
            icon="image-outline"
            title="Fotos de perfil"
            description="Foto real obrigatÃ³ria. Nada de perfil anÃ´nimo ou iniciais em produÃ§Ã£o."
          />

          <OptionItem
            icon="map-outline"
            title="Mapa e radar"
            description="Dar mais destaque ao campo, presenÃ§a local e conexÃµes prÃ³ximas."
          />
        </View>

        <View style={styles.footerSpace} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create<any>({
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
    borderWidth: 1,
  },

  headerLogo: {
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
    transform: [{ scale: 0.96 }],
  },

  scroll: {
    flex: 1,
  },

  content: {
    padding: 18,
    paddingBottom: 34,
  },

  heroCard: {
    minHeight: 160,
    borderRadius: 28,
    padding: 18,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 22,
  },

  heroRadar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: 'rgba(38,217,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(38,217,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },

  radarCircleOne: {
    position: 'absolute',
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 1,
  },

  radarCircleTwo: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(139,92,255,0.20)',
  },

  radarCenter: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(5,7,13,0.80)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(38,217,255,0.20)',
  },

  radarDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  radarDotOne: {
    backgroundColor: COLORS.cyan,
    top: 18,
    right: 19,
  },

  radarDotTwo: {
    backgroundColor: COLORS.purple,
    bottom: 18,
    left: 20,
  },

  radarDotThree: {
    backgroundColor: COLORS.gold,
    bottom: 28,
    right: 14,
  },

  heroTextWrap: {
    flex: 1,
  },

  eyebrow: {
    fontSize: 10,
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    color: COLORS.cyan,
    fontWeight: '800',
    marginBottom: 6,
  },

  heroTitle: {
    fontSize: 23,
    lineHeight: 28,
    fontWeight: '800',
    marginBottom: 8,
  },

  heroDescription: {
    fontSize: 12,
    lineHeight: 18,
  },

  sectionTitleWrap: {
    marginTop: 4,
    marginBottom: 10,
  },

  sectionTitle: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
  },

  sectionSubtitle: {
    marginTop: 4,
    fontSize: 11,
    lineHeight: 16,
  },

  card: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 22,
  },

  optionItem: {
    minHeight: 76,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  optionItemPressed: {},

  optionIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginRight: 12,
  },

  optionTextWrap: {
    flex: 1,
    paddingRight: 10,
  },

  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },

  optionTitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '750',
  },

  optionDescription: {
    fontSize: 11,
    lineHeight: 16,
  },

  optionTag: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },

  optionTagText: {
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '800',
  },

  securityCard: {
    borderRadius: 24,
    padding: 15,
    backgroundColor: COLORS.goldSoft,
    borderWidth: 1,
    borderColor: 'rgba(242,169,59,0.28)',
    marginBottom: 22,
  },

  securityHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  securityIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(242,169,59,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(242,169,59,0.34)',
    marginRight: 12,
  },

  securityTextWrap: {
    flex: 1,
  },

  securityTitle: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '800',
    marginBottom: 4,
  },

  securityDescription: {
    fontSize: 11,
    lineHeight: 16,
  },

  securityDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(242,169,59,0.24)',
    marginVertical: 14,
  },

  securityNotice: {
    borderRadius: 18,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(242,169,59,0.18)',
  },

  noticeTitle: {
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.gold,
    fontWeight: '800',
    marginBottom: 5,
  },

  noticeText: {
    fontSize: 11,
    lineHeight: 17,
  },

  footerSpace: {
    height: 20,
  },
});


