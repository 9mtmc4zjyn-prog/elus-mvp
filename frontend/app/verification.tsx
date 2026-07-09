import React, { useEffect, useState } from 'react';
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
import { Chip } from '../src/components/Chip';
import { Button } from '../src/components/Button';

const LOGO_FULL = require('../assets/brand/elus_logo_login_full.png');
const SYMBOL = require('../assets/brand/elus_symbol_main.png');
const WATERMARK = require('../assets/watermark/elus_symbol_watermark_10.png');
const GOLD_SYMBOL = require('../assets/images/elus-symbol-orange.png');

type DocumentType = 'CIN/RG' | 'CNH' | 'Passaporte' | 'CRNM/RNE';
type VerificationStatus = 'unverified' | 'pending' | 'in_review' | 'verified';
type VerificationStep = 'document' | 'selfie' | 'selfie_with_document';

const DOCUMENT_TYPES: DocumentType[] = ['CIN/RG', 'CNH', 'Passaporte', 'CRNM/RNE'];

const STEP_ORDER: VerificationStep[] = ['document', 'selfie', 'selfie_with_document'];

const COLORS = {
  background: '#0B101A',
  card: 'rgba(20,26,38,0.94)',
  input: 'rgba(11,16,26,0.86)',
  infoCard: 'rgba(94,158,171,0.12)',
  warningCard: 'rgba(184,92,92,0.10)',
  reviewCard: 'rgba(143,163,184,0.12)',
  verifiedCard: 'rgba(74,154,101,0.12)',
  goldCard: 'rgba(196,154,69,0.12)',
  border: 'rgba(255,255,255,0.12)',
  borderBlue: 'rgba(94,158,171,0.34)',
  borderReview: 'rgba(143,163,184,0.34)',
  borderGold: 'rgba(196,154,69,0.30)',
  borderDanger: 'rgba(184,92,92,0.30)',
  borderGreen: 'rgba(74,154,101,0.34)',
  text: '#EDEDED',
  muted: 'rgba(161,169,184,0.78)',
  soft: 'rgba(161,169,184,0.55)',
  blue: '#5E9EAB',
  blueLight: '#8FA3B8',
  gold: '#C49A45',
  green: '#4A9A65',
  danger: '#B85C5C',
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

  const [currentStep, setCurrentStep] = useState<VerificationStep>('document');
  const [checkingStatus, setCheckingStatus] = useState(true);

  const [selectedDocument, setSelectedDocument] = useState<DocumentType>('CIN/RG');
  const [documentPhotoUri, setDocumentPhotoUri] = useState<string | null>(null);
  const [selfiePhotoUri, setSelfiePhotoUri] = useState<string | null>(null);
  const [selfieWithDocumentPhotoUri, setSelfieWithDocumentPhotoUri] = useState<string | null>(null);

  const [documentSent, setDocumentSent] = useState(false);
  const [selfieSent, setSelfieSent] = useState(false);
  const [selfieWithDocumentSent, setSelfieWithDocumentSent] = useState(false);

  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('unverified');

  useEffect(() => {
    let active = true;

    async function loadExistingVerification() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from('verifications')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_current', true)
          .maybeSingle();

        if (!active || !data) return;

        if (data.document_type) setSelectedDocument(data.document_type as DocumentType);
        if (data.status) setVerificationStatus(data.status as VerificationStatus);

        const hasDocument = Boolean(data.document_storage_path);
        const hasSelfie = Boolean(data.selfie_storage_path);
        const hasSelfieWithDocument = Boolean(data.selfie_with_document_storage_path);

        setDocumentSent(hasDocument);
        setSelfieSent(hasSelfie);
        setSelfieWithDocumentSent(hasSelfieWithDocument);

        if (!hasDocument) setCurrentStep('document');
        else if (!hasSelfie) setCurrentStep('selfie');
        else setCurrentStep('selfie_with_document');
      } catch {
        // Mantém estado local (etapa 1) se a busca falhar.
      } finally {
        if (active) setCheckingStatus(false);
      }
    }

    loadExistingVerification();

    return () => {
      active = false;
    };
  }, []);

  const isVerified = verificationStatus === 'verified';
  const isAwaiting = isAwaitingVerification(verificationStatus);
  const isLocked = isVerified || isAwaiting;
  const verificationColor = getVerificationColor(verificationStatus);
  const canContinue = isVerified || isAwaiting || (selfieWithDocumentSent && confirmed);
  const confirmationChecked = isAwaiting || confirmed;
  const stepIndex = STEP_ORDER.indexOf(currentStep);

  const selfieButtonText = isAwaiting
    ? 'Selfie enviada para análise ✓'
    : !selfieWithDocumentPhotoUri
      ? 'Abrir câmera e tirar selfie'
      : 'Confirmar envio para análise';

  const selfieText = isAwaiting
    ? 'Selfie enviada para análise. Até a aprovação final, este perfil continua não verificado e com uso limitado.'
    : !selfieWithDocumentPhotoUri
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
    if (isLocked || documentSent) return;
    setSelectedDocument(document);
    setDocumentPhotoUri(null);
  }

  async function uploadVerificationFile(fileUri: string, fileLabel: 'documento' | 'selfie' | 'selfie_documento') {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      Alert.alert('Sessão expirada', 'Faça login novamente para continuar.');
      router.replace('/login' as never);
      return null;
    }

    const timestamp = Date.now();
    const storagePath = `verification/${user.id}/${fileLabel}_${timestamp}.jpg`;

    const response = await fetch(fileUri);
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
      return null;
    }

    return { userId: user.id, storagePath };
  }

  async function pickDocumentFromCamera() {
    if (isLocked || documentSent) return;

    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();

      if (!permission.granted) {
        Alert.alert('Permissão de câmera necessária', 'Para validar o perfil, permita o acesso à câmera do celular.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: false,
        quality: 0.75,
      });

      if (result.canceled) return;

      const capturedUri = result.assets?.[0]?.uri;

      if (!capturedUri) {
        Alert.alert('Foto não capturada', 'Não foi possível capturar a foto do documento. Tente novamente.');
        return;
      }

      setDocumentPhotoUri(capturedUri);
    } catch {
      Alert.alert('Não foi possível abrir a câmera', 'Verifique as permissões do celular e tente novamente.');
    }
  }

  async function pickDocumentFromGallery() {
    if (isLocked || documentSent) return;

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert('Permissão de galeria necessária', 'Para validar o perfil, permita o acesso às fotos do celular.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: false,
        quality: 0.75,
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
      });

      if (result.canceled) return;

      const pickedUri = result.assets?.[0]?.uri;

      if (!pickedUri) {
        Alert.alert('Foto não selecionada', 'Não foi possível selecionar a foto do documento. Tente novamente.');
        return;
      }

      setDocumentPhotoUri(pickedUri);
    } catch {
      Alert.alert('Não foi possível abrir a galeria', 'Verifique as permissões do celular e tente novamente.');
    }
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
    } catch {
      Alert.alert('Não foi possível abrir a câmera', 'Verifique as permissões do celular e tente novamente.');
    }
  }

  async function takeSelfieWithDocument() {
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

      setSelfieWithDocumentPhotoUri(capturedUri);
    } catch {
      Alert.alert('Não foi possível abrir a câmera', 'Verifique as permissões do celular e tente novamente.');
    }
  }

  function retakeDocumentPhoto() {
    if (isLocked || documentSent) return;
    setDocumentPhotoUri(null);
  }

  function retakeSelfie() {
    if (isLocked) return;
    setSelfiePhotoUri(null);
  }

  function retakeSelfieWithDocument() {
    if (isLocked) return;
    setSelfieWithDocumentPhotoUri(null);
  }

  async function confirmDocumentSend() {
    if (!documentPhotoUri) {
      Alert.alert('Foto necessária', 'Tire ou selecione uma foto do documento antes de enviar.');
      return;
    }

    setLoading(true);

    try {
      const uploadResult = await uploadVerificationFile(documentPhotoUri, 'documento');
      if (!uploadResult) return;

      const { error: dbError } = await supabase
        .from('verifications')
        .upsert(
          {
            user_id: uploadResult.userId,
            document_type: selectedDocument,
            document_storage_path: uploadResult.storagePath,
          },
          { onConflict: 'user_id' }
        );

      if (dbError) {
        console.error('DB Error:', JSON.stringify(dbError, null, 2));
        Alert.alert('Erro', dbError.message || JSON.stringify(dbError));
        return;
      }

      setDocumentSent(true);
      setCurrentStep('selfie');
    } catch {
      Alert.alert('Erro inesperado', 'Tente novamente em instantes.');
    } finally {
      setLoading(false);
    }
  }

  async function confirmSelfieSend() {
    if (!selfiePhotoUri) {
      Alert.alert('Selfie necessária', 'Tire uma selfie antes de enviar.');
      return;
    }

    setLoading(true);

    try {
      const uploadResult = await uploadVerificationFile(selfiePhotoUri, 'selfie');
      if (!uploadResult) return;

      const { error: dbError } = await supabase
        .from('verifications')
        .upsert(
          {
            user_id: uploadResult.userId,
            selfie_storage_path: uploadResult.storagePath,
          },
          { onConflict: 'user_id' }
        );

      if (dbError) {
        console.error('DB Error:', JSON.stringify(dbError, null, 2));
        Alert.alert('Erro', dbError.message || JSON.stringify(dbError));
        return;
      }

      setSelfieSent(true);
      setCurrentStep('selfie_with_document');
    } catch {
      Alert.alert('Erro inesperado', 'Tente novamente em instantes.');
    } finally {
      setLoading(false);
    }
  }

  async function confirmSelfieWithDocumentSend() {
    if (!selfieWithDocumentPhotoUri) {
      Alert.alert('Selfie necessária', 'Tire a selfie segurando o documento antes de enviar.');
      return;
    }

    setLoading(true);

    try {
      const uploadResult = await uploadVerificationFile(selfieWithDocumentPhotoUri, 'selfie_documento');
      if (!uploadResult) return;

      const now = new Date().toISOString();

      const { error: dbError } = await supabase
        .from('verifications')
        .upsert(
          {
            user_id: uploadResult.userId,
            selfie_with_document_storage_path: uploadResult.storagePath,
            status: 'pending',
            submitted_at: now,
          },
          { onConflict: 'user_id' }
        );

      if (dbError) {
        console.error('DB Error:', JSON.stringify(dbError, null, 2));
        Alert.alert('Erro', dbError.message || JSON.stringify(dbError));
        return;
      }

      submitIdentityVerification({
        documentType: selectedDocument,
        selfieUri: selfieWithDocumentPhotoUri,
      });

      setSelfieWithDocumentSent(true);
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
            {checkingStatus ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator color={COLORS.blue} size="large" />
                <Text style={styles.loadingText}>Carregando sua verificação...</Text>
              </View>
            ) : (
              <>
                <View style={styles.cardHeader}>
                  <View style={[styles.cardSymbol, { borderColor: `${verificationColor}55` }]}>
                    <Image source={SYMBOL} style={styles.cardSymbolImage} resizeMode="cover" />
                  </View>
                  <View style={styles.cardHeaderText}>
                    <Text style={styles.kicker}>Segurança ELUS</Text>
                    <Text style={styles.title}>Verificação de identidade</Text>
                  </View>
                </View>

                <View style={styles.goldBox}>
                  <Text style={styles.goldTitle}>Verificação indispensável</Text>
                  <Text style={styles.goldText}>
                    O ELUS valida perfis em 3 etapas: foto do documento, selfie e
                    selfie segurando o documento. Não pediremos isso em todo login
                    após a validação.
                  </Text>
                </View>

                <View style={styles.stepIndicatorRow}>
                  {STEP_ORDER.map((step, index) => {
                    const isDone = index < stepIndex;
                    const isActive = index === stepIndex;
                    return (
                      <View
                        key={step}
                        style={[
                          styles.stepDot,
                          isDone && styles.stepDotDone,
                          isActive && styles.stepDotActive,
                        ]}
                      />
                    );
                  })}
                  <Text style={styles.stepLabel}>Etapa {stepIndex + 1} de 3</Text>
                </View>

                {currentStep === 'document' && !isLocked ? (
                  <>
                    <Text style={styles.sectionTitle}>Escolha o documento</Text>

                    <View style={styles.documentGrid}>
                      {DOCUMENT_TYPES.map((document) => (
                        <View key={document} style={{ width: '48%', marginBottom: 12 }}>
                          <Chip
                            label={document}
                            selected={selectedDocument === document}
                            disabled={isLocked || loading || documentSent}
                            onPress={() => selectDocument(document)}
                            size="large"
                          />
                        </View>
                      ))}
                    </View>

                    <View style={styles.selfieBox}>
                      <View style={styles.selfieTopRow}>
                        <View style={[styles.selfieIconBox, { borderColor: `${verificationColor}55`, backgroundColor: `${verificationColor}10` }]}>
                          {documentPhotoUri ? (
                            <Image source={{ uri: documentPhotoUri }} style={styles.selfiePreviewImage} resizeMode="cover" />
                          ) : (
                            <Image source={GOLD_SYMBOL} style={styles.selfieSymbolImage} resizeMode="contain" />
                          )}
                        </View>
                        <View style={styles.selfieTextBox}>
                          <Text style={styles.selfieTitle}>Foto do {selectedDocument}</Text>
                          <Text style={styles.selfieText}>
                            {!documentPhotoUri
                              ? 'Tire uma foto nítida do documento ou escolha uma imagem já salva no celular.'
                              : 'Confira a foto do documento. Se estiver boa, confirme para ir para a próxima etapa.'}
                          </Text>
                        </View>
                      </View>

                      {!documentPhotoUri ? (
                        <View style={styles.documentSourceRow}>
                          <Pressable
                            style={({ pressed }) => [
                              styles.documentSourceButton,
                              loading && styles.buttonDisabled,
                              pressed && !loading && styles.pressed,
                            ]}
                            onPress={pickDocumentFromCamera}
                            disabled={loading}
                          >
                            <Text style={styles.documentSourceButtonText}>Tirar foto</Text>
                          </Pressable>

                          <Pressable
                            style={({ pressed }) => [
                              styles.documentSourceButton,
                              loading && styles.buttonDisabled,
                              pressed && !loading && styles.pressed,
                            ]}
                            onPress={pickDocumentFromGallery}
                            disabled={loading}
                          >
                            <Text style={styles.documentSourceButtonText}>Escolher da galeria</Text>
                          </Pressable>
                        </View>
                      ) : (
                        <>
                          <Pressable
                            style={({ pressed }) => [
                              styles.primaryButton,
                              loading && styles.buttonDisabled,
                              pressed && !loading && styles.pressed,
                            ]}
                            onPress={confirmDocumentSend}
                            disabled={loading}
                          >
                            {loading ? (
                              <ActivityIndicator color="#FFFFFF" />
                            ) : (
                              <Text style={styles.primaryButtonText}>Confirmar documento e continuar</Text>
                            )}
                          </Pressable>

                          <Pressable
                            style={({ pressed }) => [styles.retakeButton, pressed && styles.pressed]}
                            onPress={retakeDocumentPhoto}
                            disabled={loading}
                          >
                            <Text style={styles.retakeButtonText}>Trocar foto</Text>
                          </Pressable>
                        </>
                      )}
                    </View>
                  </>
                ) : null}

                {currentStep === 'selfie' && !isLocked ? (
                  <View style={styles.selfieBox}>
                    <View style={styles.selfieTopRow}>
                      <View style={[styles.selfieIconBox, { borderColor: `${verificationColor}55`, backgroundColor: `${verificationColor}10` }]}>
                        {selfiePhotoUri ? (
                          <Image source={{ uri: selfiePhotoUri }} style={styles.selfiePreviewImage} resizeMode="cover" />
                        ) : (
                          <Image source={GOLD_SYMBOL} style={styles.selfieSymbolImage} resizeMode="contain" />
                        )}
                      </View>
                      <View style={styles.selfieTextBox}>
                        <Text style={styles.selfieTitle}>Selfie</Text>
                        <Text style={styles.selfieText}>
                          {!selfiePhotoUri
                            ? 'Tire uma selfie olhando para a câmera, sem o documento.'
                            : 'Confira a selfie. Se estiver boa, confirme para ir para a última etapa.'}
                        </Text>
                      </View>
                    </View>

                    <Pressable
                      style={({ pressed }) => [
                        styles.primaryButton,
                        loading && styles.buttonDisabled,
                        pressed && !loading && styles.pressed,
                      ]}
                      onPress={!selfiePhotoUri ? takeSelfie : confirmSelfieSend}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text style={styles.primaryButtonText}>
                          {!selfiePhotoUri ? 'Abrir câmera e tirar selfie' : 'Confirmar selfie e continuar'}
                        </Text>
                      )}
                    </Pressable>

                    {selfiePhotoUri ? (
                      <Pressable
                        style={({ pressed }) => [styles.retakeButton, pressed && styles.pressed]}
                        onPress={retakeSelfie}
                        disabled={loading}
                      >
                        <Text style={styles.retakeButtonText}>Refazer foto</Text>
                      </Pressable>
                    ) : null}
                  </View>
                ) : null}

                {currentStep === 'selfie_with_document' && !isLocked ? (
                  <View style={[
                    styles.selfieBox,
                    selfieWithDocumentPhotoUri && !selfieWithDocumentSent && !isLocked && styles.selfieBoxReview,
                    isAwaiting && styles.selfieBoxAwaiting,
                    isVerified && styles.selfieBoxVerified,
                  ]}>
                    <View style={styles.selfieTopRow}>
                      <View style={[styles.selfieIconBox, { borderColor: `${verificationColor}55`, backgroundColor: `${verificationColor}10` }]}>
                        {selfieWithDocumentPhotoUri ? (
                          <Image source={{ uri: selfieWithDocumentPhotoUri }} style={styles.selfiePreviewImage} resizeMode="cover" />
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
                      onPress={!selfieWithDocumentPhotoUri ? takeSelfieWithDocument : confirmSelfieWithDocumentSend}
                      disabled={isLocked || loading}
                    >
                      {loading && !selfieWithDocumentSent ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <Text style={styles.primaryButtonText}>{selfieButtonText}</Text>
                      )}
                    </Pressable>

                    {selfieWithDocumentPhotoUri && !selfieWithDocumentSent && !isLocked ? (
                      <Pressable
                        style={({ pressed }) => [styles.retakeButton, pressed && styles.pressed]}
                        onPress={retakeSelfieWithDocument}
                        disabled={loading}
                      >
                        <Text style={styles.retakeButtonText}>Refazer foto</Text>
                      </Pressable>
                    ) : null}
                  </View>
                ) : null}

                <View style={styles.infoBox}>
                  <View style={styles.infoIconBox}>
                    <Text style={styles.infoIcon}>✓</Text>
                  </View>
                  <Text style={styles.infoText}>
                    Seus documentos não serão exibidos publicamente. Após a validação,
                    o app não pedirá esses documentos em todo login.
                  </Text>
                </View>

                {isLocked || currentStep === 'selfie_with_document' ? (
                  <>
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

                    <Button
                      label={continueButtonText}
                      variant="primary"
                      loading={loading}
                      disabled={!canContinue || loading}
                      onPress={continueToApp}
                    />
                  </>
                ) : null}

                {!isAwaiting && !isVerified ? (
                  <Pressable
                    style={({ pressed }) => [styles.limitedButton, pressed && styles.pressed]}
                    onPress={continueLimited}
                    disabled={loading}
                  >
                    <Text style={styles.limitedButtonText}>Fazer depois com uso limitado</Text>
                  </Pressable>
                ) : null}
              </>
            )}
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
  loadingBox: { paddingVertical: 60, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 16, color: COLORS.muted, fontSize: 14, fontWeight: '700' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  cardSymbol: { width: 54, height: 54, borderRadius: 27, overflow: 'hidden', backgroundColor: '#05060A', borderWidth: 1, marginRight: 14 },
  cardSymbolImage: { width: '100%', height: '100%' },
  cardHeaderText: { flex: 1 },
  kicker: { color: COLORS.gold, fontSize: 12, fontWeight: '900', letterSpacing: 3.4, textTransform: 'uppercase', marginBottom: 6 },
  title: { color: COLORS.text, fontSize: 31, lineHeight: 36, fontWeight: '900', letterSpacing: -0.8 },
  goldBox: { padding: 17, borderRadius: 24, backgroundColor: COLORS.goldCard, borderWidth: 1, borderColor: COLORS.borderGold, marginBottom: 22 },
  goldTitle: { color: COLORS.gold, fontSize: 17, fontWeight: '900', marginBottom: 8 },
  goldText: { color: COLORS.muted, fontSize: 14, lineHeight: 23, fontWeight: '700' },
  stepIndicatorRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  stepDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.16)', marginHorizontal: 5 },
  stepDotActive: { backgroundColor: COLORS.blue, width: 26 },
  stepDotDone: { backgroundColor: COLORS.green },
  stepLabel: { marginLeft: 12, color: COLORS.muted, fontSize: 13, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 },
  sectionTitle: { color: COLORS.text, fontSize: 18, fontWeight: '900', marginBottom: 12 },
  documentGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  documentSourceRow: { flexDirection: 'row', gap: 10, marginTop: 20 },
  documentSourceButton: { flex: 1, minHeight: 58, borderRadius: 24, backgroundColor: COLORS.blue, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, shadowColor: COLORS.blue, shadowOpacity: 0.42, shadowRadius: 22, shadowOffset: { width: 0, height: 0 } },
  documentSourceButtonText: { color: COLORS.text, fontSize: 14, lineHeight: 19, fontWeight: '900', textAlign: 'center' },
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
  limitedButton: { marginTop: 14, minHeight: 56, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.045)', borderWidth: 1, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  limitedButtonText: { color: COLORS.muted, fontSize: 16, fontWeight: '900' },
  buttonDisabled: { opacity: 0.6 },
  footer: { marginTop: 22, color: COLORS.soft, textAlign: 'center', fontSize: 13, lineHeight: 20, fontWeight: '800' },
  pressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  pressedSmall: { opacity: 0.7, transform: [{ scale: 0.96 }] },
});
