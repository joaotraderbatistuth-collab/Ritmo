import { extractTokenFromRequest } from './auth.js';
import { verifyActiveToken } from './session.js';
import { findUserById } from './server-db.js';
import { computeAccess } from './access.js';
import { CommunityError } from './community-db.js';
import { trackActivity } from './activity.js';
import { reportServerError } from './error-log.js';

/** Sessão válida, conta não desativada e com acesso ao app (teste ou assinatura em dia). */
export async function requireMember(request: Request) {
  const token = extractTokenFromRequest(request);
  if (!token) throw new CommunityError(401, 'Faça login para continuar.');
  const payload = await verifyActiveToken(token);
  if (!payload) throw new CommunityError(401, 'Sessão expirada.');
  const user = await findUserById(payload.userId);
  if (!user) throw new CommunityError(401, 'Sessão expirada.');
  const access = computeAccess({
    role: user.role,
    subscriptionStatus: user.subscriptionStatus,
    trialEndsAt: user.trialEndsAt,
    subscriptionRenewalDate: user.subscriptionRenewalDate,
    founder: (user as any).founder,
  });
  if (!access.hasAccess) throw new CommunityError(402, 'Seu acesso ao Ritmo expirou. Renove para usar o Feed e os Ritus.');
  trackActivity(user.id);
  return user;
}

export function communityError(e: any) {
  if (e instanceof CommunityError) return Response.json({ error: e.message }, { status: e.status });
  console.error('[comunidade]', e);
  reportServerError(e, 'comunidade');
  return Response.json({ error: 'Não foi possível concluir agora. Tente novamente.' }, { status: 500 });
}
