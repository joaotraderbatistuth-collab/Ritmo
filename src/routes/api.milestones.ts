import { createFileRoute } from '@tanstack/react-router';
import { extractTokenFromRequest, verifyToken } from '../lib/auth.js';
import {
  getMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  generateRoadmapForCycle,
} from '../lib/server-db.js';

// Roteiro de metas de um ciclo. Toda função do banco já confere que o ciclo/marco pertence
// ao usuário da sessão, então trocar IDs na requisição não dá acesso a dados de outra pessoa.
async function getUserId(request: Request): Promise<{ userId: number } | { error: Response }> {
  const token = extractTokenFromRequest(request);
  if (!token) return { error: Response.json({ error: 'Não autorizado.' }, { status: 401 }) };
  const payload = await verifyToken(token);
  if (!payload) return { error: Response.json({ error: 'Sessão expirada.' }, { status: 401 }) };
  return { userId: payload.userId };
}

export const Route = createFileRoute('/api/milestones')({
  server: {
    handlers: {
      // GET /api/milestones?cycleId=X
      GET: async ({ request }) => {
        const auth = await getUserId(request);
        if ('error' in auth) return auth.error;
        const cycleId = Number(new URL(request.url).searchParams.get('cycleId'));
        if (!cycleId) return Response.json({ error: 'cycleId é obrigatório.' }, { status: 400 });
        const milestones = await getMilestones(auth.userId, cycleId);
        return Response.json({ milestones });
      },

      POST: async ({ request }) => {
        const auth = await getUserId(request);
        if ('error' in auth) return auth.error;
        const { userId } = auth;

        try {
          const body = await request.json();
          const { action } = body;

          if (action === 'generate' || action === 'regenerate') {
            if (!body.cycleId) return Response.json({ error: 'cycleId é obrigatório.' }, { status: 400 });
            const milestones = await generateRoadmapForCycle(userId, Number(body.cycleId), action === 'regenerate');
            if (milestones.length === 0) return Response.json({ error: 'Ciclo não encontrado.' }, { status: 404 });
            return Response.json({ success: true, milestones });
          }

          if (action === 'create') {
            const title = String(body.title || '').trim();
            if (!body.cycleId || !title) {
              return Response.json({ error: 'Ciclo e título do marco são obrigatórios.' }, { status: 400 });
            }
            const milestone = await createMilestone(userId, Number(body.cycleId), {
              title: title.slice(0, 160),
              description: String(body.description || '').slice(0, 800),
              targetDay: Number(body.targetDay) || 1,
            });
            if (!milestone) return Response.json({ error: 'Ciclo não encontrado.' }, { status: 404 });
            return Response.json({ success: true, milestone }, { status: 201 });
          }

          if (action === 'update') {
            if (!body.milestoneId) return Response.json({ error: 'ID do marco é obrigatório.' }, { status: 400 });
            const updates: Record<string, unknown> = {};
            if (body.title !== undefined) {
              const t = String(body.title).trim();
              if (!t) return Response.json({ error: 'O título não pode ficar vazio.' }, { status: 400 });
              updates.title = t.slice(0, 160);
            }
            if (body.description !== undefined) updates.description = String(body.description).slice(0, 800);
            if (body.targetDay !== undefined) updates.targetDay = Number(body.targetDay);
            if (body.done !== undefined) updates.done = Boolean(body.done);
            const milestone = await updateMilestone(userId, Number(body.milestoneId), updates as any);
            if (!milestone) return Response.json({ error: 'Marco não encontrado.' }, { status: 404 });
            return Response.json({ success: true, milestone });
          }

          if (action === 'delete') {
            if (!body.milestoneId) return Response.json({ error: 'ID do marco é obrigatório.' }, { status: 400 });
            await deleteMilestone(userId, Number(body.milestoneId));
            return Response.json({ success: true });
          }

          return Response.json({ error: 'Ação não reconhecida.' }, { status: 400 });
        } catch (e: any) {
          return Response.json({ error: e.message || 'Erro no servidor.' }, { status: 500 });
        }
      },
    },
  },
});
