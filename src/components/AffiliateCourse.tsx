import React, { useEffect, useState } from 'react';
import { BookOpen, Check, ChevronDown, Clock } from 'lucide-react';
import { COURSE_LESSONS, COURSE_TITLE, courseWordCount } from '../lib/affiliate-content.js';

const KEY = 'ritmo_affiliate_course_v1';

export const AffiliateCourse: React.FC = () => {
  const [done, setDone] = useState<string[]>([]);
  const [open, setOpen] = useState<string | null>(COURSE_LESSONS[0].id);
  const minutes = Math.max(1, Math.round(courseWordCount() / 200));

  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || '[]');
      if (Array.isArray(raw)) setDone(raw.filter((x) => COURSE_LESSONS.some((l) => l.id === x)));
    } catch {
      /* sem armazenamento */
    }
  }, []);

  const toggle = (id: string) => {
    const next = done.includes(id) ? done.filter((x) => x !== id) : [...done, id];
    setDone(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignora */
    }
  };

  const pct = Math.round((done.length / COURSE_LESSONS.length) * 100);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[#30363d] bg-[#161b22] p-5">
        <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider"><BookOpen className="w-4 h-4" /> Mini curso gratuito</div>
        <h3 className="text-lg font-extrabold text-[#f0f6fc] mt-1">{COURSE_TITLE}</h3>
        <p className="text-sm text-[#8b949e] mt-1 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Leitura de cerca de {minutes} minutos · {COURSE_LESSONS.length} lições</p>
        <div className="mt-3 h-2 rounded-full bg-[#21262d] overflow-hidden"><div className="h-full bg-emerald-500 transition-all" style={{ width: `${pct}%` }} /></div>
        <p className="text-xs text-[#8b949e] mt-1.5">{done.length} de {COURSE_LESSONS.length} lições concluídas{pct === 100 ? ' · parabéns, você terminou! Agora é pôr em prática.' : ''}</p>
      </div>

      {COURSE_LESSONS.map((l) => {
        const isOpen = open === l.id;
        const isDone = done.includes(l.id);
        return (
          <div key={l.id} className="rounded-2xl border border-[#30363d] bg-[#161b22] overflow-hidden">
            <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : l.id)} className="w-full flex items-center gap-3 px-5 py-4 text-left">
              <span className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 ${isDone ? 'bg-emerald-500 border-emerald-500' : 'border-[#484f58]'}`}>{isDone && <Check className="w-4 h-4 text-slate-950" />}</span>
              <span className="flex-1 font-semibold text-[#f0f6fc]">{l.title}</span>
              <ChevronDown className={`w-5 h-5 text-[#8b949e] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
              <div className="px-5 pb-5 space-y-3 text-sm text-[#c9d1d9] leading-relaxed">
                {l.body.map((p, i) =>
                  p.startsWith('• ') ? (
                    <p key={i} className="pl-4 border-l-2 border-emerald-500/50 text-[#f0f6fc]">{p.slice(2)}</p>
                  ) : (
                    <p key={i}>{p}</p>
                  )
                )}
                <button type="button" onClick={() => toggle(l.id)} className={`mt-2 px-4 py-2 rounded-lg text-sm font-semibold ${isDone ? 'border border-[#30363d] text-[#c9d1d9]' : 'bg-emerald-500 text-slate-950'}`}>
                  {isDone ? 'Desmarcar como concluída' : 'Marcar como concluída'}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
