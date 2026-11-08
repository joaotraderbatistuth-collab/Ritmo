import { authorizeData } from '../lib/session.js';
import { createFileRoute } from '@tanstack/react-router';
import { extractTokenFromRequest } from '../lib/auth.js';
import { createFocusCycle, getActiveFocusCycle, getAllFocusCycles, generateRoadmapForCycle } from '../lib/server-db.js';

export const Route = createFileRoute('/api/cycles')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const token = extractTokenFromRequest(request);
        if (!token) return Response.json({ error: 'Não autorizado.' }, { status: 401 });
        const auth = await authorizeData(token);
        if ('response' in auth) return auth.response;
        const payload = auth.payload;

        const active = await getActiveFocusCycle(payload.userId);
        const all = await getAllFocusCycles(payload.userId);
        return Response.json({ active, cycles: all });
      },

      POST: async ({ request }) => {
        const token = extractTokenFromRequest(request);
        if (!token) return Response.json({ error: 'Não autorizado.' }, { status: 401 });
        const auth = await authorizeData(token);
        if ('response' in auth) return auth.response;
        const payload = auth.payload;

        const body = await request.json();
        const { title, mainGoal, secondaryGoals, durationDays, startDate, routineLevel, preferredTimes, digitalLimits, notes } = body;

        if (!mainGoal || !durationDays || !startDate) {
          return Response.json({ error: 'Meta principal, duração e data de início são obrigatórios.' }, { status: 400 });
        }

        // Duração livre (1 a 365 dias) e data de início livre (YYYY-MM-DD)
        const days = Math.max(1, Math.min(365, Math.round(Number(durationDays)) || 0));
        if (!days || !/^\d{4}-\d{2}-\d{2}$/.test(String(startDate))) {
          return Response.json({ error: 'Escolha uma duração entre 1 e 365 dias e uma data de início válida.' }, { status: 400 });
        }
        // fim = início + (duração - 1) dias, contado em datas (sem fuso)
        const endDate = new Date(Date.UTC(Number(startDate.slice(0, 4)), Number(startDate.slice(5, 7)) - 1, Number(startDate.slice(8, 10)) + days - 1)).toISOString().slice(0, 10);

        const newCycle = await createFocusCycle(payload.userId, {
          title: title || `Ciclo de ${days} Dias — Foco Total`,
          mainGoal,
          secondaryGoals: Array.isArray(secondaryGoals) ? secondaryGoals : [],
          durationDays: days,
          startDate,
          endDate,
          routineLevel: routineLevel || 'equilibrado',
          preferredTimes: preferredTimes || '',
          digitalLimits: digitalLimits || '',
          status: 'active',
          notes: notes || '',
        });

        // Todo ciclo novo já nasce com um roteiro de metas sugerido (editável na aba "Roteiro").
        // Se algo falhar aqui, o ciclo continua criado e o usuário pode gerar o roteiro depois.
        try {
          await generateRoadmapForCycle(payload.userId, newCycle.id);
        } catch (e) {
          console.warn('[cycles] Não foi possível gerar o roteiro sugerido:', e);
        }

        return Response.json({ cycle: newCycle }, { status: 201 });
      },
    },
  },
});
