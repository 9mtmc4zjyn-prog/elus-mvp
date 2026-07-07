import { useState } from 'react';
import type { ComponentProps } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from './theme';
import { supabase } from '../src/lib/supabase';
import { INTEREST_CATEGORIES } from '../src/data/interestSuggestions';

const ELUS_SYMBOL = require('../assets/brand/elus_symbol_main.png');

type IconName = ComponentProps<typeof Ionicons>['name'];

type PresenceOption = {
  id: 'personal' | 'need_service' | 'offer_service';
  title: string;
  description: string;
  icon: IconName;
};

const presenceOptions: PresenceOption[] = [
  {
    id: 'personal',
    title: 'Aberto a sugestões',
    description: 'Após aprovação, o ELUS poderá mostrar sugestões relevantes.',
    icon: 'radio-outline',
  },
  {
    id: 'need_service',
    title: 'Seletivo',
    description: 'Após aprovação, receber sugestões com mais controle.',
    icon: 'options-outline',
  },
  {
    id: 'offer_service',
    title: 'Reservado',
    description: 'Após aprovação, manter sua presença mais discreta.',
    icon: 'lock-closed-outline',
  },
];

export default function ProfileSetupScreen() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [bio, setBio] = useState('');
  const [presenceMode, setPresenceMode] = useState<'personal' | 'need_service' | 'offer_service'>('personal');
  const [loading, setLoading] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [showCustomInterestInput, setShowCustomInterestInput] = useState(false);
  const [customInterestsText, setCustomInterestsText] = useState('');

  async function handleContinue() {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      Alert.alert('Sessão expirada', 'Faça login novamente para continuar.');
      router.replace('/login' as never);
      return;
    }

    const customInterests = customInterestsText
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    const allInterests = [...selectedInterests, ...customInterests];

    const updates: Record<string, string | string[]> = {
      presence_mode: presenceMode,
      interests: allInterests,
    };

    if (name.trim()) updates.name = name.trim();
    if (city.trim()) updates.city = city.trim();
    if (bio.trim()) updates.bio = bio.trim();

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    setLoading(false);

    if (error) {
      Alert.alert('Erro', 'Não foi possível salvar seu perfil. Tente novamente.');
      return;
    }

    router.push('/verification' as never);
  }

  function toggleInterest(interestId: string) {
    setSelectedInterests((current) =>
      current.includes(interestId)
        ? current.filter((id) => id !== interestId)
        : [...current, interestId]
    );
  }

  function handleBack() {
    router.back();
  }

  return (
    <KeyboardAvoidingView
      style={styles.keyboard}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
            activeOpacity={0.8}
            disabled={loading}
          >
            <Ionicons name="chevron-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.headerTextBox}>
            <Text style={styles.headerTitle}>Criar perfil</Text>
            <Text style={styles.headerSubtitle}>Prepare sua presença no ELUS</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroCard}>
            <View style={styles.avatarCircle}>
              <Image source={ELUS_SYMBOL} style={styles.avatarSymbol} resizeMode="cover" />
            </View>

            <Text style={styles.heroTitle}>Seu perfil ELUS</Text>

            <Text style={styles.heroText}>
              Você pode preparar seu perfil agora. Enquanto sua identidade não
              for aprovada, o uso continuará limitado.
            </Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>Informações básicas</Text>

            <Text style={styles.sectionSubtitle}>
              Esses dados ajudam a montar seu perfil, mas informações completas
              só serão exibidas após verificação aprovada.
            </Text>

            <View style={styles.inputBox}>
              <Ionicons name="person-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Seu nome"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
                editable={!loading}
              />
            </View>

            <View style={styles.inputBox}>
              <Ionicons name="location-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Cidade"
                placeholderTextColor={colors.textMuted}
                value={city}
                onChangeText={setCity}
                editable={!loading}
              />
            </View>

            <View style={styles.textAreaBox}>
              <TextInput
                style={styles.textArea}
                placeholder="Escreva uma breve descrição sobre você"
                placeholderTextColor={colors.textMuted}
                value={bio}
                onChangeText={setBio}
                multiline
                textAlignVertical="top"
                editable={!loading}
              />
            </View>
          </View>

          <View style={styles.interestsCard}>
            <Text style={styles.sectionTitle}>Interesses</Text>

            <Text style={styles.sectionSubtitle}>
              Escolha os temas que mais têm a ver com você. Isso ajuda o ELUS a
              sugerir afinidades melhores.
            </Text>

            {INTEREST_CATEGORIES.map((category) => (
              <View key={category.id} style={styles.interestCategoryBlock}>
                <Text style={styles.interestCategoryTitle}>{category.title}</Text>

                <View style={styles.interestChipsRow}>
                  {category.interests.map((interest) => {
                    const isSelected = selectedInterests.includes(interest.id);

                    return (
                      <Pressable
                        key={interest.id}
                        onPress={() => toggleInterest(interest.id)}
                        style={[styles.interestChip, isSelected && styles.interestChipOn]}
                        disabled={loading}
                      >
                        <Text style={[styles.interestChipText, isSelected && styles.interestChipTextOn]}>
                          {interest.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            ))}

            <View style={styles.interestChipsRow}>
              <Pressable
                onPress={() => setShowCustomInterestInput((prev) => !prev)}
                style={[styles.interestChip, showCustomInterestInput && styles.interestChipOn]}
                disabled={loading}
              >
                <Text style={[styles.interestChipText, showCustomInterestInput && styles.interestChipTextOn]}>
                  Outro +
                </Text>
              </Pressable>
            </View>

            {showCustomInterestInput ? (
              <View style={styles.customInterestInputBox}>
                <TextInput
                  style={styles.customInterestInput}
                  placeholder="Digite outros interesses separados por vírgula"
                  placeholderTextColor={colors.textMuted}
                  value={customInterestsText}
                  onChangeText={setCustomInterestsText}
                  editable={!loading}
                />
              </View>
            ) : null}
          </View>

          <View style={styles.presenceCard}>
            <Text style={styles.sectionTitle}>Modo de presença após aprovação</Text>

            <Text style={styles.sectionSubtitle}>
              Escolha como deseja aparecer depois que sua identidade for
              aprovada. Antes disso, seu perfil continua restrito.
            </Text>

            <View style={styles.optionsBox}>
              {presenceOptions.map((option) => {
                const isSelected = presenceMode === option.id;

                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                    onPress={() => setPresenceMode(option.id)}
                    activeOpacity={0.85}
                    disabled={loading}
                  >
                    <View style={[styles.optionIcon, isSelected && styles.optionIconSelected]}>
                      <Ionicons
                        name={option.icon}
                        size={24}
                        color={isSelected ? colors.white : colors.accent}
                      />
                    </View>

                    <View style={styles.optionTextBox}>
                      <Text style={styles.optionTitle}>{option.title}</Text>
                      <Text style={styles.optionDescription}>{option.description}</Text>
                    </View>

                    <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                      {isSelected ? <View style={styles.radioInner} /> : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.ruleCard}>
            <Ionicons name="shield-checkmark-outline" size={23} color={colors.accent} />
            <View style={styles.ruleTextBox}>
              <Text style={styles.ruleTitle}>Regra central ELUS</Text>
              <Text style={styles.ruleText}>
                Afinidade pode aparecer automaticamente. Conexão real só com
                identidade verificada e aprovação.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.continueButton, loading && styles.buttonDisabled]}
            onPress={handleContinue}
            activeOpacity={0.85}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <>
                <Text style={styles.continueButtonText}>Continuar</Text>
                <Ionicons name="arrow-forward" size={20} color={colors.white} />
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.footerText}>
            Você poderá editar essas informações depois. Elas ajudam a preparar
            seu perfil, mas só terão efeito completo após a aprovação da identidade.
          </Text>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboard: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingTop: 62, paddingHorizontal: 20, paddingBottom: 18, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.border, backgroundColor: colors.background },
  backButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', marginRight: 14, borderWidth: 1, borderColor: colors.border },
  headerTextBox: { flex: 1 },
  headerTitle: { color: colors.text, fontSize: 22, fontWeight: '900' },
  headerSubtitle: { color: colors.textMuted, fontSize: 14, marginTop: 3 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 42 },
  heroCard: { backgroundColor: colors.surface, borderRadius: 28, padding: 24, borderWidth: 1, borderColor: colors.border, alignItems: 'center', marginBottom: 18 },
  avatarCircle: { width: 104, height: 104, borderRadius: 52, backgroundColor: colors.background, borderWidth: 2, borderColor: colors.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 16, overflow: 'hidden' },
  avatarSymbol: { width: '100%', height: '100%' },
  heroTitle: { color: colors.text, fontSize: 26, fontWeight: '900', textAlign: 'center' },
  heroText: { color: colors.textMuted, fontSize: 15, lineHeight: 23, textAlign: 'center', marginTop: 10 },
  formCard: { backgroundColor: colors.surface, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: colors.border, marginBottom: 18 },
  sectionTitle: { color: colors.text, fontSize: 20, fontWeight: '900', marginBottom: 12 },
  sectionSubtitle: { color: colors.textMuted, fontSize: 14, lineHeight: 21, marginBottom: 14 },
  inputBox: { height: 56, borderRadius: 18, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: colors.text, fontSize: 16 },
  textAreaBox: { minHeight: 112, borderRadius: 18, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16, paddingVertical: 14 },
  textArea: { flex: 1, color: colors.text, fontSize: 16, lineHeight: 22 },
  presenceCard: { backgroundColor: colors.surface, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: colors.border },
  optionsBox: { gap: 12 },
  optionCard: { backgroundColor: colors.background, borderRadius: 18, borderWidth: 1, borderColor: colors.border, padding: 14, flexDirection: 'row', alignItems: 'center' },
  optionCardSelected: { borderColor: colors.primary, backgroundColor: colors.surfaceLight },
  optionIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  optionIconSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  optionTextBox: { flex: 1 },
  optionTitle: { color: colors.text, fontSize: 16, fontWeight: '900' },
  optionDescription: { color: colors.textMuted, fontSize: 13, lineHeight: 19, marginTop: 4 },
  radioOuter: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
  radioOuterSelected: { borderColor: colors.primary },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary },
  ruleCard: { marginTop: 18, backgroundColor: colors.surfaceLight, borderRadius: 22, padding: 18, borderWidth: 1, borderColor: colors.border, flexDirection: 'row' },
  ruleTextBox: { flex: 1, marginLeft: 12 },
  ruleTitle: { color: colors.text, fontSize: 16, fontWeight: '900' },
  ruleText: { color: colors.textMuted, fontSize: 14, lineHeight: 20, marginTop: 5 },
  continueButton: { height: 58, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 24 },
  continueButtonText: { color: colors.white, fontSize: 17, fontWeight: '900' },
  buttonDisabled: { opacity: 0.6 },
  footerText: { color: colors.textMuted, fontSize: 13, textAlign: 'center', marginTop: 16, lineHeight: 19 },
  interestsCard: { backgroundColor: colors.surface, borderRadius: 24, padding: 20, borderWidth: 1, borderColor: colors.border, marginBottom: 18 },
  interestCategoryBlock: { marginBottom: 16 },
  interestCategoryTitle: { color: colors.textMuted, fontSize: 13, fontWeight: '800', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
  interestChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  interestChip: { minHeight: 36, borderRadius: 18, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, paddingHorizontal: 13, paddingVertical: 9 },
  interestChipOn: { borderColor: colors.cyanBorder, backgroundColor: colors.cyanSoft },
  interestChipText: { color: colors.textMuted, fontSize: 12, lineHeight: 16, fontWeight: '800' },
  interestChipTextOn: { color: colors.accent },
  customInterestInputBox: { marginTop: 12, height: 52, borderRadius: 16, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, justifyContent: 'center', paddingHorizontal: 16 },
  customInterestInput: { color: colors.text, fontSize: 15 },
});
