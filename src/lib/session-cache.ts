// Cache curto da situação da sessão (conta ativa e acesso em dia). Fica em um arquivo sem
// dependências para o banco poder limpá-lo de forma SÍNCRONA a cada mudança do usuário.
export interface SessionInfo {
  ok: boolean;
  hasAccess: boolean;
  at: number;
}

export const SESSION_CACHE_MS = 10_000;
const cache = new Map<number, SessionInfo>();

export const getCachedSession = (userId: number): SessionInfo | null => {
  const hit = cache.get(userId);
  return hit && Date.now() - hit.at < SESSION_CACHE_MS ? hit : null;
};
export const setCachedSession = (userId: number, info: SessionInfo) => void cache.set(userId, info);
export function invalidateSessionCache(userId?: number) {
  if (userId === undefined) cache.clear();
  else cache.delete(userId);
}
