// Registra o dia em que cada pessoa usou o app (base da retenção do painel de números).
// Uma gravação por pessoa por dia: o servidor lembra quem já foi registrado hoje.
import { db } from '../../db/index.js';
import * as schema from '../../db/schema.js';
import { checkDb } from './server-db.js';

const seen = new Set<string>();
let seenDay = '';

export function brDay(d: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

/** Não espera nem falha: se o banco estiver fora, só não registra. */
export function trackActivity(userId: number) {
  if (!Number.isInteger(userId) || userId <= 0) return;
  const day = brDay();
  if (day !== seenDay) {
    seen.clear();
    seenDay = day;
  }
  const key = `${userId}:${day}`;
  if (seen.has(key)) return;
  seen.add(key);
  (async () => {
    try {
      if (!(await checkDb())) return;
      await db.insert(schema.userActivity).values({ userId, day }).onConflictDoNothing();
    } catch {
      seen.delete(key);
    }
  })();
}
