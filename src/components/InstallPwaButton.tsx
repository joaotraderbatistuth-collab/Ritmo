import React, { useEffect, useState } from 'react';
import { Download, Share, PlusSquare, MoreVertical, X, Smartphone, CheckCircle2 } from 'lucide-react';

// "Baixar o app": o Ritmo é um PWA. No Android/Chrome/Edge o navegador oferece instalar com um toque
// (evento beforeinstallprompt). No iPhone (Safari) a instalação é manual: Compartilhar → Adicionar à Tela de Início.
// Quando o navegador não oferece o toque único, mostramos o passo a passo.

let deferred: any = null;
const listeners = new Set<() => void>();
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    deferred = e;
    listeners.forEach((l) => l());
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    try {
      localStorage.setItem('ritmo_app_installed', '1');
    } catch {}
    listeners.forEach((l) => l());
  });
}

const isIOS = () => typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone = () =>
  typeof window !== 'undefined' && (window.matchMedia?.('(display-mode: standalone)').matches || (navigator as any).standalone === true);

function useInstall() {
  const [, force] = useState(0);
  const [installed, setInstalled] = useState(false);
  useEffect(() => {
    const l = () => force((n) => n + 1);
    listeners.add(l);
    setInstalled(isStandalone());
    return () => {
      listeners.delete(l);
    };
  }, []);
  const install = async (): Promise<'done' | 'manual'> => {
    if (deferred) {
      deferred.prompt();
      const choice = await deferred.userChoice.catch(() => null);
      deferred = null;
      listeners.forEach((l) => l());
      return choice?.outcome === 'accepted' ? 'done' : 'manual';
    }
    return 'manual';
  };
  return { installed, canPrompt: Boolean(deferred), install };
}

export const InstallHelpModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const ios = isIOS();
  return (
    <div className="fixed inset-0 z-[70] bg-black/80 flex items-end sm:items-center justify-center p-3" onClick={onClose} role="dialog" aria-label="Como instalar o app">
      <div className="w-full max-w-md rounded-2xl border border-[#30363d] bg-[#161b22] p-5 text-[#f0f6fc]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold flex items-center gap-2"><Smartphone className="w-5 h-5 text-emerald-400" /> Instalar o Ritmo no celular</h3>
          <button type="button" onClick={onClose} aria-label="Fechar" className="text-[#8b949e]"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-sm text-[#8b949e] mt-1">Fica com ícone na tela inicial, abre em tela cheia e recebe lembretes. Não ocupa espaço como um app de loja.</p>
        <ol className="mt-4 space-y-3 text-sm">
          {ios ? (
            <>
              <li className="flex gap-3"><span className="w-7 h-7 rounded-full bg-emerald-500/15 text-emerald-300 flex items-center justify-center font-bold shrink-0">1</span><span>Abra este site no <strong>Safari</strong>.</span></li>
              <li className="flex gap-3"><span className="w-7 h-7 rounded-full bg-emerald-500/15 text-emerald-300 flex items-center justify-center font-bold shrink-0">2</span><span>Toque em <Share className="inline w-4 h-4 text-sky-400" /> <strong>Compartilhar</strong> (barra de baixo).</span></li>
              <li className="flex gap-3"><span className="w-7 h-7 rounded-full bg-emerald-500/15 text-emerald-300 flex items-center justify-center font-bold shrink-0">3</span><span>Role e toque em <PlusSquare className="inline w-4 h-4" /> <strong>Adicionar à Tela de Início</strong>, depois em <strong>Adicionar</strong>.</span></li>
              <li className="flex gap-3"><span className="w-7 h-7 rounded-full bg-emerald-500/15 text-emerald-300 flex items-center justify-center font-bold shrink-0">4</span><span>Abra o Ritmo pelo ícone novo e ligue os lembretes no sino.</span></li>
            </>
          ) : (
            <>
              <li className="flex gap-3"><span className="w-7 h-7 rounded-full bg-emerald-500/15 text-emerald-300 flex items-center justify-center font-bold shrink-0">1</span><span>Abra este site no <strong>Chrome</strong> (Android) ou no Chrome/Edge do computador.</span></li>
              <li className="flex gap-3"><span className="w-7 h-7 rounded-full bg-emerald-500/15 text-emerald-300 flex items-center justify-center font-bold shrink-0">2</span><span>Toque no menu <MoreVertical className="inline w-4 h-4" /> (três pontinhos).</span></li>
              <li className="flex gap-3"><span className="w-7 h-7 rounded-full bg-emerald-500/15 text-emerald-300 flex items-center justify-center font-bold shrink-0">3</span><span>Escolha <strong>Instalar app</strong> ou <strong>Adicionar à tela inicial</strong>.</span></li>
              <li className="flex gap-3"><span className="w-7 h-7 rounded-full bg-emerald-500/15 text-emerald-300 flex items-center justify-center font-bold shrink-0">4</span><span>Pronto: o ícone do Ritmo aparece junto dos outros apps.</span></li>
            </>
          )}
        </ol>
        <button type="button" onClick={onClose} className="mt-5 w-full py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold">Entendi</button>
      </div>
    </div>
  );
};

/** Botão do cabeçalho: aparece no celular e no computador enquanto o app não estiver instalado. */
export const InstallPwaButton: React.FC<{ label?: string; className?: string }> = ({ label = 'Instalar app', className }) => {
  const { installed, install } = useInstall();
  const [help, setHelp] = useState(false);
  if (installed) return null;
  const onClick = async () => {
    if ((await install()) === 'manual') setHelp(true);
  };
  return (
    <>
      <button
        type="button"
        onClick={onClick}
        title="Instalar o Ritmo como app"
        className={className || 'flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 text-xs font-semibold transition-colors'}
      >
        <Download className="w-3.5 h-3.5" />
        {className ? (
          <span>{label}</span>
        ) : (
          <>
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">App</span>
          </>
        )}
      </button>
      {help && <InstallHelpModal onClose={() => setHelp(false)} />}
    </>
  );
};

/** Cartão para Configurações e páginas: explica e instala. */
export const InstallAppCard: React.FC = () => {
  const { installed, install } = useInstall();
  const [help, setHelp] = useState(false);
  return (
    <div className="rounded-xl border border-[#30363d] bg-[#161b22] p-4 flex items-start gap-3">
      <Smartphone className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
      <div className="flex-1">
        <div className="text-sm font-semibold text-[#f0f6fc]">Ritmo como app no celular</div>
        <p className="text-xs text-[#8b949e] mt-0.5">{installed ? 'Você já está usando o app instalado.' : 'Ícone na tela inicial, tela cheia e lembretes. Grátis e sem loja de aplicativos.'}</p>
      </div>
      {installed ? (
        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
      ) : (
        <button type="button" onClick={async () => (await install()) === 'manual' && setHelp(true)} className="shrink-0 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs">Instalar</button>
      )}
      {help && <InstallHelpModal onClose={() => setHelp(false)} />}
    </div>
  );
};
