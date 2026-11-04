import React, { useEffect, useRef, useState } from 'react';
import { Bell, AlertTriangle, Info, X } from 'lucide-react';
import { Notice } from '../lib/notices.js';

const TONE = { urgent: 'border-rose-500/50 bg-rose-500/10 text-rose-300', warn: 'border-amber-500/50 bg-amber-500/10 text-amber-300', info: 'border-[#30363d] bg-[#161b22] text-[#8b949e]' } as const;

export const NoticeBell: React.FC<{ notices: Notice[]; onOpenTab: (tab: string) => void }> = ({ notices, onOpenTab }) => {
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState<string[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const urgent = notices.filter((n) => n.level !== 'info' && !seen.includes(n.id)).length;

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen(!open)} aria-label={`Avisos${urgent ? `, ${urgent} importantes` : ''}`} aria-expanded={open} className="relative flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-[#c9d1d9] hover:bg-[#161b22]">
        <Bell className="w-4 h-4" />
        <span className="hidden sm:inline">Avisos</span>
        {notices.length > 0 && <span className={`absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center ${urgent ? 'bg-rose-500 text-white' : 'bg-[#30363d] text-[#c9d1d9]'}`}>{notices.length}</span>}
      </button>
      {open && (
        <div role="dialog" aria-label="Avisos" className="fixed sm:absolute left-2 right-2 sm:left-auto sm:right-0 top-16 sm:top-full mt-2 sm:w-96 z-50 rounded-2xl border border-[#30363d] bg-[#0d1117] shadow-2xl shadow-black/60 max-h-[70vh] overflow-y-auto">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#30363d]">
            <span className="font-bold text-[#f0f6fc]">Avisos de hoje</span>
            <button type="button" onClick={() => setOpen(false)} aria-label="Fechar" className="text-[#8b949e] hover:text-white"><X className="w-4 h-4" /></button>
          </div>
          {notices.length === 0 ? (
            <p className="p-6 text-center text-sm text-[#8b949e]">Tudo em dia por aqui. 🎉</p>
          ) : (
            <ul className="p-3 space-y-2">
              {notices.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSeen((s) => [...s, n.id]);
                      setOpen(false);
                      if (n.href) window.location.href = n.href;
                      else if (n.tab) onOpenTab(n.tab);
                    }}
                    className={`w-full text-left rounded-xl border p-3 ${TONE[n.level]}`}
                  >
                    <div className="flex items-start gap-2">
                      {n.level === 'info' ? <Info className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />}
                      <div>
                        <div className="text-sm font-semibold text-[#f0f6fc]">{n.title}</div>
                        <div className="text-xs mt-0.5">{n.detail}</div>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
