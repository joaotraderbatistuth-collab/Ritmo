import React, { useEffect, useState } from 'react';
import { BellRing, BellOff } from 'lucide-react';
import { callApi } from '../lib/client-api.js';

function b64ToUint8(base64: string) {
  const pad = '='.repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + pad).replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

const isIOS = () => typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone = () =>
  typeof window !== 'undefined' && (window.matchMedia?.('(display-mode: standalone)').matches || (navigator as any).standalone === true);

type State = 'loading' | 'unsupported' | 'ios-install' | 'denied' | 'off' | 'on';

/** Liga/desliga os lembretes no celular ou computador (Web Push). */
export const PushToggle: React.FC<{ compact?: boolean }> = ({ compact }) => {
  const [state, setState] = useState<State>('loading');
  const [perDay, setPerDay] = useState(3);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
        // no iPhone, notificações só funcionam com o app instalado na Tela de Início
        setState(isIOS() && !isStandalone() ? 'ios-install' : 'unsupported');
        return;
      }
      if (Notification.permission === 'denied') return setState('denied');
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        const sub = await reg?.pushManager.getSubscription();
        const r = await callApi('/api/push');
        if (r.ok) setPerDay((r.data as any).perDay || 3);
        setState(sub ? 'on' : 'off');
      } catch {
        setState('off');
      }
    })();
  }, []);

  const enable = async () => {
    setBusy(true);
    setMsg('');
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState(permission === 'denied' ? 'denied' : 'off');
        return;
      }
      const keyRes = await callApi('/api/push');
      if (!keyRes.ok) throw new Error((keyRes.data as any).error || 'Não foi possível ligar agora.');
      const reg = (await navigator.serviceWorker.getRegistration()) || (await navigator.serviceWorker.register('/sw.js'));
      await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToUint8((keyRes.data as any).publicKey) });
      const r = await callApi('/api/push', { action: 'subscribe', subscription: sub.toJSON(), perDay });
      if (!r.ok) throw new Error((r.data as any).error || 'Não foi possível ligar agora.');
      setState('on');
      setMsg((r.data as any).message || 'Notificações ligadas!');
    } catch (e: any) {
      setMsg(e?.message || 'Não foi possível ligar as notificações neste aparelho.');
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    setBusy(true);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await callApi('/api/push', { action: 'unsubscribe', endpoint: sub.endpoint });
        await sub.unsubscribe();
      }
      setState('off');
      setMsg('Notificações desligadas neste aparelho.');
    } finally {
      setBusy(false);
    }
  };

  const changePerDay = async (n: number) => {
    setPerDay(n);
    if (state === 'on') await callApi('/api/push', { action: 'per_day', perDay: n });
  };

  if (state === 'loading') return null;

  return (
    <div className={`rounded-xl border border-[#30363d] bg-[#161b22] ${compact ? 'p-3' : 'p-4'}`}>
      <div className="flex items-start gap-3">
        {state === 'on' ? <BellRing className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" /> : <BellOff className="w-5 h-5 text-[#8b949e] shrink-0 mt-0.5" />}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-[#f0f6fc]">Lembretes no celular</div>
          {state === 'on' && <p className="text-xs text-[#8b949e] mt-0.5">Ligados. Você recebe empurrõezinhos aos poucos: criar um card, um ciclo de foco, um treino...</p>}
          {state === 'off' && <p className="text-xs text-[#8b949e] mt-0.5">Receba lembretes aos poucos durante o dia, mesmo com o app fechado.</p>}
          {state === 'denied' && <p className="text-xs text-amber-300 mt-0.5">As notificações foram bloqueadas neste navegador. Libere nas configurações do site (cadeado ao lado do endereço) e volte aqui.</p>}
          {state === 'ios-install' && <p className="text-xs text-amber-300 mt-0.5">No iPhone, instale o Ritmo na Tela de Início primeiro (Compartilhar → Adicionar à Tela de Início) e abra por lá para ligar os lembretes.</p>}
          {state === 'unsupported' && <p className="text-xs text-[#8b949e] mt-0.5">Este navegador não recebe notificações. Os lembretes continuam aparecendo no sino do app.</p>}

          {(state === 'on' || state === 'off') && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <label className="text-xs text-[#8b949e]">Quantos por dia:</label>
              {[1, 2, 3].map((n) => (
                <button key={n} type="button" onClick={() => changePerDay(n)} className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${perDay === n ? 'bg-emerald-500 text-slate-950 border-emerald-500' : 'border-[#30363d] text-[#c9d1d9]'}`}>{n}</button>
              ))}
            </div>
          )}
          {msg && <p role="status" className="text-xs text-emerald-300 mt-2">{msg}</p>}
        </div>
        {state === 'off' && <button type="button" onClick={enable} disabled={busy} className="shrink-0 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs disabled:opacity-50">{busy ? 'Ligando...' : 'Ligar'}</button>}
        {state === 'on' && <button type="button" onClick={disable} disabled={busy} className="shrink-0 px-3 py-1.5 rounded-lg border border-[#30363d] text-xs text-[#c9d1d9]">Desligar</button>}
      </div>
    </div>
  );
};
