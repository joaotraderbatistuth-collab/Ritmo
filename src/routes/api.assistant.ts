import { createFileRoute } from '@tanstack/react-router';
import { extractTokenFromRequest } from '../lib/auth.js';
import { authorizeData } from '../lib/session.js';
import { findUserById, updateUserRecord } from '../lib/server-db.js';
import { cleanAssistantName } from '../lib/assistant-parser.js';
import { isValidRepeat } from '../lib/recurrence.js';
import { REMINDER_LIMITS, countRecentReminders, createReminder, finishReminder, listReminders } from '../lib/reminders-db.js';

// GET  /api/assistant                                   → nome do secretário + lembretes ativos
// POST /api/assistant { action: 'set_name', name }
// POST /api/assistant { action: 'add_reminder', text, remindAt, taskId?, repeat? }
// POST /api/assistant { action: 'done_reminder', id }
export const Route = createFileRoute('/api/assistant')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const auth = await authorizeData(extractTokenFromRequest(request));
        if ('response' in auth) return auth.response;
        const user = await findUserById(auth.payload.userId);
        return Response.json({ name: (user as any)?.assistantName || '', reminders: await listReminders(auth.payload.userId) });
      },

      POST: async ({ request }) => {
        const auth = await authorizeData(extractTokenFromRequest(request));
        if ('response' in auth) return auth.response;
        const userId = auth.payload.userId;
        const body = await request.json().catch(() => ({}));

        if (body.action === 'set_name') {
          const name = cleanAssistantName(body.name);
          if (!name) return Response.json({ error: 'Escolha um nome com letras.' }, { status: 400 });
          await updateUserRecord(userId, { assistantName: name } as any);
          return Response.json({ success: true, name });
        }

        if (body.action === 'add_reminder') {
          const text = String(body.text ?? '').replace(/[\u0000-\u001F\u007F]/g, '').trim().slice(0, REMINDER_LIMITS.textMax);
          const at = new Date(String(body.remindAt || ''));
          if (!text) return Response.json({ error: 'Diga do que devo te lembrar.' }, { status: 400 });
          if (Number.isNaN(at.getTime()) || at.getTime() < Date.now() - 5 * 60_000 || at.getTime() > Date.now() + 400 * 86400_000) {
            return Response.json({ error: 'Horário do lembrete inválido.' }, { status: 400 });
          }
          if ((await countRecentReminders(userId)) >= REMINDER_LIMITS.activeMax) return Response.json({ error: 'Você já tem muitos lembretes ativos.' }, { status: 429 });
          const taskId = Number.isInteger(body.taskId) ? body.taskId : null;
          const repeat = isValidRepeat(body.repeat) ? body.repeat : null;
          return Response.json({ success: true, reminder: await createReminder(userId, { text, remindAt: at, taskId, repeat }) });
        }

        if (body.action === 'done_reminder') {
          const ok = await finishReminder(userId, Number(body.id));
          return ok ? Response.json({ success: true }) : Response.json({ error: 'Lembrete não encontrado.' }, { status: 404 });
        }

        return Response.json({ error: 'Ação não reconhecida.' }, { status: 400 });
      },
    },
  },
});
