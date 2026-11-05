// Painel de números do admin: cálculos PUROS (sem banco), testados em tests/.
// Entradas: pessoas (cadastro), pagamentos aprovados e dias de uso. Tudo no horário de Brasília (YYYY-MM-DD).

export interface MUser {
  id: number;
  createdDay: string;
  role: string;
  status: string;
  referredBy: string | null;
  source: string | null;
}

export interface MPayment {
  userId: number;
  paidDay: string;
  amountCents: number;
  kind: string; // subscription | team
}

const DAY = 86400_000;
const toTime = (d: string) => Date.parse(`${d}T12:00:00Z`);
export const addDaysStr = (d: string, n: number) => new Date(toTime(d) + n * DAY).toISOString().slice(0, 10);
export const diffDays = (a: string, b: string) => Math.round((toTime(b) - toTime(a)) / DAY);
const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 1000) / 10 : null);

/** Segunda-feira da semana do dia. */
export function weekStart(d: string): string {
  const wd = new Date(toTime(d)).getUTCDay();
  return addDaysStr(d, -((wd + 6) % 7));
}

/** Agrupa a origem do cadastro em poucas categorias legíveis. */
export function sourceLabel(u: Pick<MUser, 'referredBy' | 'source'>): string {
  const s = (u.source || '').toLowerCase();
  if (s === 'ritus') return 'Ritus';
  if (u.referredBy || s === 'indicacao') return 'Indicação (afiliado)';
  if (s.startsWith('utm:')) {
    const name = s.slice(4).split('/')[0];
    const map: Record<string, string> = { instagram: 'Instagram', ig: 'Instagram', facebook: 'Facebook', fb: 'Facebook', tiktok: 'TikTok', youtube: 'YouTube', google: 'Google', whatsapp: 'WhatsApp', wa: 'WhatsApp' };
    return map[name] || `Campanha: ${name}`;
  }
  if (s.startsWith('site:')) {
    const host = s.slice(5);
    if (/google\./.test(host)) return 'Google';
    if (/instagram|l\.instagram/.test(host)) return 'Instagram';
    if (/facebook|fb\./.test(host)) return 'Facebook';
    if (/tiktok/.test(host)) return 'TikTok';
    if (/youtube|youtu\.be/.test(host)) return 'YouTube';
    if (/whatsapp|wa\.me/.test(host)) return 'WhatsApp';
    return `Site: ${host}`;
  }
  return 'Direto / sem origem';
}

/** Dia em que a pessoa pagou a assinatura pela primeira vez (ou null). */
function firstPaidDays(payments: MPayment[]) {
  const first = new Map<number, string>();
  for (const p of payments) {
    if (p.kind !== 'subscription') continue;
    const cur = first.get(p.userId);
    if (!cur || p.paidDay < cur) first.set(p.userId, p.paidDay);
  }
  return first;
}

/** Pessoa pagante no dia `d`: algum pagamento de assinatura nos 30 dias anteriores (inclusive). */
function payingOn(payments: MPayment[], d: string): Set<number> {
  const out = new Set<number>();
  for (const p of payments) {
    if (p.kind !== 'subscription') continue;
    const age = diffDays(p.paidDay, d);
    if (age >= 0 && age < 30) out.add(p.userId);
  }
  return out;
}

export interface Metrics {
  today: string;
  totals: {
    users: number;
    trialsActive: number;
    paying: number;
    mrrCents: number;
    revenueMonthCents: number;
    revenueLastMonthCents: number;
    signups7d: number;
    activeToday: number;
    active7d: number;
    active30d: number;
  };
  /** Conversão do teste em assinatura, por semana de cadastro (só semanas cujo teste já terminou). */
  conversion: { week: string; signups: number; converted: number; rate: number | null }[];
  conversionOverall: { signups: number; converted: number; rate: number | null };
  /** Cancelamentos por mês (aproximado: pagante no 1º dia que não renovou até o fim do mês). */
  churn: { month: string; startPaying: number; lost: number; rate: number | null; partial: boolean }[];
  /** Retenção dos cadastros dos últimos 60 dias. */
  retention: { d1: number | null; d7: number | null; d30: number | null; cohortD1: number; cohortD7: number; cohortD30: number };
  /** Retenção por semana de cadastro. */
  retentionWeeks: { week: string; signups: number; d1: number | null; d7: number | null; d30: number | null }[];
  /** De onde vieram os cadastros e os assinantes. */
  sources: { source: string; signups: number; paying: number; conversion: number | null }[];
  /** Cadastros por dia (últimos 30). */
  signupsDaily: { day: string; signups: number; active: number }[];
}

export function computeMetrics(input: { users: MUser[]; payments: MPayment[]; activity: { userId: number; day: string }[]; today: string; priceCents: number }): Metrics {
  const { today, priceCents } = input;
  const users = input.users.filter((u) => u.role !== 'admin');
  const ids = new Set(users.map((u) => u.id));
  const payments = input.payments.filter((p) => ids.has(p.userId));
  const firstPaid = firstPaidDays(payments);

  // dias de uso por pessoa (o dia do cadastro também conta como uso)
  const days = new Map<number, Set<string>>();
  for (const u of users) days.set(u.id, new Set([u.createdDay]));
  for (const a of input.activity) days.get(a.userId)?.add(a.day);
  for (const p of payments) days.get(p.userId)?.add(p.paidDay);
  const activeBetween = (uid: number, from: string, to: string) => {
    for (const d of days.get(uid) || []) if (d >= from && d <= to) return true;
    return false;
  };

  // totais
  const payingNow = payingOn(payments, today);
  const monthKey = today.slice(0, 7);
  const lastMonthDate = new Date(Date.UTC(Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 2, 1)).toISOString().slice(0, 7);
  const revenue = (m: string) => payments.filter((p) => p.paidDay.slice(0, 7) === m).reduce((a, p) => a + p.amountCents, 0);
  const countActive = (from: string) => users.filter((u) => activeBetween(u.id, from, today)).length;
  const totals = {
    users: users.length,
    trialsActive: users.filter((u) => u.status === 'trial' && diffDays(u.createdDay, today) < 7 && !payingNow.has(u.id)).length,
    paying: payingNow.size,
    mrrCents: payingNow.size * priceCents,
    revenueMonthCents: revenue(monthKey),
    revenueLastMonthCents: revenue(lastMonthDate),
    signups7d: users.filter((u) => diffDays(u.createdDay, today) < 7).length,
    activeToday: countActive(today),
    active7d: countActive(addDaysStr(today, -6)),
    active30d: countActive(addDaysStr(today, -29)),
  };

  // conversão por semana (o teste dura 7 dias; damos 3 de folga para o pagamento)
  const convWeeks = new Map<string, { signups: number; converted: number }>();
  let allS = 0;
  let allC = 0;
  for (const u of users) {
    if (diffDays(u.createdDay, today) < 10) continue;
    const w = weekStart(u.createdDay);
    const row = convWeeks.get(w) || { signups: 0, converted: 0 };
    row.signups++;
    allS++;
    const fp = firstPaid.get(u.id);
    if (fp && diffDays(u.createdDay, fp) <= 30) {
      row.converted++;
      allC++;
    }
    convWeeks.set(w, row);
  }
  const conversion = [...convWeeks.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-12)
    .map(([week, r]) => ({ week, ...r, rate: pct(r.converted, r.signups) }));

  // cancelamentos por mês (últimos 6)
  const churn: Metrics['churn'] = [];
  for (let i = 5; i >= 0; i--) {
    const first = new Date(Date.UTC(Number(today.slice(0, 4)), Number(today.slice(5, 7)) - 1 - i, 1)).toISOString().slice(0, 10);
    const nextFirst = new Date(Date.UTC(Number(first.slice(0, 4)), Number(first.slice(5, 7)), 1)).toISOString().slice(0, 10);
    const last = addDaysStr(nextFirst, -1);
    const end = last < today ? last : today;
    const start = payingOn(payments, first);
    const atEnd = payingOn(payments, end);
    let lost = 0;
    for (const uid of start) if (!atEnd.has(uid)) lost++;
    churn.push({ month: first.slice(0, 7), startPaying: start.size, lost, rate: pct(lost, start.size), partial: end === today && last !== today });
  }

  // retenção
  const ret = (list: MUser[], from: number, to: number) => {
    const cohort = list.filter((u) => diffDays(u.createdDay, today) >= to);
    const kept = cohort.filter((u) => activeBetween(u.id, addDaysStr(u.createdDay, from), addDaysStr(u.createdDay, to))).length;
    return { n: cohort.length, rate: pct(kept, cohort.length) };
  };
  const recent = users.filter((u) => diffDays(u.createdDay, today) <= 90);
  const r1 = ret(recent, 1, 1);
  const r7 = ret(recent, 7, 13);
  const r30 = ret(recent, 28, 34);
  const retention = { d1: r1.rate, d7: r7.rate, d30: r30.rate, cohortD1: r1.n, cohortD7: r7.n, cohortD30: r30.n };
  const byWeek = new Map<string, MUser[]>();
  for (const u of recent) {
    const w = weekStart(u.createdDay);
    byWeek.set(w, [...(byWeek.get(w) || []), u]);
  }
  const retentionWeeks = [...byWeek.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-10)
    .map(([week, list]) => ({ week, signups: list.length, d1: ret(list, 1, 1).rate, d7: ret(list, 7, 13).rate, d30: ret(list, 28, 34).rate }));

  // origem
  const src = new Map<string, { signups: number; paying: number }>();
  for (const u of users) {
    const k = sourceLabel(u);
    const r = src.get(k) || { signups: 0, paying: 0 };
    r.signups++;
    if (firstPaid.has(u.id)) r.paying++;
    src.set(k, r);
  }
  const sources = [...src.entries()]
    .map(([source, r]) => ({ source, ...r, conversion: pct(r.paying, r.signups) }))
    .sort((a, b) => b.paying - a.paying || b.signups - a.signups);

  // série diária (30 dias)
  const signupsDaily: Metrics['signupsDaily'] = [];
  for (let i = 29; i >= 0; i--) {
    const d = addDaysStr(today, -i);
    signupsDaily.push({ day: d, signups: users.filter((u) => u.createdDay === d).length, active: users.filter((u) => days.get(u.id)?.has(d)).length });
  }

  return { today, totals, conversion, conversionOverall: { signups: allS, converted: allC, rate: pct(allC, allS) }, churn, retention, retentionWeeks, sources, signupsDaily };
}
