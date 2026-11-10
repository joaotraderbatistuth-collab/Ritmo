import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Coins, AlertTriangle, Info } from 'lucide-react';

// Aba "Créditos" do painel (só o master): contagem estimada dos créditos da Netlify.
const fmt = (n: number | null | undefined, d = 0) => (n === null || n === undefined ? '—' : n.toLocaleString('pt-BR', { maximumFractionDigits: d }));
// datas do período de cobrança vêm em UTC (meia-noite): mostrar em UTC para não virar o dia anterior
const date = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '—');
const dateTime = (iso?: string | null) => (iso ? new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '—');

export function CreditsTab() {
  const [data, setData] = useState<any | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState('');
  const [msg, setMsg] = useState('');

  const load = useCallback(async (refresh = false) => {
    setLoading(true);
    setError('');
    try {
      const r = await fetch(`/api/creditos${refresh ? '?refresh=1' : ''}`);
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || 'Não foi possível carregar.');
      setData(d);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const saveAnchor = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    const r = await fetch('/api/creditos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'set_anchor', balance }) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return setMsg(d.error || 'Não deu certo.');
    setBalance('');
    setMsg('Saldo anotado. A conta agora parte dele.');
    load();
  };

  if (error) return <p className="text-rose-300 text-sm">{error}</p>;
  if (!data) return <p className="text-slate-400 text-sm">Carregando...</p>;

  const n = data.netlify;
  const color = { ok: 'text-emerald-300', warn: 'text-amber-300', danger: 'text-rose-300', unknown: 'text-slate-200' }[data.level as string];
  const bar = { ok: 'bg-emerald-500', warn: 'bg-amber-500', danger: 'bg-rose-500', unknown: 'bg-slate-500' }[data.level as string];
  const total = data.anchor ? Math.max(data.anchor.balance, n.planCredits || 0) : n.planCredits;
  const pct = data.remaining !== null && total ? Math.max(0, Math.min(100, Math.round((data.remaining / total) * 100))) : null;
  const maxDay = Math.max(1, ...data.daily.map((d: any) => d.hours));

  return (
    <div className="space-y-5">
      {/* saldo */}
      <div className="rounded-2xl border border-[#30363d] bg-[#161b22] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs text-slate-400 flex items-center gap-1.5">
              <Coins className="w-3.5 h-3.5" /> Créditos restantes (estimativa)
            </p>
            <p className={`text-4xl font-bold mt-1 ${color}`}>
              {fmt(data.remaining)}
              {total ? <span className="text-base text-slate-400 font-normal"> / {fmt(total)}</span> : null}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              {data.basis === 'anchor'
                ? `Parte do saldo que você anotou (${fmt(data.anchor.balance)} em ${dateTime(data.anchor.at)}) menos o gasto desde então.`
                : data.basis === 'plan'
                  ? 'Créditos do plano menos o gasto contado no período.'
                  : 'Anote o saldo que aparece na Netlify (abaixo) para ver quanto resta.'}
            </p>
          </div>
          <button onClick={() => load(true)} disabled={loading} className="px-3 py-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-xs flex items-center gap-1.5 disabled:opacity-50">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Atualizar
          </button>
        </div>
        {pct !== null && (
          <div className="mt-3 h-2 rounded-full bg-[#0d1117] overflow-hidden">
            <div className={`h-full ${bar}`} style={{ width: `${pct}%` }} />
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <Stat label="Gasto por dia (média 7 dias)" value={fmt(data.perDay, 1)} />
          <Stat label="Dura mais" value={data.daysLeft === null ? '—' : `${data.daysLeft} dia(s)`} />
          <Stat label="Período começou" value={date(data.periodStart)} />
          <Stat label="Renova em" value={n.connected ? date(n.periodEnd) : '—'} />
        </div>
        {n.connected && n.usageExceeded && (
          <p className="mt-3 text-xs text-rose-300 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" /> A Netlify marcou uso excedido na conta. Confira o painel da Netlify.
          </p>
        )}
        {n.connected && n.autoTopup !== null && (
          <p className="mt-2 text-[11px] text-slate-400">
            Recarga automática: {n.autoTopup ? `ligada${n.topupAmount ? ` (${fmt(n.topupAmount)} créditos)` : ''}` : 'desligada — se acabar, o site sai do ar até o próximo período'}
          </p>
        )}
      </div>

      {/* onde gastou */}
      <div className="rounded-2xl border border-[#30363d] bg-[#161b22] p-5">
        <h3 className="font-semibold text-sm mb-3">Gasto no período</h3>
        <Row label={`Banco de dados acordado · ${fmt(data.usage.dbHours)} h × ${data.prices.dbHour}`} value={data.cost.database} />
        <Row label={`Publicações · ${fmt(data.usage.deploys)} × ${data.prices.deploy}`} value={data.cost.deploys} muted={!n.connected} />
        <Row label={`Tráfego · ${fmt(data.usage.bandwidthGB, 2)} GB × ${data.prices.bandwidthGB}`} value={data.cost.bandwidth} muted={!n.connected} />
        <div className="flex justify-between border-t border-[#30363d] mt-2 pt-2 text-sm font-semibold">
          <span>Total contado</span>
          <span>{fmt(data.cost.total, 1)}</span>
        </div>
        <p className="text-[11px] text-slate-500 mt-2 flex gap-1.5">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          Processamento das funções e número de acessos não entram (a Netlify não informa), então o gasto real costuma ser um pouco maior. Cada hora em que o banco foi usado conta como hora inteira.
        </p>
      </div>

      {/* gráfico */}
      {data.daily.length > 0 && (
        <div className="rounded-2xl border border-[#30363d] bg-[#161b22] p-5">
          <h3 className="font-semibold text-sm mb-3">Horas de banco acordado por dia</h3>
          <div className="flex items-end gap-1 h-28">
            {data.daily.map((d: any) => (
              <div key={d.day} className="flex-1 min-w-0 flex flex-col items-center justify-end h-full" title={`${date(d.day + 'T12:00:00Z')}: ${d.hours} h · ${d.credits} créditos`}>
                <div className="w-full rounded-t bg-sky-500/70" style={{ height: `${Math.max(4, (d.hours / maxDay) * 100)}%` }} />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 mt-1">
            <span>{date(data.daily[0].day + 'T12:00:00Z')}</span>
            <span>{date(data.daily[data.daily.length - 1].day + 'T12:00:00Z')}</span>
          </div>
        </div>
      )}

      {/* anotar saldo */}
      <form onSubmit={saveAnchor} className="rounded-2xl border border-[#30363d] bg-[#161b22] p-5 space-y-2">
        <h3 className="font-semibold text-sm">Anotar o saldo da Netlify</h3>
        <p className="text-[11px] text-slate-400">Abra app.netlify.com → sua equipe → Usage, veja os créditos disponíveis e digite aqui. Daí em diante a conta parte desse número (mais exata).</p>
        <div className="flex flex-wrap gap-2">
          <input
            inputMode="decimal"
            placeholder="Ex.: 820"
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            className="w-32 bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-1.5 text-sm"
          />
          <button disabled={!balance.trim()} className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm font-semibold disabled:opacity-50">
            Salvar
          </button>
        </div>
        {msg && <p className="text-xs text-sky-300">{msg}</p>}
      </form>

      {/* avisos da Netlify / conexão */}
      {n.connected ? (
        n.alerts.length > 0 && (
          <div className="rounded-2xl border border-[#30363d] bg-[#161b22] p-5">
            <h3 className="font-semibold text-sm mb-2">Avisos da Netlify</h3>
            {n.alerts.map((a: any, i: number) => (
              <p key={i} className="text-xs text-slate-300 py-1 border-b border-[#21262d] last:border-0">
                <span className="text-slate-500">{dateTime(a.at)}</span> · {a.text}
              </p>
            ))}
          </div>
        )
      ) : (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-5 text-xs text-amber-100/90 space-y-1.5">
          <p className="font-semibold text-amber-300 text-sm">
            {n.error === 'bad_token' ? 'A chave da Netlify não funcionou' : 'Ligar os dados da Netlify (opcional)'}
          </p>
          <p>Sem a chave, a aba conta só as horas de banco. Com ela, entram também plano, publicações, tráfego e avisos de saldo:</p>
          <p>1. Netlify → seu avatar → User settings → Applications → Personal access tokens → New access token.</p>
          <p>2. No site meu-ritmo → Site configuration → Environment variables → Add: nome <b>NETLIFY_API_TOKEN</b>, valor = a chave.</p>
          <p>3. Faça uma nova publicação (ou me peça) para a chave valer.</p>
        </div>
      )}
      <p className="text-[10px] text-slate-600">Conferido em {dateTime(data.checkedAt)}. Dados da Netlify ficam 10 min guardados; "Atualizar" busca de novo.</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#0d1117] border border-[#21262d] p-3 min-w-0">
      <p className="text-[10px] text-slate-500">{label}</p>
      <p className="text-sm font-semibold mt-0.5 truncate">{value}</p>
    </div>
  );
}

function Row({ label, value, muted }: { label: string; value: number; muted?: boolean }) {
  return (
    <div className={`flex justify-between gap-3 text-xs py-1 ${muted ? 'text-slate-500' : 'text-slate-300'}`}>
      <span className="min-w-0">{label}</span>
      <span className="shrink-0">{muted ? 'sem chave' : value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}</span>
    </div>
  );
}
