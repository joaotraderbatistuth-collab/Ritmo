// "Compartilhar no Feed" a partir de qualquer aba: abre o Feed com a conquista já escolhida.
// Nada é publicado sozinho: a pessoa revisa, pode escrever algo e colocar foto, e toca em Publicar.
import type { Achievement } from './feed-rules.js';

export const SHARE_EVENT = 'ritmo:share-feed';

export function shareToFeed(a: Achievement) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<Achievement>(SHARE_EVENT, { detail: a }));
}

// Abrir o perfil de alguém (do Feed, dos comentários ou o próprio perfil).
export const OPEN_PROFILE_EVENT = 'ritmo:open-profile';

export function openProfile(userId: number) {
  if (typeof window === 'undefined' || !Number.isInteger(userId) || userId <= 0) return;
  window.dispatchEvent(new CustomEvent<number>(OPEN_PROFILE_EVENT, { detail: userId }));
}
