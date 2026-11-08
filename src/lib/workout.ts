// Regras PURAS dos treinos com GPS (corrida, caminhada, pedal, trilha), testadas em tests/.
// Distância, ritmo, parciais por km, filtro de ruído do GPS, rota compactada e privacidade.

export type SportId = 'corrida' | 'caminhada' | 'bike' | 'trilha';

export interface SportDef {
  id: SportId;
  label: string;
  /** Verbo para o título automático ("Corrida da manhã"). */
  noun: string;
  /** Mostra ritmo (min/km) em vez de velocidade (km/h). */
  usesPace: boolean;
  /** Velocidade máxima plausível (km/h). Acima disso o ponto do GPS é tratado como erro. */
  maxKmh: number;
  /** Média máxima aceita para salvar um treino (km/h). */
  maxAvgKmh: number;
}

export const SPORTS: Record<SportId, SportDef> = {
  corrida: { id: 'corrida', label: 'Corrida', noun: 'Corrida', usesPace: true, maxKmh: 40, maxAvgKmh: 30 },
  caminhada: { id: 'caminhada', label: 'Caminhada', noun: 'Caminhada', usesPace: true, maxKmh: 20, maxAvgKmh: 14 },
  bike: { id: 'bike', label: 'Pedal', noun: 'Pedal', usesPace: false, maxKmh: 110, maxAvgKmh: 70 },
  trilha: { id: 'trilha', label: 'Trilha', noun: 'Trilha', usesPace: true, maxKmh: 25, maxAvgKmh: 16 },
};

export const SPORT_IDS = Object.keys(SPORTS) as SportId[];

export function isSport(v: unknown): v is SportId {
  return typeof v === 'string' && (SPORT_IDS as string[]).includes(v);
}

export interface GpsPoint {
  lat: number;
  lng: number;
  /** Instante em ms. */
  t: number;
  /** Altitude em metros (pode faltar). */
  alt?: number | null;
  /** Precisão horizontal em metros. */
  acc?: number | null;
}

/* ---------------- Geometria ---------------- */

const R = 6371000;
const rad = (d: number) => (d * Math.PI) / 180;

/** Distância em metros entre dois pontos (fórmula de haversine). */
export function haversine(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/* ---------------- Filtro do GPS ---------------- */

export const GPS_LIMITS = {
  /** Pontos com precisão pior que isto são ignorados. Celulares no navegador costumam ficar
   *  entre 10 e 60 m (pior debaixo de árvores e prédios); com 35 m, muita gente não gravava nada. */
  maxAccuracyM: 65,
  /** Movimentos menores que isto são "tremida" do GPS parado (com GPS bom). */
  minMoveM: 3,
} as const;

/** Quanto precisa andar para contar, conforme a precisão: GPS bom (até 20 m) = 3 m; GPS fraco pede
 *  um passo maior, para a tremida não virar distância falsa (35 m → 12 m, 45 m → 18 m, 65 m → 30 m). */
export function minMoveFor(acc: number | null | undefined): number {
  if (acc == null || !Number.isFinite(acc) || acc <= 20) return GPS_LIMITS.minMoveM;
  return Math.max(GPS_LIMITS.minMoveM, Math.round((acc - 15) * 0.6));
}

/**
 * Decide o que fazer com uma nova leitura do GPS:
 * - 'add': entra na rota;
 * - 'skip': imprecisa ou pulo impossível (descarta);
 * - 'still': parado (não soma distância nem desenha).
 */
export function classifyPoint(prev: GpsPoint | null, next: GpsPoint, sport: SportId): 'add' | 'skip' | 'still' {
  if (!Number.isFinite(next.lat) || !Number.isFinite(next.lng) || Math.abs(next.lat) > 90 || Math.abs(next.lng) > 180) return 'skip';
  if (next.acc != null && next.acc > GPS_LIMITS.maxAccuracyM) return 'skip';
  if (!prev) return 'add';
  const d = haversine(prev, next);
  if (d < minMoveFor(next.acc)) return 'still';
  const dt = (next.t - prev.t) / 1000;
  if (dt <= 0) return 'skip';
  const kmh = (d / dt) * 3.6;
  if (kmh > SPORTS[sport].maxKmh * 1.5) return 'skip';
  return 'add';
}

/* ---------------- Estatísticas ---------------- */

export interface Split {
  km: number;
  /** Segundos daquele km (o último pode ser parcial). */
  seconds: number;
  /** Distância do trecho em metros (1000, menos no último). */
  meters: number;
}

export interface TrackStats {
  distanceM: number;
  movingS: number;
  elevationGainM: number | null;
  splits: Split[];
}

/**
 * Calcula distância, tempo em movimento, subida acumulada e parciais por km.
 * `segments`: cada pausa começa um segmento novo (o tempo e a distância entre segmentos não contam).
 */
export function trackStats(segments: GpsPoint[][]): TrackStats {
  let distanceM = 0;
  let movingS = 0;
  const splits: Split[] = [];
  let splitStartTime = 0;
  let nextKm = 1000;
  let gain = 0;
  let hasAlt = false;

  for (const seg of segments) {
    let ref: number | null = null; // referência de altitude com histerese (evita somar ruído)
    for (let i = 1; i < seg.length; i++) {
      const a = seg[i - 1];
      const b = seg[i];
      const d = haversine(a, b);
      const dt = Math.max(0, (b.t - a.t) / 1000);
      // parciais: interpola o instante exato em que cada km fecha
      while (distanceM + d >= nextKm && d > 0) {
        const frac = (nextKm - distanceM) / d;
        const at = movingS + dt * frac;
        splits.push({ km: splits.length + 1, seconds: Math.round(at - splitStartTime), meters: 1000 });
        splitStartTime = at;
        nextKm += 1000;
      }
      distanceM += d;
      movingS += dt;
    }
    for (const p of seg) {
      if (p.alt == null || !Number.isFinite(p.alt)) continue;
      hasAlt = true;
      if (ref === null) ref = p.alt;
      else if (p.alt - ref >= 3) {
        gain += p.alt - ref;
        ref = p.alt;
      } else if (ref - p.alt >= 3) ref = p.alt;
    }
  }
  const rest = distanceM - (nextKm - 1000);
  if (rest >= 50) splits.push({ km: splits.length + 1, seconds: Math.round(movingS - splitStartTime), meters: Math.round(rest) });
  return { distanceM: Math.round(distanceM), movingS: Math.round(movingS), elevationGainM: hasAlt ? Math.round(gain) : null, splits };
}

/** Ritmo atual (s/km) nos últimos `windowM` metros do segmento em andamento. */
export function currentPace(seg: GpsPoint[], windowM = 200): number | null {
  if (seg.length < 2) return null;
  let d = 0;
  let i = seg.length - 1;
  while (i > 0 && d < windowM) {
    d += haversine(seg[i - 1], seg[i]);
    i--;
  }
  const dt = (seg[seg.length - 1].t - seg[i].t) / 1000;
  if (d < 20 || dt <= 0) return null;
  return dt / (d / 1000);
}

/* ---------------- Formatação ---------------- */

export function formatDuration(totalS: number): string {
  const s = Math.max(0, Math.floor(totalS));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = h ? String(m).padStart(2, '0') : String(m);
  return `${h ? `${h}:` : ''}${mm}:${String(sec).padStart(2, '0')}`;
}

/** Segundos por km → "5:32" (sem a unidade). */
export function formatPace(sPerKm: number | null | undefined): string {
  if (!sPerKm || !Number.isFinite(sPerKm) || sPerKm <= 0 || sPerKm > 5999) return '--:--';
  const t = Math.round(sPerKm);
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
}

export function formatKm(meters: number, decimals = 2): string {
  return (Math.max(0, meters) / 1000).toFixed(decimals).replace('.', ',');
}

export function speedKmh(meters: number, seconds: number): number {
  return seconds > 0 ? (meters / seconds) * 3.6 : 0;
}

export function paceSPerKm(meters: number, seconds: number): number | null {
  return meters >= 10 && seconds > 0 ? seconds / (meters / 1000) : null;
}

/** "Corrida da manhã", "Pedal da noite"... */
export function autoTitle(sport: SportId, date: Date = new Date()): string {
  const h = date.getHours();
  const part = h < 5 ? 'da madrugada' : h < 12 ? 'da manhã' : h < 18 ? 'da tarde' : 'da noite';
  return `${SPORTS[sport].noun} ${part}`;
}

/* ---------------- Rota compactada (polyline do Google, 5 casas) ---------------- */

export function encodePolyline(points: { lat: number; lng: number }[]): string {
  let out = '';
  let pLat = 0;
  let pLng = 0;
  const enc = (v: number) => {
    let n = v < 0 ? ~(v << 1) : v << 1;
    let s = '';
    while (n >= 0x20) {
      s += String.fromCharCode((0x20 | (n & 0x1f)) + 63);
      n >>= 5;
    }
    return s + String.fromCharCode(n + 63);
  };
  for (const p of points) {
    const lat = Math.round(p.lat * 1e5);
    const lng = Math.round(p.lng * 1e5);
    out += enc(lat - pLat) + enc(lng - pLng);
    pLat = lat;
    pLng = lng;
  }
  return out;
}

export function decodePolyline(str: string): { lat: number; lng: number }[] {
  const pts: { lat: number; lng: number }[] = [];
  let i = 0;
  let lat = 0;
  let lng = 0;
  const s = String(str || '');
  const next = (): number | null => {
    let result = 0;
    let shift = 0;
    let b: number;
    do {
      if (i >= s.length) return null;
      b = s.charCodeAt(i++) - 63;
      if (b < 0 || b > 63) return null;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20 && shift < 35);
    return result & 1 ? ~(result >> 1) : result >> 1;
  };
  while (i < s.length) {
    const dLat = next();
    const dLng = next();
    if (dLat === null || dLng === null) break;
    lat += dLat;
    lng += dLng;
    pts.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }
  return pts;
}

export const POLYLINE_RE = /^[\x3f-\x7e]*$/;

/* ---------------- Simplificação e privacidade ---------------- */

/** Douglas-Peucker em metros (aproximação local plana). Mantém início e fim. */
export function simplify<T extends { lat: number; lng: number }>(points: T[], toleranceM: number): T[] {
  if (points.length <= 2) return points.slice();
  const lat0 = rad(points[0].lat);
  const xy = points.map((p) => ({ x: rad(p.lng) * Math.cos(lat0) * R, y: rad(p.lat) * R }));
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack: [number, number][] = [[0, points.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop()!;
    let maxD = 0;
    let idx = -1;
    const ax = xy[a].x, ay = xy[a].y, bx = xy[b].x, by = xy[b].y;
    const dx = bx - ax, dy = by - ay;
    const len2 = dx * dx + dy * dy;
    for (let i = a + 1; i < b; i++) {
      let t = len2 ? ((xy[i].x - ax) * dx + (xy[i].y - ay) * dy) / len2 : 0;
      t = Math.max(0, Math.min(1, t));
      const d = Math.hypot(xy[i].x - (ax + t * dx), xy[i].y - (ay + t * dy));
      if (d > maxD) {
        maxD = d;
        idx = i;
      }
    }
    if (idx >= 0 && maxD > toleranceM) {
      keep[idx] = 1;
      stack.push([a, idx], [idx, b]);
    }
  }
  return points.filter((_, i) => keep[i]);
}

/** Simplifica aumentando a tolerância até caber em `maxPoints`. */
export function simplifyTo<T extends { lat: number; lng: number }>(points: T[], maxPoints: number): T[] {
  let tol = 2;
  let out = simplify(points, tol);
  while (out.length > maxPoints && tol < 5000) {
    tol *= 1.6;
    out = simplify(points, tol);
  }
  return out;
}

/**
 * Esconde o começo e o fim da rota (padrão 200 m), para não mostrar onde a pessoa mora.
 * Rotas curtas demais ficam vazias.
 */
export function trimRoute<T extends { lat: number; lng: number }>(points: T[], meters = 200): T[] {
  if (points.length < 2 || meters <= 0) return points.slice();
  const cum = [0];
  for (let i = 1; i < points.length; i++) cum.push(cum[i - 1] + haversine(points[i - 1], points[i]));
  const total = cum[cum.length - 1];
  if (total <= meters * 2 + 50) return [];
  const from = meters;
  const to = total - meters;
  // ponto exato a `d` metros do início (interpolado entre dois pontos da rota)
  const at = (d: number): T => {
    let i = 1;
    while (i < points.length - 1 && cum[i] < d) i++;
    const a = points[i - 1];
    const b = points[i];
    const span = cum[i] - cum[i - 1] || 1;
    const f = Math.min(1, Math.max(0, (d - cum[i - 1]) / span));
    return { ...b, lat: a.lat + (b.lat - a.lat) * f, lng: a.lng + (b.lng - a.lng) * f };
  };
  const middle = points.filter((_, i) => cum[i] > from && cum[i] < to);
  return [at(from), ...middle, at(to)];
}

/* ---------------- Validação do treino recebido pelo servidor ---------------- */

export const WORKOUT_LIMITS = {
  maxDistanceM: 500_000,
  maxSeconds: 24 * 3600,
  maxRouteChars: 120_000,
  titleMax: 80,
  notesMax: 1000,
  maxSplits: 600,
} as const;

export interface WorkoutInput {
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

const clean = (v: unknown, max: number) =>
  String(v ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, max);

export function validateWorkout(raw: unknown, now: Date = new Date()): { ok: true; value: WorkoutInput } | { ok: false; error: string } {
  if (!raw || typeof raw !== 'object') return { ok: false, error: 'Treino inválido.' };
  const r = raw as Record<string, unknown>;
  if (!isSport(r.sport)) return { ok: false, error: 'Escolha a modalidade do treino.' };
  const sport = r.sport;
  const distanceM = Math.round(Number(r.distanceM));
  const movingS = Math.round(Number(r.movingS));
  const elapsedS = Math.round(Number(r.elapsedS ?? r.movingS));
  if (!Number.isFinite(distanceM) || distanceM < 0 || distanceM > WORKOUT_LIMITS.maxDistanceM) return { ok: false, error: 'Distância inválida.' };
  if (!Number.isFinite(movingS) || movingS < 60 || movingS > WORKOUT_LIMITS.maxSeconds) return { ok: false, error: 'O treino precisa ter pelo menos 1 minuto.' };
  if (!Number.isFinite(elapsedS) || elapsedS < movingS || elapsedS > WORKOUT_LIMITS.maxSeconds * 2) return { ok: false, error: 'Tempo total inválido.' };
  if (speedKmh(distanceM, movingS) > SPORTS[sport].maxAvgKmh) return { ok: false, error: `Velocidade média alta demais para ${SPORTS[sport].label.toLowerCase()}. Confira a modalidade.` };
  const started = new Date(String(r.startedAt || ''));
  if (Number.isNaN(started.getTime()) || started.getTime() > now.getTime() + 10 * 60_000 || started.getTime() < now.getTime() - 400 * 86400_000) {
    return { ok: false, error: 'Data do treino inválida.' };
  }
  const route = String(r.route ?? '');
  if (route.length > WORKOUT_LIMITS.maxRouteChars || !POLYLINE_RE.test(route)) return { ok: false, error: 'Rota inválida.' };
  const elevRaw = r.elevationGainM;
  const elevationGainM = elevRaw == null || elevRaw === '' ? null : Math.max(0, Math.min(20000, Math.round(Number(elevRaw)) || 0));
  const splits: Split[] = Array.isArray(r.splits)
    ? (r.splits as any[]).slice(0, WORKOUT_LIMITS.maxSplits).map((s, i) => ({
        km: i + 1,
        seconds: Math.max(0, Math.min(WORKOUT_LIMITS.maxSeconds, Math.round(Number(s?.seconds)) || 0)),
        meters: Math.max(0, Math.min(1000, Math.round(Number(s?.meters)) || 0)),
      }))
    : [];
  const source = r.source === 'manual' ? 'manual' : 'gps';
  const title = clean(r.title, WORKOUT_LIMITS.titleMax) || autoTitle(sport, started);
  return {
    ok: true,
    value: { sport, title, notes: clean(r.notes, WORKOUT_LIMITS.notesMax), startedAt: started.toISOString(), movingS, elapsedS, distanceM, elevationGainM, route: source === 'manual' ? '' : route, splits, source },
  };
}

/** Resumo de uma lista de treinos (para "Esta semana"). */
export function totals(list: { distanceM: number; movingS: number }[]): { count: number; distanceM: number; movingS: number } {
  const out = { count: 0, distanceM: 0, movingS: 0 };
  for (const w of list) {
    out.count++;
    out.distanceM += w.distanceM;
    out.movingS += w.movingS;
  }
  return out;
}

/* ---------------- Pausa automática ---------------- */

/** Parado: andou menos que `stillM` nos últimos `windowS` segundos. Volta: afastou `resumeM` do ponto da pausa. */
export const AUTO_PAUSE: Record<SportId, { windowS: number; stillM: number; resumeM: number }> = {
  corrida: { windowS: 10, stillM: 8, resumeM: 12 },
  caminhada: { windowS: 15, stillM: 7, resumeM: 10 },
  bike: { windowS: 8, stillM: 10, resumeM: 20 },
  trilha: { windowS: 20, stillM: 8, resumeM: 12 },
};

type Fix = { lat: number; lng: number; t: number; acc?: number | null };

/**
 * Está parado? Olha as leituras boas dos últimos segundos. Só decide com GPS chegando
 * (sem leitura recente, não pausa: pode ser só o sinal que caiu).
 * Devolve desde quando está parado (para não contar esse tempo).
 */
export function detectStop(fixes: Fix[], sport: SportId, now: number): { stopped: boolean; since: number } {
  const cfg = AUTO_PAUSE[sport];
  const from = now - cfg.windowS * 1000;
  const win = fixes.filter((f) => f.t >= from && f.t <= now && (f.acc == null || f.acc <= GPS_LIMITS.maxAccuracyM));
  if (win.length < 3) return { stopped: false, since: now };
  if (win[win.length - 1].t - win[0].t < cfg.windowS * 800) return { stopped: false, since: now };
  if (now - win[win.length - 1].t > 6000) return { stopped: false, since: now };
  const last = win[win.length - 1];
  const far = Math.max(...win.map((f) => haversine(f, last)));
  return far < cfg.stillM ? { stopped: true, since: win[0].t } : { stopped: false, since: now };
}

/** Voltou a se mover depois da pausa automática? */
export function detectResume(anchor: Fix | null, fix: Fix, sport: SportId): boolean {
  if (!anchor) return false;
  if (fix.acc != null && fix.acc > GPS_LIMITS.maxAccuracyM) return false;
  return haversine(anchor, fix) >= Math.max(AUTO_PAUSE[sport].resumeM, minMoveFor(fix.acc));
}

/* ---------------- Recordes pessoais ---------------- */

export interface RecordEntry {
  /** 'dist' maior distância · 'tempo' treino mais longo · 'pace5k'/'pace1k' melhor ritmo médio · 'veloc' maior média (pedal) · 'km' km mais rápido. */
  kind: 'dist' | 'tempo' | 'pace1k' | 'pace5k' | 'pace10k' | 'veloc' | 'km';
  sport: SportId;
  label: string;
  /** Número para comparar (maior é melhor em dist/tempo/veloc; menor é melhor nos ritmos). */
  value: number;
  workoutId: number;
  date: string;
}

type RecWorkout = { id: number; sport: SportId; distanceM: number; movingS: number; startedAt: string; splits?: Split[] };

const LOWER_IS_BETTER = new Set(['pace1k', 'pace5k', 'pace10k', 'km']);

function candidates(w: RecWorkout): RecordEntry[] {
  const out: RecordEntry[] = [];
  const base = { sport: w.sport, workoutId: w.id, date: String(w.startedAt).slice(0, 10) };
  if (w.distanceM >= 100) out.push({ ...base, kind: 'dist', label: 'Maior distância', value: w.distanceM });
  if (w.movingS >= 60) out.push({ ...base, kind: 'tempo', label: 'Treino mais longo', value: w.movingS });
  if (SPORTS[w.sport].usesPace) {
    const pace = paceSPerKm(w.distanceM, w.movingS);
    if (pace) {
      if (w.distanceM >= 10000) out.push({ ...base, kind: 'pace10k', label: 'Melhor ritmo em 10 km ou mais', value: Math.round(pace) });
      if (w.distanceM >= 5000) out.push({ ...base, kind: 'pace5k', label: 'Melhor ritmo em 5 km ou mais', value: Math.round(pace) });
      if (w.distanceM >= 1000) out.push({ ...base, kind: 'pace1k', label: 'Melhor ritmo médio', value: Math.round(pace) });
    }
    const full = (w.splits || []).filter((s) => s.meters >= 990 && s.seconds > 0);
    if (full.length) out.push({ ...base, kind: 'km', label: 'Km mais rápido', value: Math.min(...full.map((s) => s.seconds)) });
  } else if (w.distanceM >= 2000 && w.movingS > 0) {
    out.push({ ...base, kind: 'veloc', label: 'Maior velocidade média', value: Math.round(speedKmh(w.distanceM, w.movingS) * 10) / 10 });
  }
  // descarta números impossíveis (GPS doido)
  return out.filter((r) => r.kind !== 'veloc' || r.value <= SPORTS[w.sport].maxAvgKmh);
}

const better = (a: RecordEntry, b: RecordEntry | undefined) => !b || (LOWER_IS_BETTER.has(a.kind) ? a.value < b.value : a.value > b.value);

/** Melhores marcas por esporte (em caso de empate, vale a mais antiga). */
export function personalRecords(list: RecWorkout[]): RecordEntry[] {
  const best = new Map<string, RecordEntry>();
  const sorted = list.slice().sort((a, b) => String(a.startedAt).localeCompare(String(b.startedAt)) || a.id - b.id);
  for (const w of sorted) for (const c of candidates(w)) if (better(c, best.get(`${c.sport}:${c.kind}`))) best.set(`${c.sport}:${c.kind}`, c);
  return [...best.values()];
}

/** Recordes que um treino novo acabou de bater (precisa ter um treino anterior do mesmo esporte). */
export function newRecords(previous: RecWorkout[], w: RecWorkout): RecordEntry[] {
  const same = previous.filter((p) => p.sport === w.sport && p.id !== w.id);
  if (!same.length) return [];
  const old = new Map(personalRecords(same).map((r) => [r.kind, r]));
  return candidates(w).filter((c) => old.has(c.kind) && better(c, old.get(c.kind)));
}

/** "10,52 km", "1h05", "5:12 /km", "28,4 km/h". */
export function recordValueLabel(r: Pick<RecordEntry, 'kind' | 'value'>): string {
  if (r.kind === 'dist') return `${formatKm(r.value)} km`;
  if (r.kind === 'tempo') return formatDuration(r.value);
  if (r.kind === 'veloc') return `${String(r.value).replace('.', ',')} km/h`;
  return `${formatPace(r.value)} /km`;
}
