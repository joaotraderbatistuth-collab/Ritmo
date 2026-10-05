import { createFileRoute, Link } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import {
  Flame,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  CreditCard,
  QrCode,
  Copy,
  Check,
  Clock,
  ArrowRight,
  AlertCircle,
  Receipt,
  Tag,
  Lock,
} from 'lucide-react';
import { PaymentItem } from '../lib/types.js';

export const Route = createFileRoute('/checkout')({
  component: CheckoutPage,
});

function CheckoutPage() {
  const [subData, setSubData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit_card'>('pix');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discountPercent?: number;
    discountCents?: number;
  } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);

  // Order state
  const [currentOrder, setCurrentOrder] = useState<PaymentItem | null>(null);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [confirmingOrder, setConfirmingOrder] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Card form state
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  useEffect(() => {
    fetchSubscriptionData();
  }, []);

  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/checkout');
      const data = await res.json();
      setSubData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setValidatingCoupon(true);
    setCouponError('');
    try {
      const res = await fetch(`/api/checkout?action=validate_coupon&code=${encodeURIComponent(couponCode.trim())}`);
      const data = await res.json();
      if (data.valid) {
        setAppliedCoupon(data);
        // If an order was already generated, reset it so new total applies
        setCurrentOrder(null);
      } else {
        setCouponError(data.error || 'Cupom inválido.');
        setAppliedCoupon(null);
      }
    } catch {
      setCouponError('Erro ao validar cupom.');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const calculateFinalPriceCents = () => {
    const base = 3990;
    if (!appliedCoupon) return base;
    if (appliedCoupon.discountPercent && appliedCoupon.discountPercent > 0) {
      const disc = Math.round((base * appliedCoupon.discountPercent) / 100);
      return Math.max(100, base - disc);
    }
    if (appliedCoupon.discountCents && appliedCoupon.discountCents > 0) {
      return Math.max(100, base - appliedCoupon.discountCents);
    }
    return base;
  };

  const finalAmountCents = calculateFinalPriceCents();

  const handleGeneratePixOrder = async () => {
    setCreatingOrder(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_order',
          paymentMethod: 'pix',
          couponCode: appliedCoupon ? appliedCoupon.code : undefined,
        }),
      });
      const data = await res.json();
      if (data.order) {
        setCurrentOrder(data.order);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCreatingOrder(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!currentOrder) return;
    setConfirmingOrder(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'confirm_payment',
          orderReference: currentOrder.orderReference,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage(data.message || 'Assinatura PRO ativada com sucesso!');
        await fetchSubscriptionData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setConfirmingOrder(false);
    }
  };

  const handleProcessCardPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingOrder(true);
    try {
      // 1. Create order
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_order',
          paymentMethod: 'credit_card',
          couponCode: appliedCoupon ? appliedCoupon.code : undefined,
        }),
      });
      const data = await res.json();
      if (data.order) {
        // 2. Confirm order immediately (gateway processing simulation)
        const confirmRes = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'confirm_payment',
            orderReference: data.order.orderReference,
          }),
        });
        const confirmData = await confirmRes.json();
        if (confirmData.success) {
          setSuccessMessage('Pagamento no cartão aprovado! Sua assinatura Ritmo PRO está ativa.');
          await fetchSubscriptionData();
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCreatingOrder(false);
    }
  };

  const copyPixCode = () => {
    if (!currentOrder?.pixCopiaECola) return;
    navigator.clipboard.writeText(currentOrder.pixCopiaECola);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#f0f6fc]">
      {/* Header */}
      <header className="border-b border-[#30363d] bg-[#161b22]/90 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-900/30">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white via-emerald-100 to-emerald-400 bg-clip-text text-transparent">
                Ritmo
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Checkout & Assinatura
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/tutorial"
              className="text-xs sm:text-sm font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              Tutorial & Recursos
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              Voltar ao Painel
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        {/* Status Alert Banner */}
        {subData && (
          <div className="mb-8 p-4 sm:p-5 rounded-2xl border bg-[#161b22] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-[#30363d]">
            <div className="flex items-center gap-3.5">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  subData.subscriptionStatus === 'active'
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : subData.isExpired
                    ? 'bg-rose-500/15 text-rose-400'
                    : 'bg-amber-500/15 text-amber-400'
                }`}
              >
                {subData.subscriptionStatus === 'active' ? (
                  <CheckCircle2 className="w-6 h-6" />
                ) : subData.isExpired ? (
                  <AlertCircle className="w-6 h-6" />
                ) : (
                  <Clock className="w-6 h-6" />
                )}
              </div>
              <div>
                <div className="text-xs uppercase font-bold tracking-wider text-slate-400">
                  Status Atual da Conta
                </div>
                <div className="text-base sm:text-lg font-bold text-white mt-0.5">
                  {subData.subscriptionStatus === 'active'
                    ? 'Assinatura Ritmo PRO Ativa'
                    : subData.isExpired
                    ? 'Período de Teste Gratuito Expirado'
                    : `Período de Teste: Restam ${subData.trialDaysRemaining} dias`}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {subData.subscriptionStatus === 'active'
                    ? `Sua renovação mensal está agendada para ${subData.renewalDate || 'o próximo ciclo'}.`
                    : subData.isExpired
                    ? 'Assine agora para reativar todas as funcionalidades de foco, hábitos e finanças.'
                    : 'Aproveite o período gratuito para explorar todas as funcionalidades.'}
                </div>
              </div>
            </div>

            {subData.subscriptionStatus === 'active' && (
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-xs font-semibold">
                Plano Ativo
              </span>
            )}
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="mb-8 p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
            <span>{successMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Plan & Features Details */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-bold mb-4">
                <Sparkles className="w-3.5 h-3.5" />
                Plano Único e Completo
              </div>

              <h2 className="text-2xl font-black text-white mb-1">Ritmo PRO Mensal</h2>
              <p className="text-slate-400 text-xs leading-relaxed mb-6">
                Acesso completo a todas as ferramentas com atualizações constantes e suporte prioritário.
              </p>

              {/* Price display */}
              <div className="p-4 rounded-xl bg-[#0d1117] border border-[#30363d] mb-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl sm:text-4xl font-extrabold text-white">
                    R$ {(finalAmountCents / 100).toFixed(2).replace('.', ',')}
                  </span>
                  <span className="text-sm text-slate-400">/mês</span>
                  {appliedCoupon && (
                    <span className="text-xs line-through text-slate-500 ml-auto">
                      R$ 39,90
                    </span>
                  )}
                </div>
                {appliedCoupon && (
                  <div className="mt-2 text-xs text-emerald-400 font-medium flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5" />
                    Cupom <strong>{appliedCoupon.code}</strong> aplicado com sucesso!
                  </div>
                )}
              </div>

              {/* Features List */}
              <div className="space-y-3 mb-6 text-xs sm:text-sm text-slate-300">
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Ciclos de Foco Ilimitados (7, 21, 40 e 90 dias)</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Gestão de Tarefas por Time-Blocking (Manhã/Tarde/Noite)</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Rastreamento de Hábitos e Matriz de 28 Dias</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Finanças Pessoais, Orçamentos e Exportação CSV</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Integração WhatsApp Bot para registro de gastos</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Sincronização em tempo real com Google Sheets</span>
                </div>
                <div className="flex items-start gap-2.5 text-emerald-400 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>Programa de Afiliados: Ganhe 60% (R$ 23,94/mês) por indicação</span>
                </div>
              </div>

              <div className="border-t border-[#30363d] pt-4 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Cancelamento a qualquer momento
                </span>
                <span className="flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  Pagamento Seguro
                </span>
              </div>
            </div>

            {/* Coupon Box */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 shadow-lg">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Cupom de Desconto
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ex: RITMO10, FOCO20"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 uppercase focus:outline-none focus:border-emerald-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={validatingCoupon || !couponCode.trim()}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold disabled:opacity-50 transition-colors"
                >
                  {validatingCoupon ? 'Aplicando...' : 'Aplicar'}
                </button>
              </div>
              {couponError && <p className="text-xs text-rose-400 mt-2">{couponError}</p>}
            </div>
          </div>

          {/* Payment Checkout Form & Methods */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 sm:p-8 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-4">Escolha a Forma de Pagamento</h3>

              {/* Method Switcher Tabs */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('pix')}
                  className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border text-sm font-bold transition-all ${
                    paymentMethod === 'pix'
                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-950/40'
                      : 'bg-[#0d1117] border-[#30363d] text-slate-400 hover:text-white'
                  }`}
                >
                  <QrCode className="w-5 h-5 text-emerald-400" />
                  PIX (Instantâneo)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('credit_card')}
                  className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border text-sm font-bold transition-all ${
                    paymentMethod === 'credit_card'
                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-950/40'
                      : 'bg-[#0d1117] border-[#30363d] text-slate-400 hover:text-white'
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-emerald-400" />
                  Cartão de Crédito
                </button>
              </div>

              {/* PIX TAB CONTENT */}
              {paymentMethod === 'pix' && (
                <div className="space-y-6">
                  {!currentOrder ? (
                    <div className="text-center py-6">
                      <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-4">
                        <QrCode className="w-8 h-8" />
                      </div>
                      <h4 className="text-base font-bold text-white mb-1">
                        Pague com PIX com liberação imediata
                      </h4>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
                        Clique abaixo para gerar o QR Code dinâmico e a chave Copia e Cola no valor de{' '}
                        <strong className="text-white">
                          R$ {(finalAmountCents / 100).toFixed(2).replace('.', ',')}
                        </strong>
                        .
                      </p>
                      <button
                        type="button"
                        onClick={handleGeneratePixOrder}
                        disabled={creatingOrder}
                        className="px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-emerald-500/20 transition-all hover:scale-105"
                      >
                        {creatingOrder ? 'Gerando PIX...' : 'Gerar Chave e QR Code PIX'}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between text-xs">
                        <span className="text-slate-300">
                          Referência do Pedido:{' '}
                          <strong className="text-white font-mono">{currentOrder.orderReference}</strong>
                        </span>
                        <span className="font-bold text-emerald-400">
                          R$ {(currentOrder.amountCents / 100).toFixed(2).replace('.', ',')}
                        </span>
                      </div>

                      {/* QR Code and Copia e Cola */}
                      <div className="p-6 rounded-2xl bg-[#0d1117] border border-[#30363d] flex flex-col items-center text-center">
                        <div className="w-48 h-48 bg-white p-3 rounded-xl mb-4 shadow-md flex items-center justify-center">
                          <img
                            src={currentOrder.pixQrCode || ''}
                            alt="QR Code PIX"
                            className="w-full h-full object-contain"
                          />
                        </div>

                        <span className="text-xs text-slate-400 mb-2">Código Copia e Cola</span>
                        <div className="w-full flex items-center gap-2 max-w-md bg-[#161b22] border border-[#30363d] rounded-xl p-2.5">
                          <input
                            readOnly
                            value={currentOrder.pixCopiaECola || ''}
                            className="w-full bg-transparent text-xs text-slate-300 font-mono focus:outline-none truncate"
                          />
                          <button
                            onClick={copyPixCode}
                            type="button"
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 flex-shrink-0"
                          >
                            {copiedPix ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            {copiedPix ? 'Copiado!' : 'Copiar'}
                          </button>
                        </div>
                      </div>

                      <div className="text-center space-y-3">
                        <button
                          type="button"
                          onClick={handleConfirmPayment}
                          disabled={confirmingOrder}
                          className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-emerald-500/25 transition-all hover:scale-[1.01]"
                        >
                          {confirmingOrder ? 'Validando Pagamento...' : 'Já fiz o PIX! Confirmar Assinatura'}
                        </button>
                        <p className="text-[11px] text-slate-500">
                          A confirmação do PIX é processada instantaneamente pelo sistema.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* CREDIT CARD TAB CONTENT */}
              {paymentMethod === 'credit_card' && (
                <form onSubmit={handleProcessCardPayment} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Número do Cartão de Crédito
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="0000 0000 0000 0000"
                        maxLength={19}
                        required
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                      <CreditCard className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Nome Impresso no Cartão
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: CARLOS SILVEIRA"
                      required
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                      className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Validade</label>
                      <input
                        type="text"
                        placeholder="MM/AA"
                        maxLength={5}
                        required
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">CVV / CVC</label>
                      <input
                        type="password"
                        placeholder="123"
                        maxLength={4}
                        required
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={creatingOrder}
                      className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-emerald-500/25 transition-all hover:scale-[1.01]"
                    >
                      {creatingOrder
                        ? 'Processando Cartão...'
                        : `Assinar por R$ ${(finalAmountCents / 100).toFixed(2).replace('.', ',')}/mês`}
                    </button>
                    <p className="text-[11px] text-slate-500 text-center mt-2 flex items-center justify-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-emerald-400" />
                      Ambiente seguro com criptografia de ponta a ponta
                    </p>
                  </div>
                </form>
              )}
            </div>

            {/* Invoices History Table */}
            <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-4">
                <Receipt className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Histórico de Faturas & Recibos</h3>
              </div>

              {!subData?.invoices || subData.invoices.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  Nenhuma fatura registrada até o momento.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="text-slate-400 uppercase border-b border-[#30363d]">
                      <tr>
                        <th className="py-2.5 px-3">Referência</th>
                        <th className="py-2.5 px-3">Data</th>
                        <th className="py-2.5 px-3">Forma</th>
                        <th className="py-2.5 px-3">Valor</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#30363d]/60 text-slate-300">
                      {subData.invoices.map((inv: PaymentItem) => (
                        <tr key={inv.id} className="hover:bg-slate-800/40">
                          <td className="py-3 px-3 font-mono text-white">{inv.orderReference}</td>
                          <td className="py-3 px-3">
                            {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString('pt-BR') : '-'}
                          </td>
                          <td className="py-3 px-3 uppercase">{inv.paymentMethod}</td>
                          <td className="py-3 px-3 font-bold text-white">
                            R$ {(inv.amountCents / 100).toFixed(2).replace('.', ',')}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                inv.status === 'paid'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}
                            >
                              {inv.status === 'paid' ? 'Pago' : 'Pendente'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
