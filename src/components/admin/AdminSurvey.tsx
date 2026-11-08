import React, { useEffect, useState } from 'react';
import { X, Sparkles, Download, PieChart, Mail, CalendarDays, UserCheck, Activity } from 'lucide-react';

// Painel → Usuários: ficha completa do usuário (com a pesquisa de gostos) e o resumo do público.

const dateBR = (s?: string | null) => (s ? new Date(s).toLocaleDateString('pt-BR') : '—');

function Shell({ title, onClose, wide, children }: { title: string; onClose: () => void; wide?: boolean; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div className={`bg-[#161b22] border border-[#30363d] rounded-2xl w-full ${wide ? 'max-w-3xl' : 'max-w-xl'} p-5 max-h-[90vh] overflow-y-auto`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold">{title}</h3>
          <button onClick={onClose} aria-label="Fechar"><X className="w-4 h-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

interface SurveyItem {
  id: string;
  title: string;
  type: 'single' | 'multi';
  values: string[];
}

/** Ficha do usuário: dados de cadastro + tudo o que ele respondeu na pesquisa. */
export function UserDetailModal({ user, onClose }: { user: any; onClose: () => void }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [items, setItems] = useState<SurveyItem[]>([]);
  const [survey, setSurvey] = useState<{ completedAt: string | null; updatedAt: string | null; dismissCount: number } | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/admin?survey_user=${user.id}`)
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (!alive) return;
        if (!ok) setError(d.error || 'Não foi possível carregar.');
        else {
          setItems(d.items || []);
          setSurvey(d.survey || null);
        }
      })
      .catch(() => alive && setError('Sem conexão.'))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [user.id]);

  const answered = items.filter((i) => i.values.length > 0);
  const statusText = survey?.completedAt
    ? `Respondida em ${dateBR(survey.completedAt)}${survey.updatedAt && survey.updatedAt !== survey.completedAt ? ` · atualizada em ${dateBR(survey.updatedAt)}` : ''}`
    : survey?.dismissCount
      ? `Ainda não respondeu (tocou em "Agora não" ${survey.dismissCount >= 99 ? 'e apagou as respostas' : `${survey.dismissCount}x`})`
      : 'Ainda não respondeu';

  return (
    <Shell title={user.name} onClose={onClose}>
      <div className="grid sm:grid-cols-2 gap-2 text-sm">
        <Info icon={Mail} label="E-mail" value={user.email} />
        <Info icon={CalendarDays} label="Cadastro" value={dateBR(user.createdAt)} />
        <Info icon={UserCheck} label="Indicado por" value={user.referredByName || '—'} />
        <Info icon={Activity} label="Uso" value={user.active7d ? 'Ativo nos últimos 7 dias' : 'Parado'} />
        {user.whatsappPhone && <Info icon={Mail} label="WhatsApp" value={user.whatsappPhone} />}
        <Info icon={CalendarDays} label="Pagamentos" value={String(user.paymentsCount || 0)} />
      </div>

      <div className="mt-5 border-t border-[#30363d] pt-4">
        <div className="flex items-center gap-2 font-semibold"><Sparkles className="w-4 h-4 text-emerald-400" /> Gostos e perfil</div>
        <p className="text-[11px] text-slate-500 mt-0.5">{loading ? 'Carregando...' : statusText}</p>
        {error && <p className="mt-3 text-sm text-rose-400">{error}</p>}
        {!loading && !error && answered.length === 0 && <p className="mt-3 text-sm text-slate-400">Nada respondido ainda.</p>}
        <dl className="mt-3 space-y-3">
          {answered.map((i) => (
            <div key={i.id}>
              <dt className="text-[11px] text-slate-500">{i.title}</dt>
              <dd className="mt-1 flex flex-wrap gap-1.5">
                {i.values.map((v) => (
                  <span key={v} className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs">{v}</span>
                ))}
              </dd>
            </div>
          ))}
        </dl>
        {answered.length > 0 && <p className="mt-4 text-[11px] text-slate-500">Dados pessoais: use só para melhorar o Ritmo. Esta consulta fica registrada na auditoria.</p>}
      </div>
    </Shell>
  );
}

function Info({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="bg-[#0d1117] border border-[#30363d] rounded-xl px-3 py-2">
      <div className="text-[11px] text-slate-500 flex items-center gap-1"><Icon className="w-3 h-3" /> {label}</div>
      <div className="text-slate-200 truncate" title={value}>{value}</div>
    </div>
  );
}

interface SummaryQuestion {
  questionId: string;
  title: string;
  answered: number;
  options: { id: string; label: string; count: number; percent: number }[];
}

/** Perfil do público: quantas pessoas marcaram cada resposta. */
export function SurveySummaryModal({ onClose, totalUsers }: { onClose: () => void; totalUsers: number }) {
  const [data, setData] = useState<{ respondents: number; questions: SummaryQuestion[] } | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin?survey_summary=1')
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => (ok ? setData(d) : setError(d.error || 'Não foi possível carregar.')))
      .catch(() => setError('Sem conexão.'));
  }, []);

  return (
    <Shell title="Perfil do público" onClose={onClose} wide>
      {error && <p className="text-sm text-rose-400">{error}</p>}
      {!data && !error && <p className="text-sm text-slate-400">Carregando...</p>}
      {data && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-300">
              <strong className="text-white">{data.respondents}</strong> de {totalUsers} usuário(s) responderam
              {totalUsers > 0 && <span className="text-slate-500"> ({Math.round((data.respondents / totalUsers) * 100)}%)</span>}.
            </p>
            <a href="/api/admin?export=survey" download className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#30363d] text-sm text-slate-200 hover:bg-[#21262d]"><Download className="w-4 h-4" /> Baixar planilha</a>
          </div>
          {data.respondents === 0 && <p className="mt-4 text-sm text-slate-400">Ninguém respondeu ainda. A pesquisa aparece para cada pessoa no primeiro acesso depois do cadastro.</p>}
          <div className="mt-4 grid md:grid-cols-2 gap-4">
            {data.questions.filter((q) => q.answered > 0).map((q) => (
              <div key={q.questionId} className="bg-[#0d1117] border border-[#30363d] rounded-xl p-4">
                <div className="text-sm font-semibold">{q.title}</div>
                <div className="text-[11px] text-slate-500 mb-2">{q.answered} resposta(s)</div>
                <ul className="space-y-1.5">
                  {q.options.slice(0, 8).map((o) => (
                    <li key={o.id} className="text-xs">
                      <div className="flex justify-between text-slate-300"><span>{o.label}</span><span className="text-slate-500">{o.count} · {o.percent}%</span></div>
                      <div className="h-1.5 rounded-full bg-[#21262d] mt-0.5 overflow-hidden"><div className="h-full bg-emerald-500" style={{ width: `${o.percent}%` }} /></div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[11px] text-slate-500 flex items-center gap-1"><PieChart className="w-3 h-3" /> Em perguntas de várias respostas, a soma passa de 100%.</p>
        </>
      )}
    </Shell>
  );
}
