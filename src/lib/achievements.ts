// Conquistas que a pessoa pode COMPARTILHAR no Feed, calculadas a partir dos próprios dados dela.
// Nada é publicado sozinho: a pessoa escolhe, revisa e toca em "Publicar".
import { Achievement } from './feed-rules.js';
import { addDays, computeChain, localDateStr, weekStartKey } from './chain.js';

interface Habit { id: number; name: string; targetFrequency: string; createdAt?: string | null }
interface HabitLog { habitId: number; date: string; completed: boolean }
interface Session { date: string; durationMinutes: number; status: string }
interface Task { date: string; completed: boolean }
interface Cycle { startDate: string; durationDays: number; mainGoal: string }

export function computeShareable(input: { habits: Habit[]; habitLogs: HabitLog[]; sessions: Session[]; tasks: Task[]; activeCycle: Cycle | null; today?: string }): Achievement[] {
  const today = input.today || localDateStr();
  const out: Achievement[] = [];

  for (const h of input.habits) {
    const r = computeChain({ targetFrequency: h.targetFrequency, createdAt: h.createdAt, logs: input.habitLogs.filter((l) => l.habitId === h.id), today });
    if (r.chain >= 1) out.push({ type: 'corrente', habit: h.name.slice(0, 60), weeks: r.chain });
  }

  const start = weekStartKey(today);
  const end = addDays(start, 6);
  const inWeek = (d: string) => d >= start && d <= end;

  const minutes = input.sessions.filter((s) => inWeek(s.date) && s.status === 'completed').reduce((a, s) => a + s.durationMinutes, 0);
  if (minutes >= 1) out.push({ type: 'foco', minutes: Math.round(minutes) });

  const weekTasks = input.tasks.filter((t) => inWeek(t.date));
  const done = weekTasks.filter((t) => t.completed).length;
  if (weekTasks.length >= 1 && done >= 1) out.push({ type: 'tarefas', done, total: weekTasks.length });

  if (input.activeCycle) {
    const { startDate, durationDays, mainGoal } = input.activeCycle;
    const day = Math.floor((new Date(`${today}T12:00:00`).getTime() - new Date(`${String(startDate).slice(0, 10)}T12:00:00`).getTime()) / 86400000) + 1;
    if (day >= 1 && day <= durationDays && mainGoal) out.push({ type: 'meta', title: mainGoal.slice(0, 120), day, totalDays: durationDays });
  }
  return out;
}
