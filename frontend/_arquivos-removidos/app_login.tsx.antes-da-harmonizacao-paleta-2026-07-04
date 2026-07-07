import React, { useState, useEffect } from 'react';
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

const SYMBOL = require('../assets/brand/elus_symbol_main.png');
const WATERMARK = require('../assets/watermark/elus_symbol_watermark_10.png');

const COLORS = {
  background: '#03040A',
  card: 'rgba(12,15,27,0.94)',
  cardSoft: 'rgba(255,255,255,0.045)',
  input: 'rgba(3,4,10,0.88)',
  border: 'rgba(255,255,255,0.12)',
  borderStrong: 'rgba(255,255,255,0.18)',
  borderBlue: 'rgba(45,125,255,0.32)',
  text: '#FFFFFF',
  muted: 'rgba(255,255,255,0.70)',
  mutedStrong: 'rgba(210,218,236,0.86)',
  soft: 'rgba(255,255,255,0.46)',
  blue: '#2D64FF',
  blueLight: '#8FB3FF',
  cyan: '#26D9FF',
  purple: '#8B5CFF',
  gold: '#D9B46A',
};

function translateSupabaseError(message: string): string {
  const msg = (message || '').toLowerCase();
  if (msg.includes('invalid login credentials') || msg.includes('invalid email or password')) {
    return 'E-mail ou senha incorretos. Verifique e tente novamente.';
  }
  if (msg.includes('email not confirmed')) {
    return 'Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.';
  }
  if (msg.includes('user not found')) {
    return 'Usuário não encontrado. Verifique o e-mail digitado.';
  }
  if (msg.includes('too many requests') || msg.includes('rate limit')) {
    return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
  }
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('connection')) {
    return 'Verifique sua conexão com a internet e tente novamente.';
  }
  return 'Não foi possível entrar. Tente novamente em instantes.';
}

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;

      if (event === 'INITIAL_SESSION' && session) {
        // Não confia direto no evento local — revalida no servidor.
        // Uma sessão "fantasma" (ainda não totalmente limpa após logout)
        // falha nessa checagem e não te leva de volta pro app por engano.
        supabase.auth.getUser().then(({ data, error }) => {
          if (!active) return;
          if (data.user && !error) {
            router.replace('/(tabs)' as never);
          }
        });
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function enterApp() {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Campos obrigatórios', 'Preencha e-mail e senha para continuar.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);

    if (error) {
      Alert.alert('Erro ao entrar', translateSupabaseError(error.message));
      return;
    }

    router.replace('/(tabs)' as never);
  }

  async function forgotPassword() {
    if (!email.trim()) {
      Alert.alert('Informe seu e-mail', 'Digite o e-mail acima para receber o link de recuperação.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    setLoading(false);

    if (error) {
      Alert.alert('Erro', error.message);
      return;
    }

    Alert.alert('E-mail enviado', 'Verifique sua caixa de entrada para redefinir a senha.');
  }

  function goToSignup() {
    router.push('/signup' as never);
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
              Entre no campo ELUS e encontre conexões humanas com intenção,
              presença e propósito.
            </Text>

            <View style={styles.trustRow}>
              <View style={styles.trustPill}>
                <Text style={styles.trustDot}>•</Text>
                <Text style={styles.trustText}>Identidade real</Text>
              </View>

              <View style={styles.trustPill}>
                <Text style={styles.trustDotCyan}>•</Text>
                <Text style={styles.trustText}>Rede contextual</Text>
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
                <Text style={styles.kicker}>Bem-vindo de volta</Text>
                <Text style={styles.title}>Entrar na sua conta</Text>
              </View>
            </View>

            <View style={styles.formBlock}>
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
                  placeholder="Digite sua senha"
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

              <Pressable style={styles.forgotButton} onPress={forgotPassword} disabled={loading}>
                <Text style={styles.forgotText}>Esqueci minha senha</Text>
              </Pressable>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.pressed,
                loading && styles.buttonDisabled,
              ]}
              onPress={enterApp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryButtonText}>Entrar →</Text>
              )}
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.pressed,
              ]}
              onPress={goToSignup}
              disabled={loading}
            >
              <Text style={styles.secondaryButtonText}>Ainda não tenho conta</Text>
            </Pressable>
          </View>

          <Text style={styles.footer}>
            ELUS · Conexões que importam.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  keyboard: { flex: 1 },
  scroll: { flex: 1 },
  watermarkOne: { position: 'absolute', width: 360, height: 360, top: -142, left: -162, opacity: 0.07 },
  watermarkTwo: { position: 'absolute', width: 440, height: 440, right: -198, bottom: 64, opacity: 0.06 },
  blueGlow: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(45,100,255,0.16)', top: 126, alignSelf: 'center' },
  purpleGlow: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(139,92,255,0.10)', bottom: 90, left: -120 },
  content: { flexGrow: 1, paddingHorizontal: 22, paddingTop: 34, paddingBottom: 34 },
  logoArea: { alignItems: 'center', marginBottom: 26 },
  symbolHalo: { width: 112, height: 112, borderRadius: 56, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(45,100,255,0.08)', borderWidth: 1, borderColor: 'rgba(143,179,255,0.16)', shadowColor: COLORS.blue, shadowOpacity: 0.34, shadowRadius: 28, shadowOffset: { width: 0, height: 0 } },
  heroSymbol: { width: 86, height: 86, borderRadius: 43 },
  introText: { marginTop: 18, maxWidth: 348, color: COLORS.mutedStrong, fontSize: 17, lineHeight: 28, textAlign: 'center', fontWeight: '600' },
  trustRow: { marginTop: 18, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  trustPill: { minHeight: 32, borderRadius: 16, paddingHorizontal: 12, marginHorizontal: 5, marginBottom: 8, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.045)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)' },
  trustDot: { color: COLORS.gold, fontSize: 20, lineHeight: 20, marginRight: 6 },
  trustDotCyan: { color: COLORS.cyan, fontSize: 20, lineHeight: 20, marginRight: 6 },
  trustText: { color: COLORS.mutedStrong, fontSize: 12, fontWeight: '800' },
  card: { padding: 24, borderRadius: 34, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden', shadowColor: COLORS.blue, shadowOpacity: 0.16, shadowRadius: 26, shadowOffset: { width: 0, height: 0 } },
  cardGlowOne: { position: 'absolute', width: 190, height: 190, borderRadius: 95, backgroundColor: 'rgba(45,100,255,0.11)', right: -90, top: -80 },
  cardGlowTwo: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(139,92,255,0.10)', left: -92, bottom: -84 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  cardSymbol: { width: 62, height: 62, borderRadius: 31, overflow: 'hidden', backgroundColor: '#05060A', borderWidth: 1, borderColor: COLORS.borderBlue, marginRight: 14 },
  cardSymbolImage: { width: '100%', height: '100%' },
  cardHeaderText: { flex: 1 },
  kicker: { color: COLORS.blueLight, fontSize: 12, fontWeight: '900', letterSpacing: 4, textTransform: 'uppercase', marginBottom: 6 },
  title: { color: COLORS.text, fontSize: 31, lineHeight: 36, fontWeight: '900', letterSpacing: -0.8 },
  formBlock: { marginTop: 2 },
  label: { marginTop: 16, marginBottom: 8, color: COLORS.text, fontSize: 15, fontWeight: '900' },
  inputBox: { minHeight: 60, borderRadius: 25, backgroundColor: COLORS.input, borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 17 },
  inputIcon: { width: 28, color: COLORS.blueLight, fontSize: 22, marginRight: 8, textAlign: 'center' },
  input: { flex: 1, color: COLORS.text, fontSize: 18, fontWeight: '700', paddingVertical: 0 },
  passwordCheckButton: { width: 30, height: 30, borderRadius: 9, marginLeft: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(3,4,10,0.55)', borderWidth: 2, borderColor: COLORS.blueLight },
  passwordCheckButtonActive: { backgroundColor: COLORS.blue, borderColor: COLORS.blue, shadowColor: COLORS.blue, shadowOpacity: 0.5, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } },
  passwordCheckMark: { color: COLORS.text, fontSize: 18, lineHeight: 20, fontWeight: '900' },
  passwordHint: { marginTop: 8, color: COLORS.soft, fontSize: 12, fontWeight: '700', textAlign: 'right' },
  forgotButton: { alignSelf: 'flex-end', marginTop: 16, marginBottom: 20 },
  forgotText: { color: COLORS.blueLight, fontSize: 15, fontWeight: '900' },
  primaryButton: { minHeight: 64, borderRadius: 26, backgroundColor: COLORS.blue, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.blue, shadowOpacity: 0.44, shadowRadius: 24, shadowOffset: { width: 0, height: 0 } },
  primaryButtonText: { color: COLORS.text, fontSize: 21, fontWeight: '900' },
  buttonDisabled: { opacity: 0.6 },
  secondaryButton: { marginTop: 14, minHeight: 58, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.055)', borderWidth: 1, borderColor: COLORS.borderStrong, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { color: COLORS.text, fontSize: 18, fontWeight: '900' },
  footer: { marginTop: 24, color: COLORS.soft, textAlign: 'center', fontSize: 14, fontWeight: '800' },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  pressedSmall: { opacity: 0.7, transform: [{ scale: 0.94 }] },
});