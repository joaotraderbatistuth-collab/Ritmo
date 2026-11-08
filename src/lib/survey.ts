// Pesquisa de perfil (gostos e momento de vida) — regras PURAS, sem banco e sem React.
//
// Para que serve: montar uma base de dados organizada para, no futuro, personalizar conteúdos
// (e treinar um modelo de recomendação). Por isso as respostas são SEMPRE códigos fixos
// (ex.: 'corrida', 'r3'), nunca texto livre: ficam prontas para virar colunas numa planilha
// ou num modelo sem limpeza. Os rótulos em português ficam só aqui.
//
// Regras:
//  - Tudo é opcional: a pessoa pode pular qualquer pergunta ou a pesquisa inteira.
//  - Renda e gênero têm "Prefiro não dizer".
//  - Nada de religião, política, saúde ou orientação sexual (dados sensíveis da LGPD).
//  - Se um dia mudar uma pergunta, aumente SURVEY_VERSION (as respostas antigas continuam valendo).

export const SURVEY_VERSION = 1;

export interface SurveyOption {
  id: string;
  label: string;
}

export interface SurveyQuestion {
  id: string;
  title: string;
  hint?: string;
  /** single = uma resposta; multi = várias (até `max`) */
  type: 'single' | 'multi';
  max?: number;
  options: SurveyOption[];
  /** pergunta mostrada como lista de seleção (muitas opções, ex.: estados) */
  select?: boolean;
}

const o = (id: string, label: string): SurveyOption => ({ id, label });

export const UF_OPTIONS: SurveyOption[] = [
  ['AC', 'Acre'], ['AL', 'Alagoas'], ['AP', 'Amapá'], ['AM', 'Amazonas'], ['BA', 'Bahia'], ['CE', 'Ceará'],
  ['DF', 'Distrito Federal'], ['ES', 'Espírito Santo'], ['GO', 'Goiás'], ['MA', 'Maranhão'], ['MT', 'Mato Grosso'],
  ['MS', 'Mato Grosso do Sul'], ['MG', 'Minas Gerais'], ['PA', 'Pará'], ['PB', 'Paraíba'], ['PR', 'Paraná'],
  ['PE', 'Pernambuco'], ['PI', 'Piauí'], ['RJ', 'Rio de Janeiro'], ['RN', 'Rio Grande do Norte'],
  ['RS', 'Rio Grande do Sul'], ['RO', 'Rondônia'], ['RR', 'Roraima'], ['SC', 'Santa Catarina'], ['SP', 'São Paulo'],
  ['SE', 'Sergipe'], ['TO', 'Tocantins'], ['EX', 'Moro fora do Brasil'],
].map(([id, label]) => o(id, label));

export const SURVEY_QUESTIONS: SurveyQuestion[] = [
  {
    id: 'idade',
    title: 'Qual a sua faixa de idade?',
    type: 'single',
    options: [o('18-24', '18 a 24'), o('25-34', '25 a 34'), o('35-44', '35 a 44'), o('45-54', '45 a 54'), o('55+', '55 ou mais')],
  },
  {
    id: 'genero',
    title: 'Como você se identifica?',
    type: 'single',
    options: [o('mulher', 'Mulher'), o('homem', 'Homem'), o('outro', 'Outro'), o('nd', 'Prefiro não dizer')],
  },
  {
    id: 'estado',
    title: 'Em qual estado você mora?',
    type: 'single',
    select: true,
    options: UF_OPTIONS,
  },
  {
    id: 'ocupacao',
    title: 'Qual a sua ocupação hoje?',
    type: 'single',
    options: [
      o('clt', 'Trabalho de carteira assinada'),
      o('autonomo', 'Autônomo ou freelancer'),
      o('empreendedor', 'Tenho meu negócio'),
      o('servidor', 'Servidor público'),
      o('estudante', 'Estudante'),
      o('buscando', 'Procurando trabalho'),
      o('aposentado', 'Aposentado(a)'),
      o('outro', 'Outro'),
    ],
  },
  {
    id: 'renda',
    title: 'Qual a sua renda mensal, mais ou menos?',
    hint: 'Só para indicarmos conteúdos de finanças do seu tamanho. Ninguém mais vê.',
    type: 'single',
    options: [
      o('r1', 'Até R$ 2 mil'),
      o('r2', 'R$ 2 mil a R$ 4 mil'),
      o('r3', 'R$ 4 mil a R$ 7 mil'),
      o('r4', 'R$ 7 mil a R$ 12 mil'),
      o('r5', 'R$ 12 mil a R$ 20 mil'),
      o('r6', 'Acima de R$ 20 mil'),
      o('nd', 'Prefiro não dizer'),
    ],
  },
  {
    id: 'esportes',
    title: 'Quais atividades físicas você pratica ou quer praticar?',
    hint: 'Pode marcar várias.',
    type: 'multi',
    max: 6,
    options: [
      o('caminhada', 'Caminhada'),
      o('corrida', 'Corrida'),
      o('academia', 'Academia / musculação'),
      o('bike', 'Bike'),
      o('futebol', 'Futebol'),
      o('funcional', 'Funcional / crossfit'),
      o('natacao', 'Natação'),
      o('yoga', 'Yoga / pilates'),
      o('lutas', 'Lutas'),
      o('danca', 'Dança'),
      o('trilha', 'Trilha'),
      o('nenhum', 'Nenhuma por enquanto'),
    ],
  },
  {
    id: 'musica',
    title: 'Que estilos de música você mais ouve?',
    hint: 'Pode marcar até 4.',
    type: 'multi',
    max: 4,
    options: [
      o('sertanejo', 'Sertanejo'),
      o('pop', 'Pop'),
      o('funk', 'Funk'),
      o('pagode', 'Pagode / samba'),
      o('mpb', 'MPB'),
      o('rock', 'Rock'),
      o('rap', 'Rap / hip hop'),
      o('eletronica', 'Eletrônica'),
      o('gospel', 'Gospel'),
      o('forro', 'Forró / piseiro'),
      o('classica', 'Clássica / instrumental'),
      o('podcast', 'Prefiro podcasts'),
    ],
  },
  {
    id: 'objetivos',
    title: 'O que você mais quer melhorar agora?',
    hint: 'Escolha até 3.',
    type: 'multi',
    max: 3,
    options: [
      o('rotina', 'Organizar a rotina'),
      o('habitos', 'Criar bons hábitos'),
      o('financas', 'Cuidar do dinheiro'),
      o('saude', 'Saúde e treinos'),
      o('estudos', 'Estudar com constância'),
      o('trabalho', 'Render mais no trabalho'),
      o('renda_extra', 'Ganhar uma renda extra'),
      o('bem_estar', 'Dormir melhor e ter calma'),
    ],
  },
  {
    id: 'interesses',
    title: 'Que conteúdos você gostaria de ver no Ritmo?',
    hint: 'Pode marcar várias.',
    type: 'multi',
    max: 8,
    options: [
      o('investimentos', 'Finanças e investimentos'),
      o('leitura', 'Livros e resumos'),
      o('carreira', 'Carreira'),
      o('empreender', 'Empreender'),
      o('tecnologia', 'Tecnologia e IA'),
      o('idiomas', 'Idiomas'),
      o('culinaria', 'Culinária prática'),
      o('treinos', 'Treinos e corrida'),
      o('produtividade', 'Produtividade e foco'),
      o('viagens', 'Viagens'),
      o('casa', 'Casa e organização'),
      o('familia', 'Família e filhos'),
    ],
  },
  {
    id: 'horario',
    title: 'Em que hora do dia você rende mais?',
    type: 'single',
    options: [o('manha', 'De manhã'), o('tarde', 'À tarde'), o('noite', 'À noite'), o('madrugada', 'De madrugada'), o('varia', 'Depende do dia')],
  },
];

export type SurveyAnswers = Record<string, string | string[]>;

const QUESTION_BY_ID = new Map(SURVEY_QUESTIONS.map((q) => [q.id, q]));

/** Fica só com perguntas e opções que existem, sem repetição e respeitando o máximo de cada uma. */
export function normalizeAnswers(raw: unknown): SurveyAnswers {
  let obj: unknown = raw;
  if (typeof raw === 'string') {
    try {
      obj = JSON.parse(raw);
    } catch {
      obj = {};
    }
  }
  const out: SurveyAnswers = {};
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return out;
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    const q = QUESTION_BY_ID.get(key);
    if (!q) continue;
    const valid = new Set(q.options.map((x) => x.id));
    if (q.type === 'single') {
      const v = Array.isArray(value) ? value[0] : value;
      if (typeof v === 'string' && valid.has(v)) out[key] = v;
    } else {
      const list = (Array.isArray(value) ? value : [value]).filter((v): v is string => typeof v === 'string' && valid.has(v));
      let uniq = [...new Set(list)];
      // "nenhuma" não combina com outras atividades
      if (key === 'esportes' && uniq.length > 1) uniq = uniq.filter((v) => v !== 'nenhum');
      uniq = uniq.slice(0, q.max ?? uniq.length);
      if (uniq.length) out[key] = uniq;
    }
  }
  return out;
}

/** Quantas perguntas têm resposta. */
export function answeredCount(answers: SurveyAnswers): number {
  return SURVEY_QUESTIONS.filter((q) => {
    const v = answers[q.id];
    return Array.isArray(v) ? v.length > 0 : Boolean(v);
  }).length;
}

/** Rótulo em português de uma resposta (para o painel e a planilha). */
export function optionLabel(questionId: string, optionId: string): string {
  return QUESTION_BY_ID.get(questionId)?.options.find((x) => x.id === optionId)?.label || optionId;
}

export function answerLabels(questionId: string, value: string | string[] | undefined): string[] {
  if (!value) return [];
  return (Array.isArray(value) ? value : [value]).map((v) => optionLabel(questionId, v));
}

export interface SurveyStatus {
  completedAt: string | null;
  dismissedAt: string | null;
  dismissCount: number;
}

/** Quantos dias esperar para perguntar de novo depois de "Agora não", e até quantas vezes. */
export const SURVEY_SNOOZE_DAYS = 3;
export const SURVEY_MAX_DISMISSALS = 2;

/** Mostrar a pesquisa agora? Nunca respondeu e não pediu "agora não" recentemente (no máximo 2 vezes). */
export function shouldAskSurvey(status: SurveyStatus | null, now: Date = new Date()): boolean {
  if (!status) return true;
  if (status.completedAt) return false;
  if (status.dismissCount >= SURVEY_MAX_DISMISSALS) return false;
  if (!status.dismissedAt) return true;
  const since = now.getTime() - new Date(status.dismissedAt).getTime();
  return since >= SURVEY_SNOOZE_DAYS * 86400000;
}

export interface SurveySummaryItem {
  questionId: string;
  title: string;
  answered: number;
  options: { id: string; label: string; count: number; percent: number }[];
}

/** Resumo do público para o painel: quantas pessoas marcaram cada opção (percentual sobre quem respondeu a pergunta). */
export function summarizeSurveys(all: SurveyAnswers[]): { respondents: number; questions: SurveySummaryItem[] } {
  const respondents = all.filter((a) => answeredCount(a) > 0).length;
  const questions = SURVEY_QUESTIONS.map((q) => {
    const counts = new Map<string, number>();
    let answered = 0;
    for (const a of all) {
      const v = a[q.id];
      const list = Array.isArray(v) ? v : v ? [v] : [];
      if (!list.length) continue;
      answered++;
      for (const id of list) counts.set(id, (counts.get(id) || 0) + 1);
    }
    const options = q.options
      .map((opt) => {
        const count = counts.get(opt.id) || 0;
        return { id: opt.id, label: opt.label, count, percent: answered ? Math.round((count / answered) * 100) : 0 };
      })
      .filter((x) => x.count > 0)
      .sort((a, b) => b.count - a.count);
    return { questionId: q.id, title: q.title, answered, options };
  });
  return { respondents, questions };
}

/** Colunas da planilha da pesquisa: uma por pergunta (respostas múltiplas separadas por " | "). */
export function surveyCsvHeader(): string[] {
  return SURVEY_QUESTIONS.map((q) => q.title.replace(/\?$/, ''));
}

export function surveyCsvCells(answers: SurveyAnswers): string[] {
  return SURVEY_QUESTIONS.map((q) => answerLabels(q.id, answers[q.id]).join(' | '));
}
