/**
 * Sobrenomes muito comuns no Brasil.
 *
 * Uso: o ranking de sugestões (src/utils/suggestionRanking.ts) trata
 * "mesmo sobrenome + origem/cidade cruzada" como sinal de parentesco
 * (prioridade máxima). Só que sobrenomes como "Silva" ou "Souza" são tão
 * comuns que duas pessoas sem nenhum parentesco real vão bater com
 * frequência — o sinal de "mesmo sobrenome" sozinho é fraco pra esses
 * casos. Quando o sobrenome em comum está nesta lista, o ranking rebaixa
 * a confiança do sinal (ver PRIORITY_SCORE.parentescoSobrenomeComum).
 *
 * Não é uma lista censitária oficial nem exaustiva — é uma lista prática
 * dos sobrenomes mais frequentes do país, o suficiente para pegar os
 * casos que mais gerariam falso positivo. Fácil de estender depois com
 * dados reais de frequência por sobrenome dentro da própria base do ELUS
 * (ex.: quando um sobrenome passar de N usuários cadastrados, tratar como
 * comum automaticamente).
 */

export const COMMON_BRAZILIAN_SURNAMES: ReadonlySet<string> = new Set(
  [
    'silva',
    'santos',
    'souza',
    'sousa',
    'oliveira',
    'pereira',
    'lima',
    'costa',
    'ferreira',
    'rodrigues',
    'almeida',
    'nascimento',
    'carvalho',
    'gomes',
    'martins',
    'araujo',
    'melo',
    'meireles',
    'barbosa',
    'ribeiro',
    'alves',
    'monteiro',
    'mendes',
    'barros',
    'freitas',
    'cardoso',
    'correia',
    'teixeira',
    'moreira',
    'cavalcanti',
    'cavalcante',
    'dias',
    'castro',
    'campos',
    'cunha',
    'pinto',
    'moura',
    'rocha',
    'fonseca',
    'lopes',
    'soares',
    'fernandes',
    'vieira',
    'nunes',
    'marques',
    'machado',
    'ramos',
    'goncalves',
    'santana',
    'reis',
    'sales',
    'farias',
    'batista',
    'miranda',
    'andrade',
    'azevedo',
    'pires',
  ].map((name) => name.normalize('NFD').replace(/[̀-ͯ]/g, ''))
);

export function isCommonSurname(surname: string | undefined | null): boolean {
  const normalized = (surname ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

  return COMMON_BRAZILIAN_SURNAMES.has(normalized);
}
