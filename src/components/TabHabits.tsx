import React, { useState } from 'react';
import { HabitItem, HabitLogItem, HabitCategory } from '../lib/types.js';
import {
  Sparkles,
  Plus,
  CheckCircle2,
  Activity,
  BookOpen,
  Heart,
  Moon,
  Droplet,
  PhoneOff,
  Info,
  Flame,
} from 'lucide-react';

interface TabHabitsProps {
  habits: HabitItem[];
  habitLogs: HabitLogItem[];
  onToggleHabit: (habitId: number, completed: boolean, date?: string) => Promise<void>;
  onAddHabit: (habit: Partial<HabitItem>) => Promise<void>;
}

const CATEGORY_META: Record<
  HabitCategory,
  { label: string; icon: React.ReactNode; color: string }
> = {
  movimento: { label: 'Movimento / Corpo', icon: <Activity className="w-4 h-4" />, color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40' },
  estudo: { label: 'Estudo / Leitura', icon: <BookOpen className="w-4 h-4" />, color: 'text-purple-400 bg-purple-950/40 border-purple-800/40' },
  mente: { label: 'Mente / Respiração', icon: <Heart className="w-4 h-4" />, color: 'text-rose-400 bg-rose-950/40 border-rose-800/40' },
  sono: { label: 'Sono / Descanso', icon: <Moon className="w-4 h-4" />, color: 'text-indigo-400 bg-indigo-950/40 border-indigo-800/40' },
  hidratacao: { label: 'Hidratação', icon: <Droplet className="w-4 h-4" />, color: 'text-cyan-400 bg-cyan-950/40 border-cyan-800/40' },
  desconexao: { label: 'Desconexão Digital', icon: <PhoneOff className="w-4 h-4" />, color: 'text-amber-400 bg-amber-950/40 border-amber-800/40' },
  personalizado: { label: 'Personalizado', icon: <Sparkles className="w-4 h-4" />, color: 'text-teal-400 bg-teal-950/40 border-teal-800/40' },
};

export const TabHabits: React.FC<TabHabitsProps> = ({
  habits,
  habitLogs,
  onToggleHabit,
  onAddHabit,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<HabitCategory>('movimento');
  const [targetFrequency, setTargetFrequency] = useState<'diario' | '5x_semana' | '3x_semana'>('diario');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Generate last 7 days dates array
  const today = new Date();
  const past7Days: { dateStr: string; dayName: string; dayNum: number }[] = [];
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    past7Days.push({
      dateStr,
      dayName: dayNames[d.getDay()],
      dayNum: d.getDate(),
    });
  }

  // Create log lookup: `${habitId}_${date}` => boolean
  const logLookup = new Map<string, boolean>();
  for (const l of habitLogs) {
    logLookup.set(`${l.habitId}_${l.date}`, l.completed);
  }

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);

    try {
      await onAddHabit({
        name,
        category,
        targetFrequency,
        notes,
      });
      setName('');
      setNotes('');
      setIsModalOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Disclaimer Notice Header (Strict requirement: visible disclaimer) */}
      <div className="p-4 rounded-2xl bg-[#161b22] border border-[#30363d] flex items-start gap-3">
        <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs text-[#8b949e] space-y-1">
          <p className="font-semibold text-[#f0f6fc]">
            Nota de Saúde & Bem-estar Consciente
          </p>
          <p>
            O Ritmo incentiva consistência e equilíbrio pessoal com metas flexíveis. Não impomos recomendações médicas, restrições alimentares ou obrigações rígidas. Um dia sem marcar um hábito não é fracasso, apenas parte da rotina real.
          </p>
          <p className="text-[11px] text-[#6e7681]">
            * Esta ferramenta não substitui aconselhamento médico ou psicológico profissional.
          </p>
        </div>
      </div>

      {/* Habits Header & Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#161b22] border border-[#30363d] p-4 sm:p-5 rounded-2xl">
        <div>
          <h2 className="text-base font-bold text-[#f0f6fc] flex items-center gap-2">
            <Flame className="w-4 h-4 text-emerald-400" />
            Matriz Semanal de Hábitos
          </h2>
          <p className="text-xs text-[#8b949e]">
            Acompanhe seus últimos 7 dias de consistência com um clique simples.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          Novo Hábito
        </button>
      </div>

      {/* Habits Matrix Table */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#30363d] bg-[#0d1117]">
                <th className="py-3 px-4 text-xs font-semibold text-[#8b949e] min-w-[200px]">
                  Hábito & Categoria
                </th>
                {past7Days.map((d, idx) => {
                  const isToday = idx === past7Days.length - 1;
                  return (
                    <th
                      key={d.dateStr}
                      className={`py-3 px-2 text-center text-xs font-mono font-medium ${
                        isToday ? 'text-emerald-400 bg-emerald-950/20' : 'text-[#8b949e]'
                      }`}
                    >
                      <div>{d.dayName}</div>
                      <div className="text-[10px] text-[#6e7681]">{d.dayNum}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#30363d]">
              {habits.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-[#6e7681]">
                    Nenhum hábito ativo no momento. Clique no botão acima para adicionar.
                  </td>
                </tr>
              ) : (
                habits.map((habit) => {
                  const meta = CATEGORY_META[habit.category] || CATEGORY_META.personalizado;
                  return (
                    <tr key={habit.id} className="hover:bg-[#1c2128]/50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-xs text-[#f0f6fc] flex items-center gap-2">
                          <span className={`p-1 rounded-md border ${meta.color}`}>
                            {meta.icon}
                          </span>
                          <span>{habit.name}</span>
                        </div>
                        {habit.notes && (
                          <p className="text-[11px] text-[#8b949e] ml-7 mt-0.5">
                            {habit.notes}
                          </p>
                        )}
                      </td>

                      {past7Days.map((d) => {
                        const done = Boolean(logLookup.get(`${habit.id}_${d.dateStr}`));
                        return (
                          <td key={d.dateStr} className="py-3 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => onToggleHabit(habit.id, !done, d.dateStr)}
                              className={`w-7 h-7 mx-auto rounded-lg flex items-center justify-center transition-all ${
                                done
                                  ? 'bg-emerald-500 text-black shadow-sm'
                                  : 'bg-[#21262d] border border-[#30363d] text-transparent hover:border-[#484f58]'
                              }`}
                            >
                              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Criar Novo Hábito */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[#8b949e] hover:text-[#f0f6fc]"
            >
              ×
            </button>

            <h3 className="text-base font-bold text-[#f0f6fc] mb-4">Novo Hábito Saudável</h3>

            <form onSubmit={handleCreateHabit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#8b949e] mb-1">
                  Nome do Hábito *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Treino funcional 30 min"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-[#f0f6fc] focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8b949e] mb-1">
                  Categoria
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as HabitCategory)}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-[#f0f6fc]"
                >
                  <option value="movimento">Movimento ou Exercício</option>
                  <option value="estudo">Estudo e Leitura</option>
                  <option value="mente">Meditação, Oração ou Respiração</option>
                  <option value="sono">Sono e Horário de Descanso</option>
                  <option value="hidratacao">Hidratação Consciente</option>
                  <option value="desconexao">Tempo Sem Redes Sociais</option>
                  <option value="personalizado">Personalizado</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8b949e] mb-1">
                  Frequência Alvo
                </label>
                <select
                  value={targetFrequency}
                  onChange={(e) => setTargetFrequency(e.target.value as any)}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-[#f0f6fc]"
                >
                  <option value="diario">Todos os dias</option>
                  <option value="5x_semana">5x por semana (dias úteis)</option>
                  <option value="3x_semana">3x por semana (flexível)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8b949e] mb-1">
                  Notas de motivação ou intenção
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Não precisa ser exaustivo, o foco é a consistência."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-[#f0f6fc] focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[#30363d]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-[#8b949e] hover:text-[#f0f6fc]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/20"
                >
                  {loading ? 'Salvando...' : 'Criar Hábito'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
