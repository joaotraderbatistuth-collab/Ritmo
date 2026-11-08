import { authorizeData } from '../lib/session.js';
import { createFileRoute } from '@tanstack/react-router';
import { extractTokenFromRequest } from '../lib/auth.js';
import { createFocusSession, getFocusSessions } from '../lib/server-db.js';

export const Route = createFileRoute('/api/focus')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const token = extractTokenFromRequest(request);
        if (!token) return Response.json({ error: 'Não autorizado.' }, { status: 401 });
        const auth = await authorizeData(token);
        if ('response' in auth) return auth.response;
        const payload = auth.payload;

        const sessions = await getFocusSessions(payload.userId);
        return Response.json({ sessions });
      },

      POST: async ({ request }) => {
        const token = extractTokenFromRequest(request);
        if (!token) return Response.json({ error: 'Não autorizado.' }, { status: 401 });
        const auth = await authorizeData(token);
        if ('response' in auth) return auth.response;
        const payload = auth.payload;

        const body = await request.json();
        // data livre (YYYY-MM-DD), mas não no futuro nem antes de 2 anos; minutos de 1 a 600
        const today = new Date(Date.now() + 14 * 3600_000).toISOString().slice(0, 10); // folga para fusos à frente
        const date = typeof body.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.date) && body.date <= today && body.date >= new Date(Date.now() - 730 * 86400_000).toISOString().slice(0, 10) ? body.date : undefined;
        const durationMinutes = Math.max(1, Math.min(600, Math.round(Number(body.durationMinutes) || 25)));
        const session = await createFocusSession(payload.userId, { ...body, date, durationMinutes });
        return Response.json({ session }, { status: 201 });
      },
    },
  },
});
