import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useApp, type AppUser } from '../../src/context/AppContext';
import { appUserToProfile } from '../../src/utils/adaptSupabaseProfile';
import type { Profile } from '../../src/data/profiles';
import { getLocalAffinityExplanation } from '../../src/utils/elusIntelligenceRules';

const ELUS_UNVERIFIED = require('../../assets/images/elus-unverified.png');
const ELUS_VERIFIED_GREEN = require('../../assets/images/elus-verified-green.png');
const ELUS_CENTER_SYMBOL = require('../../assets/images/elus-symbol-cyan-purple.png');
const ELUS_LOGO = require('../../assets/images/elus-logo.png');

const COLORS = {
  background: '#05070D',
  panel: '#0B1020',
  panelSoft: '#10182A',
  panelDeep: '#080C16',
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.14)',
  text: '#F5F7FB',
  muted: '#8D98AA',
  mutedSoft: '#BAC2D0',
  cyan: '#26D9FF',
  cyanSoft: 'rgba(38,217,255,0.10)',
  blueLight: '#9DBBFF',
  blueLightSoft: 'rgba(157,187,255,0.12)',
  purple: '#8B5CFF',
  purpleSoft: 'rgba(139,92,255,0.12)',
  gold: '#F2A93B',
  goldSoft: 'rgba(242,169,59,0.12)',
  green: '#31D6A3',
  greenSoft: 'rgba(49,214,163,0.12)',
  danger: '#EF4444',
  dangerSoft: 'rgba(239,68,68,0.12)',
};

type SignalKind =
  | 'pessoa'
  | 'empresa'
  | 'servico'
  | 'nao-validado'
  | 'em-analise';

type VerificationVisualStatus = 'unverified' | 'in_review' | 'verified';

type RadarPosition = {
  size: number;
  top: number;
  left: number;
};

const radarPositions: RadarPosition[] = [
  { size: 34, top: 34, left: 42 },
  { size: 26, top: 82, left: 248 },
  { size: 30, top: 174, left: 70 },
  { size: 22, top: 198, left: 235 },
  { size: 18, top: 58, left: 185 },
];

function getCurrentVerificationStatus(user: AppUser): VerificationVisualStatus {
  if (
    user.verified === true &&
    user.verificationStatus !== 'unverified' &&
    user.verificationStatus !== 'in_review' &&
    user.verificationStatus !== 'pending'
  ) {
    return 'verified';
  }

  if (
    user.verificationStatus === 'in_review' ||
    user.verificationStatus === 'pending'
  ) {
    return 'in_review';
  }

  return 'unverified';
}

function getProfileVerificationStatus(profile: Profile): VerificationVisualStatus {
  const status = String(
    (profile as any).verificationStatus ?? profile.status ?? ''
  );

  if (status === 'verified') {
    return 'verified';
  }

  if (
    status === 'in_review' ||
    status === 'pending' ||
    status === 'review' ||
    status === 'awaiting' ||
    status === 'aguardando' ||
    status === 'aguardando_verificacao'
  ) {
    return 'in_review';
  }

  return 'unverified';
}

function shouldProtectProfileVerificationStatus({
  currentUserStatus,
  profileStatus,
}: {
  currentUserStatus: VerificationVisualStatus;
  profileStatus: VerificationVisualStatus;
}) {
  return currentUserStatus !== 'verified' && profileStatus === 'verified';
}

function getVisibleProfileVerificationStatus({
  currentUserStatus,
  profileStatus,
}: {
  currentUserStatus: VerificationVisualStatus;
  profileStatus: VerificationVisualStatus;
}): VerificationVisualStatus {
  if (
    shouldProtectProfileVerificationStatus({
      currentUserStatus,
      profileStatus,
    })
  ) {
    return 'in_review';
  }

  return profileStatus;
}

function getVerificationStatusColor(status: VerificationVisualStatus) {
  if (status === 'verified') {
    return COLORS.green;
  }

  if (status === 'in_review') {
    return COLORS.blueLight;
  }

  return COLORS.danger;
}

function getVerificationStatusImage(status: VerificationVisualStatus) {
  if (status === 'verified') {
    return ELUS_VERIFIED_GREEN;
  }

  if (status === 'in_review') {
    return ELUS_CENTER_SYMBOL;
  }

  return ELUS_UNVERIFIED;
}

function getVerificationMeta(status: VerificationVisualStatus) {
  if (status === 'verified') {
    return {
      pillText: 'Verificação concluída',
      color: COLORS.green,
      icon: 'shield-checkmark-outline' as keyof typeof Ionicons.glyphMap,
    };
  }

  if (status === 'in_review') {
    return {
      pillText: 'Aguardando verificação',
      color: COLORS.blueLight,
      icon: 'time-outline' as keyof typeof Ionicons.glyphMap,
    };
  }

  return {
    pillText: 'Verificação pendente',
    color: COLORS.danger,
    icon: 'shield-outline' as keyof typeof Ionicons.glyphMap,
  };
}

function getProfileStatusColor(profile: Profile) {
  const status = getProfileVerificationStatus(profile);

  return getVerificationStatusColor(status);
}

function getProfileSignalKind(profile: Profile): SignalKind {
  const profileStatus = getProfileVerificationStatus(profile);

  if (profileStatus === 'in_review') {
    return 'em-analise';
  }

  if (profileStatus === 'unverified') {
    return 'nao-validado';
  }

  const searchableText = `${profile.kind} ${profile.role} ${profile.area} ${profile.purpose} ${profile.bio}`.toLowerCase();

  if (profile.kind === 'Empresa') {
    return 'empresa';
  }

  if (
    searchableText.includes('serviço') ||
    searchableText.includes('serviços') ||
    searchableText.includes('prestador') ||
    searchableText.includes('atendimento') ||
    searchableText.includes('manutenção')
  ) {
    return 'servico';
  }

  return 'pessoa';
}

function getProfileReason(profile: Profile): string {
  return profile.aiReasons[0] ?? profile.purpose;
}

function getProfileDistanceLabel(profile: Profile): string {
  return profile.isOnline ? 'Presença aproximada ativa' : 'Região aproximada';
}

function getPublicProfileName(profile: Profile) {
  if (profile.kind === 'Pessoa') {
    return profile.firstName || profile.name.split(' ')[0] || profile.name;
  }

  return profile.name;
}

function getRestrictedLocation(profile: Profile) {
  if (profile.city && profile.state) {
    return `${profile.city} • ${profile.state} · região aproximada`;
  }

  if (profile.city) {
    return `${profile.city} · região aproximada`;
  }

  return 'Localização aproximada protegida';
}

function getSignalColor(kind: SignalKind) {
  switch (kind) {
    case 'pessoa':
      return COLORS.cyan;
    case 'empresa':
      return COLORS.purple;
    case 'servico':
      return COLORS.green;
    case 'em-analise':
      return COLORS.blueLight;
    case 'nao-validado':
      return COLORS.danger;
    default:
      return COLORS.cyan;
  }
}

function getSignalIcon(kind: SignalKind): keyof typeof Ionicons.glyphMap {
  switch (kind) {
    case 'pessoa':
      return 'person-outline';
    case 'empresa':
      return 'business-outline';
    case 'servico':
      return 'construct-outline';
    case 'em-analise':
      return 'time-outline';
    case 'nao-validado':
      return 'shield-outline';
    default:
      return 'radio-outline';
  }
}

function cleanAffinityReason(reason: string): string {
  return String(reason ?? '')
    .replace(/^essa conexão apareceu porque\s+/i, '')
    .replace(/^essa afinidade apareceu porque\s+/i, '')
    .replace(/\.$/, '')
    .trim();
}

function getCardAffinityReasons({
  profile,
  fallbackReasons,
}: {
  profile: Profile;
  fallbackReasons: string[];
}) {
  const profileReasons = Array.isArray(profile.aiReasons)
    ? profile.aiReasons
    : [];

  const baseReasons =
    profileReasons.length > 0
      ? profileReasons
      : fallbackReasons.length > 0
        ? fallbackReasons
        : [getProfileReason(profile)];

  return baseReasons
    .map(cleanAffinityReason)
    .filter((reason) => reason.length > 0)
    .slice(0, 2);
}

function SmallStatusPill({
  icon,
  text,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  color: string;
}) {
  return (
    <View
      style={[
        styles.statusPill,
        { borderColor: `${color}55`, backgroundColor: `${color}14` },
      ]}
    >
      <Ionicons name={icon} size={13} color={color} />
      <Text style={[styles.statusPillText, { color }]}>{text}</Text>
    </View>
  );
}

function FieldTrustNotice() {
  return (
    <View style={styles.fieldTrustNotice}>
      <View style={styles.fieldTrustIconWrap}>
        <Ionicons name="sparkles-outline" size={17} color={COLORS.cyan} />
      </View>

      <Text style={styles.fieldTrustText}>
        Afinidades detectadas pela IA. Contato só com aprovação.
      </Text>
    </View>
  );
}

function RadarNode({
  profile,
  position,
  currentUserStatus,
}: {
  profile: Profile;
  position: RadarPosition;
  currentUserStatus: VerificationVisualStatus;
}) {
  const profileStatus = getProfileVerificationStatus(profile);
  const visibleProfileStatus = getVisibleProfileVerificationStatus({
    currentUserStatus,
    profileStatus,
  });
  const color = getVerificationStatusColor(visibleProfileStatus);
  const image = getVerificationStatusImage(visibleProfileStatus);

  return (
    <View
      style={[
        styles.radarNode,
        {
          width: position.size,
          height: position.size,
          borderRadius: position.size / 2,
          top: position.top,
          left: position.left,
          borderColor: `${color}88`,
          backgroundColor: `${color}16`,
        },
      ]}
    >
      <Image
        source={image}
        style={styles.radarSymbolImage}
        resizeMode="contain"
      />
    </View>
  );
}

function PresenceField({
  profiles,
  currentUserStatus,
  onPress,
}: {
  profiles: Profile[];
  currentUserStatus: VerificationVisualStatus;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.fieldCard,
        pressed ? styles.fieldCardPressed : null,
      ]}
    >
      <View style={styles.fieldBackgroundGlowOne} />
      <View style={styles.fieldBackgroundGlowTwo} />

      <View style={styles.radarCircleOuter} />
      <View style={styles.radarCircleMiddle} />
      <View style={styles.radarCircleInner} />

      <View style={styles.centerCore}>
        <Image
          source={ELUS_CENTER_SYMBOL}
          style={styles.centerCoreIcon}
          resizeMode="contain"
        />
      </View>

      {profiles.map((profile, index) => {
        const position = radarPositions[index];

        if (!position) {
          return null;
        }

        return (
          <RadarNode
            key={`radar-${profile.id}`}
            profile={profile}
            position={position}
            currentUserStatus={currentUserStatus}
          />
        );
      })}

      <View style={styles.fieldTextBox}>
        <View style={styles.fieldHeaderRow}>
          <Text style={styles.fieldEyebrow}>Campo ativo</Text>

          <View style={styles.livePill}>
            <View style={styles.liveDot} />
            <Text style={styles.livePillText}>Vivo</Text>
          </View>
        </View>

        <Text style={styles.fieldTitle}>Presença viva ao seu redor</Text>

        <Text style={styles.fieldDescription}>
          Toque no campo para abrir o mapa vivo com sinais aproximados, filtros e contexto da sua região.
        </Text>
      </View>
    </Pressable>
  );
}

function SignalAvatar({
  profile,
  currentUserStatus,
}: {
  profile: Profile;
  currentUserStatus: VerificationVisualStatus;
}) {
  const profileStatus = getProfileVerificationStatus(profile);
  const visibleProfileStatus = getVisibleProfileVerificationStatus({
    currentUserStatus,
    profileStatus,
  });
  const statusColor = getVerificationStatusColor(visibleProfileStatus);

  if (visibleProfileStatus !== 'verified') {
    const image = getVerificationStatusImage(visibleProfileStatus);

    return (
      <View
        style={[
          styles.signalAvatar,
          {
            borderColor: `${statusColor}66`,
            backgroundColor: `${statusColor}12`,
          },
        ]}
      >
        <Image
          source={image}
          style={styles.signalUnverifiedImage}
          resizeMode="contain"
        />
      </View>
    );
  }

  return (
    <View style={[styles.signalAvatar, styles.signalAvatarNeutral]}>
      <Image source={{ uri: profile.photoUrl }} style={styles.signalPhoto} />
    </View>
  );
}

function SignalCard({
  profile,
  currentUser,
  currentUserStatus,
}: {
  profile: Profile;
  currentUser: AppUser;
  currentUserStatus: VerificationVisualStatus;
}) {
  const router = useRouter();
  const [affinityExpanded, setAffinityExpanded] = React.useState(false);

  const currentUserCanUseFullApp = currentUserStatus === 'verified';
  const kind = getProfileSignalKind(profile);
  const color = getSignalColor(kind);
  const profileStatus = getProfileVerificationStatus(profile);
  const profileIsVerified = profileStatus === 'verified';
  const profileIsInReview = profileStatus === 'in_review';
  const shouldProtectVerifiedProfile = shouldProtectProfileVerificationStatus({
    currentUserStatus,
    profileStatus,
  });
  const visibleProfileStatus = getVisibleProfileVerificationStatus({
    currentUserStatus,
    profileStatus,
  });

  const localAffinityExplanation = getLocalAffinityExplanation({
    viewer: currentUser,
    target: profile,
    sharedReasons:
      profile.aiReasons.length > 0 ? profile.aiReasons : [getProfileReason(profile)],
  });

  const displayName = currentUserCanUseFullApp && profileIsVerified
    ? profile.name
    : getPublicProfileName(profile);

  const displayLabel = shouldProtectVerifiedProfile
    ? `${profile.kind} · perfil protegido`
    : profileIsVerified
      ? profile.kind
      : profileIsInReview
        ? `${profile.kind} · em análise`
        : `${profile.kind} · não verificado`;

  const displayDistance =
    currentUserCanUseFullApp && profileIsVerified
      ? getProfileDistanceLabel(profile)
      : getRestrictedLocation(profile);

  const affinityReasons = getCardAffinityReasons({
    profile,
    fallbackReasons: localAffinityExplanation.reasons,
  });

  const smallSecurityImage = getVerificationStatusImage(visibleProfileStatus);

  function openProfile() {
    router.push(`/profile/${profile.id}` as never);
  }

  return (
    <Pressable
      onPress={openProfile}
      style={({ pressed }) => [
        styles.signalCard,
        {
          borderColor: `${color}2E`,
        },
        pressed ? styles.pressed : null,
      ]}
    >
      <View style={styles.signalTop}>
        <SignalAvatar profile={profile} currentUserStatus={currentUserStatus} />

        <View style={styles.signalInfo}>
          <View style={styles.signalNameRow}>
            <Text
              style={[
                styles.signalName,
                !profileIsVerified
                  ? {
                      color: getProfileStatusColor(profile),
                    }
                  : null,
              ]}
              numberOfLines={1}
            >
              {displayName}
            </Text>

            <Image
              source={smallSecurityImage}
              style={styles.smallSecuritySymbol}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.signalLabel} numberOfLines={1}>
            {displayLabel}
          </Text>

          <Text style={styles.signalDistance}>{displayDistance}</Text>
        </View>

        <View
          style={[
            styles.signalKindIcon,
            {
              backgroundColor: `${color}18`,
              borderColor: `${color}55`,
            },
          ]}
        >
          <Ionicons name={getSignalIcon(kind)} size={16} color={color} />
        </View>
      </View>

      <View style={styles.aiReasonBox}>
        <View style={styles.aiReasonHeader}>
          <Ionicons name="sparkles-outline" size={14} color={COLORS.cyan} />
          <Text style={styles.aiReasonLabel}>Motivo da afinidade</Text>
        </View>

        <View style={styles.aiBullets}>
          {affinityReasons.map((reason, index) => (
            <View key={`${profile.id}-reason-${index}`} style={styles.aiBulletRow}>
              <View style={styles.aiBulletDot} />
              <Text style={styles.aiReasonText} numberOfLines={2}>
                {reason}
              </Text>
            </View>
          ))}
        </View>

        {affinityExpanded && (
          <View style={styles.affinityExpandedBox}>
            <Text style={styles.affinityExpandedText}>
              {localAffinityExplanation.text}
            </Text>
            {localAffinityExplanation.safetyNotice ? (
              <Text style={styles.affinitySafetyNotice}>
                {localAffinityExplanation.safetyNotice}
              </Text>
            ) : null}
          </View>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.affinityToggleButton,
            pressed ? styles.pressed : null,
          ]}
          onPress={() => setAffinityExpanded((v) => !v)}
        >
          <Text style={styles.affinityToggleText}>
            {affinityExpanded ? 'Ocultar explicação' : 'Por que essa afinidade?'}
          </Text>
          <Ionicons
            name={affinityExpanded ? 'chevron-up-outline' : 'chevron-down-outline'}
            size={13}
            color={COLORS.cyan}
          />
        </Pressable>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.profileActionButton,
          pressed ? styles.pressed : null,
        ]}
        onPress={openProfile}
      >
        <Text style={styles.profileActionButtonText}>Ver perfil</Text>
      </Pressable>
    </Pressable>
  );
}

function ContextCard({
  icon,
  title,
  text,
  color,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  text: string;
  color: string;
}) {
  return (
    <View style={styles.contextCard}>
      <View
        style={[
          styles.contextIconWrap,
          { backgroundColor: `${color}14`, borderColor: `${color}44` },
        ]}
      >
        <Ionicons name={icon} size={17} color={color} />
      </View>

      <Text style={styles.contextTitle}>{title}</Text>
      <Text style={styles.contextText}>{text}</Text>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { user, realUsers } = useApp();

  const currentVerificationStatus = getCurrentVerificationStatus(user);
  const verificationMeta = getVerificationMeta(currentVerificationStatus);

  const allProfiles = realUsers.map(appUserToProfile);
  const onlineProfiles = allProfiles.filter((profile) => profile.isOnline);

  const onlineProfileIds = new Set(onlineProfiles.map((profile) => profile.id));

  const radarProfiles = [
    ...onlineProfiles,
    ...allProfiles.filter((profile) => !onlineProfileIds.has(profile.id)),
  ].slice(0, radarPositions.length);

  const signalProfiles = (onlineProfiles.length > 0 ? onlineProfiles : allProfiles).slice(0, 3);

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroBlock}>
          <View style={styles.topBrandRow}>
            <View style={styles.topTextWrap}>
              <Text style={styles.topEyebrow}>ELUS</Text>
              <Text style={styles.topTitle}>Campo de Presença</Text>
            </View>

            <Image
              source={ELUS_LOGO}
              style={styles.topLogo}
              resizeMode="contain"
            />
          </View>

          <Text style={styles.topDescription}>
            Uma rede contextual viva para pessoas, empresas, serviços e oportunidades reais, sem expor localização exata.
          </Text>

          <View style={styles.statusRow}>
            <SmallStatusPill icon="radio-outline" text="Radar ativo" color={COLORS.cyan} />
            <SmallStatusPill
              icon={verificationMeta.icon}
              text={verificationMeta.pillText}
              color={verificationMeta.color}
            />
            <SmallStatusPill icon="sparkles-outline" text="IA contextual" color={COLORS.purple} />
          </View>
        </View>

        <FieldTrustNotice />

        <PresenceField
          profiles={radarProfiles}
          currentUserStatus={currentVerificationStatus}
          onPress={() => router.push('/presence-map' as never)}
        />

        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderTextWrap}>
            <Text style={styles.sectionEyebrow}>Sinais da região</Text>
            <Text style={styles.sectionTitle}>Presenças que combinam</Text>
          </View>

          <Pressable
            onPress={() => router.push('/(tabs)/connections' as never)}
            style={styles.sectionLinkButton}
          >
            <Text style={styles.sectionLink}>Ver rede</Text>
          </Pressable>
        </View>

        {signalProfiles.map((profile) => (
          <SignalCard
            key={profile.id}
            profile={profile}
            currentUser={user}
            currentUserStatus={currentVerificationStatus}
          />
        ))}

        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderTextWrap}>
            <Text style={styles.sectionEyebrow}>Descoberta</Text>
            <Text style={styles.sectionTitle}>Como usar o Campo</Text>
          </View>
        </View>

        <View style={styles.contextGrid}>
          <ContextCard
            icon="location-outline"
            title="Presença local"
            text="Veja sinais aproximados da sua região."
            color={COLORS.cyan}
          />

          <ContextCard
            icon="sparkles-outline"
            title="Motivo claro"
            text="Entenda por que uma presença apareceu."
            color={COLORS.purple}
          />

          <ContextCard
            icon="radio-outline"
            title="Mapa vivo"
            text="Abra o radar para explorar por perto."
            color={COLORS.gold}
          />

          <ContextCard
            icon="construct-outline"
            title="Ação simples"
            text="Toque no perfil para decidir o próximo passo."
            color={COLORS.green}
          />
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create<any>({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 122,
  },

  heroBlock: {
    width: '100%',
    marginBottom: 6,
  },

  topBrandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },

  topTextWrap: {
    flex: 1,
    minWidth: 0,
    paddingRight: 16,
  },

  topEyebrow: {
    fontSize: 10,
    lineHeight: 13,
    color: COLORS.cyan,
    fontWeight: '800',
    letterSpacing: 3,
    textTransform: 'uppercase',
    marginBottom: 6,
  },

  topTitle: {
    marginTop: 4,
    fontSize: 30,
    lineHeight: 36,
    color: COLORS.text,
    fontWeight: '350',
    letterSpacing: -0.5,
  },

  topLogo: {
    width: 70,
    height: 24,
    opacity: 0.86,
    marginTop: 2,
  },

  topDescription: {
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.mutedSoft,
    marginBottom: 14,
    maxWidth: 330,
  },

  statusRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },

  statusPill: {
    minHeight: 32,
    borderRadius: 16,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },

  statusPillText: {
    marginLeft: 6,
    fontSize: 10,
    fontWeight: '800',
  },

  fieldTrustNotice: {
    minHeight: 44,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 11,
    backgroundColor: 'rgba(38,217,255,0.075)',
    borderWidth: 1,
    borderColor: 'rgba(38,217,255,0.20)',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  fieldTrustIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(38,217,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(38,217,255,0.24)',
    marginRight: 10,
  },

  fieldTrustText: {
    flex: 1,
    color: COLORS.mutedSoft,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800',
  },

  fieldCard: {
    height: 282,
    borderRadius: 32,
    backgroundColor: COLORS.panelDeep,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    overflow: 'hidden',
    marginBottom: 16,
  },

  fieldCardPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },

  fieldBackgroundGlowOne: {
    position: 'absolute',
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: COLORS.cyanSoft,
    top: -86,
    right: -68,
  },

  fieldBackgroundGlowTwo: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: COLORS.purpleSoft,
    bottom: -90,
    left: -72,
  },

  radarCircleOuter: {
    position: 'absolute',
    width: 244,
    height: 244,
    borderRadius: 122,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    top: 22,
    left: 54,
  },

  radarCircleMiddle: {
    position: 'absolute',
    width: 172,
    height: 172,
    borderRadius: 86,
    borderWidth: 1,
    borderColor: 'rgba(38,217,255,0.16)',
    top: 58,
    left: 90,
  },

  radarCircleInner: {
    position: 'absolute',
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 1,
    borderColor: 'rgba(139,92,255,0.22)',
    top: 98,
    left: 130,
  },

  centerCore: {
    position: 'absolute',
    width: 58,
    height: 58,
    borderRadius: 29,
    top: 115,
    left: 147,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(38,217,255,0.26)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  centerCoreIcon: {
    width: 34,
    height: 34,
  },

  radarNode: {
    position: 'absolute',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  radarSymbolImage: {
    width: 18,
    height: 18,
  },

  fieldTextBox: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 18,
    padding: 14,
    borderRadius: 22,
    backgroundColor: 'rgba(5,7,13,0.78)',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  fieldHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },

  fieldEyebrow: {
    fontSize: 10,
    lineHeight: 13,
    color: COLORS.cyan,
    fontWeight: '800',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },

  livePill: {
    minHeight: 25,
    paddingHorizontal: 12,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(38,217,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(38,217,255,0.22)',
  },

  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.cyan,
    marginRight: 6,
  },

  livePillText: {
    color: COLORS.cyan,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },

  fieldTitle: {
    fontSize: 18,
    lineHeight: 23,
    color: COLORS.text,
    fontWeight: '800',
    marginBottom: 5,
  },

  fieldDescription: {
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.mutedSoft,
  },

  sectionHeader: {
    marginTop: 4,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },

  sectionHeaderTextWrap: {
    flex: 1,
    minWidth: 0,
    paddingRight: 12,
  },

  sectionEyebrow: {
    fontSize: 10,
    lineHeight: 13,
    color: COLORS.gold,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },

  sectionTitle: {
    fontSize: 29,
    lineHeight: 35,
    color: COLORS.text,
    fontWeight: '350',
    letterSpacing: -0.5,
  },

  sectionLinkButton: {
    paddingLeft: 8,
    paddingBottom: 4,
  },

  sectionLink: {
    fontSize: 12,
    color: COLORS.cyan,
    fontWeight: '800',
  },

  signalCard: {
    borderRadius: 25,
    padding: 15,
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    marginBottom: 14,
  },

  signalTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  signalAvatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.panelSoft,
    marginRight: 12,
    overflow: 'hidden',
  },

  signalAvatarNeutral: {
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: COLORS.panelSoft,
  },

  signalPhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },

  signalUnverifiedImage: {
    width: 36,
    height: 36,
  },

  signalInfo: {
    flex: 1,
    minWidth: 0,
  },

  signalNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },

  signalName: {
    flexShrink: 1,
    fontSize: 21,
    lineHeight: 26,
    color: COLORS.text,
    fontWeight: '400',
    marginRight: 7,
  },

  smallSecuritySymbol: {
    width: 15,
    height: 15,
  },

  signalLabel: {
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.mutedSoft,
    marginBottom: 2,
  },

  signalDistance: {
    fontSize: 11,
    lineHeight: 15,
    color: COLORS.muted,
    fontWeight: '750',
  },

  signalKindIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginLeft: 10,
  },

  aiReasonBox: {
    marginTop: 12,
    borderRadius: 18,
    padding: 11,
    backgroundColor: 'rgba(38,217,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(38,217,255,0.14)',
  },

  aiReasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 9,
  },

  aiReasonLabel: {
    marginLeft: 7,
    color: COLORS.cyan,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '900',
    letterSpacing: 1.3,
    textTransform: 'uppercase',
  },

  aiBullets: {
    gap: 7,
  },

  aiBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  aiBulletDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.cyan,
    marginTop: 6,
    marginRight: 8,
  },

  aiReasonText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.mutedSoft,
  },

  affinityExpandedBox: {
    marginTop: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(38,217,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(38,217,255,0.18)',
  },

  affinityExpandedText: {
    color: COLORS.mutedSoft,
    fontSize: 12,
    lineHeight: 19,
    fontWeight: '600',
  },

  affinitySafetyNotice: {
    marginTop: 8,
    color: 'rgba(157,187,255,0.80)',
    fontSize: 11,
    lineHeight: 17,
    fontWeight: '700',
    fontStyle: 'italic',
  },

  affinityToggleButton: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
  },

  affinityToggleText: {
    color: COLORS.cyan,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.3,
  },

  profileActionButton: {
    alignSelf: 'flex-start',
    marginTop: 11,
    borderRadius: 999,
    paddingHorizontal: 13,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.065)',
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  profileActionButtonText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '900',
  },

  contextGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  contextCard: {
    width: '48.5%',
    minHeight: 142,
    borderRadius: 22,
    backgroundColor: COLORS.panel,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    padding: 14,
    marginBottom: 12,
  },

  contextIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 12,
  },

  contextTitle: {
    fontSize: 13,
    lineHeight: 17,
    color: COLORS.text,
    fontWeight: '800',
    marginBottom: 6,
  },

  contextText: {
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.muted,
  },

  pressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },

  bottomSpace: {
    height: 20,
  },
});