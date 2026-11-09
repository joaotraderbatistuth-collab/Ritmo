// Roda a cada hora, mas só chama o app (e acorda o banco de dados) quando o próximo lembrete do secretário
// já chegou. A "agenda de acordar" fica no Netlify Blobs (ver src/lib/wake-plan.ts); sem ela, roda a cada 4 horas.
// Usa o CRON_SECRET, ou, se ele não existir, o JWT_SECRET (já obrigatório no site) para assinar a chamada.
import { createHash } from 'node:crypto';
import { getStore } from '@netlify/blobs';
import { WAKE_KEY, WAKE_STORE, parsePlan, shouldRunReminders } from '../../src/lib/wake-plan.ts';

export default async () => {
  const base = process.env.URL;
  const secret = process.env.CRON_SECRET || process.env.JWT_SECRET;
  if (!base || !secret) {
    console.log('lembretes-secretario: URL ou segredo ausentes — nada a fazer.');
    return;
  }
  let plan = null;
  try {
    plan = parsePlan(await getStore({ name: WAKE_STORE, consistency: 'strong' }).get(WAKE_KEY));
  } catch (e) {
    console.log('lembretes-secretario: agenda indisponível, usando a regra de 4 em 4 horas.', String(e));
  }
  if (!shouldRunReminders(plan)) {
    console.log('lembretes-secretario: nenhum lembrete para agora — banco continua dormindo.');
    return;
  }
  const token = createHash('sha256').update(`ritmo-cron:${secret}`).digest('hex');
  const res = await fetch(`${base}/api/cron/lembretes-secretario`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('lembretes-secretario:', res.status, await res.text());
};

export const config = { schedule: '0 * * * *' };
