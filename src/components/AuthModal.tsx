import React, { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, Key, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { User } from '../lib/types.js';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
  initialReferralCode?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialReferralCode = '',
}) => {
  const [tab, setTab] = useState<'login' | 'register' | 'forgot'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState(initialReferralCode);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (tab === 'login') {
        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'login', email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao fazer login.');
        onLoginSuccess(data.user);
        onClose();
      } else if (tab === 'register') {
        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'register',
            name,
            email,
            password,
            referralCode: referralCode.trim() || undefined,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao criar conta.');
        onLoginSuccess(data.user);
        onClose();
      } else if (tab === 'forgot') {
        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'reset_password',
            email,
            newPassword: password,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao redefinir senha.');
        setSuccessMessage(data.message || 'Senha alterada! Você já pode entrar.');
        setTab('login');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAccess = async () => {
    setName('Carlos Silveira');
    setEmail('carlos@ritmofoco.com.br');
    setPassword('senha1234');
    setTab('login');

    try {
      setLoading(true);
      setError(null);
      // Try login or register
      let res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          email: 'carlos@ritmofoco.com.br',
          password: 'senha1234',
        }),
      });
      let data = await res.json();
      if (!res.ok) {
        res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'register',
            name: 'Carlos Silveira',
            email: 'carlos@ritmofoco.com.br',
            password: 'senha1234',
          }),
        });
        data = await res.json();
      }
      if (data.user) {
        onLoginSuccess(data.user);
        onClose();
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d]"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tab switch */}
        <div className="flex border-b border-[#30363d] mb-6">
          <button
            onClick={() => {
              setTab('login');
              setError(null);
            }}
            className={`pb-2.5 px-4 text-sm font-semibold transition-colors relative ${
              tab === 'login'
                ? 'text-emerald-400 border-b-2 border-emerald-400'
                : 'text-[#8b949e] hover:text-[#f0f6fc]'
            }`}
          >
            Entrar
          </button>
          <button
            onClick={() => {
              setTab('register');
              setError(null);
            }}
            className={`pb-2.5 px-4 text-sm font-semibold transition-colors relative ${
              tab === 'register'
                ? 'text-emerald-400 border-b-2 border-emerald-400'
                : 'text-[#8b949e] hover:text-[#f0f6fc]'
            }`}
          >
            Criar Conta
          </button>
          <button
            onClick={() => {
              setTab('forgot');
              setError(null);
            }}
            className={`pb-2.5 px-4 text-sm font-semibold transition-colors relative ${
              tab === 'forgot'
                ? 'text-emerald-400 border-b-2 border-emerald-400'
                : 'text-[#8b949e] hover:text-[#f0f6fc]'
            }`}
          >
            Recuperar Senha
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-950/30 border border-rose-800/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {tab === 'register' && (
            <div>
              <label className="block text-xs font-medium text-[#8b949e] mb-1">Seu Nome Completo</label>
              <div className="relative">
                <UserIcon className="w-4 h-4 text-[#6e7681] absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Silveira"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg pl-9 pr-3 py-2 text-sm text-[#f0f6fc] focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#8b949e] mb-1">E-mail</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#6e7681] absolute left-3 top-3" />
              <input
                type="email"
                required
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg pl-9 pr-3 py-2 text-sm text-[#f0f6fc] focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#8b949e] mb-1">
              {tab === 'forgot' ? 'Nova Senha' : 'Senha'}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#6e7681] absolute left-3 top-3" />
              <input
                type="password"
                required
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg pl-9 pr-3 py-2 text-sm text-[#f0f6fc] focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {tab === 'register' && (
            <div>
              <label className="block text-xs font-medium text-[#8b949e] mb-1">
                Código de Indicação (opcional)
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-[#6e7681] absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Ex: RITMO-ABC123"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg pl-9 pr-3 py-2 text-sm text-[#f0f6fc] focus:outline-none focus:border-emerald-500 uppercase"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50"
          >
            {loading ? (
              'Processando...'
            ) : tab === 'login' ? (
              <>
                Entrar no Ritmo <ArrowRight className="w-4 h-4" />
              </>
            ) : tab === 'register' ? (
              <>
                Iniciar Minha Jornada <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              'Atualizar Senha'
            )}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-[#30363d] flex flex-col gap-2">
          <button
            type="button"
            onClick={handleDemoAccess}
            className="w-full py-2 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-[#f0f6fc] text-xs font-medium transition-colors"
          >
            Acessar Modo Demonstração Rápido
          </button>
          <p className="text-[11px] text-[#6e7681] text-center">
            Seus dados são protegidos e isolados. Sem isolamento radical nem promessas irreais.
          </p>
        </div>
      </div>
    </div>
  );
};
