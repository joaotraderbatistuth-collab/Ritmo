import { parseWhatsAppMessage } from '../src/lib/whatsapp-parser.js';
import { calculateAffiliateCommission, formatBRL } from '../src/lib/affiliate-engine.js';
import { convertTransactionsToCSV, formatTransactionForSheet } from '../src/lib/sheets-sync.js';
import { FinanceTransactionItem } from '../src/lib/types.js';
import { computeAccess, nextRenewalDate } from '../src/lib/access.js';
import { computeChain, weekStartKey, targetPerWeek } from '../src/lib/chain.js';
import { DEFAULT_VISIBLE, normalizeVisible, moveCard, moveBefore, hideCard, showCard, hiddenCards, CARD_IDS } from '../src/lib/home-layout.js';
import { calculateCommissionChain, COMMISSION_TOTAL_PERCENT, COMMISSION_DIRECT_PERCENT, COMMISSION_NETWORK_PERCENT, MAX_COMMISSION_LEVELS, levelPercent } from '../src/lib/commission-plan.js';
import { PERMISSIONS, ALL_PERMISSION_KEYS, normalizePermissions, serializePermissions, isMasterEmail, isMasterAdmin, effectivePermissions, can, ACTION_PERMISSION, EXPORT_PERMISSION, filterDashboardByPermissions } from '../src/lib/admin-permissions.js';
import { payoutCycle, cycleStatus, describeCountdown, shortDateBR, payoutDatesText } from '../src/lib/payout-schedule.js';
import { validatePix, formatPix } from '../src/lib/pix.js';
import { STORY_MODELS, COURSE_LESSONS, courseWordCount } from '../src/lib/affiliate-content.js';
import { GUIDE_STEPS, parseGuideState, shouldAutoStartGuide } from '../src/lib/setup-guide.js';
import { splitTeamPayment, validateTeamInput, teamCodeFrom, isValidTeamCode, membershipActive, nextMembershipExpiry, teamPriceLabel, qualifiesForFreeAccess, TEAM_PLATFORM_FEE_PERCENT } from '../src/lib/teams-plan.js';
import { normalizeText, displayName, initials, sanitizeAchievement, achievementHeadline, parsePayload, rateLimited, timeAgo, FEED_LIMITS } from '../src/lib/feed-rules.js';
import { computeShareable } from '../src/lib/achievements.js';
import { computeNotices } from '../src/lib/notices.js';
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

  // 8. Permissões do painel administrativo (master + administradores com permissões escolhidas)
  console.log('8. Testando permissões do painel administrativo...');
  assert(isMasterEmail('Batistuth@Live.com') && isMasterEmail(' batistuth@live.com '), 'e-mail master padrão ignora maiúsculas e espaços');
  assert(!isMasterEmail('outro@live.com') && !isMasterEmail(''), 'outro e-mail não é master');
  assert(isMasterEmail('chefe@x.com', 'chefe@x.com, dono@x.com') && !isMasterEmail('batistuth@live.com', 'chefe@x.com'), 'variável MASTER_ADMIN_EMAIL substitui o padrão');
  const masterPerms = effectivePermissions({ role: 'admin', email: 'batistuth@live.com' });
  assert(ALL_PERMISSION_KEYS.every((k) => masterPerms.includes(k)) && masterPerms.includes('admins_manage'), 'master tem tudo, inclusive gerir administradores');
  assert(effectivePermissions({ role: 'user', email: 'batistuth@live.com' }).length === 0, 'conta comum não tem permissão, mesmo com e-mail master');
  const supportPerms = effectivePermissions({ role: 'admin', email: 'ana@x.com', adminPermissions: '["overview","users_view","users_manage","admins_manage","lixo"]' });
  assert(supportPerms.join() === 'overview,users_view,users_manage', 'só permissões válidas; admins_manage nunca vem do banco');
  assert(effectivePermissions({ role: 'admin', email: 'velho@x.com', adminPermissions: null }).length === ALL_PERMISSION_KEYS.length && !effectivePermissions({ role: 'admin', email: 'velho@x.com', adminPermissions: null }).includes('admins_manage'), 'admin antigo (sem permissões salvas): operacional completo, sem gerir admins');
  assert(effectivePermissions({ role: 'admin', email: 'zero@x.com', adminPermissions: '[]' }).length === 0, 'lista vazia = nenhuma permissão');
  assert(normalizePermissions('texto quebrado').length === 0 && normalizePermissions(['coupons', 'coupons']).length === 1, 'normalização aguenta lixo e repetição');
  assert(JSON.parse(serializePermissions(['finance', 'x'])).join() === 'finance', 'serializar remove inválidos');
  assert(Object.values(ACTION_PERMISSION).every((p) => p === 'admins_manage' || ALL_PERMISSION_KEYS.includes(p as any)), 'toda ação mapeia para uma permissão existente');
  assert(ACTION_PERMISSION['create_admin'] === 'admins_manage' && ACTION_PERMISSION['refund_order'] === 'refunds', 'criar admin só master; estorno exige permissão própria');
  assert(Object.values(EXPORT_PERMISSION).every((p) => ALL_PERMISSION_KEYS.includes(p as any)), 'toda planilha mapeia para uma permissão existente');
  assert(PERMISSIONS.length === ALL_PERMISSION_KEYS.length, 'catálogo de permissões consistente');
  const fakeData = { metrics: { a: 1 }, signupsByDay: [], finance: { r: 1 }, payments: [1], users: [1], coupons: [1], affiliates: [1], withdrawals: [1], audit: [1], admins: [1] };
  const f1 = filterDashboardByPermissions(fakeData, ['overview', 'users_view']);
  assert(f1.metrics && f1.users && !f1.finance && !f1.payments && !f1.coupons && !f1.audit && !f1.admins && !f1.withdrawals, 'filtro esconde o que não tem permissão (valores, auditoria, admins)');
  const f2 = filterDashboardByPermissions(fakeData, ['finance']);
  assert(f2.finance && f2.payments && !f2.metrics && !f2.users, 'só finanças: sem números de usuários nem lista de usuários');
  assert(can(['coupons'], 'coupons') && !can(['coupons'], 'finance'), 'can() confere permissão');
  assert(ACTION_PERMISSION['moderate_content'] === 'moderation' && ACTION_PERMISSION['set_user_muted'] === 'moderation' && ACTION_PERMISSION['set_team_active'] === 'moderation', 'moderar, silenciar e suspender equipe exigem a permissão de moderação');
  assert(filterDashboardByPermissions({ ...fakeData, moderation: { x: 1 } }, ['moderation']).moderation && !filterDashboardByPermissions({ ...fakeData, moderation: { x: 1 } }, ['coupons']).moderation, 'fila de moderação só aparece para quem tem permissão');
  console.log('✓ Todos os testes de permissões passaram com sucesso!');

  // 9. Ciclo de pagamento (quarta 23:59 BRT -> quinta/sexta), Pix e conteúdo do afiliado
  console.log('9. Testando ciclo de saque, chave Pix e conteúdo do afiliado...');
  // 28/10/2026 é quarta-feira. 23:30 em Brasília = 02:30 UTC do dia 29.
  const wedLate = payoutCycle(new Date('2026-10-29T02:30:00Z'));
  assert(wedLate.thursday === '2026-10-29' && wedLate.friday === '2026-10-30' && wedLate.wednesday === '2026-10-28', 'pedido na quarta 23:30 entra no ciclo da própria semana (quinta 29/10, sexta 30/10)');
  const thuEarly = payoutCycle(new Date('2026-10-29T13:00:00Z')); // quinta 10:00 BRT
  assert(thuEarly.thursday === '2026-11-05' && thuEarly.friday === '2026-11-06', 'pedido na quinta perde o prazo e vai para a semana seguinte');
  const wedJustAfter = payoutCycle(new Date('2026-10-29T03:00:00Z')); // quarta 24:00 = quinta 00:00 BRT
  assert(wedJustAfter.thursday === '2026-11-05', 'meia-noite de quinta já é o ciclo seguinte');
  const sun = payoutCycle(new Date('2026-11-01T15:00:00Z')); // domingo
  assert(sun.wednesday === '2026-11-04' && sun.thursday === '2026-11-05', 'domingo fecha na quarta seguinte');
  const mon = cycleStatus(new Date('2026-11-02T15:00:00Z')); // segunda 12:00 BRT
  assert(mon.countdown.startsWith('2 dias') && !mon.lastDay, `segunda ao meio-dia: ${mon.countdown}`);
  const tueNight = cycleStatus(new Date('2026-11-04T12:00:00Z')); // quarta 09:00 BRT
  assert(tueNight.lastDay && tueNight.countdown === '14 horas', `quarta 09:00 faltam ${tueNight.countdown}`);
  assert(describeCountdown(0) === 'encerrado' && describeCountdown(30 * 60000) === 'menos de 1 hora' && describeCountdown(26 * 3600000) === '1 dia e 2 horas', 'texto do contador');
  assert(shortDateBR('2026-11-05') === '05/11' && payoutDatesText(thuEarly) === 'quinta 05/11 e sexta 06/11', 'datas curtas');

  assert(validatePix('529.982.247-25', 'cpf').ok && validatePix('52998224725', 'cpf').value === '52998224725', 'CPF válido aceito e normalizado');
  assert(!validatePix('111.111.111-11', 'cpf').ok && !validatePix('529.982.247-24', 'cpf').ok, 'CPF repetido ou com dígito errado recusado');
  assert(validatePix(' Joao@Email.COM ', 'email').value === 'joao@email.com' && !validatePix('sem-arroba', 'email').ok, 'e-mail normalizado e validado');
  assert(validatePix('(24) 99999-9999', 'telefone').value === '24999999999' && validatePix('+55 24 99999-9999', 'telefone').value === '24999999999', 'celular normalizado, com ou sem +55');
  assert(!validatePix('(24) 8999-99', 'telefone').ok && !validatePix('(00) 99999-9999', 'telefone').ok, 'celular curto ou DDD inválido recusado');
  assert(validatePix('123E4567-E89B-12D3-A456-426614174000', 'aleatoria').ok && !validatePix('123', 'aleatoria').ok, 'chave aleatória (UUID)');
  assert(!validatePix('', 'cpf').ok, 'chave vazia recusada');
  assert(formatPix('52998224725', 'cpf') === '529.982.247-25' && formatPix('24999999999', 'telefone') === '(24) 99999-9999', 'formatação para exibir');

  assert(STORY_MODELS.length === 10 && new Set(STORY_MODELS.map((m) => m.id)).size === 10, 'são 10 modelos de story, todos com id único');
  const banned = /renda garantida|dinheiro f[aá]cil|ganhe dinheiro|enrique|sem esfor[cç]o|milagre|lucro garantido|vai mudar sua vida/i;
  assert(STORY_MODELS.every((m) => !banned.test(`${m.headline} ${m.sub} ${m.caption}`)), 'nenhum modelo promete renda ou milagre');
  assert(STORY_MODELS.every((m) => m.caption.includes('{link}') && /indica[cç][aã]o|7 dias gr[aá]tis/i.test(m.caption)), 'toda legenda tem o espaço {link} e identifica o link de indicação');
  assert(COURSE_LESSONS.length === 5, 'mini curso com 5 lições');
  const words = courseWordCount();
  assert(words >= 650 && words <= 1100, `mini curso cabe numa leitura de ~5 minutos (${words} palavras)`);
  assert(COURSE_LESSONS.some((l) => l.body.join(' ').includes('quarta-feira, 23:59')), 'mini curso explica o prazo de quarta 23:59');
  console.log('✓ Todos os testes de saque, Pix e conteúdo do afiliado passaram com sucesso!');

  // 10. Modo ajuda de configuração (primeiro acesso)
  console.log('10. Testando o modo ajuda de configuração...');
  const NAV_IDS = ['hoje', 'roteiro', 'rotina', 'quadros', 'habitos', 'foco', 'diario', 'financas', 'whatsapp', 'planilha', 'afiliados', 'feed', 'progresso', 'configuracoes'];
  assert(GUIDE_STEPS.map((x) => x.tab).join() === NAV_IDS.join(), 'o guia passa por TODAS as abas, na ordem do menu');
  assert(new Set(GUIDE_STEPS.map((x) => x.id)).size === GUIDE_STEPS.length && GUIDE_STEPS.every((x) => x.tasks.length >= 2 && x.title && x.intro), 'cada passo tem título, explicação e tarefas');
  assert(GUIDE_STEPS.find((x) => x.tab === 'roteiro')?.action?.id === 'open_cycle', 'passo da meta oferece abrir o ciclo');
  assert(GUIDE_STEPS.find((x) => x.tab === 'afiliados')!.tasks.join(' ').includes('quarta-feira, 23:59'), 'passo de afiliados explica o prazo de quarta 23:59');
  assert(parseGuideState('{"status":"open","step":4}')?.step === 4 && parseGuideState('{"status":"done","step":99}')?.step === GUIDE_STEPS.length - 1, 'lê o progresso salvo e limita o passo');
  assert(parseGuideState('lixo') === null && parseGuideState(null) === null && parseGuideState('{"status":"x"}') === null, 'estado inválido é ignorado');
  const nowG = new Date('2026-10-29T12:00:00Z');
  assert(shouldAutoStartGuide(null, '2026-10-27T10:00:00Z', nowG) === true, 'conta nova sem estado: abre sozinho');
  assert(shouldAutoStartGuide(null, '2026-08-01T10:00:00Z', nowG) === false, 'conta antiga: não abre sozinho (usa o botão)');
  assert(shouldAutoStartGuide({ status: 'skipped', step: 3 }, '2026-10-28T10:00:00Z', nowG) === false && shouldAutoStartGuide({ status: 'done', step: 12 }, '2026-10-28T10:00:00Z', nowG) === false && shouldAutoStartGuide({ status: 'open', step: 2 }, '2026-10-28T10:00:00Z', nowG) === false, 'quem já interagiu não é interrompido de novo');
  assert(shouldAutoStartGuide(null, undefined, nowG) === true, 'sem data de cadastro: trata como conta nova');
  console.log('✓ Todos os testes do modo ajuda passaram com sucesso!');

  // 11. Feed e equipes: divisão 40/60, validação, acesso, conquistas e limites
  console.log('11. Testando regras do Feed e das Equipes...');
  assert(TEAM_PLATFORM_FEE_PERCENT === 40, 'plataforma retém 40%');
  assert(JSON.stringify(splitTeamPayment(10000)) === '{"platformFeeCents":4000,"ownerCents":6000}', '10.000 centavos: 4.000 plataforma / 6.000 criador');
  const odd = splitTeamPayment(1999);
  assert(odd.platformFeeCents === 799 && odd.ownerCents === 1200 && odd.platformFeeCents + odd.ownerCents === 1999, 'centavos quebrados: arredonda a taxa para baixo, criador nunca recebe menos de 60%');
  for (const g of [500, 777, 4990, 12345, 200000]) { const x = splitTeamPayment(g); assert(x.platformFeeCents + x.ownerCents === g && x.ownerCents * 100 >= g * 60, `soma fecha e criador >= 60% (${g})`); }

  assert(validateTeamInput({ name: '  Treino   do João ', description: 'Treinos', priceCents: 4990, periodDays: 30, freeForReferred: true }).ok, 'equipe válida');
  assert(validateTeamInput({ name: 'ab', priceCents: 0, periodDays: 0 }).ok === false, 'nome curto recusado');
  assert(validateTeamInput({ name: 'Equipe', priceCents: 100, periodDays: 0 }).ok === false && validateTeamInput({ name: 'Equipe', priceCents: 300000, periodDays: 0 }).ok === false, 'preço fora da faixa recusado');
  assert(validateTeamInput({ name: 'Equipe grátis', priceCents: 0, periodDays: 0 }).ok, 'equipe grátis permitida');
  assert(validateTeamInput({ name: 'Equipe', priceCents: 1000, periodDays: 7 }).ok === false && validateTeamInput({ name: 'Equipe', priceCents: 10.5, periodDays: 0 }).ok === false, 'período e centavos inválidos recusados');
  assert(validateTeamInput({ name: ' Treino   do João ', priceCents: 0 }).value?.name === 'Treino do João', 'nome normalizado');
  assert(validateTeamInput({ name: 'Equipe', priceCents: 0 }).value?.membersCanPost === false && validateTeamInput({ name: 'Equipe', priceCents: 0, membersCanPost: true }).value?.membersCanPost === true, 'por padrão só o criador publica na equipe');
  const code = teamCodeFrom('Personal João — Treino Funcional!', () => 0.5);
  assert(isValidTeamCode(code) && code.startsWith('personal-joao-treino-func'), 'código da equipe: ' + code);
  assert(!isValidTeamCode('Com Espaço') && !isValidTeamCode('../etc') && !isValidTeamCode('a'.repeat(50)), 'código só aceita letras minúsculas, números e hífen');

  assert(membershipActive({ status: 'active', expiresAt: null }, '2026-10-30') && membershipActive({ status: 'active', expiresAt: '2026-10-30' }, '2026-10-30'), 'acesso sem prazo e no último dia');
  assert(!membershipActive({ status: 'active', expiresAt: '2026-10-29' }, '2026-10-30') && !membershipActive({ status: 'removed', expiresAt: null }, '2026-10-30') && !membershipActive(null, '2026-10-30'), 'vencido, removido ou inexistente: sem acesso');
  assert(nextMembershipExpiry(null, '2026-10-30', 30) === '2026-11-29' && nextMembershipExpiry('2026-11-05', '2026-10-30', 30) === '2026-12-05' && nextMembershipExpiry('2026-10-01', '2026-10-30', 30) === '2026-11-29' && nextMembershipExpiry('2026-11-05', '2026-10-30', 0) === null, 'renovação soma 30 dias ao que sobrou; único não vence');
  assert(teamPriceLabel(0, 0) === 'Grátis' && teamPriceLabel(4990, 30).includes('a cada 30 dias') && teamPriceLabel(4990, 0).includes('acesso único'), 'texto do preço');
  assert(qualifiesForFreeAccess({ freeForReferred: true }, 'RITMO-A', 'RITMO-A') && !qualifiesForFreeAccess({ freeForReferred: true }, 'RITMO-A', 'RITMO-B') && !qualifiesForFreeAccess({ freeForReferred: false }, 'RITMO-A', 'RITMO-A') && !qualifiesForFreeAccess({ freeForReferred: true }, 'RITMO-A', null), 'acesso grátis só para quem veio pelo link do criador (e se ele permitir)');

  assert(normalizeText('  oi\u0000\u202E  mundo\n\n\n\n fim  ', 100) === 'oi  mundo\n\n fim' && normalizeText('x'.repeat(5000), FEED_LIMITS.postMax).length === 2000 && normalizeText(null, 10) === '', 'texto: remove controle, limita e apara');
  assert(displayName('João Batista da Silva') === 'João S.' && displayName('Ana') === 'Ana' && displayName('') === 'Usuário' && initials('joão batista') === 'JB', 'nome no feed: primeiro nome + inicial do sobrenome');
  assert(sanitizeAchievement({ type: 'corrente', habit: ' Treino ', weeks: 5 })?.type === 'corrente' && sanitizeAchievement({ type: 'corrente', habit: 'x', weeks: 0 }) === null && sanitizeAchievement({ type: 'foco', minutes: 120 })?.type === 'foco', 'conquistas válidas');
  assert(sanitizeAchievement({ type: 'tarefas', done: 5, total: 3 }) === null && sanitizeAchievement({ type: 'meta', title: 'x', day: 9, totalDays: 7 }) === null && sanitizeAchievement({ type: 'hack', x: 1 }) === null && sanitizeAchievement('x') === null && sanitizeAchievement({ type: 'foco', minutes: 'abc' }) === null, 'conquista fora do formato é recusada');
  assert(achievementHeadline({ type: 'corrente', habit: 'Treino', weeks: 1 }).startsWith('1 semana seguida') && achievementHeadline({ type: 'tarefas', done: 4, total: 6 }).includes('4 de 6'), 'texto da conquista');
  assert(parsePayload('{"type":"foco","minutes":30}')?.type === 'foco' && parsePayload('lixo') === null && parsePayload(null) === null, 'lê o payload salvo com segurança');
  const nowMs = Date.UTC(2026, 9, 30, 12, 0, 0);
  assert(rateLimited([nowMs - 1000, nowMs - 2000], 3600000, 2, nowMs) && !rateLimited([nowMs - 4000000], 3600000, 1, nowMs) && !rateLimited([], 3600000, 1, nowMs), 'limite por janela de tempo');
  const nowD = new Date('2026-10-30T12:00:00Z');
  assert(timeAgo('2026-10-30T11:59:40Z', nowD) === 'agora há pouco' && timeAgo('2026-10-30T11:30:00Z', nowD) === 'há 30 min' && timeAgo('2026-10-30T09:00:00Z', nowD) === 'há 3 h' && timeAgo('2026-10-28T12:00:00Z', nowD) === 'há 2 dias', 'tempo relativo em português');
  console.log('✓ Todos os testes de Feed e Equipes passaram com sucesso!');

  // 12. Conquistas compartilháveis (calculadas dos dados da própria pessoa)
  console.log('12. Testando conquistas compartilháveis...');
  const sh = computeShareable({
    today: '2026-10-28',
    habits: [{ id: 1, name: 'Treino', targetFrequency: '3x_semana', createdAt: '2026-10-05T12:00:00' }, { id: 2, name: 'Leitura', targetFrequency: 'diario', createdAt: '2026-10-27T12:00:00' }],
    habitLogs: ['2026-10-05','2026-10-07','2026-10-09','2026-10-12','2026-10-14','2026-10-16','2026-10-19','2026-10-21','2026-10-23','2026-10-26','2026-10-27','2026-10-28'].map((date) => ({ habitId: 1, date, completed: true })),
    sessions: [{ date: '2026-10-27', durationMinutes: 25, status: 'completed' }, { date: '2026-10-28', durationMinutes: 50, status: 'completed' }, { date: '2026-10-28', durationMinutes: 25, status: 'canceled' }, { date: '2026-10-10', durationMinutes: 90, status: 'completed' }],
    tasks: [{ date: '2026-10-27', completed: true }, { date: '2026-10-28', completed: false }, { date: '2026-10-05', completed: true }],
    activeCycle: { startDate: '2026-10-20', durationDays: 40, mainGoal: 'Correr 5 km' },
  });
  const byType = (t: string) => sh.filter((a) => a.type === t);
  assert(byType('corrente').length === 1 && (byType('corrente')[0] as any).habit === 'Treino' && (byType('corrente')[0] as any).weeks === 4, 'corrente do hábito cumprido (hábito sem semana cumprida não aparece)');
  assert(byType('foco').length === 1 && (byType('foco')[0] as any).minutes === 75, 'foco: soma só sessões concluídas da semana atual');
  assert(byType('tarefas').length === 1 && (byType('tarefas')[0] as any).done === 1 && (byType('tarefas')[0] as any).total === 2, 'tarefas: só as da semana atual');
  assert(byType('meta').length === 1 && (byType('meta')[0] as any).day === 9 && (byType('meta')[0] as any).totalDays === 40, 'meta: dia do ciclo');
  assert(computeShareable({ habits: [], habitLogs: [], sessions: [], tasks: [], activeCycle: null, today: '2026-10-28' }).length === 0, 'sem dados: nada para compartilhar');
  assert(sh.every((a) => sanitizeAchievement(a) !== null), 'toda conquista gerada passa na validação do servidor');
  console.log('✓ Todos os testes de conquistas passaram com sucesso!');

  // 13. Avisos do sino
  console.log('13. Testando avisos do app...');
  const baseN = { today: '2026-10-28', hour: 10, now: new Date('2026-10-28T13:00:00Z'), tasks: [] as any[], transactions: [] as any[], habits: [] as any[], habitLogs: [] as any[], journalToday: true };
  assert(computeNotices(baseN).length === 0, 'sem pendências: nenhum aviso');
  const nA = computeNotices({ ...baseN, access: { effectiveStatus: 'trial', daysLeft: 1, hasAccess: true } });
  assert(nA.length === 1 && nA[0].level === 'urgent' && nA[0].href === '/checkout', 'teste acabando: aviso urgente com link para assinar');
  assert(computeNotices({ ...baseN, isAdmin: true, access: { effectiveStatus: 'trial', daysLeft: 0, hasAccess: true } }).length === 0, 'administrador não recebe aviso de assinatura');
  assert(computeNotices({ ...baseN, access: { effectiveStatus: 'active', daysLeft: 3, hasAccess: true } })[0]?.id === 'renew', 'assinatura vencendo');
  const nB = computeNotices({ ...baseN, transactions: [
    { type: 'expense', description: 'Luz', amountCents: 15000, date: '2026-10-20', dueDate: '2026-10-25', status: 'pending' },
    { type: 'expense', description: 'Internet', amountCents: 10000, date: '2026-10-20', dueDate: '2026-10-30', status: 'pending' },
    { type: 'expense', description: 'Paga', amountCents: 9999, date: '2026-10-20', dueDate: '2026-10-25', status: 'paid' },
    { type: 'income', description: 'Cliente', amountCents: 50000, date: '2026-10-20', dueDate: '2026-10-29', status: 'pending' },
  ] });
  assert(nB.map((n) => n.id).join() === 'bills-late,bills-soon,income-soon' && nB[0].detail.includes('150,00') && !nB[0].detail.includes('Paga'), 'contas: atrasada (urgente), a vencer e recebimento; conta paga ignorada');
  assert(computeNotices({ ...baseN, config: { financeDue: false }, transactions: [{ type: 'expense', description: 'Luz', amountCents: 1, date: '2026-10-20', dueDate: '2026-10-25', status: 'pending' }] }).length === 0, 'respeita a opção de lembrar contas desligada');
  const nC = computeNotices({ ...baseN, hour: 13, minutes: 30, tasks: [{ title: 'Reunião', date: '2026-10-28', startTime: '14:00', completed: false }, { title: 'Ontem', date: '2026-10-27', startTime: '09:00', completed: false }] });
  assert(nC.length === 1 && nC[0].id === 'task-soon' && nC[0].title.includes('14:00'), 'tarefa com horário nas próximas 2 horas (tarefa de outro dia ignorada)');
  assert(computeNotices({ ...baseN, hour: 15, tasks: [{ title: 'Cedo', date: '2026-10-28', startTime: '09:00', completed: false }] })[0]?.id === 'task-missed', 'tarefa com horário que passou');
  assert(computeNotices({ ...baseN, hour: 21, journalToday: false }).some((n) => n.id === 'journal') && !computeNotices({ ...baseN, hour: 19, journalToday: false }).some((n) => n.id === 'journal'), 'diário só lembrado à noite');
  const nD = computeNotices({ ...baseN, hour: 18, habits: [{ id: 1, name: 'Treino', targetFrequency: '3x_semana', createdAt: '2026-10-05T12:00:00' }], habitLogs: ['2026-10-05','2026-10-07','2026-10-09','2026-10-12','2026-10-14','2026-10-16','2026-10-19','2026-10-21','2026-10-23'].map((date) => ({ habitId: 1, date, completed: true })) });
  assert(nD.some((n) => n.id === 'habits-today'), 'hábito ainda não marcado, depois das 17h');
  assert(computeNotices({ ...baseN, now: new Date('2026-11-04T14:00:00Z'), today: '2026-11-04', affiliateBalanceCents: 3000 }).some((n) => n.id === 'payout') && !computeNotices({ ...baseN, now: new Date('2026-11-02T14:00:00Z'), today: '2026-11-02', affiliateBalanceCents: 3000 }).some((n) => n.id === 'payout'), 'prazo do saque só avisa no último dia (quarta)');
  assert(computeNotices({ ...baseN, now: new Date('2026-11-04T14:00:00Z'), today: '2026-11-04', affiliateBalanceCents: 1000 }).every((n) => n.id !== 'payout'), 'sem saldo mínimo não avisa saque');
  assert(computeNotices({ ...baseN, access: { effectiveStatus: 'trial', daysLeft: 1, hasAccess: true }, transactions: [{ type: 'expense', description: 'x', amountCents: 1, date: '2026-10-20', dueDate: '2026-10-25', status: 'pending' }, { type: 'income', description: 'y', amountCents: 1, date: '2026-10-20', dueDate: '2026-10-29', status: 'pending' }] }).map((n) => n.level).join() === 'urgent,urgent,info', 'avisos ordenados: urgentes primeiro');
  console.log('✓ Todos os testes de avisos passaram com sucesso!');

  console.log('🎉 Todos os testes unitários do Ritmo foram concluídos com êxito!');
}
