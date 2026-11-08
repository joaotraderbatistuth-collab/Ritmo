// Desafios em dupla ou trio: "você e a Ana: 5 dias de treino nesta semana". Regras PURAS e testadas.
// O progresso vem sempre dos dados reais de cada pessoa (ninguém marca nada à mão).

export type ChallengeKind = 'treino' | 'habito' | 'foco' | 'tarefa' | 'diario' | 'pontos';

export const CHALLENGE_KINDS: { id: ChallengeKind; emoji: string; label: string; unit: string; per7: number }[] = [
  { id: 'treino', emoji: '👟', label: 'Dias de treino', unit: 'dias de treino', per7: 4 },
  { id: 'habito', emoji: '💧', label: 'Hábitos marcados', unit: 'hábitos', per7: 14 },
  { id: 'foco', emoji: '🎯', label: 'Sessões de foco', unit: 'sessões de foco', per7: 7 },
  { id: 'tarefa', emoji: '✅', label: 'Tarefas concluídas', unit: 'tarefas', per7: 15 },
  { id: 'diario', emoji: '📓', label: 'Check-ins no diário', unit: 'check-ins', per7: 6 },
  { id: 'pontos', emoji: '⚡', label: 'Pontos de Ritmo', unit: 'pontos', per7: 300 },
];

export const CHALLENGE_DURATIONS = [3, 7, 14, 30] as const;
export const CHALLENGE_MAX_MEMBERS = 3;
export const CHALLENGE_MAX_ACTIVE = 3;
/** Pontos para quem cumpre a própria meta do desafio (até 2 por dia). */
export const CHALLENGE_XP = 50;

export const isChallengeKind = (v: unknown): v is ChallengeKind => typeof v === 'string' && CHALLENGE_KINDS.some((k) => k.id === v);
export const kindDef = (k: ChallengeKind) => CHALLENGE_KINDS.find((x) => x.id === k)!;

/** Meta sugerida para a duração (proporcional à semana, arredondada). Treino nunca passa do nº de dias. */
export function suggestedTarget(kind: ChallengeKind, days: number): number {
  const raw = Math.max(1, Math.round((kindDef(kind).per7 * days) / 7));
  if (kind === 'treino' || kind === 'diario') return Math.min(raw, days);
  if (kind === 'pontos') return Math.max(50, Math.round(raw / 10) * 10);
  return raw;
}

/** Limites da meta para não virar coisa impossível (nem trivial demais). */
export function clampTarget(kind: ChallengeKind, days: number, target: number): number {
  const t = Math.round(Number(target) || 0);
  const max = kind === 'treino' || kind === 'diario' ? days : kind === 'pontos' ? 400 * days : kindDef(kind).per7 * 4 * Math.ceil(days / 7);
  return Math.max(1, Math.min(max, t || suggestedTarget(kind, days)));
}

export function addDaysYmd(day: string, n: number): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

type Days = Record<string, { xp: number; raw: Record<string, number | undefined> }>;

/** Quanto a pessoa fez no período (de start a end, sem passar de hoje) e em que dia bateu a meta. */
export function challengeProgress(kind: ChallengeKind, days: Days, start: string, end: string, today: string, target: number): { value: number; doneDay: string | null } {
  let value = 0;
  let doneDay: string | null = null;
  const last = end < today ? end : today;
  for (let d = start; d <= last; d = addDaysYmd(d, 1)) {
    const row = days[d];
    if (row) {
      if (kind === 'treino') value += (row.raw.treino || 0) > 0 ? 1 : 0;
      else if (kind === 'pontos') value += Math.max(0, row.xp || 0);
      else value += row.raw[kind] || 0;
    }
    if (!doneDay && value >= target) doneDay = d;
  }
  return { value, doneDay };
}

export type ChallengeStatus = 'upcoming' | 'active' | 'ended';

export function challengeStatus(start: string, end: string, today: string): ChallengeStatus {
  if (today < start) return 'upcoming';
  if (today > end) return 'ended';
  return 'active';
}

/** Frase de incentivo do desafio, sempre do ponto de vista de quem está vendo. */
export function challengeNudge(kind: ChallengeKind, target: number, me: { value: number } | null, others: { name: string; value: number }[], daysLeft: number): string {
  const unit = kindDef(kind).unit;
  if (!me) return '';
  if (me.value >= target) {
    const behind = others.filter((o) => o.value < target);
    return behind.length ? `Você já cumpriu! Dê uma força para ${behind.map((b) => b.name).join(' e ')}.` : 'Todo mundo cumpriu. Que time!';
  }
  const left = target - me.value;
  const leader = others.slice().sort((a, b) => b.value - a.value)[0];
  if (leader && leader.value > me.value) return `${leader.name} está na frente. Faltam ${left} ${unit} para você cumprir${daysLeft ? ` em ${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'}` : ''}.`;
  return `Faltam ${left} ${unit}${daysLeft ? ` em ${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'}` : ''}. Você está puxando o grupo!`;
}

/** Código curto e fácil de digitar para o link do convite. */
export function challengeCode(rand: () => number = Math.random): string {
  const A = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 7; i++) s += A[Math.floor(rand() * A.length)];
  return s;
}

export const isChallengeCode = (v: unknown): v is string => typeof v === 'string' && /^[A-HJ-NP-Z2-9]{7}$/.test(v);
