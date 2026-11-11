import React, { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { Activity, Bike, Footprints, Mountain, Play, Pause, Square, Trash2, X, Share2, Download, Satellite, Plus, Timer, Route as RouteIcon, TrendingUp, ChevronRight, ShieldCheck, Trophy, PauseCircle } from 'lucide-react';
import { RouteMap } from './RouteMap.js';
import { RouteSvg } from './RouteSvg.js';
import { callApi } from '../lib/client-api.js';
import { shareAchievement } from '../lib/share-feed.js';
import { postStory } from '../lib/stories-client.js';
import { cardFromAchievement } from '../lib/share-card.js';
import { FEED_ROUTE_MAX } from '../lib/feed-rules.js';
import * as rec from '../lib/workout-recorder.js';
import type { FinishedTrack } from '../lib/workout-recorder.js';
import {
  SPORTS,
  SPORT_IDS,
  SportId,
  Split,
  autoTitle,
  currentPace,
  decodePolyline,
  encodePolyline,
  formatDuration,
  formatKm,
  formatPace,
  paceSPerKm,
  simplifyTo,
  speedKmh,
  totals,
  trackStats,
  trimRoute,
  recordValueLabel,
  GPS_LIMITS,
} from '../lib/workout.js';
import type { RecordEntry } from '../lib/workout.js';
import { workoutImage } from '../lib/workout-share-image.js';
import { ConsentPrompt, useConsents } from './Consents.js';

const SPORT_ICON: Record<SportId, React.ComponentType<{ className?: string }>> = { corrida: Activity, caminhada: Footprints, bike: Bike, trilha: Mountain };

export interface SavedWorkout {
  id: number;
  sport: SportId;
  title: string;
  notes: string;
  startedAt: string;
  movingS: number;
  elapsedS: number;
  distanceM: number;
  elevationGainM: number | null;
  route: string;
  splits: Split[];
  source: 'gps' | 'manual';
}

function useRecorder() {
  return useSyncExternalStore(rec.subscribe, rec.getState, rec.getState);
}

/** Atualiza a tela a cada segundo (cronômetro). */
function useTick(active: boolean) {
  const [, setN] = useState(0);
  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => setN((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, [active]);
}

const Stat: React.FC<{ label: string; value: string; unit?: string; big?: boolean }> = ({ label, value, unit, big }) => (
  <div className="text-center">
    <div className={`font-extrabold tabular-nums text-[#f0f6fc] leading-none ${big ? 'text-5xl sm:text-6xl' : 'text-2xl sm:text-3xl'}`}>
      {value}
      {unit && <span className="text-sm font-semibold text-[#8b949e] ml-1">{unit}</span>}
    </div>
    <div className="mt-1 text-[11px] font-semibold uppercase tracking-wider text-[#8b949e]">{label}</div>
  </div>
);

const rateOf = (sport: SportId, meters: number, seconds: number) =>
  SPORTS[sport].usesPace ? { label: 'Ritmo médio', value: formatPace(paceSPerKm(meters, seconds)), unit: '/km' } : { label: 'Velocidade média', value: speedKmh(meters, seconds).toFixed(1).replace('.', ','), unit: 'km/h' };

const dateLabel = (iso: string) =>
  new Date(iso).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' }) + ' · ' + new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

/* ------------------------------------------------------------------ */
/* Parciais por km                                                     */
/* ------------------------------------------------------------------ */

const SplitsTable: React.FC<{ splits: Split[]; sport: SportId }> = ({ splits, sport }) => {
  if (!splits.length) return null;
  const paces = splits.map((s) => (s.meters > 0 ? s.seconds / (s.meters / 1000) : 0));
  const best = Math.min(...paces.filter((p) => p > 0));
  const worst = Math.max(...paces);
  return (
    <div>
      <h4 className="text-sm font-semibold text-[#f0f6fc] mb-2">Parciais</h4>
      <div className="space-y-1.5">
        {splits.map((s, i) => {
          const p = paces[i];
          const width = worst > 0 ? Math.max(18, Math.round((best / p) * 100)) : 0;
          return (
            <div key={s.km} className="flex items-center gap-3 text-sm">
              <span className="w-10 text-[#8b949e] tabular-nums">{s.meters < 1000 ? formatKm(s.meters, 2) : s.km}</span>
              <div className="flex-1 h-6 rounded-md bg-[#161b22] overflow-hidden">
                <div className={`h-full rounded-md ${p === best ? 'bg-emerald-500' : 'bg-emerald-500/50'}`} style={{ width: `${width}%` }} />
              </div>
              <span className="w-24 text-right tabular-nums text-[#f0f6fc]">
                {SPORTS[sport].usesPace ? `${formatPace(p)} /km` : `${(3600 / p).toFixed(1).replace('.', ',')} km/h`}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Treino gravando                                                     */
/* ------------------------------------------------------------------ */

const LiveView: React.FC<{ onFinished: (t: FinishedTrack) => void }> = ({ onFinished }) => {
  const s = useRecorder();
  useTick(s.status !== 'idle');
  const stats = useMemo(() => trackStats(s.segments), [s.segments]);
  const age = rec.fixAgeS(s);
  const lost = s.status === 'recording' && !s.gpsError && age !== null && age >= 10;
  const movingS = Math.round(rec.activeMsNow(s) / 1000);
  const sp = SPORTS[s.sport];
  const lastSeg = s.segments[s.segments.length - 1] || [];
  const curPace = s.status === 'recording' ? currentPace(lastSeg) : null;
  const avg = rateOf(s.sport, stats.distanceM, movingS);
  const Icon = SPORT_ICON[s.sport];
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-emerald-400 font-bold">
          <Icon className="w-5 h-5" /> {sp.label}
          {s.status === 'recording' ? (
            <span className="ml-1 inline-flex items-center gap-1.5 text-xs text-rose-300"><span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" /> Gravando</span>
          ) : (
            <span className="ml-1 text-xs text-amber-300">{s.autoPaused ? 'Pausa automática' : 'Pausado'}</span>
          )}
        </div>
        <GpsBadge acc={s.fix?.acc ?? null} error={s.gpsError} lostS={lost ? age : null} />
      </div>

      {s.notice && (
        <p className="text-xs text-sky-200 bg-sky-950/30 border border-sky-800/50 rounded-lg p-2.5 flex items-start gap-2">
          <span className="flex-1">{s.notice}</span>
          <button type="button" onClick={rec.clearNotice} aria-label="Fechar aviso" className="shrink-0 text-sky-300 hover:text-white"><X className="w-4 h-4" /></button>
        </p>
      )}
      {lost && <p className="text-xs text-rose-200 bg-rose-950/30 border border-rose-800/50 rounded-lg p-2.5">Sem sinal de GPS há {age} s. O cronômetro continua; quando o sinal voltar, a rota segue de onde você estiver. Se puder, vá para um lugar mais aberto.</p>}
      {s.autoPaused && (
        <p className="text-xs text-amber-200 bg-amber-950/30 border border-amber-800/50 rounded-lg p-2.5 flex items-center gap-2"><PauseCircle className="w-4 h-4 shrink-0" /> Você parou, então pausei o cronômetro. Ele volta sozinho quando você voltar a se mexer.</p>
      )}
            {s.recovered && <p className="text-xs text-amber-300 bg-amber-950/30 border border-amber-800/50 rounded-lg p-2.5">Recuperamos o treino que estava em andamento. Toque em Retomar para continuar.</p>}

      <div className="rounded-2xl border border-[#30363d] bg-[#161b22] p-5 space-y-5">
        <Stat label="Tempo" value={formatDuration(movingS)} big />
        <div className="grid grid-cols-3 gap-2">
          <Stat label="Distância" value={formatKm(stats.distanceM)} unit="km" />
          {sp.usesPace ? <Stat label="Ritmo atual" value={formatPace(curPace)} unit="/km" /> : <Stat label="Velocidade" value={curPace ? (3600 / curPace).toFixed(1).replace('.', ',') : '0,0'} unit="km/h" />}
          <Stat label={avg.label.replace(' médio', ' méd.').replace(' média', ' méd.')} value={avg.value} unit={avg.unit} />
        </div>
        {stats.elevationGainM !== null && <p className="text-center text-xs text-[#8b949e]">Subida acumulada: <strong className="text-[#f0f6fc]">{stats.elevationGainM} m</strong></p>}
      </div>

      {/* números primeiro (dá para ver correndo), mapa depois */}
      <RouteMap segments={s.segments} current={s.fix} live className="h-[34vh] min-h-[220px]" />

      <div className="flex items-center justify-center gap-4">
        {s.status === 'recording' ? (
          <button type="button" onClick={rec.pause} className="w-24 h-24 rounded-full bg-amber-500 hover:bg-amber-400 text-[#0d1117] font-bold flex flex-col items-center justify-center shadow-lg shadow-amber-500/20" aria-label="Pausar treino">
            <Pause className="w-8 h-8 fill-[#0d1117]" />
            <span className="text-xs">Pausar</span>
          </button>
        ) : (
          <>
            <button type="button" onClick={rec.resume} className="w-24 h-24 rounded-full bg-emerald-500 hover:bg-emerald-400 text-[#0d1117] font-bold flex flex-col items-center justify-center shadow-lg shadow-emerald-500/20" aria-label="Retomar treino">
              <Play className="w-8 h-8 fill-[#0d1117]" />
              <span className="text-xs">Retomar</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const t = rec.finish();
                if (t) onFinished(t);
              }}
              className="w-24 h-24 rounded-full bg-rose-500 hover:bg-rose-400 text-white font-bold flex flex-col items-center justify-center shadow-lg shadow-rose-500/20"
              aria-label="Finalizar treino"
            >
              <Square className="w-7 h-7 fill-white" />
              <span className="text-xs">Finalizar</span>
            </button>
          </>
        )}
      </div>
      {s.status === 'paused' && (
        <div className="text-center">
          {confirmDiscard ? (
            <span className="text-xs text-[#8b949e]">
              Apagar este treino sem salvar?{' '}
              <button type="button" onClick={rec.discard} className="text-rose-400 font-semibold underline">Sim, descartar</button>{' '}
              <button type="button" onClick={() => setConfirmDiscard(false)} className="underline">Não</button>
            </span>
          ) : (
            <button type="button" onClick={() => setConfirmDiscard(true)} className="text-xs text-[#6e7681] hover:text-rose-400 underline">Descartar treino</button>
          )}
        </div>
      )}
      <AutoPauseToggle on={s.autoPauseOn} />
      <label className="flex items-center justify-center gap-2 text-xs text-[#8b949e] cursor-pointer select-none">
        <input type="checkbox" checked={s.kmCueOn} onChange={(e) => rec.setKmCue(e.target.checked)} className="accent-emerald-500" />
        Avisar por voz e vibração a cada km
      </label>
      <p className="text-center text-[11px] text-[#6e7681]">Mantenha o Ritmo aberto e a tela ligada: no celular, o navegador pausa o GPS quando a tela apaga ou você troca de app.</p>
    </div>
  );
};

const AutoPauseToggle: React.FC<{ on: boolean }> = ({ on }) => (
  <label className="flex items-center justify-center gap-2 text-xs text-[#8b949e] cursor-pointer select-none">
    <input type="checkbox" checked={on} onChange={(e) => rec.setAutoPause(e.target.checked)} className="accent-emerald-500" />
    Pausa automática quando eu parar (semáforo, descanso)
  </label>
);

const GpsBadge: React.FC<{ acc: number | null; error: string | null; lostS?: number | null }> = ({ acc, error, lostS }) => {
  if (error) return <span className="text-xs text-rose-300 text-right max-w-[60%]">{error}</span>;
  if (lostS != null) return <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-300 whitespace-nowrap"><Satellite className="w-3.5 h-3.5 animate-pulse" /> Sem sinal</span>;
  if (acc == null) return <span className="inline-flex items-center gap-1.5 text-xs text-[#8b949e] whitespace-nowrap"><Satellite className="w-3.5 h-3.5 animate-pulse" /> Procurando GPS...</span>;
  const good = acc <= 15;
  const ok = acc <= GPS_LIMITS.maxAccuracyM;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap ${good ? 'text-emerald-400' : ok ? 'text-amber-300' : 'text-rose-300'}`}>
      <Satellite className="w-3.5 h-3.5" /> GPS {good ? 'bom' : ok ? 'razoável' : 'fraco'} (±{Math.round(acc)} m)
    </span>
  );
};

/* ------------------------------------------------------------------ */
/* Resumo antes de salvar                                              */
/* ------------------------------------------------------------------ */

const SummaryView: React.FC<{ track: FinishedTrack; onSaved: (w: SavedWorkout, recs?: RecordEntry[]) => void; onDiscard: () => void }> = ({ track, onSaved, onDiscard }) => {
  const stats = useMemo(() => trackStats(track.segments), [track]);
  const [title, setTitle] = useState(autoTitle(track.sport, new Date(track.startedAt)));
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const avg = rateOf(track.sport, stats.distanceM, track.movingS);
  const tooShort = track.movingS < 60;

  const save = async () => {
    setBusy(true);
    setError('');
    const all = track.segments.flat();
    const route = encodePolyline(simplifyTo(all, 4000));
    const r = await callApi<{ workout?: SavedWorkout; records?: RecordEntry[]; error?: string }>('/api/workouts', {
      action: 'create',
      workout: { sport: track.sport, title, notes, startedAt: new Date(track.startedAt).toISOString(), movingS: track.movingS, elapsedS: Math.max(track.elapsedS, track.movingS), distanceM: stats.distanceM, elevationGainM: stats.elevationGainM, route, splits: stats.splits, source: 'gps' },
    });
    setBusy(false);
    if (r.ok && r.data.workout) {
      const w = r.data.workout;
      postStory(cardFromAchievement({ type: 'treino', sport: w.sport, distanceM: w.distanceM, durationS: w.movingS }), true);
      onSaved(w, r.data.records || []);
    }
    else setError(r.data.error || 'Não foi possível salvar o treino.');
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-extrabold text-[#f0f6fc]">Treino concluído!</h3>
      <RouteMap segments={track.segments} className="h-64" />
      <div className="rounded-2xl border border-[#30363d] bg-[#161b22] p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Stat label="Distância" value={formatKm(stats.distanceM)} unit="km" />
        <Stat label="Tempo" value={formatDuration(track.movingS)} />
        <Stat label={avg.label} value={avg.value} unit={avg.unit} />
        <Stat label="Subida" value={stats.elevationGainM === null ? '—' : String(stats.elevationGainM)} unit={stats.elevationGainM === null ? undefined : 'm'} />
      </div>
      <SplitsTable splits={stats.splits} sport={track.sport} />
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-[#f0f6fc]" htmlFor="treino-titulo">Título</label>
        <input id="treino-titulo" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-[#f0f6fc] focus:outline-none focus:border-emerald-500" />
        <label className="block text-sm font-semibold text-[#f0f6fc]" htmlFor="treino-notas">Como foi? (opcional)</label>
        <textarea id="treino-notas" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} rows={2} className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-[#f0f6fc] focus:outline-none focus:border-emerald-500 resize-none" />
      </div>
      {tooShort && <p className="text-sm text-amber-300">O treino precisa ter pelo menos 1 minuto para ser salvo.</p>}
      {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
      <div className="flex gap-3">
        <button type="button" onClick={save} disabled={busy || tooShort} className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold">{busy ? 'Salvando...' : 'Salvar treino'}</button>
        <button type="button" onClick={() => confirm('Descartar este treino? Ele não será salvo.') && onDiscard()} className="px-4 py-3 rounded-xl border border-[#30363d] text-[#8b949e] hover:text-rose-400">Descartar</button>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Detalhe de um treino salvo                                          */
/* ------------------------------------------------------------------ */

const WorkoutDetail: React.FC<{ id: number; onClose: () => void; onDeleted: () => void; onUpdated?: () => void }> = ({ id, onClose, onDeleted, onUpdated }) => {
  const [w, setW] = useState<SavedWorkout | null>(null);
  const [editing, setEditing] = useState(false);
  const [eTitle, setETitle] = useState('');
  const [eWhen, setEWhen] = useState('');
  const [eNotes, setENotes] = useState('');
  const [error, setError] = useState('');
  const [hideEnds, setHideEnds] = useState(true);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    callApi<{ workout?: SavedWorkout; error?: string }>(`/api/workouts?id=${id}`).then((r) => (r.ok && r.data.workout ? setW(r.data.workout) : setError(r.data.error || 'Não foi possível abrir o treino.')));
  }, [id]);

  const points = useMemo(() => (w ? decodePolyline(w.route) : []), [w]);
  const sharePoints = useMemo(() => (hideEnds ? trimRoute(points, 200) : points), [points, hideEnds]);

  const toFeed = () => {
    if (!w) return;
    let route = encodePolyline(simplifyTo(sharePoints, 250));
    if (route.length > FEED_ROUTE_MAX) route = encodePolyline(simplifyTo(sharePoints, 120));
    shareAchievement({ type: 'treino', sport: w.sport, distanceM: w.distanceM, durationS: w.movingS, ...(w.elevationGainM ? { elevationGainM: w.elevationGainM } : {}), ...(route && route.length <= FEED_ROUTE_MAX ? { route } : {}) });
    onClose();
  };

  const toImage = async () => {
    if (!w) return;
    try {
      const blob = await workoutImage({ ...w, points: simplifyTo(sharePoints, 1500) });
      const file = new File([blob], `treino-ritmo-${w.id}.png`, { type: 'image/png' });
      const nav = navigator as any;
      if (nav.canShare?.({ files: [file] })) {
        await nav.share({ files: [file], title: w.title });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
        setMsg('Imagem baixada. Agora é só postar no Stories ou no WhatsApp.');
      }
    } catch (e: any) {
      if (e?.name !== 'AbortError') setMsg('Não foi possível gerar a imagem.');
    }
  };

  const startEdit = () => {
    if (!w) return;
    const d = new Date(w.startedAt);
    const p2 = (n: number) => String(n).padStart(2, '0');
    setETitle(w.title);
    setEWhen(`${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}T${p2(d.getHours())}:${p2(d.getMinutes())}`);
    setENotes(w.notes || '');
    setEditing(true);
    setMsg('');
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    const at = new Date(eWhen);
    if (Number.isNaN(at.getTime())) return setMsg('Escolha a data e a hora.');
    const r = await callApi<{ workout?: SavedWorkout; error?: string }>('/api/workouts', { action: 'update', id, title: eTitle, notes: eNotes, startedAt: at.toISOString() });
    if (!r.ok || !r.data.workout) return setMsg(r.data.error || 'Não foi possível salvar.');
    setW((cur) => (cur ? { ...cur, title: r.data.workout!.title, notes: r.data.workout!.notes, startedAt: r.data.workout!.startedAt } : cur));
    setEditing(false);
    setMsg('Treino atualizado.');
    onUpdated?.();
  };

  const del = async () => {
    if (!confirm('Apagar este treino? Não dá para desfazer.')) return;
    const r = await callApi('/api/workouts', { action: 'delete', id });
    if (r.ok) onDeleted();
    else setMsg((r.data as any).error || 'Não foi possível apagar.');
  };

  const avg = w ? rateOf(w.sport, w.distanceM, w.movingS) : null;
  const Icon = w ? SPORT_ICON[w.sport] : Activity;

  return (
    <div className="fixed inset-0 z-[55] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Detalhes do treino" onClick={(e) => e.stopPropagation()} className="w-full sm:max-w-2xl max-h-[94vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-[#30363d] bg-[#0d1117] p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            {w && <p className="text-xs font-bold text-emerald-400 inline-flex items-center gap-1.5"><Icon className="w-4 h-4" /> {SPORTS[w.sport].label}</p>}
            <h3 className="text-xl font-extrabold text-[#f0f6fc]">{w?.title || 'Treino'}</h3>
            {w && (
              <p className="text-xs text-[#8b949e]">
                {dateLabel(w.startedAt)}
                {!editing && <button type="button" onClick={startEdit} className="ml-2 text-emerald-400 hover:underline">Editar</button>}
              </p>
            )}
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" className="p-2 rounded-full text-[#8b949e] hover:text-white hover:bg-[#21262d]"><X className="w-5 h-5" /></button>
        </div>
        {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
        {!w && !error && <p className="text-sm text-[#8b949e]">Carregando...</p>}
        {w && editing && (
          <form onSubmit={saveEdit} className="rounded-2xl border border-[#30363d] bg-[#161b22] p-4 space-y-2">
            <label className="block text-xs text-[#8b949e]">Título<input value={eTitle} onChange={(e) => setETitle(e.target.value)} maxLength={80} required className="mt-1 w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-[#f0f6fc]" /></label>
            <label className="block text-xs text-[#8b949e]">Data e hora de início<input type="datetime-local" value={eWhen} onChange={(e) => setEWhen(e.target.value)} required className="mt-1 w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-[#f0f6fc] [color-scheme:dark]" /></label>
            <label className="block text-xs text-[#8b949e]">Notas<textarea value={eNotes} onChange={(e) => setENotes(e.target.value)} rows={2} maxLength={1000} className="mt-1 w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-[#f0f6fc]" /></label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setEditing(false)} className="flex-1 py-2 rounded-lg border border-[#30363d] text-sm text-[#c9d1d9]">Cancelar</button>
              <button type="submit" className="flex-1 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold">Salvar</button>
            </div>
          </form>
        )}
        {w && avg && (
          <>
            {points.length > 1 ? <RouteMap segments={[points]} className="h-64" /> : <div className="rounded-2xl border border-dashed border-[#30363d] p-6 text-center text-sm text-[#6e7681]">Treino registrado sem GPS.</div>}
            <div className="rounded-2xl border border-[#30363d] bg-[#161b22] p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Stat label="Distância" value={formatKm(w.distanceM)} unit="km" />
              <Stat label="Tempo" value={formatDuration(w.movingS)} />
              <Stat label={avg.label} value={avg.value} unit={avg.unit} />
              <Stat label="Subida" value={w.elevationGainM == null ? '—' : String(w.elevationGainM)} unit={w.elevationGainM == null ? undefined : 'm'} />
            </div>
            {w.elapsedS > w.movingS + 60 && <p className="text-xs text-[#8b949e]">Tempo total com pausas: {formatDuration(w.elapsedS)}</p>}
            {w.notes && <p className="text-sm text-[#c9d1d9] whitespace-pre-wrap">{w.notes}</p>}
            <SplitsTable splits={w.splits} sport={w.sport} />

            <div className="rounded-2xl border border-[#30363d] bg-[#161b22] p-4 space-y-3">
              <h4 className="text-sm font-semibold text-[#f0f6fc]">Compartilhar</h4>
              {points.length > 1 && (
                <label className="flex items-start gap-2 text-sm text-[#c9d1d9] cursor-pointer">
                  <input type="checkbox" checked={hideEnds} onChange={(e) => setHideEnds(e.target.checked)} className="mt-0.5 accent-emerald-500" />
                  <span>
                    <span className="inline-flex items-center gap-1 font-semibold"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Esconder o começo e o fim (200 m)</span>
                    <span className="block text-xs text-[#8b949e]">Assim ninguém descobre onde você mora ou trabalha pela rota.</span>
                  </span>
                </label>
              )}
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={toFeed} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold"><Share2 className="w-4 h-4" /> Compartilhar</button>
                <button type="button" onClick={toImage} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-[#30363d] text-sm text-[#c9d1d9] hover:bg-[#21262d]"><Download className="w-4 h-4" /> Imagem para Stories/WhatsApp</button>
              </div>
              {msg && <p className="text-xs text-emerald-400">{msg}</p>}
            </div>
            <button type="button" onClick={del} className="inline-flex items-center gap-1.5 text-xs text-[#6e7681] hover:text-rose-400"><Trash2 className="w-3.5 h-3.5" /> Apagar treino</button>
          </>
        )}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Lançar treino sem GPS (esteira, bike ergométrica...)                */
/* ------------------------------------------------------------------ */

const ManualForm: React.FC<{ onClose: () => void; onSaved: (w: SavedWorkout, recs?: RecordEntry[]) => void }> = ({ onClose, onSaved }) => {
  const [sport, setSport] = useState<SportId>('corrida');
  const [km, setKm] = useState('');
  const [h, setH] = useState('0');
  const [m, setM] = useState('30');
  const [s, setS] = useState('0');
  const [when, setWhen] = useState(() => {
    const d = new Date(Date.now() - 3600_000);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  });
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    const distanceM = Math.round(Number(km.replace(',', '.')) * 1000);
    const movingS = Number(h) * 3600 + Number(m) * 60 + Number(s);
    if (!Number.isFinite(distanceM) || distanceM < 0) return setError('Informe a distância em km (pode ser 0 para treinos sem distância).');
    setBusy(true);
    setError('');
    const started = new Date(when);
    const r = await callApi<{ workout?: SavedWorkout; records?: RecordEntry[]; error?: string }>('/api/workouts', {
      action: 'create',
      workout: { sport, title: title || autoTitle(sport, started), notes: '', startedAt: started.toISOString(), movingS, elapsedS: movingS, distanceM, elevationGainM: null, route: '', splits: [], source: 'manual' },
    });
    setBusy(false);
    if (r.ok && r.data.workout) {
      const w = r.data.workout;
      postStory(cardFromAchievement({ type: 'treino', sport: w.sport, distanceM: w.distanceM, durationS: w.movingS }), true);
      onSaved(w, r.data.records || []);
    }
    else setError(r.data.error || 'Não foi possível salvar.');
  };

  const field = 'bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-[#f0f6fc] focus:outline-none focus:border-emerald-500';
  return (
    <div className="fixed inset-0 z-[55] bg-black/70 flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Registrar treino sem GPS" onClick={(e) => e.stopPropagation()} className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border border-[#30363d] bg-[#161b22] p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-[#f0f6fc]">Registrar treino sem GPS</h3>
          <button type="button" onClick={onClose} aria-label="Fechar" className="p-1.5 text-[#8b949e] hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-xs text-[#8b949e]">Para esteira, bike ergométrica ou quando esqueceu de ligar o GPS.</p>
        <div className="grid grid-cols-4 gap-2">
          {SPORT_IDS.map((id) => {
            const I = SPORT_ICON[id];
            return (
              <button key={id} type="button" onClick={() => setSport(id)} className={`flex flex-col items-center gap-1 py-2 rounded-lg border text-xs ${sport === id ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300' : 'border-[#30363d] text-[#8b949e]'}`}>
                <I className="w-4 h-4" /> {SPORTS[id].label}
              </button>
            );
          })}
        </div>
        <label className="block text-xs text-[#8b949e]">Distância (km)<input inputMode="decimal" value={km} onChange={(e) => setKm(e.target.value)} placeholder="5,0" className={`${field} w-full mt-1`} /></label>
        <div className="text-xs text-[#8b949e]">Tempo
          <div className="grid grid-cols-3 gap-2 mt-1">
            <label className="flex items-center gap-1"><input inputMode="numeric" value={h} onChange={(e) => setH(e.target.value.replace(/\D/g, ''))} className={`${field} w-full`} aria-label="Horas" /> h</label>
            <label className="flex items-center gap-1"><input inputMode="numeric" value={m} onChange={(e) => setM(e.target.value.replace(/\D/g, ''))} className={`${field} w-full`} aria-label="Minutos" /> min</label>
            <label className="flex items-center gap-1"><input inputMode="numeric" value={s} onChange={(e) => setS(e.target.value.replace(/\D/g, ''))} className={`${field} w-full`} aria-label="Segundos" /> s</label>
          </div>
        </div>
        <label className="block text-xs text-[#8b949e]">Quando<input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className={`${field} w-full mt-1`} /></label>
        <label className="block text-xs text-[#8b949e]">Título (opcional)<input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} className={`${field} w-full mt-1`} /></label>
        {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
        <button type="button" onClick={save} disabled={busy} className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold">{busy ? 'Salvando...' : 'Salvar treino'}</button>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Recordes pessoais                                                   */
/* ------------------------------------------------------------------ */

const RecordsCard: React.FC<{ records: RecordEntry[]; onOpen: (id: number) => void }> = ({ records, onOpen }) => {
  const sports = SPORT_IDS.filter((id) => records.some((r) => r.sport === id));
  const [sport, setSport] = useState<SportId>(sports[0]);
  const cur = sports.includes(sport) ? sport : sports[0];
  const ORDER = ['dist', 'tempo', 'km', 'pace1k', 'pace5k', 'pace10k', 'veloc'];
  const list = records.filter((r) => r.sport === cur).sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind));
  return (
    <section className="rounded-2xl border border-[#30363d] bg-[#161b22] p-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-semibold text-[#f0f6fc] inline-flex items-center gap-2"><Trophy className="w-4 h-4 text-amber-300" /> Seus recordes</h3>
        {sports.length > 1 && (
          <div className="flex gap-1">
            {sports.map((id) => (
              <button key={id} type="button" onClick={() => setSport(id)} className={`px-2.5 py-1 rounded-full text-xs font-semibold ${cur === id ? 'bg-emerald-500/20 text-emerald-300' : 'text-[#8b949e] hover:text-white'}`}>{SPORTS[id].label}</button>
            ))}
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {list.map((r) => (
          <button key={r.kind} type="button" onClick={() => onOpen(r.workoutId)} className="text-left rounded-xl border border-[#21262d] bg-[#0d1117] hover:border-amber-400/40 p-3">
            <p className="text-[11px] text-[#8b949e]">{r.label}</p>
            <p className="text-lg font-extrabold text-[#f0f6fc] tabular-nums">{recordValueLabel(r)}</p>
            <p className="text-[10px] text-[#6e7681]">{r.date.slice(8, 10)}/{r.date.slice(5, 7)}/{r.date.slice(0, 4)}</p>
          </button>
        ))}
      </div>
    </section>
  );
};

/* ------------------------------------------------------------------ */
/* Aba                                                                 */
/* ------------------------------------------------------------------ */

export const TabWorkout: React.FC<{ onSaved?: () => void }> = ({ onSaved }) => {
  const s = useRecorder();
  const [list, setList] = useState<SavedWorkout[] | null>(null);
  const [records, setRecords] = useState<RecordEntry[]>([]);
  const [celebrate, setCelebrate] = useState<RecordEntry[]>([]);
  const [finished, setFinished] = useState<FinishedTrack | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);
  const [manual, setManual] = useState(false);
  const [error, setError] = useState('');

  const consents = useConsents();
  const gpsOk = consents.has('gps');
  const [askGps, setAskGps] = useState(false);
  // o GPS só é ligado depois da permissão (LGPD)
  useEffect(() => (gpsOk ? rec.warmUp() : undefined), [gpsOk]);
  const startNow = () => (gpsOk ? rec.start(s.sport) : setAskGps(true));

  const load = useCallback(async () => {
    const r = await callApi<{ workouts?: SavedWorkout[]; records?: RecordEntry[]; error?: string }>('/api/workouts');
    if (r.ok) {
      setList(r.data.workouts || []);
      setRecords(r.data.records || []);
    }
    else setError(r.data.error || 'Não foi possível carregar seus treinos.');
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const afterSave = (w: SavedWorkout, recs: RecordEntry[] = []) => {
    setCelebrate(recs);
    setFinished(null);
    setManual(false);
    load();
    onSaved?.();
    setOpenId(w.id);
  };

  const week = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7)); // segunda-feira
    return totals((list || []).filter((w) => new Date(w.startedAt) >= start));
  }, [list]);

  if (finished) return <div className="max-w-2xl mx-auto"><SummaryView track={finished} onSaved={afterSave} onDiscard={() => setFinished(null)} /></div>;
  if (s.status !== 'idle') return <div className="max-w-2xl mx-auto"><LiveView onFinished={setFinished} /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <section className="rounded-2xl border border-[#30363d] bg-[#161b22] p-5 space-y-4">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <h2 className="text-xl font-extrabold text-[#f0f6fc]">Treino</h2>
            {gpsOk && <GpsBadge acc={s.fix?.acc ?? null} error={s.gpsError} />}
          </div>
          <p className="text-sm text-[#8b949e]">Grave sua corrida, caminhada, pedal ou trilha com GPS e veja o caminho aparecer no mapa.</p>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {SPORT_IDS.map((id) => {
            const I = SPORT_ICON[id];
            const on = s.sport === id;
            return (
              <button key={id} type="button" onClick={() => rec.setSport(id)} aria-pressed={on} className={`flex flex-col items-center gap-1.5 py-3 px-1 rounded-xl border text-[11px] sm:text-sm font-semibold transition-colors ${on ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300' : 'border-[#30363d] text-[#8b949e] hover:text-white'}`}>
                <I className="w-6 h-6" /> {SPORTS[id].label}
              </button>
            );
          })}
        </div>

        {gpsOk ? (
          <RouteMap segments={[]} current={s.fix} live className="h-56" />
        ) : (
          <div className="h-56 rounded-2xl border border-dashed border-[#30363d] bg-[#0d1117] flex flex-col items-center justify-center text-center gap-2 px-6">
            <p className="text-sm text-[#c9d1d9]">Para medir a distância e desenhar a rota, o Ritmo precisa da sua localização durante o treino.</p>
            <button type="button" onClick={() => setAskGps(true)} className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold">Permitir localização</button>
          </div>
        )}

        <button type="button" onClick={startNow} className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-[#0d1117] text-lg font-extrabold inline-flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20">
          <Play className="w-6 h-6 fill-[#0d1117]" /> Iniciar {SPORTS[s.sport].label.toLowerCase()}
        </button>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#8b949e]">
          <span>{s.fix ? 'Dica: espere o GPS ficar "bom" para começar com mais precisão.' : 'Permita a localização quando o navegador pedir.'}</span>
          <button type="button" onClick={() => setManual(true)} className="inline-flex items-center gap-1 text-emerald-400 hover:underline"><Plus className="w-3.5 h-3.5" /> Registrar sem GPS</button>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-[#30363d] bg-[#161b22] p-4"><div className="text-xs text-[#8b949e] flex items-center gap-1"><TrendingUp className="w-3.5 h-3.5" /> Treinos na semana</div><div className="text-2xl font-extrabold text-[#f0f6fc]">{week.count}</div></div>
        <div className="rounded-2xl border border-[#30363d] bg-[#161b22] p-4"><div className="text-xs text-[#8b949e] flex items-center gap-1"><RouteIcon className="w-3.5 h-3.5" /> Distância</div><div className="text-2xl font-extrabold text-[#f0f6fc]">{formatKm(week.distanceM, 1)} <span className="text-sm text-[#8b949e]">km</span></div></div>
        <div className="rounded-2xl border border-[#30363d] bg-[#161b22] p-4"><div className="text-xs text-[#8b949e] flex items-center gap-1"><Timer className="w-3.5 h-3.5" /> Tempo</div><div className="text-2xl font-extrabold text-[#f0f6fc]">{formatDuration(week.movingS)}</div></div>
      </section>

      {celebrate.length > 0 && (
        <section className="rounded-2xl border border-amber-400/50 bg-amber-500/10 p-4 flex gap-3 items-start" role="status">
          <Trophy className="w-8 h-8 text-amber-300 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-extrabold text-amber-200">{celebrate.length === 1 ? 'Novo recorde pessoal!' : `${celebrate.length} recordes pessoais novos!`}</p>
            <ul className="text-sm text-[#f0f6fc]">{celebrate.map((r) => <li key={r.kind}>{r.label} ({SPORTS[r.sport].label.toLowerCase()}): <strong>{recordValueLabel(r)}</strong></li>)}</ul>
          </div>
          <button type="button" onClick={() => setCelebrate([])} aria-label="Fechar" className="p-1 text-[#8b949e] hover:text-white"><X className="w-4 h-4" /></button>
        </section>
      )}

      {records.length > 0 && <RecordsCard records={records} onOpen={setOpenId} />}

      <section className="space-y-3">
        <h3 className="text-base font-semibold text-[#f0f6fc]">Seus treinos</h3>
        {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
        {list === null && !error && <p className="text-sm text-[#8b949e]">Carregando...</p>}
        {list?.length === 0 && <div className="rounded-2xl border border-dashed border-[#30363d] p-8 text-center text-sm text-[#8b949e]">Nenhum treino ainda. Escolha a modalidade e toque em Iniciar.</div>}
        {list?.map((w) => {
          const I = SPORT_ICON[w.sport];
          const avg = rateOf(w.sport, w.distanceM, w.movingS);
          return (
            <button key={w.id} type="button" onClick={() => setOpenId(w.id)} className="w-full text-left rounded-2xl border border-[#30363d] bg-[#161b22] hover:border-emerald-500/40 p-4 flex gap-4 items-center transition-colors">
              <div className="w-24 h-20 sm:w-32 sm:h-24 shrink-0 rounded-xl bg-[#0d1117] border border-[#21262d] flex items-center justify-center overflow-hidden">
                {w.route ? <RouteSvg route={w.route} className="w-full h-full" strokeWidth={5} /> : <I className="w-8 h-8 text-[#30363d]" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-[#8b949e] inline-flex items-center gap-1"><I className="w-3.5 h-3.5 text-emerald-400" /> {dateLabel(w.startedAt)}</div>
                <div className="font-semibold text-[#f0f6fc] truncate">{w.title}</div>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-sm tabular-nums">
                  <span className="text-[#f0f6fc] font-bold">{formatKm(w.distanceM)} km</span>
                  <span className="text-[#c9d1d9]">{formatDuration(w.movingS)}</span>
                  <span className="text-[#c9d1d9]">{avg.value} {avg.unit}</span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-[#6e7681] shrink-0" />
            </button>
          );
        })}
      </section>

      {openId !== null && <WorkoutDetail id={openId} onClose={() => setOpenId(null)} onDeleted={() => { setOpenId(null); load(); onSaved?.(); }} onUpdated={() => { load(); onSaved?.(); }} />}
      {manual && <ManualForm onClose={() => setManual(false)} onSaved={afterSave} />}
      {askGps && <ConsentPrompt kind="gps" onCancel={() => setAskGps(false)} onAccept={() => setAskGps(false)} />}
    </div>
  );
};

/** Faixa no rodapé quando há treino gravando e a pessoa está em outra aba. */
export const WorkoutLiveBar: React.FC<{ onOpen: () => void }> = ({ onOpen }) => {
  const s = useRecorder();
  useTick(s.status === 'recording');
  const dist = useMemo(() => trackStats(s.segments).distanceM, [s.segments]);
  if (s.status === 'idle') return null;
  return (
    <button type="button" onClick={onOpen} className="fixed z-50 ritmo-above-nav-high sm:bottom-5 left-1/2 -translate-x-1/2 inline-flex items-center gap-3 px-4 py-2.5 rounded-full bg-[#161b22] border border-emerald-500/50 shadow-xl shadow-black/40 text-sm">
      <span className={`w-2.5 h-2.5 rounded-full ${s.status === 'recording' ? 'bg-rose-500 animate-pulse' : 'bg-amber-400'}`} />
      <span className="font-bold text-[#f0f6fc] tabular-nums">{formatDuration(rec.activeMsNow(s) / 1000)}</span>
      <span className="text-[#c9d1d9] tabular-nums">{formatKm(dist)} km</span>
      <span className="text-emerald-400 font-semibold">{s.status === 'recording' ? 'Treino em andamento' : 'Treino pausado'}</span>
    </button>
  );
};
