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
import { useTheme } from '../src/theme/ThemeContext';
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
  const { colors } = useTheme();

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
      style={[styles.keyboard, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
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
            <Text style={[styles.headerTitle, { color: colors.text }]}>Criar perfil</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>Prepare sua presença no ELUS</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.avatarCircle, { backgroundColor: colors.background, borderColor: colors.accent }]}>
              <Image source={ELUS_SYMBOL} style={styles.avatarSymbol} resizeMode="cover" />
            </View>

            <Text style={[styles.heroTitle, { color: colors.text }]}>Seu perfil ELUS</Text>

            <Text style={[styles.heroText, { color: colors.textMuted }]}>
              Você pode preparar seu perfil agora. Enquanto sua identidade não
              for aprovada, o uso continuará limitado.
            </Text>
          </View>

          <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Informações básicas</Text>

            <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
              Esses dados ajudam a montar seu perfil, mas informações completas
              só serão exibidas após verificação aprovada.
            </Text>

            <View style={[styles.inputBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Ionicons name="person-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Seu nome"
                placeholderTextColor={colors.textMuted}
                value={name}
                onChangeText={setName}
                editable={!loading}
              />
            </View>

            <View style={[styles.inputBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Ionicons name="location-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Cidade"
                placeholderTextColor={colors.textMuted}
                value={city}
                onChangeText={setCity}
                editable={!loading}
              />
            </View>

            <View style={[styles.textAreaBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <TextInput
                style={[styles.textArea, { color: colors.text }]}
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

          <View style={[styles.interestsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Interesses</Text>

            <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
              Escolha os temas que mais têm a ver com você. Isso ajuda o ELUS a
              sugerir afinidades melhores.
            </Text>

            {INTEREST_CATEGORIES.map((category) => (
              <View key={category.id} style={styles.interestCategoryBlock}>
                <Text style={[styles.interestCategoryTitle, { color: colors.textMuted }]}>{category.title}</Text>

                <View style={styles.interestChipsRow}>
                  {category.interests.map((interest) => {
                    const isSelected = selectedInterests.includes(interest.id);

                    return (
                      <Pressable
                        key={interest.id}
                        onPress={() => toggleInterest(interest.id)}
                        style={[
                          styles.interestChip,
                          { borderColor: colors.border, backgroundColor: colors.background },
                          isSelected && {
                            borderColor: `${colors.accent}6B`,
                            backgroundColor: `${colors.accent}1A`,
                          },
                        ]}
                        disabled={loading}
                      >
                        <Text
                          style={[
                            styles.interestChipText,
                            { color: colors.textMuted },
                            isSelected && { color: colors.accent },
                          ]}
                        >
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
                style={[
                  styles.outroChip,
                  { borderColor: colors.accent, backgroundColor: colors.background },
                  showCustomInterestInput && {
                    borderColor: `${colors.accent}6B`,
                    backgroundColor: `${colors.accent}1A`,
                  },
                ]}
                disabled={loading}
              >
                <Text
                  style={[
                    styles.interestChipText,
                    { color: colors.textMuted },
                    showCustomInterestInput && { color: colors.accent },
                  ]}
                >
                  Outro +
                </Text>
              </Pressable>
            </View>

            {showCustomInterestInput ? (
              <View style={[styles.customInterestInputBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <TextInput
                  style={[styles.customInterestInput, { color: colors.text }]}
                  placeholder="Digite outros interesses separados por vírgula"
                  placeholderTextColor={colors.textMuted}
                  value={customInterestsText}
                  onChangeText={setCustomInterestsText}
                  editable={!loading}
                />
              </View>
            ) : null}
          </View>

          <View style={[styles.presenceCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Modo de presença após aprovação</Text>

            <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
              Escolha como deseja aparecer depois que sua identidade for
              aprovada. Antes disso, seu perfil continua restrito.
            </Text>

            <View style={styles.optionsBox}>
              {presenceOptions.map((option) => {
                const isSelected = presenceMode === option.id;

                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.optionCard,
                      { backgroundColor: colors.background, borderColor: colors.border },
                      isSelected && { borderColor: colors.accent, backgroundColor: colors.surfaceElevated },
                    ]}
                    onPress={() => setPresenceMode(option.id)}
                    activeOpacity={0.85}
                    disabled={loading}
                  >
                    <View
                      style={[
                        styles.optionIcon,
                        { backgroundColor: colors.surface, borderColor: colors.border },
                        isSelected && { backgroundColor: colors.accent, borderColor: colors.accent },
                      ]}
                    >
                      <Ionicons
                        name={option.icon}
                        size={24}
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
          </View>

          <View style={[styles.ruleCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
            <Ionicons name="shield-checkmark-outline" size={23} color={colors.accent} />
            <View style={styles.ruleTextBox}>
              <Text style={[styles.ruleTitle, { color: colors.text }]}>Regra central ELUS</Text>
              <Text style={[styles.ruleText, { color: colors.textMuted }]}>
                Afinidade pode aparecer automaticamente. Conexão real só com
                identidade verificada e aprovação.
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

          <Text style={[styles.footerText, { color: colors.textMuted }]}>
            Você poderá editar essas informações depois. Elas ajudam a preparar
            seu perfil, mas só terão efeito completo após a aprovação da identidade.
          </Text>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboard: { flex: 1 },
  container: { flex: 1 },
  header: { paddingTop: 62, paddingHorizontal: 20, paddingBottom: 18, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1 },
  backButton: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', marginRight: 14, borderWidth: 1 },
  headerTextBox: { flex: 1 },
  headerTitle: { fontSize: 22, fontWeight: '900' },
  headerSubtitle: { fontSize: 14, marginTop: 3 },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 42 },
  heroCard: { borderRadius: 28, padding: 24, borderWidth: 1, alignItems: 'center', marginBottom: 18 },
  avatarCircle: { width: 104, height: 104, borderRadius: 52, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginBottom: 16, overflow: 'hidden' },
  avatarSymbol: { width: '100%', height: '100%' },
  heroTitle: { fontSize: 26, fontWeight: '900', textAlign: 'center' },
  heroText: { fontSize: 15, lineHeight: 23, textAlign: 'center', marginTop: 10 },
  formCard: { borderRadius: 24, padding: 20, borderWidth: 1, marginBottom: 18 },
  sectionTitle: { fontSize: 20, fontWeight: '900', marginBottom: 12 },
  sectionSubtitle: { fontSize: 14, lineHeight: 21, marginBottom: 14 },
  inputBox: { height: 56, borderRadius: 18, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16 },
  textAreaBox: { minHeight: 112, borderRadius: 18, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 14 },
  textArea: { flex: 1, fontSize: 16, lineHeight: 22 },
  presenceCard: { borderRadius: 24, padding: 20, borderWidth: 1 },
  optionsBox: { gap: 12 },
  optionCard: { borderRadius: 18, borderWidth: 1, padding: 14, flexDirection: 'row', alignItems: 'center' },
  optionIcon: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  optionTextBox: { flex: 1 },
  optionTitle: { fontSize: 16, fontWeight: '900' },
  optionDescription: { fontSize: 13, lineHeight: 19, marginTop: 4 },
  radioOuter: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginLeft: 10 },
  radioInner: { width: 12, height: 12, borderRadius: 6 },
  ruleCard: { marginTop: 18, borderRadius: 22, padding: 18, borderWidth: 1, flexDirection: 'row' },
  ruleTextBox: { flex: 1, marginLeft: 12 },
  ruleTitle: { fontSize: 16, fontWeight: '900' },
  ruleText: { fontSize: 14, lineHeight: 20, marginTop: 5 },
  continueButton: { height: 58, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 24 },
  continueButtonText: { color: '#FFFFFF', fontSize: 17, fontWeight: '900' },
  buttonDisabled: { opacity: 0.6 },
  footerText: { fontSize: 13, textAlign: 'center', marginTop: 16, lineHeight: 19 },
  interestsCard: { borderRadius: 24, padding: 20, borderWidth: 1, marginBottom: 18 },
  interestCategoryBlock: { marginBottom: 16 },
  interestCategoryTitle: { fontSize: 13, fontWeight: '800', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 },
  interestChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  interestChip: { minHeight: 36, borderRadius: 18, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 9 },
  outroChip: {
    minHeight: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    paddingHorizontal: 13,
    paddingVertical: 9,
  },
  interestChipText: { fontSize: 12, lineHeight: 16, fontWeight: '800' },
  customInterestInputBox: { marginTop: 12, height: 52, borderRadius: 16, borderWidth: 1, justifyContent: 'center', paddingHorizontal: 16 },
  customInterestInput: { fontSize: 15 },
});
