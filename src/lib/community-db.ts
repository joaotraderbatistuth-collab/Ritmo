// Feed social, equipes pagas e repasses — camada de dados (somente com banco de dados).
// As regras puras ficam em teams-plan.ts e feed-rules.ts (testadas à parte).
import { and, desc, eq, gte, inArray, isNull, lt, ne, or, sql } from 'drizzle-orm';
import { db } from '../../db/index.js';
import * as schema from '../../db/schema.js';
import { checkDb, findUserById, updateUserRecord } from './server-db.js';
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
import { mediaOwnedBy } from './media.js';
import { isBundledImage, parseMediaUrl } from './media-url.js';
import { levelDef, MAX_LEVEL } from './levels.js';

export class CommunityError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

const todayBR = () => new Date(Date.now() - 3 * 3600 * 1000).toISOString().slice(0, 10);
const iso = (v: any) => (v instanceof Date ? v.toISOString() : v || null);
const count = sql<number>`count(*)::int`;

async function need() {
  if (!(await checkDb())) throw new CommunityError(503, 'O Feed e os Ritus precisam do banco de dados configurado.');
}

/* ================================================================== */
/* Equipes                                                             */
/* ================================================================== */

const MAX_TEAMS_PER_USER = 5;

async function loadTeamByCode(code: string) {
  if (!isValidTeamCode(code)) throw new CommunityError(404, 'Ritus não encontrado.');
  const [team] = await db.select().from(schema.teams).where(eq(schema.teams.code, code));
  if (!team) throw new CommunityError(404, 'Ritus não encontrado.');
  return team;
}

async function loadTeam(teamId: number) {
  const [team] = await db.select().from(schema.teams).where(eq(schema.teams.id, teamId));
  if (!team) throw new CommunityError(404, 'Ritus não encontrado.');
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
  // Ritus gratuito: qualquer pessoa do Ritmo lê e comenta (entrar só serve para segui-lo)
  return { team, isOwner, ok: team.priceCents === 0 || membershipActive(membership, todayBR()), membership };
}

export async function createTeam(ownerId: number, raw: Record<string, unknown>) {
  await need();
  const v = validateTeamInput(raw as any);
  if (!v.ok || !v.value) throw new CommunityError(400, v.error || 'Dados do Ritus inválidos.');
  const [{ n }] = await db.select({ n: count }).from(schema.teams).where(eq(schema.teams.ownerUserId, ownerId));
  const owner = await findUserById(ownerId);
  if (n >= MAX_TEAMS_PER_USER && owner?.role !== 'admin') throw new CommunityError(400, `Você pode ter até ${MAX_TEAMS_PER_USER} Ritus.`);

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
  throw new CommunityError(500, 'Não foi possível gerar o link do Ritus. Tente novamente.');
}

export async function updateTeam(ownerId: number, teamId: number, raw: Record<string, unknown>) {
  await need();
  const team = await loadTeam(teamId);
  if (team.ownerUserId !== ownerId) throw new CommunityError(403, 'Só o criador pode editar o Ritus.');
  const v = validateTeamInput({ ...raw } as any);
  if (!v.ok || !v.value) throw new CommunityError(400, v.error || 'Dados do Ritus inválidos.');
  const [updated] = await db.update(schema.teams).set({ ...v.value }).where(eq(schema.teams.id, teamId)).returning();
  return updated;
}

export async function getTeamPreview(code: string, viewerId: number, countView = false) {
  await need();
  const team = await loadTeamByCode(code);
  const viewer = await findUserById(viewerId);
  const owner = await findUserById(team.ownerUserId);
  const isOwner = team.ownerUserId === viewerId;
  if (!team.active && !isOwner) throw new CommunityError(404, 'Ritus não encontrado.');
  const membership = await getMembership(team.id, viewerId);
  const isMember = isOwner || membershipActive(membership, todayBR());
  const free = team.priceCents === 0 || qualifiesForFreeAccess(team, owner?.referralCode || '', viewer?.referredBy);
  // conta um acesso (o criador abrindo o próprio Ritus não conta)
  if (!isOwner && countView) {
    try {
      await db.update(schema.teams).set({ viewCount: sql`${schema.teams.viewCount} + 1` }).where(eq(schema.teams.id, team.id));
    } catch {
      /* o contador nunca impede de abrir o Ritus */
    }
  }
  const [posts] = await db
    .select({ n: count })
    .from(schema.feedPosts)
    .where(and(eq(schema.feedPosts.teamId, team.id), eq(schema.feedPosts.status, 'visible')));
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
    listed: team.listed,
    viewCount: (team.viewCount || 0) + (!isOwner && countView ? 1 : 0),
    postsCount: posts?.n || 0,
    ownerName: displayName(owner?.name),
    ownerReferralCode: isOwner ? owner?.referralCode : undefined,
    membersCount: await activeMembersCount(team.id),
    viewer: {
      isOwner,
      isMember,
      expiresAt: membership?.expiresAt || null,
      expired: Boolean(membership && membership.status === 'active' && !isMember),
      canRead: isMember || (team.priceCents === 0 && team.active),
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

/**
 * Vitrine "Achar Ritus": Ritus ativos e públicos, do mais acessado para o menos acessado.
 * Com `query`, pesquisa no nome, na descrição e no nome do criador.
 */
export async function discoverTeams(viewerId: number, query: string, onlyFree = false) {
  await need();
  const q = String(query || '').replace(/[%_\\]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);
  const like = `%${q}%`;
  const rows = await db
    .select({
      id: schema.teams.id,
      code: schema.teams.code,
      name: schema.teams.name,
      description: schema.teams.description,
      priceCents: schema.teams.priceCents,
      periodDays: schema.teams.periodDays,
      viewCount: schema.teams.viewCount,
      ownerUserId: schema.teams.ownerUserId,
      ownerName: schema.users.name,
    })
    .from(schema.teams)
    .innerJoin(schema.users, eq(schema.users.id, schema.teams.ownerUserId))
    .where(
      and(
        eq(schema.teams.active, true),
        eq(schema.teams.listed, true),
        onlyFree ? eq(schema.teams.priceCents, 0) : undefined,
        q ? sql`(${schema.teams.name} ILIKE ${like} OR ${schema.teams.description} ILIKE ${like} OR ${schema.users.name} ILIKE ${like})` : undefined
      )
    )
    .orderBy(desc(schema.teams.viewCount), schema.teams.id) // empate: o mais antigo primeiro (Clube do Livro abre a lista)
    .limit(30);
  if (rows.length === 0) return { ritus: [] };

  const ids = rows.map((r) => r.id);
  const members = await db
    .select({ id: schema.teamMembers.teamId, n: count })
    .from(schema.teamMembers)
    .where(and(inArray(schema.teamMembers.teamId, ids), eq(schema.teamMembers.status, 'active'), ne(schema.teamMembers.source, 'owner')))
    .groupBy(schema.teamMembers.teamId);
  const posts = await db
    .select({ id: schema.feedPosts.teamId, n: count })
    .from(schema.feedPosts)
    .where(and(inArray(schema.feedPosts.teamId, ids), eq(schema.feedPosts.status, 'visible')))
    .groupBy(schema.feedPosts.teamId);
  const mine = await db
    .select({ id: schema.teamMembers.teamId, status: schema.teamMembers.status, expiresAt: schema.teamMembers.expiresAt })
    .from(schema.teamMembers)
    .where(and(inArray(schema.teamMembers.teamId, ids), eq(schema.teamMembers.userId, viewerId)));
  const memberMap = new Map(members.map((m) => [m.id, m.n]));
  const postMap = new Map(posts.map((p) => [p.id, p.n]));
  const mineMap = new Map(mine.map((m) => [m.id, m]));
  const today = todayBR();

  return {
    ritus: rows.map((r, i) => ({
      id: r.id,
      code: r.code,
      name: r.name,
      description: r.description.length > 220 ? `${r.description.slice(0, 217)}...` : r.description,
      priceCents: r.priceCents,
      periodDays: r.periodDays,
      viewCount: r.viewCount,
      rank: q ? null : i + 1,
      ownerName: displayName(r.ownerName),
      membersCount: memberMap.get(r.id) || 0,
      postsCount: postMap.get(r.id) || 0,
      isOwner: r.ownerUserId === viewerId,
      isMember: r.ownerUserId === viewerId || membershipActive(mineMap.get(r.id) as any, today),
    })),
  };
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
  if (!team.active) throw new CommunityError(404, 'Ritus não encontrado.');
  const owner = await findUserById(team.ownerUserId);
  const user = await findUserById(userId);
  const referral = qualifiesForFreeAccess(team, owner?.referralCode || '', user?.referredBy);
  if (team.priceCents > 0 && !referral) {
    throw new CommunityError(402, 'Este Ritus é pago. Assine para ter acesso.');
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
  if (!team.active) throw new CommunityError(404, 'Ritus não encontrado.');
  if (team.ownerUserId === userId) throw new CommunityError(400, 'Você é o criador deste Ritus.');
  if (team.priceCents === 0) throw new CommunityError(400, 'Este Ritus é grátis: basta entrar.');
  const owner = await findUserById(team.ownerUserId);
  const user = await findUserById(userId);
  if (qualifiesForFreeAccess(team, owner?.referralCode || '', user?.referredBy)) {
    throw new CommunityError(400, 'Você se cadastrou pelo link do criador: seu acesso é grátis, basta entrar.');
  }
  const m = await getMembership(team.id, userId);
  if (membershipActive(m, todayBR()) && !team.periodDays) throw new CommunityError(400, 'Você já assina este Ritus.');

  const orderReference = `ORD-EQP-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  let pixCopiaECola: string | undefined;
  let pixQrCode: string | undefined;
  let providerPaymentId: string | undefined;
  let isSimulated = true;

  if (isMercadoPagoConfigured()) {
    const mp = await createRealPixPayment({
      orderReference,
      amountCents: team.priceCents,
      description: `Ritus ${team.name} — Ritmo`,
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

async function cleanImage(userId: number, raw: unknown): Promise<string | null> {
  if (!raw) return null;
  if (await mediaOwnedBy(raw, userId)) return String(raw);
  throw new CommunityError(400, 'Foto inválida. Envie a foto de novo.');
}

export async function createPost(userId: number, input: { body?: unknown; teamId?: unknown; achievement?: unknown; imageUrl?: unknown }) {
  await need();
  await assertCanWrite(userId);
  const teamId = input.teamId ? Number(input.teamId) : null;
  if (teamId !== null) {
    if (!Number.isInteger(teamId)) throw new CommunityError(400, 'Ritus inválido.');
    const a = await teamAccess(userId, teamId);
    if (!a.ok) throw new CommunityError(403, 'Conteúdo exclusivo para assinantes deste Ritus.');
    if (!a.isOwner && !a.team.membersCanPost) throw new CommunityError(403, 'Neste Ritus só o criador publica. Você pode comentar nas publicações.');
  }
  const body = normalizeText(input.body, FEED_LIMITS.postMax);
  const achievement = input.achievement ? sanitizeAchievement(input.achievement) : null;
  if (input.achievement && !achievement) throw new CommunityError(400, 'Conquista inválida.');
  if (achievement?.type === 'ofensiva' || achievement?.type === 'semana') {
    // confere no servidor: só dá para compartilhar o que a pessoa realmente fez
    const { getUserXp } = await import('./xp-server.js');
    const { buildGame } = await import('./game-server.js');
    const xp = await getUserXp(userId);
    const game = xp ? buildGame(userId, xp) : null;
    if (achievement.type === 'ofensiva' && (!game || achievement.days > game.streak.days)) throw new CommunityError(400, 'Sua ofensiva ainda não chegou a esse número.');
    if (achievement.type === 'semana' && (!game || achievement.xp > Math.max(game.week.xp, game.lastWeek.xp) || achievement.activeDays > Math.max(game.week.activeDays, game.lastWeek.activeDays))) {
      throw new CommunityError(400, 'Esses números não batem com a sua semana.');
    }
  }
  if (achievement?.type === 'divisao') {
    // só compartilha uma divisão que a pessoa realmente alcançou
    const [u] = await db.select({ tier: schema.users.seasonTier }).from(schema.users).where(eq(schema.users.id, userId));
    if (!u || (u.tier || 0) < achievement.tier) throw new CommunityError(400, 'Você ainda não chegou a essa divisão.');
  }
  if (achievement?.type === 'nivel') {
    // só compartilha um nível que a pessoa realmente alcançou
    const [u] = await db.select({ level: schema.users.level }).from(schema.users).where(eq(schema.users.id, userId));
    if (!u || (u.level || 1) < achievement.level) throw new CommunityError(400, 'Você ainda não chegou a esse nível.');
  }
  const imageUrl = await cleanImage(userId, input.imageUrl);
  if (!body && !achievement && !imageUrl) throw new CommunityError(400, 'Escreva algo, coloque uma foto ou escolha uma conquista para compartilhar.');
  if ((await recentCount(schema.feedPosts, schema.feedPosts.userId, schema.feedPosts.createdAt, userId, 3600000)) >= FEED_LIMITS.postsPerHour) {
    throw new CommunityError(429, 'Você publicou muitas vezes seguidas. Tente de novo daqui a pouco.');
  }
  const [post] = await db
    .insert(schema.feedPosts)
    .values({ userId, teamId, kind: achievement ? 'achievement' : imageUrl ? 'photo' : 'text', body, payload: achievement ? JSON.stringify(achievement) : null, imageUrl })
    .returning();
  return post;
}

/** Foto de perfil e nível do autor (o nível define a moldura e o título no Feed). */
function authorProfile(a: { avatarUrl?: string | null; level?: number | null } | null) {
  const level = Math.min(Math.max(Number(a?.level) || 1, 1), MAX_LEVEL);
  const avatarUrl = a?.avatarUrl && parseMediaUrl(a.avatarUrl) ? a.avatarUrl : null;
  return { avatarUrl, level, levelName: levelDef(level).name };
}

export async function listPosts(viewerId: number, opts: { teamId?: number | null; beforeId?: number; limit?: number; authorId?: number; following?: boolean }) {
  await need();
  const limit = Math.min(Math.max(opts.limit || 20, 1), 50);
  if (opts.teamId) {
    const a = await teamAccess(viewerId, opts.teamId);
    if (!a.ok) throw new CommunityError(403, 'Conteúdo exclusivo para assinantes deste Ritus.');
  }
  const where = and(
    opts.teamId ? eq(schema.feedPosts.teamId, opts.teamId) : isNull(schema.feedPosts.teamId),
    opts.authorId ? eq(schema.feedPosts.userId, opts.authorId) : undefined,
    // "Seguindo": quem a pessoa segue + as próprias publicações
    opts.following && !opts.teamId
      ? or(eq(schema.feedPosts.userId, viewerId), inArray(schema.feedPosts.userId, db.select({ id: schema.follows.followeeId }).from(schema.follows).where(eq(schema.follows.followerId, viewerId))))
      : undefined,
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
  const authors = await db.select({ id: schema.users.id, name: schema.users.name, avatarUrl: schema.users.avatarUrl, level: schema.users.level }).from(schema.users).where(inArray(schema.users.id, [...new Set(page.map((p) => p.userId))]));
  const ownerOf = opts.teamId ? (await loadTeam(opts.teamId)).ownerUserId : null;

  const likeMap = new Map(likes.map((l) => [l.id, l.n]));
  const commentMap = new Map(comments.map((c) => [c.id, c.n]));
  const mineSet = new Set(mine.map((m) => m.id));
  const nameMap = new Map(authors.map((a) => [a.id, a.name]));
  const profileMap = new Map(authors.map((a) => [a.id, authorProfile(a)]));

  return {
    hasMore,
    posts: page.map((p) => ({
      id: p.id,
      kind: p.kind,
      body: p.body,
      achievement: parsePayload(p.payload),
      imageUrl: p.imageUrl && (isBundledImage(p.imageUrl) || p.imageUrl.startsWith('/api/media?k=')) ? p.imageUrl : null,
      createdAt: iso(p.createdAt),
      teamId: p.teamId,
      author: { id: p.userId, name: displayName(nameMap.get(p.userId)), initials: initials(nameMap.get(p.userId)), isTeamOwner: ownerOf === p.userId, ...(profileMap.get(p.userId) || authorProfile(null)) },
      likes: likeMap.get(p.id) || 0,
      liked: mineSet.has(p.id),
      comments: commentMap.get(p.id) || 0,
      mine: p.userId === viewerId,
      canDelete: p.userId === viewerId || ownerOf === viewerId,
    })),
  };
}

/* ---------------- Perfil público ---------------- */

/**
 * O que outro membro vê ao abrir um perfil: nome curto, foto, nível, bio e as publicações do Feed
 * geral (nunca o conteúdo exclusivo de Ritus, nem dados de hábitos, finanças ou diário).
 */
export async function getPublicProfile(viewerId: number, userId: number) {
  await need();
  if (!Number.isInteger(userId) || userId <= 0) throw new CommunityError(400, 'Perfil inválido.');
  const [u] = await db
    .select({ id: schema.users.id, name: schema.users.name, avatarUrl: schema.users.avatarUrl, level: schema.users.level, xpTotal: schema.users.xpTotal, bio: schema.users.bio, feedMuted: schema.users.feedMuted, createdAt: schema.users.createdAt })
    .from(schema.users)
    .where(eq(schema.users.id, userId));
  if (!u) throw new CommunityError(404, 'Perfil não encontrado.');
  const publicPosts = and(eq(schema.feedPosts.userId, userId), isNull(schema.feedPosts.teamId), eq(schema.feedPosts.status, 'visible'));
  const [p] = await db.select({ n: count }).from(schema.feedPosts).where(publicPosts);
  const [l] = await db
    .select({ n: count })
    .from(schema.feedLikes)
    .innerJoin(schema.feedPosts, eq(schema.feedLikes.postId, schema.feedPosts.id))
    .where(publicPosts);
  const prof = authorProfile(u);
  const [fr] = await db.select({ n: count }).from(schema.follows).where(eq(schema.follows.followeeId, userId));
  const [fg] = await db.select({ n: count }).from(schema.follows).where(eq(schema.follows.followerId, userId));
  const [me] = viewerId === userId ? [] : await db.select({ n: count }).from(schema.follows).where(and(eq(schema.follows.followerId, viewerId), eq(schema.follows.followeeId, userId)));
  return {
    id: u.id,
    name: displayName(u.name),
    initials: initials(u.name),
    ...prof,
    xp: Math.max(0, Number(u.xpTotal) || 0),
    // bio de conta silenciada pela moderação não aparece para os outros
    bio: u.feedMuted && u.id !== viewerId ? '' : u.bio || '',
    memberSince: iso(u.createdAt),
    posts: Number(p?.n) || 0,
    likesReceived: Number(l?.n) || 0,
    followers: Number(fr?.n) || 0,
    following: Number(fg?.n) || 0,
    followedByMe: Number(me?.n) > 0,
    isMe: u.id === viewerId,
  };
}

/** Seguir / deixar de seguir. Avisa a pessoa seguida (avisos repetidos do mesmo seguidor se substituem no celular). */
const FOLLOW_MAX = 2000;

export async function toggleFollow(viewerId: number, targetId: number) {
  await need();
  if (!Number.isInteger(targetId) || targetId <= 0) throw new CommunityError(400, 'Perfil inválido.');
  if (targetId === viewerId) throw new CommunityError(400, 'Você não pode seguir a si mesmo.');
  const [t] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.id, targetId));
  if (!t) throw new CommunityError(404, 'Perfil não encontrado.');
  const removed = await db.delete(schema.follows).where(and(eq(schema.follows.followerId, viewerId), eq(schema.follows.followeeId, targetId))).returning();
  if (removed.length === 0) {
    const [n] = await db.select({ n: count }).from(schema.follows).where(eq(schema.follows.followerId, viewerId));
    if (Number(n?.n) >= FOLLOW_MAX) throw new CommunityError(429, `Você já segue ${FOLLOW_MAX} pessoas, o máximo do Ritmo.`);
    const ins = await db.insert(schema.follows).values({ followerId: viewerId, followeeId: targetId }).onConflictDoNothing().returning();
    if (ins.length) {
      const [me] = await db.select({ name: schema.users.name }).from(schema.users).where(eq(schema.users.id, viewerId));
      import('./push-server.js')
        .then((m) => m.notifyUser(targetId, { title: 'Novo seguidor no Ritmo', body: `${displayName(me?.name)} começou a seguir você.`, tab: 'feed', tag: `ritmo-follow-${viewerId}` }))
        .catch(() => null);
    }
  }
  const [fr] = await db.select({ n: count }).from(schema.follows).where(eq(schema.follows.followeeId, targetId));
  return { following: removed.length === 0, followers: Number(fr?.n) || 0 };
}

export async function setBio(userId: number, raw: unknown) {
  await need();
  await assertCanWrite(userId);
  // bio é uma frase: quebras de linha viram espaço
  const bio = normalizeText(String(raw ?? '').replace(/\s*\n+\s*/g, ' '), FEED_LIMITS.bioMax);
  await updateUserRecord(userId, { bio: bio || null } as any);
  return bio;
}

async function loadVisiblePost(viewerId: number, postId: number) {
  const [post] = await db.select().from(schema.feedPosts).where(eq(schema.feedPosts.id, postId));
  if (!post || post.status !== 'visible') throw new CommunityError(404, 'Publicação não encontrada.');
  if (post.teamId) {
    const a = await teamAccess(viewerId, post.teamId);
    if (!a.ok) throw new CommunityError(403, 'Conteúdo exclusivo para assinantes deste Ritus.');
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

export async function addComment(userId: number, postId: number, rawBody: unknown, rawImage?: unknown) {
  await need();
  await assertCanWrite(userId);
  await loadVisiblePost(userId, postId);
  const body = normalizeText(rawBody, FEED_LIMITS.commentMax);
  const imageUrl = await cleanImage(userId, rawImage);
  if (!body && !imageUrl) throw new CommunityError(400, 'Escreva o comentário ou coloque uma foto.');
  if ((await recentCount(schema.feedComments, schema.feedComments.userId, schema.feedComments.createdAt, userId, 3600000)) >= FEED_LIMITS.commentsPerHour) {
    throw new CommunityError(429, 'Muitos comentários seguidos. Tente de novo daqui a pouco.');
  }
  const [c] = await db.insert(schema.feedComments).values({ postId, userId, body, imageUrl }).returning();
  return c;
}

export async function listComments(viewerId: number, postId: number) {
  await need();
  const { teamOwnerId } = await loadVisiblePost(viewerId, postId);
  const rows = await db.select().from(schema.feedComments).where(and(eq(schema.feedComments.postId, postId), eq(schema.feedComments.status, 'visible'))).orderBy(schema.feedComments.id).limit(200);
  const authors = rows.length ? await db.select({ id: schema.users.id, name: schema.users.name, avatarUrl: schema.users.avatarUrl, level: schema.users.level }).from(schema.users).where(inArray(schema.users.id, [...new Set(rows.map((r) => r.userId))])) : [];
  const nameMap = new Map(authors.map((a) => [a.id, a.name]));
  const profileMap = new Map(authors.map((a) => [a.id, authorProfile(a)]));
  return rows.map((c) => ({
    id: c.id,
    body: c.body,
    imageUrl: c.imageUrl || null,
    createdAt: iso(c.createdAt),
    author: { id: c.userId, name: displayName(nameMap.get(c.userId)), initials: initials(nameMap.get(c.userId)), isTeamOwner: teamOwnerId === c.userId, ...(profileMap.get(c.userId) || authorProfile(null)) },
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
      if (!a.ok) throw new CommunityError(403, 'Conteúdo exclusivo para assinantes deste Ritus.');
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
