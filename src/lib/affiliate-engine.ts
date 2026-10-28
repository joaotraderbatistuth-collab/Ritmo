import { COMMISSION_DIRECT_PERCENT, commissionCentsFor } from './commission-plan.js';

export interface BillingWebhookEvent {
  eventId: string;
  eventType: 'payment_confirmed' | 'payment_refunded' | 'subscription_cancelled' | 'chargeback';
  orderReference: string;
  customerUserId: number;
  grossAmountCents: number;
  netAmountCents: number;
  currency: string;
  timestamp: string;
}

export interface CommissionCalculationResult {
  affiliateUserId: number;
  referredUserId: number;
  orderReference: string;
  baseAmountCents: number;
  commissionRatePercent: number;
  commissionCents: number;
  status: 'pending' | 'approved' | 'refunded' | 'reversed';
  action: 'created' | 'reversed' | 'ignored_duplicate' | 'self_referral_rejected';
  reason: string;
}

/**
 * Calculates recurring affiliate commission strictly based on eligible net amount.
 * Prevents self-referral and enforces attribution rules (taxa padrão = nível 1 do plano de comissões).
 */
export function calculateAffiliateCommission(params: {
  affiliateUserId: number;
  referredUserId: number;
  netAmountCents: number;
  commissionRatePercent?: number;
  isSelfReferral?: boolean;
}): { eligible: boolean; commissionCents: number; ratePercent: number; reason: string } {
  const ratePercent = params.commissionRatePercent ?? COMMISSION_DIRECT_PERCENT;

  if (params.affiliateUserId === params.referredUserId || params.isSelfReferral) {
    return {
      eligible: false,
      commissionCents: 0,
      ratePercent,
      reason: 'Comissão rejeitada: Não é permitida comissão pela própria assinatura (autoindicação).',
    };
  }

  if (params.netAmountCents <= 0) {
    return {
      eligible: false,
      commissionCents: 0,
      ratePercent,
      reason: 'Comissão não aplicável para transações gratuitas ou com valor líquido nulo.',
    };
  }

  // percentual sobre o valor informado, arredondado para baixo (nunca paga a mais)
  const commissionCents = commissionCentsFor(params.netAmountCents, ratePercent);

  return {
    eligible: true,
    commissionCents,
    ratePercent,
    reason: `Comissão calculada: ${ratePercent}% sobre R$ ${(params.netAmountCents / 100).toFixed(2)}.`,
  };
}

/**
 * Formats currency in Brazilian Real (BRL)
 */
export function formatBRL(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}
