import React, { useEffect, useState } from 'react';
import { X, Lock, Mail, User as UserIcon, Key, ArrowRight, CheckCircle2, AlertCircle, Hammer } from 'lucide-react';
import { User } from '../lib/types.js';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
  initialReferralCode?: string;
  initialTab?: 'login' | 'register' | 'forgot';
}

type Tab = 'login' | 'register' | 'forgot';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialReferralCode = '',
  initialTab = 'login',
}) => {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState(initialReferralCode);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  // Recuperação de senha em duas etapas: pedir o código por e-mail, depois informar código e nova senha
  const [resetStep, setResetStep] = useState<'request' | 'confirm'>('request');
  const [resetCode, setResetCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  // Fase de lançamento: quando as vagas acabam, o cadastro vira a lista de espera.
  const [closed, setClosed] = useState<{ title: string; message: string } | null>(null);
  const [waitDone, setWaitDone] = useState<string | null>(null);
  // Fase de Fundadores: os primeiros cadastros ganham acesso vitalício (o servidor é quem decide).
  const [founderOpen, setFounderOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    let alive = true;
    fetch('/api/vagas')
      .then((r) => r.json())
      .then((d) => {
        if (alive && d && d.open === false) setClosed({ title: d.title, message: d.message });
        if (alive && d && d.founderOpen === true) setFounderOpen(true);
      })
      .catch(() => null);
    return () => {
      alive = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sourceTag = () => {
    try {
      return JSON.parse(localStorage.getItem('ritmo_source') || 'null')?.src || undefined;
    } catch {
      return undefined;
    }
  };

  const joinWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/vagas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join', name, email, source: sourceTag() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Não foi possível entrar na lista agora.');
      setWaitDone(data.message || 'Pronto! Você está na lista de espera.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const post = async (payload: Record<string, unknown>) => {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (data.code === 'signup_closed') setClosed({ title: data.title || 'Ritmo em construção', message: data.error });
      throw Object.assign(new Error(data.error || 'Não foi possível concluir a ação. Tente novamente.'), { code: data.code });
    }
    return data;
  };

  const switchTab = (next: Tab) => {
    setTab(next);
    setError(null);
    setSuccessMessage(null);
    setResetStep('request');
    setResetCode('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (tab === 'login') {
        const data = await post({ action: 'login', email, password });
        onLoginSuccess(data.user);
      } else if (tab === 'register') {
        const data = await post({
          action: 'register',
          name,
          email,
          password,
          referralCode: referralCode.trim() || undefined,
          acceptedTerms,
          source: sourceTag(),
        });
        onLoginSuccess(data.user);
      } else if (resetStep === 'request') {
        const data = await post({ action: 'forgot_password', email });
        setResetStep('confirm');
        // Em modo demonstração (sem e-mail configurado no servidor) o código volta na resposta.
        setSuccessMessage(
          data.demoMode && data.code
            ? `Modo demonstração (e-mail não configurado): seu código é ${data.code}`
            : (data.message as string) || 'Se este e-mail estiver cadastrado, enviamos um código de 6 dígitos. Ele vale por 1 hora.'
        );
        setPassword('');
      } else {
        const data = await post({ action: 'reset_password', email, code: resetCode.trim(), newPassword: password });
        switchTab('login');
        setPassword('');
        setSuccessMessage(data.message || 'Senha atualizada! Você já pode entrar.');
      }
    } catch (err: any) {
      if (err.code !== 'signup_closed') setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    'w-full bg-[#0d1117] border border-[#30363d] rounded-lg pl-9 pr-3 py-2 text-sm text-[#f0f6fc] focus:outline-none focus:border-emerald-500';
  const tabClass = (active: boolean) =>
    `pb-2.5 px-4 text-sm font-semibold transition-colors relative ${
      active ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-[#8b949e] hover:text-[#f0f6fc]'
    }`;

  const submitLabel =
    tab === 'login'
      ? 'Entrar no Ritmo'
      : tab === 'register'
      ? founderOpen
        ? 'Garantir minha vaga de Fundador'
        : 'Começar meus 7 dias grátis'
      : resetStep === 'request'
      ? 'Enviar código por e-mail'
      : 'Salvar nova senha';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-md p-6 shadow-2xl relative max-h-[95vh] overflow-y-auto">
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d]"
        >
          <X className="w-5 h-5" />
        </button>

        {tab !== 'forgot' ? (
          <div className="flex border-b border-[#30363d] mb-6">
            <button onClick={() => switchTab('login')} className={tabClass(tab === 'login')}>
              Entrar
            </button>
            <button onClick={() => switchTab('register')} className={tabClass(tab === 'register')}>
              {closed ? 'Lista de espera' : 'Criar conta grátis'}
            </button>
          </div>
        ) : (
          <div className="mb-6">
            <h3 className="text-base font-bold text-[#f0f6fc]">Recuperar senha</h3>
            <p className="text-xs text-[#8b949e] mt-1">
              {resetStep === 'request'
                ? 'Informe seu e-mail e enviaremos um código para criar uma nova senha.'
                : 'Digite o código recebido por e-mail e escolha a nova senha.'}
            </p>
          </div>
        )}

        {tab === 'register' && closed ? (
          <div className="space-y-4">
            <div className="rounded-xl border border-amber-500/40 bg-amber-950/30 p-4">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                <Hammer className="w-4 h-4" /> {closed.title}
              </div>
              <p className="text-xs text-amber-100/90 mt-2 leading-relaxed">{closed.message}</p>
            </div>
            {error && (
              <div role="alert" className="flex items-start gap-2 text-xs text-rose-300 bg-rose-950/40 border border-rose-800/60 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> <span>{error}</span>
              </div>
            )}
            {waitDone ? (
              <div className="flex items-start gap-2 text-sm text-emerald-300 bg-emerald-950/40 border border-emerald-800/60 rounded-lg p-4">
                <CheckCircle2 className="w-5 h-5 shrink-0" /> <span>{waitDone}</span>
              </div>
            ) : (
              <form onSubmit={joinWaitlist} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#8b949e] mb-1">Seu nome</label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-[#6e7681] absolute left-3 top-3" />
                    <input type="text" placeholder="Ex: Maria Souza" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} maxLength={80} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#8b949e] mb-1">E-mail</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#6e7681] absolute left-3 top-3" />
                    <input type="email" required placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} autoComplete="email" />
                  </div>
                </div>
                <p className="text-[11px] text-[#6e7681]">Usamos seu e-mail só para avisar quando abrirem novas vagas. Para sair da lista, é só pedir.</p>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? 'Enviando...' : (<>Entrar na lista de espera <ArrowRight className="w-4 h-4" /></>)}
                </button>
              </form>
            )}
            <p className="text-[11px] text-center text-[#6e7681]">
              Já tem conta?{' '}
              <button type="button" onClick={() => switchTab('login')} className="text-emerald-400 hover:underline">
                Entrar
              </button>
            </p>
          </div>
        ) : (
        <>
        {error && (
          <div role="alert" className="mb-4 flex items-start gap-2 text-xs text-rose-300 bg-rose-950/40 border border-rose-800/60 rounded-lg p-3">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /> <span>{error}</span>
          </div>
        )}
        {successMessage && (
          <div className="mb-4 flex items-start gap-2 text-xs text-emerald-300 bg-emerald-950/40 border border-emerald-800/60 rounded-lg p-3">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'register' && (
            <div>
              <label className="block text-xs font-medium text-[#8b949e] mb-1">Seu nome completo</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-[#6e7681] absolute left-3 top-3" />
                <input type="text" required placeholder="Ex: Maria Souza" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
              </div>
            </div>
          )}

          {!(tab === 'forgot' && resetStep === 'confirm') && (
            <div>
              <label className="block text-xs font-medium text-[#8b949e] mb-1">E-mail</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#6e7681] absolute left-3 top-3" />
                <input type="email" required placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} autoComplete="email" />
              </div>
            </div>
          )}

          {tab === 'forgot' && resetStep === 'confirm' && (
            <div>
              <label className="block text-xs font-medium text-[#8b949e] mb-1">Código recebido por e-mail</label>
              <div className="relative">
                <Key className="w-4 h-4 text-[#6e7681] absolute left-3 top-3" />
                <input type="text" required inputMode="numeric" placeholder="000000" value={resetCode} onChange={(e) => setResetCode(e.target.value)} className={inputClass} />
              </div>
            </div>
          )}

          {!(tab === 'forgot' && resetStep === 'request') && (
            <div>
              <label className="block text-xs font-medium text-[#8b949e] mb-1">{tab === 'forgot' ? 'Nova senha' : 'Senha'}</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#6e7681] absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                  autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                />
              </div>
            </div>
          )}

          {tab === 'register' && (
            <div>
              <label className="block text-xs font-medium text-[#8b949e] mb-1">Código de indicação (opcional)</label>
              <div className="relative">
                <Key className="w-4 h-4 text-[#6e7681] absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Ex: RITMO-ABC123"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  className={`${inputClass} uppercase`}
                />
              </div>
            </div>
          )}

          {tab === 'register' && (
            <label className="flex items-start gap-2 text-[11px] text-[#8b949e]">
              <input
                type="checkbox"
                required
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                className="mt-0.5 rounded border-[#30363d] bg-[#0d1117] text-emerald-500 focus:ring-0"
              />
              <span>
                Li e concordo com os{' '}
                <a href="/termos" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">
                  Termos de Uso
                </a>{' '}
                e a{' '}
                <a href="/privacidade" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">
                  Política de Privacidade
                </a>
                {founderOpen
                  ? ', incluindo o acesso vitalício de Fundador (sem mensalidade) se a minha conta estiver entre as primeiras vagas; caso contrário, o teste grátis de 7 dias e a assinatura de R$ 39,90/mês depois dele.'
                  : ', incluindo o teste grátis de 7 dias e a assinatura de R$ 39,90/mês depois dele.'} Autorizo o uso dos dados de bem-estar que eu registrar (hábitos, treinos, diário) só para o app funcionar para mim. Declaro ter 18 anos ou mais.
              </span>
            </label>
          )}

          <button
            type="submit"
            disabled={loading || (tab === 'register' && !acceptedTerms)}
            className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50"
          >
            {loading ? 'Processando...' : (<>{submitLabel} <ArrowRight className="w-4 h-4" /></>)}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-[#30363d] flex flex-col gap-2 text-center">
          {tab === 'login' && (
            <button onClick={() => switchTab('forgot')} className="text-xs text-[#8b949e] hover:text-emerald-400">
              Esqueci minha senha
            </button>
          )}
          {tab === 'forgot' && (
            <button onClick={() => switchTab('login')} className="text-xs text-[#8b949e] hover:text-emerald-400">
              ← Voltar para o login
            </button>
          )}
          {tab === 'register' && (
            <p className="text-[11px] text-[#6e7681]">Sem cartão de crédito para começar. Cancele quando quiser.</p>
          )}
        </div>
        </>
        )}
      </div>
    </div>
  );
};
