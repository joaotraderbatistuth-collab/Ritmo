// Notificações no celular/computador (Web Push), mesmo com o app fechado.
// As chaves VAPID são geradas sozinhas na primeira vez e guardadas no banco (app_settings):
// não é preciso configurar nada na Netlify.
import { nextOccurrence } from './recurrence.js';
import { createHash } from 'node:crypto';
import webpush from 'web-push';
import { and, eq, inArray, isNull, lt, lte, or } from 'drizzle-orm';
import { db } from '../../db/index.js';
import * as schema from '../../db/schema.js';
import { checkDb } from './server-db.js';
import { canSendAuto, normalizePushHours, personalize, pickNudge, slotForAnyHour, PushLog } from './nudges.js';

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

export async function saveSubscription(userId: number, sub: any, perDay: number, hoursRaw?: unknown) {
  const endpoint = String(sub?.endpoint || '');
  const p256dh = String(sub?.keys?.p256dh || '');
  const auth = String(sub?.keys?.auth || '');
  if (!/^https:\/\//.test(endpoint) || !p256dh || !auth || endpoint.length > 1000) throw new Error('Inscrição de notificação inválida.');
  // mantém os horários que a pessoa já escolheu em outro aparelho
  const [prev] = hoursRaw === undefined ? await db.select({ hours: schema.pushSubscriptions.hours }).from(schema.pushSubscriptions).where(eq(schema.pushSubscriptions.userId, userId)).limit(1) : [];
  const chosen = hoursRaw !== undefined ? hoursRaw : prev?.hours;
  const hours = normalizePushHours(chosen, [1, 2, 3].includes(perDay) ? perDay : 3);
  const n = chosen ? hours.length : [1, 2, 3].includes(perDay) ? perDay : 3;
  const h = chosen ? hours.join(',') : null;
  await db
    .insert(schema.pushSubscriptions)
    .values({ userId, endpoint, p256dh, auth, perDay: n, hours: h })
    .onConflictDoUpdate({ target: schema.pushSubscriptions.endpoint, set: { userId, p256dh, auth, perDay: n, hours: h } });
}

export async function removeSubscription(userId: number, endpoint: string) {
  await db.delete(schema.pushSubscriptions).where(and(eq(schema.pushSubscriptions.userId, userId), eq(schema.pushSubscriptions.endpoint, endpoint)));
}

/** Notificações são ligadas por padrão; isto marca quando a pessoa desliga (ou religa) de propósito. */
export async function setPushOptOut(userId: number, optOut: boolean) {
  if (!(await checkDb())) return;
  await db.update(schema.users).set({ pushOptOut: optOut }).where(eq(schema.users.id, userId));
}

export async function setPerDay(userId: number, perDay: number) {
  const n = [1, 2, 3].includes(perDay) ? perDay : 3;
  await db.update(schema.pushSubscriptions).set({ perDay: n, hours: null }).where(eq(schema.pushSubscriptions.userId, userId));
}

/** Horários livres (0–23, até 3) para todos os aparelhos da pessoa. */
export async function setPushHours(userId: number, raw: unknown) {
  const hours = normalizePushHours(raw);
  await db.update(schema.pushSubscriptions).set({ hours: hours.join(','), perDay: hours.length }).where(eq(schema.pushSubscriptions.userId, userId));
  return hours;
}

export async function subscriptionStatus(userId: number) {
  const rows = await db.select({ perDay: schema.pushSubscriptions.perDay, hours: schema.pushSubscriptions.hours }).from(schema.pushSubscriptions).where(eq(schema.pushSubscriptions.userId, userId));
  const perDay = rows[0]?.perDay ?? 3;
  return { devices: rows.length, perDay, hours: normalizePushHours(rows[0]?.hours, perDay) };
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

type PushOpts = { urgency?: 'very-low' | 'low' | 'normal' | 'high'; ttl?: number };

/**
 * urgency 'high' = o serviço de push do Google/Apple entrega na hora, mesmo com o celular
 * em economia de bateria. Lembretes motivacionais usam 'normal'; o resto (teste, admin,
 * secretário, avisos) vai como 'high'.
 */
async function sendOne(sub: { endpoint: string; p256dh: string; auth: string }, payload: object, keys: { publicKey: string; privateKey: string }, opts: PushOpts = {}) {
  return webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, JSON.stringify(payload), {
    vapidDetails: { subject: 'mailto:contato@meu-ritmo.app', publicKey: keys.publicKey, privateKey: keys.privateKey },
    TTL: opts.ttl ?? 3 * 3600,
    urgency: opts.urgency ?? 'high',
  });
}

/** Texto curto do erro do serviço de push, para o painel admin entender o que houve. */
function pushErrorText(e: any): string {
  const code = e?.statusCode ? `HTTP ${e.statusCode}` : '';
  const body = String(e?.body || e?.message || '').replace(/\s+/g, ' ').slice(0, 140);
  return [code, body].filter(Boolean).join(' · ') || 'erro desconhecido';
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
      hours: schema.pushSubscriptions.hours,
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
  const sentTo = new Set<number>();
  for (const s of subs) {
    if (s.status === 'suspended') continue;
    const { ymd, hour } = localParts(now, s.timezone || 'America/Sao_Paulo');
    if (!normalizePushHours(s.hours, s.perDay).includes(hour)) continue;
    // teto do dia (avisos de ranking/desafio também contam); um envio por pessoa, mesmo com 2 aparelhos
    if (!sentTo.has(s.userId) && !canSendAuto(await readPushLog(s.userId, ymd), 'lembrete')) continue;
    const slot = slotForAnyHour(hour);
    const n = pickNudge(slot, ymd, s.userId);
    try {
      await sendOne(s, { title: personalize(n.title, s.name), body: personalize(n.body, s.name), tab: n.tab, tag: `ritmo-${slot}` }, keys, { urgency: 'normal' });
      sent++;
      if (!sentTo.has(s.userId)) {
        sentTo.add(s.userId);
        await addPushLog(s.userId, ymd, 'lembrete');
      }
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

/**
 * Lembretes do secretário: chamado a cada 5 minutos pelo agendador.
 * Envia os lembretes que já venceram (até 3 horas de atraso) para os aparelhos da pessoa.
 */
/* ---------------- Teto diário de notificações automáticas ---------------- */

async function readPushLog(userId: number, day: string): Promise<PushLog | null> {
  try {
    const [r] = await db.select().from(schema.pushLog).where(and(eq(schema.pushLog.userId, userId), eq(schema.pushLog.day, day)));
    return r ? { count: r.count, kinds: r.kinds ? r.kinds.split(',').filter(Boolean) : [] } : null;
  } catch {
    return null;
  }
}

async function addPushLog(userId: number, day: string, kind: string) {
  try {
    const cur = await readPushLog(userId, day);
    const kinds = [...(cur?.kinds || []), kind].join(',');
    await db
      .insert(schema.pushLog)
      .values({ userId, day, count: 1, kinds: kind })
      .onConflictDoUpdate({ target: [schema.pushLog.userId, schema.pushLog.day], set: { count: (cur?.count || 0) + 1, kinds } });
  } catch (e) {
    console.error('[push] registrar envio', e);
  }
}

/**
 * Aviso automático (ranking, desafio, seguidor...): respeita o teto de 4 por dia, no máximo 2 de evento
 * e cada tipo 1 vez por dia. Devolve quantos aparelhos receberam (0 se ficou de fora do teto).
 */
export async function notifyAuto(userId: number, kind: string, payload: { title: string; body: string; tab?: string; tag?: string }) {
  if (!(await checkDb())) return 0;
  const [u] = await db.select({ tz: schema.users.timezone, optOut: schema.users.pushOptOut }).from(schema.users).where(eq(schema.users.id, userId));
  if (!u || u.optOut) return 0;
  const { ymd } = localParts(new Date(), u.tz || 'America/Sao_Paulo');
  if (!canSendAuto(await readPushLog(userId, ymd), kind)) return 0;
  const sent = await notifyUser(userId, payload);
  if (sent > 0) await addPushLog(userId, ymd, kind);
  return sent;
}

/** Manda uma notificação para todos os aparelhos de uma pessoa (se ela ligou as notificações). */
export async function notifyUser(userId: number, payload: { title: string; body: string; tab?: string; tag?: string }) {
  if (!(await checkDb())) return 0;
  const keys = await getVapidKeys();
  if (!keys) return 0;
  const subs = await db.select().from(schema.pushSubscriptions).where(eq(schema.pushSubscriptions.userId, userId));
  let sent = 0;
  for (const s of subs) {
    try {
      await sendOne(s, payload, keys);
      sent++;
    } catch (e: any) {
      if (e?.statusCode === 404 || e?.statusCode === 410) await db.delete(schema.pushSubscriptions).where(eq(schema.pushSubscriptions.id, s.id));
    }
  }
  return sent;
}

/** Estatística para o painel: quantas pessoas e aparelhos têm as notificações ligadas. */
export async function pushStats() {
  if (!(await checkDb())) return { people: 0, devices: 0 };
  const rows = await db.select({ userId: schema.pushSubscriptions.userId }).from(schema.pushSubscriptions);
  return { people: new Set(rows.map((r) => r.userId)).size, devices: rows.length };
}

/**
 * Envio feito pelo administrador: para uma lista de pessoas ou para todos com notificação ligada
 * (contas desativadas ficam de fora). Envia em lotes para não estourar o tempo do servidor.
 */
export async function sendAdminPush(userIds: number[] | 'all', payload: { title: string; body: string; tab?: string; tag?: string }) {
  if (!(await checkDb())) throw new Error('Banco indisponível.');
  const keys = await getVapidKeys();
  if (!keys) throw new Error('Banco indisponível.');
  const base = db
    .select({ id: schema.pushSubscriptions.id, userId: schema.pushSubscriptions.userId, endpoint: schema.pushSubscriptions.endpoint, p256dh: schema.pushSubscriptions.p256dh, auth: schema.pushSubscriptions.auth, status: schema.users.subscriptionStatus })
    .from(schema.pushSubscriptions)
    .innerJoin(schema.users, eq(schema.users.id, schema.pushSubscriptions.userId));
  const subs = (userIds === 'all' ? await base.limit(5000) : userIds.length ? await base.where(inArray(schema.pushSubscriptions.userId, userIds)) : []).filter((s) => s.status !== 'suspended');
  let sent = 0;
  let removed = 0;
  let failed = 0;
  let firstError = '';
  const people = new Set<number>();
  for (let i = 0; i < subs.length; i += 25) {
    const batch = subs.slice(i, i + 25);
    const results = await Promise.allSettled(batch.map((s) => sendOne(s, payload, keys, { urgency: 'high', ttl: 12 * 3600 })));
    for (let j = 0; j < results.length; j++) {
      const r = results[j];
      if (r.status === 'fulfilled') {
        sent++;
        people.add(batch[j].userId);
      } else if ((r.reason as any)?.statusCode === 404 || (r.reason as any)?.statusCode === 410) {
        await db.delete(schema.pushSubscriptions).where(eq(schema.pushSubscriptions.id, batch[j].id));
        removed++;
      } else {
        failed++;
        if (!firstError) firstError = pushErrorText(r.reason);
      }
    }
  }
  return { devices: subs.length, sent, removed, failed, firstError, people: people.size };
}

export async function sendDueReminders(now: Date = new Date()) {
  if (!(await checkDb())) return { due: 0, sent: 0 };
  const rows = await db
    .select({ id: schema.reminders.id, userId: schema.reminders.userId, text: schema.reminders.text, remindAt: schema.reminders.remindAt, repeat: schema.reminders.repeat, assistantName: schema.users.assistantName, status: schema.users.subscriptionStatus, timezone: schema.users.timezone })
    .from(schema.reminders)
    .innerJoin(schema.users, eq(schema.users.id, schema.reminders.userId))
    .where(and(isNull(schema.reminders.sentAt), isNull(schema.reminders.doneAt), lte(schema.reminders.remindAt, now)))
    .limit(500);
  if (!rows.length) return { due: 0, sent: 0 };
  const fresh = (r: (typeof rows)[number]) => now.getTime() - new Date(r.remindAt).getTime() < 5 * 3600_000; // a função roda a cada 4 h: aceita até 5 h de atraso
  // marca antes de enviar: se duas execuções se cruzarem, ninguém recebe o lembrete duas vezes.
  // Uma vez só → sent_at. Repetido → pula para a próxima vez (no fuso da pessoa).
  const once = rows.filter((r) => !r.repeat).map((r) => r.id);
  if (once.length) await db.update(schema.reminders).set({ sentAt: now }).where(inArray(schema.reminders.id, once));
  const due: typeof rows = [];
  for (const r of rows) {
    if (r.repeat) {
      const next = nextOccurrence(r.repeat, new Date(r.remindAt), r.timezone || 'America/Sao_Paulo', now);
      const upd = await db
        .update(schema.reminders)
        .set(next ? { remindAt: next } : { sentAt: now })
        .where(and(eq(schema.reminders.id, r.id), lte(schema.reminders.remindAt, now), isNull(schema.reminders.sentAt)))
        .returning({ id: schema.reminders.id });
      if (!upd.length) continue; // outra execução já cuidou deste
    }
    if (fresh(r)) due.push(r);
  }
  if (!due.length) return { due: 0, sent: 0 };
  const keys = await getVapidKeys();
  if (!keys) return { due: due.length, sent: 0 };
  const userIds = [...new Set(due.filter((r) => r.status !== 'suspended').map((r) => r.userId))];
  const subs = userIds.length ? await db.select().from(schema.pushSubscriptions).where(inArray(schema.pushSubscriptions.userId, userIds)) : [];
  let sent = 0;
  for (const r of due) {
    if (r.status === 'suspended') continue;
    for (const s of subs.filter((x) => x.userId === r.userId)) {
      try {
        await sendOne(s, { title: `⏰ ${r.assistantName || 'Seu secretário'} lembrando`, body: r.text, tab: 'hoje', tag: `ritmo-lembrete-${r.id}-${new Date(r.remindAt).getTime()}` }, keys);
        sent++;
      } catch (e: any) {
        if (e?.statusCode === 404 || e?.statusCode === 410) await db.delete(schema.pushSubscriptions).where(eq(schema.pushSubscriptions.id, s.id));
      }
    }
  }
  return { due: due.length, sent };
}
