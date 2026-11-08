import { authorizeData } from '../lib/session.js';
import { createFileRoute } from '@tanstack/react-router';
import { extractTokenFromRequest } from '../lib/auth.js';
import {
  createFinanceTransaction,
  deleteFinanceTransaction,
  updateFinanceTransaction,
  getFinanceTransactions,
} from '../lib/server-db.js';
import { convertTransactionsToCSV } from '../lib/sheets-sync.js';

export const Route = createFileRoute('/api/finance')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const token = extractTokenFromRequest(request);
        if (!token) return Response.json({ error: 'Não autorizado.' }, { status: 401 });
        const auth = await authorizeData(token);
        if ('response' in auth) return auth.response;
        const payload = auth.payload;

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
        const auth = await authorizeData(token);
        if ('response' in auth) return auth.response;
        const payload = auth.payload;

        const body = await request.json();
        if (!body.description || body.amountCents === undefined) {
          return Response.json({ error: 'Descrição e valor são obrigatórios.' }, { status: 400 });
        }

        const tx = await createFinanceTransaction(payload.userId, body);

        return Response.json({ transaction: tx }, { status: 201 });
      },

      PATCH: async ({ request }) => {
        const token = extractTokenFromRequest(request);
        if (!token) return Response.json({ error: 'Não autorizado.' }, { status: 401 });
        const auth = await authorizeData(token);
        if ('response' in auth) return auth.response;
        const body = await request.json().catch(() => ({}));
        const tx = await updateFinanceTransaction(Number(body.id), auth.payload.userId, body);
        return tx ? Response.json({ transaction: tx }) : Response.json({ error: 'Lançamento não encontrado.' }, { status: 404 });
      },

      DELETE: async ({ request }) => {
        const token = extractTokenFromRequest(request);
        if (!token) return Response.json({ error: 'Não autorizado.' }, { status: 401 });
        const auth = await authorizeData(token);
        if ('response' in auth) return auth.response;
        const payload = auth.payload;

        const url = new URL(request.url);
        const id = url.searchParams.get('id');
        if (!id) return Response.json({ error: 'ID do lançamento é obrigatório.' }, { status: 400 });

        await deleteFinanceTransaction(Number(id), payload.userId);
        return Response.json({ success: true });
      },
    },
  },
});
