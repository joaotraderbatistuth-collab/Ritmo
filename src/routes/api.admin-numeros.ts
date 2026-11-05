import { createFileRoute } from '@tanstack/react-router';
import { requireAdminPermission } from '../lib/admin-auth.js';
import { loadMetrics } from '../lib/metrics-db.js';
import { reportServerError } from '../lib/error-log.js';

// GET /api/admin-numeros → painel de números (conversão, cancelamentos, retenção, origem, uso).
export const Route = createFileRoute('/api/admin-numeros')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await requireAdminPermission(request, 'overview');
        if ('error' in auth) return auth.error;
        try {
          const m = await loadMetrics();
          if (!m) return Response.json({ error: 'Banco de dados indisponível no momento.' }, { status: 503 });
          // valores em dinheiro só para quem pode ver finanças
          if (!auth.permissions.includes('finance')) {
            m.totals.mrrCents = -1;
            m.totals.revenueMonthCents = -1;
            m.totals.revenueLastMonthCents = -1;
          }
          return Response.json(m, { headers: { 'Cache-Control': 'no-store' } });
        } catch (e) {
          reportServerError(e, 'admin-numeros');
          return Response.json({ error: 'Não foi possível calcular os números agora.' }, { status: 500 });
        }
      },
    },
  },
});
