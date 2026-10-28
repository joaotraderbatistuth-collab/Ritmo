import { createFileRoute } from '@tanstack/react-router';
import { extractTokenFromRequest, hashPassword, verifyToken } from '../lib/auth.js';
import {
  findUserById,
  getAdminDashboardData,
  adminUpdateUser,
  adminCreateCoupon,
  adminToggleCoupon,
  adminDeleteCoupon,
  adminProcessWithdrawal,
} from '../lib/server-db.js';

export const Route = createFileRoute('/api/admin')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const token = extractTokenFromRequest(request);
        if (!token) {
          return Response.json({ error: 'Acesso restrito. Faça login como administrador.' }, { status: 401 });
        }

        const payload = await verifyToken(token);
        if (!payload) {
          return Response.json({ error: 'Sessão expirada.' }, { status: 401 });
        }

        const user = await findUserById(payload.userId);
        if (!user || user.role !== 'admin') {
          return Response.json(
            { error: 'Acesso negado. Esta área é restrita a administradores do Ritmo.' },
            { status: 403 }
          );
        }

        const data = await getAdminDashboardData();
        return Response.json({
          success: true,
          adminUser: { id: user.id, name: user.name, email: user.email, role: user.role },
          ...data,
        });
      },

      POST: async ({ request }) => {
        try {
          const token = extractTokenFromRequest(request);
          if (!token) {
            return Response.json({ error: 'Acesso restrito.' }, { status: 401 });
          }

          const payload = await verifyToken(token);
          if (!payload) {
            return Response.json({ error: 'Sessão expirada.' }, { status: 401 });
          }

          const user = await findUserById(payload.userId);
          if (!user || user.role !== 'admin') {
            return Response.json({ error: 'Acesso negado. Restrito a administradores.' }, { status: 403 });
          }

          const body = await request.json();
          const { action } = body;

          // 1. UPDATE USER
          if (action === 'update_user') {
            const { targetUserId, name, email, role, subscriptionStatus, extendTrialDays, manualPassword } = body;
            if (!targetUserId) {
              return Response.json({ error: 'ID do usuário alvo é obrigatório.' }, { status: 400 });
            }

            let newPasswordHash: string | undefined = undefined;
            if (manualPassword && manualPassword.length >= 6) {
              newPasswordHash = await hashPassword(manualPassword);
            }

            const updated = await adminUpdateUser(Number(targetUserId), {
              name,
              email,
              role,
              subscriptionStatus,
              extendTrialDays: extendTrialDays ? Number(extendTrialDays) : undefined,
              newPasswordHash,
            });

            return Response.json({
              success: true,
              message: 'Dados do usuário atualizados com sucesso pelo administrador.',
              user: updated,
            });
          }

          // 2. CREATE DISCOUNT COUPON
          if (action === 'create_coupon') {
            const { code, discountPercent, discountCents, maxUses, expiresAt } = body;
            if (!code) {
              return Response.json({ error: 'Código do cupom é obrigatório.' }, { status: 400 });
            }

            const coupon = await adminCreateCoupon({
              code,
              discountPercent: discountPercent ? Number(discountPercent) : 0,
              discountCents: discountCents ? Number(discountCents) : 0,
              maxUses: maxUses ? Number(maxUses) : 100,
              expiresAt,
            });

            return Response.json({ success: true, message: 'Cupom criado com sucesso!', coupon });
          }

          // 3. TOGGLE COUPON ACTIVE STATE
          if (action === 'toggle_coupon') {
            const { couponId, active } = body;
            await adminToggleCoupon(Number(couponId), Boolean(active));
            return Response.json({ success: true, message: 'Status do cupom atualizado.' });
          }

          // 4. DELETE COUPON
          if (action === 'delete_coupon') {
            const { couponId } = body;
            await adminDeleteCoupon(Number(couponId));
            return Response.json({ success: true, message: 'Cupom excluído com sucesso.' });
          }

          // 5. PROCESS AFFILIATE WITHDRAWAL
          if (action === 'process_withdrawal') {
            const { withdrawalId, status, notes, receiptReference } = body;
            if (!withdrawalId || !status) {
              return Response.json({ error: 'ID da solicitação e status são obrigatórios.' }, { status: 400 });
            }

            await adminProcessWithdrawal(
              Number(withdrawalId),
              status,
              notes,
              receiptReference
            );

            return Response.json({
              success: true,
              message: `Saque ${status === 'paid' ? 'pago com sucesso' : status === 'approved' ? 'aprovado' : 'rejeitado'}.`,
            });
          }

          return Response.json({ error: 'Ação administrativa não reconhecida.' }, { status: 400 });
        } catch (e: any) {
          return Response.json({ error: e.message || 'Erro no servidor.' }, { status: 500 });
        }
      },
    },
  },
});
