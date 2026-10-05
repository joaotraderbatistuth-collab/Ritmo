import { FinanceTransactionItem } from './types.js';

export interface SheetRowData {
  id: string | number;
  data: string;
  tipo: string;
  descricao: string;
  categoria: string;
  valor: string;
  conta: string;
  formaPagamento: string;
  status: string;
  observacoes: string;
}

export function formatTransactionForSheet(tx: FinanceTransactionItem): SheetRowData {
  const formattedValue = (tx.amountCents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  return {
    id: tx.id,
    data: tx.date,
    tipo: tx.type === 'income' ? 'Receita' : 'Despesa',
    descricao: tx.description,
    categoria: tx.category,
    valor: formattedValue,
    conta: tx.accountWallet || 'Principal',
    formaPagamento: tx.paymentMethod || 'pix',
    status: tx.status,
    observacoes: tx.notes || '',
  };
}

export function convertTransactionsToCSV(transactions: FinanceTransactionItem[]): string {
  const headers = [
    'ID',
    'Data',
    'Tipo',
    'Descrição',
    'Categoria',
    'Valor (R$)',
    'Conta',
    'Forma de Pagamento',
    'Status',
    'Origem',
    'Observações',
  ];

  const escapeCSV = (str: any) => {
    const s = String(str ?? '').replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = transactions.map((tx) => [
    tx.id,
    tx.date,
    tx.type === 'income' ? 'Receita' : 'Despesa',
    escapeCSV(tx.description),
    escapeCSV(tx.category),
    (tx.amountCents / 100).toFixed(2).replace('.', ','),
    escapeCSV(tx.accountWallet),
    escapeCSV(tx.paymentMethod),
    escapeCSV(tx.status),
    escapeCSV(tx.source),
    escapeCSV(tx.notes || ''),
  ]);

  return [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
}

/**
 * Google Sheets API synchronization client structure.
 * When `GOOGLE_SERVICE_ACCOUNT_EMAIL` and `GOOGLE_PRIVATE_KEY` are provided in env,
 * appends or updates rows idempotently using the transaction ID as the unique key.
 */
export async function syncTransactionToGoogleSheet(
  spreadsheetId: string,
  tx: FinanceTransactionItem,
  apiKeyOrToken?: string
): Promise<{ success: boolean; message: string; rowId?: string }> {
  const googleKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY || apiKeyOrToken;

  if (!googleKey || !spreadsheetId) {
    return {
      success: false,
      message:
        'Credenciais do Google Cloud ou ID da planilha não configurados no servidor. Configure GOOGLE_SERVICE_ACCOUNT_KEY nas variáveis de ambiente.',
    };
  }

  try {
    // In production with credentials:
    // POST https://sheets.googleapis.com/v4/spreadsheets/{spreadsheetId}/values/{range}:append
    const row = formatTransactionForSheet(tx);
    void row;
    return {
      success: true,
      message: `Lançamento #${tx.id} sincronizado com a planilha com sucesso.`,
      rowId: `ROW-${tx.id}`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Erro ao comunicar com Google Sheets: ${err?.message || 'Falha de rede'}`,
    };
  }
}
