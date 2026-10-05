import React, { useState } from 'react';
import {
  Share2,
  Copy,
  Check,
  Shield,
  Sliders,
} from 'lucide-react';
import { AffiliateStats, AffiliateCommissionItem } from '../lib/types.js';

interface TabAffiliatesProps {
  affiliateStats: AffiliateStats;
  commissions: AffiliateCommissionItem[];
}

export const TabAffiliates: React.FC<TabAffiliatesProps> = ({
  affiliateStats,
  commissions,
}) => {
  const [copied, setCopied] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [simulatedGross, setSimulatedGross] = useState('97,00');
  const [webhookResult, setWebhookResult] = useState<any>(null);

  const fullShareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/?ref=${affiliateStats.referralCode}`
      : `https://ritmo.netlify.app/?ref=${affiliateStats.referralCode}`;

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(fullShareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSimulateWebhook = async () => {
    try {
      const grossCents = Math.round(parseFloat(simulatedGross.replace(',', '.')) * 100);
      const res = await fetch('/api/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'process_billing_webhook',
          eventId: 'evt_' + Math.random().toString(36).substring(2, 9),
          eventType: 'payment_confirmed',
          orderReference: 'ORD-' + Math.floor(100000 + Math.random() * 900000),
          customerUserId: 999,
          affiliateUserId: 1,
          grossAmountCents: grossCents,
          netAmountCents: grossCents,
        }),
      });
      const data = await res.json();
      setWebhookResult(data);
    } catch {}
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-br from-[#161b22] via-[#1c2129] to-[#0d1117] border border-[#30363d] p-6 sm:p-8 rounded-2xl relative overflow-hidden">
        <div className="max-w-2xl space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-800/40 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
            <Share2 className="w-3.5 h-3.5" />
            Programa de Parceiros & Indicações
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#f0f6fc]">
            Indique o Ritmo e Ganhe 60% Recorrente
          </h1>
          <p className="text-xs sm:text-sm text-[#8b949e]">
            Compartilhe sua rotina de foco. Para cada assinatura elegível confirmada através do seu link exclusivo, receba 60% de comissão recorrente (R$ 23,94 por assinatura de R$ 39,90) sobre o valor líquido recebido enquanto a assinatura estiver ativa.
          </p>
        </div>

        {/* Affiliate Link Share Box */}
        <div className="mt-6 pt-6 border-t border-[#30363d] flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-xl px-3.5 py-2.5 text-xs text-[#f0f6fc] font-mono flex items-center justify-between overflow-hidden">
            <span className="truncate">{fullShareUrl}</span>
            <span className="text-[10px] text-[#6e7681] ml-2 shrink-0">
              Código: <strong>{affiliateStats.referralCode}</strong>
            </span>
          </div>
          <button
            onClick={handleCopyLink}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-white" /> Copiado!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" /> Copiar Link de Indicação
              </>
            )}
          </button>
        </div>
      </div>

      {/* 2. Key Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4">
          <span className="text-[11px] font-semibold text-[#8b949e] uppercase block">
            Cliques no Link
          </span>
          <span className="text-2xl font-black text-[#f0f6fc] block mt-1">
            {affiliateStats.totalClicks}
          </span>
          <span className="text-[10px] text-[#6e7681]">Origens válidas</span>
        </div>

        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4">
          <span className="text-[11px] font-semibold text-[#8b949e] uppercase block">
            Cadastros Atribuídos
          </span>
          <span className="text-2xl font-black text-emerald-400 block mt-1">
            {affiliateStats.totalReferrals}
          </span>
          <span className="text-[10px] text-[#6e7681]">Último link válido</span>
        </div>

        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4">
          <span className="text-[11px] font-semibold text-[#8b949e] uppercase block">
            Assinaturas Elegíveis
          </span>
          <span className="text-2xl font-black text-teal-400 block mt-1">
            {affiliateStats.activeSubscriptions}
          </span>
          <span className="text-[10px] text-[#6e7681]">Recorrência ativa</span>
        </div>

        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4">
          <span className="text-[11px] font-semibold text-[#8b949e] uppercase block">
            Saldo Disponível
          </span>
          <span className="text-2xl font-black text-amber-400 block mt-1">
            {(affiliateStats.availableBalanceCents / 100).toLocaleString('pt-BR', {
              style: 'currency',
              currency: 'BRL',
            })}
          </span>
          <span className="text-[10px] text-[#6e7681]">Saque mínimo: R$ 100,00</span>
        </div>
      </div>

      {/* 3. Financial Commission Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-[#8b949e] block font-semibold">Comissões Pendentes</span>
            <span className="text-xl font-bold text-[#f0f6fc] block mt-0.5">
              {(affiliateStats.pendingCommissionCents / 100).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </span>
            <span className="text-[10px] text-[#6e7681]">Aguardando janela de compensação</span>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-amber-950/40 text-amber-400 text-xs font-mono">
            60%
          </span>
        </div>

        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-[#8b949e] block font-semibold">Comissões Aprovadas</span>
            <span className="text-xl font-bold text-emerald-400 block mt-0.5">
              {(affiliateStats.approvedCommissionCents / 100).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </span>
            <span className="text-[10px] text-[#6e7681]">Prontas para repasse mensal</span>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-950/40 text-emerald-400 text-xs font-mono">
            Aprovado
          </span>
        </div>

        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 flex items-center justify-between">
          <div>
            <span className="text-xs text-[#8b949e] block font-semibold">Total Já Pago</span>
            <span className="text-xl font-bold text-[#f0f6fc] block mt-0.5">
              {(affiliateStats.paidCommissionCents / 100).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </span>
            <span className="text-[10px] text-[#6e7681]">Transferido via PIX</span>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-[#21262d] text-[#8b949e] text-xs font-mono">
            Histórico
          </span>
        </div>
      </div>

      {/* 4. Commission History Table */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-[#30363d] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-[#f0f6fc]">Histórico Detalhado de Comissões</h3>
            <p className="text-xs text-[#8b949e]">
              Transparência completa sobre cada cobrança, base de cálculo e status.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#30363d] bg-[#0d1117] text-[#8b949e]">
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4">Ref. Pedido</th>
                <th className="py-3 px-4">Base de Cálculo</th>
                <th className="py-3 px-4 text-center">Taxa</th>
                <th className="py-3 px-4 text-right">Comissão</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#30363d]">
              {commissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-[#6e7681]">
                    Nenhuma comissão registrada ainda. Compartilhe seu link exclusivo para gerar as primeiras indicações!
                  </td>
                </tr>
              ) : (
                commissions.map((c) => (
                  <tr key={c.id} className="hover:bg-[#1c2128]/50">
                    <td className="py-3 px-4 font-mono text-[#8b949e]">
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString('pt-BR') : '-'}
                    </td>
                    <td className="py-3 px-4 font-mono text-[#f0f6fc]">{c.orderReference}</td>
                    <td className="py-3 px-4 text-[#8b949e]">
                      {(c.baseAmountCents / 100).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </td>
                    <td className="py-3 px-4 text-center text-emerald-400 font-mono font-bold">
                      {c.commissionRatePercent}%
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-[#f0f6fc]">
                      {(c.commissionCents / 100).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          c.status === 'approved'
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                            : c.status === 'paid'
                            ? 'bg-teal-950/60 text-teal-400 border border-teal-800/40'
                            : c.status === 'refunded' || c.status === 'reversed'
                            ? 'bg-rose-950/60 text-rose-400 border border-rose-800/40'
                            : 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                        }`}
                      >
                        {c.status === 'approved'
                          ? 'Aprovada'
                          : c.status === 'paid'
                          ? 'Paga'
                          : c.status === 'refunded'
                          ? 'Reembolsada'
                          : c.status === 'reversed'
                          ? 'Estornada'
                          : 'Pendente'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Terms & Program Rules Card */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 space-y-3">
        <h3 className="text-sm font-bold text-[#f0f6fc] flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-400" />
          Termos e Condições do Programa de Afiliados Ritmo
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#8b949e]">
          <div className="space-y-1.5">
            <h4 className="font-semibold text-[#f0f6fc]">Regra de Comissão Recorrente</h4>
            <p>
              A comissão é fixada em <strong>60% do valor líquido efetivamente recebido</strong> (R$ 23,94 por assinatura de R$ 39,90/mês) em cada cobrança mensal ou anual. Não há promessa de ganhos ou renda garantida.
            </p>
          </div>

          <div className="space-y-1.5">
            <h4 className="font-semibold text-[#f0f6fc]">Janela e Modelo de Atribuição</h4>
            <p>
              Atribuição por <strong>último link válido antes do cadastro</strong> com janela de 60 dias. Autoindicação é estritamente proibida e bloqueada pelo sistema.
            </p>
          </div>

          <div className="space-y-1.5">
            <h4 className="font-semibold text-[#f0f6fc]">Cancelamentos e Estornos</h4>
            <p>
              Pagamentos cancelados, reembolsados ou com chargeback não geram comissão. Se já contabilizada, a comissão é ajustada de forma transparente com histórico preservado.
            </p>
          </div>

          <div className="space-y-1.5">
            <h4 className="font-semibold text-[#f0f6fc]">Repasses e Condições de Saque</h4>
            <p>
              Repasses manuais mensais via PIX para saldos mínimos acumulados a partir de <strong>R$ 100,00</strong>.
            </p>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={() => setShowAdmin(!showAdmin)}
            className="text-xs text-[#6e7681] hover:text-[#f0f6fc] flex items-center gap-1.5 transition-colors"
          >
            <Sliders className="w-3.5 h-3.5" />
            {showAdmin ? 'Ocultar Ferramentas de Administração' : 'Painel de Administração & Webhooks'}
          </button>
        </div>

        {/* Administration & Webhook Simulator Drawer */}
        {showAdmin && (
          <div className="mt-4 p-4 rounded-xl bg-[#0d1117] border border-[#30363d] space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#f0f6fc]">
                Simulador de Eventos de Cobrança (Idempotente)
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">Backend Protegido</span>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs text-[#8b949e]">Valor da Assinatura:</span>
              <input
                type="text"
                value={simulatedGross}
                onChange={(e) => setSimulatedGross(e.target.value)}
                className="w-24 bg-[#161b22] border border-[#30363d] rounded-lg px-2.5 py-1 text-xs text-[#f0f6fc] font-mono"
              />
              <button
                type="button"
                onClick={handleSimulateWebhook}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs"
              >
                Disparar Webhook de Pagamento (60%)
              </button>
            </div>

            {webhookResult && (
              <pre className="p-3 bg-[#161b22] rounded-lg text-[11px] font-mono text-emerald-300 overflow-x-auto">
                {JSON.stringify(webhookResult, null, 2)}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
