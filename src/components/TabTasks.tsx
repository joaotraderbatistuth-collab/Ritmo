import React, { useState } from 'react';
import {
  TaskItem,
  TaskCategory,
  TaskPriority,
  TimeBlock,
} from '../lib/types.js';
import {
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  Trash2,
  Edit2,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

interface TabTasksProps {
  tasks: TaskItem[];
  onAddTask: (task: Partial<TaskItem>) => Promise<void>;
  onUpdateTask: (id: number, updates: Partial<TaskItem>) => Promise<void>;
  onDeleteTask: (id: number) => Promise<void>;
}

const CATEGORIES: { id: TaskCategory; label: string; color: string }[] = [
  { id: 'geral', label: 'Geral', color: 'bg-zinc-800 text-zinc-300' },
  { id: 'trabalho', label: 'Trabalho', color: 'bg-blue-950 text-blue-300 border-blue-800' },
  { id: 'estudo', label: 'Estudo', color: 'bg-purple-950 text-purple-300 border-purple-800' },
  { id: 'saude', label: 'Saúde', color: 'bg-emerald-950 text-emerald-300 border-emerald-800' },
  { id: 'financas', label: 'Finanças', color: 'bg-amber-950 text-amber-300 border-amber-800' },
  { id: 'pessoal', label: 'Pessoal', color: 'bg-rose-950 text-rose-300 border-rose-800' },
];

const TIME_BLOCKS: TimeBlock[] = ['Manhã', 'Tarde', 'Noite', 'Flexível'];

export const TabTasks: React.FC<TabTasksProps> = ({
  tasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');
  const [categoryFilter, setCategoryFilter] = useState<string>('todas');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskItem | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('geral');
  const [priority, setPriority] = useState<TaskPriority>('media');
  const [timeBlock, setTimeBlock] = useState<TimeBlock>('Manhã');
  const [startTime, setStartTime] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState('daily');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const openNewTaskModal = () => {
    setEditingTask(null);
    setTitle('');
    setDescription('');
    setCategory('geral');
    setPriority('media');
    setTimeBlock('Manhã');
    setStartTime('');
    setEstimatedMinutes(30);
    setIsRecurring(false);
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (t: TaskItem) => {
    setEditingTask(t);
    setTitle(t.title);
    setDescription(t.description || '');
    setCategory(t.category);
    setPriority(t.priority);
    setTimeBlock(t.timeBlock);
    setStartTime(t.startTime || '');
    setEstimatedMinutes(t.estimatedMinutes);
    setIsRecurring(t.isRecurring);
    setRecurrenceRule(t.recurrenceRule || 'daily');
    setNotes(t.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);

    try {
      if (editingTask) {
        await onUpdateTask(editingTask.id, {
          title,
          description,
          category,
          priority,
          timeBlock,
          startTime,
          estimatedMinutes,
          isRecurring,
          recurrenceRule: isRecurring ? recurrenceRule : '',
          notes,
          date: selectedDate,
        });
      } else {
        await onAddTask({
          title,
          description,
          category,
          priority,
          timeBlock,
          startTime,
          estimatedMinutes,
          isRecurring,
          recurrenceRule: isRecurring ? recurrenceRule : '',
          notes,
          date: selectedDate,
        });
      }
      setIsModalOpen(false);
    } finally {
      setLoading(false);
    }
  };

  // Reschedule incomplete task to today
  const handleRescheduleToToday = async (task: TaskItem) => {
    const todayStr = new Date().toISOString().split('T')[0];
    await onUpdateTask(task.id, {
      date: todayStr,
      notes: (task.notes ? task.notes + ' • ' : '') + `Reagendada de ${task.date} para hoje`,
    });
  };

  // Day navigation
  const shiftDay = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    if (viewMode === 'day' && t.date !== selectedDate) return false;
    if (categoryFilter !== 'todas' && t.category !== categoryFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Controls Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#161b22] border border-[#30363d] p-4 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-[#0d1117] border border-[#30363d] rounded-xl p-1">
            <button
              onClick={() => shiftDay(-1)}
              className="p-1.5 rounded-lg text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d]"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-semibold text-[#f0f6fc] px-2 py-1 focus:outline-none"
            />
            <button
              onClick={() => shiftDay(1)}
              className="p-1.5 rounded-lg text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d]"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex bg-[#0d1117] border border-[#30363d] rounded-xl p-1 text-xs">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                viewMode === 'day' ? 'bg-[#21262d] text-emerald-400' : 'text-[#8b949e]'
              }`}
            >
              Dia
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                viewMode === 'week' ? 'bg-[#21262d] text-emerald-400' : 'text-[#8b949e]'
              }`}
            >
              Geral / Semana
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#0d1117] border border-[#30363d] text-xs text-[#f0f6fc] rounded-xl px-3 py-2 focus:outline-none"
          >
            <option value="todas">Todas as categorias</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>

          <button
            onClick={openNewTaskModal}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            Nova Tarefa
          </button>
        </div>
      </div>

      {/* Task Time Blocks View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {TIME_BLOCKS.map((block) => {
          const blockTasks = filteredTasks.filter((t) => t.timeBlock === block);
          return (
            <div
              key={block}
              className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-2.5 border-b border-[#30363d] mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#8b949e] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Bloco: {block}
                  </h3>
                  <span className="text-[11px] font-mono text-[#6e7681]">
                    {blockTasks.length}
                  </span>
                </div>

                {blockTasks.length === 0 ? (
                  <div className="py-6 text-center text-[#6e7681] text-xs">
                    Nenhuma tarefa neste bloco.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {blockTasks.map((t) => (
                      <div
                        key={t.id}
                        className={`p-3 rounded-xl border transition-all ${
                          t.completed
                            ? 'bg-[#0d1117]/50 border-[#30363d]/60 opacity-60'
                            : 'bg-[#0d1117] border-[#30363d] hover:border-[#484f58]'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <button
                            type="button"
                            onClick={() => onUpdateTask(t.id, { completed: !t.completed })}
                            className="mt-0.5 text-emerald-400 hover:text-emerald-300"
                          >
                            {t.completed ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <Circle className="w-4 h-4 text-[#6e7681]" />
                            )}
                          </button>

                          <div className="flex-1 min-w-0">
                            <span
                              className={`text-xs font-medium text-[#f0f6fc] block ${
                                t.completed ? 'line-through text-[#6e7681]' : ''
                              }`}
                            >
                              {t.title}
                            </span>

                            {t.description && (
                              <p className="text-[11px] text-[#8b949e] mt-0.5 line-clamp-2">
                                {t.description}
                              </p>
                            )}

                            <div className="flex flex-wrap items-center gap-1.5 mt-2">
                              <span
                                className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${
                                  CATEGORIES.find((c) => c.id === t.category)?.color ||
                                  'bg-zinc-800 text-zinc-300'
                                }`}
                              >
                                {t.category}
                              </span>

                              {t.startTime && (
                                <span className="text-[10px] text-[#8b949e] flex items-center gap-0.5">
                                  <Clock className="w-3 h-3" />
                                  {t.startTime}
                                </span>
                              )}

                              <span className="text-[10px] text-[#8b949e]">
                                {t.estimatedMinutes}m
                              </span>

                              {t.priority === 'alta' && (
                                <span className="text-[10px] font-semibold text-rose-400 px-1 py-0.2 rounded bg-rose-950/40 border border-rose-800/40">
                                  Alta
                                </span>
                              )}
                            </div>

                            {/* Reschedule button if incomplete and old date */}
                            {!t.completed && t.date < selectedDate && (
                              <button
                                onClick={() => handleRescheduleToToday(t)}
                                className="mt-2 text-[10px] font-medium text-amber-400 hover:underline flex items-center gap-1"
                              >
                                <RotateCcw className="w-3 h-3" />
                                Reagendar para hoje
                              </button>
                            )}
                          </div>

                          <div className="flex flex-col gap-1 shrink-0">
                            <button
                              onClick={() => openEditModal(t)}
                              className="text-[#6e7681] hover:text-[#f0f6fc] p-1"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => onDeleteTask(t.id)}
                              className="text-[#6e7681] hover:text-rose-400 p-1"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => {
                  setTimeBlock(block);
                  openNewTaskModal();
                }}
                className="mt-3 w-full py-1.5 rounded-lg border border-dashed border-[#30363d] hover:border-emerald-500/50 text-[11px] text-[#8b949e] hover:text-emerald-400 transition-colors flex items-center justify-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Adicionar em {block}
              </button>
            </div>
          );
        })}
      </div>

      {/* Modal Criar / Editar Tarefa */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[#8b949e] hover:text-[#f0f6fc]"
            >
              <Trash2 className="w-4 h-4 hidden" />
              ×
            </button>

            <h3 className="text-base font-bold text-[#f0f6fc] mb-4">
              {editingTask ? 'Editar Tarefa' : 'Nova Tarefa na Rotina'}
            </h3>

            <form onSubmit={handleSaveTask} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-[#8b949e] mb-1">
                  Título da Tarefa *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Revisar documentação do cliente"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-[#f0f6fc] focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8b949e] mb-1">
                  Descrição ou notas
                </label>
                <textarea
                  rows={2}
                  placeholder="Instruções, links ou notas de contexto..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-[#f0f6fc] focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#8b949e] mb-1">
                    Categoria
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as TaskCategory)}
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-[#f0f6fc]"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#8b949e] mb-1">
                    Prioridade
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-[#f0f6fc]"
                  >
                    <option value="baixa">Baixa</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#8b949e] mb-1">
                    Bloco do Dia
                  </label>
                  <select
                    value={timeBlock}
                    onChange={(e) => setTimeBlock(e.target.value as TimeBlock)}
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-[#f0f6fc]"
                  >
                    {TIME_BLOCKS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#8b949e] mb-1">
                    Horário (HH:MM)
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-[#f0f6fc]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#8b949e] mb-1">
                    Duração Est.
                  </label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    value={estimatedMinutes}
                    onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-[#f0f6fc]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="chk-rec"
                  checked={isRecurring}
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="rounded border-[#30363d] bg-[#0d1117] text-emerald-500 focus:ring-0"
                />
                <label htmlFor="chk-rec" className="text-xs text-[#8b949e] cursor-pointer">
                  Repetir diariamente ou em dias úteis
                </label>
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
                  {loading ? 'Salvando...' : editingTask ? 'Salvar Alterações' : 'Criar Tarefa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
