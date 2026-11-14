// Contas oficiais (fundadores) no banco: lista em app_settings ('official_accounts'; sem valor = a conta master).
// - Quem cria conta já começa seguindo as contas oficiais.
// - Quem já tinha conta passa a seguir uma única vez (marcador 'official_follows_done'); quem deixar de seguir depois não volta sozinho.
// - Publicação de conta oficial no Feed geral avisa no celular todos os seguidores (fora do teto diário, como os avisos do painel).
import { and, eq, inArray, ne } from 'drizzle-orm';
import { db } from '../../db/index.js';
import * as schema from '../../db/schema.js';
import { checkDb } from './server-db.js';
import { masterEmailList } from './admin-permissions.js';
import { officialPostPush, parseOfficialIds, toggleOfficial } from './official.js';

const KEY = 'official_accounts';
const DONE_KEY = 'official_follows_done';

let cache: { ids: number[]; at: number } | null = null;

async function readSetting(key: string): Promise<string | null> {
  const [row] = await db.select().from(schema.appSettings).where(eq(schema.appSettings.key, key));
  return row?.value ?? null;
}

async function writeSetting(key: string, value: string) {
  await db
    .insert(schema.appSettings)
    .values({ key, value })
    .onConflictDoUpdate({ target: schema.appSettings.key, set: { value, updatedAt: new Date() } });
}

async function masterIds(): Promise<number[]> {
  const emails = masterEmailList(process.env.MASTER_ADMIN_EMAIL || null);
  if (!emails.length) return [];
  const rows = await db.select({ id: schema.users.id }).from(schema.users).where(inArray(schema.users.email, emails));
  return rows.map((r) => r.id);
}

/** Contas oficiais (cache de 1 minuto). Na primeira leitura de cada servidor, faz quem já tinha conta seguir as novas oficiais. */
export async function getOfficialIds(): Promise<number[]> {
  if (!(await checkDb())) return [];
  if (cache && Date.now() - cache.at < 60_000) return cache.ids;
  try {
    const ids = parseOfficialIds(await readSetting(KEY)) ?? (await masterIds());
    cache = { ids, at: Date.now() };
    await backfillOnce(ids);
    return ids;
  } catch (e) {
    console.error('[oficiais] leitura', e);
    return [];
  }
}

/** Todo mundo que já tinha conta passa a seguir cada conta oficial, uma única vez por conta. */
async function backfillOnce(ids: number[]) {
  const done = parseOfficialIds(await readSetting(DONE_KEY)) || [];
  const pending = ids.filter((id) => !done.includes(id));
  if (!pending.length) return;
  for (const id of pending) {
    const others = await db.select({ id: schema.users.id }).from(schema.users).where(ne(schema.users.id, id));
    for (let i = 0; i < others.length; i += 500) {
      const chunk = others.slice(i, i + 500).map((u) => ({ followerId: u.id, followeeId: id }));
      if (chunk.length) await db.insert(schema.follows).values(chunk).onConflictDoNothing();
    }
  }
  // o marcador guarda até 50 ids (contas que já foram oficiais um dia)
  const merged = [...new Set([...done, ...pending])].slice(-50);
  await writeSetting(DONE_KEY, JSON.stringify(merged));
}

/** Conta nova: já começa seguindo as contas oficiais. */
export async function followOfficials(newUserId: number) {
  try {
    const ids = (await getOfficialIds()).filter((id) => id !== newUserId);
    if (ids.length) await db.insert(schema.follows).values(ids.map((id) => ({ followerId: newUserId, followeeId: id }))).onConflictDoNothing();
  } catch (e) {
    console.error('[oficiais] seguir no cadastro', e);
  }
}

/** Painel (só o master): marca ou desmarca uma conta como oficial. */
export async function setOfficial(userId: number, on: boolean): Promise<number[]> {
  if (!(await checkDb())) throw new Error('Banco indisponível.');
  const [u] = await db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.id, userId));
  if (!u) throw new Error('Usuário não encontrado.');
  const current = parseOfficialIds(await readSetting(KEY)) ?? (await masterIds());
  const next = toggleOfficial(current, userId, on);
  await writeSetting(KEY, JSON.stringify(next));
  cache = null;
  await getOfficialIds(); // já faz todo mundo seguir a conta recém-marcada
  return next;
}

/** Publicação nova no Feed geral: se o autor é conta oficial, avisa no celular todos os seguidores. */
export async function notifyOfficialPost(post: { id: number; userId: number; teamId: number | null; body: string | null; kind: string }) {
  if (post.teamId) return { sent: 0 };
  const ids = await getOfficialIds();
  if (!ids.includes(post.userId)) return { sent: 0 };
  const [author] = await db.select({ name: schema.users.name }).from(schema.users).where(eq(schema.users.id, post.userId));
  const followers = await db
    .select({ id: schema.follows.followerId })
    .from(schema.follows)
    .innerJoin(schema.users, eq(schema.users.id, schema.follows.followerId))
    .where(and(eq(schema.follows.followeeId, post.userId), eq(schema.users.pushOptOut, false)));
  const userIds = followers.map((f) => f.id).filter((id) => id !== post.userId);
  if (!userIds.length) return { sent: 0 };
  const { sendAdminPush } = await import('./push-server.js');
  const text = officialPostPush(author?.name || 'Ritmo', post.body, post.kind);
  const r = await sendAdminPush(userIds, { ...text, tab: 'feed', tag: `ritmo-post-${post.id}` });
  return { sent: r.sent };
}
