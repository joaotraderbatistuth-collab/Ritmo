import { createFileRoute } from '@tanstack/react-router';
import { getUsersNeedingReminder } from '../lib/server-db.js';
import { sendRenewalReminderEmail } from '../lib/email.js';

// Chamado uma vez por dia pela função agendada da Netlify (netlify/functions/lembretes-diarios.mts).
// Protegido por CRON_SECRET: sem o segredo certo, nada acontece.
export const Route = createFileRoute('/api/cron/lembretes')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.CRON_SECRET;
        const auth = request.headers.get('authorization') || '';
        if (!secret || auth !== `Bearer ${secret}`) {
          return Response.json({ error: 'Não autorizado.' }, { status: 401 });
        }

        const targets = await getUsersNeedingReminder();
        let sent = 0;
        let failed = 0;
        for (const t of targets) {
          const r = await sendRenewalReminderEmail(t.email, t.name, t.kind, t.daysLeft);
          if (r.sent) sent++;
          else failed++;
        }
        return Response.json({ checked: targets.length, sent, failed });
      },
    },
  },
});
