import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Flame } from 'lucide-react';
import { AuthModal } from '../components/AuthModal.js';

export const Route = createFileRoute('/login')({
  component: LoginPage,
});

function LoginPage() {
  const [ready, setReady] = useState(false);
  const [initialTab, setInitialTab] = useState<'login' | 'register'>('login');
  const [referral, setReferral] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('modo') === 'cadastro') setInitialTab('register');

    const ref = params.get('ref');
    if (ref) localStorage.setItem('ritmo_referral', ref);
    setReferral(ref || localStorage.getItem('ritmo_referral') || '');

    // Quem já está logado vai direto para o painel.
    fetch('/api/auth')
      .then((r) => r.json())
      .then((d) => {
        if (d?.user) window.location.href = '/app';
        else setReady(true);
      })
      .catch(() => setReady(true));
  }, []);

  const goToApp = () => {
    window.location.href = '/app';
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#f0f6fc] flex flex-col items-center justify-center px-4">
      <a href="/" className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-amber-500 flex items-center justify-center shadow-lg shadow-emerald-500/10">
          <Flame className="w-6 h-6 text-white" />
        </div>
        <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">
          Ritmo
        </span>
      </a>
      {ready && (
        <AuthModal
          key={initialTab + referral}
          isOpen
          initialTab={initialTab}
          initialReferralCode={referral}
          onClose={() => {
            window.location.href = '/';
          }}
          onLoginSuccess={goToApp}
        />
      )}
      {!ready && <p className="text-sm text-[#8b949e]">Carregando...</p>}
    </div>
  );
}
