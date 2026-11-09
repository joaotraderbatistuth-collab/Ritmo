import { createFileRoute } from '@tanstack/react-router';
import { cronToken, sendDueNudges } from '../lib/push-server.js';
import { refreshSeasonPoints } from '../lib/game-server.js';
import { refreshWakePlan } from '../lib/wake-plan-server.js';
import { isSeasonHour } from '../lib/wake-plan.js';

// Chamado pela função agendada da Netlify (netlify/functions/notificacoes.mts), só nas horas com trabalho
// (ver src/lib/wake-plan.ts). Envia, para quem ligou as notificações, no máximo 1 lembrete por horário escolhido.
// Pontos da temporada: só 2 vezes por dia (9h e 21h de Brasília). No fim, refaz a agenda de acordar.
export const Route = createFileRoute('/api/cron/notificacoes')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const token = cronToken();
        const auth = request.headers.get('authorization') || '';
        if (!token || auth !== `Bearer ${token}`) return Response.json({ error: 'Não autorizado.' }, { status: 401 });
        try {
          const nudges = await sendDueNudges();
          // 2 vezes por dia: mantém o ranking da temporada em dia (quem não abriu o app há horas)
          const season = isSeasonHour()
            ? await refreshSeasonPoints().catch((e) => {
                console.error('[temporada]', e);
                return { refreshed: 0 };
              })
            : { skipped: true };
          const plan = await refreshWakePlan().catch(() => null);
          return Response.json({ ...nudges, season, planHours: plan?.nudgeUtcHours ?? null });
        } catch (e: any) {
          console.error('[notificacoes]', e);
          return Response.json({ error: 'Falha ao enviar.' }, { status: 500 });
        }
      },
    },
  },
});
