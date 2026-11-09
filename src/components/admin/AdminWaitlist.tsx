import { useCallback, useEffect, useState } from 'react';
import { Copy, Download, Trash2, CheckCircle2, Hourglass } from 'lucide-react';

// Aba "Vagas" do painel: limite de contas da fase de lançamento e lista de espera.
export function WaitlistTab({ canManage }: { canManage: boolean }) {
  const [data, setData] = useState<any | null>(null);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [limitInput, setLimitInput] = useState('');

  const load = useCallback(async () => {
    const r = await fetch('/api/vagas?admin=1');
    const d = await r.json().catch(() => ({}));
    if (r.ok) {
      setData(d);
      setLimitInput(String(d.limit));
    } else setError(d.error || 'Não foi possível carregar.');
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const post = async (body: Record<string, unknown>) => {
    setMsg('');
    const r = await fetch('/api/vagas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      setMsg(d.error || 'Não deu certo.');
      return false;
    }
    await load();
    return true;
  };

  if (error) return <p className="text-rose-300 text-sm">{error}</p>;
  if (!data) return <p className="text-slate-400 text-sm">Carregando...</p>;

  const list: any[] = data.waitlist || [];
  const pct = data.limit > 0 ? Math.min(100, Math.round((data.used / data.limit) * 100)) : 0;
  const pending = list.filter((w) => !w.hasAccount);

  const copyEmails = async () => {
    const text = pending.map((w) => w.email).join(', ');
    try {
      await navigator.clipboard.writeText(text);
      setMsg(`${pending.length} e-mail(s) copiado(s).`);
    } catch {
      setMsg('Não deu para copiar. Use a planilha.');
    }
  };
  const downloadCsv = () => {
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const rows = [['Nome', 'E-mail', 'Origem', 'Entrou em', 'Avisado em', 'Já tem conta']].concat(
      list.map((w) => [w.name, w.email, w.source || '', new Date(w.createdAt).toLocaleString('pt-BR'), w.notifiedAt ? new Date(w.notifiedAt).toLocaleString('pt-BR') : '', w.hasAccount ? 'sim' : 'não'])
    );
    const blob = new Blob(['﻿' + rows.map((r) => r.map(esc).join(';')).join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'lista-de-espera-ritmo.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-[#30363d] bg-[#161b22] p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs text-slate-400">Contas criadas (sem contar administradores)</p>
            <p className="text-3xl font-bold mt-1">
              {data.used}
              <span className="text-base text-slate-400 font-normal"> / {data.limit > 0 ? data.limit : 'sem limite'}</span>
            </p>
          </div>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${data.open ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'}`}>
            {data.open ? (data.left !== null ? `Cadastros abertos · ${data.left} vaga(s)` : 'Cadastros abertos') : 'Vagas esgotadas · lista de espera ativa'}
          </span>
        </div>
        {data.limit > 0 && (
          <div className="mt-3 h-2 rounded-full bg-[#0d1117] overflow-hidden">
            <div className={`h-full ${data.open ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${pct}%` }} />
          </div>
        )}
        {data.isMaster ? (
          <form
            className="mt-4 flex flex-wrap items-center gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              if (await post({ action: 'set_limit', limit: Number(limitInput) })) setMsg('Limite salvo.');
            }}
          >
            <label className="text-xs text-slate-300">Limite de contas</label>
            <input
              type="number"
              min={0}
              value={limitInput}
              onChange={(e) => setLimitInput(e.target.value)}
              className="w-28 bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-1.5 text-sm"
            />
            <button className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-sm font-semibold">Salvar</button>
            <span className="text-[11px] text-slate-500 w-full">0 = sem limite (cadastro aberto para todos). Quem já tem conta continua entrando normalmente.</span>
          </form>
        ) : (
          <p className="mt-3 text-[11px] text-slate-500">Só o administrador master muda o limite.</p>
        )}
        {msg && <p className="mt-2 text-xs text-sky-300">{msg}</p>}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Hourglass className="w-4 h-4 text-amber-300" /> Lista de espera ({list.length})
        </h3>
        <div className="flex gap-2">
          <button onClick={copyEmails} disabled={!pending.length} className="px-3 py-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-xs flex items-center gap-1.5 disabled:opacity-50">
            <Copy className="w-3.5 h-3.5" /> Copiar e-mails
          </button>
          <button onClick={downloadCsv} disabled={!list.length} className="px-3 py-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-xs flex items-center gap-1.5 disabled:opacity-50">
            <Download className="w-3.5 h-3.5" /> Planilha
          </button>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="rounded-2xl border border-[#30363d] bg-[#161b22] p-8 text-center text-sm text-slate-400">Ninguém na lista de espera ainda.</div>
      ) : (
        <div className="space-y-2">
          {list.map((w) => (
            <div key={w.id} className="rounded-xl border border-[#30363d] bg-[#161b22] p-3 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{w.name || '(sem nome)'}</p>
                <p className="text-xs text-slate-400 truncate">{w.email}</p>
                <p className="text-[11px] text-slate-500">
                  Entrou em {new Date(w.createdAt).toLocaleString('pt-BR')}
                  {w.source ? ` · origem ${w.source}` : ''}
                  {w.hasAccount ? ' · já criou conta' : ''}
                </p>
              </div>
              {canManage && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => post({ action: 'notified', id: w.id, value: !w.notifiedAt })}
                    className={`px-2.5 py-1 rounded-lg text-xs flex items-center gap-1 ${w.notifiedAt ? 'bg-emerald-500/15 text-emerald-300' : 'bg-[#21262d] text-slate-300 hover:bg-[#30363d]'}`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> {w.notifiedAt ? 'Avisado' : 'Marcar avisado'}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Tirar ${w.email} da lista de espera?`)) post({ action: 'remove', id: w.id });
                    }}
                    aria-label="Remover"
                    className="p-1.5 rounded-lg text-rose-300 hover:bg-rose-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
