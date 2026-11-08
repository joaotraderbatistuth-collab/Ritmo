// Preenchimento automático (servidor): quando a pessoa cria ou muda um compromisso, uma conta, um card
// ou um lembrete, o resto do app acompanha. As regras de "o que criar" estão em autofill.ts (puras).
//
// Itens ligados ficam na tabela item_links com o mesmo "grp":
//   tarefa (agenda) ↔ card (quadro Agenda) ↔ provisão em Finanças ↔ lembretes
// - concluir a tarefa marca a conta como paga, move o card para "Concluído" e encerra os lembretes
//   (e o contrário: pagar a conta em Finanças ou arrastar o card para "Concluído" conclui a tarefa);
// - mudar a data em qualquer um muda nos outros e refaz os lembretes;
// - apagar a tarefa ou a provisão apaga o que ainda estava em aberto; apagar o card só desfaz a ligação.
// Estas funções chamam o banco direto (não as rotas), então uma mudança não dispara outra em cadeia.
import crypto from 'crypto';
import { and, eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import * as schema from '../../db/schema.js';
import {
  checkDb,
  findUserById,
  createTask,
  updateTask,
  deleteTask,
  getTaskById,
  createFinanceTransaction,
  updateFinanceTransaction,
  deleteFinanceTransaction,
  getFinanceTransactionById,
  getBoards,
  createBoard,
  getBoardLists,
  createList,
  createCard,
  updateCard,
  moveCard,
  deleteCard,
  getCardById,
} from './server-db.js';
import { REMINDER_LIMITS, countRecentReminders, createReminder, finishReminder } from './reminders-db.js';
import { nextDateAfter, normalizeTaskRule } from './recurrence.js';
import {
  AUTO_BOARD_TITLE,
  type LinkKind,
  type MoneyInfo,
  brlCents,
  cardLabelFor,
  describeAuto,
  detectMoney,
  guessTaskCategory,
  isAutoBoardTitle,
  isDoneListTitle,
  isRoutineRule,
  instantToLocal,
  localToInstant,
  planReminders,
} from './autofill.js';
import type { BoardCardItem, FinanceTransactionItem, TaskItem } from './types.js';

export interface AutoItem {
  kind: LinkKind;
  id: number;
  detail?: string;
}
export interface AutoResult {
  items: AutoItem[];
  /** "card no quadro Agenda, provisão de R$ 1.250,00 em Finanças e 2 lembretes" */
  message: string;
}
const EMPTY: AutoResult = { items: [], message: '' };

/* ---------------- Ligações (banco, com fallback em memória) ---------------- */

const memLinks: { userId: number; grp: string; kind: string; itemId: number }[] = [];

async function addLink(userId: number, grp: string, kind: LinkKind, itemId: number) {
  if (await checkDb()) {
    try {
      await db.insert(schema.itemLinks).values({ userId, grp, kind, itemId });
      return;
    } catch (e) {
      console.error('[autofill] ligar', e);
    }
  }
  memLinks.push({ userId, grp, kind, itemId });
}

async function groupOf(userId: number, kind: LinkKind, itemId: number): Promise<string | null> {
  if (await checkDb()) {
    try {
      const [r] = await db
        .select({ grp: schema.itemLinks.grp })
        .from(schema.itemLinks)
        .where(and(eq(schema.itemLinks.userId, userId), eq(schema.itemLinks.kind, kind), eq(schema.itemLinks.itemId, itemId)))
        .limit(1);
      return r?.grp ?? null;
    } catch (e) {
      console.error('[autofill] grupo', e);
    }
  }
  return memLinks.find((l) => l.userId === userId && l.kind === kind && l.itemId === itemId)?.grp ?? null;
}

async function members(userId: number, grp: string): Promise<{ kind: LinkKind; itemId: number }[]> {
  if (await checkDb()) {
    try {
      const rows = await db
        .select({ kind: schema.itemLinks.kind, itemId: schema.itemLinks.itemId })
        .from(schema.itemLinks)
        .where(and(eq(schema.itemLinks.userId, userId), eq(schema.itemLinks.grp, grp)));
      return rows.map((r) => ({ kind: r.kind as LinkKind, itemId: r.itemId }));
    } catch (e) {
      console.error('[autofill] membros', e);
    }
  }
  return memLinks.filter((l) => l.userId === userId && l.grp === grp).map((l) => ({ kind: l.kind as LinkKind, itemId: l.itemId }));
}

async function removeLink(userId: number, kind: LinkKind, itemId: number) {
  if (await checkDb()) {
    try {
      await db.delete(schema.itemLinks).where(and(eq(schema.itemLinks.userId, userId), eq(schema.itemLinks.kind, kind), eq(schema.itemLinks.itemId, itemId)));
      return;
    } catch (e) {
      console.error('[autofill] desligar', e);
    }
  }
  for (let i = memLinks.length - 1; i >= 0; i--) if (memLinks[i].userId === userId && memLinks[i].kind === kind && memLinks[i].itemId === itemId) memLinks.splice(i, 1);
}

async function removeGroup(userId: number, grp: string) {
  if (await checkDb()) {
    try {
      await db.delete(schema.itemLinks).where(and(eq(schema.itemLinks.userId, userId), eq(schema.itemLinks.grp, grp)));
      return;
    } catch (e) {
      console.error('[autofill] apagar grupo', e);
    }
  }
  for (let i = memLinks.length - 1; i >= 0; i--) if (memLinks[i].userId === userId && memLinks[i].grp === grp) memLinks.splice(i, 1);
}

/* ---------------- Contexto: ligado? fuso? ---------------- */

async function context(userId: number): Promise<{ on: boolean; tz: string }> {
  const u: any = await findUserById(userId);
  return { on: Boolean(u) && u.autofill !== false, tz: u?.timezone || 'America/Sao_Paulo' };
}

const localToday = (tz: string) => instantToLocal(new Date(), tz).date;
const lowerFirst = (s: string) => (/^[A-ZÀ-Ú]{2}/.test(s) ? s : s ? s[0].toLowerCase() + s.slice(1) : s);
const newGroup = () => crypto.randomUUID();

/* ---------------- Peças ---------------- */

/** Quadro "Agenda" (cria na primeira vez) e as listas de começo e de concluído. */
async function autoBoard(userId: number): Promise<{ boardId: number; todoListId: number; doneListId: number } | null> {
  try {
    const boards = await getBoards(userId);
    let board = boards.find((b) => isAutoBoardTitle(b.title));
    if (!board) board = await createBoard(userId, { title: AUTO_BOARD_TITLE, description: 'Preenchido sozinho com seus compromissos e contas a pagar e a receber.' });
    let lists = await getBoardLists(board.id, userId);
    if (!lists.length) {
      await createList(board.id, userId, 'A fazer', 0);
      await createList(board.id, userId, 'Concluído', 1);
      lists = await getBoardLists(board.id, userId);
    }
    const todo = lists.find((l) => !isDoneListTitle(l.title)) || lists[0];
    const done = lists.find((l) => isDoneListTitle(l.title)) || lists[lists.length - 1];
    return { boardId: board.id, todoListId: todo.id, doneListId: done.id };
  } catch (e) {
    console.error('[autofill] quadro', e);
    return null;
  }
}

/** Listas de começo/concluído do quadro onde o card está. */
async function boardEnds(userId: number, boardId: number): Promise<{ todoListId: number; doneListId: number | null; doneIds: number[] } | null> {
  const lists = await getBoardLists(boardId, userId);
  if (!lists.length) return null;
  const doneIds = lists.filter((l) => isDoneListTitle(l.title)).map((l) => l.id);
  const todo = lists.find((l) => !isDoneListTitle(l.title)) || lists[0];
  return { todoListId: todo.id, doneListId: doneIds[0] ?? null, doneIds };
}

function cardDescription(money: MoneyInfo | null, origin: string): string {
  const lines = [`Criado automaticamente ${origin}.`];
  if (money) lines.push(money.amountCents ? `Valor: ${brlCents(money.amountCents)}` : 'Valor: a definir (edite em Finanças).');
  return lines.join('\n');
}

async function makeCard(userId: number, grp: string, title: string, dueDate: string, money: MoneyInfo | null, origin: string, done = false): Promise<AutoItem | null> {
  const b = await autoBoard(userId);
  if (!b) return null;
  try {
    const card = await createCard(done ? b.doneListId : b.todoListId, userId, {
      title: title.slice(0, 200),
      description: cardDescription(money, origin),
      dueDate,
      priority: money ? 'alta' : 'media',
      labels: [cardLabelFor(money)],
    } as any);
    await addLink(userId, grp, 'card', card.id);
    return { kind: 'card', id: card.id };
  } catch (e) {
    console.error('[autofill] card', e);
    return null;
  }
}

async function makeProvision(userId: number, grp: string, money: MoneyInfo, date: string, origin: string): Promise<AutoItem | null> {
  try {
    const tx = await createFinanceTransaction(userId, {
      type: money.type,
      description: money.label.slice(0, 200),
      amountCents: money.amountCents || 0,
      date,
      dueDate: date,
      status: 'pending',
      category: money.category,
      paymentMethod: money.type === 'income' ? 'transferencia' : 'pix',
      notes: `Provisão criada automaticamente ${origin}.${money.amountCents ? '' : ' Valor a definir.'}`,
      source: 'web',
    });
    await addLink(userId, grp, 'tx', tx.id);
    const what = money.type === 'income' ? 'a receber' : 'a pagar';
    const detail = money.amountCents ? `provisão de ${brlCents(money.amountCents)} ${what} em Finanças` : `conta ${what} em Finanças (valor a definir)`;
    return { kind: 'tx', id: tx.id, detail };
  } catch (e) {
    console.error('[autofill] provisão', e);
    return null;
  }
}

async function makeReminders(userId: number, grp: string, taskId: number | null, title: string, date: string, time: string | null | undefined, money: MoneyInfo | null, tz: string): Promise<AutoItem[]> {
  const out: AutoItem[] = [];
  const now = Date.now();
  for (const p of planReminders({ title, date, time, money })) {
    let at = localToInstant(p.date, p.time, tz);
    if (at.getTime() <= now + 60_000) {
      if (!p.fallbackTime) continue;
      at = localToInstant(p.date, p.fallbackTime, tz);
      if (at.getTime() <= now + 60_000) continue;
    }
    if (at.getTime() > now + 400 * 86400_000) continue;
    try {
      if ((await countRecentReminders(userId)) >= REMINDER_LIMITS.activeMax) break;
      const r = await createReminder(userId, { text: p.text.slice(0, REMINDER_LIMITS.textMax), remindAt: at, taskId });
      await addLink(userId, grp, 'reminder', r.id);
      out.push({ kind: 'reminder', id: r.id });
    } catch (e) {
      console.error('[autofill] lembrete', e);
    }
  }
  return out;
}

function result(items: (AutoItem | null)[], exclude: LinkKind): AutoResult {
  const list = items.filter((i): i is AutoItem => Boolean(i));
  return { items: list, message: describeAuto(list.filter((i) => i.kind !== exclude)) };
}

/* ---------------- Criação ---------------- */

export interface TaskHint {
  type?: 'expense' | 'income';
  amountCents?: number | null;
}

/** Nova tarefa/compromisso na agenda → card, provisão (se for conta) e lembretes. */
export async function autofillFromTask(userId: number, task: TaskItem, hint?: TaskHint | null): Promise<AutoResult> {
  try {
    const ctx = await context(userId);
    if (!ctx.on || !task?.id || !/^\d{4}-\d{2}-\d{2}$/.test(task.date || '')) return EMPTY;
    if (await groupOf(userId, 'task', task.id)) return EMPTY;
    const money = detectMoney(task.title, hint || undefined);
    const grp = newGroup();
    await addLink(userId, grp, 'task', task.id);
    const items: (AutoItem | null)[] = [{ kind: 'task', id: task.id }];
    if (task.category === 'geral' || (money && task.category === 'pessoal')) {
      const cat = guessTaskCategory(task.title, money);
      if (cat) await updateTask(task.id, userId, { category: cat });
    }
    if (!isRoutineRule(task.recurrenceRule)) items.push(await makeCard(userId, grp, task.title, task.date, money, 'pela sua agenda', task.completed));
    if (money) items.push(await makeProvision(userId, grp, money, task.date, 'pela sua agenda'));
    if (!task.completed) items.push(...(await makeReminders(userId, grp, task.id, task.title, task.date, task.startTime, money, ctx.tz)));
    return result(items, 'task');
  } catch (e) {
    console.error('[autofill] tarefa', e);
    return EMPTY;
  }
}

/** Nova conta a pagar/receber em Finanças (pendente, com vencimento) → compromisso, card e lembretes. */
export async function autofillFromTransaction(userId: number, tx: FinanceTransactionItem): Promise<AutoResult> {
  try {
    const ctx = await context(userId);
    if (!ctx.on || !tx?.id) return EMPTY;
    if (tx.status !== 'pending' && tx.status !== 'overdue') return EMPTY;
    const due = tx.dueDate || (tx.date > localToday(ctx.tz) ? tx.date : null);
    if (!due) return EMPTY;
    if (await groupOf(userId, 'tx', tx.id)) return EMPTY;
    const money: MoneyInfo = { type: tx.type, amountCents: tx.amountCents || null, label: tx.description, category: String(tx.category || 'outros') };
    const title = `${tx.type === 'income' ? 'Receber' : 'Pagar'} ${lowerFirst(tx.description)}`.slice(0, 200);
    const grp = newGroup();
    await addLink(userId, grp, 'tx', tx.id);
    const items: (AutoItem | null)[] = [{ kind: 'tx', id: tx.id }];
    const task = await createTask(userId, {
      title,
      date: due,
      category: 'financas',
      priority: 'alta',
      timeBlock: 'Manhã',
      estimatedMinutes: 15,
      notes: money.amountCents ? `Valor: ${brlCents(money.amountCents)}` : '',
    });
    await addLink(userId, grp, 'task', task.id);
    items.push({ kind: 'task', id: task.id });
    items.push(await makeCard(userId, grp, title, due, money, 'por Finanças'));
    items.push(...(await makeReminders(userId, grp, task.id, title, due, null, money, ctx.tz)));
    return result(items, 'tx');
  } catch (e) {
    console.error('[autofill] lançamento', e);
    return EMPTY;
  }
}

/** Novo card com data em qualquer quadro → compromisso na agenda (+ provisão e lembretes se for conta). */
export async function autofillFromCard(userId: number, card: BoardCardItem): Promise<AutoResult> {
  try {
    const ctx = await context(userId);
    if (!ctx.on || !card?.id || !card.dueDate) return EMPTY;
    if (await groupOf(userId, 'card', card.id)) return EMPTY;
    const ends = await boardEnds(userId, card.boardId);
    if (ends?.doneIds.includes(card.listId)) return EMPTY;
    const money = detectMoney(card.title);
    const grp = newGroup();
    await addLink(userId, grp, 'card', card.id);
    const items: (AutoItem | null)[] = [{ kind: 'card', id: card.id }];
    const task = await createTask(userId, {
      title: card.title.slice(0, 200),
      date: card.dueDate,
      category: guessTaskCategory(card.title, money) || 'geral',
      priority: card.priority === 'alta' || money ? 'alta' : 'media',
      timeBlock: 'Flexível',
      notes: 'Criado pelo card nos Quadros.',
    });
    await addLink(userId, grp, 'task', task.id);
    items.push({ kind: 'task', id: task.id });
    if (money) items.push(await makeProvision(userId, grp, money, card.dueDate, 'pelos Quadros'));
    items.push(...(await makeReminders(userId, grp, task.id, card.title, card.dueDate, null, money, ctx.tz)));
    return result(items, 'card');
  } catch (e) {
    console.error('[autofill] card novo', e);
    return EMPTY;
  }
}

/** Lembrete avulso do secretário ("me lembra de pagar a luz dia 10") → compromisso, card e provisão. */
export async function autofillFromReminder(userId: number, reminder: { id: number; text: string; remindAt: string; taskId: number | null; repeat: string | null }): Promise<AutoResult> {
  try {
    const ctx = await context(userId);
    if (!ctx.on || !reminder?.id || reminder.taskId || reminder.repeat) return EMPTY;
    if (await groupOf(userId, 'reminder', reminder.id)) return EMPTY;
    const { date, time } = instantToLocal(new Date(reminder.remindAt), ctx.tz);
    const money = detectMoney(reminder.text);
    const grp = newGroup();
    await addLink(userId, grp, 'reminder', reminder.id);
    const items: (AutoItem | null)[] = [{ kind: 'reminder', id: reminder.id }];
    const h = Number(time.slice(0, 2));
    const task = await createTask(userId, {
      title: reminder.text.slice(0, 200),
      date,
      startTime: time,
      category: guessTaskCategory(reminder.text, money) || 'pessoal',
      priority: money ? 'alta' : 'media',
      timeBlock: h < 12 ? 'Manhã' : h < 18 ? 'Tarde' : 'Noite',
      estimatedMinutes: 15,
    });
    await addLink(userId, grp, 'task', task.id);
    items.push({ kind: 'task', id: task.id });
    items.push(await makeCard(userId, grp, reminder.text, date, money, 'por um lembrete'));
    if (money) {
      items.push(await makeProvision(userId, grp, money, date, 'por um lembrete'));
      // conta: também avisa na véspera (o lembrete pedido já cobre o dia)
      const eve = planReminders({ title: reminder.text, date, money })[0];
      if (eve) {
        const at = localToInstant(eve.date, eve.time, ctx.tz);
        if (at.getTime() > Date.now() + 60_000) {
          const r = await createReminder(userId, { text: eve.text.slice(0, REMINDER_LIMITS.textMax), remindAt: at, taskId: task.id });
          await addLink(userId, grp, 'reminder', r.id);
          items.push({ kind: 'reminder', id: r.id });
        }
      }
    }
    return result(items, 'reminder');
  } catch (e) {
    console.error('[autofill] lembrete novo', e);
    return EMPTY;
  }
}

/* ---------------- Sincronização ---------------- */

interface Group {
  grp: string;
  taskIds: number[];
  txIds: number[];
  cardIds: number[];
  reminderIds: number[];
}

async function loadGroup(userId: number, kind: LinkKind, id: number): Promise<Group | null> {
  const grp = await groupOf(userId, kind, id);
  if (!grp) return null;
  const m = await members(userId, grp);
  const ids = (k: LinkKind) => m.filter((x) => x.kind === k).map((x) => x.itemId);
  return { grp, taskIds: ids('task'), txIds: ids('tx'), cardIds: ids('card'), reminderIds: ids('reminder') };
}

async function moneyOfGroup(userId: number, g: Group, fallbackTitle: string): Promise<MoneyInfo | null> {
  for (const id of g.txIds) {
    const tx = await getFinanceTransactionById(userId, id);
    if (tx) return { type: tx.type, amountCents: tx.amountCents || null, label: tx.description, category: String(tx.category) };
  }
  return g.txIds.length ? detectMoney(fallbackTitle) : null;
}

/** Encerra os lembretes do grupo e cria os novos para a data/hora atual. */
async function replan(userId: number, g: Group, tz: string) {
  for (const id of g.reminderIds) {
    await finishReminder(userId, id);
    await removeLink(userId, 'reminder', id);
  }
  g.reminderIds = [];
  const task = g.taskIds.length ? await getTaskById(userId, g.taskIds[0]) : null;
  if (!task || task.completed) return;
  const money = await moneyOfGroup(userId, g, task.title);
  const made = await makeReminders(userId, g.grp, task.id, task.title, task.date, task.startTime, money, tz);
  g.reminderIds = made.map((m) => m.id);
}

async function finishReminders(userId: number, g: Group) {
  for (const id of g.reminderIds) await finishReminder(userId, id);
}

async function setTxPaid(userId: number, g: Group, paid: boolean, tz: string, date?: string) {
  for (const id of g.txIds) {
    const tx = await getFinanceTransactionById(userId, id);
    if (!tx) continue;
    const isPaid = tx.status === 'paid' || tx.status === 'received';
    if (paid && !isPaid) await updateFinanceTransaction(id, userId, { status: tx.type === 'income' ? 'received' : 'paid', date: localToday(tz) });
    if (!paid && isPaid) await updateFinanceTransaction(id, userId, { status: 'pending', date: date || tx.dueDate || tx.date });
  }
}

async function moveCards(userId: number, g: Group, done: boolean) {
  for (const id of g.cardIds) {
    const card = await getCardById(userId, id);
    if (!card || card.archived) continue;
    const ends = await boardEnds(userId, card.boardId);
    if (!ends) continue;
    const inDone = ends.doneIds.includes(card.listId);
    if (done && !inDone && ends.doneListId) await moveCard(id, userId, ends.doneListId, 0);
    if (!done && inDone) await moveCard(id, userId, ends.todoListId, 0);
  }
}

/** Conclui a tarefa a partir de outra aba (Finanças ou Quadros); se ela se repete, cria a próxima. */
async function completeTasks(userId: number, g: Group, done: boolean) {
  for (const id of g.taskIds) {
    const task = await getTaskById(userId, id);
    if (!task || task.completed === done) continue;
    if (done && task.isRecurring && task.recurrenceRule) {
      const next = nextDateAfter(task.recurrenceRule, task.date);
      if (next) {
        const rule = normalizeTaskRule(task.recurrenceRule, task.date) || task.recurrenceRule;
        const created = await createTask(userId, {
          title: task.title,
          description: task.description || '',
          category: task.category,
          priority: task.priority,
          timeBlock: task.timeBlock,
          startTime: task.startTime || '',
          estimatedMinutes: task.estimatedMinutes,
          isRecurring: true,
          recurrenceRule: rule,
          notes: task.notes || '',
          date: next,
        });
        const money = await moneyOfGroup(userId, g, task.title);
        await autofillFromTask(userId, created, money ? { type: money.type, amountCents: money.amountCents } : null);
      }
      await updateTask(id, userId, { completed: true, isRecurring: false });
    } else {
      await updateTask(id, userId, { completed: done });
    }
  }
}

/** Tarefa mudou (concluída, data, hora ou título). `before` é como estava antes. */
export async function syncFromTask(userId: number, before: TaskItem | null, after: TaskItem | null): Promise<boolean> {
  try {
    if (!before || !after) return false;
    const g = await loadGroup(userId, 'task', after.id);
    if (!g) return false;
    const { tz } = await context(userId);
    if (before.completed !== after.completed) {
      await setTxPaid(userId, g, after.completed, tz, after.date);
      await moveCards(userId, g, after.completed);
      if (after.completed) await finishReminders(userId, g);
      else await replan(userId, g, tz);
    }
    if (before.date !== after.date || (before.startTime || '') !== (after.startTime || '')) {
      if (before.date !== after.date) {
        for (const id of g.txIds) {
          const tx = await getFinanceTransactionById(userId, id);
          if (tx && (tx.status === 'pending' || tx.status === 'overdue')) await updateFinanceTransaction(id, userId, { date: after.date, dueDate: after.date });
        }
        for (const id of g.cardIds) await updateCard(id, userId, { dueDate: after.date });
      }
      if (!after.completed) await replan(userId, g, tz);
    }
    if (before.title !== after.title && after.title) for (const id of g.cardIds) await updateCard(id, userId, { title: after.title.slice(0, 200) });
    return true;
  } catch (e) {
    console.error('[autofill] sincronizar tarefa', e);
    return false;
  }
}

/** Lançamento mudou (pago/recebido, vencimento ou valor). */
export async function syncFromTransaction(userId: number, before: FinanceTransactionItem | null, after: FinanceTransactionItem | null): Promise<boolean> {
  try {
    if (!before || !after) return false;
    const g = await loadGroup(userId, 'tx', after.id);
    if (!g) return false;
    const { tz } = await context(userId);
    const wasPaid = before.status === 'paid' || before.status === 'received';
    const isPaid = after.status === 'paid' || after.status === 'received';
    if (wasPaid !== isPaid) {
      await completeTasks(userId, g, isPaid);
      await moveCards(userId, g, isPaid);
      if (isPaid) await finishReminders(userId, g);
    }
    const due = after.dueDate || after.date;
    const dueBefore = before.dueDate || before.date;
    if (due !== dueBefore && !isPaid) {
      for (const id of g.taskIds) await updateTask(id, userId, { date: due });
      for (const id of g.cardIds) await updateCard(id, userId, { dueDate: due });
    }
    if (!isPaid && (due !== dueBefore || wasPaid !== isPaid || before.amountCents !== after.amountCents)) await replan(userId, g, tz);
    return true;
  } catch (e) {
    console.error('[autofill] sincronizar lançamento', e);
    return false;
  }
}

/** Card mudou: título, data ou lista (arrastar para "Concluído" conclui a tarefa e paga a conta). */
export async function syncFromCard(userId: number, before: BoardCardItem | null, after: BoardCardItem | null): Promise<boolean> {
  try {
    if (!before || !after) return false;
    const g = await loadGroup(userId, 'card', after.id);
    if (!g) return false;
    const { tz } = await context(userId);
    if (before.listId !== after.listId) {
      const ends = await boardEnds(userId, after.boardId);
      if (ends) {
        const wasDone = ends.doneIds.includes(before.listId);
        const isDone = ends.doneIds.includes(after.listId);
        if (wasDone !== isDone) {
          await completeTasks(userId, g, isDone);
          await setTxPaid(userId, g, isDone, tz);
          if (isDone) await finishReminders(userId, g);
          else await replan(userId, g, tz);
        }
      }
    }
    if (after.dueDate && before.dueDate !== after.dueDate) {
      for (const id of g.taskIds) await updateTask(id, userId, { date: after.dueDate });
      for (const id of g.txIds) {
        const tx = await getFinanceTransactionById(userId, id);
        if (tx && (tx.status === 'pending' || tx.status === 'overdue')) await updateFinanceTransaction(id, userId, { date: after.dueDate, dueDate: after.dueDate });
      }
      await replan(userId, g, tz);
    }
    if (before.title !== after.title && after.title) for (const id of g.taskIds) await updateTask(id, userId, { title: after.title.slice(0, 200) });
    return true;
  } catch (e) {
    console.error('[autofill] sincronizar card', e);
    return false;
  }
}

/* ---------------- Exclusão ---------------- */

/** Apagou a tarefa ou a provisão: some com o que ainda estava em aberto e desfaz as ligações. */
export async function cascadeDelete(userId: number, kind: 'task' | 'tx', id: number): Promise<boolean> {
  try {
    const g = await loadGroup(userId, kind, id);
    if (!g) return false;
    for (const t of g.taskIds) {
      if (kind === 'task' && t === id) continue;
      const task = await getTaskById(userId, t);
      if (task && !task.completed) await deleteTask(t, userId);
    }
    for (const x of g.txIds) {
      if (kind === 'tx' && x === id) continue;
      const tx = await getFinanceTransactionById(userId, x);
      if (tx && (tx.status === 'pending' || tx.status === 'overdue')) await deleteFinanceTransaction(x, userId);
    }
    for (const c of g.cardIds) await deleteCard(c, userId);
    await finishReminders(userId, g);
    await removeGroup(userId, g.grp);
    return true;
  } catch (e) {
    console.error('[autofill] apagar', e);
    return false;
  }
}

/** Apagou ou arquivou o card: os outros itens continuam, só sai da ligação. */
export async function unlinkCard(userId: number, cardId: number): Promise<void> {
  try {
    await removeLink(userId, 'card', cardId);
  } catch (e) {
    console.error('[autofill] desligar card', e);
  }
}
