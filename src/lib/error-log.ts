// Alerta de erros: guarda (agrupando erros iguais) e avisa o administrador master por e-mail.
import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { db } from '../../db/index.js';
import * as schema from '../../db/schema.js';
import { checkDb } from './server-db.js';
import { CleanError, cleanError, fingerprint } from './error-rules.js';
import { sendErrorAlertEmail } from './email.js';
import { DEFAULT_MASTER_EMAIL } from './admin-permissions.js';

const recent = new Map<string, number>(); // evita gravar o mesmo erro mil vezes por minuto

export async function recordError(e: CleanError, userId: number | null = null) {
  const fp = fingerprint(e.source, e.message, e.stack);
  const now = Date.now();
  if ((recent.get(fp) || 0) > now - 10_000) return;
  recent.set(fp, now);
  if (recent.size > 500) recent.clear();
  try {
    if (!(await checkDb())) return;
    const [row] = await db
      .insert(schema.errorLogs)
      .values({ fingerprint: fp, source: e.source, message: e.message, stack: e.stack, url: e.url, userAgent: e.userAgent, userId })
      .onConflictDoUpdate({
        target: schema.errorLogs.fingerprint,
        set: {
          count: sql`${schema.errorLogs.count} + 1`,
          lastSeen: new Date(),
          url: e.url,
          userAgent: e.userAgent,
          // um erro marcado como resolvido que volta a acontecer reabre
          resolvedAt: null,
        },
      })
      .returning();
    // e-mail: erro novo ou que voltou, no máximo a cada 6 horas por erro
    const lastNotified = row?.notifiedAt ? new Date(row.notifiedAt).getTime() : 0;
    if (row && now - lastNotified > 6 * 3600_000) {
      await db.update(schema.errorLogs).set({ notifiedAt: new Date() }).where(eq(schema.errorLogs.id, row.id));
      const to = (process.env.MASTER_ADMIN_EMAIL || DEFAULT_MASTER_EMAIL).split(',')[0].trim();
      await sendErrorAlertEmail(to, { message: row.message, source: row.source, url: row.url, count: row.count }).catch(() => null);
    }
  } catch {
    // o alerta de erro nunca pode derrubar o app
  }
}

/** Para usar nos `catch` do servidor. */
export function reportServerError(err: unknown, where: string, userId: number | null = null) {
  const e: any = err || {};
  const clean = cleanError({ message: `[${where}] ${e?.message || String(err)}`, stack: e?.stack || '', url: where }, 'servidor');
  if (clean) void recordError(clean, userId);
}

export async function listErrors(includeResolved = false) {
  if (!(await checkDb())) return [];
  return db
    .select()
    .from(schema.errorLogs)
    .where(includeResolved ? undefined : isNull(schema.errorLogs.resolvedAt))
    .orderBy(desc(schema.errorLogs.lastSeen))
    .limit(100);
}

export async function resolveError(id: number) {
  if (!(await checkDb())) return false;
  const r = await db.update(schema.errorLogs).set({ resolvedAt: new Date() }).where(and(eq(schema.errorLogs.id, id), isNull(schema.errorLogs.resolvedAt))).returning({ id: schema.errorLogs.id });
  return r.length > 0;
}

/**
 * Captura no servidor todo `console.error(..., erro)` que tiver um Error de verdade: assim os
 * `catch` que já existem no app passam a aparecer na aba Erros sem mexer em cada rota.
 */
let hooked = false;
export function installServerErrorHook() {
  if (hooked || typeof window !== 'undefined') return;
  hooked = true;
  const original = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    original(...args);
    try {
      const err = args.find((a) => a instanceof Error) as Error | undefined;
      if (!err) return;
      const where = typeof args[0] === 'string' ? String(args[0]).replace(/[[\]]/g, '').slice(0, 40) : 'servidor';
      reportServerError(err, where);
    } catch {
      // nunca quebra o log original
    }
  };
}
