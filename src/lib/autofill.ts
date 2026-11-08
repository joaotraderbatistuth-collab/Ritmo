// Preenchimento automático: regras PURAS (testadas em tests/).
// Um compromisso puxa o resto: "Pagar IPVA terça R$ 1.250" vira tarefa na agenda, card no quadro
// Agenda, provisão em Finanças (a pagar) e lembretes na véspera e no dia. Nada aqui toca no banco.
import { fold, guessCategory } from './assistant-parser.js';
import { addDays } from './chain.js';
import { tzOffsetMs } from './recurrence.js';

export type LinkKind = 'task' | 'tx' | 'card' | 'reminder';

export interface MoneyInfo {
  type: 'expense' | 'income';
  /** valor achado no texto (centavos) ou null */
  amountCents: number | null;
  /** nome curto para Finanças e para o card: "IPVA", "Conta de luz" */
  label: string;
  category: string;
}

/** Verbos e palavras que, sozinhos, já indicam uma conta a pagar. */
const PAY_STRONG =
  /\b(pagar|pagamento|quitar|boleto|fatura|vencimento|vence|vencer|ipva|iptu|darf|licenciamento|imposto de renda|conta (?:de|da|do) (?:luz|agua|gas|energia|internet|telefone|celular|cartao))\b/;
/** Palavras que precisam vir junto de um verbo de pagar (sozinhas são ambíguas: "visitar casa para aluguel"). */
const PAY_PAST = /\b(paguei|pago ontem|ja paguei|quitei|gastei|comprei)\b/;
const INCOME_VERB = /\b(receber|recebimento|cobrar|vai cair|cai o|cair o)\b/;
const INCOME_WHAT = /\b(salario|pagamento|pix|aluguel|comissao|comissoes|reembolso|freela|freelance|cliente|valor|dinheiro|restituicao|ferias|13o|decimo terceiro|plr|bonus)\b/;

const AMOUNT_RE = [
  /r\$\s*(\d{1,3}(?:[.\s]\d{3})+|\d+)(?:,(\d{1,2}))?/,
  /\b(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{1,2}))?\s*(?:reais|real)\b/,
  /\b(\d{1,3}(?:\.\d{3})+|\d+),(\d{2})\b/,
];

/** Valor em centavos achado no texto ("R$ 1.250", "350 reais", "89,90"). */
export function findAmount(text: string): { cents: number; match: string } | null {
  const n = fold(text);
  for (const re of AMOUNT_RE) {
    const m = re.exec(n);
    if (!m) continue;
    const reais = Number(m[1].replace(/[.\s]/g, ''));
    const cents = reais * 100 + (m[2] ? Number(m[2].padEnd(2, '0')) : 0);
    if (Number.isFinite(cents) && cents > 0 && cents < 10_000_000_00) return { cents, match: text.slice(m.index, m.index + m[0].length) };
  }
  return null;
}

/** Tira o valor do título ("Pagar IPVA R$ 1.250" → "Pagar IPVA"). */
export function stripAmount(text: string): string {
  const a = findAmount(text);
  let t = a ? text.replace(a.match, ' ') : text;
  t = t.replace(/\s+(?:de|no valor de|valor)\s*$/i, '');
  return t.replace(/\s+/g, ' ').replace(/[\s,;:-]+$/, '').trim();
}

const capitalize = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

/** Nome curto para o lançamento: "Pagar o IPVA do carro" → "IPVA do carro". */
export function moneyLabel(text: string): string {
  let t = stripAmount(text);
  for (let i = 0; i < 3; i++) {
    const before = t;
    t = t
      .replace(/^(?:lembrar de|lembrete:?|tenho (?:que|de)|preciso|vou|devo|hoje|amanha)\s+/i, '')
      .replace(/^(?:pagar|pagamento|quitar|receber|recebimento|cobrar)\s+(?:(?:d[oa]s?|o|a|os|as|de)\s+)?/i, '')
      .trim();
    if (t === before) break;
  }
  return capitalize(t || text).slice(0, 120);
}

/**
 * Diz se o texto é dinheiro a pagar ou a receber. `hint` vem de quem chamou (ex.: a provisão já
 * sabe que é despesa). Devolve null quando não tem nada de dinheiro no texto.
 */
export function detectMoney(text: string, hint?: { type?: 'expense' | 'income'; amountCents?: number | null }): MoneyInfo | null {
  const n = fold(text);
  if (!n.trim()) return null;
  let type: 'expense' | 'income' | null = hint?.type ?? null;
  if (!type) {
    if (PAY_PAST.test(n)) return null; // já pago: é gasto, não compromisso
    if (INCOME_VERB.test(n) && (INCOME_WHAT.test(n) || findAmount(text))) type = 'income';
    else if (PAY_STRONG.test(n)) type = 'expense';
  }
  if (!type) return null;
  const amount = hint?.amountCents && hint.amountCents > 0 ? hint.amountCents : findAmount(text)?.cents ?? null;
  const label = moneyLabel(text);
  return { type, amountCents: amount, label, category: guessCategory(`${label} ${n}`, type) };
}

/** Categoria da tarefa pelo texto (só quando a pessoa não escolheu uma). */
export function guessTaskCategory(text: string, money: MoneyInfo | null): 'financas' | 'saude' | 'trabalho' | 'estudo' | null {
  if (money) return 'financas';
  const n = fold(text);
  if (/\b(medic[oa]|consulta|dentista|exame|vacina|fisio\w*|psicolog\w*|terapia|hospital|cirurgia|retorno)\b/.test(n)) return 'saude';
  if (/\b(reuniao|cliente|entrega|relatorio|apresentacao|call|chamada|projeto|trabalho)\b/.test(n)) return 'trabalho';
  if (/\b(prova|aula|estudar|curso|trabalho da faculdade|seminario|tcc)\b/.test(n)) return 'estudo';
  return null;
}

/** Rotina que se repete várias vezes por semana (todo dia, seg a sex) não vira card: encheria o quadro. */
export function isRoutineRule(rule: string | null | undefined): boolean {
  if (!rule) return false;
  if (rule === 'daily' || rule === 'weekdays') return true;
  const m = /^weekly:([\d,]+)$/.exec(rule);
  return Boolean(m && m[1].split(',').filter(Boolean).length >= 2);
}

/** Lista de "concluído" de um quadro. */
export function isDoneListTitle(title: string): boolean {
  return /\b(conclu\w*|feit[oa]s?|pront[oa]s?|finaliz\w*|done|pag[oa]s?|encerrad\w*)\b/.test(fold(title));
}

/** Quadro onde o preenchimento automático coloca os cards. */
export const AUTO_BOARD_TITLE = 'Agenda';
export function isAutoBoardTitle(title: string): boolean {
  return fold(title).trim() === 'agenda';
}

export const brlCents = (cents: number) => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/** Etiqueta do card. */
export function cardLabelFor(money: MoneyInfo | null): string {
  if (!money) return 'Agenda';
  return money.type === 'income' ? 'A receber' : 'Conta a pagar';
}

export interface PlannedReminder {
  date: string; // YYYY-MM-DD local
  time: string; // HH:MM local
  text: string;
  /** se o horário já passou, pode tocar na hora do compromisso (só para os avisos "30 min antes") */
  fallbackTime?: string;
}

/** Hora local "HH:MM" menos N minutos (não passa da meia-noite para trás). */
export function minusMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = Math.max(0, h * 60 + m - minutes);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

const hhmm = (t: string) => (t.endsWith(':00') ? `${Number(t.slice(0, 2))}h` : t.replace(':', 'h'));

/**
 * Lembretes de um compromisso:
 * - conta a pagar/receber: na véspera às 9h e no dia às 8h (ou 1 h antes, se tiver horário);
 * - compromisso com horário: 30 minutos antes;
 * - compromisso sem horário: nenhum (o Próximo passo já mostra no dia).
 */
export function planReminders(input: { title: string; date: string; time?: string | null; money: MoneyInfo | null }): PlannedReminder[] {
  const { title, date, money } = input;
  const time = input.time && /^\d{2}:\d{2}$/.test(input.time) ? input.time : null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return [];
  if (money) {
    const value = money.amountCents ? ` (${brlCents(money.amountCents)})` : '';
    const verb = money.type === 'income' ? 'entra' : 'vence';
    const dayTime = time ? minusMinutes(time, 60) : '08:00';
    return [
      { date: addDays(date, -1), time: '09:00', text: `Amanhã ${verb}: ${title}${value}` },
      { date, time: dayTime, text: `Hoje ${verb}: ${title}${value}${time ? ` às ${hhmm(time)}` : ''}` },
    ];
  }
  if (time) return [{ date, time: minusMinutes(time, 30), text: `${title} às ${hhmm(time)}`, fallbackTime: time }];
  return [];
}

/** Frase curta do que foi preenchido, para o aviso no app e para o secretário. */
export function describeAuto(items: { kind: LinkKind; detail?: string }[]): string {
  const parts: string[] = [];
  const has = (k: LinkKind) => items.filter((i) => i.kind === k);
  if (has('task').length) parts.push('compromisso na agenda');
  if (has('card').length) parts.push('card no quadro Agenda');
  const tx = has('tx')[0];
  if (tx) parts.push(tx.detail || 'provisão em Finanças');
  const rem = has('reminder');
  if (rem.length) parts.push(rem.length > 1 ? `${rem.length} lembretes` : 'lembrete');
  if (!parts.length) return '';
  const last = parts.pop()!;
  return parts.length ? `${parts.join(', ')} e ${last}` : last;
}

/** "YYYY-MM-DD" + "HH:MM" no fuso da pessoa → instante. */
export function localToInstant(date: string, time: string, tz: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  const [h, mi] = time.split(':').map(Number);
  const wall = Date.UTC(y, m - 1, d, h, mi);
  let at = wall - tzOffsetMs(tz, new Date(wall));
  at = wall - tzOffsetMs(tz, new Date(at)); // horário de verão
  return new Date(at);
}

/** Instante → { date, time } no fuso da pessoa. */
export function instantToLocal(at: Date, tz: string): { date: string; time: string } {
  const wall = new Date(at.getTime() + tzOffsetMs(tz, at)).toISOString();
  return { date: wall.slice(0, 10), time: wall.slice(11, 16) };
}
