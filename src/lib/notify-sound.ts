// Som de notificação do Ritmo — a "assinatura sonora" da marca.
// Gerado na hora pelo navegador (Web Audio), sem arquivo de áudio e 100% original:
// duas batidinhas curtas + uma nota longa subindo ("tum-tum-tiiim"), como um ritmo.
// Lógica pura das notas exportada para testes.

export interface ToneNote {
  /** segundos desde o início */
  at: number;
  /** frequência em Hz */
  freq: number;
  /** duração em segundos */
  dur: number;
  /** volume de 0 a 1 */
  gain: number;
}

/** Sequência de notas do som da marca (Sol5, Sol5, Ré6 + Sol6 de brilho). */
export const RITMO_TONE: ToneNote[] = [
  { at: 0, freq: 783.99, dur: 0.11, gain: 0.55 },
  { at: 0.14, freq: 783.99, dur: 0.11, gain: 0.55 },
  { at: 0.3, freq: 1174.66, dur: 0.55, gain: 0.7 },
  { at: 0.3, freq: 1567.98, dur: 0.45, gain: 0.18 },
];

/** Padrão de vibração com o mesmo ritmo (ms: vibra, pausa, vibra...). */
export const RITMO_VIBRATE = [70, 70, 70, 90, 220];

/** Duração total do som em segundos. */
export function toneLength(notes: ToneNote[] = RITMO_TONE): number {
  return notes.reduce((m, n) => Math.max(m, n.at + n.dur), 0);
}

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  return ctx;
}

/**
 * Os navegadores só deixam tocar som depois de um toque na página.
 * Chamar uma vez: libera o áudio no primeiro toque/tecla.
 */
export function unlockSoundOnFirstTouch() {
  if (typeof window === 'undefined') return;
  const go = () => {
    const c = getCtx();
    c?.resume().catch(() => {});
    window.removeEventListener('pointerdown', go);
    window.removeEventListener('keydown', go);
  };
  window.addEventListener('pointerdown', go, { once: true });
  window.addEventListener('keydown', go, { once: true });
}

/** Toca o som do Ritmo. Devolve false se o navegador não deixou tocar. */
export async function playRitmoSound(volume = 0.6): Promise<boolean> {
  const c = getCtx();
  if (!c) return false;
  try {
    if (c.state === 'suspended') await c.resume();
  } catch {
    return false;
  }
  if (c.state !== 'running') return false;
  const master = c.createGain();
  master.gain.value = Math.max(0, Math.min(1, volume));
  master.connect(c.destination);
  const t0 = c.currentTime + 0.02;
  for (const n of RITMO_TONE) {
    // tom principal (seno) + um harmônico suave (triângulo) = timbre de marimba/sino
    for (const [type, mult, g] of [['sine', 1, 1], ['triangle', 2, 0.12]] as const) {
      const osc = c.createOscillator();
      const env = c.createGain();
      osc.type = type;
      osc.frequency.value = n.freq * mult;
      const start = t0 + n.at;
      const peak = n.gain * g;
      env.gain.setValueAtTime(0.0001, start);
      env.gain.exponentialRampToValueAtTime(peak, start + 0.012);
      env.gain.exponentialRampToValueAtTime(0.0001, start + n.dur);
      osc.connect(env);
      env.connect(master);
      osc.start(start);
      osc.stop(start + n.dur + 0.05);
    }
  }
  try {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(RITMO_VIBRATE);
  } catch {
    /* sem vibração */
  }
  return true;
}
