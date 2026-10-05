import { createFileRoute } from '@tanstack/react-router';
import { extractTokenFromRequest, verifyToken } from '../lib/auth.js';
import {
  createFinanceTransaction,
  findUserByPhone,
  getFinanceTransactions,
  getIntegrationsConfig,
  updateIntegrationsConfig,
} from '../lib/server-db.js';
import { parseWhatsAppMessage } from '../lib/whatsapp-parser.js';
import { syncTransactionToGoogleSheet } from '../lib/sheets-sync.js';

export const Route = createFileRoute('/api/integrations')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);

        // 1. Meta WhatsApp Webhook Verification
        const hubMode = url.searchParams.get('hub.mode');
        const hubVerifyToken = url.searchParams.get('hub.verify_token');
        const hubChallenge = url.searchParams.get('hub.challenge');

        if (hubMode === 'subscribe' && hubVerifyToken) {
          const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN || 'ritmo-whatsapp-webhook-token';
          if (hubVerifyToken === expectedToken) {
            return new Response(hubChallenge || 'OK', { status: 200 });
          } else {
            return new Response('Forbidden: Token mismatch', { status: 403 });
          }
        }

        // 2. User integrations config
        const token = extractTokenFromRequest(request);
        if (!token) return Response.json({ error: 'Não autorizado.' }, { status: 401 });
        const payload = await verifyToken(token);
        if (!payload) return Response.json({ error: 'Sessão expirada.' }, { status: 401 });

        const config = await getIntegrationsConfig(payload.userId);
        return Response.json({ config });
      },

      POST: async ({ request }) => {
        const url = new URL(request.url);
        const action = url.searchParams.get('action');

        // A. SIMULATOR OR TEST MESSAGE FROM USER UI
        if (action === 'simulate_whatsapp') {
          const token = extractTokenFromRequest(request);
          if (!token) return Response.json({ error: 'Não autorizado.' }, { status: 401 });
          const payload = await verifyToken(token);
          if (!payload) return Response.json({ error: 'Sessão expirada.' }, { status: 401 });

          const body = await request.json();
          const { message } = body;
          if (!message) return Response.json({ error: 'Mensagem vazia.' }, { status: 400 });

          const parsed = parseWhatsAppMessage(message);

          if (parsed.intent === 'transaction' && parsed.type && parsed.amountCents) {
            // Automatically save confirmed transaction
            const tx = await createFinanceTransaction(payload.userId, {
              type: parsed.type,
              description: parsed.description || 'Lançamento WhatsApp',
              amountCents: parsed.amountCents,
              date: parsed.date || new Date().toISOString().split('T')[0],
              category: parsed.category || 'outros',
              paymentMethod: parsed.paymentMethod || 'pix',
              source: 'whatsapp',
              notes: 'Registrado via WhatsApp Bot',
            });

            return Response.json({ parsed, transaction: tx });
          }

          if (parsed.intent === 'query') {
            const currentMonth = new Date().toISOString().substring(0, 7);
            const txs = await getFinanceTransactions(payload.userId, { monthYear: currentMonth });
            const spent = txs
              .filter((t) => t.type === 'expense')
              .reduce((acc, t) => acc + t.amountCents, 0);

            if (parsed.queryType === 'upcoming_bills') {
              const pendingBills = txs.filter((t) => t.status === 'pending');
              const reply =
                pendingBills.length > 0
                  ? `📅 Você tem ${pendingBills.length} conta(s) pendente(s) no Ritmo neste mês.`
                  : '🎉 Nenhuma conta pendente para os próximos dias!';
              return Response.json({ parsed: { ...parsed, replyMessage: reply } });
            }

            const formattedSpent = (spent / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            return Response.json({
              parsed: {
                ...parsed,
                replyMessage: `📊 Seus gastos registrados no mês atual (${currentMonth}) totalizam: *${formattedSpent}* no Ritmo.`,
              },
            });
          }

          return Response.json({ parsed });
        }

        // B. SYNC TO GOOGLE SHEETS
        if (action === 'sync_sheets') {
          const token = extractTokenFromRequest(request);
          if (!token) return Response.json({ error: 'Não autorizado.' }, { status: 401 });
          const payload = await verifyToken(token);
          if (!payload) return Response.json({ error: 'Sessão expirada.' }, { status: 401 });

          const config = await getIntegrationsConfig(payload.userId);
          const txs = await getFinanceTransactions(payload.userId);

          if (!config.sheetsSpreadsheetId) {
            return Response.json({
              success: false,
              message: 'ID da Planilha não configurado. Adicione o ID nas configurações da integração.',
            });
          }

          const syncResult = await syncTransactionToGoogleSheet(
            config.sheetsSpreadsheetId,
            txs[0] || ({ id: 0, date: '', type: 'expense', description: '', amountCents: 0, category: '', accountWallet: '', source: 'web', syncedToSheets: false, status: 'paid' } as any)
          );

          return Response.json(syncResult);
        }

        // C. UPDATE INTEGRATIONS CONFIG
        if (action === 'update_config') {
          const token = extractTokenFromRequest(request);
          if (!token) return Response.json({ error: 'Não autorizado.' }, { status: 401 });
          const payload = await verifyToken(token);
          if (!payload) return Response.json({ error: 'Sessão expirada.' }, { status: 401 });

          const body = await request.json();
          const updated = await updateIntegrationsConfig(payload.userId, body);
          return Response.json({ config: updated });
        }

        // D. OFFICIAL META WHATSAPP CLOUD API INCOMING WEBHOOK
        try {
          const payload = await request.json();

          // Extract message text and sender from Meta payload
          const entry = payload?.entry?.[0];
          const change = entry?.changes?.[0];
          const messageData = change?.value?.messages?.[0];

          if (!messageData || messageData.type !== 'text') {
            return Response.json({ status: 'ignored_non_text_or_status' }, { status: 200 });
          }

          const fromPhone = messageData.from; // e.g. "5511999999999"
          const textBody = messageData.text?.body;

          // Lookup matching user by phone
          const matchedUser = await findUserByPhone(fromPhone);
          if (!matchedUser) {
            // Unregistered phone - do not modify any data
            return Response.json(
              { status: 'unregistered_phone', message: 'Número não associado a uma conta Ritmo.' },
              { status: 200 }
            );
          }

          const parsed = parseWhatsAppMessage(textBody);
          if (parsed.intent === 'transaction' && parsed.type && parsed.amountCents) {
            await createFinanceTransaction(matchedUser.id, {
              type: parsed.type,
              description: parsed.description || 'Lançamento WhatsApp',
              amountCents: parsed.amountCents,
              date: parsed.date || new Date().toISOString().split('T')[0],
              category: parsed.category || 'outros',
              paymentMethod: parsed.paymentMethod || 'pix',
              source: 'whatsapp',
              notes: 'Via WhatsApp Cloud API Oficial',
            });
          }

          // Return 200 OK to Meta
          return Response.json({ status: 'processed', parsed: { intent: parsed.intent } });
        } catch {
          return Response.json({ status: 'error' }, { status: 200 });
        }
      },
    },
  },
});
