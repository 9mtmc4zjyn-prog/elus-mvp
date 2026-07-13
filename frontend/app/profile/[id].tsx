import React, { useMemo, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";

import { useApp, type AppUser } from "../../src/context/AppContext";
import { appUserToProfile } from "../../src/utils/adaptSupabaseProfile";
import {
  evaluateConnectionRules,
  getProfileIdentityPhase,
  type IdentityPhase,
} from "../../src/utils/connectionRules";
import { getLocalAffinityExplanation } from "../../src/utils/elusIntelligenceRules";
import { useTheme } from "../../src/theme/ThemeContext";
import type { ThemeColors } from "../../src/theme/theme";

const ELUS_VERIFIED_GREEN = require("../../assets/images/elus-verified-green.png");
const ELUS_UNVERIFIED_RED = require("../../assets/images/elus-unverified-red.png");
const ELUS_IN_REVIEW_BLUE = require("../../assets/images/elus-symbol-cyan-purple.png");
const ELUS_LOGO = require("../../assets/images/elus-logo.png");

const STATUS_BLUE = "#8FA3B8";

const SENSITIVE_BASIC_INFO_PATTERNS = [
  /telefone/i,
  /whats/i,
  /whatsapp/i,
  /e-?mail/i,
  /email/i,
  /contato/i,
  /celular/i,
  /@/,
  /\b\d{2}\s?\d{4,5}[-\s]?\d{4}\b/,
];

const CONTACT_INFORMATION_OPTIONS = [
  "Telefone celular",
  "WhatsApp",
  "Instagram",
  "E-mail pessoal",
  "Endereço completo",
  "Telegram",
  "LinkedIn",
  "Site",
  "YouTube",
  "iFood ou delivery",
  "Uber ou app semelhante",
  "Blog",
  "Vlog",
  "Portfólio",
  "Catálogo",
  "Outro contato",
];

function getRouteId(id: string | string[] | undefined): string {
  if (Array.isArray(id)) {
    return id[0] ?? "";
  }

  return id ?? "";
}

function getFirstName(name: string) {
  return name.trim().split(" ").filter(Boolean)[0] || name;
}

function normalizeSearchText(value: string | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ");
}

function getFirstSearchWord(value: string | undefined): string {
  return normalizeSearchText(value).split(" ").filter(Boolean)[0] || "";
}

function getObjectStringField(value: unknown, key: string): string {
  if (!value || typeof value !== "object") {
    return "";
  }

  const field = (value as Record<string, unknown>)[key];

  return typeof field === "string" ? field : "";
}

function isPendingStatus(status?: string) {
  const normalized = String(status ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

  return normalized === "" || normalized === "pending" || normalized === "pendente";
}

function findMatchingAppUser({
  rawId,
  profileId,
  profileName,
  users,
}: {
  rawId: string;
  profileId: string;
  profileName: string;
  users: AppUser[];
}) {
  const exactCandidates = [rawId, profileId].filter(Boolean);
  const exactUser = users.find((item) => exactCandidates.includes(item.id));

  if (exactUser) {
    return exactUser;
  }

  const rawIdNormalized = normalizeSearchText(rawId);
  const profileIdNormalized = normalizeSearchText(profileId);
  const profileNameNormalized = normalizeSearchText(profileName);

  const rawIdCompact = rawIdNormalized.replace(/\s/g, "");
  const profileIdCompact = profileIdNormalized.replace(/\s/g, "");
  const profileFirstName = getFirstSearchWord(profileName);

  return users.find((item) => {
    const userIdNormalized = normalizeSearchText(item.id).replace(/\s/g, "");
    const userNameNormalized = normalizeSearchText(item.name);
    const userNameCompact = userNameNormalized.replace(/\s/g, "");
    const userFirstName = getFirstSearchWord(item.name);
    const companyNameNormalized = normalizeSearchText(item.companyName);
    const companyNameCompact = companyNameNormalized.replace(/\s/g, "");

    const matchesByName =
      Boolean(profileNameNormalized) &&
      (userNameNormalized === profileNameNormalized ||
        userNameNormalized.includes(profileNameNormalized) ||
        profileNameNormalized.includes(userNameNormalized) ||
        userNameCompact.includes(profileNameNormalized.replace(/\s/g, "")) ||
        profileNameNormalized.replace(/\s/g, "").includes(userNameCompact));

    const matchesByFirstName =
      Boolean(profileFirstName) && userFirstName === profileFirstName;

    const matchesByRoute =
      Boolean(rawIdCompact) &&
      (userIdNormalized.includes(rawIdCompact) ||
        rawIdCompact.includes(userFirstName) ||
        userNameCompact.includes(rawIdCompact) ||
        rawIdCompact.includes(userNameCompact) ||
        companyNameCompact.includes(rawIdCompact) ||
        rawIdCompact.includes(companyNameCompact));

    const matchesByProfileId =
      Boolean(profileIdCompact) &&
      (userIdNormalized.includes(profileIdCompact) ||
        profileIdCompact.includes(userFirstName) ||
        userNameCompact.includes(profileIdCompact) ||
        profileIdCompact.includes(userNameCompact) ||
        companyNameCompact.includes(profileIdCompact) ||
        profileIdCompact.includes(companyNameCompact));

    return matchesByName || matchesByFirstName || matchesByRoute || matchesByProfileId;
  });
}

function normalizeCurrentUserPhase(
  user: AppUser,
  canRequestConnections: boolean
): IdentityPhase {
  const status = String(user.verificationStatus ?? "")
    .trim()
    .toLowerCase();

  const inReviewStatuses = [
    "in_review",
    "review",
    "under_review",
    "awaiting",
    "awaiting_review",
    "aguardando",
    "aguardando_verificacao",
    "aguardando_verificação",
    "em_analise",
    "em_análise",
    "analysis_submitted",
    "submitted",
    "document_submitted",
    "documento_enviado",
    "doc_sent",
  ];

  const verifiedStatuses = ["verified", "approved", "aprovado", "verificado"];

  const unverifiedStatuses = [
    "",
    "none",
    "unverified",
    "not_verified",
    "pending",
    "pendente",
    "verification_pending",
    "verificacao_pendente",
    "verificação_pendente",
    "rejected",
    "recusado",
  ];

  if (inReviewStatuses.includes(status)) {
    return "in_review";
  }

  if (verifiedStatuses.includes(status)) {
    return "verified";
  }

  if (unverifiedStatuses.includes(status)) {
    return "unverified";
  }

  if (canRequestConnections) {
    return "verified";
  }

  return "unverified";
}

function shouldProtectTargetVerificationStatus({
  currentUserPhase,
  targetProfilePhase,
}: {
  currentUserPhase: IdentityPhase;
  targetProfilePhase: IdentityPhase;
}) {
  return currentUserPhase !== "verified" && targetProfilePhase === "verified";
}

function getVisibleProfileStatusForViewer({
  currentUserPhase,
  targetProfilePhase,
}: {
  currentUserPhase: IdentityPhase;
  targetProfilePhase: IdentityPhase;
}): IdentityPhase {
  if (
    shouldProtectTargetVerificationStatus({
      currentUserPhase,
      targetProfilePhase,
    })
  ) {
    return "in_review";
  }

  return targetProfilePhase;
}

function getVisibleProfileStatusLabel({
  currentUserPhase,
  targetProfilePhase,
}: {
  currentUserPhase: IdentityPhase;
  targetProfilePhase: IdentityPhase;
}) {
  if (
    shouldProtectTargetVerificationStatus({
      currentUserPhase,
      targetProfilePhase,
    })
  ) {
    return "Perfil protegido";
  }

  return getVerificationPhaseLabel(targetProfilePhase);
}

function getStatusColor(status: IdentityPhase, colors: ThemeColors): string {
  if (status === "verified") {
    return colors.success;
  }

  if (status === "in_review") {
    return STATUS_BLUE;
  }

  return colors.danger;
}

function getStatusSoftColor(status: IdentityPhase): string {
  if (status === "verified") {
    return "rgba(34,197,94,0.12)";
  }

  if (status === "in_review") {
    return "rgba(157,187,255,0.13)";
  }

  return "rgba(239,68,68,0.12)";
}

function getStatusBorderColor(status: IdentityPhase): string {
  if (status === "verified") {
    return "rgba(34,197,94,0.45)";
  }

  if (status === "in_review") {
    return "rgba(157,187,255,0.45)";
  }

  return "rgba(239,68,68,0.50)";
}

function getStatusIcon(status: IdentityPhase) {
  if (status === "verified") {
    return ELUS_VERIFIED_GREEN;
  }

  if (status === "in_review") {
    return ELUS_IN_REVIEW_BLUE;
  }

  return ELUS_UNVERIFIED_RED;
}

function getVerificationPhaseLabel(status: IdentityPhase): string {
  if (status === "verified") {
    return "Verificação concluída";
  }

  if (status === "in_review") {
    return "Aguardando verificação";
  }

  return "Verificação pendente";
}

function getRestrictedPhotoText({
  status,
  isProtectedVerifiedProfile,
}: {
  status: IdentityPhase;
  isProtectedVerifiedProfile: boolean;
}): string {
  if (isProtectedVerifiedProfile) {
    return "Perfil protegido";
  }

  if (status === "in_review") {
    return "Aguardando verificação";
  }

  if (status === "unverified") {
    return "Verificação pendente";
  }

  return "Verificação concluída";
}

function getSafeBasicInfo(items: string[] | undefined): string[] {
  const safeItems = (items ?? []).filter((item) => {
    return !SENSITIVE_BASIC_INFO_PATTERNS.some((pattern) => pattern.test(item));
  });

  if (safeItems.length > 0) {
    return safeItems;
  }

  return [
    "Identidade verificada",
    "Dados sensíveis protegidos automaticamente",
    "Contato compartilhado somente após solicitação e aprovação",
  ];
}

function getRestrictedAffinitySignals(): string[] {
  return [
    "Existe compatibilidade potencial detectada pelo ELUS.",
    "A IA pode considerar contexto, interesses gerais e presença local.",
    "Dados completos só aparecem com verificação válida e aprovação adequada.",
  ];
}

function getDisplayLocation({
  canSeeFullProfile,
  city,
  state,
}: {
  canSeeFullProfile: boolean;
  city?: string;
  state?: string;
}): string {
  if (canSeeFullProfile) {
    return `${city ?? "Cidade"} • ${state ?? "Estado"}`;
  }

  return "Localização protegida";
}

function getAccessWarningMeta({
  currentUserPhase,
  targetProfilePhase,
  connectionMessage,
}: {
  currentUserPhase: IdentityPhase;
  targetProfilePhase: IdentityPhase;
  connectionMessage: string;
}) {
  if (currentUserPhase === "in_review") {
    return {
      status: "in_review" as IdentityPhase,
      title: "Seu acesso: aguardando verificação",
      text:
        "Sua verificação foi enviada e ainda depende de aprovação. Até a confirmação, você verá apenas informações limitadas e não poderá iniciar solicitações.",
    };
  }

  if (currentUserPhase === "unverified") {
    return {
      status: "unverified" as IdentityPhase,
      title: "Seu acesso: verificação pendente",
      text:
        "Você ainda precisa concluir a verificação de identidade. Até a validação, verá apenas informações limitadas e não poderá iniciar solicitações.",
    };
  }

  if (targetProfilePhase === "in_review") {
    return {
      status: "in_review" as IdentityPhase,
      title: "Perfil aguardando verificação",
      text:
        "Este perfil enviou documento para análise, mas ainda não foi aprovado. Dados completos continuam protegidos. Você pode solicitar informações de contato, mas o perfil decide aceitar, recusar ou compartilhar parcialmente.",
    };
  }

  if (targetProfilePhase === "unverified") {
    return {
      status: "unverified" as IdentityPhase,
      title: "Perfil com verificação pendente",
      text:
        "Este perfil ainda não concluiu a verificação oficial de identidade. Dados completos continuam protegidos. Você pode solicitar informações de contato, mas o perfil decide aceitar, recusar ou compartilhar parcialmente.",
    };
  }

  return {
    status: "verified" as IdentityPhase,
    title: "Dados completos protegidos",
    text: connectionMessage,
  };
}

function getRestrictedBasicInfo({
  currentUserPhase,
  targetProfilePhase,
}: {
  currentUserPhase: IdentityPhase;
  targetProfilePhase: IdentityPhase;
}): string[] {
  if (currentUserPhase !== "verified") {
    if (targetProfilePhase === "verified") {
      return [
        "Perfil protegido pelo ELUS",
        "Primeiro nome e tipo de perfil liberados",
        "Telefone, WhatsApp, e-mail e localização completa bloqueados",
        "Contato bloqueado até sua verificação aprovada",
      ];
    }

    if (targetProfilePhase === "in_review") {
      return [
        "Selfie com documento enviada para análise",
        "Perfil ainda sem aprovação final",
        "Telefone, WhatsApp, e-mail e dados completos bloqueados",
        "Contato bloqueado até sua verificação aprovada",
      ];
    }

    return [
      "Verificação pendente",
      "Informações públicas limitadas",
      "Telefone, WhatsApp, e-mail e dados completos bloqueados",
      "Contato bloqueado até sua verificação aprovada",
    ];
  }

  if (targetProfilePhase === "in_review") {
    return [
      "Selfie com documento enviada para análise",
      "Aguardando aprovação final",
      "Dados completos ainda protegidos",
      "Contato pode ser solicitado por perfil verificado, mas só será compartilhado se o perfil aceitar",
    ];
  }

  if (targetProfilePhase === "unverified") {
    return [
      "Verificação pendente",
      "Informações públicas limitadas",
      "Telefone, WhatsApp, e-mail e dados completos protegidos",
      "Contato pode ser solicitado por perfil verificado, mas só será compartilhado se o perfil aceitar",
    ];
  }

  return [
    "Verificação concluída",
    "Perfil elegível para solicitação protegida",
    "Dados completos protegidos até aprovação adequada",
    "Contato compartilhado somente após solicitação e aprovação",
  ];
}

function getContactButtonLabel({
  currentUserPhase,
  hasPendingOutgoingContactInformationRequest,
  hasTargetAppUser,
}: {
  currentUserPhase: IdentityPhase;
  hasPendingOutgoingContactInformationRequest: boolean;
  hasTargetAppUser: boolean;
}) {
  if (currentUserPhase === "in_review") {
    return "Contato bloqueado até sua aprovação";
  }

  if (currentUserPhase === "unverified") {
    return "Contato bloqueado até sua verificação";
  }

  if (!hasTargetAppUser) {
    return "Solicitação indisponível";
  }

  if (hasPendingOutgoingContactInformationRequest) {
    return "Solicitação de informações enviada";
  }

  return "Solicitar informações de contato";
}

function getLockedReason({
  currentUserPhase,
  hasPendingOutgoingContactInformationRequest,
  hasTargetAppUser,
}: {
  currentUserPhase: IdentityPhase;
  hasPendingOutgoingContactInformationRequest: boolean;
  hasTargetAppUser: boolean;
}) {
  if (currentUserPhase === "in_review") {
    return "Sua verificação está em análise. Você ainda não pode enviar solicitação de informações de contato.";
  }

  if (currentUserPhase === "unverified") {
    return "Conclua sua verificação de identidade para solicitar informações de contato.";
  }

  if (!hasTargetAppUser) {
    return "Este perfil ainda não está vinculado ao cadastro interno necessário para receber solicitação.";
  }

  if (hasPendingOutgoingContactInformationRequest) {
    return "Sua solicitação de informações já foi enviada. O contato continua protegido até aprovação explícita.";
  }

  return "";
}

function ElusStatusIcon({
  status,
  size,
}: {
  status: IdentityPhase;
  size: number;
}) {
  return (
    <Image
      source={getStatusIcon(status)}
      style={{
        width: size,
        height: size,
      }}
      resizeMode="contain"
    />
  );
}

function PhotoStatusBadge({ status }: { status: IdentityPhase }) {
  return (
    <View style={styles.photoStatusBadge}>
      <ElusStatusIcon status={status} size={46} />
    </View>
  );
}

function StatusPill({
  status,
  label,
}: {
  status: IdentityPhase;
  label?: string;
}) {
  const { colors } = useTheme();
  const statusColor = getStatusColor(status, colors);

  return (
    <View
      style={[
        styles.statusPill,
        {
          backgroundColor: getStatusSoftColor(status),
          borderColor: getStatusBorderColor(status),
        },
      ]}
    >
      <ElusStatusIcon status={status} size={23} />

      <Text style={[styles.statusText, { color: statusColor }]}>
        {label ?? getVerificationPhaseLabel(status)}
      </Text>
    </View>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function BulletList({ items }: { items: string[] }) {
  const { colors } = useTheme();

  return (
    <View style={styles.bulletList}>
      {items.map((item, index) => (
        <View key={`${item}-${index}`} style={styles.bulletRow}>
          <View style={styles.bulletDot} />
          <Text style={[styles.bulletText, { color: colors.textMuted }]}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

export default function ProfileScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const rawId = getRouteId(params.id);

  const {
    user,
    users,
    realUsers,
    connections,
    canRequestConnections,
    requestContactInformation,
    outgoingContactInformationRequests,
    blockUser,
    isBlocked,
  } = useApp();

  const { colors } = useTheme();

  const [contactSelectionVisible, setContactSelectionVisible] = useState(false);
  const [selectedContactInformation, setSelectedContactInformation] = useState<string[]>([]);
  const [blockConfirmVisible, setBlockConfirmVisible] = useState(false);
  const [blockedLocally, setBlockedLocally] = useState(false);

  const profile = useMemo(() => {
    const realUser = (realUsers as AppUser[]).find((u) => u.id === rawId);
    if (realUser) return appUserToProfile(realUser);

    return null;
  }, [rawId, realUsers]);

  const openPlans = () => {
    router.push("/plans" as never);
  };

  const currentUserPhase = normalizeCurrentUserPhase(user, canRequestConnections);

  if (!profile) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" />

        <View style={[styles.fixedHeader, { backgroundColor: colors.background }]}>
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              pressed ? styles.buttonPressed : null,
            ]}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>‹</Text>
          </Pressable>

          <Image source={ELUS_LOGO} style={styles.headerLogo} resizeMode="contain" />

          <Pressable
            style={({ pressed }) => [
              styles.planButton,
              { backgroundColor: colors.warning },
              pressed ? styles.buttonPressed : null,
            ]}
            onPress={openPlans}
          >
            <Ionicons name="diamond" size={17} color="#1A1200" />
            <Text style={styles.planButtonText}>Planos</Text>
          </Pressable>
        </View>

        <View style={styles.notFoundContainer}>
          <Image
            source={ELUS_UNVERIFIED_RED}
            style={styles.notFoundImage}
            resizeMode="contain"
          />

          <Text style={styles.notFoundTitle}>Perfil não encontrado</Text>

          <Text style={[styles.notFoundText, { color: colors.textMuted }]}>
            O ID recebido não corresponde a nenhum perfil cadastrado nesta etapa.
          </Text>

          <Text style={styles.notFoundId}>ID recebido: {rawId || "vazio"}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const profileStatus = getProfileIdentityPhase(profile);
  const profileIsVerified = profileStatus === "verified";
  const shouldProtectVerifiedProfile = shouldProtectTargetVerificationStatus({
    currentUserPhase,
    targetProfilePhase: profileStatus,
  });

  const visibleProfileStatus = getVisibleProfileStatusForViewer({
    currentUserPhase,
    targetProfilePhase: profileStatus,
  });
  const visibleProfileStatusLabel = getVisibleProfileStatusLabel({
    currentUserPhase,
    targetProfilePhase: profileStatus,
  });

  const profileId = getObjectStringField(profile, "id");
  const targetAppUser = findMatchingAppUser({
    rawId,
    profileId,
    profileName: profile.name,
    users,
  });
  const targetAppUserId = rawId || profileId || targetAppUser?.id || "";
  const safeOutgoingContactInformationRequests = Array.isArray(
    outgoingContactInformationRequests
  )
    ? outgoingContactInformationRequests
    : [];

  const hasPendingOutgoingContactInformationRequest =
    Boolean(targetAppUserId) &&
    safeOutgoingContactInformationRequests.some(
      (request) =>
        request.toUserId === targetAppUserId &&
        request.fromUserId === user.id &&
        isPendingStatus(request.status)
    );

  const hasAcceptedConnection =
    Boolean(targetAppUserId) &&
    connections.some((connection) => {
      const sameUsers =
        (connection.fromUserId === user.id && connection.toUserId === targetAppUserId) ||
        (connection.fromUserId === targetAppUserId && connection.toUserId === user.id);

      return sameUsers && connection.status === "accepted";
    });

  const connectionRules = evaluateConnectionRules({
    currentUserPhase,
    targetProfilePhase: profileStatus,
    connectionState: hasAcceptedConnection ? "accepted" : "none",
  });

  const canSeeFullProfile =
    currentUserPhase === "verified" &&
    profileIsVerified &&
    hasAcceptedConnection &&
    connectionRules.canShowFullProfile;

  const canRequestContactInformation =
    currentUserPhase === "verified" &&
    Boolean(targetAppUserId) &&
    targetAppUserId !== user.id &&
    !hasPendingOutgoingContactInformationRequest;

  const displayName = canSeeFullProfile ? profile.name : getFirstName(profile.name);
  const displayRole = canSeeFullProfile ? profile.role : "Informações restritas";

  const displayLocation = getDisplayLocation({
    canSeeFullProfile,
    city: profile.city,
    state: profile.state,
  });

  const shouldHideProfilePhoto = !profileIsVerified || shouldProtectVerifiedProfile;

  const restrictedBasicInfo = getRestrictedBasicInfo({
    currentUserPhase,
    targetProfilePhase: profileStatus,
  });

  const restrictedAffinitySignals = getRestrictedAffinitySignals();
  const safeProfileBasicInfo = getSafeBasicInfo(profile.basicInfo);

  const localAffinityExplanation = getLocalAffinityExplanation({
    viewer: user,
    target: profile,
    sharedReasons:
      Array.isArray(profile.aiReasons) && profile.aiReasons.length > 0
        ? profile.aiReasons
        : [profile.purpose],
  });

  const additionalAffinityReasons =
    /^essa afinidade apareceu porque\s+/i.test(localAffinityExplanation.text.trim())
      ? localAffinityExplanation.reasons.slice(1)
      : localAffinityExplanation.reasons;

  const affinityExplanationItems = Array.from(
    new Set(
      [
        localAffinityExplanation.text,
        ...additionalAffinityReasons,
        localAffinityExplanation.safetyNotice,
      ].filter((item) => item.trim().length > 0)
    )
  );

  const safeAffinityExplanationItems =
    affinityExplanationItems.length > 0
      ? affinityExplanationItems
      : restrictedAffinitySignals;

  const accessWarningMeta = getAccessWarningMeta({
    currentUserPhase,
    targetProfilePhase: profileStatus,
    connectionMessage: connectionRules.statusMessage,
  });

  const contactButtonLabel = getContactButtonLabel({
    currentUserPhase,
    hasPendingOutgoingContactInformationRequest,
    hasTargetAppUser: Boolean(targetAppUserId),
  });

  const lockedReason = getLockedReason({
    currentUserPhase,
    hasPendingOutgoingContactInformationRequest,
    hasTargetAppUser: Boolean(targetAppUserId),
  });

  const isCurrentUserProfile = rawId === user.id || (targetAppUserId && targetAppUserId === user.id);
  const isUserBlocked = blockedLocally || (targetAppUserId ? isBlocked(targetAppUserId) : false);

  function handleBlockUser() {
    if (!targetAppUserId) {
      Alert.alert("Erro", "Não foi possível identificar o usuário.");
      return;
    }
    setBlockConfirmVisible(true);
  }

  async function confirmBlockUser() {
    setBlockConfirmVisible(false);
    if (!targetAppUserId) return;
    await blockUser(targetAppUserId);
    setBlockedLocally(true);
    Alert.alert(
      "Usuário bloqueado",
      "Este perfil não aparecerá mais para você. Você pode desbloquear nas configurações da sua conta."
    );
  }

  function handleReport() {
    const reportedId = rawId || profileId || targetAppUserId;
    const reportedName = profile?.name ? profile.name.split(" ")[0] : "este usuário";
    router.push(`/report?userId=${reportedId}&userName=${encodeURIComponent(reportedName)}` as never);
  }

  function toggleContactInformationOption(option: string) {
    setSelectedContactInformation((current) => {
      if (current.includes(option)) {
        return current.filter((item) => item !== option);
      }

      return [...current, option];
    });
  }

  function selectAllContactInformationOptions() {
    setSelectedContactInformation(CONTACT_INFORMATION_OPTIONS);
  }

  function clearContactInformationOptions() {
    setSelectedContactInformation([]);
  }

  function openContactInformationSelection() {
    if (!canRequestContactInformation) {
      Alert.alert("Solicitação bloqueada", lockedReason);
      return;
    }

    setSelectedContactInformation([]);
    setContactSelectionVisible(true);
  }

  function closeContactInformationSelection() {
    setContactSelectionVisible(false);
    setSelectedContactInformation([]);
  }

  function sendContactInformationRequest() {
    if (!canRequestContactInformation) {
      setContactSelectionVisible(false);
      Alert.alert("Solicitação bloqueada", lockedReason);
      return;
    }

    if (selectedContactInformation.length === 0) {
      Alert.alert(
        "Selecione as informações",
        "Escolha pelo menos uma informação de contato antes de enviar a solicitação."
      );
      return;
    }

    requestContactInformation(
      targetAppUserId,
      selectedContactInformation,
      "Solicito acesso às informações de contato selecionadas. O compartilhamento depende de aprovação do perfil e não cria elo nem conexão real."
    );

    setContactSelectionVisible(false);
    setSelectedContactInformation([]);

    Alert.alert(
      "Solicitação de informações enviada",
      "Sua solicitação foi enviada. O perfil poderá aceitar, recusar ou compartilhar apenas as informações que desejar. Isso não cria elo, não cria conexão real e não libera contato automaticamente."
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      <View style={[styles.fixedHeader, { backgroundColor: colors.background }]}>
        <Pressable
          style={({ pressed }) => [
            styles.backButton,
            pressed ? styles.buttonPressed : null,
          ]}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>‹</Text>
        </Pressable>

        <Image source={ELUS_LOGO} style={styles.headerLogo} resizeMode="contain" />

        <Pressable
          style={({ pressed }) => [
            styles.planButton,
            { backgroundColor: colors.warning },
            pressed ? styles.buttonPressed : null,
          ]}
          onPress={openPlans}
        >
          <Ionicons name="diamond" size={17} color="#1A1200" />
          <Text style={styles.planButtonText}>Planos</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.heroCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.photoWrapper}>
            <View
              style={[
                styles.photoFrame,
                { backgroundColor: colors.surfaceElevated },
                visibleProfileStatus === "in_review" ? styles.reviewPhotoFrame : null,
                visibleProfileStatus === "unverified" ? styles.restrictedPhotoFrame : null,
              ]}
            >
              {shouldHideProfilePhoto ? (
                <View style={styles.restrictedPhotoContent}>
                  <Image
                    source={getStatusIcon(visibleProfileStatus)}
                    style={styles.restrictedPhotoIcon}
                    resizeMode="contain"
                  />

                  <Text
                    style={[
                      styles.restrictedPhotoText,
                      { color: getStatusColor(visibleProfileStatus, colors) },
                    ]}
                  >
                    {getRestrictedPhotoText({
                      status: visibleProfileStatus,
                      isProtectedVerifiedProfile: shouldProtectVerifiedProfile,
                    })}
                  </Text>
                </View>
              ) : profile.photoUrl ? (
                <Image source={{ uri: profile.photoUrl }} style={styles.profilePhoto} />
              ) : (
                <View style={styles.restrictedPhotoContent}>
                  <Text style={styles.photoFallbackText}>
                    {getFirstName(profile.name).slice(0, 2).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>

            <PhotoStatusBadge status={visibleProfileStatus} />
          </View>

          <View style={styles.profileMainInfo}>
            <Text style={[styles.profileKind, { color: colors.textMuted }]}>{profile.kind}</Text>
            <Text style={styles.profileName}>{displayName}</Text>
            <Text style={[styles.profileRole, { color: colors.text }]}>{displayRole}</Text>

            <Text style={[styles.profileLocation, { color: colors.textMuted }]}>{displayLocation}</Text>

            <StatusPill status={visibleProfileStatus} label={visibleProfileStatusLabel} />
          </View>
        </View>

        {localAffinityExplanation.reasons.length > 0 && (
          <View style={styles.affinityContextCard}>
            <View style={styles.affinityContextHeader}>
              <Text style={[styles.affinityContextEyebrow, { color: colors.accent }]}>IA ELUS</Text>
              <Text style={styles.affinityContextTitle}>
                Por que essa pessoa apareceu para você
              </Text>
            </View>
            {localAffinityExplanation.reasons.slice(0, 3).map((reason, index) => (
              <View key={`affinity-ctx-${index}`} style={styles.affinityContextRow}>
                <View style={[styles.affinityContextDot, { backgroundColor: colors.accent }]} />
                <Text style={styles.affinityContextText}>{reason}</Text>
              </View>
            ))}
            {localAffinityExplanation.safetyNotice ? (
              <Text style={styles.affinityContextNotice}>
                {localAffinityExplanation.safetyNotice}
              </Text>
            ) : null}
          </View>
        )}

        {!canSeeFullProfile ? (
          <View
            style={[
              styles.warningCard,
              {
                backgroundColor: getStatusSoftColor(accessWarningMeta.status),
                borderColor: getStatusBorderColor(accessWarningMeta.status),
              },
            ]}
          >
            <View style={styles.warningIconWrap}>
              <ElusStatusIcon status={accessWarningMeta.status} size={54} />
            </View>

            <View style={styles.warningTextBox}>
              <Text
                style={[
                  styles.warningTitle,
                  {
                    color: getStatusColor(accessWarningMeta.status, colors),
                  },
                ]}
              >
                {accessWarningMeta.title}
              </Text>

              <Text style={[styles.warningText, { color: colors.textMuted }]}>{accessWarningMeta.text}</Text>
            </View>
          </View>
        ) : null}

        {canSeeFullProfile ? (
          <>
            <Section title="Sobre">
              <Text style={[styles.paragraph, { color: colors.textMuted }]}>{profile.bio}</Text>
            </Section>

            <Section title="Objetivo no ELUS">
              <Text style={[styles.paragraph, { color: colors.textMuted }]}>{profile.purpose}</Text>
            </Section>

            <Section title="Dados básicos visíveis">
              <BulletList items={safeProfileBasicInfo} />
            </Section>

            <Section title="Interesses">
              <View style={styles.tagsContainer}>
                {(profile.interests ?? []).map((interest) => (
                  <View key={interest} style={styles.tag}>
                    <Text style={styles.tagText}>{interest}</Text>
                  </View>
                ))}
              </View>
            </Section>

            <Section title="Por que essa afinidade apareceu?">
              <View style={styles.aiCard}>
                <Text style={styles.aiLabel}>IA ELUS</Text>
                <BulletList items={safeAffinityExplanationItems} />
              </View>
            </Section>
          </>
        ) : (
          <>
            <Section title="Dados básicos visíveis">
              <BulletList items={restrictedBasicInfo} />
            </Section>

            <Section title="Afinidade limitada">
              <View style={styles.aiCard}>
                <Text style={styles.aiLabel}>IA ELUS</Text>
                <BulletList items={safeAffinityExplanationItems} />
              </View>
            </Section>

            <Section title="Informações restritas">
              <Text style={[styles.paragraph, { color: colors.textMuted }]}>
                O ELUS protege dados completos até que a verificação necessária
                esteja concluída e exista aprovação adequada. Isso reduz
                exposição indevida, perfis não verificados, bots e solicitações
                inseguras.
              </Text>
            </Section>
          </>
        )}

        <Section title="Contato">
          <View style={[styles.contactCard, { borderColor: colors.border }]}>
            <Text style={styles.contactTitle}>Dados protegidos</Text>

            <Text style={[styles.contactText, { color: colors.textMuted }]}>
              Telefone, WhatsApp, e-mail e dados sensíveis não aparecem
              automaticamente. Informações de contato só serão compartilhadas após
              solicitação e aprovação de quem recebe. Isso não cria elo nem
              conexão real.
            </Text>

            <Pressable
              style={({ pressed }) => [
                styles.contactButton,
                !canRequestContactInformation ? styles.contactButtonDisabled : null,
                !canRequestContactInformation ? { backgroundColor: colors.border } : null,
                pressed ? styles.buttonPressed : null,
              ]}
              onPress={openContactInformationSelection}
            >
              <Text
                style={[
                  styles.contactButtonText,
                  { color: colors.background },
                  !canRequestContactInformation ? styles.contactButtonTextDisabled : null,
                  !canRequestContactInformation ? { color: colors.textSoft } : null,
                ]}
              >
                {contactButtonLabel}
              </Text>
            </Pressable>

            {!canRequestContactInformation && lockedReason ? (
              <Text style={[styles.lockedReason, { color: colors.textSoft }]}>{lockedReason}</Text>
            ) : null}
          </View>
        </Section>

        {!isCurrentUserProfile ? (
          <View style={styles.safetyActionsRow}>
            <Pressable
              style={({ pressed }) => [
                styles.safetyButton,
                styles.safetyButtonBlock,
                isUserBlocked && styles.safetyButtonBlocked,
                isUserBlocked && { borderColor: colors.border },
                pressed && styles.buttonPressed,
              ]}
              onPress={handleBlockUser}
              disabled={isUserBlocked}
            >
              <Text style={[styles.safetyButtonText, isUserBlocked && styles.safetyButtonTextBlocked]}>
                {isUserBlocked ? "✓ Bloqueado" : "Bloquear"}
              </Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.safetyButton,
                styles.safetyButtonReport,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleReport}
            >
              <Text style={styles.safetyButtonText}>Denunciar</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.footerSpace} />
      </ScrollView>

      <Modal
        visible={blockConfirmVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setBlockConfirmVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <Text style={styles.modalTitle}>Bloquear usuário?</Text>
            <Text style={[styles.modalText, { color: colors.textMuted }]}>
              Este perfil não aparecerá mais para você no Campo, no Explorar nem nas solicitações.
              Você poderá desbloqueá-lo nas configurações da sua conta.
            </Text>
            <View style={styles.modalActions}>
              <Pressable
                style={({ pressed }) => [styles.modalCancelButton, pressed && styles.buttonPressed]}
                onPress={() => setBlockConfirmVisible(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.modalSendButton, { backgroundColor: colors.danger }, pressed && styles.buttonPressed]}
                onPress={confirmBlockUser}
              >
                <Text style={[styles.modalSendButtonText, { color: "#FFFFFF" }]}>Bloquear</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={contactSelectionVisible}
        transparent
        animationType="fade"
        onRequestClose={closeContactInformationSelection}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface }]}>
            <Text style={styles.modalTitle}>Selecionar informações</Text>

            <Text style={[styles.modalText, { color: colors.textMuted }]}>
              Escolha exatamente quais contatos deseja solicitar. O perfil pode
              aceitar, recusar ou compartilhar apenas parte das informações.
            </Text>

            <View style={styles.modalRulesCard}>
              <Ionicons name="shield-checkmark-outline" size={18} color={colors.accent} />
              <Text style={[styles.modalRulesText, { color: colors.textMuted }]}>
                Este pedido não cria elo, não vira conexão real e não libera borda
                colorida.
              </Text>
            </View>

            <View style={styles.modalQuickActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.modalSmallButton,
                  pressed ? styles.buttonPressed : null,
                ]}
                onPress={selectAllContactInformationOptions}
              >
                <Text style={styles.modalSmallButtonText}>Selecionar tudo</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.modalSmallButton,
                  pressed ? styles.buttonPressed : null,
                ]}
                onPress={clearContactInformationOptions}
              >
                <Text style={styles.modalSmallButtonText}>Limpar</Text>
              </Pressable>
            </View>

            <ScrollView
              style={styles.optionsScroll}
              contentContainerStyle={styles.optionsContent}
              showsVerticalScrollIndicator={false}
            >
              {CONTACT_INFORMATION_OPTIONS.map((option) => {
                const selected = selectedContactInformation.includes(option);

                return (
                  <Pressable
                    key={option}
                    style={({ pressed }) => [
                      styles.optionRow,
                      { borderColor: colors.border },
                      selected ? styles.optionRowSelected : null,
                      pressed ? styles.buttonPressed : null,
                    ]}
                    onPress={() => toggleContactInformationOption(option)}
                  >
                    <View
                      style={[
                        styles.optionCheckbox,
                        selected ? styles.optionCheckboxSelected : null,
                        selected ? { backgroundColor: colors.accent, borderColor: colors.accent } : null,
                      ]}
                    >
                      {selected ? (
                        <Ionicons name="checkmark" size={16} color={colors.background} />
                      ) : null}
                    </View>

                    <Text
                      style={[
                        styles.optionText,
                        { color: colors.textMuted },
                        selected ? styles.optionTextSelected : null,
                      ]}
                    >
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable
                style={({ pressed }) => [
                  styles.modalCancelButton,
                  pressed ? styles.buttonPressed : null,
                ]}
                onPress={closeContactInformationSelection}
              >
                <Text style={styles.modalCancelButtonText}>Cancelar</Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.modalSendButton,
                  { backgroundColor: colors.accent },
                  selectedContactInformation.length === 0
                    ? styles.modalSendButtonDisabled
                    : null,
                  selectedContactInformation.length === 0
                    ? { backgroundColor: colors.border }
                    : null,
                  pressed ? styles.buttonPressed : null,
                ]}
                onPress={sendContactInformationRequest}
              >
                <Text
                  style={[
                    styles.modalSendButtonText,
                    { color: colors.background },
                    selectedContactInformation.length === 0
                      ? styles.modalSendButtonTextDisabled
                      : null,
                    selectedContactInformation.length === 0
                      ? { color: colors.textSoft }
                      : null,
                  ]}
                >
                  Enviar solicitação
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  fixedHeader: {
    height: 72,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  backButtonText: {
    color: "#FFFFFF",
    fontSize: 34,
    lineHeight: 36,
    marginTop: -2,
  },

  headerLogo: {
    width: 118,
    height: 34,
  },

  planButton: {
    minWidth: 86,
    height: 40,
    paddingHorizontal: 15,
    borderRadius: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    borderWidth: 1,
    borderColor: "#A9823A",
  },

  planButtonText: {
    color: "#1A1200",
    fontSize: 14,
    fontWeight: "900",
  },

  buttonPressed: {
    opacity: 0.72,
  },

  scroll: {
    flex: 1,
  },

  content: {
    padding: 18,
    paddingBottom: 32,
  },

  affinityContextCard: {
    marginTop: 12,
    marginBottom: 4,
    padding: 16,
    borderRadius: 22,
    backgroundColor: 'rgba(38,217,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(38,217,255,0.22)',
  },

  affinityContextHeader: {
    marginBottom: 12,
  },

  affinityContextEyebrow: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },

  affinityContextTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 20,
  },

  affinityContextRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },

  affinityContextDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 7,
    marginRight: 10,
    flexShrink: 0,
  },

  affinityContextText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 20,
    color: 'rgba(210,218,236,0.85)',
    fontWeight: '600',
  },

  affinityContextNotice: {
    marginTop: 10,
    fontSize: 11,
    lineHeight: 17,
    color: 'rgba(157,187,255,0.75)',
    fontWeight: '700',
    fontStyle: 'italic',
  },

  heroCard: {
    borderRadius: 30,
    padding: 18,
    borderWidth: 1,
  },

  photoWrapper: {
    width: "100%",
    position: "relative",
  },

  photoFrame: {
    width: "100%",
    height: 310,
    borderRadius: 26,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  restrictedPhotoFrame: {
    backgroundColor: "rgba(239,68,68,0.08)",
    borderColor: "rgba(239,68,68,0.28)",
  },

  reviewPhotoFrame: {
    backgroundColor: "rgba(157,187,255,0.10)",
    borderColor: "rgba(157,187,255,0.38)",
  },

  restrictedPhotoContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  restrictedPhotoIcon: {
    width: 118,
    height: 118,
    marginBottom: 16,
  },

  restrictedPhotoText: {
    fontSize: 18,
    fontWeight: "900",
    textAlign: "center",
  },

  photoFallbackText: {
    color: "#FFFFFF",
    fontSize: 38,
    fontWeight: "900",
  },

  profilePhoto: {
    width: "100%",
    height: "100%",
  },

  photoStatusBadge: {
    position: "absolute",
    bottom: 10,
    right: 10,
  },

  profileMainInfo: {
    paddingTop: 18,
  },

  profileKind: {
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 6,
  },

  profileName: {
    color: "#FFFFFF",
    fontSize: 31,
    fontWeight: "900",
    letterSpacing: -0.8,
  },

  profileRole: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 6,
  },

  profileLocation: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 6,
    marginBottom: 14,
  },

  statusPill: {
    alignSelf: "flex-start",
    minHeight: 38,
    borderRadius: 19,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    gap: 8,
  },

  statusText: {
    fontSize: 13,
    fontWeight: "800",
  },

  warningCard: {
    marginTop: 16,
    borderRadius: 24,
    padding: 16,
    flexDirection: "row",
    borderWidth: 1,
  },

  warningIconWrap: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  warningTextBox: {
    flex: 1,
  },

  warningTitle: {
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 5,
  },

  warningText: {
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "600",
  },

  section: {
    marginTop: 18,
    borderRadius: 24,
    padding: 18,
    backgroundColor: "#080D16",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.09)",
  },

  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 12,
    letterSpacing: -0.3,
  },

  paragraph: {
    fontSize: 15,
    lineHeight: 23,
    fontWeight: "600",
  },

  bulletList: {
    gap: 10,
  },

  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  bulletDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
    marginTop: 7,
    marginRight: 10,
    opacity: 0.82,
  },

  bulletText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "600",
  },

  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  tag: {
    borderRadius: 18,
    paddingHorizontal: 13,
    paddingVertical: 9,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.11)",
  },

  tagText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  aiCard: {
    borderRadius: 20,
    padding: 15,
    backgroundColor: "rgba(102,92,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(102,92,255,0.28)",
  },

  aiLabel: {
    alignSelf: "flex-start",
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    marginBottom: 12,
    opacity: 0.9,
  },

  contactCard: {
    borderRadius: 20,
    padding: 15,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
  },

  contactTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 8,
  },

  contactText: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "600",
    marginBottom: 14,
  },

  contactButton: {
    minHeight: 48,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  contactButtonDisabled: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },

  contactButtonText: {
    fontSize: 15,
    fontWeight: "900",
    textAlign: "center",
  },

  contactButtonTextDisabled: {},

  lockedReason: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
    marginTop: 10,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    padding: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  modalCard: {
    width: "100%",
    maxHeight: "88%",
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    padding: 18,
  },

  modalTitle: {
    color: "#FFFFFF",
    fontSize: 26,
    lineHeight: 31,
    fontWeight: "900",
    letterSpacing: -0.5,
  },

  modalText: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "600",
    marginTop: 10,
  },

  modalRulesCard: {
    marginTop: 14,
    borderRadius: 18,
    padding: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(34,211,238,0.08)",
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.25)",
  },

  modalRulesText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "800",
    marginLeft: 8,
  },

  modalQuickActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },

  modalSmallButton: {
    flex: 1,
    minHeight: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  modalSmallButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },

  optionsScroll: {
    marginTop: 12,
    maxHeight: 330,
  },

  optionsContent: {
    paddingBottom: 4,
    gap: 8,
  },

  optionRow: {
    minHeight: 48,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
  },

  optionRowSelected: {
    backgroundColor: "rgba(34,211,238,0.13)",
    borderColor: "rgba(34,211,238,0.42)",
  },

  optionCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },

  optionCheckboxSelected: {},

  optionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "800",
  },

  optionTextSelected: {
    color: "#FFFFFF",
  },

  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },

  modalCancelButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },

  modalCancelButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "900",
  },

  modalSendButton: {
    flex: 1.35,
    minHeight: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },

  modalSendButtonDisabled: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.13)",
  },

  modalSendButtonText: {
    fontSize: 14,
    fontWeight: "900",
    textAlign: "center",
  },

  modalSendButtonTextDisabled: {},

  notFoundContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },

  notFoundImage: {
    width: 92,
    height: 92,
    marginBottom: 18,
    opacity: 0.92,
  },

  notFoundTitle: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 10,
  },

  notFoundText: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "600",
    textAlign: "center",
  },

  notFoundId: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 16,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },

  safetyActionsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 4,
  },

  safetyButton: {
    flex: 1,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  safetyButtonBlock: {
    backgroundColor: "rgba(239,68,68,0.07)",
    borderColor: "rgba(239,68,68,0.25)",
  },

  safetyButtonBlocked: {
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  safetyButtonReport: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: "rgba(255,255,255,0.12)",
  },

  safetyButtonText: {
    color: "rgba(239,68,68,0.80)",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.2,
  },

  safetyButtonTextBlocked: {
    color: "rgba(255,255,255,0.35)",
  },

  footerSpace: {
    height: 20,
  },
});
