// Dados da aba "Créditos" do painel: API da Netlify (se houver NETLIFY_API_TOKEN) + horas de banco do Ritmo.
// O token é lido só da variável de ambiente (nunca fica no código). Respostas da Netlify ficam 10 min em cache.
import { eq, sql } from 'drizzle-orm';
import { db } from '../../db/index.js';
import * as schema from '../../db/schema.js';
import { checkDb } from './server-db.js';
import { CreditAnchor, CREDIT_PRICES, burn, creditLevel, daysLeft, estimateBalance, hourKey, parseAnchor } from './credits.js';

const API = 'https://api.netlify.com/api/v1';
const ANCHOR_KEY = 'credits_anchor';
const rows = (r: any): any[] => (Array.isArray(r) ? r : r?.rows || []);

interface NetlifyInfo {
  ok: boolean;
  error?: string;
  planName?: string | null;
  planCredits?: number | null;
  periodStart?: string | null;
  periodEnd?: string | null;
  autoTopup?: boolean | null;
  topupAmount?: number | null;
  usageExceeded?: boolean | null;
  bandwidthGB?: number;
  deploys?: { at: string }[];
  alerts?: { at: string; text: string }[];
}

let cache: { at: number; data: NetlifyInfo } | null = null;

async function api(path: string, token: string) {
  const r = await fetch(`${API}${path}`, { headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'ritmo-admin' } });
  if (!r.ok) throw Object.assign(new Error(`Netlify ${r.status}`), { status: r.status });
  return r.json();
}

const num = (v: unknown): number | null => (v === null || v === undefined || v === '' || !Number.isFinite(Number(v)) ? null : Number(v));

async function loadNetlify(force = false): Promise<NetlifyInfo> {
  const token = process.env.NETLIFY_API_TOKEN;
  if (!token) return { ok: false, error: 'no_token' };
  if (!force && cache && Date.now() - cache.at < 10 * 60_000) return cache.data;
  try {
    const siteId = process.env.SITE_ID;
    let accountId: string | null = null;
    if (siteId) accountId = (await api(`/sites/${siteId}`, token))?.account_id ?? null;
    if (!accountId) accountId = (await api('/accounts', token))?.[0]?.id ?? null;
    if (!accountId) return { ok: false, error: 'no_account' };

    const acc: any = await api(`/accounts/${accountId}`, token);
    const periodStart = acc.current_billing_period_start || null;
    const periodEnd = acc.next_billing_period_start || null;
    const planCredits = num(acc.plan_credits) ?? num(acc.capabilities?.credits?.included);

    let bandwidthGB = 0;
    try {
      const bw: any = await api(`/accounts/${accountId}/bandwidth`, token);
      bandwidthGB = (num(bw?.used) ?? 0) / 1024 ** 3;
    } catch {
      /* sem tráfego: segue */
    }

    // publicações em produção concluídas desde o início do período (até 5 páginas de 100)
    const deploys: { at: string }[] = [];
    if (siteId) {
      const since = periodStart ? Date.parse(periodStart) : Date.now() - 31 * 86400_000;
      for (let page = 1; page <= 5; page++) {
        const list: any[] = await api(`/sites/${siteId}/deploys?production=true&per_page=100&page=${page}`, token);
        if (!Array.isArray(list) || !list.length) break;
        let older = false;
        for (const d of list) {
          const at = Date.parse(d.created_at);
          if (at < since) {
            older = true;
            continue;
          }
          if (d.state === 'ready' && (d.context === 'production' || !d.context)) deploys.push({ at: new Date(at).toISOString() });
        }
        if (older || list.length < 100) break;
      }
    }

    // avisos de saldo e compras de crédito (registro da conta)
    const alerts: { at: string; text: string }[] = [];
    try {
      const audit: any[] = await api(`/accounts/${accountId}/audit?per_page=100`, token);
      for (const e of Array.isArray(audit) ? audit : []) {
        const action = String(e?.payload?.action || e?.action || '');
        const traits = e?.payload?.traits || e?.traits || {};
        const at = e?.payload?.timestamp || e?.created_at || e?.timestamp;
        if (!at) continue;
        if (/credit balance threshold/i.test(action)) alerts.push({ at, text: `A Netlify avisou: saldo chegou a ${traits.credit_balance ?? '?'} créditos` });
        else if (/credits purchased/i.test(action)) alerts.push({ at, text: `Créditos comprados: ${traits.purchase_amount ?? '?'}` });
        else if (/credit balance depleted/i.test(action)) alerts.push({ at, text: 'Os créditos acabaram (site pode sair do ar)' });
        else if (/grace credit/i.test(action)) alerts.push({ at, text: 'A Netlify deu créditos de cortesia' });
      }
    } catch {
      /* registro indisponível: segue */
    }

    const data: NetlifyInfo = {
      ok: true,
      planName: acc.type_name || null,
      planCredits,
      periodStart,
      periodEnd,
      autoTopup: typeof acc.auto_topup_enabled === 'boolean' ? acc.auto_topup_enabled : null,
      topupAmount: num(acc.plan_auto_topup_amount),
      usageExceeded: typeof acc.usages_exceeded === 'boolean' ? acc.usages_exceeded : Array.isArray(acc.usages_exceeded) ? acc.usages_exceeded.length > 0 : null,
      bandwidthGB: Math.round(bandwidthGB * 100) / 100,
      deploys,
      alerts: alerts.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 10),
    };
    cache = { at: Date.now(), data };
    return data;
  } catch (e: any) {
    return { ok: false, error: e?.status === 401 || e?.status === 403 ? 'bad_token' : 'netlify_error' };
  }
}

async function dbHourStats(sinceIso: string) {
  if (!(await checkDb())) return { period: 0, since: (_: string) => 0, daily: [] as { day: string; hours: number }[] };
  const all = rows(await db.execute(sql`SELECT "hour" FROM "db_hours" WHERE "hour" >= ${hourKey(new Date(Date.parse(sinceIso) - 40 * 86400_000))} ORDER BY "hour"`)).map((r) => String(r.hour));
  const start = hourKey(new Date(sinceIso));
  const daily = new Map<string, number>();
  for (const h of all) daily.set(h.slice(0, 10), (daily.get(h.slice(0, 10)) || 0) + 1);
  return {
    period: all.filter((h) => h >= start).length,
    since: (iso: string) => {
      const k = hourKey(new Date(iso));
      return all.filter((h) => h > k).length; // a hora da anotação já estava no saldo visto
    },
    daily: [...daily.entries()].map(([day, hours]) => ({ day, hours })).slice(-30),
  };
}

export async function getAnchor(): Promise<CreditAnchor | null> {
  if (!(await checkDb())) return null;
  const [row] = await db.select().from(schema.appSettings).where(eq(schema.appSettings.key, ANCHOR_KEY));
  return parseAnchor(row?.value);
}

export async function setAnchor(balance: number): Promise<CreditAnchor> {
  const anchor = parseAnchor({ balance, at: new Date().toISOString() });
  if (!anchor) throw new Error('Saldo inválido.');
  await db
    .insert(schema.appSettings)
    .values({ key: ANCHOR_KEY, value: JSON.stringify(anchor) })
    .onConflictDoUpdate({ target: schema.appSettings.key, set: { value: JSON.stringify(anchor), updatedAt: new Date() } });
  return anchor;
}

export async function creditReport(force = false) {
  const [net, anchor] = await Promise.all([loadNetlify(force), getAnchor()]);
  const now = new Date();
  const periodStart = net.ok && net.periodStart ? net.periodStart : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  const hours = await dbHourStats(periodStart);
  const deploys = net.ok ? net.deploys || [] : [];
  const planCredits = net.ok ? net.planCredits ?? null : null;
  const bandwidthGB = net.ok ? net.bandwidthGB || 0 : 0;

  // gasto depois da anotação: tráfego é dividido pela fração do período que já passou depois dela
  let sinceAnchor: { deploys: number; bandwidthGB: number; dbHours: number } | undefined;
  if (anchor) {
    const a = Date.parse(anchor.at);
    const p = Date.parse(periodStart);
    const frac = now.getTime() > p ? Math.max(0, Math.min(1, (now.getTime() - Math.max(a, p)) / (now.getTime() - p))) : 0;
    sinceAnchor = { deploys: deploys.filter((d) => Date.parse(d.at) > a).length, bandwidthGB: bandwidthGB * frac, dbHours: hours.since(anchor.at) };
  }
  const est = estimateBalance({ planCredits, deploys: deploys.length, bandwidthGB, dbHours: hours.period }, anchor, sinceAnchor);

  // ritmo médio: últimos 7 dias (banco + publicações + tráfego proporcional)
  const weekAgo = now.getTime() - 7 * 86400_000;
  const dbWeek = hours.daily.filter((d) => Date.parse(d.day + 'T23:59:59Z') >= weekAgo).reduce((s, d) => s + d.hours, 0);
  const elapsedDays = Math.max(1, (now.getTime() - Date.parse(periodStart)) / 86400_000);
  const perDay =
    (burn({ deploys: deploys.filter((d) => Date.parse(d.at) >= weekAgo).length, bandwidthGB: 0, dbHours: dbWeek }).total) / 7 +
    (bandwidthGB * CREDIT_PRICES.bandwidthGB) / elapsedDays;

  return {
    netlify: net.ok
      ? { connected: true, planName: net.planName, planCredits, periodStart: net.periodStart, periodEnd: net.periodEnd, autoTopup: net.autoTopup, topupAmount: net.topupAmount, usageExceeded: net.usageExceeded, alerts: net.alerts || [] }
      : { connected: false, error: net.error },
    periodStart,
    usage: { deploys: deploys.length, bandwidthGB, dbHours: hours.period },
    cost: est.period,
    remaining: est.remaining,
    basis: est.basis,
    anchor,
    afterAnchor: est.afterAnchor,
    perDay: Math.round(perDay * 10) / 10,
    daysLeft: daysLeft(est.remaining, perDay),
    level: creditLevel(est.remaining, anchor ? Math.max(anchor.balance, planCredits || 0) : planCredits),
    daily: hours.daily.map((d) => ({ ...d, credits: d.hours * CREDIT_PRICES.dbHour })),
    prices: CREDIT_PRICES,
    checkedAt: now.toISOString(),
  };
}
