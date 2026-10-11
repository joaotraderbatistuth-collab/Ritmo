import React, { useState, useEffect, useRef } from 'react';
import { FocusSessionItem } from '../lib/types.js';
import {
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Clock,
  Volume2,
  VolumeX,
  Target,
} from 'lucide-react';

interface TabFocusProps {
  sessions: FocusSessionItem[];
  onRecordSession: (session: Partial<FocusSessionItem>) => Promise<void>;
  initialDuration?: number;
  initialTopic?: string;
}

export const TabFocus: React.FC<TabFocusProps> = ({
  sessions,
  onRecordSession,
  initialDuration = 25,
  initialTopic = '',
}) => {
  const [sessionType, setSessionType] = useState<'25_5' | '50_10' | 'custom'>('25_5');
  const [totalMinutes, setTotalMinutes] = useState<number>(initialDuration);
  const [secondsLeft, setSecondsLeft] = useState<number>(initialDuration * 60);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [focusTopic, setFocusTopic] = useState<string>(initialTopic);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const timerRef = useRef<any>(null);

  // Sync initial values
  useEffect(() => {
    if (initialDuration) {
      setTotalMinutes(initialDuration);
      setSecondsLeft(initialDuration * 60);
    }
    if (initialTopic) {
      setFocusTopic(initialTopic);
    }
  }, [initialDuration, initialTopic]);

  // Audio tone generator for browser completion alert
  const playAlertSound = () => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.8);
    } catch {}
  };

  // Timer countdown loop
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsRunning(false);
            playAlertSound();
            // Automatically record completed session
            onRecordSession({
              durationMinutes: totalMinutes,
              sessionType,
              status: 'completed',
              focusTopic: focusTopic || 'Sessão de Foco',
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning, totalMinutes, sessionType, focusTopic]);

  const selectDuration = (type: '25_5' | '50_10' | 'custom', mins: number) => {
    setIsRunning(false);
    setSessionType(type);
    setTotalMinutes(mins);
    setSecondsLeft(mins * 60);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSecondsLeft(totalMinutes * 60);
  };

  const handleFinishEarly = () => {
    setIsRunning(false);
    const elapsedMinutes = Math.max(1, Math.round((totalMinutes * 60 - secondsLeft) / 60));
    onRecordSession({
      durationMinutes: elapsedMinutes,
      sessionType,
      status: 'completed',
      focusTopic: focusTopic || 'Sessão de Foco',
    });
    setSecondsLeft(totalMinutes * 60);
  };

  // Stats
  const todayStr = new Date().toISOString().split('T')[0];
  const todayMinutes = sessions
    .filter((s) => s.date === todayStr)
    .reduce((acc, s) => acc + s.durationMinutes, 0);

  // Formatting MM:SS
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeFormatted = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  const progressPercent = Math.round(
    ((totalMinutes * 60 - secondsLeft) / (totalMinutes * 60)) * 100
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Timer Card */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden text-center">
        {/* Background glow when active */}
        {isRunning && (
          <div className="absolute inset-0 bg-emerald-500/5 pointer-events-none animate-pulse" />
        )}

        {/* Mode selector buttons */}
        <div className="inline-flex bg-[#0d1117] border border-[#30363d] rounded-2xl p-1 mb-8">
          <button
            onClick={() => selectDuration('25_5', 25)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              sessionType === '25_5'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-[#8b949e] hover:text-[#f0f6fc]'
            }`}
          >
            25 min (Pomodoro)
          </button>
          <button
            onClick={() => selectDuration('50_10', 50)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              sessionType === '50_10'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-[#8b949e] hover:text-[#f0f6fc]'
            }`}
          >
            50 min (Imersão)
          </button>
          <button
            onClick={() => selectDuration('custom', 15)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              sessionType === 'custom'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-[#8b949e] hover:text-[#f0f6fc]'
            }`}
          >
            15 min (Sprint)
          </button>
        </div>

        {/* Focus Topic Input */}
        <div className="max-w-md mx-auto mb-8">
          <div className="relative">
            <Target className="w-4 h-4 text-emerald-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Em que você vai focar agora? (Ex: Redigir proposta)"
              value={focusTopic}
              onChange={(e) => setFocusTopic(e.target.value)}
              className="w-full bg-[#0d1117] border border-[#30363d] focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[#f0f6fc] text-center focus:outline-none"
            />
          </div>
        </div>

        {/* Giant Timer Display with Circular Rhythm Ring */}
        <div className="relative w-64 h-64 sm:w-72 sm:h-72 mx-auto flex items-center justify-center my-4">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="44"
              className="text-[#21262d]"
              strokeWidth="5"
              stroke="currentColor"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r="44"
              className="text-emerald-500 transition-all duration-1000 ease-linear"
              strokeWidth="5"
              strokeDasharray={276}
              strokeDashoffset={276 - (276 * progressPercent) / 100}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-[#f0f6fc]">
              {timeFormatted}
            </span>
            <span className="text-xs uppercase tracking-widest text-[#8b949e] font-semibold mt-2">
              {isRunning ? 'Em Andamento' : secondsLeft === 0 ? 'Concluído!' : 'Pausado'}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-center gap-3 mt-6">
          <button
            onClick={handleReset}
            title="Reiniciar temporizador"
            className="p-3.5 rounded-2xl bg-[#0d1117] border border-[#30363d] text-[#8b949e] hover:text-[#f0f6fc] hover:border-[#484f58] transition-all"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`px-8 py-3.5 rounded-2xl font-bold text-sm flex items-center gap-2.5 shadow-xl transition-all ${
              isRunning
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 glow-active'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5 fill-current" /> Pausar Foco
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" /> Iniciar Bloco
              </>
            )}
          </button>

          <button
            onClick={handleFinishEarly}
            title="Concluir e registrar sessão agora"
            disabled={secondsLeft === totalMinutes * 60}
            className="p-3.5 rounded-2xl bg-[#0d1117] border border-[#30363d] text-emerald-400 hover:bg-emerald-950/30 hover:border-emerald-500/50 transition-all disabled:opacity-40"
          >
            <CheckCircle2 className="w-5 h-5" />
          </button>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Silenciar alerta sonoro' : 'Ativar alerta sonoro'}
            className="p-3.5 rounded-2xl bg-[#0d1117] border border-[#30363d] text-[#8b949e] hover:text-[#f0f6fc] transition-all"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5 text-emerald-400" /> : <VolumeX className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Focus Analytics & History */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Daily Summary */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5">
          <div className="flex items-center gap-2 pb-3 border-b border-[#30363d] mb-4">
            <Clock className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-[#f0f6fc]">Tempo de Foco de Hoje</h3>
          </div>

          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-4xl font-extrabold text-emerald-400">{todayMinutes}</span>
            <span className="text-sm font-semibold text-[#8b949e]">minutos focados hoje</span>
          </div>

          <p className="text-xs text-[#8b949e]">
            {todayMinutes >= 50
              ? '🔥 Excelente consistência! Seu cérebro concluiu blocos essenciais hoje.'
              : 'Comece com 1 ou 2 blocos de 25 minutos para proteger sua atenção.'}
          </p>
        </div>

        {/* Completed Sessions Log */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5">
          <div className="flex items-center gap-2 pb-3 border-b border-[#30363d] mb-4">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-[#f0f6fc]">Sessões Concluídas Recentes</h3>
          </div>

          {sessions.length === 0 ? (
            <p className="text-xs text-[#6e7681] py-4 text-center">
              Nenhuma sessão registrada ainda. Inicie seu primeiro bloco acima!
            </p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {sessions.slice(0, 5).map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-[#0d1117] border border-[#30363d] text-xs"
                >
                  <div className="truncate max-w-[200px]">
                    <span className="font-semibold text-[#f0f6fc] block truncate">
                      {s.focusTopic || 'Sessão de Foco'}
                    </span>
                    <span className="text-[10px] text-[#6e7681]">{s.date}</span>
                  </div>
                  <span className="font-mono font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-800/40">
                    +{s.durationMinutes} min
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
