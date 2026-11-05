import { createFileRoute } from '@tanstack/react-router';
import { cronToken, sendDueNudges } from '../lib/push-server.js';

// Chamado a cada hora pela função agendada da Netlify (netlify/functions/notificacoes.mts).
// Envia, para quem ligou as notificações, no máximo 1 lembrete por horário escolhido (8h, 13h, 19h).
export const Route = createFileRoute('/api/cron/notificacoes')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = cronToken();
        const auth = request.headers.get('authorization') || '';
        if (!token || auth !== `Bearer ${token}`) return Response.json({ error: 'Não autorizado.' }, { status: 401 });
        try {
          return Response.json(await sendDueNudges());
        } catch (e: any) {
          console.error('[notificacoes]', e);
          return Response.json({ error: 'Falha ao enviar.' }, { status: 500 });
        }
      },
    },
  },
});
