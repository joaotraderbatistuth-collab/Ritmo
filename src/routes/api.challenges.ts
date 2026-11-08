import { createFileRoute } from '@tanstack/react-router';
import { requireMember, communityError } from '../lib/community-auth.js';
import { CommunityError } from '../lib/community-db.js';
import { createChallenge, followingForInvite, joinChallenge, listChallenges, previewChallenge, setMemberStatus } from '../lib/challenges-db.js';
import { getUserXp } from '../lib/xp-server.js';

// Desafios em dupla ou trio.
// GET  /api/challenges                 → meus desafios (ativos, convites e recentes) com o progresso de cada um
// GET  /api/challenges?following=1     → pessoas que eu sigo (para convidar)
// GET  /api/challenges?code=ABC2345    → prévia do convite
// POST { action: 'create', kind, days, target, title?, invite?: number[] }
// POST { action: 'join', code } · { action: 'accept'|'decline'|'leave', id }
export const Route = createFileRoute('/api/challenges')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const user = await requireMember(request);
          const q = new URL(request.url).searchParams;
          if (q.get('following')) return Response.json({ people: await followingForInvite(user.id) });
          const code = q.get('code');
          if (code) return Response.json({ challenge: await previewChallenge(code.toUpperCase()) });
          const xp = await getUserXp(user.id);
          if (!xp) throw new CommunityError(401, 'Sessão expirada.');
          return Response.json({ challenges: await listChallenges(user.id, xp.today, xp) });
        } catch (e) {
          return communityError(e);
        }
      },
      POST: async ({ request }) => {
        try {
          const user = await requireMember(request);
          const body = await request.json().catch(() => ({}));
          const xp = await getUserXp(user.id);
          if (!xp) throw new CommunityError(401, 'Sessão expirada.');
          const today = xp.today;
          if (body.action === 'create') {
            const c = await createChallenge(user.id, today, body);
            return Response.json({ success: true, id: c.id, code: c.code, message: 'Desafio criado! Mande o link para quem você quer desafiar.' });
          }
          if (body.action === 'join') {
            await joinChallenge(user.id, today, String(body.code || '').toUpperCase());
            return Response.json({ success: true, message: 'Você entrou no desafio. Bora!' });
          }
          if (body.action === 'accept' || body.action === 'decline' || body.action === 'leave') {
            const status = body.action === 'accept' ? 'active' : body.action === 'decline' ? 'declined' : 'left';
            await setMemberStatus(user.id, Number(body.id), status, today);
            return Response.json({ success: true });
          }
          throw new CommunityError(400, 'Ação não reconhecida.');
        } catch (e) {
          return communityError(e);
        }
      },
    },
  },
});
