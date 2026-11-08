import { useEffect, useState } from 'react';

/** Aviso discreto no topo: "Também preenchido: card no quadro Agenda, provisão em Finanças e 2 lembretes". */
export function AutoFillToast() {
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const h = (e: Event) => {
      const text = String((e as CustomEvent).detail || '').trim();
      if (!text) return;
      setMsg(text);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setMsg(null), 6000);
    };
    window.addEventListener('ritmo:autofill', h);
    return () => {
      window.removeEventListener('ritmo:autofill', h);
      if (timer) clearTimeout(timer);
    };
  }, []);

  if (!msg) return null;
  return (
    <div className="fixed left-1/2 top-3 z-[70] w-[calc(100%-2rem)] max-w-md -translate-x-1/2" role="status" aria-live="polite">
      <button
        type="button"
        onClick={() => setMsg(null)}
        className="flex w-full items-start gap-3 rounded-2xl border border-emerald-500/30 bg-slate-900/95 px-4 py-3 text-left shadow-xl backdrop-blur"
      >
        <span className="mt-0.5 text-lg leading-none" aria-hidden>
          ⚡
        </span>
        <span className="text-sm text-slate-100">
          <strong className="block text-emerald-300">Preenchido automaticamente</strong>
          {msg[0].toUpperCase() + msg.slice(1)}.
        </span>
      </button>
    </div>
  );
}
