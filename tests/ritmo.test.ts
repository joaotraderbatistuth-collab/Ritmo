import { parseWhatsAppMessage } from '../src/lib/whatsapp-parser.js';
import { calculateAffiliateCommission, formatBRL } from '../src/lib/affiliate-engine.js';
import { convertTransactionsToCSV, formatTransactionForSheet } from '../src/lib/sheets-sync.js';
import { FinanceTransactionItem } from '../src/lib/types.js';
import { computeAccess, nextRenewalDate } from '../src/lib/access.js';
import { computeChain, weekStartKey, targetPerWeek } from '../src/lib/chain.js';
import { DEFAULT_VISIBLE, normalizeVisible, moveCard, moveBefore, hideCard, showCard, hiddenCards, CARD_IDS } from '../src/lib/home-layout.js';
import { calculateCommissionChain, COMMISSION_TOTAL_PERCENT, COMMISSION_DIRECT_PERCENT, COMMISSION_NETWORK_PERCENT, MAX_COMMISSION_LEVELS, levelPercent } from '../src/lib/commission-plan.js';
import { generateRoadmap, roadmapProgress, stepStatus } from '../src/lib/roadmap.js';

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
  console.log('2. Testando Sistema de Comissões de Afiliados (35% em rede: 25% + 10% até o nível 4)...');

  // Nível 1 = 25% de R$ 39,90 = R$ 9,97 (arredondado para baixo)
  const comm60 = calculateAffiliateCommission({
    affiliateUserId: 10,
    referredUserId: 20,
    netAmountCents: 3990, // R$ 39,90 plano mensal
  });
  assert(comm60.eligible === true, 'comissão nível 1 deve ser elegível');
  assert(comm60.commissionCents === 997, `nível 1 deve render 997 centavos (R$ 9,97), veio ${comm60.commissionCents}`);
  assert(formatBRL(comm60.commissionCents).includes('9,97'), 'formatBRL deve formatar 997 como R$ 9,97');

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

  // Plano em rede: 25% + (5% + 3% + 2%) = 35%
  assert(COMMISSION_DIRECT_PERCENT === 25 && COMMISSION_NETWORK_PERCENT === 10 && COMMISSION_TOTAL_PERCENT === 35, 'plano: 25% direto + 10% rede = 35%');
  assert(MAX_COMMISSION_LEVELS === 4 && levelPercent(2) === 5 && levelPercent(3) === 3 && levelPercent(4) === 2 && levelPercent(5) === 0, 'níveis 1 a 4 (25/5/3/2); nível 5 não paga');
  const ch = calculateCommissionChain({ payerUserId: 1, baseAmountCents: 3990, upline: [10, 11, 12, 13] });
  assert(ch.length === 4 && ch.map((c) => c.level).join() === '1,2,3,4', 'quatro níveis pagam');
  assert(ch.map((c) => c.commissionCents).join() === '997,199,119,79', `valores por nível: ${ch.map((c) => c.commissionCents)}`);
  const chTotal = ch.reduce((a, c) => a + c.commissionCents, 0);
  assert(chTotal <= Math.floor((3990 * 35) / 100), `soma (${chTotal}) não passa de 35% do pagamento`);
  assert(calculateCommissionChain({ payerUserId: 1, baseAmountCents: 3990, upline: [10, 11, 12, 13, 14, 15] }).length === 4, 'rede acima do nível 4 não recebe');
  assert(calculateCommissionChain({ payerUserId: 1, baseAmountCents: 3990, upline: [10] }).length === 1, 'só um indicador = só nível 1');
  assert(calculateCommissionChain({ payerUserId: 1, baseAmountCents: 3990, upline: [10, 1, 12] }).length === 1, 'pagador na própria rede corta a corrente (sem autoindicação)');
  assert(calculateCommissionChain({ payerUserId: 1, baseAmountCents: 3990, upline: [10, 11, 10] }).length === 2, 'ciclo na rede corta a corrente');
  assert(calculateCommissionChain({ payerUserId: 1, baseAmountCents: 0, upline: [10, 11] }).length === 0, 'pagamento zero não gera comissão');
  assert(calculateCommissionChain({ payerUserId: 1, baseAmountCents: 3990, upline: [] }).length === 0, 'sem indicador não gera comissão');

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

  // 4. Regras de acesso, trial e renovação
  console.log('4. Testando regras de acesso (trial / assinatura / cancelamento)...');
  const now = new Date('2026-10-10T12:00:00Z');

  assert(computeAccess({ subscriptionStatus: 'trial', trialEndsAt: '2026-10-15T12:00:00Z' }, now).hasAccess === true, 'trial válido tem acesso');
  assert(computeAccess({ subscriptionStatus: 'trial', trialEndsAt: '2026-10-09T12:00:00Z' }, now).hasAccess === false, 'trial vencido bloqueia');
  assert(computeAccess({ subscriptionStatus: 'trial', trialEndsAt: '2026-10-09T12:00:00Z' }, now).effectiveStatus === 'expired', 'trial vencido vira expired');
  assert(computeAccess({ subscriptionStatus: 'active', subscriptionRenewalDate: '2026-11-01' }, now).hasAccess === true, 'assinante em dia tem acesso');
  assert(computeAccess({ subscriptionStatus: 'active', subscriptionRenewalDate: '2026-10-01' }, now).hasAccess === false, 'assinante com renovação vencida bloqueia');
  assert(computeAccess({ subscriptionStatus: 'canceled', subscriptionRenewalDate: '2026-10-20' }, now).hasAccess === true, 'cancelado mantém acesso até o fim do período pago');
  assert(computeAccess({ subscriptionStatus: 'canceled', subscriptionRenewalDate: '2026-10-05' }, now).hasAccess === false, 'cancelado após o período perde acesso');
  assert(computeAccess({ subscriptionStatus: 'suspended' }, now).hasAccess === false, 'suspenso bloqueia');
  assert(computeAccess({ role: 'admin', subscriptionStatus: 'expired' }, now).hasAccess === true, 'admin sempre tem acesso');

  assert(nextRenewalDate(null, now) === '2026-11-09', 'primeira renovação = hoje + 30 dias');
  assert(nextRenewalDate('2026-10-20', now) === '2026-11-19', 'pagar antes de vencer soma 30 dias ao que sobrou');
  assert(nextRenewalDate('2026-10-01', now) === '2026-11-09', 'pagar depois de vencer conta a partir de hoje');
  console.log('✓ Todos os testes de acesso e renovação passaram com sucesso!');

  // 5. Roteiro de metas do ciclo
  console.log('5. Testando o gerador de roteiro de metas...');
  for (const d of [7, 21, 40, 90]) {
    const steps = generateRoadmap({ mainGoal: 'Terminar o curso', durationDays: d });
    assert(steps.length >= 4, `roteiro de ${d} dias deve ter ao menos 4 marcos`);
    assert(steps[0].targetDay === 1, `roteiro de ${d} dias começa no dia 1`);
    assert(steps[steps.length - 1].targetDay === d, `roteiro de ${d} dias termina no dia ${d}`);
    assert(steps.every((s, i) => i === 0 || s.targetDay > steps[i - 1].targetDay), `dias em ordem crescente (${d})`);
    assert(steps.every((s) => s.targetDay >= 1 && s.targetDay <= d), `dias dentro do ciclo (${d})`);
    assert(steps[0].description.includes('Terminar o curso'), 'meta aparece no primeiro marco');
  }
  const withSecondary = generateRoadmap({ mainGoal: 'Meta', secondaryGoals: ['Ler 2 livros', 'Correr 3x'], durationDays: 40, routineLevel: 'leve' });
  assert(withSecondary.some((s) => s.description.includes('Ler 2 livros')), 'metas secundárias entram nos marcos');
  assert(withSecondary[0].description.includes('15 a 25 minutos'), 'nível leve sugere menos tempo');
  assert(generateRoadmap({ mainGoal: 'x', durationDays: 999 }).length > 0, 'duração inválida cai num padrão seguro');
  assert(roadmapProgress([{ done: true }, { done: false }, { done: true }, { done: false }]).percent === 50, 'progresso 50%');
  assert(roadmapProgress([]).percent === 0, 'progresso vazio = 0');
  assert(stepStatus({ done: true, targetDay: 2 }, 5) === 'concluido', 'concluído');
  assert(stepStatus({ done: false, targetDay: 5 }, 5) === 'hoje', 'hoje');
  assert(stepStatus({ done: false, targetDay: 2 }, 5) === 'ajustar', 'atrasado vira "ajustar"');
  assert(stepStatus({ done: false, targetDay: 9 }, 5) === 'proximo', 'próximo');
  console.log('✓ Todos os testes do roteiro de metas passaram com sucesso!');

  // 6. Não Quebre a Corrente (semanas seguidas cumprindo a meta do hábito)
  console.log('6. Testando a corrente de hábitos...');
  assert(targetPerWeek('3x_semana') === 3 && targetPerWeek('5x_semana') === 5 && targetPerWeek('diario') === 7, 'metas semanais 3/5/7');
  assert(weekStartKey('2026-10-27') === '2026-10-26', 'terça 27/10/2026 -> semana começa na segunda 26/10');
  assert(weekStartKey('2026-11-01') === '2026-10-26', 'domingo 01/11 ainda é da semana de 26/10');
  const L = (...dates: string[]) => dates.map((date) => ({ date, completed: true }));
  // hábito criado em 05/10 (segunda); meta 3x; hoje terça 27/10
  const base = { targetFrequency: '3x_semana', createdAt: '2026-10-05T12:00:00', today: '2026-10-27' };
  // semanas 05/10, 12/10, 19/10 cumpridas (3 treinos seg/qua/sex), semana atual com 1
  const okLogs = L('2026-10-05','2026-10-07','2026-10-09','2026-10-12','2026-10-14','2026-10-16','2026-10-19','2026-10-21','2026-10-23','2026-10-26');
  const r1c = computeChain({ ...base, logs: okLogs });
  assert(r1c.chain === 3, 'três semanas cumpridas = 3 elos (semana atual em andamento não quebra)');
  assert(r1c.doneThisWeek === 1 && r1c.metThisWeek === false && r1c.missingThisWeek === 2, 'semana atual 1/3');
  // cumprindo a semana atual, ganha mais um elo
  const r2c = computeChain({ ...base, logs: [...okLogs, ...L('2026-10-27', '2026-10-28')] });
  assert(r2c.chain === 4 && r2c.metThisWeek, 'semana atual cumprida soma um elo');
  // semana 12/10 com só 2 treinos quebra a corrente anterior
  const brokenLogs = L('2026-10-05','2026-10-07','2026-10-09','2026-10-12','2026-10-14','2026-10-19','2026-10-21','2026-10-23');
  assert(computeChain({ ...base, logs: brokenLogs }).chain === 1, 'semana fraca quebra; só conta a última cumprida');
  // dias não usados no meio da semana não quebram (3x já cumprido na segunda/quarta/sexta)
  assert(r1c.recentWeeks.length === 3 && r1c.recentWeeks.every(Boolean), 'histórico de semanas encerradas');
  // hábito novo, sem registros: corrente zero
  assert(computeChain({ targetFrequency: 'diario', createdAt: '2026-10-27T10:00:00', logs: [], today: '2026-10-27' }).chain === 0, 'sem registros = 0');
  // diário exige 7 dias; marcar o mesmo dia duas vezes não conta em dobro
  const week7 = L('2026-10-19','2026-10-20','2026-10-21','2026-10-22','2026-10-23','2026-10-24','2026-10-25','2026-10-25');
  assert(computeChain({ targetFrequency: 'diario', createdAt: '2026-10-19T09:00:00', logs: week7, today: '2026-10-27' }).chain === 1, 'diário: 7 dias distintos = 1 elo');
  // registros desmarcados não contam
  assert(computeChain({ ...base, logs: [{ date: '2026-10-26', completed: false }] }).doneThisWeek === 0, 'desmarcado não conta');
  console.log('✓ Todos os testes da corrente passaram com sucesso!');

  // 7. Personalização da tela inicial (ordem e visibilidade dos cards)
  console.log('7. Testando o layout personalizável da tela inicial...');
  assert(normalizeVisible(undefined).join() === DEFAULT_VISIBLE.join(), 'sem dados salvos usa o padrão');
  assert(normalizeVisible(['tarefas', 'xyz', 'tarefas', 'foco']).join() === 'tarefas,foco', 'remove ids inválidos e repetidos');
  assert(normalizeVisible([]).length === 0, 'lista vazia é permitida (pessoa ocultou tudo)');
  const base7 = ['corrente', 'tarefas', 'habitos'] as any[];
  assert(moveCard(base7, 'tarefas', -1).join() === 'tarefas,corrente,habitos', 'sobe um card');
  assert(moveCard(base7, 'corrente', -1).join() === base7.join(), 'primeiro card não sobe mais');
  assert(moveCard(base7, 'habitos', 1).join() === base7.join(), 'último card não desce mais');
  assert(moveBefore(base7, 'habitos', 'corrente').join() === 'habitos,corrente,tarefas', 'arrastar último para o início');
  assert(moveBefore(base7, 'corrente', 'habitos').join() === 'tarefas,habitos,corrente', 'arrastar primeiro para o fim');
  assert(hideCard(base7, 'tarefas').join() === 'corrente,habitos', 'oculta card');
  assert(showCard(base7, 'metas').join() === 'corrente,tarefas,habitos,metas', 'adiciona card no fim');
  assert(showCard(base7, 'tarefas').length === 3, 'não duplica card');
  assert(hiddenCards(base7).length === CARD_IDS.length - 3, 'catálogo mostra os que faltam');
  console.log('✓ Todos os testes do layout da tela inicial passaram com sucesso!');

  console.log('🎉 Todos os testes unitários do Ritmo foram concluídos com êxito!');
}
