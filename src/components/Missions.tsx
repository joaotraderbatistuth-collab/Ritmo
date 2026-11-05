import React, { useMemo, useState } from 'react';
import { Flame, Gift, Check, ChevronRight, Trophy, Lock, Sparkles, Share2, X, TrendingUp, TrendingDown, Moon, Crown, ArrowUp, ArrowDown, EyeOff, Eye } from 'lucide-react';
import { callApi } from '../lib/client-api.js';
import { shareToFeed } from '../lib/share-feed.js';
import { LevelAvatar } from './LevelAvatar.js';
import { LEAGUES, PROMOTE, DEMOTE } from '../lib/missions.js';
import type { XpData } from './LevelUp.js';

// Missões do dia + baú, ofensiva, resumo da semana e ligas.
// Fica no topo do Feed e da tela Hoje, para a pessoa ver todo dia o que falta.

export interface MissionView {
  id: string;
  title: string;
  goal: number;
  progress: number;
  done: boolean;
  tab: string;
}

export interface GameData {
  today?: string;
  missions?: MissionView[];
  chest?: { ready: boolean; opened: { reward: string; xp: number; label: string } | null; doneCount: number };
  streak?: { days: number; todayDone: boolean; weekRestUsed: boolean; extraRests: number; restDays: string[]; best: number; next: number | null };
  week?: WeekView;
  lastWeek?: WeekView;
  league?: LeagueView | null;
  leagueOptOut?: boolean;
}

interface WeekView {
  start: string;
  end: string;
  xp: number;
  activeDays: number;
  counts: Record<string, number>;
  bestDay: { day: string; xp: number } | null;
  vsPrevious: number | null;
}

interface LeagueView {
  week: string;
  endsAt: string;
  tier: number;
  name: string;
  promoted: 'up' | 'down' | null;
  size: number;
  standings: { rank: number; userId: number; name: string; initials: string; avatarUrl: string | null; level: number; xp: number; me: boolean }[];
}

const dm = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}`;
const WEEKDAY = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];
const weekdayOf = (d: string) => WEEKDAY[new Date(`${d}T12:00:00Z`).getUTCDay()];
const leagueColor = (tier: number) => LEAGUES[Math.min(Math.max(tier, 0), LEAGUES.length - 1)].color;

/* ------------------------------------------------------------------ */
/* Baú                                                                 */
/* ------------------------------------------------------------------ */

const ChestIcon: React.FC<{ state: 'locked' | 'ready' | 'open'; size?: number }> = ({ state, size = 56 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className={state === 'ready' ? 'animate-bounce' : ''}>
    <defs>
      <linearGradient id="bauWood" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={state === 'locked' ? '#4b5563' : '#b45309'} />
        <stop offset="1" stopColor={state === 'locked' ? '#374151' : '#78350f'} />
      </linearGradient>
    </defs>
    {state === 'ready' && <circle cx="32" cy="34" r="28" fill="#fbbf24" opacity="0.18" />}
    {state === 'open' ? (
      <>
        <path d="M10 26 L54 26 L50 14 L14 14 Z" fill="url(#bauWood)" stroke="#1f2937" strokeWidth="2" transform="rotate(-18 10 26)" />
        <circle cx="32" cy="27" r="7" fill="#fde68a" />
        <path d="M32 14 l2 6 6 2 -6 2 -2 6 -2 -6 -6 -2 6 -2z" fill="#fff7c2" />
      </>
    ) : (
      <path d="M10 28 Q10 14 32 14 Q54 14 54 28 Z" fill="url(#bauWood)" stroke="#1f2937" strokeWidth="2" />
    )}
    <rect x="10" y="28" width="44" height="24" rx="3" fill="url(#bauWood)" stroke="#1f2937" strokeWidth="2" />
    <rect x="10" y="28" width="44" height="5" fill={state === 'locked' ? '#6b7280' : '#f59e0b'} />
    <rect x="28" y="30" width="8" height="10" rx="2" fill={state === 'locked' ? '#9ca3af' : '#fcd34d'} stroke="#1f2937" strokeWidth="1.5" />
  </svg>
);

const ChestModal: React.FC<{ label: string; onClose: () => void }> = ({ label, onClose }) => (
  <div className="fixed inset-0 z-[80] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label="Baú aberto" onClick={onClose}>
    <div className="relative w-full max-w-xs rounded-3xl border border-amber-400/40 bg-[#161b22] p-6 text-center ritmo-level-pop" onClick={(e) => e.stopPropagation()}>
      {Array.from({ length: 22 }, (_, i) => (
        <span
          key={i}
          aria-hidden="true"
          className="absolute left-1/2 top-16 w-2 h-3 rounded-sm ritmo-confetti"
          style={{ background: ['#fbbf24', '#10b981', '#22d3ee', '#f43f5e', '#a855f7'][i % 5], animationDelay: `${(i % 6) * 50}ms`, ['--dx' as any]: `${Math.round(Math.cos((i / 22) * 6.28) * 130)}px`, ['--dy' as any]: `${Math.round(Math.sin((i / 22) * 6.28) * 120)}px` }}
        />
      ))}
      <div className="flex justify-center"><ChestIcon state="open" size={96} /></div>
      <p className="mt-3 text-xs font-bold uppercase tracking-widest text-amber-300">Baú aberto!</p>
      <p className="mt-1 text-xl font-extrabold text-[#f0f6fc]">{label}</p>
      <p className="mt-2 text-sm text-[#8b949e]">Missões cumpridas hoje. Volte amanhã: são 3 missões novas e outro baú.</p>
      <button type="button" onClick={onClose} className="mt-5 w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#0d1117] font-bold">Show!</button>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/* Cartão de missões (topo do Feed e da tela Hoje)                     */
/* ------------------------------------------------------------------ */

export const MissionsCard: React.FC<{ data: (XpData & GameData) | null; onGo: (tab: string) => void; onChanged: () => void; compact?: boolean }> = ({ data, onGo, onChanged, compact }) => {
  const [busy, setBusy] = useState(false);
  const [reward, setReward] = useState<string | null>(null);
  const [error, setError] = useState('');
  if (!data?.missions || !data.chest || !data.streak) {
    return <div className="rounded-2xl border border-[#30363d] bg-[#161b22] p-4 text-sm text-[#8b949e] mb-5">Carregando suas missões de hoje...</div>;
  }
  const { missions, chest, streak } = data;
  const state: 'locked' | 'ready' | 'open' = chest.opened ? 'open' : chest.ready ? 'ready' : 'locked';

  const open = async () => {
    setBusy(true);
    setError('');
    const r = await callApi<{ reward?: { label: string }; error?: string }>('/api/xp', { action: 'open_chest' });
    setBusy(false);
    if (r.ok && r.data.reward) {
      setReward(r.data.reward.label);
      onChanged();
    } else setError(r.data.error || 'Não foi possível abrir agora.');
  };

  return (
    <section className={`rounded-2xl border ${state === 'ready' ? 'border-amber-400/60 shadow-lg shadow-amber-500/10' : 'border-[#30363d]'} bg-gradient-to-br from-[#161b22] to-[#0d1117] p-4 sm:p-5 mb-5`} aria-label="Missões de hoje">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-extrabold text-[#f0f6fc]">Missões de hoje</h2>
          <span className="text-xs font-semibold text-[#8b949e]">{chest.doneCount}/3</span>
        </div>
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-sm font-extrabold ${streak.todayDone ? 'bg-orange-500/15 text-orange-300' : 'bg-[#21262d] text-[#8b949e]'}`} title={streak.todayDone ? 'Ofensiva garantida hoje' : 'Faça qualquer atividade hoje para manter a ofensiva'}>
          <Flame className={`w-4 h-4 ${streak.todayDone ? 'fill-orange-400 text-orange-400' : ''}`} />
          {streak.days} {streak.days === 1 ? 'dia' : 'dias'}
        </div>
      </div>

      <div className="mt-3 flex gap-4 items-stretch">
        <ul className="flex-1 min-w-0 space-y-2">
          {missions.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => !m.done && onGo(m.tab)}
                disabled={m.done}
                className={`w-full flex items-center gap-3 rounded-xl px-3 py-2 text-left border transition-colors ${m.done ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-[#30363d] bg-[#0d1117] hover:border-emerald-500/50'}`}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${m.done ? 'bg-emerald-500 text-[#0d1117]' : 'border-2 border-[#30363d]'}`}>{m.done && <Check className="w-4 h-4" strokeWidth={3} />}</span>
                <span className="flex-1 min-w-0">
                  <span className={`block text-sm leading-snug ${m.done ? 'text-emerald-300 line-through decoration-emerald-500/50' : 'text-[#f0f6fc]'}`}>{m.title}</span>
                  {m.goal > 1 && !m.done && (
                    <span className="mt-1 block h-1.5 rounded-full bg-[#21262d] overflow-hidden"><span className="block h-full bg-emerald-500" style={{ width: `${(m.progress / m.goal) * 100}%` }} /></span>
                  )}
                </span>
                {m.goal > 1 && !m.done && <span className="text-[11px] text-[#8b949e] tabular-nums">{m.progress}/{m.goal}</span>}
                {!m.done && <ChevronRight className="w-4 h-4 text-[#6e7681] shrink-0" />}
              </button>
            </li>
          ))}
        </ul>

        <div className="w-24 sm:w-28 shrink-0 flex flex-col items-center justify-center text-center rounded-xl border border-[#30363d] bg-[#0d1117] p-2">
          <ChestIcon state={state} size={compact ? 48 : 56} />
          {state === 'ready' && (
            <button type="button" onClick={open} disabled={busy} className="mt-1 w-full py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-[#0d1117] text-xs font-extrabold">
              {busy ? 'Abrindo...' : 'Abrir baú!'}
            </button>
          )}
          {state === 'locked' && <p className="mt-1 text-[11px] text-[#8b949e] leading-tight inline-flex items-center gap-1"><Lock className="w-3 h-3" /> Cumpra as 3</p>}
          {state === 'open' && <p className="mt-1 text-[11px] text-amber-300 leading-tight">{chest.opened!.label.replace(/ \(.*\)$/, '')}</p>}
        </div>
      </div>

      {error && <p role="alert" className="mt-2 text-xs text-rose-300">{error}</p>}

      {!compact && (
        <p className="mt-3 text-[11px] text-[#8b949e] flex flex-wrap gap-x-3 gap-y-1">
          <span className="inline-flex items-center gap-1"><Moon className="w-3 h-3" /> Descanso da semana: {streak.weekRestUsed ? 'já usado' : 'disponível'}{streak.extraRests ? ` (+${streak.extraRests} extra)` : ''}</span>
          {streak.next && <span>Próximo marco: {streak.next} dias</span>}
          {data.league && (
            <button type="button" onClick={() => onGo('progresso')} className="inline-flex items-center gap-1 hover:text-white">
              <Crown className="w-3 h-3" style={{ color: leagueColor(data.league.tier) }} /> Liga {data.league.name}: {data.league.standings.find((s) => s.me)?.rank ?? '-'}º lugar
            </button>
          )}
        </p>
      )}
      {reward && <ChestModal label={reward} onClose={() => setReward(null)} />}
    </section>
  );
};

/* ------------------------------------------------------------------ */
/* Ofensiva                                                            */
/* ------------------------------------------------------------------ */

export const StreakCard: React.FC<{ data: (XpData & GameData) | null }> = ({ data }) => {
  const s = data?.streak;
  if (!s) return null;
  const canShare = s.days >= 3;
  return (
    <section className="rounded-2xl border border-[#30363d] bg-[#161b22] p-5">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-orange-500/15 flex items-center justify-center"><Flame className={`w-9 h-9 ${s.todayDone ? 'fill-orange-400 text-orange-400' : 'text-orange-300/60'}`} /></div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-orange-300">Ofensiva</p>
          <p className="text-2xl font-extrabold text-[#f0f6fc]">{s.days} {s.days === 1 ? 'dia seguido' : 'dias seguidos'}</p>
          <p className="text-xs text-[#8b949e]">{s.todayDone ? 'Hoje já conta. ' : 'Faça qualquer atividade hoje para manter. '}Recorde: {s.best} dias.</p>
        </div>
        {canShare && (
          <button type="button" onClick={() => shareToFeed({ type: 'ofensiva', days: s.days })} className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#30363d] text-xs text-[#c9d1d9] hover:text-white"><Share2 className="w-3.5 h-3.5" /> Compartilhar</button>
        )}
      </div>
      <p className="mt-3 text-xs text-[#8b949e]">
        Todo dia em que você faz algo no Ritmo conta. Cada semana tem <strong className="text-[#c9d1d9]">1 dia de descanso grátis</strong> que não quebra a sequência{s.extraRests ? `, e você tem mais ${s.extraRests} guardado(s) do baú` : ''}. Constância sem culpa: um dia ruim não apaga o seu esforço.
      </p>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/* Resumo da semana                                                    */
/* ------------------------------------------------------------------ */

const COUNT_LABELS: [string, string, string][] = [
  ['habito', 'hábito marcado', 'hábitos marcados'],
  ['tarefa', 'tarefa concluída', 'tarefas concluídas'],
  ['foco', 'sessão de foco', 'sessões de foco'],
  ['treino', 'treino', 'treinos'],
  ['financas', 'lançamento', 'lançamentos'],
  ['diario', 'check-in no diário', 'check-ins no diário'],
];

export const WeekSummaryCard: React.FC<{ week: WeekView | undefined; title: string; onDismiss?: () => void; shareable?: boolean }> = ({ week, title, onDismiss, shareable }) => {
  if (!week) return null;
  const items = COUNT_LABELS.filter(([k]) => (week.counts[k] || 0) > 0).map(([k, one, many]) => `${week.counts[k]} ${week.counts[k] === 1 ? one : many}`);
  return (
    <section className="rounded-2xl border border-[#30363d] bg-[#161b22] p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">{title}</p>
          <p className="text-[11px] text-[#6e7681]">{dm(week.start)} a {dm(week.end)}</p>
        </div>
        {onDismiss && <button type="button" onClick={onDismiss} aria-label="Fechar resumo" className="p-1 text-[#6e7681] hover:text-white"><X className="w-4 h-4" /></button>}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-3">
        <div><p className="text-[11px] text-[#8b949e]">Pontos</p><p className="text-2xl font-extrabold text-[#f0f6fc] tabular-nums">{week.xp}</p></div>
        <div><p className="text-[11px] text-[#8b949e]">Dias ativos</p><p className="text-2xl font-extrabold text-[#f0f6fc] tabular-nums">{week.activeDays}<span className="text-sm text-[#8b949e]">/7</span></p></div>
        <div>
          <p className="text-[11px] text-[#8b949e]">vs. semana anterior</p>
          <p className={`text-2xl font-extrabold tabular-nums inline-flex items-center gap-1 ${week.vsPrevious === null ? 'text-[#8b949e]' : week.vsPrevious >= 0 ? 'text-emerald-400' : 'text-amber-300'}`}>
            {week.vsPrevious === null ? '—' : <>{week.vsPrevious >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}{Math.abs(week.vsPrevious)}%</>}
          </p>
        </div>
      </div>
      {items.length > 0 && <p className="mt-3 text-sm text-[#c9d1d9]">{items.join(' · ')}.</p>}
      {week.bestDay && <p className="mt-1 text-xs text-[#8b949e]">Seu melhor dia foi {weekdayOf(week.bestDay.day)}, com {week.bestDay.xp} pontos.</p>}
      {week.xp === 0 && <p className="mt-2 text-sm text-[#8b949e]">Semana tranquila. Tudo bem: recomeçar também é constância.</p>}
      {shareable && week.xp > 0 && (
        <button type="button" onClick={() => shareToFeed({ type: 'semana', xp: week.xp, activeDays: week.activeDays })} className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"><Share2 className="w-3.5 h-3.5" /> Compartilhar no Feed</button>
      )}
    </section>
  );
};

/** Aparece no topo do Feed na segunda e terça (até a pessoa fechar). */
export const LastWeekBanner: React.FC<{ data: (XpData & GameData) | null }> = ({ data }) => {
  const key = data?.lastWeek ? `ritmo_week_seen_${data.lastWeek.start}` : '';
  const [hidden, setHidden] = useState(() => {
    try {
      return key ? localStorage.getItem(key) === '1' : true;
    } catch {
      return false;
    }
  });
  const show = useMemo(() => {
    if (!data?.lastWeek || !data.today || hidden) return false;
    const wd = new Date(`${data.today}T12:00:00Z`).getUTCDay();
    return (wd === 1 || wd === 2) && data.lastWeek.xp > 0;
  }, [data, hidden]);
  if (!show) return null;
  return (
    <div className="mb-5">
      <WeekSummaryCard
        week={data!.lastWeek}
        title="Sua semana passada"
        shareable
        onDismiss={() => {
          try { localStorage.setItem(key, '1'); } catch {}
          setHidden(true);
        }}
      />
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Liga semanal                                                        */
/* ------------------------------------------------------------------ */

export const LeagueCard: React.FC<{ data: (XpData & GameData) | null; onChanged: () => void }> = ({ data, onChanged }) => {
  const [busy, setBusy] = useState(false);
  const setOptOut = async (value: boolean) => {
    setBusy(true);
    await callApi('/api/xp', { action: 'league_opt_out', value });
    setBusy(false);
    onChanged();
  };
  if (!data) return null;
  if (data.leagueOptOut) {
    return (
      <section className="rounded-2xl border border-[#30363d] bg-[#161b22] p-5 text-sm text-[#8b949e] flex items-center justify-between gap-3">
        <span>Você não está participando das ligas semanais.</span>
        <button type="button" disabled={busy} onClick={() => setOptOut(false)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold"><Eye className="w-3.5 h-3.5" /> Participar</button>
      </section>
    );
  }
  const lg = data.league;
  if (!lg) return null;
  const color = leagueColor(lg.tier);
  const top = lg.tier >= LEAGUES.length - 1;
  const daysLeft = Math.max(0, Math.round((Date.parse(`${lg.endsAt}T23:59:59Z`) - Date.parse(`${data.today}T12:00:00Z`)) / 86400_000));
  return (
    <section className="rounded-2xl border border-[#30363d] bg-[#161b22] p-5">
      <div className="flex items-start gap-3">
        <span className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}22` }}><Trophy className="w-7 h-7" style={{ color }} /></span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider" style={{ color }}>Liga {lg.name}</p>
          <p className="text-sm text-[#c9d1d9]">Os {PROMOTE} primeiros {top ? 'ficam no topo' : 'sobem de liga'}{lg.size >= 10 && lg.tier > 0 ? `; os ${DEMOTE} últimos descem` : ''}. Termina {daysLeft === 0 ? 'hoje à meia-noite' : `em ${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'}`}.</p>
          {lg.promoted === 'up' && <p className="mt-1 text-xs font-semibold text-emerald-400 inline-flex items-center gap-1"><ArrowUp className="w-3.5 h-3.5" /> Você subiu de liga na semana passada!</p>}
          {lg.promoted === 'down' && <p className="mt-1 text-xs text-amber-300 inline-flex items-center gap-1"><ArrowDown className="w-3.5 h-3.5" /> Você desceu de liga. Nova semana, nova chance.</p>}
        </div>
      </div>
      <ol className="mt-4 space-y-1">
        {lg.standings.map((r) => {
          const up = r.rank <= PROMOTE && r.xp > 0 && !top;
          const down = lg.size >= 10 && lg.tier > 0 && r.rank > lg.size - DEMOTE;
          return (
            <li key={r.userId} className={`flex items-center gap-3 rounded-xl px-3 py-1.5 ${r.me ? 'bg-emerald-500/15 border border-emerald-500/40' : ''}`}>
              <span className={`w-6 text-right text-sm font-bold tabular-nums ${up ? 'text-emerald-400' : down ? 'text-rose-300' : 'text-[#8b949e]'}`}>{r.rank}</span>
              <LevelAvatar initials={r.initials} avatarUrl={r.avatarUrl} level={r.level} size="xs" showLevel={false} />
              <span className={`flex-1 min-w-0 truncate text-sm ${r.me ? 'font-bold text-[#f0f6fc]' : 'text-[#c9d1d9]'}`}>{r.me ? 'Você' : r.name}</span>
              <span className="text-sm font-semibold tabular-nums text-[#f0f6fc]">{r.xp}</span>
            </li>
          );
        })}
      </ol>
      {lg.size < 3 && <p className="mt-3 text-xs text-[#8b949e] inline-flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" /> Seu grupo ainda está enchendo. Convide amigos pelo Indique e Ganhe.</p>}
      <button type="button" disabled={busy} onClick={() => setOptOut(true)} className="mt-3 inline-flex items-center gap-1 text-[11px] text-[#6e7681] hover:text-[#c9d1d9]"><EyeOff className="w-3 h-3" /> Não quero participar das ligas</button>
    </section>
  );
};

export { Gift };
