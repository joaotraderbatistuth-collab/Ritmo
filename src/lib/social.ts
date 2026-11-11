// Regras PURAS da parte social: o que entra em "Atividade" (quem curtiu, comentou, aplaudiu ou
// começou a seguir), o que é novo, os textos e a ordem das sugestões de quem seguir. Testadas em tests/.

export type SocialKind = 'like' | 'comment' | 'follow' | 'clap';

export interface SocialEvent {
  kind: SocialKind;
  /** Quando aconteceu (ISO). */
  at: string;
  actorId: number;
  postId?: number | null;
  /** Trecho do comentário ou da publicação curtida. */
  text?: string | null;
}

export const ACTIVITY_DAYS = 30;
export const ACTIVITY_MAX = 40;

const time = (iso: string | null | undefined) => {
  const t = iso ? Date.parse(iso) : NaN;
  return Number.isFinite(t) ? t : 0;
};

export const snippet = (text: unknown, max = 80): string => {
  const s = String(text ?? '').replace(/\s+/g, ' ').trim();
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
};

/** Junta tudo, do mais novo para o mais antigo, e marca o que chegou depois da última vez que a pessoa olhou. */
export function mergeActivity<T extends SocialEvent>(events: T[], seenAt: string | null | undefined, limit = ACTIVITY_MAX): { items: (T & { fresh: boolean })[]; unread: number } {
  const seen = time(seenAt);
  const sorted = events.filter((e) => time(e.at) > 0).sort((a, b) => time(b.at) - time(a.at));
  const unread = sorted.filter((e) => time(e.at) > seen).length;
  return { items: sorted.slice(0, limit).map((e) => ({ ...e, fresh: time(e.at) > seen })), unread };
}

/** "curtiu sua publicação", "comentou: ...", "começou a seguir você", "aplaudiu seu story". */
export function activityText(kind: SocialKind, text?: string | null): string {
  if (kind === 'like') return 'curtiu sua publicação';
  if (kind === 'comment') return text ? `comentou: “${snippet(text, 90)}”` : 'comentou na sua publicação';
  if (kind === 'clap') return 'aplaudiu seu story';
  return 'começou a seguir você';
}

/** Texto da notificação no celular quando alguém interage com a pessoa. */
export function socialPush(kind: 'like' | 'comment', name: string, text?: string | null): { title: string; body: string } {
  if (kind === 'like') return { title: 'Curtiram sua publicação', body: `${name} curtiu o que você publicou no Ritmo.` };
  return { title: 'Novo comentário', body: text ? `${name}: ${snippet(text, 100)}` : `${name} comentou na sua publicação.` };
}

/** Número do selo: até 99, depois "99+". */
export const badgeLabel = (n: number): string => (n > 99 ? '99+' : n > 0 ? String(Math.floor(n)) : '');

export interface FollowCandidate {
  id: number;
  /** Pontos desta semana (0 se a semana guardada for outra). */
  weekXp: number;
  xpTotal: number;
  /** Publicações nos últimos 14 dias. */
  recentPosts: number;
  /** Já segue quem está olhando. */
  followsMe: boolean;
  hasPhoto: boolean;
}

/** Quem aparece primeiro em "Quem seguir": quem já segue você, quem publica e quem está ativo esta semana. */
export function rankSuggestions<T extends FollowCandidate>(list: T[], limit = 6): T[] {
  const score = (c: FollowCandidate) => (c.followsMe ? 500 : 0) + Math.min(c.recentPosts, 5) * 60 + Math.min(c.weekXp, 400) + Math.min(c.xpTotal, 5000) / 50 + (c.hasPhoto ? 20 : 0);
  return list
    .filter((c) => c.followsMe || c.recentPosts > 0 || c.weekXp > 0 || c.xpTotal >= 50)
    .sort((a, b) => score(b) - score(a) || a.id - b.id)
    .slice(0, limit);
}
