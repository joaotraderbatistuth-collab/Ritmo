import React, { useMemo, useState } from 'react';
import { Award, ChevronDown, ChevronUp, Lock, Share2 } from 'lucide-react';
import { RARITY, type Medal, type MonthRecap } from '../lib/medals.js';
import { division } from '../lib/season.js';
import { cardFromMedal } from '../lib/share-card.js';
import { openShare } from '../lib/share-feed.js';

// Conquistas (medalhas) e retrospectiva do mês, na aba Progresso.

/* ------------------------------------------------------------------ */
/* Medalhas                                                            */
/* ------------------------------------------------------------------ */

export const MedalsCard: React.FC<{ medals: Medal[] | undefined }> = ({ medals }) => {
  const [all, setAll] = useState(false);
  const list = medals || [];
  const earned = list.filter((m) => m.earned);
  // as mais perto de sair primeiro (gostinho de "falta pouco")
  const next = useMemo(
    () => list.filter((m) => !m.earned).sort((a, b) => b.progress / b.goal - a.progress / a.goal).slice(0, 3),
    [list]
  );
  if (!list.length) return null;
  const shown = all ? list : [...earned.slice(-6).reverse(), ...next];
  return (
    <section className="rounded-3xl border border-[#30363d] bg-[#161b22] p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-bold text-[#f0f6fc] flex items-center gap-2"><Award className="w-5 h-5 text-amber-300" /> Conquistas</h3>
        <span className="text-sm font-bold text-amber-300 tabular-nums">{earned.length}/{list.length}</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-[#21262d] overflow-hidden"><div className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-700" style={{ width: `${Math.round((earned.length / list.length) * 100)}%` }} /></div>
      {next.length > 0 && !all && <p className="mt-3 text-xs text-[#8b949e]">Quase lá: <strong className="text-[#e6edf3]">{next[0].name}</strong> ({next[0].progress}/{next[0].goal})</p>}
      <div className="mt-3 grid grid-cols-3 sm:grid-cols-6 gap-2">
        {shown.map((m) => {
          const r = RARITY[m.rarity || 'comum'];
          const body = (
            <>
              <span className={`block text-3xl ${m.earned ? '' : 'grayscale opacity-40'}`} aria-hidden="true">{m.emoji}</span>
              {!m.earned && <Lock className="absolute top-1.5 right-1.5 w-3 h-3 text-[#6e7681]" aria-hidden="true" />}
              {m.earned && <Share2 className="absolute top-1.5 right-1.5 w-3 h-3 text-[#8b949e]" aria-hidden="true" />}
              <span className="mt-1 block text-[10px] font-semibold leading-tight text-[#e6edf3]">{m.name}</span>
              <span className="mt-0.5 block text-[9px] font-bold uppercase tracking-wide" style={{ color: m.earned ? r.color : '#6e7681' }}>{r.name}</span>
              {!m.earned && (
                <span className="mt-1 block h-1 rounded-full bg-[#21262d] overflow-hidden"><span className="block h-full bg-emerald-500" style={{ width: `${Math.round((m.progress / m.goal) * 100)}%` }} /></span>
              )}
            </>
          );
          return m.earned ? (
            <button
              type="button"
              key={m.id}
              title={`${m.name}: ${m.desc}. Toque para compartilhar.`}
              onClick={() => openShare(cardFromMedal(m))}
              className="relative rounded-2xl border p-2 text-center transition-transform active:scale-95 hover:scale-[1.03]"
              style={{ borderColor: `${r.color}66`, background: `linear-gradient(160deg, ${r.glow.replace(/[\d.]+\)$/, '0.18)')}, transparent)` }}
            >
              {body}
            </button>
          ) : (
            <div key={m.id} title={`${m.name}: ${m.desc}`} className="relative rounded-2xl border border-[#30363d] bg-[#0d1117] p-2 text-center">
              {body}
            </div>
          );
        })}
      </div>
      <button type="button" onClick={() => setAll((v) => !v)} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:underline">
        {all ? <>Mostrar menos <ChevronUp className="w-3.5 h-3.5" /></> : <>Ver todas as {list.length} conquistas <ChevronDown className="w-3.5 h-3.5" /></>}
      </button>
    </section>
  );
};

/** Medalhas ganhas, no perfil público (só as ganhas). */
export const MedalsStrip: React.FC<{ medals: { id: string; emoji: string; name: string }[] }> = ({ medals }) => {
  if (!medals.length) return null;
  return (
    <div>
      <p className="text-xs font-semibold text-[#8b949e] mb-1.5">Conquistas ({medals.length})</p>
      <div className="flex flex-wrap gap-1.5">
        {medals.map((m) => (
          <span key={m.id} title={m.name} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/10 border border-amber-400/30 text-xs text-[#e6edf3]"><span aria-hidden="true">{m.emoji}</span>{m.name}</span>
        ))}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Retrospectiva do mês                                                */
/* ------------------------------------------------------------------ */

const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const monthName = (m: string) => MONTHS[Number(m.slice(5, 7)) - 1] || m;
const brDay = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;

function statsOf(r: MonthRecap): [string, string][] {
  const out: [string, string][] = [['Dias ativos', String(r.activeDays)]];
  if (r.habits) out.push(['Hábitos marcados', String(r.habits)]);
  if (r.trainDays) out.push(['Dias de treino', String(r.trainDays)]);
  if (r.km) out.push(['Km no treino', r.km.toLocaleString('pt-BR')]);
  if (r.focus) out.push(['Sessões de foco', String(r.focus)]);
  if (r.tasks) out.push(['Tarefas concluídas', String(r.tasks)]);
  if (r.diary) out.push(['Check-ins no diário', String(r.diary)]);
  return out.slice(0, 6);
}

export const RecapCard: React.FC<{
  recap: { current: MonthRecap; previous: MonthRecap } | undefined;
  name: string;
  history: { month: string; tier: number }[];
  medalsEarned: number;
}> = ({ recap, history, medalsEarned }) => {
  const [which, setWhich] = useState<'previous' | 'current'>('previous');
  if (!recap) return null;
  const hasPrev = recap.previous.points > 0;
  const r = which === 'previous' && hasPrev ? recap.previous : recap.current;
  const isPrev = r === recap.previous;
  const tier = history.find((h) => h.month === r.month)?.tier ?? null;

  const share = () => {
    const title = isPrev ? `Meu ${monthName(r.month)} no Ritmo` : `Meu ${monthName(r.month)} até agora`;
    const d = tier !== null ? division(tier) : null;
    openShare({
      kind: 'retrospectiva',
      emoji: d ? d.emoji : '📅',
      tag: 'RETROSPECTIVA',
      color: '#a855f7',
      title,
      subtitle: [d ? `Divisão ${d.name}` : '', medalsEarned ? `${medalsEarned} conquistas` : '', r.bestDay ? `melhor dia: ${brDay(r.bestDay.day)}` : ''].filter(Boolean).join(' · '),
      big: r.points.toLocaleString('pt-BR'),
      bigLabel: 'pontos no mês',
      stats: statsOf(r),
      feed: null,
    });
  };

  return (
    <section className="rounded-3xl border border-violet-500/30 bg-gradient-to-br from-violet-500/10 via-[#161b22] to-[#0d1117] p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-bold text-[#f0f6fc]">{isPrev ? `Sua retrospectiva de ${monthName(r.month)}` : `Seu ${monthName(r.month)} até agora`}</h3>
        {hasPrev && (
          <div className="flex rounded-lg border border-[#30363d] text-xs overflow-hidden">
            <button type="button" onClick={() => setWhich('previous')} className={`px-2.5 py-1 ${isPrev ? 'bg-violet-500/20 text-violet-200' : 'text-[#8b949e]'}`}>{monthName(recap.previous.month)}</button>
            <button type="button" onClick={() => setWhich('current')} className={`px-2.5 py-1 ${!isPrev ? 'bg-violet-500/20 text-violet-200' : 'text-[#8b949e]'}`}>{monthName(recap.current.month)}</button>
          </div>
        )}
      </div>
      <div className="mt-3 flex items-end gap-3">
        <span className="text-5xl font-black text-amber-200 tabular-nums">{r.points.toLocaleString('pt-BR')}</span>
        <span className="pb-1.5 text-sm text-[#8b949e]">pontos{tier !== null ? ` · ${division(tier).emoji} ${division(tier).name}` : ''}</span>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {statsOf(r).map(([l, v]) => (
          <div key={l} className="rounded-xl bg-[#0d1117] border border-[#30363d] p-2 text-center">
            <div className="text-lg font-extrabold text-[#f0f6fc] tabular-nums">{v}</div>
            <div className="text-[10px] text-[#8b949e] leading-tight">{l}</div>
          </div>
        ))}
      </div>
      {r.bestDay && <p className="mt-2 text-xs text-[#8b949e]">Melhor dia: {brDay(r.bestDay.day)}, com {r.bestDay.xp} pontos.</p>}
      <button type="button" onClick={share} disabled={r.points === 0} className="mt-4 w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-bold">
        <Share2 className="w-4 h-4" /> Compartilhar no Stories e WhatsApp
      </button>
    </section>
  );
};
