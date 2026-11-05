// Registro de consentimentos (com fallback em memória como o resto do app).
import { and, desc, eq, isNull } from 'drizzle-orm';
import { db } from '../../db/index.js';
import * as schema from '../../db/schema.js';
import { checkDb } from './server-db.js';
import { ConsentKind, LEGAL_VERSION } from './consent-rules.js';

export interface ConsentItem {
  kind: string;
  version: string;
  grantedAt: string;
  revokedAt: string | null;
}

const mem: (ConsentItem & { userId: number })[] = [];
const iso = (v: any) => (v instanceof Date ? v.toISOString() : v ? String(v) : null);

/** Consentimento vigente de cada tipo (o mais recente). */
export async function listConsents(userId: number): Promise<ConsentItem[]> {
  let rows: ConsentItem[] = [];
  if (await checkDb()) {
    try {
      const r = await db.select().from(schema.consents).where(eq(schema.consents.userId, userId)).orderBy(desc(schema.consents.id));
      rows = r.map((x) => ({ kind: x.kind, version: x.version, grantedAt: iso(x.grantedAt)!, revokedAt: iso(x.revokedAt) }));
    } catch (e) {
      console.error('[consentimentos] listar', e);
      rows = mem.filter((m) => m.userId === userId).reverse();
    }
  } else rows = mem.filter((m) => m.userId === userId).reverse();
  rows = rows.map(({ kind, version, grantedAt, revokedAt }) => ({ kind, version, grantedAt, revokedAt }));
  const seen = new Set<string>();
  return rows.filter((r) => (seen.has(r.kind) ? false : (seen.add(r.kind), true)));
}

export async function grantConsent(userId: number, kind: ConsentKind, version = LEGAL_VERSION) {
  if (await checkDb()) {
    try {
      await db.insert(schema.consents).values({ userId, kind, version });
      return;
    } catch (e) {
      console.error('[consentimentos] registrar', e);
    }
  }
  mem.push({ userId, kind, version, grantedAt: new Date().toISOString(), revokedAt: null });
}

export async function revokeConsent(userId: number, kind: ConsentKind) {
  if (await checkDb()) {
    try {
      await db.update(schema.consents).set({ revokedAt: new Date() }).where(and(eq(schema.consents.userId, userId), eq(schema.consents.kind, kind), isNull(schema.consents.revokedAt)));
      return;
    } catch (e) {
      console.error('[consentimentos] revogar', e);
    }
  }
  for (const m of mem) if (m.userId === userId && m.kind === kind && !m.revokedAt) m.revokedAt = new Date().toISOString();
}
