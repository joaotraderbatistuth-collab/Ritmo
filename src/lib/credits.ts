// Contagem de créditos da Netlify (aba "Créditos" do painel). Regras puras, testadas em tests/ritmo.test.ts.
// A Netlify não tem um endereço que devolva o saldo exato (o campo "used" da API vem sempre 0), então juntamos:
//  - dados reais da API (créditos do plano, período, publicações, tráfego, avisos de saldo), se houver NETLIFY_API_TOKEN;
//  - horas em que o banco ficou acordado, contadas pelo próprio Ritmo (tabela db_hours);
//  - o saldo que o master digitou olhando o painel da Netlify (ponto de partida mais confiável).
// O resultado é SEMPRE uma estimativa e a tela diz isso.

/** Preços em créditos (Netlify, 2026). Ajuste aqui se a Netlify mudar. */
export const CREDIT_PRICES = {
  deploy: 15, // cada publicação em produção
  bandwidthGB: 20, // cada GB de tráfego
  dbHour: 10, // cada hora de banco acordado (tamanho mínimo)
};

export interface CreditInputs {
  planCredits: number | null; // créditos do plano no período (ex.: 1000)
  deploys: number; // publicações em produção concluídas no período
  bandwidthGB: number; // GB de tráfego no período
  dbHours: number; // horas com o banco acordado no período
}

export interface CreditAnchor {
  balance: number; // saldo que o master viu no painel da Netlify
  at: string; // quando ele anotou (ISO)
}

export function burn(i: { deploys: number; bandwidthGB: number; dbHours: number }) {
  const deploys = Math.max(0, i.deploys) * CREDIT_PRICES.deploy;
  const bandwidth = Math.round(Math.max(0, i.bandwidthGB) * CREDIT_PRICES.bandwidthGB * 10) / 10;
  const database = Math.max(0, i.dbHours) * CREDIT_PRICES.dbHour;
  return { deploys, bandwidth, database, total: Math.round((deploys + bandwidth + database) * 10) / 10 };
}

/**
 * Saldo estimado. Com ponto de partida (saldo anotado): saldo anotado − gasto desde então.
 * Sem ele: créditos do plano − gasto do período.
 * `sinceAnchor` = o gasto contado depois da anotação (o servidor calcula só a partir daquela hora).
 */
export function estimateBalance(i: CreditInputs, anchor: CreditAnchor | null, sinceAnchor?: { deploys: number; bandwidthGB: number; dbHours: number }) {
  const period = burn(i);
  if (anchor && sinceAnchor) {
    const after = burn(sinceAnchor);
    return { remaining: Math.round((anchor.balance - after.total) * 10) / 10, period, basis: 'anchor' as const, afterAnchor: after };
  }
  if (i.planCredits && i.planCredits > 0) {
    return { remaining: Math.round((i.planCredits - period.total) * 10) / 10, period, basis: 'plan' as const, afterAnchor: null };
  }
  return { remaining: null, period, basis: 'none' as const, afterAnchor: null };
}

/** Quantos dias o saldo ainda dura no ritmo médio de gasto dos últimos dias. */
export function daysLeft(remaining: number | null, avgPerDay: number): number | null {
  if (remaining === null || avgPerDay <= 0) return null;
  if (remaining <= 0) return 0;
  return Math.floor(remaining / avgPerDay);
}

/** Cor do aviso: verde até 50% gasto, amarelo até 80%, vermelho acima. */
export function creditLevel(remaining: number | null, plan: number | null): 'ok' | 'warn' | 'danger' | 'unknown' {
  if (remaining === null || !plan) return 'unknown';
  const usedPct = 1 - remaining / plan;
  if (usedPct >= 0.8) return 'danger';
  if (usedPct >= 0.5) return 'warn';
  return 'ok';
}

/** Chave da hora em UTC, ex.: "2026-11-10T14". Comparável como texto. */
export function hourKey(d: Date = new Date()): string {
  return d.toISOString().slice(0, 13);
}

export function parseAnchor(raw: unknown): CreditAnchor | null {
  try {
    const p: any = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const balance = Number(p?.balance);
    if (!Number.isFinite(balance) || balance < 0 || balance > 10_000_000) return null;
    if (!Number.isFinite(Date.parse(p?.at))) return null;
    return { balance, at: String(p.at) };
  } catch {
    return null;
  }
}
