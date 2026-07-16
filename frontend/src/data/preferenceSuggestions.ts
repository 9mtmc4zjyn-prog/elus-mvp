export type PreferenceCategoryId = 'conexao';

export type Preference = {
  id: string;
  label: string;
  categoryId: PreferenceCategoryId;
};

export type PreferenceCategory = {
  id: PreferenceCategoryId;
  title: string;
  preferences: Preference[];
};

function createPreference(categoryId: PreferenceCategoryId, id: string, label: string): Preference {
  return { id, label, categoryId };
}

export const PREFERENCE_CATEGORIES: PreferenceCategory[] = [
  {
    id: 'conexao',
    title: 'Tipos de conexão',
    preferences: [
      createPreference('conexao', 'profissional', 'Rede profissional'),
      createPreference('conexao', 'amizade', 'Amizade'),
      createPreference('conexao', 'comunidade', 'Comunidade e vizinhança'),
      createPreference('conexao', 'mentoria', 'Mentoria'),
      createPreference('conexao', 'voluntariado', 'Voluntariado'),
    ],
  },
];

export const PREFERENCES: Preference[] = PREFERENCE_CATEGORIES.reduce<Preference[]>(
  (all, category) => [...all, ...category.preferences],
  []
);

export function getPreferenceById(preferenceId: string) {
  return PREFERENCES.find((preference) => preference.id === preferenceId);
}

export function getPreferencesByCategory(categoryId: PreferenceCategoryId) {
  return PREFERENCES.filter((preference) => preference.categoryId === categoryId);
}
