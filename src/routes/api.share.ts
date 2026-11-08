import { createFileRoute } from '@tanstack/react-router';
import { requireMember, communityError } from '../lib/community-auth.js';
import { ShareError, createShare, myRecentShares, myShareStats, setShareImage } from '../lib/share-db.js';

// POST /api/share { action: 'create', card }        → { slug, url } link público da conquista
// POST /api/share { action: 'image', slug, image }  → guarda a prévia (JPEG) para o WhatsApp
// GET  /api/share                                   → números: visualizações e amigos que entraram pelo link
const fail = (e: any) => (e instanceof ShareError ? Response.json({ error: e.message }, { status: e.status }) : communityError(e));

export const Route = createFileRoute('/api/share')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const user = await requireMember(request);
          const [stats, recent] = await Promise.all([myShareStats(user.id), myRecentShares(user.id)]);
          return Response.json({ stats, recent, referralCode: user.referralCode });
        } catch (e) {
          return fail(e);
        }
      },
      POST: async ({ request }) => {
        try {
          const user = await requireMember(request);
          const body = await request.json().catch(() => ({}));
          if (body.action === 'create') {
            const { slug } = await createShare(user.id, body.card);
            const origin = new URL(request.url).origin;
            return Response.json({ slug, url: `${origin}/c/${slug}`, referralCode: user.referralCode });
          }
          if (body.action === 'image') {
            await setShareImage(user.id, body.slug, body.image);
            return Response.json({ success: true });
          }
          return Response.json({ error: 'Ação inválida.' }, { status: 400 });
        } catch (e) {
          return fail(e);
        }
      },
    },
  },
});
