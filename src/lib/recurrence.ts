// Lembretes que se repetem ("toda segunda", "todo dia", "dia 10 de todo mês"). Regras PURAS, testadas em tests/.
//
// Formato guardado no banco (coluna reminders.repeat):
//   'daily'            → todo dia
//   'weekly:1,3'       → nos dias da semana listados (0 = domingo ... 6 = sábado)
//   'monthly:10'       → todo dia 10 (em meses curtos, no último dia)

const WD_NAMES = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const WD_FOLD: Record<string, number> = { domingo: 0, segunda: 1, terca: 2, quarta: 3, quinta: 4, sexta: 5, sabado: 6 };

export type Repeat = string;

export function isValidRepeat(r: unknown): r is Repeat {
  if (typeof r !== 'string') return false;
  if (r === 'daily') return true;
  const w = /^weekly:([0-6](?:,[0-6]){0,6})$/.exec(r);
  if (w) return new Set(w[1].split(',')).size === w[1].split(',').length;
  const m = /^monthly:(\d{1,2})$/.exec(r);
  return !!m && Number(m[1]) >= 1 && Number(m[1]) <= 31;
}

export function weeklyDays(r: Repeat): number[] {
  const m = /^weekly:(.+)$/.exec(r);
  return m ? m[1].split(',').map(Number).sort((a, b) => a - b) : [];
}

export const weekly = (days: number[]) => `weekly:${[...new Set(days)].sort((a, b) => a - b).join(',')}`;

/** "todo dia", "toda segunda", "segunda a sexta", "toda segunda e quarta", "todo dia 10". */
export function repeatLabel(r: Repeat | null | undefined): string {
  if (!r || !isValidRepeat(r)) return '';
  if (r === 'daily') return 'todo dia';
  if (r.startsWith('monthly:')) return `todo dia ${Number(r.slice(8))}`;
  const d = weeklyDays(r);
  if (d.join() === '1,2,3,4,5') return 'de segunda a sexta';
  if (d.join() === '0,6') return 'todo fim de semana';
  if (d.length === 7) return 'todo dia';
  const names = d.map((x) => WD_NAMES[x]);
  const art = d.every((x) => x === 0 || x === 6) ? 'todo' : 'toda';
  return `${d.length === 1 && d[0] !== 0 && d[0] !== 6 ? 'toda' : art} ${names.length > 1 ? `${names.slice(0, -1).join(', ')} e ${names.at(-1)}` : names[0]}`;
}

/**
 * Procura uma regra de repetição no texto SEM acento e devolve a regra e o trecho para recortar.
 * `weekly:?` / `monthly:?` = "toda semana" / "todo mês" (o dia vem da data falada ou de hoje).
 */
export function findRepeat(n: string): { repeat: string; match: RegExp } | null {
  const WD = '(?:segunda|terca|quarta|quinta|sexta|sabado|domingo)s?(?:[- ]feiras?)?';
  const rules: [RegExp, (m: RegExpExecArray) => string | null][] = [
    [/\b(?:todos os dias uteis|todo dia util|(?:nos |em )?dias uteis|de segunda a sexta(?:[- ]feira)?)\b/, () => 'weekly:1,2,3,4,5'],
    [/\b(?:todo (?:fim|final) de semana|todos os fins de semana|nos fins de semana)\b/, () => 'weekly:0,6'],
    [/\b(?:(?:todo|cada) mes,? (?:no |todo )?dia|(?:todo|cada) dia) (\d{1,2})(?! ?h\b| ?horas?\b| da (?:manha|tarde|noite)| e meia)(?: de (?:todo|cada) mes)?\b/, (m) => (Number(m[1]) >= 1 && Number(m[1]) <= 31 ? `monthly:${Number(m[1])}` : null)],
    [/\b(?:no )?dia (\d{1,2}) de (?:todo|cada) mes\b/, (m) => (Number(m[1]) >= 1 && Number(m[1]) <= 31 ? `monthly:${Number(m[1])}` : null)],
    [new RegExp(`\\b(?:tod[oa]s? (?:as |os )?|cada |sempre (?:na |no |as |aos )?)${WD}(?:(?:,| e) (?:as |os |na |no )?${WD})*`), (m) => {
      const days = [...m[0].matchAll(/segunda|terca|quarta|quinta|sexta|sabado|domingo/g)].map((x) => WD_FOLD[x[0]]);
      return days.length ? weekly(days) : null;
    }],
    [/\b(?:todos os dias|todo santo dia|todo dia|diariamente|cada dia)\b/, () => 'daily'],
    [/\b(?:toda semana|todas as semanas|semanalmente|cada semana)\b/, () => 'weekly:?'],
    [/\b(?:todo mes|todos os meses|mensalmente|cada mes)\b/, () => 'monthly:?'],
  ];
  for (const [re, fn] of rules) {
    const m = re.exec(n);
    if (!m) continue;
    const repeat = fn(m);
    if (repeat) return { repeat, match: re };
  }
  return null;
}

/** Completa "weekly:?" / "monthly:?" com o dia da data (YYYY-MM-DD). */
export function settleRepeat(repeat: string, date: string): string {
  const d = new Date(`${date}T12:00:00Z`);
  if (repeat === 'weekly:?') return `weekly:${d.getUTCDay()}`;
  if (repeat === 'monthly:?') return `monthly:${d.getUTCDate()}`;
  return repeat;
}

const daysInMonth = (y: number, m0: number) => new Date(Date.UTC(y, m0 + 1, 0)).getUTCDate();

/** O dia (ano, mês 0-11, dia, dia da semana) bate com a regra? */
function matches(r: Repeat, y: number, m0: number, d: number, wd: number): boolean {
  if (r === 'daily') return true;
  if (r.startsWith('weekly:')) return weeklyDays(r).includes(wd);
  if (r.startsWith('monthly:')) return d === Math.min(Number(r.slice(8)), daysInMonth(y, m0));
  return false;
}

/** Primeira vez (no horário LOCAL do aparelho) a partir de agora. `time` = "HH:MM". */
export function firstOccurrence(r: Repeat, time: string, now: Date, fromDate?: string | null): Date | null {
  if (!isValidRepeat(r)) return null;
  const [h, mi] = time.split(':').map(Number);
  const start = fromDate ? new Date(Number(fromDate.slice(0, 4)), Number(fromDate.slice(5, 7)) - 1, Number(fromDate.slice(8, 10))) : new Date(now.getFullYear(), now.getMonth(), now.getDate());
  for (let i = 0; i < 400; i++) {
    const c = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i, h, mi);
    if (c.getTime() <= now.getTime()) continue;
    if (matches(r, c.getFullYear(), c.getMonth(), c.getDate(), c.getDay())) return c;
  }
  return null;
}

/** Diferença entre o relógio do fuso e o UTC, num instante (ms). */
export function tzOffsetMs(tz: string, at: Date): number {
  let f: Intl.DateTimeFormat;
  try {
    f = new Intl.DateTimeFormat('en-US', { timeZone: tz || 'America/Sao_Paulo', hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    f = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Sao_Paulo', hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
  const p = Object.fromEntries(f.formatToParts(at).map((x) => [x.type, x.value]));
  const asUtc = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), Number(p.hour) % 24, Number(p.minute), Number(p.second));
  return asUtc - Math.floor(at.getTime() / 1000) * 1000;
}

/**
 * Próxima vez de um lembrete repetido, no fuso da pessoa (o servidor roda em UTC).
 * Mantém o mesmo horário do relógio local e pula tudo o que já passou.
 */
export function nextOccurrence(r: Repeat, prev: Date, tz: string, now: Date): Date | null {
  if (!isValidRepeat(r)) return null;
  const off = tzOffsetMs(tz, prev);
  const wall = new Date(prev.getTime() + off); // relógio local lido em UTC
  const y = wall.getUTCFullYear();
  const m0 = wall.getUTCMonth();
  const d = wall.getUTCDate();
  const h = wall.getUTCHours();
  const mi = wall.getUTCMinutes();
  for (let i = 1; i < 800; i++) {
    const c = new Date(Date.UTC(y, m0, d + i, h, mi));
    if (!matches(r, c.getUTCFullYear(), c.getUTCMonth(), c.getUTCDate(), c.getUTCDay())) continue;
    let at = new Date(c.getTime() - tzOffsetMs(tz, new Date(c.getTime() - off)));
    // horário de verão: confere de novo com o deslocamento do próprio instante
    at = new Date(c.getTime() - tzOffsetMs(tz, at));
    if (at.getTime() > now.getTime()) return at;
  }
  return null;
}

/** Regras antigas das tarefas ('weekdays', 'weekly' sem dias) no formato atual. */
export function normalizeTaskRule(rule: string | null | undefined, date: string): Repeat | null {
  if (!rule) return null;
  if (rule === 'weekdays') return 'weekly:1,2,3,4,5';
  if (rule === 'weekly') return `weekly:${new Date(`${date}T12:00:00Z`).getUTCDay()}`;
  if (rule === 'monthly') return `monthly:${Number(date.slice(8, 10))}`;
  return isValidRepeat(rule) ? rule : null;
}

/** Próxima data (YYYY-MM-DD) DEPOIS de `date` que bate com a regra. Usada ao concluir uma tarefa que se repete. */
export function nextDateAfter(rule: string | null | undefined, date: string): string | null {
  const r = normalizeTaskRule(rule, date);
  if (!r) return null;
  const y = Number(date.slice(0, 4));
  const m0 = Number(date.slice(5, 7)) - 1;
  const d = Number(date.slice(8, 10));
  for (let i = 1; i < 800; i++) {
    const c = new Date(Date.UTC(y, m0, d + i));
    if (matches(r, c.getUTCFullYear(), c.getUTCMonth(), c.getUTCDate(), c.getUTCDay())) return c.toISOString().slice(0, 10);
  }
  return null;
}
