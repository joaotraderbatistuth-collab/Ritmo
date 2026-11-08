import { createFileRoute } from '@tanstack/react-router';
import { extractTokenFromRequest, hashPassword, verifyToken } from '../lib/auth.js';
import {
  ACTION_PERMISSION,
  EXPORT_PERMISSION,
  AdminPermission,
  can,
  effectivePermissions,
  filterDashboardByPermissions,
  isMasterAdmin,
} from '../lib/admin-permissions.js';
import { invalidateSessionCache } from '../lib/session.js';
import { getModerationData, getTeamsFinance, moderateTarget, setUserFeedMuted, adminSetTeamActive } from '../lib/community-db.js';
import {
  findUserById,
  findUserByEmail,
  getAdminDashboardData,
  buildAdminExport,
  logAdminAction,
  adminUpdateUser,
  adminSetUserActive,
  adminGrantAccess,
  adminRefundOrder,
  adminCreateAdmin,
  adminSetAdminPermissions,
  adminRemoveAdmin,
  adminCreateCoupon,
  adminToggleCoupon,
  adminDeleteCoupon,
  adminProcessWithdrawal,
  adminAttachWithdrawalReceipt,
  adminInviteAdmin,
  listAdminInvites,
  cancelAdminInvite,
} from '../lib/server-db.js';
import { parseMediaUrl } from '../lib/media-url.js';
import { rowsToCsv } from '../lib/server-db.js';
import { getSurvey, listAllSurveys } from '../lib/survey-db.js';
import { SURVEY_QUESTIONS, answerLabels, summarizeSurveys, surveyCsvCells, surveyCsvHeader } from '../lib/survey.js';

const masterConfigured = () => process.env.MASTER_ADMIN_EMAIL || null;
const fail = (error: string, status: number) => Response.json({ error }, { status });
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Confere a sessão NO SERVIDOR: administrador existente, não desativado, e devolve suas permissões. */
async function requireAdmin(request: Request) {
  const token = extractTokenFromRequest(request);
  if (!token) return { error: fail('Acesso restrito. Faça login como administrador.', 401) };
  const payload = await verifyToken(token);
  if (!payload) return { error: fail('Sessão expirada.', 401) };
  const user = await findUserById(payload.userId);
  if (!user || user.role !== 'admin' || user.subscriptionStatus === 'suspended') {
    return { error: fail('Acesso negado. Esta área é restrita a administradores do Ritmo.', 403) };
  }
  const permissions = effectivePermissions(user, masterConfigured());
  return { user, permissions, isMaster: isMasterAdmin(user, masterConfigured()) };
}

export const Route = createFileRoute('/api/admin')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await requireAdmin(request);
        if ('error' in auth) return auth.error;
        const { user, permissions, isMaster } = auth;

        const params = new URL(request.url).searchParams;
        const canSeeUsers = can(permissions, 'users_view') || can(permissions, 'users_manage');

        // Pesquisa de perfil de um usuário (ao clicar no nome na aba Usuários)
        const surveyUser = params.get('survey_user');
        if (surveyUser) {
          if (!canSeeUsers) return fail('Você não tem permissão para ver usuários.', 403);
          const target = await findUserById(Number(surveyUser));
          if (!target) return fail('Usuário não encontrado.', 404);
          const survey = await getSurvey(target.id);
          // ver renda e gostos de alguém fica registrado na auditoria
          if (survey?.completedAt) await logAdminAction(user, 'ver_pesquisa_usuario', { type: 'usuario', id: target.id });
          const answers = survey?.answers || {};
          return Response.json({
            success: true,
            survey: survey ? { completedAt: survey.completedAt, updatedAt: survey.updatedAt, dismissCount: survey.dismissCount } : null,
            items: SURVEY_QUESTIONS.map((q) => ({ id: q.id, title: q.title, type: q.type, values: answerLabels(q.id, answers[q.id]) })),
          });
        }

        // Resumo do público (todas as respostas somadas)
        if (params.get('survey_summary')) {
          if (!canSeeUsers) return fail('Você não tem permissão para ver usuários.', 403);
          const all = await listAllSurveys();
          return Response.json({ success: true, ...summarizeSurveys(all.map((s) => s.answers)) });
        }

        // Planilhas (CSV)
        const exportKind = params.get('export');
        if (exportKind) {
          const needed = EXPORT_PERMISSION[exportKind];
          if (!needed) return fail('Planilha desconhecida.', 400);
          if (!can(permissions, 'exports') || !can(permissions, needed)) {
            return fail('Você não tem permissão para baixar esta planilha.', 403);
          }
          if (exportKind === 'survey') {
            const [all, dash]: [Awaited<ReturnType<typeof listAllSurveys>>, any] = await Promise.all([listAllSurveys(), getAdminDashboardData(masterConfigured())]);
            const byId = new Map<number, any>((dash.users || []).map((u: any) => [u.id, u]));
            const rows: unknown[][] = [
              ['ID', 'Nome', 'E-mail', 'Status', 'Cadastro', 'Respondida em', ...surveyCsvHeader()],
              ...all
                .filter((s) => s.completedAt)
                .map((s) => {
                  const u = byId.get(s.userId) || {};
                  return [s.userId, u.name || '', u.email || '', u.subscriptionStatus || '', u.createdAt || '', s.completedAt || '', ...surveyCsvCells(s.answers)];
                }),
            ];
            await logAdminAction(user, 'exportar_planilha', { type: 'planilha', id: exportKind });
            return new Response(rowsToCsv(rows), {
              status: 200,
              headers: {
                'Content-Type': 'text/csv; charset=utf-8',
                'Content-Disposition': `attachment; filename="ritmo-pesquisa-${new Date().toISOString().slice(0, 10)}.csv"`,
                'Cache-Control': 'no-store',
              },
            });
          }
          const file = await buildAdminExport(exportKind, masterConfigured());
          if (!file) return fail('Planilha desconhecida.', 400);
          await logAdminAction(user, 'exportar_planilha', { type: 'planilha', id: exportKind });
          return new Response(file.csv, {
            status: 200,
            headers: {
              'Content-Type': 'text/csv; charset=utf-8',
              'Content-Disposition': `attachment; filename="${file.filename}"`,
              'Cache-Control': 'no-store',
            },
          });
        }

        const data: any = await getAdminDashboardData(masterConfigured());
        if (canSeeUsers) {
          const answered = new Set((await listAllSurveys().catch(() => [])).filter((s) => s.completedAt).map((s) => s.userId));
          data.users = (data.users || []).map((u: any) => ({ ...u, surveyDone: answered.has(u.id) }));
        }
        if (can(permissions, 'moderation')) data.moderation = await getModerationData().catch(() => null);
        return Response.json({
          success: true,
          adminUser: { id: user.id, name: user.name, email: user.email, role: user.role, isMaster },
          ...filterDashboardByPermissions(data, permissions),
          ...(can(permissions, 'finance') ? { teamsFinance: await getTeamsFinance() } : {}),
          ...(can(permissions, 'admins_create') || can(permissions, 'admins_manage') ? { adminInvites: await listAdminInvites() } : {}),
        });
      },

      POST: async ({ request }) => {
        try {
          const auth = await requireAdmin(request);
          if ('error' in auth) return auth.error;
          const { user, permissions, isMaster } = auth;

          const body = await request.json();
          const action: string = body.action;
          const needed: AdminPermission | undefined = ACTION_PERMISSION[action];
          if (!needed) return fail('Ação administrativa não reconhecida.', 400);
          if (!can(permissions, needed)) return fail('Você não tem permissão para esta ação.', 403);

          // Só o master mexe em contas de administrador (evita que um admin comum tome o controle).
          const guardTarget = async (rawId: unknown) => {
            const target = await findUserById(Number(rawId));
            if (!target) return { error: fail('Usuário não encontrado.', 404) };
            if (target.role === 'admin' && !isMaster) {
              return { error: fail('Só o administrador master pode alterar contas de administrador.', 403) };
            }
            return { target };
          };

          // 1. Editar usuário (nome, e-mail, dias extras de teste, nova senha)
          if (action === 'update_user') {
            const g = await guardTarget(body.targetUserId);
            if ('error' in g) return g.error;
            const { name, email, extendTrialDays, manualPassword } = body;
            let newEmail: string | undefined;
            if (email && email.toLowerCase() !== g.target.email.toLowerCase()) {
              if (!EMAIL_RE.test(email)) return fail('E-mail inválido.', 400);
              const dup = await findUserByEmail(email);
              if (dup && dup.id !== g.target.id) return fail('Já existe uma conta com este e-mail.', 409);
              newEmail = email;
            }
            if (manualPassword && String(manualPassword).length < 6) return fail('A nova senha deve ter ao menos 6 caracteres.', 400);
            const days = extendTrialDays ? Number(extendTrialDays) : undefined;
            if (days !== undefined && (!Number.isFinite(days) || days < 1 || days > 365)) return fail('Dias extras de teste: de 1 a 365.', 400);

            const updated = await adminUpdateUser(g.target.id, {
              name: name || undefined,
              email: newEmail,
              extendTrialDays: days,
              newPasswordHash: manualPassword ? await hashPassword(String(manualPassword)) : undefined,
            });
            invalidateSessionCache(g.target.id);
            await logAdminAction(user, 'editar_usuario', { type: 'usuario', id: g.target.id }, {
              nome: name !== g.target.name ? name : undefined,
              email: newEmail,
              diasExtrasDeTeste: days,
              senhaRedefinida: Boolean(manualPassword),
            });
            return Response.json({ success: true, message: 'Dados do usuário atualizados.', user: updated });
          }

          // 2. Ativar / desativar usuário
          if (action === 'set_user_active') {
            const g = await guardTarget(body.targetUserId);
            if ('error' in g) return g.error;
            const active = Boolean(body.active);
            if (!active && (g.target.id === user.id || isMasterAdmin(g.target, masterConfigured()))) {
              return fail('Esta conta não pode ser desativada.', 400);
            }
            await adminSetUserActive(g.target.id, active);
            invalidateSessionCache(g.target.id);
            await logAdminAction(user, active ? 'reativar_usuario' : 'desativar_usuario', { type: 'usuario', id: g.target.id }, { email: g.target.email });
            return Response.json({ success: true, message: active ? 'Usuário reativado.' : 'Usuário desativado: não consegue mais entrar nem usar o app.' });
          }

          // 3. Dar acesso grátis
          if (action === 'grant_access') {
            const g = await guardTarget(body.targetUserId);
            if ('error' in g) return g.error;
            const days = Number(body.days);
            await adminGrantAccess(g.target.id, days);
            invalidateSessionCache(g.target.id);
            await logAdminAction(user, 'dar_acesso_gratis', { type: 'usuario', id: g.target.id }, { dias: days, email: g.target.email });
            return Response.json({ success: true, message: `Acesso grátis de ${days} dia(s) concedido.` });
          }

          // 4. Cupons
          if (action === 'create_coupon') {
            const { code, discountPercent, discountCents, maxUses, expiresAt } = body;
            if (!code) return fail('Código do cupom é obrigatório.', 400);
            const coupon = await adminCreateCoupon({
              code,
              discountPercent: discountPercent ? Number(discountPercent) : 0,
              discountCents: discountCents ? Number(discountCents) : 0,
              maxUses: maxUses ? Number(maxUses) : 100,
              expiresAt: expiresAt || undefined,
            });
            await logAdminAction(user, 'criar_cupom', { type: 'cupom', id: coupon.id }, { codigo: coupon.code, percentual: coupon.discountPercent, centavos: coupon.discountCents, limite: coupon.maxUses, validade: coupon.expiresAt });
            return Response.json({ success: true, message: 'Cupom criado com sucesso!', coupon });
          }
          if (action === 'toggle_coupon') {
            await adminToggleCoupon(Number(body.couponId), Boolean(body.active));
            await logAdminAction(user, body.active ? 'ativar_cupom' : 'desativar_cupom', { type: 'cupom', id: body.couponId });
            return Response.json({ success: true, message: 'Status do cupom atualizado.' });
          }
          if (action === 'delete_coupon') {
            await adminDeleteCoupon(Number(body.couponId));
            await logAdminAction(user, 'excluir_cupom', { type: 'cupom', id: body.couponId });
            return Response.json({ success: true, message: 'Cupom excluído com sucesso.' });
          }

          // 5. Saques de afiliados
          if (action === 'process_withdrawal') {
            const { withdrawalId, status, notes, receiptReference } = body;
            if (!withdrawalId || !['approved', 'paid', 'rejected'].includes(status)) {
              return fail('ID da solicitação e status válido são obrigatórios.', 400);
            }
            const receiptUrl = body.receiptUrl ? (parseMediaUrl(body.receiptUrl) ? String(body.receiptUrl) : null) : undefined;
            if (receiptUrl === null) return fail('Comprovante inválido. Envie o arquivo de novo.', 400);
            await adminProcessWithdrawal(Number(withdrawalId), status, notes, receiptReference, receiptUrl);
            await logAdminAction(user, `saque_${status}`, { type: 'saque', id: withdrawalId }, { comprovante: receiptReference || undefined, arquivo: receiptUrl ? 'anexado' : undefined });
            return Response.json({
              success: true,
              message: `Saque ${status === 'paid' ? 'marcado como pago' : status === 'approved' ? 'aprovado' : 'recusado'}.`,
            });
          }

          if (action === 'attach_withdrawal_receipt') {
            const receiptUrl = parseMediaUrl(body.receiptUrl) ? String(body.receiptUrl) : null;
            if (!body.withdrawalId || !receiptUrl) return fail('Envie o comprovante (foto ou PDF).', 400);
            await adminAttachWithdrawalReceipt(Number(body.withdrawalId), receiptUrl);
            await logAdminAction(user, 'saque_comprovante', { type: 'saque', id: body.withdrawalId });
            return Response.json({ success: true, message: 'Comprovante anexado. O afiliado já consegue ver.' });
          }

          // 6. Estorno de pedido
          if (action === 'refund_order') {
            const orderReference = String(body.orderReference || '');
            if (!orderReference) return fail('Informe o pedido.', 400);
            const r = await adminRefundOrder(orderReference, Boolean(body.revokeAccess));
            invalidateSessionCache(r.userId);
            await logAdminAction(user, 'estornar_pedido', { type: 'pedido', id: orderReference }, { comissoesRevertidas: r.reversed, comissoesJaPagas: r.alreadyPaid, acessoEncerrado: r.accessRevoked });
            return Response.json({
              success: true,
              message:
                `Pedido estornado no sistema: ${r.reversed} comissão(ões) revertida(s)` +
                (r.alreadyPaid ? `, ${r.alreadyPaid} já paga(s) (descontar de saques futuros)` : '') +
                (r.accessRevoked ? ' e acesso encerrado' : '') +
                '. Atenção: o dinheiro só volta ao cliente se você também reembolsar no painel do Mercado Pago.',
            });
          }

          // 7. Moderação do Feed
          if (action === 'moderate_content') {
            await moderateTarget(String(body.targetType), Number(body.targetId), String(body.moderation));
            await logAdminAction(user, 'moderar_conteudo', { type: String(body.targetType), id: body.targetId }, { acao: body.moderation });
            return Response.json({ success: true, message: 'Moderação aplicada.' });
          }
          if (action === 'set_user_muted') {
            const g = await guardTarget(body.targetUserId);
            if ('error' in g) return g.error;
            await setUserFeedMuted(g.target.id, Boolean(body.muted));
            await logAdminAction(user, body.muted ? 'silenciar_usuario_feed' : 'liberar_usuario_feed', { type: 'usuario', id: g.target.id });
            return Response.json({ success: true, message: body.muted ? 'Usuário silenciado no Feed.' : 'Usuário liberado no Feed.' });
          }
          if (action === 'set_team_active') {
            await adminSetTeamActive(Number(body.teamId), Boolean(body.active));
            await logAdminAction(user, body.active ? 'reativar_equipe' : 'suspender_equipe', { type: 'equipe', id: body.teamId });
            return Response.json({ success: true, message: body.active ? 'Ritus reativado.' : 'Ritus suspenso.' });
          }

          // 8. Administradores: cadastrar exige "Cadastrar administradores"; alterar/remover só o master
          if (action === 'create_admin') {
            const { name, email, password } = body;
            if (!email || !EMAIL_RE.test(String(email).trim())) return fail('Informe um e-mail válido.', 400);
            // ninguém dá permissão que não tem (só o master pode dar tudo)
            const requested: string[] = Array.isArray(body.permissions) ? body.permissions : [];
            const perms = isMaster ? requested : requested.filter((p) => permissions.includes(p as any));
            const existing = await findUserByEmail(String(email).trim());
            if (!existing && !password) {
              // sem conta e sem senha: fica como convite; vira admin quando a pessoa se cadastrar com este e-mail
              await adminInviteAdmin(String(email), perms, user.email);
              await logAdminAction(user, 'convidar_admin', { type: 'convite', id: String(email).toLowerCase() }, { permissoes: perms });
              return Response.json({ success: true, message: 'E-mail cadastrado como administrador. Assim que a pessoa criar a conta no Ritmo com este e-mail, ela já entra como administradora.' });
            }
            if (!existing && String(password).length < 8) return fail('A senha provisória deve ter ao menos 8 caracteres (ou deixe em branco para a pessoa criar a própria).', 400);
            if (!existing && (!name || String(name).trim().length < 2)) return fail('Informe o nome do administrador.', 400);
            const r = await adminCreateAdmin({
              name: String(name || existing?.name || ''),
              email: String(email).trim(),
              passwordHash: existing ? existing.passwordHash : await hashPassword(String(password)),
              permissions: perms,
            });
            await logAdminAction(user, r.promoted ? 'promover_a_admin' : 'criar_admin', { type: 'usuario', id: r.user?.id }, { email: email.toLowerCase(), permissoes: perms });
            return Response.json({
              success: true,
              message: r.promoted ? 'Conta existente promovida a administrador.' : 'Administrador criado. Envie a senha provisória a ele por um canal seguro.',
            });
          }
          if (action === 'cancel_admin_invite') {
            await cancelAdminInvite(String(body.email || ''));
            await logAdminAction(user, 'cancelar_convite_admin', { type: 'convite', id: String(body.email || '').toLowerCase() });
            return Response.json({ success: true, message: 'Convite cancelado.' });
          }
          if (action === 'set_admin_permissions') {
            await adminSetAdminPermissions(Number(body.targetUserId), body.permissions, masterConfigured());
            invalidateSessionCache(Number(body.targetUserId));
            await logAdminAction(user, 'alterar_permissoes_admin', { type: 'usuario', id: body.targetUserId }, { permissoes: body.permissions });
            return Response.json({ success: true, message: 'Permissões atualizadas.' });
          }
          if (action === 'remove_admin') {
            await adminRemoveAdmin(Number(body.targetUserId), masterConfigured());
            invalidateSessionCache(Number(body.targetUserId));
            await logAdminAction(user, 'remover_admin', { type: 'usuario', id: body.targetUserId });
            return Response.json({ success: true, message: 'Perfil de administrador removido.' });
          }

          return fail('Ação administrativa não reconhecida.', 400);
        } catch (e: any) {
          return fail(e.message || 'Erro no servidor.', e?.message && /obrigat|inválid|Informe|Já existe|não pode|Só é possível|não encontrad/i.test(e.message) ? 400 : 500);
        }
      },
    },
  },
});
