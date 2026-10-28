import { createFileRoute } from '@tanstack/react-router';
import { extractTokenFromRequest, verifyToken } from '../lib/auth.js';
import {
  getUserSubscriptionAndInvoices,
  validateCoupon,
  createCheckoutPayment,
  confirmCheckoutPayment,
  checkRealPaymentStatus,
  cancelUserSubscription,
} from '../lib/server-db.js';
import { isMercadoPagoConfigured } from '../lib/mercadopago.js';

export const Route = createFileRoute('/api/checkout')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const action = url.searchParams.get('action');

        // Coupon validation query (pública, não expõe dados de usuário)
        if (action === 'validate_coupon') {
          const code = url.searchParams.get('code') || '';
          const res = await validateCoupon(code);
          return Response.json(res);
        }

        // Dados de assinatura do usuário atual
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
            mercadoPagoEnabled: isMercadoPagoConfigured(),
          });
        }

        const payload = await verifyToken(token);
        if (!payload) return Response.json({ error: 'Sessão inválida' }, { status: 401 });

        const subInfo = await getUserSubscriptionAndInvoices(payload.userId);
        if (!subInfo) return Response.json({ error: 'Usuário não encontrado' }, { status: 404 });

        return Response.json({ ...subInfo, mercadoPagoEnabled: isMercadoPagoConfigured() });
      },

      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { action } = body;

          // Toda ação de checkout exige usuário autenticado — nunca aceitar
          // um userId vindo do corpo da requisição.
          const token = extractTokenFromRequest(request);
          if (!token) return Response.json({ error: 'Faça login para continuar.' }, { status: 401 });
          const payload = await verifyToken(token);
          if (!payload) return Response.json({ error: 'Sessão expirada. Faça login novamente.' }, { status: 401 });
          const userId = payload.userId;

          // 1. CRIAR PEDIDO (Pix real via Mercado Pago, Checkout Pro, ou simulado)
          if (action === 'create_order') {
            const { paymentMethod, couponCode } = body;
            const payment = await createCheckoutPayment(userId, paymentMethod || 'pix', couponCode || undefined);
            return Response.json({ success: true, order: payment });
          }

          // 2. CONFIRMAR PAGAMENTO — só permitido para pedidos SIMULADOS do
          // próprio usuário (modo de demonstração, sem Mercado Pago configurado).
          // Pedidos reais só são confirmados pelo webhook do Mercado Pago ou
          // pela checagem de status abaixo, nunca por este endpoint direto.
          if (action === 'confirm_payment') {
            const { orderReference } = body;
            if (!orderReference) {
              return Response.json({ error: 'Referência do pedido é obrigatória.' }, { status: 400 });
            }

            const subInfo = await getUserSubscriptionAndInvoices(userId);
            const order = subInfo?.invoices.find((inv: any) => inv.orderReference === orderReference);
            if (!order || order.userId !== userId) {
              return Response.json({ error: 'Pedido não encontrado para este usuário.' }, { status: 404 });
            }
            if (!order.isSimulated) {
              return Response.json(
                { error: 'Este pedido usa pagamento real — use "Verificar pagamento" ou aguarde a confirmação automática.' },
                { status: 400 }
              );
            }

            const result = await confirmCheckoutPayment(orderReference);
            return Response.json(result);
          }

          // 3. VERIFICAR STATUS REAL (consulta direta à API do Mercado Pago)
          if (action === 'check_payment_status') {
            const { orderReference } = body;
            if (!orderReference) {
              return Response.json({ error: 'Referência do pedido é obrigatória.' }, { status: 400 });
            }

            const subInfo = await getUserSubscriptionAndInvoices(userId);
            const order = subInfo?.invoices.find((inv: any) => inv.orderReference === orderReference);
            if (!order || order.userId !== userId) {
              return Response.json({ error: 'Pedido não encontrado para este usuário.' }, { status: 404 });
            }

            const result = await checkRealPaymentStatus(orderReference);
            return Response.json(result);
          }

          // 4. CANCELAR ASSINATURA (acesso segue até o fim do período pago)
          if (action === 'cancel_subscription') {
            const result = await cancelUserSubscription(userId);
            return Response.json(result, { status: result.success ? 200 : 400 });
          }

          return Response.json({ error: 'Ação não suportada.' }, { status: 400 });
        } catch (e: any) {
          return Response.json({ error: e.message || 'Erro no servidor.' }, { status: 500 });
        }
      },
    },
  },
});
