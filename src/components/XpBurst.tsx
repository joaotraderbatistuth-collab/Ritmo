import React, { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { Zap, Gift, Target, Volume2, VolumeX } from 'lucide-react';
import { DAILY_GOALS, DEFAULT_DAILY_GOAL, gainTone, normalizeGoal } from '../lib/rewards.js';

// Comemoração a cada ponto: número que sobe, faíscas, "plim" que sobe de tom no combo,
// vibração curtinha, bônus surpresa e meta do dia. Tudo desligável (som e vibração).

/* ------------------------------------------------------------------ */
/* Preferências (no aparelho): meta do dia e som/vibração              */
/* ------------------------------------------------------------------ */

interface FxPrefs {
  goal: number;
  sound: boolean;
}

const KEY = 'ritmo_fx_v1';
let prefs: FxPrefs = { goal: DEFAULT_DAILY_GOAL, sound: true };
let loaded = false;
const subs = new Set<() => void>();

function load() {
  if (loaded || typeof window === 'undefined') return;
  loaded = true;
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
    prefs = { goal: normalizeGoal(raw.goal), sound: raw.sound !== false };
  } catch {}
}

export function setFxPrefs(next: Partial<FxPrefs>) {
  load();
  prefs = { ...prefs, ...next, goal: normalizeGoal(next.goal ?? prefs.goal) };
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {}
  subs.forEach((f) => f());
}

export function getFxPrefs(): FxPrefs {
  load();
  return prefs;
}

export function useFxPrefs(): FxPrefs {
  return useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    () => getFxPrefs(),
    () => prefs
  );
}

/* ------------------------------------------------------------------ */
/* Som e vibração                                                       */
/* ------------------------------------------------------------------ */

let ctx: AudioContext | null = null;

export async function playGain(combo: number, lucky = false) {
  if (typeof window === 'undefined' || !getFxPrefs().sound) return;
  try {
    navigator.vibrate?.(lucky ? [30, 40, 30, 40, 80] : combo >= 3 ? [25, 30, 40] : [25]);
  } catch {}
  const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!AC) return;
  try {
    ctx ||= new AC();
    if (ctx!.state === 'suspended') await ctx!.resume();
    if (ctx!.state !== 'running') return;
    const c = ctx!;
    const master = c.createGain();
    master.gain.value = 0.35;
    master.connect(c.destination);
    const t0 = c.currentTime + 0.01;
    for (const n of gainTone(combo, lucky)) {
      const osc = c.createOscillator();
      const env = c.createGain();
      osc.type = 'sine';
      osc.frequency.value = n.freq;
      const start = t0 + n.at;
      env.gain.setValueAtTime(0.0001, start);
      env.gain.exponentialRampToValueAtTime(n.gain, start + 0.01);
      env.gain.exponentialRampToValueAtTime(0.0001, start + n.dur);
      osc.connect(env);
      env.connect(master);
      osc.start(start);
      osc.stop(start + n.dur + 0.05);
    }
  } catch {}
}

/* ------------------------------------------------------------------ */
/* A comemoração na tela                                               */
/* ------------------------------------------------------------------ */

export interface Burst {
  id: number;
  amount: number;
  combo: number;
  cheer: string;
  /** pontos do bônus surpresa que acabou de sair (já incluídos em amount) */
  lucky: number | null;
  near: string | null;
  /** progresso no nível depois de ganhar (0 a 1) */
  progress: number;
  levelLabel: string;
  todayXp: number;
  goal: number;
  goalJustHit: boolean;
  /** subiu de posição na temporada */
  rankUp?: string | null;
  /** conquista nova */
  medal?: string | null;
}

function useCountUp(target: number, key: number, ms = 650) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / ms);
      setV(Math.round(target * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, key, ms]);
  return v;
}

const SPARK_COLORS = ['#34d399', '#5eead4', '#fde68a', '#f59e0b', '#a78bfa'];

export const XpBurst: React.FC<{ burst: Burst | null }> = ({ burst }) => {
  const [visible, setVisible] = useState<Burst | null>(null);
  useEffect(() => {
    if (!burst || burst.amount <= 0) return;
    setVisible(burst);
    const t = setTimeout(() => setVisible((v) => (v?.id === burst.id ? null : v)), burst.lucky || burst.goalJustHit || burst.rankUp || burst.medal ? 4200 : 2800);
    return () => clearTimeout(t);
  }, [burst]);
  const shown = useCountUp(visible?.amount || 0, visible?.id || 0);
  const sparks = useMemo(() => {
    const n = visible?.lucky ? 22 : 12;
    return Array.from({ length: n }, (_, i) => ({
      id: i,
      color: SPARK_COLORS[i % SPARK_COLORS.length],
      dx: `${Math.round(Math.cos((i / n) * Math.PI * 2) * (55 + (i % 3) * 22))}px`,
      dy: `${Math.round(Math.sin((i / n) * Math.PI * 2) * (40 + (i % 4) * 18) - 20)}px`,
      delay: `${(i % 5) * 30}ms`,
    }));
  }, [visible?.id, visible?.lucky]);
  if (!visible) return null;
  const big = Boolean(visible.lucky) || visible.combo >= 3;

  return (
    <div key={visible.id} className="fixed z-[60] ritmo-above-nav-high right-4 sm:right-8 pointer-events-none ritmo-burst-in" style={visible.lucky || visible.goalJustHit || visible.rankUp || visible.medal ? { animationDuration: '4.2s' } : undefined} aria-live="polite">
      <div className="relative w-64 rounded-2xl border border-emerald-500/40 bg-[#0d1117]/95 backdrop-blur px-4 py-3 shadow-2xl shadow-emerald-500/20">
        {sparks.map((p) => (
          <span
            key={p.id}
            aria-hidden="true"
            className="absolute right-12 top-5 w-1.5 h-1.5 rounded-full ritmo-confetti"
            style={{ background: p.color, animationDelay: p.delay, ['--dx' as any]: p.dx, ['--dy' as any]: p.dy }}
          />
        ))}
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-bold text-[#f0f6fc]">{visible.cheer}</span>
          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-300 text-[#0d1117] font-extrabold ${big ? 'text-xl ritmo-pop-pulse' : 'text-lg'}`}>
            <Zap className="w-4 h-4 fill-[#0d1117]" />+{shown} XP
          </span>
        </div>
        {visible.combo >= 2 && (
          <p className="mt-1 text-xs font-extrabold text-amber-300 inline-flex items-center gap-1">
            <span aria-hidden="true">🔥</span> Combo x{visible.combo}
          </p>
        )}
        {visible.lucky ? (
          <p className="mt-1.5 text-xs font-bold text-fuchsia-300 inline-flex items-center gap-1 ritmo-pop-pulse">
            <Gift className="w-3.5 h-3.5" /> Bônus surpresa! +{visible.lucky} XP de presente
          </p>
        ) : null}
        <div className="mt-2">
          <div className="flex justify-between text-[10px] text-[#8b949e]">
            <span>{visible.levelLabel}</span>
            <span className="inline-flex items-center gap-0.5"><Target className="w-3 h-3" /> hoje {visible.todayXp}/{visible.goal}</span>
          </div>
          <div className="mt-1 h-1.5 rounded-full bg-[#21262d] overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-300 ritmo-bar-fill" style={{ width: `${Math.round(visible.progress * 100)}%` }} />
          </div>
          {visible.near && <p className="mt-1 text-[11px] font-semibold text-emerald-300">{visible.near}</p>}
          {visible.medal && <p className="mt-1 text-[11px] font-bold text-amber-200 ritmo-pop-pulse">{visible.medal}</p>}
          {visible.rankUp && <p className="mt-1 text-[11px] font-bold text-sky-300 ritmo-pop-pulse">🏆 {visible.rankUp}</p>}
          {visible.goalJustHit && <p className="mt-1 text-[11px] font-bold text-amber-300">🎯 Meta do dia batida! O que vier agora é extra.</p>}
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Anel da meta do dia (em volta da foto no cabeçalho)                 */
/* ------------------------------------------------------------------ */

export const GoalRing: React.FC<{ progress: number; size: number; children: React.ReactNode; title?: string }> = ({ progress, size, children, title }) => {
  const r = size / 2 - 1.5;
  const c = 2 * Math.PI * r;
  const done = progress >= 1;
  return (
    <span className="relative inline-flex" title={title}>
      {children}
      <svg aria-hidden="true" width={size} height={size} className="absolute pointer-events-none" style={{ left: '50%', top: '50%', transform: 'translate(-50%,-50%) rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#21262d" strokeWidth="2.5" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={done ? '#f59e0b' : '#10b981'}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.max(0, Math.min(1, progress)))}
          style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
        />
      </svg>
    </span>
  );
};

/* ------------------------------------------------------------------ */
/* Ajustes (aba Progresso)                                             */
/* ------------------------------------------------------------------ */

export const RewardSettings: React.FC<{ todayXp: number }> = ({ todayXp }) => {
  const p = useFxPrefs();
  const pct = Math.min(100, Math.round((todayXp / p.goal) * 100));
  return (
    <div className="rounded-2xl border border-[#30363d] bg-[#0d1117] p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#f0f6fc] inline-flex items-center gap-1.5"><Target className="w-4 h-4 text-emerald-400" /> Meta de pontos do dia</p>
          <p className="text-xs text-[#8b949e]">Hoje: {todayXp} de {p.goal} XP {todayXp >= p.goal ? '· batida! 🎯' : ''}</p>
        </div>
        <button
          type="button"
          onClick={() => setFxPrefs({ sound: !p.sound })}
          aria-pressed={p.sound}
          className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#30363d] text-xs text-[#c9d1d9]"
          title="Som e vibração ao ganhar pontos"
        >
          {p.sound ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />} {p.sound ? 'Som ligado' : 'Sem som'}
        </button>
      </div>
      <div className="mt-2 h-2 rounded-full bg-[#21262d] overflow-hidden">
        <div className={`h-full ${todayXp >= p.goal ? 'bg-amber-400' : 'bg-emerald-500'} transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {DAILY_GOALS.map((g) => (
          <button key={g} type="button" onClick={() => setFxPrefs({ goal: g })} className={`px-3 py-1 rounded-full text-xs font-semibold border ${p.goal === g ? 'bg-emerald-500 border-emerald-500 text-slate-950' : 'border-[#30363d] text-[#c9d1d9]'}`}>
            {g} XP{g === 30 ? ' · leve' : g === 120 ? ' · puxado' : ''}
          </button>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-[#6e7681]">De vez em quando uma ação vem com um <strong className="text-fuchsia-300">bônus surpresa</strong>. Faça várias coisas seguidas para montar um <strong className="text-amber-300">combo</strong>. Dia mais fraco? Tudo bem: amanhã a meta recomeça.</p>
    </div>
  );
};
