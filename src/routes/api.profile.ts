import { createFileRoute } from '@tanstack/react-router';
import { getUserXp } from '../lib/xp-server.js';
import { buildGame } from '../lib/game-server.js';
import { MEDALS, PUBLIC_MEDAL_GROUPS } from '../lib/medals.js';
import { division } from '../lib/season.js';
import { hasActiveStory } from '../lib/stories-db.js';
import { requireMember, communityError } from '../lib/community-auth.js';
import { CommunityError, getPublicProfile, listPosts, profileRitus, setBio } from '../lib/community-db.js';

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
          // conquistas ganhas (só de grupos que não expõem saúde, finanças, diário ou treinos) e o lado "jogo" do perfil
          let medals: { id: string; emoji: string; name: string; desc: string; rarity: string; group: string }[] = [];
          let game: Record<string, unknown> | null = null;
          try {
            const xp = await getUserXp(id);
            if (xp) {
              const g = buildGame(id, xp);
              const pub = g.medals.filter((m) => PUBLIC_MEDAL_GROUPS.includes(m.group));
              medals = pub.filter((m) => m.earned).map((m) => ({ id: m.id, emoji: m.emoji, name: m.name, desc: m.desc, rarity: m.rarity, group: m.group }));
              const tier = Number(xp.seasonTier) || 0;
              const d = division(tier);
              const best = division(xp.seasonMaxTier || 0);
              game = {
                activeDays: xp.activeDays,
                streak: { days: g.streak.days, best: Math.max(g.streak.best || 0, g.streak.days || 0) },
                week: { xp: g.week.xp, activeDays: g.week.activeDays },
                medalsEarned: medals.length,
                medalsTotal: MEDALS.filter((m) => PUBLIC_MEDAL_GROUPS.includes(m.group)).length,
                challengesDone: xp.challengesDone,
                division: xp.leagueOptOut ? null : { name: d.name, emoji: d.emoji, color: d.color, best: best.name, bestEmoji: best.emoji },
                pass: { step: g.pass.step },
                seals: g.seals,
                mascot: g.mascot,
              };
            }
          } catch {
            medals = [];
          }
          const [ritus, story] = await Promise.all([profileRitus(id).catch(() => ({ owned: [], member: [] })), hasActiveStory(id)]);
          return Response.json({ profile: profile ? { ...profile, medals, game, ritus, story } : profile, ...feed });
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
