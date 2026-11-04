import { verifyActiveToken } from '../lib/session.js';
import { createFileRoute } from '@tanstack/react-router';
import { extractTokenFromRequest } from '../lib/auth.js';
import {
  findUserById,
  getAffiliateData,
  requestAffiliateWithdrawal,
  updateUserPixKey,
} from '../lib/server-db.js';
import { calculateAffiliateCommission } from '../lib/affiliate-engine.js';
import { MAX_COMMISSION_LEVELS, levelPercent } from '../lib/commission-plan.js';
import { payoutCycle, payoutDatesText, shortDateBR } from '../lib/payout-schedule.js';

export const Route = createFileRoute('/api/affiliates')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const token = extractTokenFromRequest(request);
        if (!token) return Response.json({ error: 'Não autorizado.' }, { status: 401 });
        const payload = await verifyActiveToken(token);
        if (!payload) return Response.json({ error: 'Sessão expirada.' }, { status: 401 });

        const user = await findUserById(payload.userId);
        if (!user) return Response.json({ error: 'Usuário não encontrado.' }, { status: 404 });

        const data = await getAffiliateData(user.id, user.referralCode);
        return Response.json({
          ...data,
          pixKey: user.pixKey || '',
          pixKeyType: user.pixKeyType || 'cpf',
        });
      },

      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { action } = body;

          // 1. REQUEST WITHDRAWAL VIA PIX
          if (action === 'request_withdrawal') {
            const token = extractTokenFromRequest(request);
            if (!token) return Response.json({ error: 'Não autorizado.' }, { status: 401 });
            const payload = await verifyActiveToken(token);
            if (!payload) return Response.json({ error: 'Sessão expirada.' }, { status: 401 });

            const amountCents = Math.round(Number(body.amountCents));
            if (!amountCents) {
              return Response.json({ error: 'Informe o valor do saque.' }, { status: 400 });
            }

            const res = await requestAffiliateWithdrawal(payload.userId, amountCents);
            if (!res.success) {
              return Response.json({ error: res.error }, { status: 400 });
            }

            // Ciclo: pedidos até quarta 23:59 (Brasília) são pagos na quinta e na sexta da mesma semana.
            const cycle = payoutCycle(new Date());
            return Response.json({
              success: true,
              message: `Solicitação enviada! Ela entra no ciclo de pagamento de ${payoutDatesText(cycle)}. O pagamento é liberado manualmente nesses dias.`,
              cycle: { deadline: cycle.deadline.toISOString(), thursday: cycle.thursday, friday: cycle.friday, label: shortDateBR(cycle.thursday) },
              withdrawal: res.withdrawal,
            });
          }

          // 2. UPDATE PIX KEY
          if (action === 'update_pix') {
            const token = extractTokenFromRequest(request);
            if (!token) return Response.json({ error: 'Não autorizado.' }, { status: 401 });
            const payload = await verifyActiveToken(token);
            if (!payload) return Response.json({ error: 'Sessão expirada.' }, { status: 401 });

            const { pixKey, pixKeyType } = body;
            if (!pixKey) {
              return Response.json({ error: 'Informe sua chave PIX.' }, { status: 400 });
            }

            try {
              const user = await updateUserPixKey(payload.userId, pixKey, pixKeyType || 'cpf');
              return Response.json({ success: true, message: 'Chave Pix salva! É para ela que o seu pagamento será enviado.', user });
            } catch (e: any) {
              return Response.json({ error: e.message || 'Chave Pix inválida.' }, { status: 400 });
            }
          }

          // 3. Billing Webhook Processor (simulação: calcula a comissão do nível informado, não grava nada)
          if (action === 'process_billing_webhook') {
            const { eventId, eventType, orderReference, customerUserId, grossAmountCents, netAmountCents, affiliateUserId } = body;

            if (!orderReference || !customerUserId || !affiliateUserId) {
              return Response.json({ error: 'Dados incompletos do evento de cobrança.' }, { status: 400 });
            }

            const calc = calculateAffiliateCommission({
              affiliateUserId: Number(affiliateUserId),
              referredUserId: Number(customerUserId),
              netAmountCents: Number(netAmountCents || grossAmountCents || 0),
              commissionRatePercent: levelPercent(Math.min(Math.max(Number(body.level) || 1, 1), MAX_COMMISSION_LEVELS)),
            });

            return Response.json({
              success: true,
              result: {
                eventId,
                eventType,
                orderReference,
                ...calc,
              },
            });
          }

          return Response.json({ error: 'Ação não suportada.' }, { status: 400 });
        } catch (e: any) {
          return Response.json({ error: e.message || 'Erro ao processar.' }, { status: 500 });
        }
      },
    },
  },
});
