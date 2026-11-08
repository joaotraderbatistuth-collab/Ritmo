import { createFileRoute } from '@tanstack/react-router';
import { extractTokenFromRequest } from '../lib/auth.js';
import { verifyActiveToken } from '../lib/session.js';
import { clearSurvey, dismissSurvey, getSurvey, saveSurvey } from '../lib/survey-db.js';
import { grantConsent, revokeConsent } from '../lib/consents-db.js';
import { shouldAskSurvey } from '../lib/survey.js';

// GET  /api/survey                                → respostas da pessoa e se deve mostrar a pesquisa agora
// POST /api/survey { action: 'save', answers }    → salva (e registra o consentimento "perfil")
// POST /api/survey { action: 'dismiss' }          → "Agora não" (pergunta de novo em alguns dias, no máximo 2 vezes)
// POST /api/survey { action: 'clear' }            → apaga as respostas
export const Route = createFileRoute('/api/survey')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const token = extractTokenFromRequest(request);
        const payload = token ? await verifyActiveToken(token) : null;
        if (!payload) return Response.json({ error: 'Faça login para continuar.' }, { status: 401 });
        const survey = await getSurvey(payload.userId);
        return Response.json({ survey, ask: shouldAskSurvey(survey) });
      },

      POST: async ({ request }) => {
        const token = extractTokenFromRequest(request);
        const payload = token ? await verifyActiveToken(token) : null;
        if (!payload) return Response.json({ error: 'Faça login para continuar.' }, { status: 401 });
        const body = await request.json().catch(() => ({}));
        const userId = payload.userId;
        if (body.action === 'save') {
          const survey = await saveSurvey(userId, body.answers);
          if (survey?.completedAt) await grantConsent(userId, 'perfil');
          return Response.json({ success: true, survey, ask: false });
        }
        if (body.action === 'dismiss') {
          const survey = await dismissSurvey(userId);
          return Response.json({ success: true, survey, ask: false });
        }
        if (body.action === 'clear') {
          await clearSurvey(userId);
          await revokeConsent(userId, 'perfil');
          return Response.json({ success: true, survey: await getSurvey(userId), ask: false });
        }
        return Response.json({ error: 'Ação não reconhecida.' }, { status: 400 });
      },
    },
  },
});
