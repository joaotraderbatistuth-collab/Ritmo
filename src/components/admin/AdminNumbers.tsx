import React, { useCallback, useEffect, useState } from 'react';
import { RefreshCw, CheckCircle2, AlertTriangle, Smartphone, Server } from 'lucide-react';

// Abas "Números" e "Erros" do painel admin.

const brl = (cents: number) => ((cents || 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const pctTxt = (v: number | null | undefined) => (v === null || v === undefined ? '—' : `${String(v).replace('.', ',')}%`);
const dm = (v: string) => `${v.slice(8, 10)}/${v.slice(5, 7)}`;
const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const monthTxt = (m: string) => `${MONTHS[Number(m.slice(5, 7)) - 1]}/${m.slice(2, 4)}`;

function Stat({ label, value, hint, tone = '' }: { label: string; value: string | number; hint?: string; tone?: string }) {
  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`text-2xl font-extrabold mt-1 tabular-nums ${tone}`}>{value}</p>
      {hint && <p className="text-[11px] text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}

function Panel({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5">
      <h3 className="text-sm font-bold">{title}</h3>
      {note && <p className="text-[11px] text-slate-500 mt-0.5 mb-3">{note}</p>}
      {!note && <div className="mb-3" />}
      {children}
    </section>
  );
}

/** Barras horizontais com valor em %, para comparar semanas/meses/origens. */
function HBars({ rows, max = 100, tone = 'bg-emerald-500', suffix = '%' }: { rows: { label: string; value: number | null; extra?: string }[]; max?: number; tone?: string; suffix?: string }) {
  const top = Math.max(max === 100 ? 1 : 0, ...rows.map((r) => r.value || 0));
  return (
    <div className="space-y-1.5">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-3 text-sm">
          <span className="w-28 shrink-0 text-slate-400 truncate" title={r.label}>{r.label}</span>
          <div className="flex-1 h-5 rounded bg-[#0d1117] overflow-hidden">
            {r.value !== null && <div className={`h-full rounded ${tone}`} style={{ width: `${Math.max(1.5, (r.value / (max === 100 ? Math.max(top, 1) : top || 1)) * 100)}%` }} />}
          </div>
          <span className="w-14 text-right tabular-nums font-semibold">{r.value === null ? '—' : `${String(r.value).replace('.', ',')}${suffix}`}</span>
          {r.extra && <span className="w-24 text-right text-[11px] text-slate-500 hidden sm:inline">{r.extra}</span>}
        </div>
      ))}
    </div>
  );
}

export function NumbersTab() {
  const [m, setM] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const r = await fetch('/api/admin-numeros');
      const d = await r.json().catch(() => ({}));
      if (r.ok) setM(d);
      else setError(d.error || 'Não foi possível carregar os números.');
    } catch {
      setError('Sem conexão.');
    }
    setLoading(false);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  if (error) return <p className="text-rose-300 text-sm">{error}</p>;
  if (!m) return <p className="text-slate-400 text-sm">Calculando os números...</p>;
  const t = m.totals;
  const money = t.mrrCents >= 0;
  const maxDaily = Math.max(1, ...m.signupsDaily.map((d: any) => Math.max(d.signups, d.active)));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500">Números de hoje ({dm(m.today)}). Administradores e pagamentos de teste ficam de fora.{m.simulatedPayments ? ` ${m.simulatedPayments} pagamento(s) simulado(s) ignorado(s).` : ''}</p>
        <button type="button" onClick={load} disabled={loading} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#30363d] text-xs text-slate-300 hover:text-white">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Atualizar
        </button>
      </div>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Pagantes agora" value={t.paying} tone="text-emerald-300" hint={money ? `MRR ${brl(t.mrrCents)}` : undefined} />
        <Stat label="Teste → assinatura" value={pctTxt(m.conversionOverall.rate)} hint={`${m.conversionOverall.converted} de ${m.conversionOverall.signups} que já terminaram o teste`} />
        <Stat label="Voltaram no dia seguinte" value={pctTxt(m.retention.d1)} hint={`Cadastros dos últimos 90 dias (${m.retention.cohortD1})`} />
        <Stat label="Cancelaram este mês" value={pctTxt(m.churn[m.churn.length - 1]?.rate)} hint={`${m.churn[m.churn.length - 1]?.lost || 0} de ${m.churn[m.churn.length - 1]?.startPaying || 0} pagantes do início do mês`} tone="text-amber-300" />
        <Stat label="Usaram hoje" value={t.activeToday} hint={`${t.active7d} em 7 dias · ${t.active30d} em 30 dias`} />
        <Stat label="Em teste agora" value={t.trialsActive} tone="text-sky-300" hint={`${t.signups7d} cadastros em 7 dias`} />
        {money && <Stat label="Receita do mês" value={brl(t.revenueMonthCents)} hint={`Mês passado: ${brl(t.revenueLastMonthCents)}`} />}
        <Stat label="Cadastros (total)" value={t.users} />
      </section>

      <Panel title="Cadastros e uso por dia" note="Barras verdes: cadastros. Linha azul: pessoas que usaram o app no dia. Últimos 30 dias.">
        <div className="relative h-36 flex items-end gap-[3px]" role="img" aria-label="Cadastros e pessoas ativas por dia">
          {m.signupsDaily.map((d: any) => (
            <div key={d.day} className="flex-1 relative h-full flex items-end group">
              <div className="w-full rounded-t bg-emerald-500/80" style={{ height: `${(d.signups / maxDaily) * 100}%`, minHeight: d.signups ? 2 : 0 }} />
              <div className="absolute left-0 right-0 border-t-2 border-sky-400" style={{ bottom: `${(d.active / maxDaily) * 100}%` }} />
              <span className="pointer-events-none absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black px-1.5 py-0.5 text-[10px] opacity-0 group-hover:opacity-100 z-10">
                {dm(d.day)}: {d.signups} cad. · {d.active} ativos
              </span>
            </div>
          ))}
        </div>
        <div className="flex justify-between text-[10px] text-slate-500 mt-1">
          <span>{dm(m.signupsDaily[0].day)}</span>
          <span>{dm(m.signupsDaily[m.signupsDaily.length - 1].day)}</span>
        </div>
      </Panel>

      <div className="grid lg:grid-cols-2 gap-6">
        <Panel title="Retenção: quantos continuam usando" note="De quem se cadastrou nos últimos 90 dias. 'Semana 2' = usou entre o 7º e o 13º dia; 'Mês 1' = entre o 28º e o 34º.">
          <HBars
            rows={[
              { label: 'Dia seguinte', value: m.retention.d1, extra: `${m.retention.cohortD1} pessoas` },
              { label: 'Semana 2', value: m.retention.d7, extra: `${m.retention.cohortD7} pessoas` },
              { label: 'Mês 1', value: m.retention.d30, extra: `${m.retention.cohortD30} pessoas` },
            ]}
            tone="bg-sky-500"
          />
          {m.retentionWeeks.length > 0 && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-xs tabular-nums">
                <thead className="text-slate-500">
                  <tr><th className="text-left font-normal py-1">Semana do cadastro</th><th className="text-right font-normal">Cadastros</th><th className="text-right font-normal">Dia seg.</th><th className="text-right font-normal">Sem. 2</th><th className="text-right font-normal">Mês 1</th></tr>
                </thead>
                <tbody>
                  {m.retentionWeeks.slice().reverse().map((w: any) => (
                    <tr key={w.week} className="border-t border-[#21262d]">
                      <td className="py-1">{dm(w.week)}</td>
                      <td className="text-right">{w.signups}</td>
                      <td className="text-right">{pctTxt(w.d1)}</td>
                      <td className="text-right">{pctTxt(w.d7)}</td>
                      <td className="text-right">{pctTxt(w.d30)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel title="Teste grátis → assinatura" note="Por semana de cadastro. Só entram semanas cujo teste de 7 dias já terminou (com 3 dias de folga para pagar).">
          {m.conversion.length ? (
            <HBars rows={m.conversion.map((c: any) => ({ label: `Semana ${dm(c.week)}`, value: c.rate, extra: `${c.converted}/${c.signups}` }))} />
          ) : (
            <p className="text-sm text-slate-500">Ainda não há testes terminados.</p>
          )}
        </Panel>

        <Panel title="Cancelamentos por mês" note="Aproximado: pagantes no 1º dia do mês que não renovaram até o fim dele (o mês atual vai até hoje).">
          <HBars rows={m.churn.map((c: any) => ({ label: monthTxt(c.month) + (c.partial ? ' (até hoje)' : ''), value: c.rate, extra: `${c.lost}/${c.startPaying}` }))} tone="bg-amber-500" />
        </Panel>

        <Panel title="De onde vieram" note="Origem do cadastro (links com ?utm_source=, indicação, Ritus ou site de onde a pessoa clicou). Cadastros antigos aparecem como 'Direto / sem origem'.">
          <table className="w-full text-sm tabular-nums">
            <thead className="text-xs text-slate-500">
              <tr><th className="text-left font-normal py-1">Origem</th><th className="text-right font-normal">Cadastros</th><th className="text-right font-normal">Pagaram</th><th className="text-right font-normal">Conversão</th></tr>
            </thead>
            <tbody>
              {m.sources.map((s: any) => (
                <tr key={s.source} className="border-t border-[#21262d]">
                  <td className="py-1.5 pr-2">{s.source}</td>
                  <td className="text-right">{s.signups}</td>
                  <td className="text-right text-emerald-300 font-semibold">{s.paying}</td>
                  <td className="text-right">{pctTxt(s.conversion)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-[11px] text-slate-500 mt-3">Dica: divulgue com links como <code className="text-slate-300">meu-ritmo.netlify.app/vendas?utm_source=instagram</code> para saber qual rede traz mais assinantes.</p>
        </Panel>
      </div>

      <Panel title="O que as pessoas usam" note="Pessoas diferentes que usaram cada recurso nos últimos 7 dias.">
        <HBars rows={m.features.map((f: any) => ({ label: f.feature, value: f.users7d }))} max={0} suffix="" tone="bg-violet-500" />
      </Panel>
    </div>
  );
}

export function ErrorsTab() {
  const [list, setList] = useState<any[] | null>(null);
  const [all, setAll] = useState(false);
  const [open, setOpen] = useState<number | null>(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    const r = await fetch(`/api/erros${all ? '?todos=1' : ''}`);
    const d = await r.json().catch(() => ({}));
    if (r.ok) setList(d.errors || []);
    else setError(d.error || 'Não foi possível carregar.');
  }, [all]);
  useEffect(() => {
    load();
  }, [load]);
  const resolve = async (id: number) => {
    await fetch('/api/erros', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'resolve', id }) });
    load();
  };
  if (error) return <p className="text-rose-300 text-sm">{error}</p>;
  if (!list) return <p className="text-slate-400 text-sm">Carregando...</p>;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-slate-500">Erros iguais são agrupados. Um e-mail chega para o administrador master quando aparece um erro novo (no máximo 1 a cada 6 horas por erro; precisa do RESEND_API_KEY).</p>
        <label className="text-xs text-slate-300 flex items-center gap-2"><input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} className="accent-emerald-500" /> Mostrar resolvidos</label>
      </div>
      {list.length === 0 && (
        <div className="rounded-2xl border border-[#30363d] bg-[#161b22] p-8 text-center text-sm text-slate-400">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" /> Nenhum erro em aberto. Tudo certo por aqui.
        </div>
      )}
      {list.map((e) => (
        <div key={e.id} className={`rounded-2xl border bg-[#161b22] p-4 ${e.resolvedAt ? 'border-[#30363d] opacity-60' : 'border-rose-500/40'}`}>
          <div className="flex items-start gap-3">
            <span className={`mt-0.5 shrink-0 ${e.source === 'servidor' ? 'text-amber-300' : 'text-rose-300'}`}>{e.source === 'servidor' ? <Server className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}</span>
            <div className="flex-1 min-w-0">
              <button type="button" onClick={() => setOpen(open === e.id ? null : e.id)} className="text-left text-sm font-semibold break-words hover:underline">{e.message}</button>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {e.source === 'servidor' ? 'Servidor' : 'App'} · {e.count}× · última vez {new Date(e.lastSeen).toLocaleString('pt-BR')} · primeira {new Date(e.firstSeen).toLocaleDateString('pt-BR')}
                {e.url ? ` · ${e.url}` : ''}
              </p>
              {open === e.id && (
                <div className="mt-2 space-y-2">
                  {e.userAgent && <p className="text-[11px] text-slate-400 break-words">Aparelho: {e.userAgent}</p>}
                  {e.stack && <pre className="text-[11px] text-slate-300 bg-[#0d1117] rounded-lg p-3 overflow-x-auto max-h-64">{e.stack}</pre>}
                </div>
              )}
            </div>
            {!e.resolvedAt && (
              <button type="button" onClick={() => resolve(e.id)} className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#30363d] text-xs text-slate-300 hover:text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5" /> Resolvido
              </button>
            )}
            {e.resolvedAt && <AlertTriangle className="w-4 h-4 text-slate-500 shrink-0" aria-label="resolvido" />}
          </div>
        </div>
      ))}
    </div>
  );
}
