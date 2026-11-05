// Busca no banco o que o painel de números precisa e entrega para os cálculos puros (metrics.ts).
import { sql } from 'drizzle-orm';
import { db } from '../../db/index.js';
import { checkDb } from './server-db.js';
import { computeMetrics, Metrics, MPayment, MUser } from './metrics.js';
import { PLAN_PRICE_CENTS } from './commission-plan.js';
import { brDay } from './activity.js';

const TZ = `'America/Sao_Paulo'`;
const rows = (r: any): any[] => (Array.isArray(r) ? r : r?.rows || []);

export interface FeatureUse {
  feature: string;
  users7d: number;
}

export async function loadMetrics(): Promise<(Metrics & { simulatedPayments: number; features: FeatureUse[] }) | null> {
  if (!(await checkDb())) return null;
  const day = (col: string) => sql.raw(`to_char((${col} AT TIME ZONE 'UTC') AT TIME ZONE ${TZ}, 'YYYY-MM-DD')`);

  const users: MUser[] = rows(
    await db.execute(sql`SELECT id, ${day('created_at')} AS d, role, subscription_status AS status, referred_by, signup_source FROM users`)
  ).map((r) => ({ id: Number(r.id), createdDay: r.d, role: r.role, status: r.status, referredBy: r.referred_by || null, source: r.signup_source || null }));

  const payRows = rows(
    await db.execute(sql`SELECT user_id, ${day('COALESCE(paid_at, created_at)')} AS d, amount_cents, kind, is_simulated FROM payments WHERE status = 'paid'`)
  );
  // pagamentos de teste (simulados) não entram nos números, igual à Visão geral
  const payments: MPayment[] = payRows.filter((r) => !r.is_simulated).map((r) => ({ userId: Number(r.user_id), paidDay: r.d, amountCents: Number(r.amount_cents), kind: r.kind || 'subscription' }));

  // dias de uso: o registro novo (user_activity) + o que dá para saber pelo histórico de cada recurso
  const since = sql.raw(`(now() - interval '120 days')`);
  const activity = rows(
    await db.execute(sql`
      SELECT user_id, day FROM user_activity WHERE day >= to_char(${since}, 'YYYY-MM-DD')
      UNION SELECT user_id, date FROM habit_logs WHERE completed AND date >= to_char(${since}, 'YYYY-MM-DD')
      UNION SELECT user_id, date FROM focus_sessions WHERE date >= to_char(${since}, 'YYYY-MM-DD')
      UNION SELECT user_id, date FROM journal_entries WHERE date >= to_char(${since}, 'YYYY-MM-DD')
      UNION SELECT user_id, ${day('created_at')} FROM finance_transactions WHERE created_at >= ${since}
      UNION SELECT user_id, ${day('created_at')} FROM tasks WHERE created_at >= ${since}
      UNION SELECT user_id, ${day('started_at')} FROM workouts WHERE started_at >= ${since}
      UNION SELECT user_id, ${day('created_at')} FROM feed_posts WHERE created_at >= ${since}
      UNION SELECT user_id, ${day('created_at')} FROM feed_comments WHERE created_at >= ${since}
    `)
  ).map((r) => ({ userId: Number(r.user_id), day: String(r.day) }));

  // uso de cada recurso nos últimos 7 dias (pessoas diferentes)
  const week = sql.raw(`(now() - interval '7 days')`);
  const weekDay = sql.raw(`to_char(now() - interval '7 days', 'YYYY-MM-DD')`);
  const count = async (q: any) => Number(rows(await db.execute(q))[0]?.n || 0);
  const features: FeatureUse[] = [
    { feature: 'Hábitos', users7d: await count(sql`SELECT count(DISTINCT user_id) n FROM habit_logs WHERE completed AND date >= ${weekDay}`) },
    { feature: 'Tarefas', users7d: await count(sql`SELECT count(DISTINCT user_id) n FROM tasks WHERE created_at >= ${week} OR completed_at >= ${week}`) },
    { feature: 'Sessões de foco', users7d: await count(sql`SELECT count(DISTINCT user_id) n FROM focus_sessions WHERE date >= ${weekDay}`) },
    { feature: 'Finanças', users7d: await count(sql`SELECT count(DISTINCT user_id) n FROM finance_transactions WHERE created_at >= ${week}`) },
    { feature: 'Diário', users7d: await count(sql`SELECT count(DISTINCT user_id) n FROM journal_entries WHERE date >= ${weekDay}`) },
    { feature: 'Treino (GPS)', users7d: await count(sql`SELECT count(DISTINCT user_id) n FROM workouts WHERE created_at >= ${week}`) },
    { feature: 'Secretário (lembretes)', users7d: await count(sql`SELECT count(DISTINCT user_id) n FROM reminders WHERE created_at >= ${week}`) },
    { feature: 'Feed (publicou ou comentou)', users7d: await count(sql`SELECT count(DISTINCT user_id) n FROM (SELECT user_id FROM feed_posts WHERE created_at >= ${week} UNION ALL SELECT user_id FROM feed_comments WHERE created_at >= ${week}) x`) },
  ].sort((a, b) => b.users7d - a.users7d);

  const metrics = computeMetrics({ users, payments, activity, today: brDay(), priceCents: PLAN_PRICE_CENTS });
  return { ...metrics, simulatedPayments: payRows.filter((r) => r.is_simulated).length, features };
}
