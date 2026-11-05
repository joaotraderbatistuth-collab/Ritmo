// Roda a cada hora e pede ao app para enviar os lembretes do horário (8h, 13h e 19h no fuso de cada pessoa).
// Usa o CRON_SECRET, ou, se ele não existir, o JWT_SECRET (já obrigatório no site) para assinar a chamada.
import { createHash } from 'node:crypto';

export default async () => {
  const base = process.env.URL;
  const secret = process.env.CRON_SECRET || process.env.JWT_SECRET;
  if (!base || !secret) {
    console.log('notificacoes: URL ou segredo ausentes — nada a fazer.');
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
