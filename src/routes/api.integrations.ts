import { authorizeData } from '../lib/session.js';
import { createFileRoute } from '@tanstack/react-router';
import { extractTokenFromRequest } from '../lib/auth.js';
import { getIntegrationsConfig, updateIntegrationsConfig } from '../lib/server-db.js';

// Preferências de lembretes da pessoa (Configurações).
// O WhatsApp Bot e a sincronização com Planilhas foram retirados do Ritmo: lançar gastos agora é
// pelo secretário por voz, e a exportação em CSV continua na aba Finanças.
//
// GET  /api/integrations                       → preferências
// POST /api/integrations?action=update_config  → salva as preferências de lembretes
export const Route = createFileRoute('/api/integrations')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const token = extractTokenFromRequest(request);
        if (!token) return Response.json({ error: 'Não autorizado.' }, { status: 401 });
        const auth = await authorizeData(token);
        if ('response' in auth) return auth.response;
        const config = await getIntegrationsConfig(auth.payload.userId);
        return Response.json({ config });
      },

      POST: async ({ request }) => {
        const action = new URL(request.url).searchParams.get('action');
        if (action !== 'update_config') return Response.json({ error: 'Recurso indisponível.' }, { status: 410 });
        const token = extractTokenFromRequest(request);
        if (!token) return Response.json({ error: 'Não autorizado.' }, { status: 401 });
        const auth = await authorizeData(token);
        if ('response' in auth) return auth.response;
        const body = await request.json().catch(() => ({}));
        // só as preferências de lembretes podem mudar por aqui
        const updated = await updateIntegrationsConfig(auth.payload.userId, { remindersConfig: body.remindersConfig } as any);
        return Response.json({ config: updated });
      },
    },
  },
});
