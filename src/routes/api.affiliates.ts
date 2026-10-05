import { createFileRoute } from '@tanstack/react-router';
import { extractTokenFromRequest, verifyToken } from '../lib/auth.js';
import {
  findUserById,
  getAffiliateData,
  requestAffiliateWithdrawal,
  updateUserPixKey,
} from '../lib/server-db.js';
import { calculateAffiliateCommission } from '../lib/affiliate-engine.js';

export const Route = createFileRoute('/api/affiliates')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const token = extractTokenFromRequest(request);
        if (!token) return Response.json({ error: 'Não autorizado.' }, { status: 401 });
        const payload = await verifyToken(token);
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
            const payload = await verifyToken(token);
            if (!payload) return Response.json({ error: 'Sessão expirada.' }, { status: 401 });

            const { amountCents, pixKey, pixKeyType } = body;
            if (!amountCents || !pixKey) {
              return Response.json({ error: 'Valor e Chave PIX são obrigatórios.' }, { status: 400 });
            }

            const res = await requestAffiliateWithdrawal(
              payload.userId,
              Number(amountCents),
              pixKey,
              pixKeyType || 'cpf'
            );

            if (!res.success) {
              return Response.json({ error: res.error }, { status: 400 });
            }

            return Response.json({
              success: true,
              message: 'Solicitação de saque PIX enviada com sucesso! O pagamento será processado em até 24h úteis.',
              withdrawal: res.withdrawal,
            });
          }

          // 2. UPDATE PIX KEY
          if (action === 'update_pix') {
            const token = extractTokenFromRequest(request);
            if (!token) return Response.json({ error: 'Não autorizado.' }, { status: 401 });
            const payload = await verifyToken(token);
            if (!payload) return Response.json({ error: 'Sessão expirada.' }, { status: 401 });

            const { pixKey, pixKeyType } = body;
            if (!pixKey) {
              return Response.json({ error: 'Informe sua chave PIX.' }, { status: 400 });
            }

            const user = await updateUserPixKey(payload.userId, pixKey, pixKeyType || 'cpf');
            return Response.json({ success: true, message: 'Chave PIX atualizada com sucesso!', user });
          }

          // 3. Billing Webhook Processor (60% recurring)
          if (action === 'process_billing_webhook') {
            const { eventId, eventType, orderReference, customerUserId, grossAmountCents, netAmountCents, affiliateUserId } = body;

            if (!orderReference || !customerUserId || !affiliateUserId) {
              return Response.json({ error: 'Dados incompletos do evento de cobrança.' }, { status: 400 });
            }

            const calc = calculateAffiliateCommission({
              affiliateUserId: Number(affiliateUserId),
              referredUserId: Number(customerUserId),
              netAmountCents: Number(netAmountCents || grossAmountCents || 0),
              commissionRatePercent: 60,
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
