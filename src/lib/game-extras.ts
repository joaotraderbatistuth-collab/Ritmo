// Mais cara de jogo, sem culpa: evento da semana, passe da temporada, baú semanal e mascote.
// Regras PURAS e testadas. Tudo sai do que a pessoa fez de verdade; nada é editável à mão.
import type { XpSource } from './levels.js';
import { hash32 } from './rewards.js';

const DAY = 86400_000;
const t = (d: string) => Date.parse(`${d}T12:00:00Z`);
export const addDay = (d: string, n: number) => new Date(t(d) + n * DAY).toISOString().slice(0, 10);
export function mondayOfDay(d: string): string {
  const x = new Date(t(d));
  x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7));
  return x.toISOString().slice(0, 10);
}

/* ------------------------------------------------------------------ */
/* Evento da semana: um tema com pontos em dobro numa área do app      */
/* ------------------------------------------------------------------ */

export interface WeekEvent {
  id: string;
  name: string;
  emoji: string;
  color: string;
  /** o que vale em dobro */
  sources: XpSource[];
  desc: string;
  /** aba que leva direto ao que vale em dobro */
  tab: string;
}

export const WEEK_EVENTS: WeekEvent[] = [
  { id: 'foco', name: 'Semana do Foco', emoji: '🎯', color: '#a855f7', sources: ['foco', 'meta', 'marco'], desc: 'Sessões de foco e metas valem em dobro.', tab: 'foco' },
  { id: 'habitos', name: 'Semana dos Hábitos', emoji: '💧', color: '#10b981', sources: ['habito', 'habito_novo'], desc: 'Cada hábito marcado vale em dobro.', tab: 'habitos' },
  { id: 'movimento', name: 'Semana do Movimento', emoji: '👟', color: '#38bdf8', sources: ['treino', 'constancia'], desc: 'Dias de treino e a constância valem em dobro.', tab: 'treino' },
  { id: 'organizacao', name: 'Semana da Organização', emoji: '🗂️', color: '#f59e0b', sources: ['tarefa', 'tarefa_nova', 'card', 'lembrete_novo'], desc: 'Tarefas, cards e lembretes valem em dobro.', tab: 'rotina' },
  { id: 'reflexao', name: 'Semana da Reflexão', emoji: '📓', color: '#f472b6', sources: ['diario', 'revisao'], desc: 'Check-in no diário e revisão da semana valem em dobro.', tab: 'diario' },
  { id: 'financas', name: 'Semana do Bolso em Dia', emoji: '💰', color: '#22c55e', sources: ['financas', 'orcamento'], desc: 'Lançamentos e orçamentos valem em dobro.', tab: 'financas' },
  { id: 'comunidade', name: 'Semana da Comunidade', emoji: '🤝', color: '#fb923c', sources: ['post', 'comentario', 'curtida', 'seguir', 'desafio'], desc: 'Feed, apoio aos amigos e desafios valem em dobro.', tab: 'feed' },
];

/** Os eventos começam nesta semana (não mexem nos pontos de antes). */
export const EVENT_START = '2026-11-09';
/** O dobro do evento rende no máximo isto por dia (o limite diário continua valendo). */
export const EVENT_DAILY_MAX = 60;

/** Evento da semana do dia (todo mundo tem o mesmo evento na mesma semana). */
export function eventOfWeek(day: string): WeekEvent | null {
  if (!day || day < EVENT_START) return null;
  const weeks = Math.round((t(mondayOfDay(day)) - t(mondayOfDay(EVENT_START))) / (7 * DAY));
  return WEEK_EVENTS[((weeks % WEEK_EVENTS.length) + WEEK_EVENTS.length) % WEEK_EVENTS.length];
}

/** Bônus do evento num dia: os pontos (já com limite diário) das ações do tema, até EVENT_DAILY_MAX. */
export function eventBonus(day: string, xpBySource: Partial<Record<XpSource, number>>): number {
  const ev = eventOfWeek(day);
  if (!ev) return 0;
  const sum = ev.sources.reduce((a, s) => a + (xpBySource[s] || 0), 0);
  return Math.min(EVENT_DAILY_MAX, Math.max(0, sum));
}

/* ------------------------------------------------------------------ */
/* Passe da temporada: 10 degraus por mês, cada um com um prêmio        */
/* ------------------------------------------------------------------ */

export interface PassTier {
  step: number;
  /** pontos do mês para chegar aqui */
  points: number;
  /** pontos de prêmio ao chegar */
  bonus: number;
  /** prêmio extra (texto) */
  reward: string;
  emoji: string;
}

export const SEASON_PASS: PassTier[] = [
  { step: 1, points: 50, bonus: 10, reward: '+10 pontos', emoji: '🎁' },
  { step: 2, points: 150, bonus: 15, reward: '+15 pontos', emoji: '🎁' },
  { step: 3, points: 300, bonus: 20, reward: '+20 pontos', emoji: '🎁' },
  { step: 4, points: 500, bonus: 25, reward: '+25 pontos', emoji: '🎁' },
  { step: 5, points: 750, bonus: 40, reward: '+40 pontos e selo Metade do Passe no perfil', emoji: '🏵️' },
  { step: 6, points: 1000, bonus: 30, reward: '+30 pontos', emoji: '🎁' },
  { step: 7, points: 1300, bonus: 35, reward: '+35 pontos', emoji: '🎁' },
  { step: 8, points: 1700, bonus: 40, reward: '+40 pontos', emoji: '🎁' },
  { step: 9, points: 2200, bonus: 45, reward: '+45 pontos', emoji: '🎁' },
  { step: 10, points: 2800, bonus: 100, reward: '+100 pontos e selo Passe Completo do mês no perfil', emoji: '👑' },
];

/** O passe começa neste mês. */
export const PASS_START_MONTH = '2026-11';

/**
 * Dia em que cada degrau foi alcançado no mês, a partir dos pontos de cada dia (sem o próprio prêmio do passe,
 * para não virar bola de neve). Devolve só os degraus alcançados.
 */
export function passReached(dayXp: Record<string, number>, month: string): { step: number; day: string; bonus: number }[] {
  if (month < PASS_START_MONTH) return [];
  const days = Object.keys(dayXp).filter((d) => d.startsWith(month)).sort();
  const out: { step: number; day: string; bonus: number }[] = [];
  let sum = 0;
  let next = 0;
  for (const d of days) {
    sum += Math.max(0, dayXp[d] || 0);
    while (next < SEASON_PASS.length && sum >= SEASON_PASS[next].points) {
      out.push({ step: SEASON_PASS[next].step, day: d, bonus: SEASON_PASS[next].bonus });
      next++;
    }
  }
  return out;
}

/** Situação do passe para a tela. `basePoints` são os pontos do mês sem os prêmios do passe. */
export function passView(basePoints: number) {
  const reached = SEASON_PASS.filter((p) => basePoints >= p.points).length;
  const next = SEASON_PASS[reached] || null;
  const prev = reached > 0 ? SEASON_PASS[reached - 1].points : 0;
  return {
    step: reached,
    points: basePoints,
    next: next ? { step: next.step, points: next.points, missing: next.points - basePoints, reward: next.reward } : null,
    /** progresso até o próximo degrau (0 a 1) */
    progress: next ? Math.min(1, Math.max(0, (basePoints - prev) / (next.points - prev))) : 1,
    tiers: SEASON_PASS.map((p) => ({ ...p, done: basePoints >= p.points })),
  };
}

/* ------------------------------------------------------------------ */
/* Baú semanal: missões cumpridas em 5 dias da semana                    */
/* ------------------------------------------------------------------ */

export const WEEK_CHEST_DAYS = 5;

/** Dias da semana (seg a dom) em que a pessoa abriu o baú das missões. */
export function chestDaysInWeek(chestDays: string[], monday: string): number {
  const end = addDay(monday, 6);
  return new Set(chestDays.filter((d) => d >= monday && d <= end)).size;
}

/** Prêmio do baú semanal: fixo para a pessoa e a semana (de 60 a 150 pontos). */
export function weekChestReward(userId: number, monday: string): number {
  const options = [60, 70, 80, 90, 100, 120, 150];
  const weights = [22, 22, 18, 14, 12, 8, 4];
  let roll = hash32(`ritmo-bau-semana:${userId}:${monday}`) % 100;
  for (let i = 0; i < options.length; i++) {
    if (roll < weights[i]) return options[i];
    roll -= weights[i];
  }
  return options[0];
}

/* ------------------------------------------------------------------ */
/* Mascote: o Rit, uma plantinha que cresce com a constância            */
/* ------------------------------------------------------------------ */

export const MASCOT_STAGES = [
  { min: 0, name: 'Semente', emoji: '🌰' },
  { min: 3, name: 'Broto', emoji: '🌱' },
  { min: 10, name: 'Muda', emoji: '🌿' },
  { min: 25, name: 'Plantinha', emoji: '🪴' },
  { min: 50, name: 'Árvore jovem', emoji: '🌳' },
  { min: 100, name: 'Árvore florida', emoji: '🌸' },
  { min: 200, name: 'Árvore com frutos', emoji: '🍎' },
];

export type MascotMood = 'radiante' | 'tranquilo' | 'com_sede' | 'dormindo';

/**
 * O Rit cresce com os dias ativos (nunca encolhe) e mostra o humor pelos dias desde a última vez.
 * Sem culpa: quando a pessoa some, ele só "dorme" e acorda feliz na volta.
 */
export function mascotState(activeDays: number, lastActiveDay: string | null, today: string) {
  let stage = 0;
  for (let i = 0; i < MASCOT_STAGES.length; i++) if (activeDays >= MASCOT_STAGES[i].min) stage = i;
  const cur = MASCOT_STAGES[stage];
  const next = MASCOT_STAGES[stage + 1] || null;
  const gap = lastActiveDay ? Math.round((t(today) - t(lastActiveDay)) / DAY) : 99;
  const mood: MascotMood = gap <= 0 ? 'radiante' : gap === 1 ? 'tranquilo' : gap <= 3 ? 'com_sede' : 'dormindo';
  const msg: Record<MascotMood, string> = {
    radiante: 'Rit está radiante! Você já cuidou de você hoje.',
    tranquilo: 'Rit está tranquilo. Uma ação pequena hoje e ele brilha.',
    com_sede: 'Rit está com sede. Que tal um hábito rapidinho para regar?',
    dormindo: 'Rit tirou um cochilo. Quando você voltar, ele acorda feliz.',
  };
  return {
    stage: stage + 1,
    stages: MASCOT_STAGES.length,
    name: cur.name,
    emoji: cur.emoji,
    mood,
    message: msg[mood],
    next: next ? { name: next.name, emoji: next.emoji, missing: next.min - activeDays } : null,
    progress: next ? Math.min(1, (activeDays - cur.min) / (next.min - cur.min)) : 1,
  };
}

/* ------------------------------------------------------------------ */
/* Ranking entre amigos (semana)                                         */
/* ------------------------------------------------------------------ */

/** Ordena por pontos da semana; empate fica com quem tem nível maior e depois o nome. */
export function friendsRanking<T extends { userId: number; xp: number; level: number; name: string }>(rows: T[]): (T & { rank: number })[] {
  return [...rows]
    .sort((a, b) => b.xp - a.xp || b.level - a.level || a.name.localeCompare(b.name, 'pt-BR'))
    .map((r, i) => ({ ...r, rank: i + 1 }));
}
