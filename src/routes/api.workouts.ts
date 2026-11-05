import { createFileRoute } from '@tanstack/react-router';
import { extractTokenFromRequest } from '../lib/auth.js';
import { authorizeData } from '../lib/session.js';
import { createWorkout, deleteWorkout, getWorkout, listWorkouts, recentWorkoutCount } from '../lib/workouts-db.js';
import { decodePolyline, encodePolyline, simplifyTo, validateWorkout } from '../lib/workout.js';

// GET  /api/workouts            → lista (rota reduzida, para os cartões)
// GET  /api/workouts?id=12      → treino completo (rota inteira e parciais)
// POST /api/workouts { action: 'create', workout }   → salva
// POST /api/workouts { action: 'delete', id }        → apaga
export const Route = createFileRoute('/api/workouts')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await authorizeData(extractTokenFromRequest(request));
        if ('response' in auth) return auth.response;
        const userId = auth.payload.userId;
        const id = Number(new URL(request.url).searchParams.get('id'));
        if (id) {
          const w = await getWorkout(userId, id);
          return w ? Response.json({ workout: w }) : Response.json({ error: 'Treino não encontrado.' }, { status: 404 });
        }
        const list = await listWorkouts(userId);
        return Response.json({
          workouts: list.map((w) => ({ ...w, route: w.route ? encodePolyline(simplifyTo(decodePolyline(w.route), 120)) : '', splits: [] })),
        });
      },

      POST: async ({ request }) => {
        const auth = await authorizeData(extractTokenFromRequest(request));
        if ('response' in auth) return auth.response;
        const userId = auth.payload.userId;
        const body = await request.json().catch(() => ({}));

        if (body.action === 'delete') {
          const ok = await deleteWorkout(userId, Number(body.id));
          return ok ? Response.json({ success: true, message: 'Treino apagado.' }) : Response.json({ error: 'Treino não encontrado.' }, { status: 404 });
        }

        if (body.action === 'create') {
          if ((await recentWorkoutCount(userId)) >= 20) return Response.json({ error: 'Muitos treinos salvos seguidos. Tente de novo daqui a pouco.' }, { status: 429 });
          const v = validateWorkout(body.workout);
          if (!v.ok) return Response.json({ error: v.error }, { status: 400 });
          const w = await createWorkout(userId, v.value);
          return Response.json({ success: true, workout: w, message: 'Treino salvo!' });
        }

        return Response.json({ error: 'Ação não reconhecida.' }, { status: 400 });
      },
    },
  },
});
