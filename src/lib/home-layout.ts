// Personalização da tela "Hoje" — lógica PURA (sem React), testada em tests/.
// A pessoa escolhe quais cards aparecem e em que ordem. Guardamos só a lista ORDENADA dos
// cards visíveis; os que não estão na lista ficam no catálogo para serem adicionados.

export const CARD_IDS = [
  'corrente',
  'tarefas',
  'habitos',
  'foco',
  'financas',
  'evolucao_habitos',
  'produtividade',
  'metas',
] as const;

export type CardId = (typeof CARD_IDS)[number];

export const CARD_INFO: Record<CardId, { title: string; description: string; wide?: boolean }> = {
  corrente: {
    title: 'Não Quebre a Corrente',
    description: 'Semanas seguidas cumprindo a meta de um hábito.',
    wide: true,
  },
  tarefas: { title: 'Tarefas de hoje', description: 'O que está planejado para hoje.' },
  habitos: { title: 'Hábitos de hoje', description: 'Marque os hábitos do dia.' },
  foco: { title: 'Sessão de foco rápida', description: 'Comece um bloco de foco em um toque.' },
  financas: { title: 'Resumo financeiro', description: 'Entradas, saídas e saldo do mês.' },
  evolucao_habitos: {
    title: 'Evolução dos hábitos',
    description: 'Quanto de cada meta semanal você já cumpriu.',
  },
  produtividade: {
    title: 'Indicadores de produtividade',
    description: 'Tarefas, foco e hábitos da semana.',
  },
  metas: { title: 'Metas pessoais', description: 'Meta principal do ciclo e seu andamento.' },
};

export const DEFAULT_VISIBLE: CardId[] = ['corrente', 'tarefas', 'habitos', 'foco', 'financas'];

const isCardId = (v: unknown): v is CardId => typeof v === 'string' && (CARD_IDS as readonly string[]).includes(v);

/** Aceita qualquer coisa vinda do armazenamento e devolve uma lista válida, sem repetidos. */
export function normalizeVisible(raw: unknown): CardId[] {
  if (!Array.isArray(raw)) return [...DEFAULT_VISIBLE];
  const out: CardId[] = [];
  for (const v of raw) if (isCardId(v) && !out.includes(v)) out.push(v);
  return out;
}

/** Move um card uma posição para cima (-1) ou para baixo (+1). */
export function moveCard(list: CardId[], id: CardId, delta: -1 | 1): CardId[] {
  const i = list.indexOf(id);
  const j = i + delta;
  if (i < 0 || j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

/** Arrastar e soltar: põe `dragId` na posição de `targetId`. */
export function moveBefore(list: CardId[], dragId: CardId, targetId: CardId): CardId[] {
  if (dragId === targetId) return list;
  const from = list.indexOf(dragId);
  const to = list.indexOf(targetId);
  if (from < 0 || to < 0) return list;
  const next = list.filter((x) => x !== dragId);
  next.splice(next.indexOf(targetId) + (from < to ? 1 : 0), 0, dragId);
  return next;
}

export function hideCard(list: CardId[], id: CardId): CardId[] {
  return list.filter((x) => x !== id);
}

export function showCard(list: CardId[], id: CardId): CardId[] {
  return list.includes(id) ? list : [...list, id];
}

export function hiddenCards(list: CardId[]): CardId[] {
  return CARD_IDS.filter((id) => !list.includes(id));
}
