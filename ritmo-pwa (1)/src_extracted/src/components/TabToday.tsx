import React from 'react';
import {
  FocusCycle,
  TaskItem,
  HabitItem,
  HabitLogItem,
  FinanceTransactionItem,
} from '../lib/types.js';
import {
  Target,
  Flame,
  CheckCircle2,
  Circle,
  Clock,
  Play,
  DollarSign,
  AlertCircle,
  Calendar,
  Sparkles,
  ArrowRight,
  Coffee,
  Heart,
} from 'lucide-react';

interface TabTodayProps {
  activeCycle: FocusCycle | null;
  tasks: TaskItem[];
  habits: HabitItem[];
  habitLogs: HabitLogItem[];
  transactions: FinanceTransactionItem[];
  onToggleTask: (taskId: number, completed: boolean) => void;
  onToggleHabit: (habitId: number, completed: boolean) => void;
  onQuickStartFocus: (duration: number, topic: string) => void;
  onNavigateTab: (tabId: string) => void;
  onOpenOnboarding: () => void;
}

export const TabToday: React.FC<TabTodayProps> = ({
  activeCycle,
  tasks,
  habits,
  habitLogs,
  transactions,
  onToggleTask,
  onToggleHabit,
  onQuickStartFocus,
  onNavigateTab,
  onOpenOnboarding,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // Cycle calculations
  let currentDay = 1;
  let totalDays = 40;
  let cyclePercent = 0;
  if (activeCycle) {
    const start = new Date(activeCycle.startDate);
    const today = new Date();
    const diff = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    currentDay = Math.max(1, Math.min(activeCycle.durationDays, diff));
    totalDays = activeCycle.durationDays;
    cyclePercent = Math.round((currentDay / totalDays) * 100);
  }

  // Today's tasks
  const todayTasks = tasks.filter((t) => t.date === todayStr);
  const completedTasksCount = todayTasks.filter((t) => t.completed).length;

  // Today's habit logs
  const todayHabitLogsMap = new Map(
    habitLogs.filter((l) => l.date === todayStr).map((l) => [l.habitId, l.completed])
  );
  const completedHabitsCount = habits.filter((h) => todayHabitLogsMap.get(h.id)).length;

  // Monthly financial summary
  const currentMonth = todayStr.substring(0, 7);
  const monthTxs = transactions.filter((t) => t.date.startsWith(currentMonth));
  const monthIncome = monthTxs
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amountCents, 0);
  const monthExpense = monthTxs
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amountCents, 0);
  const monthBalance = monthIncome - monthExpense;

  // Upcoming pending bills
  const pendingBills = transactions.filter(
    (t) => t.status === 'pending' || (t.dueDate && t.dueDate >= todayStr && t.status !== 'paid')
  );

  // Discrete encouraging message
  const inspirationalQuotes = [
    'Consistência é um músculo diário: pequenos blocos sustentam grandes transformações.',
    'Se o plano falhar hoje, respire e retome amanhã. O progresso não exige perfeição rígida.',
    'Foco não é fazer tudo ao mesmo tempo, mas proteger aquilo que realmente importa agora.',
    'Um passo honesto de cada vez. A clareza mental nasce do compromisso equilibrado.',
  ];
  const dailyQuote = inspirationalQuotes[currentDay % inspirationalQuotes.length];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Cycle Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#161b22] via-[#1c2129] to-[#0d1117] border border-[#30363d] p-6 sm:p-8">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-800/40 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
              <Flame className="w-3.5 h-3.5 text-emerald-400" />
              {activeCycle ? `Modo Foco • Nível ${activeCycle.routineLevel.toUpperCase()}` : 'Modo Foco Inativo'}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#f0f6fc] tracking-tight">
              {activeCycle ? activeCycle.mainGoal : 'Inicie seu Ciclo de Foco (7 a 90 dias)'}
            </h1>
            <p className="text-sm text-[#8b949e]">
              {activeCycle?.notes ||
                'Defina suas metas essenciais, acompanhe hábitos e construa organização sem extremismos.'}
            </p>

            {/* Secondary goals badges */}
            {activeCycle?.secondaryGoals && activeCycle.secondaryGoals.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {activeCycle.secondaryGoals.map((goal, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#21262d] text-[#c9d1d9] text-xs border border-[#30363d]"
                  >
                    <Target className="w-3 h-3 text-emerald-400" />
                    {goal}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Cycle Day Meter */}
          {activeCycle ? (
            <div className="bg-[#0d1117]/80 backdrop-blur-sm border border-[#30363d] rounded-2xl p-5 min-w-[200px] text-center shrink-0">
              <span className="text-xs text-[#8b949e] font-medium block">Ciclo em Andamento</span>
              <div className="flex items-baseline justify-center gap-1 my-1">
                <span className="text-3xl sm:text-4xl font-black text-emerald-400">{currentDay}</span>
                <span className="text-sm font-semibold text-[#8b949e]">/ {totalDays} dias</span>
              </div>
              <div className="w-full bg-[#21262d] h-2.5 rounded-full overflow-hidden mt-2">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-700"
                  style={{ width: `${cyclePercent}%` }}
                />
              </div>
              <span className="text-[11px] text-[#6e7681] block mt-1.5">{cyclePercent}% concluído</span>
            </div>
          ) : (
            <button
              onClick={onOpenOnboarding}
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-xl shadow-emerald-600/20 transition-all flex items-center gap-2 self-start md:self-auto"
            >
              <Sparkles className="w-4 h-4" />
              Configurar Primeiro Ciclo
            </button>
          )}
        </div>

        {/* Subtle quote footer */}
        <div className="mt-6 pt-4 border-t border-[#30363d]/60 flex items-center gap-2 text-xs text-[#8b949e]">
          <Heart className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>{dailyQuote}</span>
        </div>
      </div>

      {/* 2. Main 3-Column Grid: Tasks Today, Habits Today, Quick Focus & Financial Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLUMN 1: Tarefas Planejadas para Hoje */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#30363d] mb-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-[#f0f6fc]">Tarefas de Hoje</h2>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#21262d] text-[#8b949e] font-mono">
                {completedTasksCount}/{todayTasks.length}
              </span>
            </div>

            {todayTasks.length === 0 ? (
              <div className="text-center py-8 text-[#6e7681] space-y-2">
                <Clock className="w-8 h-8 mx-auto opacity-50" />
                <p className="text-xs">Nenhuma tarefa criada para a data de hoje.</p>
                <button
                  onClick={() => onNavigateTab('tasks')}
                  className="text-xs text-emerald-400 hover:underline font-medium"
                >
                  + Adicionar tarefa na rotina
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {todayTasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    onClick={() => onToggleTask(task.id, !task.completed)}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                      task.completed
                        ? 'border-[#30363d]/50 bg-[#0d1117]/50 opacity-60'
                        : 'border-[#30363d] bg-[#0d1117] hover:border-[#484f58]'
                    }`}
                  >
                    <button
                      type="button"
                      className="mt-0.5 text-emerald-400 hover:text-emerald-300 transition-colors shrink-0"
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Circle className="w-4 h-4 text-[#6e7681]" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-xs font-medium text-[#f0f6fc] truncate ${
                          task.completed ? 'line-through text-[#6e7681]' : ''
                        }`}
                      >
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-[#8b949e]">
                        <span className="px-1.5 py-0.2 rounded bg-[#21262d] text-[10px]">
                          {task.timeBlock}
                        </span>
                        {task.startTime && <span>{task.startTime}</span>}
                        <span>{task.estimatedMinutes}m</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigateTab('tasks')}
            className="w-full mt-4 py-2 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-xs font-semibold text-[#8b949e] hover:text-[#f0f6fc] transition-colors flex items-center justify-center gap-1.5"
          >
            Ver todas as tarefas <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* COLUMN 2: Hábitos e Bem-estar de Hoje */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#30363d] mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-bold text-[#f0f6fc]">Hábitos & Consistência</h2>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#21262d] text-[#8b949e] font-mono">
                {completedHabitsCount}/{habits.length}
              </span>
            </div>

            {habits.length === 0 ? (
              <div className="text-center py-8 text-[#6e7681] space-y-2">
                <Coffee className="w-8 h-8 mx-auto opacity-50" />
                <p className="text-xs">Nenhum hábito cadastrado ainda.</p>
                <button
                  onClick={() => onNavigateTab('habits')}
                  className="text-xs text-amber-400 hover:underline font-medium"
                >
                  + Configurar hábitos saudáveis
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {habits.slice(0, 5).map((habit) => {
                  const isDone = Boolean(todayHabitLogsMap.get(habit.id));
                  return (
                    <div
                      key={habit.id}
                      onClick={() => onToggleHabit(habit.id, !isDone)}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                        isDone
                          ? 'border-emerald-500/40 bg-emerald-950/20 text-[#f0f6fc]'
                          : 'border-[#30363d] bg-[#0d1117] text-[#8b949e] hover:border-[#484f58]'
                      }`}
                    >
                      <span className="text-xs font-medium truncate max-w-[220px]">
                        {habit.name}
                      </span>
                      <div
                        className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all ${
                          isDone
                            ? 'bg-emerald-500 text-black shadow-sm'
                            : 'bg-[#21262d] border border-[#30363d]'
                        }`}
                      >
                        {isDone && <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigateTab('habits')}
            className="w-full mt-4 py-2 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-xs font-semibold text-[#8b949e] hover:text-[#f0f6fc] transition-colors flex items-center justify-center gap-1.5"
          >
            Acompanhar hábitos <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* COLUMN 3: Início Rápido de Foco & Resumo Financeiro */}
        <div className="space-y-6">
          {/* Quick Focus Widget */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#30363d] mb-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold text-[#f0f6fc]">Sessão de Foco Rápida</h2>
              </div>
              <button
                onClick={() => onNavigateTab('focus')}
                className="text-[11px] text-emerald-400 hover:underline"
              >
                Timer Completo
              </button>
            </div>

            <p className="text-xs text-[#8b949e] mb-3">
              Escolha uma duração para iniciar um bloco de trabalho focado sem interrupções:
            </p>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <button
                onClick={() => onQuickStartFocus(25, 'Bloco de 25 min')}
                className="p-3 rounded-xl bg-[#0d1117] border border-[#30363d] hover:border-emerald-500/60 transition-all flex items-center justify-center gap-2 text-xs font-bold text-[#f0f6fc]"
              >
                <Play className="w-3.5 h-3.5 text-emerald-400" />
                25 min (Pomodoro)
              </button>
              <button
                onClick={() => onQuickStartFocus(50, 'Imersão de 50 min')}
                className="p-3 rounded-xl bg-[#0d1117] border border-[#30363d] hover:border-emerald-500/60 transition-all flex items-center justify-center gap-2 text-xs font-bold text-[#f0f6fc]"
              >
                <Play className="w-3.5 h-3.5 text-teal-400" />
                50 min (Imersão)
              </button>
            </div>
          </div>

          {/* Monthly Finance Snapshot */}
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5">
            <div className="flex items-center justify-between pb-3 border-b border-[#30363d] mb-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-bold text-[#f0f6fc]">Finanças deste Mês</h2>
              </div>
              <button
                onClick={() => onNavigateTab('finance')}
                className="text-[11px] text-amber-400 hover:underline"
              >
                Ver Finanças
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-[#0d1117] p-3 rounded-xl border border-[#30363d]">
                <span className="text-[10px] uppercase font-semibold text-emerald-400 block">
                  Receitas
                </span>
                <span className="text-sm font-bold text-[#f0f6fc]">
                  {(monthIncome / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
              <div className="bg-[#0d1117] p-3 rounded-xl border border-[#30363d]">
                <span className="text-[10px] uppercase font-semibold text-rose-400 block">
                  Despesas
                </span>
                <span className="text-sm font-bold text-[#f0f6fc]">
                  {(monthExpense / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-[#21262d]">
              <span className="text-[#8b949e]">Saldo Líquido</span>
              <span
                className={`font-bold ${
                  monthBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {(monthBalance / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </span>
            </div>

            {pendingBills.length > 0 && (
              <div className="mt-2.5 text-[11px] text-amber-300 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>
                  {pendingBills.length} conta(s) a pagar/pendente(s) registrada(s).
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
