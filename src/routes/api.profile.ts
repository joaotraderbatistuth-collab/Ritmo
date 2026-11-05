import { createFileRoute } from '@tanstack/react-router';
import { requireMember, communityError } from '../lib/community-auth.js';
import { CommunityError, getPublicProfile, listPosts, setBio } from '../lib/community-db.js';

// GET  /api/profile?id=123[&before=456]  → perfil público + publicações do Feed geral dessa pessoa
// POST /api/profile { action: 'set_bio', bio }  → muda a bio do próprio perfil
export const Route = createFileRoute('/api/profile')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const user = await requireMember(request);
          const q = new URL(request.url).searchParams;
          const id = Number(q.get('id'));
          if (!Number.isInteger(id) || id <= 0) throw new CommunityError(400, 'Perfil inválido.');
          const before = q.get('before') ? Number(q.get('before')) : undefined;
          const feed = await listPosts(user.id, { authorId: id, beforeId: before, limit: 10 });
          if (before) return Response.json(feed);
          const profile = await getPublicProfile(user.id, id);
          return Response.json({ profile, ...feed });
        } catch (e) {
          return communityError(e);
        }
      },

      POST: async ({ request }) => {
        try {
          const user = await requireMember(request);
          const body = await request.json().catch(() => ({}));
          if (body.action === 'set_bio') {
            const bio = await setBio(user.id, body.bio);
            return Response.json({ success: true, bio, message: bio ? 'Bio atualizada!' : 'Bio removida.' });
          }
          throw new CommunityError(400, 'Ação não reconhecida.');
        } catch (e) {
          return communityError(e);
        }
      },
    },
  },
});
