import { luckyDrop } from './rewards.js';
// Pontos de Ritmo (XP), níveis e molduras do perfil. Regras PURAS, testadas em tests/.
//
// O XP é calculado a partir do que a pessoa realmente fez (hábitos, tarefas, foco, diário,
// finanças e Feed). Não existe "saldo" que possa ser editado: desmarcar um hábito tira os pontos.
//
// Cada tipo de ação tem um LIMITE POR DIA. Isso segue a proposta do Ritmo (constância sem
// extremismos): fazer 40 tarefas num dia não vale mais do que manter o ritmo vários dias seguidos.

export type XpSource =
  | 'habito'
  | 'habito_novo'
  | 'tarefa'
  | 'tarefa_nova'
  | 'foco'
  | 'treino'
  | 'constancia'
  | 'meta'
  | 'marco'
  | 'card'
  | 'lembrete_novo'
  | 'diario'
  | 'revisao'
  | 'financas'
  | 'orcamento'
  | 'post'
  | 'comentario'
  | 'curtida'
  | 'seguir'
  | 'perfil';

/**
 * Tudo no Ritmo vale ponto: coisas simples valem pouco, coisas que pedem mais esforço valem mais.
 * `display` é o texto do valor quando ele varia (foco pelo tempo, constância pelo dia da semana).
 */
export const XP_RULES: Record<XpSource, { xp: number; dailyCap: number; label: string; display?: string }> = {
  habito: { xp: 10, dailyCap: 6, label: 'Hábito marcado' },
  habito_novo: { xp: 5, dailyCap: 2, label: 'Hábito novo criado' },
  tarefa: { xp: 5, dailyCap: 10, label: 'Tarefa concluída' },
  tarefa_nova: { xp: 2, dailyCap: 5, label: 'Tarefa planejada' },
  foco: { xp: 15, dailyCap: 6, label: 'Sessão de foco (vale mais quanto mais longa)', display: '5 a 30' },
  treino: { xp: 20, dailyCap: 1, label: 'Dia de treino' },
  constancia: { xp: 20, dailyCap: 1, label: 'Constância no treino (2º ao 5º dia na semana)', display: '5 a 20' },
  meta: { xp: 40, dailyCap: 1, label: 'Ciclo de foco (meta) iniciado' },
  marco: { xp: 25, dailyCap: 2, label: 'Marco do roteiro concluído' },
  card: { xp: 3, dailyCap: 5, label: 'Card criado nos Quadros' },
  lembrete_novo: { xp: 2, dailyCap: 5, label: 'Lembrete criado' },
  diario: { xp: 15, dailyCap: 1, label: 'Check-in no diário' },
  revisao: { xp: 30, dailyCap: 1, label: 'Revisão semanal' },
  financas: { xp: 3, dailyCap: 5, label: 'Lançamento nas finanças' },
  orcamento: { xp: 5, dailyCap: 2, label: 'Orçamento definido' },
  post: { xp: 5, dailyCap: 3, label: 'Publicação no Feed' },
  comentario: { xp: 2, dailyCap: 5, label: 'Comentário no Feed' },
  curtida: { xp: 1, dailyCap: 10, label: 'Curtida no Feed' },
  seguir: { xp: 2, dailyCap: 5, label: 'Pessoa seguida' },
  perfil: { xp: 30, dailyCap: 1, label: 'Pesquisa de gostos respondida (uma vez)' },
};

export const XP_SOURCES = Object.keys(XP_RULES) as XpSource[];

/** Pontos de uma sessão de foco pelo tempo: 25 min = 15, 50 min = 30 (de 5 a 30). */
export const focusXp = (minutes: number | null | undefined) => Math.max(5, Math.min(30, Math.round((Number(minutes) || 25) * 0.6)));

/** Bônus de constância: o 2º dia de treino da semana vale +5, o 3º +10, o 4º +15 e do 5º em diante +20.
 *  O que conta é treinar em dias diferentes, não a distância nem o tempo. */
export const CONSTANCY_BONUS = [0, 5, 10, 15, 20, 20, 20];

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
  tasks: { date: string; completed: boolean; completedAt?: string | null; createdAt?: string | null }[];
  sessions: { date: string; status: string; durationMinutes?: number | null }[];
  journal: { date: string; entryType: string }[];
  transactions: { date: string; createdAt?: string | null }[];
  /** Dia (YYYY-MM-DD) de cada treino. */
  workouts?: { date: string }[];
  posts: { createdAt: string }[];
  comments: { createdAt: string }[];
  /** Data de criação da conta (YYYY-MM-DD). Nada antes dela conta, para não "inventar" passado. */
  since?: string | null;
  /** Outras ações que valem ponto, cada uma com o dia em que aconteceu (hábito criado, card, curtida...). */
  events?: { src: XpSource; day: string | null | undefined }[];
  /** Pontos extras do baú das missões (um por dia). */
  bonus?: { day: string; xp: number }[];
  /** Hoje (YYYY-MM-DD) no fuso da pessoa. Nada depois de hoje conta. */
  today: string;
  /** Id da pessoa: sorteia o bônus surpresa do dia (sem ele, não há bônus surpresa). */
  seed?: number;
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
  /** Pontos dos bônus surpresa (já somados no total). */
  luckyXp: number;
  /** Bônus surpresa de hoje: só diz o valor depois que saiu (o momento é segredo). */
  luckyToday: { hit: boolean; xp: number | null } | null;
}

const ymd = (v: string | null | undefined) => String(v || '').slice(0, 10);
const validDay = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d);
/** Segunda-feira da semana do dia (YYYY-MM-DD). */
const mondayKey = (d: string) => {
  const t = new Date(`${d}T12:00:00Z`);
  t.setUTCDate(t.getUTCDate() - ((t.getUTCDay() + 6) % 7));
  return t.toISOString().slice(0, 10);
};

export function computeXp(input: XpInput): XpResult {
  const since = input.since && validDay(ymd(input.since)) ? ymd(input.since) : '0000-00-00';
  const today = input.today;
  // pontos de cada ação, por fonte e por dia (o limite diário fica com as que valem mais)
  const perDay = new Map<string, Map<XpSource, number[]>>();
  const add = (src: XpSource, rawDay: string | null | undefined, xp: number = XP_RULES[src].xp) => {
    const day = ymd(rawDay);
    if (!validDay(day) || day < since || day > today) return;
    let m = perDay.get(day);
    if (!m) perDay.set(day, (m = new Map()));
    const list = m.get(src);
    if (list) list.push(xp);
    else m.set(src, [xp]);
  };

  for (const l of input.habitLogs) if (l.completed) add('habito', l.date);
  for (const t of input.tasks) {
    if (t.completed) add('tarefa', t.completedAt ? t.completedAt : t.date);
    if (t.createdAt) add('tarefa_nova', t.createdAt);
  }
  for (const s of input.sessions) if (s.status === 'completed') add('foco', s.date, focusXp(s.durationMinutes));
  for (const j of input.journal) add(j.entryType === 'weekly_review' ? 'revisao' : 'diario', j.date);
  for (const tx of input.transactions) add('financas', tx.createdAt || tx.date);
  for (const w of input.workouts || []) add('treino', w.date);
  for (const p of input.posts) add('post', p.createdAt);
  for (const c of input.comments) add('comentario', c.createdAt);
  for (const e of input.events || []) if (XP_RULES[e.src] && e.src !== 'constancia' && e.src !== 'foco') add(e.src, e.day);

  // constância no treino: o N-ésimo dia de treino da semana (segunda a domingo) ganha bônus
  const trainingDays = [...perDay.entries()].filter(([, m]) => m.has('treino')).map(([d]) => d).sort();
  const nthInWeek = new Map<string, number>();
  for (const d of trainingDays) {
    const wk = mondayKey(d);
    const n = (nthInWeek.get(wk) || 0) + 1;
    nthInWeek.set(wk, n);
    const bonus = CONSTANCY_BONUS[Math.min(n, CONSTANCY_BONUS.length) - 1];
    if (bonus > 0) add('constancia', d, bonus);
  }

  const breakdown = Object.fromEntries(XP_SOURCES.map((k) => [k, { count: 0, xp: 0 }])) as XpResult['breakdown'];
  let total = 0;
  let todayXp = 0;
  let activeDays = 0;
  const days: XpResult['days'] = {};
  for (const [day, m] of perDay) {
    let dayXp = 0;
    const raw: Partial<Record<XpSource, number>> = {};
    for (const [src, list] of m) {
      raw[src] = list.length;
      const counted = list.slice().sort((a, b) => b - a).slice(0, XP_RULES[src].dailyCap);
      const xp = counted.reduce((a, v) => a + v, 0);
      breakdown[src].count += counted.length;
      breakdown[src].xp += xp;
      dayXp += xp;
    }
    total += dayXp;
    if (dayXp > 0) activeDays++;
    if (day === today) todayXp = dayXp;
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
  // Bônus surpresa: sai na N-ésima ação que CONTA no dia (dentro dos limites diários)
  let luckyXp = 0;
  let luckyToday: XpResult['luckyToday'] = null;
  if (input.seed) {
    for (const [day, m] of perDay) {
      const drop = luckyDrop(input.seed, day);
      if (!drop) continue;
      let counted = 0;
      for (const [src, list] of m) if (src !== 'constancia') counted += Math.min(list.length, XP_RULES[src].dailyCap);
      const hit = counted >= drop.at;
      if (hit) {
        luckyXp += drop.xp;
        days[day].xp += drop.xp;
        if (day === today) todayXp += drop.xp;
      }
      if (day === today) luckyToday = { hit, xp: hit ? drop.xp : null };
    }
    if (!luckyToday && luckyDrop(input.seed, today)) luckyToday = { hit: false, xp: null };
  }
  return { total: total + bonusXp + luckyXp, todayXp, breakdown, activeDays, bonusXp, days, luckyXp, luckyToday };
}
