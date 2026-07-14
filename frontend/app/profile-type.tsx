import { useState } from 'react';
import type { ComponentProps } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../src/theme/ThemeContext';
import { supabase } from '../src/lib/supabase';

type IconName = ComponentProps<typeof Ionicons>['name'];

type ProfileOption = {
  id: string;
  dbValue: 'person' | 'business' | 'assisted';
  title: string;
  description: string;
  icon: IconName;
};

const profileOptions: ProfileOption[] = [
  {
    id: 'personal',
    dbValue: 'person',
    title: 'Perfil pessoal',
    description: 'Para preparar uma presença pessoal, familiar, social e profissional dentro do ELUS.',
    icon: 'person-outline',
  },
  {
    id: 'professional',
    dbValue: 'person',
    title: 'Perfil profissional',
    description: 'Para preparar uma rede estratégica de contatos, oportunidades e relações de trabalho.',
    icon: 'briefcase-outline',
  },
  {
    id: 'business',
    dbValue: 'business',
    title: 'Perfil empresarial',
    description: 'Para preparar uma presença de empresa, projeto, negócio ou serviço dentro do ELUS.',
    icon: 'business-outline',
  },
  {
    id: 'simplified',
    dbValue: 'assisted',
    title: 'Perfil simplificado',
    description: 'Para quem prefere uma experiência mais simples, com menos etapas, linguagem direta e exposição reduzida.',
    icon: 'accessibility-outline',
  },
];

export default function ProfileTypeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [selectedType, setSelectedType] = useState('personal');
  const [loading, setLoading] = useState(false);

  async function handleContinue() {
    const selected = profileOptions.find((option) => option.id === selectedType);

    if (!selected) return;

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      Alert.alert('Sessão expirada', 'Faça login novamente para continuar.');
      router.replace('/login' as never);
      return;
    }

    const { error } = await supabase
      .from('users')
      .update({ profile_type: selected.dbValue })
      .eq('id', user.id);

    setLoading(false);

    if (error) {
      Alert.alert('Erro', 'Não foi possível salvar o tipo de perfil. Tente novamente.');
      return;
    }

    router.push('/profile-setup' as never);
  }

  function handleBack() {
    router.back();
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={handleBack}
          activeOpacity={0.8}
          disabled={loading}
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerTextBox}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Tipo de perfil</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>Escolha como deseja preparar seu perfil</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.heroIcon, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Ionicons name="people-outline" size={42} color={colors.accent} />
          </View>

          <Text style={[styles.heroTitle, { color: colors.text }]}>Como você quer preparar sua presença?</Text>

          <Text style={[styles.heroText, { color: colors.textMuted }]}>
            Você pode preparar seu perfil agora. Essas escolhas ajudam o ELUS a
            organizar sua experiência, mas só serão exibidas plenamente após a
            aprovação da identidade.
          </Text>
        </View>

        <View style={styles.optionsBox}>
          {profileOptions.map((option) => {
            const isSelected = selectedType === option.id;

            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.optionCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  isSelected && { borderColor: colors.accent, backgroundColor: colors.surfaceElevated },
                ]}
                onPress={() => setSelectedType(option.id)}
                activeOpacity={0.85}
                disabled={loading}
              >
                <View
                  style={[
                    styles.optionIconBox,
                    { backgroundColor: colors.background, borderColor: colors.border },
                    isSelected && { backgroundColor: colors.accent, borderColor: colors.accent },
                  ]}
                >
                  <Ionicons
                    name={option.icon}
                    size={28}
                    color={isSelected ? '#FFFFFF' : colors.accent}
                  />
                </View>

                <View style={styles.optionTextBox}>
                  <Text style={[styles.optionTitle, { color: colors.text }]}>{option.title}</Text>
                  <Text style={[styles.optionDescription, { color: colors.textMuted }]}>{option.description}</Text>
                </View>

                <View
                  style={[
                    styles.radioOuter,
                    { borderColor: colors.border },
                    isSelected && { borderColor: colors.accent },
                  ]}
                >
                  {isSelected ? <View style={[styles.radioInner, { backgroundColor: colors.accent }]} /> : null}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <Ionicons name="information-circle-outline" size={24} color={colors.accent} />
          <View style={styles.infoTextBox}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>Você pode alterar depois</Text>
            <Text style={[styles.infoText, { color: colors.textMuted }]}>
              Essas escolhas ajudam a preparar seu perfil, mas só terão efeito
              completo após a aprovação da identidade. Até lá, o uso continua limitado.
            </Text>
          </View>
        </View>

        <View style={[styles.ruleCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
          <Ionicons name="shield-checkmark-outline" size={24} color={colors.accent} />
          <View style={styles.infoTextBox}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>Regra central ELUS</Text>
            <Text style={[styles.infoText, { color: colors.textMuted }]}>
              Afinidade pode aparecer automaticamente. Conexão real só acontece
              com identidade verificada e aprovação.
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.continueButton, { backgroundColor: colors.accent }, loading && styles.buttonDisabled]}
          onPress={handleContinue}
          activeOpacity={0.85}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.continueButtonText}>Continuar</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={handleBack}
          activeOpacity={0.85}
          disabled={loading}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Voltar</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 62, paddingHorizontal: 20, paddingBottom: 18, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1 },
  backButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', marginRight: 14, borderWidth: 1 },
  headerTextBox: { flex: 1 },
  headerTitle: { fontSize: 22, fontWeight: '900' },
  headerSubtitle: { fontSize: 14, marginTop: 3 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 42 },
  heroCard: { borderRadius: 28, padding: 24, borderWidth: 1, alignItems: 'center', marginBottom: 20 },
  heroIcon: { width: 88, height: 88, borderRadius: 44, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  heroTitle: { fontSize: 26, fontWeight: '900', textAlign: 'center' },
  heroText: { fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 10 },
  optionsBox: { gap: 14 },
  optionCard: { borderRadius: 24, padding: 18, borderWidth: 1, flexDirection: 'row', alignItems: 'center' },
  optionIconBox: { width: 56, height: 56, borderRadius: 28, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  optionTextBox: { flex: 1 },
  optionTitle: { fontSize: 17, fontWeight: '900' },
  optionDescription: { fontSize: 14, lineHeight: 20, marginTop: 5 },
  radioOuter: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
  radioInner: { width: 12, height: 12, borderRadius: 6 },
  infoCard: { marginTop: 22, borderRadius: 22, padding: 18, borderWidth: 1, flexDirection: 'row' },
  ruleCard: { marginTop: 14, borderRadius: 22, padding: 18, borderWidth: 1, flexDirection: 'row' },
  infoTextBox: { flex: 1, marginLeft: 12 },
  infoTitle: { fontSize: 16, fontWeight: '900' },
  infoText: { fontSize: 14, lineHeight: 20, marginTop: 5 },
  continueButton: { height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 24 },
  continueButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '900' },
  buttonDisabled: { opacity: 0.6 },
  secondaryButton: { height: 56, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  secondaryButtonText: { fontSize: 16, fontWeight: '800' },
});
