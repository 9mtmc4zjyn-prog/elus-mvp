// frontend/src/theme/theme.ts
//
// Fonte única de verdade das cores do app ELUS.
// Três modos disponíveis:
//   - hybrid   (padrão): base grafite/discreta (design_guidelines.json) +
//               acentos vibrantes pontuais só em status de verificação e no
//               Campo de Presença (radar).
//   - monoDark: monocromático, fundo preto, sem matiz (só preto/branco/cinza).
//   - monoLight: monocromático, fundo branco, sem matiz.
//
// Este arquivo só DEFINE as paletas. Nenhuma tela consome isso ainda —
// a migração das telas é uma etapa separada e será feita uma a uma.

export type ThemeMode = 'hybrid' | 'monoDark' | 'monoLight';

export interface ThemeColors {
  mode: ThemeMode;

  // Fundo e superfícies
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceSoft: string;

  // Bordas
  border: string;
  borderStrong: string;

  // Texto
  text: string;
  textMuted: string;
  textSoft: string;

  // Acento primário (botões, links, ação principal)
  accent: string;
  accentSoft: string;

  // Acentos vibrantes de uso pontual (radar / Campo de Presença, categorias)
  cyanVivid: string;
  purpleVivid: string;
  goldVivid: string;

  // Estados de verificação
  success: string;
  warning: string;
  danger: string;

  disabledBackground: string;
  disabledText: string;

  chipHighlightBorder: string;
  chipHighlightBackground: string;
}

const hybrid: ThemeColors = {
  mode: 'hybrid',

  background: '#0B101A',
  surface: '#141A26',
  surfaceElevated: '#1C2433',
  surfaceSoft: 'rgba(255,255,255,0.045)',

  border: 'rgba(255,255,255,0.10)',
  borderStrong: 'rgba(255,255,255,0.18)',

  text: '#EDEDED',
  textMuted: '#A1A9B8',
  textSoft: '#6B7280',

  accent: '#5E9EAB',
  accentSoft: 'rgba(94,158,171,0.15)',

  cyanVivid: '#22D3EE',
  purpleVivid: '#A855F7',
  goldVivid: '#D9B46A',

  success: '#4A9A65',
  warning: '#C49A45',
  danger: '#B85C5C',

  disabledBackground: 'rgba(255,255,255,0.13)',
  disabledText: 'rgba(255,255,255,0.42)',

  chipHighlightBorder: 'rgba(38,217,255,0.42)',
  chipHighlightBackground: 'rgba(38,217,255,0.10)',
};

const monoDark: ThemeColors = {
  mode: 'monoDark',

  background: '#000000',
  surface: '#121212',
  surfaceElevated: '#1C1C1C',
  surfaceSoft: 'rgba(255,255,255,0.05)',

  border: 'rgba(255,255,255,0.12)',
  borderStrong: 'rgba(255,255,255,0.22)',

  text: '#FFFFFF',
  textMuted: '#B3B3B3',
  textSoft: '#7A7A7A',

  accent: '#FFFFFF',
  accentSoft: 'rgba(255,255,255,0.12)',

  cyanVivid: '#E5E5E5',
  purpleVivid: '#CFCFCF',
  goldVivid: '#D9D9D9',

  success: '#FFFFFF',
  warning: '#BFBFBF',
  danger: '#8A8A8A',

  disabledBackground: 'rgba(255,255,255,0.16)',
  disabledText: 'rgba(255,255,255,0.45)',

  chipHighlightBorder: 'rgba(255,255,255,0.42)',
  chipHighlightBackground: 'rgba(255,255,255,0.10)',
};

const monoLight: ThemeColors = {
  mode: 'monoLight',

  background: '#FFFFFF',
  surface: '#F5F5F5',
  surfaceElevated: '#EDEDED',
  surfaceSoft: 'rgba(0,0,0,0.04)',

  border: 'rgba(0,0,0,0.10)',
  borderStrong: 'rgba(0,0,0,0.18)',

  text: '#0A0A0A',
  textMuted: '#5C5C5C',
  textSoft: '#8A8A8A',

  accent: '#0A0A0A',
  accentSoft: 'rgba(0,0,0,0.08)',

  cyanVivid: '#3A3A3A',
  purpleVivid: '#4A4A4A',
  goldVivid: '#2E2E2E',

  success: '#1A1A1A',
  warning: '#4A4A4A',
  danger: '#6E6E6E',

  disabledBackground: 'rgba(0,0,0,0.13)',
  disabledText: 'rgba(0,0,0,0.42)',

  chipHighlightBorder: 'rgba(0,0,0,0.42)',
  chipHighlightBackground: 'rgba(0,0,0,0.10)',
};

export const THEMES: Record<ThemeMode, ThemeColors> = {
  hybrid,
  monoDark,
  monoLight,
};

export const DEFAULT_THEME_MODE: ThemeMode = 'hybrid';
