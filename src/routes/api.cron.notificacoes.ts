import { createFileRoute } from '@tanstack/react-router';
import { cronToken, sendDueNudges } from '../lib/push-server.js';
import { refreshSeasonPoints } from '../lib/game-server.js';

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
          const nudges = await sendDueNudges();
          // aproveita a hora para manter o ranking da temporada em dia (quem não abriu o app há horas)
          const season = await refreshSeasonPoints().catch((e) => {
            console.error('[temporada]', e);
            return { refreshed: 0 };
          });
          return Response.json({ ...nudges, season });
        } catch (e: any) {
          console.error('[notificacoes]', e);
          return Response.json({ error: 'Falha ao enviar.' }, { status: 500 });
        }
      },
    },
  },
});
