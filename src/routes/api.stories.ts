import { createFileRoute } from '@tanstack/react-router';
import { requireMember, communityError } from '../lib/community-auth.js';
import { StoryError, clapStory, createStory, deleteStory, setStoryAuto, startLive, stopLive, storyRail, userStories, viewStory } from '../lib/stories-db.js';

// GET  /api/stories               → faixa de stories (quem tem story no ar)
// GET  /api/stories?user=123      → stories no ar de uma pessoa
// POST /api/stories { action: 'create', card, auto? } | 'live_start' { kind, detail, minutes } | 'live_stop'
//                   | 'view' { storyId } | 'clap' { storyId } | 'delete' { storyId } | 'set_auto' { value }
const fail = (e: any) => (e instanceof StoryError ? Response.json({ error: e.message }, { status: e.status }) : communityError(e));

export const Route = createFileRoute('/api/stories')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const user = await requireMember(request);
          const q = new URL(request.url).searchParams;
          if (q.get('user')) return Response.json(await userStories(user.id, Number(q.get('user'))));
          return Response.json({ rail: await storyRail(user.id), auto: Boolean((user as any).storyAuto) });
        } catch (e) {
          return fail(e);
        }
      },
      POST: async ({ request }) => {
        try {
          const user = await requireMember(request);
          const body = await request.json().catch(() => ({}));
          switch (body.action) {
            case 'create': {
              const auto = body.auto === true;
              // o automático só vale para quem ligou a opção
              if (auto && !(user as any).storyAuto) return Response.json({ success: true, skipped: true });
              const row = await createStory(user.id, body.card, auto);
              return Response.json({ success: true, id: row?.id ?? null });
            }
            case 'live_start':
              if (!(user as any).storyAuto) return Response.json({ success: true, skipped: true });
              await startLive(user.id, body.kind, body.detail, body.minutes);
              return Response.json({ success: true });
            case 'live_stop':
              await stopLive(user.id);
              return Response.json({ success: true });
            case 'view':
              await viewStory(user.id, Number(body.storyId));
              return Response.json({ success: true });
            case 'clap':
              return Response.json({ success: true, ...(await clapStory(user.id, Number(body.storyId))) });
            case 'delete':
              await deleteStory(user.id, Number(body.storyId));
              return Response.json({ success: true });
            case 'set_auto':
              await setStoryAuto(user.id, body.value === true);
              return Response.json({ success: true, auto: body.value === true });
            default:
              return Response.json({ error: 'Ação inválida.' }, { status: 400 });
          }
        } catch (e) {
          return fail(e);
        }
      },
    },
  },
});
