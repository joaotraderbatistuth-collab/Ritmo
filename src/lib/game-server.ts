// Junta pontos, missões do dia, baú, ofensiva, resumo da semana e liga para a tela.
import { and, asc, eq, lt, sql } from 'drizzle-orm';
import { db } from '../../db/index.js';
import * as schema from '../../db/schema.js';
import { checkDb, updateUserRecord } from './server-db.js';
import { UserXp } from './xp-server.js';
import { displayName, initials } from './feed-rules.js';
import {
  LEAGUE_GROUP_SIZE,
  MissionCounter,
  chestReward,
  computeStreak,
  leagueName,
  missionProgress,
  mondayOf,
  nextMilestone,
  nextTier,
  pickMissions,
  rankInGroup,
  shiftDay,
  weekSummary,
} from './missions.js';

/**
 * Recursos que a pessoa usou nos 30 dias ANTES de hoje (para escolher as missões certas).
 * Hoje não entra: senão as missões mudariam no meio do dia, assim que ela usasse algo novo.
 */
function usedFeatures(xp: UserXp): Set<string> {
  const used = new Set<string>();
  const from = shiftDay(xp.today, -30);
  for (const [day, row] of Object.entries(xp.days)) {
    if (day < from || day >= xp.today) continue;
    for (const k of Object.keys(row.raw)) {
      if (k === 'post' || k === 'comentario') used.add('feed');
      else if (k === 'revisao') used.add('diario');
      else used.add(k);
    }
  }
  if (xp.everUsedReminders) used.add('lembrete');
  return used;
}

export function buildGame(userId: number, xp: UserXp) {
  const today = xp.today;
  const raw = xp.days[today]?.raw || {};
  const counts: Partial<Record<MissionCounter, number>> = { ...raw, lembrete: xp.todayExtra.lembrete, planejar: xp.todayExtra.planejar };
  const missions = missionProgress(pickMissions(userId, today, usedFeatures(xp)), counts);
  const allDone = missions.every((m) => m.done);
  const opened = xp.chests.find((c) => c.day === today) || null;

  const active = new Set(Object.entries(xp.days).filter(([, r]) => r.xp > 0).map(([d]) => d));
  const streak = computeStreak(
    active,
    today,
    xp.chests.filter((c) => c.reward === 'descanso').map((c) => c.day),
    xp.sinceDay
  );

  const thisWeek = mondayOf(today);
  return {
    missions,
    chest: {
      ready: allDone && !opened,
      opened: opened ? { reward: opened.reward, xp: opened.xp, label: chestReward(userId, today).label } : null,
      doneCount: missions.filter((m) => m.done).length,
    },
    streak: { ...streak, next: nextMilestone(streak.days) },
    week: weekSummary(xp.days, thisWeek),
    lastWeek: weekSummary(xp.days, shiftDay(thisWeek, -7)),
  };
}

/** Abre o baú do dia (só com as 3 missões cumpridas, uma vez por dia). */
export async function openChest(userId: number, xp: UserXp) {
  const game = buildGame(userId, xp);
  if (game.chest.opened) return { ok: false as const, error: 'Você já abriu o baú de hoje. Amanhã tem mais!' };
  if (!game.chest.ready) return { ok: false as const, error: `Cumpra as 3 missões para abrir o baú (${game.chest.doneCount}/3).` };
  const reward = chestReward(userId, xp.today);
  if (!(await checkDb())) return { ok: false as const, error: 'Não foi possível abrir agora. Tente de novo.' };
  const ins = await db.insert(schema.missionDays).values({ userId, day: xp.today, reward: reward.kind, xp: reward.xp }).onConflictDoNothing().returning();
  if (!ins.length) return { ok: false as const, error: 'Você já abriu o baú de hoje.' };
  return { ok: true as const, reward };
}

/* ---------------- Ligas ---------------- */

/**
 * Atualiza os pontos da semana na liga e devolve a classificação do grupo.
 * Na primeira visita da semana: aplica a subida/descida da semana anterior e entra num grupo.
 */
export async function syncLeague(userId: number, xp: UserXp) {
  if (xp.leagueOptOut || !(await checkDb())) return null;
  const week = mondayOf(xp.today);
  const weekXp = weekSummary(xp.days, week).xp;
  try {
    let [mine] = await db.select().from(schema.leagueWeeks).where(and(eq(schema.leagueWeeks.userId, userId), eq(schema.leagueWeeks.week, week)));
    let promoted: 'up' | 'down' | null = null;
    if (!mine) {
      // resultado da última semana em que participou
      let tier = xp.leagueTier;
      const [prev] = await db
        .select()
        .from(schema.leagueWeeks)
        .where(and(eq(schema.leagueWeeks.userId, userId), lt(schema.leagueWeeks.week, week)))
        .orderBy(sql`${schema.leagueWeeks.week} desc`)
        .limit(1);
      if (prev && prev.week === shiftDay(week, -7)) {
        const group = await db
          .select({ userId: schema.leagueWeeks.userId, xp: schema.leagueWeeks.xp })
          .from(schema.leagueWeeks)
          .where(and(eq(schema.leagueWeeks.week, prev.week), eq(schema.leagueWeeks.tier, prev.tier), eq(schema.leagueWeeks.groupNo, prev.groupNo)));
        const { rank, size } = rankInGroup(group, userId);
        const nt = nextTier(prev.tier, rank, size, prev.xp);
        promoted = nt > prev.tier ? 'up' : nt < prev.tier ? 'down' : null;
        tier = nt;
      }
      if (tier !== xp.leagueTier) await updateUserRecord(userId, { leagueTier: tier } as any);
      // entra no grupo com vaga (ou abre um novo)
      const groups = await db
        .select({ groupNo: schema.leagueWeeks.groupNo, n: sql<number>`count(*)` })
        .from(schema.leagueWeeks)
        .where(and(eq(schema.leagueWeeks.week, week), eq(schema.leagueWeeks.tier, tier)))
        .groupBy(schema.leagueWeeks.groupNo)
        .orderBy(asc(schema.leagueWeeks.groupNo));
      const open = groups.find((g) => Number(g.n) < LEAGUE_GROUP_SIZE);
      const groupNo = open ? open.groupNo : (groups.at(-1)?.groupNo ?? 0) + 1;
      await db.insert(schema.leagueWeeks).values({ userId, week, tier, groupNo, xp: weekXp }).onConflictDoNothing();
      [mine] = await db.select().from(schema.leagueWeeks).where(and(eq(schema.leagueWeeks.userId, userId), eq(schema.leagueWeeks.week, week)));
      if (!mine) return null;
    } else if (mine.xp !== weekXp) {
      await db.update(schema.leagueWeeks).set({ xp: weekXp, updatedAt: new Date() }).where(and(eq(schema.leagueWeeks.userId, userId), eq(schema.leagueWeeks.week, week)));
      mine = { ...mine, xp: weekXp };
    }

    const rows = await db
      .select({ userId: schema.leagueWeeks.userId, xp: schema.leagueWeeks.xp, name: schema.users.name, avatarUrl: schema.users.avatarUrl, level: schema.users.level, optOut: schema.users.leagueOptOut })
      .from(schema.leagueWeeks)
      .innerJoin(schema.users, eq(schema.users.id, schema.leagueWeeks.userId))
      .where(and(eq(schema.leagueWeeks.week, week), eq(schema.leagueWeeks.tier, mine.tier), eq(schema.leagueWeeks.groupNo, mine.groupNo)));
    const visible = rows.filter((r) => !r.optOut || r.userId === userId);
    const sorted = visible.slice().sort((a, b) => b.xp - a.xp || a.userId - b.userId);
    return {
      week,
      endsAt: shiftDay(week, 6),
      tier: mine.tier,
      name: leagueName(mine.tier),
      promoted,
      size: sorted.length,
      standings: sorted.map((r, i) => ({
        rank: i + 1,
        userId: r.userId,
        name: displayName(r.name),
        initials: initials(r.name),
        avatarUrl: r.avatarUrl || null,
        level: r.level || 1,
        xp: r.xp,
        me: r.userId === userId,
      })),
    };
  } catch (e) {
    console.error('[ligas]', e);
    return null;
  }
}
