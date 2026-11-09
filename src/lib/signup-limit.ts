// Limite de contas da fase de lançamento ("vagas") e lista de espera.
// Regras puras (testadas em tests/ritmo.test.ts). O limite fica em app_settings ('max_accounts');
// 0 = sem limite. Administradores e o master não ocupam vaga e sempre conseguem criar conta.

export const DEFAULT_MAX_ACCOUNTS = 50;
export const MAX_ACCOUNTS_CAP = 1_000_000;

export const SIGNUP_CLOSED_TITLE = 'Ritmo em construção';
export const SIGNUP_CLOSED_MESSAGE =
  'O sistema ainda está em construção e o número de contas está limitado nesta primeira fase. ' +
  'Todas as vagas foram preenchidas. Deixe seu nome e e-mail na lista de espera: você é avisado assim que abrirmos novas vagas.';

/** Lê o valor salvo (texto) e devolve o limite válido. Vazio ou inválido = padrão (50). */
export function parseMaxAccounts(raw: unknown): number {
  if (raw === null || raw === undefined || String(raw).trim() === '') return DEFAULT_MAX_ACCOUNTS;
  const n = Math.floor(Number(raw));
  if (!Number.isFinite(n) || n < 0) return DEFAULT_MAX_ACCOUNTS;
  return Math.min(n, MAX_ACCOUNTS_CAP);
}

/** Cadastros estão abertos? `used` = contas de usuários comuns já criadas. */
export function signupOpen(limit: number, used: number): boolean {
  if (limit <= 0) return true; // 0 = sem limite
  return used < limit;
}

export function spotsLeft(limit: number, used: number): number | null {
  if (limit <= 0) return null;
  return Math.max(0, limit - used);
}

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/;

/** Limpa os dados da lista de espera. Devolve null se o e-mail for inválido. */
export function cleanWaitlistEntry(raw: any): { name: string; email: string; source: string } | null {
  const email = String(raw?.email ?? '').trim().toLowerCase().slice(0, 254);
  if (!EMAIL_RE.test(email)) return null;
  const name = String(raw?.name ?? '').replace(/\s+/g, ' ').trim().slice(0, 80);
  const source = String(raw?.source ?? '').toLowerCase().replace(/[^a-z0-9:/._-]/g, '').slice(0, 60);
  return { name, email, source };
}
