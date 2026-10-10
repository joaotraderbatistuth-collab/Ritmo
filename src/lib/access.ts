// Regras de acesso do Ritmo — função PURA (sem banco), usada pelo servidor e testada em tests/.
// Quem decide se a pessoa pode usar o app: teste grátis válido, assinatura paga em dia,
// ou assinatura cancelada mas ainda dentro do período já pago. Admin sempre tem acesso.

export interface AccessInput {
  role?: string | null;
  subscriptionStatus?: string | null;
  trialEndsAt?: string | Date | null;
  subscriptionRenewalDate?: string | null; // YYYY-MM-DD
}

export interface AccessResult {
  hasAccess: boolean;
  effectiveStatus: 'trial' | 'active' | 'canceled' | 'expired' | 'suspended';
  daysLeft: number; // dias restantes do teste ou do período pago
}

const DAY_MS = 24 * 60 * 60 * 1000;

function todayStr(now: Date): string {
  return now.toISOString().split('T')[0];
}

export function computeAccess(user: AccessInput, now: Date = new Date()): AccessResult {
  const status = user.subscriptionStatus || 'trial';

  if (user.role === 'admin') return { hasAccess: true, effectiveStatus: status === 'trial' ? 'active' : (status as any), daysLeft: 0 };
  if (status === 'suspended') return { hasAccess: false, effectiveStatus: 'suspended', daysLeft: 0 };

  if (status === 'active' || status === 'canceled') {
    const renewal = user.subscriptionRenewalDate;
    if (!renewal) return { hasAccess: status === 'active', effectiveStatus: status as any, daysLeft: 0 };
    const paidUntil = new Date(renewal + 'T23:59:59Z').getTime();
    const daysLeft = Math.max(0, Math.ceil((paidUntil - now.getTime()) / DAY_MS));
    if (renewal < todayStr(now)) return { hasAccess: false, effectiveStatus: 'expired', daysLeft: 0 };
    return { hasAccess: true, effectiveStatus: status as any, daysLeft };
  }

  if (status === 'trial') {
    if (!user.trialEndsAt) return { hasAccess: true, effectiveStatus: 'trial', daysLeft: 7 };
    const end = new Date(user.trialEndsAt).getTime();
    const daysLeft = Math.max(0, Math.ceil((end - now.getTime()) / DAY_MS));
    return end > now.getTime()
      ? { hasAccess: true, effectiveStatus: 'trial', daysLeft }
      : { hasAccess: false, effectiveStatus: 'expired', daysLeft: 0 };
  }

  return { hasAccess: false, effectiveStatus: 'expired', daysLeft: 0 };
}

// Nova data de renovação ao confirmar um pagamento: soma 30 dias a partir do que sobrou
// (se pagar antes de vencer, não perde dias) ou a partir de hoje (se já venceu).
export function nextRenewalDate(currentRenewal: string | null | undefined, now: Date = new Date()): string {
  const today = todayStr(now);
  const base = currentRenewal && currentRenewal >= today ? new Date(currentRenewal + 'T00:00:00Z') : new Date(today + 'T00:00:00Z');
  return new Date(base.getTime() + 30 * DAY_MS).toISOString().split('T')[0];
}
