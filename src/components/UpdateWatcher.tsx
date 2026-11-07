import { useEffect, useRef, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';

/**
 * Mantém o app sempre na versão mais nova publicada.
 *
 * - Cada build grava /version.json com um identificador (vite.config.ts) e embute o mesmo valor
 *   no código (__RITMO_BUILD__).
 * - O app confere o /version.json ao abrir, ao voltar para a tela e a cada 10 minutos.
 * - Se a pessoa estava fora do app e volta, recarrega sozinho (sem perguntar).
 * - Se está usando o app na hora, aparece um aviso "Nova versão do Ritmo" com o botão Atualizar.
 * - Nunca recarrega sozinho durante um treino em andamento ou com a pessoa digitando.
 */
const CHECK_EVERY_MS = 10 * 60 * 1000;
const AWAY_MS = 30 * 1000;

function currentBuild(): string {
  try {
    return typeof __RITMO_BUILD__ === 'string' ? __RITMO_BUILD__ : '';
  } catch {
    return '';
  }
}

function busy(): boolean {
  try {
    if (localStorage.getItem('ritmo_workout_live')) return true;
  } catch {}
  const el = document.activeElement as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
}

async function reloadFresh() {
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    await reg?.update();
  } catch {}
  location.reload();
}

export function UpdateWatcher() {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const hiddenAt = useRef<number>(0);
  const checking = useRef(false);

  useEffect(() => {
    const mine = currentBuild();
    const local = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    if (!mine || local) return;

    const check = async (): Promise<boolean> => {
      if (checking.current) return false;
      checking.current = true;
      try {
        const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) return false;
        const data = await res.json().catch(() => null);
        const latest = data && typeof data.build === 'string' ? data.build : '';
        const isNew = Boolean(latest && latest !== mine);
        if (isNew) setHasUpdate(true);
        return isNew;
      } catch {
        return false;
      } finally {
        checking.current = false;
      }
    };

    const onVisible = async () => {
      if (document.visibilityState === 'hidden') {
        hiddenAt.current = Date.now();
        return;
      }
      const wasAway = hiddenAt.current > 0 && Date.now() - hiddenAt.current > AWAY_MS;
      hiddenAt.current = 0;
      const isNew = await check();
      if (isNew && wasAway && !busy()) reloadFresh();
    };

    const first = window.setTimeout(check, 4000);
    const timer = window.setInterval(check, CHECK_EVERY_MS);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', check);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', check);
    };
  }, []);

  if (!hasUpdate || dismissed) return null;
  return (
    <div className="fixed bottom-24 inset-x-0 z-[9998] flex justify-center px-3 pointer-events-none" role="status" aria-live="polite">
      <div className="pointer-events-auto w-full max-w-md rounded-2xl border border-emerald-400/30 bg-[#1c2128]/95 backdrop-blur-md shadow-2xl shadow-black/50 flex items-center gap-3 p-3">
        <RefreshCw className="w-5 h-5 text-emerald-400 shrink-0" />
        <span className="flex-1 min-w-0 text-sm text-white/90">Saiu uma versão nova do Ritmo.</span>
        <button
          type="button"
          onClick={reloadFresh}
          className="shrink-0 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#0d1117] font-semibold text-sm px-3 py-1.5"
        >
          Atualizar
        </button>
        <button type="button" aria-label="Depois" onClick={() => setDismissed(true)} className="shrink-0 text-white/50 hover:text-white p-1">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
