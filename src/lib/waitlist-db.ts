// Limite de contas ("vagas") e lista de espera no banco.
import { and, desc, eq, ne, sql } from 'drizzle-orm';
import { db } from '../../db/index.js';
import * as schema from '../../db/schema.js';
import { checkDb } from './server-db.js';
import { cleanWaitlistEntry, parseMaxAccounts, signupOpen, spotsLeft, MAX_ACCOUNTS_CAP } from './signup-limit.js';

const KEY = 'max_accounts';

export async function getMaxAccounts(): Promise<number> {
  if (!(await checkDb())) return parseMaxAccounts(null);
  try {
    const [row] = await db.select().from(schema.appSettings).where(eq(schema.appSettings.key, KEY));
    return parseMaxAccounts(row?.value);
  } catch {
    return parseMaxAccounts(null);
  }
}

export async function setMaxAccounts(value: number): Promise<number> {
  const n = Math.max(0, Math.min(MAX_ACCOUNTS_CAP, Math.floor(Number(value) || 0)));
  if (!(await checkDb())) throw new Error('Banco indisponível.');
  await db
    .insert(schema.appSettings)
    .values({ key: KEY, value: String(n) })
    .onConflictDoUpdate({ target: schema.appSettings.key, set: { value: String(n), updatedAt: new Date() } });
  return n;
}

/** Contas de usuários comuns (administradores não ocupam vaga). */
export async function countUserAccounts(): Promise<number> {
  if (!(await checkDb())) return 0;
  try {
    const [row] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.users).where(ne(schema.users.role, 'admin'));
    return Number(row?.n || 0);
  } catch {
    return 0;
  }
}

export async function signupStatus() {
  const [limit, used] = await Promise.all([getMaxAccounts(), countUserAccounts()]);
  return { open: signupOpen(limit, used), limit, used, left: spotsLeft(limit, used) };
}

/** Entra na lista de espera. Repetir o mesmo e-mail só atualiza o nome (não duplica). */
export async function joinWaitlist(raw: any): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const entry = cleanWaitlistEntry(raw);
  if (!entry) return { ok: false, error: 'Informe um e-mail válido.', status: 400 };
  if (!(await checkDb())) return { ok: false, error: 'Lista de espera indisponível agora. Tente de novo em instantes.', status: 503 };
  const [{ n }] = await db.select({ n: sql<number>`count(*)::int` }).from(schema.waitlist);
  if (Number(n) >= 20_000) return { ok: false, error: 'Lista de espera cheia no momento.', status: 429 };
  await db
    .insert(schema.waitlist)
    .values({ name: entry.name, email: entry.email, source: entry.source || null })
    .onConflictDoUpdate({ target: schema.waitlist.email, set: entry.name ? { name: entry.name } : { email: entry.email } });
  return { ok: true };
}

export async function listWaitlist() {
  if (!(await checkDb())) return [];
  const rows = await db.select().from(schema.waitlist).orderBy(desc(schema.waitlist.createdAt)).limit(5000);
  // marca quem já criou conta depois de entrar na lista
  const emails = rows.map((r) => r.email);
  const have = new Set<string>();
  if (emails.length) {
    const found = await db
      .select({ email: schema.users.email })
      .from(schema.users)
      .where(sql`lower(${schema.users.email}) in (${sql.join(emails.map((e) => sql`${e}`), sql`, `)})`);
    for (const f of found) have.add(f.email.toLowerCase());
  }
  return rows.map((r) => ({ ...r, hasAccount: have.has(r.email) }));
}

export async function setWaitlistNotified(id: number, notified: boolean) {
  if (!(await checkDb())) return false;
  await db.update(schema.waitlist).set({ notifiedAt: notified ? new Date() : null }).where(eq(schema.waitlist.id, id));
  return true;
}

export async function removeWaitlist(id: number) {
  if (!(await checkDb())) return false;
  await db.delete(schema.waitlist).where(and(eq(schema.waitlist.id, id)));
  return true;
}
