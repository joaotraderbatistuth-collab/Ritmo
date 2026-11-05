// Capas dos Ritus gratuitos iniciais (imagens em public/ritus/). Ritus criados por usuários não têm capa fixa.
const SEEDED = new Set([
  'clube-do-livro',
  'cozinha-pratica',
  'treino-em-casa',
  'caminhada-e-corrida',
  'foco-profundo',
  'financas-do-mes',
  'desafio-21-dias',
  'ingles-15-minutos',
  'manhas-com-ritmo',
  'casa-organizada',
]);

export const ritusCover = (code: string): string | null => (SEEDED.has(code) ? `/ritus/${code}.svg` : null);
