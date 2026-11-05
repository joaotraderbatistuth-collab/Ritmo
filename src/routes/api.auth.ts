import { createFileRoute } from '@tanstack/react-router';
import {
  createUserRecord,
  findUserByEmail,
  findUserById,
  updateUserRecord,
  deleteUserData,
  consumeAdminInvite,
  recordAffiliateClick,
  createPasswordResetRequest,
  resetPasswordWithToken,
  updateUserPixKey,
} from '../lib/server-db.js';
import { createToken, extractTokenFromRequest, hashPassword, verifyPassword, verifyToken } from '../lib/auth.js';
import { verifyActiveToken } from '../lib/session.js';
import { grantConsent } from '../lib/consents-db.js';
import { sendPasswordResetEmail } from '../lib/email.js';
import { computeAccess } from '../lib/access.js';
import { isMasterEmail } from '../lib/admin-permissions.js';

// Promove a administrador: o e-mail MASTER (padrão batistuth@live.com, ou MASTER_ADMIN_EMAIL na Netlify)
// e quem estiver em ADMIN_EMAILS (separados por vírgula). O master sempre tem todas as permissões.
// IMPORTANTE: crie a conta do master assim que publicar, antes de divulgar o site.
async function promoteIfAdminEmail<T extends { id: number; email: string; role?: string | null; subscriptionStatus?: string | null }>(user: T): Promise<T> {
  const list = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const master = isMasterEmail(user.email, process.env.MASTER_ADMIN_EMAIL);
  // o master é sempre admin, ativo e sem período de teste (nunca fica desativado nem em trial)
  if (master) {
    const fix: { role?: string; subscriptionStatus?: string; trialEndsAt?: null } = {};
    if (user.role !== 'admin') fix.role = 'admin';
    if (user.subscriptionStatus !== 'active') fix.subscriptionStatus = 'active';
    if ((user as any).trialEndsAt) fix.trialEndsAt = null;
    if (Object.keys(fix).length) {
      await updateUserRecord(user.id, fix as any);
      return { ...user, ...fix } as T;
    }
    return user;
  }
  if (user.role !== 'admin' && list.includes(user.email.toLowerCase())) {
    await updateUserRecord(user.id, { role: 'admin' });
    return { ...user, role: 'admin' };
  }
  // e-mail cadastrado como administrador no painel (convite): vira admin com as permissões escolhidas
  if (user.role !== 'admin') {
    const invited = await consumeAdminInvite(user.email);
    if (invited !== null) {
      await updateUserRecord(user.id, { role: 'admin', adminPermissions: invited, subscriptionStatus: 'active' } as any);
      return { ...user, role: 'admin', subscriptionStatus: 'active' };
    }
  }
  return user;
}

// Cookie de sessão: HttpOnly sempre; Secure quando o site é servido por HTTPS (produção).
function sessionCookie(request: Request, token: string) {
  const secure = new URL(request.url).protocol === 'https:' ? '; Secure' : '';
  return `ritmo_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${secure}`;
}

// Hash bcrypt de uma senha aleatória: usado quando o e-mail não existe, para o login levar o mesmo tempo.
const DUMMY_HASH = '$2b$10$WHe14fqQUg8zEs7QkPcFuupIb0Vj1hzAKleoSiUOtmPZBHlD3IEdy';

// Limite de tentativas de login por e-mail (por servidor): 8 erros em 15 minutos bloqueiam por 15 minutos.
const LOGIN_FAILS = new Map<string, number[]>();
const LOGIN_WINDOW = 15 * 60_000;
function recentFails(key: string) {
  const now = Date.now();
  const list = (LOGIN_FAILS.get(key) || []).filter((t) => now - t < LOGIN_WINDOW);
  LOGIN_FAILS.set(key, list);
  return list;
}
function loginLocked(key: string) {
  return recentFails(key).length >= 8;
}
function registerLoginFailure(key: string) {
  recentFails(key).push(Date.now());
  if (LOGIN_FAILS.size > 5000) LOGIN_FAILS.clear();
}
function clearLoginFailures(key: string) {
  LOGIN_FAILS.delete(key);
}

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
        const found = await findUserById(payload.userId);
        if (!found) {
          return Response.json({ user: null }, { status: 404 });
        }
        const user = await promoteIfAdminEmail(found);
        if (user.subscriptionStatus === 'suspended') {
          return Response.json({ user: null, error: 'Esta conta está desativada. Fale com o suporte.' }, { status: 401 });
        }
        const { passwordHash, ...safeUser } = user;
        return Response.json({ user: { ...safeUser, access: computeAccess(user) } });
      },

      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { action } = body;

          // 1. REGISTER (Includes automatic 7-day trial)
          if (action === 'register') {
            const { name, email, password, referralCode, acceptedTerms } = body;
            if (!acceptedTerms) {
              return Response.json({ error: 'É necessário aceitar os Termos de Uso e a Política de Privacidade.' }, { status: 400 });
            }
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

            const createdUser = await createUserRecord({
              name,
              email,
              passwordHash: pHash,
              referralCode: myRefCode,
              referredBy: referralCode || null,
            });
            const newUser = await promoteIfAdminEmail(createdUser);
            // registra o aceite (versão e data) dos Termos, da Política e do uso dos dados de bem-estar
            await grantConsent(newUser.id, 'termos').catch(() => null);
            await grantConsent(newUser.id, 'saude').catch(() => null);

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
                  'Set-Cookie': sessionCookie(request, token),
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

            // muitas tentativas erradas seguidas para o mesmo e-mail: espera um pouco
            const lockKey = String(email).toLowerCase().trim();
            if (loginLocked(lockKey)) {
              return Response.json({ error: 'Muitas tentativas. Aguarde 15 minutos ou use "Esqueci a senha".' }, { status: 429 });
            }

            // A mesma mensagem (e o mesmo tempo de resposta) para e-mail inexistente ou senha errada:
            // assim ninguém descobre quem tem conta no Ritmo.
            const foundUser = await findUserByEmail(email);
            const valid = await verifyPassword(password, foundUser?.passwordHash || DUMMY_HASH);
            if (!foundUser || !valid) {
              registerLoginFailure(lockKey);
              return Response.json({ error: 'E-mail ou senha incorretos.' }, { status: 401 });
            }
            clearLoginFailures(lockKey);
            const user = await promoteIfAdminEmail(foundUser);
            if (user.subscriptionStatus === 'suspended') {
              return Response.json({ error: 'Esta conta está desativada. Fale com o suporte.' }, { status: 403 });
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
                  'Set-Cookie': sessionCookie(request, token),
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

            // A resposta é SEMPRE a mesma, exista ou não o e-mail: assim ninguém descobre quem tem conta.
            const generic = {
              success: true,
              message: 'Se este e-mail estiver cadastrado, enviamos um código de 6 dígitos. Confira também a caixa de spam.',
            };

            // tempo de resposta igual para e-mail existente ou não (o envio do e-mail demora)
            const started = Date.now();
            const respond = async (body: object) => {
              const wait = 1800 - (Date.now() - started);
              if (wait > 0) await new Promise((r) => setTimeout(r, wait));
              return Response.json(body);
            };

            const res = await createPasswordResetRequest(email);
            if (!res.send) return respond(generic);

            const emailResult = await sendPasswordResetEmail(res.email!, res.userName || '', res.code!);
            if (emailResult.sent) return respond(generic);

            console.warn('[auth] Envio de e-mail de recuperação não configurado:', emailResult.error);
            // O código só volta na resposta em ambiente de desenvolvimento. Em produção NUNCA:
            // senão qualquer pessoa conseguiria trocar a senha de qualquer conta.
            const isProduction = process.env.NODE_ENV === 'production' || Boolean(process.env.NETLIFY);
            if (!isProduction) {
              return respond({ ...generic, demoMode: true, code: res.code });
            }
            return respond(generic);
          }

          // 5. RESET PASSWORD WITH CODE
          if (action === 'reset_password') {
            const { email, code, newPassword } = body;
            if (!email || !code || !newPassword) {
              return Response.json({ error: 'E-mail, código de recuperação e nova senha são obrigatórios.' }, { status: 400 });
            }
            if (newPassword.length < 6) {
              return Response.json({ error: 'A nova senha deve ter no mínimo 6 caracteres.' }, { status: 400 });
            }

            const pHash = await hashPassword(newPassword);
            const res = await resetPasswordWithToken(email, code, pHash);
            if (!res.success) {
              return Response.json({ error: res.error }, { status: 400 });
            }

            return Response.json({ success: true, message: 'Senha atualizada com sucesso! Você já pode fazer login.' });
          }

          // 6. UPDATE PIX KEY FOR AFFILIATE
          if (action === 'update_pix') {
            const token = extractTokenFromRequest(request);
            if (!token) return Response.json({ error: 'Não autorizado.' }, { status: 401 });
            const payload = await verifyActiveToken(token);
            if (!payload) return Response.json({ error: 'Sessão expirada.' }, { status: 401 });

            const { pixKey, pixKeyType } = body;
            if (!pixKey) {
              return Response.json({ error: 'Informe uma chave PIX válida.' }, { status: 400 });
            }

            try {
              const updated = await updateUserPixKey(payload.userId, pixKey, pixKeyType || 'cpf');
              return Response.json({ success: true, user: updated });
            } catch (e: any) {
              return Response.json({ error: e.message || 'Chave Pix inválida.' }, { status: 400 });
            }
          }

          return Response.json({ error: 'Ação não reconhecida.' }, { status: 400 });
        } catch (e: any) {
          return Response.json({ error: e.message || 'Erro no servidor.' }, { status: 500 });
        }
      },

      PUT: async ({ request }) => {
        const token = extractTokenFromRequest(request);
        if (!token) return Response.json({ error: 'Não autorizado.' }, { status: 401 });
        const payload = await verifyActiveToken(token);
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
