import { createFileRoute } from '@tanstack/react-router';
import { extractTokenFromRequest } from '../lib/auth.js';
import { authorizeData } from '../lib/session.js';
import { requireMember, communityError } from '../lib/community-auth.js';
import { CommunityError } from '../lib/community-db.js';
import { mediaOwnedBy, parseMediaUrl, mediaUrl } from '../lib/media.js';
import { updateUserRecord } from '../lib/server-db.js';
import { getUserXp } from '../lib/xp-server.js';

// GET  /api/xp                          → pontos, nível, progresso e foto de perfil
// POST /api/xp { action: 'set_avatar', imageUrl }   → define a foto de perfil (enviada antes em /api/media)
// POST /api/xp { action: 'remove_avatar' }          → volta para as iniciais
export const Route = createFileRoute('/api/xp')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await authorizeData(extractTokenFromRequest(request));
        if ('response' in auth) return auth.response;
        const payload = auth.payload;
        try {
          const xp = await getUserXp(payload.userId);
          if (!xp) return Response.json({ error: 'Sessão expirada.' }, { status: 401 });
          return Response.json({
            xp: xp.total,
            todayXp: xp.todayXp,
            activeDays: xp.activeDays,
            breakdown: xp.breakdown,
            level: xp.info,
            avatarUrl: xp.avatarUrl,
            bio: xp.bio,
          });
        } catch (e) {
          console.error('[xp]', e);
          return Response.json({ error: 'Não foi possível calcular seus pontos agora.' }, { status: 500 });
        }
      },

      POST: async ({ request }) => {
        try {
          const user = await requireMember(request);
          const body = await request.json().catch(() => ({}));
          if (body.action === 'set_avatar') {
            const key = parseMediaUrl(body.imageUrl);
            if (!key || !(await mediaOwnedBy(body.imageUrl, user.id))) throw new CommunityError(400, 'Envie a foto de novo.');
            await updateUserRecord(user.id, { avatarUrl: mediaUrl(key) } as any);
            return Response.json({ success: true, avatarUrl: mediaUrl(key), message: 'Foto de perfil atualizada!' });
          }
          if (body.action === 'remove_avatar') {
            await updateUserRecord(user.id, { avatarUrl: null } as any);
            return Response.json({ success: true, avatarUrl: null, message: 'Foto removida.' });
          }
          throw new CommunityError(400, 'Ação não reconhecida.');
        } catch (e) {
          return communityError(e);
        }
      },
    },
  },
});
