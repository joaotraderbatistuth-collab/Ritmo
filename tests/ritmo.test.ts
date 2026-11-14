import { burn, estimateBalance, daysLeft, creditLevel, hourKey, parseAnchor, CREDIT_PRICES } from '../src/lib/credits.js';
import { parsePlan, nudgeUtcHours, shouldRunNudges, shouldRunReminders, isSeasonHour, withReminder, localHour, SEASON_UTC_HOURS } from '../src/lib/wake-plan.js';
import { parseMaxAccounts, signupOpen, spotsLeft, cleanWaitlistEntry, DEFAULT_MAX_ACCOUNTS } from '../src/lib/signup-limit.js';
import { validateAdminNotification, broadcastWaitMinutes } from '../src/lib/admin-notify.js';
import { RITMO_TONE, toneLength, RITMO_VIBRATE } from '../src/lib/notify-sound.js';
import { parseWhatsAppMessage } from '../src/lib/whatsapp-parser.js';
import { calculateAffiliateCommission, formatBRL } from '../src/lib/affiliate-engine.js';
import { convertTransactionsToCSV, formatTransactionForSheet } from '../src/lib/sheets-sync.js';
import { FinanceTransactionItem } from '../src/lib/types.js';
import { computeAccess, nextRenewalDate, isFounderSignup, FOUNDER_SPOTS } from '../src/lib/access.js';
import { computeChain, weekStartKey, targetPerWeek } from '../src/lib/chain.js';
import { DEFAULT_VISIBLE, normalizeVisible, moveCard, moveBefore, hideCard, showCard, hiddenCards, CARD_IDS } from '../src/lib/home-layout.js';
import { calculateCommissionChain, COMMISSION_TOTAL_PERCENT, COMMISSION_DIRECT_PERCENT, COMMISSION_NETWORK_PERCENT, MAX_COMMISSION_LEVELS, levelPercent } from '../src/lib/commission-plan.js';
import { PERMISSIONS, ALL_PERMISSION_KEYS, normalizePermissions, serializePermissions, isMasterEmail, effectivePermissions, can, ACTION_PERMISSION, EXPORT_PERMISSION, filterDashboardByPermissions } from '../src/lib/admin-permissions.js';
import { payoutCycle, cycleStatus, describeCountdown, shortDateBR, payoutDatesText } from '../src/lib/payout-schedule.js';
import { validatePix, formatPix } from '../src/lib/pix.js';
import { STORY_MODELS, COURSE_LESSONS, courseWordCount } from '../src/lib/affiliate-content.js';
import { GUIDE_STEPS, parseGuideState, shouldAutoStartGuide } from '../src/lib/setup-guide.js';
import { splitTeamPayment, validateTeamInput, teamCodeFrom, isValidTeamCode, membershipActive, nextMembershipExpiry, teamPriceLabel, qualifiesForFreeAccess, TEAM_PLATFORM_FEE_PERCENT } from '../src/lib/teams-plan.js';
import { normalizeText, displayName, initials, sanitizeAchievement, achievementHeadline, parsePayload, rateLimited, timeAgo, FEED_LIMITS } from '../src/lib/feed-rules.js';
import { computeShareable } from '../src/lib/achievements.js';
import { findRepeat, firstOccurrence, nextOccurrence, repeatLabel, isValidRepeat } from '../src/lib/recurrence.js';
import { parseOfficialIds, toggleOfficial, officialPostPush, OFFICIAL_MAX } from '../src/lib/official.js';
import { mergeActivity, activityText, socialPush, badgeLabel, rankSuggestions, snippet } from '../src/lib/social.js';
import { detectStop, detectResume, personalRecords, newRecords, recordValueLabel, smoothFix, fixTime, kmCueText } from '../src/lib/workout.js';
import type { GpsPoint, SmoothState } from '../src/lib/workout.js';
import { pickMissions, missionProgress, chestReward, computeStreak, nextMilestone, weekSummary, nextTier, rankInGroup, mondayOf, MISSION_POOL } from '../src/lib/missions.js';
import { computeNotices } from '../src/lib/notices.js';
import { generateRoadmap, roadmapProgress, stepStatus } from '../src/lib/roadmap.js';
import { nextSteps } from '../src/lib/next-step.js';
import { computeMedals, monthRecap, MEDALS, PUBLIC_MEDAL_GROUPS, RARITY, rarityOf } from '../src/lib/medals.js';
import { eventOfWeek, eventBonus, EVENT_DAILY_MAX, WEEK_EVENTS, passReached, passView, SEASON_PASS, chestDaysInWeek, weekChestReward, mascotState, friendsRanking } from '../src/lib/game-extras.js';
import { HELP } from '../src/lib/help-texts.js';
import { cardFromAchievement, cardFromMedal, shareMessage, shortLink, sanitizeShare, makeSlug, isSlug, escapeHtml } from '../src/lib/share-card.js';
import { suggestedTarget, clampTarget, challengeProgress, challengeStatus, challengeNudge, challengeCode, isChallengeCode } from '../src/lib/challenges.js';
import { canSendAuto, DAILY_PUSH_MAX } from '../src/lib/nudges.js';
import { starterHabits } from '../src/lib/survey.js';
import { DIVISIONS, TOP_TIER, zoneSizes, zoneFor, nextDivision, seasonGoals, seasonNudge, seasonPoints, daysLeftIn, prevMonth, lastDayOf, seasonLabel, rankOf } from '../src/lib/season.js';
import { luckyDrop, LUCKY_START, nextCombo, goalProgress, normalizeGoal, cheerFor, nearNextLevel, gainTone, fanfareTones, COMBO_WINDOW_MS } from '../src/lib/rewards.js';
import { nextDateAfter, normalizeTaskRule } from '../src/lib/recurrence.js';
import { normalizeFrequency, frequencyLabel } from '../src/lib/chain.js';
import { stepDaysFor } from '../src/lib/roadmap.js';
import { normalizePushHours, slotForAnyHour } from '../src/lib/nudges.js';
import { detectMoney, findAmount, stripAmount, moneyLabel, planReminders, isRoutineRule, isDoneListTitle, describeAuto, guessTaskCategory, minusMinutes, localToInstant, instantToLocal } from '../src/lib/autofill.js';
import { SURVEY_QUESTIONS, normalizeAnswers, answeredCount, shouldAskSurvey, summarizeSurveys, surveyCsvCells, surveyCsvHeader, optionLabel } from '../src/lib/survey.js';

/**
 * Ritmo Core Logic Test Suite
 * Tests Brazilian Portuguese financial parsing, affiliate rules, and spreadsheet formatting.
 */

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

import { computeMetrics, sourceLabel, weekStart } from '../src/lib/metrics.js';
import { cleanError, fingerprint as errFingerprint, isNoise, scrub } from '../src/lib/error-rules.js';
import { parseCommand, completeWith, resolveDateTime, extractAmount as _ea, dayLabel, timeLabel, cleanAssistantName, guessCategory, tidy, fold } from '../src/lib/assistant-parser.js';
import { minMoveFor } from '../src/lib/workout.js';
import { haversine, classifyPoint, trackStats, currentPace, formatDuration, formatPace, formatKm, encodePolyline, decodePolyline, simplify, simplifyTo, trimRoute, validateWorkout, autoTitle, totals as workoutTotals, SPORTS } from '../src/lib/workout.js';
import { computeXp, levelInfo, LEVELS, XP_RULES, XP_DAILY_MAX, frameForLevel, MAX_LEVEL } from '../src/lib/levels.js';
import { NUDGES, PUSH_HOURS, personalize, pickNudge, slotForHour } from '../src/lib/nudges.js';
import { parseBRLToCents } from '../src/lib/money.js';
import { isBundledImage, parseMediaUrl } from '../src/lib/media-url.js';
import { SEED_RITUS, seedRitusStatements } from '../src/lib/ritus-seed.js';
import { sanitizeAchievement as sanitizeAchievementT } from '../src/lib/feed-rules.js';
import { isValidTeamCode as isValidTeamCodeT } from '../src/lib/teams-plan.js';

const addDaysTest = (ymd: string, n: number) => new Date(new Date(`${ymd}T12:00:00Z`).getTime() + n * 86400000).toISOString().slice(0, 10);

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
  // Fundadores (50 primeiros): acesso vitalício, mesmo com o teste vencido; suspenso continua bloqueado
  assert(computeAccess({ subscriptionStatus: 'trial', trialEndsAt: '2026-10-09T12:00:00Z', founder: true }, now).hasAccess === true, 'fundador com teste vencido tem acesso');
  assert(computeAccess({ subscriptionStatus: 'trial', founder: true }, now).lifetime === true, 'fundador é vitalício');
  assert(computeAccess({ subscriptionStatus: 'suspended', founder: true }, now).hasAccess === false, 'fundador suspenso não tem acesso');
  assert(FOUNDER_SPOTS === 50 && isFounderSignup(0) && isFounderSignup(49) && !isFounderSignup(50), 'só os 50 primeiros viram fundadores');
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
  assert(ACTION_PERMISSION['create_admin'] === 'admins_create' && ACTION_PERMISSION['set_admin_permissions'] === 'admins_manage' && ACTION_PERMISSION['refund_order'] === 'refunds', 'cadastrar admin exige permissão própria; alterar admins só master; estorno exige permissão própria');
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
  const NAV_IDS = ['hoje', 'roteiro', 'rotina', 'quadros', 'habitos', 'foco', 'diario', 'financas', 'afiliados', 'feed', 'progresso', 'configuracoes'];
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

  console.log('14. Testando lembretes, valores, fotos e Ritus gratuitos...');
  assert(NUDGES.length >= 60 && new Set(NUDGES.map((n) => n.id)).size === NUDGES.length, 'mais de 60 lembretes, sem id repetido');
  assert((['manha', 'tarde', 'noite'] as const).every((sl) => NUDGES.filter((n) => n.slot === sl).length >= 20), 'pelo menos 20 lembretes por período');
  assert(slotForHour(7) === 'manha' && slotForHour(13) === 'tarde' && slotForHour(20) === 'noite' && slotForHour(3) === null, 'períodos do dia (madrugada sem lembrete)');
  assert(pickNudge('manha', '2026-11-05', 1).id !== pickNudge('manha', '2026-11-06', 1).id, 'lembrete muda de um dia para o outro');
  const seen = new Set(Array.from({ length: 20 }, (_, d) => pickNudge('tarde', addDaysTest('2026-11-01', d), 42).id));
  assert(seen.size === 20, '20 dias seguidos sem repetir o lembrete da tarde');
  assert(personalize('Bom dia, {nome}!', 'João Batista') === 'Bom dia, João!' && personalize('Bom dia, {nome}!', '') === 'Bom dia!', 'personaliza com o primeiro nome');
  assert(PUSH_HOURS[1].length === 1 && PUSH_HOURS[3].length === 3, 'notificações: 1 a 3 por dia');
  assert(parseBRLToCents('50') === 5000 && parseBRLToCents('1.234,56') === 123456 && parseBRLToCents('12,5') === 1250 && parseBRLToCents('R$ 30,00') === 3000, 'valores em reais viram centavos');
  assert(parseBRLToCents('abc') === null && parseBRLToCents('') === null && parseBRLToCents('10,999') === null, 'valor inválido é recusado');
  assert(parseMediaUrl('/api/media?k=0123456789abcdef0123456789abcdef') === '0123456789abcdef0123456789abcdef' && parseMediaUrl('https://x.com/a.png') === null && parseMediaUrl('/api/media?k=../../etc') === null, 'só aceita foto enviada pelo próprio app');
  assert(isBundledImage('/ritus/clube-do-livro.svg') && !isBundledImage('/ritus/../x.svg'), 'imagens dos Ritus iniciais');
  assert(sanitizeAchievementT({ type: 'sessao', minutes: 25, goal: 'Relatório' })?.type === 'sessao' && sanitizeAchievementT({ type: 'card', title: 'Fechar proposta' })?.type === 'card' && sanitizeAchievementT({ type: 'habito', habit: 'Leitura' })?.type === 'habito' && sanitizeAchievementT({ type: 'tarefa', title: 'Ligar pro banco' })?.type === 'tarefa', 'novas conquistas: foco, card, hábito e tarefa');
  assert(sanitizeAchievementT({ type: 'sessao', minutes: 0 }) === null && sanitizeAchievementT({ type: 'card', title: '' }) === null, 'conquista inválida é recusada');
  assert(SEED_RITUS.length === 10 && SEED_RITUS[0].code === 'clube-do-livro' && SEED_RITUS[0].posts.length === 11, '10 Ritus gratuitos e Clube do Livro com 10 resenhas + boas-vindas');
  assert(SEED_RITUS.every((r) => isValidTeamCodeT(r.code) && r.name.length <= 60 && r.description.length <= 600 && r.posts.every((p) => p.body.length <= 2000)), 'Ritus iniciais respeitam os limites do app');
  assert(seedRitusStatements('a@b.com').at(-1)!.includes('seed_ritus_v1'), 'seed grava o marcador por último');
  console.log('✓ Todos os testes de lembretes, valores, fotos e Ritus gratuitos passaram com sucesso!');

  console.log('15. Testando Pontos de Ritmo, níveis e molduras...');
  assert(LEVELS.length === 12 && LEVELS.every((l, i) => l.level === i + 1 && (i === 0 || l.minXp > LEVELS[i - 1].minXp)), '12 níveis em ordem crescente de pontos');
  assert(levelInfo(0).level === 1 && levelInfo(99).level === 1 && levelInfo(100).level === 2 && levelInfo(15000).level === MAX_LEVEL && levelInfo(999999).nextXp === null, 'nível certo para cada faixa de pontos');
  const li = levelInfo(450);
  assert(li.level === 3 && li.name === 'Iniciante' && li.xpToNext === 150 && Math.abs(li.progress - 0.5) < 1e-9, 'progresso dentro do nível');
  assert(levelInfo(-5).xp === 0 && levelInfo(NaN as any).level === 1, 'pontos inválidos viram zero');
  assert(frameForLevel(1).id === 'simples' && frameForLevel(3).id === 'bronze' && frameForLevel(5).id === 'prata' && frameForLevel(7).id === 'ouro' && frameForLevel(9).id === 'diamante' && frameForLevel(12).id === 'lendaria' && frameForLevel(99).id === 'lendaria', 'molduras por nível');
  const emptyXp = { habitLogs: [], tasks: [], sessions: [], journal: [], transactions: [], posts: [], comments: [], today: '2026-11-05' };
  assert(computeXp(emptyXp).total === 0, 'sem atividade, zero pontos');
  const manyHabits = Array.from({ length: 20 }, () => ({ date: '2026-11-05', completed: true }));
  const rx = computeXp({ ...emptyXp, habitLogs: manyHabits });
  assert(rx.total === XP_RULES.habito.xp * XP_RULES.habito.dailyCap && rx.todayXp === rx.total, 'limite diário de hábitos');
  assert(computeXp({ ...emptyXp, habitLogs: [{ date: '2026-11-05', completed: false }] }).total === 0, 'hábito desmarcado não conta');
  assert(computeXp({ ...emptyXp, habitLogs: [{ date: '2026-11-04', completed: true }, { date: '2026-11-05', completed: true }] }).activeDays === 2, 'conta dias ativos');
  assert(computeXp({ ...emptyXp, since: '2026-11-01', habitLogs: [{ date: '2025-01-01', completed: true }, { date: '2026-12-01', completed: true }] }).total === 0, 'não conta antes da conta existir nem no futuro');
  const mixed = computeXp({ ...emptyXp, tasks: [{ date: '2026-11-01', completed: true, completedAt: '2026-11-05' }], sessions: [{ date: '2026-11-05', status: 'completed' }, { date: '2026-11-05', status: 'interrupted' }], journal: [{ date: '2026-11-05', entryType: 'daily_checkin' }, { date: '2026-11-05', entryType: 'daily_checkin' }, { date: '2026-11-02', entryType: 'weekly_review' }] });
  assert(mixed.breakdown.tarefa.xp === 5 && mixed.breakdown.foco.count === 1 && mixed.breakdown.diario.count === 1 && mixed.breakdown.revisao.xp === 30 && mixed.todayXp === 5 + 15 + 15, 'tarefa pelo dia de conclusão, foco só concluído, diário 1x por dia');
  assert(XP_DAILY_MAX < 700, 'limite diário total equilibrado');
  assert(sanitizeAchievementT({ type: 'nivel', level: 4, name: 'Hacker' })?.type === 'nivel' && (sanitizeAchievementT({ type: 'nivel', level: 4, name: 'Hacker' }) as any).name === 'Constante', 'nome do nível vem da tabela, não do navegador');
  assert(sanitizeAchievementT({ type: 'nivel', level: 1 }) === null && sanitizeAchievementT({ type: 'nivel', level: 99 }) === null, 'nível inválido para compartilhar é recusado');
  assert(achievementHeadline({ type: 'nivel', level: 5, name: 'Focado' }) === 'Subiu para o nível 5: Focado', 'texto da conquista de nível');
  console.log('✓ Todos os testes de pontos, níveis e molduras passaram com sucesso!');

  console.log('16. Testando treinos com GPS...');
  // 1 grau de latitude ≈ 111,2 km
  const d1 = haversine({ lat: 0, lng: 0 }, { lat: 1, lng: 0 });
  assert(Math.abs(d1 - 111195) < 100, 'haversine: 1 grau de latitude');
  // linha reta para o norte, 1 ponto a cada 10 m e 3 s (≈ 5:00 /km)
  const step = 10 / 111195;
  const line = (n: number, t0 = 0, lat0 = -22.47) => Array.from({ length: n }, (_, i) => ({ lat: lat0 + i * step, lng: -44.6, t: t0 + i * 3000, alt: 400 + (i % 50 < 25 ? i % 50 : 50 - (i % 50)), acc: 5 }));
  const run = line(501); // 5.000 m em 1.500 s
  const st = trackStats([run]);
  assert(Math.abs(st.distanceM - 5000) <= 5 && st.movingS === 1500, 'distância e tempo de 5 km');
  assert(st.splits.length === 5 && st.splits.every((sp) => Math.abs(sp.seconds - 300) <= 1 && sp.meters === 1000), '5 parciais de 5:00');
  assert(st.elevationGainM !== null && st.elevationGainM > 0, 'subida acumulada calculada');
  const paused = trackStats([line(101), line(101, 10_000_000, -22.47 + 200 * step)]);
  assert(Math.abs(paused.distanceM - 2000) <= 5 && paused.movingS === 600, 'pausa não soma distância nem tempo');
  assert(Math.abs((currentPace(run) || 0) - 300) < 2, 'ritmo atual nos últimos 200 m');
  assert(trackStats([line(31)]).splits.length === 1 && trackStats([line(31)]).splits[0].meters === 300, 'parcial final parcial');
  assert(trackStats([line(3)]).splits.length === 0, 'menos de 50 m não vira parcial');
  // filtro do GPS
  const p0 = { lat: -22.47, lng: -44.6, t: 0, acc: 5 };
  assert(classifyPoint(null, p0, 'corrida') === 'add', 'primeiro ponto entra');
  assert(classifyPoint(p0, { ...p0, lat: p0.lat + step, t: 3000, acc: 80 }, 'corrida') === 'skip', 'ponto impreciso é ignorado');
  assert(classifyPoint(p0, { ...p0, lat: p0.lat + step * 0.1, t: 3000 }, 'corrida') === 'still', 'tremida parada não soma');
  assert(classifyPoint(p0, { ...p0, lat: p0.lat + step * 100, t: 3000 }, 'corrida') === 'skip', 'pulo de 1 km em 3 s é erro do GPS');
  assert(classifyPoint(p0, { ...p0, lat: p0.lat + step * 5, t: 3000 }, 'bike') === 'add', 'pedal rápido é aceito');
  // GPS de celular no navegador (±45 m): grava andando, sem somar a tremida parado
  const m1 = 1 / 111_320; // ~1 m em latitude
  assert(classifyPoint(p0, { ...p0, lat: p0.lat + m1 * 25, t: 15000, acc: 45 }, 'caminhada') === 'add', 'GPS fraco (45 m) também grava quando anda');
  assert(classifyPoint(p0, { ...p0, lat: p0.lat + m1 * 10, t: 15000, acc: 45 }, 'caminhada') === 'still', 'GPS fraco: tremida de 10 m não vira distância');
  assert(classifyPoint(p0, { ...p0, lat: p0.lat + m1 * 5, t: 3000, acc: 8 }, 'caminhada') === 'add', 'GPS bom continua sensível (5 m)');
  assert(minMoveFor(10) === 3 && minMoveFor(45) === 18 && minMoveFor(65) === 30 && minMoveFor(null) === 3, 'passo mínimo conforme a precisão');
  // formatos
  assert(formatDuration(0) === '0:00' && formatDuration(65) === '1:05' && formatDuration(3725) === '1:02:05', 'cronômetro');
  assert(formatPace(332) === '5:32' && formatPace(null) === '--:--' && formatPace(0) === '--:--', 'ritmo min/km');
  assert(formatKm(5234) === '5,23' && formatKm(-1) === '0,00', 'km com vírgula');
  // polyline (exemplo oficial do Google)
  assert(encodePolyline([{ lat: 38.5, lng: -120.2 }, { lat: 40.7, lng: -120.95 }, { lat: 43.252, lng: -126.453 }]) === '_p~iF~ps|U_ulLnnqC_mqNvxq`@', 'polyline codifica');
  const back = decodePolyline('_p~iF~ps|U_ulLnnqC_mqNvxq`@');
  assert(back.length === 3 && Math.abs(back[2].lng + 126.453) < 1e-6, 'polyline decodifica');
  assert(decodePolyline('').length === 0 && decodePolyline('~~~~').length === 0, 'polyline quebrada não trava');
  // simplificar e privacidade
  assert(simplify(run, 2).length === 2, 'reta vira 2 pontos');
  const zig = Array.from({ length: 1000 }, (_, i) => ({ lat: -22.47 + i * step, lng: -44.6 + (i % 2) * step * 3 }));
  assert(simplifyTo(zig, 100).length <= 100, 'simplifica até o limite');
  const trimmed = trimRoute(run, 200);
  assert(trimmed.length > 0 && haversine(run[0], trimmed[0]) >= 199 && haversine(run[run.length - 1], trimmed[trimmed.length - 1]) >= 199, 'esconde 200 m do começo e do fim');
  assert(trimRoute(line(30), 200).length === 0, 'rota curta não é mostrada');
  // rota com poucos pontos (só as esquinas): o corte acontece no meio do trecho, não pula a esquina
  const corners = [{ lat: -22.47, lng: -44.6 }, { lat: -22.47 + 600 * step, lng: -44.6 }, { lat: -22.47 + 600 * step, lng: -44.6 + 600 * step }];
  const tc = trimRoute(corners, 200);
  assert(tc.length === 3 && Math.abs(haversine(corners[0], tc[0]) - 200) < 1 && Math.abs(haversine(corners[2], tc[2]) - 200) < 2, 'corte exato em 200 m mantendo a esquina');
  // validação do servidor
  const nowW = new Date('2026-11-05T15:00:00Z');
  const ok = validateWorkout({ sport: 'corrida', title: ' Corrida ', startedAt: '2026-11-05T10:00:00Z', movingS: 1500, elapsedS: 1600, distanceM: 5000, route: encodePolyline(run), splits: st.splits }, nowW);
  assert(ok.ok && ok.value.title === 'Corrida' && ok.value.splits.length === 5 && ok.value.source === 'gps', 'treino válido');
  assert(!validateWorkout({ sport: 'corrida', startedAt: '2026-11-05T10:00:00Z', movingS: 600, distanceM: 20000 }, nowW).ok, 'corrida a 120 km/h é recusada');
  assert(validateWorkout({ sport: 'bike', startedAt: '2026-11-05T10:00:00Z', movingS: 3600, distanceM: 30000 }, nowW).ok, 'pedal de 30 km/h é aceito');
  assert(!validateWorkout({ sport: 'natacao', startedAt: '2026-11-05T10:00:00Z', movingS: 600, distanceM: 1000 }, nowW).ok, 'modalidade desconhecida');
  assert(!validateWorkout({ sport: 'corrida', startedAt: '2026-11-05T10:00:00Z', movingS: 30, distanceM: 50 }, nowW).ok, 'treino de menos de 1 minuto');
  assert(!validateWorkout({ sport: 'corrida', startedAt: '2027-01-01T10:00:00Z', movingS: 600, distanceM: 1000 }, nowW).ok, 'treino no futuro');
  assert(!validateWorkout({ sport: 'corrida', startedAt: '2026-11-05T10:00:00Z', movingS: 600, distanceM: 1000, route: '<script>' }, nowW).ok, 'rota com caracteres inválidos');
  const man = validateWorkout({ sport: 'caminhada', startedAt: '2026-11-05T10:00:00Z', movingS: 1800, distanceM: 2500, route: 'abc', source: 'manual' }, nowW);
  assert(man.ok && man.value.route === '' && man.value.title.startsWith('Caminhada'), 'treino sem GPS não guarda rota e ganha título');
  assert(autoTitle('bike', new Date(2026, 10, 5, 7)) === 'Pedal da manhã' && autoTitle('corrida', new Date(2026, 10, 5, 20)) === 'Corrida da noite', 'título automático');
  assert(workoutTotals([{ distanceM: 1000, movingS: 300 }, { distanceM: 2000, movingS: 600 }]).distanceM === 3000, 'total da semana');
  assert(SPORTS.bike.usesPace === false && SPORTS.corrida.usesPace === true, 'pedal mostra km/h');
  // conquista no Feed e pontos
  const tr = sanitizeAchievementT({ type: 'treino', sport: 'corrida', distanceM: 5234, durationS: 1692, route: encodePolyline(simplifyTo(run, 50)) });
  assert(tr?.type === 'treino' && Boolean((tr as any).route), 'treino compartilhável no Feed');
  assert(achievementHeadline(tr!) === 'Corrida: 5,23 km em 28:12 (5:23 /km)', 'texto do treino no Feed');
  assert((sanitizeAchievementT({ type: 'treino', sport: 'corrida', distanceM: 1000, durationS: 600, route: 'x'.repeat(5000) }) as any)?.route === undefined, 'rota grande demais fica de fora');
  assert(sanitizeAchievementT({ type: 'treino', sport: 'voo', distanceM: 1000, durationS: 600 }) === null, 'modalidade inválida no Feed');
  const xpW = computeXp({ ...emptyXp, workouts: [{ date: '2026-11-05' }, { date: '2026-11-05' }, { date: '2026-11-05' }] });
  assert(xpW.breakdown.treino.count === 1 && xpW.total === 20, 'treino vale 20 pontos por DIA (3 treinos no mesmo dia não somam mais)');
  // constância: 4 dias diferentes na mesma semana (seg 02/11 a dom 08/11) valem mais que 4 treinos num dia
  const wk = computeXp({ ...emptyXp, today: '2026-11-08', workouts: [{ date: '2026-11-02' }, { date: '2026-11-04' }, { date: '2026-11-06' }, { date: '2026-11-08' }] });
  assert(wk.breakdown.treino.xp === 80 && wk.breakdown.constancia.xp === 5 + 10 + 15 && wk.total === 110, `constância no treino: ${wk.total}`);
  const next = computeXp({ ...emptyXp, today: '2026-11-10', workouts: [{ date: '2026-11-08' }, { date: '2026-11-09' }] });
  assert(next.breakdown.constancia.xp === 0, 'a semana nova recomeça a contagem (domingo e segunda são semanas diferentes)');
  // foco vale pelo tempo
  const fo = computeXp({ ...emptyXp, sessions: [{ date: '2026-11-05', status: 'completed', durationMinutes: 50 }, { date: '2026-11-05', status: 'completed', durationMinutes: 10 }] });
  assert(fo.breakdown.foco.xp === 30 + 6, `foco pelo tempo: ${fo.breakdown.foco.xp}`);
  // tudo vale ponto
  const ev = computeXp({ ...emptyXp, tasks: [{ date: '2026-11-06', completed: false, createdAt: '2026-11-05' }], events: [{ src: 'card', day: '2026-11-05' }, { src: 'curtida', day: '2026-11-05' }, { src: 'meta', day: '2026-11-05' }, { src: 'marco', day: '2026-11-05' }, { src: 'perfil', day: '2026-11-05' }, { src: 'constancia', day: '2026-11-05' }] });
  assert(ev.total === 2 + 3 + 1 + 40 + 25 + 30, `cada ação vale o seu peso (e constância não vem de fora): ${ev.total}`);
  console.log('✓ Todos os testes de treinos passaram com sucesso!');

  console.log('17. Testando o secretário (frases faladas)...');
  const nowA = new Date(2026, 10, 5, 13, 10); // quinta, 05/11/2026 13:10
  const pc = (t: string) => parseCommand(t, nowA, 'Rita') as any;
  const ex = (t: string, cents: number, desc: string, cat?: string, date = '2026-11-05') => {
    const r = pc(t);
    assert(r.kind === 'expense' && r.amountCents === cents && r.description === desc && (!cat || r.category === cat) && r.date === date, `gasto: "${t}" → ${JSON.stringify(r)}`);
  };
  ex('gastei 32 reais no almoço', 3200, 'Almoço', 'alimentacao');
  ex('lança custo de 45 no mercado', 4500, 'Mercado', 'alimentacao');
  ex('paguei R$ 150,90 de luz ontem', 15090, 'Luz', 'moradia', '2026-11-04');
  ex('gastei 2 mil e 500 no aluguel', 250000, 'Aluguel', 'moradia');
  ex('uber 18,50', 1850, 'Uber', 'transporte');
  ex('comprei um livro por 59 reais e 90 centavos', 5990, 'Livro', 'educacao');
  ex('Rita, gastei 1.234,56 na farmácia', 123456, 'Farmácia', 'saude');
  const inc = pc('recebi 2000 de salário');
  assert(inc.kind === 'income' && inc.amountCents === 200000 && inc.category === 'renda', 'receita');
  const noVal = pc('paguei a conta de luz');
  assert(noVal.kind === 'expense' && noVal.amountCents === null, 'gasto sem valor pede o valor');
  assert((completeWith(noVal, 'foi 180 reais', nowA) as any)?.amountCents === 18000, 'completa o valor depois');
  const ap = (t: string, title: string, date: string | null, time: string | null) => {
    const r = pc(t);
    assert(r.kind === 'appointment' && r.title === title && r.date === date && r.time === time, `agenda: "${t}" → ${JSON.stringify(r)}`);
  };
  ap('agenda dentista amanhã às 3 da tarde', 'Dentista', '2026-11-06', '15:00');
  ap('marca reunião com o Carlos sexta às 10h', 'Reunião com o Carlos', '2026-11-06', '10:00');
  ap('agenda consulta médica dia 12 às 9 e meia', 'Consulta médica', '2026-11-12', '09:30');
  ap('agendar corte de cabelo 20/11 às 18:30', 'Corte de cabelo', '2026-11-20', '18:30');
  ap('compromisso jantar com a Ana hoje às 20 horas', 'Jantar com a Ana', '2026-11-05', '20:00');
  ap('agenda academia na próxima segunda de manhã', 'Academia', '2026-11-09', '09:00');
  ap('agenda reunião dia 3', 'Reunião', '2026-12-03', null);
  const rm = (t: string, text: string, date: string | null, time: string | null) => {
    const r = pc(t);
    assert(r.kind === 'reminder' && r.text === text && r.date === date && r.time === time, `lembrete: "${t}" → ${JSON.stringify(r)}`);
  };
  rm('me lembra de pagar a luz dia 10', 'Pagar a luz', '2026-11-10', null);
  rm('me lembra de tomar água daqui a 30 minutos', 'Tomar água', '2026-11-05', '13:40');
  rm('Rita, me lembre de ligar pra minha mãe amanhã de manhã', 'Ligar pra minha mãe', '2026-11-06', '09:00');
  rm('me avisa às 15 e 30 para buscar as crianças', 'Buscar as crianças', null, '15:30');
  rm('lembrete comprar pão', 'Comprar pão', null, null);
  rm('me lembra de levar o lixo às 8 da noite', 'Levar o lixo', null, '20:00');
  rm('me lembra do aniversário da Bia 15 de dezembro', 'Aniversário da Bia', '2026-12-15', null);
  const pend = pc('lembrete comprar pão');
  assert((completeWith(pend, 'amanhã às 7', nowA) as any)?.date === '2026-11-06' && (completeWith(pend, 'amanhã às 7', nowA) as any)?.time === '07:00', 'completa o horário do lembrete');
  assert(completeWith(pend, 'sei lá', nowA) === null, 'resposta sem horário não completa');
  const rdt = resolveDateTime(null, '09:00', nowA);
  assert(rdt.date === '2026-11-06', 'hora que já passou hoje vai para amanhã');
  assert(resolveDateTime('2026-11-10', null, nowA).time === '09:00', 'lembrete sem hora toca às 9h');
  assert(pc('adiciona tarefa revisar contrato amanhã').kind === 'task' && pc('adiciona tarefa revisar contrato amanhã').date === '2026-11-06', 'tarefa');
  assert(pc('o que eu tenho amanhã').kind === 'agenda' && pc('o que eu tenho amanhã').date === '2026-11-06', 'agenda de amanhã');
  assert(pc('minha agenda de hoje').date === '2026-11-05', 'agenda de hoje');
  assert(pc('quanto gastei este mês').period === 'mes' && pc('quanto gastei hoje').period === 'hoje' && pc('quanto gastei essa semana').period === 'semana', 'quanto gastei');
  assert(pc('qual meu saldo').kind === 'balance' && pc('quais contas vencem').kind === 'bills' && pc('quantos pontos eu tenho').kind === 'points' && pc('quais são meus lembretes').kind === 'reminders', 'consultas');
  assert(pc('começar corrida').sport === 'corrida' && pc('bora pedalar').sport === 'bike' && pc('iniciar caminhada').sport === 'caminhada', 'começar treino');
  assert(pc('iniciar foco de 50 minutos no relatório').minutes === 50 && pc('iniciar foco de 50 minutos no relatório').topic === 'Relatório' && pc('começar um pomodoro').minutes === 25, 'começar foco');
  assert(pc('abre finanças').tab === 'financas' && pc('vai para o treino').tab === 'treino', 'abrir aba');
  assert(pc('marca leitura como feita').name === 'Leitura' && pc('fiz o hábito de meditação').name === 'Meditação', 'hábito feito');
  assert(pc('bom dia').kind === 'briefing' && pc('Rita, resumo do dia').kind === 'briefing' && pc('obrigado').kind === 'thanks' && pc('o que você faz').kind === 'help' && pc('esquece').kind === 'cancel' && pc('blablabla').kind === 'unknown', 'conversa');
  assert(pc('quanto gastei hoje').kind === 'spent', '"quanto gastei" não vira lançamento');
  assert(dayLabel('2026-11-05', nowA) === 'hoje' && dayLabel('2026-11-06', nowA) === 'amanhã' && dayLabel('2026-11-10', nowA).startsWith('terça'), 'rótulo do dia');
  assert(timeLabel('15:00') === '15h' && timeLabel('09:30') === '9h30', 'rótulo da hora');
  assert(cleanAssistantName('  Rita<script>  ') === 'Ritascript' && cleanAssistantName('Léo') === 'Léo' && cleanAssistantName('x'.repeat(50)).length === 20, 'nome do secretário limpo');
  assert(guessCategory('Uber', 'expense') === 'transporte' && guessCategory('freela', 'income') === 'renda', 'categoria');
  assert(tidy('de pagar a luz no') === 'Pagar a luz' && fold('Ação') === 'acao', 'limpeza de texto');
  console.log('✓ Todos os testes do secretário passaram com sucesso!');

  console.log('18. Testando o painel de números...');
  assert(weekStart('2026-11-05') === '2026-11-02' && weekStart('2026-11-02') === '2026-11-02' && weekStart('2026-11-08') === '2026-11-02', 'semana começa na segunda');
  assert(sourceLabel({ referredBy: 'RITMO-X', source: null }) === 'Indicação (afiliado)' && sourceLabel({ referredBy: null, source: 'utm:instagram/black' }) === 'Instagram' && sourceLabel({ referredBy: null, source: 'site:l.instagram.com' }) === 'Instagram' && sourceLabel({ referredBy: null, source: 'ritus' }) === 'Ritus' && sourceLabel({ referredBy: null, source: null }) === 'Direto / sem origem', 'origem do cadastro');
  const mu = (id: number, createdDay: string, extra: any = {}) => ({ id, createdDay, role: 'user', status: 'trial', referredBy: null, source: null, ...extra });
  const mt = computeMetrics({
    today: '2026-11-05',
    priceCents: 3990,
    users: [
      mu(1, '2026-10-01', { source: 'utm:instagram' }),
      mu(2, '2026-10-01'),
      mu(3, '2026-10-02', { referredBy: 'X' }),
      mu(4, '2026-11-04'),
      mu(9, '2026-10-01', { role: 'admin' }),
    ],
    payments: [
      { userId: 1, paidDay: '2026-10-08', amountCents: 3990, kind: 'subscription' },
      { userId: 1, paidDay: '2026-11-03', amountCents: 3990, kind: 'subscription' },
      { userId: 3, paidDay: '2026-10-04', amountCents: 3990, kind: 'subscription' },
      { userId: 9, paidDay: '2026-10-09', amountCents: 3990, kind: 'subscription' },
    ],
    activity: [
      { userId: 1, day: '2026-10-02' },
      { userId: 1, day: '2026-10-09' },
      { userId: 2, day: '2026-10-02' },
      { userId: 3, day: '2026-10-31' },
      { userId: 4, day: '2026-11-05' },
    ],
  });
  assert(mt.totals.users === 4, 'administrador fica de fora');
  assert(mt.totals.paying === 1 && mt.totals.mrrCents === 3990, 'pagante agora (pagou nos últimos 30 dias)');
  assert(mt.conversionOverall.signups === 3 && mt.conversionOverall.converted === 2, 'conversão do teste (só testes terminados)');
  assert(mt.retention.cohortD1 === 4 && mt.retention.d1 === 75, 'voltou no dia seguinte: 3 de 4');
  assert(mt.retention.d7 === 33.3 && mt.retention.d30 === 66.7, 'semana 2 e mês 1');
  const nov = mt.churn[mt.churn.length - 1];
  assert(nov.month === '2026-11' && nov.startPaying === 2 && nov.lost === 1 && nov.rate === 50 && nov.partial, 'cancelamentos do mês: 1 de 2 não renovou');
  assert(mt.totals.revenueMonthCents === 3990 && mt.totals.revenueLastMonthCents === 7980, 'receita do mês e do anterior');
  const insta = mt.sources.find((x) => x.source === 'Instagram');
  assert(insta?.signups === 1 && insta.paying === 1 && mt.sources[0].paying >= mt.sources[mt.sources.length - 1].paying, 'origem dos assinantes');
  assert(mt.signupsDaily.length === 30 && mt.signupsDaily[29].day === '2026-11-05' && mt.signupsDaily[29].active === 1 && mt.signupsDaily[28].signups === 1, 'série diária');
  assert(mt.totals.activeToday === 1 && mt.totals.trialsActive === 1, 'ativos hoje e testes em andamento');
  console.log('✓ Todos os testes do painel de números passaram com sucesso!');

  console.log('19. Testando o alerta de erros...');
  assert(isNoise('ResizeObserver loop limit exceeded') && isNoise('TypeError: Failed to fetch') && isNoise('x', 'at chrome-extension://abc/x.js') && !isNoise("Cannot read properties of undefined (reading 'map')"), 'ignora ruído');
  assert(scrub('falhou para joao@x.com com token eyJa.eyJb.c e ?code=1234') === 'falhou para [email] com token [token] e ?code=[oculto]', 'tira dados pessoais');
  const fe1 = errFingerprint('navegador', 'Cannot read 12 of undefined', 'TypeError\n    at go (https://meu-ritmo.netlify.app/assets/app-AbC123xy.js:10:20)');
  const fe2 = errFingerprint('navegador', 'Cannot read 99 of undefined', 'TypeError\n    at go (https://meu-ritmo.netlify.app/assets/app-ZZZ999qq.js:11:5)');
  assert(fe1 === fe2 && fe1 !== errFingerprint('servidor', 'Cannot read 12 of undefined', ''), 'agrupa o mesmo erro mesmo com versão nova');
  assert(cleanError({ message: '' }, 'navegador') === null && cleanError({ message: 'Load failed' }, 'navegador') === null, 'erro vazio ou de rede é ignorado');
  const ce = cleanError({ message: 'x'.repeat(900), stack: 'y', url: '/app?token=abc' }, 'navegador');
  assert(ce !== null && ce.message.length === 500 && ce.url === '/app?token=[oculto]', 'limita o tamanho e esconde token da URL');
  console.log('✓ Todos os testes do alerta de erros passaram com sucesso!');

  console.log('20. Testando missões, baú, ofensiva, resumo da semana e ligas...');
  const novo = pickMissions(7, '2026-11-05', new Set());
  assert(novo.length === 3 && new Set(novo.map((m) => m.feature)).size === 3, '3 missões de recursos diferentes');
  assert(JSON.stringify(novo) === JSON.stringify(pickMissions(7, '2026-11-05', new Set())), 'mesma pessoa e dia: mesmas missões');
  const usa = pickMissions(7, '2026-11-05', new Set(['habito', 'tarefa']));
  assert(usa.filter((m) => m.feature === 'habito' || m.feature === 'tarefa').length === 2 && usa.filter((m) => !['habito', 'tarefa'].includes(m.feature)).length === 1, '2 do que já usa + 1 descoberta');
  const prog = missionProgress([MISSION_POOL.find((m) => m.id === 'habito3')!, MISSION_POOL.find((m) => m.id === 'lembrete')!], { habito: 5, lembrete: 0 });
  assert(prog[0].progress === 3 && prog[0].done && !prog[1].done, 'progresso limitado à meta');
  const bau = chestReward(7, '2026-11-05');
  assert(bau.xp >= 10 && bau.xp <= 75 && JSON.stringify(bau) === JSON.stringify(chestReward(7, '2026-11-05')), 'baú fixo por dia');
  const act = new Set(['2026-11-05', '2026-11-04', '2026-11-02', '2026-11-01', '2026-10-31']);
  const stk = computeStreak(act, '2026-11-05');
  assert(stk.days === 5 && stk.weekRestUsed && stk.restDays.join() === '2026-11-03' && stk.todayDone, 'falta de 1 dia usa o descanso da semana');
  const st2 = computeStreak(new Set(['2026-11-05', '2026-11-02', '2026-11-01']), '2026-11-05');
  assert(st2.days === 1, '2 faltas na mesma semana quebram a ofensiva');
  const st3 = computeStreak(new Set(['2026-11-05', '2026-11-02', '2026-11-01']), '2026-11-05', ['2026-10-20']);
  assert(st3.days === 3 && st3.extraRests === 0, 'descanso extra do baú cobre a segunda falta');
  const st4 = computeStreak(new Set(['2026-11-04', '2026-11-03']), '2026-11-05');
  assert(st4.days === 2 && !st4.todayDone, 'ofensiva continua viva até o fim do dia');
  assert(nextMilestone(5) === 7 && nextMilestone(365) === null && mondayOf('2026-11-05') === '2026-11-02', 'marcos e segunda-feira');
  const ws = weekSummary({ '2026-11-02': { xp: 30, raw: { habito: 3 } }, '2026-11-04': { xp: 0, raw: {} }, '2026-10-27': { xp: 15, raw: { diario: 1 } } }, '2026-11-02');
  assert(ws.xp === 30 && ws.activeDays === 1 && ws.counts.habito === 3 && ws.vsPrevious === 100 && ws.bestDay?.day === '2026-11-02' && ws.end === '2026-11-08', 'resumo da semana');
  assert(nextTier(0, 1, 20, 50) === 1 && nextTier(0, 1, 20, 0) === 0 && nextTier(2, 18, 20, 10) === 1 && nextTier(2, 8, 8, 10) === 2 && nextTier(5, 1, 20, 99) === 5, 'sobe/desce de liga');
  assert(rankInGroup([{ userId: 1, xp: 10 }, { userId: 2, xp: 30 }, { userId: 3, xp: 10 }], 3).rank === 3, 'empate: quem entrou antes fica na frente');
  const xb = computeXp({ habitLogs: [], tasks: [], sessions: [], journal: [], transactions: [], posts: [], comments: [], bonus: [{ day: '2026-11-05', xp: 500 }, { day: '2026-11-05', xp: 25 }, { day: '2026-11-06', xp: 25 }], today: '2026-11-05' });
  assert(xb.total === 100 && xb.todayXp === 100 && xb.bonusXp === 100, 'baú: no máximo 100 pontos e 1 por dia, nada no futuro');
  console.log('✓ Todos os testes de missões e ligas passaram com sucesso!');

  console.log('21. Testando lembretes que se repetem...');
  const nowR = new Date(2026, 10, 5, 10, 0); // quinta, 10h
  const rp = (t: string) => parseCommand(t, nowR) as any;
  const rr1 = rp('me lembra toda segunda às 8 de levar o lixo');
  assert(rr1.kind === 'reminder' && rr1.repeat === 'weekly:1' && rr1.time === '08:00' && rr1.text === 'Levar o lixo', 'toda segunda');
  assert(rp('me lembra de pagar o aluguel todo dia 10').repeat === 'monthly:10', 'todo dia 10');
  assert(rp('me lembra todo dia às 22h de tomar água').repeat === 'daily', 'todo dia');
  assert(rp('me lembra todo dia 8 da manhã de meditar').repeat === 'daily', '"todo dia 8 da manhã" é diário, não dia 8');
  assert(rp('lembrete toda segunda e quarta às 7 academia').repeat === 'weekly:1,3', 'segunda e quarta');
  assert(rp('me lembra de dias úteis às 9 bater ponto').repeat === 'weekly:1,2,3,4,5', 'dias úteis');
  assert(!rp('me lembra amanhã às 9 de ligar').repeat, 'lembrete normal não repete');
  assert(repeatLabel('weekly:1,3') === 'toda segunda e quarta' && repeatLabel('monthly:10') === 'todo dia 10' && repeatLabel('weekly:1,2,3,4,5') === 'de segunda a sexta' && repeatLabel('weekly:6') === 'todo sábado', 'textos');
  assert(isValidRepeat('weekly:1,3') && !isValidRepeat('weekly:9') && !isValidRepeat('monthly:40') && !isValidRepeat('qualquer'), 'só formatos válidos');
  assert(firstOccurrence('weekly:1', '08:00', nowR)!.getDate() === 9 && firstOccurrence('daily', '22:00', nowR)!.getDate() === 5 && firstOccurrence('monthly:31', '09:00', nowR)!.getDate() === 30, 'primeira vez');
  const seg = new Date('2026-11-09T11:00:00Z'); // segunda, 8h em São Paulo
  assert(nextOccurrence('weekly:1', seg, 'America/Sao_Paulo', new Date('2026-11-09T11:01:00Z'))!.toISOString() === '2026-11-16T11:00:00.000Z', 'próxima segunda');
  assert(nextOccurrence('weekly:1,3', seg, 'America/Sao_Paulo', new Date('2026-11-09T11:01:00Z'))!.toISOString() === '2026-11-11T11:00:00.000Z', 'próxima quarta');
  assert(nextOccurrence('daily', new Date('2026-03-07T13:00:00Z'), 'America/New_York', new Date('2026-03-07T13:01:00Z'))!.toISOString() === '2026-03-08T12:00:00.000Z', 'mantém o horário local com horário de verão');
  assert(nextOccurrence('daily', seg, 'America/Sao_Paulo', new Date('2026-11-20T00:00:00Z'))!.toISOString() === '2026-11-20T11:00:00.000Z', 'pula os que ficaram para trás');
  assert(findRepeat('pagar luz') === null, 'sem repetição');
  console.log('✓ Todos os testes de lembretes repetidos passaram com sucesso!');

  console.log('22. Testando pausa automática e recordes do treino...');
  const gpsBase = { lat: -23.55, lng: -46.63 };
  const parado = [0, 3, 6, 9, 11].map((s, i) => ({ lat: gpsBase.lat + (i % 2) * 0.00001, lng: gpsBase.lng, t: 1_000_000 + s * 1000, acc: 8 }));
  assert(detectStop(parado, 'corrida', 1_011_000).stopped, 'parado no semáforo pausa');
  const correndo = [0, 3, 6, 9, 11].map((s) => ({ lat: gpsBase.lat + s * 0.00003, lng: gpsBase.lng, t: 1_000_000 + s * 1000, acc: 8 }));
  assert(!detectStop(correndo, 'corrida', 1_011_000).stopped, 'correndo não pausa');
  assert(!detectStop(parado.slice(0, 2), 'corrida', 1_011_000).stopped, 'poucas leituras: não decide');
  assert(!detectStop(parado, 'corrida', 1_030_000).stopped, 'sem GPS recente: não pausa');
  assert(detectResume({ ...gpsBase, t: 0 }, { lat: gpsBase.lat + 0.0002, lng: gpsBase.lng, t: 0, acc: 8 }, 'corrida') && !detectResume({ ...gpsBase, t: 0 }, { lat: gpsBase.lat + 0.00003, lng: gpsBase.lng, t: 0, acc: 8 }, 'corrida'), 'volta sozinho ao andar');
  // velocidade do aparelho manda na pausa automática (GPS fraco "gruda" no mesmo ponto e enganava)
  const grudado = [0, 3, 6, 9, 11].map((sec) => ({ ...gpsBase, t: 1_000_000 + sec * 1000, acc: 40, spd: 2.8 }));
  assert(!detectStop(grudado, 'corrida', 1_011_000).stopped, 'posição grudada mas com velocidade: não pausa');
  assert(detectStop(grudado.map((f) => ({ ...f, spd: 0.1, acc: 8 })), 'corrida', 1_011_000).stopped, 'velocidade zero e mesmo lugar: pausa');
  assert(!detectStop(grudado.map((f) => ({ ...f, spd: null })), 'corrida', 1_011_000).stopped, 'posição congelada com sinal fraco e sem velocidade: não decide');
  // filtro do GPS: percurso reto de 1 km com ruído; a distância não pode inflar
  {
    let sd = 7;
    const rnd = () => (sd = (sd * 1664525 + 1013904223) % 4294967296) / 4294967296;
    const noise = () => (rnd() + rnd() + rnd() - 1.5) * 12; // ± uns 6 m
    const M1 = 1 / 111320;
    const measure = (useFilter: boolean) => {
      let st: SmoothState | null = null;
      const seg: GpsPoint[] = [];
      for (let i = 1; i <= 334; i++) {
        let p: GpsPoint = { lat: -22.5 + (i * 3 + noise()) * M1, lng: -44.5 + noise() * M1, t: i * 1000, acc: 12 };
        if (useFilter) {
          st = smoothFix(st, p, 'corrida');
          p = { ...p, lat: st.lat, lng: st.lng };
        }
        const prev = seg.length ? seg[seg.length - 1] : null;
        if (classifyPoint(prev, p, 'corrida') === 'add') seg.push(p);
      }
      return trackStats([seg]).distanceM;
    };
    const cru = measure(false);
    const filtrado = measure(true);
    assert(filtrado > 950 && filtrado < 1100, `filtro mantém ~1 km (deu ${filtrado})`);
    assert(cru - 1000 > (filtrado - 1000) * 2, `sem filtro o zigue-zague inflava bem mais (${cru} x ${filtrado})`);
    const first = smoothFix(null, { lat: 1, lng: 2, t: 0, acc: 10 }, 'corrida');
    assert(first.lat === 1 && first.lng === 2, 'primeira leitura entra como veio');
    const gap = smoothFix(first, { lat: 1.01, lng: 2, t: 60_000, acc: 10 }, 'corrida');
    assert(gap.lat === 1.01, 'depois de um buraco de sinal o filtro recomeça (não arrasta o ponto antigo)');
    const weak = smoothFix(first, { lat: 1.001, lng: 2, t: 1000, acc: 60 }, 'corrida');
    const strong = smoothFix(first, { lat: 1.001, lng: 2, t: 1000, acc: 5 }, 'corrida');
    assert(strong.lat - 1 > (weak.lat - 1) * 3, 'leitura boa puxa mais que leitura ruim');
  }
  assert(fixTime(1000, 1500) === 1000 && fixTime(1, 10_000_000) === 10_000_000 && fixTime(null, 77) === 77, 'hora do GPS absurda usa o relógio do aparelho');
  assert(kmCueText('corrida', 1, 340, 1000, 340) === '1 quilômetro. Último quilômetro em 5 minutos e 40 segundos.', 'aviso do 1º km');
  assert(kmCueText('corrida', 3, null, 3000, 1200) === '3 quilômetros. Tempo total: 20 minutos.', 'aviso sem o tempo do último km');
  assert(kmCueText('bike', 5, 100, 5000, 900) === '5 quilômetros. Média de 20,0 quilômetros por hora.', 'aviso no pedal fala a velocidade');
  const ws1 = [
    { id: 1, sport: 'corrida' as const, distanceM: 5000, movingS: 1800, startedAt: '2026-10-01', splits: [{ km: 1, seconds: 350, meters: 1000 }] },
    { id: 2, sport: 'corrida' as const, distanceM: 3000, movingS: 900, startedAt: '2026-10-05', splits: [{ km: 1, seconds: 290, meters: 1000 }] },
    { id: 3, sport: 'bike' as const, distanceM: 20000, movingS: 3600, startedAt: '2026-10-06' },
  ];
  const prs = personalRecords(ws1);
  const pr = (k: string, sp = 'corrida') => prs.find((r) => r.kind === k && r.sport === sp);
  assert(pr('dist')?.workoutId === 1 && pr('pace1k')?.workoutId === 2 && pr('km')?.value === 290 && pr('pace5k')?.workoutId === 1 && pr('veloc', 'bike')?.value === 20, 'recordes por esporte');
  const nova = { id: 4, sport: 'corrida' as const, distanceM: 6000, movingS: 2000, startedAt: '2026-11-01', splits: [] };
  const nr = newRecords(ws1, nova).map((r) => r.kind).sort().join();
  assert(nr === 'dist,pace5k,tempo', `novo recorde: ${nr}`);
  assert(newRecords([], nova).length === 0, 'primeiro treino não conta como recorde');
  assert(recordValueLabel({ kind: 'pace1k', value: 312 }) === '5:12 /km' && recordValueLabel({ kind: 'dist', value: 10520 }) === '10,52 km', 'textos dos recordes');
  console.log('✓ Todos os testes de pausa automática e recordes passaram com sucesso!');

  console.log('23. Testando notificações do admin e som do Ritmo...');
  {
    const ok = validateAdminNotification({ title: '  Oi\n ', body: 'Teste', tab: 'feed' });
    assert(ok.ok && ok.value.title === 'Oi' && ok.value.target === 'me' && ok.value.tab === 'feed', 'teste para mim por padrão');
    assert(!validateAdminNotification({ title: '', body: 'x' }).ok && !validateAdminNotification({ title: 'x', body: '' }).ok, 'título e mensagem obrigatórios');
    assert(!validateAdminNotification({ title: 'x'.repeat(61), body: 'x' }).ok && !validateAdminNotification({ title: 'x', body: 'y'.repeat(181) }).ok, 'limites de tamanho');
    const bad = validateAdminNotification({ title: 'x', body: 'y', tab: 'admin' });
    assert(bad.ok && bad.value.tab === 'hoje', 'aba desconhecida vira Hoje');
    assert(!validateAdminNotification({ title: 'x', body: 'y', target: 'email', email: 'nada' }).ok, 'e-mail inválido');
    const em = validateAdminNotification({ title: 'x', body: 'y', target: 'email', email: ' Ana@Ex.com ' });
    assert(em.ok && em.value.email === 'ana@ex.com', 'e-mail normalizado');
    assert(!validateAdminNotification({ title: 'x', body: 'y', target: 'all' }).ok && validateAdminNotification({ title: 'x', body: 'y', target: 'all', confirm: true }).ok, 'todos exige confirmação');
    const t0 = new Date('2026-11-05T12:00:00Z');
    assert(broadcastWaitMinutes(null, t0) === 0 && broadcastWaitMinutes(new Date('2026-11-05T11:57:00Z'), t0) === 7 && broadcastWaitMinutes(new Date('2026-11-05T11:40:00Z'), t0) === 0, 'trava de 10 minutos para todos');
    assert(RITMO_TONE.length >= 3 && toneLength() < 1.5 && RITMO_VIBRATE.length % 2 === 1, 'som da marca curto e vibração no ritmo');
    assert(effectivePermissions({ role: 'admin', email: 'batistuth@live.com' }).includes('notifications' as any), 'master pode enviar notificações');
    assert(!effectivePermissions({ role: 'admin', email: 'x@y.com', adminPermissions: '["overview"]' }).includes('notifications' as any), 'admin sem permissão não envia');
  }
  console.log('✓ Todos os testes de notificações do admin passaram com sucesso!');

  console.log('24. Testando o secretário completo (cards, diário, tarefas, treino por voz)...');
  {
    const nowV = new Date(2026, 10, 5, 13, 10);
    const pv = (t: string) => parseCommand(t, nowV, 'Rita') as any;
    const w = pv('vou iniciar uma corrida agora');
    assert(w.kind === 'start_workout' && w.sport === 'corrida', 'inicia corrida por voz');
    assert(pv('começar treino').kind === 'workout_ask', 'treino sem modalidade pergunta qual');
    assert((completeWith({ kind: 'workout_ask' } as any, 'pedal', nowV) as any)?.sport === 'bike', 'responde a modalidade');
    assert(pv('resumo do dia').kind === 'briefing', '"resumo do dia" sozinho conta o dia');
    const d1 = pv('Resumo do dia: hoje fechei o relatório e fiz uma caminhada boa');
    assert(d1.kind === 'diary' && d1.text === 'Hoje fechei o relatório e fiz uma caminhada boa', `resumo ditado vai para o diário: ${JSON.stringify(d1)}`);
    const d2 = pv('anota no diário que hoje foi um dia produtivo');
    assert(d2.kind === 'diary' && d2.text === 'Hoje foi um dia produtivo', 'anota no diário');
    assert(pv('abre o diário').kind === 'open_tab', 'abrir o diário continua abrindo a aba');
    const c1 = pv('cria um card revisar proposta no quadro trabalho na lista fazendo');
    assert(c1.kind === 'card' && c1.title === 'Revisar proposta' && c1.board === 'trabalho' && c1.list === 'fazendo', `card com quadro e lista: ${JSON.stringify(c1)}`);
    const c2 = pv('adiciona um cartão ligar pro fornecedor amanhã');
    assert(c2.kind === 'card' && c2.title === 'Ligar pro fornecedor' && c2.dueDate === '2026-11-06', 'card com prazo');
    assert(pv('paguei 50 no cartão de crédito no mercado').kind === 'expense', 'cartão de crédito é pagamento, não card');
    const t1 = pv('concluí a tarefa enviar relatório');
    assert(t1.kind === 'task_done' && t1.title === 'Enviar relatório', 'conclui tarefa por voz');
    const e1 = pv('lança na planilha um custo de 50 de gasolina');
    assert(e1.kind === 'expense' && e1.amountCents === 5000 && e1.description === 'Gasolina', `custo na planilha: ${JSON.stringify(e1)}`);
    const e2 = pv('saída de 80 reais de farmácia');
    assert(e2.kind === 'expense' && e2.amountCents === 8000 && e2.category === 'saude', 'saída de dinheiro');
    const e3 = pv('entrada de dinheiro de 200 reais do freela');
    assert(e3.kind === 'income' && e3.amountCents === 20000 && e3.description === 'Freela', 'entrada de dinheiro');
    const a1 = pv('marca na minha agenda reunião amanhã às 10');
    assert(a1.kind === 'appointment' && a1.title === 'Reunião' && a1.date === '2026-11-06' && a1.time === '10:00', `agenda: ${JSON.stringify(a1)}`);
  }
  console.log('✓ Todos os testes do secretário completo passaram com sucesso!');

  // ---- Pesquisa de gostos (cadastro)
  {
    assert(SURVEY_QUESTIONS.length === 10, 'pesquisa tem 10 perguntas');
    const ids = SURVEY_QUESTIONS.map((q) => q.id);
    assert(new Set(ids).size === ids.length, 'ids das perguntas não se repetem');
    for (const q of SURVEY_QUESTIONS) assert(new Set(q.options.map((o) => o.id)).size === q.options.length, `opções sem repetição em ${q.id}`);
    assert(SURVEY_QUESTIONS.find((q) => q.id === 'renda')!.options.some((o) => o.id === 'nd'), 'renda tem "prefiro não dizer"');
    const n = normalizeAnswers({ idade: '25-34', renda: 'xx', esportes: ['corrida', 'corrida', 'nenhum', 'bike'], musica: ['pop', 'rock', 'mpb', 'funk', 'rap'], hack: 'x', estado: ['RJ'] });
    assert(n.idade === '25-34' && !('renda' in n) && !('hack' in n), `filtra respostas inválidas: ${JSON.stringify(n)}`);
    assert(JSON.stringify(n.esportes) === '["corrida","bike"]', 'sem repetição e "nenhuma" sai quando há outras');
    assert((n.musica as string[]).length === 4, 'respeita o máximo da pergunta');
    assert(n.estado === 'RJ', 'resposta única aceita lista de um item');
    assert(answeredCount(n) === 4, 'conta perguntas respondidas');
    assert(answeredCount(normalizeAnswers('{"idade":"55+"}')) === 1 && answeredCount(normalizeAnswers('lixo')) === 0, 'lê JSON salvo e ignora texto quebrado');
    const now = new Date('2026-11-10T12:00:00Z');
    assert(shouldAskSurvey(null, now), 'nunca viu: pergunta');
    assert(!shouldAskSurvey({ completedAt: '2026-11-01', dismissedAt: null, dismissCount: 0 }, now), 'respondida: não pergunta');
    assert(!shouldAskSurvey({ completedAt: null, dismissedAt: '2026-11-09T12:00:00Z', dismissCount: 1 }, now), '"agora não" ontem: espera');
    assert(shouldAskSurvey({ completedAt: null, dismissedAt: '2026-11-05T12:00:00Z', dismissCount: 1 }, now), 'depois de 3 dias pergunta de novo');
    assert(!shouldAskSurvey({ completedAt: null, dismissedAt: '2026-10-01T12:00:00Z', dismissCount: 2 }, now), 'no máximo 2 "agora não"');
    const sum = summarizeSurveys([{ esportes: ['corrida', 'bike'] }, { esportes: ['corrida'] }, {}]);
    const esp = sum.questions.find((q) => q.questionId === 'esportes')!;
    assert(sum.respondents === 2 && esp.answered === 2 && esp.options[0].id === 'corrida' && esp.options[0].percent === 100 && esp.options[1].percent === 50, `resumo do público: ${JSON.stringify(esp)}`);
    assert(surveyCsvHeader().length === 10 && surveyCsvCells({ esportes: ['corrida', 'bike'] })[5] === 'Corrida | Bike', 'planilha com uma coluna por pergunta');
    assert(optionLabel('renda', 'r3') === 'R$ 4 mil a R$ 7 mil', 'rótulo em português');
  }
  console.log('✓ Pesquisa de gostos ok');

  // ---- Datas, horários e repetições livres
  {
    assert(nextDateAfter('daily', '2026-11-08') === '2026-11-09', 'todo dia: amanhã');
    assert(nextDateAfter('weekly:1,3', '2026-11-09') === '2026-11-11', 'segunda e quarta: de segunda vai para quarta');
    assert(nextDateAfter('weekly:1,3', '2026-11-11') === '2026-11-16', 'de quarta volta para a segunda seguinte');
    assert(nextDateAfter('monthly:31', '2026-11-08') === '2026-11-30', 'dia 31 em novembro cai no dia 30');
    assert(nextDateAfter('monthly:10', '2026-12-10') === '2027-01-10', 'vira o ano');
    assert(nextDateAfter('weekdays', '2026-11-13') === '2026-11-16', 'regra antiga "dias úteis": sexta vai para segunda');
    assert(normalizeTaskRule('weekly', '2026-11-08') === 'weekly:0', 'regra antiga "semanal" usa o dia da tarefa');
    assert(nextDateAfter('', '2026-11-08') === null && nextDateAfter('lixo', '2026-11-08') === null, 'sem regra, sem próxima');
    assert(targetPerWeek('4x_semana') === 4 && targetPerWeek('diario') === 7 && targetPerWeek('3x_semana') === 3, 'frequência livre de hábitos');
    assert(normalizeFrequency('2x_semana') === '2x_semana' && normalizeFrequency('7x_semana') === 'diario' && normalizeFrequency('9x') === 'diario', 'normaliza frequência');
    assert(frequencyLabel('1x_semana') === '1x por semana' && frequencyLabel('diario') === 'Todos os dias', 'rótulo da frequência');
    assert(JSON.stringify(stepDaysFor(40)) === '[1,8,15,24,32,40]', 'duração padrão mantém os marcos');
    const s30 = stepDaysFor(30);
    assert(s30[0] === 1 && s30.at(-1) === 30 && s30.length === 5, `duração livre de 30 dias: ${s30}`);
    assert(JSON.stringify(stepDaysFor(1)) === '[1]' && stepDaysFor(365).at(-1) === 365, 'extremos da duração');
    assert(JSON.stringify(normalizePushHours('21,7,7,30')) === '[7,21]', 'horários livres: ordena, tira repetidos e inválidos');
    assert(JSON.stringify(normalizePushHours(null, 2)) === '[8,19]' && normalizePushHours([1, 2, 3, 4]).length === 3, 'padrão e máximo de 3 horários');
    assert(slotForAnyHour(6) === 'manha' && slotForAnyHour(15) === 'tarde' && slotForAnyHour(2) === 'noite', 'período para qualquer hora');
  }
  console.log('✓ Datas e horários livres ok');

  // ---- Recompensas: bônus surpresa, combo, meta do dia
  {
    // sorteio fixo por pessoa e dia
    assert(JSON.stringify(luckyDrop(7, '2026-11-20')) === JSON.stringify(luckyDrop(7, '2026-11-20')), 'bônus surpresa é fixo para a pessoa e o dia');
    assert(luckyDrop(7, '2026-01-01') === null && luckyDrop(0, '2026-11-20') === null, 'não vale antes do início nem sem pessoa');
    let days = 0, withDrop = 0, minAt = 99, maxAt = 0;
    for (let u = 1; u <= 40; u++) for (let d = 10; d <= 28; d++) {
      days++;
      const r = luckyDrop(u, `2026-11-${d}`);
      if (r) { withDrop++; minAt = Math.min(minAt, r.at); maxAt = Math.max(maxAt, r.at); assert([10, 15, 20, 30, 50].includes(r.xp), 'prêmio da tabela'); }
    }
    assert(withDrop / days > 0.5 && withDrop / days < 0.8, `cerca de 2 em cada 3 dias têm surpresa: ${withDrop}/${days}`);
    assert(minAt >= 2 && maxAt <= 6, 'a surpresa sai entre a 2ª e a 6ª ação');
    // entra no XP só quando a pessoa faz ações de verdade
    let seed = 1, day = '2026-11-20';
    while (!luckyDrop(seed, day)) seed++;
    const drop = luckyDrop(seed, day)!;
    const logs = Array.from({ length: drop.at }, () => ({ date: day, completed: true }));
    const before = computeXp({ habitLogs: logs.slice(0, drop.at - 1), tasks: [], sessions: [], journal: [], transactions: [], posts: [], comments: [], today: day, seed });
    const after = computeXp({ habitLogs: logs, tasks: [], sessions: [], journal: [], transactions: [], posts: [], comments: [], today: day, seed });
    assert(before.luckyToday?.hit === false && before.luckyToday?.xp === null, 'antes da hora o valor é segredo');
    assert(after.luckyToday?.hit === true && after.luckyXp === drop.xp && after.total === drop.at * 10 + drop.xp + after.eventXp + after.passXp, `bônus soma no total: ${JSON.stringify(after.luckyToday)}`);
    const noSeed = computeXp({ habitLogs: logs, tasks: [], sessions: [], journal: [], transactions: [], posts: [], comments: [], today: day });
    assert(noSeed.luckyXp === 0 && noSeed.total === drop.at * 10, 'sem pessoa não há bônus (contas antigas iguais)');
    const capped = computeXp({ habitLogs: Array.from({ length: 30 }, () => ({ date: day, completed: true })), tasks: [], sessions: [], journal: [], transactions: [], posts: [], comments: [], today: day, seed });
    assert(capped.luckyXp <= drop.xp, 'não dá para farmar: no máximo um bônus por dia');
    // combo
    const c1 = nextCombo(null, 1000);
    const c2 = nextCombo(c1, 1000 + 60_000);
    const c3 = nextCombo(c2, 1000 + 60_000 + COMBO_WINDOW_MS + 1);
    assert(c1.count === 1 && c2.count === 2 && c3.count === 1, 'combo soma em sequência e recomeça depois de 4 min');
    // meta do dia
    assert(goalProgress(45, 50, 40).justHit === false && goalProgress(55, 50, 45).justHit === true && goalProgress(70, 50, 55).justHit === false, 'meta batida só uma vez');
    assert(goalProgress(25, 50).progress === 0.5 && goalProgress(25, 50).left === 25, 'progresso da meta');
    assert(normalizeGoal(80) === 80 && normalizeGoal(999) === 50, 'meta só com valores da lista');
    assert(cheerFor(3, 1).length > 0 && cheerFor(3, 3) !== cheerFor(3, 1), 'frase muda no combo');
    assert(nearNextLevel({ progress: 0.9, xpToNext: 12, nextName: 'Broto' }) === 'Faltam só 12 XP para Broto!' && nearNextLevel({ progress: 0.4, xpToNext: 60, nextName: 'Broto' }) === null, 'quase lá só perto do nível');
    assert(gainTone(3)[0].freq > gainTone(1)[0].freq && gainTone(1, true).length > gainTone(1).length, 'som sobe no combo e é maior na surpresa');
    assert(LUCKY_START === '2026-11-08', 'início do bônus surpresa');
  }
  console.log('✓ Recompensas (surpresa, combo, meta) ok');

  // ---- Temporada mensal (divisões)
  {
    assert(DIVISIONS.length === 8 && DIVISIONS[0].promote === 0.8 && DIVISIONS[0].relegate === 0 && DIVISIONS[TOP_TIER].promote === 0, 'Bronze sobe 80% e não rebaixa; Lenda é o topo');
    for (let i = 1; i < DIVISIONS.length; i++) assert(DIVISIONS[i].promote <= DIVISIONS[i - 1].promote && DIVISIONS[i].relegate >= DIVISIONS[i - 1].relegate, 'quanto mais alto, mais disputado');
    assert(JSON.stringify(zoneSizes(0, 30)) === '{"up":24,"down":0}', 'Bronze com 30: 24 sobem');
    assert(JSON.stringify(zoneSizes(3, 30)) === '{"up":12,"down":4}', 'Safira com 30: 12 sobem, 4 descem');
    assert(JSON.stringify(zoneSizes(2, 3)) === '{"up":1,"down":0}', 'grupo pequeno não rebaixa');
    assert(zoneSizes(0, 1).up === 1 && zoneSizes(TOP_TIER, 30).up === 0, 'sozinho no Bronze sobe se pontuar; Lenda não sobe');
    assert(nextDivision(0, 5, 30, 120) === 1 && nextDivision(0, 25, 30, 120) === 0, 'Bronze: 5º sobe, 25º fica');
    assert(nextDivision(0, 1, 30, 0) === 0, 'sem pontos não sobe');
    assert(nextDivision(3, 30, 30, 10) === 2 && nextDivision(3, 20, 30, 10) === 3, 'último desce, meio do grupo fica');
    assert(nextDivision(2, 2, 3, 0) === 1, 'mês sem pontos desce uma divisão');
    assert(nextDivision(TOP_TIER, 1, 30, 999) === TOP_TIER, 'topo não passa da Lenda');
    assert(zoneFor(1, 1, 10, 50) === 'up' && zoneFor(1, 10, 10, 50) === 'down' && zoneFor(1, 7, 10, 50) === 'stay', 'zonas da Prata com 10');
    const st = [{ xp: 300, name: 'Ana' }, { xp: 250, name: 'Bia' }, { xp: 200, name: 'Caio' }, { xp: 120, name: 'Você', me: true }, { xp: 90, name: 'Edu' }];
    const g = seasonGoals(1, st); // Prata, 5 pessoas: sobem 3, desce 1
    assert(g.toPromote === 81 && g.next?.name === 'Caio' && g.next.gap === 81 && g.toSafety === null, `metas da posição: ${JSON.stringify(g)}`);
    const gd = seasonGoals(1, [{ xp: 50, name: 'A' }, { xp: 40, name: 'B' }, { xp: 30, name: 'C' }, { xp: 20, name: 'D' }, { xp: 10, name: 'Eu', me: true }]);
    assert(gd.toSafety === 11, 'quanto falta para sair da zona de descida');
    assert(seasonNudge(1, 'down', gd, 5).includes('Faltam só 11') && seasonNudge(1, 'stay', g, 5).includes('Ouro'), 'frases de incentivo');
    assert(seasonPoints({ '2026-11-01': { xp: 30 }, '2026-11-30': { xp: 20 }, '2026-10-31': { xp: 99 } }, '2026-11') === 50, 'soma só os pontos do mês');
    assert(daysLeftIn('2026-11', '2026-11-08') === 23 && daysLeftIn('2026-11', '2026-11-30') === 1, 'dias que faltam (contando hoje)');
    assert(prevMonth('2026-01') === '2025-12' && lastDayOf('2028-02') === '2028-02-29', 'datas da temporada');
    assert(seasonLabel('2026-11') === 'Temporada de novembro', 'nome da temporada');
    assert(rankOf([{ userId: 2, xp: 10 }, { userId: 1, xp: 10 }, { userId: 3, xp: 50 }], 1).rank === 2, 'empate: quem tem id menor fica na frente');
    assert(Boolean(sanitizeAchievementT({ type: 'divisao', tier: 3, name: 'Hackeada' })) && (sanitizeAchievementT({ type: 'divisao', tier: 3, name: 'x' }) as any).name === 'Safira' && sanitizeAchievementT({ type: 'divisao', tier: 0 }) === null, 'conquista de divisão usa o nome da tabela');
  }
  console.log('✓ Temporada mensal ok');

  // ---- Próximo passo
  {
    const base = { hour: 9, today: '2026-11-09', habits: [{ id: 1, name: 'Beber água' }, { id: 2, name: 'Ler' }], habitsDoneToday: [], tasksToday: [], plannedTomorrow: false, focusToday: 0, diaryToday: false, trainedToday: false, trainingDaysThisWeek: 0, billsDue: [], missions: [], chestReady: false };
    const s1 = nextSteps(base);
    assert(s1[0].id === 'planejar-hoje' && s1[1].kind === 'habit' && s1[1].ref === 1, `manhã sem tarefas: planejar primeiro, depois o hábito: ${s1.map((x) => x.id)}`);
    const s2 = nextSteps({ ...base, tasksToday: [{ id: 9, title: 'Relatório', completed: false, startTime: '14:00' }, { id: 8, title: 'Email', completed: false, startTime: '10:00' }] });
    assert(s2[0].kind === 'habit' && s2.find((x) => x.kind === 'task')?.ref === 8, 'tarefa mais cedo vem primeiro');
    assert(nextSteps({ ...base, chestReady: true })[0].kind === 'chest', 'baú pronto é o primeiro');
    const night = nextSteps({ ...base, hour: 21, tasksToday: [{ id: 1, title: 'x', completed: true }] });
    assert(night[0].id === 'diario', `à noite, o check-in vem primeiro: ${night[0].id}`);
    const tr = nextSteps({ ...base, habits: [], tasksToday: [{ id: 1, title: 'x', completed: true }], trainingDaysThisWeek: 2 });
    assert(tr[0].id === 'treino' && tr[0].xp === 30, 'treino mostra o bônus de constância (3º dia: +20 +10)');
    const all = nextSteps({ ...base, habits: [], tasksToday: [{ id: 1, title: 'x', completed: true }], plannedTomorrow: true, focusToday: 1, diaryToday: true, trainedToday: true });
    assert(all.length === 1 && all[0].id === 'feito', 'tudo feito: dia completo');
  }
  console.log('✓ Próximo passo ok');

  // ---- Conquistas, retrospectiva e volta
  {
    assert(new Set(MEDALS.map((m) => m.id)).size === MEDALS.length && MEDALS.length >= 30, 'mais de 30 conquistas, sem id repetido');
    const dd: any = { '2026-11-02': { xp: 30, raw: { treino: 1, habito: 2 } }, '2026-11-03': { xp: 20, raw: { treino: 1 } }, '2026-11-05': { xp: 40, raw: { treino: 2, foco: 1 } }, '2026-10-30': { xp: 10, raw: { habito: 1 } } };
    const md = computeMedals({ days: dd, counts: { habito: 12, foco: 3 }, activeDays: 4, bestStreak: 3, level: 2, seasonMaxTier: 1, workouts: [{ day: '2026-11-02', distanceM: 5200 }, { day: '2026-11-05', distanceM: 3000 }], challengesDone: 0 });
    const by = Object.fromEntries(md.map((m) => [m.id, m]));
    assert(by.ativo1.earned && !by.ativo7.earned && by.ativo7.progress === 4, 'dias ativos');
    assert(by.habito10.earned && by.treino1.earned && by.semana3.earned && by.km5.earned && !by.km42.earned && by.km42.progress === 8, 'treino: semana constante, 5 km e soma de km');
    assert(by.divisao1.earned && !by.divisao3.earned, 'temporada');
    assert(!PUBLIC_MEDAL_GROUPS.includes('Hábitos') && !PUBLIC_MEDAL_GROUPS.includes('Finanças') && !PUBLIC_MEDAL_GROUPS.includes('Diário'), 'perfil público não mostra hábitos, finanças nem diário');
    const rc = monthRecap(dd, [{ day: '2026-11-02', distanceM: 5200 }, { day: '2026-10-01', distanceM: 1000 }], '2026-11');
    assert(rc.points === 90 && rc.activeDays === 3 && rc.trainDays === 3 && rc.km === 5.2 && rc.bestDay?.day === '2026-11-05', `retrospectiva: ${JSON.stringify(rc)}`);
    // volta depois de 3 dias parado: pontos em dobro (até 50)
    const cb = computeXp({ ...emptyXp, today: '2026-11-10', habitLogs: [{ date: '2026-11-01', completed: true }, { date: '2026-11-05', completed: true }, { date: '2026-11-06', completed: true }] });
    assert(cb.comebackXp === 10 && cb.total === 40, `volta em dobro: ${cb.comebackXp}/${cb.total}`);
    assert(cb.comebackToday === true, 'hoje (4 dias depois) também é dia de volta');
    const big = computeXp({ ...emptyXp, today: '2026-11-06', sessions: [{ date: '2026-11-01', status: 'completed' }, ...Array.from({ length: 6 }, () => ({ date: '2026-11-06', status: 'completed', durationMinutes: 50 }))] });
    assert(big.comebackXp === 50, 'dobro limitado a +50');
    assert(computeXp({ ...emptyXp, today: '2026-11-03', habitLogs: [{ date: '2026-11-01', completed: true }] }).comebackToday === false, '2 dias parado ainda não é volta');
  }
  console.log('✓ Conquistas, retrospectiva e volta ok');

  // ---- Desafios
  {
    assert(suggestedTarget('treino', 7) === 4 && suggestedTarget('treino', 3) === 2 && suggestedTarget('habito', 14) === 28 && suggestedTarget('pontos', 7) === 300, 'metas sugeridas');
    assert(clampTarget('treino', 7, 30) === 7 && clampTarget('foco', 7, 0) === 7, 'meta dentro do possível');
    const dd: any = { '2026-11-02': { xp: 30, raw: { treino: 1 } }, '2026-11-03': { xp: 10, raw: { treino: 2 } }, '2026-11-05': { xp: 50, raw: { treino: 1 } }, '2026-11-12': { xp: 99, raw: { treino: 1 } } };
    const p = challengeProgress('treino', dd, '2026-11-02', '2026-11-08', '2026-11-10', 3);
    assert(p.value === 3 && p.doneDay === '2026-11-05', 'conta dias de treino (não treinos) e o dia em que bateu');
    assert(challengeProgress('pontos', dd, '2026-11-02', '2026-11-08', '2026-11-04', 100).value === 40, 'não conta além de hoje');
    assert(challengeStatus('2026-11-02', '2026-11-08', '2026-11-09') === 'ended' && challengeStatus('2026-11-02', '2026-11-08', '2026-11-02') === 'active', 'situação do desafio');
    assert(challengeNudge('treino', 4, { value: 1 }, [{ name: 'Ana', value: 3 }], 3).startsWith('Ana está na frente'), 'incentivo quando alguém está na frente');
    assert(challengeNudge('treino', 4, { value: 4 }, [{ name: 'Ana', value: 3 }], 3).includes('Dê uma força para Ana'), 'quem já cumpriu ajuda o outro');
    let seed = 1;
    const code = challengeCode(() => ((seed = (seed * 9301 + 49297) % 233280) / 233280));
    assert(isChallengeCode(code) && !isChallengeCode('abc') && !isChallengeCode('ABCDEF0'), `código do convite: ${code}`);
    const dz = computeXp({ ...emptyXp, events: [{ src: 'desafio', day: '2026-11-05' }, { src: 'desafio', day: '2026-11-05' }, { src: 'desafio', day: '2026-11-05' }] });
    assert(dz.total === 100, 'desafio cumprido vale +50 (até 2 por dia)');
  }
  console.log('✓ Desafios ok');

  // ---- Notificações: no máximo 4 por dia
  {
    assert(DAILY_PUSH_MAX === 4, 'teto de 4 por dia');
    assert(canSendAuto(null, 'lembrete') && canSendAuto({ count: 3, kinds: ['lembrete', 'lembrete', 'lembrete'] }, 'ultrapassagem'), 'cabe mais uma até 4');
    assert(!canSendAuto({ count: 4, kinds: ['lembrete', 'lembrete', 'ultrapassagem', 'desafio'] }, 'lembrete'), 'quinta notificação não sai');
    assert(!canSendAuto({ count: 1, kinds: ['ultrapassagem'] }, 'ultrapassagem'), 'cada aviso de evento 1 vez por dia');
    assert(!canSendAuto({ count: 2, kinds: ['ultrapassagem', 'desafio'] }, 'seguidor'), 'no máximo 2 avisos de evento por dia');
    const pool = NUDGES.filter((n) => n.slot === 'tarde');
    assert(pool.length >= 24 && new Set([1, 2, 3, 4, 5].map((d) => pickNudge('tarde', `2026-11-0${d}`, 7).id)).size === 5, 'lembretes revezam todo dia');
  }
  console.log('✓ Notificações com teto ok');

  // ---- Cadastro em 1 minuto: hábitos iniciais
  {
    const sh = starterHabits({ objetivos: ['saude', 'financas'] });
    assert(sh.length === 2 && sh[0].name === 'Caminhar 20 minutos' && sh[1].name === 'Anotar os gastos do dia', `hábitos pelos objetivos: ${JSON.stringify(sh)}`);
    assert(starterHabits({}).length === 2 && starterHabits({ objetivos: ['saude'] }).map((h) => h.category).join() === 'movimento,alimentacao', 'sempre 2 hábitos');
  }
  console.log('✓ Hábitos iniciais ok');

  // ---- Preenchimento automático: um compromisso preenche agenda, quadro, finanças e lembretes
  {
    const ipva = detectMoney('Pagar IPVA R$ 1.250');
    assert(ipva?.type === 'expense' && ipva.amountCents === 125000 && ipva.label === 'IPVA' && ipva.category === 'transporte', `IPVA: ${JSON.stringify(ipva)}`);
    const luz = detectMoney('Pagar a conta de luz 189,90');
    assert(luz?.amountCents === 18990 && luz.label === 'Conta de luz' && luz.category === 'moradia', `luz: ${JSON.stringify(luz)}`);
    assert(detectMoney('Receber salário')?.type === 'income', 'salário é a receber');
    assert(detectMoney('Reunião com cliente') === null && detectMoney('Visitar casa para aluguel') === null && detectMoney('Receber visita da sogra') === null, 'sem dinheiro, sem provisão');
    assert(detectMoney('Paguei o IPVA') === null, 'já pago não vira conta');
    assert(detectMoney('Parcela 3', { type: 'expense', amountCents: 50000 })?.amountCents === 50000, 'dica de quem chamou vale');
    assert(findAmount('Pagar parcela 3 do carro') === null && findAmount('aluguel 1500 reais')?.cents === 150000, 'número solto não é valor');
    assert(stripAmount('Pagar IPVA R$ 1.250') === 'Pagar IPVA' && moneyLabel('Tenho que pagar o boleto da escola') === 'Boleto da escola', 'título e nome limpos');
    const rem = planReminders({ title: 'Pagar IPVA', date: '2026-11-10', money: ipva });
    assert(rem.length === 2 && rem[0].date === '2026-11-09' && rem[0].time === '09:00' && rem[0].text.startsWith('Amanhã vence: Pagar IPVA') && rem[1].date === '2026-11-10', `lembretes da conta: ${JSON.stringify(rem)}`);
    const dent = planReminders({ title: 'Dentista', date: '2026-11-10', time: '15:00', money: null });
    assert(dent.length === 1 && dent[0].time === '14:30' && dent[0].fallbackTime === '15:00', 'compromisso com hora: 30 min antes');
    assert(planReminders({ title: 'Ler', date: '2026-11-10', money: null }).length === 0, 'sem hora e sem conta: sem lembrete');
    assert(minusMinutes('00:10', 30) === '00:00', 'não volta para o dia anterior');
    assert(isRoutineRule('daily') && isRoutineRule('weekly:1,2,3,4,5') && !isRoutineRule('monthly:10') && !isRoutineRule('weekly:2') && !isRoutineRule(''), 'rotina não vira card');
    assert(isDoneListTitle('Concluído') && isDoneListTitle('Feito') && !isDoneListTitle('A fazer') && !isDoneListTitle('Em andamento'), 'lista de concluído');
    assert(guessTaskCategory('Consulta no dentista', null) === 'saude' && guessTaskCategory('Pagar IPVA', ipva) === 'financas', 'categoria pela frase');
    assert(describeAuto([{ kind: 'card' }, { kind: 'tx', detail: 'provisão de R$ 1.250,00 a pagar em Finanças' }, { kind: 'reminder' }, { kind: 'reminder' }]) .replace(/\s/g, ' ') === 'card no quadro Agenda, provisão de R$ 1.250,00 a pagar em Finanças e 2 lembretes', 'frase do aviso');
    // fuso: 9h em São Paulo = 12h UTC
    const at = localToInstant('2026-11-09', '09:00', 'America/Sao_Paulo');
    assert(at.toISOString() === '2026-11-09T12:00:00.000Z', `fuso: ${at.toISOString()}`);
    const back = instantToLocal(at, 'America/Sao_Paulo');
    assert(back.date === '2026-11-09' && back.time === '09:00', 'volta para o horário local');
    // secretário entende conta futura
    const now = new Date(2026, 10, 8, 12, 0); // domingo
    const b1 = parseCommand('pagar IPVA terça-feira', now);
    assert(b1.kind === 'bill' && b1.title === 'Pagar IPVA' && b1.date === '2026-11-10' && b1.type === 'expense', `bill: ${JSON.stringify(b1)}`);
    const b2 = parseCommand('agenda pagar IPVA terça R$ 1.250', now);
    assert(b2.kind === 'bill' && b2.amountCents === 125000 && b2.title === 'Pagar IPVA', `bill com valor: ${JSON.stringify(b2)}`);
    const b3 = parseCommand('vou receber 3 mil do cliente sexta', now);
    assert(b3.kind === 'bill' && b3.type === 'income' && b3.amountCents === 300000, `a receber: ${JSON.stringify(b3)}`);
    assert(parseCommand('vence o boleto da faculdade sexta', now).kind === 'bill', 'vencimento vira conta');
    assert(parseCommand('paguei 50 de gasolina', now).kind === 'expense' && parseCommand('quais contas vencem essa semana', now).kind === 'bills' && parseCommand('contas a vencer', now).kind === 'bills', 'pago e pergunta continuam como antes');
    const exp = parseCommand('pagar IPVA terça-feira 1200 reais', now);
    assert(exp.kind === 'bill' && exp.amountCents === 120000, 'valor junto');
    const g = parseCommand('gastei 30 na feira', now);
    assert(g.kind === 'expense' && g.category === 'alimentacao', 'feira de verdade continua alimentação');
    // próximo passo: conta da véspera
    const ns = nextSteps({ hour: 10, today: '2026-11-09', habits: [], habitsDoneToday: [], tasksToday: [{ id: 1, title: 'x', completed: true }], plannedTomorrow: true, focusToday: 1, diaryToday: true, trainedToday: true, trainingDaysThisWeek: 5, billsDue: [{ description: 'IPVA', dueDate: '2026-11-10', amountCents: 125000 }], missions: [], chestReady: false });
    assert(ns[0].id === 'conta' && ns[0].title.replace(/\s/g, ' ') === 'Pagar IPVA (R$ 1.250,00)' && ns[0].why.startsWith('Vence amanhã'), `próximo passo da conta: ${JSON.stringify(ns[0])}`);
  }
  console.log('✓ Preenchimento automático ok');

  // ---- Compartilhar conquistas (Stories, WhatsApp, Feed) e cara de jogo
  {
    assert(MEDALS.every((m) => RARITY[rarityOf(m.id)]), 'toda conquista tem raridade');
    assert(rarityOf('ativo1') === 'comum' && rarityOf('ofensiva30') === 'epica' && rarityOf('ativo100') === 'lendaria', 'raridades certas');
    const ms = computeMedals({ days: {}, counts: { convite: 1 }, activeDays: 0, bestStreak: 0, level: 1, seasonMaxTier: 0, workouts: [], challengesDone: 0 });
    assert(Boolean(ms.find((m) => m.id === 'convite1')?.earned) && !ms.find((m) => m.id === 'convite5')?.earned && ms.every((m) => m.rarity), 'conquista de convite');
    const c1 = cardFromMedal({ id: 'ofensiva30', emoji: '☄️', name: 'Ofensiva de 30', desc: '30 dias seguidos' });
    assert(c1.tag === 'CONQUISTA ÉPICA' && c1.feed?.type === 'medalha' && c1.color === RARITY.epica.color, 'cartão da medalha');
    const c2 = cardFromAchievement({ type: 'ofensiva', days: 7 });
    assert(c2.big === '7' && c2.bigLabel === 'dias' && c2.feed?.type === 'ofensiva', 'cartão da ofensiva');
    const c3 = cardFromAchievement({ type: 'treino', sport: 'bike', distanceM: 20500, durationS: 3600 });
    assert(c3.emoji === '🚴' && c3.big === '20,50', `cartão do treino: ${JSON.stringify(c3)}`);
    const msg = shareMessage(c2, 'https://meu-ritmo.netlify.app/c/abcd2345');
    assert(msg.includes('https://meu-ritmo.netlify.app/c/abcd2345') && msg.includes('7 dias grátis') && !/ganh(e|ar) dinheiro|renda/i.test(msg), 'mensagem com link e sem promessa');
    assert(shortLink('https://meu-ritmo.netlify.app/c/abcd2345') === 'meu-ritmo.netlify.app/c/abcd2345', 'link curto');
    assert(sanitizeShare({ kind: 'medalha', emoji: '🔥', title: 'Ofensiva de 7', subtitle: 'ok' })?.title === 'Ofensiva de 7', 'cartão válido');
    assert(sanitizeShare({ kind: 'medalha', title: 'veja https://golpe.com' }) === null && sanitizeShare({ kind: 'x"><script>', title: 'a' }) === null && sanitizeShare({ kind: 'nivel', title: '' }) === null, 'sem link, HTML ou tipo estranho na página pública');
    const slugs = new Set(Array.from({ length: 200 }, () => makeSlug()));
    assert(slugs.size > 190 && [...slugs].every(isSlug) && !isSlug('../etc/pa') && !isSlug('ABCDEFGH'), 'código do link');
    assert(escapeHtml(`<b>"Zé" & 'Ana'</b>`) === '&lt;b&gt;&quot;Zé&quot; &amp; &#39;Ana&#39;&lt;/b&gt;', 'escapa HTML');
    const med = sanitizeAchievement({ type: 'medalha', id: 'ofensiva7', name: 'Hackeado', emoji: '💀' });
    assert(med?.type === 'medalha' && med.name === 'Ofensiva de 7' && med.emoji === '🔥' && sanitizeAchievement({ type: 'medalha', id: 'naoexiste' }) === null, 'medalha no Feed vem da lista oficial');
    assert(achievementHeadline({ type: 'medalha', id: 'ofensiva7', name: 'Ofensiva de 7', emoji: '🔥' }).includes('Ofensiva de 7'), 'título da medalha no Feed');
    const f0 = fanfareTones(0), f3 = fanfareTones(3);
    assert(f3.length > f0.length && Math.max(...f3.map((n) => n.at + n.dur)) > Math.max(...f0.map((n) => n.at + n.dur)), 'fanfarra maior nas raras');
    // convite: +50 por amigo, até 2 por dia, e fora do limite diário das próprias ações
    const cv = computeXp({ habitLogs: [], tasks: [], sessions: [], journal: [], transactions: [], posts: [], comments: [], events: [{ src: 'convite', day: '2026-11-09' }, { src: 'convite', day: '2026-11-09' }, { src: 'convite', day: '2026-11-09' }], today: '2026-11-10' });
    assert(cv.breakdown.convite.xp === 100 && cv.breakdown.convite.count === 2, `convite com limite: ${JSON.stringify(cv.breakdown.convite)}`);
    assert(XP_RULES.convite.xp === 50 && XP_DAILY_MAX < 700, 'convite não mexe no limite das ações');
  }
  console.log('✓ Compartilhar e cara de jogo ok');

  // ---- Evento da semana, passe, baú semanal, mascote e ranking de amigos
  {
    assert(eventOfWeek('2026-11-08') === null && eventOfWeek('2026-11-09')?.id === WEEK_EVENTS[0].id && eventOfWeek('2026-11-15')?.id === WEEK_EVENTS[0].id && eventOfWeek('2026-11-16')?.id === WEEK_EVENTS[1].id, 'evento muda toda segunda');
    assert(eventOfWeek('2027-01-04') !== null && WEEK_EVENTS.every((e) => e.sources.length > 0), 'eventos giram para sempre');
    assert(eventBonus('2026-11-10', { foco: 30, habito: 60 }) === 30 && eventBonus('2026-11-10', { foco: 90, meta: 40 }) === EVENT_DAILY_MAX && eventBonus('2026-11-01', { foco: 30 }) === 0, 'dobro só do tema e com teto');
    const ev = computeXp({ habitLogs: [], tasks: [], sessions: [{ date: '2026-11-10', status: 'completed', durationMinutes: 25 }], journal: [], transactions: [], posts: [], comments: [], today: '2026-11-10', seed: 7 });
    assert(ev.eventXp === 15 && ev.eventToday === 15 && ev.todayXp >= 30, `foco em dobro na Semana do Foco: ${ev.eventXp}`);
    const noSeed = computeXp({ habitLogs: [], tasks: [], sessions: [{ date: '2026-11-10', status: 'completed', durationMinutes: 25 }], journal: [], transactions: [], posts: [], comments: [], today: '2026-11-10' });
    assert(noSeed.eventXp === 0 && noSeed.total === 15, 'sem pessoa (seed), sem evento');
    const days: Record<string, number> = { '2026-11-01': 40, '2026-11-02': 20, '2026-11-03': 300, '2026-10-31': 999 };
    const pr = passReached(days, '2026-11');
    assert(pr.length === 3 && pr[0].day === '2026-11-02' && pr[1].day === '2026-11-03' && pr[2].step === 3 && pr[2].day === '2026-11-03', `degraus do passe: ${JSON.stringify(pr)}`);
    assert(passReached({ '2026-10-05': 5000 }, '2026-10').length === 0, 'passe começa em novembro');
    const pv = passView(320);
    assert(pv.step === 3 && pv.next?.step === 4 && pv.next.missing === 180 && Math.abs(pv.progress - 0.1) < 1e-9 && passView(5000).next === null, 'tela do passe');
    assert(SEASON_PASS.length === 10 && SEASON_PASS.every((p, i) => i === 0 || p.points > SEASON_PASS[i - 1].points), '10 degraus em ordem');
    const px = computeXp({ habitLogs: Array.from({ length: 6 }, () => ({ date: '2026-11-03', completed: true })), tasks: [], sessions: [], journal: [], transactions: [], posts: [], comments: [], today: '2026-11-03', seed: 3 });
    assert(px.passXp === 10 && px.pass['2026-11'].steps === 1 && px.pass['2026-11'].base === 60 + px.luckyXp, `prêmio do passe entra no total: ${JSON.stringify(px.pass)}`);
    assert(chestDaysInWeek(['2026-11-09', '2026-11-10', '2026-11-10', '2026-11-15', '2026-11-16', '2026-11-08'], '2026-11-09') === 3, 'dias de baú na semana');
    const wr = weekChestReward(5, '2026-11-09');
    assert(wr === weekChestReward(5, '2026-11-09') && wr >= 60 && wr <= 150, 'baú semanal fixo por semana');
    const wk = computeXp({ habitLogs: [{ date: '2026-11-03', completed: true }], tasks: [], sessions: [], journal: [], transactions: [], posts: [], comments: [], today: '2026-11-04', weekBonus: [{ day: '2026-11-03', xp: 80 }, { day: '2026-11-03', xp: 80 }] });
    assert(wk.weekChestXp === 80 && wk.total === 90, 'baú semanal soma uma vez');
    const m0 = mascotState(0, null, '2026-11-10');
    assert(m0.emoji === '🌰' && m0.mood === 'dormindo' && m0.next?.missing === 3, 'mascote começa semente');
    const m1 = mascotState(12, '2026-11-10', '2026-11-10');
    assert(m1.name === 'Muda' && m1.mood === 'radiante' && mascotState(12, '2026-11-08', '2026-11-10').mood === 'com_sede' && mascotState(250, '2026-11-01', '2026-11-10').next === null, 'mascote cresce e muda de humor');
    assert(!/culpa|vergonha|morreu|fracass/i.test(['radiante', 'tranquilo', 'com_sede', 'dormindo'].map((d) => mascotState(5, d === 'radiante' ? '2026-11-10' : d === 'tranquilo' ? '2026-11-09' : d === 'com_sede' ? '2026-11-08' : '2026-11-01', '2026-11-10').message).join(' ')), 'mascote sem culpa');
    const fr = friendsRanking([{ userId: 1, xp: 50, level: 2, name: 'Ana' }, { userId: 2, xp: 80, level: 1, name: 'Bia' }, { userId: 3, xp: 50, level: 4, name: 'Caio' }]);
    assert(fr.map((r) => r.userId).join() === '2,3,1' && fr[0].rank === 1, 'ranking de amigos');
  }
  console.log('✓ Evento, passe, baú semanal, mascote e amigos ok');

  // ---- "Saber mais" em todas as partes
  {
    const tabs = ['hoje', 'feed', 'treino', 'habitos', 'rotina', 'foco', 'financas', 'roteiro', 'diario', 'quadros', 'afiliados', 'configuracoes', 'progresso_tab'];
    const cards = ['pontos', 'temporada', 'passe', 'evento', 'amigos', 'bau_semana', 'mascote', 'desafios', 'retrospectiva', 'conquistas', 'ofensiva', 'semana', 'ciclos', 'stories', 'proximo_passo', 'missoes', 'compartilhar'];
    for (const k of [...tabs, ...cards]) {
      const h = HELP[k];
      assert(Boolean(h) && h.title.length > 2 && h.what.length > 20 && h.how.length >= 1 && h.todo.length >= 1, `Saber mais completo: ${k}`);
      assert(!/garantid|fique rico|renda extra|ganhe dinheiro/i.test(JSON.stringify(h)), `sem promessa: ${k}`);
    }
    assert(HELP.passe.how.join(' ').includes('2.800') && HELP.evento.how.join(' ').includes('+60') && HELP.bau_semana.how.join(' ').includes('+150'), 'textos batem com as regras do jogo');
  }
  console.log('✓ Saber mais ok');

  // ---- Limite de contas (fase de lançamento) e lista de espera
  {
    assert(DEFAULT_MAX_ACCOUNTS === 50 && parseMaxAccounts(null) === 50 && parseMaxAccounts('') === 50 && parseMaxAccounts('abc') === 50 && parseMaxAccounts('-3') === 50, 'limite padrão 50');
    assert(parseMaxAccounts('120') === 120 && parseMaxAccounts('0') === 0, 'limite salvo');
    assert(signupOpen(50, 49) && !signupOpen(50, 50) && !signupOpen(50, 61) && signupOpen(0, 9999), 'abre/fecha nas 50 contas; 0 = sem limite');
    assert(spotsLeft(50, 47) === 3 && spotsLeft(50, 80) === 0 && spotsLeft(0, 5) === null, 'vagas restantes');
    const w = cleanWaitlistEntry({ name: '  Maria   Souza ', email: ' MARIA@Email.com ', source: 'Insta<script>' });
    assert(w !== null && w.email === 'maria@email.com' && w.name === 'Maria Souza' && w.source === 'instascript', 'lista de espera limpa os dados');
    assert(cleanWaitlistEntry({ email: 'sem-arroba' }) === null && cleanWaitlistEntry({}) === null, 'e-mail inválido recusado');
  }
  console.log('✓ Limite de contas ok');

  // ---- Agenda de acordar (economia de créditos do banco)
  {
    const now = new Date('2026-11-09T15:20:00Z'); // 12:20 em Brasília
    assert(localHour(now, 'America/Sao_Paulo') === 12 && localHour(now, 'Europe/Lisbon') === 15, 'hora local por fuso');
    const hrs = nudgeUtcHours([{ hours: [8, 13, 19], timezone: 'America/Sao_Paulo' }, { hours: [8], timezone: 'Europe/Lisbon' }, { hours: [13], timezone: null }], now);
    assert(JSON.stringify(hrs) === JSON.stringify([8, 11, 16, 22]), 'horas UTC das notificações: ' + JSON.stringify(hrs));
    const plan = { v: 1 as const, nudgeUtcHours: [11, 16, 22], nextReminderAt: null, updatedAt: now.toISOString() };
    assert(shouldRunNudges(null, now), 'sem agenda: roda sempre');
    assert(!shouldRunNudges(plan, new Date('2026-11-09T15:00:00Z')) && shouldRunNudges(plan, new Date('2026-11-09T16:00:00Z')), 'só nas horas com gente');
    assert(SEASON_UTC_HOURS.length === 2 && shouldRunNudges(plan, new Date('2026-11-09T12:00:00Z')) && isSeasonHour(new Date('2026-11-10T00:00:00Z')) && !isSeasonHour(now), 'temporada 2x por dia');
    assert(!shouldRunReminders(plan, now), 'sem lembrete pendente: banco dorme');
    assert(shouldRunReminders(null, new Date('2026-11-09T16:00:00Z')) && !shouldRunReminders(null, new Date('2026-11-09T15:00:00Z')), 'sem agenda: 4 em 4 h');
    const p2 = withReminder(plan, new Date('2026-11-09T17:30:00Z'));
    assert(p2.nextReminderAt === '2026-11-09T17:30:00.000Z' && !shouldRunReminders(p2, new Date('2026-11-09T17:00:00Z')) && shouldRunReminders(p2, new Date('2026-11-09T18:00:00Z')), 'lembrete novo acorda na hora certa');
    assert(withReminder(p2, new Date('2026-11-10T10:00:00Z')) === p2, 'lembrete mais tarde não muda a agenda');
    assert(parsePlan(JSON.stringify(plan), now) !== null && parsePlan('{bad', now) === null && parsePlan({ ...plan, updatedAt: '2026-11-07T00:00:00Z' }, now) === null, 'agenda velha ou quebrada é ignorada');
  }
  console.log('✓ Agenda de acordar ok');

  // ---- Créditos da Netlify (aba Créditos do painel)
  {
    assert(CREDIT_PRICES.deploy === 15 && CREDIT_PRICES.dbHour === 10 && CREDIT_PRICES.bandwidthGB === 20, 'preços dos créditos');
    const b = burn({ deploys: 2, bandwidthGB: 1.5, dbHours: 40 });
    assert(b.deploys === 30 && b.bandwidth === 30 && b.database === 400 && b.total === 460, 'gasto por tipo: ' + JSON.stringify(b));
    const plan = estimateBalance({ planCredits: 1000, deploys: 2, bandwidthGB: 1.5, dbHours: 40 }, null);
    assert(plan.basis === 'plan' && plan.remaining === 540, 'saldo pelo plano');
    const anc = estimateBalance({ planCredits: 1000, deploys: 2, bandwidthGB: 1.5, dbHours: 40 }, { balance: 700, at: '2026-11-10T12:00:00Z' }, { deploys: 1, bandwidthGB: 0, dbHours: 5 });
    assert(anc.basis === 'anchor' && anc.remaining === 635, 'saldo a partir do anotado');
    assert(estimateBalance({ planCredits: null, deploys: 0, bandwidthGB: 0, dbHours: 3 }, null).remaining === null, 'sem plano nem anotação: sem saldo');
    assert(daysLeft(300, 25) === 12 && daysLeft(-5, 10) === 0 && daysLeft(100, 0) === null, 'dias restantes');
    assert(creditLevel(900, 1000) === 'ok' && creditLevel(400, 1000) === 'warn' && creditLevel(100, 1000) === 'danger' && creditLevel(null, 1000) === 'unknown', 'cor do saldo');
    assert(hourKey(new Date('2026-11-10T14:59:00Z')) === '2026-11-10T14', 'chave da hora');
    assert(parseAnchor('{"balance":820,"at":"2026-11-10T12:00:00Z"}')?.balance === 820 && parseAnchor({ balance: -1, at: 'x' }) === null && parseAnchor('lixo') === null, 'saldo anotado');
  }
  console.log('✓ Créditos ok');

  console.log('Testando a parte social (atividade e quem seguir)...');
  {
    const ev = [
      { kind: 'like' as const, at: '2026-11-10T10:00:00Z', actorId: 2, postId: 1 },
      { kind: 'comment' as const, at: '2026-11-11T09:00:00Z', actorId: 3, postId: 1, text: 'Boa!' },
      { kind: 'follow' as const, at: '2026-11-09T08:00:00Z', actorId: 4 },
      { kind: 'clap' as const, at: 'data quebrada', actorId: 5 },
    ];
    const m = mergeActivity(ev, '2026-11-10T00:00:00Z');
    assert(m.items.length === 3 && m.items[0].kind === 'comment' && m.items[2].kind === 'follow', 'atividade do mais novo para o mais antigo, sem datas quebradas');
    assert(m.unread === 2 && m.items[0].fresh && m.items[1].fresh && !m.items[2].fresh, 'só conta como novo o que veio depois da última olhada');
    assert(mergeActivity(ev, null).unread === 3 && mergeActivity(ev, '2026-12-01T00:00:00Z').unread === 0, 'nunca olhou: tudo novo; já olhou: nada novo');
    assert(mergeActivity(ev, null, 1).items.length === 1 && mergeActivity(ev, null, 1).unread === 3, 'o limite corta a lista mas não a contagem');
    assert(activityText('like') === 'curtiu sua publicação' && activityText('follow') === 'começou a seguir você' && activityText('clap') === 'aplaudiu seu story' && activityText('comment', 'Boa!') === 'comentou: “Boa!”', 'textos da atividade');
    assert(socialPush('comment', 'Ana S.', 'x'.repeat(300)).body.length <= 110 && socialPush('like', 'Ana S.').body.includes('Ana S.'), 'aviso no celular curto e com o nome');
    assert(badgeLabel(0) === '' && badgeLabel(7) === '7' && badgeLabel(250) === '99+', 'selo de novidades');
    assert(snippet('  a   b \n c ') === 'a b c' && snippet('x'.repeat(100), 10).length === 10, 'trecho limpo e curto');
    const base = { weekXp: 0, xpTotal: 0, recentPosts: 0, followsMe: false, hasPhoto: false };
    const r = rankSuggestions([
      { ...base, id: 1, xpTotal: 9000 },
      { ...base, id: 2, followsMe: true },
      { ...base, id: 3, recentPosts: 3, weekXp: 120 },
      { ...base, id: 4 },
    ]);
    assert(r.map((x) => x.id).join(',') === '2,3,1', 'quem segue você vem primeiro, depois quem publica e está ativo; conta parada não é sugerida');
    assert(rankSuggestions(Array.from({ length: 20 }, (_, i) => ({ ...base, id: i + 1, weekXp: 10 }))).length === 6, 'no máximo 6 sugestões');
  }
  console.log('✓ Parte social ok');
  console.log('Testando as contas oficiais (fundadores)...');
  {
    assert(parseOfficialIds(null) === null && parseOfficialIds('quebrado') === null && parseOfficialIds('{}') === null, 'sem lista válida usa o padrão (master)');
    assert(parseOfficialIds('[1,"7",7,-2,0,1.5]')!.join(',') === '1,7', 'lista limpa, sem repetir e só ids válidos');
    assert(parseOfficialIds('[]')!.length === 0, 'lista vazia é respeitada');
    assert(toggleOfficial([1], 7, true).join(',') === '1,7' && toggleOfficial([1, 7], 7, true).join(',') === '1,7' && toggleOfficial([1, 7], 1, false).join(',') === '7', 'marcar e desmarcar conta oficial');
    let threw = false;
    try { toggleOfficial(Array.from({ length: OFFICIAL_MAX }, (_, i) => i + 1), 99, true); } catch { threw = true; }
    assert(threw, 'respeita o máximo de contas oficiais');
    const p1 = officialPostPush('João Alves', 'Bom dia, time do Ritmo!', 'text');
    assert(p1.title === 'João publicou no Ritmo' && p1.body === 'Bom dia, time do Ritmo!', 'aviso com o primeiro nome e o texto');
    assert(officialPostPush('Maurício', 'x'.repeat(300), 'text').body.length <= 120, 'texto longo é cortado');
    assert(officialPostPush('Maurício', '', 'photo').body.includes('foto') && officialPostPush('', null, 'achievement').title === 'Ritmo publicou no Ritmo', 'post sem texto ainda avisa');
  }
  console.log('✓ Contas oficiais ok');
  console.log('🎉 Todos os testes unitários do Ritmo foram concluídos com êxito!');
}
