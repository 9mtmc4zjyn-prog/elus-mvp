export type InterestCategoryId =
  | 'hobbies_lazer'
  | 'profissional'
  | 'familia_comunidade'
  | 'estilo_vida';

export type Interest = {
  id: string;
  label: string;
  categoryId: InterestCategoryId;
};

export type InterestCategory = {
  id: InterestCategoryId;
  title: string;
  interests: Interest[];
};

function createInterest(categoryId: InterestCategoryId, id: string, label: string): Interest {
  return { id, label, categoryId };
}

export const INTEREST_CATEGORIES: InterestCategory[] = [
  {
    id: 'hobbies_lazer',
    title: 'Hobbies & Lazer',
    interests: [
      createInterest('hobbies_lazer', 'viagens', 'Viagens'),
      createInterest('hobbies_lazer', 'culinaria', 'Culinária'),
      createInterest('hobbies_lazer', 'musica', 'Música'),
      createInterest('hobbies_lazer', 'esportes', 'Esportes'),
      createInterest('hobbies_lazer', 'leitura', 'Leitura'),
      createInterest('hobbies_lazer', 'cinema_series', 'Cinema e séries'),
      createInterest('hobbies_lazer', 'fotografia', 'Fotografia'),
      createInterest('hobbies_lazer', 'jogos', 'Jogos'),
      createInterest('hobbies_lazer', 'danca', 'Dança'),
      createInterest('hobbies_lazer', 'arte', 'Arte'),
    ],
  },
  {
    id: 'profissional',
    title: 'Profissional',
    interests: [
      createInterest('profissional', 'empreendedorismo', 'Empreendedorismo'),
      createInterest('profissional', 'tecnologia', 'Tecnologia'),
      createInterest('profissional', 'marketing', 'Marketing'),
      createInterest('profissional', 'financas', 'Finanças'),
      createInterest('profissional', 'educacao', 'Educação'),
      createInterest('profissional', 'vendas', 'Vendas'),
      createInterest('profissional', 'direito', 'Direito'),
      createInterest('profissional', 'design', 'Design'),
      createInterest('profissional', 'consultoria', 'Consultoria'),
      createInterest('profissional', 'saude_profissional', 'Saúde'),
    ],
  },
  {
    id: 'familia_comunidade',
    title: 'Família & Comunidade',
    interests: [
      createInterest('familia_comunidade', 'voluntariado', 'Voluntariado'),
      createInterest('familia_comunidade', 'criacao_de_filhos', 'Criação de filhos'),
      createInterest('familia_comunidade', 'vizinhanca', 'Vizinhança'),
      createInterest('familia_comunidade', 'causas_sociais', 'Causas sociais'),
      createInterest('familia_comunidade', 'animais_de_estimacao', 'Animais de estimação'),
      createInterest('familia_comunidade', 'meio_ambiente', 'Meio ambiente'),
    ],
  },
  {
    id: 'estilo_vida',
    title: 'Estilo de vida',
    interests: [
      createInterest('estilo_vida', 'espiritualidade_fe', 'Espiritualidade e fé'),
      createInterest('estilo_vida', 'saude_bem_estar', 'Saúde e bem-estar'),
      createInterest('estilo_vida', 'sustentabilidade', 'Sustentabilidade'),
      createInterest('estilo_vida', 'desenvolvimento_pessoal', 'Desenvolvimento pessoal'),
      createInterest('estilo_vida', 'vida_ao_ar_livre', 'Vida ao ar livre'),
      createInterest('estilo_vida', 'minimalismo', 'Minimalismo'),
    ],
  },
];

export const INTERESTS: Interest[] = INTEREST_CATEGORIES.reduce<Interest[]>(
  (all, category) => [...all, ...category.interests],
  []
);

export function getInterestById(interestId: string) {
  return INTERESTS.find((interest) => interest.id === interestId);
}

export function getInterestsByCategory(categoryId: InterestCategoryId) {
  return INTERESTS.filter((interest) => interest.categoryId === categoryId);
}
