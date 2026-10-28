import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CycleMilestone, FocusCycle } from '../lib/types.js';
import { roadmapProgress, stepStatus } from '../lib/roadmap.js';
import { Map as MapIcon, Plus, Trash2, Pencil, Check, X, Loader2, Sparkles, RefreshCw, AlertCircle, CalendarDays } from 'lucide-react';

// Roteiro de metas do ciclo de foco ativo: marcos por dia do ciclo, gerados automaticamente
// e totalmente editáveis. Tudo é salvo no servidor via /api/milestones.

interface TabRoadmapProps {
  activeCycle: FocusCycle | null;
  onOpenOnboarding: () => void;
}

async function call(action: string, payload: Record<string, unknown> = {}) {
  const res = await fetch('/api/milestones', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...payload }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Não foi possível concluir a ação.');
  return data;
}

function dateOfDay(startDate: string, day: number): string {
  const d = new Date(startDate + 'T00:00:00');
  d.setDate(d.getDate() + day - 1);
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export const TabRoadmap: React.FC<TabRoadmapProps> = ({ activeCycle, onOpenOnboarding }) => {
  const [steps, setSteps] = useState<CycleMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [draft, setDraft] = useState({ title: '', description: '', targetDay: 1 });
  const [adding, setAdding] = useState(false);
  const [newStep, setNewStep] = useState({ title: '', description: '', targetDay: 1 });

  const cycleId = activeCycle?.id;

  const currentDay = useMemo(() => {
    if (!activeCycle) return 1;
    const start = new Date(activeCycle.startDate + 'T00:00:00').getTime();
    const diff = Math.floor((Date.now() - start) / 86400000) + 1;
    return Math.max(1, Math.min(activeCycle.durationDays, diff));
  }, [activeCycle]);

  const load = useCallback(async () => {
    if (!cycleId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/milestones?cycleId=${cycleId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Não foi possível carregar o roteiro.');
      setSteps(data.milestones || []);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [cycleId]);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try {
      await fn();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const toggle = (s: CycleMilestone) =>
    run(async () => {
      // atualização otimista
      setSteps((prev) => prev.map((x) => (x.id === s.id ? { ...x, done: !s.done } : x)));
      try {
        await call('update', { milestoneId: s.id, done: !s.done });
      } catch (e) {
        await load();
        throw e;
      }
    });

  const saveEdit = (id: number) =>
    run(async () => {
      await call('update', { milestoneId: id, title: draft.title, description: draft.description, targetDay: draft.targetDay });
      setEditingId(null);
      await load();
    });

  const remove = (s: CycleMilestone) => {
    if (!confirm(`Excluir o marco "${s.title}"?`)) return;
    run(async () => {
      await call('delete', { milestoneId: s.id });
      await load();
    });
  };

  const addStep = () =>
    run(async () => {
      if (!cycleId || !newStep.title.trim()) return;
      await call('create', { cycleId, ...newStep });
      setNewStep({ title: '', description: '', targetDay: 1 });
      setAdding(false);
      await load();
    });

  const generate = (force: boolean) => {
    if (force && !confirm('Refazer o roteiro sugerido? Seus marcos atuais (inclusive os concluídos e os que você editou) serão substituídos.')) return;
    run(async () => {
      if (!cycleId) return;
      const data = await call(force ? 'regenerate' : 'generate', { cycleId });
      setSteps(data.milestones || []);
    });
  };

  const progress = roadmapProgress(steps);
  const field =
    'w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-2.5 py-1.5 text-xs text-[#f0f6fc] focus:outline-none focus:border-emerald-500';

  if (!activeCycle) {
    return (
      <div className="text-center py-16 bg-[#161b22] border border-dashed border-[#30363d] rounded-2xl">
        <MapIcon className="w-8 h-8 text-[#8b949e] mx-auto mb-3" />
        <p className="text-sm font-medium">Você ainda não tem um ciclo de foco ativo</p>
        <p className="text-xs text-[#8b949e] mt-1 mb-4">Crie um ciclo e o roteiro de metas é montado automaticamente para você.</p>
        <button onClick={onOpenOnboarding} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold">
          Criar meu ciclo de foco
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            <MapIcon className="w-5 h-5 text-emerald-400" /> Roteiro de metas
          </h2>
          <p className="text-xs text-[#8b949e] mt-0.5">
            Os marcos do seu ciclo de {activeCycle.durationDays} dias. Edite, adicione ou apague o que quiser — o roteiro é seu.
          </p>
        </div>
        {steps.length > 0 && (
          <button
            onClick={() => generate(true)}
            disabled={busy}
            className="flex items-center gap-1.5 text-xs text-[#8b949e] hover:text-emerald-400 disabled:opacity-50"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refazer roteiro sugerido
          </button>
        )}
      </div>

      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4">
        <p className="text-[11px] uppercase tracking-wide text-[#8b949e]">Meta principal</p>
        <p className="text-sm font-semibold mt-0.5">{activeCycle.mainGoal}</p>
        <div className="flex items-center justify-between text-xs text-[#8b949e] mt-3">
          <span>Dia {currentDay} de {activeCycle.durationDays}</span>
          <span>{progress.done} de {progress.total} marcos concluídos</span>
        </div>
        <div className="mt-1.5 h-2 rounded-full bg-[#21262d] overflow-hidden">
          <div className="h-full bg-emerald-500 transition-all" style={{ width: `${progress.percent}%` }} />
        </div>
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-2 bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs rounded-xl p-3">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')} aria-label="Fechar aviso"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-14 text-[#8b949e]">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Carregando roteiro...
        </div>
      ) : steps.length === 0 ? (
        <div className="text-center py-12 bg-[#161b22] border border-dashed border-[#30363d] rounded-2xl">
          <Sparkles className="w-7 h-7 text-emerald-400 mx-auto mb-3" />
          <p className="text-sm font-medium">Seu ciclo ainda não tem um roteiro</p>
          <p className="text-xs text-[#8b949e] mt-1 mb-4">Geramos marcos sugeridos para os {activeCycle.durationDays} dias, e você ajusta como preferir.</p>
          <button
            onClick={() => generate(false)}
            disabled={busy}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold disabled:opacity-50"
          >
            {busy ? 'Gerando...' : 'Gerar roteiro sugerido'}
          </button>
        </div>
      ) : (
        <ol className="relative border-l-2 border-[#30363d] ml-3 space-y-4">
          {steps.map((s) => {
            const status = stepStatus(s, currentDay);
            const isEditing = editingId === s.id;
            const dot =
              status === 'concluido' ? 'bg-emerald-500 border-emerald-500' : status === 'hoje' ? 'bg-amber-400 border-amber-400' : 'bg-[#0d1117] border-[#484f58]';
            return (
              <li key={s.id} className="ml-5 relative">
                <span className={`absolute -left-[27px] top-3 w-3.5 h-3.5 rounded-full border-2 ${dot}`} aria-hidden />
                <div className={`bg-[#161b22] border rounded-xl p-3.5 ${status === 'hoje' ? 'border-amber-500/50' : 'border-[#30363d]'}`}>
                  {isEditing ? (
                    <div className="space-y-2">
                      <input className={field} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} aria-label="Título do marco" />
                      <textarea className={field} rows={3} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} aria-label="Descrição do marco" />
                      <label className="flex items-center gap-2 text-xs text-[#8b949e]">
                        Dia do ciclo
                        <input
                          type="number"
                          min={1}
                          max={activeCycle.durationDays}
                          className={`${field} w-20`}
                          value={draft.targetDay}
                          onChange={(e) => setDraft({ ...draft, targetDay: Number(e.target.value) })}
                        />
                      </label>
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setEditingId(null)} className="px-3 py-1.5 rounded-lg bg-[#21262d] text-xs">Cancelar</button>
                        <button onClick={() => saveEdit(s.id)} disabled={busy || !draft.title.trim()} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold disabled:opacity-50">Salvar</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggle(s)}
                        disabled={busy}
                        aria-label={s.done ? `Reabrir o marco ${s.title}` : `Concluir o marco ${s.title}`}
                        className={`mt-0.5 w-5 h-5 shrink-0 rounded border flex items-center justify-center ${s.done ? 'bg-emerald-500 border-emerald-500 text-slate-950' : 'border-[#484f58] hover:border-emerald-400'}`}
                      >
                        {s.done && <Check className="w-3.5 h-3.5" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#21262d] text-[#8b949e]">Dia {s.targetDay}</span>
                          <span className="text-[10px] text-[#6e7681] flex items-center gap-1"><CalendarDays className="w-3 h-3" />{dateOfDay(activeCycle.startDate, s.targetDay)}</span>
                          {status === 'hoje' && <span className="text-[10px] font-semibold text-amber-300">é hoje</span>}
                          {status === 'ajustar' && <span className="text-[10px] text-amber-300/80">vale reajustar a data</span>}
                        </div>
                        <p className={`text-sm font-semibold mt-1 ${s.done ? 'line-through text-[#8b949e]' : ''}`}>{s.title}</p>
                        {s.description && <p className="text-xs text-[#8b949e] mt-1 leading-relaxed">{s.description}</p>}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => { setEditingId(s.id); setDraft({ title: s.title, description: s.description || '', targetDay: s.targetDay }); }}
                          aria-label={`Editar o marco ${s.title}`}
                          className="p-1.5 rounded text-[#8b949e] hover:text-[#f0f6fc]"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => remove(s)} aria-label={`Excluir o marco ${s.title}`} className="p-1.5 rounded text-[#8b949e] hover:text-rose-400">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {!loading && steps.length > 0 && (
        <div>
          {!adding ? (
            <button onClick={() => { setAdding(true); setNewStep({ title: '', description: '', targetDay: currentDay }); }} className="flex items-center gap-1.5 text-xs text-[#8b949e] hover:text-emerald-400">
              <Plus className="w-3.5 h-3.5" /> Adicionar marco
            </button>
          ) : (
            <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-3.5 space-y-2">
              <input className={field} placeholder="Título do marco" value={newStep.title} onChange={(e) => setNewStep({ ...newStep, title: e.target.value })} aria-label="Título do novo marco" />
              <textarea className={field} rows={2} placeholder="Descrição (opcional)" value={newStep.description} onChange={(e) => setNewStep({ ...newStep, description: e.target.value })} aria-label="Descrição do novo marco" />
              <label className="flex items-center gap-2 text-xs text-[#8b949e]">
                Dia do ciclo
                <input type="number" min={1} max={activeCycle.durationDays} className={`${field} w-20`} value={newStep.targetDay} onChange={(e) => setNewStep({ ...newStep, targetDay: Number(e.target.value) })} />
              </label>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setAdding(false)} className="px-3 py-1.5 rounded-lg bg-[#21262d] text-xs">Cancelar</button>
                <button onClick={addStep} disabled={busy || !newStep.title.trim()} className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold disabled:opacity-50">Adicionar</button>
              </div>
            </div>
          )}
        </div>
      )}

      <p className="text-[11px] text-[#6e7681]">
        Um marco que passou da data não é fracasso: ajuste o dia e siga. O roteiro é um guia, não uma cobrança.
      </p>
    </div>
  );
};
