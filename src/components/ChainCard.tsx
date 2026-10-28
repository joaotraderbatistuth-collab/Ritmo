import React, { useEffect, useState } from 'react';
import { Link2, Sparkles } from 'lucide-react';
import { HabitItem, HabitLogItem } from '../lib/types.js';
import { computeChain, localDateStr } from '../lib/chain.js';

interface ChainCardProps {
  habits: HabitItem[];
  habitLogs: HabitLogItem[];
  onNavigateTab: (tabId: string) => void;
}

const STORAGE_KEY = 'ritmo_chain_habit';
const MAX_LINKS = 10;

/** Um elo da corrente. Elos alternam deitado/em pé para parecerem encaixados. */
const Link: React.FC<{ index: number; state: 'done' | 'pending' }> = ({ index, state }) => {
  const upright = index % 2 === 1;
  const size = upright ? 'w-4 h-7' : 'w-8 h-4';
  const look =
    state === 'done'
      ? 'border-emerald-500 bg-emerald-500/10'
      : 'border-dashed border-[#484f58] bg-transparent';
  return <span aria-hidden className={`inline-block ${size} rounded-full border-[3px] ${look} ${index > 0 ? '-ml-1.5' : ''}`} />;
};

export const ChainCard: React.FC<ChainCardProps> = ({ habits, habitLogs, onNavigateTab }) => {
  const [habitId, setHabitId] = useState<number | null>(null);

  // lembra o hábito escolhido neste aparelho
  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem(STORAGE_KEY));
      if (saved && habits.some((h) => h.id === saved)) setHabitId(saved);
    } catch {
      /* sem armazenamento: segue com o padrão */
    }
  }, [habits]);

  const habit = habits.find((h) => h.id === habitId) || habits[0];

  const choose = (id: number) => {
    setHabitId(id);
    try {
      localStorage.setItem(STORAGE_KEY, String(id));
    } catch {
      /* ignora */
    }
  };

  if (!habit) {
    return (
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <h3 className="text-sm font-bold text-[#f0f6fc]">Não Quebre a Corrente</h3>
            <p className="text-xs text-[#8b949e]">Crie um hábito com sua meta semanal e acompanhe aqui quantas semanas seguidas você cumpriu.</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onNavigateTab('habitos')}
          className="shrink-0 px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold"
        >
          Criar hábito
        </button>
      </div>
    );
  }

  const r = computeChain({
    targetFrequency: habit.targetFrequency,
    createdAt: habit.createdAt,
    logs: habitLogs.filter((l) => l.habitId === habit.id),
    today: localDateStr(),
  });

  // elos: semanas cumpridas (corrente atual) — mostra no máximo MAX_LINKS
  const shown = Math.min(r.chain, MAX_LINKS);
  const extra = r.chain - shown;
  const canStillMeet = r.missingThisWeek <= r.daysLeftThisWeek;

  let indicator: { text: string; tone: string };
  if (r.metThisWeek) indicator = { text: 'Corrente preservada!', tone: 'text-emerald-400' };
  else if (canStillMeet)
    indicator = {
      text: `Faltam ${r.missingThisWeek} para preservar a corrente nesta semana`,
      tone: 'text-amber-300',
    };
  else
    indicator = {
      text: 'A meta desta semana não fecha mais — recomece na próxima, sem culpa.',
      tone: 'text-rose-300',
    };

  const weeksLabel =
    r.chain === 0
      ? 'Comece sua corrente: cumpra a meta desta semana'
      : `${r.chain} ${r.chain === 1 ? 'semana consecutiva' : 'semanas consecutivas'} cumprindo a meta`;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#161b22] to-[#0d1117] border border-emerald-800/40 p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2 min-w-0">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
            <Link2 className="w-4 h-4" /> Não Quebre a Corrente
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs text-[#8b949e]" htmlFor="chain-habit">Hábito:</label>
            <select
              id="chain-habit"
              value={habit.id}
              onChange={(e) => choose(Number(e.target.value))}
              className="bg-[#0d1117] border border-[#30363d] rounded-lg px-2.5 py-1.5 text-xs text-[#f0f6fc] max-w-[220px]"
            >
              {habits.map((h) => (
                <option key={h.id} value={h.id}>{h.name}</option>
              ))}
            </select>
          </div>

          <p className="text-xs text-[#8b949e]">
            Meta semanal: <strong className="text-[#f0f6fc]">{r.target === 7 ? 'todos os dias' : `${r.target} vezes`}</strong>
            {' · '}Realizado: <strong className="text-[#f0f6fc]">{Math.min(r.doneThisWeek, r.target)}/{r.target}</strong>
          </p>
          <p className={`text-sm font-bold flex items-center gap-1.5 ${indicator.tone}`}>
            {r.metThisWeek && <Sparkles className="w-4 h-4" />}
            {indicator.text}
          </p>
        </div>

        <div className="sm:text-right shrink-0">
          <div className="flex items-center sm:justify-end min-h-[32px] pl-1.5">
            {shown === 0 ? (
              <Link index={0} state="pending" />
            ) : (
              Array.from({ length: shown }, (_, i) => <Link key={i} index={i} state="done" />)
            )}
            {extra > 0 && <span className="ml-2 text-xs font-bold text-emerald-400">+{extra}</span>}
          </div>
          <p className="text-xs text-[#c9d1d9] mt-2">{weeksLabel}</p>
        </div>
      </div>
    </div>
  );
};
