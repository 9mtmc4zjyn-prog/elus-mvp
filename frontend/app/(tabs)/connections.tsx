import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useApp } from '../../src/context/AppContext';
import { appUserToProfile } from '../../src/utils/adaptSupabaseProfile';
import type { Profile } from '../../src/data/profiles';
import { Button } from '../../src/components/Button';
import { useTheme } from '../../src/theme/ThemeContext';
import type { ThemeColors } from '../../src/theme/theme';
import { fetchUnreadConversationsCount } from '../../src/utils/messagesApi';

const ELUS_SYMBOL = require('../../assets/brand/elus_symbol_main.png');
const ELUS_UNVERIFIED_RED = require('../../assets/images/elus-unverified-red.png');
const ELUS_VERIFIED_GREEN = require('../../assets/images/elus-verified-green.png');

const COLORS = {
  card: 'rgba(20,26,38,0.94)',
  muted: 'rgba(161,169,184,0.78)',
  soft: 'rgba(161,169,184,0.55)',
  blueLight: '#8FA3B8',
};

type VerificationPhase = 'verified' | 'in_review' | 'unverified';

type ActiveConnectionItem = {
  id: string;
  profile: Profile;
  label: string;
  color: string;
};

function normalizeText(value: string) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function normalizeId(value: string) {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function normalizeUserVerificationStatus(
  verificationStatus?: string,
  legacyVerified?: boolean
): VerificationPhase {
  const status = normalizeText(String(verificationStatus ?? ''));

  const verifiedStatuses = ['verified', 'verificado', 'approved', 'aprovado'];

  const inReviewStatuses = [
    'in_review',
    'review',
    'under_review',
    'awaiting',
    'awaiting_review',
    'aguardando',
    'aguardando_verificacao',
    'aguardando_verificação',
    'em_analise',
    'em_análise',
    'analysis_submitted',
    'submitted',
    'document_submitted',
    'documento_enviado',
    'doc_sent',
  ];

  const unverifiedStatuses = [
    '',
    'none',
    'unverified',
    'not_verified',
    'nao_verificado',
    'não_verificado',
    'pending',
    'pendente',
    'verification_pending',
    'verificacao_pendente',
    'verificação_pendente',
    'rejected',
    'recusado',
  ];

  if (inReviewStatuses.includes(status)) {
    return 'in_review';
  }

  if (verifiedStatuses.includes(status)) {
    return 'verified';
  }

  if (unverifiedStatuses.includes(status)) {
    return 'unverified';
  }

  if (legacyVerified === true) {
    return 'verified';
  }

  return 'unverified';
}

function getCurrentUserStatusColor(status: VerificationPhase, colors: ThemeColors) {
  if (status === 'verified') {
    return colors.success;
  }

  if (status === 'in_review') {
    return COLORS.blueLight;
  }

  return colors.danger;
}

function getCurrentUserStatusSymbol(status: VerificationPhase) {
  if (status === 'verified') {
    return ELUS_VERIFIED_GREEN;
  }

  if (status === 'in_review') {
    return ELUS_SYMBOL;
  }

  return ELUS_UNVERIFIED_RED;
}

function getStatusTitle(status: VerificationPhase) {
  if (status === 'verified') {
    return 'Conta verificada';
  }

  if (status === 'in_review') {
    return 'Aguardando verificação';
  }

  return 'Verificação pendente';
}

function getStatusText(status: VerificationPhase) {
  if (status === 'verified') {
    return 'Você pode acompanhar solicitações, respostas e vínculos reais nesta central.';
  }

  if (status === 'in_review') {
    return 'Sua verificação está em análise. Quando houver avanço, solicitações e vínculos aparecerão aqui.';
  }

  return 'Conclua a verificação para ativar solicitações, respostas e vínculos reais no ELUS.';
}

function getProfileName(profile: Profile) {
  const rawProfile = profile as any;

  return String(rawProfile.name ?? rawProfile.fullName ?? 'Perfil ELUS');
}

function getFirstName(profile: Profile) {
  const rawProfile = profile as any;
  const firstName = rawProfile.firstName;

  if (firstName) {
    return String(firstName);
  }

  return getProfileName(profile).split(' ')[0] || getProfileName(profile);
}

function getProfilePhotoUrl(profile: Profile) {
  const rawProfile = profile as any;

  return rawProfile.photoUrl ?? rawProfile.avatarUrl ?? rawProfile.imageUrl ?? '';
}

function getProfileConnectionCandidates(profile: Profile) {
  const rawProfile = profile as any;
  const profileId = String(rawProfile.id ?? '');
  const firstName = getFirstName(profile);
  const fullName = getProfileName(profile);

  const baseCandidates = [
    rawProfile.id,
    rawProfile.userId,
    rawProfile.profileId,
    rawProfile.targetUserId,
    rawProfile.targetId,
    profileId,
    normalizeId(profileId),
    normalizeId(firstName),
    normalizeId(fullName),
  ]
    .filter(Boolean)
    .map((item) => String(item));

  const expandedCandidates = baseCandidates.flatMap((item) => {
    const normalized = normalizeId(item);

    return [item, normalized, `user_${normalized}`];
  });

  return Array.from(new Set(expandedCandidates.filter(Boolean)));
}

function getConnectionUserIds(connection: unknown) {
  if (typeof connection === 'string' || typeof connection === 'number') {
    return [String(connection)];
  }

  if (connection && typeof connection === 'object') {
    const value = connection as Record<string, unknown>;

    return [
      value.profileId,
      value.targetProfileId,
      value.targetId,
      value.userId,
      value.fromUserId,
      value.toUserId,
      value.id,
    ]
      .filter(Boolean)
      .map((item) => String(item));
  }

  return [];
}

function isAcceptedConnectionRecord(connection: unknown) {
  if (!connection || typeof connection !== 'object') {
    return false;
  }

  const value = connection as Record<string, unknown>;

  const rawStatus = normalizeText(
    String(
      value.status ??
        value.state ??
        value.connectionStatus ??
        value.requestStatus ??
        ''
    )
  );

  const acceptedByStatus =
    rawStatus === 'accepted' ||
    rawStatus === 'approved' ||
    rawStatus === 'active' ||
    rawStatus === 'connected' ||
    rawStatus === 'aceita' ||
    rawStatus === 'aceito' ||
    rawStatus === 'aprovada' ||
    rawStatus === 'aprovado' ||
    rawStatus === 'ativa' ||
    rawStatus === 'ativo' ||
    rawStatus === 'conectado';

  const acceptedByBoolean =
    value.accepted === true ||
    value.approved === true ||
    value.isAccepted === true ||
    value.isApproved === true ||
    value.isActive === true;

  return acceptedByStatus || acceptedByBoolean;
}

function branchHasAcceptedProfile(branch: any, profile: Profile) {
  if (!Array.isArray(branch?.connections)) {
    return false;
  }

  const profileCandidates = getProfileConnectionCandidates(profile);

  return branch.connections.some((connection: unknown) => {
    const connectionUserIds = getConnectionUserIds(connection);
    const profileIdMatches = connectionUserIds.some((id) =>
      profileCandidates.includes(id)
    );

    return profileIdMatches && isAcceptedConnectionRecord(connection);
  });
}

function getAcceptedConnectionsCount(connectionBranches: any[]) {
  return connectionBranches.reduce((total, branch) => {
    if (!Array.isArray(branch?.connections)) {
      return total;
    }

    return (
      total +
      branch.connections.filter((connection: unknown) =>
        isAcceptedConnectionRecord(connection)
      ).length
    );
  }, 0);
}

function getConnectionLabel(branch: any, connection: unknown) {
  const rawConnection = connection as Record<string, unknown>;
  const kind = normalizeText(String(rawConnection?.kind ?? branch?.kind ?? ''));

  if (kind === 'family') {
    return 'Família';
  }

  if (kind === 'company' || kind === 'professional') {
    return 'Profissional';
  }

  if (kind === 'interest') {
    return 'Interesse';
  }

  if (kind === 'preference') {
    return 'Preferência';
  }

  if (kind === 'service') {
    return 'Serviço';
  }

  if (kind === 'friend' || kind === 'friendship') {
    return 'Amizade';
  }

  if (kind === 'assisted' || kind === 'support') {
    return 'Apoio';
  }

  return String(branch?.title ?? 'Vínculo');
}

function getConnectionColor(branch: any, connection: unknown, colors: ThemeColors) {
  const rawConnection = connection as Record<string, unknown>;
  const kind = normalizeText(String(rawConnection?.kind ?? branch?.kind ?? ''));

  if (kind === 'family') {
    return colors.accent;
  }

  if (kind === 'company' || kind === 'professional') {
    return colors.warning;
  }

  if (kind === 'interest') {
    return '#2DD4BF';
  }

  if (kind === 'preference') {
    return '#A855F7';
  }

  if (kind === 'service') {
    return '#A8C4DA';
  }

  if (kind === 'friend' || kind === 'friendship') {
    return '#94A3B8';
  }

  if (kind === 'assisted' || kind === 'support') {
    return '#F59E0B';
  }

  return String(branch?.color ?? colors.success);
}

function getAcceptedConnectionItems({
  connectionBranches,
  profiles,
  colors,
}: {
  connectionBranches: any[];
  profiles: Profile[];
  colors: ThemeColors;
}) {
  const items: ActiveConnectionItem[] = [];
  const usedProfileIds = new Set<string>();

  connectionBranches.forEach((branch) => {
    if (!Array.isArray(branch?.connections)) {
      return;
    }

    branch.connections.forEach((connection: unknown) => {
      if (!isAcceptedConnectionRecord(connection)) {
        return;
      }

      const matchedProfile = profiles.find((profile) =>
        branchHasAcceptedProfile(
          {
            ...branch,
            connections: [connection],
          },
          profile
        )
      );

      if (!matchedProfile) {
        return;
      }

      const profileId = String(
        (matchedProfile as any).id ?? getProfileName(matchedProfile)
      );

      if (usedProfileIds.has(profileId)) {
        return;
      }

      usedProfileIds.add(profileId);

      items.push({
        id: `${profileId}-${String((connection as any)?.id ?? items.length)}`,
        profile: matchedProfile,
        label: getConnectionLabel(branch, connection),
        color: getConnectionColor(branch, connection, colors),
      });
    });
  });

  return items;
}

function ConnectionCoreIcon({
  color,
  locked = false,
}: {
  color: string;
  locked?: boolean;
}) {
  return (
    <View style={styles.connectionCoreIcon}>
      <View style={[styles.connectionOrbitOuter, { borderColor: `${color}44` }]} />
      <View style={[styles.connectionOrbitInner, { borderColor: `${color}26` }]} />
      <View style={[styles.connectionLineHorizontal, { backgroundColor: `${color}48` }]} />
      <View style={[styles.connectionLineDiagonalOne, { backgroundColor: `${color}38` }]} />
      <View style={[styles.connectionLineDiagonalTwo, { backgroundColor: `${color}38` }]} />

      <View
        style={[
          styles.connectionNodeCenter,
          {
            borderColor: `${color}A8`,
            backgroundColor: `${color}1F`,
          },
        ]}
      >
        <View
          style={[
            styles.connectionNodeDot,
            {
              backgroundColor: color,
              opacity: locked ? 0.68 : 1,
            },
          ]}
        />
      </View>

      <View
        style={[
          styles.connectionNodeSmall,
          styles.connectionNodeTop,
          {
            backgroundColor: color,
            opacity: locked ? 0.55 : 0.9,
          },
        ]}
      />

      <View
        style={[
          styles.connectionNodeSmall,
          styles.connectionNodeLeft,
          {
            backgroundColor: color,
            opacity: locked ? 0.45 : 0.75,
          },
        ]}
      />

      <View
        style={[
          styles.connectionNodeSmall,
          styles.connectionNodeRight,
          {
            backgroundColor: color,
            opacity: locked ? 0.45 : 0.75,
          },
        ]}
      />
    </View>
  );
}

function RequestFlowIcon({ color }: { color: string }) {
  return (
    <View style={styles.requestFlowIcon}>
      <View style={[styles.requestFlowLineTop, { backgroundColor: `${color}46` }]} />
      <View style={[styles.requestFlowLineBottom, { backgroundColor: `${color}34` }]} />

      <View
        style={[
          styles.requestFlowNode,
          styles.requestFlowNodeLeft,
          {
            borderColor: `${color}78`,
            backgroundColor: `${color}18`,
          },
        ]}
      >
        <View style={[styles.requestFlowDot, { backgroundColor: color }]} />
      </View>

      <View
        style={[
          styles.requestFlowNode,
          styles.requestFlowNodeRight,
          {
            borderColor: `${color}78`,
            backgroundColor: `${color}18`,
          },
        ]}
      >
        <View style={[styles.requestFlowDot, { backgroundColor: color }]} />
      </View>

      <View
        style={[
          styles.requestFlowNodeCenter,
          {
            borderColor: `${color}A0`,
            backgroundColor: `${color}22`,
          },
        ]}
      >
        <View style={[styles.requestFlowDotCenter, { backgroundColor: color }]} />
      </View>
    </View>
  );
}

function PlainAvatar({ profile, size = 54 }: { profile: Profile; size?: number }) {
  const { colors } = useTheme();
  const photoUrl = getProfilePhotoUrl(profile);
  const innerSize = size - 6;

  return (
    <View
      style={[
        styles.avatarShell,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      {photoUrl ? (
        <Image
          source={{ uri: photoUrl }}
          style={{
            width: innerSize,
            height: innerSize,
            borderRadius: innerSize / 2,
          }}
          resizeMode="cover"
        />
      ) : (
        <Text style={[styles.avatarFallbackText, { color: colors.text }]}>
          {getFirstName(profile).slice(0, 2).toUpperCase()}
        </Text>
      )}
    </View>
  );
}

function ConnectionsSummary({
  currentUserVerified,
  currentUserStatus,
  activeConnectionsCount,
  onOpenActiveConnections,
}: {
  currentUserVerified: boolean;
  currentUserStatus: VerificationPhase;
  activeConnectionsCount: number;
  onOpenActiveConnections?: () => void;
}) {
  const { colors } = useTheme();
  const statusColor = currentUserVerified
    ? colors.accent
    : getCurrentUserStatusColor(currentUserStatus, colors);

  const summaryContent = (
    <>
      <View
        style={[
          styles.summaryIconCircle,
          {
            borderColor: `${statusColor}36`,
            backgroundColor: `${statusColor}10`,
          },
        ]}
      >
        <ConnectionCoreIcon color={statusColor} locked={!currentUserVerified} />
      </View>

      <View style={styles.summaryTextBox}>
        <Text
          style={[
            styles.summaryTitle,
            {
              color: statusColor,
            },
          ]}
        >
          {activeConnectionsCount === 1
            ? '1 conexão real ativa'
            : `${activeConnectionsCount} conexões reais ativas`}
        </Text>

        <Text style={styles.summaryText}>
          Quando um vínculo for aprovado, ele aparecerá aqui com tipo, status e
          acesso ao perfil.
        </Text>
      </View>
    </>
  );

  if (activeConnectionsCount > 0) {
    return (
      <Pressable
        style={({ pressed }) => [
          styles.summaryCard,
          {
            borderColor: `${statusColor}34`,
          },
          pressed ? styles.pressedSmall : null,
        ]}
        onPress={onOpenActiveConnections}
      >
        {summaryContent}
      </Pressable>
    );
  }

  return (
    <View
      style={[
        styles.summaryCard,
        {
          borderColor: `${statusColor}34`,
        },
      ]}
    >
      {summaryContent}
    </View>
  );
}

function AccountStatusCard({
  currentUserStatus,
  onPressVerification,
}: {
  currentUserStatus: VerificationPhase;
  onPressVerification: () => void;
}) {
  const { colors } = useTheme();
  const statusColor = getCurrentUserStatusColor(currentUserStatus, colors);
  const statusSymbol = getCurrentUserStatusSymbol(currentUserStatus);
  const verified = currentUserStatus === 'verified';

  return (
    <View
      style={[
        styles.statusCard,
        {
          backgroundColor: `${statusColor}10`,
          borderColor: `${statusColor}34`,
        },
      ]}
    >
      <View
        style={[
          styles.statusIconBox,
          {
            backgroundColor: `${statusColor}12`,
            borderColor: `${statusColor}32`,
          },
        ]}
      >
        <Image source={statusSymbol} style={styles.statusIcon} resizeMode="contain" />
      </View>

      <View style={styles.statusTextBox}>
        <Text style={[styles.cardKicker, { color: colors.warning }]}>Status da conta</Text>

        <Text
          style={[
            styles.statusTitle,
            {
              color: statusColor,
            },
          ]}
        >
          {getStatusTitle(currentUserStatus)}
        </Text>

        <Text style={styles.statusText}>{getStatusText(currentUserStatus)}</Text>

        <Text style={[styles.statusGuide, { color: colors.text }]}>
          Acompanhe tudo por aqui. Quando houver avanço, o status aparecerá nas
          áreas de solicitações e vínculos.
        </Text>

        {!verified ? (
          <Button
            label="Ver status da verificação →"
            variant="primary"
            onPress={onPressVerification}
          />
        ) : null}
      </View>
    </View>
  );
}

function RequestsAccessCard({
  currentUserVerified,
  currentUserStatus,
  onOpenRequests,
}: {
  currentUserVerified: boolean;
  currentUserStatus: VerificationPhase;
  onOpenRequests: () => void;
}) {
  const { colors } = useTheme();
  const statusColor = currentUserVerified
    ? colors.success
    : getCurrentUserStatusColor(currentUserStatus, colors);

  return (
    <View
      style={[
        styles.requestsAccessCard,
        {
          borderColor: `${statusColor}34`,
          backgroundColor: `${statusColor}10`,
        },
      ]}
    >
      <View
        style={[
          styles.requestsAccessIconBox,
          {
            borderColor: `${statusColor}38`,
            backgroundColor: `${statusColor}12`,
          },
        ]}
      >
        <RequestFlowIcon color={statusColor} />
      </View>

      <View style={styles.requestsAccessInfo}>
        <Text style={[styles.cardKicker, { color: colors.warning }]}>Solicitações</Text>

        <Text
          style={[
            styles.requestsAccessTitle,
            {
              color: statusColor,
            },
          ]}
        >
          Solicitações em acompanhamento
        </Text>

        <Text style={styles.requestsAccessText}>
          Abra para acompanhar pedidos recebidos, enviados e informações
          compartilhadas quando existirem.
        </Text>

        <Button
          label="Abrir solicitações →"
          variant="secondary"
          onPress={onOpenRequests}
        />
      </View>
    </View>
  );
}

function MessagesAccessCard({
  currentUserVerified,
  currentUserStatus,
  unreadCount,
  onOpenMessages,
}: {
  currentUserVerified: boolean;
  currentUserStatus: VerificationPhase;
  unreadCount: number;
  onOpenMessages: () => void;
}) {
  const { colors } = useTheme();
  const statusColor = currentUserVerified
    ? colors.accent
    : getCurrentUserStatusColor(currentUserStatus, colors);

  return (
    <View
      style={[
        styles.requestsAccessCard,
        {
          borderColor: `${statusColor}34`,
          backgroundColor: `${statusColor}10`,
        },
      ]}
    >
      <View
        style={[
          styles.requestsAccessIconBox,
          {
            borderColor: `${statusColor}38`,
            backgroundColor: `${statusColor}12`,
          },
        ]}
      >
        <Ionicons name="chatbubbles-outline" size={26} color={statusColor} />

        {unreadCount > 0 ? (
          <View style={[styles.unreadBadge, { backgroundColor: colors.danger, borderColor: colors.background }]}>
            <Text style={styles.unreadBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.requestsAccessInfo}>
        <Text style={[styles.cardKicker, { color: colors.warning }]}>
          Mensagens{unreadCount > 0 ? ` · ${unreadCount} nova${unreadCount > 1 ? 's' : ''}` : ''}
        </Text>

        <Text
          style={[
            styles.requestsAccessTitle,
            {
              color: statusColor,
            },
          ]}
        >
          Conversas com conexões aprovadas
        </Text>

        <Text style={styles.requestsAccessText}>
          Só entre perfis com conexão real aceita. Nenhum gate de plano.
        </Text>

        <Button
          label="Abrir mensagens →"
          variant="secondary"
          onPress={onOpenMessages}
        />
      </View>
    </View>
  );
}

function ActiveConnectionsList({
  items,
  onOpenProfile,
  onLayout,
}: {
  items: ActiveConnectionItem[];
  onOpenProfile: (profileId: string) => void;
  onLayout: (event: any) => void;
}) {
  const { colors } = useTheme();

  if (items.length === 0) {
    return null;
  }

  return (
    <View style={styles.activeConnectionsSection} onLayout={onLayout}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Conexões reais ativas</Text>

      <Text style={styles.sectionHint}>
        Vínculos aprovados ficam organizados aqui com tipo e acesso ao perfil.
      </Text>

      {items.map((item) => (
        <Pressable
          key={item.id}
          style={({ pressed }) => [
            styles.activeConnectionCard,
            pressed ? styles.pressedSmall : null,
          ]}
          onPress={() => onOpenProfile(String((item.profile as any).id))}
        >
          <PlainAvatar profile={item.profile} size={54} />

          <View style={styles.activeConnectionInfo}>
            <Text style={[styles.activeConnectionName, { color: colors.text }]} numberOfLines={1}>
              {getProfileName(item.profile)}
            </Text>

            <Text style={styles.activeConnectionMeta} numberOfLines={1}>
              {item.label} · Conexão aceita
            </Text>
          </View>

          <View
            style={[
              styles.activeConnectionBadge,
              {
                borderColor: `${item.color}55`,
                backgroundColor: `${item.color}12`,
              },
            ]}
          >
            <Text
              style={[
                styles.activeConnectionBadgeText,
                {
                  color: item.color,
                },
              ]}
            >
              Ativa
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
}

function ConnectionsErrorCard({ onRetry }: { onRetry: () => void }) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.statusCard,
        {
          backgroundColor: `${colors.danger}10`,
          borderColor: `${colors.danger}34`,
          marginTop: 26,
        },
      ]}
    >
      <View style={styles.statusTextBox}>
        <Text style={[styles.cardKicker, { color: colors.warning }]}>Erro de carregamento</Text>

        <Text style={[styles.statusTitle, { color: colors.danger }]}>
          Não foi possível carregar suas conexões
        </Text>

        <Text style={styles.statusText}>
          Verifique sua conexão com a internet e tente novamente. Se o problema persistir, reabra o aplicativo.
        </Text>

        <Button
          label="Tentar novamente →"
          variant="secondary"
          onPress={onRetry}
        />
      </View>
    </View>
  );
}

function HistoryCard() {
  const { colors } = useTheme();

  return (
    <View style={styles.historyCard}>
      <Text style={[styles.historyKicker, { color: colors.warning }]}>Histórico</Text>

      <Text style={[styles.historyTitle, { color: colors.text }]}>
        Tudo que virar vínculo aparece nesta tela.
      </Text>

      <Text style={styles.historyText}>
        Use esta área para acompanhar conexões ativas, solicitações enviadas,
        pedidos recebidos, informações compartilhadas e próximos passos.
      </Text>
    </View>
  );
}

export default function ConnectionsScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView | null>(null);
  const activeConnectionsY = useRef(0);
  const { colors } = useTheme();

  const { user, getConnectionBranches, realUsers } = useApp() as any;

  const currentUserStatus = normalizeUserVerificationStatus(
    user?.verificationStatus,
    user?.verified
  );

  const currentUserVerified = currentUserStatus === 'verified';

  const allProfiles = (realUsers as any[]).map(appUserToProfile) as Profile[];

  const [retryCount, setRetryCount] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const [connectionBranches, setConnectionBranches] = useState<any[]>([]);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0);

  useFocusEffect(
    React.useCallback(() => {
      if (!user?.id) return;
      fetchUnreadConversationsCount(user.id).then(setUnreadMessagesCount);
    }, [user?.id])
  );

  useEffect(() => {
    setLoadError(false);
    try {
      if (typeof getConnectionBranches !== 'function') {
        setConnectionBranches([]);
        return;
      }
      const branches = getConnectionBranches();
      if (!Array.isArray(branches)) {
        setConnectionBranches([]);
        return;
      }
      setConnectionBranches(
        branches.filter((branch: any) => Array.isArray(branch?.connections))
      );
    } catch {
      setLoadError(true);
      setConnectionBranches([]);
    }
  }, [getConnectionBranches, retryCount]);

  const activeConnectionsCount = currentUserVerified
    ? getAcceptedConnectionsCount(connectionBranches)
    : 0;

  const activeConnectionItems = useMemo(() => {
    if (!currentUserVerified) {
      return [];
    }

    return getAcceptedConnectionItems({
      connectionBranches,
      profiles: allProfiles,
      colors,
    });
  }, [connectionBranches, currentUserVerified, allProfiles, colors]);

  function openProfile(profileId: string) {
    router.push(`/profile/${profileId}` as never);
  }

  function openVerification() {
    router.push('/verification' as never);
  }

  function openRequests() {
    router.push('/(tabs)/requests' as never);
  }

  function openMessages() {
    router.push('/messages' as never);
  }

  function openActiveConnections() {
    if (activeConnectionItems.length === 0) {
      return;
    }

    scrollRef.current?.scrollTo({
      y: Math.max(activeConnectionsY.current - 18, 0),
      animated: true,
    });
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBrandRow}>
          <Text style={[styles.pageKicker, { color: colors.accent }]}>ELUS</Text>

          <Image
            source={ELUS_SYMBOL}
            style={styles.headerBrandSymbol}
            resizeMode="contain"
          />
        </View>

        <Text style={[styles.pageTitle, { color: colors.text }]}>Vínculos</Text>

        <Text style={styles.pageSubtitle}>
          Acompanhe conexões reais, solicitações recebidas, solicitações enviadas
          e histórico em um só painel.
        </Text>

        {loadError ? (
          <ConnectionsErrorCard onRetry={() => setRetryCount((c) => c + 1)} />
        ) : (
          <>
            <ConnectionsSummary
              currentUserVerified={currentUserVerified}
              currentUserStatus={currentUserStatus}
              activeConnectionsCount={activeConnectionsCount}
              onOpenActiveConnections={openActiveConnections}
            />

            <AccountStatusCard
              currentUserStatus={currentUserStatus}
              onPressVerification={openVerification}
            />

            <RequestsAccessCard
              currentUserVerified={currentUserVerified}
              currentUserStatus={currentUserStatus}
              onOpenRequests={openRequests}
            />

            <MessagesAccessCard
              currentUserVerified={currentUserVerified}
              currentUserStatus={currentUserStatus}
              unreadCount={unreadMessagesCount}
              onOpenMessages={openMessages}
            />

            <ActiveConnectionsList
              items={activeConnectionItems}
              onOpenProfile={openProfile}
              onLayout={(event) => {
                activeConnectionsY.current = event.nativeEvent.layout.y;
              }}
            />

            <HistoryCard />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },

  scroll: {
    flex: 1,
  },

  content: {
    paddingTop: 34,
    paddingHorizontal: 18,
    paddingBottom: 122,
  },

  topBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  pageKicker: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 4,
    textTransform: 'uppercase',
  },

  headerBrandSymbol: {
    width: 34,
    height: 34,
    opacity: 0.92,
  },

  pageTitle: {
    marginTop: 12,
    fontSize: 42,
    lineHeight: 48,
    fontWeight: '300',
    letterSpacing: -1.1,
  },

  pageSubtitle: {
    marginTop: 12,
    color: COLORS.muted,
    fontSize: 18,
    lineHeight: 28,
  },

  summaryCard: {
    marginTop: 26,
    padding: 18,
    borderRadius: 28,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  summaryIconCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },

  connectionCoreIcon: {
    width: 40,
    height: 40,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },

  connectionOrbitOuter: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
  },

  connectionOrbitInner: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
  },

  connectionLineHorizontal: {
    position: 'absolute',
    width: 25,
    height: 2,
    borderRadius: 999,
    left: 8,
    top: 19,
  },

  connectionLineDiagonalOne: {
    position: 'absolute',
    width: 24,
    height: 2,
    borderRadius: 999,
    left: 8,
    top: 14,
    transform: [{ rotate: '34deg' }],
  },

  connectionLineDiagonalTwo: {
    position: 'absolute',
    width: 24,
    height: 2,
    borderRadius: 999,
    left: 8,
    top: 24,
    transform: [{ rotate: '-34deg' }],
  },

  connectionNodeCenter: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  connectionNodeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  connectionNodeSmall: {
    position: 'absolute',
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  connectionNodeTop: {
    top: 3,
    left: 17,
  },

  connectionNodeLeft: {
    left: 4,
    top: 25,
  },

  connectionNodeRight: {
    right: 4,
    top: 25,
  },

  summaryTextBox: {
    flex: 1,
  },

  summaryTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '900',
  },

  summaryText: {
    marginTop: 6,
    color: COLORS.muted,
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '700',
  },

  statusCard: {
    marginTop: 18,
    padding: 18,
    borderRadius: 30,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  statusIconBox: {
    width: 56,
    height: 56,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },

  statusIcon: {
    width: 38,
    height: 38,
  },

  statusTextBox: {
    flex: 1,
  },

  cardKicker: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2.6,
    textTransform: 'uppercase',
  },

  statusTitle: {
    marginTop: 7,
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '900',
  },

  statusText: {
    marginTop: 9,
    color: COLORS.muted,
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '700',
  },

  statusGuide: {
    marginTop: 12,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '800',
  },

  requestsAccessCard: {
    marginTop: 18,
    padding: 17,
    borderRadius: 28,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  requestsAccessIconBox: {
    width: 54,
    height: 54,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    position: 'relative',
  },

  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },

  unreadBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },

  requestFlowIcon: {
    width: 38,
    height: 38,
    position: 'relative',
  },

  requestFlowLineTop: {
    position: 'absolute',
    width: 23,
    height: 2,
    borderRadius: 999,
    left: 8,
    top: 13,
    transform: [{ rotate: '18deg' }],
  },

  requestFlowLineBottom: {
    position: 'absolute',
    width: 24,
    height: 2,
    borderRadius: 999,
    left: 8,
    top: 24,
    transform: [{ rotate: '-18deg' }],
  },

  requestFlowNode: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  requestFlowNodeLeft: {
    left: 1,
    top: 17,
  },

  requestFlowNodeRight: {
    right: 1,
    top: 17,
  },

  requestFlowNodeCenter: {
    position: 'absolute',
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    left: 10,
    top: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },

  requestFlowDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },

  requestFlowDotCenter: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },

  requestsAccessInfo: {
    flex: 1,
  },

  requestsAccessTitle: {
    marginTop: 6,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '900',
  },

  requestsAccessText: {
    marginTop: 7,
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
  },

  activeConnectionsSection: {
    marginTop: 22,
  },

  sectionTitle: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '900',
  },

  sectionHint: {
    marginTop: 6,
    marginBottom: 12,
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
  },

  activeConnectionCard: {
    padding: 15,
    borderRadius: 24,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.28)',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  avatarShell: {
    backgroundColor: '#05060A',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  avatarFallbackText: {
    fontSize: 18,
    fontWeight: '900',
  },

  activeConnectionInfo: {
    flex: 1,
    marginLeft: 12,
    minWidth: 0,
  },

  activeConnectionName: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: '900',
  },

  activeConnectionMeta: {
    marginTop: 3,
    color: COLORS.muted,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '700',
  },

  activeConnectionBadge: {
    marginLeft: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },

  activeConnectionBadgeText: {
    fontSize: 12,
    fontWeight: '900',
  },

  historyCard: {
    marginTop: 22,
    padding: 20,
    borderRadius: 28,
    backgroundColor: 'rgba(217,180,106,0.075)',
    borderWidth: 1,
    borderColor: 'rgba(217,180,106,0.24)',
  },

  historyKicker: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },

  historyTitle: {
    marginTop: 10,
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '900',
  },

  historyText: {
    marginTop: 10,
    color: COLORS.muted,
    fontSize: 15,
    lineHeight: 24,
    fontWeight: '700',
  },

  pressedSmall: {
    opacity: 0.72,
    transform: [{ scale: 0.97 }],
  },
});
