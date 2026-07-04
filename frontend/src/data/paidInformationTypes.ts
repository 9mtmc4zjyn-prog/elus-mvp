export type PaidInformationCategoryId =
  | 'local_offer'
  | 'professional_service'
  | 'job_opportunity'
  | 'event'
  | 'catalog'
  | 'menu'
  | 'portfolio'
  | 'promotion'
  | 'urgent_service'
  | 'public_announcement'
  | 'business_campaign'
  | 'custom';

export type PaidInformationVisibility =
  | 'profile_only'
  | 'explore'
  | 'map'
  | 'city'
  | 'region'
  | 'category'
  | 'protected';

export type PaidInformationPaymentModel =
  | 'included_in_plan'
  | 'individual_payment'
  | 'both';

export type PaidInformationAudience =
  | 'verified_person'
  | 'verified_professional'
  | 'verified_company'
  | 'verified_local_business'
  | 'official_protected_profile'
  | 'verified_creator';

export type PaidInformationModerationLevel =
  | 'automatic'
  | 'manual_review'
  | 'restricted';

export type PaidResourceVerificationStatus =
  | 'not_verified'
  | 'pending'
  | 'in_review'
  | 'verified'
  | 'official_protected';

export type PaidInformationType = {
  id: string;
  title: string;
  categoryId: PaidInformationCategoryId;
  description: string;
  examples: string[];
  visibility: PaidInformationVisibility[];
  paymentModel: PaidInformationPaymentModel;
  audiences: PaidInformationAudience[];
  moderationLevel: PaidInformationModerationLevel;
  requiresVerifiedIdentity: boolean;
  createsConnection: boolean;
  releasesContact: boolean;
  replacesVerification: boolean;
  givesActiveVoiceToUnverifiedProfile: boolean;
  recommendedForElus: boolean;
};

export type PaidInformationCategory = {
  id: PaidInformationCategoryId;
  title: string;
  description: string;
  types: PaidInformationType[];
};

export const PAID_RESOURCE_BLOCKED_TITLE = 'Recurso bloqueado até a verificação';

export const PAID_RESOURCE_BLOCKED_MESSAGE =
  'No ELUS, pagamento não substitui identidade. Planos, compras, anúncios e destaques só ficam disponíveis após a aprovação da verificação do perfil.';

export const PAID_RESOURCE_RULES = {
  paymentDoesNotReleaseContact: true,
  paymentDoesNotCreateConnection: true,
  paymentDoesNotReplaceVerification: true,
  paymentDoesNotGiveActiveVoiceToUnverifiedProfile: true,
  unverifiedProfilesCannotBuy: true,
  unverifiedProfilesCannotAdvertise: true,
  inReviewProfilesCannotBuy: true,
  inReviewProfilesCannotAdvertise: true,
} as const;

export const PAID_INFORMATION_CATEGORIES: PaidInformationCategory[] = [
  {
    id: 'local_offer',
    title: 'Ofertas locais',
    description:
      'Ofertas, promoções e oportunidades publicadas por perfis verificados, empresas locais e profissionais.',
    types: [
      {
        id: 'local_offer_card',
        title: 'Oferta local em destaque',
        categoryId: 'local_offer',
        description:
          'Card patrocinado para divulgar uma oferta local dentro do ELUS.',
        examples: [
          'Promoção da semana',
          'Produto com desconto',
          'Oferta por tempo limitado',
          'Serviço com preço especial',
        ],
        visibility: ['explore', 'map', 'city'],
        paymentModel: 'both',
        audiences: ['verified_company', 'verified_local_business', 'verified_professional'],
        moderationLevel: 'manual_review',
        requiresVerifiedIdentity: true,
        createsConnection: false,
        releasesContact: false,
        replacesVerification: false,
        givesActiveVoiceToUnverifiedProfile: false,
        recommendedForElus: true,
      },
      {
        id: 'limited_time_offer',
        title: 'Oferta por tempo limitado',
        categoryId: 'local_offer',
        description:
          'Publicação paga com data de início e fim para campanhas rápidas.',
        examples: [
          'Promoção válida até domingo',
          'Desconto por 24 horas',
          'Oferta de inauguração',
        ],
        visibility: ['explore', 'map', 'city', 'category'],
        paymentModel: 'individual_payment',
        audiences: ['verified_company', 'verified_local_business', 'verified_professional'],
        moderationLevel: 'manual_review',
        requiresVerifiedIdentity: true,
        createsConnection: false,
        releasesContact: false,
        replacesVerification: false,
        givesActiveVoiceToUnverifiedProfile: false,
        recommendedForElus: true,
      },
    ],
  },
  {
    id: 'professional_service',
    title: 'Serviços profissionais',
    description:
      'Destaques para profissionais verificados divulgarem serviços, agenda, orçamento e disponibilidade.',
    types: [
      {
        id: 'service_highlight',
        title: 'Serviço em destaque',
        categoryId: 'professional_service',
        description:
          'Destaque para serviço prestado por profissional ou empresa verificada.',
        examples: [
          'Pedreiro disponível esta semana',
          'Eletricista residencial',
          'Motorista particular',
          'Frete e transporte',
          'Designer, fotógrafo ou professor particular',
        ],
        visibility: ['profile_only', 'explore', 'map', 'category'],
        paymentModel: 'both',
        audiences: [
          'verified_person',
          'verified_professional',
          'verified_company',
          'verified_local_business',
        ],
        moderationLevel: 'manual_review',
        requiresVerifiedIdentity: true,
        createsConnection: false,
        releasesContact: false,
        replacesVerification: false,
        givesActiveVoiceToUnverifiedProfile: false,
        recommendedForElus: true,
      },
      {
        id: 'available_schedule',
        title: 'Agenda disponível',
        categoryId: 'professional_service',
        description:
          'Destaque para informar disponibilidade de horários, atendimento ou visita técnica.',
        examples: [
          'Agenda aberta esta semana',
          'Horários disponíveis para consulta',
          'Visita técnica disponível',
          'Atendimento por região',
        ],
        visibility: ['profile_only', 'explore', 'category'],
        paymentModel: 'both',
        audiences: ['verified_professional', 'verified_company', 'verified_local_business'],
        moderationLevel: 'manual_review',
        requiresVerifiedIdentity: true,
        createsConnection: false,
        releasesContact: false,
        replacesVerification: false,
        givesActiveVoiceToUnverifiedProfile: false,
        recommendedForElus: true,
      },
    ],
  },
  {
    id: 'job_opportunity',
    title: 'Vagas e oportunidades',
    description:
      'Publicações pagas para divulgar vagas, oportunidades de trabalho, parcerias e contratação.',
    types: [
      {
        id: 'job_posting',
        title: 'Vaga de emprego',
        categoryId: 'job_opportunity',
        description:
          'Publicação de vaga por empresa, profissional ou perfil autorizado verificado.',
        examples: [
          'Vaga para ajudante de obra',
          'Contratação temporária',
          'Vaga por filial',
          'Oportunidade para motorista',
        ],
        visibility: ['explore', 'city', 'region', 'category'],
        paymentModel: 'both',
        audiences: ['verified_company', 'verified_local_business', 'verified_professional'],
        moderationLevel: 'manual_review',
        requiresVerifiedIdentity: true,
        createsConnection: false,
        releasesContact: false,
        replacesVerification: false,
        givesActiveVoiceToUnverifiedProfile: false,
        recommendedForElus: true,
      },
      {
        id: 'partnership_opportunity',
        title: 'Parceria ou oportunidade',
        categoryId: 'job_opportunity',
        description:
          'Destaque para parceria, sociedade, fornecedor, cliente ou oportunidade comercial.',
        examples: [
          'Procuro fornecedor',
          'Procuro sócio',
          'Procuro parceria comercial',
          'Procuro profissional para projeto',
        ],
        visibility: ['explore', 'city', 'region', 'category'],
        paymentModel: 'individual_payment',
        audiences: [
          'verified_person',
          'verified_professional',
          'verified_company',
          'verified_local_business',
        ],
        moderationLevel: 'manual_review',
        requiresVerifiedIdentity: true,
        createsConnection: false,
        releasesContact: false,
        replacesVerification: false,
        givesActiveVoiceToUnverifiedProfile: false,
        recommendedForElus: true,
      },
    ],
  },
  {
    id: 'event',
    title: 'Eventos',
    description:
      'Destaques para eventos, cursos, encontros, palestras, feiras, aulas e campanhas.',
    types: [
      {
        id: 'event_highlight',
        title: 'Evento em destaque',
        categoryId: 'event',
        description:
          'Anúncio pago para divulgar um evento dentro do ELUS.',
        examples: [
          'Curso presencial',
          'Palestra',
          'Evento local',
          'Feira comercial',
          'Campeonato',
          'Encontro profissional',
        ],
        visibility: ['explore', 'map', 'city', 'region'],
        paymentModel: 'both',
        audiences: [
          'verified_person',
          'verified_professional',
          'verified_company',
          'verified_local_business',
          'official_protected_profile',
          'verified_creator',
        ],
        moderationLevel: 'manual_review',
        requiresVerifiedIdentity: true,
        createsConnection: false,
        releasesContact: false,
        replacesVerification: false,
        givesActiveVoiceToUnverifiedProfile: false,
        recommendedForElus: true,
      },
    ],
  },
  {
    id: 'catalog',
    title: 'Catálogos',
    description:
      'Catálogos pagos ou incluídos em plano para produtos, serviços, portfólio comercial e materiais de venda.',
    types: [
      {
        id: 'product_catalog',
        title: 'Catálogo de produtos',
        categoryId: 'catalog',
        description:
          'Catálogo publicado por empresa, loja ou profissional verificado.',
        examples: [
          'Catálogo de móveis',
          'Catálogo de roupas',
          'Catálogo de peças',
          'Catálogo de materiais',
        ],
        visibility: ['profile_only', 'explore', 'category'],
        paymentModel: 'both',
        audiences: ['verified_company', 'verified_local_business', 'verified_professional'],
        moderationLevel: 'manual_review',
        requiresVerifiedIdentity: true,
        createsConnection: false,
        releasesContact: false,
        replacesVerification: false,
        givesActiveVoiceToUnverifiedProfile: false,
        recommendedForElus: true,
      },
      {
        id: 'service_catalog',
        title: 'Catálogo de serviços',
        categoryId: 'catalog',
        description:
          'Lista organizada de serviços oferecidos por perfil verificado.',
        examples: [
          'Tabela de serviços',
          'Pacotes de atendimento',
          'Lista de procedimentos',
          'Serviços por região',
        ],
        visibility: ['profile_only', 'explore', 'category'],
        paymentModel: 'both',
        audiences: ['verified_professional', 'verified_company', 'verified_local_business'],
        moderationLevel: 'manual_review',
        requiresVerifiedIdentity: true,
        createsConnection: false,
        releasesContact: false,
        replacesVerification: false,
        givesActiveVoiceToUnverifiedProfile: false,
        recommendedForElus: true,
      },
    ],
  },
  {
    id: 'menu',
    title: 'Cardápios e pedidos',
    description:
      'Informações pagas ou destacadas para restaurantes, lanchonetes, mercados e delivery.',
    types: [
      {
        id: 'menu_highlight',
        title: 'Cardápio em destaque',
        categoryId: 'menu',
        description:
          'Destaque para cardápio, prato, promoção ou link de pedido.',
        examples: [
          'Cardápio da semana',
          'Prato em destaque',
          'Pedido pelo iFood',
          'Pedido pelo WhatsApp',
          'Reserva de mesa',
        ],
        visibility: ['profile_only', 'explore', 'map', 'city'],
        paymentModel: 'both',
        audiences: ['verified_company', 'verified_local_business'],
        moderationLevel: 'manual_review',
        requiresVerifiedIdentity: true,
        createsConnection: false,
        releasesContact: false,
        replacesVerification: false,
        givesActiveVoiceToUnverifiedProfile: false,
        recommendedForElus: true,
      },
    ],
  },
  {
    id: 'portfolio',
    title: 'Portfólio destacado',
    description:
      'Destaques para trabalhos realizados, antes e depois, projetos, fotos e apresentações profissionais.',
    types: [
      {
        id: 'portfolio_highlight',
        title: 'Portfólio em destaque',
        categoryId: 'portfolio',
        description:
          'Destaque para mostrar trabalhos, projetos ou resultados de um perfil verificado.',
        examples: [
          'Antes e depois',
          'Obras realizadas',
          'Fotos de projetos',
          'Cases profissionais',
          'Trabalhos recentes',
        ],
        visibility: ['profile_only', 'explore', 'category'],
        paymentModel: 'both',
        audiences: ['verified_person', 'verified_professional', 'verified_company', 'verified_creator'],
        moderationLevel: 'manual_review',
        requiresVerifiedIdentity: true,
        createsConnection: false,
        releasesContact: false,
        replacesVerification: false,
        givesActiveVoiceToUnverifiedProfile: false,
        recommendedForElus: true,
      },
    ],
  },
  {
    id: 'urgent_service',
    title: 'Serviços urgentes',
    description:
      'Destaques para serviços com necessidade rápida, como guincho, chaveiro, eletricista, frete e manutenção.',
    types: [
      {
        id: 'urgent_service_now',
        title: 'Serviço disponível agora',
        categoryId: 'urgent_service',
        description:
          'Anúncio para serviço urgente, com visibilidade por região, cidade ou categoria.',
        examples: [
          'Guincho disponível',
          'Chaveiro 24h',
          'Eletricista emergencial',
          'Encanador disponível',
          'Frete rápido',
        ],
        visibility: ['explore', 'map', 'city', 'region', 'category'],
        paymentModel: 'individual_payment',
        audiences: ['verified_professional', 'verified_company', 'verified_local_business'],
        moderationLevel: 'manual_review',
        requiresVerifiedIdentity: true,
        createsConnection: false,
        releasesContact: false,
        replacesVerification: false,
        givesActiveVoiceToUnverifiedProfile: false,
        recommendedForElus: true,
      },
    ],
  },
  {
    id: 'public_announcement',
    title: 'Comunicados oficiais',
    description:
      'Comunicados para perfis oficiais protegidos, empresas, marcas, assessorias e instituições verificadas.',
    types: [
      {
        id: 'official_announcement',
        title: 'Comunicado oficial',
        categoryId: 'public_announcement',
        description:
          'Publicação oficial de perfil protegido, marca, empresa ou instituição verificada.',
        examples: [
          'Comunicado institucional',
          'Agenda pública',
          'Nota oficial',
          'Campanha oficial',
        ],
        visibility: ['profile_only', 'explore', 'city', 'region', 'protected'],
        paymentModel: 'both',
        audiences: ['official_protected_profile', 'verified_company', 'verified_creator'],
        moderationLevel: 'restricted',
        requiresVerifiedIdentity: true,
        createsConnection: false,
        releasesContact: false,
        replacesVerification: false,
        givesActiveVoiceToUnverifiedProfile: false,
        recommendedForElus: true,
      },
      {
        id: 'press_or_booking_info',
        title: 'Imprensa, assessoria ou contratação',
        categoryId: 'public_announcement',
        description:
          'Informação protegida para imprensa, assessoria, contratação artística ou representante autorizado.',
        examples: [
          'Contato de assessoria',
          'Contratação profissional',
          'Press kit',
          'Mídia kit',
          'Representante autorizado',
        ],
        visibility: ['profile_only', 'protected'],
        paymentModel: 'included_in_plan',
        audiences: ['official_protected_profile', 'verified_creator', 'verified_company'],
        moderationLevel: 'restricted',
        requiresVerifiedIdentity: true,
        createsConnection: false,
        releasesContact: false,
        replacesVerification: false,
        givesActiveVoiceToUnverifiedProfile: false,
        recommendedForElus: true,
      },
    ],
  },
  {
    id: 'business_campaign',
    title: 'Campanhas comerciais',
    description:
      'Campanhas para empresas verificadas, marcas, redes, filiais e negócios locais.',
    types: [
      {
        id: 'business_campaign_city',
        title: 'Campanha por cidade',
        categoryId: 'business_campaign',
        description:
          'Campanha comercial exibida em uma cidade específica para perfis verificados.',
        examples: [
          'Campanha municipal',
          'Promoção por cidade',
          'Ação de filial',
          'Divulgação regional',
        ],
        visibility: ['city', 'explore', 'map'],
        paymentModel: 'individual_payment',
        audiences: ['verified_company', 'verified_local_business'],
        moderationLevel: 'manual_review',
        requiresVerifiedIdentity: true,
        createsConnection: false,
        releasesContact: false,
        replacesVerification: false,
        givesActiveVoiceToUnverifiedProfile: false,
        recommendedForElus: true,
      },
      {
        id: 'business_campaign_region',
        title: 'Campanha regional',
        categoryId: 'business_campaign',
        description:
          'Campanha com alcance por região, raio de atendimento ou múltiplas cidades.',
        examples: [
          'Campanha regional',
          'Divulgação por raio',
          'Campanha de rede',
          'Promoção por filial',
        ],
        visibility: ['region', 'explore', 'map'],
        paymentModel: 'individual_payment',
        audiences: ['verified_company'],
        moderationLevel: 'manual_review',
        requiresVerifiedIdentity: true,
        createsConnection: false,
        releasesContact: false,
        replacesVerification: false,
        givesActiveVoiceToUnverifiedProfile: false,
        recommendedForElus: true,
      },
    ],
  },
  {
    id: 'custom',
    title: 'Informação paga personalizada',
    description:
      'Tipo flexível para futuras informações pagas sem quebrar a estrutura principal.',
    types: [
      {
        id: 'custom_paid_information',
        title: 'Informação paga personalizada',
        categoryId: 'custom',
        description:
          'Modelo genérico para informação, destaque ou anúncio futuro ainda não categorizado.',
        examples: [
          'Informação adicional',
          'Destaque personalizado',
          'Oferta especial',
          'Publicação comercial específica',
        ],
        visibility: ['profile_only', 'explore', 'category'],
        paymentModel: 'individual_payment',
        audiences: [
          'verified_person',
          'verified_professional',
          'verified_company',
          'verified_local_business',
          'official_protected_profile',
          'verified_creator',
        ],
        moderationLevel: 'manual_review',
        requiresVerifiedIdentity: true,
        createsConnection: false,
        releasesContact: false,
        replacesVerification: false,
        givesActiveVoiceToUnverifiedProfile: false,
        recommendedForElus: true,
      },
    ],
  },
];

export const PAID_INFORMATION_TYPES: PaidInformationType[] =
  PAID_INFORMATION_CATEGORIES.flatMap(category => category.types);

export function getPaidInformationCategoryById(
  id: PaidInformationCategoryId,
): PaidInformationCategory | undefined {
  return PAID_INFORMATION_CATEGORIES.find(category => category.id === id);
}

export function getPaidInformationTypeById(
  id: string,
): PaidInformationType | undefined {
  return PAID_INFORMATION_TYPES.find(type => type.id === id);
}

export function getPaidInformationTypesByCategory(
  categoryId: PaidInformationCategoryId,
): PaidInformationType[] {
  return PAID_INFORMATION_TYPES.filter(type => type.categoryId === categoryId);
}

export function getRecommendedPaidInformationTypes(): PaidInformationType[] {
  return PAID_INFORMATION_TYPES.filter(type => type.recommendedForElus);
}

export function getPaidInformationTypesForAudience(
  audience: PaidInformationAudience,
): PaidInformationType[] {
  return PAID_INFORMATION_TYPES.filter(type => type.audiences.includes(audience));
}

export function canAccessPaidResources(
  verificationStatus: PaidResourceVerificationStatus,
): boolean {
  return verificationStatus === 'verified' || verificationStatus === 'official_protected';
}

export function getPaidResourceBlockedMessage(
  verificationStatus: PaidResourceVerificationStatus,
): string | null {
  if (canAccessPaidResources(verificationStatus)) {
    return null;
  }

  if (verificationStatus === 'in_review') {
    return 'Sua verificação está em análise. Planos, compras, anúncios e destaques serão liberados somente após a aprovação da identidade.';
  }

  return PAID_RESOURCE_BLOCKED_MESSAGE;
}

export function paidInformationTypeIsSafeForElus(
  type: PaidInformationType,
): boolean {
  return (
    type.requiresVerifiedIdentity === true &&
    type.createsConnection === false &&
    type.releasesContact === false &&
    type.replacesVerification === false &&
    type.givesActiveVoiceToUnverifiedProfile === false
  );
}