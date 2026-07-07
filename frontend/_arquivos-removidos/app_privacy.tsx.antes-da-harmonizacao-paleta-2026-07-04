import type { ComponentProps } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type IconName = ComponentProps<typeof Ionicons>['name'];

type PrivacyItem = {
  id: string;
  title: string;
  description: string;
  icon: IconName;
};

const COLORS = {
  background: '#05070D',
  surface: '#0B1020',
  surfaceSoft: '#10182A',
  surfaceDeep: '#080C16',

  text: '#F5F7FB',
  textStrong: '#FFFFFF',
  textMuted: '#BAC2D0',
  textSoft: '#8D98AA',

  border: 'rgba(255,255,255,0.10)',
  borderStrong: 'rgba(255,255,255,0.16)',

  cyan: '#26D9FF',
  cyanSoft: 'rgba(38,217,255,0.10)',
  cyanBorder: 'rgba(38,217,255,0.28)',

  gold: '#F2A93B',
  goldSoft: 'rgba(242,169,59,0.12)',
  goldBorder: 'rgba(242,169,59,0.30)',

  blueLight: '#9DBBFF',
  blueLightSoft: 'rgba(157,187,255,0.12)',
  blueLightBorder: 'rgba(157,187,255,0.34)',

  green: '#31D6A3',
  greenSoft: 'rgba(49,214,163,0.12)',
  greenBorder: 'rgba(49,214,163,0.28)',

  danger: '#EF4444',
  white: '#FFFFFF',
};

const privacyItems: PrivacyItem[] = [
  {
    id: 'control',
    title: 'Você controla suas conexões',
    description:
      'Você decide quem pode se conectar, visualizar informações e interagir com sua rede.',
    icon: 'shield-checkmark-outline',
  },
  {
    id: 'data',
    title: 'Dados protegidos',
    description:
      'As informações do seu perfil devem ser tratadas com segurança e usadas apenas para melhorar sua experiência.',
    icon: 'lock-closed-outline',
  },
  {
    id: 'visibility',
    title: 'Visibilidade configurável',
    description:
      'Você poderá definir quais partes do seu perfil ficam visíveis para outras pessoas.',
    icon: 'eye-outline',
  },
  {
    id: 'relationships',
    title: 'Relações com contexto',
    description:
      'O ELUS organiza conexões com foco em relevância, vínculo e proximidade real.',
    icon: 'git-network-outline',
  },
];

export default function PrivacyScreen() {
  const router = useRouter();

  function handleAccept() {
    router.push('/profile-type' as never);
  }

  function handleBack() {
    router.back();
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={25} color={COLORS.text} />
        </TouchableOpacity>

        <View style={styles.headerTextBox}>
          <Text style={styles.headerTitle}>Privacidade</Text>
          <Text style={styles.headerSubtitle}>
            Segurança e controle no ELUS
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons
              name="shield-checkmark-outline"
              size={42}
              color={COLORS.gold}
            />
          </View>

          <Text style={styles.heroTitle}>Sua rede, suas regras</Text>

          <Text style={styles.heroText}>
            O ELUS foi pensado para criar conexões relevantes com mais clareza,
            controle e confiança.
          </Text>
        </View>

        <View style={styles.itemsBox}>
          {privacyItems.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemIconBox}>
                <Ionicons name={item.icon} size={24} color={COLORS.gold} />
              </View>

              <View style={styles.itemTextBox}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemDescription}>
                  {item.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.noticeCard}>
          <View style={styles.noticeIconBox}>
            <Ionicons
              name="information-circle-outline"
              size={24}
              color={COLORS.blueLight}
            />
          </View>

          <View style={styles.noticeTextBox}>
            <Text style={styles.noticeTitle}>Aviso importante</Text>
            <Text style={styles.noticeText}>
              Esta é uma versão inicial do app. As políticas finais de
              privacidade e termos de uso deverão ser revisadas antes do
              lançamento oficial.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.acceptButton}
          onPress={handleAccept}
          activeOpacity={0.85}
        >
          <Text style={styles.acceptButtonText}>Aceitar e continuar</Text>
          <Ionicons name="arrow-forward" size={20} color="#061019" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleBack}
          activeOpacity={0.85}
        >
          <Text style={styles.secondaryButtonText}>Voltar</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  header: {
    paddingTop: 62,
    paddingHorizontal: 20,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
  },

  headerTextBox: {
    flex: 1,
  },

  headerTitle: {
    color: COLORS.textStrong,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '900',
  },

  headerSubtitle: {
    color: COLORS.textMuted,
    fontSize: 15,
    lineHeight: 21,
    marginTop: 2,
    fontWeight: '600',
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 46,
  },

  heroCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 30,
    paddingHorizontal: 24,
    paddingVertical: 30,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    alignItems: 'center',
    marginBottom: 20,
  },

  heroIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.surfaceDeep,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },

  heroTitle: {
    color: COLORS.textStrong,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.4,
  },

  heroText: {
    color: COLORS.textMuted,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginTop: 12,
    fontWeight: '600',
  },

  itemsBox: {
    marginTop: 2,
  },

  itemCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    flexDirection: 'row',
    marginBottom: 14,
  },

  itemIconBox: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: COLORS.surfaceDeep,
    borderWidth: 1,
    borderColor: COLORS.goldBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  itemTextBox: {
    flex: 1,
  },

  itemTitle: {
    color: COLORS.textStrong,
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '900',
  },

  itemDescription: {
    color: COLORS.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 6,
    fontWeight: '600',
  },

  noticeCard: {
    marginTop: 6,
    backgroundColor: COLORS.blueLightSoft,
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.blueLightBorder,
    flexDirection: 'row',
  },

  noticeIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.surfaceDeep,
    borderWidth: 1,
    borderColor: COLORS.blueLightBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },

  noticeTextBox: {
    flex: 1,
    marginLeft: 12,
  },

  noticeTitle: {
    color: COLORS.textStrong,
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '900',
  },

  noticeText: {
    color: COLORS.textMuted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
    fontWeight: '600',
  },

  acceptButton: {
    height: 58,
    borderRadius: 20,
    backgroundColor: COLORS.cyan,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 24,
  },

  acceptButtonText: {
    color: '#061019',
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '900',
    marginRight: 8,
  },

  secondaryButton: {
    height: 56,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },

  secondaryButtonText: {
    color: COLORS.textStrong,
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '800',
  },
});