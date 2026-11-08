import { createFileRoute } from '@tanstack/react-router';
import { requireMember, communityError } from '../lib/community-auth.js';
import { CommunityError } from '../lib/community-db.js';
import { getVapidKeys, removeSubscription, saveSubscription, sendTest, setPerDay, setPushHours, setPushOptOut, subscriptionStatus } from '../lib/push-server.js';

// GET  → chave pública + quantos aparelhos a pessoa tem inscritos
// POST { action: 'subscribe' | 'unsubscribe' | 'per_day' | 'test' }
export const Route = createFileRoute('/api/push')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const user = await requireMember(request);
          const keys = await getVapidKeys();
          if (!keys) throw new CommunityError(503, 'Notificações precisam do banco de dados configurado.');
          return Response.json({ publicKey: keys.publicKey, optOut: Boolean((user as any).pushOptOut), ...(await subscriptionStatus(user.id)) });
        } catch (e) {
          return communityError(e);
        }
      },
      POST: async ({ request }) => {
        try {
          const user = await requireMember(request);
          const body = await request.json().catch(() => ({}));
          switch (body.action) {
            case 'subscribe':
              await saveSubscription(user.id, body.subscription, Number(body.perDay) || 3, Array.isArray(body.hours) ? body.hours : undefined);
              if ((user as any).pushOptOut) await setPushOptOut(user.id, false);
              // ativação automática (permissão já dada antes) não manda a notificação de boas-vindas
              if (!body.auto) await sendTest(user.id, user.name).catch(() => 0);
              return Response.json({ success: true, message: 'Notificações ligadas! Você vai receber lembretes aos poucos ao longo do dia.' });
            case 'unsubscribe':
              await removeSubscription(user.id, String(body.endpoint || ''));
              await setPushOptOut(user.id, true);
              return Response.json({ success: true, message: 'Notificações desligadas neste aparelho.' });
            case 'hours': {
              const hours = await setPushHours(user.id, body.hours);
              return Response.json({ success: true, hours, message: 'Horários salvos.' });
            }
            case 'per_day':
              await setPerDay(user.id, Number(body.perDay));
              return Response.json({ success: true, message: 'Preferência salva.' });
            case 'test': {
              const n = await sendTest(user.id, user.name);
              return Response.json({ success: n > 0, message: n > 0 ? 'Notificação de teste enviada.' : 'Nenhum aparelho inscrito. Ligue as notificações primeiro.' });
            }
            default:
              throw new CommunityError(400, 'Ação não reconhecida.');
          }
        } catch (e: any) {
          if (e instanceof CommunityError) return communityError(e);
          if (e?.message?.includes('inválida')) return Response.json({ error: e.message }, { status: 400 });
          return communityError(e);
        }
      },
    },
  },
});
