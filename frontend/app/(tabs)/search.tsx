import React, { useEffect, useMemo, useState } from "react";
import {
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

import { useApp, type AppUser } from "../../src/context/AppContext";
import { appUserToProfile } from "../../src/utils/adaptSupabaseProfile";
import type { Profile } from "../../src/data/profiles";
import { getLocalAffinityExplanation } from "../../src/utils/elusIntelligenceRules";
import { Chip } from "../../src/components/Chip";

const ELUS_LOGO = require("../../assets/images/elus-logo.png");
const ELUS_UNVERIFIED_RED = require("../../assets/images/elus-unverified-red.png");
const ELUS_IN_REVIEW_BLUE = require("../../assets/images/elus-symbol-cyan-purple.png");
const ELUS_VERIFIED_GREEN = require("../../assets/images/elus-verified-green.png");

const COLORS = {
  bg: "#0B101A",
  card: "#141A26",
  cardSoft: "#1C2433",
  cardDeep: "#080D16",
  border: "rgba(255,255,255,0.08)",
  borderSoft: "rgba(255,255,255,0.10)",
  borderStrong: "rgba(255,255,255,0.14)",
  white: "#EDEDED",
  muted: "#6B7280",
  muted2: "#A1A9B8",
  blue: "#5E9EAB",
  blueSoft: "rgba(94,158,171,0.18)",
  cyan: "#5E9EAB",
  cyanSoft: "rgba(94,158,171,0.15)",
  purple: "#8B7EA8",
  purpleSoft: "rgba(139,126,168,0.12)",
  gold: "#C49A45",
  goldSoft: "rgba(196,154,69,0.12)",
  red: "#B85C5C",
  redSoft: "rgba(184,92,92,0.12)",
  green: "#4A9A65",
  greenSoft: "rgba(74,154,101,0.12)",
  blueLight: "#8FA3B8",
  blueLightSoft: "rgba(143,163,184,0.14)",
  darkButton: "rgba(255,255,255,0.06)",
};

type VerificationPhase = "verified" | "in_review" | "unverified";

type FilterKind =
  | "Todos"
  | "Pessoa"
  | "Empresa"
  | "Serviço"
  | "Interesse"
  | "Profissional"
  | "Família"
  | "Apoio";

const FILTERS: FilterKind[] = [
  "Todos",
  "Pessoa",
  "Empresa",
  "Serviço",
  "Interesse",
  "Profissional",
  "Família",
  "Apoio",
];

function normalizeText(value: string): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function safeArray(value?: string[]): string[] {
  return Array.isArray(value) ? value : [];
}

function getFirstName(profile: Profile): string {
  return profile.firstName || profile.name.split(" ")[0] || profile.name;
}

function getUserVerificationPhase(
  verificationStatus?: string,
  verified?: boolean
): VerificationPhase {
  const status = normalizeText(String(verificationStatus ?? ""));

  const verifiedStatuses = ["verified", "verificado", "approved", "aprovado"];

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

  const unverifiedStatuses = [
    "",
    "none",
    "unverified",
    "not_verified",
    "nao_verificado",
    "não_verificado",
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

  if (verified === true) {
    return "verified";
  }

  return "unverified";
}

function getProfileVerificationPhase(profile: Profile): VerificationPhase {
  const status = normalizeText(
    String((profile as any).verificationStatus ?? profile.status ?? "")
  );

  const verifiedStatuses = [
    "verified",
    "verificado",
    "approved",
    "aprovado",
    "official_protected",
    "perfil_oficial_protegido",
    "oficial_protegido",
  ];

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

  const unverifiedStatuses = [
    "",
    "none",
    "unverified",
    "not_verified",
    "nao_verificado",
    "não_verificado",
    "pending",
    "pendente",
    "verification_pending",
    "verificacao_pendente",
    "verificação_pendente",
    "rejected",
    "recusado",
  ];

  if (verifiedStatuses.includes(status)) {
    return "verified";
  }

  if (inReviewStatuses.includes(status)) {
    return "in_review";
  }

  if (unverifiedStatuses.includes(status)) {
    return "unverified";
  }

  return "unverified";
}

function isVerifiedProfile(profile: Profile): boolean {
  return getProfileVerificationPhase(profile) === "verified";
}

function shouldProtectProfileVerificationPhase({
  currentUserVerified,
  profilePhase,
}: {
  currentUserVerified: boolean;
  profilePhase: VerificationPhase;
}) {
  return !currentUserVerified && profilePhase === "verified";
}

function getVisibleProfileVerificationPhase({
  currentUserVerified,
  profilePhase,
}: {
  currentUserVerified: boolean;
  profilePhase: VerificationPhase;
}): VerificationPhase {
  if (
    shouldProtectProfileVerificationPhase({
      currentUserVerified,
      profilePhase,
    })
  ) {
    return "in_review";
  }

  return profilePhase;
}

function getStatusColor(phase: VerificationPhase): string {
  if (phase === "verified") {
    return COLORS.green;
  }

  if (phase === "in_review") {
    return COLORS.blueLight;
  }

  return COLORS.red;
}

function getStatusImage(phase: VerificationPhase) {
  if (phase === "verified") {
    return ELUS_VERIFIED_GREEN;
  }

  if (phase === "in_review") {
    return ELUS_IN_REVIEW_BLUE;
  }

  return ELUS_UNVERIFIED_RED;
}

function getProfileText(profile: Profile): string {
  return normalizeText(
    [
      profile.id,
      ...safeArray(profile.aliases),
      profile.name,
      profile.firstName,
      profile.kind,
      profile.role,
      profile.city,
      profile.state,
      profile.area,
      profile.purpose,
      profile.bio,
      ...safeArray(profile.interests),
      ...safeArray(profile.basicInfo),
      ...safeArray(profile.aiReasons),
    ]
      .filter(Boolean)
      .join(" ")
  );
}

function getProfileWords(profile: Profile): string[] {
  return getProfileText(profile)
    .split(/[^a-z0-9]+/g)
    .filter(Boolean);
}

function profileMatchesFilter(profile: Profile, filter: FilterKind): boolean {
  if (filter === "Todos") {
    return true;
  }

  if (filter === "Pessoa" || filter === "Empresa") {
    return profile.kind === filter;
  }

  const text = getProfileText(profile);
  const normalizedFilter = normalizeText(filter);

  if (filter === "Serviço") {
    return (
      text.includes("servico") ||
      text.includes("servicos") ||
      text.includes("prestador") ||
      text.includes("manutencao") ||
      text.includes("atendimento")
    );
  }

  if (filter === "Profissional") {
    return (
      text.includes("profissional") ||
      text.includes("empresa") ||
      text.includes("comercio") ||
      text.includes("negocio") ||
      text.includes("negocios") ||
      profile.kind === "Empresa"
    );
  }

  if (filter === "Família") {
    return text.includes("familia") || text.includes("apoio familiar");
  }

  if (filter === "Apoio") {
    return text.includes("apoio") || text.includes("ajuda");
  }

  return text.includes(normalizedFilter);
}

function getProfilesForFilter(
  filter: FilterKind,
  currentUserId: string,
  allProfiles: Profile[]
): Profile[] {
  const base = allProfiles.filter((p) => String(p.id) !== currentUserId);

  if (filter === "Pessoa") {
    return base.filter((p) => p.kind === "Pessoa");
  }

  if (filter === "Empresa") {
    return base.filter((p) => p.kind === "Empresa");
  }

  return base.filter((profile) => profileMatchesFilter(profile, filter));
}

function scoreProfileForQuery(profile: Profile, query: string): number {
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) {
    return 0;
  }

  const queryTokens = normalizedQuery.split(/\s+/g).filter(Boolean);
  const name = normalizeText(profile.name);
  const firstName = normalizeText(getFirstName(profile));
  const aliases = safeArray(profile.aliases).map(normalizeText);
  const role = normalizeText(profile.role || "");
  const city = normalizeText(profile.city || "");
  const area = normalizeText(profile.area || "");
  const kind = normalizeText(profile.kind || "");
  const purpose = normalizeText(profile.purpose || "");
  const bio = normalizeText(profile.bio || "");
  const interests = safeArray(profile.interests).map(normalizeText);
  const words = getProfileWords(profile);

  let score = 0;

  if (firstName === normalizedQuery) {
    score += 1000;
  }

  if (name === normalizedQuery) {
    score += 950;
  }

  if (name.startsWith(normalizedQuery)) {
    score += 800;
  }

  if (firstName.startsWith(normalizedQuery)) {
    score += 760;
  }

  if (aliases.some((alias) => alias === normalizedQuery)) {
    score += 730;
  }

  if (aliases.some((alias) => alias.startsWith(normalizedQuery))) {
    score += 680;
  }

  if (city.startsWith(normalizedQuery)) {
    score += 250;
  }

  if (role.startsWith(normalizedQuery) || area.startsWith(normalizedQuery)) {
    score += 220;
  }

  if (kind.startsWith(normalizedQuery)) {
    score += 190;
  }

  if (interests.some((interest) => interest.startsWith(normalizedQuery))) {
    score += 170;
  }

  const allTokensMatch = queryTokens.every((token) =>
    words.some((word) => word === token || word.startsWith(token))
  );

  if (allTokensMatch) {
    score += 120;
  }

  if (purpose.includes(normalizedQuery) || bio.includes(normalizedQuery)) {
    score += 35;
  }

  return score;
}

function searchProfilesSafely(profiles: Profile[], query: string): Profile[] {
  return profiles
    .map((profile) => ({
      profile,
      score: scoreProfileForQuery(profile, query),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.profile);
}

/**
 * Calcula a pontuação de afinidade contextual entre o usuário atual e um perfil.
 * Pontuação por campo:
 *   +3 — mesma cidade
 *   +2 — mesmo estado
 *   +2 — mesmo tipo de perfil (person/business)
 *   +1 por interesse em comum (máx. 4)
 *   +1 por preferência em comum (máx. 2)
 *   +1 — modo de presença complementar (offer_service + need_service)
 * Retorna o total de pontos (0..n).
 */
function computeAffinityScore(currentUser: AppUser, profile: Profile): number {
  let score = 0;

  const currentCity = normalizeText(currentUser.city ?? "");
  const currentState = normalizeText(currentUser.state ?? "");
  const profileCity = normalizeText(profile.city ?? "");
  const profileState = normalizeText(profile.state ?? "");

  if (currentCity && profileCity && currentCity === profileCity) {
    score += 3;
  } else if (currentState && profileState && currentState === profileState) {
    score += 2;
  }

  // Tipo de perfil
  const profileKind = normalizeText(profile.kind ?? "");
  const isCurrentPerson = currentUser.profileType === "person";
  const isProfilePerson = profileKind === "pessoa";
  if (isCurrentPerson === isProfilePerson) {
    score += 2;
  }

  // Interesses em comum
  const currentInterests = (currentUser.interests ?? []).map(normalizeText);
  const profileInterests = safeArray(profile.interests).map(normalizeText);
  const sharedInterests = currentInterests.filter((i) =>
    profileInterests.some((pi) => pi.includes(i) || i.includes(pi))
  );
  score += Math.min(sharedInterests.length, 4);

  // Preferências em comum
  const currentPreferences = (currentUser.preferences ?? []).map(normalizeText);
  const profileBio = normalizeText(profile.bio ?? "") + " " + normalizeText(profile.purpose ?? "");
  const sharedPreferences = currentPreferences.filter((p) => profileBio.includes(p));
  score += Math.min(sharedPreferences.length, 2);

  // Modo de presença complementar
  if (
    (currentUser.presenceMode === "offer_service" &&
      normalizeText(profile.purpose ?? "").includes("servic")) ||
    (currentUser.presenceMode === "need_service" &&
      (profile.kind === "Empresa" ||
        normalizeText(profile.role ?? "").includes("servic")))
  ) {
    score += 1;
  }

  return score;
}

function sortProfilesByAffinity(profiles: Profile[], currentUser: AppUser): Profile[] {
  return [...profiles].sort(
    (a, b) => computeAffinityScore(currentUser, b) - computeAffinityScore(currentUser, a)
  );
}

function getVisibleName(profile: Profile, canSeeFullProfile: boolean): string {
  if (canSeeFullProfile) {
    return profile.name;
  }

  return getFirstName(profile);
}

function getStatusLabel(profile: Profile, currentUserVerified: boolean): string {
  const phase = getProfileVerificationPhase(profile);

  if (!currentUserVerified) {
    if (phase === "verified") {
      return "Perfil protegido";
    }

    if (phase === "in_review") {
      return "Aguardando aprovação";
    }

    return "Dados limitados";
  }

  if (phase === "verified") {
    return "Identidade verificada";
  }

  if (phase === "in_review") {
    return "Aguardando aprovação";
  }

  return "Verificação pendente";
}

function getConnectionProfileId(connection: unknown) {
  if (typeof connection === "string" || typeof connection === "number") {
    return String(connection);
  }

  if (connection && typeof connection === "object") {
    const value = connection as Record<string, unknown>;

    return String(
      value.profileId ??
        value.targetProfileId ??
        value.targetId ??
        value.userId ??
        value.id ??
        ""
    );
  }

  return "";
}

function branchHasProfile(branch: any, profile: Profile) {
  if (!Array.isArray(branch?.connections)) {
    return false;
  }

  return branch.connections.some(
    (connection: unknown) => getConnectionProfileId(connection) === profile.id
  );
}

function hasAcceptedRealConnection({
  profile,
  currentUserVerified,
  profileVerified,
  connectionBranches,
}: {
  profile: Profile;
  currentUserVerified: boolean;
  profileVerified: boolean;
  connectionBranches: any[];
}) {
  if (!currentUserVerified || !profileVerified) {
    return false;
  }

  return connectionBranches.some((branch) => branchHasProfile(branch, profile));
}

function cleanAffinityReason(reason: string): string {
  return String(reason ?? "")
    .replace(/^essa conexão apareceu porque\s+/i, "")
    .replace(/^essa afinidade apareceu porque\s+/i, "")
    .replace(/\.$/, "")
    .trim();
}

function getCleanAffinityReasons({
  profile,
  fallbackReasons,
}: {
  profile: Profile;
  fallbackReasons: string[];
}): string[] {
  const profileReasons = safeArray(profile.aiReasons);
  const baseReasons =
    profileReasons.length > 0
      ? profileReasons
      : fallbackReasons.length > 0
        ? fallbackReasons
        : [profile.purpose];

  return baseReasons
    .map(cleanAffinityReason)
    .filter((reason) => reason.length > 0)
    .slice(0, 2);
}

function SearchAvatar({
  profile,
  canSeeFullProfile,
  currentUserVerified,
  size,
}: {
  profile: Profile;
  canSeeFullProfile: boolean;
  currentUserVerified: boolean;
  size: number;
}) {
  const phase = getProfileVerificationPhase(profile);
  const visiblePhase = getVisibleProfileVerificationPhase({
    currentUserVerified,
    profilePhase: phase,
  });

  const showRealPhoto =
    currentUserVerified === true &&
    phase === "verified" &&
    Boolean(profile.photoUrl);

  const borderColor = canSeeFullProfile
    ? "rgba(255,255,255,0.34)"
    : "rgba(255,255,255,0.14)";

  return (
    <View
      style={[
        styles.avatarWrap,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor,
        },
      ]}
    >
      {showRealPhoto ? (
        <Image
          source={{ uri: profile.photoUrl }}
          style={{
            width: size - 10,
            height: size - 10,
            borderRadius: (size - 10) / 2,
          }}
          resizeMode="cover"
        />
      ) : (
        <Image
          source={getStatusImage(visiblePhase)}
          style={{
            width: size * 0.58,
            height: size * 0.58,
          }}
          resizeMode="contain"
        />
      )}

      <View style={styles.statusBadge}>
        <Image
          source={getStatusImage(visiblePhase)}
          style={styles.statusBadgeImage}
          resizeMode="contain"
        />
      </View>
    </View>
  );
}

function Tag({ label, muted }: { label: string; muted?: boolean }) {
  const normalized = normalizeText(label);

  const color = normalized.includes("profissional")
    ? COLORS.gold
    : normalized.includes("apoio")
      ? "#FF9F1C"
      : normalized.includes("interesse") || normalized.includes("design")
        ? COLORS.cyan
        : normalized.includes("preferencia")
          ? COLORS.purple
          : normalized.includes("seguranca")
            ? COLORS.blueLight
            : COLORS.muted;

  return (
    <View
      style={[
        styles.tag,
        {
          borderColor: muted ? "rgba(157,187,255,0.32)" : `${color}88`,
          backgroundColor: muted ? "rgba(157,187,255,0.06)" : "transparent",
        },
      ]}
    >
      <Text style={[styles.tagText, { color: muted ? COLORS.blueLight : color }]}>
        • {label}
      </Text>
    </View>
  );
}

function ExploreTrustNotice({
  currentUserPhase,
  onPressVerification,
}: {
  currentUserPhase: VerificationPhase;
  onPressVerification: () => void;
}) {
  const userVerified = currentUserPhase === "verified";
  const noticeColor =
    currentUserPhase === "verified"
      ? COLORS.green
      : currentUserPhase === "in_review"
        ? COLORS.blueLight
        : COLORS.red;

  return (
    <View
      style={[
        styles.exploreTrustNotice,
        {
          borderColor: `${noticeColor}33`,
          backgroundColor:
            currentUserPhase === "verified"
              ? COLORS.greenSoft
              : currentUserPhase === "in_review"
                ? COLORS.blueLightSoft
                : COLORS.redSoft,
        },
      ]}
    >
      <View
        style={[
          styles.exploreTrustIconWrap,
          {
            borderColor: `${noticeColor}44`,
            backgroundColor: `${noticeColor}12`,
          },
        ]}
      >
        <Ionicons
          name={userVerified ? "shield-checkmark-outline" : "shield-outline"}
          size={18}
          color={noticeColor}
        />
      </View>

      <View style={styles.exploreTrustTextWrap}>
        <Text style={styles.exploreTrustText}>
          Contatos protegidos. Conexão real exige verificação e aprovação.
        </Text>

        {!userVerified ? (
          <Pressable
            style={({ pressed }) => [
              styles.exploreTrustButton,
              pressed ? styles.pressed : null,
            ]}
            onPress={onPressVerification}
          >
            <Text style={[styles.exploreTrustButtonText, { color: noticeColor }]}>
              Ver status da verificação
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

function ProfileCard({
  profile,
  currentUser,
  currentUserVerified,
  connectionBranches,
  affinityScore,
}: {
  profile: Profile;
  currentUser: AppUser;
  currentUserVerified: boolean;
  connectionBranches: any[];
  affinityScore?: number;
}) {
  const router = useRouter();

  const profilePhase = getProfileVerificationPhase(profile);
  const visibleProfilePhase = getVisibleProfileVerificationPhase({
    currentUserVerified,
    profilePhase,
  });
  const profileVerified = profilePhase === "verified";
  const shouldProtectVerifiedProfile = shouldProtectProfileVerificationPhase({
    currentUserVerified,
    profilePhase,
  });

  const hasAcceptedConnection = hasAcceptedRealConnection({
    profile,
    currentUserVerified,
    profileVerified,
    connectionBranches,
  });

  const canSeeFullProfile =
    currentUserVerified && profileVerified && hasAcceptedConnection;

  const statusColor = getStatusColor(visibleProfilePhase);
  const visibleName = getVisibleName(profile, canSeeFullProfile);

  const affinityExplanation = getLocalAffinityExplanation({
    viewer: currentUser,
    target: profile,
    sharedReasons: safeArray(profile.aiReasons),
  });

  const affinityColor = visibleProfilePhase === "verified" ? COLORS.cyan : statusColor;

  const affinityReasons = getCleanAffinityReasons({
    profile,
    fallbackReasons: affinityExplanation.reasons,
  });

  const primaryReason =
    affinityReasons[0] ||
    cleanAffinityReason(affinityExplanation.text) ||
    "Afinidade encontrada por contexto e interesses.";

  const visibleDescription = canSeeFullProfile
    ? profile.bio
    : primaryReason;

  const visibleReasonList = canSeeFullProfile
    ? affinityReasons.length > 0
      ? affinityReasons
      : [primaryReason]
    : affinityReasons.slice(1);

  function openProfile() {
    router.push(`/profile/${profile.id}` as never);
  }

  return (
    <Pressable
      onPress={openProfile}
      style={({ pressed }) => [
        styles.profileCard,
        !canSeeFullProfile ? styles.profileCardLimited : null,
        visibleProfilePhase === "unverified" ? styles.profileCardDanger : null,
        pressed ? styles.pressed : null,
      ]}
    >
      <View style={styles.profileTop}>
        <SearchAvatar
          profile={profile}
          canSeeFullProfile={canSeeFullProfile}
          currentUserVerified={currentUserVerified}
          size={76}
        />

        <View style={styles.profileInfo}>
          <View style={styles.profileNameRow}>
            <Text
              numberOfLines={1}
              style={[
                styles.profileName,
                visibleProfilePhase !== "verified" ? { color: statusColor } : null,
              ]}
            >
              {visibleName}
            </Text>

            <Text
              style={[
                styles.profileKind,
                visibleProfilePhase !== "verified" ? { color: statusColor } : null,
              ]}
            >
              {canSeeFullProfile
                ? profile.kind
                : shouldProtectVerifiedProfile
                  ? "Protegido"
                  : profileVerified
                    ? profile.kind
                    : "Limitado"}
            </Text>
          </View>

          <Text numberOfLines={1} style={styles.profileMeta}>
            {canSeeFullProfile
              ? `${profile.city} · ${profile.state}`
              : getStatusLabel(profile, currentUserVerified)}
          </Text>

          {(affinityScore ?? 0) >= 3 && (
            <View style={styles.highAffinityBadge}>
              <Text style={styles.highAffinityBadgeText}>✦ Alta afinidade</Text>
            </View>
          )}

          <Text numberOfLines={2} style={styles.profileDescription}>
            {visibleDescription}
          </Text>

          <View style={styles.tags}>
            {canSeeFullProfile ? (
              safeArray(profile.interests)
                .slice(0, 4)
                .map((tag) => <Tag key={tag} label={tag} />)
            ) : (
              <View
                style={[
                  styles.limitedBadge,
                  {
                    borderColor: `${statusColor}55`,
                    backgroundColor: `${statusColor}12`,
                  },
                ]}
              >
                <Text style={[styles.limitedBadgeText, { color: statusColor }]}>
                  {shouldProtectVerifiedProfile
                    ? "Perfil protegido"
                    : profilePhase === "in_review"
                      ? "Aguardando aprovação"
                      : profilePhase === "verified"
                        ? "Perfil restrito"
                        : "Dados limitados"}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      <View
        style={[
          styles.aiAffinityCard,
          {
            borderColor: `${affinityColor}33`,
            backgroundColor:
              visibleProfilePhase === "verified"
                ? "rgba(38,217,255,0.07)"
                : `${statusColor}10`,
          },
        ]}
      >
        <View style={styles.aiAffinityHeader}>
          <View
            style={[
              styles.aiAffinityIconWrap,
              {
                borderColor: `${affinityColor}44`,
                backgroundColor: `${affinityColor}12`,
              },
            ]}
          >
            <Ionicons name="sparkles-outline" size={15} color={affinityColor} />
          </View>

          <View style={styles.aiAffinityTitleWrap}>
            <Text style={styles.aiAffinityKicker}>Motivo</Text>
            <Text style={styles.aiAffinityTitle}>Por que apareceu</Text>
          </View>
        </View>

        <View style={styles.aiAffinityReasonList}>
          {visibleReasonList.map((reason, index) => (
            <View key={`${profile.id}-reason-${index}`} style={styles.aiAffinityReasonRow}>
              <View
                style={[
                  styles.aiAffinityReasonDot,
                  {
                    backgroundColor: affinityColor,
                  },
                ]}
              />

              <Text style={styles.aiAffinityReasonText}>{reason}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.actions}>
        <Pressable onPress={openProfile} style={styles.secondaryAction}>
          <Text style={styles.secondaryActionText}>
            {canSeeFullProfile ? "Ver perfil" : "Ver perfil restrito"}
          </Text>
        </Pressable>

        <Pressable style={styles.blockAction}>
          <Text style={styles.blockActionText}>Bloquear</Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

function ResultsBlock({
  profiles,
  hasQuery,
  currentUser,
  currentUserVerified,
  connectionBranches,
}: {
  profiles: Profile[];
  hasQuery: boolean;
  currentUser: AppUser;
  currentUserVerified: boolean;
  connectionBranches: any[];
}) {
  return (
    <>
      <View style={styles.resultHeader}>
        <View style={styles.resultTitleWrap}>
          <Text style={styles.sectionEyebrow}>Resultados</Text>

          <Text style={styles.sectionTitle}>Resultados próximos</Text>

          <Text style={styles.sectionSubtitle}>
            {hasQuery
              ? "Resultado da busca em tempo real."
              : "Toque no card para abrir o perfil e decidir o próximo passo."}
          </Text>
        </View>

        <View style={styles.resultBadge}>
          <Text style={styles.resultBadgeText}>{profiles.length}</Text>
        </View>
      </View>

      <View style={styles.cards}>
        {profiles.length > 0 ? (
          profiles.map((profile) => (
            <ProfileCard
              key={profile.id}
              profile={profile}
              currentUser={currentUser}
              currentUserVerified={currentUserVerified}
              connectionBranches={connectionBranches}
              affinityScore={computeAffinityScore(currentUser, profile)}
            />
          ))
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Nenhum resultado encontrado</Text>

            <Text style={styles.emptyText}>
              Tente buscar por nome, primeiro nome, cidade, profissão, interesse
              ou empresa.
            </Text>
          </View>
        )}
      </View>
    </>
  );
}

function buildBaseProfiles(realUsers: AppUser[]): Profile[] {
  const raw = realUsers.map(appUserToProfile);

  const seen = new Set<string>();
  return raw.filter((p) => {
    const key = String(p.id);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function SearchErrorCard({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.emptyCard}>
      <Text style={[styles.emptyTitle, { color: COLORS.red }]}>
        Não foi possível carregar as conexões
      </Text>

      <Text style={styles.emptyText}>
        Verifique sua internet e tente novamente.
      </Text>

      <Pressable
        style={[styles.secondaryAction, { marginTop: 12 }]}
        onPress={onRetry}
      >
        <Text style={styles.secondaryActionText}>Tentar novamente →</Text>
      </Pressable>
    </View>
  );
}

export default function SearchScreen() {
  const router = useRouter();
  const app = useApp() as any;

  const user = app.user as AppUser;
  const getConnectionBranches = app.getConnectionBranches;
  const realUsers: AppUser[] = Array.isArray(app.realUsers) ? app.realUsers : [];

  const [activeFilter, setActiveFilter] = useState<FilterKind>("Todos");
  const [query, setQuery] = useState("");

  const currentUserPhase = getUserVerificationPhase(
    user.verificationStatus,
    user.verified
  );

  const currentUserVerified = currentUserPhase === "verified";
  const currentUserId = String((user as any).id ?? "");

  const trimmedQuery = query.trim();
  const hasQuery = trimmedQuery.length > 0;

  const connectionBranches = useMemo(() => {
    if (typeof getConnectionBranches !== "function") {
      return [];
    }

    const branches = getConnectionBranches();

    if (!Array.isArray(branches)) {
      return [];
    }

    return branches.filter((branch) => Array.isArray(branch?.connections));
  }, [getConnectionBranches]);

  const [retryCount, setRetryCount] = useState(0);
  const [profilesError, setProfilesError] = useState(false);
  const [baseSourceProfiles, setBaseSourceProfiles] = useState<Profile[]>(
    () => buildBaseProfiles(realUsers)
  );

  useEffect(() => {
    setProfilesError(false);
    try {
      setBaseSourceProfiles(buildBaseProfiles(realUsers));
    } catch {
      setProfilesError(true);
      setBaseSourceProfiles([]);
    }
  }, [realUsers, retryCount]);

  const filteredProfiles = useMemo(() => {
    const baseProfiles = getProfilesForFilter(activeFilter, currentUserId, baseSourceProfiles);

    if (hasQuery) {
      return searchProfilesSafely(baseProfiles, trimmedQuery);
    }

    // Sem query: ordena por afinidade contextual
    return sortProfilesByAffinity(baseProfiles, user);
  }, [activeFilter, currentUserId, hasQuery, trimmedQuery, baseSourceProfiles, user]);

  function openVerification() {
    router.push("/verification" as never);
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={styles.content}
      >
        <View style={styles.hero}>
          <Text style={styles.heroEyebrow}>ELUS</Text>

          <Text style={styles.heroTitle}>Buscar conexões</Text>

          <Text style={styles.heroText}>
            Encontre pessoas, empresas, serviços e presenças próximas com contexto, filtros e busca rápida.
          </Text>
        </View>

        <View style={styles.searchBox}>
          <View style={styles.searchIconWrap}>
            <Ionicons name="search-outline" size={21} color={COLORS.cyan} />
          </View>

          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar por nome, serviço ou empresa"
            placeholderTextColor={COLORS.muted}
            style={styles.searchInput}
            autoCorrect={false}
            autoCapitalize="words"
            returnKeyType="search"
          />
        </View>

        <ExploreTrustNotice
          currentUserPhase={currentUserPhase}
          onPressVerification={openVerification}
        />

        <View style={styles.filters}>
          {FILTERS.map((filter) => (
            <Chip
              key={filter}
              label={filter}
              selected={activeFilter === filter}
              onPress={() => setActiveFilter(filter)}
            />
          ))}
        </View>

        {profilesError ? (
          <SearchErrorCard onRetry={() => setRetryCount((c) => c + 1)} />
        ) : (
          <ResultsBlock
            profiles={filteredProfiles}
            hasQuery={hasQuery}
            currentUser={user}
            currentUserVerified={currentUserVerified}
            connectionBranches={connectionBranches}
          />
        )}

        <View style={styles.brandCard}>
          <View style={styles.brandSmallRow}>
            <Image source={ELUS_LOGO} style={styles.brandSmallSymbol} />
            <Text style={styles.brandSmallText}>ELUS</Text>
          </View>

          <Text style={styles.brandCardText}>
            Uma rede contextual para presenças humanas reais.
          </Text>
        </View>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  content: {
    paddingTop: Platform.OS === "ios" ? 18 : 16,
    paddingHorizontal: 18,
    paddingBottom: 120,
  },

  hero: {
    marginBottom: 18,
  },

  heroEyebrow: {
    fontSize: 10,
    lineHeight: 13,
    color: COLORS.cyan,
    fontWeight: "800",
    letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: 7,
  },

  heroTitle: {
    color: COLORS.white,
    fontSize: 31,
    lineHeight: 37,
    fontWeight: "300",
    letterSpacing: -0.5,
    marginBottom: 9,
  },

  heroText: {
    color: COLORS.muted2,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "500",
  },

  searchBox: {
    minHeight: 58,
    borderRadius: 29,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    backgroundColor: COLORS.card,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  searchIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.cyanSoft,
    borderWidth: 1,
    borderColor: "rgba(38,217,255,0.24)",
    marginRight: 10,
  },

  searchInput: {
    flex: 1,
    color: COLORS.white,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "700",
    paddingVertical: 14,
  },

  exploreTrustNotice: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 13,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  exploreTrustIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  exploreTrustTextWrap: {
    flex: 1,
    minWidth: 0,
  },

  exploreTrustText: {
    color: COLORS.muted2,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "800",
  },

  exploreTrustButton: {
    alignSelf: "flex-start",
    marginTop: 7,
  },

  exploreTrustButtonText: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "900",
  },

  filters: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 8,
    rowGap: 9,
    marginTop: 2,
    marginBottom: 22,
  },

  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    columnGap: 12,
    marginTop: 4,
    marginBottom: 13,
  },

  resultTitleWrap: {
    flex: 1,
  },

  sectionEyebrow: {
    fontSize: 10,
    lineHeight: 13,
    color: COLORS.gold,
    fontWeight: "800",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 4,
  },

  sectionTitle: {
    color: COLORS.white,
    fontSize: 31,
    lineHeight: 37,
    fontWeight: "300",
    letterSpacing: -0.5,
  },

  sectionSubtitle: {
    color: COLORS.muted2,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "500",
    marginTop: 5,
  },

  resultBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.goldSoft,
    borderWidth: 1,
    borderColor: "rgba(242,169,59,0.35)",
  },

  resultBadgeText: {
    color: COLORS.gold,
    fontSize: 18,
    lineHeight: 22,
    fontWeight: "900",
  },

  cards: {
    rowGap: 14,
  },

  profileCard: {
    borderRadius: 25,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    backgroundColor: COLORS.card,
    padding: 15,
  },

  profileCardLimited: {
    borderColor: "rgba(157,187,255,0.20)",
  },

  profileCardDanger: {
    borderColor: "rgba(239,68,68,0.26)",
  },

  profileTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    columnGap: 13,
  },

  profileInfo: {
    flex: 1,
    minWidth: 0,
  },

  profileNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    columnGap: 8,
    marginBottom: 4,
  },

  profileName: {
    flex: 1,
    color: COLORS.white,
    fontSize: 21,
    lineHeight: 26,
    fontWeight: "600",
    letterSpacing: -0.2,
  },

  profileKind: {
    color: COLORS.gold,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "800",
  },

  profileMeta: {
    color: COLORS.muted2,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "600",
    marginBottom: 5,
  },

  highAffinityBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: "rgba(38,217,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(38,217,255,0.35)",
    marginBottom: 6,
  },

  highAffinityBadgeText: {
    color: COLORS.cyan,
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  profileDescription: {
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "500",
  },

  avatarWrap: {
    backgroundColor: COLORS.cardSoft,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "visible",
  },

  statusBadge: {
    position: "absolute",
    right: -5,
    bottom: -5,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.bg,
    backgroundColor: "#05060A",
  },

  statusBadgeImage: {
    width: 21,
    height: 21,
  },

  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 7,
    rowGap: 7,
    marginTop: 11,
  },

  tag: {
    minHeight: 28,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  tagText: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "800",
  },

  limitedBadge: {
    minHeight: 30,
    borderRadius: 15,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 7,
    alignItems: "center",
    justifyContent: "center",
  },

  limitedBadgeText: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "800",
  },

  aiAffinityCard: {
    marginTop: 12,
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
  },

  aiAffinityHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 9,
  },

  aiAffinityIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },

  aiAffinityTitleWrap: {
    flex: 1,
    minWidth: 0,
  },

  aiAffinityKicker: {
    color: COLORS.cyan,
    fontSize: 9,
    lineHeight: 12,
    fontWeight: "900",
    letterSpacing: 1.8,
    textTransform: "uppercase",
    marginBottom: 2,
  },

  aiAffinityTitle: {
    color: COLORS.white,
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "900",
  },

  aiAffinityReasonList: {
    rowGap: 6,
  },

  aiAffinityReasonRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  aiAffinityReasonDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    marginRight: 8,
  },

  aiAffinityReasonText: {
    flex: 1,
    color: COLORS.muted2,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "600",
  },

  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 8,
    rowGap: 8,
    marginTop: 12,
  },

  secondaryAction: {
    minHeight: 40,
    borderRadius: 20,
    backgroundColor: COLORS.darkButton,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: "center",
  },

  secondaryActionText: {
    color: COLORS.white,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "800",
  },

  blockAction: {
    minHeight: 40,
    borderRadius: 20,
    backgroundColor: "rgba(239,68,68,0.10)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.28)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    justifyContent: "center",
  },

  blockActionText: {
    color: "#FF9B9B",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "800",
  },

  emptyCard: {
    borderRadius: 25,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    backgroundColor: COLORS.card,
    padding: 18,
  },

  emptyTitle: {
    color: COLORS.white,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: "600",
    marginBottom: 7,
  },

  emptyText: {
    color: COLORS.muted2,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "500",
  },

  brandCard: {
    marginTop: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.borderStrong,
    backgroundColor: COLORS.card,
    padding: 16,
  },

  brandSmallRow: {
    flexDirection: "row",
    alignItems: "center",
    columnGap: 10,
    marginBottom: 10,
  },

  brandSmallSymbol: {
    width: 28,
    height: 28,
    resizeMode: "contain",
  },

  brandSmallText: {
    color: COLORS.white,
    fontSize: 21,
    lineHeight: 26,
    fontWeight: "900",
    letterSpacing: 6,
  },

  brandCardText: {
    color: COLORS.muted2,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "500",
  },

  pressed: {
    opacity: 0.76,
    transform: [{ scale: 0.98 }],
  },

  bottomSpace: {
    height: 20,
  },
});