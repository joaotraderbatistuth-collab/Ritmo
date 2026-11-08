import React from 'react';
import { isValidRepeat, weekly, weeklyDays } from '../lib/recurrence.js';

// Escolha livre de repetição: não repete · todo dia · dias da semana escolhidos · todo mês num dia.
// Valor no formato de src/lib/recurrence.ts ('' | 'daily' | 'weekly:1,3' | 'monthly:10').

const WD = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const WD_FULL = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

type Mode = 'none' | 'daily' | 'weekly' | 'monthly';

function modeOf(v: string): Mode {
  if (!v || !isValidRepeat(v)) return 'none';
  if (v === 'daily') return 'daily';
  if (v.startsWith('weekly:')) return 'weekly';
  return 'monthly';
}

export const RepeatPicker: React.FC<{
  value: string;
  onChange: (v: string) => void;
  /** data de referência (YYYY-MM-DD) para sugerir o dia da semana / do mês */
  baseDate?: string;
  className?: string;
}> = ({ value, onChange, baseDate, className }) => {
  const mode = modeOf(value);
  const base = baseDate && /^\d{4}-\d{2}-\d{2}$/.test(baseDate) ? new Date(`${baseDate}T12:00:00Z`) : new Date();
  const baseWd = baseDate ? base.getUTCDay() : base.getDay();
  const baseDay = baseDate ? base.getUTCDate() : base.getDate();
  const days = mode === 'weekly' ? weeklyDays(value) : [];
  const monthDay = mode === 'monthly' ? Number(value.slice(8)) : baseDay;

  const setMode = (m: Mode) => {
    if (m === 'none') onChange('');
    else if (m === 'daily') onChange('daily');
    else if (m === 'weekly') onChange(weekly(days.length ? days : [baseWd]));
    else onChange(`monthly:${monthDay}`);
  };

  const toggleDay = (d: number) => {
    const next = days.includes(d) ? days.filter((x) => x !== d) : [...days, d];
    onChange(next.length ? weekly(next) : '');
  };

  const sel = 'bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-[#f0f6fc]';
  return (
    <div className={className}>
      <select value={mode} onChange={(e) => setMode(e.target.value as Mode)} className={`w-full ${sel}`} aria-label="Repetição">
        <option value="none">Não repete</option>
        <option value="daily">Todo dia</option>
        <option value="weekly">Em dias da semana que eu escolher</option>
        <option value="monthly">Todo mês, num dia que eu escolher</option>
      </select>
      {mode === 'weekly' && (
        <div className="mt-2 flex gap-1.5" role="group" aria-label="Dias da semana">
          {WD.map((l, i) => (
            <button
              key={i}
              type="button"
              title={WD_FULL[i]}
              aria-label={WD_FULL[i]}
              aria-pressed={days.includes(i)}
              onClick={() => toggleDay(i)}
              className={`w-8 h-8 rounded-full text-xs font-bold border ${days.includes(i) ? 'bg-emerald-500 border-emerald-500 text-slate-950' : 'border-[#30363d] text-[#c9d1d9]'}`}
            >
              {l}
            </button>
          ))}
        </div>
      )}
      {mode === 'monthly' && (
        <label className="mt-2 flex items-center gap-2 text-xs text-[#8b949e]">
          Todo dia
          <input
            type="number"
            min={1}
            max={31}
            value={monthDay}
            onChange={(e) => {
              const n = Math.max(1, Math.min(31, Math.round(Number(e.target.value) || 1)));
              onChange(`monthly:${n}`);
            }}
            className={`w-20 ${sel}`}
          />
          <span className="text-[11px] text-[#6e7681]">(em meses mais curtos, no último dia)</span>
        </label>
      )}
    </div>
  );
};
