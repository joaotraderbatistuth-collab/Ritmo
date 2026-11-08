import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Sparkles, Share2, X, Lock, Check, Zap, Flame } from 'lucide-react';
import { LevelAvatar } from './LevelAvatar.js';
import { FRAMES, LEVELS, LevelInfo, XP_RULES, XP_SOURCES, XpSource, levelDef } from '../lib/levels.js';
import { shareAchievement } from '../lib/share-feed.js';
import type { Medal } from '../lib/medals.js';
import type { GameData } from './Missions.js';
import type { SeasonView } from './Season.js';
import { Burst, GoalRing, RewardSettings, getFxPrefs, playGain, useFxPrefs } from './XpBurst.js';
import { cheerFor, goalProgress, nearNextLevel, nextCombo } from '../lib/rewards.js';

export interface XpData extends GameData {
  xp: number;
  todayXp: number;
  activeDays: number;
  breakdown: Record<XpSource, { count: number; xp: number }>;
  level: LevelInfo;
  avatarUrl: string | null;
  bio?: string;
  bonusXp?: number;
  luckyToday?: { hit: boolean; xp: number | null } | null;
  season?: SeasonView | null;
  comebackToday?: boolean;
}

/* ------------------------------------------------------------------ */
/* "+10 XP" subindo no canto da tela                                   */
/* ------------------------------------------------------------------ */

export const XpToast: React.FC<{ gain: { id: number; amount: number } | null }> = ({ gain }) => {
  if (!gain || gain.amount <= 0) return null;
  return (
    <div key={gain.id} className="fixed z-[60] bottom-24 right-5 sm:bottom-24 sm:right-8 pointer-events-none ritmo-xp-float" aria-live="polite">
      <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 text-[#0d1117] font-extrabold text-base shadow-lg shadow-emerald-500/30">
        <Zap className="w-4 h-4 fill-[#0d1117]" /> +{gain.amount} XP
      </span>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Subiu de nível!                                                     */
/* ------------------------------------------------------------------ */

const CONFETTI_COLORS = ['#10b981', '#f59e0b', '#22d3ee', '#a855f7', '#f43f5e', '#fde68a'];

export const LevelUpModal: React.FC<{
  info: LevelInfo | null;
  initials: string;
  avatarUrl?: string | null;
  onClose: () => void;
}> = ({ info, initials, avatarUrl, onClose }) => {
  const pieces = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        id: i,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        dx: `${Math.round(Math.cos((i / 28) * Math.PI * 2) * (120 + (i % 5) * 25))}px`,
        dy: `${Math.round(Math.sin((i / 28) * Math.PI * 2) * (120 + (i % 4) * 30))}px`,
        delay: `${(i % 7) * 40}ms`,
      })),
    [info?.level]
  );
  if (!info) return null;
  const def = levelDef(info.level);
  const prevFrame = info.level > 1 ? levelDef(info.level - 1).frame : def.frame;
  const newFrame = prevFrame !== def.frame;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" role="dialog" aria-modal="true" aria-labelledby="levelup-title">
      <div className="relative w-full max-w-sm rounded-3xl border border-[#30363d] bg-[#161b22] p-6 text-center ritmo-level-pop">
        <button type="button" onClick={onClose} aria-label="Fechar" className="absolute top-3 right-3 p-1.5 text-[#8b949e] hover:text-white"><X className="w-5 h-5" /></button>

        <div className="relative mx-auto w-fit mt-2">
          {pieces.map((p) => (
            <span
              key={p.id}
              className="absolute left-1/2 top-1/2 w-2 h-3 rounded-sm ritmo-confetti"
              style={{ background: p.color, animationDelay: p.delay, ['--dx' as any]: p.dx, ['--dy' as any]: p.dy }}
              aria-hidden="true"
            />
          ))}
          <LevelAvatar initials={initials} avatarUrl={avatarUrl} level={info.level} size="xl" />
        </div>

        <p className="mt-5 text-xs font-bold uppercase tracking-widest text-emerald-400 flex items-center justify-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Subiu de nível!</p>
        <h2 id="levelup-title" className="mt-1 text-2xl font-extrabold text-[#f0f6fc]">Nível {info.level} · {info.name}</h2>
        <p className="mt-2 text-sm text-[#8b949e]">
          Desbloqueado: <strong className="text-[#f0f6fc]">{def.unlock}</strong>
          {newFrame && <> — sua foto agora tem a moldura <strong className="text-[#f0f6fc]">{FRAMES[def.frame].name}</strong>.</>}
        </p>
        {info.nextName && <p className="mt-1 text-xs text-[#6e7681]">Próximo: {info.nextName}, faltam {info.xpToNext} pontos.</p>}

        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              shareAchievement({ type: 'nivel', level: info.level, name: info.name });
              onClose();
            }}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
          >
            <Share2 className="w-4 h-4" /> Compartilhar no Stories, WhatsApp ou Feed
          </button>
          <button type="button" onClick={onClose} className="w-full px-4 py-2 rounded-xl text-sm text-[#8b949e] hover:text-white">Continuar</button>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Barra pequena de nível (cabeçalho)                                  */
/* ------------------------------------------------------------------ */

export const LevelChip: React.FC<{ data: XpData | null; initials: string; name: string; onClick: () => void }> = ({ data, initials, name, onClick }) => {
  const info = data?.level;
  const fx = useFxPrefs();
  const goalPct = data ? Math.min(1, data.todayXp / fx.goal) : 0;
  return (
    <button
      type="button"
      onClick={onClick}
      title={info ? `Nível ${info.level} · ${info.name} — ${info.xp} pontos` : 'Seu nível'}
      className="flex items-center gap-2 p-0.5 sm:pl-1 sm:pr-3 sm:py-1 rounded-full sm:bg-[#161b22] sm:border border-[#30363d] hover:border-emerald-500/50 transition-colors"
    >
      <span className="relative inline-flex">
        <GoalRing progress={goalPct} size={42} title={data ? `Meta do dia: ${data.todayXp}/${fx.goal} XP` : undefined}>
          <LevelAvatar initials={initials} avatarUrl={data?.avatarUrl} level={info?.level || 1} size="sm" />
        </GoalRing>
        {data?.chest?.ready && <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-amber-400 border-2 border-[#0d1117] animate-pulse" title="Baú pronto para abrir" />}
      </span>
      {data?.streak && data.streak.days > 0 && (
        <span className={`hidden sm:inline-flex items-center gap-0.5 text-xs font-extrabold ${data.streak.todayDone ? 'text-orange-400' : 'text-[#8b949e]'}`} title={`Ofensiva: ${data.streak.days} dias`}>
          <Flame className={`w-3.5 h-3.5 ${data.streak.todayDone ? 'fill-orange-400' : ''}`} />{data.streak.days}
        </span>
      )}
      <span className="hidden sm:flex flex-col items-start leading-tight">
        <span className="text-xs font-semibold text-[#f0f6fc] max-w-[110px] truncate">{name}</span>
        <span className="text-[10px] font-bold text-emerald-400">{info ? `Nv ${info.level} · ${info.name}` : 'Nível...'}</span>
        <span className="mt-0.5 w-24 h-1 rounded-full bg-[#21262d] overflow-hidden">
          <span className="block h-full bg-gradient-to-r from-emerald-500 to-teal-300 transition-all duration-700" style={{ width: `${Math.round((info?.progress || 0) * 100)}%` }} />
        </span>
      </span>
    </button>
  );
};

/* ------------------------------------------------------------------ */
/* Cartão completo (aba Progresso)                                     */
/* ------------------------------------------------------------------ */

const SOURCE_HINT: Record<XpSource, string> = {
  habito: 'Hábitos & Saúde',
  habito_novo: 'Hábitos & Saúde',
  tarefa: 'Rotina & Tarefas',
  tarefa_nova: 'Rotina & Tarefas',
  foco: 'Sessões de Foco',
  treino: 'Treino (1 por dia)',
  constancia: 'Treino: vale treinar em dias diferentes',
  meta: 'Roteiro de Metas',
  marco: 'Roteiro de Metas',
  card: 'Quadros',
  lembrete_novo: 'Secretário',
  diario: 'Diário',
  revisao: 'Diário (revisão da semana)',
  financas: 'Finanças Pessoais',
  orcamento: 'Finanças Pessoais',
  post: 'Feed',
  comentario: 'Feed',
  curtida: 'Feed',
  seguir: 'Feed',
  perfil: 'Configurações → Seus gostos',
  desafio: 'Progresso → Desafios',
  convite: 'Compartilhe suas conquistas com o seu link',
};

export const LevelCard: React.FC<{ data: XpData | null; initials: string; onEditPhoto?: () => void }> = ({ data, initials, onEditPhoto }) => {
  if (!data) {
    return <div className="rounded-2xl border border-[#30363d] bg-[#161b22] p-5 text-sm text-[#8b949e]">Calculando seus Pontos de Ritmo...</div>;
  }
  const info = data.level;
  const pct = Math.round(info.progress * 100);
  return (
    <section className="rounded-2xl border border-[#30363d] bg-gradient-to-br from-[#161b22] to-[#0d1117] p-5 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-5">
        <div className="flex items-center gap-4">
          <LevelAvatar initials={initials} avatarUrl={data.avatarUrl} level={info.level} size="lg" />
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">Nível {info.level}</p>
            <h3 className="text-xl font-extrabold text-[#f0f6fc]">{info.name}</h3>
            <p className="text-xs text-[#8b949e]">Moldura {info.frame.name} · {data.activeDays} {data.activeDays === 1 ? 'dia ativo' : 'dias ativos'}</p>
            {onEditPhoto && <button type="button" onClick={onEditPhoto} className="mt-1 text-xs text-emerald-400 hover:underline">Trocar foto de perfil</button>}
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-bold text-[#f0f6fc]">{info.xp.toLocaleString('pt-BR')} pontos</span>
            <span className="text-xs text-[#8b949e]">{info.nextXp ? `faltam ${info.xpToNext.toLocaleString('pt-BR')} para ${info.nextName}` : 'Nível máximo!'}</span>
          </div>
          <div className="mt-2 h-3 rounded-full bg-[#21262d] overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-300 transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-xs text-[#8b949e]">Hoje: <strong className="text-emerald-400">+{data.todayXp}</strong> pontos</p>
        </div>
      </div>

      <RewardSettings todayXp={data.todayXp} />

      <div>
        <h4 className="text-sm font-semibold text-[#f0f6fc]">Como ganhar pontos</h4>
        <p className="text-xs text-[#8b949e] mb-2">Tudo no Ritmo vale ponto: o simples vale pouco, o que pede mais de você vale mais. No treino, ganha quem é constante: treinar em dias diferentes da semana rende mais do que treinar muito num dia só.</p>
        <div className="grid sm:grid-cols-2 gap-2">
          {XP_SOURCES.map((k) => (
            <div key={k} className="flex items-center justify-between gap-3 rounded-xl bg-[#0d1117] border border-[#21262d] px-3 py-2">
              <div className="min-w-0">
                <div className="text-sm text-[#e6edf3] truncate">{XP_RULES[k].label}</div>
                <div className="text-[11px] text-[#6e7681]">{SOURCE_HINT[k]} · {k === 'perfil' ? 'uma vez' : `até ${XP_RULES[k].dailyCap}x por dia`}</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-sm font-bold text-emerald-400">+{XP_RULES[k].display || XP_RULES[k].xp}</div>
                <div className="text-[11px] text-[#6e7681]">{data.breakdown[k]?.xp || 0} no total</div>
              </div>
            </div>
          ))}
        </div>
        {(data.bonusXp || 0) > 0 && <p className="mt-2 text-xs text-amber-300">+{data.bonusXp} pontos vieram dos baús das missões do dia.</p>}
        <p className="mt-2 text-[11px] text-[#6e7681]">Cada atividade tem um limite por dia: manter o ritmo vários dias vale mais do que exagerar num dia só.</p>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-[#f0f6fc] mb-2">Caminho dos níveis</h4>
        <ol className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {LEVELS.map((l) => {
            const reached = info.level >= l.level;
            const current = info.level === l.level;
            return (
              <li key={l.level} className={`flex flex-col items-center text-center gap-1 rounded-xl p-2 ${current ? 'bg-emerald-500/10 border border-emerald-500/40' : 'border border-transparent'}`}>
                <span className={reached ? '' : 'opacity-55'}>
                  <LevelAvatar initials={initials} avatarUrl={data.avatarUrl} level={l.level} size="md" />
                </span>
                <span className={`text-[11px] font-semibold leading-tight ${reached ? 'text-[#f0f6fc]' : 'text-[#6e7681]'}`}>{l.name}</span>
                <span className="text-[10px] text-[#6e7681] inline-flex items-center gap-0.5">
                  {reached ? <Check className="w-3 h-3 text-emerald-400" /> : <Lock className="w-3 h-3" />}
                  {l.minXp.toLocaleString('pt-BR')}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/* Lógica: busca os pontos, mostra "+XP" e o "subiu de nível"          */
/* ------------------------------------------------------------------ */

/** Primeira conquista nova desde a última vez (no mesmo uso do app). */
function newMedal(prev: XpData | null, next: XpData): string | null {
  if (!prev?.medals || !next.medals) return null;
  const had = new Set(prev.medals.filter((m) => m.earned).map((m) => m.id));
  const m = next.medals.find((x) => x.earned && !had.has(x.id));
  return m ? `${m.emoji} Nova conquista: ${m.name}!` : null;
}

/** "Subiu para 3º no grupo!" / "Entrou na zona de subida!" quando a posição melhora no mesmo mês. */
function rankMessage(prev: SeasonView | null | undefined, next: SeasonView | null | undefined): string | null {
  if (!prev || !next || prev.month !== next.month || !prev.rank || !next.rank) return null;
  if (next.zone === 'up' && prev.zone !== 'up') return `Entrou na zona de subida para a próxima divisão!`;
  if (prev.zone === 'down' && next.zone !== 'down') return 'Saiu da zona de descida!';
  if (next.rank < prev.rank) return `Você subiu para ${next.rank}º no grupo${next.rank === 1 ? ' — é o líder!' : '!'}`;
  return null;
}

export function useXp(userId: number | null, signature: string) {
  const [data, setData] = useState<XpData | null>(null);
  const [gain, setGain] = useState<{ id: number; amount: number } | null>(null);
  const [burst, setBurst] = useState<Burst | null>(null);
  const [rankPulse, setRankPulse] = useState(0);
  const [levelUp, setLevelUp] = useState<LevelInfo | null>(null);
  const [medalQueue, setMedalQueue] = useState<Medal[]>([]);
  const last = useRef<number | null>(null);
  const lastData = useRef<XpData | null>(null);
  const combo = useRef<{ count: number; at: number } | null>(null);
  const gains = useRef(0);

  const refresh = async () => {
    if (!userId) return;
    try {
      const res = await fetch('/api/xp');
      if (!res.ok) return;
      const d = (await res.json()) as XpData;
      if (typeof d?.xp !== 'number') return;
      setData(d);
      const prev = lastData.current;
      if (last.current !== null && d.xp > last.current) {
        const amount = d.xp - last.current;
        setGain({ id: Date.now(), amount });
        // comemoração: combo, bônus surpresa que acabou de sair, meta do dia e "quase lá"
        const now = Date.now();
        combo.current = nextCombo(combo.current, now);
        gains.current += 1;
        const luckyNow = d.luckyToday?.hit && !(prev?.luckyToday?.hit) && prev?.today === d.today ? d.luckyToday.xp : null;
        const goal = getFxPrefs().goal;
        const g = goalProgress(d.todayXp, goal, prev && prev.today === d.today ? prev.todayXp : null);
        setBurst({
          id: now,
          amount,
          combo: combo.current.count,
          cheer: luckyNow ? 'Que sorte!' : g.justHit ? 'Meta do dia!' : cheerFor(gains.current + userId, combo.current.count),
          lucky: luckyNow ?? null,
          near: d.level.level === prev?.level.level ? nearNextLevel(d.level) : null,
          progress: d.level.progress,
          levelLabel: `Nv ${d.level.level} · ${d.level.name}`,
          todayXp: d.todayXp,
          goal,
          goalJustHit: g.justHit,
          rankUp: rankMessage(prev?.season, d.season),
          medal: newMedal(prev, d),
        });
        if (rankMessage(prev?.season, d.season)) setRankPulse(now);
        playGain(combo.current.count, Boolean(luckyNow) || g.justHit);
      }
      last.current = d.xp;
      lastData.current = d;

      // "subiu de nível" só aparece quando o nível passa do último que a pessoa já viu neste aparelho
      const key = `ritmo_level_seen_${userId}`;
      let seen = 0;
      try { seen = Number(localStorage.getItem(key)) || 0; } catch {}
      if (seen && d.level.level > seen) setLevelUp(d.level);
      if (d.level.level > seen) {
        try { localStorage.setItem(key, String(d.level.level)); } catch {}
      }

      // "Conquista desbloqueada!": só as que a pessoa ainda não viu neste aparelho.
      // Na primeira vez em um aparelho, só anota as que já tem (sem enxurrada de comemorações).
      if (Array.isArray(d.medals)) {
        const mkey = `ritmo_medals_seen_${userId}`;
        const earned = d.medals.filter((m) => m.earned);
        let seenIds: string[] | null = null;
        try { seenIds = JSON.parse(localStorage.getItem(mkey) || 'null'); } catch {}
        if (Array.isArray(seenIds)) {
          const fresh = earned.filter((m) => !seenIds!.includes(m.id));
          if (fresh.length) setMedalQueue((q) => [...q, ...fresh.filter((m) => !q.some((x) => x.id === m.id))]);
        }
        if (!Array.isArray(seenIds) || earned.some((m) => !seenIds!.includes(m.id))) {
          try { localStorage.setItem(mkey, JSON.stringify(earned.map((m) => m.id))); } catch {}
        }
      }
    } catch {
      // sem conexão: tenta de novo na próxima ação
    }
  };

  useEffect(() => {
    last.current = null;
    lastData.current = null;
    combo.current = null;
    setData(null);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const t = setTimeout(refresh, 700);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, signature]);

  // Outras partes do app avisam que algo mudou (Feed, secretário, treino)
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    const h = () => {
      clearTimeout(t);
      t = setTimeout(() => refreshRef.current(), 600);
    };
    window.addEventListener('ritmo:xp-refresh', h);
    window.addEventListener('focus', h);
    return () => {
      clearTimeout(t);
      window.removeEventListener('ritmo:xp-refresh', h);
      window.removeEventListener('focus', h);
    };
  }, []);

  return { data, setData, gain, burst, rankPulse, levelUp, closeLevelUp: () => setLevelUp(null), medalQueue, nextMedal: () => setMedalQueue((q) => q.slice(1)), refresh };
}
