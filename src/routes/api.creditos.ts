import { createFileRoute } from '@tanstack/react-router';
import { requireAdminPermission } from '../lib/admin-auth.js';
import { isMasterAdmin } from '../lib/admin-permissions.js';
import { logAdminAction } from '../lib/server-db.js';
import { creditReport, setAnchor } from '../lib/credits-server.js';

// Aba "Créditos" do painel (só o administrador master).
// GET  /api/creditos[?refresh=1]              → contagem estimada de créditos da Netlify
// POST /api/creditos { action: 'set_anchor', balance } → anota o saldo visto no painel da Netlify
async function master(request: Request) {
  const auth = await requireAdminPermission(request, 'overview');
  if ('error' in auth) return { error: auth.error };
  if (!isMasterAdmin(auth.user, process.env.MASTER_ADMIN_EMAIL)) {
    return { error: Response.json({ error: 'Só o administrador master vê os créditos.' }, { status: 403 }) };
  }
  return { user: auth.user };
}

export const Route = createFileRoute('/api/creditos')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const m = await master(request);
        if ('error' in m) return m.error;
        const refresh = new URL(request.url).searchParams.get('refresh') === '1';
        try {
          return Response.json(await creditReport(refresh), { headers: { 'Cache-Control': 'no-store' } });
        } catch (e) {
          console.error('[creditos]', e);
          return Response.json({ error: 'Não foi possível calcular agora.' }, { status: 500 });
        }
      },
      POST: async ({ request }) => {
        const m = await master(request);
        if ('error' in m) return m.error;
        const body: any = await request.json().catch(() => ({}));
        if (body.action !== 'set_anchor') return Response.json({ error: 'Ação inválida.' }, { status: 400 });
        const balance = Number(String(body.balance ?? '').replace(/\./g, '').replace(',', '.'));
        if (!Number.isFinite(balance) || balance < 0) return Response.json({ error: 'Digite o saldo em créditos (ex.: 820).' }, { status: 400 });
        try {
          const anchor = await setAnchor(balance);
          await logAdminAction(m.user, 'set_credits_anchor', { type: 'settings', id: 'credits_anchor' }, { balance }).catch(() => null);
          return Response.json({ success: true, anchor });
        } catch {
          return Response.json({ error: 'Não foi possível salvar agora.' }, { status: 503 });
        }
      },
    },
  },
});
