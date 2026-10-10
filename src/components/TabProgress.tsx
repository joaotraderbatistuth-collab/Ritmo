import React, { useState } from 'react';
import {
  FocusCycle,
  TaskItem,
  HabitItem,
  HabitLogItem,
  FocusSessionItem,
  FinanceTransactionItem,
} from '../lib/types.js';
import {
  Calendar,
  Flame,
  Award,
  Download,
  Trash2,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';

interface TabProgressProps {
  cycles: FocusCycle[];
  tasks: TaskItem[];
  habits: HabitItem[];
  habitLogs: HabitLogItem[];
  sessions: FocusSessionItem[];
  transactions: FinanceTransactionItem[];
  onDeleteAccount: () => Promise<void>;
}

export const TabProgress: React.FC<TabProgressProps> = ({
  cycles,
  tasks,
  habits,
  habitLogs,
  sessions,
  transactions,
  onDeleteAccount,
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmInput, setConfirmInput] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Consistency calendar: past 28 days activity map (4 weeks)
  const today = new Date();
  const past28Days: { dateStr: string; count: number; dateFormatted: string }[] = [];
  for (let i = 27; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    const tasksDone = tasks.filter((t) => t.date === dateStr && t.completed).length;
    const habitsDone = habitLogs.filter((l) => l.date === dateStr && l.completed).length;
    const focusDone = sessions.filter((s) => s.date === dateStr).length;
    const totalActivity = tasksDone + habitsDone + focusDone;

    past28Days.push({
      dateStr,
      count: totalActivity,
      dateFormatted: `${d.getDate()}/${d.getMonth() + 1}`,
    });
  }

  // Focus time stats
  const totalFocusMinutes = sessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const totalTasksCompleted = tasks.filter((t) => t.completed).length;
  const totalHabitsCompleted = habitLogs.filter((l) => l.completed).length;

  // Unlocked Milestones
  const milestones = [
    {
      title: 'Início Consciente',
      desc: 'Primeiro ciclo de foco ativado no Ritmo',
      achieved: cycles.length > 0,
      icon: '🌱',
    },
    {
      title: 'Bloco de Ouro',
      desc: 'Mais de 100 minutos de foco produtivo registrados',
      achieved: totalFocusMinutes >= 100,
      icon: '⏳',
    },
    {
      title: 'Ritmo Consistente',
      desc: '10 ou mais tarefas e hábitos concluídos',
      achieved: totalTasksCompleted + totalHabitsCompleted >= 10,
      icon: '🔥',
    },
    {
      title: 'Mestre da Gestão',
      desc: 'Organização financeira integrada ativada',
      achieved: transactions.length > 0,
      icon: '💎',
    },
  ];

  // Full LGPD Export
  const handleExportFullData = () => {
    const fullBackup = {
      exportedAt: new Date().toISOString(),
      platform: 'Ritmo — Modo Foco',
      cycles,
      tasks,
      habits,
      habitLogs,
      sessions,
      transactions,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fullBackup, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `ritmo-backup-completo-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleConfirmDelete = async () => {
    if (confirmInput !== 'EXCLUIR MEUS DADOS') return;
    setDeleting(true);
    try {
      await onDeleteAccount();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* 1. Header */}
      <div className="bg-[#161b22] border border-[#30363d] p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-800/40 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <TrendingUp className="w-3.5 h-3.5" />
            Evolução Pessoal Sem Cobrança Extrema
          </div>
          <h2 className="text-xl font-extrabold text-[#f0f6fc]">
            Progresso & Histórico dos Ciclos
          </h2>
          <p className="text-xs sm:text-sm text-[#8b949e] mt-1 max-w-2xl">
            Visualize seu ritmo ao longo das semanas. Sem rankings competitivos ou obsessão por métricas: o objetivo é a autonomia e a paz de espírito.
          </p>
        </div>

        <button
          onClick={handleExportFullData}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2 shadow-md transition-all shrink-0"
        >
          <Download className="w-4 h-4" />
          Exportar Todos os Meus Dados (LGPD)
        </button>
      </div>

      {/* 2. Consistency Calendar Heatmap (28 Days) */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#30363d] mb-4">
          <div>
            <h3 className="text-sm font-bold text-[#f0f6fc] flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              Mapa de Consistência das Últimas 4 Semanas
            </h3>
            <p className="text-xs text-[#8b949e]">
              Atividades concluídas (tarefas, hábitos saudáveis e sessões de foco)
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#6e7681]">
            <span>Menos</span>
            <span className="w-2.5 h-2.5 rounded bg-[#21262d]" />
            <span className="w-2.5 h-2.5 rounded bg-emerald-900/60" />
            <span className="w-2.5 h-2.5 rounded bg-emerald-600" />
            <span className="w-2.5 h-2.5 rounded bg-emerald-400" />
            <span>Mais</span>
          </div>
        </div>

        <div className="grid grid-cols-7 sm:grid-cols-14 gap-2">
          {past28Days.map((d) => {
            const levelClass =
              d.count === 0
                ? 'bg-[#21262d] text-[#6e7681]'
                : d.count <= 2
                ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-800/40'
                : d.count <= 5
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-400 text-black font-bold';

            return (
              <div
                key={d.dateStr}
                title={`${d.dateStr}: ${d.count} atividades`}
                className={`p-2 rounded-xl text-center flex flex-col items-center justify-center transition-all ${levelClass}`}
              >
                <span className="text-[10px] font-mono opacity-80">{d.dateFormatted}</span>
                <span className="text-xs font-bold mt-0.5">{d.count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Milestones & Cycle History */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Milestones Card */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-[#f0f6fc] flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            Marcos Alcançados
          </h3>

          <div className="space-y-3">
            {milestones.map((m, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all ${
                  m.achieved
                    ? 'bg-emerald-950/20 border-emerald-500/30'
                    : 'bg-[#0d1117] border-[#30363d] opacity-50'
                }`}
              >
                <span className="text-2xl">{m.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#f0f6fc]">{m.title}</span>
                    {m.achieved && (
                      <span className="text-[10px] font-semibold text-emerald-400 px-2 py-0.2 rounded-full bg-emerald-950/60 border border-emerald-800/40">
                        Conquistado
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#8b949e] mt-0.5">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cycles History */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold text-[#f0f6fc] flex items-center gap-2">
            <Flame className="w-4 h-4 text-emerald-400" />
            Histórico de Ciclos de Foco
          </h3>

          {cycles.length === 0 ? (
            <p className="text-xs text-[#6e7681] py-8 text-center">
              Nenhum ciclo registrado até o momento.
            </p>
          ) : (
            <div className="space-y-3 max-h-[340px] overflow-y-auto">
              {cycles.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-xl bg-[#0d1117] border border-[#30363d] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#f0f6fc]">{c.title}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                        c.status === 'active'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-[#21262d] text-[#8b949e]'
                      }`}
                    >
                      {c.status === 'active' ? 'Ativo' : 'Concluído'}
                    </span>
                  </div>

                  <p className="text-xs text-emerald-300 font-medium">🎯 {c.mainGoal}</p>

                  <div className="flex items-center gap-4 text-[11px] text-[#8b949e]">
                    <span>Duração: {c.durationDays} dias</span>
                    <span>Nível: {c.routineLevel}</span>
                    <span>Início: {c.startDate}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4. Privacy & Account Deletion Section */}
      <div className="bg-[#161b22] border border-rose-900/30 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-1">
            Privacidade & Exclusão Completa de Dados (LGPD)
          </h4>
          <p className="text-xs text-[#8b949e] max-w-xl">
            Você tem total soberania sobre suas informações. Ao excluir a conta, todos os seus ciclos, tarefas, hábitos, sessões e lançamentos financeiros são permanentemente destruídos.
          </p>
        </div>

        <button
          onClick={() => setShowDeleteModal(true)}
          className="px-4 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 text-rose-300 text-xs font-semibold flex items-center gap-2 transition-colors shrink-0"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Excluir Minha Conta
        </button>
      </div>

      {/* Modal Confirmação de Exclusão */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-[#161b22] border border-rose-800/60 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-950/60 border border-rose-800/60 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-[#f0f6fc]">Confirmar Exclusão de Conta</h3>
              <p className="text-xs text-[#8b949e]">
                Esta ação é irreversível. Todos os dados cadastrados serão permanentemente apagados dos nossos servidores.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8b949e] mb-1">
                Digite exatamente <strong className="text-rose-400">EXCLUIR MEUS DADOS</strong> para confirmar:
              </label>
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder="EXCLUIR MEUS DADOS"
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-rose-300 focus:outline-none focus:border-rose-500 font-mono"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(false);
                  setConfirmInput('');
                }}
                className="px-4 py-2 rounded-lg text-xs font-medium text-[#8b949e] hover:text-[#f0f6fc]"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={confirmInput !== 'EXCLUIR MEUS DADOS' || deleting}
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors disabled:opacity-40"
              >
                {deleting ? 'Excluindo...' : 'Confirmar e Apagar Tudo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
