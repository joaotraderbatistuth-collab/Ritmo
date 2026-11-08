import { authorizeData } from '../lib/session.js';
import { createFileRoute } from '@tanstack/react-router';
import { extractTokenFromRequest } from '../lib/auth.js';
import { createTask, deleteTask, getTaskById, getTasks, updateTask } from '../lib/server-db.js';
import { autofillFromTask, cascadeDelete, syncFromTask } from '../lib/autofill-server.js';

export const Route = createFileRoute('/api/tasks')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const token = extractTokenFromRequest(request);
        if (!token) return Response.json({ error: 'Não autorizado.' }, { status: 401 });
        const auth = await authorizeData(token);
        if ('response' in auth) return auth.response;
        const payload = auth.payload;

        const url = new URL(request.url);
        const date = url.searchParams.get('date') || undefined;

        const tasks = await getTasks(payload.userId, date);
        return Response.json({ tasks });
      },

      POST: async ({ request }) => {
        const token = extractTokenFromRequest(request);
        if (!token) return Response.json({ error: 'Não autorizado.' }, { status: 401 });
        const auth = await authorizeData(token);
        if ('response' in auth) return auth.response;
        const payload = auth.payload;

        const body = await request.json();
        if (!body.title) {
          return Response.json({ error: 'Título da tarefa é obrigatório.' }, { status: 400 });
        }

        const task = await createTask(payload.userId, body);
        // preenchimento automático: card no quadro Agenda, provisão (se for conta) e lembretes
        const hint = body.autofillHint && typeof body.autofillHint === 'object' ? body.autofillHint : null;
        const auto = body.autofill === false ? null : await autofillFromTask(payload.userId, task, hint && {
          type: hint.type === 'income' || hint.type === 'expense' ? hint.type : undefined,
          amountCents: Number.isFinite(hint.amountCents) && hint.amountCents > 0 ? Math.round(hint.amountCents) : null,
        });
        const fresh = auto?.items.length ? await getTaskById(payload.userId, task.id) : null;
        return Response.json({ task: fresh || task, auto }, { status: 201 });
      },

      PUT: async ({ request }) => {
        const token = extractTokenFromRequest(request);
        if (!token) return Response.json({ error: 'Não autorizado.' }, { status: 401 });
        const auth = await authorizeData(token);
        if ('response' in auth) return auth.response;
        const payload = auth.payload;

        const body = await request.json();
        if (!body.id) {
          return Response.json({ error: 'ID da tarefa é obrigatório.' }, { status: 400 });
        }

        const { autofill: _a, autofillHint: _h, ...updates } = body;
        const before = await getTaskById(payload.userId, Number(body.id));
        const task = await updateTask(Number(body.id), payload.userId, updates);
        if (!task) return Response.json({ error: 'Tarefa não encontrada.' }, { status: 404 });
        const linked = await syncFromTask(payload.userId, before, task);
        return Response.json({ task, linked });
      },

      DELETE: async ({ request }) => {
        const token = extractTokenFromRequest(request);
        if (!token) return Response.json({ error: 'Não autorizado.' }, { status: 401 });
        const auth = await authorizeData(token);
        if ('response' in auth) return auth.response;
        const payload = auth.payload;

        const url = new URL(request.url);
        const id = url.searchParams.get('id');
        if (!id) return Response.json({ error: 'ID da tarefa é obrigatório.' }, { status: 400 });

        await deleteTask(Number(id), payload.userId);
        const linked = await cascadeDelete(payload.userId, 'task', Number(id));
        return Response.json({ success: true, linked });
      },
    },
  },
});
