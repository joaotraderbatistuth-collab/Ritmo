import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronDown, ChevronUp, HelpCircle, ListChecks, X } from 'lucide-react';
import { GUIDE_STEPS, parseGuideState } from '../lib/setup-guide.js';

interface Props {
  isOpen: boolean;
  userId: number | null | undefined;
  onClose: () => void;
  onNavigate: (tab: string) => void;
  onAction: (actionId: 'open_cycle') => void;
  /** Avisa qual aba está em destaque, para o menu mostrar onde estamos. */
  onStepTab?: (tab: string | null) => void;
}

const storageKey = (userId: number | null | undefined) => `ritmo_guide_v1_${userId ?? 'anon'}`;

function save(userId: number | null | undefined, state: { status: 'open' | 'skipped' | 'done'; step: number }) {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(state));
  } catch {
    /* sem armazenamento */
  }
}

export const SetupGuide: React.FC<Props> = ({ isOpen, userId, onClose, onNavigate, onAction, onStepTab }) => {
  const [step, setStep] = useState(0);
  const [minimized, setMinimized] = useState(false);
  const nav = useRef(onNavigate);
  const tabCb = useRef(onStepTab);
  nav.current = onNavigate;
  tabCb.current = onStepTab;

  // ao abrir, retoma de onde parou (ou do começo, se já tinha concluído ou pulado)
  useEffect(() => {
    if (!isOpen) return;
    let start = 0;
    try {
      const saved = parseGuideState(localStorage.getItem(storageKey(userId)));
      if (saved && saved.status === 'open') start = saved.step;
    } catch {
      /* começa do início */
    }
    setStep(start);
    setMinimized(false);
  }, [isOpen, userId]);

  // a cada passo, leva a pessoa até a aba e guarda o progresso
  useEffect(() => {
    if (!isOpen) {
      tabCb.current?.(null);
      return;
    }
    const s = GUIDE_STEPS[step];
    nav.current(s.tab);
    tabCb.current?.(s.tab);
    save(userId, { status: 'open', step });
  }, [isOpen, step, userId]);

  // Esc pausa o guia
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const s = GUIDE_STEPS[step];
  const last = step === GUIDE_STEPS.length - 1;
  const pct = Math.round(((step + 1) / GUIDE_STEPS.length) * 100);

  const finish = () => {
    save(userId, { status: 'done', step: GUIDE_STEPS.length - 1 });
    onClose();
  };
  const skip = () => {
    save(userId, { status: 'skipped', step });
    onClose();
  };

  if (minimized) {
    return (
      <button
        type="button"
        onClick={() => setMinimized(false)}
        className="fixed z-40 bottom-4 right-4 flex items-center gap-2 px-4 py-3 rounded-full bg-emerald-500 text-slate-950 font-bold text-sm shadow-xl shadow-emerald-500/30"
        style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <HelpCircle className="w-4 h-4" /> Modo ajuda · passo {step + 1} de {GUIDE_STEPS.length} <ChevronUp className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div
      role="dialog"
      aria-label="Modo ajuda de configuração"
      className="fixed z-40 inset-x-0 bottom-0 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-[420px] rounded-t-2xl sm:rounded-2xl border border-emerald-500/40 bg-[#0d1117] text-[#f0f6fc] shadow-2xl shadow-black/60 max-h-[75vh] overflow-y-auto"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="h-1.5 bg-[#21262d] rounded-t-2xl overflow-hidden"><div className="h-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} /></div>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-400"><HelpCircle className="w-3.5 h-3.5" /> Modo ajuda · passo {step + 1} de {GUIDE_STEPS.length}</div>
            <h2 className="text-lg font-extrabold mt-1">{s.title}</h2>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button type="button" onClick={() => setMinimized(true)} aria-label="Minimizar" className="p-1.5 text-[#8b949e] hover:text-white"><ChevronDown className="w-4 h-4" /></button>
            <button type="button" onClick={onClose} aria-label="Pausar o modo ajuda" className="p-1.5 text-[#8b949e] hover:text-white"><X className="w-4 h-4" /></button>
          </div>
        </div>

        <p className="text-sm text-[#c9d1d9] mt-2">{s.intro}</p>

        <div className="mt-3 rounded-xl border border-[#30363d] bg-[#161b22] p-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#f0f6fc] mb-1.5"><ListChecks className="w-4 h-4 text-emerald-400" /> O que fazer nesta aba</div>
          <ol className="list-decimal pl-5 space-y-1 text-sm text-[#c9d1d9]">
            {s.tasks.map((t) => <li key={t}>{t}</li>)}
          </ol>
        </div>

        {s.action && (
          <button type="button" onClick={() => onAction(s.action!.id)} className="mt-3 w-full px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-sm">
            {s.action.label}
          </button>
        )}

        <div className="mt-4 flex items-center justify-between gap-2">
          <button type="button" onClick={() => setStep(step - 1)} disabled={step === 0} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#30363d] text-sm text-[#c9d1d9] disabled:opacity-30">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
          {last ? (
            <button type="button" onClick={finish} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm">
              <CheckCircle2 className="w-4 h-4" /> Concluir configuração
            </button>
          ) : (
            <button type="button" onClick={() => setStep(step + 1)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm">
              Próximo <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="mt-3 text-center">
          <button type="button" onClick={skip} className="text-xs text-[#6e7681] hover:text-[#c9d1d9] underline">Pular o modo ajuda</button>
        </div>
      </div>
    </div>
  );
};
