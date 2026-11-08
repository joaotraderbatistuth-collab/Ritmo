import React, { useEffect, useState } from 'react';
import { Info, X, CheckCircle2, ListChecks, Lightbulb } from 'lucide-react';
import { HELP } from '../lib/help-texts.js';

// "Saber mais": abinha pequena embaixo de cada parte do app. Tocou, abre a explicação completa:
// o que é, como funciona e o que fazer.

export const LearnMore: React.FC<{ id: string; align?: 'left' | 'right'; className?: string; variant?: 'tab' | 'chip' }> = ({ id, align = 'right', className = '', variant = 'tab' }) => {
  const [open, setOpen] = useState(false);
  const h = HELP[id];
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open]);
  if (!h) return null;

  return (
    <>
      <div className={`flex ${align === 'right' ? 'justify-end' : 'justify-start'} ${variant === 'tab' ? '-mt-px px-5' : ''} ${className}`}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={
            variant === 'tab'
              ? 'inline-flex items-center gap-1 rounded-b-xl border border-t-0 border-[#30363d] bg-[#161b22] px-3 py-1 text-[11px] font-semibold text-[#8b949e] hover:text-emerald-300 hover:border-emerald-500/40 transition-colors'
              : 'inline-flex items-center gap-1.5 rounded-full border border-[#30363d] bg-[#161b22] px-3 py-1.5 text-xs font-semibold text-[#8b949e] hover:text-emerald-300 hover:border-emerald-500/40 transition-colors'
          }
          aria-haspopup="dialog"
        >
          <Info className={variant === 'tab' ? 'w-3 h-3' : 'w-3.5 h-3.5'} /> {variant === 'tab' ? 'Saber mais' : `Saber mais: ${h.title}`}
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-[95] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby={`help-${id}`} onClick={() => setOpen(false)}>
          <div className="w-full sm:max-w-md max-h-[88vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-[#30363d] bg-[#161b22] p-5 pb-8 ritmo-level-pop" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start gap-3">
              <span className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center text-2xl shrink-0 ritmo-medal-pop" aria-hidden="true">{h.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Saber mais</p>
                <h2 id={`help-${id}`} className="text-lg font-extrabold text-[#f0f6fc] leading-tight">{h.title}</h2>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Fechar" className="p-1.5 text-[#8b949e] hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <p className="mt-4 text-sm text-[#e6edf3] leading-relaxed">{h.what}</p>

            <h3 className="mt-5 text-xs font-bold uppercase tracking-wider text-[#8b949e] flex items-center gap-1.5"><ListChecks className="w-4 h-4 text-sky-300" /> Como funciona</h3>
            <ul className="mt-2 space-y-2">
              {h.how.map((t, i) => (
                <li key={i} className="flex gap-2 text-sm text-[#c9d1d9] leading-snug">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-sky-400 shrink-0" aria-hidden="true" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>

            <h3 className="mt-5 text-xs font-bold uppercase tracking-wider text-[#8b949e] flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> O que fazer</h3>
            <ul className="mt-2 space-y-2">
              {h.todo.map((t, i) => (
                <li key={i} className="flex gap-2 text-sm text-[#e6edf3] leading-snug">
                  <span className="text-emerald-400 font-black shrink-0">{i + 1}.</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>

            {h.tip && (
              <p className="mt-5 flex gap-2 rounded-2xl bg-amber-500/10 border border-amber-400/30 p-3 text-sm text-amber-100">
                <Lightbulb className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" /> {h.tip}
              </p>
            )}

            <button type="button" onClick={() => setOpen(false)} className="mt-6 w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold">Entendi</button>
          </div>
        </div>
      )}
    </>
  );
};
