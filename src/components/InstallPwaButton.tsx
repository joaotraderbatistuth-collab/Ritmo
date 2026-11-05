import React, { useEffect, useState } from 'react';
import { Download, Share, PlusSquare, MoreVertical, X, Smartphone, CheckCircle2 } from 'lucide-react';

// "Baixar o app": o Ritmo é um PWA. No Android/Chrome/Edge o navegador oferece instalar com um toque
// (evento beforeinstallprompt). No iPhone (Safari) a instalação é manual: Compartilhar → Adicionar à Tela de Início.
// Quando o navegador não oferece o toque único, mostramos o passo a passo.

// O convite é capturado cedo pelo script do __root.tsx (window.__ritmoInstallPrompt).
const listeners = new Set<() => void>();
const getDeferred = (): any => (typeof window !== 'undefined' ? (window as any).__ritmoInstallPrompt || null : null);
const setDeferred = (v: any) => {
  if (typeof window !== 'undefined') (window as any).__ritmoInstallPrompt = v;
};
if (typeof window !== 'undefined') {
  // reserva: se o script do __root não existir (ex.: página antiga em cache)
  window.addEventListener('beforeinstallprompt', (e: Event) => {
    e.preventDefault();
    setDeferred(e);
    listeners.forEach((l) => l());
  });
  window.addEventListener('ritmo:installable', () => listeners.forEach((l) => l()));
  window.addEventListener('appinstalled', () => {
    setDeferred(null);
    try {
      localStorage.setItem('ritmo_app_installed', '1');
    } catch {}
    listeners.forEach((l) => l());
  });
}

const isIOS = () =>
  typeof navigator !== 'undefined' && (/iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
const isIOSOtherBrowser = () => typeof navigator !== 'undefined' && /CriOS|FxiOS|EdgiOS/i.test(navigator.userAgent);
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
  const install = async (): Promise<'done' | 'dismissed' | 'manual'> => {
    const deferred = getDeferred();
    if (deferred) {
      try {
        deferred.prompt();
        const choice = await deferred.userChoice.catch(() => null);
        setDeferred(null);
        listeners.forEach((l) => l());
        if (choice?.outcome === 'accepted') {
          setInstalled(true);
          return 'done';
        }
        return 'dismissed';
      } catch {
        setDeferred(null);
      }
    }
    return 'manual';
  };
  return { installed, canPrompt: Boolean(getDeferred()), install };
}

export const InstallHelpModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const ios = isIOS();
  return (
    <div className={`fixed inset-0 z-[70] bg-black/80 flex items-end sm:items-center justify-center p-3 ${ios ? 'pb-24' : ''}`} onClick={onClose} role="dialog" aria-label="Como instalar o app">
      <div className="w-full max-w-md rounded-2xl border border-[#30363d] bg-[#161b22] p-5 text-[#f0f6fc]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold flex items-center gap-2"><Smartphone className="w-5 h-5 text-emerald-400" /> Instalar o Ritmo no celular</h3>
          <button type="button" onClick={onClose} aria-label="Fechar" className="text-[#8b949e]"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-sm text-[#8b949e] mt-1">Fica com ícone na tela inicial, abre em tela cheia e recebe lembretes. Não ocupa espaço como um app de loja.</p>
        <ol className="mt-4 space-y-3 text-sm">
          {ios ? (
            <>
              <li className="flex gap-3"><span className="w-7 h-7 rounded-full bg-emerald-500/15 text-emerald-300 flex items-center justify-center font-bold shrink-0">1</span><span>{isIOSOtherBrowser() ? <>No Chrome do iPhone, toque em <Share className="inline w-4 h-4 text-sky-400" /> <strong>Compartilhar</strong> (no alto, ao lado do endereço). Se não aparecer, abra o site no <strong>Safari</strong>.</> : <>Toque em <Share className="inline w-4 h-4 text-sky-400" /> <strong>Compartilhar</strong>, na barra de baixo do Safari (a seta abaixo mostra onde).</>}</span></li>
              <li className="flex gap-3"><span className="w-7 h-7 rounded-full bg-emerald-500/15 text-emerald-300 flex items-center justify-center font-bold shrink-0">2</span><span>O iPhone não deixa nenhum site criar o atalho sozinho: é só esse passo rápido, uma vez.</span></li>
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
      {ios && !isIOSOtherBrowser() && (
        <div className="fixed bottom-1 left-1/2 -translate-x-1/2 flex flex-col items-center text-sky-300 animate-bounce pointer-events-none" aria-hidden="true">
          <span className="text-xs font-bold bg-[#161b22] border border-sky-400/50 rounded-full px-3 py-1 mb-1 whitespace-nowrap">Toque em Compartilhar aqui embaixo</span>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4v16M5 13l7 7 7-7" /></svg>
        </div>
      )}
    </div>
  );
};

/** Botão do cabeçalho: aparece no celular e no computador enquanto o app não estiver instalado. */
export const InstallPwaButton: React.FC<{ label?: string; className?: string }> = ({ label = 'Instalar app', className }) => {
  const { installed, install } = useInstall();
  const [help, setHelp] = useState(false);
  if (installed) return null;
  const onClick = async () => {
    const r = await install();
    if (r === 'manual') setHelp(true);
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
        <button type="button" onClick={async () => { if ((await install()) === 'manual') setHelp(true); }} className="shrink-0 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs">Instalar</button>
      )}
      {help && <InstallHelpModal onClose={() => setHelp(false)} />}
    </div>
  );
};

/**
 * Aviso automático no celular: aparece sozinho enquanto o app não estiver na tela inicial.
 * No Android um toque já cria o atalho; no iPhone mostra o passo rápido (o iOS não permite automático).
 * "Agora não" esconde por 7 dias.
 */
export const InstallBanner: React.FC = () => {
  const { installed, canPrompt, install } = useInstall();
  const [help, setHelp] = useState(false);
  const [hidden, setHidden] = useState(true);
  useEffect(() => {
    try {
      const until = Number(localStorage.getItem('ritmo_install_banner_until') || 0);
      const already = localStorage.getItem('ritmo_app_installed') === '1';
      const mobile = /android|iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      setHidden(!mobile || already || Date.now() < until);
    } catch {
      setHidden(false);
    }
  }, []);
  if (installed || hidden || (!canPrompt && !isIOS())) return null;
  const later = () => {
    try { localStorage.setItem('ritmo_install_banner_until', String(Date.now() + 7 * 86400_000)); } catch {}
    setHidden(true);
  };
  return (
    <div className="mb-4 rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-emerald-500/15 to-teal-500/5 p-3.5 flex items-center gap-3">
      <img src="/icon-192.png" alt="" className="w-11 h-11 rounded-xl shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-[#f0f6fc]">Coloque o Ritmo na tela inicial</p>
        <p className="text-xs text-[#8b949e]">Abre como app, em tela cheia, e recebe lembretes.</p>
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        <button
          type="button"
          onClick={async () => {
            const r = await install();
            if (r === 'manual') setHelp(true);
          }}
          className="px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm"
        >
          Instalar
        </button>
        <button type="button" onClick={later} className="text-[11px] text-[#8b949e] underline">Agora não</button>
      </div>
      {help && <InstallHelpModal onClose={() => setHelp(false)} />}
    </div>
  );
};
