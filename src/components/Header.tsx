import React from 'react';
import { User, FocusCycle } from '../lib/types.js';
import { Flame, Moon, Sun, LogOut, User as UserIcon, Sparkles } from 'lucide-react';
import { InstallPwaButton } from './InstallPwaButton.js';

interface HeaderProps {
  user: User | null;
  activeCycle: FocusCycle | null;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenOnboarding: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  activeCycle,
  theme,
  onToggleTheme,
  onOpenAuth,
  onLogout,
  onOpenOnboarding,
}) => {
  // Calculate cycle day
  let cycleDayInfo = 'Sem ciclo ativo';
  let cycleProgress = 0;
  if (activeCycle) {
    const start = new Date(activeCycle.startDate);
    const today = new Date();
    const diffTime = today.getTime() - start.getTime();
    const currentDay = Math.max(1, Math.min(activeCycle.durationDays, Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1));
    cycleProgress = Math.round((currentDay / activeCycle.durationDays) * 100);
    cycleDayInfo = `Dia ${currentDay} de ${activeCycle.durationDays}`;
  }

  return (
    <header className="sticky top-0 z-40 border-b border-[#30363d] bg-[#0d1117]/90 backdrop-blur-md px-4 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-amber-500 flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <Flame className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">
                Ritmo
              </span>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 tracking-wider">
                Modo Foco
              </span>
            </div>
            <p className="text-xs text-[#8b949e] hidden sm:block">
              Foco, Hábitos & Organização Financeira Equilibrada
            </p>
          </div>
        </div>

        {/* Center: Cycle Status Badge */}
        {activeCycle ? (
          <button
            onClick={onOpenOnboarding}
            className="hidden md:flex items-center gap-3 px-3.5 py-1.5 rounded-lg bg-[#161b22] border border-[#30363d] hover:border-emerald-500/50 transition-all text-left"
          >
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                {cycleDayInfo}
              </span>
              <span className="text-[11px] text-[#8b949e] truncate max-w-[200px]">
                {activeCycle.mainGoal}
              </span>
            </div>
            <div className="w-16 bg-[#21262d] h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${cycleProgress}%` }}
              />
            </div>
          </button>
        ) : (
          <button
            onClick={onOpenOnboarding}
            className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 text-xs font-medium transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Iniciar Ciclo de Foco (7 a 90 dias)
          </button>
        )}

        {/* Right side: Actions */}
        <div className="flex items-center gap-2">
          <InstallPwaButton />

          {/* Theme toggle */}
          <button
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
            className="p-2 rounded-lg text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d] transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-amber-400" />}
          </button>

          {user ? (
            <div className="flex items-center gap-2">
              {user.role === 'admin' && (
                <a href="/admin" className="hidden sm:inline text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20">
                  Admin
                </a>
              )}
              <a href="/checkout" className="hidden sm:inline text-xs font-medium px-3 py-1.5 rounded-lg text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d]">
                Assinatura
              </a>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#161b22] border border-[#30363d]">
                <div className="w-6 h-6 rounded-full bg-emerald-900/60 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-xs font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-medium text-[#f0f6fc] hidden sm:inline max-w-[120px] truncate">
                  {user.name}
                </span>
              </div>
              <button
                onClick={onLogout}
                title="Sair da conta"
                className="p-2 rounded-lg text-[#8b949e] hover:text-rose-400 hover:bg-rose-950/20 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <UserIcon className="w-3.5 h-3.5" />
              Entrar / Cadastrar
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
