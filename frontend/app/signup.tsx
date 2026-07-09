import React, { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../src/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '../src/components/Button';

const SYMBOL = require('../assets/brand/elus_symbol_main.png');
const WATERMARK = require('../assets/watermark/elus_symbol_watermark_10.png');

const COLORS = {
  background: '#0B101A',
  card: 'rgba(20,26,38,0.94)',
  infoCard: 'rgba(94,158,171,0.12)',
  input: 'rgba(11,16,26,0.88)',
  border: 'rgba(255,255,255,0.12)',
  borderStrong: 'rgba(255,255,255,0.18)',
  borderBlue: 'rgba(94,158,171,0.32)',
  text: '#EDEDED',
  mutedStrong: 'rgba(237,237,237,0.86)',
  soft: 'rgba(161,169,184,0.55)',
  blue: '#5E9EAB',
  blueLight: '#8FA3B8',
  cyan: '#5E9EAB',
  gold: '#C49A45',
};

// Idade mínima exigida para criar conta no ELUS (ECA Digital — Lei 15.211/2025)
const MIN_AGE = 18;

export default function SignupScreen() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Novos campos: dia, mês e ano de nascimento, separados
  const [birthDay, setBirthDay] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYear, setBirthYear] = useState('');

  // Confere se a data existe de verdade (ex: recusa 31/02)
  function isValidDate(day: number, month: number, year: number) {
    const date = new Date(year, month - 1, day);
    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  }

  // Calcula quantos anos completos a pessoa tem hoje
  function calculateAge(day: number, month: number, year: number) {
    const today = new Date();
    const birthDate = new Date(year, month - 1, day);
    let age = today.getFullYear() - birthDate.getFullYear();
    const hasHadBirthdayThisYear =
      today.getMonth() > birthDate.getMonth() ||
      (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());
    if (!hasHadBirthdayThisYear) {
      age -= 1;
    }
    return age;
  }

  async function createAccount() {
    const normalizedName = name.trim();
    const normalizedEmail = email.trim();

    if (!normalizedName) {
      Alert.alert('Nome obrigatório', 'Digite seu nome para continuar.');
      return;
    }

    if (!normalizedEmail) {
      Alert.alert('E-mail obrigatório', 'Digite seu e-mail para continuar.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Senha fraca', 'A senha precisa ter pelo menos 6 caracteres.');
      return;
    }

    // Validação da data de nascimento
    const day = parseInt(birthDay, 10);
    const month = parseInt(birthMonth, 10);
    const year = parseInt(birthYear, 10);

    if (!birthDay || !birthMonth || !birthYear) {
      Alert.alert('Data de nascimento obrigatória', 'Preencha dia, mês e ano de nascimento.');
      return;
    }

    if (
      isNaN(day) || isNaN(month) || isNaN(year) ||
      day < 1 || day > 31 ||
      month < 1 || month > 12 ||
      year < 1900 || year > new Date().getFullYear()
    ) {
      Alert.alert('Data inválida', 'Confira o dia, mês e ano digitados.');
      return;
    }

    if (!isValidDate(day, month, year)) {
      Alert.alert('Data inválida', 'Essa data não existe. Confira o dia, mês e ano.');
      return;
    }

    const age = calculateAge(day, month, year);

    if (age < MIN_AGE) {
      Alert.alert(
        'Cadastro não permitido',
        'O ELUS é destinado a maiores de 18 anos, conforme exigido pela legislação vigente.'
      );
      return;
    }

    if (!termsAccepted) {
      Alert.alert(
        'Aceite os Termos',
        'Você precisa ler e aceitar os Termos de Uso e a Política de Privacidade para criar uma conta.'
      );
      return;
    }

    setLoading(true);

    const termsAcceptedAt = new Date().toISOString();
    const birthDateISO = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    const { error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          name: normalizedName,
          terms_accepted_at: termsAcceptedAt,
          birth_date: birthDateISO,
        },
      },
    });

    setLoading(false);

    if (error) {
      Alert.alert('Erro ao criar conta', error.message);
      return;
    }

    router.push('/profile-type' as never);
  }

  function goToLogin() {
    router.push('/login' as never);
  }

  function togglePasswordVisibility() {
    setShowPassword((current) => !current);
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" />

      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Image source={WATERMARK} style={styles.watermarkOne} resizeMode="contain" />
        <Image source={WATERMARK} style={styles.watermarkTwo} resizeMode="contain" />
        <View style={styles.blueGlow} />
        <View style={styles.purpleGlow} />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoArea}>
            <View style={styles.symbolHalo}>
              <Image source={SYMBOL} style={styles.heroSymbol} resizeMode="cover" />
            </View>

            <Text style={styles.introText}>
              Crie seu campo de presença e comece a construir conexões humanas
              com mais intenção, respeito e profundidade.
            </Text>

            <View style={styles.trustRow}>
              <View style={styles.trustPill}>
                <Text style={styles.trustDot}>•</Text>
                <Text style={styles.trustText}>Identidade real</Text>
              </View>

              <View style={styles.trustPill}>
                <Text style={styles.trustDotCyan}>•</Text>
                <Text style={styles.trustText}>Verificação única</Text>
              </View>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardGlowOne} />
            <View style={styles.cardGlowTwo} />

            <View style={styles.cardHeader}>
              <View style={styles.cardSymbol}>
                <Image source={SYMBOL} style={styles.cardSymbolImage} resizeMode="cover" />
              </View>

              <View style={styles.cardHeaderText}>
                <Text style={styles.kicker}>Começar no ELUS</Text>
                <Text style={styles.title}>Criar sua conta</Text>
              </View>
            </View>

            <Text style={styles.label}>Nome</Text>
            <View style={styles.inputBox}>
              <Text style={styles.inputIcon}>♙</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Seu nome"
                placeholderTextColor="rgba(143,163,197,0.70)"
                style={styles.input}
                autoCapitalize="words"
                editable={!loading}
              />
            </View>

            <Text style={styles.label}>E-mail</Text>
            <View style={styles.inputBox}>
              <Text style={styles.inputIcon}>✉</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="seuemail@exemplo.com"
                placeholderTextColor="rgba(143,163,197,0.70)"
                style={styles.input}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            <Text style={styles.label}>Senha</Text>
            <View style={styles.inputBox}>
              <Text style={styles.inputIcon}>⌁</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Crie uma senha"
                placeholderTextColor="rgba(143,163,197,0.70)"
                style={styles.input}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />

              <Pressable
                style={({ pressed }) => [
                  styles.passwordCheckButton,
                  showPassword && styles.passwordCheckButtonActive,
                  pressed && styles.pressedSmall,
                ]}
                onPress={togglePasswordVisibility}
                hitSlop={10}
              >
                {showPassword ? (
                  <Text style={styles.passwordCheckMark}>✓</Text>
                ) : null}
              </Pressable>
            </View>

            <Text style={styles.passwordHint}>
              {showPassword ? 'Senha visível' : 'Senha oculta'}
            </Text>

            <Text style={styles.label}>Data de nascimento</Text>
            <View style={styles.dateRow}>
              <View style={styles.dateInputBoxSmall}>
                <TextInput
                  value={birthDay}
                  onChangeText={setBirthDay}
                  placeholder="DD"
                  placeholderTextColor="rgba(143,163,197,0.70)"
                  style={styles.dateInput}
                  keyboardType="number-pad"
                  maxLength={2}
                  editable={!loading}
                />
              </View>

              <View style={styles.dateInputBoxSmall}>
                <TextInput
                  value={birthMonth}
                  onChangeText={setBirthMonth}
                  placeholder="MM"
                  placeholderTextColor="rgba(143,163,197,0.70)"
                  style={styles.dateInput}
                  keyboardType="number-pad"
                  maxLength={2}
                  editable={!loading}
                />
              </View>

              <View style={styles.dateInputBoxLarge}>
                <TextInput
                  value={birthYear}
                  onChangeText={setBirthYear}
                  placeholder="AAAA"
                  placeholderTextColor="rgba(143,163,197,0.70)"
                  style={styles.dateInput}
                  keyboardType="number-pad"
                  maxLength={4}
                  editable={!loading}
                />
              </View>
            </View>
            <Text style={styles.dateHint}>
              O ELUS é destinado a maiores de 18 anos.
            </Text>

            <View style={styles.infoBox}>
              <View style={styles.infoIconBox}>
                <Text style={styles.infoIcon}>✧</Text>
              </View>
              <Text style={styles.infoText}>
                Depois do cadastro, você fará uma verificação única com selfie
                segurando um documento oficial com foto.
              </Text>
            </View>

            <View style={styles.securityBox}>
              <Text style={styles.securityTitle}>Segurança sem complicar o acesso</Text>
              <Text style={styles.securityText}>
                Após a validação, o ELUS não pedirá documento em todo login. O acesso
                diário continuará simples e rápido.
              </Text>
            </View>

            <Pressable
              style={styles.termsRow}
              onPress={() => setTermsAccepted((v) => !v)}
              disabled={loading}
            >
              <View style={[styles.termsCheckbox, termsAccepted && styles.termsCheckboxChecked]}>
                {termsAccepted ? (
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                ) : null}
              </View>
              <Text style={styles.termsText}>
                Li e aceito os{' '}
                <Text
                  style={styles.termsLink}
                  onPress={() => router.push('/terms' as never)}
                >
                  Termos de Uso
                </Text>
                {' '}e a{' '}
                <Text
                  style={styles.termsLink}
                  onPress={() => router.push('/privacy-policy' as never)}
                >
                  Política de Privacidade
                </Text>
              </Text>
            </Pressable>

            <Button
              label="Criar conta →"
              variant="primary"
              loading={loading}
              disabled={loading || !termsAccepted}
              onPress={createAccount}
            />

            <Button
              label="Já tenho uma conta"
              variant="secondary"
              disabled={loading}
              onPress={goToLogin}
            />
          </View>

          <Text style={styles.footer}>ELUS · Conexões que importam.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  keyboard: { flex: 1 },
  scroll: { flex: 1 },
  watermarkOne: { position: 'absolute', width: 340, height: 340, top: -132, left: -152, opacity: 0.07 },
  watermarkTwo: { position: 'absolute', width: 430, height: 430, right: -198, bottom: 74, opacity: 0.06 },
  blueGlow: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(45,100,255,0.15)', top: 120, alignSelf: 'center' },
  purpleGlow: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(139,92,255,0.10)', bottom: 90, left: -120 },
  content: { flexGrow: 1, paddingHorizontal: 22, paddingTop: 30, paddingBottom: 34 },
  logoArea: { alignItems: 'center', marginBottom: 24 },
  symbolHalo: { width: 106, height: 106, borderRadius: 53, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(45,100,255,0.08)', borderWidth: 1, borderColor: 'rgba(143,179,255,0.16)', shadowColor: COLORS.blue, shadowOpacity: 0.34, shadowRadius: 28, shadowOffset: { width: 0, height: 0 } },
  heroSymbol: { width: 82, height: 82, borderRadius: 41 },
  introText: { marginTop: 18, maxWidth: 348, color: COLORS.mutedStrong, fontSize: 16, lineHeight: 27, textAlign: 'center', fontWeight: '600' },
  trustRow: { marginTop: 18, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  trustPill: { minHeight: 32, borderRadius: 16, paddingHorizontal: 12, marginHorizontal: 5, marginBottom: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.045)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  trustDot: { color: COLORS.gold, fontSize: 20, lineHeight: 20, marginRight: 6 },
  trustDotCyan: { color: COLORS.cyan, fontSize: 20, lineHeight: 20, marginRight: 6 },
  trustText: { color: COLORS.mutedStrong, fontSize: 12, fontWeight: '800' },
  card: { padding: 24, borderRadius: 34, backgroundColor: 'rgba(12,15,27,0.94)', borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden', shadowColor: COLORS.blue, shadowOpacity: 0.16, shadowRadius: 26, shadowOffset: { width: 0, height: 0 } },
  cardGlowOne: { position: 'absolute', width: 190, height: 190, borderRadius: 95, backgroundColor: 'rgba(45,100,255,0.11)', right: -90, top: -80 },
  cardGlowTwo: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(139,92,255,0.10)', left: -92, bottom: -84 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  cardSymbol: { width: 58, height: 58, borderRadius: 29, overflow: 'hidden', backgroundColor: '#05060A', borderWidth: 1, borderColor: COLORS.borderBlue, marginRight: 14 },
  cardSymbolImage: { width: '100%', height: '100%' },
  cardHeaderText: { flex: 1 },
  kicker: { color: COLORS.blueLight, fontSize: 12, fontWeight: '900', letterSpacing: 3.4, textTransform: 'uppercase', marginBottom: 6 },
  title: { color: COLORS.text, fontSize: 31, lineHeight: 36, fontWeight: '900', letterSpacing: -0.8 },
  label: { marginTop: 16, marginBottom: 8, color: COLORS.text, fontSize: 15, fontWeight: '900' },
  inputBox: { minHeight: 60, borderRadius: 25, backgroundColor: COLORS.input, borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 17 },
  inputIcon: { width: 28, color: COLORS.blueLight, fontSize: 22, marginRight: 8, textAlign: 'center' },
  input: { flex: 1, color: COLORS.text, fontSize: 18, fontWeight: '700', paddingVertical: 0 },
  passwordCheckButton: { width: 30, height: 30, borderRadius: 9, marginLeft: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(3,4,10,0.55)', borderWidth: 2, borderColor: COLORS.blueLight },
  passwordCheckButtonActive: { backgroundColor: COLORS.blue, borderColor: COLORS.blue, shadowColor: COLORS.blue, shadowOpacity: 0.5, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } },
  passwordCheckMark: { color: COLORS.text, fontSize: 18, lineHeight: 20, fontWeight: '900' },
  passwordHint: { marginTop: 8, color: COLORS.soft, fontSize: 12, fontWeight: '700', textAlign: 'right' },
  dateRow: { flexDirection: 'row', gap: 10 },
  dateInputBoxSmall: { flex: 1, minHeight: 60, borderRadius: 25, backgroundColor: COLORS.input, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  dateInputBoxLarge: { flex: 1.6, minHeight: 60, borderRadius: 25, backgroundColor: COLORS.input, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  dateInput: { color: COLORS.text, fontSize: 18, fontWeight: '700', textAlign: 'center', width: '100%' },
  dateHint: { marginTop: 8, color: COLORS.soft, fontSize: 12, fontWeight: '700' },
  infoBox: { marginTop: 18, padding: 17, borderRadius: 24, backgroundColor: COLORS.infoCard, borderWidth: 1, borderColor: COLORS.borderBlue, flexDirection: 'row', alignItems: 'center' },
  infoIconBox: { width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(45,100,255,0.18)', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  infoIcon: { color: COLORS.blueLight, fontSize: 24, fontWeight: '900' },
  infoText: { flex: 1, color: COLORS.mutedStrong, fontSize: 14, lineHeight: 22, fontWeight: '700' },
  securityBox: { marginTop: 14, padding: 15, borderRadius: 22, backgroundColor: 'rgba(217,180,106,0.08)', borderWidth: 1, borderColor: 'rgba(217,180,106,0.22)' },
  securityTitle: { color: COLORS.gold, fontSize: 14, fontWeight: '900', marginBottom: 6 },
  securityText: { color: COLORS.mutedStrong, fontSize: 13, lineHeight: 20, fontWeight: '700' },
  termsRow: { marginTop: 20, flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  termsCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: COLORS.blueLight,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    marginTop: 1,
    flexShrink: 0,
  },
  termsCheckboxChecked: { backgroundColor: COLORS.blue, borderColor: COLORS.blue },
  termsText: { flex: 1, color: COLORS.mutedStrong, fontSize: 13, lineHeight: 20, fontWeight: '700' },
  termsLink: { color: COLORS.blueLight, fontWeight: '900', textDecorationLine: 'underline' },
  footer: { marginTop: 24, color: COLORS.soft, textAlign: 'center', fontSize: 14, fontWeight: '800' },
  pressedSmall: { opacity: 0.7, transform: [{ scale: 0.94 }] },
});