import { createFileRoute } from '@tanstack/react-router';
import { extractTokenFromRequest, verifyToken } from '../lib/auth.js';
import { cleanError } from '../lib/error-rules.js';
import { listErrors, recordError, resolveError } from '../lib/error-log.js';
import { requireAdminPermission } from '../lib/admin-auth.js';

// POST /api/erros               → o app manda um erro que aconteceu no navegador (sem login também)
// GET  /api/erros?todos=1       → lista para o painel admin (permissão "Erros do sistema")
// POST /api/erros { action: 'resolve', id } → marca como resolvido (admin)
const perIp = new Map<string, { n: number; at: number }>();

export const Route = createFileRoute('/api/erros')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await requireAdminPermission(request, 'errors');
        if ('error' in auth) return auth.error;
        const all = new URL(request.url).searchParams.get('todos') === '1';
        return Response.json({ errors: await listErrors(all) }, { headers: { 'Cache-Control': 'no-store' } });
      },

      POST: async ({ request }) => {
        const text = await request.text().catch(() => '');
        if (text.length > 12_000) return new Response(null, { status: 413 });
        let body: any = {};
        try {
          body = JSON.parse(text || '{}');
        } catch {
          return new Response(null, { status: 400 });
        }

        if (body.action === 'resolve') {
          const auth = await requireAdminPermission(request, 'errors');
          if ('error' in auth) return auth.error;
          return Response.json({ success: await resolveError(Number(body.id)) });
        }

        // limite: 30 erros por minuto por endereço
        const ip = request.headers.get('x-nf-client-connection-ip') || request.headers.get('x-forwarded-for')?.split(',')[0] || 'local';
        const now = Date.now();
        const slot = perIp.get(ip);
        if (slot && now - slot.at < 60_000) {
          if (++slot.n > 30) return new Response(null, { status: 429 });
        } else perIp.set(ip, { n: 1, at: now });
        if (perIp.size > 5000) perIp.clear();

        const clean = cleanError({ ...body, userAgent: request.headers.get('user-agent') || '' }, 'navegador');
        if (clean) {
          const token = extractTokenFromRequest(request);
          const payload = token ? await verifyToken(token).catch(() => null) : null;
          await recordError(clean, payload?.userId ?? null);
        }
        return new Response(null, { status: 204 });
      },
    },
  },
});
