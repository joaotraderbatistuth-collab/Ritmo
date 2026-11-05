// Confere no servidor se quem chama é administrador ativo e devolve as permissões dele.
import { extractTokenFromRequest, verifyToken } from './auth.js';
import { findUserById } from './server-db.js';
import { AdminPermission, can, effectivePermissions } from './admin-permissions.js';

const fail = (error: string, status: number) => Response.json({ error }, { status });

export async function requireAdminPermission(request: Request, permission: AdminPermission) {
  const token = extractTokenFromRequest(request);
  if (!token) return { error: fail('Acesso restrito. Faça login como administrador.', 401) };
  const payload = await verifyToken(token);
  if (!payload) return { error: fail('Sessão expirada.', 401) };
  const user = await findUserById(payload.userId);
  if (!user || user.role !== 'admin' || user.subscriptionStatus === 'suspended') return { error: fail('Acesso negado.', 403) };
  const permissions = effectivePermissions(user, process.env.MASTER_ADMIN_EMAIL || null);
  if (!can(permissions, permission)) return { error: fail('Você não tem permissão para ver isto.', 403) };
  return { user, permissions };
}
