import { parseWhatsAppMessage } from '../src/lib/whatsapp-parser.js';
import { calculateAffiliateCommission, formatBRL } from '../src/lib/affiliate-engine.js';
import { convertTransactionsToCSV, formatTransactionForSheet } from '../src/lib/sheets-sync.js';
import { FinanceTransactionItem } from '../src/lib/types.js';

/**
 * Ritmo Core Logic Test Suite
 * Tests Brazilian Portuguese financial parsing, affiliate rules, and spreadsheet formatting.
 */

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

export function runTests() {
  console.log('--- Iniciando Testes do Ritmo ---');

  // 1. WhatsApp Parser Tests
  console.log('1. Testando Parser de Mensagens WhatsApp...');

  // Test 1: Expense Lunch
  const r1 = parseWhatsAppMessage('Gastei 42,50 no almoço.', '2026-09-27');
  assert(r1.intent === 'transaction', 'r1 intent should be transaction');
  assert(r1.type === 'expense', 'r1 type should be expense');
  assert(r1.amountCents === 4250, 'r1 amount should be 4250 cents (R$ 42,50)');
  assert(r1.category === 'alimentacao', 'r1 category should be alimentacao');

  // Test 2: Internet Bill
  const r2 = parseWhatsAppMessage('Paguei R$ 120 de internet hoje.', '2026-09-27');
  assert(r2.intent === 'transaction', 'r2 intent should be transaction');
  assert(r2.type === 'expense', 'r2 type should be expense');
  assert(r2.amountCents === 12000, 'r2 amount should be 12000 cents (R$ 120,00)');
  assert(r2.category === 'moradia', 'r2 category should be moradia');

  // Test 3: Freelance Income
  const r3 = parseWhatsAppMessage('Recebi 800 reais de um trabalho.', '2026-09-27');
  assert(r3.intent === 'transaction', 'r3 intent should be transaction');
  assert(r3.type === 'income', 'r3 type should be income');
  assert(r3.amountCents === 80000, 'r3 amount should be 80000 cents (R$ 800,00)');
  assert(r3.category === 'trabalho' || r3.category === 'renda', 'r3 category should be trabalho/renda');

  // Test 4: Supermarket with Credit Card
  const r4 = parseWhatsAppMessage('Comprei mercado por 235,70 no cartão.', '2026-09-27');
  assert(r4.intent === 'transaction', 'r4 intent should be transaction');
  assert(r4.type === 'expense', 'r4 type should be expense');
  assert(r4.amountCents === 23570, 'r4 amount should be 23570 cents (R$ 235,70)');
  assert(r4.paymentMethod === 'cartao_credito', 'r4 payment should be cartao_credito');

  // Test 5: Ambiguous Message
  const r5 = parseWhatsAppMessage('Gastei no almoço');
  assert(r5.intent === 'ambiguous', 'r5 without amount should be ambiguous');
  assert(Boolean(r5.clarifyingQuestion), 'r5 should have a clarifying question');

  // Test 6: Query
  const r6 = parseWhatsAppMessage('quanto gastei este mês?');
  assert(r6.intent === 'query', 'r6 should be query');
  assert(r6.queryType === 'month_expenses', 'r6 queryType should be month_expenses');

  console.log('✓ Todos os testes do WhatsApp Parser passaram com sucesso!');

  // 2. Affiliate Commission Tests
  console.log('2. Testando Sistema de Comissões de Afiliados (60% recorrente)...');

  // Standard 60% commission on R$ 39,90 plan (R$ 23,94 = 2394 cents)
  const comm60 = calculateAffiliateCommission({
    affiliateUserId: 10,
    referredUserId: 20,
    netAmountCents: 3990, // R$ 39,90 plano mensal
  });
  assert(comm60.eligible === true, 'comm60 should be eligible');
  assert(comm60.commissionCents === 2394, `comm60 should be 2394 cents (R$ 23,94), got ${comm60.commissionCents}`);
  assert(formatBRL(comm60.commissionCents).includes('23,94'), 'formatBRL should format 2394 as R$ 23,94');

  // Standard 30% commission if custom rate passed
  const comm1 = calculateAffiliateCommission({
    affiliateUserId: 1,
    referredUserId: 2,
    netAmountCents: 10000, // R$ 100,00
    commissionRatePercent: 30,
  });
  assert(comm1.eligible === true, 'comm1 should be eligible');
  assert(comm1.commissionCents === 3000, 'comm1 should be 3000 cents (R$ 30,00)');
  assert(formatBRL(comm1.commissionCents).includes('30,00'), 'formatBRL should format 3000 as R$ 30,00');

  // Self-referral rejection
  const comm2 = calculateAffiliateCommission({
    affiliateUserId: 1,
    referredUserId: 1, // Same user
    netAmountCents: 10000,
  });
  assert(comm2.eligible === false, 'self-referral must be rejected');

  console.log('✓ Todos os testes de Afiliados passaram com sucesso!');

  // 3. Sheets & CSV Export Tests
  console.log('3. Testando Exportação CSV e Planilha...');

  const dummyTx: FinanceTransactionItem = {
    id: 101,
    userId: 1,
    type: 'expense',
    description: 'Manutenção Notebook',
    amountCents: 15000,
    date: '2026-09-27',
    category: 'trabalho',
    paymentMethod: 'pix',
    accountWallet: 'Principal',
    isRecurring: false,
    isInstallment: false,
    status: 'paid',
    source: 'web',
    syncedToSheets: true,
  };

  const sheetRow = formatTransactionForSheet(dummyTx);
  assert(sheetRow.id === 101, 'sheetRow id match');
  assert(sheetRow.tipo === 'Despesa', 'sheetRow tipo match');

  const csv = convertTransactionsToCSV([dummyTx]);
  assert(csv.includes('Manutenção Notebook'), 'csv should contain description');
  assert(csv.includes('150,00'), 'csv should contain formatted price');

  console.log('✓ Todos os testes de Planilha & CSV passaram com sucesso!');
  console.log('🎉 Todos os testes unitários do Ritmo foram concluídos com êxito!');
}
