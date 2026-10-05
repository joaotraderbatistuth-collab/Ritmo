import { createFileRoute } from '@tanstack/react-router';
import { extractTokenFromRequest, verifyToken } from '../lib/auth.js';
import {
  findUserById,
  getUserSubscriptionAndInvoices,
  validateCoupon,
  createCheckoutPayment,
  confirmCheckoutPayment,
} from '../lib/server-db.js';

export const Route = createFileRoute('/api/checkout')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const action = url.searchParams.get('action');

        // Coupon validation query
        if (action === 'validate_coupon') {
          const code = url.searchParams.get('code') || '';
          const res = await validateCoupon(code);
          return Response.json(res);
        }

        // Subscription details for current user
        const token = extractTokenFromRequest(request);
        if (!token) {
          return Response.json({
            subscriptionStatus: 'guest',
            trialDaysRemaining: 7,
            isTrialActive: true,
            isExpired: false,
            plan: 'Ritmo PRO Mensal (R$ 39,90/mês)',
            amountCents: 3990,
            invoices: [],
          });
        }

        const payload = await verifyToken(token);
        if (!payload) return Response.json({ error: 'Sessão inválida' }, { status: 401 });

        const subInfo = await getUserSubscriptionAndInvoices(payload.userId);
        if (!subInfo) return Response.json({ error: 'Usuário não encontrado' }, { status: 404 });

        return Response.json(subInfo);
      },

      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { action } = body;

          // 1. CREATE PAYMENT ORDER (PIX or Credit Card)
          if (action === 'create_order') {
            const token = extractTokenFromRequest(request);
            let userId = 1;

            if (token) {
              const payload = await verifyToken(token);
              if (payload) userId = payload.userId;
            }

            const { paymentMethod, couponCode } = body;
            const payment = await createCheckoutPayment(
              userId,
              paymentMethod || 'pix',
              couponCode || undefined
            );

            return Response.json({
              success: true,
              order: payment,
            });
          }

          // 2. CONFIRM PAYMENT (Simulated or Gateway Webhook)
          if (action === 'confirm_payment') {
            const { orderReference } = body;
            if (!orderReference) {
              return Response.json({ error: 'Referência do pedido é obrigatória.' }, { status: 400 });
            }

            const result = await confirmCheckoutPayment(orderReference);
            return Response.json(result);
          }

          return Response.json({ error: 'Ação não suportada.' }, { status: 400 });
        } catch (e: any) {
          return Response.json({ error: e.message || 'Erro no servidor.' }, { status: 500 });
        }
      },
    },
  },
});
