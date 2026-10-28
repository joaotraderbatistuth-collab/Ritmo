import React, { useState } from 'react';
import { X, Sparkles, Check, Info } from 'lucide-react';
import { FocusCycle, FocusCycleDuration, RoutineLevel } from '../lib/types.js';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveCycle: (cycle: FocusCycle) => void;
  existingCycle?: FocusCycle | null;
}

const PRESET_HABITS = [
  'Movimento ou exercício físico diário',
  'Leitura ou estudo focado (30 min)',
  'Meditação, respiração consciente ou oração',
  'Sono e horário de descanso regulado (7-8h)',
  'Hidratação consciente ao longo do dia',
  'Desconexão digital matinal (sem redes sociais até o almoço)',
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onSaveCycle,
  existingCycle,
}) => {
  const [step, setStep] = useState<number>(1);
  const [durationDays, setDurationDays] = useState<FocusCycleDuration>(
    existingCycle?.durationDays || 40
  );
  const [title, setTitle] = useState(existingCycle?.title || '');
  const [mainGoal, setMainGoal] = useState(
    existingCycle?.mainGoal || 'Concluir projeto principal e estabilizar rotina'
  );
  const [secondaryGoalInput, setSecondaryGoalInput] = useState('');
  const [secondaryGoals, setSecondaryGoals] = useState<string[]>(
    existingCycle?.secondaryGoals || ['Ler 2 livros técnicos', 'Organizar finanças mensais']
  );
  const [startDate, setStartDate] = useState(
    existingCycle?.startDate || new Date().toISOString().split('T')[0]
  );
  const [routineLevel, setRoutineLevel] = useState<RoutineLevel>(
    existingCycle?.routineLevel || 'equilibrado'
  );
  const [preferredTimes, setPreferredTimes] = useState(
    existingCycle?.preferredTimes || 'Manhã (07h - 11h) e Tarde (14h - 18h)'
  );
  const [digitalLimits, setDigitalLimits] = useState(
    existingCycle?.digitalLimits || 'Instagram e TikTok limitados a 30 min após as 19h; telas desligadas às 22h.'
  );
  const [selectedHabits, setSelectedHabits] = useState<string[]>(PRESET_HABITS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddSecondaryGoal = () => {
    if (secondaryGoalInput.trim() && secondaryGoals.length < 5) {
      setSecondaryGoals([...secondaryGoals, secondaryGoalInput.trim()]);
      setSecondaryGoalInput('');
    }
  };

  const handleRemoveSecondaryGoal = (index: number) => {
    setSecondaryGoals(secondaryGoals.filter((_, i) => i !== index));
  };

  const toggleHabit = (habit: string) => {
    if (selectedHabits.includes(habit)) {
      setSelectedHabits(selectedHabits.filter((h) => h !== habit));
    } else {
      setSelectedHabits([...selectedHabits, habit]);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/cycles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || `Ciclo de ${durationDays} Dias — Foco Total`,
          mainGoal,
          secondaryGoals,
          durationDays,
          startDate,
          routineLevel,
          preferredTimes,
          digitalLimits,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao registrar ciclo de foco.');

      // Also create selected habits
      for (const hName of selectedHabits) {
        await fetch('/api/habits', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: hName,
            category: 'geral',
            targetFrequency: 'diario',
          }),
        });
      }

      onSaveCycle(data.cycle);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-xl p-6 sm:p-8 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d]"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            Estrutura do Modo Foco
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#f0f6fc]">
            Planeje seu Ciclo de Consistência
          </h2>
          <p className="text-xs sm:text-sm text-[#8b949e] mt-1">
            Inspirado no conceito de imersão ("Modo Caverna"), desenhado para a vida real: sem isolamento extremo, privação ou culpa.
          </p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#30363d]">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  step === s
                    ? 'bg-emerald-500 text-black'
                    : step > s
                    ? 'bg-emerald-950 border border-emerald-500/50 text-emerald-400'
                    : 'bg-[#21262d] text-[#6e7681]'
                }`}
              >
                {step > s ? <Check className="w-3.5 h-3.5" /> : s}
              </div>
              <span className={`text-xs font-medium hidden sm:inline ${step === s ? 'text-[#f0f6fc]' : 'text-[#6e7681]'}`}>
                {s === 1 ? 'Duração & Intensidade' : s === 2 ? 'Metas & Horários' : 'Hábitos & Limites'}
              </span>
            </div>
          ))}
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-950/30 border border-rose-800/40 text-rose-300 text-xs">
            {error}
          </div>
        )}

        {/* STEP 1: Duração & Intensidade */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-2">
                1. Escolha a Duração do Ciclo
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {([7, 21, 40, 90] as FocusCycleDuration[]).map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setDurationDays(days)}
                    className={`p-3.5 rounded-xl border text-center transition-all ${
                      durationDays === days
                        ? 'border-emerald-500 bg-emerald-950/30 text-emerald-400 font-bold shadow-lg shadow-emerald-500/10'
                        : 'border-[#30363d] bg-[#0d1117] text-[#8b949e] hover:border-[#484f58]'
                    }`}
                  >
                    <span className="block text-xl font-extrabold">{days}</span>
                    <span className="text-[11px] block mt-0.5">Dias</span>
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-[#6e7681] mt-2">
                {durationDays === 7 && 'Ideal para reiniciar o foco semanal e destravar tarefas represadas.'}
                {durationDays === 21 && 'Excelente para fixar ou eliminar um padrão de hábito específico.'}
                {durationDays === 40 && 'O ciclo clássico de reinvenção e conclusão de grandes projetos.'}
                {durationDays === 90 && 'Transformação profunda e execução de metas trimestrais complexas.'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-2">
                2. Nível de Rotina
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'leve', label: 'Leve', desc: '1 a 2 blocos de foco. Para rotinas corridas.' },
                  { id: 'equilibrado', label: 'Equilibrado', desc: '3 blocos balanceados. Consistência duradoura.' },
                  { id: 'intensivo', label: 'Intensivo', desc: 'Imersão alta com múltiplos blocos estruturados.' },
                ].map((lvl) => (
                  <button
                    key={lvl.id}
                    type="button"
                    onClick={() => setRoutineLevel(lvl.id as RoutineLevel)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      routineLevel === lvl.id
                        ? 'border-emerald-500 bg-emerald-950/30 text-emerald-400'
                        : 'border-[#30363d] bg-[#0d1117] text-[#8b949e] hover:border-[#484f58]'
                    }`}
                  >
                    <div className="font-semibold text-xs text-[#f0f6fc]">{lvl.label}</div>
                    <div className="text-[11px] text-[#8b949e] mt-1">{lvl.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition-colors"
              >
                Próximo: Metas & Prazos →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Metas & Prazos */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-1">
                Nome do Ciclo (opcional)
              </label>
              <input
                type="text"
                placeholder={`Ex: Ciclo de ${durationDays} Dias — Foco Q4`}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-[#f0f6fc] focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-1">
                Meta Principal (O Grande Marco) *
              </label>
              <textarea
                rows={2}
                required
                placeholder="Ex: Entregar a versão 1.0 do produto e criar estabilidade financeira"
                value={mainGoal}
                onChange={(e) => setMainGoal(e.target.value)}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-[#f0f6fc] focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-1">
                Metas Secundárias (Até 5)
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Ex: Ler 2 livros ou treinar 4x por semana"
                  value={secondaryGoalInput}
                  onChange={(e) => setSecondaryGoalInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSecondaryGoal())}
                  className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-[#f0f6fc] focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleAddSecondaryGoal}
                  className="px-4 py-2 bg-[#21262d] hover:bg-[#30363d] text-xs font-medium text-[#f0f6fc] rounded-lg"
                >
                  Adicionar
                </button>
              </div>
              <div className="space-y-1.5">
                {secondaryGoals.map((g, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between px-3 py-1.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-xs text-[#f0f6fc]"
                  >
                    <span>• {g}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSecondaryGoal(idx)}
                      className="text-[#6e7681] hover:text-rose-400"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-1">
                  Data de Início
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-[#f0f6fc] focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-1">
                  Horários Preferidos de Foco
                </label>
                <input
                  type="text"
                  placeholder="Ex: Manhã (07h-11h)"
                  value={preferredTimes}
                  onChange={(e) => setPreferredTimes(e.target.value)}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-[#f0f6fc] focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 text-xs font-medium text-[#8b949e] hover:text-[#f0f6fc]"
              >
                ← Voltar
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition-colors"
              >
                Próximo: Hábitos & Limites →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Hábitos & Limites Digitais */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-2">
                Hábitos Recomendados para Ativar no Ciclo
              </label>
              <div className="space-y-2">
                {PRESET_HABITS.map((habit) => {
                  const active = selectedHabits.includes(habit);
                  return (
                    <button
                      key={habit}
                      type="button"
                      onClick={() => toggleHabit(habit)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-left transition-all ${
                        active
                          ? 'border-emerald-500/60 bg-emerald-950/20 text-[#f0f6fc]'
                          : 'border-[#30363d] bg-[#0d1117] text-[#8b949e]'
                      }`}
                    >
                      <span className="text-xs">{habit}</span>
                      <div
                        className={`w-4 h-4 rounded flex items-center justify-center border ${
                          active
                            ? 'border-emerald-500 bg-emerald-500 text-black'
                            : 'border-[#484f58] bg-[#21262d]'
                        }`}
                      >
                        {active && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-1">
                Limites Digitais Pessoais (Autodisciplina)
              </label>
              <textarea
                rows={2}
                placeholder="Ex: Notificações silenciosas no horário de trabalho; sem redes sociais na primeira hora da manhã."
                value={digitalLimits}
                onChange={(e) => setDigitalLimits(e.target.value)}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-[#f0f6fc] focus:outline-none focus:border-emerald-500"
              />
              <p className="text-[11px] text-[#6e7681] mt-1">
                Nota de integridade: definimos combinados pessoais conscientes. O Ritmo não promete bloquear aplicativos no seu sistema operacional.
              </p>
            </div>

            {/* Realistic Health Disclaimer */}
            <div className="p-3 rounded-lg bg-[#21262d] border border-[#30363d] flex items-start gap-2 text-xs text-[#8b949e]">
              <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong>Aviso de Saúde & Flexibilidade:</strong> O Ritmo incentiva consistência e autonomia. Não substitui cuidados médicos ou psicológicos. Se imprevistos ocorrerem, ajuste o ritmo sem culpa: consistência supera perfeição rígida.
              </span>
            </div>

            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-4 py-2 text-xs font-medium text-[#8b949e] hover:text-[#f0f6fc]"
              >
                ← Voltar
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleSubmit}
                className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/20 transition-colors disabled:opacity-50"
              >
                {loading ? 'Salvando Ciclo...' : 'Iniciar Ciclo de Foco 🚀'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
