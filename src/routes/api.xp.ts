import { createFileRoute } from '@tanstack/react-router';
import { extractTokenFromRequest } from '../lib/auth.js';
import { authorizeData } from '../lib/session.js';
import { requireMember, communityError } from '../lib/community-auth.js';
import { CommunityError } from '../lib/community-db.js';
import { mediaOwnedBy, parseMediaUrl, mediaUrl } from '../lib/media.js';
import { updateUserRecord } from '../lib/server-db.js';
import { getUserXp } from '../lib/xp-server.js';
import { buildGame, openChest, syncLeague } from '../lib/game-server.js';

// GET  /api/xp                          → pontos, nível, progresso e foto de perfil
// POST /api/xp { action: 'set_avatar', imageUrl }   → define a foto de perfil (enviada antes em /api/media)
// POST /api/xp { action: 'remove_avatar' }          → volta para as iniciais
// POST /api/xp { action: 'open_chest' }             → abre o baú do dia (3 missões cumpridas)
// POST /api/xp { action: 'league_opt_out', value }  → sai ou volta para as ligas semanais
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
            bonusXp: xp.bonusXp,
            xp: xp.total,
            todayXp: xp.todayXp,
            luckyToday: xp.luckyToday,
            activeDays: xp.activeDays,
            breakdown: xp.breakdown,
            level: xp.info,
            avatarUrl: xp.avatarUrl,
            bio: xp.bio,
            today: xp.today,
            ...buildGame(payload.userId, xp),
            league: await syncLeague(payload.userId, xp),
            leagueOptOut: xp.leagueOptOut,
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
          if (body.action === 'open_chest') {
            const xp = await getUserXp(user.id);
            if (!xp) throw new CommunityError(401, 'Sessão expirada.');
            const r = await openChest(user.id, xp);
            if (!r.ok) throw new CommunityError(400, r.error);
            return Response.json({ success: true, reward: r.reward });
          }
          if (body.action === 'league_opt_out') {
            await updateUserRecord(user.id, { leagueOptOut: Boolean(body.value) } as any);
            return Response.json({ success: true, leagueOptOut: Boolean(body.value) });
          }
          throw new CommunityError(400, 'Ação não reconhecida.');
        } catch (e) {
          return communityError(e);
        }
      },
    },
  },
});
