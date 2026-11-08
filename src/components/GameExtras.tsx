import React, { useState } from 'react';
import { Gift, Lock, Check, Users, Trophy, Sparkles } from 'lucide-react';
import { LevelAvatar } from './LevelAvatar.js';
import { callApi } from '../lib/client-api.js';
import { openProfile } from '../lib/share-feed.js';
import { playFanfare } from './XpBurst.js';

// Evento da semana, passe da temporada, baú semanal, mascote (Rit) e ranking entre amigos.

export interface EventView {
  id: string;
  name: string;
  emoji: string;
  color: string;
  desc: string;
  tab: string;
  todayBonus: number;
  max: number;
  endsAt: string;
}
export interface PassView {
  month: string;
  step: number;
  points: number;
  progress: number;
  next: { step: number; points: number; missing: number; reward: string } | null;
  tiers: { step: number; points: number; bonus: number; reward: string; emoji: string; done: boolean }[];
}
export interface WeekChestView {
  days: number;
  need: number;
  ready: boolean;
  opened: { xp: number; day: string } | null;
  daysLeft: number;
}
export interface MascotView {
  stage: number;
  stages: number;
  name: string;
  emoji: string;
  mood: 'radiante' | 'tranquilo' | 'com_sede' | 'dormindo';
  message: string;
  next: { name: string; emoji: string; missing: number } | null;
  progress: number;
}
export interface FriendsView {
  week: string;
  total: number;
  rank: number;
  following: number;
  gapToNext: number | null;
  nextName: string | null;
  top: { rank: number; userId: number; name: string; initials: string; avatarUrl: string | null; level: number; xp: number; me: boolean }[];
  meRow?: { rank: number; userId: number; name: string; initials: string; avatarUrl: string | null; level: number; xp: number; me: boolean };
}

const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const daysTo = (end: string, today?: string) => {
  const t = today ? Date.parse(`${today}T12:00:00Z`) : Date.now();
  return Math.max(0, Math.round((Date.parse(`${end}T12:00:00Z`) - t) / 86400_000));
};

/* ------------------------------------------------------------------ */
/* Evento da semana                                                    */
/* ------------------------------------------------------------------ */

export const EventBanner: React.FC<{ event: EventView | null | undefined; today?: string; onGo: (tab: string) => void }> = ({ event, today, onGo }) => {
  if (!event) return null;
  const left = daysTo(event.endsAt, today);
  return (
    <section className="relative overflow-hidden rounded-3xl border p-4" style={{ borderColor: `${event.color}66`, background: `linear-gradient(120deg, ${event.color}26, #161b22 60%)` }}>
      <span className="absolute -right-4 -top-6 text-8xl opacity-15 select-none" aria-hidden="true">{event.emoji}</span>
      <div className="relative flex items-center gap-3">
        <span className="text-3xl" aria-hidden="true">{event.emoji}</span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: event.color }}>Evento da semana · pontos em dobro</p>
          <h3 className="text-base font-extrabold text-[#f0f6fc]">{event.name}</h3>
          <p className="text-xs text-[#c9d1d9]">
            {event.desc} {left === 0 ? 'Último dia!' : `Faltam ${left} ${left === 1 ? 'dia' : 'dias'}.`}
          </p>
        </div>
        <button type="button" onClick={() => onGo(event.tab)} className="shrink-0 px-3 py-2 rounded-xl text-xs font-extrabold text-[#0d1117]" style={{ background: event.color }}>
          Ir
        </button>
      </div>
      <div className="relative mt-3 flex items-center gap-2 text-[11px] text-[#8b949e]">
        <span className="flex-1 h-1.5 rounded-full bg-black/30 overflow-hidden">
          <span className="block h-full rounded-full transition-all duration-700" style={{ width: `${Math.round((event.todayBonus / event.max) * 100)}%`, background: event.color }} />
        </span>
        <span className="tabular-nums font-semibold text-[#e6edf3]">+{event.todayBonus}/{event.max} extra hoje</span>
      </div>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/* Passe da temporada                                                  */
/* ------------------------------------------------------------------ */

export const PassCard: React.FC<{ pass: PassView | null | undefined }> = ({ pass }) => {
  if (!pass) return null;
  const month = MONTHS[Number(pass.month.slice(5, 7)) - 1] || '';
  return (
    <section className="rounded-3xl border border-amber-400/30 bg-gradient-to-br from-amber-500/10 via-[#161b22] to-[#0d1117] p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-bold text-[#f0f6fc] flex items-center gap-2"><Trophy className="w-5 h-5 text-amber-300" /> Passe de {month}</h3>
        <span className="text-sm font-black text-amber-300 tabular-nums">{pass.step}/10</span>
      </div>
      <p className="mt-1 text-xs text-[#8b949e]">
        {pass.next ? <>Faltam <strong className="text-amber-200">{pass.next.missing} pontos</strong> para o degrau {pass.next.step}: {pass.next.reward}.</> : 'Passe completo! O selo do mês já está no seu perfil.'}
      </p>
      <div className="mt-4 overflow-x-auto pb-2 -mx-1 px-1">
        <ol className="flex items-center min-w-max">
          {pass.tiers.map((t, i) => {
            const current = !t.done && (i === 0 || pass.tiers[i - 1].done);
            return (
              <li key={t.step} className="flex items-center">
                {i > 0 && <span className={`w-6 h-1 ${t.done ? 'bg-amber-400' : 'bg-[#30363d]'}`} aria-hidden="true" />}
                <div className="flex flex-col items-center w-14">
                  <span
                    className={`relative w-11 h-11 rounded-2xl flex items-center justify-center text-xl border-2 ${t.done ? 'bg-amber-400/20 border-amber-400' : current ? 'border-amber-300/70 bg-[#0d1117] ritmo-glow-pulse' : 'border-[#30363d] bg-[#0d1117] grayscale opacity-60'}`}
                    title={`${t.points} pontos: ${t.reward}`}
                  >
                    {t.emoji}
                    {t.done && <Check className="absolute -bottom-1 -right-1 w-4 h-4 p-0.5 rounded-full bg-amber-400 text-[#0d1117]" strokeWidth={3} />}
                    {!t.done && !current && <Lock className="absolute -bottom-1 -right-1 w-4 h-4 p-0.5 rounded-full bg-[#21262d] text-[#8b949e]" />}
                  </span>
                  <span className="mt-1 text-[10px] font-bold text-[#c9d1d9] tabular-nums">{t.points}</span>
                  <span className="text-[9px] text-amber-200/80">+{t.bonus}</span>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
      {pass.next && (
        <div className="mt-2 h-2 rounded-full bg-[#21262d] overflow-hidden">
          <div className="h-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all duration-700" style={{ width: `${Math.round(pass.progress * 100)}%` }} />
        </div>
      )}
      <p className="mt-2 text-[11px] text-[#6e7681]">Todo mês o passe recomeça. Degrau 5 e degrau 10 viram selo no seu perfil.</p>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/* Baú semanal                                                         */
/* ------------------------------------------------------------------ */

export const WeekChestCard: React.FC<{ chest: WeekChestView | null | undefined; onChanged: () => void; compact?: boolean }> = ({ chest, onChanged, compact }) => {
  const [busy, setBusy] = useState(false);
  const [won, setWon] = useState<number | null>(null);
  const [err, setErr] = useState('');
  if (!chest) return null;
  if (compact && !chest.ready && !won) return null;
  const open = async () => {
    setBusy(true);
    setErr('');
    const r = await callApi<{ xp?: number; error?: string }>('/api/xp', { action: 'open_week_chest' });
    setBusy(false);
    if (r.ok && r.data.xp) {
      setWon(r.data.xp);
      playFanfare(2);
      onChanged();
    } else setErr(r.data.error || 'Não foi possível abrir agora.');
  };
  const canStill = chest.need - chest.days <= chest.daysLeft;
  return (
    <section className={`relative overflow-hidden rounded-3xl border p-5 ${chest.ready ? 'border-violet-400/60 bg-gradient-to-br from-violet-500/20 via-[#161b22] to-[#0d1117]' : 'border-[#30363d] bg-[#161b22]'}`}>
      <div className="flex items-center gap-3">
        <span className={`text-4xl ${chest.ready ? 'ritmo-pop-pulse' : ''}`} aria-hidden="true">{chest.opened || won ? '🎉' : '🧰'}</span>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-[#f0f6fc]">Baú da semana</h3>
          <p className="text-xs text-[#8b949e]">
            {won || chest.opened
              ? `Aberto: +${won ?? chest.opened!.xp} pontos. Segunda tem outro!`
              : chest.ready
                ? 'Pronto! Você cumpriu as missões em 5 dias.'
                : canStill
                  ? `Cumpra as 3 missões em ${chest.need} dias da semana. Faltam ${chest.need - chest.days}.`
                  : 'Nesta semana não dá mais, mas segunda começa outra. Sem pressão!'}
          </p>
        </div>
        {chest.ready && !won && (
          <button type="button" onClick={open} disabled={busy} className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-violet-500 hover:bg-violet-400 text-white text-sm font-extrabold disabled:opacity-50">
            <Gift className="w-4 h-4" /> Abrir
          </button>
        )}
      </div>
      {!compact && (
        <div className="mt-3 flex gap-1.5" aria-label={`${chest.days} de ${chest.need} dias`}>
          {Array.from({ length: chest.need }, (_, i) => (
            <span key={i} className={`flex-1 h-2 rounded-full ${i < chest.days ? 'bg-violet-400' : 'bg-[#21262d]'}`} />
          ))}
        </div>
      )}
      {err && <p className="mt-2 text-xs text-amber-300">{err}</p>}
    </section>
  );
};

/* ------------------------------------------------------------------ */
/* Mascote                                                              */
/* ------------------------------------------------------------------ */

const MOOD: Record<MascotView['mood'], { bg: string; anim: string; face: string }> = {
  radiante: { bg: 'from-emerald-400/30', anim: 'animate-bounce', face: '✨' },
  tranquilo: { bg: 'from-teal-400/20', anim: '', face: '🙂' },
  com_sede: { bg: 'from-sky-400/20', anim: '', face: '💧' },
  dormindo: { bg: 'from-indigo-400/20', anim: 'opacity-70', face: '💤' },
};

export const MascotCard: React.FC<{ mascot: MascotView | null | undefined; compact?: boolean }> = ({ mascot, compact }) => {
  if (!mascot) return null;
  const m = MOOD[mascot.mood];
  return (
    <section className={`rounded-3xl border border-[#30363d] bg-gradient-to-br ${m.bg} via-[#161b22] to-[#0d1117] ${compact ? 'p-4' : 'p-5'}`}>
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <span className={`block ${compact ? 'text-5xl' : 'text-6xl'} ${m.anim}`} style={{ animationDuration: '2.4s' }} aria-hidden="true">{mascot.emoji}</span>
          <span className="absolute -top-1 -right-2 text-lg" aria-hidden="true">{m.face}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Rit · {mascot.name} ({mascot.stage}/{mascot.stages})</p>
          <p className="text-sm text-[#e6edf3] leading-snug">{mascot.message}</p>
          {mascot.next && (
            <>
              <div className="mt-2 h-1.5 rounded-full bg-black/30 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-400 to-lime-300 transition-all duration-700" style={{ width: `${Math.round(mascot.progress * 100)}%` }} />
              </div>
              <p className="mt-1 text-[11px] text-[#8b949e]">Vira {mascot.next.emoji} {mascot.next.name} em {mascot.next.missing} {mascot.next.missing === 1 ? 'dia ativo' : 'dias ativos'}.</p>
            </>
          )}
        </div>
      </div>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/* Ranking entre amigos                                                 */
/* ------------------------------------------------------------------ */

export const FriendsRankCard: React.FC<{ friends: FriendsView | null | undefined; onFind: () => void }> = ({ friends, onFind }) => {
  if (!friends) return null;
  const rows = friends.meRow ? [...friends.top, friends.meRow] : friends.top;
  return (
    <section className="rounded-3xl border border-sky-500/30 bg-gradient-to-br from-sky-500/10 via-[#161b22] to-[#0d1117] p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-bold text-[#f0f6fc] flex items-center gap-2"><Users className="w-5 h-5 text-sky-300" /> Amigos nesta semana</h3>
        {friends.following > 0 && <span className="text-sm font-black text-sky-300">{friends.rank}º de {friends.total}</span>}
      </div>
      {friends.following === 0 ? (
        <div className="mt-3 text-sm text-[#8b949e]">
          Siga pessoas no Feed e dispute a semana com elas.
          <button type="button" onClick={onFind} className="mt-3 w-full px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-bold">Achar pessoas no Feed</button>
        </div>
      ) : (
        <>
          {friends.gapToNext && friends.nextName && (
            <p className="mt-1 text-xs text-[#c9d1d9] flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-sky-300" /> Faltam <strong className="text-sky-200">{friends.gapToNext} pontos</strong> para passar {friends.nextName}.</p>
          )}
          {friends.rank === 1 && friends.total > 1 && <p className="mt-1 text-xs text-amber-200">👑 Você lidera a semana entre os amigos!</p>}
          <ol className="mt-3 space-y-1.5">
            {rows.map((r) => (
              <li key={r.userId}>
                <button
                  type="button"
                  onClick={() => !r.me && openProfile(r.userId)}
                  className={`w-full flex items-center gap-3 rounded-xl px-2.5 py-2 text-left ${r.me ? 'bg-sky-500/15 border border-sky-400/40' : 'hover:bg-white/5'}`}
                >
                  <span className={`w-6 text-center text-sm font-black tabular-nums ${r.rank === 1 ? 'text-amber-300' : r.rank === 2 ? 'text-slate-300' : r.rank === 3 ? 'text-orange-300' : 'text-[#8b949e]'}`}>
                    {r.rank <= 3 ? ['🥇', '🥈', '🥉'][r.rank - 1] : r.rank}
                  </span>
                  <LevelAvatar initials={r.initials || 'EU'} avatarUrl={r.avatarUrl} level={r.level} size="sm" />
                  <span className="flex-1 min-w-0 truncate text-sm font-semibold text-[#e6edf3]">{r.name}</span>
                  <span className="text-sm font-extrabold text-[#f0f6fc] tabular-nums">{r.xp}</span>
                </button>
              </li>
            ))}
          </ol>
          <p className="mt-2 text-[11px] text-[#6e7681]">Pontos de segunda a domingo. Recomeça toda segunda.</p>
        </>
      )}
    </section>
  );
};
