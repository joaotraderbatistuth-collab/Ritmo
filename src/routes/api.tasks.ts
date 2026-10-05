import { createFileRoute } from '@tanstack/react-router';
import { extractTokenFromRequest, verifyToken } from '../lib/auth.js';
import { createTask, deleteTask, getTasks, updateTask } from '../lib/server-db.js';

export const Route = createFileRoute('/api/tasks')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const token = extractTokenFromRequest(request);
        if (!token) return Response.json({ error: 'Não autorizado.' }, { status: 401 });
        const payload = await verifyToken(token);
        if (!payload) return Response.json({ error: 'Sessão expirada.' }, { status: 401 });

        const url = new URL(request.url);
        const date = url.searchParams.get('date') || undefined;

        const tasks = await getTasks(payload.userId, date);
        return Response.json({ tasks });
      },

      POST: async ({ request }) => {
        const token = extractTokenFromRequest(request);
        if (!token) return Response.json({ error: 'Não autorizado.' }, { status: 401 });
        const payload = await verifyToken(token);
        if (!payload) return Response.json({ error: 'Sessão expirada.' }, { status: 401 });

        const body = await request.json();
        if (!body.title) {
          return Response.json({ error: 'Título da tarefa é obrigatório.' }, { status: 400 });
        }

        const task = await createTask(payload.userId, body);
        return Response.json({ task }, { status: 201 });
      },

      PUT: async ({ request }) => {
        const token = extractTokenFromRequest(request);
        if (!token) return Response.json({ error: 'Não autorizado.' }, { status: 401 });
        const payload = await verifyToken(token);
        if (!payload) return Response.json({ error: 'Sessão expirada.' }, { status: 401 });

        const body = await request.json();
        if (!body.id) {
          return Response.json({ error: 'ID da tarefa é obrigatório.' }, { status: 400 });
        }

        const task = await updateTask(Number(body.id), payload.userId, body);
        if (!task) return Response.json({ error: 'Tarefa não encontrada.' }, { status: 404 });
        return Response.json({ task });
      },

      DELETE: async ({ request }) => {
        const token = extractTokenFromRequest(request);
        if (!token) return Response.json({ error: 'Não autorizado.' }, { status: 401 });
        const payload = await verifyToken(token);
        if (!payload) return Response.json({ error: 'Sessão expirada.' }, { status: 401 });

        const url = new URL(request.url);
        const id = url.searchParams.get('id');
        if (!id) return Response.json({ error: 'ID da tarefa é obrigatório.' }, { status: 400 });

        await deleteTask(Number(id), payload.userId);
        return Response.json({ success: true });
      },
    },
  },
});
