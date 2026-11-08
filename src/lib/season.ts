// Temporada mensal: competição de pontos com divisões, promoção e rebaixamento. Regras PURAS e testadas.
//
// Como funciona:
//  - Cada temporada é um mês do calendário (horário de Brasília para todos, para ninguém ter vantagem).
//  - Todo mundo começa na 1ª divisão (Bronze). Os pontos da temporada são os Pontos de Ritmo (XP)
//    ganhos no mês, com os mesmos limites diários de sempre.
//  - Cada divisão tem grupos de até 30 pessoas. No fim do mês, a parte de cima de cada grupo sobe e
//    a parte de baixo desce. Quanto mais alta a divisão, mais disputado: sobe menos gente, desce mais.
//  - Só sobe quem fez pontos no mês. Quem passou o mês inteiro sem pontos desce uma divisão.
//  - Para ajustar a competição, mexa só em DIVISIONS (percentuais) e SEASON_GROUP_SIZE.

export interface Division {
  tier: number;
  name: string;
  color: string;
  emoji: string;
  /** fração do grupo que sobe no fim do mês (0 a 1) */
  promote: number;
  /** fração do grupo que desce no fim do mês (0 a 1) */
  relegate: number;
}

export const DIVISIONS: Division[] = [
  { tier: 0, name: 'Bronze', color: '#c2783c', emoji: '🥉', promote: 0.8, relegate: 0 },
  { tier: 1, name: 'Prata', color: '#a7b0ba', emoji: '🥈', promote: 0.6, relegate: 0.1 },
  { tier: 2, name: 'Ouro', color: '#e0a82e', emoji: '🥇', promote: 0.5, relegate: 0.15 },
  { tier: 3, name: 'Safira', color: '#3b82f6', emoji: '🔷', promote: 0.4, relegate: 0.15 },
  { tier: 4, name: 'Esmeralda', color: '#10b981', emoji: '💚', promote: 0.3, relegate: 0.2 },
  { tier: 5, name: 'Rubi', color: '#f43f5e', emoji: '❤️‍🔥', promote: 0.25, relegate: 0.2 },
  { tier: 6, name: 'Diamante', color: '#22d3ee', emoji: '💎', promote: 0.2, relegate: 0.25 },
  { tier: 7, name: 'Lenda', color: '#a855f7', emoji: '👑', promote: 0, relegate: 0.3 },
];

export const TOP_TIER = DIVISIONS.length - 1;
export const SEASON_GROUP_SIZE = 30;
/** Grupos menores que isto não rebaixam ninguém (fica injusto com 2 ou 3 pessoas). */
export const MIN_GROUP_TO_RELEGATE = 5;

export const division = (tier: number) => DIVISIONS[Math.min(Math.max(0, Math.floor(Number(tier) || 0)), TOP_TIER)];

/* ---------------- Datas ---------------- */

const MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

/** "2026-11-08" → "2026-11" */
export const monthOf = (day: string) => day.slice(0, 7);

export function prevMonth(month: string): string {
  const y = Number(month.slice(0, 4));
  const m = Number(month.slice(5, 7));
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, '0')}`;
}

export function lastDayOf(month: string): string {
  const y = Number(month.slice(0, 4));
  const m = Number(month.slice(5, 7));
  return `${month}-${String(new Date(Date.UTC(y, m, 0)).getUTCDate()).padStart(2, '0')}`;
}

/** Dias que faltam (contando hoje) até o fim da temporada. */
export function daysLeftIn(month: string, today: string): number {
  const end = Date.parse(`${lastDayOf(month)}T12:00:00Z`);
  const now = Date.parse(`${today}T12:00:00Z`);
  return Math.max(0, Math.round((end - now) / 86400_000) + 1);
}

/** "Temporada de novembro" */
export const seasonLabel = (month: string) => `Temporada de ${MONTHS[Number(month.slice(5, 7)) - 1] || month}`;

/** Pontos de um mês somando os pontos de cada dia. */
export function seasonPoints(days: Record<string, { xp: number }>, month: string): number {
  let total = 0;
  for (const [day, row] of Object.entries(days)) if (day.startsWith(month)) total += Math.max(0, row.xp || 0);
  return total;
}

/* ---------------- Zonas e resultado ---------------- */

/** Quantas vagas de subida e de descida tem um grupo deste tamanho nesta divisão. */
export function zoneSizes(tier: number, size: number): { up: number; down: number } {
  const d = division(tier);
  if (size <= 0) return { up: 0, down: 0 };
  let up = d.promote > 0 ? Math.max(1, Math.floor(size * d.promote)) : 0;
  let down = tier > 0 && size >= MIN_GROUP_TO_RELEGATE ? Math.max(1, Math.floor(size * d.relegate)) : 0;
  if (up + down > size) down = Math.max(0, size - up);
  if (up >= size && size > 1 && tier > 0) up = size - 1;
  return { up, down };
}

export type Zone = 'up' | 'stay' | 'down';

/** Em que zona está quem ficou em `rank` (1 = primeiro) com `points` pontos. */
export function zoneFor(tier: number, rank: number, size: number, points: number): Zone {
  const { up, down } = zoneSizes(tier, size);
  if (points > 0 && rank <= up && tier < TOP_TIER) return 'up';
  if (tier > 0 && (points <= 0 || (down > 0 && rank > size - down))) return 'down';
  return 'stay';
}

/** Divisão da próxima temporada. */
export function nextDivision(tier: number, rank: number, size: number, points: number): number {
  const z = zoneFor(tier, rank, size, points);
  return z === 'up' ? Math.min(TOP_TIER, tier + 1) : z === 'down' ? Math.max(0, tier - 1) : tier;
}

export function rankOf<T extends { userId: number; xp: number }>(rows: T[], userId: number): { rank: number; size: number; sorted: T[] } {
  const sorted = rows.slice().sort((a, b) => b.xp - a.xp || a.userId - b.userId);
  return { rank: sorted.findIndex((r) => r.userId === userId) + 1, size: sorted.length, sorted };
}

/* ---------------- Próximos objetivos (mostram o caminho, sem pressão) ---------------- */

export interface SeasonGoals {
  /** pontos para entrar na zona de subida (null se já está nela ou na última divisão) */
  toPromote: number | null;
  /** pontos para sair da zona de descida (null se não está nela) */
  toSafety: number | null;
  /** a pessoa logo acima e quantos pontos faltam para passar ela */
  next: { name: string; gap: number } | null;
}

export function seasonGoals(tier: number, standings: { xp: number; name: string; me?: boolean }[]): SeasonGoals {
  const size = standings.length;
  const i = standings.findIndex((s) => s.me);
  if (i < 0) return { toPromote: null, toSafety: null, next: null };
  const me = standings[i];
  const { up, down } = zoneSizes(tier, size);
  const zone = zoneFor(tier, i + 1, size, me.xp);
  let toPromote: number | null = null;
  if (zone !== 'up' && tier < TOP_TIER && up > 0) {
    const cut = standings[up - 1];
    toPromote = Math.max(1, cut.xp - me.xp + 1);
  }
  let toSafety: number | null = null;
  if (zone === 'down' && tier > 0) {
    const safeIdx = size - down - 1; // último lugar fora da zona de descida
    toSafety = me.xp <= 0 ? 1 : safeIdx >= 0 ? Math.max(1, standings[safeIdx].xp - me.xp + 1) : null;
  }
  const above = i > 0 ? standings[i - 1] : null;
  const next = above ? { name: above.name, gap: Math.max(1, above.xp - me.xp + 1) } : null;
  return { toPromote, toSafety, next };
}

/** Frase curta de incentivo para a posição (sempre positiva). */
export function seasonNudge(tier: number, zone: Zone, goals: SeasonGoals, daysLeft: number): string {
  const d = division(tier);
  if (tier >= TOP_TIER && zone !== 'down') return `Você está na ${d.name}, o topo do Ritmo. Segure a posição!`;
  if (zone === 'up') return goals.next ? `Na zona de subida! Com mais ${goals.next.gap} pontos, você passa à frente de ${goals.next.name.replace(/\.$/, '')}` : 'Você lidera o grupo. Mantenha o ritmo até o fim do mês!';
  if (zone === 'down') return goals.toSafety != null ? `Faltam só ${goals.toSafety} pontos para sair da zona de descida. Dá tempo: ${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'}.` : 'Cada ponto conta: dá tempo de virar o jogo.';
  return goals.toPromote != null ? `Faltam ${goals.toPromote} pontos para entrar na zona de subida para ${division(tier + 1).name}.` : 'Siga somando pontos até o fim do mês.';
}
