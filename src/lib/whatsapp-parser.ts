import { FinanceCategory, PaymentMethod, TransactionType } from './types.js';

export interface ParsedWhatsAppMessage {
  intent: 'transaction' | 'query' | 'cancel' | 'correct' | 'ambiguous' | 'help';
  type?: TransactionType;
  amountCents?: number;
  formattedAmount?: string;
  description?: string;
  category?: FinanceCategory | string;
  paymentMethod?: PaymentMethod | string;
  date?: string; // YYYY-MM-DD
  dueDate?: string;
  isPendingBill?: boolean;
  needsConfirmation?: boolean;
  clarifyingQuestion?: string;
  queryType?: 'month_expenses' | 'upcoming_bills' | 'summary';
  replyMessage: string;
}

// Category keyword mappings for Portuguese
const CATEGORY_MAP: Record<string, FinanceCategory> = {
  // Alimentação
  almoço: 'alimentacao',
  almoco: 'alimentacao',
  jantar: 'alimentacao',
  lanche: 'alimentacao',
  comida: 'alimentacao',
  restaurante: 'alimentacao',
  mercado: 'alimentacao',
  supermercado: 'alimentacao',
  padaria: 'alimentacao',
  açougue: 'alimentacao',
  acougue: 'alimentacao',
  feira: 'alimentacao',
  café: 'alimentacao',
  cafe: 'alimentacao',
  pizza: 'alimentacao',
  ifood: 'alimentacao',

  // Moradia / Serviços
  internet: 'moradia',
  luz: 'moradia',
  energia: 'moradia',
  água: 'moradia',
  agua: 'moradia',
  aluguel: 'moradia',
  condomínio: 'moradia',
  condominio: 'moradia',
  gás: 'moradia',
  gas: 'moradia',
  iptu: 'moradia',

  // Transporte
  transporte: 'transporte',
  uber: 'transporte',
  gasolina: 'transporte',
  combustível: 'transporte',
  combustivel: 'transporte',
  ônibus: 'transporte',
  onibus: 'transporte',
  metrô: 'transporte',
  metro: 'transporte',
  estacionamento: 'transporte',
  pedágio: 'transporte',
  pedagio: 'transporte',
  mecânico: 'transporte',

  // Saúde
  farmácia: 'saude',
  farmacia: 'saude',
  remédio: 'saude',
  remedio: 'saude',
  médico: 'saude',
  medico: 'saude',
  consulta: 'saude',
  dentista: 'saude',
  exame: 'saude',
  psicólogo: 'saude',
  terapia: 'saude',

  // Educação
  curso: 'educacao',
  livro: 'educacao',
  escola: 'educacao',
  faculdade: 'educacao',
  mensalidade: 'educacao',

  // Lazer
  cinema: 'lazer',
  viagem: 'lazer',
  hotel: 'lazer',
  passeio: 'lazer',
  streaming: 'lazer',
  netflix: 'lazer',
  spotify: 'lazer',
  jogo: 'lazer',

  // Trabalho / Renda
  salário: 'renda',
  salario: 'renda',
  trabalho: 'trabalho',
  freela: 'trabalho',
  freelance: 'trabalho',
  projeto: 'trabalho',
  venda: 'renda',
  comissão: 'renda',
  comissao: 'renda',
};

const PAYMENT_KEYWORDS: Record<string, PaymentMethod> = {
  pix: 'pix',
  'no pix': 'pix',
  cartão: 'cartao_credito',
  cartao: 'cartao_credito',
  crédito: 'cartao_credito',
  credito: 'cartao_credito',
  débito: 'cartao_debito',
  debito: 'cartao_debito',
  dinheiro: 'dinheiro',
  'em dinheiro': 'dinheiro',
  espécie: 'dinheiro',
  especie: 'dinheiro',
  boleto: 'boleto',
  transferência: 'transferencia',
  ted: 'transferencia',
};

export function parseWhatsAppMessage(
  rawText: string,
  todayStr: string = new Date().toISOString().split('T')[0]
): ParsedWhatsAppMessage {
  const text = rawText.trim();
  const lower = text.toLowerCase();

  // 1. Check for Help or Guidelines
  if (lower === 'ajuda' || lower === 'help' || lower === 'comandos' || lower === 'como usar') {
    return {
      intent: 'help',
      replyMessage: `👋 Olá! Sou o assistente financeiro do Ritmo.\n\nVocê pode me enviar lançamentos naturais ou consultas:\n• "Gastei 42,50 no almoço."\n• "Paguei R$ 120 de internet hoje."\n• "Recebi 800 reais de um trabalho."\n• "Comprei mercado por 235,70 no cartão."\n• "quanto gastei este mês?"\n• "quais contas vencem esta semana?"\n• "cancelar último lançamento"\n\nSegurança: seus dados são privados e isolados na sua conta Ritmo.`,
    };
  }

  // 2. Check for Cancel / Correction
  if (
    lower.includes('cancelar último') ||
    lower.includes('cancela o ultimo') ||
    lower.includes('apagar ultimo') ||
    lower.includes('estornar')
  ) {
    return {
      intent: 'cancel',
      replyMessage: `Deseja cancelar o último lançamento registrado? Responda com "CONFIRMAR CANCELAMENTO" para prosseguir.`,
    };
  }

  // 3. Check for Queries
  if (
    lower.includes('quanto gastei') ||
    lower.includes('gastos do mês') ||
    lower.includes('gastos de hoje') ||
    lower.includes('saldo') ||
    lower.includes('resumo financeiro')
  ) {
    return {
      intent: 'query',
      queryType: 'month_expenses',
      replyMessage: `Consultando seus gastos do mês atual no Ritmo...`,
    };
  }

  if (
    lower.includes('quais contas vencem') ||
    lower.includes('contas a vencer') ||
    lower.includes('vencimentos da semana') ||
    lower.includes('contas atrasadas')
  ) {
    return {
      intent: 'query',
      queryType: 'upcoming_bills',
      replyMessage: `Buscando suas contas a pagar nos próximos 7 dias no Ritmo...`,
    };
  }

  // 4. Determine Transaction Type (Income vs Expense)
  let type: TransactionType = 'expense';
  const isIncome =
    lower.includes('recebi') ||
    lower.includes('ganhei') ||
    lower.includes('entrou') ||
    lower.includes('salário') ||
    lower.includes('salario') ||
    lower.includes('renda') ||
    lower.includes('pix recebido') ||
    lower.includes('depósito recebido');

  const isExpense =
    lower.includes('gastei') ||
    lower.includes('comprei') ||
    lower.includes('paguei') ||
    lower.includes('despesa') ||
    lower.includes('gasto') ||
    lower.includes('pago');

  if (isIncome) {
    type = 'income';
  } else if (!isExpense && !lower.includes('r$') && !lower.match(/\d/)) {
    return {
      intent: 'ambiguous',
      clarifyingQuestion:
        'Não entendi se você deseja registrar uma receita, despesa ou consulta. Poderia detalhar? Exemplo: "Gastei 35 no lanche" ou "Recebi 500 de freela".',
      replyMessage:
        'Não entendi se você deseja registrar uma receita, despesa ou consulta. Exemplo: "Gastei 35 no lanche" ou "Recebi 500 de freela".',
    };
  }

  // 5. Extract Amount
  // Matches: R$ 120,50 | R$120 | 120,50 | 235.70 | 800 reais | 42 conto | 1.250,00
  // Refine amount extraction specifically looking for numbers
  const cleanedForAmount = lower
    .replace(/\b(dia|de|em|no|na)\s+\d{1,2}\b/g, '') // remove date references like "dia 15"
    .replace(/\b\d{4}\b/g, ''); // remove 4-digit years

  const match = cleanedForAmount.match(/(?:r\$\s*)?(\d+(?:\.\d{3})*(?:,\d{1,2})|\d+(?:\.\d{1,2})|\d+)\s*(?:reais|real|conto)?/i);

  if (!match) {
    return {
      intent: 'ambiguous',
      clarifyingQuestion:
        'Identifiquei a sua intenção, mas não encontrei o valor numérico. Quanto você pagou ou recebeu?',
      replyMessage:
        'Identifiquei a intenção, mas não localizei o valor em reais. Por favor informe o valor, ex: "Gastei 42,50 no almoço".',
    };
  }

  const rawNumStr = match[1];
  let amountCents = 0;

  if (rawNumStr.includes(',')) {
    // Brazilian format: 1.250,50 or 42,50
    const parts = rawNumStr.replace(/\./g, '').split(',');
    const whole = parseInt(parts[0], 10) || 0;
    const decimal = (parts[1] + '0').slice(0, 2);
    amountCents = whole * 100 + parseInt(decimal, 10);
  } else if (rawNumStr.includes('.')) {
    // Decimal or thousand: if 2 decimals after dot, treat as float
    const parts = rawNumStr.split('.');
    if (parts[1] && parts[1].length <= 2) {
      const whole = parseInt(parts[0], 10) || 0;
      const decimal = (parts[1] + '0').slice(0, 2);
      amountCents = whole * 100 + parseInt(decimal, 10);
    } else {
      amountCents = parseInt(rawNumStr.replace(/\./g, ''), 10) * 100;
    }
  } else {
    amountCents = parseInt(rawNumStr, 10) * 100;
  }

  if (amountCents <= 0) {
    return {
      intent: 'ambiguous',
      clarifyingQuestion: 'O valor informado parece ser zero ou inválido. Qual é o valor correto?',
      replyMessage: 'O valor informado parece ser zero ou inválido. Qual é o valor correto?',
    };
  }

  const formattedAmount = (amountCents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  // 6. Extract Category
  let category: FinanceCategory = type === 'income' ? 'trabalho' : 'outros';
  for (const [kw, cat] of Object.entries(CATEGORY_MAP)) {
    if (lower.includes(kw)) {
      category = cat;
      break;
    }
  }

  // 7. Extract Payment Method
  let paymentMethod: PaymentMethod = 'pix';
  for (const [kw, method] of Object.entries(PAYMENT_KEYWORDS)) {
    if (lower.includes(kw)) {
      paymentMethod = method;
      break;
    }
  }

  // 8. Extract Date
  let date = todayStr;
  const today = new Date();
  if (lower.includes('ontem')) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    date = yesterday.toISOString().split('T')[0];
  } else if (lower.includes('anteontem')) {
    const dayBefore = new Date(today);
    dayBefore.setDate(dayBefore.getDate() - 2);
    date = dayBefore.toISOString().split('T')[0];
  }

  // Check if it's a scheduled bill to pay
  const isPendingBill =
    lower.includes('vence') ||
    lower.includes('a pagar') ||
    lower.includes('vencimento');

  // 9. Extract Description
  // Remove command tokens and numbers to create clean description
  let description = text
    .replace(/(gastei|comprei|paguei|recebi|ganhei|no|na|com|de|em|para|hoje|ontem|anteontem)/gi, ' ')
    .replace(/(r\$|\$|reais|real|conto)/gi, ' ')
    .replace(new RegExp(rawNumStr.replace('.', '\\.'), 'g'), ' ')
    .replace(/(pix|cartão|cartao|débito|debito|crédito|credito|dinheiro|boleto)/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!description || description.length < 2) {
    description = category.charAt(0).toUpperCase() + category.slice(1);
  } else {
    // Capitalize first letter
    description = description.charAt(0).toUpperCase() + description.slice(1);
  }

  const typeLabel = type === 'income' ? 'Receita' : 'Despesa';
  const confirmationReply = `✅ *${typeLabel} registrada com sucesso no Ritmo!*\n\n• *Valor:* ${formattedAmount}\n• *Descrição:* ${description}\n• *Categoria:* ${category}\n• *Forma:* ${paymentMethod.toUpperCase()}\n• *Data:* ${date}\n\n_Para corrigir ou cancelar, envie "cancelar último"._`;

  return {
    intent: 'transaction',
    type,
    amountCents,
    formattedAmount,
    description,
    category,
    paymentMethod,
    date,
    isPendingBill,
    replyMessage: confirmationReply,
  };
}
