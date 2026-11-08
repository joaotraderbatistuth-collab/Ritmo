// Conquistas compartilhadas: cria o link público /c/<código>, guarda a prévia e conta as visualizações.
import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { db } from '../../db/index.js';
import * as schema from '../../db/schema.js';
import { checkDb, findUserById } from './server-db.js';
import { SHARE_LIMITS, isSlug, makeSlug, sanitizeShare } from './share-card.js';
import { levelInfo } from './levels.js';

export class ShareError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Cria (ou reaproveita, se for o mesmo cartão nas últimas 24 h) o link de uma conquista. */
export async function createShare(userId: number, raw: unknown): Promise<{ slug: string }> {
  const card = sanitizeShare(raw);
  if (!card) throw new ShareError(400, 'Conquista inválida.');
  if (!(await checkDb())) throw new ShareError(503, 'Compartilhamento indisponível agora.');
  const since = new Date(Date.now() - 86400_000);
  const [same] = await db
    .select({ slug: schema.shareCards.slug })
    .from(schema.shareCards)
    .where(and(eq(schema.shareCards.userId, userId), eq(schema.shareCards.kind, card.kind), eq(schema.shareCards.title, card.title), gte(schema.shareCards.createdAt, since)))
    .limit(1);
  if (same) return same;
  const [{ n }] = await db
    .select({ n: sql<number>`count(*)` })
    .from(schema.shareCards)
    .where(and(eq(schema.shareCards.userId, userId), gte(schema.shareCards.createdAt, new Date(Date.now() - 3600_000))));
  if (Number(n) >= SHARE_LIMITS.perHour) throw new ShareError(429, 'Muitos compartilhamentos seguidos. Tente daqui a pouco.');
  for (let i = 0; i < 5; i++) {
    const slug = makeSlug();
    try {
      await db.insert(schema.shareCards).values({ userId, slug, ...card });
      return { slug };
    } catch {
      // código repetido (muito raro): tenta outro
    }
  }
  throw new ShareError(500, 'Não foi possível criar o link agora.');
}

/** Guarda a prévia (JPEG pequeno) que aparece quando o link é colado no WhatsApp. */
export async function setShareImage(userId: number, slug: unknown, dataUrl: unknown): Promise<void> {
  if (!isSlug(slug)) throw new ShareError(400, 'Link inválido.');
  const m = /^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl || ''));
  if (!m || m[1].length > SHARE_LIMITS.imageMax) throw new ShareError(400, 'Imagem inválida.');
  await db.update(schema.shareCards).set({ image: m[1] }).where(and(eq(schema.shareCards.slug, slug), eq(schema.shareCards.userId, userId)));
}

export interface PublicShare {
  slug: string;
  kind: string;
  emoji: string;
  title: string;
  subtitle: string;
  hasImage: boolean;
  name: string;
  level: number;
  levelName: string;
  referralCode: string;
}

/** Dados públicos do link (só o que a pessoa escolheu mostrar: nome, nível e a conquista). */
export async function getPublicShare(slug: unknown, countView: boolean): Promise<PublicShare | null> {
  if (!isSlug(slug) || !(await checkDb())) return null;
  const [row] = await db
    .select({
      slug: schema.shareCards.slug,
      kind: schema.shareCards.kind,
      emoji: schema.shareCards.emoji,
      title: schema.shareCards.title,
      subtitle: schema.shareCards.subtitle,
      hasImage: sql<boolean>`${schema.shareCards.image} is not null`,
      userId: schema.shareCards.userId,
    })
    .from(schema.shareCards)
    .where(eq(schema.shareCards.slug, slug))
    .limit(1);
  if (!row) return null;
  const u: any = await findUserById(row.userId);
  if (!u || u.subscriptionStatus === 'suspended') return null;
  if (countView) await db.update(schema.shareCards).set({ views: sql`${schema.shareCards.views} + 1` }).where(eq(schema.shareCards.slug, slug)).catch(() => null);
  const first = String(u.name || 'Alguém').trim().split(/\s+/)[0].slice(0, 30);
  const info = levelInfo(Number(u.xpTotal) || 0);
  return { slug: row.slug, kind: row.kind, emoji: row.emoji, title: row.title, subtitle: row.subtitle, hasImage: Boolean(row.hasImage), name: first, level: info.level, levelName: info.name, referralCode: u.referralCode || '' };
}

export async function getShareImage(slug: unknown): Promise<Buffer | null> {
  if (!isSlug(slug) || !(await checkDb())) return null;
  const [row] = await db.select({ image: schema.shareCards.image }).from(schema.shareCards).where(eq(schema.shareCards.slug, slug)).limit(1);
  return row?.image ? Buffer.from(row.image, 'base64') : null;
}

/** Números para motivar: quantas vezes as conquistas foram vistas e quantos amigos entraram pelo link. */
export async function myShareStats(userId: number): Promise<{ shares: number; views: number; friends: number; activeFriends: number }> {
  const out = { shares: 0, views: 0, friends: 0, activeFriends: 0 };
  if (!(await checkDb())) return out;
  try {
    const [s] = await db
      .select({ shares: sql<number>`count(*)`, views: sql<number>`coalesce(sum(${schema.shareCards.views}), 0)` })
      .from(schema.shareCards)
      .where(eq(schema.shareCards.userId, userId));
    out.shares = Number(s?.shares) || 0;
    out.views = Number(s?.views) || 0;
    const u: any = await findUserById(userId);
    if (u?.referralCode) {
      const [f] = await db.select({ n: sql<number>`count(*)` }).from(schema.users).where(eq(schema.users.referredBy, u.referralCode));
      out.friends = Number(f?.n) || 0;
      const act = await db.execute(sql`
        select count(*)::int as n from (
          select ua.user_id from user_activity ua join users x on x.id = ua.user_id
          where x.referred_by = ${u.referralCode} and x.id <> ${userId}
          group by ua.user_id having count(distinct ua.day) >= 2
        ) t`);
      const rows: any[] = (act as any).rows || (act as any);
      out.activeFriends = Number(rows?.[0]?.n) || 0;
    }
  } catch (e) {
    console.error('[compartilhar] números', e);
  }
  return out;
}

/** Últimos links da pessoa (para mostrar "sua conquista foi vista X vezes"). */
export async function myRecentShares(userId: number, limit = 5) {
  if (!(await checkDb())) return [];
  return db
    .select({ slug: schema.shareCards.slug, emoji: schema.shareCards.emoji, title: schema.shareCards.title, views: schema.shareCards.views, createdAt: schema.shareCards.createdAt })
    .from(schema.shareCards)
    .where(eq(schema.shareCards.userId, userId))
    .orderBy(desc(schema.shareCards.createdAt))
    .limit(limit);
}
