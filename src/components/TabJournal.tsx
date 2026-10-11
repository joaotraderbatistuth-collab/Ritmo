import React, { useState } from 'react';
import { JournalEntryItem } from '../lib/types.js';
import {
  BookOpen,
  Smile,
  Zap,
  Target,
  CheckCircle2,
  Lock,
} from 'lucide-react';

interface TabJournalProps {
  entries: JournalEntryItem[];
  onSaveEntry: (entry: Partial<JournalEntryItem>) => Promise<void>;
}

export const TabJournal: React.FC<TabJournalProps> = ({ entries, onSaveEntry }) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedTab, setSelectedTab] = useState<'daily' | 'weekly'>('daily');
  const [date, setDate] = useState(todayStr);

  // Daily check-in state
  const [energyScore, setEnergyScore] = useState<number>(3);
  const [moodScore, setMoodScore] = useState<number>(3);
  const [focusScore, setFocusScore] = useState<number>(3);
  const [workedWell, setWorkedWell] = useState('');
  const [nextStep, setNextStep] = useState('');
  const [notes, setNotes] = useState('');

  // Weekly review state
  const [difficulties, setDifficulties] = useState('');

  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Check if today already has an entry to prefill
  const existingTodayEntry = entries.find(
    (e) => e.date === date && e.entryType === (selectedTab === 'daily' ? 'daily_checkin' : 'weekly_review')
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSavedSuccess(false);

    try {
      await onSaveEntry({
        date,
        entryType: selectedTab === 'daily' ? 'daily_checkin' : 'weekly_review',
        energyScore,
        moodScore,
        focusScore,
        workedWell,
        nextStep,
        difficulties: selectedTab === 'weekly' ? difficulties : undefined,
        notes,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } finally {
      setLoading(false);
    }
  };

  const loadEntry = (entry: JournalEntryItem) => {
    setDate(entry.date);
    setSelectedTab(entry.entryType === 'daily_checkin' ? 'daily' : 'weekly');
    setEnergyScore(entry.energyScore || 3);
    setMoodScore(entry.moodScore || 3);
    setFocusScore(entry.focusScore || 3);
    setWorkedWell(entry.workedWell || '');
    setNextStep(entry.nextStep || '');
    setDifficulties(entry.difficulties || '');
    setNotes(entry.notes || '');
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Header with Privacy Badge */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#161b22] border border-[#30363d] p-5 rounded-2xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <h2 className="text-base font-bold text-[#f0f6fc]">Diário de Bordo & Reflexão</h2>
          </div>
          <p className="text-xs text-[#8b949e]">
            Pequenos registros diários para manter clareza mental e ajustar a direção semanalmente.
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0d1117] border border-[#30363d] text-xs text-[#8b949e]">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Privacidade Total: Apenas você tem acesso.</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form Check-in */}
        <div className="lg:col-span-2 bg-[#161b22] border border-[#30363d] rounded-2xl p-6">
          {/* Subtabs */}
          <div className="flex items-center justify-between pb-4 border-b border-[#30363d] mb-6">
            <div className="flex bg-[#0d1117] border border-[#30363d] rounded-xl p-1 text-xs font-semibold">
              <button
                onClick={() => setSelectedTab('daily')}
                className={`px-4 py-1.5 rounded-lg transition-colors ${
                  selectedTab === 'daily'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-[#8b949e] hover:text-[#f0f6fc]'
                }`}
              >
                Check-in Diário
              </button>
              <button
                onClick={() => setSelectedTab('weekly')}
                className={`px-4 py-1.5 rounded-lg transition-colors ${
                  selectedTab === 'weekly'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-[#8b949e] hover:text-[#f0f6fc]'
                }`}
              >
                Revisão Semanal
              </button>
            </div>

            <div className="flex items-center gap-2">
              {existingTodayEntry && (
                <button
                  type="button"
                  onClick={() => loadEntry(existingTodayEntry)}
                  className="text-xs text-emerald-400 hover:text-emerald-300 underline font-medium"
                >
                  Carregar registro desta data
                </button>
              )}
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-[#0d1117] border border-[#30363d] rounded-xl px-3 py-1.5 text-xs text-[#f0f6fc] focus:outline-none"
              />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Energy, Mood, Focus Scales (1 to 5) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-[#0d1117] border border-[#30363d]">
              <div>
                <label className="text-xs font-semibold text-[#8b949e] flex items-center gap-1.5 mb-2">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Nível de Energia
                </label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setEnergyScore(val)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        energyScore === val
                          ? 'bg-amber-500 text-black shadow-md'
                          : 'bg-[#21262d] text-[#8b949e] hover:bg-[#30363d]'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#8b949e] flex items-center gap-1.5 mb-2">
                  <Smile className="w-3.5 h-3.5 text-emerald-400" />
                  Humor / Ânimo
                </label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setMoodScore(val)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        moodScore === val
                          ? 'bg-emerald-500 text-black shadow-md'
                          : 'bg-[#21262d] text-[#8b949e] hover:bg-[#30363d]'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#8b949e] flex items-center gap-1.5 mb-2">
                  <Target className="w-3.5 h-3.5 text-indigo-400" />
                  Foco & Clareza
                </label>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setFocusScore(val)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        focusScore === val
                          ? 'bg-indigo-500 text-white shadow-md'
                          : 'bg-[#21262d] text-[#8b949e] hover:bg-[#30363d]'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Prompt 1 */}
            <div>
              <label className="block text-xs font-semibold text-[#f0f6fc] mb-1.5">
                {selectedTab === 'daily'
                  ? '✨ O que funcionou bem hoje?'
                  : '🏆 O que funcionou bem nesta semana de ciclo?'}
              </label>
              <textarea
                rows={3}
                placeholder="Ex: Consegui manter a manhã focada sem olhar o celular; o treino matinal me deu disposição..."
                value={workedWell}
                onChange={(e) => setWorkedWell(e.target.value)}
                className="w-full bg-[#0d1117] border border-[#30363d] focus:border-emerald-500 rounded-xl px-3 py-2 text-xs sm:text-sm text-[#f0f6fc] focus:outline-none"
              />
            </div>

            {/* Prompt 2 */}
            <div>
              <label className="block text-xs font-semibold text-[#f0f6fc] mb-1.5">
                {selectedTab === 'daily'
                  ? '🎯 Qual é o próximo passo mais importante para amanhã?'
                  : '🚀 Qual é o foco prioritário para a próxima semana?'}
              </label>
              <textarea
                rows={2}
                placeholder="Ex: Começar logo às 08h pela tarefa de finanças e não postergar..."
                value={nextStep}
                onChange={(e) => setNextStep(e.target.value)}
                className="w-full bg-[#0d1117] border border-[#30363d] focus:border-emerald-500 rounded-xl px-3 py-2 text-xs sm:text-sm text-[#f0f6fc] focus:outline-none"
              />
            </div>

            {/* Weekly specific prompt */}
            {selectedTab === 'weekly' && (
              <div>
                <label className="block text-xs font-semibold text-[#f0f6fc] mb-1.5">
                  ⚠️ Quais dificuldades surgiram e quais ajustes você fará?
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Tive muitas reuniões quinta-feira; vou blindar as manhãs na próxima semana..."
                  value={difficulties}
                  onChange={(e) => setDifficulties(e.target.value)}
                  className="w-full bg-[#0d1117] border border-[#30363d] focus:border-emerald-500 rounded-xl px-3 py-2 text-xs sm:text-sm text-[#f0f6fc] focus:outline-none"
                />
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-[#8b949e] mb-1.5">
                Notas Livres / Pensamentos
              </label>
              <textarea
                rows={2}
                placeholder="Ideias espontâneas, gratidão, observações..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-[#0d1117] border border-[#30363d] focus:border-emerald-500 rounded-xl px-3 py-2 text-xs sm:text-sm text-[#f0f6fc] focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              {savedSuccess ? (
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Registro gravado com sucesso!
                </span>
              ) : (
                <span className="text-[11px] text-[#6e7681]">
                  Registros podem ser editados a qualquer momento.
                </span>
              )}

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
              >
                {loading ? 'Salvando...' : 'Salvar Registro'}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Past Entries List */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 flex flex-col">
          <div className="pb-3 border-b border-[#30363d] mb-4">
            <h3 className="text-sm font-bold text-[#f0f6fc]">Histórico de Registros</h3>
            <p className="text-xs text-[#8b949e]">Clique para carregar e revisar</p>
          </div>

          {entries.length === 0 ? (
            <div className="py-12 text-center text-[#6e7681] text-xs">
              Nenhuma anotação registrada ainda. Preencha seu primeiro check-in ao lado!
            </div>
          ) : (
            <div className="space-y-2.5 overflow-y-auto max-h-[500px]">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  onClick={() => loadEntry(entry)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    entry.date === date
                      ? 'border-emerald-500/50 bg-emerald-950/20'
                      : 'border-[#30363d] bg-[#0d1117] hover:border-[#484f58]'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-[#f0f6fc]">{entry.date}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#21262d] text-emerald-400">
                      {entry.entryType === 'daily_checkin' ? 'Check-in Diário' : 'Revisão Semanal'}
                    </span>
                  </div>

                  {entry.workedWell && (
                    <p className="text-[11px] text-[#8b949e] truncate mt-1">
                      {entry.workedWell}
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-[10px] text-[#6e7681] mt-2">
                    <span>Energia: {entry.energyScore}/5</span>
                    <span>Humor: {entry.moodScore}/5</span>
                    <span>Foco: {entry.focusScore}/5</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
