// Calcula os Pontos de Ritmo de uma pessoa a partir dos dados dela e guarda uma cópia
// (xp_total e level) na tabela de usuários, para o Feed mostrar nível e moldura sem recalcular.
import { and, eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import * as schema from '../../db/schema.js';
import { computeXp, levelInfo, XpResult, LevelInfo } from './levels.js';
import {
  checkDb,
  findUserById,
  getFinanceTransactions,
  getFocusSessions,
  getHabits,
  getJournalEntries,
  getTasks,
  updateUserRecord,
} from './server-db.js';

/** Dia (YYYY-MM-DD) de um instante no fuso da pessoa. */
export function dayIn(timezone: string | null | undefined, when: Date | string = new Date()): string {
  const d = when instanceof Date ? when : new Date(when);
  if (Number.isNaN(d.getTime())) return '';
  try {
    return new Intl.DateTimeFormat('en-CA', { timeZone: timezone || 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
  } catch {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
  }
}

export interface UserXp extends XpResult {
  info: LevelInfo;
  avatarUrl: string | null;
}

export async function getUserXp(userId: number): Promise<UserXp | null> {
  const user = await findUserById(userId);
  if (!user) return null;
  const tz = (user as any).timezone || 'America/Sao_Paulo';
  const toDay = (v: unknown) => (v ? dayIn(tz, v as any) : '');

  const [{ logs }, tasks, sessions, journal, transactions] = await Promise.all([
    getHabits(userId),
    getTasks(userId),
    getFocusSessions(userId),
    getJournalEntries(userId),
    getFinanceTransactions(userId),
  ]);

  let posts: { createdAt: string }[] = [];
  let comments: { createdAt: string }[] = [];
  if (await checkDb()) {
    try {
      const p = await db.select({ createdAt: schema.feedPosts.createdAt }).from(schema.feedPosts).where(and(eq(schema.feedPosts.userId, userId), eq(schema.feedPosts.status, 'visible')));
      const c = await db.select({ createdAt: schema.feedComments.createdAt }).from(schema.feedComments).where(and(eq(schema.feedComments.userId, userId), eq(schema.feedComments.status, 'visible')));
      posts = p.map((r) => ({ createdAt: toDay(r.createdAt) }));
      comments = c.map((r) => ({ createdAt: toDay(r.createdAt) }));
    } catch {
      // Feed indisponível: conta só o resto
    }
  }

  const result = computeXp({
    habitLogs: logs.map((l) => ({ date: l.date, completed: l.completed })),
    tasks: tasks.map((t) => ({ date: t.date, completed: t.completed, completedAt: t.completedAt ? toDay(t.completedAt) : null })),
    sessions: sessions.map((s) => ({ date: s.date, status: s.status })),
    journal: journal.map((j) => ({ date: j.date, entryType: j.entryType })),
    transactions: transactions.map((t) => ({ date: t.date, createdAt: t.createdAt ? toDay(t.createdAt) : null })),
    posts,
    comments,
    since: (user as any).createdAt ? toDay((user as any).createdAt) : null,
    today: dayIn(tz),
  });
  const info = levelInfo(result.total);

  // guarda a cópia só quando mudou (evita escrever no banco a cada visita)
  if ((user as any).xpTotal !== result.total || (user as any).level !== info.level) {
    await updateUserRecord(userId, { xpTotal: result.total, level: info.level } as any).catch(() => null);
  }
  return { ...result, info, avatarUrl: (user as any).avatarUrl || null };
}
