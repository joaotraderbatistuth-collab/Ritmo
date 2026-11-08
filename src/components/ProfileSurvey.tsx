import React, { useEffect, useState } from 'react';
import { Sparkles, ChevronLeft, Check, X, ListChecks, Trash2, Pencil } from 'lucide-react';
import { callApi } from '../lib/client-api.js';
import { SURVEY_QUESTIONS, SurveyAnswers, answeredCount, answerLabels } from '../lib/survey.js';

// Pesquisa de perfil: aparece depois do cadastro (1 pergunta por tela, tudo opcional)
// e pode ser refeita ou apagada em Configurações.

interface SurveyRecord {
  answers: SurveyAnswers;
  completedAt: string | null;
}

export const ProfileSurveyModal: React.FC<{
  isOpen: boolean;
  initial?: SurveyAnswers;
  /** veio de Configurações (sem tela de apresentação nem "agora não") */
  editing?: boolean;
  onClose: (saved: SurveyRecord | null) => void;
}> = ({ isOpen, initial, editing, onClose }) => {
  const [step, setStep] = useState(editing ? 0 : -1); // -1 = apresentação; SURVEY_QUESTIONS.length = obrigado
  const [answers, setAnswers] = useState<SurveyAnswers>(initial || {});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStep(editing ? 0 : -1);
      setAnswers(initial || {});
      setError('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;
  const total = SURVEY_QUESTIONS.length;
  const q = step >= 0 && step < total ? SURVEY_QUESTIONS[step] : null;

  const later = async () => {
    if (!editing) await callApi('/api/survey', { action: 'dismiss' });
    onClose(null);
  };

  const finish = async (final: SurveyAnswers) => {
    setBusy(true);
    setError('');
    const r = await callApi<{ survey?: SurveyRecord; error?: string }>('/api/survey', { action: 'save', answers: final });
    setBusy(false);
    if (!r.ok) {
      setError(r.data.error || 'Não foi possível salvar. Tente de novo.');
      return;
    }
    if (answeredCount(final) === 0) {
      // não respondeu nada: conta como "agora não"
      if (!editing) await callApi('/api/survey', { action: 'dismiss' });
      onClose(null);
      return;
    }
    setStep(total);
    setTimeout(() => onClose(r.data.survey || { answers: final, completedAt: new Date().toISOString() }), 1600);
  };

  const next = (nextAnswers = answers) => {
    if (step < total - 1) setStep(step + 1);
    else finish(nextAnswers);
  };

  const pick = (optId: string) => {
    if (!q) return;
    if (q.type === 'single') {
      const nextAnswers = { ...answers, [q.id]: optId };
      setAnswers(nextAnswers);
      setTimeout(() => next(nextAnswers), 180); // resposta única avança sozinha
      return;
    }
    const cur = Array.isArray(answers[q.id]) ? (answers[q.id] as string[]) : [];
    let list = cur.includes(optId) ? cur.filter((x) => x !== optId) : [...cur, optId];
    if (q.id === 'esportes') list = optId === 'nenhum' ? (cur.includes('nenhum') ? [] : ['nenhum']) : list.filter((x) => x !== 'nenhum');
    if (q.max && list.length > q.max) return;
    setAnswers({ ...answers, [q.id]: list });
  };

  const selected = (optId: string) => {
    const v = q ? answers[q.id] : undefined;
    return Array.isArray(v) ? v.includes(optId) : v === optId;
  };

  return (
    <div className="fixed inset-0 z-[75] bg-black/80 flex items-end sm:items-center justify-center p-3" role="dialog" aria-modal="true" aria-label="Pesquisa rápida">
      <div className="w-full max-w-md rounded-2xl border border-[#30363d] bg-[#161b22] text-[#f0f6fc] max-h-[92vh] flex flex-col">
        {step === -1 && (
          <div className="p-6">
            <span className="w-12 h-12 rounded-full bg-emerald-500/15 text-emerald-300 flex items-center justify-center"><Sparkles className="w-6 h-6" /></span>
            <h3 className="mt-4 font-bold text-xl">Conta um pouco sobre você?</h3>
            <p className="mt-2 text-sm text-[#c9d1d9]">São {total} perguntas rápidas, de tocar e seguir (menos de 1 minuto). Com elas, o Ritmo vai sugerir conteúdos, Ritus e desafios com a sua cara.</p>
            <ul className="mt-4 space-y-1.5 text-xs text-[#8b949e]">
              <li>• Tudo é opcional: pule o que quiser.</li>
              <li>• Ninguém mais vê suas respostas e elas nunca são vendidas.</li>
              <li>• Dá para mudar ou apagar em Configurações a qualquer hora.</li>
            </ul>
            <button type="button" onClick={() => setStep(0)} className="mt-5 w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold">Vamos lá</button>
            <button type="button" onClick={later} className="mt-2 w-full py-2.5 rounded-xl text-sm text-[#8b949e] hover:text-[#c9d1d9]">Agora não</button>
          </div>
        )}

        {q && (
          <>
            <div className="px-5 pt-5">
              <div className="flex items-center justify-between text-xs text-[#8b949e]">
                <button type="button" onClick={() => (step > 0 ? setStep(step - 1) : editing ? onClose(null) : setStep(-1))} className="inline-flex items-center gap-1 hover:text-[#c9d1d9]"><ChevronLeft className="w-4 h-4" /> Voltar</button>
                <span>{step + 1} de {total}</span>
                <button type="button" onClick={editing ? () => onClose(null) : later} aria-label="Fechar" className="hover:text-[#c9d1d9]"><X className="w-4 h-4" /></button>
              </div>
              <div className="mt-3 h-1.5 rounded-full bg-[#21262d] overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all" style={{ width: `${((step + 1) / total) * 100}%` }} />
              </div>
              <h3 className="mt-5 font-bold text-lg leading-snug">{q.title}</h3>
              {q.hint && <p className="mt-1 text-xs text-[#8b949e]">{q.hint}</p>}
            </div>

            <div className="px-5 py-4 overflow-y-auto">
              {q.select ? (
                <select
                  value={(answers[q.id] as string) || ''}
                  onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3 py-3 text-sm"
                >
                  <option value="">Escolha o estado</option>
                  {q.options.map((opt) => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
                </select>
              ) : (
                <div className={q.type === 'multi' ? 'flex flex-wrap gap-2' : 'grid gap-2'}>
                  {q.options.map((opt) => {
                    const on = selected(opt.id);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => pick(opt.id)}
                        aria-pressed={on}
                        className={`text-sm border transition ${q.type === 'multi' ? 'px-3.5 py-2 rounded-full' : 'px-4 py-3 rounded-xl text-left flex items-center justify-between'} ${on ? 'bg-emerald-500/15 border-emerald-500 text-emerald-200' : 'border-[#30363d] text-[#c9d1d9] hover:border-[#8b949e]'}`}
                      >
                        {opt.label}
                        {on && q.type === 'single' && <Check className="w-4 h-4" />}
                      </button>
                    );
                  })}
                </div>
              )}
              {q.type === 'multi' && q.max && <p className="mt-3 text-[11px] text-[#6e7681]">{((answers[q.id] as string[]) || []).length} de até {q.max}</p>}
            </div>

            <div className="px-5 pb-5 pt-1 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  const { [q.id]: _skip, ...rest } = answers;
                  setAnswers(rest);
                  next(rest);
                }}
                disabled={busy}
                className="flex-1 py-2.5 rounded-xl border border-[#30363d] text-sm text-[#c9d1d9]"
              >
                Pular
              </button>
              <button type="button" onClick={() => next()} disabled={busy} className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-sm">
                {step === total - 1 ? (busy ? 'Salvando...' : 'Concluir') : 'Continuar'}
              </button>
            </div>
            {error && <p className="px-5 pb-4 -mt-2 text-xs text-rose-400">{error}</p>}
          </>
        )}

        {step === total && (
          <div className="p-8 text-center">
            <span className="mx-auto w-14 h-14 rounded-full bg-emerald-500/15 text-emerald-300 flex items-center justify-center"><Check className="w-7 h-7" /></span>
            <h3 className="mt-4 font-bold text-xl">Valeu!</h3>
            <p className="mt-1 text-sm text-[#c9d1d9]">Agora o Ritmo conhece você um pouco melhor.</p>
          </div>
        )}
      </div>
    </div>
  );
};

/** Configurações → "Seus gostos": ver, refazer ou apagar as respostas. */
export const ProfileSurveyCard: React.FC = () => {
  const [survey, setSurvey] = useState<SurveyRecord | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    callApi<{ survey?: SurveyRecord | null }>('/api/survey').then((r) => {
      if (r.ok) setSurvey(r.data.survey || null);
      setLoaded(true);
    });
  }, []);

  const answers = survey?.answers || {};
  const count = answeredCount(answers);

  const clear = async () => {
    if (!confirm('Apagar todas as suas respostas da pesquisa?')) return;
    const r = await callApi<{ survey?: SurveyRecord | null }>('/api/survey', { action: 'clear' });
    if (r.ok) setSurvey(r.data.survey || null);
  };

  return (
    <section className="rounded-2xl border border-[#30363d] bg-[#161b22] p-5 mb-6 max-w-4xl mx-auto">
      <h3 className="text-base font-semibold text-[#f0f6fc] flex items-center gap-2"><ListChecks className="w-5 h-5 text-emerald-400" /> Seus gostos</h3>
      <p className="text-xs text-[#8b949e] mt-0.5">Usamos para sugerir conteúdos com a sua cara. Só você vê.</p>
      {loaded && count > 0 ? (
        <dl className="mt-3 grid sm:grid-cols-2 gap-x-6 gap-y-2">
          {SURVEY_QUESTIONS.filter((q) => answerLabels(q.id, answers[q.id]).length).map((q) => (
            <div key={q.id}>
              <dt className="text-[11px] text-[#6e7681]">{q.title}</dt>
              <dd className="text-sm text-[#c9d1d9]">{answerLabels(q.id, answers[q.id]).join(', ')}</dd>
            </div>
          ))}
        </dl>
      ) : (
        loaded && <p className="mt-3 text-sm text-[#c9d1d9]">Você ainda não respondeu. São {SURVEY_QUESTIONS.length} perguntas rápidas.</p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/50 text-sm text-emerald-300 hover:bg-emerald-500/10">
          <Pencil className="w-4 h-4" /> {count > 0 ? 'Editar respostas' : 'Responder agora'}
        </button>
        {count > 0 && (
          <button type="button" onClick={clear} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#30363d] text-sm text-[#c9d1d9] hover:text-rose-400">
            <Trash2 className="w-4 h-4" /> Apagar respostas
          </button>
        )}
      </div>
      <ProfileSurveyModal
        isOpen={open}
        editing
        initial={answers}
        onClose={(saved) => {
          setOpen(false);
          if (saved) setSurvey(saved);
        }}
      />
    </section>
  );
};
