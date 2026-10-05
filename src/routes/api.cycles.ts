import { createFileRoute } from '@tanstack/react-router';
import { extractTokenFromRequest, verifyToken } from '../lib/auth.js';
import { createFocusCycle, getActiveFocusCycle, getAllFocusCycles } from '../lib/server-db.js';

export const Route = createFileRoute('/api/cycles')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const token = extractTokenFromRequest(request);
        if (!token) return Response.json({ error: 'Não autorizado.' }, { status: 401 });
        const payload = await verifyToken(token);
        if (!payload) return Response.json({ error: 'Sessão expirada.' }, { status: 401 });

        const active = await getActiveFocusCycle(payload.userId);
        const all = await getAllFocusCycles(payload.userId);
        return Response.json({ active, cycles: all });
      },

      POST: async ({ request }) => {
        const token = extractTokenFromRequest(request);
        if (!token) return Response.json({ error: 'Não autorizado.' }, { status: 401 });
        const payload = await verifyToken(token);
        if (!payload) return Response.json({ error: 'Sessão expirada.' }, { status: 401 });

        const body = await request.json();
        const { title, mainGoal, secondaryGoals, durationDays, startDate, routineLevel, preferredTimes, digitalLimits, notes } = body;

        if (!mainGoal || !durationDays || !startDate) {
          return Response.json({ error: 'Meta principal, duração e data de início são obrigatórios.' }, { status: 400 });
        }

        // Calculate end date
        const start = new Date(startDate);
        const end = new Date(start);
        end.setDate(end.getDate() + Number(durationDays));
        const endDate = end.toISOString().split('T')[0];

        const newCycle = await createFocusCycle(payload.userId, {
          title: title || `Ciclo de ${durationDays} Dias — Foco Total`,
          mainGoal,
          secondaryGoals: Array.isArray(secondaryGoals) ? secondaryGoals : [],
          durationDays: Number(durationDays) as any,
          startDate,
          endDate,
          routineLevel: routineLevel || 'equilibrado',
          preferredTimes: preferredTimes || '',
          digitalLimits: digitalLimits || '',
          status: 'active',
          notes: notes || '',
        });

        return Response.json({ cycle: newCycle }, { status: 201 });
      },
    },
  },
});
