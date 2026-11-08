// Stories dentro do Ritmo: conquistas e atividades que somem em 24 h, e o "ao vivo" (treinando, em foco).
// Só entra story quando a pessoa toca em "Story no Ritmo" ou ligou "Publicar minhas conquistas nos stories".
import { and, asc, desc, eq, gt, inArray, lt, sql } from 'drizzle-orm';
import { db } from '../../db/index.js';
import * as schema from '../../db/schema.js';
import { checkDb } from './server-db.js';
import { displayName, initials, normalizeText } from './feed-rules.js';
import { sanitizeShare } from './share-card.js';
import { mediaOwnedBy, parseMediaUrl, mediaUrl } from './media.js';

export class StoryError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const STORY_LIMITS = { perDay: 20, ttlHours: 24, railAuthors: 30, captionMax: 150, hideAfterReports: 3 };

const COLOR_RE = /^#[0-9a-f]{6}$/i;
const short = (v: unknown, max: number) => normalizeText(v, max).replace(/\s+/g, ' ');

async function need() {
  if (!(await checkDb())) throw new StoryError(503, 'Stories indisponíveis agora.');
}

/** Publica um story a partir do cartão de conquista. `auto` = veio da opção automática (não repete o mesmo). */
export async function createStory(userId: number, raw: any, auto = false) {
  await need();
  const base = sanitizeShare(raw);
  if (!base) throw new StoryError(400, 'Story inválido.');
  const tag = short(raw?.tag, 40);
  const big = raw?.big ? short(raw.big, 12) : null;
  const bigLabel = raw?.bigLabel ? short(raw.bigLabel, 30) : null;
  const color = COLOR_RE.test(String(raw?.color || '')) ? String(raw.color) : '#34d399';
  const now = new Date();
  // limpa os vencidos há mais de um dia (barato e evita tabela crescendo)
  await db.delete(schema.stories).where(lt(schema.stories.expiresAt, new Date(now.getTime() - 86400_000))).catch(() => null);
  const since = new Date(now.getTime() - 86400_000);
  const mine = await db
    .select({ title: schema.stories.title, kind: schema.stories.kind })
    .from(schema.stories)
    .where(and(eq(schema.stories.userId, userId), gt(schema.stories.createdAt, since), eq(schema.stories.live, false)));
  if (mine.some((s) => s.kind === base.kind && s.title === base.title)) {
    if (auto) return null; // o automático não repete
    throw new StoryError(409, 'Esse story já está no ar.');
  }
  if (mine.length >= STORY_LIMITS.perDay) {
    if (auto) return null;
    throw new StoryError(429, 'Você já publicou muitos stories hoje.');
  }
  const [row] = await db
    .insert(schema.stories)
    .values({ userId, ...base, tag, big, bigLabel, color, auto, live: false, expiresAt: new Date(now.getTime() + STORY_LIMITS.ttlHours * 3600_000) })
    .returning({ id: schema.stories.id });
  return row;
}

const LIVE: Record<string, { emoji: string; title: string; color: string }> = {
  treino: { emoji: '🏃', title: 'Treinando agora', color: '#38bdf8' },
  foco: { emoji: '🎯', title: 'Em foco agora', color: '#a855f7' },
};

/** "Ao vivo": mostra para os amigos que a pessoa está treinando ou em foco (some sozinho no fim). */
export async function startLive(userId: number, kind: unknown, detail: unknown, minutes: unknown) {
  await need();
  const k = String(kind);
  const def = LIVE[k];
  if (!def) throw new StoryError(400, 'Tipo inválido.');
  const mins = Math.max(5, Math.min(240, Math.round(Number(minutes) || (k === 'treino' ? 120 : 30))));
  await stopLive(userId);
  await db.insert(schema.stories).values({
    userId,
    kind: `live_${k}`,
    emoji: def.emoji,
    tag: 'AO VIVO',
    title: def.title,
    subtitle: short(detail, 60),
    color: def.color,
    live: true,
    auto: true,
    expiresAt: new Date(Date.now() + (mins + 5) * 60_000),
  });
}

export async function stopLive(userId: number) {
  await need();
  await db.delete(schema.stories).where(and(eq(schema.stories.userId, userId), eq(schema.stories.live, true)));
}

export async function setStoryAuto(userId: number, value: boolean) {
  await need();
  await db.update(schema.users).set({ storyAuto: value }).where(eq(schema.users.id, userId));
}

/** Faixa de stories: quem você segue primeiro, depois você, depois o resto da comunidade (mais recentes). */
export async function storyRail(viewerId: number) {
  await need();
  const now = new Date();
  const rows = await db
    .select({
      userId: schema.stories.userId,
      n: sql<number>`count(*)`,
      live: sql<boolean>`bool_or(${schema.stories.live})`,
      latest: sql<string>`max(${schema.stories.createdAt})`,
      seen: sql<number>`count(${schema.storyViews.storyId})`,
    })
    .from(schema.stories)
    .innerJoin(schema.users, eq(schema.users.id, schema.stories.userId))
    .leftJoin(schema.storyViews, and(eq(schema.storyViews.storyId, schema.stories.id), eq(schema.storyViews.userId, viewerId)))
    .where(and(gt(schema.stories.expiresAt, now), sql`((${schema.users.feedMuted} = false and ${schema.stories.hidden} = false) or ${schema.users.id} = ${viewerId})`))
    .groupBy(schema.stories.userId)
    .orderBy(desc(sql`max(${schema.stories.createdAt})`))
    .limit(200);
  if (!rows.length) return [];
  const follows = new Set(
    (await db.select({ id: schema.follows.followeeId }).from(schema.follows).where(eq(schema.follows.followerId, viewerId))).map((r) => r.id)
  );
  const ids = rows.map((r) => r.userId);
  const people = await db.select({ id: schema.users.id, name: schema.users.name, avatarUrl: schema.users.avatarUrl, level: schema.users.level }).from(schema.users).where(inArray(schema.users.id, ids));
  const byId = new Map(people.map((p) => [p.id, p]));
  const out = rows.map((r) => {
    const p = byId.get(r.userId);
    const me = r.userId === viewerId;
    return {
      userId: r.userId,
      name: me ? 'Você' : displayName(p?.name),
      initials: initials(p?.name),
      avatarUrl: p?.avatarUrl || null,
      level: p?.level || 1,
      count: Number(r.n) || 0,
      live: Boolean(r.live),
      unseen: !me && Number(r.seen) < Number(r.n),
      me,
      following: follows.has(r.userId),
      latest: r.latest,
    };
  });
  // ordem: ao vivo de quem você segue, quem você segue com novidade, você, o resto
  const score = (x: (typeof out)[number]) => (x.live && x.following ? 0 : x.following && x.unseen ? 1 : x.me ? 2 : x.following ? 3 : x.unseen ? 4 : 5);
  return out.sort((a, b) => score(a) - score(b) || String(b.latest).localeCompare(String(a.latest))).slice(0, STORY_LIMITS.railAuthors);
}

/** Stories no ar de uma pessoa (mais antigos primeiro, como sempre é nos stories). */
export async function userStories(viewerId: number, authorId: number) {
  await need();
  if (!Number.isInteger(authorId) || authorId <= 0) throw new StoryError(400, 'Perfil inválido.');
  const [author] = await db.select({ id: schema.users.id, name: schema.users.name, avatarUrl: schema.users.avatarUrl, level: schema.users.level, feedMuted: schema.users.feedMuted }).from(schema.users).where(eq(schema.users.id, authorId));
  if (!author || (author.feedMuted && authorId !== viewerId)) return { author: null, stories: [] };
  const list = await db
    .select()
    .from(schema.stories)
    .where(and(eq(schema.stories.userId, authorId), gt(schema.stories.expiresAt, new Date()), ...(authorId === viewerId ? [] : [eq(schema.stories.hidden, false)])))
    .orderBy(desc(schema.stories.live), asc(schema.stories.createdAt))
    .limit(40);
  const ids = list.map((s) => s.id);
  const views = ids.length
    ? await db
        .select({ storyId: schema.storyViews.storyId, userId: schema.storyViews.userId, clapped: schema.storyViews.clapped })
        .from(schema.storyViews)
        .where(inArray(schema.storyViews.storyId, ids))
    : [];
  const mine = authorId === viewerId;
  return {
    author: { userId: author.id, name: mine ? 'Você' : displayName(author.name), initials: initials(author.name), avatarUrl: author.avatarUrl || null, level: author.level || 1, me: mine },
    stories: list.map((s) => {
      const v = views.filter((x) => x.storyId === s.id);
      return {
        id: s.id,
        kind: s.kind,
        emoji: s.emoji,
        tag: s.tag,
        title: s.title,
        subtitle: s.subtitle,
        big: s.big,
        bigLabel: s.bigLabel,
        color: s.color,
        live: s.live,
        imageUrl: s.imageUrl || null,
        hidden: mine ? s.hidden : false,
        createdAt: s.createdAt.toISOString(),
        expiresAt: s.expiresAt.toISOString(),
        seen: mine || v.some((x) => x.userId === viewerId),
        clappedByMe: v.some((x) => x.userId === viewerId && x.clapped),
        claps: v.filter((x) => x.clapped).length,
        // quantas pessoas viram: só o dono enxerga
        views: mine ? v.length : null,
      };
    }),
  };
}

async function storyAuthor(storyId: number) {
  if (!Number.isInteger(storyId) || storyId <= 0) throw new StoryError(400, 'Story inválido.');
  const [s] = await db.select({ userId: schema.stories.userId }).from(schema.stories).where(and(eq(schema.stories.id, storyId), gt(schema.stories.expiresAt, new Date())));
  if (!s) throw new StoryError(404, 'Esse story já saiu do ar.');
  return s.userId;
}

export async function viewStory(viewerId: number, storyId: number) {
  await need();
  const author = await storyAuthor(storyId);
  if (author === viewerId) return;
  await db.insert(schema.storyViews).values({ storyId, userId: viewerId }).onConflictDoNothing();
}

/** Aplaudir (👏) um story. Tocar de novo tira o aplauso. */
export async function clapStory(viewerId: number, storyId: number) {
  await need();
  const author = await storyAuthor(storyId);
  if (author === viewerId) throw new StoryError(400, 'Você não pode aplaudir o próprio story.');
  await db.insert(schema.storyViews).values({ storyId, userId: viewerId }).onConflictDoNothing();
  const [row] = await db
    .update(schema.storyViews)
    .set({ clapped: sql`not ${schema.storyViews.clapped}` })
    .where(and(eq(schema.storyViews.storyId, storyId), eq(schema.storyViews.userId, viewerId)))
    .returning({ clapped: schema.storyViews.clapped });
  const [{ n }] = await db.select({ n: sql<number>`count(*)` }).from(schema.storyViews).where(and(eq(schema.storyViews.storyId, storyId), eq(schema.storyViews.clapped, true)));
  return { clapped: Boolean(row?.clapped), claps: Number(n) || 0 };
}

export async function deleteStory(userId: number, storyId: number) {
  await need();
  await db.delete(schema.stories).where(and(eq(schema.stories.id, storyId), eq(schema.stories.userId, userId)));
}

/** A pessoa tem story no ar? (anel em volta da foto no perfil) */
export async function hasActiveStory(userId: number): Promise<{ any: boolean; live: boolean }> {
  if (!(await checkDb())) return { any: false, live: false };
  const [r] = await db
    .select({ n: sql<number>`count(*)`, live: sql<boolean>`coalesce(bool_or(${schema.stories.live}), false)` })
    .from(schema.stories)
    .where(and(eq(schema.stories.userId, userId), gt(schema.stories.expiresAt, new Date())));
  return { any: Number(r?.n) > 0, live: Boolean(r?.live) };
}

/** Story com foto (a foto já foi enviada em /api/media pela própria pessoa). */
export async function createPhotoStory(userId: number, imageUrl: unknown, caption: unknown) {
  await need();
  const [u] = await db.select({ muted: schema.users.feedMuted }).from(schema.users).where(eq(schema.users.id, userId));
  if (u?.muted) throw new StoryError(403, 'Você está temporariamente sem permissão para publicar. Fale com o suporte.');
  const key = parseMediaUrl(imageUrl);
  if (!key || !(await mediaOwnedBy(imageUrl, userId))) throw new StoryError(400, 'Envie a foto de novo.');
  const text = short(caption, STORY_LIMITS.captionMax);
  if (/https?:|www\./i.test(text)) throw new StoryError(400, 'A legenda não pode ter links.');
  const since = new Date(Date.now() - 86400_000);
  const [{ n }] = await db.select({ n: sql<number>`count(*)` }).from(schema.stories).where(and(eq(schema.stories.userId, userId), gt(schema.stories.createdAt, since), eq(schema.stories.live, false)));
  if (Number(n) >= STORY_LIMITS.perDay) throw new StoryError(429, 'Você já publicou muitos stories hoje.');
  const [row] = await db
    .insert(schema.stories)
    .values({ userId, kind: 'foto', emoji: '📷', tag: '', title: text || 'Foto', subtitle: '', color: '#34d399', imageUrl: mediaUrl(key), live: false, auto: false, expiresAt: new Date(Date.now() + STORY_LIMITS.ttlHours * 3600_000) })
    .returning({ id: schema.stories.id });
  return row;
}

/** Denunciar um story. Com 3 denúncias ele sai do ar até o administrador olhar. */
export async function reportStory(viewerId: number, storyId: number, reason: unknown) {
  await need();
  const author = await storyAuthor(storyId);
  if (author === viewerId) throw new StoryError(400, 'Você não pode denunciar o próprio story.');
  const [dup] = await db
    .select({ id: schema.feedReports.id })
    .from(schema.feedReports)
    .where(and(eq(schema.feedReports.targetType, 'story'), eq(schema.feedReports.targetId, storyId), eq(schema.feedReports.reporterUserId, viewerId)));
  if (!dup) await db.insert(schema.feedReports).values({ targetType: 'story', targetId: storyId, reporterUserId: viewerId, reason: short(reason, 200) || 'Story impróprio' });
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)` })
    .from(schema.feedReports)
    .where(and(eq(schema.feedReports.targetType, 'story'), eq(schema.feedReports.targetId, storyId), eq(schema.feedReports.status, 'open')));
  const hidden = Number(n) >= STORY_LIMITS.hideAfterReports;
  if (hidden) await db.update(schema.stories).set({ hidden: true }).where(eq(schema.stories.id, storyId));
  return { reported: true, hidden };
}
