// Roda a cada 5 minutos e pede ao app para enviar os lembretes do secretário que já chegaram na hora.
// Usa o CRON_SECRET, ou, se ele não existir, o JWT_SECRET (já obrigatório no site) para assinar a chamada.
import { createHash } from 'node:crypto';

export default async () => {
  const base = process.env.URL;
  const secret = process.env.CRON_SECRET || process.env.JWT_SECRET;
  if (!base || !secret) {
    console.log('lembretes-secretario: URL ou segredo ausentes — nada a fazer.');
    return;
  }
  const token = createHash('sha256').update(`ritmo-cron:${secret}`).digest('hex');
  const res = await fetch(`${base}/api/cron/lembretes-secretario`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('lembretes-secretario:', res.status, await res.text());
};

export const config = { schedule: '*/5 * * * *' };
