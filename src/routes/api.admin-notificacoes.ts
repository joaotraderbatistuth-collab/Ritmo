import { createFileRoute } from '@tanstack/react-router';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { db } from '../../db/index.js';
import * as schema from '../../db/schema.js';
import { requireAdminPermission } from '../lib/admin-auth.js';
import { broadcastWaitMinutes, validateAdminNotification } from '../lib/admin-notify.js';
import { pushStats, sendAdminPush } from '../lib/push-server.js';
import { checkDb, findUserByEmail, logAdminAction } from '../lib/server-db.js';
import { reportServerError } from '../lib/error-log.js';

// GET  /api/admin-notificacoes → quantas pessoas/aparelhos têm notificação ligada + últimos envios
// POST { title, body, tab, target: 'me'|'email'|'all', email?, confirm? } → envia
const ACTIONS = ['send_notification_me', 'send_notification_email', 'send_notification_all'];

export const Route = createFileRoute('/api/admin-notificacoes')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await requireAdminPermission(request, 'notifications');
        if ('error' in auth) return auth.error;
        try {
          if (!(await checkDb())) return Response.json({ error: 'Banco de dados indisponível no momento.' }, { status: 503 });
          const stats = await pushStats();
          const mine = await db.select({ id: schema.pushSubscriptions.id }).from(schema.pushSubscriptions).where(eq(schema.pushSubscriptions.userId, auth.user.id));
          const history = await db
            .select()
            .from(schema.adminAuditLog)
            .where(inArray(schema.adminAuditLog.action, ACTIONS))
            .orderBy(desc(schema.adminAuditLog.id))
            .limit(15);
          return Response.json(
            {
              ...stats,
              myDevices: mine.length,
              history: history.map((h) => {
                let d: any = {};
                try {
                  d = JSON.parse(h.details || '{}');
                } catch {
                  /* ignora */
                }
                return { id: h.id, at: h.createdAt, admin: h.adminEmail, target: h.action.replace('send_notification_', ''), to: d.email || null, title: d.title || '', sent: d.sent ?? 0, people: d.people ?? 0 };
              }),
            },
            { headers: { 'Cache-Control': 'no-store' } }
          );
        } catch (e) {
          reportServerError(e, 'admin-notificacoes:get');
          return Response.json({ error: 'Não foi possível carregar agora.' }, { status: 500 });
        }
      },
      POST: async ({ request }) => {
        const auth = await requireAdminPermission(request, 'notifications');
        if ('error' in auth) return auth.error;
        const v = validateAdminNotification(await request.json().catch(() => ({})));
        if (!v.ok) return Response.json({ error: v.error }, { status: 400 });
        const n = v.value;
        try {
          if (!(await checkDb())) return Response.json({ error: 'Banco de dados indisponível no momento.' }, { status: 503 });
          let ids: number[] | 'all';
          if (n.target === 'me') ids = [auth.user.id];
          else if (n.target === 'email') {
            const u = await findUserByEmail(n.email!);
            if (!u) return Response.json({ error: 'Nenhuma conta com esse e-mail.' }, { status: 404 });
            ids = [u.id];
          } else {
            // trava contra envio repetido para todos
            const [last] = await db
              .select({ at: schema.adminAuditLog.createdAt })
              .from(schema.adminAuditLog)
              .where(and(eq(schema.adminAuditLog.action, 'send_notification_all')))
              .orderBy(desc(schema.adminAuditLog.id))
              .limit(1);
            const wait = broadcastWaitMinutes(last ? new Date(last.at) : null);
            if (wait > 0) return Response.json({ error: `Um envio para todos acabou de ser feito. Aguarde ${wait} min para enviar de novo.` }, { status: 429 });
            ids = 'all';
          }
          const r = await sendAdminPush(ids, { title: n.title, body: n.body, tab: n.tab, tag: `ritmo-admin-${Date.now()}` });
          await logAdminAction(auth.user, `send_notification_${n.target}`, { type: 'push' }, { title: n.title, body: n.body, tab: n.tab, email: n.email, sent: r.sent, people: r.people });
          let message: string;
          if (r.devices === 0) {
            message = n.target === 'me'
              ? 'Você ainda não ligou as notificações neste ou em outro aparelho. Toque em "Ligar" no quadro "Este aparelho" e tente de novo.'
              : n.target === 'email'
                ? 'Essa pessoa não ligou as notificações em nenhum aparelho.'
                : 'Ninguém ligou as notificações ainda.';
          } else {
            message = `Enviada para ${r.sent} de ${r.devices} aparelho(s)${n.target === 'all' ? `, ${r.people} pessoa(s)` : ''}.`;
            if (r.removed) message += ` ${r.removed} aparelho(s) antigo(s) foram removidos.`;
            if (r.removed && !r.sent) message += ' Abra o Ritmo nesse aparelho para inscrever de novo.';
            if (r.failed) message += ` ${r.failed} falharam (${r.firstError}).`;
          }
          return Response.json({ success: r.sent > 0, message, ...r });
        } catch (e) {
          reportServerError(e, 'admin-notificacoes:post');
          return Response.json({ error: 'Não foi possível enviar agora.' }, { status: 500 });
        }
      },
    },
  },
});
