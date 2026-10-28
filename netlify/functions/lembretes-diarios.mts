// Roda todo dia às 11:00 UTC (08:00 em Brasília) e pede ao app para enviar os lembretes
// de vencimento. Precisa da variável CRON_SECRET (a mesma nos dois lados).
export default async () => {
  const base = process.env.URL;
  const secret = process.env.CRON_SECRET;
  if (!base || !secret) {
    console.log('lembretes-diarios: URL ou CRON_SECRET ausentes — nada a fazer.');
    return;
  }
  const res = await fetch(`${base}/api/cron/lembretes`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${secret}` },
  });
  console.log('lembretes-diarios:', res.status, await res.text());
};

export const config = { schedule: '0 11 * * *' };
