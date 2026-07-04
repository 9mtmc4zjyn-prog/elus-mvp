// frontend/src/utils/elusIntelligenceRules.ts

// =====================================================
// ELUS Intelligence Rules
// Regra central: afinidade automática NÃO é conexão real.
// =====================================================

export type ElusVerificationStatus = 'unverified' | 'in_review' | 'verified';

export type ElusProfileLike = {
  id?: string;
  name?: string;
  firstName?: string;
  kind?: string;

  verified?: boolean;
  status?: string;
  verificationStatus?: string;

  city?: string;
  state?: string;
  area?: string;
  purpose?: string;
  bio?: string;

  interests?: string[];
  preferences?: string[];
};

export type ElusConnectionStatus =
  | 'none'
  | 'affinity_detected'
  | 'requested'
  | 'accepted'
  | 'rejected';

export type ElusVisibilityMode =
  | 'full'
  | 'limited_by_viewer'
  | 'limited_by_target'
  | 'limited_by_both';

export type ElusMapSignalType =
  | 'verified_affinity'
  | 'awaiting_verification'
  | 'verification_pending';

export type ElusAffinityExplanationMode =
  | 'full'
  | 'limited_by_viewer'
  | 'limited_by_target'
  | 'limited_by_both';

export type ElusAffinityExplanation = {
  mode: ElusAffinityExplanationMode;
  title: string;
  text: string;
  reasons: string[];
  safetyNotice: string;
  canSuggestConnection: boolean;
  canRequestRealConnection: boolean;
  requiresExplicitApproval: boolean;
  usesPaidAI: boolean;
};

export type ElusStatusTheme = {
  status: ElusVerificationStatus;
  label: string;
  title: string;
  description: string;
  color: string;
  borderColor: string;
  backgroundColor: string;
};

export const ELUS_COLORS = {
  verifiedGreen: '#22C55E',
  waitingBlue: '#8FB3FF',
  pendingRed: '#FF6B6B',
  gold: '#D9B46A',
  white: '#FFFFFF',
  muted: 'rgba(255,255,255,0.68)',
};

export const ELUS_STATUS_THEMES: Record<ElusVerificationStatus, ElusStatusTheme> = {
  verified: {
    status: 'verified',
    label: 'Identidade verificada',
    title: 'Verificação concluída',
    description:
      'Identidade validada. O perfil pode avançar para solicitações e conexões reais conforme aprovação.',
    color: ELUS_COLORS.verifiedGreen,
    borderColor: 'rgba(34,197,94,0.45)',
    backgroundColor: 'rgba(34,197,94,0.12)',
  },

  in_review: {
    status: 'in_review',
    label: 'Aguardando verificação',
    title: 'Aguardando verificação',
    description:
      'A verificação foi enviada e está em análise. Até a aprovação final, o perfil continua não verificado e com uso limitado.',
    color: ELUS_COLORS.waitingBlue,
    borderColor: 'rgba(143,179,255,0.45)',
    backgroundColor: 'rgba(143,179,255,0.12)',
  },

  unverified: {
    status: 'unverified',
    label: 'Não verificado',
    title: 'Verificação pendente',
    description:
      'A identidade ainda não foi validada. O perfil tem uso limitado até concluir a verificação.',
    color: ELUS_COLORS.pendingRed,
    borderColor: 'rgba(255,107,107,0.45)',
    backgroundColor: 'rgba(255,107,107,0.12)',
  },
};

// =====================================================
// Normalização de status
// =====================================================

export function getVerificationStatus(
  profile?: ElusProfileLike | null
): ElusVerificationStatus {
  if (!profile) {
    return 'unverified';
  }

  if (profile.verificationStatus === 'verified') {
    return 'verified';
  }

  if (profile.verificationStatus === 'in_review') {
    return 'in_review';
  }

  if (profile.verificationStatus === 'unverified') {
    return 'unverified';
  }

  if (profile.status === 'verified' || profile.verified === true) {
    return 'verified';
  }

  if (profile.status === 'in_review') {
    return 'in_review';
  }

  return 'unverified';
}

export function isVerified(profile?: ElusProfileLike | null): boolean {
  return getVerificationStatus(profile) === 'verified';
}

export function isAwaitingVerification(profile?: ElusProfileLike | null): boolean {
  return getVerificationStatus(profile) === 'in_review';
}

export function isUnverified(profile?: ElusProfileLike | null): boolean {
  return getVerificationStatus(profile) === 'unverified';
}

export function getStatusTheme(profile?: ElusProfileLike | null): ElusStatusTheme {
  return ELUS_STATUS_THEMES[getVerificationStatus(profile)];
}

// =====================================================
// Regra central de visibilidade
// =====================================================

export function getVisibilityMode({
  viewer,
  target,
}: {
  viewer?: ElusProfileLike | null;
  target?: ElusProfileLike | null;
}): ElusVisibilityMode {
  const viewerVerified = isVerified(viewer);
  const targetVerified = isVerified(target);

  if (viewerVerified && targetVerified) {
    return 'full';
  }

  if (!viewerVerified && !targetVerified) {
    return 'limited_by_both';
  }

  if (!viewerVerified) {
    return 'limited_by_viewer';
  }

  return 'limited_by_target';
}

export function canSeeFullProfile({
  viewer,
  target,
}: {
  viewer?: ElusProfileLike | null;
  target?: ElusProfileLike | null;
}): boolean {
  return getVisibilityMode({ viewer, target }) === 'full';
}

export function canSeeCompleteData({
  viewer,
  target,
}: {
  viewer?: ElusProfileLike | null;
  target?: ElusProfileLike | null;
}): boolean {
  return canSeeFullProfile({ viewer, target });
}

export function canShowRealPhotoPublicly(target?: ElusProfileLike | null): boolean {
  return isVerified(target);
}

export function canRequestRealConnection({
  viewer,
  target,
}: {
  viewer?: ElusProfileLike | null;
  target?: ElusProfileLike | null;
}): boolean {
  return isVerified(viewer) && isVerified(target);
}

export function canReleaseContactData({
  viewer,
  target,
  connectionStatus,
}: {
  viewer?: ElusProfileLike | null;
  target?: ElusProfileLike | null;
  connectionStatus?: ElusConnectionStatus;
}): boolean {
  return (
    isVerified(viewer) &&
    isVerified(target) &&
    connectionStatus === 'accepted'
  );
}

// =====================================================
// Afinidade automática x conexão real
// =====================================================

export function canDetectAffinity(): boolean {
  return true;
}

export function canCreateConnectionAutomatically(): boolean {
  return false;
}

export function getConnectionRuleMessage(): string {
  return 'O ELUS encontra afinidades automaticamente. As conexões reais só acontecem com identidade verificada e aprovação.';
}

export function getAffinityMeaningMessage(): string {
  return 'Afinidade indica uma possibilidade inteligente detectada pelo ELUS. Ainda não é uma conexão real.';
}

export function getRealConnectionMeaningMessage(): string {
  return 'Conexão real é um vínculo confirmado entre duas pessoas ou perfis, com identidade verificada e aprovação mútua.';
}

// =====================================================
// Regras para o Mapa
// =====================================================

export function getMapSignalType(
  target?: ElusProfileLike | null
): ElusMapSignalType {
  const status = getVerificationStatus(target);

  if (status === 'verified') {
    return 'verified_affinity';
  }

  if (status === 'in_review') {
    return 'awaiting_verification';
  }

  return 'verification_pending';
}

export function getMapSignalLabel(target?: ElusProfileLike | null): string {
  const status = getVerificationStatus(target);

  if (status === 'verified') {
    return 'Afinidade';
  }

  if (status === 'in_review') {
    return 'Aguardando';
  }

  return 'Pendente';
}

export function getMapNodeName(target?: ElusProfileLike | null): string {
  if (!target) {
    return 'Perfil';
  }

  const firstName =
    target.firstName ||
    target.name?.trim().split(' ').filter(Boolean)[0] ||
    'Perfil';

  return firstName;
}

export function shouldShowAffinityColors({
  viewer,
  target,
}: {
  viewer?: ElusProfileLike | null;
  target?: ElusProfileLike | null;
}): boolean {
  return isVerified(viewer) && isVerified(target);
}

export function shouldShowConfirmedConnectionColors(
  connectionStatus?: ElusConnectionStatus
): boolean {
  return connectionStatus === 'accepted';
}

// =====================================================
// Mensagens de bloqueio e orientação
// =====================================================

export function getLimitedAccessTitle({
  viewer,
  target,
}: {
  viewer?: ElusProfileLike | null;
  target?: ElusProfileLike | null;
}): string {
  const mode = getVisibilityMode({ viewer, target });

  if (mode === 'limited_by_viewer') {
    return 'Acesso limitado até sua verificação';
  }

  if (mode === 'limited_by_target') {
    return 'Perfil ainda não validado';
  }

  if (mode === 'limited_by_both') {
    return 'Verificação necessária';
  }

  return 'Acesso liberado';
}

export function getLimitedAccessMessage({
  viewer,
  target,
}: {
  viewer?: ElusProfileLike | null;
  target?: ElusProfileLike | null;
}): string {
  const mode = getVisibilityMode({ viewer, target });

  if (mode === 'limited_by_viewer') {
    return 'Existe compatibilidade, mas sua identidade precisa ser verificada para avançar. Até a aprovação, você verá apenas informações limitadas e não poderá solicitar contato.';
  }

  if (mode === 'limited_by_target') {
    return 'Este perfil ainda não concluiu a verificação de identidade. Por segurança, contato e dados completos permanecem bloqueados.';
  }

  if (mode === 'limited_by_both') {
    return 'Existe compatibilidade, mas a conexão real só poderá avançar quando as identidades forem verificadas.';
  }

  return 'Perfil verificado. Você pode visualizar informações completas permitidas e solicitar conexão real.';
}

export function getContactButtonLabel({
  viewer,
  target,
  connectionStatus,
}: {
  viewer?: ElusProfileLike | null;
  target?: ElusProfileLike | null;
  connectionStatus?: ElusConnectionStatus;
}): string {
  if (connectionStatus === 'accepted') {
    return 'Contato liberado';
  }

  if (connectionStatus === 'requested') {
    return 'Solicitação enviada';
  }

  if (!isVerified(viewer)) {
    return 'Verificação necessária';
  }

  if (!isVerified(target)) {
    return 'Contato bloqueado';
  }

  return 'Solicitar contato';
}

export function getContactBlockedReason({
  viewer,
  target,
}: {
  viewer?: ElusProfileLike | null;
  target?: ElusProfileLike | null;
}): string {
  if (!isVerified(viewer)) {
    return 'Você precisa ter verificação concluída para solicitar contato ou acessar dados completos de outros perfis.';
  }

  if (!isVerified(target)) {
    return 'Este perfil ainda não foi verificado. Contato e dados completos permanecem bloqueados.';
  }

  return '';
}

// =====================================================
// Texto público seguro
// =====================================================

export function getSafeDisplayName({
  viewer,
  target,
}: {
  viewer?: ElusProfileLike | null;
  target?: ElusProfileLike | null;
}): string {
  if (!target) {
    return 'Perfil';
  }

  if (canSeeFullProfile({ viewer, target })) {
    return target.name || target.firstName || 'Perfil';
  }

  return getMapNodeName(target);
}

export function getSafeDisplayRole({
  viewer,
  target,
}: {
  viewer?: ElusProfileLike | null;
  target?: ElusProfileLike | null;
}): string {
  if (canSeeFullProfile({ viewer, target })) {
    return target?.area || target?.purpose || 'Perfil ELUS';
  }

  return 'Informações restritas';
}

export function getSafeDisplayLocation({
  viewer,
  target,
}: {
  viewer?: ElusProfileLike | null;
  target?: ElusProfileLike | null;
}): string {
  if (!target) {
    return 'Localização restrita';
  }

  if (canSeeFullProfile({ viewer, target })) {
    if (target.city && target.state) {
      return `${target.city} • ${target.state}`;
    }

    return target.city || target.state || 'Localização não informada';
  }

  if (target.city && target.state) {
    return `${target.city} • ${target.state}`;
  }

  return target.city || 'Localização restrita';
}

// =====================================================
// IA simulada/local de afinidades
// =====================================================

function normalizeIntelligenceTerm(value?: string | null): string {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function getProfileTerms(profile?: ElusProfileLike | null): string[] {
  if (!profile) {
    return [];
  }

  const rawTerms = [
    profile.area,
    profile.purpose,
    ...(Array.isArray(profile.interests) ? profile.interests : []),
    ...(Array.isArray(profile.preferences) ? profile.preferences : []),
  ];

  const normalizedTerms = rawTerms
    .map((term) => normalizeIntelligenceTerm(term))
    .filter((term) => term.length >= 3);

  return Array.from(new Set(normalizedTerms));
}

function getSharedAffinityTerms({
  viewer,
  target,
}: {
  viewer?: ElusProfileLike | null;
  target?: ElusProfileLike | null;
}): string[] {
  const viewerTerms = getProfileTerms(viewer);
  const targetTerms = getProfileTerms(target);

  if (viewerTerms.length === 0 || targetTerms.length === 0) {
    return [];
  }

  return targetTerms.filter((targetTerm) =>
    viewerTerms.some((viewerTerm) => {
      return (
        viewerTerm === targetTerm ||
        viewerTerm.includes(targetTerm) ||
        targetTerm.includes(viewerTerm)
      );
    })
  );
}

function getSafeTargetLabel(target?: ElusProfileLike | null): string {
  if (!target) {
    return 'este perfil';
  }

  return target.kind || 'perfil';
}

function getSafeRegionReason({
  viewer,
  target,
}: {
  viewer?: ElusProfileLike | null;
  target?: ElusProfileLike | null;
}): string | null {
  if (!viewer || !target) {
    return null;
  }

  if (viewer.city && target.city && viewer.city === target.city) {
    return 'há proximidade de região, sem exibir localização exata';
  }

  if (viewer.state && target.state && viewer.state === target.state) {
    return 'há contexto regional aproximado em comum';
  }

  return null;
}

function getFallbackAffinityReason({
  viewer,
  target,
}: {
  viewer?: ElusProfileLike | null;
  target?: ElusProfileLike | null;
}): string {
  const regionReason = getSafeRegionReason({ viewer, target });

  if (regionReason) {
    return regionReason;
  }

  return 'há compatibilidade de contexto, interesses ou propósito entre os perfis';
}

function lowerFirstReasonLetter(value: string): string {
  return value.replace(
    /^([A-ZÁÀÂÃÉÊÍÓÔÕÚÇ])(?=[a-záàâãéêíóôõúç])/,
    (letter) => letter.toLowerCase()
  );
}

function normalizeAffinityReason(value?: string | null): string {
  const normalized = String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .replace(
      /^(essa\s+afinidade\s+apareceu\s+porque|essa\s+conex[aã]o\s+apareceu\s+porque)\s*/i,
      ''
    )
    .replace(
      /^(a\s+afinidade\s+apareceu\s+porque|a\s+conex[aã]o\s+apareceu\s+porque)\s*/i,
      ''
    )
    .replace(/[.!?]+$/g, '')
    .trim();

  return lowerFirstReasonLetter(normalized);
}

export function getLocalAffinityExplanation({
  viewer,
  target,
  sharedReasons,
}: {
  viewer?: ElusProfileLike | null;
  target?: ElusProfileLike | null;
  sharedReasons?: string[];
}): ElusAffinityExplanation {
  const visibilityMode = getVisibilityMode({ viewer, target });
  const viewerVerified = isVerified(viewer);
  const targetVerified = isVerified(target);
  const targetLabel = getSafeTargetLabel(target);

  const baseSafetyNotice =
    'A IA do ELUS apenas explica afinidades. Ela não cria elo, não cria conexão real, não libera contato e não toma decisão sozinha.';

  if (!viewerVerified && !targetVerified) {
    return {
      mode: 'limited_by_both',
      title: 'Afinidade limitada',
      text:
        'Existe compatibilidade possível, mas as identidades precisam ser verificadas para avançar com segurança.',
      reasons: [
        'o ELUS pode detectar afinidades sem criar conexão real automaticamente',
        'os dois perfis ainda precisam de identidade verificada para qualquer vínculo real',
      ],
      safetyNotice: baseSafetyNotice,
      canSuggestConnection: false,
      canRequestRealConnection: false,
      requiresExplicitApproval: true,
      usesPaidAI: false,
    };
  }

  if (!viewerVerified) {
    return {
      mode: 'limited_by_viewer',
      title: 'Afinidade detectada com acesso limitado',
      text:
        'Existe compatibilidade, mas sua identidade precisa ser verificada para ver mais contexto e avançar.',
      reasons: [
        'sua verificação ainda não foi aprovada',
        'o ELUS mantém dados completos e contato bloqueados até a aprovação',
      ],
      safetyNotice: baseSafetyNotice,
      canSuggestConnection: false,
      canRequestRealConnection: false,
      requiresExplicitApproval: true,
      usesPaidAI: false,
    };
  }

  if (!targetVerified) {
    return {
      mode: 'limited_by_target',
      title: 'Afinidade detectada com perfil restrito',
      text:
        `Existe compatibilidade com ${targetLabel}, mas este perfil ainda precisa concluir a verificação para avançar.`,
      reasons: [
        'o outro perfil ainda não está com identidade verificada',
        'dados completos e contato permanecem bloqueados por segurança',
      ],
      safetyNotice: baseSafetyNotice,
      canSuggestConnection: true,
      canRequestRealConnection: false,
      requiresExplicitApproval: true,
      usesPaidAI: false,
    };
  }

  const explicitReasons = Array.isArray(sharedReasons)
    ? sharedReasons
        .map((reason) => normalizeAffinityReason(reason))
        .filter((reason) => reason.length > 0)
    : [];

  const sharedTerms = getSharedAffinityTerms({ viewer, target });
  const generatedReasons =
    explicitReasons.length > 0
      ? explicitReasons.slice(0, 3)
      : [
          getFallbackAffinityReason({ viewer, target }),
          sharedTerms.length > 0
            ? 'existem interesses ou temas em comum entre os perfis'
            : 'existe compatibilidade de contexto e propósito',
          'a conexão real só acontece se houver solicitação e aprovação explícita',
        ];

  return {
    mode: visibilityMode === 'full' ? 'full' : 'limited_by_both',
    title: 'Afinidade explicada pelo ELUS',
    text:
      `Essa afinidade apareceu porque ${generatedReasons[0]}.`,
    reasons: generatedReasons,
    safetyNotice: baseSafetyNotice,
    canSuggestConnection: true,
    canRequestRealConnection: canRequestRealConnection({ viewer, target }),
    requiresExplicitApproval: true,
    usesPaidAI: false,
  };
}

// =====================================================
// Explicação da IA
// =====================================================

export function getAffinityExplanation({
  viewer,
  target,
  sharedReasons,
}: {
  viewer?: ElusProfileLike | null;
  target?: ElusProfileLike | null;
  sharedReasons?: string[];
}): string {
  return getLocalAffinityExplanation({
    viewer,
    target,
    sharedReasons,
  }).text;
}