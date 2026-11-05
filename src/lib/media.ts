// Arquivos enviados pelo app: fotos do Feed/Ritus e comprovantes de Pix dos saques.
// Ficam no próprio banco (base64), cada um com uma chave aleatória de 32 caracteres.
// As fotos já chegam comprimidas pelo navegador (lado maior até 1600 px).
import { randomBytes } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import * as schema from '../../db/schema.js';
import { checkDb } from './server-db.js';
import { CommunityError } from './community-db.js';

export const MEDIA_LIMITS = {
  /** Tamanho máximo do arquivo já decodificado. */
  maxBytes: 3 * 1024 * 1024,
  /** Quantas fotos uma pessoa pode enviar por hora (evita abuso). */
  perHour: 30,
} as const;

const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const RECEIPT_MIMES = [...IMAGE_MIMES, 'application/pdf'];

export type MediaPurpose = 'feed' | 'receipt';

import { mediaUrl, parseMediaUrl } from './media-url.js';
export { mediaUrl, parseMediaUrl, isBundledImage } from './media-url.js';

function decodeDataUrl(dataUrl: unknown): { mime: string; base64: string; bytes: number } | null {
  const m = /^data:([a-z]+\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl || ''));
  if (!m) return null;
  const base64 = m[2];
  const bytes = Math.floor((base64.length * 3) / 4) - (base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0);
  return { mime: m[1], base64, bytes };
}

/** Confere a "assinatura" do arquivo: impede mandar outra coisa disfarçada de foto. */
function magicMatches(mime: string, base64: string): boolean {
  const head = Buffer.from(base64.slice(0, 24), 'base64');
  const hex = head.toString('hex');
  switch (mime) {
    case 'image/jpeg':
      return hex.startsWith('ffd8ff');
    case 'image/png':
      return hex.startsWith('89504e47');
    case 'image/gif':
      return hex.startsWith('47494638');
    case 'image/webp':
      return hex.startsWith('52494646') && head.subarray(8, 12).toString() === 'WEBP';
    case 'application/pdf':
      return hex.startsWith('25504446');
    default:
      return false;
  }
}

export async function saveMedia(userId: number, dataUrl: unknown, purpose: MediaPurpose) {
  if (!(await checkDb())) throw new CommunityError(503, 'O envio de arquivos precisa do banco de dados configurado.');
  const file = decodeDataUrl(dataUrl);
  if (!file) throw new CommunityError(400, 'Arquivo inválido. Envie uma foto (JPG, PNG ou WEBP)' + (purpose === 'receipt' ? ' ou um PDF.' : '.'));
  const allowed = purpose === 'receipt' ? RECEIPT_MIMES : IMAGE_MIMES;
  if (!allowed.includes(file.mime) || !magicMatches(file.mime, file.base64)) {
    throw new CommunityError(400, purpose === 'receipt' ? 'Envie o comprovante como foto (JPG/PNG) ou PDF.' : 'Envie uma foto em JPG, PNG ou WEBP.');
  }
  if (file.bytes > MEDIA_LIMITS.maxBytes) throw new CommunityError(413, 'Arquivo grande demais (máximo 3 MB).');

  const recent = await db
    .select({ id: schema.media.id, createdAt: schema.media.createdAt })
    .from(schema.media)
    .where(eq(schema.media.ownerUserId, userId));
  const hourAgo = Date.now() - 3600_000;
  if (recent.filter((r) => new Date(r.createdAt as any).getTime() > hourAgo).length >= MEDIA_LIMITS.perHour) {
    throw new CommunityError(429, 'Muitos envios seguidos. Tente de novo daqui a pouco.');
  }

  const key = randomBytes(16).toString('hex');
  await db.insert(schema.media).values({ key, ownerUserId: userId, purpose, mime: file.mime, data: file.base64, sizeBytes: file.bytes });
  return { key, url: mediaUrl(key), mime: file.mime };
}

export async function loadMedia(key: string) {
  if (!/^[a-f0-9]{32}$/.test(key)) return null;
  if (!(await checkDb())) return null;
  const [row] = await db.select().from(schema.media).where(eq(schema.media.key, key));
  return row || null;
}

/** A foto pertence a esta pessoa? (só se pode publicar foto que você mesmo enviou) */
export async function mediaOwnedBy(url: unknown, userId: number): Promise<boolean> {
  const key = parseMediaUrl(url);
  if (!key) return false;
  const [row] = await db
    .select({ id: schema.media.id })
    .from(schema.media)
    .where(and(eq(schema.media.key, key), eq(schema.media.ownerUserId, userId)));
  return Boolean(row);
}
