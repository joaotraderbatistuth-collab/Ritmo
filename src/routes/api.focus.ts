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
        const session = await createFocusSession(payload.userId, body);
        return Response.json({ session }, { status: 201 });
      },
    },
  },
});
