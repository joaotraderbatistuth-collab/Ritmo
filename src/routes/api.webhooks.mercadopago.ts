import { createFileRoute } from '@tanstack/react-router';
import { fetchMercadoPagoPayment, isValidMercadoPagoSignature, isMercadoPagoConfigured } from '../lib/mercadopago.js';
import { checkRealPaymentStatus } from '../lib/server-db.js';

// ============================================================================
// Webhook de notificações do Mercado Pago.
// Configure esta URL em Mercado Pago > Suas integrações > Webhooks:
//   https://meu-ritmo.netlify.app/api/webhooks/mercadopago
//
// Importante: mesmo que a assinatura (x-signature) não possa ser validada
// (MERCADOPAGO_WEBHOOK_SECRET não configurada), NUNCA confiamos no corpo da
// notificação — sempre buscamos o status real do pagamento direto na API do
// Mercado Pago antes de ativar qualquer assinatura.
// ============================================================================

export const Route = createFileRoute('/api/webhooks/mercadopago')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!isMercadoPagoConfigured()) {
          return Response.json({ error: 'Mercado Pago não configurado neste ambiente.' }, { status: 501 });
        }

        const url = new URL(request.url);
        const dataId = url.searchParams.get('data.id') || url.searchParams.get('id');
        const type = url.searchParams.get('type') || url.searchParams.get('topic');

        // O Mercado Pago espera sempre 200 rapidamente, mesmo em eventos que
        // ignoramos, para não ficar reenviando a notificação indefinidamente.
        if (type && type !== 'payment') {
          return Response.json({ received: true });
        }
        if (!dataId) {
          return Response.json({ received: true, note: 'sem data.id' });
        }

        const signature = request.headers.get('x-signature');
        const requestId = request.headers.get('x-request-id');
        const signatureValid = isValidMercadoPagoSignature(signature, requestId, dataId);
        if (!signatureValid) {
          console.warn('[mercadopago webhook] Assinatura ausente/inválida — prosseguindo com reconfirmação direta na API.');
        }

        const mpPayment = await fetchMercadoPagoPayment(dataId);
        if (!mpPayment.success || !mpPayment.externalReference) {
          return Response.json({ received: true, note: 'pagamento não encontrado ou sem external_reference' });
        }

        if (mpPayment.status === 'approved') {
          await checkRealPaymentStatus(mpPayment.externalReference);
        }

        return Response.json({ received: true });
      },

      // Mercado Pago às vezes testa o endpoint com GET na configuração inicial do webhook.
      GET: async () => Response.json({ ok: true }),
    },
  },
});
