import React, { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../src/lib/supabase';
import { useApp } from '../src/context/AppContext';

const LOGO_FULL = require('../assets/brand/elus_logo_login_full.png');
const SYMBOL = require('../assets/brand/elus_symbol_main.png');
const WATERMARK = require('../assets/watermark/elus_symbol_watermark_10.png');
const GOLD_SYMBOL = require('../assets/images/elus-symbol-orange.png');

type DocumentType = 'CIN/RG' | 'CNH' | 'Passaporte' | 'CRNM/RNE';
type VerificationStatus = 'unverified' | 'pending' | 'in_review' | 'verified';

const DOCUMENT_TYPES: DocumentType[] = ['CIN/RG', 'CNH', 'Passaporte', 'CRNM/RNE'];

const COLORS = {
  background: '#03040A',
  card: 'rgba(12,15,27,0.94)',
  input: 'rgba(3,4,10,0.86)',
  infoCard: 'rgba(45,100,255,0.10)',
  warningCard: 'rgba(255,107,107,0.10)',
  reviewCard: 'rgba(143,179,255,0.10)',
  verifiedCard: 'rgba(54,211,153,0.10)',
  goldCard: 'rgba(217,180,106,0.10)',
  border: 'rgba(255,255,255,0.12)',
  borderBlue: 'rgba(45,125,255,0.34)',
  borderReview: 'rgba(143,179,255,0.34)',
  borderGold: 'rgba(217,180,106,0.30)',
  borderDanger: 'rgba(255,107,107,0.30)',
  borderGreen: 'rgba(54,211,153,0.34)',
  text: '#FFFFFF',
  muted: 'rgba(255,255,255,0.68)',
  soft: 'rgba(255,255,255,0.44)',
  blue: '#2D64FF',
  blueLight: '#8FB3FF',
  gold: '#D9B46A',
  green: '#36D399',
  danger: '#FF6B6B',
};

function isAwaitingVerification(status?: string) {
  return status === 'in_review' || status === 'pending';
}

function getVerificationTitle(status: VerificationStatus) {
  if (status === 'verified') return 'Verificação concluída';
  if (isAwaitingVerification(status)) return 'Aguardando verificação';
  return 'Verificação pendente';
}

function getVerificationDescription(status: VerificationStatus) {
  if (status === 'verified') {
    return 'Sua identidade foi confirmada. O ELUS não pedirá documento em todo login.';
  }
  if (isAwaitingVerification(status)) {
    return 'Sua selfie com documento foi enviada para análise. Até a aprovação final, seu perfil continua não verificado e com uso limitado.';
  }
  return 'Enquanto não for validado, o perfil terá uso limitado: não poderá solicitar contatos, ver informações completas de outros perfis ou aparecer publicamente com foto real.';
}

function getVerificationColor(status: VerificationStatus) {
  if (status === 'verified') return COLORS.green;
  if (isAwaitingVerification(status)) return COLORS.blueLight;
  return COLORS.danger;
}

export default function VerificationScreen() {
  const router = useRouter();
  const { submitIdentityVerification } = useApp();

  const [selectedDocument, setSelectedDocument] = useState<DocumentType>('CIN/RG');
  const [selfiePhotoUri, setSelfiePhotoUri] = useState<string | null>(null);
  const [selfieSent, setSelfieSent] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('unverified');

  const isVerified = verificationStatus === 'verified';
  const isAwaiting = isAwaitingVerification(verificationStatus);
  const isLocked = isVerified || isAwaiting;
  const verificationColor = getVerificationColor(verificationStatus);
  const canContinue = isVerified || isAwaiting || (selfieSent && confirmed);
  const confirmationChecked = isAwaiting || confirmed;

  const selfieButtonText = isAwaiting
    ? 'Selfie enviada para análise ✓'
    : !selfiePhotoUri
      ? 'Abrir câmera e tirar selfie'
      : 'Confirmar envio para análise';

  const selfieText = isAwaiting
    ? 'Selfie enviada para análise. Até a aprovação final, este perfil continua não verificado e com uso limitado.'
    : !selfiePhotoUri
      ? 'Tire uma foto do seu rosto segurando o documento escolhido.'
      : 'Confira a foto capturada. Se estiver boa, confirme o envio para análise.';

  const continueButtonText = isVerified
    ? 'Ir para o Campo →'
    : isAwaiting
      ? 'Ir para o Campo com uso limitado →'
      : 'Continuar para o Campo →';

  const confirmationText = isAwaiting
    ? 'Entendo que minha selfie foi enviada para análise e que meu perfil continuará com uso limitado até a aprovação final.'
    : 'Confirmo que vou enviar uma selfie real com documento oficial e entendo que perfis não verificados têm uso limitado no ELUS.';

  function goBack() {
    router.back();
  }

  function selectDocument(document: DocumentType) {
    if (isLocked) return;
    setSelectedDocument(document);
    setSelfiePhotoUri(null);
    setSelfieSent(false);
    setConfirmed(false);
  }

  async function takeSelfie() {
    if (isLocked) return;

    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        Alert.alert('Permissão de câmera necessária', 'Para validar o perfil, permita o acesso à câmera do celular.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.75,
        cameraType: ImagePicker.CameraType.front,
      });

      if (result.canceled) return;

      const capturedUri = result.assets?.[0]?.uri;

      if (!capturedUri) {
        Alert.alert('Foto não capturada', 'Não foi possível capturar a selfie. Tente novamente.');
        return;
      }

      setSelfiePhotoUri(capturedUri);
      setSelfieSent(false);
      setConfirmed(false);
    } catch {
      Alert.alert('Não foi possível abrir a câmera', 'Verifique as permissões do celular e tente novamente.');
    }
  }

  function retakeSelfie() {
    if (isLocked) return;
    setSelfiePhotoUri(null);
    setSelfieSent(false);
    setConfirmed(false);
  }

  async function confirmSelfieSend() {
    if (!selfiePhotoUri) {
      Alert.alert('Selfie necessária', 'Tire uma selfie segurando o documento antes de enviar.');
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert('Sessão expirada', 'Faça login novamente para continuar.');
        router.replace('/login' as never);
        return;
      }

      const timestamp = Date.now();
      const storagePath = `verification/${user.id}/selfie_${timestamp}.jpg`;

      const response = await fetch(selfiePhotoUri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('verification-files')
        .upload(storagePath, blob, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) {
        console.error('Supabase storage error:', JSON.stringify(uploadError, null, 2));
        Alert.alert(
          'Erro no upload',
          uploadError?.message || (uploadError as any)?.error_description || 'Erro desconhecido. Verifique sua conexão.',
          [{ text: 'OK' }]
        );
        return;
      }

      const now = new Date().toISOString();

      const { error: dbError } = await supabase
        .from('verifications')
        .upsert({
          user_id: user.id,
          document_type: selectedDocument,
          selfie_storage_path: storagePath,
          is_current: true,
          status: 'pending',
          created_at: now,
          submitted_at: now,
        }, { onConflict: 'user_id' });

      if (dbError) {
        console.error('DB Error:', JSON.stringify(dbError, null, 2));
        Alert.alert('Erro', dbError.message || JSON.stringify(dbError));
        return;
      }

      submitIdentityVerification({
        documentType: selectedDocument,
        selfieUri: selfiePhotoUri,
      });

      setSelfieSent(true);
      setConfirmed(true);
      setVerificationStatus('in_review');

      Alert.alert(
        'Verificação enviada',
        'Nossa equipe irá analisar em até 48 horas.'
      );
    } catch {
      Alert.alert('Erro inesperado', 'Tente novamente em instantes.');
    } finally {
      setLoading(false);
    }
  }

  function toggleConfirmed() {
    if (isAwaiting || isVerified) return;
    setConfirmed((current) => !current);
  }

  async function continueToApp() {
    if (!canContinue) return;

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/login' as never);
        return;
      }

      await supabase
        .from('users')
        .update({ profile_completed: true })
        .eq('id', user.id);

      router.replace('/(tabs)' as never);
    } catch {
      router.replace('/(tabs)' as never);
    } finally {
      setLoading(false);
    }
  }

  async function continueLimited() {
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/login' as never);
        return;
      }

      await supabase
        .from('users')
        .update({ profile_completed: true })
        .eq('id', user.id);

      router.replace('/(tabs)' as never);
    } catch {
      router.replace('/(tabs)' as never);
    } finally {
      setLoading(false);
    }
  }

  function handleSelfieButtonPress() {
    if (isLocked) return;
    if (!selfiePhotoUri) {
      takeSelfie();
      return;
    }
    if (!selfieSent) {
      confirmSelfieSend();
    }
  }

  const statusTitle = getVerificationTitle(verificationStatus);
  const statusText = getVerificationDescription(verificationStatus);

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" />

      <KeyboardAvoidingView
        style={styles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Image source={WATERMARK} style={styles.watermarkOne} resizeMode="contain" />
        <Image source={WATERMARK} style={styles.watermarkTwo} resizeMode="contain" />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Pressable style={styles.backButton} onPress={goBack} disabled={loading}>
            <Text style={styles.backIcon}>‹</Text>
          </Pressable>

          <View style={styles.logoArea}>
            <Image source={LOGO_FULL} style={styles.logoFull} resizeMode="contain" />
            <Text style={styles.introText}>
              Confirme sua identidade uma única vez. Depois de validado, seu acesso
              ao ELUS será simples e rápido.
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardSymbol, { borderColor: `${verificationColor}55` }]}>
                <Image source={SYMBOL} style={styles.cardSymbolImage} resizeMode="cover" />
              </View>
              <View style={styles.cardHeaderText}>
                <Text style={styles.kicker}>Segurança ELUS</Text>
                <Text style={styles.title}>Selfie com documento oficial</Text>
              </View>
            </View>

            <View style={styles.goldBox}>
              <Text style={styles.goldTitle}>Verificação indispensável</Text>
              <Text style={styles.goldText}>
                O ELUS valida perfis por selfie segurando um documento oficial
                com foto. Não pediremos esse documento em todo login após a validação.
              </Text>
            </View>

            <Text style={styles.sectionTitle}>Escolha o documento</Text>

            <View style={styles.documentGrid}>
              {DOCUMENT_TYPES.map((document) => {
                const selected = selectedDocument === document;
                return (
                  <Pressable
                    key={document}
                    disabled={isLocked || loading}
                    style={({ pressed }) => [
                      styles.documentButton,
                      selected && styles.documentButtonActive,
                      (isLocked || loading) && styles.documentButtonDisabled,
                      pressed && !isLocked && styles.pressedSmall,
                    ]}
                    onPress={() => selectDocument(document)}
                  >
                    <Text style={[styles.documentButtonText, selected && styles.documentButtonTextActive]}>
                      {document}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={[
              styles.selfieBox,
              selfiePhotoUri && !selfieSent && !isLocked && styles.selfieBoxReview,
              isAwaiting && styles.selfieBoxAwaiting,
              isVerified && styles.selfieBoxVerified,
            ]}>
              <View style={styles.selfieTopRow}>
                <View style={[styles.selfieIconBox, { borderColor: `${verificationColor}55`, backgroundColor: `${verificationColor}10` }]}>
                  {selfiePhotoUri ? (
                    <Image source={{ uri: selfiePhotoUri }} style={styles.selfiePreviewImage} resizeMode="cover" />
                  ) : (
                    <Image source={GOLD_SYMBOL} style={styles.selfieSymbolImage} resizeMode="contain" />
                  )}
                </View>
                <View style={styles.selfieTextBox}>
                  <Text style={styles.selfieTitle}>Selfie segurando {selectedDocument}</Text>
                  <Text style={styles.selfieText}>{selfieText}</Text>
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.primaryButton,
                  isAwaiting && styles.primaryButtonAwaiting,
                  isVerified && styles.primaryButtonVerified,
                  (isLocked || loading) && styles.buttonDisabled,
                  pressed && !isLocked && !loading && styles.pressed,
                ]}
                onPress={handleSelfieButtonPress}
                disabled={isLocked || loading}
              >
                {loading && !selfieSent ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>{selfieButtonText}</Text>
                )}
              </Pressable>

              {selfiePhotoUri && !selfieSent && !isLocked ? (
                <Pressable
                  style={({ pressed }) => [styles.retakeButton, pressed && styles.pressed]}
                  onPress={retakeSelfie}
                  disabled={loading}
                >
                  <Text style={styles.retakeButtonText}>Refazer foto</Text>
                </Pressable>
              ) : null}
            </View>

            <View style={styles.infoBox}>
              <View style={styles.infoIconBox}>
                <Text style={styles.infoIcon}>✓</Text>
              </View>
              <Text style={styles.infoText}>
                Seu documento não será exibido publicamente. Após a validação, o app
                não pedirá documento em todo login.
              </Text>
            </View>

            <View style={[
              styles.warningBox,
              isAwaiting && styles.reviewBox,
              isVerified && styles.verifiedBox,
            ]}>
              <Text style={[styles.warningTitle, isAwaiting && styles.reviewTitle, isVerified && styles.verifiedTitle]}>
                {statusTitle}
              </Text>
              <Text style={styles.warningText}>{statusText}</Text>
              {!isVerified ? (
                <Text style={styles.warningText}>
                  Após 7 dias sem verificação, o perfil poderá ser ocultado, suspenso
                  ou excluído conforme a política do ELUS.
                </Text>
              ) : null}
            </View>

            {!isVerified ? (
              <Pressable style={styles.confirmRow} onPress={toggleConfirmed} disabled={isAwaiting}>
                <View style={[styles.checkbox, confirmationChecked && styles.checkboxActive]}>
                  {confirmationChecked ? <Text style={styles.checkboxMark}>✓</Text> : null}
                </View>
                <Text style={styles.confirmText}>{confirmationText}</Text>
              </Pressable>
            ) : null}

            <Pressable
              style={({ pressed }) => [
                styles.continueButton,
                (!canContinue || loading) && styles.continueButtonDisabled,
                pressed && canContinue && !loading && styles.pressed,
              ]}
              onPress={continueToApp}
              disabled={!canContinue || loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={[styles.continueButtonText, !canContinue && styles.continueButtonTextDisabled]}>
                  {continueButtonText}
                </Text>
              )}
            </Pressable>

            {!isAwaiting && !isVerified ? (
              <Pressable
                style={({ pressed }) => [styles.limitedButton, pressed && styles.pressed]}
                onPress={continueLimited}
                disabled={loading}
              >
                <Text style={styles.limitedButtonText}>Fazer depois com uso limitado</Text>
              </Pressable>
            ) : null}
          </View>

          <Text style={styles.footer}>
            ELUS · Pessoas reais · Conexões reais · Segurança real.
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
  watermarkOne: { position: 'absolute', width: 320, height: 320, top: -130, left: -150, opacity: 0.08 },
  watermarkTwo: { position: 'absolute', width: 410, height: 410, right: -190, bottom: 80, opacity: 0.07 },
  content: { flexGrow: 1, paddingHorizontal: 22, paddingTop: 24, paddingBottom: 34 },
  backButton: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(16,19,29,0.92)', borderWidth: 1, borderColor: COLORS.border, marginBottom: 10 },
  backIcon: { color: COLORS.text, fontSize: 40, lineHeight: 40, marginTop: -4 },
  logoArea: { alignItems: 'center', marginBottom: 20 },
  logoFull: { width: 235, height: 104 },
  introText: { marginTop: 6, maxWidth: 340, color: COLORS.muted, fontSize: 16, lineHeight: 27, textAlign: 'center' },
  card: { padding: 24, borderRadius: 34, backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, overflow: 'hidden' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  cardSymbol: { width: 54, height: 54, borderRadius: 27, overflow: 'hidden', backgroundColor: '#05060A', borderWidth: 1, marginRight: 14 },
  cardSymbolImage: { width: '100%', height: '100%' },
  cardHeaderText: { flex: 1 },
  kicker: { color: COLORS.gold, fontSize: 12, fontWeight: '900', letterSpacing: 3.4, textTransform: 'uppercase', marginBottom: 6 },
  title: { color: COLORS.text, fontSize: 31, lineHeight: 36, fontWeight: '900', letterSpacing: -0.8 },
  goldBox: { padding: 17, borderRadius: 24, backgroundColor: COLORS.goldCard, borderWidth: 1, borderColor: COLORS.borderGold, marginBottom: 22 },
  goldTitle: { color: COLORS.gold, fontSize: 17, fontWeight: '900', marginBottom: 8 },
  goldText: { color: COLORS.muted, fontSize: 14, lineHeight: 23, fontWeight: '700' },
  sectionTitle: { color: COLORS.text, fontSize: 18, fontWeight: '900', marginBottom: 12 },
  documentGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  documentButton: { width: '48%', minHeight: 56, borderRadius: 22, backgroundColor: COLORS.input, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  documentButtonActive: { backgroundColor: 'rgba(45,100,255,0.18)', borderColor: COLORS.borderBlue },
  documentButtonDisabled: { opacity: 0.82 },
  documentButtonText: { color: COLORS.muted, fontSize: 17, fontWeight: '900' },
  documentButtonTextActive: { color: COLORS.blueLight },
  selfieBox: { marginTop: 8, padding: 17, borderRadius: 26, backgroundColor: COLORS.input, borderWidth: 1, borderColor: COLORS.border },
  selfieBoxReview: { borderColor: COLORS.borderBlue, backgroundColor: 'rgba(45,100,255,0.08)' },
  selfieBoxAwaiting: { borderColor: COLORS.borderReview, backgroundColor: COLORS.reviewCard },
  selfieBoxVerified: { borderColor: COLORS.borderGreen, backgroundColor: COLORS.verifiedCard },
  selfieTopRow: { flexDirection: 'row', alignItems: 'flex-start' },
  selfieIconBox: { width: 52, height: 52, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginRight: 15, overflow: 'hidden' },
  selfieSymbolImage: { width: 34, height: 34 },
  selfiePreviewImage: { width: '100%', height: '100%' },
  selfieTextBox: { flex: 1 },
  selfieTitle: { color: COLORS.text, fontSize: 18, lineHeight: 23, fontWeight: '900', marginBottom: 6 },
  selfieText: { color: COLORS.muted, fontSize: 14, lineHeight: 22, fontWeight: '700' },
  primaryButton: { marginTop: 20, minHeight: 58, borderRadius: 24, backgroundColor: COLORS.blue, alignItems: 'center', justifyContent: 'center', shadowColor: COLORS.blue, shadowOpacity: 0.42, shadowRadius: 22, shadowOffset: { width: 0, height: 0 } },
  primaryButtonAwaiting: { backgroundColor: '#426DCC', shadowColor: COLORS.blueLight },
  primaryButtonVerified: { backgroundColor: '#1E8F68', shadowColor: COLORS.green },
  primaryButtonText: { color: COLORS.text, fontSize: 18, lineHeight: 23, fontWeight: '900', textAlign: 'center', paddingHorizontal: 12 },
  retakeButton: { marginTop: 12, minHeight: 54, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.045)', borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  retakeButtonText: { color: COLORS.text, fontSize: 16, fontWeight: '900' },
  infoBox: { marginTop: 18, padding: 17, borderRadius: 24, backgroundColor: COLORS.infoCard, borderWidth: 1, borderColor: COLORS.borderBlue, flexDirection: 'row', alignItems: 'center' },
  infoIconBox: { width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(45,100,255,0.18)', alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  infoIcon: { color: COLORS.blueLight, fontSize: 24, fontWeight: '900' },
  infoText: { flex: 1, color: COLORS.muted, fontSize: 14, lineHeight: 22, fontWeight: '700' },
  warningBox: { marginTop: 18, padding: 18, borderRadius: 26, backgroundColor: COLORS.warningCard, borderWidth: 1, borderColor: COLORS.borderDanger },
  reviewBox: { backgroundColor: COLORS.reviewCard, borderColor: COLORS.borderReview },
  verifiedBox: { backgroundColor: COLORS.verifiedCard, borderColor: COLORS.borderGreen },
  warningTitle: { color: COLORS.danger, fontSize: 18, fontWeight: '900', marginBottom: 10 },
  reviewTitle: { color: COLORS.blueLight },
  verifiedTitle: { color: COLORS.green },
  warningText: { color: COLORS.muted, fontSize: 14, lineHeight: 23, fontWeight: '700', marginBottom: 8 },
  confirmRow: { marginTop: 20, flexDirection: 'row', alignItems: 'flex-start' },
  checkbox: { width: 30, height: 30, borderRadius: 8, borderWidth: 2, borderColor: COLORS.blueLight, backgroundColor: 'rgba(3,4,10,0.55)', alignItems: 'center', justifyContent: 'center', marginRight: 14, marginTop: 2 },
  checkboxActive: { backgroundColor: COLORS.blue, borderColor: COLORS.blue },
  checkboxMark: { color: COLORS.text, fontSize: 19, fontWeight: '900' },
  confirmText: { flex: 1, color: COLORS.muted, fontSize: 14, lineHeight: 22, fontWeight: '700' },
  continueButton: { marginTop: 22, minHeight: 62, borderRadius: 26, backgroundColor: COLORS.blue, alignItems: 'center', justifyContent: 'center' },
  continueButtonDisabled: { backgroundColor: 'rgba(255,255,255,0.13)' },
  continueButtonText: { color: COLORS.text, fontSize: 19, fontWeight: '900', textAlign: 'center' },
  continueButtonTextDisabled: { color: 'rgba(255,255,255,0.42)' },
  limitedButton: { marginTop: 14, minHeight: 56, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.045)', borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  limitedButtonText: { color: COLORS.muted, fontSize: 16, fontWeight: '900' },
  buttonDisabled: { opacity: 0.6 },
  footer: { marginTop: 22, color: COLORS.soft, textAlign: 'center', fontSize: 13, lineHeight: 20, fontWeight: '800' },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  pressedSmall: { opacity: 0.7, transform: [{ scale: 0.96 }] },
});