import { createFileRoute } from '@tanstack/react-router';
import { cronToken, sendDueReminders } from '../lib/push-server.js';
import { refreshWakePlan } from '../lib/wake-plan-server.js';

// Chamado pela função agendada (netlify/functions/lembretes-secretario.mts) só quando o próximo lembrete chegou.
// No fim, refaz a agenda de acordar (próximo lembrete pendente).
export const Route = createFileRoute('/api/cron/lembretes-secretario')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = cronToken();
        const auth = request.headers.get('authorization') || '';
        if (!token || auth !== `Bearer ${token}`) return Response.json({ error: 'Não autorizado.' }, { status: 401 });
        try {
          const result = await sendDueReminders();
          const plan = await refreshWakePlan().catch(() => null);
          return Response.json({ ...result, nextReminderAt: plan?.nextReminderAt ?? null });
        } catch (e: any) {
          console.error('[lembretes-secretario]', e);
          await refreshWakePlan().catch(() => null);
          return Response.json({ error: 'Falha ao enviar.' }, { status: 500 });
        }
      },
    },
  },
});
