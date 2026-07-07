import React, { useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme';
import { useApp } from '../../src/context/AppContext';
import type {
  AppUser,
  ConnectionKind,
  ContactInformationRequest,
} from '../../src/context/AppContext';
import { getContactMethodById } from '../../src/data/contactMethods';

type IconName = keyof typeof Ionicons.glyphMap;
type IdentityPhase = 'verified' | 'in_review' | 'unverified';

function transparentColor(hexColor: string, opacity: number) {
  if (!hexColor || !hexColor.startsWith('#') || hexColor.length !== 7) {
    return 'rgba(255,255,255,0.06)';
  }

  const red = parseInt(hexColor.slice(1, 3), 16);
  const green = parseInt(hexColor.slice(3, 5), 16);
  const blue = parseInt(hexColor.slice(5, 7), 16);

  return `rgba(${red},${green},${blue},${opacity})`;
}

function normalizeText(value: string) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function normalizeIdentityPhase(
  verificationStatus?: string,
  legacyVerified?: boolean,
  canRequestConnections?: boolean
): IdentityPhase {
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
    if (!status && (legacyVerified === true || canRequestConnections === true)) {
      return 'verified';
    }

    return 'unverified';
  }

  if (legacyVerified === true || canRequestConnections === true) {
    return 'verified';
  }

  return 'unverified';
}

function connectionIcon(kind: ConnectionKind): IconName {
  if (kind === 'family') return 'people-outline';
  if (kind === 'company') return 'business-outline';
  if (kind === 'interest') return 'sparkles-outline';
  if (kind === 'preference') return 'heart-outline';
  if (kind === 'service') return 'construct-outline';
  if (kind === 'assisted') return 'accessibility-outline';

  return 'infinite-outline';
}

function isPendingRequestStatus(status: string) {
  const normalizedStatus = normalizeText(status);

  return (
    normalizedStatus === 'pending' ||
    normalizedStatus === 'pendente' ||
    normalizedStatus === ''
  );
}

function isAcceptedRequestStatus(status: string) {
  const normalizedStatus = normalizeText(status);

  return (
    normalizedStatus === 'accepted' ||
    normalizedStatus === 'approved' ||
    normalizedStatus === 'active' ||
    normalizedStatus === 'connected' ||
    normalizedStatus === 'aceita' ||
    normalizedStatus === 'aceito' ||
    normalizedStatus === 'aprovada' ||
    normalizedStatus === 'aprovado' ||
    normalizedStatus === 'ativa' ||
    normalizedStatus === 'ativo'
  );
}

function isRejectedRequestStatus(status: string) {
  const normalizedStatus = normalizeText(status);

  return (
    normalizedStatus === 'rejected' ||
    normalizedStatus === 'declined' ||
    normalizedStatus === 'recusada' ||
    normalizedStatus === 'recusado' ||
    normalizedStatus === 'negada' ||
    normalizedStatus === 'negado'
  );
}

function getRequestStatusMeta({
  status,
  canBecomeRealConnection,
  blockedColor,
}: {
  status: string;
  canBecomeRealConnection: boolean;
  blockedColor: string;
}) {
  if (isAcceptedRequestStatus(status)) {
    if (canBecomeRealConnection) {
      return {
        label: 'Aceita',
        color: '#34D399',
      };
    }

    return {
      label: 'Bloqueada',
      color: blockedColor,
    };
  }

  if (isRejectedRequestStatus(status)) {
    return {
      label: 'Recusada',
      color: '#E26D6D',
    };
  }

  return {
    label: 'Pendente',
    color: '#D6A84F',
  };
}

function getContactRequestStatusMeta(status: string) {
  if (isAcceptedRequestStatus(status)) {
    return {
      label: 'Compartilhada',
      color: '#34D399',
    };
  }

  if (isRejectedRequestStatus(status)) {
    return {
      label: 'Recusada',
      color: '#E26D6D',
    };
  }

  return {
    label: 'Pendente',
    color: '#D6A84F',
  };
}

function getGateMeta(currentUserPhase: IdentityPhase) {
  if (currentUserPhase === 'verified') {
    return {
      title: 'Solicitações liberadas',
      text:
        'Você pode aceitar solicitações de conexão quando os dois lados estiverem verificados e pode acompanhar pedidos de informações separadamente.',
      color: '#34D399',
      borderColor: 'rgba(52,211,153,0.30)',
      backgroundColor: 'rgba(52,211,153,0.08)',
      icon: 'shield-checkmark-outline' as IconName,
      buttonLabel: 'Ver conexões',
    };
  }

  if (currentUserPhase === 'in_review') {
    return {
      title: 'Aguardando aprovação',
      text:
        'Sua verificação foi enviada, mas ainda depende de aprovação. Até a confirmação, você pode acompanhar solicitações, mas não pode iniciar ações sensíveis.',
      color: '#9DBBFF',
      borderColor: 'rgba(157,187,255,0.36)',
      backgroundColor: 'rgba(157,187,255,0.11)',
      icon: 'time-outline' as IconName,
      buttonLabel: 'Ver status da análise',
    };
  }

  return {
    title: 'Verificação pendente',
    text:
      'Finalize a verificação de identidade para criar, aceitar ou solicitar conexões reais no ELUS.',
    color: '#EF4444',
    borderColor: 'rgba(239,68,68,0.36)',
    backgroundColor: 'rgba(239,68,68,0.11)',
    icon: 'shield-outline' as IconName,
    buttonLabel: 'Verificar identidade',
  };
}

function getBlockedColor(phase: IdentityPhase) {
  if (phase === 'in_review') {
    return '#9DBBFF';
  }

  if (phase === 'verified') {
    return '#34D399';
  }

  return '#EF4444';
}

function findUserById(users: AppUser[], userId: string) {
  return users.find((item) => item.id === userId);
}

function getUserPhaseFromUser(appUser?: AppUser): IdentityPhase {
  return normalizeIdentityPhase(
    appUser?.verificationStatus,
    appUser?.verified,
    false
  );
}

function getFirstNameFromUser(appUser?: AppUser) {
  const name = String(appUser?.name || 'Usuário').trim();

  return name.split(/\s+/)[0] || 'Usuário';
}

function shouldShowProtectedPreviewForUser({
  currentUserPhase,
  targetUser,
}: {
  currentUserPhase: IdentityPhase;
  targetUser?: AppUser;
}) {
  return currentUserPhase !== 'verified' && getUserPhaseFromUser(targetUser) === 'verified';
}

function getVisibleUserName({
  users,
  userId,
  currentUserPhase,
}: {
  users: AppUser[];
  userId: string;
  currentUserPhase: IdentityPhase;
}) {
  const targetUser = findUserById(users, userId);

  if (!targetUser) {
    return 'Usuário';
  }

  if (currentUserPhase !== 'verified') {
    return getFirstNameFromUser(targetUser);
  }

  return targetUser.name || getFirstNameFromUser(targetUser);
}

function getProtectedPreviewLabel({
  users,
  userId,
  currentUserPhase,
}: {
  users: AppUser[];
  userId: string;
  currentUserPhase: IdentityPhase;
}) {
  const targetUser = findUserById(users, userId);

  if (
    shouldShowProtectedPreviewForUser({
      currentUserPhase,
      targetUser,
    })
  ) {
    return 'Perfil protegido';
  }

  return '';
}

function getVisibleAvatarColor({
  currentUserPhase,
  targetPhase,
  fallbackColor,
}: {
  currentUserPhase: IdentityPhase;
  targetPhase: IdentityPhase;
  fallbackColor: string;
}) {
  if (currentUserPhase !== 'verified' && targetPhase === 'verified') {
    return '#9DBBFF';
  }

  return fallbackColor;
}

function getContactMethodLabel(methodId: string) {
  const normalizedMethodId = String(methodId ?? '').trim();

  const fallbackLabels: Record<string, string> = {
    phone: 'Telefone celular',
    email: 'E-mail pessoal',
  };

  return (
    getContactMethodById(normalizedMethodId)?.label ||
    fallbackLabels[normalizedMethodId] ||
    normalizedMethodId
  );
}

function getContactMethodLabels(methodIds: string[] = []) {
  return methodIds.map(getContactMethodLabel).join(', ');
}

function RequestAvatar({
  users,
  userId,
  kind,
  color,
  currentUserPhase,
}: {
  users: AppUser[];
  userId: string;
  kind: ConnectionKind;
  color: string;
  currentUserPhase: IdentityPhase;
}) {
  const targetUser = findUserById(users, userId);
  const targetPhase = getUserPhaseFromUser(targetUser);
  const visibleColor = getVisibleAvatarColor({
    currentUserPhase,
    targetPhase,
    fallbackColor: color,
  });
  const canShowPhoto = targetPhase === 'verified' && Boolean(targetUser?.photo);

  return (
    <View
      style={[
        styles.requestIcon,
        {
          borderColor: visibleColor,
          backgroundColor: transparentColor(visibleColor, 0.12),
        },
      ]}
    >
      {canShowPhoto ? (
        <Image
          source={{ uri: targetUser?.photo }}
          style={styles.requestAvatarImage}
          resizeMode="cover"
        />
      ) : (
        <Ionicons name={connectionIcon(kind)} size={24} color={visibleColor} />
      )}
    </View>
  );
}

function ContactRequestAvatar({
  users,
  userId,
  color,
  currentUserPhase,
}: {
  users: AppUser[];
  userId: string;
  color: string;
  currentUserPhase: IdentityPhase;
}) {
  const targetUser = findUserById(users, userId);
  const targetPhase = getUserPhaseFromUser(targetUser);
  const visibleColor = getVisibleAvatarColor({
    currentUserPhase,
    targetPhase,
    fallbackColor: color,
  });
  const canShowPhoto = targetPhase === 'verified' && Boolean(targetUser?.photo);

  return (
    <View
      style={[
        styles.requestIcon,
        {
          borderColor: visibleColor,
          backgroundColor: transparentColor(visibleColor, 0.12),
        },
      ]}
    >
      {canShowPhoto ? (
        <Image
          source={{ uri: targetUser?.photo }}
          style={styles.requestAvatarImage}
          resizeMode="cover"
        />
      ) : (
        <Ionicons name="id-card-outline" size={24} color={visibleColor} />
      )}
    </View>
  );
}

export default function RequestsScreen() {
  const {
    user,
    users,
    realUsers,
    canRequestConnections,
    incomingRequests,
    outgoingRequests,
    incomingContactInformationRequests,
    outgoingContactInformationRequests,
    relationshipColors,
    acceptConnectionRequest,
    rejectConnectionRequest,
    acceptContactInformationRequest,
    rejectContactInformationRequest,
  } = useApp();

  const [selectedContactRequest, setSelectedContactRequest] =
    useState<ContactInformationRequest | null>(null);
  const [selectedMethodIds, setSelectedMethodIds] = useState<string[]>([]);

  const safeRealUsers = Array.isArray(realUsers) ? realUsers : [];
  const safeMockUsers = Array.isArray(users) ? users : [];
  const safeUsers = [
    ...safeRealUsers,
    ...safeMockUsers.filter((u) => !safeRealUsers.some((r) => r.id === u.id)),
  ];
  const safeIncomingRequests = Array.isArray(incomingRequests)
    ? incomingRequests
    : [];
  const safeOutgoingRequests = Array.isArray(outgoingRequests)
    ? outgoingRequests
    : [];
  const safeIncomingContactRequests = Array.isArray(incomingContactInformationRequests)
    ? incomingContactInformationRequests
    : [];
  const safeOutgoingContactRequests = Array.isArray(outgoingContactInformationRequests)
    ? outgoingContactInformationRequests
    : [];

  const currentUserPhase = normalizeIdentityPhase(
    user?.verificationStatus,
    user?.verified,
    canRequestConnections
  );

  const currentUserVerified = currentUserPhase === 'verified';
  const gateMeta = getGateMeta(currentUserPhase);
  const blockedColor = getBlockedColor(currentUserPhase);

  function userName(userId: string) {
    return getVisibleUserName({
      users: safeUsers,
      userId,
      currentUserPhase,
    });
  }

  function protectedPreviewLabel(userId: string) {
    return getProtectedPreviewLabel({
      users: safeUsers,
      userId,
      currentUserPhase,
    });
  }

  function getUserPhase(userId: string): IdentityPhase {
    return getUserPhaseFromUser(findUserById(safeUsers, userId));
  }

  function getConnectionKindLabel(kind: ConnectionKind) {
    return relationshipColors[kind]?.label || 'Conexão';
  }

  const pendingIncoming = safeIncomingRequests.filter((request) =>
    isPendingRequestStatus(request.status)
  );

  const historyIncoming = safeIncomingRequests.filter(
    (request) => !isPendingRequestStatus(request.status)
  );

  const safeOutgoingConnectionRequests = safeOutgoingRequests;

  const pendingOutgoing = safeOutgoingConnectionRequests.filter((request) =>
    isPendingRequestStatus(request.status)
  );

  const pendingIncomingContactRequests = safeIncomingContactRequests.filter((request) =>
    isPendingRequestStatus(request.status)
  );

  const historyIncomingContactRequests = safeIncomingContactRequests.filter(
    (request) => !isPendingRequestStatus(request.status)
  );

  const pendingOutgoingContactRequests = safeOutgoingContactRequests.filter((request) =>
    isPendingRequestStatus(request.status)
  );

  const totalPending =
    pendingIncoming.length +
    pendingOutgoing.length +
    pendingIncomingContactRequests.length +
    pendingOutgoingContactRequests.length;

  function handleAcceptRequest(
    requestId: string,
    fromUserId: string,
    kind: ConnectionKind
  ) {
    const requesterPhase = getUserPhase(fromUserId);
    const relationLabel = getConnectionKindLabel(kind);

    if (!currentUserVerified) {
      Alert.alert(
        'Conexão bloqueada',
        'Você ainda não pode aceitar conexões reais enquanto sua identidade não for aprovada.'
      );
      return;
    }

    if (requesterPhase !== 'verified') {
      Alert.alert(
        'Conexão bloqueada',
        'A conexão real só pode ser aceita quando os dois lados estiverem com identidade verificada.'
      );
      return;
    }

    Alert.alert(
      `Aceitar vínculo de ${relationLabel}`,
      `Ao aceitar, este vínculo de ${relationLabel.toLowerCase()} será considerado conexão real apenas porque os dois perfis estão com identidade verificada e existe aprovação explícita. Isso não libera telefone, WhatsApp, e-mail ou outros contatos automaticamente. Deseja continuar?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Aceitar vínculo',
          onPress: () => acceptConnectionRequest(requestId),
        },
      ]
    );
  }

  function handleRejectRequest(requestId: string) {
    Alert.alert(
      'Recusar solicitação',
      'Deseja recusar esta solicitação? Isso não cria conexão real e não libera contato.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Recusar',
          style: 'destructive',
          onPress: () => rejectConnectionRequest(requestId),
        },
      ]
    );
  }

  function openContactShareSelector(request: ContactInformationRequest) {
    const requestedMethodIds = Array.isArray(request.requestedMethodIds)
      ? request.requestedMethodIds
      : [];

    if (requestedMethodIds.length === 0) {
      Alert.alert(
        'Solicitação sem itens',
        'Esta solicitação não possui informações selecionadas para compartilhar.'
      );
      return;
    }

    setSelectedContactRequest(request);
    setSelectedMethodIds([]);
  }

  function closeContactShareSelector() {
    setSelectedContactRequest(null);
    setSelectedMethodIds([]);
  }

  function toggleSelectedMethod(methodId: string) {
    setSelectedMethodIds((current) => {
      if (current.includes(methodId)) {
        return current.filter((item) => item !== methodId);
      }

      return [...current, methodId];
    });
  }

  function selectAllRequestedMethods() {
    if (!selectedContactRequest) {
      return;
    }

    const requestedMethodIds = Array.isArray(selectedContactRequest.requestedMethodIds)
      ? selectedContactRequest.requestedMethodIds
      : [];

    setSelectedMethodIds(requestedMethodIds);
  }

  function clearSelectedMethods() {
    setSelectedMethodIds([]);
  }

  function confirmContactInformationShare() {
    if (!selectedContactRequest) {
      return;
    }

    if (selectedMethodIds.length === 0) {
      Alert.alert(
        'Selecione uma informação',
        'Escolha pelo menos uma informação para compartilhar ou recuse a solicitação.'
      );
      return;
    }

    const requestId = selectedContactRequest.id;
    const approvedMethodIds = [...selectedMethodIds];
    const approvedLabels = getContactMethodLabels(approvedMethodIds);

    closeContactShareSelector();

    acceptContactInformationRequest(requestId, approvedMethodIds);

    Alert.alert(
      'Informações compartilhadas',
      `Compartilhado: ${approvedLabels}. Isso não cria elo, não cria conexão real e não libera borda colorida.`
    );
  }

  function handleRejectContactInformationRequest(requestId: string) {
    Alert.alert(
      'Recusar solicitação de informações',
      'Deseja recusar esta solicitação? Isso não cria conexão real e não afeta elos existentes.',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Recusar',
          style: 'destructive',
          onPress: () => rejectContactInformationRequest(requestId),
        },
      ]
    );
  }

  function openVerificationStatus() {
    router.push('/verification' as never);
  }

  function renderContactShareModal() {
    const request = selectedContactRequest;
    const requestedMethodIds = Array.isArray(request?.requestedMethodIds)
      ? request.requestedMethodIds
      : [];
    const canShareSelectedMethods = selectedMethodIds.length > 0;

    return (
      <Modal
        visible={Boolean(request)}
        transparent
        animationType="fade"
        onRequestClose={closeContactShareSelector}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Compartilhar informações</Text>

            <Text style={styles.modalSubtitle}>
              Escolha exatamente quais informações deseja compartilhar com{' '}
              {request ? userName(request.fromUserId) : 'este perfil'}. Nada é
              compartilhado automaticamente e você não precisa liberar tudo.
            </Text>

            <View style={styles.modalRuleCard}>
              <Ionicons
                name="shield-checkmark-outline"
                size={18}
                color={colors.cyan}
              />

              <Text style={styles.modalRuleText}>
                Compartilhar informações não cria elo, não vira conexão real e
                não libera borda colorida.
              </Text>
            </View>

            <View style={styles.modalUtilityRow}>
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.modalUtilityButton}
                onPress={selectAllRequestedMethods}
              >
                <Text style={styles.modalUtilityButtonText}>Selecionar tudo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.modalUtilityButton}
                onPress={clearSelectedMethods}
              >
                <Text style={styles.modalUtilityButtonText}>Limpar</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalOptionsList}>
              {requestedMethodIds.map((methodId) => {
                const selected = selectedMethodIds.includes(methodId);

                return (
                  <TouchableOpacity
                    key={methodId}
                    activeOpacity={0.85}
                    style={[
                      styles.modalOption,
                      selected ? styles.modalOptionSelected : null,
                    ]}
                    onPress={() => toggleSelectedMethod(methodId)}
                  >
                    <View
                      style={[
                        styles.modalOptionCircle,
                        selected ? styles.modalOptionCircleSelected : null,
                      ]}
                    >
                      {selected ? (
                        <Ionicons name="checkmark" size={18} color={colors.bg} />
                      ) : null}
                    </View>

                    <Text
                      style={[
                        styles.modalOptionText,
                        selected ? styles.modalOptionTextSelected : null,
                      ]}
                    >
                      {getContactMethodLabel(methodId)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.modalActionRow}>
              <TouchableOpacity
                activeOpacity={0.85}
                style={styles.modalCancelButton}
                onPress={closeContactShareSelector}
              >
                <Text style={styles.modalCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={canShareSelectedMethods ? 0.85 : 1}
                disabled={!canShareSelectedMethods}
                style={[
                  styles.modalConfirmButton,
                  !canShareSelectedMethods ? styles.modalConfirmButtonDisabled : null,
                ]}
                onPress={confirmContactInformationShare}
              >
                <Text
                  style={[
                    styles.modalConfirmButtonText,
                    !canShareSelectedMethods
                      ? styles.modalConfirmButtonTextDisabled
                      : null,
                  ]}
                >
                  Compartilhar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  function renderContactRequestCard({
    request,
    direction,
  }: {
    request: ContactInformationRequest;
    direction: 'incoming' | 'outgoing';
  }) {
    const contactColor = colors.cyan;
    const otherUserId =
      direction === 'incoming' ? request.fromUserId : request.toUserId;
    const statusMeta = getContactRequestStatusMeta(request.status);
    const requestedLabels = getContactMethodLabels(request.requestedMethodIds);
    const approvedLabels = getContactMethodLabels(request.approvedMethodIds);
    const protectedLabel = protectedPreviewLabel(otherUserId);

    return (
      <View key={request.id} style={styles.contactInfoCard}>
        <View style={styles.requestHeader}>
          <ContactRequestAvatar
            users={safeUsers}
            userId={otherUserId}
            color={contactColor}
            currentUserPhase={currentUserPhase}
          />

          <View style={styles.requestTextBox}>
            <Text style={styles.requestTitle}>{userName(otherUserId)}</Text>

            <Text style={styles.requestSubtitle}>
              {protectedLabel
                ? `${protectedLabel} · ${
                    direction === 'incoming'
                      ? 'Solicitou informações de contato'
                      : 'Pedido de informações enviado'
                  }`
                : direction === 'incoming'
                  ? 'Solicitou informações de contato'
                  : 'Pedido de informações enviado'}
            </Text>
          </View>

          <View
            style={[
              styles.statusBadge,
              {
                borderColor: statusMeta.color,
                backgroundColor: transparentColor(statusMeta.color, 0.1),
              },
            ]}
          >
            <Text style={[styles.statusText, { color: statusMeta.color }]}>
              {statusMeta.label}
            </Text>
          </View>
        </View>

        <Text style={styles.requestDescription}>
          Solicitado: {requestedLabels || 'Informações de contato'}
        </Text>

        {isAcceptedRequestStatus(request.status) && approvedLabels ? (
          <Text style={styles.contactSharedText}>
            Compartilhado: {approvedLabels}
          </Text>
        ) : null}

        {request.note ? (
          <Text style={styles.contactNoteText}>Observação: {request.note}</Text>
        ) : null}

        <View style={styles.contactRuleCard}>
          <Ionicons
            name="shield-checkmark-outline"
            size={16}
            color={colors.cyan}
          />

          <Text style={styles.contactRuleText}>
            Solicitação de informações não cria elo, não vira conexão real e não
            libera borda colorida.
          </Text>
        </View>

        {direction === 'incoming' && isPendingRequestStatus(request.status) ? (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.acceptButton}
              activeOpacity={0.85}
              onPress={() => openContactShareSelector(request)}
            >
              <Ionicons name="checkmark" size={20} color={colors.bg} />
              <Text style={styles.acceptButtonText}>Compartilhar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.rejectButton}
              activeOpacity={0.85}
              onPress={() => handleRejectContactInformationRequest(request.id)}
            >
              <Ionicons name="close" size={20} color={colors.white} />
              <Text style={styles.rejectButtonText}>Recusar</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.logo}>ELUS</Text>
          <Text style={styles.title}>Solicitações</Text>
          <Text style={styles.subtitle}>
            Acompanhe pedidos de vínculo e pedidos de informações. Conexões
            reais e informações de contato ficam em áreas separadas.
          </Text>
        </View>

        <View
          style={[
            styles.gateCard,
            {
              backgroundColor: gateMeta.backgroundColor,
              borderColor: gateMeta.borderColor,
            },
          ]}
        >
          <View
            style={[
              styles.gateIcon,
              {
                backgroundColor: transparentColor(gateMeta.color, 0.12),
                borderColor: transparentColor(gateMeta.color, 0.35),
              },
            ]}
          >
            <Ionicons name={gateMeta.icon} size={28} color={gateMeta.color} />
          </View>

          <View style={styles.gateTextBox}>
            <Text style={[styles.gateTitle, { color: gateMeta.color }]}>
              {gateMeta.title}
            </Text>

            <Text style={styles.gateText}>{gateMeta.text}</Text>

            {!currentUserVerified ? (
              <TouchableOpacity
                activeOpacity={0.85}
                style={[
                  styles.gateButton,
                  {
                    borderColor: transparentColor(gateMeta.color, 0.4),
                    backgroundColor: transparentColor(gateMeta.color, 0.12),
                  },
                ]}
                onPress={openVerificationStatus}
              >
                <Text style={[styles.gateButtonText, { color: gateMeta.color }]}>
                  {gateMeta.buttonLabel}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryIcon}>
            <Ionicons name="key-outline" size={34} color={colors.cyan} />
          </View>

          <View style={styles.summaryTextBox}>
            <Text style={styles.summaryTitle}>
              {totalPending === 1
                ? '1 solicitação pendente'
                : `${totalPending} solicitações pendentes`}
            </Text>
            <Text style={styles.summaryText}>
              Solicitações de conexão e solicitações de informações aparecem
              separadas. Nenhuma solicitação libera contato automaticamente.
            </Text>
          </View>
        </View>

        <Text style={styles.groupTitle}>Solicitações de conexão</Text>

        <Text style={styles.sectionTitle}>Recebidas</Text>

        {pendingIncoming.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="checkmark-done-outline"
                size={24}
                color={colors.textTertiary}
              />
            </View>

            <View style={styles.emptyTextBox}>
              <Text style={styles.emptyTitle}>
                Nenhuma solicitação de conexão pendente
              </Text>
              <Text style={styles.emptyText}>
                Quando alguém quiser criar um vínculo que precisa de aprovação,
                ele aparecerá aqui. A conexão real continuará dependendo de
                identidade verificada dos dois lados.
              </Text>
            </View>
          </View>
        ) : (
          pendingIncoming.map((request) => {
            const relation = relationshipColors[request.kind];
            const color = relation?.color || colors.cyan;
            const requesterPhase = getUserPhase(request.fromUserId);
            const requesterProtectedLabel = protectedPreviewLabel(request.fromUserId);
            const canAcceptThisRequest =
              currentUserVerified &&
              requesterPhase === 'verified' &&
              isPendingRequestStatus(request.status);

            const requestStatusMeta = getRequestStatusMeta({
              status: request.status,
              canBecomeRealConnection: canAcceptThisRequest,
              blockedColor,
            });

            return (
              <View key={request.id} style={styles.requestCard}>
                <View style={styles.requestHeader}>
                  <RequestAvatar
                    users={safeUsers}
                    userId={request.fromUserId}
                    kind={request.kind}
                    color={color}
                    currentUserPhase={currentUserPhase}
                  />

                  <View style={styles.requestTextBox}>
                    <Text style={styles.requestTitle}>
                      {userName(request.fromUserId)}
                    </Text>

                    <Text style={styles.requestSubtitle}>
                      {requesterProtectedLabel
                        ? `${requesterProtectedLabel} · Quer criar vínculo de ${
                            relation?.label || 'Conexão'
                          }`
                        : `Quer criar vínculo de ${relation?.label || 'Conexão'}`}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.statusBadge,
                      {
                        borderColor: requestStatusMeta.color,
                        backgroundColor: transparentColor(
                          requestStatusMeta.color,
                          0.1
                        ),
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: requestStatusMeta.color },
                      ]}
                    >
                      {requestStatusMeta.label}
                    </Text>
                  </View>
                </View>

                <Text style={styles.requestDescription}>{request.label}</Text>

                {!canAcceptThisRequest ? (
                  <View
                    style={[
                      styles.blockedReasonCard,
                      requesterPhase === 'in_review'
                        ? styles.blockedReasonCardReview
                        : null,
                    ]}
                  >
                    <Ionicons
                      name="lock-closed-outline"
                      size={16}
                      color={
                        requesterPhase === 'in_review'
                          ? '#9DBBFF'
                          : '#EF4444'
                      }
                    />

                    <Text
                      style={[
                        styles.blockedReasonText,
                        requesterPhase === 'in_review'
                          ? styles.blockedReasonTextReview
                          : null,
                      ]}
                    >
                      {!currentUserVerified
                        ? 'Você ainda não pode aceitar conexões reais até sua identidade ser aprovada.'
                        : 'O outro perfil também precisa estar com identidade verificada para a conexão real ser aceita.'}
                    </Text>
                  </View>
                ) : null}

                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[
                      styles.acceptButton,
                      !canAcceptThisRequest ? styles.acceptButtonDisabled : null,
                    ]}
                    activeOpacity={0.85}
                    onPress={() =>
                      handleAcceptRequest(
                        request.id,
                        request.fromUserId,
                        request.kind
                      )
                    }
                  >
                    <Ionicons
                      name={canAcceptThisRequest ? 'checkmark' : 'lock-closed'}
                      size={20}
                      color={
                        canAcceptThisRequest ? colors.bg : colors.textTertiary
                      }
                    />

                    <Text
                      style={[
                        styles.acceptButtonText,
                        !canAcceptThisRequest
                          ? styles.acceptButtonTextDisabled
                          : null,
                      ]}
                    >
                      {canAcceptThisRequest ? 'Aceitar vínculo' : 'Bloqueado'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.rejectButton}
                    activeOpacity={0.85}
                    onPress={() => handleRejectRequest(request.id)}
                  >
                    <Ionicons name="close" size={20} color={colors.white} />
                    <Text style={styles.rejectButtonText}>Recusar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}

        <Text style={styles.sectionTitle}>Enviadas</Text>

        {safeOutgoingConnectionRequests.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="paper-plane-outline"
                size={24}
                color={colors.textTertiary}
              />
            </View>

            <View style={styles.emptyTextBox}>
              <Text style={styles.emptyTitle}>
                Nenhuma solicitação de conexão enviada
              </Text>
              <Text style={styles.emptyText}>
                Quando você pedir um vínculo, ele aparecerá aqui. Contato e
                dados completos continuam bloqueados até aprovação adequada.
              </Text>
            </View>
          </View>
        ) : (
          safeOutgoingConnectionRequests.map((request) => {
            const relation = relationshipColors[request.kind];
            const color = relation?.color || colors.cyan;
            const targetPhase = getUserPhase(request.toUserId);
            const targetProtectedLabel = protectedPreviewLabel(request.toUserId);
            const canBecomeRealConnection =
              currentUserVerified && targetPhase === 'verified';

            const requestStatusMeta = getRequestStatusMeta({
              status: request.status,
              canBecomeRealConnection,
              blockedColor,
            });

            return (
              <View key={request.id} style={styles.sentCard}>
                <RequestAvatar
                  users={safeUsers}
                  userId={request.toUserId}
                  kind={request.kind}
                  color={color}
                  currentUserPhase={currentUserPhase}
                />

                <View style={styles.requestTextBox}>
                  <Text style={styles.requestTitle}>
                    {userName(request.toUserId)}
                  </Text>

                  <Text style={styles.requestSubtitle}>
                    {targetProtectedLabel
                      ? `${targetProtectedLabel} · Solicitação de ${
                          relation?.label || 'Conexão'
                        }`
                      : `Solicitação de ${relation?.label || 'Conexão'}`}
                  </Text>

                  {!canBecomeRealConnection &&
                  !isRejectedRequestStatus(request.status) ? (
                    <Text style={styles.sentBlockedText}>
                      Não pode virar conexão real sem verificação dos dois lados.
                    </Text>
                  ) : null}
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    {
                      borderColor: requestStatusMeta.color,
                      backgroundColor: transparentColor(
                        requestStatusMeta.color,
                        0.1
                      ),
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: requestStatusMeta.color },
                    ]}
                  >
                    {requestStatusMeta.label}
                  </Text>
                </View>
              </View>
            );
          })
        )}

        {historyIncoming.length > 0 ? (
          <View>
            <Text style={styles.sectionTitle}>Histórico de conexões</Text>

            {historyIncoming.map((request) => {
              const relation = relationshipColors[request.kind];
              const color = relation?.color || colors.cyan;
              const requesterPhase = getUserPhase(request.fromUserId);
              const requesterProtectedLabel = protectedPreviewLabel(request.fromUserId);
              const canBecomeRealConnection =
                currentUserVerified && requesterPhase === 'verified';

              const requestStatusMeta = getRequestStatusMeta({
                status: request.status,
                canBecomeRealConnection,
                blockedColor,
              });

              return (
                <View key={request.id} style={styles.historyCard}>
                  <View style={[styles.historyDot, { backgroundColor: color }]} />

                  <View style={styles.requestTextBox}>
                    <Text style={styles.historyTitle}>
                      {userName(request.fromUserId)} ·{' '}
                      {relation?.label || 'Conexão'}
                    </Text>

                    <Text
                      style={[
                        styles.historySubtitle,
                        {
                          color: requestStatusMeta.color,
                        },
                      ]}
                    >
                      {requesterProtectedLabel
                        ? `${requesterProtectedLabel} · ${requestStatusMeta.label}`
                        : requestStatusMeta.label}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}

        <Text style={styles.groupTitle}>Solicitações de informações</Text>

        <Text style={styles.sectionTitle}>Recebidas</Text>

        {pendingIncomingContactRequests.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="id-card-outline"
                size={24}
                color={colors.textTertiary}
              />
            </View>

            <View style={styles.emptyTextBox}>
              <Text style={styles.emptyTitle}>
                Nenhuma solicitação de informações pendente
              </Text>
              <Text style={styles.emptyText}>
                Pedidos de telefone, WhatsApp, Instagram, e-mail, endereço e
                outros dados aparecerão aqui. Isso não cria elo automaticamente.
              </Text>
            </View>
          </View>
        ) : (
          pendingIncomingContactRequests.map((request) =>
            renderContactRequestCard({
              request,
              direction: 'incoming',
            })
          )
        )}

        <Text style={styles.sectionTitle}>Enviadas</Text>

        {safeOutgoingContactRequests.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIcon}>
              <Ionicons
                name="send-outline"
                size={24}
                color={colors.textTertiary}
              />
            </View>

            <View style={styles.emptyTextBox}>
              <Text style={styles.emptyTitle}>
                Nenhuma solicitação de informações enviada
              </Text>
              <Text style={styles.emptyText}>
                Quando você solicitar telefone, WhatsApp, Instagram, e-mail ou
                outros dados, o pedido aparecerá aqui separado das conexões.
              </Text>
            </View>
          </View>
        ) : (
          safeOutgoingContactRequests.map((request) =>
            renderContactRequestCard({
              request,
              direction: 'outgoing',
            })
          )
        )}

        {historyIncomingContactRequests.length > 0 ? (
          <View>
            <Text style={styles.sectionTitle}>Histórico de informações</Text>

            {historyIncomingContactRequests.map((request) =>
              renderContactRequestCard({
                request,
                direction: 'incoming',
              })
            )}
          </View>
        ) : null}

        <Text style={styles.footer}>
          ELUS · Afinidade, informação compartilhada e conexão real são camadas
          separadas. Conexões reais só acontecem com identidade verificada e
          aprovação.
        </Text>
      </ScrollView>

      {renderContactShareModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  content: {
    padding: 24,
    paddingBottom: 140,
  },

  header: {
    marginBottom: 22,
  },

  logo: {
    color: colors.cyan,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 7,
  },

  title: {
    color: colors.white,
    fontSize: 38,
    fontWeight: '200',
    marginTop: 8,
  },

  subtitle: {
    color: colors.silver,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
  },

  gateCard: {
    borderRadius: 26,
    borderWidth: 1,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
  },

  gateIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  gateTextBox: {
    flex: 1,
  },

  gateTitle: {
    fontSize: 19,
    lineHeight: 24,
    fontWeight: '900',
  },

  gateText: {
    color: colors.silver,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '700',
    marginTop: 7,
  },

  gateButton: {
    alignSelf: 'flex-start',
    minHeight: 38,
    borderRadius: 19,
    borderWidth: 1,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },

  gateButtonText: {
    fontSize: 12,
    fontWeight: '900',
  },

  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },

  summaryIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: 'rgba(34,211,238,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(34,211,238,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },

  summaryTextBox: {
    flex: 1,
  },

  summaryTitle: {
    color: colors.white,
    fontSize: 21,
    fontWeight: '900',
  },

  summaryText: {
    color: colors.textTertiary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 5,
  },

  groupTitle: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 15,
    marginTop: 8,
  },

  sectionTitle: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 14,
    marginTop: 4,
  },

  requestCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    marginBottom: 18,
  },

  contactInfoCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(34,211,238,0.20)',
    padding: 18,
    marginBottom: 18,
  },

  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  requestIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },

  requestAvatarImage: {
    width: '100%',
    height: '100%',
  },

  requestTextBox: {
    flex: 1,
  },

  requestTitle: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '900',
  },

  requestSubtitle: {
    color: colors.silver,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
  },

  requestDescription: {
    color: colors.textTertiary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 14,
  },

  contactSharedText: {
    color: '#34D399',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800',
    marginTop: 8,
  },

  contactNoteText: {
    color: colors.silver,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
    marginTop: 8,
  },

  contactRuleCard: {
    marginTop: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(34,211,238,0.24)',
    backgroundColor: 'rgba(34,211,238,0.07)',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  contactRuleText: {
    flex: 1,
    color: colors.silver,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800',
    marginLeft: 8,
  },

  statusBadge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginLeft: 8,
  },

  statusText: {
    fontSize: 11,
    fontWeight: '900',
  },

  blockedReasonCard: {
    marginTop: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.28)',
    backgroundColor: 'rgba(239,68,68,0.08)',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  blockedReasonCardReview: {
    borderColor: 'rgba(157,187,255,0.34)',
    backgroundColor: 'rgba(157,187,255,0.09)',
  },

  blockedReasonText: {
    flex: 1,
    color: '#FF9B9B',
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800',
    marginLeft: 8,
  },

  blockedReasonTextReview: {
    color: '#BBD0FF',
  },

  actionRow: {
    flexDirection: 'row',
    marginTop: 16,
  },

  acceptButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.cyan,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginRight: 8,
  },

  acceptButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: colors.border,
  },

  acceptButtonText: {
    color: colors.bg,
    fontSize: 14,
    fontWeight: '900',
    marginLeft: 6,
  },

  acceptButtonTextDisabled: {
    color: colors.textTertiary,
  },

  rejectButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginLeft: 8,
  },

  rejectButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '900',
    marginLeft: 6,
  },

  sentCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },

  sentBlockedText: {
    color: colors.textTertiary,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '700',
    marginTop: 5,
  },

  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
  },

  emptyIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  emptyTextBox: {
    flex: 1,
  },

  emptyTitle: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '900',
  },

  emptyText: {
    color: colors.textTertiary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },

  historyCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },

  historyDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    marginRight: 12,
  },

  historyTitle: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '800',
  },

  historySubtitle: {
    color: colors.textTertiary,
    fontSize: 12,
    marginTop: 3,
  },

  footer: {
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: 24,
    fontSize: 12,
    lineHeight: 18,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.74)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
  },

  modalCard: {
    width: '100%',
    maxHeight: '92%',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#101219',
    padding: 20,
  },

  modalTitle: {
    color: colors.white,
    fontSize: 28,
    lineHeight: 33,
    fontWeight: '900',
  },

  modalSubtitle: {
    color: colors.silver,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '700',
    marginTop: 10,
  },

  modalRuleCard: {
    marginTop: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(34,211,238,0.24)',
    backgroundColor: 'rgba(34,211,238,0.07)',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  modalRuleText: {
    flex: 1,
    color: colors.silver,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '800',
    marginLeft: 8,
  },

  modalUtilityRow: {
    flexDirection: 'row',
    marginTop: 16,
    marginBottom: 12,
  },

  modalUtilityButton: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },

  modalUtilityButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '900',
  },

  modalOptionsList: {
    gap: 8,
  },

  modalOption: {
    minHeight: 48,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.06)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },

  modalOptionSelected: {
    borderColor: 'rgba(34,211,238,0.65)',
    backgroundColor: 'rgba(34,211,238,0.13)',
  },

  modalOptionCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  modalOptionCircleSelected: {
    backgroundColor: colors.cyan,
    borderColor: colors.cyan,
  },

  modalOptionText: {
    flex: 1,
    color: colors.silver,
    fontSize: 15,
    fontWeight: '900',
  },

  modalOptionTextSelected: {
    color: colors.white,
  },

  modalActionRow: {
    flexDirection: 'row',
    marginTop: 18,
  },

  modalCancelButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

  modalCancelButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '900',
  },

  modalConfirmButton: {
    flex: 1.2,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.cyan,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  modalConfirmButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1,
    borderColor: colors.border,
  },

  modalConfirmButtonText: {
    color: colors.bg,
    fontSize: 14,
    fontWeight: '900',
  },

  modalConfirmButtonTextDisabled: {
    color: colors.textTertiary,
  },
});