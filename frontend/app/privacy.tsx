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
import { Button } from '../src/components/Button';
import { useTheme } from '../src/theme/ThemeContext';

type IconName = ComponentProps<typeof Ionicons>['name'];

type PrivacyItem = {
  id: string;
  title: string;
  description: string;
  icon: IconName;
};

const COLORS = {
  surfaceDeep: '#080D16',

  goldBorder: 'rgba(196,154,69,0.30)',

  blueLight: '#8FA3B8',
  blueLightSoft: 'rgba(143,163,184,0.14)',
  blueLightBorder: 'rgba(143,163,184,0.34)',
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
  const { colors } = useTheme();

  function handleAccept() {
    router.push('/profile-type' as never);
  }

  function handleBack() {
    router.back();
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { backgroundColor: colors.background, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.borderStrong }]}
          onPress={handleBack}
          activeOpacity={0.8}
        >
          <Ionicons name="chevron-back" size={25} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerTextBox}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Privacidade</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
            Segurança e controle no ELUS
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.borderStrong }]}>
          <View style={styles.heroIcon}>
            <Ionicons
              name="shield-checkmark-outline"
              size={42}
              color={colors.warning}
            />
          </View>

          <Text style={[styles.heroTitle, { color: colors.text }]}>Sua rede, suas regras</Text>

          <Text style={[styles.heroText, { color: colors.textMuted }]}>
            O ELUS foi pensado para criar conexões relevantes com mais clareza,
            controle e confiança.
          </Text>
        </View>

        <View style={styles.itemsBox}>
          {privacyItems.map((item) => (
            <View key={item.id} style={[styles.itemCard, { backgroundColor: colors.surface, borderColor: colors.borderStrong }]}>
              <View style={styles.itemIconBox}>
                <Ionicons name={item.icon} size={24} color={colors.warning} />
              </View>

              <View style={styles.itemTextBox}>
                <Text style={[styles.itemTitle, { color: colors.text }]}>{item.title}</Text>
                <Text style={[styles.itemDescription, { color: colors.textMuted }]}>
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
            <Text style={[styles.noticeTitle, { color: colors.text }]}>Aviso importante</Text>
            <Text style={[styles.noticeText, { color: colors.textMuted }]}>
              Esta é uma versão inicial do app. As políticas finais de
              privacidade e termos de uso deverão ser revisadas antes do
              lançamento oficial.
            </Text>
          </View>
        </View>

        <Button label="Aceitar e continuar" variant="primary" icon="arrow-forward" onPress={handleAccept} />

        <Button label="Voltar" variant="secondary" onPress={handleBack} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    paddingTop: 62,
    paddingHorizontal: 20,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    borderWidth: 1,
  },

  headerTextBox: {
    flex: 1,
  },

  headerTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '900',
  },

  headerSubtitle: {
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
    borderRadius: 30,
    paddingHorizontal: 24,
    paddingVertical: 30,
    borderWidth: 1,
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
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.4,
  },

  heroText: {
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
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
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
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '900',
  },

  itemDescription: {
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
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '900',
  },

  noticeText: {
    fontSize: 14,
    lineHeight: 21,
    marginTop: 6,
    fontWeight: '600',
  },

});