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
import { listWorkouts } from './workouts-db.js';

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
  bio: string;
  /** Hoje no fuso da pessoa e o dia do cadastro. */
  today: string;
  sinceDay: string | null;
  /** Baús já abertos. */
  chests: { day: string; reward: string; xp: number }[];
  /** Contadores de hoje que não dão pontos sozinhos (para as missões). */
  todayExtra: { lembrete: number; planejar: number };
  /** Já pediu lembretes antes de hoje. */
  everUsedReminders: boolean;
  leagueTier: number;
  leagueOptOut: boolean;
}

export async function getUserXp(userId: number): Promise<UserXp | null> {
  const user = await findUserById(userId);
  if (!user) return null;
  const tz = (user as any).timezone || 'America/Sao_Paulo';
  const toDay = (v: unknown) => (v ? dayIn(tz, v as any) : '');

  const [{ logs }, tasks, sessions, journal, transactions, workouts] = await Promise.all([
    getHabits(userId),
    getTasks(userId),
    getFocusSessions(userId),
    getJournalEntries(userId),
    getFinanceTransactions(userId),
    listWorkouts(userId, 2000),
  ]);

  let posts: { createdAt: string }[] = [];
  let comments: { createdAt: string }[] = [];
  let chests: UserXp['chests'] = [];
  let lembretesHoje = 0;
  let everUsedReminders = false;
  const today = dayIn(tz);
  if (await checkDb()) {
    try {
      chests = (await db.select({ day: schema.missionDays.day, reward: schema.missionDays.reward, xp: schema.missionDays.xp }).from(schema.missionDays).where(eq(schema.missionDays.userId, userId))).map((r) => ({ ...r }));
      const rem = await db.select({ createdAt: schema.reminders.createdAt }).from(schema.reminders).where(eq(schema.reminders.userId, userId)).limit(500);
      everUsedReminders = rem.some((r) => toDay(r.createdAt) < today);
      lembretesHoje = rem.filter((r) => toDay(r.createdAt) === today).length;
    } catch {
      // tabelas novas ainda sendo criadas: segue sem baú
    }
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
    workouts: workouts.map((w) => ({ date: toDay(w.startedAt) })),
    posts,
    comments,
    bonus: chests.map((c) => ({ day: c.day, xp: c.xp })),
    since: (user as any).createdAt ? toDay((user as any).createdAt) : null,
    today,
  });
  const tomorrow = new Date(Date.parse(`${today}T12:00:00Z`) + 86400_000).toISOString().slice(0, 10);
  const planejar = tasks.filter((t) => t.date === tomorrow && t.createdAt && toDay(t.createdAt) === today).length;
  const info = levelInfo(result.total);

  // guarda a cópia só quando mudou (evita escrever no banco a cada visita)
  if ((user as any).xpTotal !== result.total || (user as any).level !== info.level) {
    await updateUserRecord(userId, { xpTotal: result.total, level: info.level } as any).catch(() => null);
  }
  return {
    ...result,
    info,
    avatarUrl: (user as any).avatarUrl || null,
    bio: (user as any).bio || '',
    today,
    sinceDay: (user as any).createdAt ? toDay((user as any).createdAt) : null,
    chests,
    todayExtra: { lembrete: lembretesHoje, planejar },
    everUsedReminders,
    leagueTier: Number((user as any).leagueTier) || 0,
    leagueOptOut: Boolean((user as any).leagueOptOut),
  };
}
