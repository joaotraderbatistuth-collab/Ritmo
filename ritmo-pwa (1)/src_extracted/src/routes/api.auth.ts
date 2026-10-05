import { createFileRoute } from '@tanstack/react-router';
import {
  createUserRecord,
  findUserByEmail,
  findUserById,
  updateUserRecord,
  deleteUserData,
  recordAffiliateClick,
  createPasswordResetRequest,
  resetPasswordWithToken,
  updateUserPixKey,
} from '../lib/server-db.js';
import { createToken, extractTokenFromRequest, hashPassword, verifyPassword, verifyToken } from '../lib/auth.js';

export const Route = createFileRoute('/api/auth')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const token = extractTokenFromRequest(request);
        if (!token) {
          return Response.json({ user: null }, { status: 401 });
        }
        const payload = await verifyToken(token);
        if (!payload) {
          return Response.json({ user: null }, { status: 401 });
        }
        const user = await findUserById(payload.userId);
        if (!user) {
          return Response.json({ user: null }, { status: 404 });
        }
        const { passwordHash, ...safeUser } = user;
        return Response.json({ user: safeUser });
      },

      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { action } = body;

          // 1. REGISTER (Includes automatic 7-day trial)
          if (action === 'register') {
            const { name, email, password, referralCode } = body;
            if (!email || !password || !name) {
              return Response.json({ error: 'Nome, e-mail e senha são obrigatórios.' }, { status: 400 });
            }
            if (password.length < 6) {
              return Response.json({ error: 'A senha deve ter no mínimo 6 caracteres.' }, { status: 400 });
            }

            const existing = await findUserByEmail(email);
            if (existing) {
              return Response.json({ error: 'Já existe uma conta com este e-mail.' }, { status: 409 });
            }

            const pHash = await hashPassword(password);
            const myRefCode = 'RITMO-' + Math.random().toString(36).substring(2, 8).toUpperCase();

            const newUser = await createUserRecord({
              name,
              email,
              passwordHash: pHash,
              referralCode: myRefCode,
              referredBy: referralCode || null,
            });

            if (referralCode) {
              await recordAffiliateClick(referralCode);
            }

            const token = await createToken({
              userId: newUser.id,
              email: newUser.email,
              name: newUser.name,
              role: newUser.role,
            });

            const { passwordHash: _, ...safeUser } = newUser;
            return Response.json(
              { user: safeUser, token },
              {
                status: 201,
                headers: {
                  'Set-Cookie': `ritmo_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`,
                },
              }
            );
          }

          // 2. LOGIN
          if (action === 'login') {
            const { email, password } = body;
            if (!email || !password) {
              return Response.json({ error: 'E-mail e senha são obrigatórios.' }, { status: 400 });
            }

            const user = await findUserByEmail(email);
            if (!user) {
              return Response.json({ error: 'Credenciais inválidas. Verifique o e-mail ou crie uma conta.' }, { status: 401 });
            }

            const valid = await verifyPassword(password, user.passwordHash);
            if (!valid) {
              return Response.json({ error: 'Credenciais inválidas. Senha incorreta.' }, { status: 401 });
            }

            const token = await createToken({
              userId: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
            });

            const { passwordHash: _, ...safeUser } = user;
            return Response.json(
              { user: safeUser, token },
              {
                status: 200,
                headers: {
                  'Set-Cookie': `ritmo_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`,
                },
              }
            );
          }

          // 3. LOGOUT
          if (action === 'logout') {
            return Response.json(
              { success: true },
              {
                status: 200,
                headers: {
                  'Set-Cookie': `ritmo_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
                },
              }
            );
          }

          // 4. FORGOT PASSWORD (REQUEST RECOVERY CODE)
          if (action === 'forgot_password') {
            const { email } = body;
            if (!email) {
              return Response.json({ error: 'Informe seu e-mail cadastrado.' }, { status: 400 });
            }

            const res = await createPasswordResetRequest(email);
            if (!res.success) {
              return Response.json({ error: res.error }, { status: 404 });
            }

            return Response.json({
              success: true,
              message: 'Código de recuperação enviado para o seu e-mail.',
              code: res.code, // Returned for instant demo testing
              token: res.token,
            });
          }

          // 5. RESET PASSWORD WITH CODE
          if (action === 'reset_password') {
            const { code, newPassword } = body;
            if (!code || !newPassword) {
              return Response.json({ error: 'Código de recuperação e nova senha são obrigatórios.' }, { status: 400 });
            }
            if (newPassword.length < 6) {
              return Response.json({ error: 'A nova senha deve ter no mínimo 6 caracteres.' }, { status: 400 });
            }

            const pHash = await hashPassword(newPassword);
            const res = await resetPasswordWithToken(code, pHash);
            if (!res.success) {
              return Response.json({ error: res.error }, { status: 400 });
            }

            return Response.json({ success: true, message: 'Senha atualizada com sucesso! Você já pode fazer login.' });
          }

          // 6. UPDATE PIX KEY FOR AFFILIATE
          if (action === 'update_pix') {
            const token = extractTokenFromRequest(request);
            if (!token) return Response.json({ error: 'Não autorizado.' }, { status: 401 });
            const payload = await verifyToken(token);
            if (!payload) return Response.json({ error: 'Sessão expirada.' }, { status: 401 });

            const { pixKey, pixKeyType } = body;
            if (!pixKey) {
              return Response.json({ error: 'Informe uma chave PIX válida.' }, { status: 400 });
            }

            const updated = await updateUserPixKey(payload.userId, pixKey, pixKeyType || 'cpf');
            return Response.json({ success: true, user: updated });
          }

          return Response.json({ error: 'Ação não reconhecida.' }, { status: 400 });
        } catch (e: any) {
          return Response.json({ error: e.message || 'Erro no servidor.' }, { status: 500 });
        }
      },

      PUT: async ({ request }) => {
        const token = extractTokenFromRequest(request);
        if (!token) return Response.json({ error: 'Não autorizado.' }, { status: 401 });
        const payload = await verifyToken(token);
        if (!payload) return Response.json({ error: 'Sessão expirada.' }, { status: 401 });

        const body = await request.json();
        const updated = await updateUserRecord(payload.userId, {
          name: body.name,
          timezone: body.timezone,
          themePreference: body.themePreference,
          whatsappPhone: body.whatsappPhone,
          pixKey: body.pixKey,
          pixKeyType: body.pixKeyType,
        });

        if (!updated) return Response.json({ error: 'Usuário não encontrado.' }, { status: 404 });
        const { passwordHash: _, ...safeUser } = updated;
        return Response.json({ user: safeUser });
      },

      DELETE: async ({ request }) => {
        const token = extractTokenFromRequest(request);
        if (!token) return Response.json({ error: 'Não autorizado.' }, { status: 401 });
        const payload = await verifyToken(token);
        if (!payload) return Response.json({ error: 'Sessão expirada.' }, { status: 401 });

        await deleteUserData(payload.userId);
        return Response.json(
          { success: true, message: 'Dados e conta removidos com sucesso.' },
          {
            headers: {
              'Set-Cookie': `ritmo_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`,
            },
          }
        );
      },
    },
  },
});
