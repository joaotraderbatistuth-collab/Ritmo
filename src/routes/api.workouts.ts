import { createFileRoute } from '@tanstack/react-router';
import { extractTokenFromRequest } from '../lib/auth.js';
import { authorizeData } from '../lib/session.js';
import { createWorkout, deleteWorkout, getWorkout, listWorkouts, recentWorkoutCount, updateWorkout } from '../lib/workouts-db.js';
import { decodePolyline, encodePolyline, newRecords, personalRecords, simplifyTo, validateWorkout } from '../lib/workout.js';

// GET  /api/workouts            → lista (rota reduzida, para os cartões) + recordes pessoais
// GET  /api/workouts?id=12      → treino completo (rota inteira e parciais)
// POST /api/workouts { action: 'create', workout }   → salva
// POST /api/workouts { action: 'delete', id }        → apaga
// POST /api/workouts { action: 'update', id, title?, notes?, startedAt? } → edita (data e hora livres, sem futuro)
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
          records: personalRecords(list),
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

        if (body.action === 'update') {
          const patch: { title?: string; notes?: string; startedAt?: Date } = {};
          if (typeof body.title === 'string') {
            const t = body.title.replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, 80);
            if (!t) return Response.json({ error: 'Dê um título ao treino.' }, { status: 400 });
            patch.title = t;
          }
          if (typeof body.notes === 'string') patch.notes = body.notes.slice(0, 1000);
          if (body.startedAt !== undefined) {
            const at = new Date(String(body.startedAt));
            if (Number.isNaN(at.getTime()) || at.getTime() > Date.now() + 5 * 60_000 || at.getTime() < Date.now() - 400 * 86400_000) {
              return Response.json({ error: 'Escolha uma data dos últimos 400 dias, sem ser no futuro.' }, { status: 400 });
            }
            patch.startedAt = at;
          }
          const w = await updateWorkout(userId, Number(body.id), patch);
          return w ? Response.json({ success: true, workout: w, message: 'Treino atualizado.' }) : Response.json({ error: 'Treino não encontrado.' }, { status: 404 });
        }

        if (body.action === 'create') {
          if ((await recentWorkoutCount(userId)) >= 20) return Response.json({ error: 'Muitos treinos salvos seguidos. Tente de novo daqui a pouco.' }, { status: 429 });
          const v = validateWorkout(body.workout);
          if (!v.ok) return Response.json({ error: v.error }, { status: 400 });
          const previous = await listWorkouts(userId, 2000);
          const w = await createWorkout(userId, v.value);
          return Response.json({ success: true, workout: w, records: newRecords(previous, w), message: 'Treino salvo!' });
        }

        return Response.json({ error: 'Ação não reconhecida.' }, { status: 400 });
      },
    },
  },
});
