import { verifyToken, TokenPayload } from './auth.js';
import { findUserById } from './server-db.js';

// Sessão "ativa": além de o token ser válido, a conta não pode estar DESATIVADA pelo administrador.
// Sem isso, desativar um usuário só esconderia telas — a API continuaria respondendo.
// Guarda o resultado por alguns segundos para não consultar o banco a cada requisição.
const CACHE_MS = 15_000;
const cache = new Map<number, { ok: boolean; at: number }>();

export function invalidateSessionCache(userId?: number) {
  if (userId === undefined) cache.clear();
  else cache.delete(userId);
}

export async function verifyActiveToken(token: string): Promise<TokenPayload | null> {
  const payload = await verifyToken(token);
  if (!payload) return null;
  const hit = cache.get(payload.userId);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.ok ? payload : null;
  const user = await findUserById(payload.userId);
  const ok = Boolean(user) && user!.subscriptionStatus !== 'suspended';
  cache.set(payload.userId, { ok, at: Date.now() });
  return ok ? payload : null;
}
