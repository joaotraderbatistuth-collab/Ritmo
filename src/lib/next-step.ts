// "Próximo passo": a única coisa que a pessoa deveria fazer agora. Regras PURAS e testadas.
// A ideia é tirar a dúvida "por onde eu começo?" — um botão grande, uma ação, pontos na hora.

export type StepKind = 'habit' | 'task' | 'focus' | 'tab' | 'chest';

export interface Step {
  id: string;
  title: string;
  why: string;
  xp: number | null;
  kind: StepKind;
  /** id do hábito ou da tarefa (marcar com um toque) */
  ref?: number;
  tab?: string;
  minutes?: number;
  cta: string;
}

export interface NextStepInput {
  hour: number;
  today: string;
  habits: { id: number; name: string }[];
  /** ids dos hábitos já marcados hoje */
  habitsDoneToday: number[];
  tasksToday: { id: number; title: string; completed: boolean; startTime?: string | null }[];
  /** existe alguma tarefa criada para amanhã */
  plannedTomorrow: boolean;
  focusToday: number;
  diaryToday: boolean;
  trainedToday: boolean;
  trainingDaysThisWeek: number;
  /** contas a pagar que vencem hoje, amanhã ou já venceram (ordenadas pelo vencimento) */
  billsDue: { description: string; dueDate?: string; amountCents?: number }[];
  missions: { title: string; done: boolean; tab: string }[];
  chestReady: boolean;
}

const CONSTANCY = [0, 5, 10, 15, 20, 20, 20];

/** Lista do que fazer, do mais importante para o menos. O primeiro é o "Próximo passo". */
export function nextSteps(i: NextStepInput): Step[] {
  const out: Step[] = [];
  const push = (s: Step) => {
    if (!out.some((o) => o.id === s.id)) out.push(s);
  };

  if (i.chestReady) push({ id: 'bau', title: 'Abrir o baú do dia', why: 'Você cumpriu as 3 missões. Tem prêmio esperando.', xp: null, kind: 'chest', cta: 'Abrir o baú' });

  const pendingHabits = i.habits.filter((h) => !i.habitsDoneToday.includes(h.id));
  const pendingTasks = i.tasksToday.filter((t) => !t.completed).sort((a, b) => (a.startTime || '99').localeCompare(b.startTime || '99'));

  // manhã sem plano: planejar primeiro deixa o resto do dia leve
  if (i.hour < 12 && i.tasksToday.length === 0) push({ id: 'planejar-hoje', title: 'Planeje o seu dia', why: 'Uma tarefa já basta para o dia ter direção.', xp: 2, kind: 'tab', tab: 'rotina', cta: 'Criar tarefa' });

  if (pendingHabits[0]) push({ id: `habito-${pendingHabits[0].id}`, title: pendingHabits[0].name, why: pendingHabits.length > 1 ? `Faltam ${pendingHabits.length} hábitos hoje. Comece por este.` : 'Último hábito do dia. Fecha com chave de ouro.', xp: 10, kind: 'habit', ref: pendingHabits[0].id, cta: 'Já fiz' });

  if (pendingTasks[0]) push({ id: `tarefa-${pendingTasks[0].id}`, title: pendingTasks[0].title, why: pendingTasks[0].startTime ? `Marcada para ${pendingTasks[0].startTime}.` : pendingTasks.length > 1 ? `${pendingTasks.length} tarefas para hoje. Esta é a próxima.` : 'Sua tarefa de hoje.', xp: 5, kind: 'task', ref: pendingTasks[0].id, cta: 'Concluí' });

  if (i.billsDue[0]) {
    const b = i.billsDue[0];
    const value = b.amountCents ? ` (${(b.amountCents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})` : '';
    const when = !b.dueDate || b.dueDate === i.today ? 'Vence hoje.' : b.dueDate < i.today ? 'Já venceu.' : 'Vence amanhã. Deixe agendado hoje e fica livre.';
    const name = /^pag/i.test(b.description) ? b.description : `Pagar ${b.description}`;
    push({ id: 'conta', title: `${name}${value}`, why: `${when} Ao marcar como paga, a agenda e o quadro se atualizam sozinhos.`, xp: null, kind: 'tab', tab: 'financas', cta: 'Ver conta' });
  }

  if (!i.trainedToday && i.trainingDaysThisWeek < 5) {
    const n = i.trainingDaysThisWeek + 1;
    const bonus = CONSTANCY[Math.min(n, CONSTANCY.length) - 1];
    push({ id: 'treino', title: n === 1 ? 'Primeiro treino da semana' : `${n}º dia de treino da semana`, why: bonus ? `Constância vale mais: +20 do treino e +${bonus} de bônus.` : 'Uma caminhada já conta. O que vale é voltar.', xp: 20 + bonus, kind: 'tab', tab: 'treino', cta: 'Começar treino' });
  }

  if (i.focusToday === 0) push({ id: 'foco', title: 'Foco de 25 minutos', why: 'Um bloco sem distração rende mais que uma tarde inteira picada.', xp: 15, kind: 'focus', minutes: 25, cta: 'Começar foco' });

  if (!i.diaryToday) push({ id: 'diario', title: 'Check-in do dia', why: i.hour >= 18 ? 'Um minuto para fechar o dia e ver o que funcionou.' : 'Como está a sua energia hoje? Leva 1 minuto.', xp: 15, kind: 'tab', tab: 'diario', cta: 'Fazer check-in' });

  for (const m of i.missions) if (!m.done) push({ id: `missao-${m.title}`, title: m.title, why: 'Missão de hoje. Faltando pouco para o baú.', xp: null, kind: 'tab', tab: m.tab, cta: 'Fazer agora' });

  if (!i.plannedTomorrow && i.hour >= 17) push({ id: 'amanha', title: 'Deixe amanhã pronto', why: 'Uma tarefa para amanhã e você acorda sabendo o que fazer.', xp: 2, kind: 'tab', tab: 'rotina', cta: 'Planejar amanhã' });

  // à noite, o check-in sobe para o primeiro lugar (depois do baú)
  if (i.hour >= 20) {
    const k = out.findIndex((s) => s.id === 'diario');
    if (k > 0) out.splice(out[0].kind === 'chest' ? 1 : 0, 0, ...out.splice(k, 1));
  }

  if (!out.length) push({ id: 'feito', title: 'Dia completo!', why: 'Você fez tudo o que estava planejado. Descansar também faz parte.', xp: null, kind: 'tab', tab: 'progresso', cta: 'Ver meu progresso' });
  return out;
}
