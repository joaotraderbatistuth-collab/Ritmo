// "Agenda de acordar" do servidor (economia de créditos da Netlify).
// O banco de dados cobra por hora acordado e só dorme depois de 5 minutos sem consultas.
// Por isso as funções agendadas leem um pequeno plano guardado no Netlify Blobs e só chamam o app
// (que acorda o banco) quando há trabalho de verdade:
//  - lembretes motivacionais: só nas horas (UTC) em que alguém escolheu receber;
//  - pontos da temporada: 2 vezes por dia (SEASON_UTC_HOURS);
//  - lembretes do secretário: só quando o próximo lembrete pendente já chegou.
// Se o plano não existir, estiver velho ou o Blobs falhar, tudo roda como antes (seguro).
// Regras puras, testadas em tests/ritmo.test.ts.

export const WAKE_STORE = 'ritmo-agenda';
export const WAKE_KEY = 'plano';
/** 12h e 0h UTC = 9h e 21h em Brasília. Também refazem o plano todo dia. */
export const SEASON_UTC_HOURS = [12, 0];
/** Plano mais velho que isto é ignorado (as horas da temporada o refazem 2x por dia). */
export const PLAN_MAX_AGE_MS = 26 * 3600_000;

export interface WakePlan {
  v: 1;
  /** Horas UTC (0–23) em que há alguém para receber o lembrete motivacional. */
  nudgeUtcHours: number[];
  /** Próximo lembrete do secretário pendente (ISO) ou null se não há nenhum. */
  nextReminderAt: string | null;
  updatedAt: string;
}

export function parsePlan(raw: unknown, now: Date = new Date()): WakePlan | null {
  let p: any = raw;
  if (typeof raw === 'string') {
    try {
      p = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!p || p.v !== 1 || !Array.isArray(p.nudgeUtcHours)) return null;
  const updated = Date.parse(p.updatedAt);
  if (!Number.isFinite(updated) || now.getTime() - updated > PLAN_MAX_AGE_MS || updated - now.getTime() > 3600_000) return null;
  const hours = p.nudgeUtcHours.filter((h: unknown) => Number.isInteger(h) && (h as number) >= 0 && (h as number) <= 23);
  const next = p.nextReminderAt && Number.isFinite(Date.parse(p.nextReminderAt)) ? String(p.nextReminderAt) : null;
  return { v: 1, nudgeUtcHours: hours, nextReminderAt: next, updatedAt: p.updatedAt };
}

/** Hora local (0–23) de um instante num fuso. */
export function localHour(at: Date, timeZone: string): number {
  try {
    const h = new Intl.DateTimeFormat('en-US', { timeZone, hour: '2-digit', hourCycle: 'h23' }).format(at);
    return Number(h) % 24;
  } catch {
    return localHour(at, 'America/Sao_Paulo');
  }
}

/**
 * Horas UTC em que alguém precisa do lembrete motivacional.
 * `subs`: horários locais já normalizados de cada inscrição + o fuso da pessoa.
 */
export function nudgeUtcHours(subs: { hours: number[]; timezone?: string | null }[], now: Date = new Date()): number[] {
  const set = new Set<number>();
  const base = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const byZone = new Map<string, Set<number>>();
  for (const s of subs) {
    const tz = s.timezone || 'America/Sao_Paulo';
    if (!byZone.has(tz)) byZone.set(tz, new Set());
    for (const h of s.hours) byZone.get(tz)!.add(h);
  }
  for (const [tz, hours] of byZone) {
    for (let u = 0; u < 24; u++) {
      if (hours.has(localHour(new Date(base + u * 3600_000), tz))) set.add(u);
    }
  }
  return [...set].sort((a, b) => a - b);
}

/** A função das notificações (de hora em hora) deve chamar o app agora? */
export function shouldRunNudges(plan: WakePlan | null, now: Date = new Date()): boolean {
  if (!plan) return true;
  const h = now.getUTCHours();
  return SEASON_UTC_HOURS.includes(h) || plan.nudgeUtcHours.includes(h);
}

/** O app deve atualizar os pontos da temporada nesta hora? */
export function isSeasonHour(now: Date = new Date()): boolean {
  return SEASON_UTC_HOURS.includes(now.getUTCHours());
}

/**
 * A função dos lembretes do secretário (de hora em hora) deve chamar o app agora?
 * Sem plano: comporta-se como antes (a cada 4 horas).
 */
export function shouldRunReminders(plan: WakePlan | null, now: Date = new Date()): boolean {
  if (!plan) return now.getUTCHours() % 4 === 0;
  if (!plan.nextReminderAt) return false;
  return Date.parse(plan.nextReminderAt) <= now.getTime() + 5 * 60_000;
}

/** Um lembrete novo/alterado: antecipa o próximo do plano se ele vier antes. */
export function withReminder(plan: WakePlan, at: Date): WakePlan {
  const cur = plan.nextReminderAt ? Date.parse(plan.nextReminderAt) : Infinity;
  if (at.getTime() >= cur) return plan;
  return { ...plan, nextReminderAt: at.toISOString() };
}
