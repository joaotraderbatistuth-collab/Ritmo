import React, { useEffect, useState } from 'react';
import { Download } from 'lucide-react';

// Botão discreto de "Instalar app" — só aparece quando o navegador sinaliza
// que a instalação como PWA é possível (Chrome/Edge/Android). No iOS/Safari
// esse evento não existe; lá a instalação é manual via "Adicionar à Tela de Início".
export const InstallPwaButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const handleInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  if (!deferredPrompt || installed) return null;

  const handleInstall = async () => {
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  return (
    <button
      onClick={handleInstall}
      title="Instalar o Ritmo como app"
      className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161b22] border border-[#30363d] hover:border-emerald-500/50 text-[#8b949e] hover:text-emerald-400 text-xs font-medium transition-colors"
    >
      <Download className="w-3.5 h-3.5" />
      Instalar app
    </button>
  );
};
