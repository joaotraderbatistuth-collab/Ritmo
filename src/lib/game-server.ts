// Junta pontos, missões do dia, baú, ofensiva, resumo da semana e liga para a tela.
import { and, asc, desc, eq, lt, sql } from 'drizzle-orm';
import { db } from '../../db/index.js';
import * as schema from '../../db/schema.js';
import { checkDb, updateUserRecord } from './server-db.js';
import { UserXp, getUserXp } from './xp-server.js';
import { computeMedals, monthRecap } from './medals.js';
import { levelInfo } from './levels.js';
import { SEASON_GROUP_SIZE, daysLeftIn, division, lastDayOf, monthOf, nextDivision, prevMonth, rankOf, seasonGoals, seasonLabel, seasonNudge, seasonPoints, zoneFor, zoneSizes } from './season.js';
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
  let trainDaysWeek = 0;
  for (let i = 0; i < 7; i++) if ((xp.days[shiftDay(thisWeek, i)]?.raw.treino || 0) > 0) trainDaysWeek++;
  const level = levelInfo(xp.total).level;
  const medalCounts = Object.fromEntries(Object.entries(xp.breakdown).map(([k, v]) => [k, v.count]));
  const medals = computeMedals({
    days: xp.days as any,
    counts: medalCounts,
    activeDays: xp.activeDays,
    bestStreak: Math.max(streak.best || 0, streak.days || 0),
    level,
    seasonMaxTier: xp.seasonMaxTier,
    workouts: xp.workoutsLite,
    challengesDone: xp.challengesDone,
  });
  const month = today.slice(0, 7);
  const recap = { current: monthRecap(xp.days as any, xp.workoutsLite, month), previous: monthRecap(xp.days as any, xp.workoutsLite, prevMonth(month)) };
  return {
    medals,
    recap,
    todayCounts: raw,
    trainDaysWeek,
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

/* ------------------------------------------------------------------ */
/* Temporada mensal (divisões)                                         */
/* ------------------------------------------------------------------ */

/**
 * Atualiza os pontos do mês e devolve a classificação do grupo.
 * Na primeira visita do mês: fecha o mês anterior (sobe, fica ou desce) e entra num grupo da nova divisão.
 */
export async function syncSeason(userId: number, xp: UserXp) {
  if (xp.leagueOptOut || !(await checkDb())) return null;
  const month = monthOf(xp.today);
  const points = seasonPoints(xp.days, month);
  const T = schema.seasonMonths;
  try {
    let [mine] = await db.select().from(T).where(and(eq(T.userId, userId), eq(T.month, month)));
    if (!mine) {
      let tier = xp.seasonTier;
      let cameFrom = 'new';
      let prevRank: number | null = null;
      const [prev] = await db.select().from(T).where(and(eq(T.userId, userId), lt(T.month, month))).orderBy(desc(T.month)).limit(1);
      if (prev) {
        if (prev.month === prevMonth(month)) {
          const group = await db.select({ userId: T.userId, xp: T.xp }).from(T).where(and(eq(T.month, prev.month), eq(T.tier, prev.tier), eq(T.groupNo, prev.groupNo)));
          const { rank, size } = rankOf(group, userId);
          tier = nextDivision(prev.tier, rank, size, prev.xp);
          prevRank = rank;
        } else {
          // ficou um mês ou mais sem aparecer: desce uma divisão (nunca abaixo do Bronze)
          tier = Math.max(0, prev.tier - 1);
        }
        cameFrom = tier > prev.tier ? 'up' : tier < prev.tier ? 'down' : 'stay';
      }
      if (tier !== xp.seasonTier) await updateUserRecord(userId, { seasonTier: tier } as any);
      const groups = await db
        .select({ groupNo: T.groupNo, n: sql<number>`count(*)` })
        .from(T)
        .where(and(eq(T.month, month), eq(T.tier, tier)))
        .groupBy(T.groupNo)
        .orderBy(asc(T.groupNo));
      const open = groups.find((g) => Number(g.n) < SEASON_GROUP_SIZE);
      const groupNo = open ? open.groupNo : (groups.at(-1)?.groupNo ?? 0) + 1;
      await db.insert(T).values({ userId, month, tier, groupNo, xp: points, cameFrom, prevRank }).onConflictDoNothing();
      [mine] = await db.select().from(T).where(and(eq(T.userId, userId), eq(T.month, month)));
      if (!mine) return null;
    } else if (mine.xp !== points) {
      const before = mine.xp;
      await db.update(T).set({ xp: points, updatedAt: new Date() }).where(and(eq(T.userId, userId), eq(T.month, month)));
      mine = { ...mine, xp: points };
      if (points > before) warnOvertaken(userId, month, mine.tier, mine.groupNo, before, points).catch(() => null);
    }

    const rows = await db
      .select({ userId: T.userId, xp: T.xp, name: schema.users.name, avatarUrl: schema.users.avatarUrl, level: schema.users.level, optOut: schema.users.leagueOptOut })
      .from(T)
      .innerJoin(schema.users, eq(schema.users.id, T.userId))
      .where(and(eq(T.month, month), eq(T.tier, mine.tier), eq(T.groupNo, mine.groupNo)));
    const visible = rows.filter((r) => !r.optOut || r.userId === userId);
    const { sorted } = rankOf(visible, userId);
    const size = sorted.length;
    const standings = sorted.map((r, i) => ({
      rank: i + 1,
      userId: r.userId,
      name: displayName(r.name),
      initials: initials(r.name),
      avatarUrl: r.avatarUrl || null,
      level: r.level || 1,
      xp: r.xp,
      me: r.userId === userId,
      zone: zoneFor(mine!.tier, i + 1, size, r.xp),
    }));
    const meRow = standings.find((s) => s.me);
    const daysLeft = daysLeftIn(month, xp.today);
    const goals = seasonGoals(mine.tier, standings);
    const history = await db.select({ month: T.month, tier: T.tier, xp: T.xp }).from(T).where(eq(T.userId, userId)).orderBy(desc(T.month)).limit(12);
    const div = division(mine.tier);
    const zones = zoneSizes(mine.tier, size);
    return {
      month,
      label: seasonLabel(month),
      endsAt: lastDayOf(month),
      daysLeft,
      tier: mine.tier,
      division: { name: div.name, color: div.color, emoji: div.emoji, promotePct: Math.round(div.promote * 100), relegatePct: Math.round(div.relegate * 100) },
      cameFrom: mine.cameFrom,
      prevRank: mine.prevRank,
      size,
      zones,
      rank: meRow?.rank ?? null,
      zone: meRow?.zone ?? 'stay',
      points: mine.xp,
      goals,
      nudge: seasonNudge(mine.tier, meRow?.zone ?? 'stay', goals, daysLeft),
      standings,
      history: history.map((h) => ({ month: h.month, tier: h.tier, name: division(h.tier).name, xp: h.xp })),
    };
  } catch (e) {
    console.error('[temporada]', e);
    return null;
  }
}

/**
 * Chamado pelo agendador: atualiza os pontos de quem não abriu o app há algumas horas, para o ranking
 * que os outros veem (e o resultado do fim do mês) ficar justo. Poucas pessoas por vez.
 */
export async function refreshSeasonPoints(limit = 25, now = new Date()) {
  if (!(await checkDb())) return { refreshed: 0 };
  const T = schema.seasonMonths;
  const brt = new Date(now.getTime() - 3 * 3600_000).toISOString().slice(0, 10);
  const month = monthOf(brt);
  const prev = prevMonth(month);
  const staleBefore = new Date(now.getTime() - 6 * 3600_000);
  // mês atual: quem está desatualizado há 6 h; mês anterior: quem não foi atualizado depois que ele acabou
  const monthStart = new Date(Date.parse(`${month}-01T03:00:00Z`));
  const rows = await db
    .select({ userId: T.userId, month: T.month })
    .from(T)
    .where(sql`(${T.month} = ${month} and ${T.updatedAt} < ${staleBefore}) or (${T.month} = ${prev} and ${T.updatedAt} < ${monthStart})`)
    .orderBy(asc(T.updatedAt))
    .limit(limit);
  let refreshed = 0;
  for (const r of rows) {
    try {
      const xp = await getUserXp(r.userId);
      const pts = xp ? seasonPoints(xp.days, r.month) : 0;
      await db.update(T).set({ xp: pts, updatedAt: new Date() }).where(and(eq(T.userId, r.userId), eq(T.month, r.month)));
      refreshed++;
    } catch (e) {
      console.error('[temporada] atualizar', e);
    }
  }
  return { refreshed };
}

/** Avisa quem acabou de ser ultrapassado no grupo (conta no teto de notificações; 1 aviso desse tipo por dia). */
async function warnOvertaken(userId: number, month: string, tier: number, groupNo: number, before: number, after: number) {
  const T = schema.seasonMonths;
  const rows = await db
    .select({ userId: T.userId, xp: T.xp, optOut: schema.users.leagueOptOut })
    .from(T)
    .innerJoin(schema.users, eq(schema.users.id, T.userId))
    .where(and(eq(T.month, month), eq(T.tier, tier), eq(T.groupNo, groupNo)));
  const passed = rows.filter((r) => r.userId !== userId && !r.optOut && r.xp >= before && r.xp < after);
  if (!passed.length) return;
  const [me] = await db.select({ name: schema.users.name }).from(schema.users).where(eq(schema.users.id, userId));
  const who = displayName(me?.name);
  const { notifyAuto } = await import('./push-server.js');
  for (const r of passed.slice(0, 5)) {
    const gap = after - r.xp + 1;
    await notifyAuto(r.userId, 'ultrapassagem', {
      title: `${who} passou você na temporada`,
      body: `Faltam ${gap} ${gap === 1 ? 'ponto' : 'pontos'} para você voltar à frente. Um hábito ou um foco já resolve.`,
      tab: 'progresso',
      tag: 'ritmo-ranking',
    });
  }
}
