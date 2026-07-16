import React, { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../src/lib/supabase';
import { Button } from '../src/components/Button';
import { useTheme } from '../src/theme/ThemeContext';

const SYMBOL = require('../assets/brand/elus_symbol_main.png');
const WATERMARK = require('../assets/watermark/elus_symbol_watermark_10.png');

const COLORS = {
  card: 'rgba(20,26,38,0.94)',
  input: 'rgba(11,16,26,0.88)',
  borderBlue: 'rgba(91,141,239,0.32)',
  muted: 'rgba(161,169,184,0.78)',
  mutedStrong: 'rgba(237,237,237,0.86)',
  soft: 'rgba(161,169,184,0.55)',
  blueLight: '#8FA3B8',
};

type Stage = 'email' | 'code';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [stage, setStage] = useState<Stage>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSendCode() {
    if (!email.trim()) {
      Alert.alert('Informe seu e-mail', 'Digite o e-mail para receber o código.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    setLoading(false);

    if (error) {
      Alert.alert('Erro', error.message);
      return;
    }

    setStage('code');
  }

  async function handleResetPassword() {
    if (!code.trim()) {
      Alert.alert('Informe o código', 'Digite o código de 6 dígitos enviado por e-mail.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Senha muito curta', 'A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Senhas não coincidem', 'A nova senha e a confirmação precisam ser iguais.');
      return;
    }

    setLoading(true);

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: 'recovery',
    });

    if (verifyError) {
      setLoading(false);
      Alert.alert('Código inválido ou expirado', 'Verifique o código recebido por e-mail e tente novamente.');
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });

    setLoading(false);

    if (updateError) {
      Alert.alert('Código inválido ou expirado', 'Não foi possível redefinir a senha. Tente novamente.');
      return;
    }

    await supabase.auth.signOut();

    Alert.alert('Senha redefinida', 'Faça login com sua nova senha.');
    router.replace('/login' as never);
  }

  function backToEmailStage() {
    setStage('email');
    setCode('');
  }

  function togglePasswordVisibility() {
    setShowPassword((current) => !current);
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
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
            <View style={[styles.symbolHalo, { shadowColor: colors.accent }]}>
              <Image source={SYMBOL} style={styles.heroSymbol} resizeMode="cover" />
            </View>

            <Text style={styles.introText}>
              {stage === 'email'
                ? 'Informe seu e-mail para receber um código de verificação.'
                : 'Digite o código recebido e escolha sua nova senha.'}
            </Text>
          </View>

          <View style={[styles.card, { borderColor: colors.borderStrong, shadowColor: colors.accent }]}>
            <View style={styles.cardGlowOne} />
            <View style={styles.cardGlowTwo} />

            <View style={styles.cardHeader}>
              <View style={styles.cardSymbol}>
                <Image source={SYMBOL} style={styles.cardSymbolImage} resizeMode="cover" />
              </View>

              <View style={styles.cardHeaderText}>
                <Text style={styles.kicker}>Recuperar senha</Text>
                <Text style={[styles.title, { color: colors.text }]}>
                  {stage === 'email' ? 'Esqueci minha senha' : 'Redefinir senha'}
                </Text>
              </View>
            </View>

            {stage === 'email' ? (
              <View style={styles.formBlock}>
                <Text style={[styles.label, { color: colors.text }]}>E-mail</Text>
                <View style={[styles.inputBox, { borderColor: colors.borderStrong }]}>
                  <Text style={styles.inputIcon}>✉</Text>
                  <TextInput
                    value={email}
                    onChangeText={setEmail}
                    placeholder="seuemail@exemplo.com"
                    placeholderTextColor="rgba(143,163,197,0.70)"
                    style={[styles.input, { color: colors.text }]}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                  />
                </View>

                <Button
                  label="Enviar código"
                  variant="primary"
                  loading={loading}
                  disabled={loading}
                  onPress={handleSendCode}
                />
              </View>
            ) : (
              <View style={styles.formBlock}>
                <Text style={[styles.stageText, { color: colors.textMuted }]}>
                  Enviamos um código de 6 dígitos para {email.trim()}. Digite-o abaixo
                  junto com sua nova senha.
                </Text>

                <Text style={[styles.label, { color: colors.text }]}>Código de verificação</Text>
                <View style={[styles.inputBox, { borderColor: colors.borderStrong }]}>
                  <Text style={styles.inputIcon}>#</Text>
                  <TextInput
                    value={code}
                    onChangeText={setCode}
                    placeholder="000000"
                    placeholderTextColor="rgba(143,163,197,0.70)"
                    style={[styles.input, { color: colors.text }]}
                    keyboardType="number-pad"
                    maxLength={6}
                    editable={!loading}
                  />
                </View>

                <Text style={[styles.label, { color: colors.text }]}>Nova senha</Text>
                <View style={[styles.inputBox, { borderColor: colors.borderStrong }]}>
                  <Text style={styles.inputIcon}>⌁</Text>
                  <TextInput
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Digite a nova senha"
                    placeholderTextColor="rgba(143,163,197,0.70)"
                    style={[styles.input, { color: colors.text }]}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                  />

                  <Pressable
                    style={({ pressed }) => [
                      styles.passwordCheckButton,
                      showPassword && styles.passwordCheckButtonActive,
                      showPassword && { backgroundColor: colors.accent, borderColor: colors.accent, shadowColor: colors.accent },
                      pressed && styles.pressedSmall,
                    ]}
                    onPress={togglePasswordVisibility}
                    hitSlop={10}
                  >
                    {showPassword ? (
                      <Text style={[styles.passwordCheckMark, { color: colors.text }]}>✓</Text>
                    ) : null}
                  </Pressable>
                </View>

                <Text style={[styles.label, { color: colors.text }]}>Confirmar nova senha</Text>
                <View style={[styles.inputBox, { borderColor: colors.borderStrong }]}>
                  <Text style={styles.inputIcon}>⌁</Text>
                  <TextInput
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Digite a nova senha novamente"
                    placeholderTextColor="rgba(143,163,197,0.70)"
                    style={[styles.input, { color: colors.text }]}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                  />
                </View>

                <Button
                  label="Redefinir senha"
                  variant="primary"
                  loading={loading}
                  disabled={loading}
                  onPress={handleResetPassword}
                />

                <Pressable style={styles.forgotButton} onPress={backToEmailStage} disabled={loading}>
                  <Text style={styles.forgotText}>Não recebeu o código? Tentar novamente</Text>
                </Pressable>
              </View>
            )}
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
  screen: { flex: 1 },
  keyboard: { flex: 1 },
  scroll: { flex: 1 },
  watermarkOne: { position: 'absolute', width: 360, height: 360, top: -142, left: -162, opacity: 0.07 },
  watermarkTwo: { position: 'absolute', width: 440, height: 440, right: -198, bottom: 64, opacity: 0.06 },
  blueGlow: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(91,141,239,0.16)', top: 126, alignSelf: 'center' },
  purpleGlow: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(139,92,255,0.10)', bottom: 90, left: -120 },
  content: { flexGrow: 1, paddingHorizontal: 22, paddingTop: 34, paddingBottom: 34 },
  logoArea: { alignItems: 'center', marginBottom: 26 },
  symbolHalo: { width: 112, height: 112, borderRadius: 56, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(91,141,239,0.08)', borderWidth: 1, borderColor: 'rgba(143,179,255,0.16)', shadowOpacity: 0.34, shadowRadius: 28, shadowOffset: { width: 0, height: 0 } },
  heroSymbol: { width: 86, height: 86, borderRadius: 43 },
  introText: { marginTop: 18, maxWidth: 348, color: COLORS.mutedStrong, fontSize: 17, lineHeight: 28, textAlign: 'center', fontWeight: '600' },
  card: { padding: 24, borderRadius: 34, backgroundColor: COLORS.card, borderWidth: 1, overflow: 'hidden', shadowOpacity: 0.16, shadowRadius: 26, shadowOffset: { width: 0, height: 0 } },
  cardGlowOne: { position: 'absolute', width: 190, height: 190, borderRadius: 95, backgroundColor: 'rgba(91,141,239,0.11)', right: -90, top: -80 },
  cardGlowTwo: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(139,92,255,0.10)', left: -92, bottom: -84 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  cardSymbol: { width: 62, height: 62, borderRadius: 31, overflow: 'hidden', backgroundColor: '#05060A', borderWidth: 1, borderColor: COLORS.borderBlue, marginRight: 14 },
  cardSymbolImage: { width: '100%', height: '100%' },
  cardHeaderText: { flex: 1 },
  kicker: { color: COLORS.blueLight, fontSize: 12, fontWeight: '900', letterSpacing: 4, textTransform: 'uppercase', marginBottom: 6 },
  title: { fontSize: 31, lineHeight: 36, fontWeight: '900', letterSpacing: -0.8 },
  formBlock: { marginTop: 2 },
  stageText: { fontSize: 14, lineHeight: 21, marginBottom: 18, fontWeight: '600' },
  label: { marginTop: 16, marginBottom: 8, fontSize: 15, fontWeight: '900' },
  inputBox: { minHeight: 60, borderRadius: 25, backgroundColor: COLORS.input, borderWidth: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 17 },
  inputIcon: { width: 28, color: COLORS.blueLight, fontSize: 22, marginRight: 8, textAlign: 'center' },
  input: { flex: 1, fontSize: 18, fontWeight: '700', paddingVertical: 0 },
  passwordCheckButton: { width: 30, height: 30, borderRadius: 9, marginLeft: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(3,4,10,0.55)', borderWidth: 2, borderColor: COLORS.blueLight },
  passwordCheckButtonActive: { shadowOpacity: 0.5, shadowRadius: 8, shadowOffset: { width: 0, height: 0 } },
  passwordCheckMark: { fontSize: 18, lineHeight: 20, fontWeight: '900' },
  pressedSmall: { opacity: 0.7, transform: [{ scale: 0.94 }] },
  forgotButton: { alignSelf: 'center', marginTop: 18 },
  forgotText: { color: COLORS.blueLight, fontSize: 14, fontWeight: '800' },
  footer: { marginTop: 24, color: COLORS.soft, textAlign: 'center', fontSize: 14, fontWeight: '800' },
});
