import React, { useEffect, useMemo, useState } from 'react';
import { ArrowUp, ArrowDown, Trophy, ChevronDown, ChevronUp, EyeOff, Eye, Share2, X, Sparkles, Users, CalendarClock, Target } from 'lucide-react';
import { LevelAvatar } from './LevelAvatar.js';
import { callApi } from '../lib/client-api.js';
import { openProfile, shareToFeed } from '../lib/share-feed.js';
import { DIVISIONS, TOP_TIER, division } from '../lib/season.js';

// Temporada mensal: divisão, ranking do grupo (visível para todos do grupo), metas da posição,
// comemoração do resultado do mês e botão flutuante com o progresso.

export interface SeasonRow {
  rank: number;
  userId: number;
  name: string;
  initials: string;
  avatarUrl: string | null;
  level: number;
  xp: number;
  me: boolean;
  zone: 'up' | 'stay' | 'down';
}

export interface SeasonView {
  month: string;
  label: string;
  endsAt: string;
  daysLeft: number;
  tier: number;
  division: { name: string; color: string; emoji: string; promotePct: number; relegatePct: number };
  cameFrom: 'up' | 'down' | 'stay' | 'new';
  prevRank: number | null;
  size: number;
  zones: { up: number; down: number };
  rank: number | null;
  zone: 'up' | 'stay' | 'down';
  points: number;
  goals: { toPromote: number | null; toSafety: number | null; next: { name: string; gap: number } | null };
  nudge: string;
  standings: SeasonRow[];
  history: { month: string; tier: number; name: string; xp: number }[];
}

const MONTH_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const monthShort = (m: string) => `${MONTH_SHORT[Number(m.slice(5, 7)) - 1]}/${m.slice(2, 4)}`;

/* ------------------------------------------------------------------ */
/* Cartão principal (aba Progresso)                                    */
/* ------------------------------------------------------------------ */

export const SeasonCard: React.FC<{ season: SeasonView | null | undefined; optedOut?: boolean; onChanged: () => void }> = ({ season, optedOut, onChanged }) => {
  const [showAll, setShowAll] = useState(false);
  const [howOpen, setHowOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const setOptOut = async (value: boolean) => {
    setBusy(true);
    await callApi('/api/xp', { action: 'league_opt_out', value });
    setBusy(false);
    onChanged();
  };

  if (optedOut) {
    return (
      <section className="rounded-3xl border border-[#30363d] bg-[#161b22] p-5 text-sm text-[#8b949e] flex flex-wrap items-center justify-between gap-3">
        <span>Você não está participando da temporada mensal.</span>
        <button type="button" disabled={busy} onClick={() => setOptOut(false)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold"><Eye className="w-3.5 h-3.5" /> Participar</button>
      </section>
    );
  }
  if (!season) {
    return <section className="rounded-3xl border border-[#30363d] bg-[#161b22] p-5 text-sm text-[#8b949e]">Carregando a temporada...</section>;
  }

  const s = season;
  const c = s.division.color;
  const top = s.tier >= TOP_TIER;
  const list = showAll ? s.standings : compactList(s.standings);
  const cutoff = s.zones.up > 0 ? s.standings[s.zones.up - 1]?.xp ?? 0 : 0;
  // barra: do zero até a linha de subida (ou até o líder, se já está na zona)
  const leader = s.standings[0]?.xp || 0;
  const target = s.zone === 'up' || top ? Math.max(leader, s.points, 1) : Math.max(cutoff + 1, 1);
  const pct = Math.min(100, Math.round((s.points / target) * 100));

  return (
    <section className="rounded-3xl border overflow-hidden" style={{ borderColor: `${c}66`, background: `linear-gradient(160deg, ${c}26 0%, #161b22 45%, #0d1117 100%)` }}>
      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <span className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shrink-0 shadow-lg" style={{ background: `${c}2e`, boxShadow: `0 0 24px ${c}40` }} aria-hidden="true">{s.division.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#8b949e]">{s.label}</p>
            <h2 className="text-2xl font-extrabold leading-tight" style={{ color: c }}>Divisão {s.division.name}</h2>
            <p className="mt-0.5 text-xs text-[#8b949e] flex flex-wrap items-center gap-x-3 gap-y-0.5">
              <span className="inline-flex items-center gap-1"><CalendarClock className="w-3.5 h-3.5" /> {s.daysLeft <= 1 ? 'Último dia da temporada!' : `Faltam ${s.daysLeft} dias`}</span>
              <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {s.size} no grupo</span>
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-4xl font-black tabular-nums text-[#f0f6fc] leading-none">{s.rank ? `${s.rank}º` : '–'}</p>
            <p className="text-[11px] text-[#8b949e] mt-1">{s.points.toLocaleString('pt-BR')} pts</p>
          </div>
        </div>

        <div className={`mt-4 rounded-2xl px-4 py-3 text-sm font-semibold flex items-start gap-2 ${s.zone === 'up' ? 'bg-emerald-500/15 text-emerald-200 border border-emerald-500/40' : s.zone === 'down' ? 'bg-amber-500/10 text-amber-200 border border-amber-500/40' : 'bg-[#0d1117] text-[#e6edf3] border border-[#30363d]'}`}>
          {s.zone === 'up' ? <ArrowUp className="w-4 h-4 mt-0.5 shrink-0" /> : s.zone === 'down' ? <Target className="w-4 h-4 mt-0.5 shrink-0" /> : <Sparkles className="w-4 h-4 mt-0.5 shrink-0" />}
          <span>{s.nudge}</span>
        </div>

        {!top && (
          <div className="mt-4">
            <div className="flex justify-between text-[11px] text-[#8b949e]">
              <span>Você: {s.points} pts</span>
              <span>{s.zone === 'up' ? `Líder: ${leader} pts` : `Linha de subida: ${cutoff + 1} pts`}</span>
            </div>
            <div className="mt-1 h-3 rounded-full bg-[#21262d] overflow-hidden">
              <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${c}, #34d399)` }} />
            </div>
            <p className="mt-1 text-[11px] text-[#6e7681]">Sobem os {s.zones.up} primeiros ({s.division.promotePct}%) para {division(s.tier + 1).name}{s.zones.down > 0 ? ` · descem os ${s.zones.down} últimos` : ''}.</p>
          </div>
        )}
      </div>

      {/* Ranking do grupo */}
      <div className="border-t border-[#30363d] bg-[#0d1117]/60 px-3 sm:px-5 py-4">
        <h3 className="px-2 text-sm font-bold text-[#f0f6fc] flex items-center gap-1.5"><Trophy className="w-4 h-4" style={{ color: c }} /> Ranking do seu grupo</h3>
        <ol className="mt-2 space-y-0.5">
          {list.map((r, i) =>
            r === null ? (
              <li key={`gap-${i}`} className="text-center text-[#6e7681] text-xs py-0.5">···</li>
            ) : (
              <React.Fragment key={r.userId}>
                {r.rank === s.zones.up + 1 && s.zones.up > 0 && !top && <ZoneLine label="linha de subida" color="#10b981" />}
                {s.zones.down > 0 && r.rank === s.size - s.zones.down + 1 && <ZoneLine label="zona de descida" color="#f59e0b" />}
                <li>
                  <button
                    type="button"
                    onClick={() => !r.me && openProfile(r.userId)}
                    className={`w-full flex items-center gap-3 rounded-xl px-2.5 py-1.5 text-left ${r.me ? 'bg-emerald-500/15 border border-emerald-500/40' : 'hover:bg-[#161b22]'}`}
                  >
                    <span className={`w-7 text-right text-sm font-black tabular-nums ${r.rank <= 3 ? 'text-amber-300' : r.zone === 'up' ? 'text-emerald-400' : r.zone === 'down' ? 'text-amber-400' : 'text-[#8b949e]'}`}>{r.rank <= 3 ? ['🥇', '🥈', '🥉'][r.rank - 1] : r.rank}</span>
                    <LevelAvatar initials={r.initials} avatarUrl={r.avatarUrl} level={r.level} size="xs" showLevel={false} />
                    <span className={`flex-1 min-w-0 truncate text-sm ${r.me ? 'font-bold text-[#f0f6fc]' : 'text-[#c9d1d9]'}`}>{r.me ? 'Você' : r.name} <span className="text-[10px] text-[#6e7681]">Nv {r.level}</span></span>
                    {r.zone === 'up' && <ArrowUp className="w-3.5 h-3.5 text-emerald-400" aria-label="sobe" />}
                    {r.zone === 'down' && <ArrowDown className="w-3.5 h-3.5 text-amber-400" aria-label="desce" />}
                    <span className="w-14 text-right text-sm font-bold tabular-nums text-[#f0f6fc]">{r.xp}</span>
                  </button>
                </li>
              </React.Fragment>
            )
          )}
        </ol>
        {s.standings.length > list.filter(Boolean).length && (
          <button type="button" onClick={() => setShowAll(true)} className="mt-2 w-full text-xs text-emerald-400 hover:underline">Ver o grupo inteiro ({s.size})</button>
        )}
        {s.size < 5 && <p className="mt-2 px-2 text-xs text-[#8b949e]">Seu grupo ainda está enchendo. Chame amigos pelo Indique e Ganhe e disputem juntos.</p>}
      </div>

      {/* Escada das divisões + como funciona */}
      <div className="border-t border-[#30363d] px-5 py-4">
        <div className="flex items-center gap-1 overflow-x-auto pb-1" aria-label="Divisões">
          {DIVISIONS.map((d) => (
            <div key={d.tier} className={`shrink-0 flex flex-col items-center px-2 py-1.5 rounded-xl ${d.tier === s.tier ? 'bg-[#21262d] ring-1' : 'opacity-60'}`} style={d.tier === s.tier ? { ['--tw-ring-color' as any]: d.color } : undefined} title={d.name}>
              <span className="text-xl" aria-hidden="true">{d.emoji}</span>
              <span className="text-[9px] font-bold" style={{ color: d.color }}>{d.name}</span>
              {d.tier === s.tier && <span className="text-[8px] text-[#8b949e]">você</span>}
            </div>
          ))}
        </div>
        {s.history.length > 1 && (
          <p className="mt-2 text-[11px] text-[#8b949e]">Suas temporadas: {s.history.slice(0, 6).map((h) => `${monthShort(h.month)} ${division(h.tier).emoji}`).join(' · ')}</p>
        )}
        <button type="button" onClick={() => setHowOpen((v) => !v)} className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#c9d1d9] hover:text-white">
          Como funciona {howOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
        {howOpen && (
          <div className="mt-2 text-xs text-[#8b949e] space-y-1.5">
            <p>Cada mês é uma temporada. Todo mundo começa no Bronze e soma os Pontos de Ritmo que ganhar no mês (hábitos, tarefas, foco, treino, diário...).</p>
            <p>Você disputa com um grupo de até 30 pessoas da mesma divisão. No fim do mês, os primeiros sobem e os últimos descem. Quem fica o mês sem pontos desce uma divisão.</p>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-0.5 pt-1">
              {DIVISIONS.map((d) => (
                <li key={d.tier}>{d.emoji} {d.name}: {d.promote > 0 ? `sobem ${Math.round(d.promote * 100)}%` : 'o topo'}{d.relegate > 0 ? `, descem ${Math.round(d.relegate * 100)}%` : ''}</li>
              ))}
            </ul>
            <p>Seu nome, nível e pontos aparecem só no ranking do seu grupo. Nada de hábitos, finanças ou diário.</p>
          </div>
        )}
        <button type="button" disabled={busy} onClick={() => setOptOut(true)} className="mt-3 block text-[11px] text-[#6e7681] hover:text-[#c9d1d9]"><EyeOff className="w-3 h-3 inline mr-1" />Não quero participar da competição</button>
      </div>
    </section>
  );
};

/** Top 5 + quem está perto de você + os últimos lugares da zona, com "···" entre os trechos. */
function compactList(rows: SeasonRow[]): (SeasonRow | null)[] {
  if (rows.length <= 10) return rows;
  const meIdx = rows.findIndex((r) => r.me);
  const keep = new Set<number>();
  for (let i = 0; i < 5; i++) keep.add(i);
  for (let i = meIdx - 2; i <= meIdx + 2; i++) if (i >= 0 && i < rows.length) keep.add(i);
  keep.add(rows.length - 1);
  const out: (SeasonRow | null)[] = [];
  let last = -1;
  [...keep].sort((a, b) => a - b).forEach((i) => {
    if (i - last > 1) out.push(null);
    out.push(rows[i]);
    last = i;
  });
  return out;
}

const ZoneLine: React.FC<{ label: string; color: string }> = ({ label, color }) => (
  <li className="flex items-center gap-2 py-1 px-2" aria-hidden="true">
    <span className="flex-1 border-t border-dashed" style={{ borderColor: `${color}88` }} />
    <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color }}>{label}</span>
    <span className="flex-1 border-t border-dashed" style={{ borderColor: `${color}88` }} />
  </li>
);

/* ------------------------------------------------------------------ */
/* Resultado do mês (aparece uma vez no começo da temporada)           */
/* ------------------------------------------------------------------ */

const CONFETTI = ['#10b981', '#f59e0b', '#22d3ee', '#a855f7', '#f43f5e', '#fde68a'];

export const SeasonResultModal: React.FC<{ season: SeasonView | null | undefined; userId: number | null }> = ({ season, userId }) => {
  const [open, setOpen] = useState(false);
  const key = season && userId ? `ritmo_season_seen_${userId}_${season.month}` : '';
  useEffect(() => {
    if (!season || !key || season.cameFrom === 'new') return;
    try {
      if (!localStorage.getItem(key)) setOpen(true);
    } catch {}
  }, [key, season?.cameFrom]);
  const pieces = useMemo(() => Array.from({ length: 30 }, (_, i) => ({ i, color: CONFETTI[i % CONFETTI.length], dx: `${Math.round(Math.cos((i / 30) * 6.283) * (110 + (i % 5) * 25))}px`, dy: `${Math.round(Math.sin((i / 30) * 6.283) * (110 + (i % 4) * 28))}px`, delay: `${(i % 7) * 40}ms` })), []);
  if (!open || !season) return null;
  const close = () => {
    try { localStorage.setItem(key, '1'); } catch {}
    setOpen(false);
  };
  const up = season.cameFrom === 'up';
  const down = season.cameFrom === 'down';
  const d = season.division;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-labelledby="season-title">
      <div className="relative w-full max-w-sm rounded-3xl border bg-[#161b22] p-6 text-center ritmo-level-pop" style={{ borderColor: `${d.color}88` }}>
        <button type="button" onClick={close} aria-label="Fechar" className="absolute top-3 right-3 p-1.5 text-[#8b949e] hover:text-white"><X className="w-5 h-5" /></button>
        <div className="relative mx-auto w-fit mt-2">
          {up && pieces.map((p) => <span key={p.i} aria-hidden="true" className="absolute left-1/2 top-1/2 w-2 h-3 rounded-sm ritmo-confetti" style={{ background: p.color, animationDelay: p.delay, ['--dx' as any]: p.dx, ['--dy' as any]: p.dy }} />)}
          <span className="block text-7xl" aria-hidden="true">{d.emoji}</span>
        </div>
        <p className="mt-3 text-xs font-bold uppercase tracking-widest" style={{ color: d.color }}>{season.label} começou</p>
        <h2 id="season-title" className="mt-1 text-2xl font-extrabold text-[#f0f6fc]">{up ? `Você subiu para ${d.name}!` : down ? `Nova chance na ${d.name}` : `Você segue na ${d.name}`}</h2>
        <p className="mt-2 text-sm text-[#8b949e]">
          {season.prevRank ? `Você fechou o mês passado em ${season.prevRank}º lugar no seu grupo. ` : ''}
          {up ? 'Grupo novo, gente mais forte. Bora mostrar seu ritmo!' : down ? 'Temporada nova, placar zerado. Algumas ações por dia já colocam você de volta na disputa.' : 'Placar zerado para todo mundo. Este pode ser o mês da subida!'}
        </p>
        <div className="mt-5 flex flex-col gap-2">
          {up && (
            <button type="button" onClick={() => { shareToFeed({ type: 'divisao', tier: season.tier, name: d.name }); close(); }} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold">
              <Share2 className="w-4 h-4" /> Compartilhar no Feed
            </button>
          )}
          <button type="button" onClick={close} className="w-full px-4 py-2 rounded-xl text-sm text-[#c9d1d9] hover:text-white">Começar a temporada</button>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Botão flutuante do progresso                                        */
/* ------------------------------------------------------------------ */

export const ProgressFab: React.FC<{ season: SeasonView | null | undefined; todayXp: number; goal: number; levelProgress: number; onOpen: () => void; pulse?: number }> = ({ season, todayXp, goal, levelProgress, onOpen, pulse }) => {
  const [bump, setBump] = useState(false);
  useEffect(() => {
    if (!pulse) return;
    setBump(true);
    const t = setTimeout(() => setBump(false), 1400);
    return () => clearTimeout(t);
  }, [pulse]);
  const size = 58;
  const r = size / 2 - 3;
  const circ = 2 * Math.PI * r;
  const goalPct = Math.min(1, todayXp / Math.max(1, goal));
  const color = season?.division.color || '#10b981';
  const label = season?.rank ? `${season.rank}º` : `${Math.round(levelProgress * 100)}%`;
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Abrir progresso: ${season?.rank ? `${season.rank}º lugar na divisão ${season.division.name}, ` : ''}${todayXp} de ${goal} pontos hoje`}
      className={`fixed z-[45] right-4 ritmo-above-nav sm:right-6 rounded-full bg-[#0d1117] border border-[#30363d] shadow-xl shadow-black/40 flex items-center justify-center ${bump ? 'ritmo-pop-pulse' : ''}`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#21262d" strokeWidth="4" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={goalPct >= 1 ? '#f59e0b' : color} strokeWidth="4" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - goalPct)} style={{ transition: 'stroke-dashoffset 0.8s ease-out' }} />
      </svg>
      <span className="relative flex flex-col items-center leading-none">
        <span className="text-base" aria-hidden="true">{season?.division.emoji || '⚡'}</span>
        <span className="text-[11px] font-black text-[#f0f6fc] tabular-nums">{label}</span>
      </span>
      {season?.zone === 'up' && <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 text-[#0d1117] flex items-center justify-center" aria-hidden="true"><ArrowUp className="w-3 h-3" /></span>}
    </button>
  );
};
