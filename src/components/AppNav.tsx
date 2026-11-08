import React, { useEffect, useState } from 'react';
import { LayoutGrid, X, ListChecks, Lightbulb } from 'lucide-react';

// Menu enxuto: 4 abas fixas + "Mais" (com todas as outras). No celular fica embaixo, ao alcance do polegar.

export interface NavItem {
  id: string;
  label: string;
  short?: string;
  hint?: string;
  icon: React.ReactNode;
}

export const PRIMARY_TABS = ['hoje', 'feed', 'treino', 'progresso'] as const;

const isPrimary = (id: string) => (PRIMARY_TABS as readonly string[]).includes(id);

interface Props {
  items: NavItem[];
  active: string;
  onSelect: (id: string) => void;
  /** botão de avisos (sino) */
  bell?: React.ReactNode;
  onHelp: () => void;
  onTour: () => void;
  /** aba destacada pelo modo ajuda */
  highlight?: string | null;
}

export const AppNav: React.FC<Props> = ({ items, active, onSelect, bell, onHelp, onTour, highlight }) => {
  const [moreOpen, setMoreOpen] = useState(false);
  const primary = PRIMARY_TABS.map((id) => items.find((i) => i.id === id)).filter(Boolean) as NavItem[];
  const secondary = items.filter((i) => !isPrimary(i.id));
  const activeItem = items.find((i) => i.id === active);
  const inMore = !isPrimary(active);
  const pick = (id: string) => {
    setMoreOpen(false);
    onSelect(id);
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch {}
  };

  // a barra de baixo empurra os botões flutuantes para cima (variável --ritmo-nav-h no styles.css)
  useEffect(() => {
    document.documentElement.classList.add('ritmo-bottomnav');
    return () => document.documentElement.classList.remove('ritmo-bottomnav');
  }, []);

  const ring = (id: string) => (highlight === id ? 'ring-2 ring-amber-300 ring-offset-2 ring-offset-[#0d1117]' : '');

  return (
    <>
      {/* Computador e tablet: barra no topo */}
      <div className="hidden sm:flex items-center gap-2 mb-6">
        <nav className="flex items-center gap-1.5" aria-label="Seções principais">
          {primary.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => pick(item.id)}
              aria-current={active === item.id ? 'page' : undefined}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${ring(item.id)} ${active === item.id ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#161b22]'}`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            aria-expanded={moreOpen}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${inMore ? 'bg-emerald-600 text-white' : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#161b22]'}`}
          >
            <LayoutGrid className="w-4 h-4" />
            {inMore && activeItem ? activeItem.short || activeItem.label : 'Mais'}
          </button>
        </nav>
        <div className="ml-auto flex items-center gap-1">
          {bell}
          <button type="button" onClick={onHelp} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-emerald-300 hover:bg-emerald-500/10"><ListChecks className="w-4 h-4" /> Ajuda</button>
        </div>
      </div>

      {/* Celular: título da seção + sino no topo */}
      <div className="sm:hidden flex items-center justify-between gap-2 mb-4">
        <h1 className="text-lg font-extrabold text-[#f0f6fc] flex items-center gap-2 min-w-0">
          <span className="text-emerald-400 shrink-0">{activeItem?.icon}</span>
          <span className="truncate">{activeItem?.label || 'Ritmo'}</span>
        </h1>
        <div className="flex items-center gap-1 shrink-0">{bell}</div>
      </div>

      {/* Celular: barra fixa embaixo */}
      <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 border-t border-[#30363d] bg-[#0d1117]/95 backdrop-blur pb-[env(safe-area-inset-bottom)]" aria-label="Seções principais">
        <div className="grid grid-cols-5 h-16">
          {primary.map((item) => {
            const on = active === item.id;
            return (
              <button key={item.id} type="button" onClick={() => pick(item.id)} aria-current={on ? 'page' : undefined} className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${ring(item.id)} ${on ? 'text-emerald-400' : 'text-[#8b949e]'}`}>
                <span className={`flex items-center justify-center w-10 h-7 rounded-full transition-colors ${on ? 'bg-emerald-500/15' : ''}`}>{item.icon}</span>
                {item.short || item.label}
              </button>
            );
          })}
          <button type="button" onClick={() => setMoreOpen(true)} aria-expanded={moreOpen} className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${inMore ? 'text-emerald-400' : 'text-[#8b949e]'}`}>
            <span className={`flex items-center justify-center w-10 h-7 rounded-full ${inMore ? 'bg-emerald-500/15' : ''}`}><LayoutGrid className="w-5 h-5" /></span>
            Mais
          </button>
        </div>
      </nav>

      {/* Todas as outras seções */}
      {moreOpen && (
        <div className="fixed inset-0 z-[65] bg-black/70 backdrop-blur-sm flex items-end sm:items-start sm:pt-24 justify-center" onClick={() => setMoreOpen(false)}>
          <div role="dialog" aria-modal="true" aria-label="Todas as seções" onClick={(e) => e.stopPropagation()} className="w-full sm:max-w-2xl max-h-[85vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-[#30363d] bg-[#0d1117] p-4 sm:p-5 pb-[calc(1rem+env(safe-area-inset-bottom))]">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-[#f0f6fc]">Tudo no Ritmo</h2>
              <button type="button" onClick={() => setMoreOpen(false)} aria-label="Fechar" className="p-1.5 text-[#8b949e] hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {secondary.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => pick(item.id)}
                  className={`text-left rounded-2xl border p-3 transition-colors ${ring(item.id)} ${active === item.id ? 'border-emerald-500 bg-emerald-500/10' : 'border-[#30363d] bg-[#161b22] hover:border-[#484f58]'}`}
                >
                  <span className="text-emerald-400">{item.icon}</span>
                  <span className="mt-1.5 block text-sm font-semibold text-[#f0f6fc] leading-tight">{item.label}</span>
                  {item.hint && <span className="mt-0.5 block text-[11px] text-[#8b949e] leading-snug">{item.hint}</span>}
                </button>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => { setMoreOpen(false); onHelp(); }} className="inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-emerald-500/40 text-sm font-semibold text-emerald-300"><ListChecks className="w-4 h-4" /> Modo ajuda</button>
              <button type="button" onClick={() => { setMoreOpen(false); onTour(); }} className="inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-amber-500/40 text-sm font-semibold text-amber-300"><Lightbulb className="w-4 h-4" /> Como usar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
