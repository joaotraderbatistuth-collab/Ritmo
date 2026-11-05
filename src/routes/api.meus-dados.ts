import { createFileRoute } from '@tanstack/react-router';
import { extractTokenFromRequest } from '../lib/auth.js';
import { verifyActiveToken } from '../lib/session.js';
import { exportUserData } from '../lib/data-export.js';

// GET /api/meus-dados → baixa um JSON com todos os dados da conta (LGPD). Vale mesmo com o acesso vencido.
export const Route = createFileRoute('/api/meus-dados')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const token = extractTokenFromRequest(request);
        const payload = token ? await verifyActiveToken(token) : null;
        if (!payload) return Response.json({ error: 'Faça login para continuar.' }, { status: 401 });
        const data = await exportUserData(payload.userId);
        if (!data) return Response.json({ error: 'Conta não encontrada.' }, { status: 404 });
        const day = new Date().toISOString().slice(0, 10);
        return new Response(JSON.stringify(data, null, 2), {
          status: 200,
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
            'Content-Disposition': `attachment; filename="ritmo-meus-dados-${day}.json"`,
            'Cache-Control': 'no-store',
          },
        });
      },
    },
  },
});
