// Roda a cada hora, mas só chama o app (e acorda o banco de dados, que é o que mais gasta créditos)
// nas horas em que alguém escolheu receber o lembrete motivacional, e 2 vezes por dia para os pontos
// da temporada. A "agenda de acordar" fica no Netlify Blobs (ver src/lib/wake-plan.ts); sem ela, roda sempre.
// Usa o CRON_SECRET, ou, se ele não existir, o JWT_SECRET (já obrigatório no site) para assinar a chamada.
import { createHash } from 'node:crypto';
import { getStore } from '@netlify/blobs';
import { WAKE_KEY, WAKE_STORE, parsePlan, shouldRunNudges } from '../../src/lib/wake-plan.ts';

export default async () => {
  const base = process.env.URL;
  const secret = process.env.CRON_SECRET || process.env.JWT_SECRET;
  if (!base || !secret) {
    console.log('notificacoes: URL ou segredo ausentes — nada a fazer.');
    return;
  }
  let plan = null;
  try {
    plan = parsePlan(await getStore({ name: WAKE_STORE, consistency: 'strong' }).get(WAKE_KEY));
  } catch (e) {
    console.log('notificacoes: agenda indisponível, rodando normalmente.', String(e));
  }
  if (!shouldRunNudges(plan)) {
    console.log('notificacoes: nada nesta hora — banco continua dormindo.');
    return;
  }
  const token = createHash('sha256').update(`ritmo-cron:${secret}`).digest('hex');
  const res = await fetch(`${base}/api/cron/notificacoes`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('notificacoes:', res.status, await res.text());
};

export const config = { schedule: '0 * * * *' };
