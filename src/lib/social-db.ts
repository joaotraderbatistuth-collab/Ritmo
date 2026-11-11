// Parte social com banco: "Atividade" (quem interagiu com a pessoa), contagem de novidades,
// sugestões de quem seguir e os avisos no celular de curtida e comentário.
import { and, desc, eq, gt, inArray, ne, notInArray, sql } from 'drizzle-orm';
import { db } from '../../db/index.js';
import * as schema from '../../db/schema.js';
import { checkDb } from './server-db.js';
import { displayName, initials } from './feed-rules.js';
import { parseMediaUrl } from './media-url.js';
import { levelDef, MAX_LEVEL } from './levels.js';
import { mondayOfDay } from './game-extras.js';
import { ACTIVITY_DAYS, ACTIVITY_MAX, mergeActivity, rankSuggestions, snippet, socialPush } from './social.js';
import type { SocialEvent } from './social.js';

const count = sql<number>`count(*)::int`;
const iso = (v: unknown) => (v instanceof Date ? v.toISOString() : String(v || ''));

async function seenAtOf(userId: number): Promise<Date | null> {
  const [u] = await db.select({ seen: schema.users.socialSeenAt }).from(schema.users).where(eq(schema.users.id, userId));
  return u?.seen || null;
}

async function people(ids: number[]) {
  if (!ids.length) return new Map<number, { id: number; name: string; initials: string; avatarUrl: string | null; level: number; levelName: string }>();
  const rows = await db.select({ id: schema.users.id, name: schema.users.name, avatarUrl: schema.users.avatarUrl, level: schema.users.level }).from(schema.users).where(inArray(schema.users.id, ids));
  return new Map(
    rows.map((r) => {
      const level = Math.min(Math.max(Number(r.level) || 1, 1), MAX_LEVEL);
      return [r.id, { id: r.id, name: displayName(r.name), initials: initials(r.name), avatarUrl: r.avatarUrl && parseMediaUrl(r.avatarUrl) ? r.avatarUrl : null, level, levelName: levelDef(level).name }];
    })
  );
}

/** Quantas interações novas desde a última vez que a pessoa abriu a Atividade (para o selo no menu). */
export async function socialUnread(userId: number): Promise<number> {
  if (!(await checkDb())) return 0;
  try {
    const seen = (await seenAtOf(userId)) || new Date(Date.now() - ACTIVITY_DAYS * 86400_000);
    const [likes, comments, follows, claps] = await Promise.all([
      db.select({ n: count }).from(schema.feedLikes).innerJoin(schema.feedPosts, eq(schema.feedPosts.id, schema.feedLikes.postId)).where(and(eq(schema.feedPosts.userId, userId), ne(schema.feedLikes.userId, userId), gt(schema.feedLikes.createdAt, seen))),
      db.select({ n: count }).from(schema.feedComments).innerJoin(schema.feedPosts, eq(schema.feedPosts.id, schema.feedComments.postId)).where(and(eq(schema.feedPosts.userId, userId), ne(schema.feedComments.userId, userId), eq(schema.feedComments.status, 'visible'), gt(schema.feedComments.createdAt, seen))),
      db.select({ n: count }).from(schema.follows).where(and(eq(schema.follows.followeeId, userId), gt(schema.follows.createdAt, seen))),
      db.select({ n: count }).from(schema.storyViews).innerJoin(schema.stories, eq(schema.stories.id, schema.storyViews.storyId)).where(and(eq(schema.stories.userId, userId), ne(schema.storyViews.userId, userId), eq(schema.storyViews.clapped, true), gt(schema.storyViews.createdAt, seen))),
    ]);
    return [likes, comments, follows, claps].reduce((s, r) => s + (Number(r[0]?.n) || 0), 0);
  } catch (e) {
    console.error('[social] novidades', e);
    return 0;
  }
}

/** Lista "Atividade": quem curtiu, comentou, aplaudiu ou começou a seguir nos últimos 30 dias. */
export async function socialActivity(userId: number) {
  if (!(await checkDb())) return { items: [], unread: 0 };
  const since = new Date(Date.now() - ACTIVITY_DAYS * 86400_000);
  const [seen, likes, comments, follows, claps, mine] = await Promise.all([
    seenAtOf(userId),
    db.select({ at: schema.feedLikes.createdAt, actorId: schema.feedLikes.userId, postId: schema.feedLikes.postId, body: schema.feedPosts.body }).from(schema.feedLikes).innerJoin(schema.feedPosts, eq(schema.feedPosts.id, schema.feedLikes.postId)).where(and(eq(schema.feedPosts.userId, userId), ne(schema.feedLikes.userId, userId), gt(schema.feedLikes.createdAt, since))).orderBy(desc(schema.feedLikes.id)).limit(ACTIVITY_MAX),
    db.select({ at: schema.feedComments.createdAt, actorId: schema.feedComments.userId, postId: schema.feedComments.postId, body: schema.feedComments.body }).from(schema.feedComments).innerJoin(schema.feedPosts, eq(schema.feedPosts.id, schema.feedComments.postId)).where(and(eq(schema.feedPosts.userId, userId), ne(schema.feedComments.userId, userId), eq(schema.feedComments.status, 'visible'), gt(schema.feedComments.createdAt, since))).orderBy(desc(schema.feedComments.id)).limit(ACTIVITY_MAX),
    db.select({ at: schema.follows.createdAt, actorId: schema.follows.followerId }).from(schema.follows).where(and(eq(schema.follows.followeeId, userId), gt(schema.follows.createdAt, since))).orderBy(desc(schema.follows.createdAt)).limit(ACTIVITY_MAX),
    db.select({ at: schema.storyViews.createdAt, actorId: schema.storyViews.userId }).from(schema.storyViews).innerJoin(schema.stories, eq(schema.stories.id, schema.storyViews.storyId)).where(and(eq(schema.stories.userId, userId), ne(schema.storyViews.userId, userId), eq(schema.storyViews.clapped, true), gt(schema.storyViews.createdAt, since))).orderBy(desc(schema.storyViews.createdAt)).limit(ACTIVITY_MAX),
    db.select({ id: schema.follows.followeeId }).from(schema.follows).where(eq(schema.follows.followerId, userId)).limit(2000),
  ]);
  const events: SocialEvent[] = [
    ...likes.map((r) => ({ kind: 'like' as const, at: iso(r.at), actorId: r.actorId, postId: r.postId, text: snippet(r.body, 60) })),
    ...comments.map((r) => ({ kind: 'comment' as const, at: iso(r.at), actorId: r.actorId, postId: r.postId, text: snippet(r.body, 120) })),
    ...follows.map((r) => ({ kind: 'follow' as const, at: iso(r.at), actorId: r.actorId })),
    ...claps.map((r) => ({ kind: 'clap' as const, at: iso(r.at), actorId: r.actorId })),
  ];
  const merged = mergeActivity(events, seen ? seen.toISOString() : null);
  const who = await people([...new Set(merged.items.map((e) => e.actorId))]);
  const iFollow = new Set(mine.map((m) => m.id));
  return {
    unread: merged.unread,
    items: merged.items.filter((e) => who.has(e.actorId)).map((e) => ({ ...e, actor: who.get(e.actorId)!, followedByMe: iFollow.has(e.actorId) })),
  };
}

export async function markSocialSeen(userId: number) {
  if (!(await checkDb())) return;
  // usa o relógio do banco (o mesmo das curtidas e comentários), para a comparação não depender do fuso do servidor
  await db.update(schema.users).set({ socialSeenAt: sql`now()` } as any).where(eq(schema.users.id, userId));
}

/** Sugestões de quem seguir: gente ativa que a pessoa ainda não segue (quem já segue ela vem primeiro). */
export async function suggestFollows(userId: number, today: string) {
  if (!(await checkDb())) return [];
  const mine = await db.select({ id: schema.follows.followeeId }).from(schema.follows).where(eq(schema.follows.followerId, userId)).limit(2000);
  const skip = [userId, ...mine.map((m) => m.id)];
  const cols = { id: schema.users.id, name: schema.users.name, avatarUrl: schema.users.avatarUrl, level: schema.users.level, bio: schema.users.bio, xpTotal: schema.users.xpTotal, weekKey: schema.users.weekKey, weekXp: schema.users.weekXp };
  const [fans, top] = await Promise.all([
    db.select(cols).from(schema.follows).innerJoin(schema.users, eq(schema.users.id, schema.follows.followerId)).where(and(eq(schema.follows.followeeId, userId), notInArray(schema.users.id, skip), eq(schema.users.feedMuted, false))).limit(30),
    db.select(cols).from(schema.users).where(and(notInArray(schema.users.id, skip), eq(schema.users.feedMuted, false))).orderBy(desc(schema.users.xpTotal)).limit(40),
  ]);
  const fanIds = new Set(fans.map((f) => f.id));
  const all = [...new Map([...fans, ...top].map((u) => [u.id, u])).values()];
  if (!all.length) return [];
  const since = new Date(Date.now() - 14 * 86400_000);
  const posts = await db.select({ userId: schema.feedPosts.userId, n: count }).from(schema.feedPosts).where(and(inArray(schema.feedPosts.userId, all.map((u) => u.id)), eq(schema.feedPosts.status, 'visible'), gt(schema.feedPosts.createdAt, since), sql`${schema.feedPosts.teamId} is null`)).groupBy(schema.feedPosts.userId);
  const postMap = new Map(posts.map((p) => [p.userId, Number(p.n) || 0]));
  const week = mondayOfDay(today);
  const ranked = rankSuggestions(
    all.map((u) => ({ id: u.id, weekXp: u.weekKey === week ? u.weekXp || 0 : 0, xpTotal: u.xpTotal || 0, recentPosts: postMap.get(u.id) || 0, followsMe: fanIds.has(u.id), hasPhoto: Boolean(u.avatarUrl), u }))
  );
  return ranked.map(({ u, followsMe, weekXp }) => {
    const level = Math.min(Math.max(Number(u.level) || 1, 1), MAX_LEVEL);
    return { id: u.id, name: displayName(u.name), initials: initials(u.name), avatarUrl: u.avatarUrl && parseMediaUrl(u.avatarUrl) ? u.avatarUrl : null, level, levelName: levelDef(level).name, bio: u.bio || '', followsMe, weekXp };
  });
}

/** Avisa no celular o dono da publicação (dentro do teto diário: no máximo 1 de curtida e 1 de comentário por dia). */
export function notifySocial(kind: 'like' | 'comment', actorId: number, ownerId: number, postId: number, text?: string | null) {
  if (actorId === ownerId) return;
  (async () => {
    const [me] = await db.select({ name: schema.users.name }).from(schema.users).where(eq(schema.users.id, actorId));
    const { notifyAuto } = await import('./push-server.js');
    await notifyAuto(ownerId, kind === 'like' ? 'curtida' : 'comentario', { ...socialPush(kind, displayName(me?.name), text), tab: 'feed', tag: `ritmo-${kind}-${postId}` });
  })().catch(() => null);
}
