import React, { useState } from 'react';
import { ArrowRight, Check, Zap, ChevronRight, Sparkles } from 'lucide-react';
import { Step } from '../lib/next-step.js';

// Cartão "Próximo passo": um botão grande com a ação certa para agora, e as duas seguintes embaixo.

export const NextStepCard: React.FC<{
  steps: Step[];
  comeback?: boolean;
  onRun: (s: Step) => Promise<void> | void;
}> = ({ steps, comeback, onRun }) => {
  const [busy, setBusy] = useState<string | null>(null);
  const [doneId, setDoneId] = useState<string | null>(null);
  if (!steps.length) return null;
  const [main, ...rest] = steps;
  const run = async (s: Step) => {
    setBusy(s.id);
    try {
      await onRun(s);
      if (s.kind === 'habit' || s.kind === 'task') {
        setDoneId(s.id);
        setTimeout(() => setDoneId(null), 900);
      }
    } finally {
      setBusy(null);
    }
  };
  const quick = main.kind === 'habit' || main.kind === 'task';
  return (
    <section className="rounded-3xl border border-emerald-500/40 bg-gradient-to-br from-emerald-500/15 via-[#161b22] to-[#0d1117] p-5 shadow-lg shadow-emerald-500/10" aria-label="Próximo passo">
      {comeback && (
        <p className="mb-3 rounded-xl bg-amber-500/15 border border-amber-500/40 px-3 py-2 text-xs font-bold text-amber-200 inline-flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" /> Que bom te ver de volta! Hoje seus pontos valem em dobro (até +50).
        </p>
      )}
      <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">Próximo passo</p>
      <div className="mt-1 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#f0f6fc] leading-tight break-words">{main.title}</h2>
          <p className="mt-1 text-sm text-[#8b949e]">{main.why}</p>
        </div>
        {main.xp ? (
          <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-sm font-extrabold"><Zap className="w-3.5 h-3.5 fill-emerald-300" />+{main.xp}</span>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => run(main)}
        disabled={busy === main.id}
        className={`mt-4 w-full py-4 rounded-2xl text-lg font-extrabold inline-flex items-center justify-center gap-2 transition-all ${doneId === main.id ? 'bg-amber-400 text-[#0d1117]' : 'bg-emerald-500 hover:bg-emerald-400 text-[#0d1117] shadow-lg shadow-emerald-500/25 active:scale-[0.98]'} disabled:opacity-60`}
      >
        {doneId === main.id ? <><Check className="w-6 h-6" /> Feito!</> : quick ? <><Check className="w-6 h-6" /> {main.cta}</> : <>{main.cta} <ArrowRight className="w-6 h-6" /></>}
      </button>
      {rest.length > 0 && (
        <div className="mt-4">
          <p className="text-[11px] font-semibold text-[#6e7681] uppercase tracking-wider">Depois</p>
          <ul className="mt-1.5 space-y-1.5">
            {rest.slice(0, 2).map((s) => (
              <li key={s.id}>
                <button type="button" onClick={() => run(s)} disabled={busy === s.id} className="w-full flex items-center gap-3 rounded-xl border border-[#30363d] bg-[#0d1117]/70 px-3 py-2.5 text-left hover:border-emerald-500/50">
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-[#e6edf3] truncate">{s.title}</span>
                    <span className="block text-[11px] text-[#8b949e] truncate">{s.why}</span>
                  </span>
                  {s.xp ? <span className="text-xs font-bold text-emerald-400 shrink-0">+{s.xp}</span> : null}
                  <ChevronRight className="w-4 h-4 text-[#6e7681] shrink-0" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};
