// Grava/lê a "agenda de acordar" (ver wake-plan.ts) no Netlify Blobs.
// Tudo aqui é "melhor esforço": se o Blobs não estiver disponível (ex.: rodando local),
// nada quebra e as funções agendadas voltam a rodar como antes.
import { getStore } from '@netlify/blobs';
import { and, eq, isNull, min } from 'drizzle-orm';
import { db } from '../../db/index.js';
import * as schema from '../../db/schema.js';
import { checkDb } from './server-db.js';
import { normalizePushHours } from './nudges.js';
import { WAKE_KEY, WAKE_STORE, WakePlan, nudgeUtcHours, parsePlan, withReminder } from './wake-plan.js';

function store() {
  return getStore({ name: WAKE_STORE, consistency: 'strong' });
}

export async function readWakePlan(): Promise<WakePlan | null> {
  try {
    return parsePlan(await store().get(WAKE_KEY));
  } catch {
    return null;
  }
}

async function writeWakePlan(plan: WakePlan) {
  try {
    await store().set(WAKE_KEY, JSON.stringify(plan));
    return true;
  } catch {
    return false;
  }
}

/** Refaz o plano inteiro a partir do banco (chamado quando o banco já está acordado). */
export async function refreshWakePlan(now: Date = new Date()): Promise<WakePlan | null> {
  if (!(await checkDb())) return null;
  try {
    const subs = await db
      .select({ hours: schema.pushSubscriptions.hours, perDay: schema.pushSubscriptions.perDay, timezone: schema.users.timezone, status: schema.users.subscriptionStatus })
      .from(schema.pushSubscriptions)
      .innerJoin(schema.users, eq(schema.users.id, schema.pushSubscriptions.userId));
    const [next] = await db
      .select({ at: min(schema.reminders.remindAt) })
      .from(schema.reminders)
      .where(and(isNull(schema.reminders.sentAt), isNull(schema.reminders.doneAt)));
    const plan: WakePlan = {
      v: 1,
      nudgeUtcHours: nudgeUtcHours(
        subs.filter((s) => s.status !== 'suspended').map((s) => ({ hours: normalizePushHours(s.hours, s.perDay), timezone: s.timezone })),
        now
      ),
      nextReminderAt: next?.at ? new Date(next.at as any).toISOString() : null,
      updatedAt: now.toISOString(),
    };
    await writeWakePlan(plan);
    return plan;
  } catch (e) {
    console.error('[agenda]', e);
    return null;
  }
}

/** Lembrete criado ou com nova data: garante que a função acorde a tempo. */
export async function noteReminderAt(at: Date) {
  const plan = await readWakePlan();
  if (!plan) return; // sem plano, a função roda a cada 4 h e o próximo refresh já inclui este lembrete
  const updated = withReminder(plan, at);
  if (updated !== plan) await writeWakePlan(updated);
}
