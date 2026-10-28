import React from 'react';
import { BarChart3, Target, Sparkles, ArrowRight } from 'lucide-react';
import { FocusCycle, FocusSessionItem, HabitItem, HabitLogItem, TaskItem } from '../lib/types.js';
import { addDays, computeChain, localDateStr, weekStartKey } from '../lib/chain.js';

const shell = 'bg-[#161b22] border border-[#30363d] rounded-2xl p-5 h-full';
const head = 'flex items-center gap-2 pb-3 border-b border-[#30363d] mb-4';

const Bar: React.FC<{ percent: number; tone?: string }> = ({ percent, tone = 'bg-emerald-500' }) => (
  <div className="h-2 rounded-full bg-[#21262d] overflow-hidden">
    <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.max(0, Math.min(100, percent))}%` }} />
  </div>
);

export const HabitEvolutionCard: React.FC<{
  habits: HabitItem[];
  habitLogs: HabitLogItem[];
  onNavigateTab: (tabId: string) => void;
}> = ({ habits, habitLogs, onNavigateTab }) => {
  const today = localDateStr();
  return (
    <div className={shell}>
      <div className={head}>
        <Sparkles className="w-4 h-4 text-amber-400" />
        <h2 className="text-sm font-bold text-[#f0f6fc]">Evolução dos hábitos</h2>
      </div>
      {habits.length === 0 ? (
        <button type="button" onClick={() => onNavigateTab('habitos')} className="text-xs text-emerald-400 font-semibold">
          Crie seu primeiro hábito
        </button>
      ) : (
        <div className="space-y-3">
          {habits.map((h) => {
            const r = computeChain({
              targetFrequency: h.targetFrequency,
              createdAt: h.createdAt,
              logs: habitLogs.filter((l) => l.habitId === h.id),
              today,
            });
            const done = Math.min(r.doneThisWeek, r.target);
            return (
              <div key={h.id}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-[#f0f6fc] truncate pr-2">{h.name}</span>
                  <span className="text-[#8b949e] shrink-0">{done}/{r.target} na semana</span>
                </div>
                <Bar percent={(done / r.target) * 100} tone={r.metThisWeek ? 'bg-emerald-500' : 'bg-amber-400'} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const ProductivityCard: React.FC<{
  tasks: TaskItem[];
  habits: HabitItem[];
  habitLogs: HabitLogItem[];
  sessions: FocusSessionItem[];
}> = ({ tasks, habits, habitLogs, sessions }) => {
  const start = weekStartKey(localDateStr());
  const end = addDays(start, 6);
  const inWeek = (d: string) => d >= start && d <= end;

  const weekTasks = tasks.filter((t) => inWeek(t.date));
  const tasksDone = weekTasks.filter((t) => t.completed).length;
  const focusMin = sessions
    .filter((s) => inWeek(s.date) && s.status === 'completed')
    .reduce((acc, s) => acc + s.durationMinutes, 0);
  const habitIds = new Set(habits.map((h) => h.id));
  const checkins = habitLogs.filter((l) => l.completed && inWeek(l.date) && habitIds.has(l.habitId)).length;

  const stat = (value: string, label: string) => (
    <div className="rounded-xl bg-[#0d1117] border border-[#30363d] p-3 text-center">
      <div className="text-lg font-extrabold text-[#f0f6fc]">{value}</div>
      <div className="text-[11px] text-[#8b949e]">{label}</div>
    </div>
  );

  return (
    <div className={shell}>
      <div className={head}>
        <BarChart3 className="w-4 h-4 text-teal-400" />
        <h2 className="text-sm font-bold text-[#f0f6fc]">Produtividade da semana</h2>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {stat(`${tasksDone}/${weekTasks.length}`, 'tarefas feitas')}
        {stat(`${focusMin} min`, 'de foco')}
        {stat(String(checkins), 'hábitos marcados')}
      </div>
    </div>
  );
};

export const GoalsCard: React.FC<{
  activeCycle: FocusCycle | null;
  onNavigateTab: (tabId: string) => void;
  onOpenOnboarding: () => void;
}> = ({ activeCycle, onNavigateTab, onOpenOnboarding }) => {
  let percent = 0;
  let dayLabel = '';
  if (activeCycle) {
    const diff = Math.floor((Date.now() - new Date(activeCycle.startDate).getTime()) / 86400000) + 1;
    const day = Math.max(1, Math.min(activeCycle.durationDays, diff));
    percent = Math.round((day / activeCycle.durationDays) * 100);
    dayLabel = `Dia ${day} de ${activeCycle.durationDays}`;
  }
  return (
    <div className={shell}>
      <div className={head}>
        <Target className="w-4 h-4 text-emerald-400" />
        <h2 className="text-sm font-bold text-[#f0f6fc]">Metas pessoais</h2>
      </div>
      {activeCycle ? (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-[#f0f6fc]">{activeCycle.mainGoal}</p>
          {activeCycle.secondaryGoals && activeCycle.secondaryGoals.length > 0 && (
            <ul className="text-xs text-[#8b949e] list-disc pl-4 space-y-0.5">
              {activeCycle.secondaryGoals.map((g, i) => (
                <li key={i}>{g}</li>
              ))}
            </ul>
          )}
          <div>
            <div className="flex justify-between text-xs text-[#8b949e] mb-1">
              <span>{dayLabel}</span>
              <span>{percent}%</span>
            </div>
            <Bar percent={percent} />
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('roteiro')}
            className="text-xs text-emerald-400 font-semibold flex items-center gap-1"
          >
            Ver roteiro de metas <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button type="button" onClick={onOpenOnboarding} className="text-xs text-emerald-400 font-semibold">
          Defina sua meta e inicie um ciclo de foco
        </button>
      )}
    </div>
  );
};
