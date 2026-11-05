// Notificações no celular/computador (Web Push), mesmo com o app fechado.
// As chaves VAPID são geradas sozinhas na primeira vez e guardadas no banco (app_settings):
// não é preciso configurar nada na Netlify.
import { createHash } from 'node:crypto';
import webpush from 'web-push';
import { and, eq, inArray, isNull, lt, or } from 'drizzle-orm';
import { db } from '../../db/index.js';
import * as schema from '../../db/schema.js';
import { checkDb } from './server-db.js';
import { PUSH_HOURS, personalize, pickNudge, slotForHour } from './nudges.js';

let cachedKeys: { publicKey: string; privateKey: string } | null = null;

export async function getVapidKeys() {
  if (cachedKeys) return cachedKeys;
  if (!(await checkDb())) return null;
  const [row] = await db.select().from(schema.appSettings).where(eq(schema.appSettings.key, 'vapid_keys'));
  if (row) {
    cachedKeys = JSON.parse(row.value);
    return cachedKeys;
  }
  const keys = webpush.generateVAPIDKeys();
  // se dois servidores gerarem ao mesmo tempo, vale o primeiro que gravou
  await db.insert(schema.appSettings).values({ key: 'vapid_keys', value: JSON.stringify(keys) }).onConflictDoNothing();
  const [saved] = await db.select().from(schema.appSettings).where(eq(schema.appSettings.key, 'vapid_keys'));
  cachedKeys = saved ? JSON.parse(saved.value) : keys;
  return cachedKeys;
}

export async function saveSubscription(userId: number, sub: any, perDay: number) {
  const endpoint = String(sub?.endpoint || '');
  const p256dh = String(sub?.keys?.p256dh || '');
  const auth = String(sub?.keys?.auth || '');
  if (!/^https:\/\//.test(endpoint) || !p256dh || !auth || endpoint.length > 1000) throw new Error('Inscrição de notificação inválida.');
  const n = [1, 2, 3].includes(perDay) ? perDay : 3;
  await db
    .insert(schema.pushSubscriptions)
    .values({ userId, endpoint, p256dh, auth, perDay: n })
    .onConflictDoUpdate({ target: schema.pushSubscriptions.endpoint, set: { userId, p256dh, auth, perDay: n } });
}

export async function removeSubscription(userId: number, endpoint: string) {
  await db.delete(schema.pushSubscriptions).where(and(eq(schema.pushSubscriptions.userId, userId), eq(schema.pushSubscriptions.endpoint, endpoint)));
}

export async function setPerDay(userId: number, perDay: number) {
  const n = [1, 2, 3].includes(perDay) ? perDay : 3;
  await db.update(schema.pushSubscriptions).set({ perDay: n }).where(eq(schema.pushSubscriptions.userId, userId));
}

export async function subscriptionStatus(userId: number) {
  const rows = await db.select({ perDay: schema.pushSubscriptions.perDay }).from(schema.pushSubscriptions).where(eq(schema.pushSubscriptions.userId, userId));
  return { devices: rows.length, perDay: rows[0]?.perDay ?? 3 };
}

/** Token do agendador: derivado do CRON_SECRET (ou do JWT_SECRET, que é obrigatório em produção). */
export function cronToken(): string | null {
  const base = process.env.CRON_SECRET || process.env.JWT_SECRET;
  if (!base) return null;
  return createHash('sha256').update(`ritmo-cron:${base}`).digest('hex');
}

function localParts(now: Date, timeZone: string) {
  try {
    const f = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23' });
    const p = Object.fromEntries(f.formatToParts(now).map((x) => [x.type, x.value]));
    return { ymd: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour) };
  } catch {
    return localParts(now, 'America/Sao_Paulo');
  }
}

async function sendOne(sub: { endpoint: string; p256dh: string; auth: string }, payload: object, keys: { publicKey: string; privateKey: string }) {
  return webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, JSON.stringify(payload), {
    vapidDetails: { subject: 'mailto:contato@meu-ritmo.app', publicKey: keys.publicKey, privateKey: keys.privateKey },
    TTL: 3 * 3600,
    urgency: 'normal',
  });
}

/** Envia uma notificação de teste para os aparelhos da pessoa. */
export async function sendTest(userId: number, name?: string | null) {
  const keys = await getVapidKeys();
  if (!keys) throw new Error('Banco indisponível.');
  const subs = await db.select().from(schema.pushSubscriptions).where(eq(schema.pushSubscriptions.userId, userId));
  let ok = 0;
  for (const s of subs) {
    try {
      await sendOne(s, { title: personalize('Pronto, {nome}! 🔔', name), body: 'As notificações do Ritmo estão ligadas. Vamos juntos, um dia de cada vez.', tab: 'hoje' }, keys);
      ok++;
    } catch (e: any) {
      if (e?.statusCode === 404 || e?.statusCode === 410) await db.delete(schema.pushSubscriptions).where(eq(schema.pushSubscriptions.id, s.id));
    }
  }
  return ok;
}

/**
 * Chamado a cada hora pelo agendador. Para cada aparelho inscrito, vê a hora local da pessoa;
 * se for um dos horários escolhidos (8h, 13h, 19h), envia UM lembrete do período.
 */
export async function sendDueNudges(now: Date = new Date()) {
  const keys = await getVapidKeys();
  if (!keys) return { checked: 0, sent: 0, removed: 0 };
  const recentLimit = new Date(now.getTime() - 50 * 60 * 1000);
  const subs = await db
    .select({
      id: schema.pushSubscriptions.id,
      userId: schema.pushSubscriptions.userId,
      endpoint: schema.pushSubscriptions.endpoint,
      p256dh: schema.pushSubscriptions.p256dh,
      auth: schema.pushSubscriptions.auth,
      perDay: schema.pushSubscriptions.perDay,
      name: schema.users.name,
      timezone: schema.users.timezone,
      status: schema.users.subscriptionStatus,
    })
    .from(schema.pushSubscriptions)
    .innerJoin(schema.users, eq(schema.users.id, schema.pushSubscriptions.userId))
    .where(or(isNull(schema.pushSubscriptions.lastSentAt), lt(schema.pushSubscriptions.lastSentAt, recentLimit)));

  let sent = 0;
  let removed = 0;
  const done: number[] = [];
  for (const s of subs) {
    if (s.status === 'suspended') continue;
    const { ymd, hour } = localParts(now, s.timezone || 'America/Sao_Paulo');
    if (!(PUSH_HOURS[s.perDay] || PUSH_HOURS[3]).includes(hour)) continue;
    const slot = slotForHour(hour);
    if (!slot) continue;
    const n = pickNudge(slot, ymd, s.userId);
    try {
      await sendOne(s, { title: personalize(n.title, s.name), body: personalize(n.body, s.name), tab: n.tab, tag: `ritmo-${slot}` }, keys);
      sent++;
      done.push(s.id);
    } catch (e: any) {
      if (e?.statusCode === 404 || e?.statusCode === 410) {
        await db.delete(schema.pushSubscriptions).where(eq(schema.pushSubscriptions.id, s.id));
        removed++;
      }
    }
  }
  if (done.length) await db.update(schema.pushSubscriptions).set({ lastSentAt: now }).where(inArray(schema.pushSubscriptions.id, done));
  return { checked: subs.length, sent, removed };
}
