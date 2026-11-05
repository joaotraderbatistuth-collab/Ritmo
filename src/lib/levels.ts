// Pontos de Ritmo (XP), níveis e molduras do perfil. Regras PURAS, testadas em tests/.
//
// O XP é calculado a partir do que a pessoa realmente fez (hábitos, tarefas, foco, diário,
// finanças e Feed). Não existe "saldo" que possa ser editado: desmarcar um hábito tira os pontos.
//
// Cada tipo de ação tem um LIMITE POR DIA. Isso segue a proposta do Ritmo (constância sem
// extremismos): fazer 40 tarefas num dia não vale mais do que manter o ritmo vários dias seguidos.

export type XpSource = 'habito' | 'tarefa' | 'foco' | 'treino' | 'diario' | 'revisao' | 'financas' | 'post' | 'comentario';

export const XP_RULES: Record<XpSource, { xp: number; dailyCap: number; label: string }> = {
  habito: { xp: 10, dailyCap: 6, label: 'Hábito marcado' },
  tarefa: { xp: 5, dailyCap: 10, label: 'Tarefa concluída' },
  foco: { xp: 15, dailyCap: 6, label: 'Sessão de foco concluída' },
  treino: { xp: 20, dailyCap: 2, label: 'Treino registrado' },
  diario: { xp: 15, dailyCap: 1, label: 'Check-in no diário' },
  revisao: { xp: 30, dailyCap: 1, label: 'Revisão semanal' },
  financas: { xp: 3, dailyCap: 5, label: 'Lançamento nas finanças' },
  post: { xp: 5, dailyCap: 3, label: 'Publicação no Feed' },
  comentario: { xp: 2, dailyCap: 5, label: 'Comentário no Feed' },
};

export const XP_SOURCES = Object.keys(XP_RULES) as XpSource[];

/** Máximo de pontos possíveis num único dia (somando todos os limites). */
export const XP_DAILY_MAX = XP_SOURCES.reduce((a, k) => a + XP_RULES[k].xp * XP_RULES[k].dailyCap, 0);

export type FrameId = 'simples' | 'bronze' | 'prata' | 'ouro' | 'diamante' | 'lendaria';

export interface FrameStyle {
  id: FrameId;
  name: string;
  /** Cores do anel (gradiente cônico). */
  colors: string[];
  /** Cor do selo com o número do nível. */
  badge: string;
  /** Moldura com brilho girando. */
  animated: boolean;
}

export const FRAMES: Record<FrameId, FrameStyle> = {
  simples: { id: 'simples', name: 'Simples', colors: ['#30363d', '#484f58', '#30363d'], badge: '#484f58', animated: false },
  bronze: { id: 'bronze', name: 'Bronze', colors: ['#8a4b1f', '#e0a26a', '#a8622c', '#f1c08e', '#8a4b1f'], badge: '#b8743a', animated: false },
  prata: { id: 'prata', name: 'Prata', colors: ['#7d8590', '#f0f6fc', '#9aa4ae', '#ffffff', '#7d8590'], badge: '#8b949e', animated: false },
  ouro: { id: 'ouro', name: 'Ouro', colors: ['#b7791f', '#fde68a', '#d69e2e', '#fff7c2', '#b7791f'], badge: '#d69e2e', animated: false },
  diamante: { id: 'diamante', name: 'Diamante', colors: ['#06b6d4', '#a5f3fc', '#818cf8', '#e0f2fe', '#06b6d4'], badge: '#0891b2', animated: true },
  lendaria: { id: 'lendaria', name: 'Lendária', colors: ['#f43f5e', '#f59e0b', '#10b981', '#3b82f6', '#a855f7', '#f43f5e'], badge: '#a855f7', animated: true },
};

export interface LevelDef {
  level: number;
  name: string;
  minXp: number;
  frame: FrameId;
  /** O que a pessoa ganha ao chegar neste nível. */
  unlock: string;
}

export const LEVELS: LevelDef[] = [
  { level: 1, name: 'Semente', minXp: 0, frame: 'simples', unlock: 'Seu perfil com foto' },
  { level: 2, name: 'Broto', minXp: 100, frame: 'simples', unlock: 'Selo de nível no Feed' },
  { level: 3, name: 'Iniciante', minXp: 300, frame: 'bronze', unlock: 'Moldura Bronze' },
  { level: 4, name: 'Constante', minXp: 600, frame: 'bronze', unlock: 'Título "Constante" no Feed' },
  { level: 5, name: 'Focado', minXp: 1000, frame: 'prata', unlock: 'Moldura Prata' },
  { level: 6, name: 'Disciplinado', minXp: 1600, frame: 'prata', unlock: 'Título "Disciplinado" no Feed' },
  { level: 7, name: 'Determinado', minXp: 2500, frame: 'ouro', unlock: 'Moldura Ouro' },
  { level: 8, name: 'Inabalável', minXp: 3700, frame: 'ouro', unlock: 'Título "Inabalável" no Feed' },
  { level: 9, name: 'Inspirador', minXp: 5300, frame: 'diamante', unlock: 'Moldura Diamante com brilho' },
  { level: 10, name: 'Mestre do Ritmo', minXp: 7500, frame: 'diamante', unlock: 'Título "Mestre do Ritmo" no Feed' },
  { level: 11, name: 'Lenda do Ritmo', minXp: 10500, frame: 'lendaria', unlock: 'Moldura Lendária animada' },
  { level: 12, name: 'Lenda Eterna', minXp: 15000, frame: 'lendaria', unlock: 'O título mais alto do Ritmo' },
];

export const MAX_LEVEL = LEVELS[LEVELS.length - 1].level;

export interface LevelInfo {
  level: number;
  name: string;
  xp: number;
  minXp: number;
  /** XP do próximo nível (null no nível máximo). */
  nextXp: number | null;
  nextName: string | null;
  /** Quanto falta para o próximo nível (0 no máximo). */
  xpToNext: number;
  /** 0 a 1 dentro do nível atual. */
  progress: number;
  frame: FrameStyle;
}

export function levelDef(level: number): LevelDef {
  const n = Math.min(Math.max(Math.floor(Number(level) || 1), 1), MAX_LEVEL);
  return LEVELS[n - 1];
}

export function levelInfo(rawXp: number): LevelInfo {
  const xp = Math.max(0, Math.floor(Number(rawXp) || 0));
  let cur = LEVELS[0];
  for (const l of LEVELS) if (xp >= l.minXp) cur = l;
  const next = LEVELS[cur.level] || null;
  const span = next ? next.minXp - cur.minXp : 1;
  return {
    level: cur.level,
    name: cur.name,
    xp,
    minXp: cur.minXp,
    nextXp: next ? next.minXp : null,
    nextName: next ? next.name : null,
    xpToNext: next ? next.minXp - xp : 0,
    progress: next ? Math.min(1, (xp - cur.minXp) / span) : 1,
    frame: FRAMES[cur.frame],
  };
}

export function frameForLevel(level: number): FrameStyle {
  return FRAMES[levelDef(level).frame];
}

/* ---------------- Cálculo do XP ---------------- */

export interface XpInput {
  habitLogs: { date: string; completed: boolean }[];
  tasks: { date: string; completed: boolean; completedAt?: string | null }[];
  sessions: { date: string; status: string }[];
  journal: { date: string; entryType: string }[];
  transactions: { date: string; createdAt?: string | null }[];
  /** Dia (YYYY-MM-DD) de cada treino. */
  workouts?: { date: string }[];
  posts: { createdAt: string }[];
  comments: { createdAt: string }[];
  /** Data de criação da conta (YYYY-MM-DD). Nada antes dela conta, para não "inventar" passado. */
  since?: string | null;
  /** Pontos extras do baú das missões (um por dia). */
  bonus?: { day: string; xp: number }[];
  /** Hoje (YYYY-MM-DD) no fuso da pessoa. Nada depois de hoje conta. */
  today: string;
}

export interface XpResult {
  total: number;
  todayXp: number;
  breakdown: Record<XpSource, { count: number; xp: number }>;
  /** Dias diferentes em que a pessoa ganhou pontos. */
  activeDays: number;
  /** Pontos extras do baú (já somados no total). */
  bonusXp: number;
  /** Dia a dia: pontos e quantas vezes fez cada coisa (sem o limite diário). */
  days: Record<string, { xp: number; raw: Partial<Record<XpSource, number>> }>;
}

const ymd = (v: string | null | undefined) => String(v || '').slice(0, 10);
const validDay = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d);

export function computeXp(input: XpInput): XpResult {
  const since = input.since && validDay(ymd(input.since)) ? ymd(input.since) : '0000-00-00';
  const today = input.today;
  // contagem por fonte e por dia
  const perDay = new Map<string, Map<XpSource, number>>();
  const add = (src: XpSource, rawDay: string | null | undefined) => {
    const day = ymd(rawDay);
    if (!validDay(day) || day < since || day > today) return;
    let m = perDay.get(day);
    if (!m) perDay.set(day, (m = new Map()));
    m.set(src, (m.get(src) || 0) + 1);
  };

  for (const l of input.habitLogs) if (l.completed) add('habito', l.date);
  for (const t of input.tasks) if (t.completed) add('tarefa', t.completedAt ? t.completedAt : t.date);
  for (const s of input.sessions) if (s.status === 'completed') add('foco', s.date);
  for (const j of input.journal) add(j.entryType === 'weekly_review' ? 'revisao' : 'diario', j.date);
  for (const tx of input.transactions) add('financas', tx.createdAt || tx.date);
  for (const w of input.workouts || []) add('treino', w.date);
  for (const p of input.posts) add('post', p.createdAt);
  for (const c of input.comments) add('comentario', c.createdAt);

  const breakdown = Object.fromEntries(XP_SOURCES.map((k) => [k, { count: 0, xp: 0 }])) as XpResult['breakdown'];
  let total = 0;
  let todayXp = 0;
  let activeDays = 0;
  for (const [day, m] of perDay) {
    let dayXp = 0;
    for (const [src, n] of m) {
      const rule = XP_RULES[src];
      const counted = Math.min(n, rule.dailyCap);
      breakdown[src].count += counted;
      breakdown[src].xp += counted * rule.xp;
      dayXp += counted * rule.xp;
    }
    total += dayXp;
    if (dayXp > 0) activeDays++;
    if (day === today) todayXp = dayXp;
  }
  const days: XpResult['days'] = {};
  for (const [day, m] of perDay) {
    let dayXp = 0;
    const raw: Partial<Record<XpSource, number>> = {};
    for (const [src, n] of m) {
      raw[src] = n;
      dayXp += Math.min(n, XP_RULES[src].dailyCap) * XP_RULES[src].xp;
    }
    days[day] = { xp: dayXp, raw };
  }
  let bonusXp = 0;
  const bonusDays = new Set<string>();
  for (const b of input.bonus || []) {
    const day = ymd(b.day);
    if (!validDay(day) || day < since || day > today || bonusDays.has(day)) continue;
    const xp = Math.max(0, Math.min(100, Math.floor(Number(b.xp) || 0)));
    bonusDays.add(day);
    bonusXp += xp;
    (days[day] ||= { xp: 0, raw: {} }).xp += xp;
    if (day === today) todayXp += xp;
  }
  return { total: total + bonusXp, todayXp, breakdown, activeDays, bonusXp, days };
}
