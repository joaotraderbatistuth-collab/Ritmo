// Gravador do treino com GPS (só no navegador).
// Fica fora do React de propósito: trocar de aba no app não para o treino.
// O estado é salvo no aparelho a cada poucos segundos; se a página recarregar, o treino volta pausado.
import { classifyPoint, GpsPoint, SportId } from './workout.js';

export type RecStatus = 'idle' | 'recording' | 'paused';

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
  /** Última leitura do GPS (mesmo parado ou imprecisa). */
  fix: { lat: number; lng: number; acc: number | null; t: number } | null;
  gpsError: string | null;
  /** O treino foi recuperado depois de recarregar a página. */
  recovered: boolean;
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
const isBrowser = () => typeof window !== 'undefined' && typeof navigator !== 'undefined';

let state: RecState = {
  status: 'idle',
  sport: 'corrida',
  startedAt: null,
  segments: [],
  activeMs: 0,
  runStart: null,
  fix: null,
  gpsError: null,
  recovered: false,
};
const listeners = new Set<() => void>();
let watchId: number | null = null;
let warmers = 0;
let wakeLock: any = null;
let lastSave = 0;
let restored = false;

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
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return;
    const s = JSON.parse(raw);
    if (!s || !Array.isArray(s.segments) || !s.startedAt) return;
    // o tempo com a página fechada não conta como tempo de treino
    const activeMs = Number(s.activeMs) + (s.runStart ? Math.max(0, Number(s.savedAt) - Number(s.runStart)) : 0);
    state = { ...state, status: 'paused', sport: s.sport, startedAt: Number(s.startedAt), segments: s.segments, activeMs, runStart: null, recovered: true };
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

/* ---------------- GPS ---------------- */

function onPosition(pos: GeolocationPosition) {
  const c = pos.coords;
  const point: GpsPoint = { lat: c.latitude, lng: c.longitude, t: pos.timestamp || Date.now(), alt: c.altitude ?? null, acc: c.accuracy ?? null };
  const fix = { lat: point.lat, lng: point.lng, acc: point.acc ?? null, t: point.t };
  if (state.status !== 'recording') {
    set({ fix, gpsError: null });
    return;
  }
  const segs = state.segments.length ? state.segments : [[]];
  const seg = segs[segs.length - 1];
  const prev = seg.length ? seg[seg.length - 1] : null;
  if (classifyPoint(prev, point, state.sport) === 'add') {
    const nextSeg = [...seg, point];
    set({ fix, gpsError: null, segments: [...segs.slice(0, -1), nextSeg] });
    save();
  } else {
    set({ fix, gpsError: null });
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
    if (document.visibilityState === 'visible' && state.status === 'recording') {
      keepScreenOn();
      startWatch();
    }
    if (document.visibilityState === 'hidden' && state.status !== 'idle') save(true);
  });
}

/* ---------------- Controles ---------------- */

export function setSport(sport: SportId) {
  if (state.status === 'idle') set({ sport });
}

export function start(sport: SportId) {
  const now = Date.now();
  // aproveita a posição atual (se for boa) como primeiro ponto
  const first = state.fix && state.fix.acc != null && state.fix.acc <= 35 && now - state.fix.t < 15000 ? [{ ...state.fix, t: now }] : [];
  set({ status: 'recording', sport, startedAt: now, segments: [first], activeMs: 0, runStart: now, recovered: false });
  startWatch();
  keepScreenOn();
  save(true);
}

export function pause() {
  if (state.status !== 'recording') return;
  set({ status: 'paused', activeMs: activeMsNow(), runStart: null });
  save(true);
}

export function resume() {
  if (state.status !== 'paused') return;
  set({ status: 'recording', runStart: Date.now(), segments: [...state.segments, []], recovered: false });
  startWatch();
  keepScreenOn();
  save(true);
}

function reset() {
  set({ status: 'idle', startedAt: null, segments: [], activeMs: 0, runStart: null, recovered: false });
  save(true);
  releaseScreen();
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
  return track;
}

export function discard() {
  reset();
}
