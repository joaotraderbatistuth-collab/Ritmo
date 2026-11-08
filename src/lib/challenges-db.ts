// Desafios em dupla ou trio no banco: criar, convidar, entrar, sair e ver o progresso de cada um.
import { and, desc, eq, gte, inArray } from 'drizzle-orm';
import { db } from '../../db/index.js';
import * as schema from '../../db/schema.js';
import { checkDb } from './server-db.js';
import { CommunityError } from './community-db.js';
import { displayName, initials } from './feed-rules.js';
import { getUserXp, UserXp } from './xp-server.js';
import {
  CHALLENGE_DURATIONS,
  CHALLENGE_MAX_ACTIVE,
  CHALLENGE_MAX_MEMBERS,
  ChallengeKind,
  addDaysYmd,
  challengeCode,
  challengeNudge,
  challengeProgress,
  challengeStatus,
  clampTarget,
  isChallengeCode,
  isChallengeKind,
  kindDef,
} from './challenges.js';

const C = schema.challenges;
const M = schema.challengeMembers;

async function needDb() {
  if (!(await checkDb())) throw new CommunityError(503, 'Os desafios precisam do banco de dados configurado.');
}

async function activeCount(userId: number, today: string) {
  const rows = await db
    .select({ id: C.id })
    .from(M)
    .innerJoin(C, eq(C.id, M.challengeId))
    .where(and(eq(M.userId, userId), inArray(M.status, ['active', 'invited']), gte(C.endDay, today)));
  return rows.length;
}

async function notify(userId: number, kind: string, title: string, body: string) {
  try {
    const { notifyAuto } = await import('./push-server.js');
    await notifyAuto(userId, kind, { title, body, tab: 'progresso', tag: 'ritmo-desafio' });
  } catch {
    // sem notificação: o convite continua aparecendo no app
  }
}

export async function createChallenge(
  userId: number,
  today: string,
  input: { kind: unknown; days: unknown; target: unknown; title?: unknown; invite?: unknown }
) {
  await needDb();
  if (!isChallengeKind(input.kind)) throw new CommunityError(400, 'Escolha o tipo do desafio.');
  const days = (CHALLENGE_DURATIONS as readonly number[]).includes(Number(input.days)) ? Number(input.days) : 7;
  const kind = input.kind as ChallengeKind;
  const target = clampTarget(kind, days, Number(input.target));
  if ((await activeCount(userId, today)) >= CHALLENGE_MAX_ACTIVE) throw new CommunityError(429, `Você já está em ${CHALLENGE_MAX_ACTIVE} desafios. Termine um antes de começar outro.`);
  const title = String(input.title ?? '').replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, 60) || `${kindDef(kind).label}: ${target} em ${days} dias`;
  let row: typeof C.$inferSelect | undefined;
  for (let i = 0; i < 5 && !row; i++) {
    [row] = await db
      .insert(C)
      .values({ code: challengeCode(), creatorId: userId, kind, target, days, startDay: today, endDay: addDaysYmd(today, days - 1), title })
      .onConflictDoNothing()
      .returning();
  }
  if (!row) throw new CommunityError(500, 'Não foi possível criar o desafio agora.');
  await db.insert(M).values({ challengeId: row.id, userId, status: 'active' });

  // convites: só para quem a pessoa segue (evita convite de desconhecidos), no máximo 2
  const ids = (Array.isArray(input.invite) ? input.invite : []).map(Number).filter((n) => Number.isInteger(n) && n > 0 && n !== userId);
  if (ids.length) {
    const allowed = await db.select({ id: schema.follows.followeeId }).from(schema.follows).where(and(eq(schema.follows.followerId, userId), inArray(schema.follows.followeeId, ids)));
    const [me] = await db.select({ name: schema.users.name }).from(schema.users).where(eq(schema.users.id, userId));
    for (const a of allowed.slice(0, CHALLENGE_MAX_MEMBERS - 1)) {
      await db.insert(M).values({ challengeId: row.id, userId: a.id, status: 'invited' }).onConflictDoNothing();
      notify(a.id, 'desafio', `${displayName(me?.name)} te chamou para um desafio`, `${title}. Topa? Abra o Ritmo para aceitar.`);
    }
  }
  return row;
}

export async function previewChallenge(code: string) {
  await needDb();
  if (!isChallengeCode(code)) throw new CommunityError(400, 'Convite inválido.');
  const [c] = await db.select().from(C).where(eq(C.code, code));
  if (!c) throw new CommunityError(404, 'Desafio não encontrado.');
  const members = await db.select({ userId: M.userId, name: schema.users.name }).from(M).innerJoin(schema.users, eq(schema.users.id, M.userId)).where(and(eq(M.challengeId, c.id), eq(M.status, 'active')));
  const [creator] = await db.select({ name: schema.users.name }).from(schema.users).where(eq(schema.users.id, c.creatorId));
  return { id: c.id, code: c.code, title: c.title, kind: c.kind, target: c.target, days: c.days, startDay: c.startDay, endDay: c.endDay, creator: displayName(creator?.name), members: members.map((m) => displayName(m.name)), full: members.length >= CHALLENGE_MAX_MEMBERS };
}

export async function joinChallenge(userId: number, today: string, code: string) {
  await needDb();
  if (!isChallengeCode(code)) throw new CommunityError(400, 'Convite inválido.');
  const [c] = await db.select().from(C).where(eq(C.code, code));
  if (!c) throw new CommunityError(404, 'Desafio não encontrado.');
  if (c.endDay < today) throw new CommunityError(400, 'Esse desafio já terminou.');
  const [mine] = await db.select().from(M).where(and(eq(M.challengeId, c.id), eq(M.userId, userId)));
  if (mine?.status === 'active') return c;
  const active = await db.select({ u: M.userId }).from(M).where(and(eq(M.challengeId, c.id), eq(M.status, 'active')));
  if (active.length >= CHALLENGE_MAX_MEMBERS) throw new CommunityError(400, 'Esse desafio já está completo.');
  if ((await activeCount(userId, today)) >= CHALLENGE_MAX_ACTIVE && !mine) throw new CommunityError(429, `Você já está em ${CHALLENGE_MAX_ACTIVE} desafios.`);
  if (mine) await db.update(M).set({ status: 'active', joinedAt: new Date() }).where(and(eq(M.challengeId, c.id), eq(M.userId, userId)));
  else await db.insert(M).values({ challengeId: c.id, userId, status: 'active' });
  const [me] = await db.select({ name: schema.users.name }).from(schema.users).where(eq(schema.users.id, userId));
  for (const a of active) if (a.u !== userId) notify(a.u, 'desafio', `${displayName(me?.name)} entrou no desafio`, `${c.title}. Agora é com vocês!`);
  return c;
}

export async function setMemberStatus(userId: number, challengeId: number, status: 'active' | 'declined' | 'left', today: string) {
  await needDb();
  const [c] = await db.select().from(C).where(eq(C.id, challengeId));
  if (!c) throw new CommunityError(404, 'Desafio não encontrado.');
  if (status === 'active') return joinChallenge(userId, today, c.code);
  await db.update(M).set({ status }).where(and(eq(M.challengeId, challengeId), eq(M.userId, userId)));
  return c;
}

/** Desafios da pessoa (ativos, convites e os que terminaram nos últimos 14 dias), com o progresso de cada membro. */
export async function listChallenges(userId: number, today: string, myXp?: UserXp | null) {
  if (!(await checkDb())) return [];
  const since = addDaysYmd(today, -14);
  const mine = await db
    .select({ c: C, status: M.status })
    .from(M)
    .innerJoin(C, eq(C.id, M.challengeId))
    .where(and(eq(M.userId, userId), inArray(M.status, ['active', 'invited']), gte(C.endDay, since)))
    .orderBy(desc(C.createdAt))
    .limit(8);
  if (!mine.length) return [];
  const ids = mine.map((m) => m.c.id);
  const members = await db
    .select({ challengeId: M.challengeId, userId: M.userId, status: M.status, name: schema.users.name, avatarUrl: schema.users.avatarUrl, level: schema.users.level })
    .from(M)
    .innerJoin(schema.users, eq(schema.users.id, M.userId))
    .where(and(inArray(M.challengeId, ids), inArray(M.status, ['active', 'invited'])));
  const cache = new Map<number, UserXp | null>();
  if (myXp) cache.set(userId, myXp);
  const xpOf = async (id: number) => {
    if (!cache.has(id)) cache.set(id, await getUserXp(id).catch(() => null));
    return cache.get(id)!;
  };
  const out = [];
  for (const { c, status } of mine) {
    if (!isChallengeKind(c.kind)) continue;
    const st = challengeStatus(c.startDay, c.endDay, today);
    const rows = [];
    for (const m of members.filter((x) => x.challengeId === c.id)) {
      let value = 0;
      if (m.status === 'active') {
        const x = await xpOf(m.userId);
        // cada um no próprio fuso: "hoje" de cada pessoa
        if (x) value = challengeProgress(c.kind, x.days as any, c.startDay, c.endDay, x.today, c.target).value;
      }
      rows.push({ userId: m.userId, name: displayName(m.name), initials: initials(m.name), avatarUrl: m.avatarUrl || null, level: m.level || 1, value, done: value >= c.target, invited: m.status === 'invited', me: m.userId === userId });
    }
    rows.sort((a, b) => Number(b.me) - Number(a.me) || b.value - a.value);
    const me = rows.find((r) => r.me) || null;
    const daysLeft = st === 'ended' ? 0 : Math.max(0, Math.round((Date.parse(`${c.endDay}T12:00:00Z`) - Date.parse(`${today}T12:00:00Z`)) / 86400_000) + 1);
    out.push({
      id: c.id,
      code: c.code,
      title: c.title,
      kind: c.kind,
      emoji: kindDef(c.kind).emoji,
      unit: kindDef(c.kind).unit,
      target: c.target,
      days: c.days,
      startDay: c.startDay,
      endDay: c.endDay,
      status: st,
      daysLeft,
      myStatus: status,
      isCreator: c.creatorId === userId,
      members: rows,
      nudge: status === 'invited' ? '' : challengeNudge(c.kind, c.target, me, rows.filter((r) => !r.me && !r.invited).map((r) => ({ name: r.name, value: r.value })), daysLeft),
    });
  }
  return out;
}

/** Pessoas que a pessoa segue (para convidar). */
export async function followingForInvite(userId: number) {
  if (!(await checkDb())) return [];
  const rows = await db
    .select({ id: schema.users.id, name: schema.users.name, avatarUrl: schema.users.avatarUrl, level: schema.users.level })
    .from(schema.follows)
    .innerJoin(schema.users, eq(schema.users.id, schema.follows.followeeId))
    .where(eq(schema.follows.followerId, userId))
    .limit(200);
  return rows.map((r) => ({ id: r.id, name: displayName(r.name), initials: initials(r.name), avatarUrl: r.avatarUrl || null, level: r.level || 1 }));
}
