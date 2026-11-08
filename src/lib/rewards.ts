// Recompensas que dão aquela vontade de fazer mais um — regras PURAS e testadas.
//
// Princípios (tom do Ritmo: constância sem extremismos):
//  - Tudo celebra o que a pessoa FEZ. Nada de culpa, perda ou contagem regressiva ameaçadora.
//  - O bônus surpresa é sorteado de forma FIXA por pessoa e dia (o servidor confere; não dá para forjar)
//    e só sai fazendo coisas de verdade, dentro dos limites diários que já existem.
//  - A meta do dia é pequena e escolhida pela pessoa.

/** Bônus surpresa só vale a partir deste dia (não muda o passado de ninguém). */
export const LUCKY_START = '2026-11-08';

/** Hash simples e estável (FNV-1a) → número de 0 a 2^32-1. */
export function hash32(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** Prêmios possíveis do bônus surpresa (o maior é raro). */
const LUCKY_TABLE: { xp: number; weight: number }[] = [
  { xp: 10, weight: 35 },
  { xp: 15, weight: 28 },
  { xp: 20, weight: 20 },
  { xp: 30, weight: 12 },
  { xp: 50, weight: 5 },
];

/**
 * Bônus surpresa do dia: em cerca de 2 a cada 3 dias, a N-ésima ação do dia (de 2 a 6, ninguém sabe qual)
 * vem com pontos extras. Fixo para a pessoa e o dia. Devolve null nos dias sem bônus.
 */
export function luckyDrop(seed: number, day: string): { at: number; xp: number } | null {
  if (!seed || day < LUCKY_START) return null;
  const h = hash32(`ritmo-sorte:${seed}:${day}`);
  if (h % 3 === 0) return null; // ~1 em cada 3 dias sem surpresa: deixa a surpresa ser surpresa
  const at = 2 + ((h >>> 4) % 5); // 2..6
  let roll = (h >>> 12) % 100;
  for (const row of LUCKY_TABLE) {
    if (roll < row.weight) return { at, xp: row.xp };
    roll -= row.weight;
  }
  return { at, xp: LUCKY_TABLE[0].xp };
}

/* ------------------------------------------------------------------ */
/* Meta de pontos do dia                                               */
/* ------------------------------------------------------------------ */

export const DAILY_GOALS = [30, 50, 80, 120] as const;
export const DEFAULT_DAILY_GOAL = 50;

export function normalizeGoal(v: unknown): number {
  const n = Number(v);
  return (DAILY_GOALS as readonly number[]).includes(n) ? n : DEFAULT_DAILY_GOAL;
}

/** Progresso de 0 a 1 e se a meta acabou de ser batida (antes < meta <= agora). */
export function goalProgress(todayXp: number, goal: number, previousTodayXp?: number | null) {
  const g = Math.max(1, goal);
  const p = Math.max(0, Math.min(1, todayXp / g));
  const justHit = previousTodayXp != null && previousTodayXp < g && todayXp >= g;
  return { progress: p, done: todayXp >= g, justHit, left: Math.max(0, g - todayXp) };
}

/* ------------------------------------------------------------------ */
/* Combo: várias ações seguidas em pouco tempo                         */
/* ------------------------------------------------------------------ */

export const COMBO_WINDOW_MS = 4 * 60_000;

/** Conta o combo: se a última ação foi há menos de 4 min, soma; senão, recomeça em 1. */
export function nextCombo(prev: { count: number; at: number } | null, now: number): { count: number; at: number } {
  if (prev && now - prev.at <= COMBO_WINDOW_MS) return { count: Math.min(prev.count + 1, 99), at: now };
  return { count: 1, at: now };
}

/* ------------------------------------------------------------------ */
/* Frases de comemoração                                               */
/* ------------------------------------------------------------------ */

const CHEERS = ['Boa!', 'Mandou bem!', 'Isso aí!', 'No ritmo!', 'Mais um!', 'Show!', 'Que constância!', 'Arrasou!', 'Segue o fluxo!', 'Bonito de ver!'];
const COMBO_CHEERS = ['Combo!', 'Em sequência!', 'Pegando embalo!', 'Tá voando!', 'Imparável hoje!'];

export function cheerFor(n: number, combo: number): string {
  if (combo >= 2) return COMBO_CHEERS[Math.min(combo - 2, COMBO_CHEERS.length - 1)];
  return CHEERS[Math.abs(n) % CHEERS.length];
}

/** "Quase lá": mostra quanto falta quando a pessoa já passou de 75% do nível. */
export function nearNextLevel(info: { progress: number; xpToNext: number; nextName: string | null }): string | null {
  if (!info.nextName || info.progress < 0.75 || info.xpToNext <= 0) return null;
  return `Faltam só ${info.xpToNext} XP para ${info.nextName}!`;
}

/** Notas do "plim" de pontos: sobem de tom a cada ação do combo (até 5 degraus). */
export function gainTone(combo: number, lucky = false): { at: number; freq: number; dur: number; gain: number }[] {
  const steps = [659.25, 739.99, 830.61, 880, 987.77]; // Mi5 → Si5
  const base = steps[Math.min(Math.max(combo, 1), steps.length) - 1];
  const notes = [
    { at: 0, freq: base, dur: 0.09, gain: 0.35 },
    { at: 0.08, freq: base * 1.5, dur: 0.22, gain: 0.4 },
  ];
  if (lucky) notes.push({ at: 0.22, freq: base * 2, dur: 0.35, gain: 0.35 }, { at: 0.34, freq: base * 2.5, dur: 0.4, gain: 0.25 });
  return notes;
}
