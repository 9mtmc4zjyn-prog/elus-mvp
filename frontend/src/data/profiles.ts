// frontend/src/data/profiles.ts

// =====================================================
// Tipos principais dos perfis do ELUS
// =====================================================

export type ProfileStatus = "verified" | "unverified" | "in_review";

export type ProfileKind =
  | "Pessoa"
  | "Empresa"
  | "Grupo"
  | "Perfil Público Protegido";

export type ProtectedProfileVisibilityMode =
  | "not_applicable"
  | "controlled";

export type ProtectedProfileConnectionMode =
  | "not_applicable"
  | "filtered_approval";

export type ProtectedProfileRelationshipType =
  | "restricted"
  | "professional"
  | "institutional";

export type ProtectedPublicProfileStatus =
  | "not_applicable"
  | "requested"
  | "in_review"
  | "approved";

export interface ProtectedPublicProfileConfig {
  enabled: boolean;
  displayLabel: "Perfil público protegido" | "Perfil oficial protegido";
  officialProtectionStatus: ProtectedPublicProfileStatus;

  officialVerificationRequired: boolean;
  hideExactLocation: boolean;
  hidePreciseDistance: boolean;
  hideDirectContact: boolean;

  visibilityMode: ProtectedProfileVisibilityMode;
  connectionMode: ProtectedProfileConnectionMode;
  representativeAllowed: boolean;

  allowedRelationshipTypes: ProtectedProfileRelationshipType[];

  appTexts: {
    profileLabel: string;
    protectedLocation: string;
    approvalRequired: string;
    protectedContact: string;
    filteredRequests: string;
  };
}

export interface Profile {
  id: string;
  aliases: string[];

  name: string;
  firstName: string;
  kind: ProfileKind;
  status: ProfileStatus;

  avatar: string;
  photoUrl: string;

  isOnline: boolean;
  role: string;
  location: string;
  city: string;
  state: string;
  connections: number;

  area: string;
  purpose: string;
  bio: string;

  interests: string[];
  basicInfo: string[];
  aiReasons: string[];

  // Preparação estrutural para o futuro Perfil Público Protegido.
  // Não altera nenhuma tela enquanto enabled não for true.
  publicProtection?: ProtectedPublicProfileConfig;
}

// =====================================================
// Configuração estrutural futura do Perfil Público Protegido
// =====================================================

export const protectedPublicProfileDefaultConfig: ProtectedPublicProfileConfig = {
  enabled: false,
  displayLabel: "Perfil público protegido",
  officialProtectionStatus: "not_applicable",

  officialVerificationRequired: true,
  hideExactLocation: true,
  hidePreciseDistance: true,
  hideDirectContact: true,

  visibilityMode: "controlled",
  connectionMode: "filtered_approval",
  representativeAllowed: true,

  allowedRelationshipTypes: ["restricted", "professional", "institutional"],

  appTexts: {
    profileLabel: "Perfil oficial protegido",
    protectedLocation: "Localização protegida",
    approvalRequired: "Solicitações passam por aprovação",
    protectedContact: "Contato direto não é exibido por segurança",
    filteredRequests: "Este perfil recebe apenas solicitações filtradas",
  },
};

export const protectedPublicProfilePlanning = {
  title: "Perfil Público Protegido",
  implementationStatus: "planned_not_active",

  coreRule:
    "O Perfil Público Protegido deve preservar segurança, privacidade, localização protegida, contato protegido e aprovação antes de qualquer vínculo real.",

  rules: [
    "Não mostrar localização exata.",
    "Não mostrar distância precisa.",
    "Não exibir telefone, WhatsApp ou e-mail pessoal.",
    "Não liberar contato direto automaticamente.",
    "Permitir visibilidade controlada no radar/mapa.",
    "Permitir solicitação de conexão sempre com aprovação.",
    "Permitir vínculos restritos, profissionais ou institucionais.",
    "Permitir representante autorizado ou equipe gerenciando o perfil.",
    "Exigir verificação reforçada antes de aparecer como perfil oficial.",
    "Manter identidade verificada, segurança e privacidade como pilares.",
  ],

  userFacingTexts: [
    "Perfil oficial protegido",
    "Localização protegida",
    "Solicitações passam por aprovação",
    "Contato direto não é exibido por segurança",
    "Este perfil recebe apenas solicitações filtradas",
  ],
};

// =====================================================
// Helpers estruturais para uso futuro
// =====================================================

export function isProtectedPublicProfile(profile: Profile): boolean {
  return (
    profile.kind === "Perfil Público Protegido" ||
    profile.publicProtection?.enabled === true
  );
}

export function shouldHideExactLocation(profile: Profile): boolean {
  if (!isProtectedPublicProfile(profile)) {
    return false;
  }

  return profile.publicProtection?.hideExactLocation ?? true;
}

export function shouldHidePreciseDistance(profile: Profile): boolean {
  if (!isProtectedPublicProfile(profile)) {
    return false;
  }

  return profile.publicProtection?.hidePreciseDistance ?? true;
}

export function shouldHideDirectContact(profile: Profile): boolean {
  if (!isProtectedPublicProfile(profile)) {
    return false;
  }

  return profile.publicProtection?.hideDirectContact ?? true;
}

export function getProtectedProfileDisplayLabel(profile: Profile): string {
  if (!isProtectedPublicProfile(profile)) {
    return profile.kind;
  }

  return (
    profile.publicProtection?.displayLabel ??
    protectedPublicProfileDefaultConfig.displayLabel
  );
}
