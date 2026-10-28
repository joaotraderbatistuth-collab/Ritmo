import { createFileRoute } from '@tanstack/react-router';
import { extractTokenFromRequest, verifyToken } from '../lib/auth.js';
import {
  createFinanceTransaction,
  deleteFinanceTransaction,
  getFinanceTransactions,
  getIntegrationsConfig,
} from '../lib/server-db.js';
import { convertTransactionsToCSV, syncTransactionToGoogleSheet } from '../lib/sheets-sync.js';

export const Route = createFileRoute('/api/finance')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const token = extractTokenFromRequest(request);
        if (!token) return Response.json({ error: 'Não autorizado.' }, { status: 401 });
        const payload = await verifyToken(token);
        if (!payload) return Response.json({ error: 'Sessão expirada.' }, { status: 401 });

        const url = new URL(request.url);
        const monthYear = url.searchParams.get('monthYear') || undefined;
        const category = url.searchParams.get('category') || undefined;
        const type = url.searchParams.get('type') || undefined;
        const search = url.searchParams.get('search') || undefined;
        const format = url.searchParams.get('format'); // 'csv' | 'json'

        const transactions = await getFinanceTransactions(payload.userId, {
          monthYear,
          category,
          type,
          search,
        });

        if (format === 'csv') {
          const csv = convertTransactionsToCSV(transactions);
          return new Response(csv, {
            headers: {
              'Content-Type': 'text/csv; charset=utf-8',
              'Content-Disposition': `attachment; filename="ritmo-financas-${monthYear || 'export'}.csv"`,
            },
          });
        }

        // Calculate summary
        const currentMonth = monthYear || new Date().toISOString().substring(0, 7);
        const monthTxs = transactions.filter((t) => t.date.startsWith(currentMonth));
        const totalIncomeCents = monthTxs
          .filter((t) => t.type === 'income')
          .reduce((acc, t) => acc + t.amountCents, 0);
        const totalExpenseCents = monthTxs
          .filter((t) => t.type === 'expense')
          .reduce((acc, t) => acc + t.amountCents, 0);
        const netBalanceCents = totalIncomeCents - totalExpenseCents;

        // Category breakdown
        const categoryBreakdown: Record<string, number> = {};
        for (const tx of monthTxs) {
          if (tx.type === 'expense') {
            categoryBreakdown[tx.category] = (categoryBreakdown[tx.category] || 0) + tx.amountCents;
          }
        }

        return Response.json({
          transactions,
          summary: {
            currentMonth,
            totalIncomeCents,
            totalExpenseCents,
            netBalanceCents,
            categoryBreakdown,
          },
        });
      },

      POST: async ({ request }) => {
        const token = extractTokenFromRequest(request);
        if (!token) return Response.json({ error: 'Não autorizado.' }, { status: 401 });
        const payload = await verifyToken(token);
        if (!payload) return Response.json({ error: 'Sessão expirada.' }, { status: 401 });

        const body = await request.json();
        if (!body.description || body.amountCents === undefined) {
          return Response.json({ error: 'Descrição e valor são obrigatórios.' }, { status: 400 });
        }

        const tx = await createFinanceTransaction(payload.userId, body);

        // Check if user has Google Sheets auto-sync enabled
        const integrations = await getIntegrationsConfig(payload.userId);
        let syncStatus = null;
        if (integrations?.sheetsAutoSync && integrations?.sheetsSpreadsheetId) {
          syncStatus = await syncTransactionToGoogleSheet(integrations.sheetsSpreadsheetId, tx);
        }

        return Response.json({ transaction: tx, syncStatus }, { status: 201 });
      },

      DELETE: async ({ request }) => {
        const token = extractTokenFromRequest(request);
        if (!token) return Response.json({ error: 'Não autorizado.' }, { status: 401 });
        const payload = await verifyToken(token);
        if (!payload) return Response.json({ error: 'Sessão expirada.' }, { status: 401 });

        const url = new URL(request.url);
        const id = url.searchParams.get('id');
        if (!id) return Response.json({ error: 'ID do lançamento é obrigatório.' }, { status: 400 });

        await deleteFinanceTransaction(Number(id), payload.userId);
        return Response.json({ success: true });
      },
    },
  },
});
