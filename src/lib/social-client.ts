// Contador de novidades sociais (curtidas, comentários, seguidores, aplausos) no navegador.
// Vem junto com os pontos (/api/xp) e zera quando a pessoa abre a Atividade no Feed.
import { useSyncExternalStore } from 'react';

let unread = 0;
const listeners = new Set<() => void>();

export function setSocialUnread(n: number) {
  const v = Math.max(0, Math.floor(Number(n) || 0));
  if (v === unread) return;
  unread = v;
  listeners.forEach((l) => l());
}

const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export function useSocialUnread(): number {
  return useSyncExternalStore(subscribe, () => unread, () => 0);
}
