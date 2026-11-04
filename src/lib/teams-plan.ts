// Equipes pagas — regras PURAS (sem banco, sem React), testadas em tests/.
// Qualquer usuário pode criar uma equipe e definir o preço de entrada.
// A plataforma retém 40% de cada venda; o criador recebe o restante (60%).

export const TEAM_PLATFORM_FEE_PERCENT = 40;
export const TEAM_MIN_PRICE_CENTS = 500; // R$ 5,00
export const TEAM_MAX_PRICE_CENTS = 200000; // R$ 2.000,00
export const TEAM_NAME_MAX = 60;
export const TEAM_DESCRIPTION_MAX = 600;

/** 0 = acesso único (paga uma vez). 30 = acesso por 30 dias, renovado por novo pagamento. */
export const TEAM_PERIODS = [0, 30] as const;
export type TeamPeriod = (typeof TEAM_PERIODS)[number];

/**
 * Divide o valor pago. A taxa da plataforma arredonda para BAIXO, então o criador
 * nunca recebe menos que 60% (a diferença de centavos fica com ele).
 */
export function splitTeamPayment(grossCents: number): { platformFeeCents: number; ownerCents: number } {
  const platformFeeCents = Math.floor((grossCents * TEAM_PLATFORM_FEE_PERCENT) / 100);
  return { platformFeeCents, ownerCents: grossCents - platformFeeCents };
}

export interface TeamInput {
  name: string;
  description: string;
  priceCents: number;
  periodDays: number;
  freeForReferred: boolean;
  /** Os membros também podem publicar na equipe? Padrão: não (só o criador publica; membros comentam). */
  membersCanPost: boolean;
}

export interface TeamValidation {
  ok: boolean;
  value?: TeamInput;
  error?: string;
}

const clean = (s: unknown) => String(s ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim();

export function validateTeamInput(raw: Partial<TeamInput> & Record<string, unknown>): TeamValidation {
  const name = clean(raw.name).replace(/\s+/g, ' ');
  if (name.length < 3) return { ok: false, error: 'Dê um nome à equipe, com pelo menos 3 letras.' };
  if (name.length > TEAM_NAME_MAX) return { ok: false, error: `O nome da equipe pode ter até ${TEAM_NAME_MAX} caracteres.` };
  const description = clean(raw.description).replace(/\n{3,}/g, '\n\n');
  if (description.length > TEAM_DESCRIPTION_MAX) return { ok: false, error: `A descrição pode ter até ${TEAM_DESCRIPTION_MAX} caracteres.` };
  const priceCents = Number(raw.priceCents);
  if (!Number.isInteger(priceCents)) return { ok: false, error: 'Preço inválido.' };
  if (priceCents !== 0 && (priceCents < TEAM_MIN_PRICE_CENTS || priceCents > TEAM_MAX_PRICE_CENTS)) {
    return { ok: false, error: 'O preço deve ser grátis (R$ 0) ou ficar entre R$ 5,00 e R$ 2.000,00.' };
  }
  const periodDays = Number(raw.periodDays ?? 0);
  if (!(TEAM_PERIODS as readonly number[]).includes(periodDays)) return { ok: false, error: 'Período de acesso inválido.' };
  return {
    ok: true,
    value: {
      name,
      description,
      priceCents,
      periodDays,
      freeForReferred: raw.freeForReferred === undefined ? true : Boolean(raw.freeForReferred),
      membersCanPost: raw.membersCanPost === undefined ? false : Boolean(raw.membersCanPost),
    },
  };
}

/** Código curto e legível para o link da equipe, ex.: "personal-joao-k3x9". */
export function teamCodeFrom(name: string, random: () => number = Math.random): string {
  const base = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 28)
    .replace(/-+$/g, '');
  const suffix = Math.floor(random() * 36 ** 4)
    .toString(36)
    .padStart(4, '0');
  return `${base || 'equipe'}-${suffix}`;
}

export const isValidTeamCode = (c: unknown): c is string => typeof c === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(c) && c.length <= 40;

export interface MembershipLike {
  status: string;
  expiresAt?: string | null; // YYYY-MM-DD ou vazio (acesso sem prazo)
}

/** O membro tem acesso hoje? `todayBr` é YYYY-MM-DD no horário de Brasília. */
export function membershipActive(m: MembershipLike | null | undefined, todayBr: string): boolean {
  if (!m || m.status !== 'active') return false;
  return !m.expiresAt || m.expiresAt >= todayBr;
}

/** Nova data de validade ao pagar: soma o período ao que sobrou (ou a partir de hoje). */
export function nextMembershipExpiry(currentExpiry: string | null | undefined, todayBr: string, periodDays: number): string | null {
  if (!periodDays) return null;
  const base = currentExpiry && currentExpiry >= todayBr ? currentExpiry : todayBr;
  return new Date(new Date(`${base}T00:00:00Z`).getTime() + periodDays * 86400000).toISOString().slice(0, 10);
}

export function teamPriceLabel(priceCents: number, periodDays: number): string {
  if (priceCents === 0) return 'Grátis';
  const v = (priceCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  return periodDays ? `${v} a cada ${periodDays} dias` : `${v} (acesso único)`;
}

/** "Um aluno por indicação": quem se cadastrou pelo link do criador entra de graça. */
export function qualifiesForFreeAccess(team: { freeForReferred: boolean }, ownerReferralCode: string, buyerReferredBy: string | null | undefined): boolean {
  return Boolean(team.freeForReferred && buyerReferredBy && buyerReferredBy === ownerReferralCode);
}

export const TEAM_TERMS = [
  `A plataforma retém ${TEAM_PLATFORM_FEE_PERCENT}% do valor de cada venda; o criador recebe o restante.`,
  'O repasse entra no seu saldo e é sacado por Pix, com o mesmo prazo semanal das comissões: pedido até quarta-feira, 23:59, pago na quinta e na sexta.',
  'Reembolso ou contestação de um pagamento desfaz o repasse correspondente.',
  'Você é responsável pelo conteúdo que publica na equipe e pelas obrigações fiscais e profissionais da sua atividade. Conteúdo ilegal, enganoso ou que ofenda pessoas pode ser removido e a equipe, suspensa.',
  'Não prometa resultado de saúde, financeiro ou de qualquer outro tipo.',
];
