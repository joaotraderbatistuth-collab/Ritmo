import { createFileRoute } from '@tanstack/react-router';
import { requireMember, communityError } from '../lib/community-auth.js';
import {
  CommunityError, createTeam, createTeamPayment, getOwnTeamPayment, getTeamPreview, joinTeamFree,
  listMyTeams, listTeamMembers, removeTeamMember, updateTeam,
} from '../lib/community-db.js';
import { checkRealPaymentStatus, confirmCheckoutPayment } from '../lib/server-db.js';
import { isMercadoPagoConfigured } from '../lib/mercadopago.js';

const publicPayment = (p: any) => ({
  orderReference: p.orderReference,
  amountCents: p.amountCents,
  status: p.status,
  pixCopiaECola: p.pixCopiaECola,
  pixQrCode: p.pixQrCode,
  isSimulated: Boolean(p.isSimulated),
});

export const Route = createFileRoute('/api/teams')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const user = await requireMember(request);
          const q = new URL(request.url).searchParams;
          if (q.get('code')) return Response.json({ team: await getTeamPreview(String(q.get('code')), user.id) });
          if (q.get('members')) return Response.json({ members: await listTeamMembers(user.id, Number(q.get('members'))) });
          return Response.json(await listMyTeams(user.id));
        } catch (e) {
          return communityError(e);
        }
      },

      POST: async ({ request }) => {
        try {
          const user = await requireMember(request);
          const body = await request.json();
          switch (body.action) {
            case 'create_team': {
              const team = await createTeam(user.id, body);
              return Response.json({ success: true, message: 'Equipe criada! Copie o link e compartilhe com seus alunos.', team });
            }
            case 'update_team': {
              const team = await updateTeam(user.id, Number(body.teamId), body);
              return Response.json({ success: true, message: 'Equipe atualizada. O novo preço vale para as próximas vendas.', team });
            }
            case 'join_free': {
              const r = await joinTeamFree(user.id, String(body.code));
              return Response.json({ success: true, message: r.alreadyMember ? 'Você já está nesta equipe.' : 'Bem-vindo à equipe!' });
            }
            case 'buy': {
              const { payment } = await createTeamPayment(user.id, String(body.code));
              return Response.json({ success: true, payment: publicPayment(payment) });
            }
            case 'check_payment': {
              const p = await getOwnTeamPayment(user.id, String(body.orderReference));
              if (p.status === 'paid') return Response.json({ success: true, paid: true });
              if (p.isSimulated) return Response.json({ success: true, paid: false, simulated: true });
              const r: any = await checkRealPaymentStatus(p.orderReference);
              return Response.json({ success: true, paid: Boolean(r.success) });
            }
            case 'confirm_demo': {
              // Só no modo de demonstração (Mercado Pago não configurado) e só para o dono do pedido.
              const p = await getOwnTeamPayment(user.id, String(body.orderReference));
              if (!p.isSimulated || isMercadoPagoConfigured()) throw new CommunityError(403, 'Confirmação de demonstração indisponível.');
              await confirmCheckoutPayment(p.orderReference);
              return Response.json({ success: true, paid: true });
            }
            case 'remove_member':
              await removeTeamMember(user.id, Number(body.teamId), Number(body.userId));
              return Response.json({ success: true, message: 'Membro removido.' });
            default:
              throw new CommunityError(400, 'Ação não reconhecida.');
          }
        } catch (e) {
          return communityError(e);
        }
      },
    },
  },
});
