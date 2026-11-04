// Ciclo de pagamento das comissões — lógica PURA (sem banco, sem React), testada em tests/.
// Regra: o afiliado precisa SOLICITAR o saque até a quarta-feira, 23:59 (horário de Brasília).
// O pagamento é feito manualmente na quinta e na sexta-feira daquela mesma semana.
// Pedido feito depois da quarta 23:59 entra no ciclo da semana seguinte.

const BRT_OFFSET_MS = 3 * 3600 * 1000; // Brasília = UTC-3 (sem horário de verão desde 2019)
const DAY_MS = 24 * 3600 * 1000;

export const PAYOUT_RULE_TEXT =
  'Solicite o saque até quarta-feira, 23:59 (horário de Brasília). O pagamento é liberado manualmente na quinta e na sexta-feira da mesma semana.';

export interface PayoutCycle {
  /** Fim do prazo: quarta-feira 23:59:59 (Brasília). */
  deadline: Date;
  /** Datas YYYY-MM-DD (Brasília). */
  wednesday: string;
  thursday: string;
  friday: string;
}

function brtParts(d: Date) {
  const s = new Date(d.getTime() - BRT_OFFSET_MS);
  return { y: s.getUTCFullYear(), m: s.getUTCMonth(), day: s.getUTCDate(), wd: s.getUTCDay() };
}

function ymd(y: number, m: number, day: number): string {
  return new Date(Date.UTC(y, m, day)).toISOString().slice(0, 10);
}

/** Ciclo em que um pedido feito em `requestAt` será pago. */
export function payoutCycle(requestAt: Date): PayoutCycle {
  const p = brtParts(requestAt);
  const daysToWednesday = (3 - p.wd + 7) % 7; // 0 = o pedido foi feito numa quarta
  const wednesdayMidnightUtc = Date.UTC(p.y, p.m, p.day + daysToWednesday, 3, 0, 0); // 00:00 em Brasília
  return {
    deadline: new Date(wednesdayMidnightUtc + DAY_MS - 1),
    wednesday: ymd(p.y, p.m, p.day + daysToWednesday),
    thursday: ymd(p.y, p.m, p.day + daysToWednesday + 1),
    friday: ymd(p.y, p.m, p.day + daysToWednesday + 2),
  };
}

/** "DD/MM" a partir de YYYY-MM-DD. */
export function shortDateBR(isoDate: string): string {
  return `${isoDate.slice(8, 10)}/${isoDate.slice(5, 7)}`;
}

/** Tempo restante em português: "2 dias e 5 horas", "3 horas", "menos de 1 hora". */
export function describeCountdown(ms: number): string {
  if (ms <= 0) return 'encerrado';
  const hours = Math.floor(ms / 3600000);
  const days = Math.floor(hours / 24);
  const restHours = hours % 24;
  if (days >= 1) {
    const d = `${days} ${days === 1 ? 'dia' : 'dias'}`;
    return restHours ? `${d} e ${restHours} ${restHours === 1 ? 'hora' : 'horas'}` : d;
  }
  if (hours >= 1) return `${hours} ${hours === 1 ? 'hora' : 'horas'}`;
  return 'menos de 1 hora';
}

export interface CycleStatus extends PayoutCycle {
  msLeft: number;
  countdown: string;
  /** true quando faltam menos de 24h para o fim do prazo. */
  lastDay: boolean;
}

/** Situação do ciclo ATUAL, para mostrar o contador na tela. */
export function cycleStatus(now: Date = new Date()): CycleStatus {
  const c = payoutCycle(now);
  const msLeft = c.deadline.getTime() - now.getTime();
  return { ...c, msLeft, countdown: describeCountdown(msLeft), lastDay: msLeft < DAY_MS };
}

/** Texto curto: "pago na quinta 12/11 e sexta 13/11". */
export function payoutDatesText(c: PayoutCycle): string {
  return `quinta ${shortDateBR(c.thursday)} e sexta ${shortDateBR(c.friday)}`;
}
