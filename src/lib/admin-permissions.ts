// Permissões do painel de administração — lógica PURA (sem banco, sem React).
// Regras:
//  - O administrador MASTER (e-mail definido abaixo ou na variável MASTER_ADMIN_EMAIL) tem tudo
//    e é o único que cria outros administradores e escolhe o que cada um enxerga e pode fazer.
//  - Cada administrador comum tem só as permissões marcadas pelo master.
//  - Administrador antigo (sem permissões salvas) mantém acesso operacional completo,
//    mas nunca gerencia administradores.

export const DEFAULT_MASTER_EMAIL = 'batistuth@live.com';

export const PERMISSIONS = [
  { key: 'overview', label: 'Visão geral', description: 'Ver número de usuários, assinantes, cadastros e engajamento.' },
  { key: 'finance', label: 'Valores e vendas', description: 'Ver receita, pagamentos, ticket médio e comissões geradas.' },
  { key: 'users_view', label: 'Ver usuários', description: 'Ver a lista de usuários e seus dados de cadastro.' },
  { key: 'users_manage', label: 'Gerir usuários', description: 'Editar, ativar/desativar, dar acesso grátis e redefinir senha.' },
  { key: 'coupons', label: 'Cupons', description: 'Criar, ativar/desativar e excluir cupons de desconto.' },
  { key: 'affiliates', label: 'Afiliados', description: 'Ver o ranking de afiliados e a rede de indicações.' },
  { key: 'withdrawals', label: 'Saques', description: 'Aprovar, pagar ou recusar saques de afiliados.' },
  { key: 'refunds', label: 'Estornos', description: 'Estornar pedidos (reverte as comissões e pode encerrar o acesso).' },
  { key: 'exports', label: 'Planilhas', description: 'Baixar planilhas de dados (usuários, vendas, comissões...).' },
  { key: 'audit', label: 'Auditoria', description: 'Ver o histórico de tudo o que os administradores fizeram.' },
] as const;

export type PermissionKey = (typeof PERMISSIONS)[number]['key'];
export type AdminPermission = PermissionKey | 'admins_manage';

export const ALL_PERMISSION_KEYS: PermissionKey[] = PERMISSIONS.map((p) => p.key);

export const PERMISSION_TEMPLATES: { id: string; label: string; permissions: PermissionKey[] }[] = [
  { id: 'suporte', label: 'Suporte', permissions: ['overview', 'users_view', 'users_manage'] },
  { id: 'financeiro', label: 'Financeiro', permissions: ['overview', 'finance', 'affiliates', 'withdrawals', 'refunds', 'exports'] },
  { id: 'marketing', label: 'Marketing', permissions: ['overview', 'coupons', 'affiliates'] },
  { id: 'total', label: 'Tudo (sem gerir administradores)', permissions: [...ALL_PERMISSION_KEYS] },
];

const isKey = (v: unknown): v is PermissionKey => typeof v === 'string' && (ALL_PERMISSION_KEYS as string[]).includes(v);

/** Aceita lista, texto JSON ou vazio e devolve só permissões válidas e sem repetição. */
export function normalizePermissions(raw: unknown): PermissionKey[] {
  let list: unknown = raw;
  if (typeof raw === 'string') {
    try {
      list = JSON.parse(raw);
    } catch {
      list = [];
    }
  }
  if (!Array.isArray(list)) return [];
  const out: PermissionKey[] = [];
  for (const v of list) if (isKey(v) && !out.includes(v)) out.push(v);
  return out;
}

export function serializePermissions(list: unknown): string {
  return JSON.stringify(normalizePermissions(list));
}

/** E-mails master: da configuração (separados por vírgula) ou o padrão do projeto. */
export function masterEmailList(configured?: string | null): string[] {
  const src = configured && configured.trim() ? configured : DEFAULT_MASTER_EMAIL;
  return src
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isMasterEmail(email: string | null | undefined, configured?: string | null): boolean {
  if (!email) return false;
  return masterEmailList(configured).includes(email.trim().toLowerCase());
}

export interface AdminLike {
  role?: string | null;
  email?: string | null;
  adminPermissions?: unknown;
}

export function isMasterAdmin(user: AdminLike, configured?: string | null): boolean {
  return user.role === 'admin' && isMasterEmail(user.email, configured);
}

/** Permissões efetivas de um usuário (vazio se não for administrador). */
export function effectivePermissions(user: AdminLike, configured?: string | null): AdminPermission[] {
  if (user.role !== 'admin') return [];
  if (isMasterEmail(user.email, configured)) return [...ALL_PERMISSION_KEYS, 'admins_manage'];
  // sem permissões salvas = administrador antigo: acesso operacional completo
  if (user.adminPermissions === null || user.adminPermissions === undefined || user.adminPermissions === '') {
    return [...ALL_PERMISSION_KEYS];
  }
  return normalizePermissions(user.adminPermissions);
}

export function can(perms: readonly string[], p: AdminPermission): boolean {
  return perms.includes(p);
}

/** Ação do painel → permissão exigida. Ação que não estiver aqui é negada. */
export const ACTION_PERMISSION: Record<string, AdminPermission> = {
  update_user: 'users_manage',
  set_user_active: 'users_manage',
  grant_access: 'users_manage',
  create_coupon: 'coupons',
  toggle_coupon: 'coupons',
  delete_coupon: 'coupons',
  process_withdrawal: 'withdrawals',
  refund_order: 'refunds',
  create_admin: 'admins_manage',
  set_admin_permissions: 'admins_manage',
  remove_admin: 'admins_manage',
};

/** Exportação → permissão exigida. */
export const EXPORT_PERMISSION: Record<string, AdminPermission> = {
  users: 'users_view',
  signups: 'overview',
  payments: 'finance',
  commissions: 'finance',
  withdrawals: 'withdrawals',
  coupons: 'coupons',
  affiliates: 'affiliates',
  audit: 'audit',
};

/** Remove do painel tudo o que o administrador não tem permissão de ver (feito no SERVIDOR). */
export function filterDashboardByPermissions<T extends Record<string, any>>(data: T, perms: readonly string[]) {
  const out: Record<string, any> = { permissions: [...perms] };
  if (can(perms, 'overview')) {
    out.metrics = data.metrics;
    out.signupsByDay = data.signupsByDay;
  }
  if (can(perms, 'finance')) {
    out.finance = data.finance;
    out.payments = data.payments;
  }
  if (can(perms, 'users_view') || can(perms, 'users_manage')) out.users = data.users;
  if (can(perms, 'coupons')) out.coupons = data.coupons;
  if (can(perms, 'affiliates')) out.affiliates = data.affiliates;
  if (can(perms, 'withdrawals')) out.withdrawals = data.withdrawals;
  if (can(perms, 'audit')) out.audit = data.audit;
  if (can(perms, 'admins_manage')) out.admins = data.admins;
  return out;
}
