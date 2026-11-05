import React, { useCallback, useEffect, useState } from 'react';
import { CalendarClock, CheckCircle2, AlertCircle, Wallet, KeyRound, FileText } from 'lucide-react';
import { PIX_TYPES, PixKeyType, formatPix, validatePix } from '../lib/pix.js';
import { PAYOUT_RULE_TEXT, cycleStatus, payoutCycle, payoutDatesText, shortDateBR } from '../lib/payout-schedule.js';
import { MIN_PAYOUT_CENTS, brl } from '../lib/commission-plan.js';
import { parseBRLToCents } from '../lib/money.js';

const WITHDRAW_LABEL: Record<string, string> = { pending: 'Aguardando pagamento', approved: 'Aprovado', paid: 'Pix feito', rejected: 'Recusado' };

const WITHDRAW_TONE: Record<string, string> = {
  pending: 'text-amber-300',
  approved: 'text-sky-300',
  paid: 'text-emerald-300',
  rejected: 'text-rose-300',
};

interface AffiliateInfo {
  stats: { availableBalanceCents: number };
  withdrawals: { id: number; amountCents: number; status: string; requestedAt?: string; createdAt?: string; processedAt?: string | null; receiptUrl?: string | null; notes?: string | null }[];
  pixKey: string;
  pixKeyType: PixKeyType;
}

export const AffiliatePayout: React.FC = () => {
  const [info, setInfo] = useState<AffiliateInfo | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [editingPix, setEditingPix] = useState(false);
  const [pixType, setPixType] = useState<PixKeyType>('cpf');
  const [pixValue, setPixValue] = useState('');
  const [amount, setAmount] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/affiliates');
      if (!res.ok) return;
      const data = await res.json();
      setInfo({ stats: data.stats, withdrawals: data.withdrawals || [], pixKey: data.pixKey || '', pixKeyType: (data.pixKeyType || 'cpf') as PixKeyType });
      setPixType((data.pixKeyType || 'cpf') as PixKeyType);
      setEditingPix(!data.pixKey);
    } catch {
      /* mantém a tela sem dados */
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(() => setNow(new Date()), 60_000); // atualiza o contador a cada minuto
    return () => clearInterval(t);
  }, [load]);

  const status = cycleStatus(now);
  const balance = info?.stats.availableBalanceCents ?? 0;
  const hasPix = Boolean(info?.pixKey);
  const typed = amount ? parseBRLToCents(amount) : balance;
  const amountCents = typed ?? 0;
  // mensagens na hora, antes de pedir: valor inválido, acima do saldo liberado ou abaixo do mínimo
  const amountError = !amount
    ? ''
    : typed === null
      ? 'Valor inválido. Use só números, por exemplo 50 ou 50,00.'
      : typed > balance
        ? `O valor de ${brl(typed)} ultrapassou o seu saldo liberado de ${brl(balance)}. Você só pode sacar até ${brl(balance)}.`
        : typed < MIN_PAYOUT_CENTS
          ? `O valor mínimo para saque é ${brl(MIN_PAYOUT_CENTS)}.`
          : '';
  const canRequest = hasPix && balance >= MIN_PAYOUT_CENTS && !amountError && amountCents >= MIN_PAYOUT_CENTS && amountCents <= balance;

  const post = async (body: Record<string, unknown>) => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch('/api/affiliates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const json = await res.json().catch(() => ({}));
      setMsg({ ok: res.ok, text: json.message || json.error || (res.ok ? 'Pronto.' : 'Não foi possível concluir.') });
      if (res.ok) await load();
      return res.ok;
    } finally {
      setBusy(false);
    }
  };

  const savePix = async () => {
    const check = validatePix(pixValue, pixType);
    if (!check.ok) {
      setMsg({ ok: false, text: check.error || 'Chave inválida.' });
      return;
    }
    if (await post({ action: 'update_pix', pixKey: pixValue, pixKeyType: pixType })) {
      setPixValue('');
      setEditingPix(false);
    }
  };

  const request = async () => {
    if (amountCents > balance) {
      setMsg({ ok: false, text: `O valor ultrapassou o seu saldo liberado de ${brl(balance)}.` });
      return;
    }
    if (await post({ action: 'request_withdrawal', amountCents })) setAmount('');
  };

  const field = 'bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-[#f0f6fc] w-full focus:outline-none focus:border-emerald-500';

  return (
    <div className="space-y-6">
      {/* Regra e contador */}
      <div className={`rounded-2xl border p-5 ${status.lastDay ? 'border-amber-500/50 bg-amber-500/10' : 'border-[#30363d] bg-[#161b22]'}`}>
        <div className="flex items-start gap-3">
          <CalendarClock className={`w-6 h-6 shrink-0 mt-0.5 ${status.lastDay ? 'text-amber-300' : 'text-emerald-400'}`} />
          <div>
            <h3 className="font-bold text-[#f0f6fc]">Como e quando você recebe</h3>
            <p className="text-sm text-[#c9d1d9] mt-1">{PAYOUT_RULE_TEXT}</p>
            <p className="text-sm mt-2">
              <strong className={status.lastDay ? 'text-amber-300' : 'text-emerald-300'}>Prazo desta semana: faltam {status.countdown}.</strong>{' '}
              <span className="text-[#8b949e]">Pedidos feitos agora serão pagos na {payoutDatesText(status)}.</span>
            </p>
            <p className="text-xs text-[#8b949e] mt-2">Pediu depois de quarta, 23:59? Sem problema: o pedido entra no ciclo da semana seguinte.</p>
          </div>
        </div>
      </div>

      {/* Chave Pix */}
      <div className="rounded-2xl border border-[#30363d] bg-[#161b22] p-5">
        <div className="flex items-center gap-2 mb-3">
          <KeyRound className="w-5 h-5 text-emerald-400" />
          <h3 className="font-bold text-[#f0f6fc]">Sua chave Pix para receber</h3>
        </div>
        {info && hasPix && !editingPix ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs text-[#8b949e]">{PIX_TYPES.find((t) => t.value === info.pixKeyType)?.label}</div>
              <div className="font-mono text-[#f0f6fc]">{formatPix(info.pixKey, info.pixKeyType)}</div>
              <p className="text-[11px] text-[#8b949e] mt-1">Confira se está certa: o pagamento é enviado para esta chave.</p>
            </div>
            <button className="text-sm text-emerald-400 hover:underline" onClick={() => setEditingPix(true)}>Trocar chave</button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid sm:grid-cols-3 gap-3">
              <label className="text-xs text-[#8b949e]">Tipo da chave
                <select className={field} value={pixType} onChange={(e) => setPixType(e.target.value as PixKeyType)}>
                  {PIX_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </label>
              <label className="text-xs text-[#8b949e] sm:col-span-2">Chave Pix
                <input className={field} value={pixValue} onChange={(e) => setPixValue(e.target.value)} placeholder={PIX_TYPES.find((t) => t.value === pixType)?.placeholder} autoComplete="off" />
              </label>
            </div>
            <div className="flex justify-end gap-2">
              {hasPix && <button className="px-4 py-2 rounded-lg border border-[#30363d] text-sm text-[#c9d1d9]" onClick={() => setEditingPix(false)}>Cancelar</button>}
              <button className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm disabled:opacity-50" onClick={savePix} disabled={busy || !pixValue}>Salvar chave Pix</button>
            </div>
          </div>
        )}
      </div>

      {/* Pedir saque */}
      <div className="rounded-2xl border border-[#30363d] bg-[#161b22] p-5">
        <div className="flex items-center gap-2 mb-3">
          <Wallet className="w-5 h-5 text-emerald-400" />
          <h3 className="font-bold text-[#f0f6fc]">Solicitar saque</h3>
        </div>
        <p className="text-sm text-[#c9d1d9]">Saldo disponível: <strong className="text-emerald-300">{brl(balance)}</strong> <span className="text-[#8b949e]">· mínimo para sacar {brl(MIN_PAYOUT_CENTS)}</span></p>
        {!hasPix && <p className="text-xs text-amber-300 mt-2">Cadastre sua chave Pix acima para poder solicitar o saque.</p>}
        {hasPix && balance < MIN_PAYOUT_CENTS && <p className="text-xs text-[#8b949e] mt-2">Seu saldo ainda não chegou ao mínimo. As comissões aprovadas somam aqui automaticamente.</p>}
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <label className="text-xs text-[#8b949e] w-40">Valor (R$)
            <input className={`${field} ${amountError ? 'border-rose-500 focus:border-rose-500' : ''}`} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={(balance / 100).toFixed(2).replace('.', ',')} aria-invalid={Boolean(amountError)} aria-describedby="saque-erro" />
          </label>
          {balance >= MIN_PAYOUT_CENTS && <button type="button" className="text-xs text-emerald-400 hover:underline pb-2.5" onClick={() => setAmount((balance / 100).toFixed(2).replace('.', ','))}>Usar todo o saldo</button>}
          <button className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm disabled:opacity-40" onClick={request} disabled={busy || !canRequest}>
            Solicitar saque
          </button>
        </div>
        {amountError && <p id="saque-erro" role="alert" className="text-xs text-rose-300 mt-2 flex items-start gap-1.5"><AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />{amountError}</p>}
        <p className="text-[11px] text-[#8b949e] mt-2">Deixe o valor em branco para sacar todo o saldo. Pedido feito agora: pagamento na {payoutDatesText(payoutCycle(now))}.</p>
      </div>

      {msg && (
        <div role="status" className={`flex items-start gap-2 text-sm rounded-lg p-3 border ${msg.ok ? 'text-emerald-300 bg-emerald-950/40 border-emerald-800/60' : 'text-rose-300 bg-rose-950/40 border-rose-800/60'}`}>
          {msg.ok ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
          {msg.text}
        </div>
      )}

      {/* Histórico */}
      <div>
        <h3 className="font-bold text-[#f0f6fc] mb-2">Seus pedidos de saque</h3>
        <div className="overflow-x-auto border border-[#30363d] rounded-2xl">
          <table className="w-full text-sm">
            <thead className="bg-[#161b22] text-[#8b949e]">
              <tr><th className="px-4 py-3 text-left">Pedido</th><th className="px-4 py-3 text-left">Valor</th><th className="px-4 py-3 text-left">Pagamento</th><th className="px-4 py-3 text-left">Situação</th><th className="px-4 py-3 text-left">Comprovante</th></tr>
            </thead>
            <tbody>
              {(!info || info.withdrawals.length === 0) && <tr><td colSpan={5} className="px-4 py-6 text-center text-[#6e7681]">Você ainda não pediu nenhum saque.</td></tr>}
              {info?.withdrawals.map((w) => {
                const at = new Date(w.requestedAt || w.createdAt || Date.now());
                const c = payoutCycle(at);
                return (
                  <tr key={w.id} className="border-t border-[#30363d]">
                    <td className="px-4 py-3 text-[#8b949e]">{at.toLocaleDateString('pt-BR')}</td>
                    <td className="px-4 py-3">{brl(w.amountCents)}</td>
                    <td className="px-4 py-3 text-[#8b949e]">{w.status === 'rejected' ? '—' : w.status === 'paid' && w.processedAt ? `Pago em ${new Date(w.processedAt).toLocaleDateString('pt-BR')}` : `Previsto: ${shortDateBR(c.thursday)} ou ${shortDateBR(c.friday)}`}</td>
                    <td className={`px-4 py-3 font-semibold ${WITHDRAW_TONE[w.status] || ''}`}>{WITHDRAW_LABEL[w.status] || w.status}{w.status === 'rejected' && w.notes ? <div className="text-[11px] font-normal text-[#8b949e]">{w.notes}</div> : null}</td>
                    <td className="px-4 py-3">{w.receiptUrl ? <a href={w.receiptUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-emerald-400 hover:underline"><FileText className="w-4 h-4" /> Ver</a> : <span className="text-[#6e7681]">{w.status === 'paid' ? 'em breve' : '—'}</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
