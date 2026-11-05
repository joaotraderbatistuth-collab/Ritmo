import { createFileRoute } from '@tanstack/react-router';
import { cronToken, sendDueReminders } from '../lib/push-server.js';

// Chamado a cada 5 minutos pela função agendada da Netlify (netlify/functions/lembretes-secretario.mts).
export const Route = createFileRoute('/api/cron/lembretes-secretario')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = cronToken();
        const auth = request.headers.get('authorization') || '';
        if (!token || auth !== `Bearer ${token}`) return Response.json({ error: 'Não autorizado.' }, { status: 401 });
        try {
          return Response.json(await sendDueReminders());
        } catch (e: any) {
          console.error('[lembretes-secretario]', e);
          return Response.json({ error: 'Falha ao enviar.' }, { status: 500 });
        }
      },
    },
  },
});
