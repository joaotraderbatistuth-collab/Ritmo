// Gravador do treino com GPS (só no navegador).
// Fica fora do React de propósito: trocar de aba no app não para o treino.
// O estado é salvo no aparelho a cada poucos segundos; se a página recarregar, o treino volta pausado.
import { classifyPoint, detectResume, detectStop, fixTime, GPS_LIMITS, GpsPoint, haversine, kmCueText, minMoveFor, smoothFix, SmoothState, SPORTS, SportId, STOP_SPEED, trackStats } from './workout.js';
import { liveStart, liveStop } from './stories-client.js';

export type RecStatus = 'idle' | 'recording' | 'paused';

type Fix = { lat: number; lng: number; acc: number | null; t: number; spd?: number | null };

export interface RecState {
  status: RecStatus;
  sport: SportId;
  /** Início do treino (ms). */
  startedAt: number | null;
  /** Cada pausa começa um trecho novo. */
  segments: GpsPoint[][];
  /** Tempo ativo acumulado até a última pausa (ms). */
  activeMs: number;
  /** Quando começou o trecho ativo atual (ms), ou null se pausado. */
  runStart: number | null;
  /** Última leitura do GPS (mesmo parado ou imprecisa), já suavizada. */
  fix: Fix | null;
  /** Quando a última leitura chegou (relógio do aparelho, ms). Serve para avisar "sem sinal". */
  fixAt: number | null;
  gpsError: string | null;
  /** O treino foi recuperado depois de recarregar a página. */
  recovered: boolean;
  /** Pausa automática ligada (preferência do aparelho). */
  autoPauseOn: boolean;
  /** Pausado sozinho porque a pessoa parou (volta sozinho ao andar). */
  autoPaused: boolean;
  /** Aviso por voz e vibração a cada km (preferência do aparelho). */
  kmCueOn: boolean;
  /** Recado para a pessoa (ex.: a tela ficou apagada e o GPS parou). */
  notice: string | null;
}

export interface FinishedTrack {
  sport: SportId;
  startedAt: number;
  endedAt: number;
  segments: GpsPoint[][];
  movingS: number;
  elapsedS: number;
}

const KEY = 'ritmo_workout_live';
const AUTO_KEY = 'ritmo_autopause';
const CUE_KEY = 'ritmo_kmcue';
/** Para o primeiro ponto da rota valer, o GPS precisa estar pelo menos assim (m). */
const FIRST_POINT_ACC = 25;
const isBrowser = () => typeof window !== 'undefined' && typeof navigator !== 'undefined';
const r6 = (n: number) => Math.round(n * 1e6) / 1e6;

let state: RecState = {
  status: 'idle',
  sport: 'corrida',
  startedAt: null,
  segments: [],
  activeMs: 0,
  runStart: null,
  fix: null,
  fixAt: null,
  gpsError: null,
  recovered: false,
  autoPauseOn: true,
  autoPaused: false,
  kmCueOn: true,
  notice: null,
};
/** Leituras recentes do GPS (para saber se a pessoa parou) e o ponto onde a pausa automática começou. */
let recent: Fix[] = [];
let anchor: Fix | null = null;
/** Última vez em que a pessoa ainda estava no ponto da pausa (para não perder o tempo da arrancada). */
let leftAt: number | null = null;
/** Leituras seguidas "andando" durante a pausa automática. */
let fastCount = 0;
let smooth: SmoothState | null = null;
let lastT = 0;
/** Distância acumulada (m) e o tempo ativo (ms) em que o último km fechou: usados no aviso por km. */
let distM = 0;
let lastKmMs: number | null = 0;
const listeners = new Set<() => void>();
let watchId: number | null = null;
let warmers = 0;
let wakeLock: any = null;
let lastSave = 0;
let restored = false;
let hiddenAt: number | null = null;
let watchdog: ReturnType<typeof setInterval> | null = null;

function emit() {
  listeners.forEach((l) => l());
}

function set(patch: Partial<RecState>) {
  state = { ...state, ...patch };
  emit();
}

function save(force = false) {
  if (!isBrowser()) return;
  const now = Date.now();
  if (!force && now - lastSave < 4000) return;
  lastSave = now;
  try {
    if (state.status === 'idle') localStorage.removeItem(KEY);
    else
      localStorage.setItem(
        KEY,
        JSON.stringify({ status: state.status, sport: state.sport, startedAt: state.startedAt, segments: state.segments, activeMs: state.activeMs, runStart: state.runStart, savedAt: now })
      );
  } catch {
    // aparelho sem espaço: o treino continua só na memória
  }
}

/** Recupera um treino em andamento (por exemplo, depois de recarregar a página). Volta pausado. */
function restore() {
  if (restored || !isBrowser()) return;
  restored = true;
  try { state = { ...state, autoPauseOn: localStorage.getItem(AUTO_KEY) !== '0', kmCueOn: localStorage.getItem(CUE_KEY) !== '0' }; } catch {}
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return;
    const s = JSON.parse(raw);
    if (!s || !Array.isArray(s.segments) || !s.startedAt) return;
    // o tempo com a página fechada não conta como tempo de treino
    const activeMs = Number(s.activeMs) + (s.runStart ? Math.max(0, Number(s.savedAt) - Number(s.runStart)) : 0);
    state = { ...state, status: 'paused', sport: s.sport, startedAt: Number(s.startedAt), segments: s.segments, activeMs, runStart: null, recovered: true };
    distM = trackStats(state.segments).distanceM;
    lastKmMs = null; // não sabemos quando o último km fechou
    startWatchdog();
  } catch {
    try { localStorage.removeItem(KEY); } catch {}
  }
}

export function getState(): RecState {
  restore();
  return state;
}

export function subscribe(fn: () => void) {
  restore();
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Tempo ativo agora (ms). */
export function activeMsNow(s: RecState = state, now = Date.now()): number {
  return s.activeMs + (s.runStart ? now - s.runStart : 0);
}

/* ---------------- Aviso a cada km ---------------- */

function say(text: string) {
  try {
    if (!('speechSynthesis' in window)) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'pt-BR';
    const voices = window.speechSynthesis.getVoices();
    const v = voices.find((x) => x.lang?.toLowerCase().startsWith('pt-br')) || voices.find((x) => x.lang?.toLowerCase().startsWith('pt'));
    if (v) u.voice = v;
    window.speechSynthesis.speak(u);
  } catch {
    // sem voz no aparelho: fica só a vibração
  }
}

function addDistance(meters: number) {
  const before = distM;
  distM += meters;
  const km = Math.floor(distM / 1000);
  if (km <= Math.floor(before / 1000)) return;
  const nowMs = activeMsNow();
  const lastKmS = lastKmMs === null ? null : (nowMs - lastKmMs) / 1000;
  lastKmMs = nowMs;
  if (!state.kmCueOn) return;
  try { navigator.vibrate?.([150, 80, 150]); } catch {}
  say(kmCueText(state.sport, km, lastKmS, distM, nowMs / 1000));
}

/* ---------------- GPS ---------------- */

function onPosition(pos: GeolocationPosition) {
  const now = Date.now();
  const c = pos.coords;
  if (!Number.isFinite(c.latitude) || !Number.isFinite(c.longitude)) return;
  const t = fixTime(pos.timestamp, now);
  if (t <= lastT) {
    // leitura repetida ou fora de ordem: só serve para saber que o GPS está vivo
    state = { ...state, fixAt: now };
    return;
  }
  lastT = t;
  const acc = Number.isFinite(c.accuracy) && c.accuracy >= 0 ? c.accuracy : null;
  const spd = c.speed != null && Number.isFinite(c.speed) && c.speed >= 0 ? c.speed : null;
  const good = acc == null || acc <= GPS_LIMITS.maxAccuracyM;
  const raw: GpsPoint = { lat: c.latitude, lng: c.longitude, t, alt: c.altitude ?? null, acc };
  // leitura boa passa pelo filtro; leitura ruim não mexe na rota nem no filtro
  if (good) smooth = smoothFix(smooth, raw, state.sport);
  const at = good && smooth ? smooth : smooth && t - smooth.t < 10_000 ? smooth : raw;
  const fix: Fix = { lat: r6(at.lat), lng: r6(at.lng), acc: acc == null ? null : Math.round(acc), t, spd };
  const point: GpsPoint = { lat: fix.lat, lng: fix.lng, t, alt: raw.alt == null || !Number.isFinite(raw.alt) ? null : Math.round(raw.alt * 10) / 10, acc: fix.acc };
  const seen = { fix, fixAt: now, gpsError: null };
  if (!good) {
    set(seen);
    return;
  }
  recent = [...recent.filter((f) => t - f.t < 60_000), fix];

  if (state.status === 'paused' && state.autoPaused && anchor) {
    const moving = spd != null && spd >= STOP_SPEED[state.sport];
    if (!moving && haversine(anchor, fix) < Math.max(5, minMoveFor(acc) / 2)) leftAt = t;
    fastCount = spd != null && spd >= STOP_SPEED[state.sport] * 1.6 ? fastCount + 1 : 0;
    if (detectResume(anchor, fix, state.sport) || fastCount >= 3) autoResume(point);
    set(seen);
    return;
  }
  if (state.status !== 'recording') {
    set(seen);
    return;
  }
  if (state.autoPauseOn) {
    const stop = detectStop(recent, state.sport, t);
    if (stop.stopped) {
      autoPause(stop.since, fix);
      set(seen);
      return;
    }
  }
  const segs = state.segments.length ? state.segments : [[]];
  const seg = segs[segs.length - 1];
  const prev = seg.length ? seg[seg.length - 1] : null;
  // o primeiro ponto do trecho veio com sinal fraco e agora chegou um bem melhor: troca em vez de somar o "pulo"
  if (prev && seg.length === 1 && (prev.acc ?? 0) > FIRST_POINT_ACC && acc != null && acc < (prev.acc ?? 0) * 0.7 && segs.length === 1) {
    set({ ...seen, segments: [[point]] });
    save();
    return;
  }
  if (classifyPoint(prev, point, state.sport) === 'add') {
    set({ ...seen, segments: [...segs.slice(0, -1), [...seg, point]] });
    if (prev) addDistance(haversine(prev, point));
    save();
  } else {
    set(seen);
  }
}

function onError(err: GeolocationPositionError) {
  const msg =
    err.code === err.PERMISSION_DENIED
      ? 'Permita o acesso à localização para o Ritmo (nas configurações do navegador ou do celular).'
      : err.code === err.POSITION_UNAVAILABLE
        ? 'Sem sinal de GPS agora. Vá para um lugar aberto.'
        : 'O GPS está demorando para responder...';
  set({ gpsError: msg });
}

function startWatch() {
  if (!isBrowser() || watchId !== null) return;
  if (!('geolocation' in navigator)) {
    set({ gpsError: 'Este aparelho não tem GPS disponível no navegador.' });
    return;
  }
  watchId = navigator.geolocation.watchPosition(onPosition, onError, { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 });
}

function stopWatch() {
  if (watchId !== null && isBrowser()) navigator.geolocation.clearWatch(watchId);
  watchId = null;
}

/** Liga o GPS de novo do zero. O celular costuma "matar" o acompanhamento quando a tela apaga ou o app sai da frente. */
function restartWatch() {
  if (!isBrowser() || watchId === null) return;
  stopWatch();
  startWatch();
}

/** Durante o treino, confere de tempos em tempos se o GPS travou e religa sozinho. */
function startWatchdog() {
  if (!isBrowser() || watchdog) return;
  watchdog = setInterval(() => {
    if (state.status !== 'recording' || document.visibilityState !== 'visible') return;
    if (state.fixAt && Date.now() - state.fixAt > 15_000) {
      restartWatch();
      state = { ...state, fixAt: Date.now() - 5_000 }; // dá 10 s para a nova tentativa antes de religar outra vez
      emit();
    }
  }, 5000);
}

function stopWatchdog() {
  if (watchdog) clearInterval(watchdog);
  watchdog = null;
}

/** Há quantos segundos não chega leitura do GPS (null se nunca chegou). */
export function fixAgeS(s: RecState = state, now = Date.now()): number | null {
  return s.fixAt ? Math.max(0, Math.round((now - s.fixAt) / 1000)) : null;
}

/** A aba Treino aberta liga o GPS para mostrar a posição antes de começar. */
export function warmUp() {
  warmers++;
  startWatch();
  return () => {
    warmers = Math.max(0, warmers - 1);
    if (warmers === 0 && state.status === 'idle') stopWatch();
  };
}

/* ---------------- Tela ligada ---------------- */

async function keepScreenOn() {
  try {
    if (isBrowser() && 'wakeLock' in navigator && document.visibilityState === 'visible') {
      wakeLock = await (navigator as any).wakeLock.request('screen');
    }
  } catch {
    wakeLock = null;
  }
}

function releaseScreen() {
  try { wakeLock?.release?.(); } catch {}
  wakeLock = null;
}

if (isBrowser()) {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      hiddenAt = Date.now();
      if (state.status !== 'idle') save(true);
      return;
    }
    // voltou para a tela: o GPS pode ter sido desligado pelo celular, então religa
    restartWatch();
    const away = hiddenAt ? Date.now() - hiddenAt : 0;
    hiddenAt = null;
    if (state.status === 'recording') {
      keepScreenOn();
      startWatch();
      if (away > 20_000) {
        const min = Math.max(1, Math.round(away / 60_000));
        set({ notice: `O Ritmo ficou ${away < 60_000 ? 'alguns segundos' : `${min} min`} fora da tela e o celular pausou o GPS. Esse trecho entra na rota em linha reta. Para gravar tudo, deixe o Ritmo aberto com a tela ligada.` });
      }
    }
  });
}

export function clearNotice() {
  if (state.notice) set({ notice: null });
}

/* ---------------- Controles ---------------- */

export function setSport(sport: SportId) {
  if (state.status === 'idle') set({ sport });
}

export function start(sport: SportId) {
  const now = Date.now();
  // aproveita a posição atual como primeiro ponto só se o sinal já estiver bom (senão a rota começava com um "pulo")
  const f = state.fix;
  const first: GpsPoint[] = f && f.acc != null && f.acc <= FIRST_POINT_ACC && state.fixAt != null && now - state.fixAt < 10_000 ? [{ lat: f.lat, lng: f.lng, t: Math.max(f.t, lastT), acc: f.acc, alt: null }] : [];
  recent = [];
  anchor = null;
  leftAt = null;
  fastCount = 0;
  distM = 0;
  lastKmMs = 0;
  set({ status: 'recording', sport, startedAt: now, segments: [first], activeMs: 0, runStart: now, recovered: false, autoPaused: false, notice: null });
  startWatch();
  startWatchdog();
  keepScreenOn();
  save(true);
  // "destrava" a voz no toque do botão (o celular só deixa falar depois de um toque)
  if (state.kmCueOn) { try { window.speechSynthesis?.getVoices(); window.speechSynthesis?.resume?.(); } catch {} }
  liveStart('treino', SPORTS[sport]?.label || 'Treino', 180); // "Treinando agora" nos stories (se a pessoa ligou)
}

export function pause() {
  if (state.status !== 'recording') return;
  set({ status: 'paused', activeMs: activeMsNow(), runStart: null, autoPaused: false });
  save(true);
}

/** Parou de se mexer: pausa sem contar o tempo parado. */
function autoPause(since: number, fix: Fix) {
  if (state.status !== 'recording' || !state.runStart) return;
  const end = Math.max(state.runStart, Math.min(since, Date.now()));
  anchor = fix;
  leftAt = fix.t;
  fastCount = 0;
  set({ status: 'paused', activeMs: state.activeMs + (end - state.runStart), runStart: null, autoPaused: true });
  save(true);
  try { navigator.vibrate?.(80); } catch {}
}

/**
 * Voltou a andar: retoma num trecho novo que COMEÇA no último ponto da rota (onde a pessoa parou),
 * para não perder os metros nem os segundos da arrancada. Antes, cada parada "comia" uns 10 a 30 m.
 */
function autoResume(point: GpsPoint) {
  const lastSeg = state.segments[state.segments.length - 1];
  const tail: { lat: number; lng: number; alt?: number | null; acc?: number | null } | null = lastSeg?.length ? lastSeg[lastSeg.length - 1] : anchor;
  const t0 = Math.min(point.t - 1, Math.max(leftAt ?? point.t, point.t - 60_000));
  const bridge: GpsPoint | null = tail ? { lat: tail.lat, lng: tail.lng, t: t0, alt: tail.alt ?? null, acc: tail.acc ?? null } : null;
  const kind = bridge ? classifyPoint(bridge, point, state.sport) : 'add';
  const seg: GpsPoint[] = !bridge || kind === 'skip' ? [point] : kind === 'add' ? [bridge, point] : [bridge];
  const lead = seg.length === 2 ? point.t - t0 : 0;
  anchor = null;
  leftAt = null;
  fastCount = 0;
  recent = [];
  set({ status: 'recording', runStart: Date.now() - lead, segments: [...state.segments, seg], autoPaused: false });
  if (seg.length === 2) addDistance(haversine(seg[0], seg[1]));
  save(true);
  try { navigator.vibrate?.([60, 60, 60]); } catch {}
}

export function setAutoPause(on: boolean) {
  try { localStorage.setItem(AUTO_KEY, on ? '1' : '0'); } catch {}
  set({ autoPauseOn: on });
  if (!on && state.status === 'paused' && state.autoPaused) resume();
}

export function setKmCue(on: boolean) {
  try { localStorage.setItem(CUE_KEY, on ? '1' : '0'); } catch {}
  set({ kmCueOn: on });
  if (!on) { try { window.speechSynthesis?.cancel(); } catch {} }
}

export function resume() {
  if (state.status !== 'paused') return;
  anchor = null;
  leftAt = null;
  fastCount = 0;
  recent = [];
  set({ status: 'recording', runStart: Date.now(), segments: [...state.segments, []], recovered: false, autoPaused: false, fixAt: Date.now() });
  restartWatch();
  startWatch();
  startWatchdog();
  keepScreenOn();
  save(true);
}

function reset() {
  anchor = null;
  leftAt = null;
  fastCount = 0;
  recent = [];
  distM = 0;
  lastKmMs = 0;
  set({ status: 'idle', startedAt: null, segments: [], activeMs: 0, runStart: null, recovered: false, autoPaused: false, notice: null });
  save(true);
  releaseScreen();
  stopWatchdog();
  try { window.speechSynthesis?.cancel(); } catch {}
  if (warmers === 0) stopWatch();
}

/** Termina e devolve o que foi gravado (ainda não está salvo no servidor). */
export function finish(): FinishedTrack | null {
  if (state.status === 'idle' || !state.startedAt) return null;
  const now = Date.now();
  const track: FinishedTrack = {
    sport: state.sport,
    startedAt: state.startedAt,
    endedAt: now,
    segments: state.segments.filter((s) => s.length > 0),
    movingS: Math.round(activeMsNow() / 1000),
    elapsedS: Math.round((now - state.startedAt) / 1000),
  };
  reset();
  liveStop();
  return track;
}

export function discard() {
  reset();
  liveStop();
}
