import { createFileRoute } from '@tanstack/react-router';
import { extractTokenFromRequest, verifyToken } from '../lib/auth.js';
import { createFocusSession, getFocusSessions } from '../lib/server-db.js';

export const Route = createFileRoute('/api/focus')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const token = extractTokenFromRequest(request);
        if (!token) return Response.json({ error: 'Não autorizado.' }, { status: 401 });
        const payload = await verifyToken(token);
        if (!payload) return Response.json({ error: 'Sessão expirada.' }, { status: 401 });

        const sessions = await getFocusSessions(payload.userId);
        return Response.json({ sessions });
      },

      POST: async ({ request }) => {
        const token = extractTokenFromRequest(request);
        if (!token) return Response.json({ error: 'Não autorizado.' }, { status: 401 });
        const payload = await verifyToken(token);
        if (!payload) return Response.json({ error: 'Sessão expirada.' }, { status: 401 });

        const body = await request.json();
        const session = await createFocusSession(payload.userId, body);
        return Response.json({ session }, { status: 201 });
      },
    },
  },
});
