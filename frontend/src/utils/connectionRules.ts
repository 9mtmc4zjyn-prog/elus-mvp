// frontend/src/utils/connectionRules.ts

// =====================================================
// Regras centrais de conexão real do ELUS
// =====================================================
//
// Conceito base:
//
// Mapa = afinidades, possibilidades, sugestões e sinais inteligentes.
// Conexão = vínculo real confirmado, com identidade verificada dos dois lados
// e aprovação explícita.
//
// Frase-guia:
// "O ELUS encontra afinidades automaticamente. As conexões reais só acontecem
// com identidade verificada e aprovação."
//
// =====================================================

export type IdentityPhase = "verified" | "in_review" | "unverified";

export type ConnectionState =
  | "none"
  | "request_sent"
  | "request_received"
  | "accepted"
  | "rejected"
  | "blocked";

export type ConnectionBlockReason =
  | "current_user_not_verified"
  | "target_user_not_verified"
  | "target_user_in_review"
  | "already_connected"
  | "request_already_sent"
  | "request_waiting_response"
  | "request_rejected"
  | "blocked"
  | "none";

export type ProfileLike = {
  id?: string;
  name?: string;
  firstName?: string;
  status?: string;
  verificationStatus?: string;
  identityStatus?: string;
};

export type ConnectionRuleInput = {
  currentUserPhase: IdentityPhase;
  targetProfilePhase: IdentityPhase;
  connectionState?: ConnectionState;
};

export type ConnectionRuleResult = {
  canRequestConnection: boolean;
  canShowContactData: boolean;
  canShowConnectionRing: boolean;
  canShowFullProfile: boolean;
  shouldShowAsAffinityOnly: boolean;
  buttonLabel: string;
  statusTitle: string;
  statusMessage: string;
  blockReason: ConnectionBlockReason;
};

// =====================================================
// Normalização de status
// =====================================================

export function normalizeIdentityPhase(value?: string | null): IdentityPhase {
  const normalizedValue = String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[_\s-]+/g, "_");

  if (
    normalizedValue === "verified" ||
    normalizedValue === "verificado" ||
    normalizedValue === "validado" ||
    normalizedValue === "approved" ||
    normalizedValue === "aprovado"
  ) {
    return "verified";
  }

  if (
    normalizedValue === "in_review" ||
    normalizedValue === "review" ||
    normalizedValue === "awaiting" ||
    normalizedValue === "awaiting_verification" ||
    normalizedValue === "aguardando" ||
    normalizedValue === "aguardando_verificacao" ||
    normalizedValue === "aguardando_aprovacao" ||
    normalizedValue === "em_analise" ||
    normalizedValue === "pendente_analise"
  ) {
    return "in_review";
  }

  return "unverified";
}

export function getProfileIdentityPhase(profile?: ProfileLike | null): IdentityPhase {
  if (!profile) {
    return "unverified";
  }

  return normalizeIdentityPhase(
    profile.verificationStatus ?? profile.identityStatus ?? profile.status
  );
}

// =====================================================
// Regras de conexão real
// =====================================================

export function evaluateConnectionRules({
  currentUserPhase,
  targetProfilePhase,
  connectionState = "none",
}: ConnectionRuleInput): ConnectionRuleResult {
  if (connectionState === "accepted") {
    const bothVerified =
      currentUserPhase === "verified" && targetProfilePhase === "verified";

    return {
      canRequestConnection: false,
      canShowContactData: bothVerified,
      canShowConnectionRing: bothVerified,
      canShowFullProfile: bothVerified,
      shouldShowAsAffinityOnly: !bothVerified,
      buttonLabel: bothVerified ? "Conexão ativa" : "Acesso limitado",
      statusTitle: bothVerified ? "Conexão real confirmada" : "Conexão indisponível",
      statusMessage: bothVerified
        ? "Esta conexão foi aceita com identidade verificada dos dois lados."
        : "A conexão não pode ser exibida como real enquanto a identidade não estiver verificada dos dois lados.",
      blockReason: bothVerified ? "already_connected" : "current_user_not_verified",
    };
  }

  if (currentUserPhase !== "verified") {
    return {
      canRequestConnection: false,
      canShowContactData: false,
      canShowConnectionRing: false,
      canShowFullProfile: false,
      shouldShowAsAffinityOnly: true,
      buttonLabel:
        currentUserPhase === "in_review"
          ? "Aguardando verificação"
          : "Verificação necessária",
      statusTitle:
        currentUserPhase === "in_review"
          ? "Aguardando aprovação da identidade"
          : "Verificação necessária",
      statusMessage:
        currentUserPhase === "in_review"
          ? "Sua selfie com documento foi enviada para análise. Até a aprovação final, você continua sem conexões reais e com uso limitado."
          : "Você precisa concluir a verificação de identidade para solicitar conexão, ver dados completos ou liberar contato.",
      blockReason: "current_user_not_verified",
    };
  }

  if (targetProfilePhase === "in_review") {
    return {
      canRequestConnection: false,
      canShowContactData: false,
      canShowConnectionRing: false,
      canShowFullProfile: false,
      shouldShowAsAffinityOnly: true,
      buttonLabel: "Perfil em análise",
      statusTitle: "Perfil aguardando verificação",
      statusMessage:
        "Existe compatibilidade, mas este perfil ainda aguarda aprovação de identidade. A conexão real só poderá avançar após a verificação ser concluída.",
      blockReason: "target_user_in_review",
    };
  }

  if (targetProfilePhase !== "verified") {
    return {
      canRequestConnection: false,
      canShowContactData: false,
      canShowConnectionRing: false,
      canShowFullProfile: false,
      shouldShowAsAffinityOnly: true,
      buttonLabel: "Perfil não verificado",
      statusTitle: "Perfil não verificado",
      statusMessage:
        "Existe compatibilidade, mas este perfil ainda não concluiu a verificação de identidade. Contato e conexão real permanecem bloqueados.",
      blockReason: "target_user_not_verified",
    };
  }

  if (connectionState === "request_sent") {
    return {
      canRequestConnection: false,
      canShowContactData: false,
      canShowConnectionRing: false,
      canShowFullProfile: true,
      shouldShowAsAffinityOnly: true,
      buttonLabel: "Solicitação enviada",
      statusTitle: "Aguardando aprovação",
      statusMessage:
        "Sua solicitação foi enviada. A conexão real só aparecerá após aprovação da outra parte.",
      blockReason: "request_already_sent",
    };
  }

  if (connectionState === "request_received") {
    return {
      canRequestConnection: false,
      canShowContactData: false,
      canShowConnectionRing: false,
      canShowFullProfile: true,
      shouldShowAsAffinityOnly: true,
      buttonLabel: "Responder solicitação",
      statusTitle: "Solicitação recebida",
      statusMessage:
        "Este perfil solicitou conexão. A conexão real só será criada se você aceitar.",
      blockReason: "request_waiting_response",
    };
  }

  if (connectionState === "rejected") {
    return {
      canRequestConnection: false,
      canShowContactData: false,
      canShowConnectionRing: false,
      canShowFullProfile: true,
      shouldShowAsAffinityOnly: true,
      buttonLabel: "Solicitação recusada",
      statusTitle: "Conexão não aprovada",
      statusMessage:
        "A solicitação não foi aprovada. O ELUS não cria vínculos sem consentimento.",
      blockReason: "request_rejected",
    };
  }

  if (connectionState === "blocked") {
    return {
      canRequestConnection: false,
      canShowContactData: false,
      canShowConnectionRing: false,
      canShowFullProfile: false,
      shouldShowAsAffinityOnly: true,
      buttonLabel: "Bloqueado",
      statusTitle: "Conexão bloqueada",
      statusMessage:
        "Esta conexão não pode avançar por regra de segurança ou bloqueio manual.",
      blockReason: "blocked",
    };
  }

  return {
    canRequestConnection: true,
    canShowContactData: false,
    canShowConnectionRing: false,
    canShowFullProfile: true,
    shouldShowAsAffinityOnly: true,
    buttonLabel: "Solicitar conexão",
    statusTitle: "Afinidade detectada",
    statusMessage:
      "O ELUS encontrou afinidade. Para virar conexão real, é necessário enviar uma solicitação e receber aprovação.",
    blockReason: "none",
  };
}

// =====================================================
// Regras auxiliares para bordas coloridas
// =====================================================

export function canShowConnectionRing({
  currentUserPhase,
  targetProfilePhase,
  connectionState = "none",
}: ConnectionRuleInput): boolean {
  return (
    currentUserPhase === "verified" &&
    targetProfilePhase === "verified" &&
    connectionState === "accepted"
  );
}

export function canShowAffinityRing({
  currentUserPhase,
}: {
  currentUserPhase: IdentityPhase;
}): boolean {
  return currentUserPhase === "verified";
}

export function shouldHideAllConnectionColors({
  currentUserPhase,
}: {
  currentUserPhase: IdentityPhase;
}): boolean {
  return currentUserPhase !== "verified";
}

// =====================================================
// Textos padronizados
// =====================================================

export function getConnectionPrincipleText(): string {
  return "O ELUS encontra afinidades automaticamente. As conexões reais só acontecem com identidade verificada e aprovação.";
}

export function getConnectionRingExplanationText(): string {
  return "As bordas coloridas não aparecem por afinidade automática. Elas só aparecem quando existir uma conexão real aceita, com identidade verificada dos dois lados e aprovação.";
}

export function getLimitedAffinityText(): string {
  return "Existe compatibilidade, mas sua identidade precisa ser verificada para avançar.";
}