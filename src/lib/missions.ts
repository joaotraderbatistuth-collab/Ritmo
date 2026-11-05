// Missões do dia, baú, ofensiva (dias seguidos com descanso), resumo da semana e ligas.
// Regras PURAS (sem banco), testadas em tests/. O progresso vem sempre dos dados reais do servidor.
import type { XpSource } from './levels.js';

export type MissionCounter = XpSource | 'lembrete' | 'planejar';

export interface MissionDef {
  id: string;
  title: string;
  /** O que conta para a missão. */
  counter: MissionCounter;
  goal: number;
  /** Aba que ajuda a cumprir. */
  tab: string;
  /** Só oferecida para quem já usa (ou, como "descoberta", para quem nunca usou). */
  feature: string;
}

export const MISSION_POOL: MissionDef[] = [
  { id: 'habito1', title: 'Marque 1 hábito', counter: 'habito', goal: 1, tab: 'habitos', feature: 'habito' },
  { id: 'habito3', title: 'Marque 3 hábitos', counter: 'habito', goal: 3, tab: 'habitos', feature: 'habito' },
  { id: 'tarefa1', title: 'Conclua 1 tarefa', counter: 'tarefa', goal: 1, tab: 'rotina', feature: 'tarefa' },
  { id: 'tarefa3', title: 'Conclua 3 tarefas', counter: 'tarefa', goal: 3, tab: 'rotina', feature: 'tarefa' },
  { id: 'foco1', title: 'Faça 1 sessão de foco', counter: 'foco', goal: 1, tab: 'foco', feature: 'foco' },
  { id: 'foco2', title: 'Faça 2 sessões de foco', counter: 'foco', goal: 2, tab: 'foco', feature: 'foco' },
  { id: 'diario', title: 'Faça o check-in no diário', counter: 'diario', goal: 1, tab: 'diario', feature: 'diario' },
  { id: 'financas1', title: 'Lance 1 gasto ou entrada', counter: 'financas', goal: 1, tab: 'financas', feature: 'financas' },
  { id: 'financas3', title: 'Lance 3 gastos ou entradas', counter: 'financas', goal: 3, tab: 'financas', feature: 'financas' },
  { id: 'treino', title: 'Registre um treino (corrida, caminhada ou pedal)', counter: 'treino', goal: 1, tab: 'treino', feature: 'treino' },
  { id: 'comentar', title: 'Comente algo no Feed', counter: 'comentario', goal: 1, tab: 'feed', feature: 'feed' },
  { id: 'publicar', title: 'Compartilhe uma conquista no Feed', counter: 'post', goal: 1, tab: 'feed', feature: 'feed' },
  { id: 'lembrete', title: 'Peça um lembrete ao seu secretário', counter: 'lembrete', goal: 1, tab: 'secretario', feature: 'lembrete' },
  { id: 'planejar', title: 'Planeje amanhã: crie 1 tarefa para amanhã', counter: 'planejar', goal: 1, tab: 'rotina', feature: 'tarefa' },
];

export const MISSIONS_PER_DAY = 3;

/** Número "aleatório" fixo para a mesma pessoa no mesmo dia (não muda ao recarregar). */
export function seeded(key: string): () => number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return ((h >>> 0) % 1_000_000) / 1_000_000;
  };
}

/**
 * Escolhe as 3 missões do dia: 2 do que a pessoa já usa (para manter o hábito) e 1 de descoberta
 * (algo que ela ainda não usou), para mostrar o resto do app. Nunca 2 missões do mesmo recurso.
 */
export function pickMissions(userId: number, day: string, usedFeatures: Set<string>): MissionDef[] {
  const rnd = seeded(`${userId}:${day}`);
  const shuffle = <T,>(a: T[]) => {
    const b = a.slice();
    for (let i = b.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [b[i], b[j]] = [b[j], b[i]];
    }
    return b;
  };
  const known = shuffle(MISSION_POOL.filter((m) => usedFeatures.has(m.feature)));
  const fresh = shuffle(MISSION_POOL.filter((m) => !usedFeatures.has(m.feature) && m.goal === 1));
  const out: MissionDef[] = [];
  const take = (list: MissionDef[], n: number) => {
    for (const m of list) {
      if (out.length >= MISSIONS_PER_DAY || n <= 0) break;
      if (out.some((o) => o.feature === m.feature)) continue;
      out.push(m);
      n--;
    }
  };
  take(known, 2);
  take(fresh, 1);
  // completa se faltar (pessoa nova ou que usa tudo)
  take(shuffle(MISSION_POOL.filter((m) => m.goal === 1)), MISSIONS_PER_DAY);
  take(shuffle(MISSION_POOL), MISSIONS_PER_DAY);
  return out;
}

export interface MissionStatus extends MissionDef {
  progress: number;
  done: boolean;
}

export function missionProgress(missions: MissionDef[], counts: Partial<Record<MissionCounter, number>>): MissionStatus[] {
  return missions.map((m) => {
    const progress = Math.min(m.goal, Math.max(0, Math.floor(counts[m.counter] || 0)));
    return { ...m, progress, done: progress >= m.goal };
  });
}

/* ---------------- Baú ---------------- */

export type ChestReward = { kind: 'xp'; xp: number; label: string } | { kind: 'descanso'; xp: number; label: string };

/** Prêmio do baú: sorteado, mas fixo para a pessoa e o dia (não dá para "rolar de novo"). */
export function chestReward(userId: number, day: string): ChestReward {
  const r = seeded(`bau:${userId}:${day}`)();
  if (r < 0.5) return { kind: 'xp', xp: 15, label: '+15 pontos' };
  if (r < 0.78) return { kind: 'xp', xp: 25, label: '+25 pontos' };
  if (r < 0.9) return { kind: 'descanso', xp: 10, label: '1 dia de descanso extra para a sua ofensiva (+10 pontos)' };
  if (r < 0.98) return { kind: 'xp', xp: 40, label: '+40 pontos (raro!)' };
  return { kind: 'xp', xp: 75, label: '+75 pontos (lendário!)' };
}

/* ---------------- Ofensiva (dias seguidos) ---------------- */

const DAY_MS = 86400_000;
const t = (d: string) => Date.parse(`${d}T12:00:00Z`);
export const shiftDay = (d: string, n: number) => new Date(t(d) + n * DAY_MS).toISOString().slice(0, 10);
export function mondayOf(d: string): string {
  const wd = new Date(t(d)).getUTCDay();
  return shiftDay(d, -((wd + 6) % 7));
}

export interface StreakInfo {
  /** Dias ativos seguidos (descansos não somam, mas não quebram). */
  days: number;
  /** Hoje já conta? Se não, a ofensiva ainda está viva até o fim do dia. */
  todayDone: boolean;
  /** Descanso grátis da semana já usado? */
  weekRestUsed: boolean;
  /** Descansos extras (do baú) ainda guardados. */
  extraRests: number;
  /** Dias em que o descanso foi usado (dentro da ofensiva atual). */
  restDays: string[];
  best: number;
}

/**
 * Ofensiva: dia ativo = ganhou pontos no dia. Cada semana (seg–dom) tem 1 dia de descanso grátis
 * que não quebra a sequência; descansos extras do baú cobrem faltas a mais.
 * Proposta do Ritmo: constância sem culpa — um dia ruim não apaga o esforço.
 */
export function computeStreak(activeDays: Set<string>, today: string, extraRestsEarned: string[] = [], since?: string | null): StreakInfo {
  const todayDone = activeDays.has(today);
  const earned = extraRestsEarned.filter((d) => d <= today).sort();
  const restDays: string[] = [];
  const weeksUsed = new Set<string>();
  let usedExtra = 0;
  let days = todayDone ? 1 : 0;
  let d = shiftDay(today, -1);
  const floor = since || '2000-01-01';
  for (let i = 0; i < 3650 && d >= floor; i++, d = shiftDay(d, -1)) {
    if (activeDays.has(d)) {
      days++;
      continue;
    }
    // falta: tenta um descanso (só se ainda houver dias ativos antes, senão a ofensiva acabou)
    let hasEarlier = false;
    for (let k = 1; k <= 7; k++) if (activeDays.has(shiftDay(d, -k))) hasEarlier = true;
    if (!hasEarlier) break;
    const wk = mondayOf(d);
    if (!weeksUsed.has(wk)) {
      weeksUsed.add(wk);
      restDays.push(d);
      continue;
    }
    // descanso extra: só os ganhos ANTES da falta
    const available = earned.filter((e) => e < d).length - usedExtra;
    if (available > 0) {
      usedExtra++;
      restDays.push(d);
      continue;
    }
    break;
  }
  if (days === 0) restDays.length = 0;
  const best = Math.max(days, longestRun(activeDays));
  return { days, todayDone, weekRestUsed: weeksUsed.has(mondayOf(today)), extraRests: Math.max(0, earned.length - usedExtra), restDays, best };
}

function longestRun(active: Set<string>): number {
  const list = [...active].sort();
  let best = 0;
  let run = 0;
  let prev = '';
  for (const d of list) {
    run = prev && shiftDay(prev, 1) === d ? run + 1 : 1;
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100, 180, 365];
export function nextMilestone(days: number): number | null {
  return STREAK_MILESTONES.find((m) => m > days) ?? null;
}

/* ---------------- Resumo da semana ---------------- */

export interface WeekSummary {
  start: string;
  end: string;
  xp: number;
  activeDays: number;
  counts: Partial<Record<XpSource, number>>;
  bestDay: { day: string; xp: number } | null;
  /** Diferença de pontos para a semana anterior (em %), quando dá para comparar. */
  vsPrevious: number | null;
}

export function weekSummary(days: Record<string, { xp: number; raw: Partial<Record<XpSource, number>> }>, weekStart: string): WeekSummary {
  const sum = (start: string) => {
    let xp = 0;
    let active = 0;
    const counts: Partial<Record<XpSource, number>> = {};
    let best: { day: string; xp: number } | null = null;
    for (let i = 0; i < 7; i++) {
      const d = shiftDay(start, i);
      const row = days[d];
      if (!row) continue;
      xp += row.xp;
      if (row.xp > 0) active++;
      for (const [k, v] of Object.entries(row.raw)) counts[k as XpSource] = (counts[k as XpSource] || 0) + (v || 0);
      if (!best || row.xp > best.xp) best = { day: d, xp: row.xp };
    }
    return { xp, active, counts, best };
  };
  const cur = sum(weekStart);
  const prev = sum(shiftDay(weekStart, -7));
  return {
    start: weekStart,
    end: shiftDay(weekStart, 6),
    xp: cur.xp,
    activeDays: cur.active,
    counts: cur.counts,
    bestDay: cur.best && cur.best.xp > 0 ? cur.best : null,
    vsPrevious: prev.xp > 0 ? Math.round(((cur.xp - prev.xp) / prev.xp) * 100) : null,
  };
}

/* ---------------- Ligas semanais ---------------- */

export const LEAGUES = [
  { tier: 0, name: 'Bronze', color: '#b8743a' },
  { tier: 1, name: 'Prata', color: '#9aa4ae' },
  { tier: 2, name: 'Ouro', color: '#d69e2e' },
  { tier: 3, name: 'Safira', color: '#3b82f6' },
  { tier: 4, name: 'Esmeralda', color: '#10b981' },
  { tier: 5, name: 'Diamante', color: '#22d3ee' },
] as const;
export const LEAGUE_GROUP_SIZE = 20;
export const PROMOTE = 5;
export const DEMOTE = 5;

export const leagueName = (tier: number) => LEAGUES[Math.min(Math.max(0, tier), LEAGUES.length - 1)].name;

/**
 * Nova liga depois que a semana termina. Sobem os 5 primeiros (com pontos), descem os 5 últimos
 * só em grupos com pelo menos 10 pessoas — e quem fez zero ponto na semana não sobe.
 */
export function nextTier(tier: number, rank: number, groupSize: number, xp: number): number {
  const top = LEAGUES.length - 1;
  if (xp > 0 && rank <= PROMOTE && tier < top) return tier + 1;
  if (groupSize >= 10 && rank > groupSize - DEMOTE && tier > 0) return tier - 1;
  return tier;
}

export function rankInGroup<T extends { userId: number; xp: number }>(rows: T[], userId: number): { rank: number; size: number } {
  const sorted = rows.slice().sort((a, b) => b.xp - a.xp || a.userId - b.userId);
  return { rank: sorted.findIndex((r) => r.userId === userId) + 1, size: sorted.length };
}
