import { createFileRoute } from '@tanstack/react-router';
import { eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import * as schema from '../../db/schema.js';
import { extractTokenFromRequest } from '../lib/auth.js';
import { verifyActiveToken } from '../lib/session.js';
import { findUserById } from '../lib/server-db.js';
import { requireMember, communityError } from '../lib/community-auth.js';
import { CommunityError } from '../lib/community-db.js';
import { effectivePermissions } from '../lib/admin-permissions.js';
import { loadMedia, mediaUrl, saveMedia } from '../lib/media.js';

// GET  /api/media?k=<chave>  → devolve a foto/comprovante (exige login)
// POST /api/media { dataUrl, purpose }  → salva e devolve { url }
export const Route = createFileRoute('/api/media')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const key = new URL(request.url).searchParams.get('k') || '';
        const token = extractTokenFromRequest(request);
        const payload = token ? await verifyActiveToken(token) : null;
        if (!payload) return new Response('Faça login para ver este arquivo.', { status: 401 });
        const row = await loadMedia(key);
        if (!row) return new Response('Arquivo não encontrado.', { status: 404 });

        // Comprovante de Pix: só o administrador ou o dono do saque enxergam.
        if (row.purpose === 'receipt') {
          const user = await findUserById(payload.userId);
          const isAdmin = Boolean(user && effectivePermissions(user, process.env.MASTER_ADMIN_EMAIL).includes('withdrawals'));
          if (!isAdmin) {
            const [w] = await db
              .select({ userId: schema.affiliateWithdrawals.affiliateUserId })
              .from(schema.affiliateWithdrawals)
              .where(eq(schema.affiliateWithdrawals.receiptUrl, mediaUrl(key)));
            if (!w || w.userId !== payload.userId) return new Response('Sem permissão.', { status: 403 });
          }
        }

        const bytes = Buffer.from(row.data, 'base64');
        return new Response(bytes, {
          status: 200,
          headers: {
            'Content-Type': row.mime,
            'Content-Length': String(bytes.length),
            // a chave nunca muda de conteúdo: pode ficar no cache do aparelho
            'Cache-Control': 'private, max-age=31536000, immutable',
            'X-Content-Type-Options': 'nosniff',
            ...(row.mime === 'application/pdf' ? { 'Content-Disposition': `inline; filename="comprovante-${key.slice(0, 8)}.pdf"` } : {}),
          },
        });
      },

      POST: async ({ request }) => {
        try {
          const user = await requireMember(request);
          const body = await request.json().catch(() => ({}));
          const purpose = body.purpose === 'receipt' ? 'receipt' : 'feed';
          if (purpose === 'receipt' && !effectivePermissions(user, process.env.MASTER_ADMIN_EMAIL).includes('withdrawals')) {
            throw new CommunityError(403, 'Só administradores com acesso a Saques enviam comprovantes.');
          }
          const saved = await saveMedia(user.id, body.dataUrl, purpose);
          return Response.json({ success: true, url: saved.url, mime: saved.mime });
        } catch (e) {
          return communityError(e);
        }
      },
    },
  },
});
