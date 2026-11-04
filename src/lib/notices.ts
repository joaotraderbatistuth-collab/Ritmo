// Avisos dentro do app (sino): calculados na hora a partir dos dados da própria pessoa.
// Lógica PURA, testada em tests/. Respeita as opções de lembretes das Configurações.
import { computeChain } from './chain.js';
import { MIN_PAYOUT_CENTS } from './commission-plan.js';
import { cycleStatus } from './payout-schedule.js';

export interface Notice {
  id: string;
  level: 'urgent' | 'warn' | 'info';
  title: string;
  detail: string;
  /** Aba do app para abrir ao tocar no aviso. */
  tab?: string;
  /** Link externo (ex.: renovar a assinatura). */
  href?: string;
}

export interface NoticeInput {
  now?: Date;
  /** YYYY-MM-DD no fuso do aparelho. */
  today: string;
  hour: number;
  minutes?: number;
  isAdmin?: boolean;
  access?: { effectiveStatus: string; daysLeft: number; hasAccess: boolean } | null;
  config?: { tasks?: boolean; habits?: boolean; financeDue?: boolean; weeklyReview?: boolean } | null;
  tasks: { id?: number; title: string; date: string; startTime?: string | null; completed: boolean }[];
  transactions: { id?: number; type: string; description: string; amountCents: number; date: string; dueDate?: string | null; status: string }[];
  habits: { id: number; name: string; targetFrequency: string; createdAt?: string | null }[];
  habitLogs: { habitId: number; date: string; completed: boolean }[];
  journalToday: boolean;
  affiliateBalanceCents?: number;
}

const brl = (c: number) => (c / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const addDays = (ymd: string, n: number) => new Date(new Date(`${ymd}T12:00:00Z`).getTime() + n * 86400000).toISOString().slice(0, 10);
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const ORDER = { urgent: 0, warn: 1, info: 2 } as const;

export function computeNotices(i: NoticeInput): Notice[] {
  const out: Notice[] = [];
  const cfg = { tasks: true, habits: true, financeDue: true, weeklyReview: true, ...(i.config || {}) };
  const now = i.now || new Date();

  // ---- assinatura / teste
  if (!i.isAdmin && i.access?.hasAccess) {
    const { effectiveStatus, daysLeft } = i.access;
    if (effectiveStatus === 'trial' && daysLeft <= 2) {
      out.push({ id: 'trial', level: daysLeft <= 1 ? 'urgent' : 'warn', title: daysLeft <= 0 ? 'Seu teste termina hoje' : `Seu teste termina em ${plural(daysLeft, 'dia', 'dias')}`, detail: 'Assine para não perder o acesso. Seus dados ficam guardados.', href: '/checkout' });
    } else if (effectiveStatus === 'active' && daysLeft <= 3) {
      out.push({ id: 'renew', level: daysLeft <= 1 ? 'urgent' : 'warn', title: daysLeft <= 0 ? 'Sua assinatura vence hoje' : `Sua assinatura vence em ${plural(daysLeft, 'dia', 'dias')}`, detail: 'A renovação é manual por Pix ou cartão: não há cobrança automática.', href: '/checkout' });
    }
  }

  // ---- contas a pagar e a receber
  if (cfg.financeDue) {
    const due = (t: (typeof i.transactions)[number]) => (t.dueDate || t.date).slice(0, 10);
    const open = i.transactions.filter((t) => t.status === 'pending' || t.status === 'overdue');
    const bills = open.filter((t) => t.type === 'expense');
    const late = bills.filter((t) => due(t) < i.today);
    if (late.length) out.push({ id: 'bills-late', level: 'urgent', title: `${plural(late.length, 'conta atrasada', 'contas atrasadas')}`, detail: `Total ${brl(late.reduce((a, t) => a + t.amountCents, 0))}: ${late.slice(0, 2).map((t) => t.description).join(', ')}${late.length > 2 ? '...' : ''}`, tab: 'financas' });
    const soon = bills.filter((t) => due(t) >= i.today && due(t) <= addDays(i.today, 3));
    if (soon.length) out.push({ id: 'bills-soon', level: 'warn', title: `${plural(soon.length, 'conta vence', 'contas vencem')} nos próximos 3 dias`, detail: `Total ${brl(soon.reduce((a, t) => a + t.amountCents, 0))}: ${soon.slice(0, 2).map((t) => t.description).join(', ')}${soon.length > 2 ? '...' : ''}`, tab: 'financas' });
    const receivable = open.filter((t) => t.type === 'income' && due(t) >= i.today && due(t) <= addDays(i.today, 3));
    if (receivable.length) out.push({ id: 'income-soon', level: 'info', title: `${plural(receivable.length, 'recebimento previsto', 'recebimentos previstos')} em até 3 dias`, detail: `Total ${brl(receivable.reduce((a, t) => a + t.amountCents, 0))}`, tab: 'financas' });
  }

  // ---- tarefas do dia
  if (cfg.tasks) {
    const nowMin = i.hour * 60 + (i.minutes ?? 0);
    const todays = i.tasks.filter((t) => t.date === i.today && !t.completed);
    const timed = todays
      .filter((t) => t.startTime && /^\d{2}:\d{2}$/.test(t.startTime))
      .map((t) => ({ t, min: Number(t.startTime!.slice(0, 2)) * 60 + Number(t.startTime!.slice(3, 5)) }));
    const upcoming = timed.filter((x) => x.min >= nowMin && x.min - nowMin <= 120).sort((a, b) => a.min - b.min)[0];
    if (upcoming) out.push({ id: 'task-soon', level: 'warn', title: `“${upcoming.t.title}” às ${upcoming.t.startTime}`, detail: 'Sua próxima tarefa com horário começa em breve.', tab: 'rotina' });
    const missed = timed.filter((x) => x.min < nowMin);
    if (missed.length) out.push({ id: 'task-missed', level: 'info', title: `${plural(missed.length, 'tarefa com horário passou', 'tarefas com horário passaram')} sem conclusão`, detail: 'Conclua ou remarque para manter o dia em dia.', tab: 'rotina' });
    if (todays.length && !upcoming && !missed.length) out.push({ id: 'tasks-today', level: 'info', title: `${plural(todays.length, 'tarefa pendente', 'tarefas pendentes')} hoje`, detail: todays.slice(0, 2).map((t) => t.title).join(', ') + (todays.length > 2 ? '...' : ''), tab: 'rotina' });
  }

  // ---- hábitos e corrente
  if (cfg.habits && i.habits.length) {
    const atRisk: string[] = [];
    let pendingToday = 0;
    for (const h of i.habits) {
      const logs = i.habitLogs.filter((l) => l.habitId === h.id);
      const r = computeChain({ targetFrequency: h.targetFrequency, createdAt: h.createdAt, logs, today: i.today });
      if (!r.metThisWeek && r.chain >= 1 && r.missingThisWeek > 0 && r.missingThisWeek >= r.daysLeftThisWeek && r.missingThisWeek <= r.daysLeftThisWeek) atRisk.push(h.name);
      if (!logs.some((l) => l.date === i.today && l.completed) && !r.metThisWeek) pendingToday++;
    }
    if (atRisk.length) out.push({ id: 'chain-risk', level: 'warn', title: 'Sua corrente está em risco', detail: `“${atRisk[0]}”${atRisk.length > 1 ? ` e mais ${atRisk.length - 1}` : ''}: cada dia que resta precisa contar para fechar a meta da semana.`, tab: 'habitos' });
    if (i.hour >= 17 && pendingToday) out.push({ id: 'habits-today', level: 'info', title: `${plural(pendingToday, 'hábito ainda não marcado', 'hábitos ainda não marcados')} hoje`, detail: 'Marque o que você já fez antes de o dia acabar.', tab: 'habitos' });
  }

  // ---- diário e revisão semanal
  if (cfg.weeklyReview && i.hour >= 20 && !i.journalToday) out.push({ id: 'journal', level: 'info', title: 'Que tal o diário de hoje?', detail: 'Leva 30 segundos: três notas e duas perguntas.', tab: 'diario' });
  if (cfg.weeklyReview && now.getDay() === 0 && i.hour >= 9) out.push({ id: 'weekly-review', level: 'info', title: 'Domingo: hora da revisão da semana', detail: 'Veja o que funcionou e onde ajustar na próxima semana.', tab: 'diario' });

  // ---- prazo de saque do afiliado
  if ((i.affiliateBalanceCents || 0) >= MIN_PAYOUT_CENTS) {
    const c = cycleStatus(now);
    if (c.lastDay) out.push({ id: 'payout', level: 'info', title: 'Prazo de saque termina hoje às 23:59', detail: `Você tem ${brl(i.affiliateBalanceCents!)} disponíveis. Pedido até quarta 23:59 é pago na quinta e na sexta.`, tab: 'afiliados' });
  }

  return out.sort((a, b) => ORDER[a.level] - ORDER[b.level]);
}
