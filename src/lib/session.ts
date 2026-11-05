import { verifyToken, TokenPayload } from './auth.js';
import { findUserById } from './server-db.js';
import { computeAccess } from './access.js';
import { trackActivity } from './activity.js';
import { installServerErrorHook } from './error-log.js';

installServerErrorHook();
import { getCachedSession, setCachedSession, invalidateSessionCache } from './session-cache.js';

export { invalidateSessionCache };

// Sessão "ativa": além de o token ser válido, a conta não pode estar DESATIVADA pelo administrador.
// Nas rotas de dados também exigimos ACESSO em dia (teste ou assinatura): sem isso, a tela de
// bloqueio seria só enfeite — quem chamasse a API direto continuaria usando o app de graça.
// Guarda o resultado por poucos segundos para não consultar o banco a cada requisição;
// qualquer alteração do usuário (pagamento, admin) limpa o cache na hora.
async function sessionInfo(userId: number) {
  const hit = getCachedSession(userId);
  if (hit) return hit;
  const user = await findUserById(userId);
  const info = {
    ok: Boolean(user) && user!.subscriptionStatus !== 'suspended',
    hasAccess: user
      ? computeAccess({
          role: user.role,
          subscriptionStatus: user.subscriptionStatus,
          trialEndsAt: user.trialEndsAt,
          subscriptionRenewalDate: user.subscriptionRenewalDate,
        }).hasAccess
      : false,
    at: Date.now(),
  };
  setCachedSession(userId, info);
  return info;
}

/** Sessão válida e conta não desativada (não exige assinatura em dia). */
export async function verifyActiveToken(token: string): Promise<TokenPayload | null> {
  const payload = await verifyToken(token);
  if (!payload) return null;
  return (await sessionInfo(payload.userId)).ok ? payload : null;
}

export type DataAuth = { payload: TokenPayload } | { response: Response };

/**
 * Para as rotas de DADOS (tarefas, hábitos, finanças...): exige sessão válida, conta ativa
 * e acesso em dia. Teste/assinatura vencidos recebem 402 (a tela de renovação trata isso).
 */
export async function authorizeData(token: string | null | undefined): Promise<DataAuth> {
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return { response: Response.json({ error: 'Sessão expirada.' }, { status: 401 }) };
  const info = await sessionInfo(payload.userId);
  if (!info.ok) return { response: Response.json({ error: 'Sessão expirada.' }, { status: 401 }) };
  if (!info.hasAccess) {
    return {
      response: Response.json(
        { error: 'Seu período de teste ou assinatura terminou. Renove para continuar usando o Ritmo.', code: 'ACCESS_EXPIRED' },
        { status: 402 }
      ),
    };
  }
  trackActivity(payload.userId);
  return { payload };
}
