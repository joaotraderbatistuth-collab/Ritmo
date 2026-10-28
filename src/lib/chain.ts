// "Não Quebre a Corrente" — lógica PURA (sem banco, sem React), testada em tests/.
// A corrente não conta dias seguidos: conta SEMANAS seguidas em que a pessoa cumpriu
// a frequência que ela mesma escolheu para o hábito (3x, 5x ou todos os dias).

export type ChainFrequency = 'diario' | '5x_semana' | '3x_semana';

/** Dia em que a semana começa: 1 = segunda-feira, 0 = domingo. Troque aqui se preferir. */
export const WEEK_STARTS_ON = 1;

export function targetPerWeek(freq: string): number {
  if (freq === '3x_semana') return 3;
  if (freq === '5x_semana') return 5;
  return 7;
}

/** Data local (fuso do aparelho) no formato YYYY-MM-DD. Evita o erro do toISOString (UTC). */
export function localDateStr(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseLocal(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 12, 0, 0);
}

/** Primeiro dia da semana (YYYY-MM-DD) que contém a data informada. */
export function weekStartKey(dateStr: string): string {
  const dt = parseLocal(dateStr);
  const offset = (dt.getDay() - WEEK_STARTS_ON + 7) % 7;
  dt.setDate(dt.getDate() - offset);
  return localDateStr(dt);
}

export function addDays(dateStr: string, n: number): string {
  const dt = parseLocal(dateStr);
  dt.setDate(dt.getDate() + n);
  return localDateStr(dt);
}

export interface ChainInput {
  targetFrequency: string;
  /** Quando o hábito foi criado (ISO ou YYYY-MM-DD). Semanas anteriores não contam. */
  createdAt?: string | null;
  logs: { date: string; completed: boolean }[];
  /** YYYY-MM-DD de hoje (data local). */
  today: string;
}

export interface ChainResult {
  target: number;
  doneThisWeek: number;
  /** Semanas seguidas com a meta cumprida (inclui a semana atual se já cumpriu). */
  chain: number;
  metThisWeek: boolean;
  /** Dias que ainda restam na semana, contando hoje. */
  daysLeftThisWeek: number;
  /** Quantas faltam para fechar a meta desta semana. */
  missingThisWeek: number;
  /** Semanas já encerradas, da mais antiga para a mais recente (até 12): cumpriu ou não. */
  recentWeeks: boolean[];
}

export function computeChain(input: ChainInput): ChainResult {
  const target = targetPerWeek(input.targetFrequency);
  const curWeek = weekStartKey(input.today);

  // dias concluídos por semana (datas únicas)
  const byWeek = new Map<string, Set<string>>();
  for (const l of input.logs) {
    if (!l.completed || !l.date) continue;
    const wk = weekStartKey(l.date);
    if (!byWeek.has(wk)) byWeek.set(wk, new Set());
    byWeek.get(wk)!.add(l.date);
  }
  const count = (wk: string) => byWeek.get(wk)?.size ?? 0;

  // primeira semana a considerar: a do hábito (ou a do primeiro registro, o que for mais antigo)
  const createdDate = input.createdAt ? localDateStr(new Date(input.createdAt)) : null;
  let first = createdDate && !isNaN(parseLocal(createdDate).getTime()) ? weekStartKey(createdDate) : curWeek;
  for (const wk of byWeek.keys()) if (wk < first) first = wk;
  if (first > curWeek) first = curWeek;

  // semanas encerradas (antes da atual), da mais antiga para a mais recente
  const closed: boolean[] = [];
  for (let wk = first; wk < curWeek; wk = addDays(wk, 7)) {
    closed.push(count(wk) >= target);
  }

  // corrente = sequência de semanas cumpridas terminando na última semana encerrada
  let chain = 0;
  for (let i = closed.length - 1; i >= 0 && closed[i]; i--) chain++;

  const doneThisWeek = count(curWeek);
  const metThisWeek = doneThisWeek >= target;
  if (metThisWeek) chain++; // semana em andamento nunca "quebra" antes de acabar; só soma quando cumprida

  const offset = (parseLocal(input.today).getDay() - WEEK_STARTS_ON + 7) % 7;
  return {
    target,
    doneThisWeek,
    chain,
    metThisWeek,
    daysLeftThisWeek: 7 - offset,
    missingThisWeek: Math.max(0, target - doneThisWeek),
    recentWeeks: closed.slice(-12),
  };
}
