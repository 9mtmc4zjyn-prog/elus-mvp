/**
 * frontend/src/utils/layers.ts
 *
 * Camadas de informações do perfil no ELUS.
 *
 * Este arquivo não depende do AppContext.
 * Ele define quais campos pertencem a cada camada de exposição:
 * pública, inicial, relacional e privada.
 */

export type LayerKey = 'public' | 'initial' | 'relational' | 'private';

export type EntityKind =
  | 'person'
  | 'pessoa'
  | 'Pessoa'
  | 'business'
  | 'empresa'
  | 'Empresa'
  | 'service'
  | 'servico'
  | 'serviço'
  | 'Servico'
  | 'Serviço'
  | 'community'
  | 'grupo'
  | 'Grupo'
  | 'family'
  | 'common'
  | 'interest'
  | 'preference'
  | 'assisted'
  | string;

export interface LayerConfig {
  key: LayerKey;
  title: string;
  subtitle: string;
  fieldsPerson: string[];
  fieldsBusiness: string[];
}

function normalizeKind(kind: EntityKind): string {
  return String(kind || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function isBusinessLike(kind: EntityKind): boolean {
  const normalizedKind = normalizeKind(kind);

  return (
    normalizedKind === 'business' ||
    normalizedKind === 'empresa' ||
    normalizedKind === 'service' ||
    normalizedKind === 'servico' ||
    normalizedKind === 'serviço' ||
    normalizedKind === 'community' ||
    normalizedKind === 'grupo'
  );
}

export const LAYERS: LayerConfig[] = [
  {
    key: 'public',
    title: 'Presença pública',
    subtitle: 'Visível para todos',
    fieldsPerson: [],
    fieldsBusiness: [],
  },
  {
    key: 'initial',
    title: 'Informações iniciais',
    subtitle: 'Contexto e essência',
    fieldsPerson: ['city', 'profession', 'interests', 'skills', 'bio'],
    fieldsBusiness: ['category', 'services', 'products', 'location'],
  },
  {
    key: 'relational',
    title: 'Informações relacionais',
    subtitle: 'Trajetória e referências',
    fieldsPerson: ['cv', 'instagram', 'linkedin'],
    fieldsBusiness: ['description', 'portfolio', 'links'],
  },
  {
    key: 'private',
    title: 'Informações privadas',
    subtitle: 'Contato direto',
    fieldsPerson: ['whatsapp', 'email'],
    fieldsBusiness: ['whatsapp', 'email'],
  },
];

export function fieldsForLayer(layer: LayerKey, kind: EntityKind): string[] {
  const config = LAYERS.find((item) => item.key === layer);

  if (!config) {
    return [];
  }

  return isBusinessLike(kind) ? config.fieldsBusiness : config.fieldsPerson;
}

export function allRequestableFields(
  kind: EntityKind
): { layer: LayerConfig; fields: string[] }[] {
  return LAYERS
    .filter((layer) => layer.key !== 'public')
    .map((layer) => ({
      layer,
      fields: isBusinessLike(kind) ? layer.fieldsBusiness : layer.fieldsPerson,
    }));
}

export function resonanceLabel(value: number): string {
  if (value >= 0.8) {
    return 'Alta ressonância';
  }

  if (value >= 0.6) {
    return 'Afinidade próxima';
  }

  if (value >= 0.4) {
    return 'Contexto compatível';
  }

  return 'Presença relevante';
}