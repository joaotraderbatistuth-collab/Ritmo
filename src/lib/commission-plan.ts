// Plano de comissões do Ritmo — ÚNICO lugar onde os percentuais são definidos.
// Lógica PURA (sem banco, sem React), usada pelo servidor, pelas telas e pelos testes.
//
// Regra: 35% do valor de cada pagamento confirmado, assim distribuídos pela rede de indicações:
//   nível 1 (quem indicou direto)  25%
//   níveis 2 a 4 (a rede acima)     10% no total  → 5% + 3% + 2%
// Para mudar a divisão dos 10% entre os níveis 2, 3 e 4, edite só a lista abaixo.

export const COMMISSION_LEVEL_PERCENTS: readonly number[] = [25, 5, 3, 2];

export const MAX_COMMISSION_LEVELS = COMMISSION_LEVEL_PERCENTS.length;
export const COMMISSION_DIRECT_PERCENT = COMMISSION_LEVEL_PERCENTS[0];
export const COMMISSION_NETWORK_PERCENT = COMMISSION_LEVEL_PERCENTS.slice(1).reduce((a, b) => a + b, 0);
export const COMMISSION_TOTAL_PERCENT = COMMISSION_DIRECT_PERCENT + COMMISSION_NETWORK_PERCENT;

/** Preço do plano usado nos exemplos dos textos. */
export const PLAN_PRICE_CENTS = 3990;

/** Valor mínimo para pedir saque (política do programa). */
export const MIN_PAYOUT_CENTS = 2394;

export function levelPercent(level: number): number {
  return COMMISSION_LEVEL_PERCENTS[level - 1] ?? 0;
}

/** Arredonda para BAIXO: a soma dos níveis nunca passa do total prometido. */
export function commissionCentsFor(baseCents: number, percent: number): number {
  return Math.floor((baseCents * percent) / 100);
}

export function brl(cents: number): string {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export interface ChainCommission {
  level: number;
  affiliateUserId: number;
  ratePercent: number;
  commissionCents: number;
}

/**
 * Divide a comissão de UM pagamento entre os indicadores acima de quem pagou.
 * `upline` = ids dos indicadores, do nível 1 (direto) para cima. Ignora repetidos e o próprio
 * pagador (protege contra autoindicação e ciclos) e corta a corrente no primeiro problema.
 */
export function calculateCommissionChain(params: {
  payerUserId: number;
  baseAmountCents: number;
  upline: number[];
}): ChainCommission[] {
  const out: ChainCommission[] = [];
  if (params.baseAmountCents <= 0) return out;
  const seen = new Set<number>([params.payerUserId]);
  for (let i = 0; i < params.upline.length && i < MAX_COMMISSION_LEVELS; i++) {
    const id = params.upline[i];
    if (seen.has(id)) break;
    seen.add(id);
    const level = i + 1;
    const ratePercent = levelPercent(level);
    const commissionCents = commissionCentsFor(params.baseAmountCents, ratePercent);
    if (commissionCents > 0) out.push({ level, affiliateUserId: id, ratePercent, commissionCents });
  }
  return out;
}

export const DIRECT_EXAMPLE_BRL = brl(commissionCentsFor(PLAN_PRICE_CENTS, COMMISSION_DIRECT_PERCENT));

// ---- Textos reutilizados nas telas, para não repetir números em vários arquivos ----
const lvl = (n: number) => `${levelPercent(n)}% no nível ${n}`;
export const COMMISSION_LEVELS_TEXT = `${lvl(1)}, ${lvl(2)}, ${lvl(3)} e ${lvl(4)}`;
export const COMMISSION_HEADLINE = `Ganhe ${COMMISSION_DIRECT_PERCENT}% recorrente por indicação`;
export const COMMISSION_DETAIL = `Você recebe ${COMMISSION_DIRECT_PERCENT}% de cada pagamento de quem assina pelo seu link (${brl(
  commissionCentsFor(PLAN_PRICE_CENTS, COMMISSION_DIRECT_PERCENT)
)} por mês no plano de ${brl(PLAN_PRICE_CENTS)}) e mais até ${COMMISSION_NETWORK_PERCENT}% quando a sua rede indica outras pessoas, até o ${MAX_COMMISSION_LEVELS}º nível (${COMMISSION_LEVELS_TEXT}). O total pago pela plataforma é de, no máximo, ${COMMISSION_TOTAL_PERCENT}% de cada pagamento.`;
