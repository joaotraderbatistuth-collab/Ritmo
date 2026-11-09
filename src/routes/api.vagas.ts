import { createFileRoute } from '@tanstack/react-router';
import { requireAdminPermission } from '../lib/admin-auth.js';
import { isMasterAdmin } from '../lib/admin-permissions.js';
import { logAdminAction } from '../lib/server-db.js';
import { SIGNUP_CLOSED_MESSAGE, SIGNUP_CLOSED_TITLE } from '../lib/signup-limit.js';
import { joinWaitlist, listWaitlist, removeWaitlist, setMaxAccounts, setWaitlistNotified, signupStatus } from '../lib/waitlist-db.js';

// GET  /api/vagas                    → público: cadastros abertos? (não revela números)
// GET  /api/vagas?admin=1            → painel (Ver usuários): limite, contas usadas e lista de espera
// POST /api/vagas { action: 'join', name, email, source }  → público: entra na lista de espera
// POST /api/vagas { action: 'set_limit', limit }           → só o master (0 = sem limite)
// POST /api/vagas { action: 'notified' | 'remove', id }    → painel (Gerir usuários)
const perIp = new Map<string, { n: number; at: number }>();

export const Route = createFileRoute('/api/vagas')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get('admin') === '1') {
          const auth = await requireAdminPermission(request, 'users_view');
          if ('error' in auth) return auth.error;
          const [status, list] = await Promise.all([signupStatus(), listWaitlist()]);
          return Response.json(
            { ...status, waitlist: list, isMaster: isMasterAdmin(auth.user, process.env.MASTER_ADMIN_EMAIL) },
            { headers: { 'Cache-Control': 'no-store' } }
          );
        }
        const status = await signupStatus();
        return Response.json(
          { open: status.open, title: SIGNUP_CLOSED_TITLE, message: SIGNUP_CLOSED_MESSAGE },
          { headers: { 'Cache-Control': 'no-store' } }
        );
      },

      POST: async ({ request }) => {
        const body: any = await request.json().catch(() => ({}));

        if (body.action === 'join') {
          // limite: 10 inscrições por minuto por endereço
          const ip = request.headers.get('x-nf-client-connection-ip') || request.headers.get('x-forwarded-for')?.split(',')[0] || 'local';
          const now = Date.now();
          const slot = perIp.get(ip);
          if (slot && now - slot.at < 60_000) {
            if (++slot.n > 10) return Response.json({ error: 'Muitas tentativas. Aguarde um minuto.' }, { status: 429 });
          } else perIp.set(ip, { n: 1, at: now });
          if (perIp.size > 5000) perIp.clear();
          const r = await joinWaitlist(body).catch(() => ({ ok: false as const, error: 'Não foi possível entrar na lista agora.', status: 500 }));
          if (!r.ok) return Response.json({ error: r.error }, { status: r.status });
          return Response.json({ success: true, message: 'Pronto! Você está na lista de espera. Avisaremos por e-mail quando abrirmos novas vagas.' });
        }

        if (body.action === 'set_limit') {
          const auth = await requireAdminPermission(request, 'users_manage');
          if ('error' in auth) return auth.error;
          if (!isMasterAdmin(auth.user, process.env.MASTER_ADMIN_EMAIL)) {
            return Response.json({ error: 'Só o administrador master muda o limite de contas.' }, { status: 403 });
          }
          const limit = await setMaxAccounts(Number(body.limit)).catch(() => null);
          if (limit === null) return Response.json({ error: 'Não foi possível salvar agora.' }, { status: 503 });
          await logAdminAction(auth.user, 'set_max_accounts', { type: 'settings', id: 'max_accounts' }, { limit }).catch(() => null);
          return Response.json({ success: true, limit });
        }

        if (body.action === 'notified' || body.action === 'remove') {
          const auth = await requireAdminPermission(request, 'users_manage');
          if ('error' in auth) return auth.error;
          const id = Number(body.id);
          if (!Number.isInteger(id) || id <= 0) return Response.json({ error: 'Registro inválido.' }, { status: 400 });
          if (body.action === 'remove') {
            await removeWaitlist(id);
            await logAdminAction(auth.user, 'waitlist_remove', { type: 'waitlist', id }).catch(() => null);
          } else {
            await setWaitlistNotified(id, Boolean(body.value));
          }
          return Response.json({ success: true });
        }

        return Response.json({ error: 'Ação inválida.' }, { status: 400 });
      },
    },
  },
});
