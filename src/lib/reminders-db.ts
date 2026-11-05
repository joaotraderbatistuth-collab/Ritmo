// Lembretes do secretário (banco, com fallback em memória como o resto do app).
import { and, asc, eq, gte, isNull } from 'drizzle-orm';
import { db } from '../../db/index.js';
import * as schema from '../../db/schema.js';
import { checkDb } from './server-db.js';

export interface ReminderItem {
  id: number;
  text: string;
  remindAt: string;
  taskId: number | null;
  sentAt: string | null;
}

const mem: (ReminderItem & { userId: number; doneAt: string | null })[] = [];
let memId = 0;
const iso = (v: any) => (v instanceof Date ? v.toISOString() : v ? String(v) : null);

export const REMINDER_LIMITS = { textMax: 160, activeMax: 100, perHour: 60 } as const;

/** Lembretes ainda não concluídos (inclui os que tocaram nas últimas 12 h). */
export async function listReminders(userId: number): Promise<ReminderItem[]> {
  const since = new Date(Date.now() - 12 * 3600_000);
  if (await checkDb()) {
    try {
      const rows = await db
        .select()
        .from(schema.reminders)
        .where(and(eq(schema.reminders.userId, userId), isNull(schema.reminders.doneAt), gte(schema.reminders.remindAt, since)))
        .orderBy(asc(schema.reminders.remindAt))
        .limit(REMINDER_LIMITS.activeMax);
      return rows.map((r) => ({ id: r.id, text: r.text, remindAt: iso(r.remindAt)!, taskId: r.taskId ?? null, sentAt: iso(r.sentAt) }));
    } catch (e) {
      console.error('[lembretes] listar', e);
    }
  }
  return mem
    .filter((r) => r.userId === userId && !r.doneAt && new Date(r.remindAt) >= since)
    .sort((a, b) => a.remindAt.localeCompare(b.remindAt))
    .map(({ userId: _u, doneAt: _d, ...r }) => r);
}

export async function createReminder(userId: number, input: { text: string; remindAt: Date; taskId?: number | null }): Promise<ReminderItem> {
  if (await checkDb()) {
    try {
      const [r] = await db.insert(schema.reminders).values({ userId, text: input.text, remindAt: input.remindAt, taskId: input.taskId ?? null }).returning();
      return { id: r.id, text: r.text, remindAt: iso(r.remindAt)!, taskId: r.taskId ?? null, sentAt: null };
    } catch (e) {
      console.error('[lembretes] criar', e);
    }
  }
  const item = { id: ++memId, userId, text: input.text, remindAt: input.remindAt.toISOString(), taskId: input.taskId ?? null, sentAt: null, doneAt: null };
  mem.push(item);
  return { id: item.id, text: item.text, remindAt: item.remindAt, taskId: item.taskId, sentAt: null };
}

/** Conclui (some da lista) ou apaga. */
export async function finishReminder(userId: number, id: number): Promise<boolean> {
  if (await checkDb()) {
    try {
      const r = await db.update(schema.reminders).set({ doneAt: new Date() }).where(and(eq(schema.reminders.id, id), eq(schema.reminders.userId, userId))).returning({ id: schema.reminders.id });
      return r.length > 0;
    } catch (e) {
      console.error('[lembretes] concluir', e);
    }
  }
  const r = mem.find((x) => x.id === id && x.userId === userId);
  if (!r) return false;
  r.doneAt = new Date().toISOString();
  return true;
}

export async function countRecentReminders(userId: number): Promise<number> {
  const list = await listReminders(userId);
  return list.length;
}
