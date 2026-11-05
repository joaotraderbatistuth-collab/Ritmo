import { createFileRoute } from '@tanstack/react-router';
import { extractTokenFromRequest } from '../lib/auth.js';
import { verifyActiveToken } from '../lib/session.js';
import { grantConsent, listConsents, revokeConsent } from '../lib/consents-db.js';
import { LEGAL_VERSION, isConsentKind, needsLegalAcceptance } from '../lib/consent-rules.js';

// GET  /api/consents                         → consentimentos vigentes e se precisa aceitar os termos novos
// POST /api/consents { action: 'grant'|'revoke', kinds: ['termos','saude'] }
// Vale mesmo com o teste vencido: a pessoa sempre pode ver e mudar seus consentimentos.
export const Route = createFileRoute('/api/consents')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const token = extractTokenFromRequest(request);
        const payload = token ? await verifyActiveToken(token) : null;
        if (!payload) return Response.json({ error: 'Faça login para continuar.' }, { status: 401 });
        const consents = await listConsents(payload.userId);
        return Response.json({ version: LEGAL_VERSION, consents, needsAcceptance: needsLegalAcceptance(consents) });
      },

      POST: async ({ request }) => {
        const token = extractTokenFromRequest(request);
        const payload = token ? await verifyActiveToken(token) : null;
        if (!payload) return Response.json({ error: 'Faça login para continuar.' }, { status: 401 });
        const body = await request.json().catch(() => ({}));
        const kinds = (Array.isArray(body.kinds) ? body.kinds : [body.kind]).filter(isConsentKind);
        if (!kinds.length) return Response.json({ error: 'Consentimento inválido.' }, { status: 400 });
        if (body.action === 'grant') for (const k of kinds) await grantConsent(payload.userId, k);
        else if (body.action === 'revoke') for (const k of kinds) await revokeConsent(payload.userId, k);
        else return Response.json({ error: 'Ação não reconhecida.' }, { status: 400 });
        const consents = await listConsents(payload.userId);
        return Response.json({ success: true, consents, needsAcceptance: needsLegalAcceptance(consents) });
      },
    },
  },
});
