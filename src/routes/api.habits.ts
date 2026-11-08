import { authorizeData } from '../lib/session.js';
import { createFileRoute } from '@tanstack/react-router';
import { extractTokenFromRequest } from '../lib/auth.js';
import { createHabit, getHabits, toggleHabitLog, updateHabit } from '../lib/server-db.js';
import { normalizeFrequency } from '../lib/chain.js';

export const Route = createFileRoute('/api/habits')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const token = extractTokenFromRequest(request);
        if (!token) return Response.json({ error: 'Não autorizado.' }, { status: 401 });
        const auth = await authorizeData(token);
        if ('response' in auth) return auth.response;
        const payload = auth.payload;

        const data = await getHabits(payload.userId);
        return Response.json(data);
      },

      POST: async ({ request }) => {
        const token = extractTokenFromRequest(request);
        if (!token) return Response.json({ error: 'Não autorizado.' }, { status: 401 });
        const auth = await authorizeData(token);
        if ('response' in auth) return auth.response;
        const payload = auth.payload;

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

        // 2. Editar hábito (nome, frequência, notas)
        if (body.action === 'update_habit') {
          const habit = await updateHabit(payload.userId, Number(body.habitId), {
            ...(typeof body.name === 'string' && body.name.trim() ? { name: body.name.trim().slice(0, 120) } : {}),
            ...(body.targetFrequency !== undefined ? { targetFrequency: normalizeFrequency(body.targetFrequency) } : {}),
            ...(typeof body.notes === 'string' ? { notes: body.notes.slice(0, 500) } : {}),
          });
          return habit ? Response.json({ habit }) : Response.json({ error: 'Hábito não encontrado.' }, { status: 404 });
        }

        // 3. Create Habit
        if (!body.name) {
          return Response.json({ error: 'Nome do hábito é obrigatório.' }, { status: 400 });
        }

        const habit = await createHabit(payload.userId, { ...body, targetFrequency: normalizeFrequency(body.targetFrequency) });
        return Response.json({ habit }, { status: 201 });
      },
    },
  },
});
