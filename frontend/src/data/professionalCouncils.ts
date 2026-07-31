// =============================================================
// ELUS — Catálogo de conselhos profissionais
// Decisão de 19/07/2026 (pendência 5.2 do documento oficial v1):
// TODAS as categorias com conselho consultável são aceitas na
// verificação de registro profissional (Fase 3).
//
// Método: verificação ASSISTIDA no lançamento — o profissional
// informa nome + número de registro e a equipe confere na
// consulta pública do conselho. Automação por API (ex.:
// Infosimples cobre CFM, CFC, CRO e outros) entra por conselho,
// conforme o volume justificar.
//
// lookupStatus:
//   'verified'   — consulta pública conferida em 19/07/2026.
//   'to_confirm' — portal conhecido, conferir antes de ativar.
// =============================================================

export type CouncilLookupScope = 'national' | 'by_state';

export type CouncilLookupStatus = 'verified' | 'to_confirm';

export type ProfessionalCouncil = {
  /** Sigla do conselho regional (o que o usuário conhece). */
  id: string;
  /** Nome do órgão federal responsável pela consulta. */
  federalBody: string;
  /** Profissão regulamentada. */
  profession: string;
  /** URL da consulta pública. */
  lookupUrl: string;
  /** Abrangência da consulta. */
  lookupScope: CouncilLookupScope;
  /** Consulta exige login? (todas as ativas devem ser públicas) */
  requiresLogin: boolean;
  /** Situação da conferência da consulta. */
  lookupStatus: CouncilLookupStatus;
  /** Existe API comercial conhecida (ex.: Infosimples)? */
  hasKnownApi: boolean;
  /** Observações operacionais para a equipe de verificação. */
  notes?: string;
};

export const PROFESSIONAL_COUNCILS: ProfessionalCouncil[] = [
  {
    id: 'CRP',
    federalBody: 'CFP — Conselho Federal de Psicologia',
    profession: 'Psicólogo(a)',
    lookupUrl: 'https://cadastro.cfp.org.br/',
    lookupScope: 'national',
    requiresLogin: false,
    lookupStatus: 'verified',
    hasKnownApi: true,
    notes: 'Busca por nome, CRP ou CPF. Retorna status (ativo/cancelado/transferido), região e data de registro. API comercial disponível (Infosimples — Conselho Federal de Psicologia / Cadastro).',
  },
  {
    id: 'CRM',
    federalBody: 'CFM — Conselho Federal de Medicina',
    profession: 'Médico(a)',
    lookupUrl: 'https://portal.cfm.org.br/busca-medicos/',
    lookupScope: 'national',
    requiresLogin: false,
    lookupStatus: 'verified',
    hasKnownApi: true,
    notes: 'Retorna foto, CRM, situação e especialidade. CFM tem webservice oficial de lista de médicos. Atenção às regras do CFM sobre divulgação médica no perfil.',
  },
  {
    id: 'CREF',
    federalBody: 'CONFEF — Conselho Federal de Educação Física',
    profession: 'Profissional de educação física',
    lookupUrl: 'https://www.confef.org.br/registrados/',
    lookupScope: 'national',
    requiresLogin: false,
    lookupStatus: 'verified',
    hasKnownApi: false,
    notes: 'Busca por nome ou número. Retorna categoria e formação.',
  },
  {
    id: 'OAB',
    federalBody: 'OAB — Conselho Federal da Ordem dos Advogados do Brasil',
    profession: 'Advogado(a)',
    lookupUrl: 'https://cna.oab.org.br/',
    lookupScope: 'national',
    requiresLogin: false,
    lookupStatus: 'verified',
    hasKnownApi: false,
    notes: 'Cadastro Nacional dos Advogados. Busca por nome, seccional, número e tipo de inscrição. Consulta tem captcha (irrelevante no método assistido).',
  },
  {
    id: 'CRC',
    federalBody: 'CFC — Conselho Federal de Contabilidade',
    profession: 'Contador(a) / técnico em contabilidade',
    lookupUrl: 'https://www3.cfc.org.br/spw/consultacadastral/',
    lookupScope: 'national',
    requiresLogin: false,
    lookupStatus: 'verified',
    hasKnownApi: true,
    notes: 'Cadastro nacional de profissionais e organizações contábeis. API comercial disponível (Infosimples).',
  },
  {
    id: 'CRO',
    federalBody: 'CFO — Conselho Federal de Odontologia',
    profession: 'Dentista',
    lookupUrl: 'https://website.cfo.org.br/',
    lookupScope: 'by_state',
    requiresLogin: false,
    lookupStatus: 'to_confirm',
    hasKnownApi: true,
    notes: 'Consulta fragmentada por regional. APIs comerciais por UF (Infosimples).',
  },
  {
    id: 'COREN',
    federalBody: 'COFEN — Conselho Federal de Enfermagem',
    profession: 'Enfermeiro(a) / técnico de enfermagem',
    lookupUrl: 'https://consulta.cofen.gov.br/',
    lookupScope: 'national',
    requiresLogin: false,
    lookupStatus: 'to_confirm',
    hasKnownApi: false,
  },
  {
    id: 'CREA',
    federalBody: 'CONFEA — Conselho Federal de Engenharia e Agronomia',
    profession: 'Engenheiro(a) / agrônomo(a)',
    lookupUrl: 'https://www.confea.org.br/',
    lookupScope: 'by_state',
    requiresLogin: false,
    lookupStatus: 'to_confirm',
    hasKnownApi: false,
    notes: 'Consulta fragmentada por regional — conferir caminho por CREA estadual.',
  },
  {
    id: 'CAU',
    federalBody: 'CAU/BR — Conselho de Arquitetura e Urbanismo',
    profession: 'Arquiteto(a) e urbanista',
    lookupUrl: 'https://www.caubr.gov.br/',
    lookupScope: 'national',
    requiresLogin: false,
    lookupStatus: 'to_confirm',
    hasKnownApi: false,
  },
  {
    id: 'CRMV',
    federalBody: 'CFMV — Conselho Federal de Medicina Veterinária',
    profession: 'Médico(a) veterinário(a)',
    lookupUrl: 'https://www.cfmv.gov.br/',
    lookupScope: 'national',
    requiresLogin: false,
    lookupStatus: 'to_confirm',
    hasKnownApi: true,
    notes: 'API comercial disponível (Infosimples — Conselho Federal de Medicina Veterinária / Cadastro).',
  },
  {
    id: 'CRF',
    federalBody: 'CFF — Conselho Federal de Farmácia',
    profession: 'Farmacêutico(a)',
    lookupUrl: 'https://www.cff.org.br/',
    lookupScope: 'by_state',
    requiresLogin: false,
    lookupStatus: 'to_confirm',
    hasKnownApi: true,
    notes: 'API comercial disponível (Infosimples — Conselho Federal de Farmácia / Cadastro, com regionais como CRF/SP e CRF/GO).',
  },
  {
    id: 'CRN',
    federalBody: 'CFN — Conselho Federal de Nutricionistas',
    profession: 'Nutricionista',
    lookupUrl: 'https://www.cfn.org.br/',
    lookupScope: 'by_state',
    requiresLogin: false,
    lookupStatus: 'to_confirm',
    hasKnownApi: false,
  },
  {
    id: 'CREFITO',
    federalBody: 'COFFITO — Conselho Federal de Fisioterapia e Terapia Ocupacional',
    profession: 'Fisioterapeuta / terapeuta ocupacional',
    lookupUrl: 'https://www.coffito.gov.br/',
    lookupScope: 'by_state',
    requiresLogin: false,
    lookupStatus: 'to_confirm',
    hasKnownApi: false,
  },
  {
    id: 'CRECI',
    federalBody: 'COFECI — Conselho Federal de Corretores de Imóveis',
    profession: 'Corretor(a) de imóveis',
    lookupUrl: 'https://www.cofeci.gov.br/',
    lookupScope: 'by_state',
    requiresLogin: false,
    lookupStatus: 'to_confirm',
    hasKnownApi: false,
  },
  {
    id: 'CRA',
    federalBody: 'CFA — Conselho Federal de Administração',
    profession: 'Administrador(a)',
    lookupUrl: 'https://cfa.org.br/',
    lookupScope: 'by_state',
    requiresLogin: false,
    lookupStatus: 'to_confirm',
    hasKnownApi: false,
  },
];

// -------------------------------------------------------------
// Helpers
// -------------------------------------------------------------

export function getCouncilById(id: string): ProfessionalCouncil | undefined {
  const normalized = id.trim().toUpperCase();
  return PROFESSIONAL_COUNCILS.find(council => council.id === normalized);
}

/** Conselhos prontos para ativação imediata (consulta conferida). */
export function getVerifiedCouncils(): ProfessionalCouncil[] {
  return PROFESSIONAL_COUNCILS.filter(
    council => council.lookupStatus === 'verified',
  );
}

/** Conselhos que precisam de conferência da consulta antes de ativar. */
export function getCouncilsToConfirm(): ProfessionalCouncil[] {
  return PROFESSIONAL_COUNCILS.filter(
    council => council.lookupStatus === 'to_confirm',
  );
}
