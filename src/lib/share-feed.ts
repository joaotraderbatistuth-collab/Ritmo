// "Compartilhar no Feed" a partir de qualquer aba: abre o Feed com a conquista já escolhida.
// Nada é publicado sozinho: a pessoa revisa, pode escrever algo e colocar foto, e toca em Publicar.
import type { Achievement } from './feed-rules.js';
import { cardFromAchievement, type ShareCard } from './share-card.js';

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

// "Compartilhar em redes sociais": abre a folha com WhatsApp, Instagram (Stories), Feed do Ritmo e link.
export const OPEN_SHARE_EVENT = 'ritmo:open-share';

export function openShare(card: ShareCard) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<ShareCard>(OPEN_SHARE_EVENT, { detail: card }));
}

/** Qualquer conquista do app: abre a folha de compartilhar (com a opção de publicar no Feed). */
export function shareAchievement(a: Achievement) {
  openShare(cardFromAchievement(a));
}
