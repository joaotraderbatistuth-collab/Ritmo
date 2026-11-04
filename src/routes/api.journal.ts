import { authorizeData } from '../lib/session.js';
import { createFileRoute } from '@tanstack/react-router';
import { extractTokenFromRequest } from '../lib/auth.js';
import { getJournalEntries, upsertJournalEntry } from '../lib/server-db.js';

export const Route = createFileRoute('/api/journal')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const token = extractTokenFromRequest(request);
        if (!token) return Response.json({ error: 'Não autorizado.' }, { status: 401 });
        const auth = await authorizeData(token);
        if ('response' in auth) return auth.response;
        const payload = auth.payload;

        const entries = await getJournalEntries(payload.userId);
        return Response.json({ entries });
      },

      POST: async ({ request }) => {
        const token = extractTokenFromRequest(request);
        if (!token) return Response.json({ error: 'Não autorizado.' }, { status: 401 });
        const auth = await authorizeData(token);
        if ('response' in auth) return auth.response;
        const payload = auth.payload;

        const body = await request.json();
        const entry = await upsertJournalEntry(payload.userId, body);
        return Response.json({ entry });
      },
    },
  },
});
