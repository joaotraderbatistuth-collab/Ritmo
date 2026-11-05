import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { playRitmoSound, unlockSoundOnFirstTouch } from '../lib/notify-sound.js';

interface PushMsg {
  id: number;
  title: string;
  body: string;
  url: string;
}

/**
 * Quando chega uma notificação com o Ritmo aberto na tela, o service worker avisa a página:
 * aparece um aviso no topo (igual ao do celular) e toca o som do Ritmo.
 * Também responde ao evento `ritmo:push-preview` (usado pelo painel admin para pré-visualizar).
 */
export function PushListener() {
  const [items, setItems] = useState<PushMsg[]>([]);
  const seq = useRef(0);

  useEffect(() => {
    unlockSoundOnFirstTouch();
    const show = (d: { title?: string; body?: string; url?: string }) => {
      const id = ++seq.current;
      setItems((list) => [...list.slice(-2), { id, title: String(d.title || 'Ritmo'), body: String(d.body || ''), url: String(d.url || '/app') }]);
      playRitmoSound().catch(() => false);
      window.setTimeout(() => setItems((list) => list.filter((x) => x.id !== id)), 7000);
    };
    const onSw = (e: MessageEvent) => {
      if (e.data && e.data.type === 'ritmo-push') show(e.data);
    };
    const onPreview = (e: Event) => show((e as CustomEvent).detail || {});
    const sw = typeof navigator !== 'undefined' ? navigator.serviceWorker : undefined;
    sw?.addEventListener('message', onSw);
    window.addEventListener('ritmo:push-preview', onPreview);
    return () => {
      sw?.removeEventListener('message', onSw);
      window.removeEventListener('ritmo:push-preview', onPreview);
    };
  }, []);

  if (!items.length) return null;
  return (
    <div className="fixed top-2 inset-x-0 z-[9999] flex flex-col items-center gap-2 px-3 pointer-events-none" role="status" aria-live="polite">
      {items.map((m) => (
        <div
          key={m.id}
          className="ritmo-push-in pointer-events-auto w-full max-w-md rounded-2xl border border-white/10 bg-[#1c2128]/95 backdrop-blur-md shadow-2xl shadow-black/50 text-left"
        >
          <div className="flex items-start gap-3 p-3">
            <button
              type="button"
              className="flex items-start gap-3 flex-1 min-w-0 text-left"
              onClick={() => {
                setItems((l) => l.filter((x) => x.id !== m.id));
                if (!location.pathname.startsWith('/admin')) location.href = m.url;
              }}
            >
              <img src="/icon-192.png" alt="" className="w-10 h-10 rounded-xl shrink-0" />
              <span className="min-w-0">
                <span className="block text-[11px] text-slate-400 uppercase tracking-wide">Ritmo · agora</span>
                <span className="block text-sm font-bold text-white truncate">{m.title}</span>
                <span className="block text-sm text-slate-300 line-clamp-2">{m.body}</span>
              </span>
            </button>
            <button type="button" aria-label="Fechar aviso" onClick={() => setItems((l) => l.filter((x) => x.id !== m.id))} className="p-1 text-slate-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
      <style>{`@keyframes ritmoPushIn{from{opacity:0;transform:translateY(-24px) scale(.97)}to{opacity:1;transform:none}}.ritmo-push-in{animation:ritmoPushIn .35s cubic-bezier(.2,.9,.3,1.2) both}@media (prefers-reduced-motion: reduce){.ritmo-push-in{animation:none}}`}</style>
    </div>
  );
}
