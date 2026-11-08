// Cartão de conquista para compartilhar (Stories do Instagram, WhatsApp e Feed). Regras PURAS e testadas.
// Cada compartilhamento vira um link público /c/<código> que mostra a conquista e leva ao cadastro
// com o código de indicação de quem compartilhou.
import { achievementHeadline, normalizeText, type Achievement } from './feed-rules.js';
import { RARITY, rarityOf, type Medal, type Rarity } from './medals.js';
import { division } from './season.js';
import { SPORTS, formatDuration, formatKm } from './workout.js';

export interface ShareCard {
  /** tipo (o mesmo das conquistas do Feed, ou "medalha", "retrospectiva") */
  kind: string;
  emoji: string;
  /** chamada grande: "Ofensiva de 7 dias" */
  title: string;
  /** detalhe: "7 dias seguidos fazendo um pouco a cada dia" */
  subtitle: string;
  /** selo no topo: "CONQUISTA ÉPICA", "SUBIU DE NÍVEL" */
  tag: string;
  /** cor de destaque */
  color: string;
  /** número em destaque (opcional) e o que ele significa */
  big?: string;
  bigLabel?: string;
  /** até 6 números pequenos (retrospectiva) */
  stats?: [string, string][];
  /** se dá para publicar no Feed do Ritmo, a conquista correspondente */
  feed?: Achievement | null;
}

const GREEN = '#34d399';
const AMBER = '#f59e0b';
const VIOLET = '#a855f7';
const SKY = '#38bdf8';
const ORANGE = '#fb923c';

/** Cartão a partir de uma conquista do Feed (hábito, tarefa, foco, treino, nível, ofensiva...). */
export function cardFromAchievement(a: Achievement): ShareCard {
  const base = { kind: a.type, feed: a };
  switch (a.type) {
    case 'nivel':
      return { ...base, emoji: '⭐', tag: 'SUBIU DE NÍVEL', color: AMBER, title: `Nível ${a.level} · ${a.name}`, subtitle: 'Constância vira nível no Ritmo.', big: String(a.level), bigLabel: 'nível' };
    case 'ofensiva':
      return { ...base, emoji: '🔥', tag: 'OFENSIVA', color: ORANGE, title: `${a.days} dias seguidos`, subtitle: 'Um pouco todo dia, sem extremismo.', big: String(a.days), bigLabel: a.days === 1 ? 'dia' : 'dias' };
    case 'divisao': {
      const d = division(a.tier);
      return { ...base, emoji: d.emoji, tag: 'TEMPORADA', color: d.color, title: `Divisão ${a.name}`, subtitle: 'Subi de divisão na temporada do mês.' };
    }
    case 'semana':
      return { ...base, emoji: '📈', tag: 'SEMANA FECHADA', color: GREEN, title: `${a.xp} pontos na semana`, subtitle: `${a.activeDays} ${a.activeDays === 1 ? 'dia ativo' : 'dias ativos'}`, big: String(a.xp), bigLabel: 'pontos' };
    case 'treino': {
      const sp = SPORTS[a.sport];
      return { ...base, emoji: a.sport === 'bike' ? '🚴' : a.sport === 'caminhada' ? '🚶' : a.sport === 'trilha' ? '🥾' : '🏃', tag: 'TREINO FEITO', color: SKY, title: `${sp.label}: ${formatKm(a.distanceM)} km`, subtitle: `em ${formatDuration(a.durationS)}`, big: formatKm(a.distanceM), bigLabel: 'km' };
    }
    case 'medalha': {
      const r = RARITY[rarityOf(a.id)];
      return { ...base, emoji: a.emoji, tag: `CONQUISTA ${r.name.toUpperCase()}`, color: r.color, title: a.name, subtitle: 'Conquista desbloqueada no Ritmo.' };
    }
    case 'sessao':
    case 'foco':
      return { ...base, emoji: '🎯', tag: 'FOCO', color: VIOLET, title: achievementHeadline(a), subtitle: 'Tempo de foco de verdade.', big: String(a.minutes), bigLabel: 'minutos' };
    case 'habito':
    case 'corrente':
      return { ...base, emoji: '💧', tag: 'HÁBITO', color: GREEN, title: achievementHeadline(a), subtitle: 'Um pouco melhor a cada dia.' };
    case 'tarefa':
    case 'tarefas':
    case 'card':
      return { ...base, emoji: '✅', tag: 'FEITO', color: GREEN, title: achievementHeadline(a), subtitle: 'Planejei e fiz acontecer.' };
    case 'meta':
      return { ...base, emoji: '🗺️', tag: 'META', color: VIOLET, title: achievementHeadline(a), subtitle: 'Passo a passo até lá.' };
  }
}

/** Cartão de uma medalha (conquista) ganha. */
export function cardFromMedal(m: Pick<Medal, 'id' | 'emoji' | 'name' | 'desc'> & { rarity?: Rarity }): ShareCard {
  const r = RARITY[m.rarity || rarityOf(m.id)];
  return {
    kind: 'medalha',
    emoji: m.emoji,
    tag: `CONQUISTA ${r.name.toUpperCase()}`,
    color: r.color,
    title: m.name,
    subtitle: m.desc,
    feed: { type: 'medalha', id: m.id, name: m.name, emoji: m.emoji },
  };
}

/** Texto que vai junto no WhatsApp/Instagram. Convite leve, sem promessa. */
export function shareMessage(card: Pick<ShareCard, 'emoji' | 'title'>, url: string): string {
  return `${card.emoji} ${card.title} no Ritmo! Tô sendo um pouco melhor a cada dia. Bora junto? Teste 7 dias grátis: ${url}`;
}

/** Link curto mostrado na imagem (sem https://). */
export const shortLink = (url: string) => url.replace(/^https?:\/\//, '').replace(/\/$/, '');

/* ---------------- Servidor: validação e código do link ---------------- */

export const SHARE_LIMITS = { perHour: 40, imageMax: 450_000 };

/** Limpa o cartão vindo do navegador (o que vai para a página pública). */
export function sanitizeShare(raw: unknown): { kind: string; emoji: string; title: string; subtitle: string } | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const kind = String(r.kind || '');
  if (!/^[a-z_]{2,20}$/.test(kind)) return null;
  const emoji = normalizeText(r.emoji, 16).replace(/\s+/g, '');
  const title = normalizeText(r.title, 90).replace(/\s+/g, ' ');
  const subtitle = normalizeText(r.subtitle, 160).replace(/\s+/g, ' ');
  if (!title) return null;
  if (/https?:|www\.|<|>/i.test(title + subtitle)) return null; // nada de link ou HTML na página pública
  return { kind, emoji, title, subtitle };
}

/** Código do link: 8 letras/números sem os confusos (0/O, 1/l/I). */
export function makeSlug(random: (n: number) => number = (n) => Math.floor(Math.random() * n)): string {
  const abc = 'abcdefghijkmnpqrstuvwxyz23456789';
  let s = '';
  for (let i = 0; i < 8; i++) s += abc[random(abc.length)];
  return s;
}
export const isSlug = (s: unknown): s is string => typeof s === 'string' && /^[a-z2-9]{8}$/.test(s);

/** Escapa texto para a página HTML pública. */
export const escapeHtml = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
