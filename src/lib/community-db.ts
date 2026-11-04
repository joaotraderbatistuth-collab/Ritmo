// Feed social, equipes pagas e repasses — camada de dados (somente com banco de dados).
// As regras puras ficam em teams-plan.ts e feed-rules.ts (testadas à parte).
import { and, desc, eq, gte, inArray, isNull, lt, ne, sql } from 'drizzle-orm';
import { db } from '../../db/index.js';
import * as schema from '../../db/schema.js';
import { checkDb, findUserById } from './server-db.js';
import { createRealPixPayment, isMercadoPagoConfigured } from './mercadopago.js';
import {
  isValidTeamCode,
  membershipActive,
  nextMembershipExpiry,
  qualifiesForFreeAccess,
  splitTeamPayment,
  teamCodeFrom,
  validateTeamInput,
} from './teams-plan.js';
import { FEED_LIMITS, displayName, initials, normalizeText, parsePayload, sanitizeAchievement } from './feed-rules.js';

export class CommunityError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const todayBR = () => new Date(Date.now() - 3 * 3600 * 1000).toISOString().slice(0, 10);
const iso = (v: any) => (v instanceof Date ? v.toISOString() : v || null);
const count = sql<number>`count(*)::int`;

async function need() {
  if (!(await checkDb())) throw new CommunityError(503, 'O Feed e as Equipes precisam do banco de dados configurado.');
}

/* ================================================================== */
/* Equipes                                                             */
/* ================================================================== */

const MAX_TEAMS_PER_USER = 5;

async function loadTeamByCode(code: string) {
  if (!isValidTeamCode(code)) throw new CommunityError(404, 'Equipe não encontrada.');
  const [team] = await db.select().from(schema.teams).where(eq(schema.teams.code, code));
  if (!team) throw new CommunityError(404, 'Equipe não encontrada.');
  return team;
}

async function loadTeam(teamId: number) {
  const [team] = await db.select().from(schema.teams).where(eq(schema.teams.id, teamId));
  if (!team) throw new CommunityError(404, 'Equipe não encontrada.');
  return team;
}

async function getMembership(teamId: number, userId: number) {
  const [m] = await db
    .select()
    .from(schema.teamMembers)
    .where(and(eq(schema.teamMembers.teamId, teamId), eq(schema.teamMembers.userId, userId)));
  return m || null;
}

async function activeMembersCount(teamId: number) {
  const [r] = await db
    .select({ n: count })
    .from(schema.teamMembers)
    .where(and(eq(schema.teamMembers.teamId, teamId), eq(schema.teamMembers.status, 'active'), ne(schema.teamMembers.source, 'owner')));
  return r?.n || 0;
}

/** Acesso ao conteúdo da equipe: o criador sempre; membro ativo e dentro do prazo; equipe suspensa só para o criador. */
export async function teamAccess(userId: number, teamId: number) {
  const team = await loadTeam(teamId);
  const isOwner = team.ownerUserId === userId;
  if (isOwner) return { team, isOwner, ok: true, membership: null as any };
  if (!team.active) return { team, isOwner, ok: false, membership: null as any };
  const membership = await getMembership(teamId, userId);
  return { team, isOwner, ok: membershipActive(membership, todayBR()), membership };
}

export async function createTeam(ownerId: number, raw: Record<string, unknown>) {
  await need();
  const v = validateTeamInput(raw as any);
  if (!v.ok || !v.value) throw new CommunityError(400, v.error || 'Dados da equipe inválidos.');
  const [{ n }] = await db.select({ n: count }).from(schema.teams).where(eq(schema.teams.ownerUserId, ownerId));
  if (n >= MAX_TEAMS_PER_USER) throw new CommunityError(400, `Você pode ter até ${MAX_TEAMS_PER_USER} equipes.`);

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = teamCodeFrom(v.value.name);
    try {
      const [team] = await db.insert(schema.teams).values({ ownerUserId: ownerId, code, ...v.value }).returning();
      await db.insert(schema.teamMembers).values({ teamId: team.id, userId: ownerId, source: 'owner', status: 'active' }).onConflictDoNothing();
      return team;
    } catch (e: any) {
      if (!/teams_code_unique|23505/.test(String(e?.message) + String(e?.code))) throw e;
    }
  }
  throw new CommunityError(500, 'Não foi possível gerar o link da equipe. Tente novamente.');
}

export async function updateTeam(ownerId: number, teamId: number, raw: Record<string, unknown>) {
  await need();
  const team = await loadTeam(teamId);
  if (team.ownerUserId !== ownerId) throw new CommunityError(403, 'Só o criador pode editar a equipe.');
  const v = validateTeamInput({ ...raw } as any);
  if (!v.ok || !v.value) throw new CommunityError(400, v.error || 'Dados da equipe inválidos.');
  const [updated] = await db.update(schema.teams).set({ ...v.value }).where(eq(schema.teams.id, teamId)).returning();
  return updated;
}

export async function getTeamPreview(code: string, viewerId: number) {
  await need();
  const team = await loadTeamByCode(code);
  const viewer = await findUserById(viewerId);
  const owner = await findUserById(team.ownerUserId);
  const isOwner = team.ownerUserId === viewerId;
  if (!team.active && !isOwner) throw new CommunityError(404, 'Equipe não encontrada.');
  const membership = await getMembership(team.id, viewerId);
  const isMember = isOwner || membershipActive(membership, todayBR());
  const free = team.priceCents === 0 || qualifiesForFreeAccess(team, owner?.referralCode || '', viewer?.referredBy);
  return {
    id: team.id,
    code: team.code,
    name: team.name,
    description: team.description,
    priceCents: team.priceCents,
    periodDays: team.periodDays,
    freeForReferred: team.freeForReferred,
    membersCanPost: team.membersCanPost,
    active: team.active,
    ownerName: displayName(owner?.name),
    ownerReferralCode: isOwner ? owner?.referralCode : undefined,
    membersCount: await activeMembersCount(team.id),
    viewer: {
      isOwner,
      isMember,
      expiresAt: membership?.expiresAt || null,
      expired: Boolean(membership && membership.status === 'active' && !isMember),
      canJoinFree: !isMember && free,
      mustPay: !isMember && !free,
    },
  };
}

export async function listMyTeams(userId: number) {
  await need();
  const owned = await db.select().from(schema.teams).where(eq(schema.teams.ownerUserId, userId)).orderBy(desc(schema.teams.id));
  const ownedOut = [];
  for (const t of owned) {
    const [sales] = await db
      .select({ n: count, owner: sql<number>`coalesce(sum(${schema.teamEarnings.ownerCents}),0)::int`, gross: sql<number>`coalesce(sum(${schema.teamEarnings.grossCents}),0)::int` })
      .from(schema.teamEarnings)
      .where(and(eq(schema.teamEarnings.teamId, t.id), eq(schema.teamEarnings.status, 'approved')));
    ownedOut.push({ ...t, createdAt: iso(t.createdAt), membersCount: await activeMembersCount(t.id), salesCount: sales?.n || 0, grossCents: sales?.gross || 0, earnedCents: sales?.owner || 0 });
  }
  const mems = await db
    .select()
    .from(schema.teamMembers)
    .where(and(eq(schema.teamMembers.userId, userId), eq(schema.teamMembers.status, 'active'), ne(schema.teamMembers.source, 'owner')));
  const joined = [];
  for (const m of mems) {
    const [t] = await db.select().from(schema.teams).where(eq(schema.teams.id, m.teamId));
    if (!t || !t.active) continue;
    const owner = await findUserById(t.ownerUserId);
    joined.push({
      id: t.id, code: t.code, name: t.name, description: t.description, priceCents: t.priceCents, periodDays: t.periodDays,
      membersCanPost: t.membersCanPost, ownerName: displayName(owner?.name), expiresAt: m.expiresAt || null,
      expired: !membershipActive(m, todayBR()), source: m.source,
    });
  }
  return { owned: ownedOut, joined };
}

async function upsertMembership(teamId: number, userId: number, source: string, expiresAt: string | null) {
  const existing = await getMembership(teamId, userId);
  if (existing) {
    await db.update(schema.teamMembers).set({ status: 'active', expiresAt, source: existing.source === 'owner' ? 'owner' : source }).where(eq(schema.teamMembers.id, existing.id));
  } else {
    await db.insert(schema.teamMembers).values({ teamId, userId, source, status: 'active', expiresAt }).onConflictDoNothing();
  }
}

/** Entrada sem pagamento: equipe grátis, ou aluno que se cadastrou pelo link do criador (se o criador permitir). */
export async function joinTeamFree(userId: number, code: string) {
  await need();
  const team = await loadTeamByCode(code);
  if (!team.active) throw new CommunityError(404, 'Equipe não encontrada.');
  const owner = await findUserById(team.ownerUserId);
  const user = await findUserById(userId);
  const referral = qualifiesForFreeAccess(team, owner?.referralCode || '', user?.referredBy);
  if (team.priceCents > 0 && !referral) {
    throw new CommunityError(402, 'Esta equipe é paga. Você pode comprar o acesso pelo link da equipe.');
  }
  const m = await getMembership(team.id, userId);
  if (membershipActive(m, todayBR())) return { team, alreadyMember: true };
  await upsertMembership(team.id, userId, team.priceCents === 0 ? 'free' : 'referral', null);
  return { team, alreadyMember: false };
}

/** Cria a cobrança Pix do acesso à equipe (mesmo fluxo do checkout da assinatura). */
export async function createTeamPayment(userId: number, code: string) {
  await need();
  const team = await loadTeamByCode(code);
  if (!team.active) throw new CommunityError(404, 'Equipe não encontrada.');
  if (team.ownerUserId === userId) throw new CommunityError(400, 'Você é o criador desta equipe.');
  if (team.priceCents === 0) throw new CommunityError(400, 'Esta equipe é grátis: basta entrar.');
  const owner = await findUserById(team.ownerUserId);
  const user = await findUserById(userId);
  if (qualifiesForFreeAccess(team, owner?.referralCode || '', user?.referredBy)) {
    throw new CommunityError(400, 'Você se cadastrou pelo link do criador: seu acesso é grátis, basta entrar.');
  }
  const m = await getMembership(team.id, userId);
  if (membershipActive(m, todayBR()) && !team.periodDays) throw new CommunityError(400, 'Você já tem acesso a esta equipe.');

  const orderReference = `ORD-EQP-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  let pixCopiaECola: string | undefined;
  let pixQrCode: string | undefined;
  let providerPaymentId: string | undefined;
  let isSimulated = true;

  if (isMercadoPagoConfigured()) {
    const mp = await createRealPixPayment({
      orderReference,
      amountCents: team.priceCents,
      description: `Equipe ${team.name} — Ritmo`,
      payerEmail: user?.email || 'cliente@meu-ritmo.netlify.app',
    });
    if (mp.success) {
      pixCopiaECola = mp.pixCopiaECola;
      pixQrCode = mp.pixQrCodeBase64 ? `data:image/png;base64,${mp.pixQrCodeBase64}` : undefined;
      providerPaymentId = mp.mpPaymentId;
      isSimulated = false;
    } else {
      console.error('[equipes] Pix real falhou, usando modo de demonstração:', mp.error);
    }
  }
  if (isSimulated) {
    pixCopiaECola = `00020126580014br.gov.bcb.pix0136SIMULADO-${orderReference}5204000053039865405${(team.priceCents / 100).toFixed(2)}5802BR5913Ritmo Equipes6009Sao Paulo6304ABCD`;
  }

  const [payment] = await db
    .insert(schema.payments)
    .values({
      userId,
      orderReference,
      amountCents: team.priceCents,
      discountCents: 0,
      status: 'pending',
      paymentMethod: 'pix',
      pixQrCode,
      pixCopiaECola,
      providerPaymentId,
      isSimulated,
      kind: 'team',
      teamId: team.id,
    })
    .returning();
  return { payment, team };
}

/** Pedido de equipe que pertence a esta pessoa (usado para conferir o pagamento). */
export async function getOwnTeamPayment(userId: number, orderReference: string) {
  await need();
  const [p] = await db
    .select()
    .from(schema.payments)
    .where(and(eq(schema.payments.orderReference, String(orderReference)), eq(schema.payments.userId, userId), eq(schema.payments.kind, 'team')));
  if (!p) throw new CommunityError(404, 'Pedido não encontrado.');
  return p;
}

/** Chamado quando o pagamento é confirmado: libera o acesso e registra o repasse (40% plataforma / 60% criador). Idempotente. */
export async function finalizeTeamPurchase(payment: { orderReference: string; userId: number; teamId: number | null; amountCents: number }) {
  if (!payment.teamId) return { granted: false };
  const team = await loadTeam(payment.teamId);
  const split = splitTeamPayment(payment.amountCents);
  const inserted = await db
    .insert(schema.teamEarnings)
    .values({
      teamId: team.id,
      ownerUserId: team.ownerUserId,
      buyerUserId: payment.userId,
      orderReference: payment.orderReference,
      grossCents: payment.amountCents,
      platformFeeCents: split.platformFeeCents,
      ownerCents: split.ownerCents,
      status: 'approved',
    })
    .onConflictDoNothing()
    .returning();
  if (inserted.length === 0) return { granted: false, alreadyProcessed: true }; // já tratado (webhook repetido)

  const m = await getMembership(team.id, payment.userId);
  const expires = nextMembershipExpiry(m?.expiresAt, todayBR(), team.periodDays);
  await upsertMembership(team.id, payment.userId, 'purchase', expires);
  return { granted: true, expiresAt: expires, split };
}

/** Reembolso/contestação: reverte o repasse do criador e remove o acesso comprado. Idempotente. */
export async function reverseTeamForOrder(orderReference: string, newStatus: 'refunded' | 'reversed' = 'refunded') {
  if (!(await checkDb())) return { reversed: 0 };
  const rows = await db
    .update(schema.teamEarnings)
    .set({ status: newStatus })
    .where(and(eq(schema.teamEarnings.orderReference, orderReference), eq(schema.teamEarnings.status, 'approved')))
    .returning();
  for (const r of rows) {
    await db
      .update(schema.teamMembers)
      .set({ status: 'removed' })
      .where(and(eq(schema.teamMembers.teamId, r.teamId), eq(schema.teamMembers.userId, r.buyerUserId), eq(schema.teamMembers.source, 'purchase')));
  }
  return { reversed: rows.length };
}

/** Saldo das vendas de equipes que entra na carteira (junto das comissões). */
export async function getTeamEarningsTotal(userId: number): Promise<number> {
  try {
    if (!(await checkDb())) return 0;
    const [r] = await db
      .select({ total: sql<number>`coalesce(sum(${schema.teamEarnings.ownerCents}),0)::int` })
      .from(schema.teamEarnings)
      .where(and(eq(schema.teamEarnings.ownerUserId, userId), eq(schema.teamEarnings.status, 'approved')));
    return r?.total || 0;
  } catch {
    return 0;
  }
}

export async function listTeamMembers(ownerId: number, teamId: number) {
  await need();
  const team = await loadTeam(teamId);
  if (team.ownerUserId !== ownerId) throw new CommunityError(403, 'Só o criador vê os membros.');
  const rows = await db.select().from(schema.teamMembers).where(and(eq(schema.teamMembers.teamId, teamId), ne(schema.teamMembers.source, 'owner'))).orderBy(desc(schema.teamMembers.id));
  const out = [];
  for (const m of rows) {
    const u = await findUserById(m.userId);
    out.push({ userId: m.userId, name: displayName(u?.name), source: m.source, status: m.status, expiresAt: m.expiresAt, active: membershipActive(m, todayBR()), since: iso(m.createdAt) });
  }
  return out;
}

export async function removeTeamMember(ownerId: number, teamId: number, userId: number) {
  await need();
  const team = await loadTeam(teamId);
  if (team.ownerUserId !== ownerId) throw new CommunityError(403, 'Só o criador pode remover membros.');
  if (userId === ownerId) throw new CommunityError(400, 'O criador não pode ser removido.');
  await db.update(schema.teamMembers).set({ status: 'removed' }).where(and(eq(schema.teamMembers.teamId, teamId), eq(schema.teamMembers.userId, userId)));
}

/* ================================================================== */
/* Feed                                                                */
/* ================================================================== */

async function assertCanWrite(userId: number) {
  const user = await findUserById(userId);
  if (!user) throw new CommunityError(401, 'Sessão expirada.');
  if ((user as any).feedMuted) throw new CommunityError(403, 'Você está temporariamente sem permissão para publicar e comentar. Fale com o suporte.');
  return user;
}

async function recentCount(table: any, userCol: any, createdCol: any, userId: number, sinceMs: number) {
  const [r] = await db.select({ n: count }).from(table).where(and(eq(userCol, userId), gte(createdCol, new Date(Date.now() - sinceMs))));
  return r?.n || 0;
}

export async function createPost(userId: number, input: { body?: unknown; teamId?: unknown; achievement?: unknown }) {
  await need();
  await assertCanWrite(userId);
  const teamId = input.teamId ? Number(input.teamId) : null;
  if (teamId !== null) {
    if (!Number.isInteger(teamId)) throw new CommunityError(400, 'Equipe inválida.');
    const a = await teamAccess(userId, teamId);
    if (!a.ok) throw new CommunityError(403, 'Você não tem acesso a esta equipe.');
    if (!a.isOwner && !a.team.membersCanPost) throw new CommunityError(403, 'Nesta equipe só o criador publica. Você pode comentar nas publicações.');
  }
  const body = normalizeText(input.body, FEED_LIMITS.postMax);
  const achievement = input.achievement ? sanitizeAchievement(input.achievement) : null;
  if (input.achievement && !achievement) throw new CommunityError(400, 'Conquista inválida.');
  if (!body && !achievement) throw new CommunityError(400, 'Escreva algo ou escolha uma conquista para compartilhar.');
  if ((await recentCount(schema.feedPosts, schema.feedPosts.userId, schema.feedPosts.createdAt, userId, 3600000)) >= FEED_LIMITS.postsPerHour) {
    throw new CommunityError(429, 'Você publicou muitas vezes seguidas. Tente de novo daqui a pouco.');
  }
  const [post] = await db
    .insert(schema.feedPosts)
    .values({ userId, teamId, kind: achievement ? 'achievement' : 'text', body, payload: achievement ? JSON.stringify(achievement) : null })
    .returning();
  return post;
}

export async function listPosts(viewerId: number, opts: { teamId?: number | null; beforeId?: number; limit?: number }) {
  await need();
  const limit = Math.min(Math.max(opts.limit || 20, 1), 50);
  if (opts.teamId) {
    const a = await teamAccess(viewerId, opts.teamId);
    if (!a.ok) throw new CommunityError(403, 'Você não tem acesso a esta equipe.');
  }
  const where = and(
    opts.teamId ? eq(schema.feedPosts.teamId, opts.teamId) : isNull(schema.feedPosts.teamId),
    eq(schema.feedPosts.status, 'visible'),
    opts.beforeId ? lt(schema.feedPosts.id, opts.beforeId) : undefined
  );
  const posts = await db.select().from(schema.feedPosts).where(where).orderBy(desc(schema.feedPosts.id)).limit(limit + 1);
  const hasMore = posts.length > limit;
  const page = posts.slice(0, limit);
  if (page.length === 0) return { posts: [], hasMore: false };
  const ids = page.map((p) => p.id);

  const likes = await db.select({ id: schema.feedLikes.postId, n: count }).from(schema.feedLikes).where(inArray(schema.feedLikes.postId, ids)).groupBy(schema.feedLikes.postId);
  const mine = await db.select({ id: schema.feedLikes.postId }).from(schema.feedLikes).where(and(inArray(schema.feedLikes.postId, ids), eq(schema.feedLikes.userId, viewerId)));
  const comments = await db
    .select({ id: schema.feedComments.postId, n: count })
    .from(schema.feedComments)
    .where(and(inArray(schema.feedComments.postId, ids), eq(schema.feedComments.status, 'visible')))
    .groupBy(schema.feedComments.postId);
  const authors = await db.select({ id: schema.users.id, name: schema.users.name }).from(schema.users).where(inArray(schema.users.id, [...new Set(page.map((p) => p.userId))]));
  const ownerOf = opts.teamId ? (await loadTeam(opts.teamId)).ownerUserId : null;

  const likeMap = new Map(likes.map((l) => [l.id, l.n]));
  const commentMap = new Map(comments.map((c) => [c.id, c.n]));
  const mineSet = new Set(mine.map((m) => m.id));
  const nameMap = new Map(authors.map((a) => [a.id, a.name]));

  return {
    hasMore,
    posts: page.map((p) => ({
      id: p.id,
      kind: p.kind,
      body: p.body,
      achievement: parsePayload(p.payload),
      createdAt: iso(p.createdAt),
      teamId: p.teamId,
      author: { id: p.userId, name: displayName(nameMap.get(p.userId)), initials: initials(nameMap.get(p.userId)), isTeamOwner: ownerOf === p.userId },
      likes: likeMap.get(p.id) || 0,
      liked: mineSet.has(p.id),
      comments: commentMap.get(p.id) || 0,
      mine: p.userId === viewerId,
      canDelete: p.userId === viewerId || ownerOf === viewerId,
    })),
  };
}

async function loadVisiblePost(viewerId: number, postId: number) {
  const [post] = await db.select().from(schema.feedPosts).where(eq(schema.feedPosts.id, postId));
  if (!post || post.status !== 'visible') throw new CommunityError(404, 'Publicação não encontrada.');
  if (post.teamId) {
    const a = await teamAccess(viewerId, post.teamId);
    if (!a.ok) throw new CommunityError(403, 'Você não tem acesso a esta equipe.');
    return { post, teamOwnerId: a.team.ownerUserId };
  }
  return { post, teamOwnerId: null as number | null };
}

export async function deletePost(userId: number, postId: number) {
  await need();
  const [post] = await db.select().from(schema.feedPosts).where(eq(schema.feedPosts.id, postId));
  if (!post) throw new CommunityError(404, 'Publicação não encontrada.');
  let allowed = post.userId === userId;
  if (!allowed && post.teamId) allowed = (await loadTeam(post.teamId)).ownerUserId === userId;
  if (!allowed) throw new CommunityError(403, 'Você não pode excluir esta publicação.');
  await db.delete(schema.feedPosts).where(eq(schema.feedPosts.id, postId));
}

export async function toggleLike(userId: number, postId: number) {
  await need();
  await loadVisiblePost(userId, postId);
  const removed = await db.delete(schema.feedLikes).where(and(eq(schema.feedLikes.postId, postId), eq(schema.feedLikes.userId, userId))).returning();
  if (removed.length === 0) await db.insert(schema.feedLikes).values({ postId, userId }).onConflictDoNothing();
  const [r] = await db.select({ n: count }).from(schema.feedLikes).where(eq(schema.feedLikes.postId, postId));
  return { liked: removed.length === 0, likes: r?.n || 0 };
}

export async function addComment(userId: number, postId: number, rawBody: unknown) {
  await need();
  await assertCanWrite(userId);
  await loadVisiblePost(userId, postId);
  const body = normalizeText(rawBody, FEED_LIMITS.commentMax);
  if (!body) throw new CommunityError(400, 'Escreva o comentário.');
  if ((await recentCount(schema.feedComments, schema.feedComments.userId, schema.feedComments.createdAt, userId, 3600000)) >= FEED_LIMITS.commentsPerHour) {
    throw new CommunityError(429, 'Muitos comentários seguidos. Tente de novo daqui a pouco.');
  }
  const [c] = await db.insert(schema.feedComments).values({ postId, userId, body }).returning();
  return c;
}

export async function listComments(viewerId: number, postId: number) {
  await need();
  const { teamOwnerId } = await loadVisiblePost(viewerId, postId);
  const rows = await db.select().from(schema.feedComments).where(and(eq(schema.feedComments.postId, postId), eq(schema.feedComments.status, 'visible'))).orderBy(schema.feedComments.id).limit(200);
  const authors = rows.length ? await db.select({ id: schema.users.id, name: schema.users.name }).from(schema.users).where(inArray(schema.users.id, [...new Set(rows.map((r) => r.userId))])) : [];
  const nameMap = new Map(authors.map((a) => [a.id, a.name]));
  return rows.map((c) => ({
    id: c.id,
    body: c.body,
    createdAt: iso(c.createdAt),
    author: { id: c.userId, name: displayName(nameMap.get(c.userId)), initials: initials(nameMap.get(c.userId)), isTeamOwner: teamOwnerId === c.userId },
    mine: c.userId === viewerId,
    canDelete: c.userId === viewerId || teamOwnerId === viewerId,
  }));
}

export async function deleteComment(userId: number, commentId: number) {
  await need();
  const [c] = await db.select().from(schema.feedComments).where(eq(schema.feedComments.id, commentId));
  if (!c) throw new CommunityError(404, 'Comentário não encontrado.');
  let allowed = c.userId === userId;
  if (!allowed) {
    const [post] = await db.select().from(schema.feedPosts).where(eq(schema.feedPosts.id, c.postId));
    if (post?.teamId) allowed = (await loadTeam(post.teamId)).ownerUserId === userId;
  }
  if (!allowed) throw new CommunityError(403, 'Você não pode excluir este comentário.');
  await db.delete(schema.feedComments).where(eq(schema.feedComments.id, commentId));
}

/** Denúncia: 3 pessoas diferentes escondem o conteúdo até a análise da moderação. */
export async function reportContent(userId: number, targetType: string, targetId: number, rawReason: unknown) {
  await need();
  if (targetType !== 'post' && targetType !== 'comment') throw new CommunityError(400, 'Tipo de denúncia inválido.');
  if (!Number.isInteger(targetId)) throw new CommunityError(400, 'Conteúdo inválido.');
  let authorId: number | null = null;
  if (targetType === 'post') {
    const [p] = await db.select().from(schema.feedPosts).where(eq(schema.feedPosts.id, targetId));
    authorId = p?.userId ?? null;
    if (p?.teamId) {
      const a = await teamAccess(userId, p.teamId);
      if (!a.ok) throw new CommunityError(403, 'Você não tem acesso a esta equipe.');
    }
  } else {
    const [c] = await db.select().from(schema.feedComments).where(eq(schema.feedComments.id, targetId));
    authorId = c?.userId ?? null;
  }
  if (authorId === null) throw new CommunityError(404, 'Conteúdo não encontrado.');
  if (authorId === userId) throw new CommunityError(400, 'Você não pode denunciar o seu próprio conteúdo. Use excluir.');
  const [{ n: today }] = await db.select({ n: count }).from(schema.feedReports).where(and(eq(schema.feedReports.reporterUserId, userId), gte(schema.feedReports.createdAt, new Date(Date.now() - 86400000))));
  if (today >= FEED_LIMITS.reportsPerDay) throw new CommunityError(429, 'Limite diário de denúncias atingido.');

  await db
    .insert(schema.feedReports)
    .values({ targetType, targetId, reporterUserId: userId, reason: normalizeText(rawReason, FEED_LIMITS.reportReasonMax) })
    .onConflictDoNothing();
  const [{ n: open }] = await db
    .select({ n: count })
    .from(schema.feedReports)
    .where(and(eq(schema.feedReports.targetType, targetType), eq(schema.feedReports.targetId, targetId), eq(schema.feedReports.status, 'open')));
  let hidden = false;
  if (open >= FEED_LIMITS.autoHideReports) {
    if (targetType === 'post') await db.update(schema.feedPosts).set({ status: 'hidden' }).where(eq(schema.feedPosts.id, targetId));
    else await db.update(schema.feedComments).set({ status: 'hidden' }).where(eq(schema.feedComments.id, targetId));
    hidden = true;
  }
  return { reported: true, hidden };
}

/* ================================================================== */
/* Moderação e visão do administrador                                  */
/* ================================================================== */

export async function getModerationData() {
  await need();
  const reports = await db.select().from(schema.feedReports).where(eq(schema.feedReports.status, 'open')).orderBy(desc(schema.feedReports.id)).limit(500);
  const groups = new Map<string, { targetType: string; targetId: number; reasons: string[]; count: number; lastAt: any }>();
  for (const r of reports) {
    const k = `${r.targetType}:${r.targetId}`;
    const g = groups.get(k) || { targetType: r.targetType, targetId: r.targetId, reasons: [], count: 0, lastAt: r.createdAt };
    g.count++;
    if (r.reason && g.reasons.length < 5) g.reasons.push(r.reason);
    groups.set(k, g);
  }
  const queue = [];
  for (const g of groups.values()) {
    let body = '';
    let status = '';
    let authorId = 0;
    let teamId: number | null = null;
    if (g.targetType === 'post') {
      const [p] = await db.select().from(schema.feedPosts).where(eq(schema.feedPosts.id, g.targetId));
      if (!p) continue;
      body = p.body || (parsePayload(p.payload) ? 'Conquista compartilhada' : '');
      status = p.status; authorId = p.userId; teamId = p.teamId;
    } else {
      const [c] = await db.select().from(schema.feedComments).where(eq(schema.feedComments.id, g.targetId));
      if (!c) continue;
      body = c.body; status = c.status; authorId = c.userId;
    }
    const author = await findUserById(authorId);
    queue.push({
      targetType: g.targetType, targetId: g.targetId, reportCount: g.count, reasons: g.reasons, body: body.slice(0, 400), status, teamId,
      author: { id: authorId, name: author?.name || '', email: author?.email || '', muted: Boolean((author as any)?.feedMuted) },
      lastReportAt: iso(g.lastAt),
    });
  }
  const teamRows = await db.select().from(schema.teams).orderBy(desc(schema.teams.id)).limit(300);
  const teams = [];
  for (const t of teamRows) {
    const owner = await findUserById(t.ownerUserId);
    const [s] = await db
      .select({ n: count, gross: sql<number>`coalesce(sum(${schema.teamEarnings.grossCents}),0)::int`, fee: sql<number>`coalesce(sum(${schema.teamEarnings.platformFeeCents}),0)::int` })
      .from(schema.teamEarnings)
      .where(and(eq(schema.teamEarnings.teamId, t.id), eq(schema.teamEarnings.status, 'approved')));
    teams.push({
      id: t.id, code: t.code, name: t.name, priceCents: t.priceCents, periodDays: t.periodDays, active: t.active,
      ownerName: owner?.name || '', ownerEmail: owner?.email || '', membersCount: await activeMembersCount(t.id),
      salesCount: s?.n || 0, grossCents: s?.gross || 0, platformFeeCents: s?.fee || 0, createdAt: iso(t.createdAt),
    });
  }
  return { reports: queue, teams };
}

export async function moderateTarget(targetType: string, targetId: number, action: string) {
  await need();
  if (targetType !== 'post' && targetType !== 'comment') throw new CommunityError(400, 'Tipo inválido.');
  if (!['hide', 'restore', 'dismiss', 'delete'].includes(action)) throw new CommunityError(400, 'Ação inválida.');
  const table: any = targetType === 'post' ? schema.feedPosts : schema.feedComments;
  if (action === 'delete') await db.delete(table).where(eq(table.id, targetId));
  else if (action === 'hide') await db.update(table).set({ status: 'hidden' }).where(eq(table.id, targetId));
  else if (action === 'restore') await db.update(table).set({ status: 'visible' }).where(eq(table.id, targetId));
  await db
    .update(schema.feedReports)
    .set({ status: action === 'hide' || action === 'delete' ? 'actioned' : 'dismissed' })
    .where(and(eq(schema.feedReports.targetType, targetType), eq(schema.feedReports.targetId, targetId), eq(schema.feedReports.status, 'open')));
}

export async function setUserFeedMuted(userId: number, muted: boolean) {
  await need();
  await db.update(schema.users).set({ feedMuted: muted }).where(eq(schema.users.id, userId));
}

export async function adminSetTeamActive(teamId: number, active: boolean) {
  await need();
  await loadTeam(teamId);
  await db.update(schema.teams).set({ active }).where(eq(schema.teams.id, teamId));
}

export async function getTeamsFinance() {
  try {
    if (!(await checkDb())) return null;
    const [r] = await db
      .select({
        n: count,
        gross: sql<number>`coalesce(sum(${schema.teamEarnings.grossCents}),0)::int`,
        fee: sql<number>`coalesce(sum(${schema.teamEarnings.platformFeeCents}),0)::int`,
        owner: sql<number>`coalesce(sum(${schema.teamEarnings.ownerCents}),0)::int`,
      })
      .from(schema.teamEarnings)
      .where(eq(schema.teamEarnings.status, 'approved'));
    return { salesCount: r?.n || 0, grossCents: r?.gross || 0, platformFeeCents: r?.fee || 0, ownerCents: r?.owner || 0 };
  } catch {
    return null;
  }
}
