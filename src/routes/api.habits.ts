import { createFileRoute } from '@tanstack/react-router';
import { extractTokenFromRequest, verifyToken } from '../lib/auth.js';
import { createHabit, getHabits, toggleHabitLog } from '../lib/server-db.js';

export const Route = createFileRoute('/api/habits')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const token = extractTokenFromRequest(request);
        if (!token) return Response.json({ error: 'Não autorizado.' }, { status: 401 });
        const payload = await verifyToken(token);
        if (!payload) return Response.json({ error: 'Sessão expirada.' }, { status: 401 });

        const data = await getHabits(payload.userId);
        return Response.json(data);
      },

      POST: async ({ request }) => {
        const token = extractTokenFromRequest(request);
        if (!token) return Response.json({ error: 'Não autorizado.' }, { status: 401 });
        const payload = await verifyToken(token);
        if (!payload) return Response.json({ error: 'Sessão expirada.' }, { status: 401 });

        const body = await request.json();

        // 1. Toggle Log
        if (body.action === 'toggle_log') {
          const { habitId, date, completed } = body;
          if (!habitId || !date) {
            return Response.json({ error: 'habitId e date são obrigatórios.' }, { status: 400 });
          }
          const log = await toggleHabitLog(payload.userId, Number(habitId), date, Boolean(completed));
          return Response.json({ log });
        }

        // 2. Create Habit
        if (!body.name) {
          return Response.json({ error: 'Nome do hábito é obrigatório.' }, { status: 400 });
        }

        const habit = await createHabit(payload.userId, body);
        return Response.json({ habit }, { status: 201 });
      },
    },
  },
});
