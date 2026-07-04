// frontend/src/utils/protectedProfileRules.ts

// =====================================================
// ELUS — Regras estruturais para Perfil Público Protegido
// =====================================================
//
// Este arquivo é uma fundação estrutural.
// Ele NÃO altera telas sozinho.
// Ele prepara o app para receber o tipo "Perfil Público Protegido"
// sem quebrar o que já está funcionando.
//
// Regra central:
// O ELUS encontra afinidades automaticamente.
// Conexões reais só acontecem com identidade verificada e aprovação.

// =====================================================
// Tipos principais
// =====================================================

export type ElusVerificationStatus =
  | "unverified"
  | "in_review"
  | "verified"
  | "official_protected";

export type ElusProfileAccessLevel =
  | "minimal"
  | "limited"
  | "controlled"
  | "full";

export type ProtectedProfileVisibilityMode =
  | "hidden"
  | "limited"
  | "controlled"
  | "protected_visible";

export type ProtectedConnectionKind =
  | "restricted"
  | "professional"
  | "institutional";

export type ProtectedProfileManagementMode =
  | "owner"
  | "authorized_representative"
  | "team";

export type ProtectedProfileDecision =
  | "accept"
  | "reject"
  | "block"
  | "request_more_info"
  | "accept_restricted"
  | "accept_professional"
  | "accept_institutional";

export type ElusProfileKindLabel =
  | "Pessoa"
  | "Empresa"
  | "Grupo"
  | "Perfil público protegido"
  | "Perfil oficial protegido";

export interface ProtectedProfileLike {
  id?: string;
  name?: string;
  firstName?: string;
  kind?: string;
  status?: string;
  verificationStatus?: string;

  profileType?: string;
  profileKind?: string;

  city?: string;
  state?: string;
  location?: string;
  distance?: string | number;

  isProtectedPublicProfile?: boolean;
  isOfficialProtectedProfile?: boolean;
  protectedPublic?: boolean;
  officialProtected?: boolean;

  representativeEnabled?: boolean;
  managementMode?: ProtectedProfileManagementMode | string;
}

export interface ProtectedViewerLike {
  id?: string;
  verified?: boolean;
  status?: string;
  verificationStatus?: string;
}

export interface ProtectedProfilePolicy {
  isProtectedPublicProfile: boolean;
  isOfficialProtectedProfile: boolean;

  profileLabel: ElusProfileKindLabel;
  verificationStatus: ElusVerificationStatus;
  accessLevel: ElusProfileAccessLevel;
  visibilityMode: ProtectedProfileVisibilityMode;

  canShowExactLocation: boolean;
  canShowPreciseDistance: boolean;
  canShowPersonalContact: boolean;
  canReleaseDirectContactAutomatically: boolean;
  canAppearOnRadar: boolean;
  canReceiveConnectionRequest: boolean;
  requiresApproval: boolean;
  requiresEnhancedVerification: boolean;
  allowsRepresentativeManagement: boolean;

  allowedConnectionKinds: ProtectedConnectionKind[];
  allowedDecisions: ProtectedProfileDecision[];

  locationLabel: string;
  distanceLabel: string;
  contactLabel: string;
  statusLabel: string;
  actionLabel: string;
  title: string;
  message: string;
}

export interface ProtectedConnectionDecisionInput {
  viewerStatus: ElusVerificationStatus;
  targetStatus: ElusVerificationStatus;
  targetIsProtectedPublicProfile: boolean;
  requesterKind?: string;
}

export interface ProtectedConnectionDecision {
  canRequestConnection: boolean;
  requiresApproval: boolean;
  canAccessDirectContact: boolean;
  allowedConnectionKinds: ProtectedConnectionKind[];
  buttonLabel: string;
  statusTitle: string;
  statusMessage: string;
}

// =====================================================
// Textos oficiais permitidos
// =====================================================

export const PROTECTED_PROFILE_COPY = {
  protectedPublicProfile: "Perfil público protegido",
  officialProtectedProfile: "Perfil oficial protegido",
  protectedLocation: "Localização protegida",
  protectedDistance: "Distância protegida",
  requestsRequireApproval: "Solicitações passam por aprovação",
  directContactHidden: "Contato direto não é exibido por segurança",
  filteredRequestsOnly: "Este perfil recebe apenas solicitações filtradas",
  restrictedProfile: "Perfil restrito",
  limitedInformation: "Informações restritas",
  minimalInformation: "Informações mínimas",
  enhancedVerificationRequired: "Verificação reforçada necessária",
  representativeEnabled: "Representante autorizado",
  institutionalConnection: "Vínculo institucional",
  professionalConnection: "Vínculo profissional",
  restrictedConnection: "Vínculo restrito",
} as const;

// =====================================================
// Textos proibidos em interface pública
// =====================================================
//
// Estes termos não devem ser usados como rótulo visual,
// status de produto ou destaque público do perfil.

export const PROTECTED_PROFILE_FORBIDDEN_TERMS = [
  "famoso",
  "celebridade",
  "vip",
  "pessoa importante",
] as const;

// =====================================================
// Cores oficiais por status
// =====================================================

export const PROTECTED_PROFILE_STATUS_COLORS = {
  unverified: "#EF4444",
  in_review: "#9DBBFF",
  verified: "#22C55E",
  official_protected: "#22C55E",
} as const;

// =====================================================
// Regras fixas do Perfil Público Protegido
// =====================================================

export const PROTECTED_PROFILE_CORE_RULES = {
  neverShowExactLocation: true,
  neverShowPreciseDistance: true,
  neverShowPersonalPhone: true,
  neverShowPersonalWhatsapp: true,
  neverShowPersonalEmail: true,
  neverReleaseDirectContactAutomatically: true,
  visibilityMustBeControlled: true,
  connectionAlwaysRequiresApproval: true,
  enhancedVerificationRequiredBeforeOfficialDisplay: true,
  representativeOrTeamManagementAllowed: true,
  keepIdentityVerificationAsSecurityPillar: true,
} as const;

export const PROTECTED_PROFILE_ALLOWED_CONNECTION_KINDS: ProtectedConnectionKind[] =
  ["restricted", "professional", "institutional"];

export const PROTECTED_PROFILE_ALLOWED_DECISIONS: ProtectedProfileDecision[] = [
  "accept",
  "reject",
  "block",
  "request_more_info",
  "accept_restricted",
  "accept_professional",
  "accept_institutional",
];

// =====================================================
// Utilidades internas
// =====================================================

function normalizeText(value: unknown): string {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function readStatusFromProfile(
  profile: ProtectedProfileLike | null | undefined
): string {
  return String(
    profile?.verificationStatus ??
      profile?.status ??
      profile?.profileType ??
      profile?.profileKind ??
      profile?.kind ??
      ""
  );
}

function readKindFromProfile(
  profile: ProtectedProfileLike | null | undefined
): string {
  return [
    profile?.kind,
    profile?.profileType,
    profile?.profileKind,
    profile?.status,
    profile?.verificationStatus,
  ]
    .map((item) => normalizeText(item))
    .filter(Boolean)
    .join(" ");
}

// =====================================================
// Normalização de status
// =====================================================

export function normalizeVerificationStatus(
  value: unknown
): ElusVerificationStatus {
  const status = normalizeText(value);

  if (
    status === "official_protected" ||
    status === "perfil oficial protegido" ||
    status === "perfil publico protegido" ||
    status === "public_protected" ||
    status === "protected_public" ||
    status === "protected"
  ) {
    return "official_protected";
  }

  if (
    status === "verified" ||
    status === "verificado" ||
    status === "verificacao concluida" ||
    status === "identidade verificada"
  ) {
    return "verified";
  }

  if (
    status === "in_review" ||
    status === "review" ||
    status === "em analise" ||
    status === "aguardando" ||
    status === "aguardando verificacao" ||
    status === "aguardando aprovacao"
  ) {
    return "in_review";
  }

  return "unverified";
}

export function getViewerVerificationStatus(
  viewer: ProtectedViewerLike | null | undefined
): ElusVerificationStatus {
  if (!viewer) {
    return "unverified";
  }

  const explicitStatus = normalizeVerificationStatus(
    viewer.verificationStatus ?? viewer.status
  );

  if (viewer.verified === true && explicitStatus !== "in_review") {
    return "verified";
  }

  return explicitStatus;
}

export function getProfileVerificationStatus(
  profile: ProtectedProfileLike | null | undefined
): ElusVerificationStatus {
  if (!profile) {
    return "unverified";
  }

  if (profile.isOfficialProtectedProfile || profile.officialProtected) {
    return "official_protected";
  }

  return normalizeVerificationStatus(readStatusFromProfile(profile));
}

// =====================================================
// Identificação do Perfil Público Protegido
// =====================================================

export function isProtectedPublicProfile(
  profile: ProtectedProfileLike | null | undefined
): boolean {
  if (!profile) {
    return false;
  }

  if (
    profile.isProtectedPublicProfile === true ||
    profile.isOfficialProtectedProfile === true ||
    profile.protectedPublic === true ||
    profile.officialProtected === true
  ) {
    return true;
  }

  const kindText = readKindFromProfile(profile);

  return (
    kindText.includes("perfil publico protegido") ||
    kindText.includes("perfil oficial protegido") ||
    kindText.includes("public protected") ||
    kindText.includes("protected public") ||
    kindText.includes("official protected")
  );
}

export function isOfficialProtectedProfile(
  profile: ProtectedProfileLike | null | undefined
): boolean {
  if (!profile) {
    return false;
  }

  if (profile.isOfficialProtectedProfile === true || profile.officialProtected === true) {
    return true;
  }

  return getProfileVerificationStatus(profile) === "official_protected";
}

// =====================================================
// Labels visuais
// =====================================================

export function getProtectedProfileLabel(
  profile: ProtectedProfileLike | null | undefined
): ElusProfileKindLabel {
  if (!profile) {
    return "Pessoa";
  }

  const protectedProfile = isProtectedPublicProfile(profile);
  const officialProtected = isOfficialProtectedProfile(profile);

  if (officialProtected) {
    return "Perfil oficial protegido";
  }

  if (protectedProfile) {
    return "Perfil público protegido";
  }

  const kind = String(profile.kind ?? "").trim();

  if (kind === "Empresa") {
    return "Empresa";
  }

  if (kind === "Grupo") {
    return "Grupo";
  }

  return "Pessoa";
}

export function getProtectedProfileStatusLabel(
  status: ElusVerificationStatus,
  protectedProfile: boolean
): string {
  if (status === "official_protected") {
    return "Perfil oficial protegido";
  }

  if (status === "verified") {
    return protectedProfile ? "Perfil protegido verificado" : "Identidade verificada";
  }

  if (status === "in_review") {
    return "Aguardando verificação";
  }

  return "Não verificado";
}

export function getProtectedProfileStatusColor(
  status: ElusVerificationStatus
): string {
  return PROTECTED_PROFILE_STATUS_COLORS[status];
}

// =====================================================
// Localização e distância segura
// =====================================================

export function canShowExactLocation(
  profile: ProtectedProfileLike | null | undefined
): boolean {
  if (isProtectedPublicProfile(profile)) {
    return false;
  }

  return true;
}

export function canShowPreciseDistance(
  profile: ProtectedProfileLike | null | undefined
): boolean {
  if (isProtectedPublicProfile(profile)) {
    return false;
  }

  return true;
}

export function getSafeLocationLabel(
  profile: ProtectedProfileLike | null | undefined
): string {
  if (!profile) {
    return "Localização limitada";
  }

  if (isProtectedPublicProfile(profile)) {
    return PROTECTED_PROFILE_COPY.protectedLocation;
  }

  if (profile.city && profile.state) {
    return `${profile.city} • ${profile.state}`;
  }

  if (profile.city) {
    return profile.city;
  }

  if (profile.location) {
    return profile.location;
  }

  return "Localização limitada";
}

export function getSafeDistanceLabel(
  profile: ProtectedProfileLike | null | undefined
): string {
  if (isProtectedPublicProfile(profile)) {
    return PROTECTED_PROFILE_COPY.protectedDistance;
  }

  if (profile?.distance !== undefined && profile?.distance !== null) {
    return String(profile.distance);
  }

  return "Campo ELUS";
}

// =====================================================
// Regras de acesso visual
// =====================================================

export function getAccessLevelForViewer(
  viewerStatus: ElusVerificationStatus,
  targetStatus: ElusVerificationStatus,
  targetIsProtectedPublicProfile: boolean
): ElusProfileAccessLevel {
  if (viewerStatus === "unverified") {
    return "minimal";
  }

  if (viewerStatus === "in_review") {
    return "limited";
  }

  if (targetStatus === "unverified" || targetStatus === "in_review") {
    return "limited";
  }

  if (targetIsProtectedPublicProfile) {
    return "controlled";
  }

  return "full";
}

export function getVisibilityModeForProfile(
  viewerStatus: ElusVerificationStatus,
  targetStatus: ElusVerificationStatus,
  targetIsProtectedPublicProfile: boolean
): ProtectedProfileVisibilityMode {
  if (viewerStatus === "unverified") {
    return "limited";
  }

  if (viewerStatus === "in_review") {
    return "limited";
  }

  if (targetStatus === "unverified" || targetStatus === "in_review") {
    return "limited";
  }

  if (targetIsProtectedPublicProfile) {
    return "protected_visible";
  }

  return "controlled";
}

// =====================================================
// Política completa de perfil
// =====================================================

export function getProtectedProfilePolicy(params: {
  viewerStatus: ElusVerificationStatus;
  profile: ProtectedProfileLike | null | undefined;
}): ProtectedProfilePolicy {
  const { viewerStatus, profile } = params;

  const targetStatus = getProfileVerificationStatus(profile);
  const targetIsProtected = isProtectedPublicProfile(profile);
  const targetIsOfficialProtected = isOfficialProtectedProfile(profile);

  const accessLevel = getAccessLevelForViewer(
    viewerStatus,
    targetStatus,
    targetIsProtected
  );

  const visibilityMode = getVisibilityModeForProfile(
    viewerStatus,
    targetStatus,
    targetIsProtected
  );

  const statusLabel = getProtectedProfileStatusLabel(
    targetStatus,
    targetIsProtected
  );

  const canReceiveConnectionRequest =
    viewerStatus === "verified" || viewerStatus === "official_protected";

  const requiresApproval =
    targetIsProtected ||
    targetStatus === "verified" ||
    targetStatus === "official_protected";

  const canAppearOnRadar =
    !targetIsProtected || targetStatus === "official_protected";

  const allowsRepresentativeManagement =
    targetIsProtected &&
    Boolean(
      profile?.representativeEnabled ||
        profile?.managementMode === "authorized_representative" ||
        profile?.managementMode === "team"
    );

  const actionLabel = canReceiveConnectionRequest
    ? "Solicitar conexão"
    : "Verificar identidade";

  const title = targetIsProtected
    ? PROTECTED_PROFILE_COPY.officialProtectedProfile
    : statusLabel;

  const message = targetIsProtected
    ? "Este perfil possui privacidade reforçada. Solicitações passam por aprovação e o contato direto não é exibido automaticamente."
    : "Conexões reais só acontecem com identidade verificada e aprovação.";

  return {
    isProtectedPublicProfile: targetIsProtected,
    isOfficialProtectedProfile: targetIsOfficialProtected,

    profileLabel: getProtectedProfileLabel(profile),
    verificationStatus: targetStatus,
    accessLevel,
    visibilityMode,

    canShowExactLocation: canShowExactLocation(profile),
    canShowPreciseDistance: canShowPreciseDistance(profile),
    canShowPersonalContact: false,
    canReleaseDirectContactAutomatically: false,
    canAppearOnRadar,
    canReceiveConnectionRequest,
    requiresApproval,
    requiresEnhancedVerification: targetIsProtected,
    allowsRepresentativeManagement,

    allowedConnectionKinds: targetIsProtected
      ? PROTECTED_PROFILE_ALLOWED_CONNECTION_KINDS
      : ["restricted", "professional"],

    allowedDecisions: targetIsProtected
      ? PROTECTED_PROFILE_ALLOWED_DECISIONS
      : ["accept", "reject", "block"],

    locationLabel: getSafeLocationLabel(profile),
    distanceLabel: getSafeDistanceLabel(profile),
    contactLabel: PROTECTED_PROFILE_COPY.directContactHidden,
    statusLabel,
    actionLabel,
    title,
    message,
  };
}

// =====================================================
// Regras de solicitação de conexão
// =====================================================

export function evaluateProtectedConnectionDecision(
  input: ProtectedConnectionDecisionInput
): ProtectedConnectionDecision {
  const {
    viewerStatus,
    targetStatus,
    targetIsProtectedPublicProfile,
    requesterKind,
  } = input;

  if (viewerStatus === "unverified") {
    return {
      canRequestConnection: false,
      requiresApproval: true,
      canAccessDirectContact: false,
      allowedConnectionKinds: [],
      buttonLabel: "Verificar identidade",
      statusTitle: "Verificação pendente",
      statusMessage:
        "Você precisa concluir a verificação de identidade para solicitar conexão.",
    };
  }

  if (viewerStatus === "in_review") {
    return {
      canRequestConnection: false,
      requiresApproval: true,
      canAccessDirectContact: false,
      allowedConnectionKinds: [],
      buttonLabel: "Aguardando verificação",
      statusTitle: "Acesso limitado até aprovação",
      statusMessage:
        "Sua verificação foi enviada, mas ainda depende de aprovação. Até a confirmação, você não pode solicitar conexão.",
    };
  }

  if (targetStatus === "unverified") {
    return {
      canRequestConnection: false,
      requiresApproval: true,
      canAccessDirectContact: false,
      allowedConnectionKinds: [],
      buttonLabel: "Contato bloqueado",
      statusTitle: "Perfil não verificado",
      statusMessage:
        "Este perfil ainda não concluiu a verificação. O contato permanece bloqueado por segurança.",
    };
  }

  if (targetStatus === "in_review") {
    return {
      canRequestConnection: false,
      requiresApproval: true,
      canAccessDirectContact: false,
      allowedConnectionKinds: [],
      buttonLabel: "Aguardando verificação",
      statusTitle: "Perfil em análise",
      statusMessage:
        "Este perfil está em análise. Dados completos e solicitações permanecem bloqueados até aprovação final.",
    };
  }

  if (targetIsProtectedPublicProfile) {
    return {
      canRequestConnection: true,
      requiresApproval: true,
      canAccessDirectContact: false,
      allowedConnectionKinds: PROTECTED_PROFILE_ALLOWED_CONNECTION_KINDS,
      buttonLabel: "Solicitar com aprovação",
      statusTitle: "Perfil oficial protegido",
      statusMessage:
        "Este perfil recebe apenas solicitações filtradas. O contato direto não é exibido por segurança.",
    };
  }

  if (normalizeText(requesterKind).includes("empresa")) {
    return {
      canRequestConnection: true,
      requiresApproval: true,
      canAccessDirectContact: false,
      allowedConnectionKinds: ["professional", "institutional"],
      buttonLabel: "Enviar proposta",
      statusTitle: "Proposta com aprovação",
      statusMessage:
        "Empresas verificadas podem enviar proposta profissional ou institucional, sempre com aprovação.",
    };
  }

  return {
    canRequestConnection: true,
    requiresApproval: true,
    canAccessDirectContact: false,
    allowedConnectionKinds: ["restricted", "professional"],
    buttonLabel: "Solicitar conexão",
    statusTitle: "Solicitação com aprovação",
    statusMessage:
      "A solicitação será enviada para aprovação. O contato direto não é liberado automaticamente.",
  };
}

// =====================================================
// Validação de textos públicos
// =====================================================

export function containsForbiddenProtectedProfileTerm(text: string): boolean {
  const normalizedText = normalizeText(text);

  return PROTECTED_PROFILE_FORBIDDEN_TERMS.some((term) =>
    normalizedText.includes(normalizeText(term))
  );
}

export function sanitizeProtectedProfilePublicText(text: string): string {
  if (!text) {
    return "";
  }

  let safeText = text;

  PROTECTED_PROFILE_FORBIDDEN_TERMS.forEach((term) => {
    const expression = new RegExp(term, "gi");
    safeText = safeText.replace(expression, PROTECTED_PROFILE_COPY.protectedPublicProfile);
  });

  return safeText;
}

// =====================================================
// Resumo estrutural para conferência
// =====================================================

export const protectedProfilePlanningSummary = {
  featureName: "Perfil Público Protegido",
  currentImplementationPhase: "structural_preparation",
  shouldInterruptCurrentDevelopment: false,
  shouldChangeVisualScreensNow: false,
  shouldCentralizeRulesBeforeUI: true,

  profileLabels: [
    PROTECTED_PROFILE_COPY.protectedPublicProfile,
    PROTECTED_PROFILE_COPY.officialProtectedProfile,
  ],

  mainRules: [
    "Não mostrar localização exata",
    "Não mostrar distância precisa",
    "Não exibir telefone, WhatsApp ou e-mail pessoal",
    "Não liberar contato direto automaticamente",
    "Permitir visibilidade controlada no radar/mapa",
    "Permitir solicitação de conexão sempre com aprovação",
    "Permitir vínculos profissionais, institucionais ou restritos",
    "Permitir representante autorizado ou equipe",
    "Exigir verificação reforçada antes de aparecer como perfil oficial",
    "Manter segurança, privacidade e identidade verificada como pilares",
  ],

  allowedStatusColors: {
    unverified: "vermelho",
    in_review: "azul claro",
    verified: "verde",
    official_protected: "verde",
  },

  nextSafeStepAfterThisFile:
    "Integrar estes tipos ao arquivo frontend/src/data/profiles.ts sem alterar telas ainda.",
} as const;