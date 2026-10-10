import bcrypt from 'bcryptjs';
import { SignJWT, jwtVerify } from 'jose';

// Em produção (Netlify) o JWT_SECRET é obrigatório: sem ele qualquer pessoa conseguiria forjar logins.
// Só em desenvolvimento local usamos uma chave de teste.
let cachedSecret: Uint8Array | null = null;
function getSecret(): Uint8Array {
  if (cachedSecret) return cachedSecret;
  const fromEnv = process.env.JWT_SECRET;
  const isProd = process.env.NODE_ENV === 'production' || Boolean(process.env.NETLIFY);
  if (!fromEnv && isProd) {
    throw new Error('JWT_SECRET não configurado. Defina a variável de ambiente no painel da Netlify.');
  }
  cachedSecret = new TextEncoder().encode(fromEnv || 'ritmo-dev-only-secret-nao-usar-em-producao');
  return cachedSecret;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export interface TokenPayload {
  userId: number;
  email: string;
  name: string;
  role?: string;
}

export async function createToken(payload: TokenPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      userId: Number(payload.userId),
      email: String(payload.email),
      name: String(payload.name),
      role: payload.role ? String(payload.role) : 'user',
    };
  } catch {
    return null;
  }
}

export function extractTokenFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Also check cookie
  const cookieHeader = request.headers.get('Cookie');
  if (cookieHeader) {
    const match = cookieHeader.match(/ritmo_token=([^;]+)/);
    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}
