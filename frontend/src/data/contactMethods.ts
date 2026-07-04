export type ContactMethodCategoryId =
  | 'direct_contact'
  | 'messaging'
  | 'social_media'
  | 'professional'
  | 'business_service'
  | 'delivery_food'
  | 'mobility_transport'
  | 'marketplace_store'
  | 'booking_schedule'
  | 'location'
  | 'payment'
  | 'content_creator'
  | 'community'
  | 'documents_credentials'
  | 'institutional'
  | 'custom';

export type ContactMethodAudience =
  | 'person'
  | 'professional'
  | 'company'
  | 'local_business'
  | 'public_protected'
  | 'creator'
  | 'community'
  | 'service_provider';

export type ContactMethodSensitivity =
  | 'low'
  | 'medium'
  | 'high'
  | 'protected';

export type ContactMethodInputType =
  | 'text'
  | 'phone'
  | 'email'
  | 'url'
  | 'username'
  | 'address'
  | 'document'
  | 'file'
  | 'pix'
  | 'custom';

export type ContactMethod = {
  id: string;
  label: string;
  categoryId: ContactMethodCategoryId;
  inputType: ContactMethodInputType;
  sensitivity: ContactMethodSensitivity;
  audiences: ContactMethodAudience[];
  placeholder?: string;
  description?: string;
  requiresApproval: boolean;
  canBePublic: boolean;
  recommendedForElus: boolean;
};

export type ContactMethodCategory = {
  id: ContactMethodCategoryId;
  title: string;
  description: string;
  methods: ContactMethod[];
};

type ContactMethodOptions = {
  placeholder?: string;
  description?: string;
  requiresApproval?: boolean;
  canBePublic?: boolean;
  recommendedForElus?: boolean;
};

function createContactMethod(
  categoryId: ContactMethodCategoryId,
  id: string,
  label: string,
  inputType: ContactMethodInputType,
  sensitivity: ContactMethodSensitivity,
  audiences: ContactMethodAudience[],
  options: ContactMethodOptions = {}
): ContactMethod {
  const defaultRequiresApproval = sensitivity !== 'low';
  const defaultCanBePublic = sensitivity === 'low';

  return {
    id,
    label,
    categoryId,
    inputType,
    sensitivity,
    audiences,
    placeholder: options.placeholder,
    description: options.description,
    requiresApproval: options.requiresApproval ?? defaultRequiresApproval,
    canBePublic: options.canBePublic ?? defaultCanBePublic,
    recommendedForElus: options.recommendedForElus ?? false,
  };
}

export const CONTACT_METHOD_CATEGORIES: ContactMethodCategory[] = [
  {
    id: 'direct_contact',
    title: 'Contato direto',
    description:
      'Meios sensíveis de contato pessoal, profissional ou comercial. No ELUS, devem depender de solicitação e aprovação.',
    methods: [
      createContactMethod('direct_contact', 'whatsapp', 'WhatsApp', 'phone', 'high', ['person', 'professional', 'company', 'local_business', 'service_provider'], {
        placeholder: '+55 00 00000-0000',
        description: 'Número de WhatsApp pessoal, profissional ou comercial.',
        requiresApproval: true,
        canBePublic: false,
        recommendedForElus: true,
      }),
      createContactMethod('direct_contact', 'whatsapp_business', 'WhatsApp Business', 'phone', 'high', ['professional', 'company', 'local_business', 'service_provider'], {
        placeholder: '+55 00 00000-0000',
        description: 'Canal comercial pelo WhatsApp Business.',
        requiresApproval: true,
        canBePublic: false,
        recommendedForElus: true,
      }),
      createContactMethod('direct_contact', 'mobile_phone', 'Telefone celular', 'phone', 'high', ['person', 'professional', 'company', 'service_provider'], {
        placeholder: '+55 00 00000-0000',
        description: 'Telefone celular para ligações ou contato direto.',
        requiresApproval: true,
        canBePublic: false,
        recommendedForElus: true,
      }),
      createContactMethod('direct_contact', 'landline_phone', 'Telefone fixo', 'phone', 'medium', ['person', 'professional', 'company', 'local_business'], {
        placeholder: '+55 00 0000-0000',
        description: 'Telefone fixo residencial, comercial ou institucional.',
        requiresApproval: true,
        canBePublic: true,
        recommendedForElus: true,
      }),
      createContactMethod('direct_contact', 'personal_email', 'E-mail pessoal', 'email', 'high', ['person', 'professional'], {
        placeholder: 'nome@email.com',
        description: 'E-mail pessoal do usuário.',
        requiresApproval: true,
        canBePublic: false,
        recommendedForElus: true,
      }),
      createContactMethod('direct_contact', 'professional_email', 'E-mail profissional', 'email', 'medium', ['professional', 'company', 'local_business', 'service_provider'], {
        placeholder: 'contato@empresa.com',
        description: 'E-mail profissional ou comercial.',
        requiresApproval: true,
        canBePublic: true,
        recommendedForElus: true,
      }),
      createContactMethod('direct_contact', 'sms', 'SMS', 'phone', 'high', ['person', 'professional'], {
        placeholder: '+55 00 00000-0000',
        description: 'Número para contato por SMS.',
        requiresApproval: true,
        canBePublic: false,
      }),
      createContactMethod('direct_contact', 'facetime', 'FaceTime', 'text', 'high', ['person', 'professional'], {
        placeholder: 'telefone ou Apple ID',
        description: 'Contato para chamada por FaceTime.',
        requiresApproval: true,
        canBePublic: false,
      }),
      createContactMethod('direct_contact', 'emergency_contact', 'Contato de emergência', 'phone', 'protected', ['person'], {
        placeholder: '+55 00 00000-0000',
        description: 'Contato de emergência. Deve ser extremamente protegido.',
        requiresApproval: true,
        canBePublic: false,
      }),
    ],
  },
  {
    id: 'messaging',
    title: 'Mensageiros e chats',
    description:
      'Aplicativos de conversa e comunicação direta. Devem ser tratados como contato sensível.',
    methods: [
      createContactMethod('messaging', 'telegram', 'Telegram', 'username', 'high', ['person', 'professional', 'company', 'creator'], {
        placeholder: '@usuario ou link do Telegram',
        description: 'Usuário, número ou link do Telegram.',
        requiresApproval: true,
        canBePublic: false,
        recommendedForElus: true,
      }),
      createContactMethod('messaging', 'signal', 'Signal', 'phone', 'high', ['person', 'professional'], {
        placeholder: '+55 00 00000-0000',
        description: 'Contato pelo Signal.',
        requiresApproval: true,
        canBePublic: false,
      }),
      createContactMethod('messaging', 'messenger', 'Messenger', 'url', 'medium', ['person', 'professional', 'company'], {
        placeholder: 'https://m.me/usuario',
        description: 'Link do Facebook Messenger.',
        requiresApproval: true,
        canBePublic: true,
      }),
      createContactMethod('messaging', 'discord', 'Discord', 'username', 'medium', ['person', 'creator', 'community', 'professional'], {
        placeholder: 'usuário ou link do servidor',
        description: 'Usuário, convite ou servidor do Discord.',
        requiresApproval: true,
        canBePublic: true,
        recommendedForElus: true,
      }),
      createContactMethod('messaging', 'slack', 'Slack', 'url', 'medium', ['professional', 'company'], {
        placeholder: 'link do workspace ou convite',
        description: 'Canal corporativo ou profissional no Slack.',
        requiresApproval: true,
        canBePublic: false,
      }),
      createContactMethod('messaging', 'microsoft_teams', 'Microsoft Teams', 'url', 'medium', ['professional', 'company'], {
        placeholder: 'link de contato ou reunião',
        description: 'Contato ou reunião pelo Microsoft Teams.',
        requiresApproval: true,
        canBePublic: false,
      }),
      createContactMethod('messaging', 'google_chat', 'Google Chat', 'email', 'medium', ['professional', 'company'], {
        placeholder: 'email@empresa.com',
        description: 'Contato por Google Chat.',
        requiresApproval: true,
        canBePublic: false,
      }),
      createContactMethod('messaging', 'skype', 'Skype', 'username', 'medium', ['person', 'professional', 'company'], {
        placeholder: 'usuário Skype',
        description: 'Usuário do Skype.',
        requiresApproval: true,
        canBePublic: true,
      }),
      createContactMethod('messaging', 'wechat', 'WeChat', 'username', 'medium', ['person', 'professional', 'company'], {
        placeholder: 'WeChat ID',
        description: 'Contato pelo WeChat.',
        requiresApproval: true,
        canBePublic: false,
      }),
      createContactMethod('messaging', 'line', 'Line', 'username', 'medium', ['person', 'professional'], {
        placeholder: 'Line ID',
        description: 'Contato pelo Line.',
        requiresApproval: true,
        canBePublic: false,
      }),
    ],
  },
  {
    id: 'social_media',
    title: 'Redes sociais',
    description:
      'Perfis sociais usados para presença pública, relacionamento, divulgação ou contato inicial.',
    methods: [
      createContactMethod('social_media', 'instagram', 'Instagram', 'username', 'medium', ['person', 'professional', 'company', 'local_business', 'creator', 'public_protected'], {
        placeholder: '@usuario',
        description: 'Perfil no Instagram.',
        requiresApproval: true,
        canBePublic: true,
        recommendedForElus: true,
      }),
      createContactMethod('social_media', 'facebook', 'Facebook', 'url', 'medium', ['person', 'professional', 'company', 'local_business', 'creator'], {
        placeholder: 'https://facebook.com/usuario',
        description: 'Perfil ou página no Facebook.',
        requiresApproval: true,
        canBePublic: true,
        recommendedForElus: true,
      }),
      createContactMethod('social_media', 'tiktok', 'TikTok', 'username', 'medium', ['person', 'creator', 'company', 'local_business'], {
        placeholder: '@usuario',
        description: 'Perfil no TikTok.',
        requiresApproval: true,
        canBePublic: true,
        recommendedForElus: true,
      }),
      createContactMethod('social_media', 'youtube', 'YouTube', 'url', 'low', ['person', 'creator', 'company', 'local_business', 'public_protected'], {
        placeholder: 'https://youtube.com/@canal',
        description: 'Canal no YouTube.',
        requiresApproval: false,
        canBePublic: true,
        recommendedForElus: true,
      }),
      createContactMethod('social_media', 'linkedin', 'LinkedIn', 'url', 'medium', ['person', 'professional', 'company', 'service_provider'], {
        placeholder: 'https://linkedin.com/in/usuario',
        description: 'Perfil profissional ou página da empresa no LinkedIn.',
        requiresApproval: true,
        canBePublic: true,
        recommendedForElus: true,
      }),
      createContactMethod('social_media', 'x_twitter', 'X / Twitter', 'username', 'medium', ['person', 'creator', 'company', 'public_protected'], {
        placeholder: '@usuario',
        description: 'Perfil no X/Twitter.',
        requiresApproval: true,
        canBePublic: true,
      }),
      createContactMethod('social_media', 'threads', 'Threads', 'username', 'medium', ['person', 'creator', 'company'], {
        placeholder: '@usuario',
        description: 'Perfil no Threads.',
        requiresApproval: true,
        canBePublic: true,
      }),
      createContactMethod('social_media', 'snapchat', 'Snapchat', 'username', 'medium', ['person', 'creator'], {
        placeholder: 'usuário',
        description: 'Perfil no Snapchat.',
        requiresApproval: true,
        canBePublic: false,
      }),
      createContactMethod('social_media', 'pinterest', 'Pinterest', 'url', 'low', ['person', 'creator', 'company', 'service_provider'], {
        placeholder: 'https://pinterest.com/usuario',
        description: 'Perfil no Pinterest.',
        requiresApproval: false,
        canBePublic: true,
      }),
      createContactMethod('social_media', 'kwai', 'Kwai', 'username', 'medium', ['person', 'creator', 'company'], {
        placeholder: '@usuario',
        description: 'Perfil no Kwai.',
        requiresApproval: true,
        canBePublic: true,
      }),
      createContactMethod('social_media', 'twitch', 'Twitch', 'url', 'low', ['creator', 'person'], {
        placeholder: 'https://twitch.tv/canal',
        description: 'Canal na Twitch.',
        requiresApproval: false,
        canBePublic: true,
      }),
      createContactMethod('social_media', 'reddit', 'Reddit', 'username', 'medium', ['person', 'creator', 'professional'], {
        placeholder: 'u/usuario',
        description: 'Perfil no Reddit.',
        requiresApproval: true,
        canBePublic: true,
      }),
    ],
  },
  {
    id: 'professional',
    title: 'Profissional e carreira',
    description:
      'Canais e documentos para currículo, portfólio, oportunidades, networking e contratação.',
    methods: [
      createContactMethod('professional', 'resume', 'Currículo', 'file', 'protected', ['person', 'professional'], {
        placeholder: 'Arquivo PDF ou link do currículo',
        description: 'Currículo do usuário.',
        requiresApproval: true,
        canBePublic: false,
        recommendedForElus: true,
      }),
      createContactMethod('professional', 'portfolio', 'Portfólio', 'url', 'medium', ['professional', 'creator', 'service_provider'], {
        placeholder: 'https://meuportfolio.com',
        description: 'Portfólio profissional, artístico ou comercial.',
        requiresApproval: true,
        canBePublic: true,
        recommendedForElus: true,
      }),
      createContactMethod('professional', 'personal_website', 'Site profissional', 'url', 'low', ['person', 'professional', 'creator', 'service_provider'], {
        placeholder: 'https://meusite.com',
        description: 'Site pessoal ou profissional.',
        requiresApproval: false,
        canBePublic: true,
        recommendedForElus: true,
      }),
      createContactMethod('professional', 'digital_business_card', 'Cartão de visita digital', 'url', 'medium', ['professional', 'company', 'service_provider'], {
        placeholder: 'link do cartão digital',
        description: 'Cartão digital com informações profissionais.',
        requiresApproval: true,
        canBePublic: true,
        recommendedForElus: true,
      }),
      createContactMethod('professional', 'github', 'GitHub', 'url', 'low', ['professional', 'person'], {
        placeholder: 'https://github.com/usuario',
        description: 'Perfil de desenvolvimento no GitHub.',
        requiresApproval: false,
        canBePublic: true,
        recommendedForElus: true,
      }),
      createContactMethod('professional', 'behance', 'Behance', 'url', 'low', ['professional', 'creator'], {
        placeholder: 'https://behance.net/usuario',
        description: 'Portfólio criativo no Behance.',
        requiresApproval: false,
        canBePublic: true,
      }),
      createContactMethod('professional', 'dribbble', 'Dribbble', 'url', 'low', ['professional', 'creator'], {
        placeholder: 'https://dribbble.com/usuario',
        description: 'Portfólio de design no Dribbble.',
        requiresApproval: false,
        canBePublic: true,
      }),
      createContactMethod('professional', 'artstation', 'ArtStation', 'url', 'low', ['creator', 'professional'], {
        placeholder: 'https://artstation.com/usuario',
        description: 'Portfólio artístico ou 3D.',
        requiresApproval: false,
        canBePublic: true,
      }),
      createContactMethod('professional', 'lattes', 'Currículo Lattes', 'url', 'medium', ['professional', 'person'], {
        placeholder: 'link do Currículo Lattes',
        description: 'Currículo acadêmico Lattes.',
        requiresApproval: true,
        canBePublic: true,
      }),
      createContactMethod('professional', 'google_scholar', 'Google Scholar', 'url', 'low', ['professional', 'person'], {
        placeholder: 'link do perfil acadêmico',
        description: 'Perfil acadêmico no Google Scholar.',
        requiresApproval: false,
        canBePublic: true,
      }),
      createContactMethod('professional', 'researchgate', 'ResearchGate', 'url', 'low', ['professional', 'person'], {
        placeholder: 'link do perfil',
        description: 'Perfil acadêmico no ResearchGate.',
        requiresApproval: false,
        canBePublic: true,
      }),
      createContactMethod('professional', 'workana', 'Workana', 'url', 'medium', ['professional', 'service_provider'], {
        placeholder: 'link do perfil Workana',
        description: 'Perfil freelancer na Workana.',
        requiresApproval: true,
        canBePublic: true,
      }),
      createContactMethod('professional', 'freelancer', 'Freelancer', 'url', 'medium', ['professional', 'service_provider'], {
        placeholder: 'link do perfil Freelancer',
        description: 'Perfil na plataforma Freelancer.',
        requiresApproval: true,
        canBePublic: true,
      }),
      createContactMethod('professional', 'fiverr', 'Fiverr', 'url', 'medium', ['professional', 'service_provider'], {
        placeholder: 'link do perfil Fiverr',
        description: 'Perfil profissional no Fiverr.',
        requiresApproval: true,
        canBePublic: true,
      }),
      createContactMethod('professional', 'upwork', 'Upwork', 'url', 'medium', ['professional', 'service_provider'], {
        placeholder: 'link do perfil Upwork',
        description: 'Perfil profissional no Upwork.',
        requiresApproval: true,
        canBePublic: true,
      }),
      createContactMethod('professional', 'getninjas', 'GetNinjas', 'url', 'medium', ['professional', 'service_provider', 'local_business'], {
        placeholder: 'link do perfil GetNinjas',
        description: 'Perfil de prestador de serviço no GetNinjas.',
        requiresApproval: true,
        canBePublic: true,
        recommendedForElus: true,
      }),
      createContactMethod('professional', 'habitissimo', 'Habitissimo', 'url', 'medium', ['professional', 'service_provider', 'company'], {
        placeholder: 'link do perfil Habitissimo',
        description: 'Perfil de obras, reformas e serviços.',
        requiresApproval: true,
        canBePublic: true,
      }),
      createContactMethod('professional', 'infojobs', 'InfoJobs', 'url', 'medium', ['person', 'professional', 'company'], {
        placeholder: 'link do perfil ou vaga',
        description: 'Perfil profissional ou vaga no InfoJobs.',
        requiresApproval: true,
        canBePublic: true,
      }),
      createContactMethod('professional', 'indeed', 'Indeed', 'url', 'medium', ['person', 'professional', 'company'], {
        placeholder: 'link do perfil ou vaga',
        description: 'Perfil profissional ou vaga no Indeed.',
        requiresApproval: true,
        canBePublic: true,
      }),
      createContactMethod('professional', 'gupy', 'Gupy', 'url', 'medium', ['person', 'professional', 'company'], {
        placeholder: 'link da vaga ou perfil',
        description: 'Link de processo seletivo ou vaga na Gupy.',
        requiresApproval: true,
        canBePublic: true,
      }),
    ],
  },
  {
    id: 'business_service',
    title: 'Empresa, comércio e atendimento',
    description:
      'Canais de atendimento, vendas, suporte, orçamento e presença comercial.',
    methods: [
      createContactMethod('business_service', 'official_website', 'Site oficial', 'url', 'low', ['company', 'local_business', 'professional', 'service_provider'], {
        placeholder: 'https://empresa.com',
        description: 'Site oficial da empresa, profissional ou serviço.',
        requiresApproval: false,
        canBePublic: true,
        recommendedForElus: true,
      }),
      createContactMethod('business_service', 'commercial_email', 'E-mail comercial', 'email', 'medium', ['company', 'local_business', 'professional', 'service_provider'], {
        placeholder: 'comercial@empresa.com',
        description: 'E-mail para vendas ou contato comercial.',
        requiresApproval: true,
        canBePublic: true,
        recommendedForElus: true,
      }),
      createContactMethod('business_service', 'support_email', 'E-mail de suporte', 'email', 'medium', ['company', 'local_business'], {
        placeholder: 'suporte@empresa.com',
        description: 'Canal de suporte por e-mail.',
        requiresApproval: true,
        canBePublic: true,
        recommendedForElus: true,
      }),
      createContactMethod('business_service', 'financial_email', 'E-mail financeiro', 'email', 'protected', ['company', 'local_business'], {
        placeholder: 'financeiro@empresa.com',
        description: 'Canal financeiro da empresa.',
        requiresApproval: true,
        canBePublic: false,
      }),
      createContactMethod('business_service', 'sac', 'SAC', 'text', 'medium', ['company', 'local_business'], {
        placeholder: 'telefone, e-mail ou link do SAC',
        description: 'Serviço de Atendimento ao Consumidor.',
        requiresApproval: false,
        canBePublic: true,
        recommendedForElus: true,
      }),
      createContactMethod('business_service', 'ombudsman', 'Ouvidoria', 'text', 'medium', ['company'], {
        placeholder: 'telefone, e-mail ou link da ouvidoria',
        description: 'Canal de ouvidoria da empresa ou instituição.',
        requiresApproval: false,
        canBePublic: true,
      }),
      createContactMethod('business_service', 'website_chat', 'Chat do site', 'url', 'low', ['company', 'local_business'], {
        placeholder: 'link do chat ou atendimento',
        description: 'Chat online no site da empresa.',
        requiresApproval: false,
        canBePublic: true,
        recommendedForElus: true,
      }),
      createContactMethod('business_service', 'contact_form', 'Formulário de contato', 'url', 'low', ['company', 'local_business', 'professional'], {
        placeholder: 'link do formulário',
        description: 'Formulário para contato, orçamento ou atendimento.',
        requiresApproval: false,
        canBePublic: true,
        recommendedForElus: true,
      }),
      createContactMethod('business_service', 'quote_form', 'Formulário de orçamento', 'url', 'low', ['company', 'local_business', 'service_provider', 'professional'], {
        placeholder: 'link para solicitar orçamento',
        description: 'Formulário para solicitar orçamento.',
        requiresApproval: false,
        canBePublic: true,
        recommendedForElus: true,
      }),
      createContactMethod('business_service', 'google_business_profile', 'Google Meu Negócio', 'url', 'low', ['company', 'local_business', 'service_provider'], {
        placeholder: 'link do perfil no Google',
        description: 'Perfil comercial no Google.',
        requiresApproval: false,
        canBePublic: true,
        recommendedForElus: true,
      }),
      createContactMethod('business_service', 'google_maps_business', 'Perfil no Google Maps', 'url', 'low', ['company', 'local_business', 'service_provider'], {
        placeholder: 'link do Google Maps',
        description: 'Localização ou perfil da empresa no Google Maps.',
        requiresApproval: false,
        canBePublic: true,
        recommendedForElus: true,
      }),
      createContactMethod('business_service', 'online_catalog', 'Catálogo online', 'url', 'low', ['company', 'local_business', 'service_provider'], {
        placeholder: 'link do catálogo',
        description: 'Catálogo online de produtos ou serviços.',
        requiresApproval: false,
        canBePublic: true,
        recommendedForElus: true,
      }),
      createContactMethod('business_service', 'catalog_pdf', 'Catálogo em PDF', 'file', 'medium', ['company', 'local_business', 'service_provider'], {
        placeholder: 'arquivo PDF do catálogo',
        description: 'Catálogo comercial em PDF.',
        requiresApproval: true,
        canBePublic: true,
        recommendedForElus: true,
      }),
      createContactMethod('business_service', 'price_list', 'Tabela de preços', 'file', 'medium', ['company', 'local_business', 'service_provider'], {
        placeholder: 'arquivo ou link da tabela',
        description: 'Tabela de preços, serviços ou pacotes.',
        requiresApproval: true,
        canBePublic: false,
        recommendedForElus: true,
      }),
      createContactMethod('business_service', 'commercial_presentation', 'Apresentação comercial', 'file', 'medium', ['company', 'professional', 'service_provider'], {
        placeholder: 'arquivo PDF ou link',
        description: 'Apresentação comercial da empresa ou profissional.',
        requiresApproval: true,
        canBePublic: false,
        recommendedForElus: true,
      }),
    ],
  },
  {
    id: 'delivery_food',
    title: 'Delivery, comida e restaurantes',
    description:
      'Canais de pedido, cardápio, reserva, entrega, restaurante, lanchonete e mercado.',
    methods: [
      createContactMethod('delivery_food', 'ifood', 'iFood', 'url', 'low', ['company', 'local_business'], {
        placeholder: 'link da loja no iFood',
        description: 'Perfil do restaurante, mercado ou loja no iFood.',
        requiresApproval: false,
        canBePublic: true,
        recommendedForElus: true,
      }),
      createContactMethod('delivery_food', 'rappi', 'Rappi', 'url', 'low', ['company', 'local_business'], {
        placeholder: 'link da loja no Rappi',
        description: 'Perfil da empresa no Rappi.',
        requiresApproval: false,
        canBePublic: true,
        recommendedForElus: true,
      }),
      createContactMethod('delivery_food', 'aiqfome', 'Aiqfome', 'url', 'low', ['company', 'local_business'], {
        placeholder: 'link da loja no Aiqfome',
        description: 'Perfil do restaurante ou loja no Aiqfome.',
        requiresApproval: false,
        canBePublic: true,
        recommendedForElus: true,
      }),
      createContactMethod('delivery_food', 'delivery_much', 'Delivery Much', 'url', 'low', ['company', 'local_business'], {
        placeholder: 'link da loja no Delivery Much',
        description: 'Perfil comercial no Delivery Much.',
        requiresApproval: false,
        canBePublic: true,
      }),
      createContactMethod('delivery_food', 'menu_digital', 'Cardápio digital', 'url', 'low', ['company', 'local_business'], {
        placeholder: 'link do cardápio',
        description: 'Cardápio digital próprio ou por plataforma.',
        requiresApproval: false,
        canBePublic: true,
        recommendedForElus: true,
      }),
      createContactMethod('delivery_food', 'menu_pdf', 'Cardápio em PDF', 'file', 'low', ['company', 'local_business'], {
        placeholder: 'arquivo PDF do cardápio',
        description: 'Cardápio em PDF para consulta.',
        requiresApproval: false,
        canBePublic: true,
        recommendedForElus: true,
      }),
      createContactMethod('delivery_food', 'own_order_link', 'Link de pedido próprio', 'url', 'low', ['company', 'local_business'], {
        placeholder: 'link para fazer pedido',
        description: 'Canal próprio de pedido online.',
        requiresApproval: false,
        canBePublic: true,
        recommendedForElus: true,
      }),
      createContactMethod('delivery_food', 'table_reservation', 'Reserva de mesa', 'url', 'medium', ['company', 'local_business'], {
        placeholder: 'link de reserva',
        description: 'Link para reservar mesa.',
        requiresApproval: false,
        canBePublic: true,
        recommendedForElus: true,
      }),
      createContactMethod('delivery_food', 'thefork', 'TheFork', 'url', 'low', ['company', 'local_business'], {
        placeholder: 'link do restaurante no TheFork',
        description: 'Perfil ou reserva pelo TheFork.',
        requiresApproval: false,
        canBePublic: true,
      }),
      createContactMethod('delivery_food', 'restaurant_coupon', 'Cupom de desconto', 'text', 'low', ['company', 'local_business'], {
        placeholder: 'código ou link do cupom',
        description: 'Cupom de desconto para pedidos.',
        requiresApproval: false,
        canBePublic: true,
      }),
      createContactMethod('delivery_food', 'loyalty_club', 'Clube de fidelidade', 'url', 'medium', ['company', 'local_business'], {
        placeholder: 'link do clube de fidelidade',
        description: 'Programa de fidelidade da empresa.',
        requiresApproval: false,
        canBePublic: true,
        recommendedForElus: true,
      }),
    ],
  },
  {
    id: 'mobility_transport',
    title: 'Transporte, mobilidade e viagens',
    description:
      'Canais de transporte, corrida, rota, viagem, frete, motorista, guincho e mobilidade.',
    methods: [
      createContactMethod('mobility_transport', 'uber', 'Uber', 'url', 'medium', ['person', 'professional', 'service_provider', 'company'], {
        placeholder: 'link ou informação de contato relacionada à Uber',
        description: 'Contato, perfil, corrida, empresa ou serviço relacionado à Uber.',
        requiresApproval: true,
        canBePublic: false,
        recommendedForElus: true,
      }),
      createContactMethod('mobility_transport', 'ninety_nine', '99', 'url', 'medium', ['person', 'professional', 'service_provider', 'company'], {
        placeholder: 'link ou informação de contato relacionada à 99',
        description: 'Contato, corrida ou serviço relacionado à 99.',
        requiresApproval: true,
        canBePublic: false,
        recommendedForElus: true,
      }),
      createContactMethod('mobility_transport', 'indrive', 'inDrive', 'url', 'medium', ['person', 'professional', 'service_provider'], {
        placeholder: 'link ou contato relacionado ao inDrive',
        description: 'Contato ou serviço relacionado ao inDrive.',
        requiresApproval: true,
        canBePublic: false,
      }),
      createContactMethod('mobility_transport', 'blablacar', 'BlaBlaCar', 'url', 'medium', ['person', 'professional'], {
        placeholder: 'link do perfil ou viagem',
        description: 'Perfil ou viagem no BlaBlaCar.',
        requiresApproval: true,
        canBePublic: false,
      }),
      createContactMethod('mobility_transport', 'taxi', 'Táxi', 'phone', 'medium', ['professional', 'service_provider', 'company', 'local_business'], {
        placeholder: '+55 00 00000-0000',
        description: 'Contato de táxi ou central de táxi.',
        requiresApproval: true,
        canBePublic: true,
        recommendedForElus: true,
      }),
      createContactMethod('mobility_transport', 'moto_taxi', 'Mototáxi', 'phone', 'medium', ['professional', 'service_provider', 'local_business'], {
        placeholder: '+55 00 00000-0000',
        description: 'Contato de mototáxi.',
        requiresApproval: true,
        canBePublic: true,
        recommendedForElus: true,
      }),
      createContactMethod('mobility_transport', 'private_driver', 'Motorista particular', 'phone', 'high', ['professional', 'service_provider'], {
        placeholder: '+55 00 00000-0000',
        description: 'Contato de motorista particular.',
        requiresApproval: true,
        canBePublic: false,
        recommendedForElus: true,
      }),
      createContactMethod('mobility_transport', 'executive_transport', 'Transporte executivo', 'phone', 'medium', ['professional', 'service_provider', 'company'], {
        placeholder: 'telefone ou link de reserva',
        description: 'Serviço de transporte executivo.',
        requiresApproval: true,
        canBePublic: true,
        recommendedForElus: true,
      }),
      createContactMethod('mobility_transport', 'freight_service', 'Frete', 'phone', 'medium', ['professional', 'service_provider', 'company'], {
        placeholder: 'telefone, WhatsApp ou link',
        description: 'Contato para frete ou transporte de carga.',
        requiresApproval: true,
        canBePublic: true,
        recommendedForElus: true,
      }),
      createContactMethod('mobility_transport', 'tow_truck', 'Guincho', 'phone', 'medium', ['professional', 'service_provider', 'company'], {
        placeholder: 'telefone ou WhatsApp',
        description: 'Contato de serviço de guincho.',
        requiresApproval: true,
        canBePublic: true,
        recommendedForElus: true,
      }),
      createContactMethod('mobility_transport', 'clickbus', 'ClickBus', 'url', 'low', ['company', 'service_provider'], {
        placeholder: 'link de passagem ou empresa',
        description: 'Link de passagem ou empresa na ClickBus.',
        requiresApproval: false,
        canBePublic: true,
      }),
      createContactMethod('mobility_transport', 'buser', 'Buser', 'url', 'low', ['company', 'service_provider'], {
        placeholder: 'link de viagem ou empresa',
        description: 'Link de viagem ou serviço na Buser.',
        requiresApproval: false,
        canBePublic: true,
      }),
      createContactMethod('mobility_transport', 'booking', 'Booking', 'url', 'low', ['company', 'local_business', 'service_provider'], {
        placeholder: 'link do hotel ou hospedagem',
        description: 'Perfil de hospedagem ou reserva no Booking.',
        requiresApproval: false,
        canBePublic: true,
      }),
      createContactMethod('mobility_transport', 'airbnb', 'Airbnb', 'url', 'medium', ['person', 'professional', 'company', 'service_provider'], {
        placeholder: 'link do anúncio ou perfil',
        description: 'Perfil ou anúncio no Airbnb.',
        requiresApproval: true,
        canBePublic: true,
      }),
      createContactMethod('mobility_transport', 'tripadvisor', 'TripAdvisor', 'url', 'low', ['company', 'local_business', 'service_provider'], {
        placeholder: 'link do perfil',
        description: 'Perfil turístico, restaurante ou hospedagem no TripAdvisor.',
        requiresApproval: false,
        canBePublic: true,
      }),
    ],
  },
  {
    id: 'marketplace_store',
    title: 'Marketplaces e lojas',
    description:
      'Canais de venda, loja virtual, catálogo, anúncio, produto, carrinho e compra online.',
    methods: [
      createContactMethod('marketplace_store', 'mercado_livre', 'Mercado Livre', 'url', 'low', ['company', 'local_business', 'professional', 'service_provider'], {
        placeholder: 'link da loja ou produto',
        description: 'Loja, anúncio ou produto no Mercado Livre.',
        requiresApproval: false,
        canBePublic: true,
        recommendedForElus: true,
      }),
      createContactMethod('marketplace_store', 'shopee', 'Shopee', 'url', 'low', ['company', 'local_business', 'professional'], {
        placeholder: 'link da loja ou produto',
        description: 'Loja, anúncio ou produto na Shopee.',
        requiresApproval: false,
        canBePublic: true,
        recommendedForElus: true,
      }),
      createContactMethod('marketplace_store', 'amazon', 'Amazon', 'url', 'low', ['company', 'local_business', 'professional'], {
        placeholder: 'link da loja ou produto',
        description: 'Loja, anúncio ou produto na Amazon.',
        requiresApproval: false,
        canBePublic: true,
        recommendedForElus: true,
      }),
      createContactMethod('marketplace_store', 'olx', 'OLX', 'url', 'medium', ['person', 'professional', 'company', 'local_business'], {
        placeholder: 'link do anúncio ou perfil',
        description: 'Anúncio ou perfil na OLX.',
        requiresApproval: true,
        canBePublic: true,
        recommendedForElus: true,
      }),
      createContactMethod('marketplace_store', 'enjoei', 'Enjoei', 'url', 'medium', ['person', 'professional'], {
        placeholder: 'link da loja ou perfil',
        description: 'Perfil ou loja no Enjoei.',
        requiresApproval: true,
        canBePublic: true,
      }),
      createContactMethod('marketplace_store', 'elo7', 'Elo7', 'url', 'low', ['professional', 'company', 'local_business'], {
        placeholder: 'link da loja',
        description: 'Loja ou produto artesanal no Elo7.',
        requiresApproval: false,
        canBePublic: true,
      }),
      createContactMethod('marketplace_store', 'magalu', 'Magalu', 'url', 'low', ['company', 'local_business'], {
        placeholder: 'link da loja ou produto',
        description: 'Loja, produto ou marketplace Magalu.',
        requiresApproval: false,
        canBePublic: true,
      }),
      createContactMethod('marketplace_store', 'facebook_marketplace', 'Facebook Marketplace', 'url', 'medium', ['person', 'professional', 'company', 'local_business'], {
        placeholder: 'link do anúncio',
        description: 'Anúncio no Facebook Marketplace.',
        requiresApproval: true,
        canBePublic: true,
      }),
      createContactMethod('marketplace_store', 'instagram_shopping', 'Instagram Shopping', 'url', 'low', ['company', 'local_business', 'creator'], {
        placeholder: 'link da loja no Instagram',
        description: 'Loja vinculada ao Instagram.',
        requiresApproval: false,
        canBePublic: true,
        recommendedForElus: true,
      }),
      createContactMethod('marketplace_store', 'shopify', 'Shopify', 'url', 'low', ['company', 'local_business'], {
        placeholder: 'link da loja Shopify',
        description: 'Loja virtual feita com Shopify.',
        requiresApproval: false,
        canBePublic: true,
      }),
      createContactMethod('marketplace_store', 'nuvemshop', 'Nuvemshop', 'url', 'low', ['company', 'local_business'], {
        placeholder: 'link da loja Nuvemshop',
        description: 'Loja virtual feita com Nuvemshop.',
        requiresApproval: false,
        canBePublic: true,
      }),
      createContactMethod('marketplace_store', 'woocommerce', 'WooCommerce', 'url', 'low', ['company', 'local_business'], {
        placeholder: 'link da loja',
        description: 'Loja virtual com WooCommerce.',
        requiresApproval: false,
        canBePublic: true,
      }),
      createContactMethod('marketplace_store', 'product_link', 'Link de produto', 'url', 'low', ['company', 'local_business', 'professional', 'service_provider'], {
        placeholder: 'link do produto',
        description: 'Link direto para um produto específico.',
        requiresApproval: false,
        canBePublic: true,
        recommendedForElus: true,
      }),
      createContactMethod('marketplace_store', 'cart_link', 'Link de carrinho', 'url', 'medium', ['company', 'local_business'], {
        placeholder: 'link do carrinho',
        description: 'Link de carrinho ou pedido pré-configurado.',
        requiresApproval: true,
        canBePublic: false,
      }),
    ],
  },
  {
    id: 'booking_schedule',
    title: 'Agendamento e reuniões',
    description:
      'Links para agendar reunião, consulta, orçamento, visita técnica, aula, mentoria ou atendimento.',
    methods: [
      createContactMethod('booking_schedule', 'calendly', 'Calendly', 'url', 'medium', ['professional', 'company', 'service_provider'], {
        placeholder: 'link do Calendly',
        description: 'Agenda online pelo Calendly.',
        requiresApproval: true,
        canBePublic: true,
        recommendedForElus: true,
      }),
      createContactMethod('booking_schedule', 'google_calendar_booking', 'Agenda Google', 'url', 'medium', ['professional', 'company', 'service_provider'], {
        placeholder: 'link de agendamento',
        description: 'Link de agendamento pelo Google Agenda.',
        requiresApproval: true,
        canBePublic: true,
        recommendedForElus: true,
      }),
      createContactMethod('booking_schedule', 'microsoft_bookings', 'Microsoft Bookings', 'url', 'medium', ['professional', 'company'], {
        placeholder: 'link do Microsoft Bookings',
        description: 'Agendamento pelo Microsoft Bookings.',
        requiresApproval: true,
        canBePublic: true,
      }),
      createContactMethod('booking_schedule', 'google_meet', 'Google Meet', 'url', 'medium', ['person', 'professional', 'company'], {
        placeholder: 'link da reunião',
        description: 'Link de reunião no Google Meet.',
        requiresApproval: true,
        canBePublic: false,
      }),
      createContactMethod('booking_schedule', 'zoom', 'Zoom', 'url', 'medium', ['professional', 'company', 'person'], {
        placeholder: 'link da reunião',
        description: 'Link de reunião no Zoom.',
        requiresApproval: true,
        canBePublic: false,
      }),
      createContactMethod('booking_schedule', 'appointment_link', 'Link de consulta', 'url', 'medium', ['professional', 'service_provider', 'company'], {
        placeholder: 'link para agendar consulta',
        description: 'Link próprio para agendamento de consulta.',
        requiresApproval: true,
        canBePublic: true,
        recommendedForElus: true,
      }),
      createContactMethod('booking_schedule', 'technical_visit_link', 'Link de visita técnica', 'url', 'medium', ['professional', 'service_provider', 'company'], {
        placeholder: 'link para solicitar visita técnica',
        description: 'Agendamento de visita técnica.',
        requiresApproval: true,
        canBePublic: true,
        recommendedForElus: true,
      }),
      createContactMethod('booking_schedule', 'class_trial_link', 'Aula experimental', 'url', 'medium', ['professional', 'service_provider', 'company'], {
        placeholder: 'link para aula experimental',
        description: 'Link para agendar aula experimental.',
        requiresApproval: true,
        canBePublic: true,
        recommendedForElus: true,
      }),
      createContactMethod('booking_schedule', 'mentoring_link', 'Mentoria', 'url', 'medium', ['professional', 'creator', 'service_provider'], {
        placeholder: 'link para agendar mentoria',
        description: 'Link de agendamento para mentoria.',
        requiresApproval: true,
        canBePublic: true,
        recommendedForElus: true,
      }),
    ],
  },
  {
    id: 'location',
    title: 'Localização e endereço',
    description:
      'Endereço, região de atendimento, ponto de referência e rotas. Localização exata deve ser protegida.',
    methods: [
      createContactMethod('location', 'full_address', 'Endereço completo', 'address', 'protected', ['person', 'professional', 'company', 'local_business', 'service_provider'], {
        placeholder: 'Rua, número, bairro, cidade e estado',
        description: 'Endereço completo. Deve ser tratado como dado sensível.',
        requiresApproval: true,
        canBePublic: false,
        recommendedForElus: true,
      }),
      createContactMethod('location', 'business_address', 'Endereço comercial', 'address', 'medium', ['company', 'local_business', 'professional', 'service_provider'], {
        placeholder: 'endereço da empresa',
        description: 'Endereço de loja, escritório, filial ou local de atendimento.',
        requiresApproval: true,
        canBePublic: true,
        recommendedForElus: true,
      }),
      createContactMethod('location', 'approximate_location', 'Localização aproximada', 'address', 'medium', ['person', 'professional', 'public_protected', 'service_provider'], {
        placeholder: 'bairro, cidade ou região',
        description: 'Localização sem expor endereço exato.',
        requiresApproval: false,
        canBePublic: true,
        recommendedForElus: true,
      }),
      createContactMethod('location', 'service_area', 'Região de atendimento', 'text', 'low', ['professional', 'service_provider', 'company', 'local_business'], {
        placeholder: 'cidade, bairro, raio ou região atendida',
        description: 'Área onde o profissional ou empresa atende.',
        requiresApproval: false,
        canBePublic: true,
        recommendedForElus: true,
      }),
      createContactMethod('location', 'google_maps', 'Google Maps', 'url', 'medium', ['company', 'local_business', 'professional', 'service_provider'], {
        placeholder: 'link do Google Maps',
        description: 'Link de localização no Google Maps.',
        requiresApproval: true,
        canBePublic: true,
        recommendedForElus: true,
      }),
      createContactMethod('location', 'waze', 'Waze', 'url', 'medium', ['company', 'local_business', 'professional', 'service_provider'], {
        placeholder: 'link do Waze',
        description: 'Link de rota no Waze.',
        requiresApproval: true,
        canBePublic: true,
        recommendedForElus: true,
      }),
      createContactMethod('location', 'apple_maps', 'Apple Maps', 'url', 'medium', ['company', 'local_business', 'professional'], {
        placeholder: 'link do Apple Maps',
        description: 'Link de localização no Apple Maps.',
        requiresApproval: true,
        canBePublic: true,
      }),
      createContactMethod('location', 'pickup_point', 'Local de retirada', 'address', 'medium', ['company', 'local_business', 'professional'], {
        placeholder: 'local de retirada',
        description: 'Local para retirada de produto ou encomenda.',
        requiresApproval: true,
        canBePublic: true,
        recommendedForElus: true,
      }),
      createContactMethod('location', 'delivery_point', 'Local de entrega', 'address', 'protected', ['person', 'professional', 'company'], {
        placeholder: 'local de entrega',
        description: 'Local de entrega. Deve ser compartilhado apenas quando necessário.',
        requiresApproval: true,
        canBePublic: false,
        recommendedForElus: true,
      }),
      createContactMethod('location', 'reference_point', 'Ponto de referência', 'text', 'medium', ['person', 'professional', 'company', 'local_business'], {
        placeholder: 'próximo a...',
        description: 'Ponto de referência para localização.',
        requiresApproval: true,
        canBePublic: true,
        recommendedForElus: true,
      }),
    ],
  },
  {
    id: 'payment',
    title: 'Pagamento e negociação',
    description:
      'Meios de pagamento, cobrança, assinatura, doação e negociação. Devem ser protegidos conforme o uso.',
    methods: [
      createContactMethod('payment', 'pix', 'Pix', 'pix', 'protected', ['person', 'professional', 'company', 'local_business', 'service_provider'], {
        placeholder: 'chave Pix',
        description: 'Chave Pix. Pode expor CPF, CNPJ, telefone ou e-mail.',
        requiresApproval: true,
        canBePublic: false,
        recommendedForElus: true,
      }),
      createContactMethod('payment', 'pix_qr_code', 'QR Code Pix', 'file', 'protected', ['person', 'professional', 'company', 'local_business'], {
        placeholder: 'imagem ou arquivo do QR Code',
        description: 'QR Code Pix para pagamento.',
        requiresApproval: true,
        canBePublic: false,
        recommendedForElus: true,
      }),
      createContactMethod('payment', 'payment_link', 'Link de pagamento', 'url', 'medium', ['professional', 'company', 'local_business', 'service_provider'], {
        placeholder: 'link de pagamento',
        description: 'Link para pagamento seguro.',
        requiresApproval: true,
        canBePublic: false,
        recommendedForElus: true,
      }),
      createContactMethod('payment', 'mercado_pago', 'Mercado Pago', 'url', 'medium', ['person', 'professional', 'company', 'local_business'], {
        placeholder: 'link do Mercado Pago',
        description: 'Link ou perfil de pagamento pelo Mercado Pago.',
        requiresApproval: true,
        canBePublic: false,
        recommendedForElus: true,
      }),
      createContactMethod('payment', 'pagseguro', 'PagSeguro', 'url', 'medium', ['professional', 'company', 'local_business'], {
        placeholder: 'link do PagSeguro',
        description: 'Link ou cobrança pelo PagSeguro.',
        requiresApproval: true,
        canBePublic: false,
      }),
      createContactMethod('payment', 'paypal', 'PayPal', 'url', 'medium', ['person', 'professional', 'company', 'creator'], {
        placeholder: 'link do PayPal',
        description: 'Link de pagamento pelo PayPal.',
        requiresApproval: true,
        canBePublic: false,
      }),
      createContactMethod('payment', 'picpay', 'PicPay', 'url', 'medium', ['person', 'professional', 'company'], {
        placeholder: 'link ou usuário PicPay',
        description: 'Contato ou link de pagamento pelo PicPay.',
        requiresApproval: true,
        canBePublic: false,
      }),
      createContactMethod('payment', 'stripe', 'Stripe', 'url', 'medium', ['professional', 'company'], {
        placeholder: 'link de pagamento Stripe',
        description: 'Link de pagamento pela Stripe.',
        requiresApproval: true,
        canBePublic: false,
      }),
      createContactMethod('payment', 'boleto_link', 'Link de boleto', 'url', 'protected', ['professional', 'company', 'local_business'], {
        placeholder: 'link do boleto',
        description: 'Link de boleto ou cobrança.',
        requiresApproval: true,
        canBePublic: false,
      }),
      createContactMethod('payment', 'donation_link', 'Link de doação', 'url', 'medium', ['person', 'creator', 'company'], {
        placeholder: 'link para doação',
        description: 'Link para receber doações.',
        requiresApproval: true,
        canBePublic: true,
      }),
      createContactMethod('payment', 'patreon', 'Patreon', 'url', 'low', ['creator'], {
        placeholder: 'link do Patreon',
        description: 'Página de apoio no Patreon.',
        requiresApproval: false,
        canBePublic: true,
      }),
      createContactMethod('payment', 'apoia_se', 'Apoia.se', 'url', 'low', ['creator'], {
        placeholder: 'link do Apoia.se',
        description: 'Página de apoio no Apoia.se.',
        requiresApproval: false,
        canBePublic: true,
      }),
    ],
  },
  {
    id: 'content_creator',
    title: 'Conteúdo, blog, vlog e criadores',
    description:
      'Canais de conteúdo, criação, imprensa, mídia, blog, vlog, podcast, newsletter e contratação.',
    methods: [
      createContactMethod('content_creator', 'blog', 'Blog', 'url', 'low', ['person', 'professional', 'company', 'creator'], {
        placeholder: 'https://blog.com',
        description: 'Blog pessoal, profissional ou empresarial.',
        requiresApproval: false,
        canBePublic: true,
        recommendedForElus: true,
      }),
      createContactMethod('content_creator', 'vlog', 'Vlog', 'url', 'low', ['person', 'creator', 'company'], {
        placeholder: 'link do vlog',
        description: 'Canal ou página de vlog.',
        requiresApproval: false,
        canBePublic: true,
        recommendedForElus: true,
      }),
      createContactMethod('content_creator', 'podcast', 'Podcast', 'url', 'low', ['person', 'creator', 'company'], {
        placeholder: 'link do podcast',
        description: 'Podcast próprio ou institucional.',
        requiresApproval: false,
        canBePublic: true,
        recommendedForElus: true,
      }),
      createContactMethod('content_creator', 'spotify_podcast', 'Spotify Podcast', 'url', 'low', ['creator', 'company'], {
        placeholder: 'link no Spotify',
        description: 'Podcast no Spotify.',
        requiresApproval: false,
        canBePublic: true,
      }),
      createContactMethod('content_creator', 'apple_podcasts', 'Apple Podcasts', 'url', 'low', ['creator', 'company'], {
        placeholder: 'link no Apple Podcasts',
        description: 'Podcast no Apple Podcasts.',
        requiresApproval: false,
        canBePublic: true,
      }),
      createContactMethod('content_creator', 'newsletter', 'Newsletter', 'url', 'low', ['person', 'creator', 'company', 'professional'], {
        placeholder: 'link da newsletter',
        description: 'Newsletter própria ou por plataforma.',
        requiresApproval: false,
        canBePublic: true,
        recommendedForElus: true,
      }),
      createContactMethod('content_creator', 'substack', 'Substack', 'url', 'low', ['creator', 'professional'], {
        placeholder: 'link do Substack',
        description: 'Newsletter ou blog no Substack.',
        requiresApproval: false,
        canBePublic: true,
      }),
      createContactMethod('content_creator', 'medium', 'Medium', 'url', 'low', ['person', 'creator', 'professional'], {
        placeholder: 'link do Medium',
        description: 'Perfil ou publicação no Medium.',
        requiresApproval: false,
        canBePublic: true,
      }),
      createContactMethod('content_creator', 'press_kit', 'Press kit', 'file', 'medium', ['creator', 'company', 'public_protected'], {
        placeholder: 'arquivo ou link do press kit',
        description: 'Material de imprensa ou apresentação pública.',
        requiresApproval: true,
        canBePublic: true,
      }),
      createContactMethod('content_creator', 'media_kit', 'Media kit', 'file', 'medium', ['creator', 'company', 'public_protected'], {
        placeholder: 'arquivo ou link do media kit',
        description: 'Material comercial para criadores, marcas ou pessoas públicas.',
        requiresApproval: true,
        canBePublic: true,
        recommendedForElus: true,
      }),
    ],
  },
  {
    id: 'community',
    title: 'Comunidade e grupos',
    description:
      'Canais de comunidade, grupos, fóruns, eventos e espaços coletivos.',
    methods: [
      createContactMethod('community', 'whatsapp_group', 'Grupo de WhatsApp', 'url', 'medium', ['person', 'professional', 'company', 'local_business', 'community'], {
        placeholder: 'link do grupo',
        description: 'Grupo de WhatsApp.',
        requiresApproval: true,
        canBePublic: false,
        recommendedForElus: true,
      }),
      createContactMethod('community', 'telegram_group', 'Grupo de Telegram', 'url', 'medium', ['person', 'professional', 'company', 'community'], {
        placeholder: 'link do grupo',
        description: 'Grupo ou canal no Telegram.',
        requiresApproval: true,
        canBePublic: true,
        recommendedForElus: true,
      }),
      createContactMethod('community', 'discord_server', 'Servidor Discord', 'url', 'medium', ['creator', 'community', 'professional', 'company'], {
        placeholder: 'link do servidor',
        description: 'Servidor Discord de comunidade.',
        requiresApproval: true,
        canBePublic: true,
        recommendedForElus: true,
      }),
      createContactMethod('community', 'facebook_group', 'Grupo do Facebook', 'url', 'medium', ['person', 'company', 'local_business', 'community'], {
        placeholder: 'link do grupo',
        description: 'Grupo no Facebook.',
        requiresApproval: true,
        canBePublic: true,
      }),
      createContactMethod('community', 'event_link', 'Link de evento', 'url', 'low', ['person', 'professional', 'company', 'local_business', 'community'], {
        placeholder: 'link do evento',
        description: 'Evento, encontro, palestra, curso ou reunião pública.',
        requiresApproval: false,
        canBePublic: true,
        recommendedForElus: true,
      }),
      createContactMethod('community', 'meetup', 'Meetup', 'url', 'low', ['person', 'professional', 'community'], {
        placeholder: 'link do Meetup',
        description: 'Perfil ou evento no Meetup.',
        requiresApproval: false,
        canBePublic: true,
      }),
    ],
  },
  {
    id: 'documents_credentials',
    title: 'Documentos e credenciais',
    description:
      'Documentos, certificados, licenças, registros profissionais e comprovações. Devem ser protegidos.',
    methods: [
      createContactMethod('documents_credentials', 'identity_document', 'Documento de identidade', 'document', 'protected', ['person', 'professional'], {
        placeholder: 'RG, CIN, CNH ou passaporte',
        description: 'Documento oficial com foto para validação de identidade.',
        requiresApproval: true,
        canBePublic: false,
        recommendedForElus: true,
      }),
      createContactMethod('documents_credentials', 'cnpj', 'CNPJ', 'document', 'protected', ['company', 'local_business'], {
        placeholder: '00.000.000/0000-00',
        description: 'CNPJ da empresa.',
        requiresApproval: true,
        canBePublic: false,
        recommendedForElus: true,
      }),
      createContactMethod('documents_credentials', 'cpf', 'CPF', 'document', 'protected', ['person', 'professional'], {
        placeholder: '000.000.000-00',
        description: 'CPF do usuário. Deve ser protegido.',
        requiresApproval: true,
        canBePublic: false,
      }),
      createContactMethod('documents_credentials', 'professional_license', 'Registro profissional', 'document', 'protected', ['professional', 'service_provider'], {
        placeholder: 'CREA, CAU, CRM, OAB, CRC, etc.',
        description: 'Registro ou licença profissional.',
        requiresApproval: true,
        canBePublic: false,
        recommendedForElus: true,
      }),
      createContactMethod('documents_credentials', 'certificate', 'Certificado', 'file', 'medium', ['person', 'professional', 'company'], {
        placeholder: 'arquivo ou link do certificado',
        description: 'Certificado profissional, técnico ou institucional.',
        requiresApproval: true,
        canBePublic: true,
        recommendedForElus: true,
      }),
      createContactMethod('documents_credentials', 'proof_of_address', 'Comprovante de endereço', 'file', 'protected', ['person', 'professional', 'company'], {
        placeholder: 'arquivo do comprovante',
        description: 'Comprovante de endereço. Deve ser protegido.',
        requiresApproval: true,
        canBePublic: false,
      }),
      createContactMethod('documents_credentials', 'company_contract', 'Contrato social', 'file', 'protected', ['company', 'local_business'], {
        placeholder: 'arquivo do contrato social',
        description: 'Contrato social ou documento empresarial.',
        requiresApproval: true,
        canBePublic: false,
        recommendedForElus: true,
      }),
    ],
  },
  {
    id: 'institutional',
    title: 'Institucional e oficial',
    description:
      'Canais oficiais, órgãos, instituições, imprensa, representantes e atendimento institucional.',
    methods: [
      createContactMethod('institutional', 'official_contact', 'Contato oficial', 'text', 'medium', ['company', 'public_protected', 'professional'], {
        placeholder: 'telefone, e-mail ou link oficial',
        description: 'Contato oficial de pessoa pública, instituição ou empresa.',
        requiresApproval: true,
        canBePublic: true,
        recommendedForElus: true,
      }),
      createContactMethod('institutional', 'authorized_representative', 'Representante autorizado', 'text', 'protected', ['public_protected', 'company'], {
        placeholder: 'nome, função e contato do representante',
        description: 'Representante autorizado para gerenciar ou intermediar contato.',
        requiresApproval: true,
        canBePublic: false,
        recommendedForElus: true,
      }),
      createContactMethod('institutional', 'press_contact', 'Contato de imprensa', 'email', 'medium', ['company', 'public_protected', 'creator'], {
        placeholder: 'imprensa@exemplo.com',
        description: 'Contato para imprensa, mídia ou assessoria.',
        requiresApproval: true,
        canBePublic: true,
        recommendedForElus: true,
      }),
      createContactMethod('institutional', 'agency_contact', 'Agência ou assessoria', 'text', 'medium', ['public_protected', 'creator', 'company'], {
        placeholder: 'nome, telefone, e-mail ou link',
        description: 'Contato de agência, assessoria ou equipe responsável.',
        requiresApproval: true,
        canBePublic: true,
        recommendedForElus: true,
      }),
      createContactMethod('institutional', 'public_service_channel', 'Canal de atendimento público', 'url', 'low', ['company', 'local_business'], {
        placeholder: 'link do canal oficial',
        description: 'Canal público de atendimento institucional.',
        requiresApproval: false,
        canBePublic: true,
      }),
      createContactMethod('institutional', 'ombudsman_public', 'Ouvidoria institucional', 'url', 'low', ['company'], {
        placeholder: 'link da ouvidoria',
        description: 'Ouvidoria institucional ou pública.',
        requiresApproval: false,
        canBePublic: true,
      }),
    ],
  },
  {
    id: 'custom',
    title: 'Personalizado',
    description:
      'Campo livre para métodos de contato não previstos nas categorias anteriores.',
    methods: [
      createContactMethod('custom', 'custom_contact', 'Outro contato', 'custom', 'medium', ['person', 'professional', 'company', 'local_business', 'public_protected', 'creator', 'community', 'service_provider'], {
        placeholder: 'descreva o contato',
        description: 'Método de contato personalizado.',
        requiresApproval: true,
        canBePublic: false,
        recommendedForElus: true,
      }),
    ],
  },
];

export const CONTACT_METHODS: ContactMethod[] = CONTACT_METHOD_CATEGORIES.reduce<ContactMethod[]>(
  (allMethods, category) => {
    return [...allMethods, ...category.methods];
  },
  []
);

export function getContactMethodById(methodId: string) {
  return CONTACT_METHODS.find((method) => method.id === methodId);
}

export function getContactMethodsByCategory(categoryId: ContactMethodCategoryId) {
  return CONTACT_METHODS.filter((method) => method.categoryId === categoryId);
}

export function getRecommendedContactMethods() {
  return CONTACT_METHODS.filter((method) => method.recommendedForElus);
}

export function getProtectedContactMethods() {
  return CONTACT_METHODS.filter(
    (method) => method.sensitivity === 'high' || method.sensitivity === 'protected'
  );
}

export function getPublicContactMethods() {
  return CONTACT_METHODS.filter((method) => method.canBePublic);
}

export function getContactMethodsForAudience(audience: ContactMethodAudience) {
  return CONTACT_METHODS.filter((method) => method.audiences.includes(audience));
}