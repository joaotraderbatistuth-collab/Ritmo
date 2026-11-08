// Lado do app do preenchimento automático: avisa o que foi preenchido e pede para as abas recarregarem.
export interface AutoInfo {
  message?: string;
  items?: { kind: string; id: number }[];
}

/** Depois de criar/mudar algo: se o servidor mexeu em outras abas, recarrega e mostra o aviso. */
export function announceAuto(auto?: AutoInfo | null, linked?: boolean) {
  if (typeof window === 'undefined') return;
  if ((auto?.items && auto.items.length > 1) || linked) window.dispatchEvent(new Event('ritmo:linked-changed'));
  if (auto?.message) window.dispatchEvent(new CustomEvent('ritmo:autofill', { detail: auto.message }));
}
