import crypto from 'crypto';

// ============================================================================
// Integração real com o Mercado Pago (Pix + Checkout Pro para cartão).
// Só fica ativa quando MERCADOPAGO_ACCESS_TOKEN está configurada — sem isso,
// todo o módulo retorna isConfigured=false e quem chamar deve usar o fluxo
// simulado existente (createCheckoutPayment em server-db.ts), claramente
// identificado como simulação na interface.
//
// Documentação oficial:
// - Pagamentos Pix: https://www.mercadopago.com.br/developers/pt/docs/checkout-api/payment-methods/pix
// - Checkout Pro (cartão): https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/landing
// - Webhooks: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
// ============================================================================

const MP_API_BASE = 'https://api.mercadopago.com';

export function isMercadoPagoConfigured(): boolean {
  return Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN);
}

function getAccessToken(): string {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) throw new Error('MERCADOPAGO_ACCESS_TOKEN não configurada.');
  return token;
}

interface PixPaymentResult {
  success: boolean;
  mpPaymentId?: string;
  pixCopiaECola?: string;
  pixQrCodeBase64?: string; // já vem pronto como PNG base64 da própria API do MP
  status?: string;
  error?: string;
}

// Cria uma cobrança Pix real. amountCents em centavos (ex.: 3990 = R$ 39,90).
export async function createRealPixPayment(params: {
  orderReference: string;
  amountCents: number;
  description: string;
  payerEmail: string;
}): Promise<PixPaymentResult> {
  try {
    const res = await fetch(`${MP_API_BASE}/v1/payments`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': params.orderReference,
      },
      body: JSON.stringify({
        transaction_amount: Number((params.amountCents / 100).toFixed(2)),
        description: params.description,
        payment_method_id: 'pix',
        external_reference: params.orderReference,
        payer: { email: params.payerEmail },
        notification_url: process.env.MERCADOPAGO_WEBHOOK_URL || undefined,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.message || `Mercado Pago respondeu ${res.status}` };
    }

    return {
      success: true,
      mpPaymentId: String(data.id),
      pixCopiaECola: data.point_of_interaction?.transaction_data?.qr_code,
      pixQrCodeBase64: data.point_of_interaction?.transaction_data?.qr_code_base64,
      status: data.status, // 'pending' até ser pago
    };
  } catch (e: any) {
    return { success: false, error: e.message || 'Falha ao criar cobrança Pix no Mercado Pago.' };
  }
}

interface CheckoutPreferenceResult {
  success: boolean;
  initPoint?: string; // URL do Checkout Pro para redirecionar o usuário (cartão)
  preferenceId?: string;
  error?: string;
}

// Cria uma preferência de Checkout Pro (página hospedada pelo Mercado Pago, aceita cartão).
export async function createCardCheckoutPreference(params: {
  orderReference: string;
  amountCents: number;
  description: string;
  payerEmail: string;
  successUrl: string;
  failureUrl: string;
}): Promise<CheckoutPreferenceResult> {
  try {
    const res = await fetch(`${MP_API_BASE}/checkout/preferences`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: [
          {
            title: params.description,
            quantity: 1,
            unit_price: Number((params.amountCents / 100).toFixed(2)),
            currency_id: 'BRL',
          },
        ],
        payer: { email: params.payerEmail },
        external_reference: params.orderReference,
        back_urls: { success: params.successUrl, failure: params.failureUrl, pending: params.successUrl },
        auto_return: 'approved',
        notification_url: process.env.MERCADOPAGO_WEBHOOK_URL || undefined,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.message || `Mercado Pago respondeu ${res.status}` };
    }

    return { success: true, initPoint: data.init_point, preferenceId: data.id };
  } catch (e: any) {
    return { success: false, error: e.message || 'Falha ao criar preferência de checkout no Mercado Pago.' };
  }
}

// Busca o status real de um pagamento direto na API do MP — usado pelo webhook,
// para NUNCA confiar apenas no corpo da notificação recebida.
export async function fetchMercadoPagoPayment(paymentId: string): Promise<{
  success: boolean;
  status?: string;
  externalReference?: string;
  amountCents?: number;
  error?: string;
}> {
  try {
    const res = await fetch(`${MP_API_BASE}/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${getAccessToken()}` },
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.message || `Mercado Pago respondeu ${res.status}` };

    return {
      success: true,
      status: data.status, // approved, pending, rejected, refunded, cancelled...
      externalReference: data.external_reference,
      amountCents: Math.round(Number(data.transaction_amount) * 100),
    };
  } catch (e: any) {
    return { success: false, error: e.message || 'Falha ao consultar pagamento no Mercado Pago.' };
  }
}

// Validação de assinatura do webhook (x-signature), conforme documentação oficial do MP.
// Sem MERCADOPAGO_WEBHOOK_SECRET configurada, a verificação é pulada (apenas um aviso é
// logado) — mesmo assim, o status do pagamento é sempre reconfirmado direto na API do MP
// antes de ativar qualquer assinatura, então um webhook falso não ativa nada sozinho.
export function isValidMercadoPagoSignature(
  xSignature: string | null,
  xRequestId: string | null,
  dataId: string
): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret || !xSignature || !xRequestId) return false;

  const parts = Object.fromEntries(xSignature.split(',').map((p) => p.trim().split('=')));
  const ts = parts['ts'];
  const hash = parts['v1'];
  if (!ts || !hash) return false;

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(hash));
  } catch {
    return false;
  }
}
