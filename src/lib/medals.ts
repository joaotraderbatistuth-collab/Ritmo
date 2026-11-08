// Conquistas (medalhas) e retrospectiva do mês. Regras PURAS e testadas.
// Tudo é calculado a partir do que a pessoa fez de verdade: não existe medalha "dada" à mão.

export interface MedalInput {
  /** dia a dia: pontos e quantas vezes fez cada coisa */
  days: Record<string, { xp: number; raw: Record<string, number | undefined> }>;
  /** contagens que valeram ponto (com o limite diário) */
  counts: Record<string, number>;
  activeDays: number;
  bestStreak: number;
  level: number;
  /** maior divisão já alcançada na temporada (0 = Bronze) */
  seasonMaxTier: number;
  workouts: { day: string; distanceM: number }[];
  challengesDone: number;
}

export interface MedalDef {
  id: string;
  emoji: string;
  name: string;
  desc: string;
  group: string;
  goal: number;
  value: (i: MedalInput, d: Derived) => number;
}

export interface Medal {
  id: string;
  emoji: string;
  name: string;
  desc: string;
  group: string;
  goal: number;
  progress: number;
  earned: boolean;
}

interface Derived {
  trainDays: number;
  strongWeeks: number;
  maxKm: number;
  totalKm: number;
}

const monday = (d: string) => {
  const t = new Date(`${d}T12:00:00Z`);
  t.setUTCDate(t.getUTCDate() - ((t.getUTCDay() + 6) % 7));
  return t.toISOString().slice(0, 10);
};

function derive(i: MedalInput): Derived {
  const trainDaysList = Object.entries(i.days).filter(([, r]) => (r.raw.treino || 0) > 0).map(([d]) => d);
  const perWeek = new Map<string, number>();
  for (const d of trainDaysList) perWeek.set(monday(d), (perWeek.get(monday(d)) || 0) + 1);
  const strongWeeks = [...perWeek.values()].filter((n) => n >= 3).length;
  let maxKm = 0;
  let totalKm = 0;
  for (const w of i.workouts) {
    const km = Math.max(0, w.distanceM || 0) / 1000;
    totalKm += km;
    if (km > maxKm) maxKm = km;
  }
  return { trainDays: trainDaysList.length, strongWeeks, maxKm, totalKm };
}

const c = (k: string) => (i: MedalInput) => i.counts[k] || 0;

export const MEDALS: MedalDef[] = [
  { id: 'ativo1', emoji: '👣', name: 'Primeiro passo', desc: 'Ganhe pontos em 1 dia', group: 'Constância', goal: 1, value: (i) => i.activeDays },
  { id: 'ativo7', emoji: '✨', name: 'Uma semana de Ritmo', desc: '7 dias ativos', group: 'Constância', goal: 7, value: (i) => i.activeDays },
  { id: 'ativo30', emoji: '🌟', name: 'Um mês de Ritmo', desc: '30 dias ativos', group: 'Constância', goal: 30, value: (i) => i.activeDays },
  { id: 'ativo100', emoji: '🏛️', name: 'Cem dias', desc: '100 dias ativos', group: 'Constância', goal: 100, value: (i) => i.activeDays },
  { id: 'ofensiva7', emoji: '🔥', name: 'Ofensiva de 7', desc: '7 dias seguidos na ofensiva', group: 'Constância', goal: 7, value: (i) => i.bestStreak },
  { id: 'ofensiva30', emoji: '☄️', name: 'Ofensiva de 30', desc: '30 dias seguidos na ofensiva', group: 'Constância', goal: 30, value: (i) => i.bestStreak },
  { id: 'habito10', emoji: '💧', name: 'Hábito pegando', desc: '10 hábitos marcados', group: 'Hábitos', goal: 10, value: c('habito') },
  { id: 'habito100', emoji: '🌱', name: 'Raiz forte', desc: '100 hábitos marcados', group: 'Hábitos', goal: 100, value: c('habito') },
  { id: 'habito500', emoji: '🌳', name: 'Árvore', desc: '500 hábitos marcados', group: 'Hábitos', goal: 500, value: c('habito') },
  { id: 'foco10', emoji: '🎯', name: 'Mira afiada', desc: '10 sessões de foco', group: 'Foco', goal: 10, value: c('foco') },
  { id: 'foco50', emoji: '🧠', name: 'Mente de aço', desc: '50 sessões de foco', group: 'Foco', goal: 50, value: c('foco') },
  { id: 'tarefa50', emoji: '✅', name: 'Faz acontecer', desc: '50 tarefas concluídas', group: 'Foco', goal: 50, value: c('tarefa') },
  { id: 'treino1', emoji: '👟', name: 'Primeiro treino', desc: 'Registre 1 treino', group: 'Treino', goal: 1, value: (_i, d) => d.trainDays },
  { id: 'treino10', emoji: '🏃', name: 'Dez dias de treino', desc: 'Treine em 10 dias diferentes', group: 'Treino', goal: 10, value: (_i, d) => d.trainDays },
  { id: 'semana3', emoji: '💪', name: 'Semana constante', desc: '3 dias de treino na mesma semana', group: 'Treino', goal: 1, value: (_i, d) => d.strongWeeks },
  { id: 'semanas4', emoji: '🏅', name: 'Constância de verdade', desc: '4 semanas com 3 dias de treino ou mais', group: 'Treino', goal: 4, value: (_i, d) => d.strongWeeks },
  { id: 'km5', emoji: '🛣️', name: 'Primeiros 5 km', desc: 'Um treino de 5 km ou mais', group: 'Treino', goal: 5, value: (_i, d) => Math.floor(d.maxKm) },
  { id: 'km42', emoji: '🏁', name: 'Uma maratona somada', desc: '42 km somando seus treinos', group: 'Treino', goal: 42, value: (_i, d) => Math.floor(d.totalKm) },
  { id: 'km100', emoji: '🌍', name: 'Cem quilômetros', desc: '100 km somando seus treinos', group: 'Treino', goal: 100, value: (_i, d) => Math.floor(d.totalKm) },
  { id: 'diario7', emoji: '📓', name: 'Diário em dia', desc: '7 check-ins no diário', group: 'Diário', goal: 7, value: c('diario') },
  { id: 'revisao4', emoji: '🗓️', name: 'Olhar para trás', desc: '4 revisões da semana', group: 'Diário', goal: 4, value: c('revisao') },
  { id: 'fin30', emoji: '💰', name: 'Dinheiro com endereço', desc: '30 lançamentos nas finanças', group: 'Finanças', goal: 30, value: c('financas') },
  { id: 'orcamento', emoji: '🧮', name: 'Orçamento no papel', desc: 'Defina 1 orçamento', group: 'Finanças', goal: 1, value: c('orcamento') },
  { id: 'meta1', emoji: '🗺️', name: 'Meta traçada', desc: 'Comece 1 ciclo de foco', group: 'Metas', goal: 1, value: c('meta') },
  { id: 'marco5', emoji: '⛰️', name: 'Marco a marco', desc: '5 marcos do roteiro concluídos', group: 'Metas', goal: 5, value: c('marco') },
  { id: 'post1', emoji: '📣', name: 'Primeira publicação', desc: 'Publique no Feed', group: 'Comunidade', goal: 1, value: c('post') },
  { id: 'seguir5', emoji: '🤝', name: 'Rede de apoio', desc: 'Siga 5 pessoas', group: 'Comunidade', goal: 5, value: c('seguir') },
  { id: 'desafio1', emoji: '⚔️', name: 'Desafio cumprido', desc: 'Cumpra 1 desafio com amigos', group: 'Comunidade', goal: 1, value: (i) => i.challengesDone },
  { id: 'desafio5', emoji: '🛡️', name: 'Parceiro de fé', desc: 'Cumpra 5 desafios com amigos', group: 'Comunidade', goal: 5, value: (i) => i.challengesDone },
  { id: 'nivel5', emoji: '⭐', name: 'Nível 5', desc: 'Chegue ao nível Focado', group: 'Níveis', goal: 5, value: (i) => i.level },
  { id: 'nivel10', emoji: '👑', name: 'Nível 10', desc: 'Chegue ao Mestre do Ritmo', group: 'Níveis', goal: 10, value: (i) => i.level },
  { id: 'divisao1', emoji: '🥈', name: 'Subiu de divisão', desc: 'Chegue à Prata na temporada', group: 'Temporada', goal: 1, value: (i) => i.seasonMaxTier },
  { id: 'divisao3', emoji: '🔷', name: 'Safira', desc: 'Chegue à Safira na temporada', group: 'Temporada', goal: 3, value: (i) => i.seasonMaxTier },
  { id: 'divisao7', emoji: '🏆', name: 'Lenda', desc: 'Chegue à divisão Lenda', group: 'Temporada', goal: 7, value: (i) => i.seasonMaxTier },
];

/** Grupos que aparecem no perfil público (nada de hábitos/saúde, finanças, diário ou treinos). */
export const PUBLIC_MEDAL_GROUPS = ['Constância', 'Foco', 'Metas', 'Comunidade', 'Níveis', 'Temporada'];

export function computeMedals(input: MedalInput): Medal[] {
  const d = derive(input);
  return MEDALS.map((m) => {
    const v = Math.max(0, Math.floor(m.value(input, d)));
    return { id: m.id, emoji: m.emoji, name: m.name, desc: m.desc, group: m.group, goal: m.goal, progress: Math.min(v, m.goal), earned: v >= m.goal };
  });
}

/* ------------------------------------------------------------------ */
/* Retrospectiva do mês                                                */
/* ------------------------------------------------------------------ */

export interface MonthRecap {
  month: string;
  points: number;
  activeDays: number;
  bestDay: { day: string; xp: number } | null;
  habits: number;
  tasks: number;
  focus: number;
  trainDays: number;
  km: number;
  diary: number;
}

export function monthRecap(days: MedalInput['days'], workouts: MedalInput['workouts'], month: string): MonthRecap {
  const r: MonthRecap = { month, points: 0, activeDays: 0, bestDay: null, habits: 0, tasks: 0, focus: 0, trainDays: 0, km: 0, diary: 0 };
  for (const [day, row] of Object.entries(days)) {
    if (!day.startsWith(month)) continue;
    r.points += row.xp;
    if (row.xp > 0) r.activeDays++;
    if (!r.bestDay || row.xp > r.bestDay.xp) r.bestDay = row.xp > 0 ? { day, xp: row.xp } : r.bestDay;
    r.habits += row.raw.habito || 0;
    r.tasks += row.raw.tarefa || 0;
    r.focus += row.raw.foco || 0;
    r.diary += row.raw.diario || 0;
    if ((row.raw.treino || 0) > 0) r.trainDays++;
  }
  for (const w of workouts) if (w.day.startsWith(month)) r.km += Math.max(0, w.distanceM || 0) / 1000;
  r.km = Math.round(r.km * 10) / 10;
  return r;
}
