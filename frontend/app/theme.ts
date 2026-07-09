// frontend/app/theme.ts

// ============================================================
// ELUS THEME
// Régua visual central do app
// ============================================================
// Este arquivo centraliza cores, espaçamentos, bordas,
// tipografia e estados de verificação.
//
// Importante:
// - Não altera regra de negócio sozinho.
// - Serve como base visual premium, escura, humana e tecnológica.
// - Mantém compatibilidade com arquivos antigos que usam nomes
//   como colors.company, colors.friend, colors.assisted etc.
// ============================================================

export type VerificationStatus =
  | 'verified'
  | 'in_review'
  | 'pending'
  | 'unverified';

export type RelationshipColorKey =
  | 'family'
  | 'professional'
  | 'interest'
  | 'preference'
  | 'service'
  | 'friendship'
  | 'support'
  | 'company'
  | 'friend'
  | 'assisted'
  | 'common';

export const colors = {
  // Base
  bg: '#05070D',
  background: '#05070D',
  backgroundDeep: '#03040A',

  surface: '#0B1020',
  surfaceSoft: '#10182A',
  surfaceDeep: '#080C16',
  surfaceLight: '#151B2E',

  card: '#0B1020',
  cardSoft: '#10182A',
  cardDeep: '#080C16',

  header: '#060910',
  tabbar: '#060910',

  // Texto
  white: '#FFFFFF',
  text: '#F5F7FB',
  textPrimary: '#F5F7FB',
  textStrong: '#FFFFFF',
  textMuted: '#8D98AA',
  muted: '#8D98AA',
  mutedSoft: '#BAC2D0',
  textSoft: '#BAC2D0',
  textTertiary: '#8D98AA',
  disabled: 'rgba(186,194,208,0.45)',

  // Bordas
  border: 'rgba(255,255,255,0.08)',
  borderSoft: 'rgba(255,255,255,0.06)',
  borderStrong: 'rgba(255,255,255,0.14)',

  // Marca / tecnologia
  cyan: '#26D9FF',
  cyanSoft: 'rgba(38,217,255,0.10)',
  cyanBorder: 'rgba(38,217,255,0.42)',

  blue: '#316BFF',
  blueLight: '#9DBBFF',
  blueSoft: 'rgba(49,107,255,0.14)',
  blueLightSoft: 'rgba(157,187,255,0.12)',
  blueLightBorder: 'rgba(157,187,255,0.34)',

  purple: '#8B5CFF',
  purpleSoft: 'rgba(139,92,255,0.12)',
  purpleBorder: 'rgba(139,92,255,0.28)',

  // Premium
  gold: '#F2A93B',
  goldStrong: '#D4A843',
  goldSoft: 'rgba(242,169,59,0.12)',
  goldBorder: 'rgba(242,169,59,0.34)',
  goldDark: '#1A1200',

  // Status positivos
  green: '#31D6A3',
  greenSoft: 'rgba(49,214,163,0.12)',
  greenBorder: 'rgba(49,214,163,0.34)',

  // Status de risco / pendente
  danger: '#EF4444',
  dangerLight: '#FF6B6B',
  dangerSoft: 'rgba(239,68,68,0.12)',
  dangerBorder: 'rgba(239,68,68,0.34)',
  red: '#EF4444',
  redSoft: 'rgba(239,68,68,0.12)',

  // Vidro / sobreposição
  overlay: 'rgba(0,0,0,0.45)',
  blackGlass: 'rgba(3,4,10,0.84)',
  cardGlass: 'rgba(12,15,27,0.94)',
  whiteGlass: 'rgba(255,255,255,0.045)',

  // Botões principais
  primary: '#316BFF',
  accent: '#26D9FF',

  // Compatibilidade com AppContext e telas antigas
  family: '#316BFF',
  professional: '#D4A843',
  company: '#D4A843',
  interest: '#2DD4BF',
  preference: '#8B5CFF',
  service: '#A8C4DA',
  friendship: '#94A3B8',
  friend: '#94A3B8',
  support: '#F59E0B',
  assisted: '#9DBBFF',
  common: '#26D9FF',
  silver: '#C0C7D2',
} as const;

export const statusColors = {
  verified: {
    main: colors.green,
    soft: colors.greenSoft,
    border: colors.greenBorder,
    label: 'Verificação concluída',
    shortLabel: 'Verificado',
  },

  in_review: {
    main: colors.blueLight,
    soft: colors.blueLightSoft,
    border: colors.blueLightBorder,
    label: 'Aguardando verificação',
    shortLabel: 'Em análise',
  },

  pending: {
    main: colors.danger,
    soft: colors.dangerSoft,
    border: colors.dangerBorder,
    label: 'Verificação pendente',
    shortLabel: 'Pendente',
  },

  unverified: {
    main: colors.danger,
    soft: colors.dangerSoft,
    border: colors.dangerBorder,
    label: 'Verificação pendente',
    shortLabel: 'Não verificado',
  },
} as const;

export const relationshipColors: Record<RelationshipColorKey, string> = {
  family: colors.family,
  professional: colors.professional,
  interest: colors.interest,
  preference: colors.preference,
  service: colors.service,
  friendship: colors.friendship,
  support: colors.support,

  // Aliases antigos usados em algumas telas/regras
  company: colors.company,
  friend: colors.friend,
  assisted: colors.assisted,
  common: colors.common,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  xxl: 34,
  pill: 999,
} as const;

export const typography = {
  title: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '900',
  },

  subtitle: {
    fontSize: 18,
    lineHeight: 25,
    fontWeight: '700',
  },

  body: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },

  bodyStrong: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '800',
  },

  caption: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '700',
  },

  kicker: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '900',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
} as const;

export function transparentColor(hex: string, opacity: number) {
  const normalizedHex = hex.replace('#', '');

  if (normalizedHex.length !== 6) {
    return hex;
  }

  const red = parseInt(normalizedHex.slice(0, 2), 16);
  const green = parseInt(normalizedHex.slice(2, 4), 16);
  const blue = parseInt(normalizedHex.slice(4, 6), 16);

  return `rgba(${red},${green},${blue},${opacity})`;
}

export const theme = {
  colors,
  statusColors,
  relationshipColors,
  spacing,
  radius,
  typography,
  transparentColor,
} as const;

export default theme;
