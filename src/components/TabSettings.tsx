import React, { useState } from 'react';
import { User } from '../lib/types.js';
import {
  Bell,
  User as UserIcon,
  Moon,
  Sun,
  CheckCircle2,
} from 'lucide-react';

interface TabSettingsProps {
  user: User | null;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onUpdateProfile: (updates: Partial<User>) => Promise<void>;
}

export const TabSettings: React.FC<TabSettingsProps> = ({
  user,
  theme,
  onToggleTheme,
  onUpdateProfile,
}) => {
  const [name, setName] = useState(user?.name || '');
  const [timezone, setTimezone] = useState(user?.timezone || 'America/Sao_Paulo');
  const [whatsappPhone, setWhatsappPhone] = useState(user?.whatsappPhone || '');

  // Reminders state
  const [remindTasks, setRemindTasks] = useState(true);
  const [remindHabits, setRemindHabits] = useState(true);
  const [remindFinanceDue, setRemindFinanceDue] = useState(true);
  const [remindWeeklyReview, setRemindWeeklyReview] = useState(true);

  const [notificationPermission, setNotificationPermission] = useState<string>(
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'default'
  );
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRequestNotification = async () => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
      if (perm === 'granted') {
        new Notification('Ritmo — Notificações Ativadas!', {
          body: 'Lembretes de foco, hábitos e contas configurados com sucesso.',
        });
      }
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSaveStatus(null);

    try {
      await onUpdateProfile({
        name,
        timezone,
        whatsappPhone,
      });

      // Also update reminders in integrations config
      await fetch('/api/integrations?action=update_config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          remindersConfig: {
            tasks: remindTasks,
            habits: remindHabits,
            financeDue: remindFinanceDue,
            weeklyReview: remindWeeklyReview,
          },
        }),
      });

      setSaveStatus('Configurações salvas com sucesso!');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch {
      setSaveStatus('Erro ao salvar configurações.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* 1. Header */}
      <div className="bg-[#161b22] border border-[#30363d] p-6 rounded-2xl">
        <h2 className="text-xl font-extrabold text-[#f0f6fc]">
          Configurações, Perfil & Lembretes
        </h2>
        <p className="text-xs sm:text-sm text-[#8b949e] mt-1">
          Ajuste preferências de fuso horário, limites e notificações para harmonizar a plataforma com a sua rotina real.
        </p>
      </div>

      {saveStatus && (
        <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{saveStatus}</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Profile Card */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-[#f0f6fc] flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-emerald-400" />
            Dados Pessoais
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#8b949e] mb-1">
                Nome de Exibição
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-[#f0f6fc] focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8b949e] mb-1">
                E-mail Cadastrado
              </label>
              <input
                type="email"
                disabled
                value={user?.email || 'demo@ritmofoco.com.br'}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-[#6e7681] cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8b949e] mb-1">
                Fuso Horário
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-[#f0f6fc] focus:outline-none"
              >
                <option value="America/Sao_Paulo">Horário de Brasília (GMT-3)</option>
                <option value="America/Manaus">Manaus / Amazonas (GMT-4)</option>
                <option value="America/Belem">Belém / Pará (GMT-3)</option>
                <option value="America/Fortaleza">Nordeste / Fortaleza (GMT-3)</option>
                <option value="America/Rio_Branco">Acre / Rio Branco (GMT-5)</option>
                <option value="Europe/Lisbon">Lisboa / Portugal (GMT+0/1)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8b949e] mb-1">
                WhatsApp Autorizado (para Lançamentos)
              </label>
              <input
                type="text"
                placeholder="Ex: 5511999998888"
                value={whatsappPhone}
                onChange={(e) => setWhatsappPhone(e.target.value)}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-[#f0f6fc] font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Reminders & Notifications Card */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#f0f6fc] flex items-center gap-2">
              <Bell className="w-4 h-4 text-emerald-400" />
              Lembretes Configuráveis
            </h3>

            <button
              type="button"
              onClick={handleRequestNotification}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                notificationPermission === 'granted'
                  ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
                  : 'bg-[#21262d] border-[#30363d] text-[#8b949e] hover:text-[#f0f6fc]'
              }`}
            >
              {notificationPermission === 'granted'
                ? '✓ Notificações Navegador Ativas'
                : 'Ativar Notificações no Navegador'}
            </button>
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-center justify-between p-3 rounded-xl bg-[#0d1117] border border-[#30363d] cursor-pointer">
              <div>
                <span className="text-xs font-semibold text-[#f0f6fc] block">
                  Lembrete de Tarefas do Dia
                </span>
                <span className="text-[11px] text-[#8b949e]">
                  Notificar blocos agendados no início de cada turno (Manhã/Tarde/Noite)
                </span>
              </div>
              <input
                type="checkbox"
                checked={remindTasks}
                onChange={(e) => setRemindTasks(e.target.checked)}
                className="rounded border-[#30363d] bg-[#161b22] text-emerald-500 focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-[#0d1117] border border-[#30363d] cursor-pointer">
              <div>
                <span className="text-xs font-semibold text-[#f0f6fc] block">
                  Lembrete de Hábitos & Bem-estar
                </span>
                <span className="text-[11px] text-[#8b949e]">
                  Aviso discreto vespertino para marcar movimento, leitura e descanso
                </span>
              </div>
              <input
                type="checkbox"
                checked={remindHabits}
                onChange={(e) => setRemindHabits(e.target.checked)}
                className="rounded border-[#30363d] bg-[#161b22] text-emerald-500 focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-[#0d1117] border border-[#30363d] cursor-pointer">
              <div>
                <span className="text-xs font-semibold text-[#f0f6fc] block">
                  Alerta de Vencimentos Financeiros
                </span>
                <span className="text-[11px] text-[#8b949e]">
                  Avisar sobre contas a pagar com 2 dias de antecedência do vencimento
                </span>
              </div>
              <input
                type="checkbox"
                checked={remindFinanceDue}
                onChange={(e) => setRemindFinanceDue(e.target.checked)}
                className="rounded border-[#30363d] bg-[#161b22] text-emerald-500 focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-[#0d1117] border border-[#30363d] cursor-pointer">
              <div>
                <span className="text-xs font-semibold text-[#f0f6fc] block">
                  Revisão Semanal de Ciclo
                </span>
                <span className="text-[11px] text-[#8b949e]">
                  Convite suave aos domingos para refletir o que funcionou e traçar a próxima semana
                </span>
              </div>
              <input
                type="checkbox"
                checked={remindWeeklyReview}
                onChange={(e) => setRemindWeeklyReview(e.target.checked)}
                className="rounded border-[#30363d] bg-[#161b22] text-emerald-500 focus:ring-0"
              />
            </label>
          </div>
        </div>

        {/* Theme Preferences */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#f0f6fc]">Tema Visual</h3>
            <p className="text-xs text-[#8b949e]">
              Alterne entre o modo escuro focado e o modo claro suave.
            </p>
          </div>

          <button
            type="button"
            onClick={onToggleTheme}
            className="px-4 py-2 rounded-xl bg-[#0d1117] border border-[#30363d] text-xs font-semibold text-[#f0f6fc] flex items-center gap-2 hover:border-[#484f58] transition-colors"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" /> Modo Escuro Ativo
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-indigo-400" /> Modo Claro Ativo
              </>
            )}
          </button>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition-colors disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </div>
  );
};
