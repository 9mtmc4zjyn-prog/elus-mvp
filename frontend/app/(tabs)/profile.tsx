import React, { useMemo, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

import BrandMark from '../../src/components/BrandMark';
import ProfileAvatar from '../../src/components/ProfileAvatar';
import { useApp } from '../../src/context/AppContext';
import { supabase } from '../../src/lib/supabase';
import { Button } from '../../src/components/Button';
import { useTheme } from '../../src/theme/ThemeContext';
import type { ThemeColors } from '../../src/theme/theme';

const WATERMARK = require('../../assets/watermark/elus_symbol_watermark_10.png');

const COLORS = {
  card: 'rgba(20,26,38,0.94)',
  borderSoft: 'rgba(255,255,255,0.075)',
  muted: 'rgba(161,169,184,0.78)',
  soft: 'rgba(161,169,184,0.55)',
  blueLight: '#8FA3B8',
};

const NO_CONNECTION_RING_COLORS = ['transparent'];

function getInitials(name: string) {
  const parts = name.trim().split(' ').filter(Boolean);

  if (parts.length === 0) {
    return 'E';
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function getProfileTypeLabel(profileType: string) {
  if (profileType === 'business') {
    return 'Empresa';
  }

  if (profileType === 'assisted') {
    return 'Perfil assistido';
  }

  return 'Pessoa';
}

function getPresenceModeLabel(presenceMode: string) {
  if (presenceMode === 'need_service') {
    return 'Busca serviço';
  }

  if (presenceMode === 'offer_service') {
    return 'Oferece serviço';
  }

  return 'Presença pessoal';
}

function getPlanLabel(plan: string) {
  if (plan === 'premium_business') {
    return 'Plano empresarial';
  }

  if (plan === 'premium_person') {
    return 'Plano premium';
  }

  return 'Plano gratuito';
}

function isAwaitingVerification(verificationStatus: string) {
  return verificationStatus === 'in_review' || verificationStatus === 'pending';
}

function normalizeVerificationStatus(
  verificationStatus?: string,
  legacyVerified?: boolean
) {
  const status = verificationStatus || (legacyVerified ? 'verified' : 'unverified');

  if (status === 'verified') {
    return 'verified';
  }

  if (isAwaitingVerification(status)) {
    return status;
  }

  return 'unverified';
}

function getVerificationTitle(verificationStatus: string) {
  if (verificationStatus === 'verified') {
    return 'Verificação concluída';
  }

  if (isAwaitingVerification(verificationStatus)) {
    return 'Aguardando verificação';
  }

  return 'Verificação pendente';
}

function getVerificationDescription(verificationStatus: string) {
  if (verificationStatus === 'verified') {
    return 'Sua identidade foi confirmada. O ELUS não pedirá documento em todo login.';
  }

  if (isAwaitingVerification(verificationStatus)) {
    return 'Sua selfie com documento foi enviada para análise. Até a aprovação final, seu perfil continua não verificado e com uso limitado.';
  }

  return 'Sua verificação está pendente. Finalize a verificação com selfie segurando documento oficial com foto para liberar o uso completo.';
}

function getVerificationColor(verificationStatus: string, colors: ThemeColors) {
  if (verificationStatus === 'verified') {
    return colors.success;
  }

  if (isAwaitingVerification(verificationStatus)) {
    return COLORS.blueLight;
  }

  return colors.danger;
}

function getVerificationMainCardTitle(verificationStatus: string) {
  if (verificationStatus === 'verified') {
    return 'Uso liberado';
  }

  if (isAwaitingVerification(verificationStatus)) {
    return 'Aguardando aprovação, ainda não verificado';
  }

  return 'Uso limitado: verificação pendente';
}

function getVerificationMainCardText(verificationStatus: string) {
  if (verificationStatus === 'verified') {
    return 'Seu perfil já foi validado. A confirmação de identidade aparece apenas no perfil/configurações, sem atrapalhar o login diário.';
  }

  if (isAwaitingVerification(verificationStatus)) {
    return 'Sua verificação foi enviada, mas ainda depende de aprovação. Até a confirmação, seu perfil continua não verificado, sem privilégios completos e com uso limitado.';
  }

  return 'Enquanto seu perfil não for validado, você não poderá solicitar contato, ver informações completas de outros perfis ou aparecer publicamente com foto real.';
}

function getDaysSince(date?: string) {
  if (!date) {
    return 0;
  }

  const start = new Date(date).getTime();

  if (Number.isNaN(start)) {
    return 0;
  }

  const now = Date.now();
  const diff = now - start;

  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, updateUser, logout, getConnectionBranches } = useApp();
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const { colors } = useTheme();

  async function handleAvatarPress() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Permita o acesso à galeria para trocar a foto.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]?.uri) return;

    setUploadingAvatar(true);

    try {
      const manipulated = await ImageManipulator.manipulateAsync(
        result.assets[0].uri,
        [{ resize: { width: 400, height: 400 } }],
        { compress: 0.75, format: ImageManipulator.SaveFormat.JPEG }
      );

      const response = await fetch(manipulated.uri);
      const blob = await response.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();

      const path = `${user.id}/avatar.jpg`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, arrayBuffer, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) {
        Alert.alert('Erro no upload', 'Não foi possível enviar a foto. Tente novamente.');
        return;
      }

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      const publicUrl = urlData.publicUrl;

      await supabase
        .from('profiles')
        .update({ photo_url: publicUrl })
        .eq('id', user.id);

      updateUser({ photo: publicUrl });
    } catch {
      Alert.alert('Erro', 'Não foi possível atualizar a foto de perfil.');
    } finally {
      setUploadingAvatar(false);
    }
  }

  const verificationStatus = normalizeVerificationStatus(
    user.verificationStatus,
    user.verified
  );

  const isVerified = verificationStatus === 'verified';
  const isInReview = isAwaitingVerification(verificationStatus);
  const isLimited = !isVerified;

  const verificationColor = getVerificationColor(verificationStatus, colors);
  const profileTypeLabel = getProfileTypeLabel(user.profileType);
  const presenceModeLabel = getPresenceModeLabel(user.presenceMode);
  const planLabel = getPlanLabel(user.plan);

  const daysSinceVerificationStart = getDaysSince(user.verificationSubmittedAt);
  const daysLeft = Math.max(0, 7 - daysSinceVerificationStart);

  const affinityBranches = useMemo(
    () => getConnectionBranches().filter((branch) => branch.connections.length > 0),
    [getConnectionBranches]
  );

  const confirmedConnectionBranches = isVerified ? affinityBranches : [];

  const hasConfirmedConnections =
    isVerified && confirmedConnectionBranches.length > 0;

  const ringColors = hasConfirmedConnections
    ? confirmedConnectionBranches.map((branch) => branch.color)
    : NO_CONNECTION_RING_COLORS;

  const headline =
    user.service ||
    user.companyName ||
    'Construindo uma rede contextual de conexões humanas reais.';

  function goToVerification() {
    router.push('/verification' as never);
  }

  function goToEditProfile() {
    router.push('/profile-setup' as never);
  }

  function goToPlans() {
    router.push('/plans' as never);
  }

  function goToPrivacy() {
    router.push('/privacy-policy' as never);
  }

  function goToTerms() {
    router.push('/terms' as never);
  }

  function goToMap() {
    router.push('/(tabs)/map' as never);
  }

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.warn('[ELUS] Falha ao encerrar sessão no servidor durante o logout:', error.message);
    }

    logout();
    router.replace('/login' as never);
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Image source={WATERMARK} style={styles.watermarkOne} resizeMode="contain" />
      <Image source={WATERMARK} style={styles.watermarkTwo} resizeMode="contain" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <BrandMark variant="horizontal" size="small" />

          <Pressable
            style={({ pressed }) => [
              styles.headerButton,
              { borderColor: colors.borderStrong },
              pressed && styles.pressedSmall,
            ]}
            onPress={goToPrivacy}
          >
            <Text style={[styles.headerButtonText, { color: colors.text }]}>⋯</Text>
          </Pressable>
        </View>

        <View style={[styles.profileCard, { borderColor: colors.borderStrong }]}>
          <Pressable
            onPress={handleAvatarPress}
            disabled={uploadingAvatar}
            style={({ pressed }) => [pressed && styles.pressedSmall]}
          >
            <ProfileAvatar
              name={user.name}
              initials={getInitials(user.name)}
              photoUrl={user.photo}
              size={104}
              ringColors={ringColors}
              verified={isVerified}
            />
            <View style={[styles.avatarEditBadge, { backgroundColor: colors.accent, borderColor: colors.background }]}>
              <Text style={[styles.avatarEditBadgeText, { color: colors.text }]}>
                {uploadingAvatar ? '…' : '✎'}
              </Text>
            </View>
          </Pressable>

          <Text style={[styles.profileName, { color: colors.text }]} numberOfLines={2}>
            {user.name}
          </Text>

          <Text style={styles.profileMeta}>
            {profileTypeLabel} · {presenceModeLabel}
          </Text>

          <Text style={styles.profileLocation}>
            {[user.city, user.state].filter(Boolean).join(' · ') || 'Localização não informada'}
          </Text>

          <Text style={[styles.profileHeadline, { color: colors.text }]}>
            {headline}
          </Text>

          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusPill,
                {
                  borderColor: `${verificationColor}55`,
                  backgroundColor: `${verificationColor}18`,
                },
              ]}
            >
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: verificationColor,
                  },
                ]}
              />

              <Text
                style={[
                  styles.statusPillText,
                  {
                    color: verificationColor,
                  },
                ]}
              >
                {getVerificationTitle(verificationStatus)}
              </Text>
            </View>

            <View style={styles.planPill}>
              <Text style={styles.planPillText}>{planLabel}</Text>
            </View>
          </View>
        </View>

        <View
          style={[
            styles.verificationCard,
            isVerified ? styles.verifiedCard : styles.pendingCard,
            {
              borderColor: `${verificationColor}44`,
            },
          ]}
        >
          <Text
            style={[
              styles.sectionKicker,
              {
                color: verificationColor,
              },
            ]}
          >
            Verificação de identidade
          </Text>

          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {getVerificationTitle(verificationStatus)}
          </Text>

          <Text style={styles.sectionText}>
            {getVerificationDescription(verificationStatus)}
          </Text>

          <View
            style={[
              styles.verificationInfoBox,
              {
                backgroundColor: `${verificationColor}10`,
                borderColor: `${verificationColor}30`,
              },
            ]}
          >
            <View
              style={[
                styles.verificationIconBox,
                {
                  backgroundColor: `${verificationColor}18`,
                },
              ]}
            >
              <Text
                style={[
                  styles.verificationIcon,
                  {
                    color: verificationColor,
                  },
                ]}
              >
                {isVerified ? '✓' : isInReview ? '◌' : '◎'}
              </Text>
            </View>

            <View style={styles.verificationInfoTextBox}>
              <Text style={[styles.verificationInfoTitle, { color: colors.text }]}>
                Selfie com documento oficial
              </Text>

              <Text style={styles.verificationInfoText}>
                A validação é feita uma única vez com selfie segurando CIN/RG, CNH,
                passaporte ou CRNM/RNE.
              </Text>
            </View>
          </View>

          <View
            style={
              isVerified
                ? styles.successBox
                : [
                    styles.limitedBox,
                    {
                      backgroundColor: `${verificationColor}10`,
                      borderColor: `${verificationColor}30`,
                    },
                  ]
            }
          >
            <Text
              style={
                isVerified
                  ? [styles.successTitle, { color: colors.success }]
                  : [
                      styles.limitedTitle,
                      {
                        color: verificationColor,
                      },
                    ]
              }
            >
              {getVerificationMainCardTitle(verificationStatus)}
            </Text>

            <Text style={isVerified ? styles.successText : styles.limitedText}>
              {getVerificationMainCardText(verificationStatus)}
            </Text>

            {isLimited ? (
              <Text style={styles.limitedText}>
                Prazo estimado: {daysLeft} dia{daysLeft === 1 ? '' : 's'} restante{daysLeft === 1 ? '' : 's'}
                {daysLeft === 0
                  ? ' para regularizar o perfil.'
                  : ' para concluir a verificação.'}
              </Text>
            ) : null}
          </View>

          {!isVerified ? (
            <Button
              label={isInReview ? 'Ver status da análise →' : 'Verificar identidade agora →'}
              variant="primary"
              onPress={goToVerification}
            />
          ) : (
            <Button
              label="Ver status da verificação"
              variant="secondary"
              onPress={goToVerification}
            />
          )}
        </View>

        <View style={styles.bondsCard}>
          <Text style={[styles.sectionKicker, { color: colors.warning }]}>Perfil ELUS</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Afinidades declaradas</Text>

          {affinityBranches.length > 0 ? (
            <View style={styles.bondWrap}>
              {affinityBranches.map((branch) => (
                <View
                  key={branch.kind}
                  style={[
                    styles.bondPill,
                    {
                      borderColor: branch.color,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.bondDot,
                      {
                        backgroundColor: branch.color,
                      },
                    ]}
                  />

                  <Text
                    style={[
                      styles.bondText,
                      {
                        color: branch.color,
                      },
                    ]}
                  >
                    {branch.title}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>
              Suas afinidades declaradas aparecerão aqui conforme você preencher seu perfil.
            </Text>
          )}
        </View>

        <View style={styles.actionsCard}>
          <Text style={[styles.sectionKicker, { color: colors.warning }]}>Configurações</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Gerenciar perfil</Text>

          <View style={styles.menuList}>
            <Pressable
              style={({ pressed }) => [
                styles.menuItem,
                pressed && styles.pressedSmall,
              ]}
              onPress={goToEditProfile}
            >
              <View>
                <Text style={[styles.menuTitle, { color: colors.text }]}>Editar perfil</Text>
                <Text style={styles.menuSubtitle}>Nome, foto, presença e interesses</Text>
              </View>

              <Text style={styles.menuArrow}>›</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.menuItem,
                pressed && styles.pressedSmall,
              ]}
              onPress={goToMap}
            >
              <View>
                <Text style={[styles.menuTitle, { color: colors.text }]}>Meu campo</Text>
                <Text style={styles.menuSubtitle}>Ver sua presença e afinidades próximas</Text>
              </View>

              <Text style={styles.menuArrow}>›</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.menuItem,
                pressed && styles.pressedSmall,
              ]}
              onPress={goToPlans}
            >
              <View>
                <Text style={[styles.menuTitle, { color: colors.text }]}>Planos</Text>
                <Text style={styles.menuSubtitle}>Plano atual, limites e recursos premium</Text>
              </View>

              <Text style={styles.menuArrow}>›</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.menuItem,
                pressed && styles.pressedSmall,
              ]}
              onPress={goToPrivacy}
            >
              <View>
                <Text style={[styles.menuTitle, { color: colors.text }]}>Privacidade e segurança</Text>
                <Text style={styles.menuSubtitle}>Documento, selfie, bloqueios e dados</Text>
              </View>

              <Text style={styles.menuArrow}>›</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.menuItem,
                pressed && styles.pressedSmall,
              ]}
              onPress={goToTerms}
            >
              <View>
                <Text style={[styles.menuTitle, { color: colors.text }]}>Termos de Uso</Text>
                <Text style={styles.menuSubtitle}>Regras de uso da plataforma</Text>
              </View>

              <Text style={styles.menuArrow}>›</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.brandCard}>
          <Text style={[styles.brandCardTitle, { color: colors.text }]}>ELUS</Text>
          <Text style={styles.brandCardText}>
            Conexões reais, com identidade real e acesso simples.
          </Text>
        </View>

        <Button label="Sair da conta" variant="destructiveSecondary" onPress={handleLogout} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create<any>({
  screen: {
    flex: 1,
  },
  watermarkOne: {
    position: 'absolute',
    width: 340,
    height: 340,
    top: 78,
    left: -170,
    opacity: 0.065,
  },
  watermarkTwo: {
    position: 'absolute',
    width: 430,
    height: 430,
    right: -200,
    bottom: 80,
    opacity: 0.055,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: 62,
    paddingHorizontal: 20,
    paddingBottom: 122,
  },
  header: {
    marginBottom: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(16,19,29,0.92)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonText: {
    fontSize: 28,
    lineHeight: 28,
    fontWeight: '900',
    marginTop: -6,
  },

  profileCard: {
    padding: 24,
    borderRadius: 34,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    alignItems: 'center',
  },
  profileName: {
    marginTop: 20,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.8,
  },
  profileMeta: {
    marginTop: 8,
    color: COLORS.muted,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  profileLocation: {
    marginTop: 7,
    color: COLORS.soft,
    fontSize: 15,
    textAlign: 'center',
  },
  profileHeadline: {
    marginTop: 18,
    fontSize: 17,
    lineHeight: 25,
    fontWeight: '800',
    textAlign: 'center',
  },
  statusRow: {
    marginTop: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  statusPill: {
    margin: 4,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '900',
  },
  planPill: {
    margin: 4,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(91,141,239,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(143,179,255,0.30)',
  },
  planPillText: {
    color: COLORS.blueLight,
    fontSize: 12,
    fontWeight: '900',
  },

  verificationCard: {
    marginTop: 18,
    padding: 20,
    borderRadius: 30,
    backgroundColor: COLORS.card,
    borderWidth: 1,
  },
  verifiedCard: {
    borderColor: 'rgba(54,211,153,0.28)',
  },
  pendingCard: {
    borderColor: 'rgba(255,107,107,0.30)',
  },
  sectionKicker: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  sectionTitle: {
    marginTop: 9,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  sectionText: {
    marginTop: 10,
    color: COLORS.muted,
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '700',
  },
  verificationInfoBox: {
    marginTop: 18,
    padding: 17,
    borderRadius: 24,
    backgroundColor: 'rgba(91,141,239,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(143,179,255,0.24)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  verificationIconBox: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: 'rgba(91,141,239,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  verificationIcon: {
    color: COLORS.blueLight,
    fontSize: 24,
    fontWeight: '900',
  },
  verificationInfoTextBox: {
    flex: 1,
  },
  verificationInfoTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  verificationInfoText: {
    marginTop: 5,
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '700',
  },
  successBox: {
    marginTop: 16,
    padding: 16,
    borderRadius: 24,
    backgroundColor: 'rgba(54,211,153,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(54,211,153,0.28)',
  },
  successTitle: {
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 7,
  },
  successText: {
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '700',
  },
  limitedBox: {
    marginTop: 16,
    padding: 16,
    borderRadius: 24,
    backgroundColor: 'rgba(255,107,107,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.24)',
  },
  limitedTitle: {
    fontSize: 15,
    fontWeight: '900',
    marginBottom: 7,
  },
  limitedText: {
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '700',
    marginBottom: 5,
  },
  bondsCard: {
    marginTop: 18,
    padding: 20,
    borderRadius: 30,
    backgroundColor: COLORS.card,
    borderWidth: 1,
  },
  bondsExplanation: {
    marginTop: 10,
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
  },
  bondWrap: {
    marginTop: 15,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  bondPill: {
    marginRight: 9,
    marginBottom: 9,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.035)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  bondDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 7,
  },
  bondText: {
    fontSize: 13,
    fontWeight: '900',
  },
  emptyText: {
    marginTop: 12,
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
  },

  actionsCard: {
    marginTop: 18,
    padding: 20,
    borderRadius: 30,
    backgroundColor: COLORS.card,
    borderWidth: 1,
  },
  menuList: {
    marginTop: 16,
  },
  menuItem: {
    minHeight: 72,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSoft,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  menuSubtitle: {
    marginTop: 5,
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 18,
    maxWidth: 275,
  },
  menuArrow: {
    color: COLORS.soft,
    fontSize: 30,
    fontWeight: '700',
    marginLeft: 12,
  },

  brandCard: {
    marginTop: 18,
    padding: 18,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
  },
  brandCardTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 5,
  },
  brandCardText: {
    marginTop: 8,
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
  },
  pressedSmall: {
    opacity: 0.72,
    transform: [{ scale: 0.97 }],
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEditBadgeText: {
    fontSize: 13,
    fontWeight: '900',
  },
});
