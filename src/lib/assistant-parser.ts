// Secretário do Ritmo: entende frases faladas ou digitadas em português. Regras PURAS, testadas em tests/.
// Ex.: "gastei 32 no almoço", "agenda dentista amanhã às 3 da tarde", "me lembra de pagar a luz dia 10".
import { findRepeat, settleRepeat } from './recurrence.js';

export type AssistantTab = 'feed' | 'hoje' | 'roteiro' | 'rotina' | 'quadros' | 'habitos' | 'treino' | 'foco' | 'diario' | 'financas' | 'progresso' | 'configuracoes' | 'afiliados';

export type Intent =
  | { kind: 'expense' | 'income'; amountCents: number | null; description: string; category: string; date: string }
  | { kind: 'appointment'; title: string; date: string | null; time: string | null }
  | { kind: 'reminder'; text: string; date: string | null; time: string | null; repeat?: string | null }
  | { kind: 'task'; title: string; date: string }
  | { kind: 'habit_done'; name: string }
  | { kind: 'agenda'; date: string }
  | { kind: 'spent'; period: 'hoje' | 'ontem' | 'semana' | 'mes' }
  | { kind: 'balance' }
  | { kind: 'bills' }
  | { kind: 'points' }
  | { kind: 'reminders' }
  | { kind: 'task_done'; title: string }
  | { kind: 'card'; title: string; board: string | null; list: string | null; dueDate: string | null }
  | { kind: 'diary'; text: string }
  | { kind: 'start_workout'; sport: 'corrida' | 'caminhada' | 'bike' | 'trilha' }
  | { kind: 'workout_ask' }
  | { kind: 'start_focus'; minutes: number; topic: string }
  | { kind: 'open_tab'; tab: AssistantTab }
  | { kind: 'briefing' }
  | { kind: 'help' }
  | { kind: 'thanks' }
  | { kind: 'cancel' }
  | { kind: 'unknown' };

/* ---------------- Texto ---------------- */

/** Minúsculas e sem acento, caractere a caractere (mantém as posições para recortar o original). */
export function fold(s: string): string {
  let out = '';
  for (const ch of s.toLowerCase()) {
    const f = ch.normalize('NFD').replace(/[̀-ͯ]/g, '');
    out += f.length === 1 ? f : ch.length === 1 ? ch : f.slice(0, 1) || ' ';
  }
  return out;
}

/** Frase em edição: o texto original (para a descrição com acento) e a versão sem acento (para reconhecer). */
class Phrase {
  orig: string;
  n: string;
  constructor(text: string) {
    this.orig = text.replace(/\s+/g, ' ').trim();
    this.n = fold(this.orig);
    if (this.n.length !== this.orig.length) this.orig = this.n; // segurança: nunca desalinhar
  }
  /** Procura no texto sem acento, remove o trecho dos dois e devolve o resultado. */
  cut(re: RegExp): RegExpExecArray | null {
    const m = re.exec(this.n);
    if (!m) return null;
    const a = m.index;
    const b = a + m[0].length;
    this.n = (this.n.slice(0, a) + ' ' + this.n.slice(b)).replace(/\s+/g, ' ');
    this.orig = (this.orig.slice(0, a) + ' ' + this.orig.slice(b)).replace(/\s+/g, ' ');
    return m;
  }
  has(re: RegExp) {
    return re.test(this.n);
  }
}

const capitalize = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s);

/** Limpa sobras ("de", "no", "pra"...) do começo e do fim e deixa a primeira letra maiúscula. */
export function tidy(s: string): string {
  const STOP = /^(?:de|do|da|dos|das|no|na|nos|nas|em|com|pra|pro|para|por|o|a|os|as|um|uma|que|e|ai|la|isso|sobre|referente|ao|aos)\s+/;
  const STOP_END = /\s+(?:de|do|da|no|na|em|com|pra|para|por|o|a|e|que|hoje|agora|por favor|pfv|ok)$/;
  let t = s.replace(/[.,;!?]+/g, ' ').replace(/\s+/g, ' ').trim();
  for (let i = 0; i < 6; i++) {
    const before = t;
    t = t.replace(STOP, '').replace(STOP_END, '').trim();
    if (t === before) break;
  }
  return capitalize(t.slice(0, 120));
}

/* ---------------- Datas e horas ---------------- */

export const pad2 = (n: number) => String(n).padStart(2, '0');
export const ymd = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const addDays = (d: Date, n: number) => {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, 12);
  return x;
};

const WEEKDAYS: Record<string, number> = { domingo: 0, segunda: 1, terca: 2, quarta: 3, quinta: 4, sexta: 5, sabado: 6 };
const MONTHS: Record<string, number> = { janeiro: 1, fevereiro: 2, marco: 3, abril: 4, maio: 5, junho: 6, julho: 7, agosto: 8, setembro: 9, outubro: 10, novembro: 11, dezembro: 12 };
const MONTH_RE = '(janeiro|fevereiro|marco|abril|maio|junho|julho|agosto|setembro|outubro|novembro|dezembro)';
const WORD_NUM: Record<string, number> = { um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9, dez: 10, onze: 11, doze: 12, quinze: 15, vinte: 20, trinta: 30, quarenta: 40, cinquenta: 50 };
const num = (v: string | undefined) => (v === undefined ? NaN : /^\d+$/.test(v) ? Number(v) : WORD_NUM[v] ?? NaN);
const NUMW = '(\\d{1,2}|uma?|duas|dois|tres|quatro|cinco|seis|sete|oito|nove|dez|onze|doze)';

function applyPeriod(h: number, period: string | undefined): number {
  if (!period) return h;
  if (/tarde|noite/.test(period) && h < 12) return h + 12;
  if (/madrugada|manha/.test(period) && h === 12) return 0;
  return h;
}

export interface When {
  date: string | null;
  time: string | null;
}

/** Tira datas e horas da frase. `allowPast` aceita "ontem" (lançamentos de gasto). */
export function extractWhen(p: Phrase, now: Date, allowPast = false): When {
  let date: string | null = null;
  let time: string | null = null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12);

  // relativo: "daqui a 20 minutos", "em 2 horas", "daqui a meia hora"
  const rel = p.cut(/\b(?:daqui a|daqui|em|dentro de)\s+(\d{1,3}|uma?|duas|dois|tres|meia)\s*(minutos?|min|horas?|h|dias?)\b/);
  if (rel) {
    const amount = rel[1] === 'meia' ? 0.5 : num(rel[1]);
    const unit = rel[2];
    if (Number.isFinite(amount)) {
      if (/^d/.test(unit)) date = ymd(addDays(today, amount));
      else {
        const t = new Date(now.getTime() + amount * (unit.startsWith('h') ? 3600_000 : 60_000));
        date = ymd(t);
        time = `${pad2(t.getHours())}:${pad2(t.getMinutes())}`;
      }
    }
  }

  // dias
  if (!date) {
    if (p.cut(/\bdepois de amanha\b/)) date = ymd(addDays(today, 2));
    else if (p.cut(/\bamanha\b/)) date = ymd(addDays(today, 1));
    else if (allowPast && p.cut(/\banteontem\b/)) date = ymd(addDays(today, -2));
    else if (allowPast && p.cut(/\bontem\b/)) date = ymd(addDays(today, -1));
    else if (p.cut(/\bhoje\b/)) date = ymd(today);
  }
  if (!date) {
    const m = p.cut(/\b(?:(?:na|no|nesta|neste|esta|este|essa|nessa|proxima|proximo|na proxima|no proximo|dessa|desta)\s+)?(segunda|terca|quarta|quinta|sexta|sabado|domingo)(?:[- ]feira)?(?:\s+que vem)?\b/);
    if (m) {
      const target = WEEKDAYS[m[1]];
      let diff = (target - today.getDay() + 7) % 7;
      if (diff === 0 && /proxim|que vem/.test(m[0])) diff = 7;
      date = ymd(addDays(today, diff));
    }
  }
  if (!date) {
    const m = p.cut(new RegExp(`\\b(?:dia\\s+)?(\\d{1,2})\\s+de\\s+${MONTH_RE}(?:\\s+de\\s+(\\d{4}))?\\b`));
    if (m) {
      const d = Number(m[1]);
      const mo = MONTHS[m[2]];
      let y = m[3] ? Number(m[3]) : today.getFullYear();
      if (!m[3] && new Date(y, mo - 1, d, 12) < today && !allowPast) y++;
      date = `${y}-${pad2(mo)}-${pad2(d)}`;
    }
  }
  if (!date) {
    const m = p.cut(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/);
    if (m) {
      const d = Number(m[1]);
      const mo = Number(m[2]);
      let y = m[3] ? Number(m[3].length === 2 ? `20${m[3]}` : m[3]) : today.getFullYear();
      if (!m[3] && new Date(y, mo - 1, d, 12) < today && !allowPast) y++;
      if (mo >= 1 && mo <= 12 && d >= 1 && d <= 31) date = `${y}-${pad2(mo)}-${pad2(d)}`;
    }
  }
  if (!date) {
    const m = p.cut(/\bdia\s+(\d{1,2})(?:\s+(?:do mes que vem|do proximo mes))?\b/);
    if (m) {
      const d = Number(m[1]);
      let y = today.getFullYear();
      let mo = today.getMonth() + 1;
      if (/mes/.test(m[0]) || (d < today.getDate() && !allowPast)) {
        mo++;
        if (mo > 12) {
          mo = 1;
          y++;
        }
      }
      if (d >= 1 && d <= 31) date = `${y}-${pad2(mo)}-${pad2(d)}`;
    }
  }

  // horas
  const PERIOD = '(?:\\s+(da manha|da tarde|da noite|da madrugada|de manha|de tarde|de noite))?';
  if (!time) {
    if (p.cut(/\b(?:(?:ao|as|a|pro|pra|para o)\s+)?meio[- ]dia(?:\s+e\s+meia)?\b/)) time = '12:00';
    else if (p.cut(/\b(?:(?:a|as)\s+)?meia[- ]noite\b/)) time = '00:00';
  }
  const tryTime = (re: RegExp, hi: number, mi: number, pi: number) => {
    if (time) return;
    const m = p.cut(re);
    if (!m) return;
    let h = num(m[hi]);
    let min = m[mi] === 'meia' ? 30 : m[mi] ? Number(m[mi]) : 0;
    if (!Number.isFinite(h) || h > 23 || min > 59) return;
    h = applyPeriod(h, m[pi]);
    time = `${pad2(h)}:${pad2(min)}`;
  };
  // "às 15h30", "às 3 da tarde", "às 15 e 30", "às 9 e meia"
  tryTime(new RegExp(`\\b(?:as|a|ate as|pras|pra|para as)\\s+${NUMW}(?:\\s*(?:h|:|horas?|hs)\\s*(\\d{2})?)?(?:\\s+e\\s+(\\d{1,2}|meia)(?:\\s*minutos?)?)?${PERIOD}\\b`), 1, 2, 4);
  // ajuste para "às 15 e 30": o minuto vem no 3º grupo
  // "15h", "15h30", "15:30"
  tryTime(new RegExp(`\\b(\\d{1,2})\\s*(?:h|:)\\s*(\\d{2})?(?:\\s*(?:min|minutos))?${PERIOD}(?![\\d,.])`), 1, 2, 3);
  // "15 horas", "3 horas da tarde"
  tryTime(new RegExp(`\\b${NUMW}\\s+horas?(?:\\s+e\\s+(\\d{1,2}|meia))?${PERIOD}\\b`), 1, 2, 3);
  // "3 da tarde"
  tryTime(new RegExp(`\\b${NUMW}\\s+(da manha|da tarde|da noite|da madrugada)\\b`), 1, 99, 2);
  // só o período: "de manhã", "à tarde", "à noite"
  if (!time) {
    const m = p.cut(/\b(?:de|a|pela|na|no fim da|hoje a)\s+(manha|tarde|noite)\b/);
    if (m) time = m[1] === 'manha' ? '09:00' : m[1] === 'tarde' ? '15:00' : '20:00';
  }
  return { date, time };
}

/* Corrige o caso "às 15 e 30" (minuto no 3º grupo da 1ª regra). */
function fixHalfPast(raw: string): string {
  return raw.replace(/(?<![\p{L}])([aà]s|a|pras|pra|para [aà]s)\s+(\d{1,2})\s+e\s+(\d{1,2}|meia)\b/gu, (_m, pre, h, mm) => `${pre} ${h}:${mm === 'meia' ? '30' : String(mm).padStart(2, '0')}`);
}

/* ---------------- Valores ---------------- */

/** Acha o valor em reais: "R$ 32,50", "32 reais e 50 centavos", "2 mil e 500", "1.234,56", "45". */
export function extractAmount(p: Phrase): number | null {
  const m = p.cut(
    /(?:r\$\s*)?\b(\d{1,3}(?:\.\d{3})+|\d+)(?:,(\d{1,2}))?(?:\s*mil(?:\s+e\s+(\d{1,3}))?)?(?:\s*(reais|real|conto|contos|pila|pilas|pau|paus))?(?:\s+e\s+(\d{1,2})\s*centavos?)?\b/
  );
  if (!m) return null;
  let reais = Number(m[1].replace(/\./g, ''));
  if (/mil/.test(m[0])) reais = reais * 1000 + (m[3] ? Number(m[3]) : 0);
  let cents = m[2] ? Number(m[2].padEnd(2, '0')) : 0;
  if (m[5]) cents = Number(m[5]);
  const total = reais * 100 + cents;
  return Number.isFinite(total) && total > 0 && total < 100_000_000_00 ? total : null;
}

/* ---------------- Categorias de gasto ---------------- */

const CATEGORY_WORDS: [RegExp, string][] = [
  [/\b(almoco|jantar|janta|lanche|comida|restaurante|mercado|supermercado|padaria|acougue|feira|cafe|pizza|ifood|hamburguer|lanchonete|marmita|sorvete|acai)\b/, 'alimentacao'],
  [/\b(luz|energia|agua|aluguel|condominio|gas|iptu|internet|faxina|diarista|moveis|casa)\b/, 'moradia'],
  [/\b(uber|99|taxi|gasolina|combustivel|onibus|metro|estacionamento|pedagio|passagem|carro|oficina|ipva|moto)\b/, 'transporte'],
  [/\b(farmacia|remedio|medico|consulta|dentista|exame|plano de saude|academia|hospital|psicologo|terapia)\b/, 'saude'],
  [/\b(curso|livro|livros|escola|faculdade|mensalidade escolar|material escolar|apostila)\b/, 'educacao'],
  [/\b(cinema|show|bar|cerveja|viagem|netflix|spotify|streaming|jogo|lazer|passeio|ingresso|festa)\b/, 'lazer'],
  [/\b(celular|telefone|assinatura|conserto|manutencao|servico|lavanderia|cabeleireiro|barbeiro|manicure)\b/, 'servicos'],
  [/\b(salario|freela|freelance|bonus|comissao|pagamento do cliente|venda|vendi|pix recebido|renda|aluguel recebido|dividendos?)\b/, 'renda'],
];

export function guessCategory(text: string, kind: 'expense' | 'income'): string {
  const n = fold(text);
  for (const [re, cat] of CATEGORY_WORDS) if (re.test(n)) return kind === 'income' && cat !== 'renda' ? 'renda' : cat;
  return kind === 'income' ? 'renda' : 'outros';
}

/* ---------------- Intenções ---------------- */

const SPORT_WORDS: [RegExp, 'corrida' | 'caminhada' | 'bike' | 'trilha'][] = [
  [/\b(corrida|correr|corridinha)\b/, 'corrida'],
  [/\b(caminhada|caminhar|andar)\b/, 'caminhada'],
  [/\b(pedal|pedalar|pedalada|bike|bicicleta|ciclismo)\b/, 'bike'],
  [/\b(trilha)\b/, 'trilha'],
];

const TAB_WORDS: [RegExp, AssistantTab][] = [
  [/\bfinanca/, 'financas'],
  [/\bhabito/, 'habitos'],
  [/\btreino/, 'treino'],
  [/\bfeed\b/, 'feed'],
  [/\bdiario\b/, 'diario'],
  [/\bprogresso\b/, 'progresso'],
  [/\bconfigurac/, 'configuracoes'],
  [/\b(tarefas|rotina)\b/, 'rotina'],
  [/\bquadros?\b/, 'quadros'],
  [/\b(metas|roteiro)\b/, 'roteiro'],
  [/\bfoco\b/, 'foco'],
  [/\b(hoje|inicio)\b/, 'hoje'],
  [/\b(indique|afiliad)/, 'afiliados'],
];

/**
 * Entende a frase. `assistantName` é tirado do começo ("Rita, gastei 30 no almoço").
 * `now` é o horário local da pessoa.
 */
export function parseCommand(raw: string, now: Date = new Date(), assistantName = ''): Intent {
  let text = String(raw || '').replace(/\s+/g, ' ').trim();
  if (assistantName) {
    const nameN = fold(assistantName.trim());
    const tn = fold(text);
    if (nameN && (tn.startsWith(nameN + ' ') || tn.startsWith(nameN + ',') || tn === nameN)) text = text.slice(assistantName.trim().length);
  }
  text = text.replace(/^[\s,.:;!-]*(?:ei|oi|ola|ok|e ai|hey|por favor)?[\s,.:;!-]*/i, '');
  const n0 = fold(text).replace(/[.!?]+$/g, '').trim();
  if (!n0) return { kind: 'unknown' };

  // conversa
  if (/^(obrigad[oa]|valeu|brigad[oa]|show|perfeito|otimo|beleza)\b/.test(n0)) return { kind: 'thanks' };
  if (/^(cancela|cancelar|esquece|deixa pra la|nada|deixa)\b/.test(n0)) return { kind: 'cancel' };
  if (/\b(ajuda|o que voce (faz|sabe fazer|pode fazer)|quais (os )?comandos|como (te usar|funciona voce|voce funciona))\b/.test(n0)) return { kind: 'help' };

  const p = new Phrase(fixHalfPast(text));

  // diário: "anota no diário que hoje foi produtivo", "resumo do dia: fechei o relatório e caminhei"
  const CREATE = /\b(anot\w*|registr\w*|escrev\w*|coloc\w*|salv\w*|grav\w*|adicion\w*|bota|botar|cri\w*|inclu\w*|faz|faca|nov[oa])\b/;
  const diaryCmd = /\bdiario\b/.test(n0) && (CREATE.test(n0) || /^(meu )?diario\b/.test(n0)) && !/\b(abr\w*|abre|mostra\w*|vai (para|pra)|ir (para|pra))\b/.test(n0);
  const summaryM = /^(?:resumo do (?:meu )?dia|meu resumo do dia|meu resumo|meu dia (?:hoje )?foi|hoje meu dia foi)\b[\s:,.-]*(.*)$/.exec(n0);
  const summaryText = summaryM && /^meu dia|^hoje meu dia/.test(n0) ? n0 : summaryM?.[1] || '';
  if (diaryCmd || (summaryM && summaryText.split(' ').filter(Boolean).length >= 4)) {
    if (diaryCmd) {
      p.cut(/^.*?\bdiario\b(?:\s+(?:de hoje|hoje))?(?:\s*[:,.-]\s*|\s+(?:que|isso|assim)\b)?/);
    } else if (!/^meu dia|^hoje meu dia/.test(n0)) {
      p.cut(/^(?:resumo do (?:meu )?dia|meu resumo do dia|meu resumo)\b[\s:,.-]*/);
    }
    const body = p.orig.replace(/^[\s:,.;-]+/, '').trim();
    if (body.length >= 2) return { kind: 'diary', text: capitalize(body).slice(0, 2000) };
    return { kind: 'diary', text: '' };
  }

  // card nos Quadros: "cria um card revisar proposta no quadro trabalho na lista fazendo"
  const cardWord = /\b(card|cards|cartao|cartaozinho)\b/.test(n0) && !/\bcartao de (credito|debito)\b|\b(no|com o|pelo) cartao\b/.test(n0);
  const boardWord = /\b(no|do|pro|para o) quadro\b/.test(n0);
  if ((cardWord && (CREATE.test(n0) || /^(um |o )?(card|cartao)\b/.test(n0))) || (boardWord && CREATE.test(n0) && !/\b(abr\w*|abre|mostra)\b/.test(n0))) {
    const when = extractWhen(p, now);
    const listM = p.cut(/\b(?:na|pra|para a|em) (?:lista|coluna)\s+(?:de\s+|do\s+|da\s+)?(.+?)(?=\s+(?:no|do|pro|para o) quadro\b|$)/);
    const boardM = p.cut(/\b(?:no|do|pro|para o) quadro\s+(?:de\s+|do\s+|da\s+)?(.+?)(?=\s+(?:na|pra|para a|em) (?:lista|coluna)\b|$)/);
    const listM2 = listM || p.cut(/\b(?:na|pra|para a|em) (?:lista|coluna)\s+(?:de\s+|do\s+|da\s+)?(.+?)$/);
    p.cut(/^(?:.*?\b(?:cri\w*|adicion\w*|coloc\w*|bota|botar|anot\w*|inclu\w*|faz|faca)\b)?\s*(?:um|uma|o|a)?\s*(?:novo|nova)?\s*(?:card|cartao|cartaozinho|tarefa)?\b(?:\s+(?:de|para|pra|com|chamado|chamada|sobre)\b)?/);
    const title = tidy(p.orig);
    return {
      kind: 'card',
      title,
      board: boardM ? boardM[1].trim() : null,
      list: listM2 ? listM2[1].trim() : null,
      dueDate: when.date,
    };
  }

  // tarefa concluída: "concluí a tarefa enviar relatório", "marca a tarefa ligar pro banco como feita"
  if (/\btarefa\b/.test(n0) && /\b(conclu\w*|termin\w*|finaliz\w*|feit[ao]|fiz|complet\w*|cumpri\w*|ticar|tica)\b/.test(n0) && !/\b(adicion\w*|cria\w*|nova|anot\w*|coloc\w*)\b/.test(n0)) {
    for (let i = 0; i < 8; i++) {
      if (!p.cut(/\b(?:marca|marcar|marquei|ja|eu|conclui|concluir|concluida|concluido|terminei|terminar|termina|finalizei|finalizar|finaliza|fiz|feita|feito|completei|completar|cumpri|a tarefa|tarefa|como|de hoje|hoje|ticar|tica)\b/)) break;
    }
    const title = tidy(p.orig);
    if (title) return { kind: 'task_done', title };
  }

  // lembrete
  if (p.has(/\b(me lembr\w*|lembre-?me|lembrar de|lembrete|me avis\w*|nao (me )?deixa (eu )?esquecer|me alert\w*)\b/)) {
    p.cut(/\b(?:cria|criar|faz|fazer|coloca|colocar|adiciona|adicionar)?\s*(?:um\s+)?(?:me lembr\w*|lembre-?me|lembrar|lembrete|me avis\w*|nao (?:me )?deixa (?:eu )?esquecer|me alert\w*)\b(?:\s+(?:de|que|da|do|pra|para)\b)?/);
    const rep = findRepeat(p.n);
    if (rep) p.cut(rep.match);
    const when = extractWhen(p, now);
    const repeat = rep ? settleRepeat(rep.repeat, when.date || ymd(now)) : null;
    return { kind: 'reminder', text: tidy(p.orig), date: when.date, time: when.time, repeat };
  }

  // consultas (antes dos lançamentos: "quanto gastei" não é um gasto)
  if (/\bquanto (eu )?(gastei|gasto|ja gastei)\b/.test(n0)) {
    const period = /\bontem\b/.test(n0) ? 'ontem' : /\bhoje\b/.test(n0) ? 'hoje' : /\bsemana\b/.test(n0) ? 'semana' : 'mes';
    return { kind: 'spent', period };
  }
  if (/\b(saldo|quanto (eu )?(tenho|sobrou|ganhei)|como (estao|anda|andam|esta) (as |minhas |a minha |minha )?financas)\b/.test(n0)) return { kind: 'balance' };
  if (/\b(contas? (a vencer|vencendo|que vence\w*|vence\w*|pra pagar|para pagar|atrasadas?)|o que (eu )?tenho (que|pra|para) pagar|vencimentos?|boletos?)\b/.test(n0) && !/\b(paguei|gastei)\b/.test(n0)) return { kind: 'bills' };
  if (/\b(meus pontos|quantos pontos|meu nivel|qual (e )?(o )?meu nivel|meu xp)\b/.test(n0)) return { kind: 'points' };
  if (/\b(meus lembretes|quais (sao )?(os )?(meus )?lembretes|lembretes (de hoje|ativos|marcados))\b/.test(n0)) return { kind: 'reminders' };
  if (/\b(o que (eu )?tenho|minha agenda|meus compromissos|o que tem (pra|para)|tarefas d[eo]|agenda d[eo]|como (esta|ta) (meu|o) dia|o que (eu )?(preciso|tenho que) fazer)\b/.test(n0) && !/\b(agenda|marca)\s+(um|uma|o|a|reuniao|consulta|dentista|medico)\b/.test(n0)) {
    const q = new Phrase(text);
    const when = extractWhen(q, now);
    if (/\bcomo (esta|ta) (meu|o) dia\b/.test(n0) && !when.date) return { kind: 'briefing' };
    return { kind: 'agenda', date: when.date || ymd(now) };
  }
  if (/^(bom dia|boa tarde|boa noite)\b|\b(resumo do dia|meu resumo|me atualiza|novidades do dia|resume (o|meu) dia)\b/.test(n0)) return { kind: 'briefing' };

  // começar treino / foco
  if (/\b(comec\w*|inici\w*|bora|vamos|vou|quero|liga|ligar|grava\w*)\b/.test(n0)) {
    for (const [re, sport] of SPORT_WORDS) if (re.test(n0)) return { kind: 'start_workout', sport };
    if (/\b(treino|treinar|exercicio|atividade fisica)\b/.test(n0) && !/\b(abr\w*|abre|mostra)\b/.test(n0)) return { kind: 'workout_ask' };
    if (/\b(foco|pomodoro|concentrar|focar)\b/.test(n0)) {
      const mm = /(\d{1,3})\s*(?:min|minutos)/.exec(n0) || /\b(\d{1,3})\b/.exec(n0);
      const minutes = Math.min(180, Math.max(5, mm ? Number(mm[1]) : 25));
      const topicM = /\b(?:em|no|na|para|pra)\s+(.+)$/.exec(text.replace(/\d+\s*(min|minutos)/i, ''));
      return { kind: 'start_focus', minutes, topic: topicM ? tidy(topicM[1]).slice(0, 60) : '' };
    }
  }

  // abrir uma aba
  if (/^(abr\w*|abre|vai (para|pra)|ir (para|pra)|mostra|mostrar|me leva (para|pra))\b/.test(n0)) {
    for (const [re, tab] of TAB_WORDS) if (re.test(n0)) return { kind: 'open_tab', tab };
  }

  // hábito cumprido
  if (/\bhabito\b/.test(n0) || /\b(como|ja)\s+(feit[oa]|concluid[oa]|cumprid[oa])\s*$/.test(n0) || /^(fiz|cumpri|conclui|ja fiz)\b/.test(n0)) {
    if (!/\b(agend|lembr)/.test(n0) && !/\d+\s*(reais|real)/.test(n0)) {
      for (let i = 0; i < 8; i++) {
        if (!p.cut(/\b(?:marca|marcar|marquei|registra|registrar|fiz|cumpri|conclui|ja|o habito|habito|como|feito|feita|concluido|concluida|cumprido|cumprida|de hoje|hoje)\b/)) break;
      }
      const clean = tidy(p.orig);
      if (clean) return { kind: 'habit_done', name: clean };
    }
  }

  // compromisso
  if (/\b(agend\w*|agenda|marc\w*\s+(?:um |uma )?(?:compromisso|consulta|reuniao|horario|encontro)|compromisso|reuniao)\b/.test(n0) || /^(marca|marcar)\b/.test(n0)) {
    p.cut(/\b(?:na|em|pra|para a|no)\s+(?:minha\s+|meu\s+)?(?:agenda|calendario)\b/);
    p.cut(/\b(?:agend\w*|agenda|marca|marcar|marque|cria|criar|coloca|colocar|anota|anotar)\b(?:\s+(?:um|uma|o|a)\b)?(?:\s+(?:compromisso|evento|horario)\b)?(?:\s+(?:de|com|no|na|pra|para)\b)?/);
    p.cut(/^\s*(?:um\s+|o\s+)?compromisso\b(?:\s+(?:de|com)\b)?/);
    const when = extractWhen(p, now);
    const title = tidy(p.orig) || 'Compromisso';
    return { kind: 'appointment', title, date: when.date, time: when.time };
  }

  // tarefa
  if (/\b(tarefa|na (minha )?lista|to-?do|na rotina|pra fazer|para fazer)\b/.test(n0) && /\b(adicion\w*|cria\w*|anot\w*|coloc\w*|inclu\w*|bota|botar|nova|tarefa)\b/.test(n0)) {
    p.cut(/\b(?:adiciona|adicionar|cria|criar|anota|anotar|coloca|colocar|inclui|incluir|bota|botar)?\s*(?:uma\s+)?(?:nova\s+)?tarefa\b(?:\s+(?:de|pra|para)\b)?/);
    p.cut(/\b(?:na (?:minha )?lista|nas tarefas|na rotina|no to-?do|pra fazer|para fazer)\b/);
    const when = extractWhen(p, now);
    const title = tidy(p.orig);
    if (title) return { kind: 'task', title, date: when.date || ymd(now) };
  }

  // lançamentos (gasto / receita)
  const isIncome = /\b(recebi|ganhei|entrou|entrada de|entrada|receita|caiu (o|meu)? ?(salario|pix|pagamento)|lanc\w*\s+(?:uma\s+)?(?:receita|entrada)|vendi)\b/.test(n0);
  const isExpense = /\b(gastei|paguei|comprei|custo|custou|despesa|gasto|lanc\w*|debit\w*|saiu|saida|conta de|pagar)\b/.test(n0);
  const hasMoney = /(r\$|\breais\b|\breal\b|\bcontos?\b|\b\d+,\d{2}\b)/.test(n0);
  if (isIncome || isExpense || hasMoney) {
    const kind = isIncome && !/\b(gastei|paguei|comprei|custo|despesa|saida|saiu)\b/.test(n0) ? 'income' : 'expense';
    const when = extractWhen(p, now, true);
    const amountCents = extractAmount(p);
    p.cut(/\b(?:na|da|pra|para a|nas|nas minhas)\s+(?:minha\s+)?(?:planilha|financas)\b/);
    p.cut(/\b(?:lanc\w*|registr\w*|anot\w*|coloc\w*|adicion\w*)\b(?:\s+(?:um|uma|o|a)\b)?(?:\s+(?:custo|gasto|despesa|receita|entrada|lancamento)\b)?(?:\s+(?:de|do|da|no|na|com)\b)?/);
    for (let i = 0; i < 3; i++) p.cut(/\b(?:eu\s+)?(?:gastei|paguei|comprei|custou|custo|despesa|gasto|recebi|ganhei|entrou|entrada|receita|vendi|saiu|saida|debitou|caiu)\b(?:\s+(?:o|a|um|uma)\b)?/);
    p.cut(/\b(?:no|na)\s+(?:pix|cartao(?: de credito| de debito)?|credito|debito|dinheiro|boleto)\b/);
    p.cut(/\b(?:de\s+)?dinheiro\b/);
    const description = tidy(p.orig) || (kind === 'income' ? 'Receita' : 'Gasto');
    return { kind, amountCents, description, category: guessCategory(description + ' ' + n0, kind), date: when.date || ymd(now) };
  }

  return { kind: 'unknown' };
}

/** Completa um pedido que ficou pela metade (ex.: lembrete sem horário, gasto sem valor). */
export function completeWith(pending: Intent, raw: string, now: Date = new Date()): Intent | null {
  const p = new Phrase(fixHalfPast(raw));
  if (pending.kind === 'workout_ask') {
    for (const [re, sport] of SPORT_WORDS) if (re.test(p.n)) return { kind: 'start_workout', sport };
    if (/\b(pedal|bike)\b/.test(p.n)) return { kind: 'start_workout', sport: 'bike' };
    return null;
  }
  if (pending.kind === 'card' && !pending.title) {
    const title = tidy(p.orig);
    return title ? { ...pending, title } : null;
  }
  if (pending.kind === 'diary' && !pending.text) {
    const text = p.orig.trim();
    return text.length >= 2 ? { kind: 'diary', text: capitalize(text).slice(0, 2000) } : null;
  }
  if (pending.kind === 'reminder' || pending.kind === 'appointment') {
    const when = extractWhen(p, now);
    if (!when.date && !when.time) return null;
    return { ...pending, date: when.date ?? pending.date, time: when.time ?? pending.time };
  }
  if ((pending.kind === 'expense' || pending.kind === 'income') && pending.amountCents === null) {
    const amountCents = extractAmount(p);
    return amountCents ? { ...pending, amountCents } : null;
  }
  return null;
}

/** Quando o lembrete deve tocar. Sem hora: 9h. Sem data: hoje (ou amanhã, se a hora já passou). */
export function resolveDateTime(date: string | null, time: string | null, now: Date, defaultTime = '09:00'): { date: string; time: string; at: Date } {
  const t = time || defaultTime;
  let d = date || ymd(now);
  const [h, m] = t.split(':').map(Number);
  let at = new Date(Number(d.slice(0, 4)), Number(d.slice(5, 7)) - 1, Number(d.slice(8, 10)), h, m);
  if (!date && at.getTime() <= now.getTime()) {
    at = new Date(at.getTime() + 86400_000);
    d = ymd(at);
  }
  return { date: d, time: t, at };
}

/* ---------------- Respostas ---------------- */

export const brl = (cents: number) => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/** "hoje", "amanhã", "sexta-feira (14/11)". */
export function dayLabel(date: string, now: Date = new Date()): string {
  const today = ymd(now);
  const tomorrow = ymd(addDays(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12), 1));
  const yesterday = ymd(addDays(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12), -1));
  if (date === today) return 'hoje';
  if (date === tomorrow) return 'amanhã';
  if (date === yesterday) return 'ontem';
  const d = new Date(`${date}T12:00:00`);
  const wd = d.toLocaleDateString('pt-BR', { weekday: 'long' });
  return `${wd} (${pad2(d.getDate())}/${pad2(d.getMonth() + 1)})`;
}

export function timeLabel(t: string): string {
  const [h, m] = t.split(':').map(Number);
  return m ? `${h}h${pad2(m)}` : `${h}h`;
}

export function timeBlockFor(time: string | null): 'Manhã' | 'Tarde' | 'Noite' | 'Flexível' {
  if (!time) return 'Flexível';
  const h = Number(time.slice(0, 2));
  return h < 12 ? 'Manhã' : h < 18 ? 'Tarde' : 'Noite';
}

export const ASSISTANT_NAME_MAX = 20;

export function cleanAssistantName(raw: unknown): string {
  return String(raw ?? '')
    .replace(/[^\p{L}\p{N} '-]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, ASSISTANT_NAME_MAX);
}

export const NAME_SUGGESTIONS = ['Rita', 'Léo', 'Sofia', 'Alfredo', 'Iara', 'Tom'];
