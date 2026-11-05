// Notificações no aparelho (lado do navegador). Ligadas por padrão:
// - permissão já dada → o Ritmo inscreve o aparelho sozinho, sem perguntar;
// - permissão ainda não pedida → o app mostra um convite de um toque;
// - a pessoa desligou de propósito (push_opt_out) → o Ritmo respeita e não liga de novo.
import { callApi } from './client-api.js';

export function b64ToUint8(base64: string) {
  const pad = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export const isIOS = () => typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);
export const isStandalone = () =>
  typeof window !== 'undefined' && (window.matchMedia?.('(display-mode: standalone)').matches || (navigator as any).standalone === true);

export function pushSupported() {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

/** Inscreve este aparelho no servidor (a permissão já precisa estar dada). */
export async function subscribeThisDevice(opts: { auto?: boolean; perDay?: number } = {}) {
  const keyRes = await callApi('/api/push');
  if (!keyRes.ok) throw new Error((keyRes.data as any).error || 'Não foi possível ligar agora.');
  const reg = (await navigator.serviceWorker.getRegistration()) || (await navigator.serviceWorker.register('/sw.js'));
  await navigator.serviceWorker.ready;
  const sub =
    (await reg.pushManager.getSubscription()) ||
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToUint8((keyRes.data as any).publicKey) }));
  const r = await callApi('/api/push', {
    action: 'subscribe',
    subscription: sub.toJSON(),
    perDay: opts.perDay || (keyRes.data as any).perDay || 3,
    auto: Boolean(opts.auto),
  });
  if (!r.ok) throw new Error((r.data as any).error || 'Não foi possível ligar agora.');
  return r.data as { message?: string };
}

export type AutoResult = 'unsupported' | 'denied' | 'opted-out' | 'enabled' | 'ask' | 'ios-install' | 'error';

/**
 * Roda ao abrir o app. Liga sozinho quando já existe permissão e a pessoa não desligou;
 * devolve 'ask' quando é preciso mostrar o convite (o navegador exige um toque para pedir permissão).
 */
export async function autoEnablePush(): Promise<AutoResult> {
  if (!pushSupported()) return isIOS() && !isStandalone() ? 'ios-install' : 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  try {
    const r = await callApi('/api/push');
    if (!r.ok) return 'error';
    if ((r.data as any).optOut) return 'opted-out';
    if (Notification.permission === 'granted') {
      await subscribeThisDevice({ auto: true });
      return 'enabled';
    }
    return 'ask';
  } catch {
    return 'error';
  }
}
