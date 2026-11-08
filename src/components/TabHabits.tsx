import React, { useState } from 'react';
import { HabitItem, HabitLogItem, HabitCategory } from '../lib/types.js';
import { addDays, frequencyLabel, localDateStr, normalizeFrequency } from '../lib/chain.js';
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
  Share2,
  Pencil,
  Apple,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { shareAchievement } from '../lib/share-feed.js';

interface TabHabitsProps {
  habits: HabitItem[];
  habitLogs: HabitLogItem[];
  onToggleHabit: (habitId: number, completed: boolean, date?: string) => Promise<void>;
  onAddHabit: (habit: Partial<HabitItem>) => Promise<void>;
  onUpdateHabit?: (habitId: number, updates: Partial<HabitItem>) => Promise<void>;
}

const CATEGORY_META: Record<
  HabitCategory,
  { label: string; icon: React.ReactNode; color: string }
> = {
  movimento: { label: 'Movimento / Corpo', icon: <Activity className="w-4 h-4" />, color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40' },
  alimentacao: { label: 'Alimentação', icon: <Apple className="w-4 h-4" />, color: 'text-lime-400 bg-lime-950/40 border-lime-800/40' },
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
  onUpdateHabit,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<HabitCategory>('movimento');
  const [targetFrequency, setTargetFrequency] = useState<string>('diario');
  const [editing, setEditing] = useState<HabitItem | null>(null);
  // último dia mostrado na matriz (a pessoa navega para qualquer semana passada)
  const todayStr = localDateStr();
  const [endDate, setEndDate] = useState<string>(todayStr);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // 7 dias que terminam no dia escolhido (hoje por padrão)
  const past7Days: { dateStr: string; dayName: string; dayNum: number }[] = [];
  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  for (let i = 6; i >= 0; i--) {
    const dateStr = addDays(endDate, -i);
    const d = new Date(`${dateStr}T12:00:00`);
    past7Days.push({ dateStr, dayName: dayNames[d.getDay()], dayNum: d.getDate() });
  }
  const goTo = (date: string) => setEndDate(date > todayStr ? todayStr : date);

  // Create log lookup: `${habitId}_${date}` => boolean
  const logLookup = new Map<string, boolean>();
  for (const l of habitLogs) {
    logLookup.set(`${l.habitId}_${l.date}`, l.completed);
  }

  const openNew = () => {
    setEditing(null);
    setName('');
    setCategory('movimento');
    setTargetFrequency('diario');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEdit = (h: HabitItem) => {
    setEditing(h);
    setName(h.name);
    setCategory(h.category);
    setTargetFrequency(normalizeFrequency(h.targetFrequency));
    setNotes(h.notes || '');
    setIsModalOpen(true);
  };

  const handleCreateHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);

    try {
      if (editing && onUpdateHabit) {
        await onUpdateHabit(editing.id, { name, targetFrequency, notes });
        setIsModalOpen(false);
        return;
      }
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
            Toque num dia para marcar ou desmarcar. Volte para qualquer semana para corrigir o que faltou.
          </p>
          <div className="mt-2 flex items-center gap-1 bg-[#0d1117] border border-[#30363d] rounded-xl p-1 w-fit">
            <button type="button" onClick={() => goTo(addDays(endDate, -7))} aria-label="Semana anterior" className="p-1.5 rounded-lg text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d]"><ChevronLeft className="w-4 h-4" /></button>
            <input type="date" value={endDate} max={todayStr} onChange={(e) => e.target.value && goTo(e.target.value)} aria-label="Ver semana que termina em" className="bg-transparent text-xs font-semibold text-[#f0f6fc] px-1 py-1 focus:outline-none [color-scheme:dark]" />
            <button type="button" onClick={() => goTo(addDays(endDate, 7))} disabled={endDate >= todayStr} aria-label="Próxima semana" className="p-1.5 rounded-lg text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d] disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
            {endDate !== todayStr && <button type="button" onClick={() => setEndDate(todayStr)} className="px-2 text-[11px] text-emerald-400 hover:underline">Hoje</button>}
          </div>
        </div>

        <button
          onClick={openNew}
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
                {past7Days.map((d) => {
                  const isToday = d.dateStr === todayStr;
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
                          {onUpdateHabit && (
                            <button type="button" title="Editar hábito" aria-label={`Editar ${habit.name}`} onClick={() => openEdit(habit)} className="p-1 rounded-md text-[#6e7681] hover:text-emerald-400">
                              <Pencil className="w-3 h-3" />
                            </button>
                          )}
                          {logLookup.get(`${habit.id}_${localDateStr()}`) && (
                            <button type="button" title="Compartilhar" aria-label={`Compartilhar ${habit.name} no Feed`} onClick={() => shareAchievement({ type: 'habito', habit: habit.name.slice(0, 60) })} className="ml-1 p-1 rounded-md text-[#8b949e] hover:text-emerald-400 hover:bg-emerald-500/10">
                              <Share2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <p className="text-[10px] text-[#6e7681] ml-7 mt-0.5">{frequencyLabel(habit.targetFrequency)}</p>
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

            <h3 className="text-base font-bold text-[#f0f6fc] mb-4">{editing ? 'Editar hábito' : 'Novo Hábito Saudável'}</h3>

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
                  disabled={Boolean(editing)}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-[#f0f6fc]"
                >
                  <option value="movimento">Movimento ou Exercício</option>
                  <option value="alimentacao">Alimentação (ex.: comer uma fruta, beber água, montar um prato colorido)</option>
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
                  {[6, 5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={`${n}x_semana`}>{n}x por semana (nos dias que você quiser)</option>
                  ))}
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
                  {loading ? 'Salvando...' : editing ? 'Salvar' : 'Criar Hábito'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
