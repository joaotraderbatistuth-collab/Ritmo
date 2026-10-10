import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Flame, CheckCircle2, AlertCircle, Clock, Sparkles, Tag, ShieldCheck, Lock, QrCode, CreditCard, Check, Copy, Receipt } from "lucide-react";
function CheckoutPage() {
  const [subData, setSubData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponError, setCouponError] = useState("");
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [confirmingOrder, setConfirmingOrder] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [checkStatusMessage, setCheckStatusMessage] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardHolder, setCardHolder] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  useEffect(() => {
    fetchSubscriptionData();
  }, []);
  const fetchSubscriptionData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/checkout");
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
    setCouponError("");
    try {
      const res = await fetch(`/api/checkout?action=validate_coupon&code=${encodeURIComponent(couponCode.trim())}`);
      const data = await res.json();
      if (data.valid) {
        setAppliedCoupon(data);
        setCurrentOrder(null);
      } else {
        setCouponError(data.error || "Cupom inválido.");
        setAppliedCoupon(null);
      }
    } catch {
      setCouponError("Erro ao validar cupom.");
    } finally {
      setValidatingCoupon(false);
    }
  };
  const calculateFinalPriceCents = () => {
    const base = 3990;
    if (!appliedCoupon) return base;
    if (appliedCoupon.discountPercent && appliedCoupon.discountPercent > 0) {
      const disc = Math.round(base * appliedCoupon.discountPercent / 100);
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
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "create_order",
          paymentMethod: "pix",
          couponCode: appliedCoupon ? appliedCoupon.code : void 0
        })
      });
      if (res.status === 401) {
        window.location.href = "/login?modo=cadastro";
        return;
      }
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
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "confirm_payment",
          orderReference: currentOrder.orderReference
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage(data.message || "Assinatura PRO ativada com sucesso!");
        await fetchSubscriptionData();
      } else if (data.error) {
        setCheckStatusMessage(data.error);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setConfirmingOrder(false);
    }
  };
  const handleCancelSubscription = async () => {
    if (!confirm("Cancelar a assinatura? Você continua com acesso até o fim do período já pago e não recebe novas cobranças.")) return;
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "cancel_subscription"
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage("Assinatura cancelada. Seu acesso continua até o fim do período já pago.");
        await fetchSubscriptionData();
      } else {
        setCheckStatusMessage(data.error || "Não foi possível cancelar.");
      }
    } catch (e) {
      console.error(e);
    }
  };
  const handleCheckPaymentStatus = async (silent = false) => {
    if (!currentOrder) return;
    if (!silent) setConfirmingOrder(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "check_payment_status",
          orderReference: currentOrder.orderReference
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMessage(data.message || "Assinatura PRO ativada com sucesso!");
        await fetchSubscriptionData();
      } else if (!silent) {
        setCheckStatusMessage(data.pending ? "Ainda não identificamos seu pagamento. Assim que compensar, confirmamos automaticamente." : data.error);
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (!silent) setConfirmingOrder(false);
    }
  };
  useEffect(() => {
    if (!currentOrder || currentOrder.isSimulated || currentOrder.status === "paid" || successMessage) return;
    const interval = setInterval(() => handleCheckPaymentStatus(true), 5e3);
    return () => clearInterval(interval);
  }, [currentOrder?.orderReference, currentOrder?.isSimulated, successMessage]);
  const handleCardCheckoutRedirect = async () => {
    setCreatingOrder(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "create_order",
          paymentMethod: "credit_card",
          couponCode: appliedCoupon ? appliedCoupon.code : void 0
        })
      });
      if (res.status === 401) {
        window.location.href = "/login?modo=cadastro";
        return;
      }
      const data = await res.json();
      if (data.order?.invoiceUrl && !data.order.isSimulated) {
        window.location.href = data.order.invoiceUrl;
      } else if (data.order) {
        setCurrentOrder(data.order);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCreatingOrder(false);
    }
  };
  const handleProcessCardPayment = async (e) => {
    e.preventDefault();
    setCreatingOrder(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "create_order",
          paymentMethod: "credit_card",
          couponCode: appliedCoupon ? appliedCoupon.code : void 0
        })
      });
      if (res.status === 401) {
        window.location.href = "/login?modo=cadastro";
        return;
      }
      const data = await res.json();
      if (data.order) {
        const confirmRes = await fetch("/api/checkout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            action: "confirm_payment",
            orderReference: data.order.orderReference
          })
        });
        const confirmData = await confirmRes.json();
        if (confirmData.success) {
          setSuccessMessage("Pagamento no cartão aprovado (modo demonstração)! Sua assinatura Ritmo PRO está ativa.");
          await fetchSubscriptionData();
        }
      }
    } catch (e2) {
      console.error(e2);
    } finally {
      setCreatingOrder(false);
    }
  };
  const copyPixCode = () => {
    if (!currentOrder?.pixCopiaECola) return;
    navigator.clipboard.writeText(currentOrder.pixCopiaECola);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 3e3);
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-[#0d1117] text-[#f0f6fc]", children: [
    /* @__PURE__ */ jsx("header", { className: "border-b border-[#30363d] bg-[#161b22]/90 sticky top-0 z-40 backdrop-blur-md", children: /* @__PURE__ */ jsxs("div", { className: "max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs(Link, { to: "/", className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx("div", { className: "w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-900/30", children: /* @__PURE__ */ jsx(Flame, { className: "w-5 h-5 text-white" }) }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "font-bold text-xl tracking-tight bg-gradient-to-r from-white via-emerald-100 to-emerald-400 bg-clip-text text-transparent", children: "Ritmo" }),
          /* @__PURE__ */ jsx("span", { className: "hidden sm:inline-block ml-2 text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20", children: "Checkout & Assinatura" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsx(Link, { to: "/tutorial", className: "text-xs sm:text-sm font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors", children: "Tutorial & Recursos" }),
        /* @__PURE__ */ jsx("a", { href: "/app", className: "inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors", children: "Voltar ao Painel" })
      ] })
    ] }) }),
    /* @__PURE__ */ jsxs("main", { className: "max-w-6xl mx-auto px-4 sm:px-6 py-10", children: [
      subData && /* @__PURE__ */ jsxs("div", { className: "mb-8 p-4 sm:p-5 rounded-2xl border bg-[#161b22] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-[#30363d]", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3.5", children: [
          /* @__PURE__ */ jsx("div", { className: `w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${subData.subscriptionStatus === "active" ? "bg-emerald-500/15 text-emerald-400" : subData.isExpired ? "bg-rose-500/15 text-rose-400" : "bg-amber-500/15 text-amber-400"}`, children: subData.subscriptionStatus === "active" ? /* @__PURE__ */ jsx(CheckCircle2, { className: "w-6 h-6" }) : subData.isExpired ? /* @__PURE__ */ jsx(AlertCircle, { className: "w-6 h-6" }) : /* @__PURE__ */ jsx(Clock, { className: "w-6 h-6" }) }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("div", { className: "text-xs uppercase font-bold tracking-wider text-slate-400", children: "Status Atual da Conta" }),
            /* @__PURE__ */ jsx("div", { className: "text-base sm:text-lg font-bold text-white mt-0.5", children: subData.subscriptionStatus === "active" ? "Assinatura Ritmo PRO Ativa" : subData.subscriptionStatus === "canceled" ? "Assinatura cancelada — acesso até o fim do período pago" : subData.isExpired ? "Acesso pausado — teste ou assinatura expirados" : `Período de Teste: Restam ${subData.trialDaysRemaining} dias` }),
            /* @__PURE__ */ jsx("div", { className: "text-xs text-slate-400 mt-0.5", children: subData.subscriptionStatus === "active" || subData.subscriptionStatus === "canceled" ? `Paga até ${subData.renewalDate ? (/* @__PURE__ */ new Date(subData.renewalDate + "T00:00:00")).toLocaleDateString("pt-BR") : "o fim do ciclo"}. A cobrança é mensal e manual: renove antes do vencimento para não perder o acesso (enviamos lembretes por e-mail).` : subData.isExpired ? "Assine agora para reativar todas as funcionalidades de foco, hábitos e finanças." : "Aproveite o período gratuito para explorar todas as funcionalidades." })
          ] })
        ] }),
        subData.subscriptionStatus === "active" && /* @__PURE__ */ jsxs("div", { className: "flex flex-col items-end gap-2", children: [
          /* @__PURE__ */ jsx("span", { className: "px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-xs font-semibold", children: "Plano Ativo" }),
          /* @__PURE__ */ jsx("button", { type: "button", onClick: handleCancelSubscription, className: "text-[11px] text-slate-500 hover:text-rose-400 underline", children: "Cancelar assinatura" })
        ] })
      ] }),
      successMessage && /* @__PURE__ */ jsxs("div", { className: "mb-8 p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3", children: [
        /* @__PURE__ */ jsx(CheckCircle2, { className: "w-5 h-5 flex-shrink-0 text-emerald-400" }),
        /* @__PURE__ */ jsx("span", { children: successMessage })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-12 gap-8", children: [
        /* @__PURE__ */ jsxs("div", { className: "lg:col-span-5 space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-[#161b22] border border-[#30363d] rounded-2xl p-6 shadow-xl relative overflow-hidden", children: [
            /* @__PURE__ */ jsx("div", { className: "absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" }),
            /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-bold mb-4", children: [
              /* @__PURE__ */ jsx(Sparkles, { className: "w-3.5 h-3.5" }),
              "Plano Único e Completo"
            ] }),
            /* @__PURE__ */ jsx("h2", { className: "text-2xl font-black text-white mb-1", children: "Ritmo PRO Mensal" }),
            /* @__PURE__ */ jsx("p", { className: "text-slate-400 text-xs leading-relaxed mb-6", children: "Acesso completo a todas as ferramentas com atualizações constantes e suporte prioritário." }),
            /* @__PURE__ */ jsxs("div", { className: "p-4 rounded-xl bg-[#0d1117] border border-[#30363d] mb-6", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-baseline gap-2", children: [
                /* @__PURE__ */ jsxs("span", { className: "text-3xl sm:text-4xl font-extrabold text-white", children: [
                  "R$ ",
                  (finalAmountCents / 100).toFixed(2).replace(".", ",")
                ] }),
                /* @__PURE__ */ jsx("span", { className: "text-sm text-slate-400", children: "/mês" }),
                appliedCoupon && /* @__PURE__ */ jsx("span", { className: "text-xs line-through text-slate-500 ml-auto", children: "R$ 39,90" })
              ] }),
              appliedCoupon && /* @__PURE__ */ jsxs("div", { className: "mt-2 text-xs text-emerald-400 font-medium flex items-center gap-1", children: [
                /* @__PURE__ */ jsx(Tag, { className: "w-3.5 h-3.5" }),
                "Cupom ",
                /* @__PURE__ */ jsx("strong", { children: appliedCoupon.code }),
                " aplicado com sucesso!"
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-3 mb-6 text-xs sm:text-sm text-slate-300", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2.5", children: [
                /* @__PURE__ */ jsx(CheckCircle2, { className: "w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" }),
                /* @__PURE__ */ jsx("span", { children: "Ciclos de Foco Ilimitados (7, 21, 40 e 90 dias)" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2.5", children: [
                /* @__PURE__ */ jsx(CheckCircle2, { className: "w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" }),
                /* @__PURE__ */ jsx("span", { children: "Gestão de Tarefas por Time-Blocking (Manhã/Tarde/Noite)" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2.5", children: [
                /* @__PURE__ */ jsx(CheckCircle2, { className: "w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" }),
                /* @__PURE__ */ jsx("span", { children: "Rastreamento de Hábitos e Matriz de 28 Dias" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2.5", children: [
                /* @__PURE__ */ jsx(CheckCircle2, { className: "w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" }),
                /* @__PURE__ */ jsx("span", { children: "Finanças Pessoais, Orçamentos e Exportação CSV" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2.5", children: [
                /* @__PURE__ */ jsx(CheckCircle2, { className: "w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" }),
                /* @__PURE__ */ jsx("span", { children: "Integração WhatsApp Bot para registro de gastos" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2.5", children: [
                /* @__PURE__ */ jsx(CheckCircle2, { className: "w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" }),
                /* @__PURE__ */ jsx("span", { children: "Sincronização em tempo real com Google Sheets" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2.5 text-emerald-400 font-medium", children: [
                /* @__PURE__ */ jsx(CheckCircle2, { className: "w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" }),
                /* @__PURE__ */ jsx("span", { children: "Programa de Afiliados: Ganhe 60% (R$ 23,94/mês) por indicação" })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "border-t border-[#30363d] pt-4 flex items-center justify-between text-xs text-slate-400", children: [
              /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsx(ShieldCheck, { className: "w-4 h-4 text-emerald-400" }),
                "Cancelamento a qualquer momento"
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsx(Lock, { className: "w-4 h-4 text-emerald-400" }),
                "Pagamento Seguro"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-[#161b22] border border-[#30363d] rounded-2xl p-5 shadow-lg", children: [
            /* @__PURE__ */ jsx("label", { className: "block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2", children: "Cupom de Desconto" }),
            /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsx("input", { type: "text", placeholder: "Ex: RITMO10, FOCO20", value: couponCode, onChange: (e) => setCouponCode(e.target.value), className: "flex-1 bg-[#0d1117] border border-[#30363d] rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 uppercase focus:outline-none focus:border-emerald-500 transition-colors" }),
              /* @__PURE__ */ jsx("button", { type: "button", onClick: handleApplyCoupon, disabled: validatingCoupon || !couponCode.trim(), className: "px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold disabled:opacity-50 transition-colors", children: validatingCoupon ? "Aplicando..." : "Aplicar" })
            ] }),
            couponError && /* @__PURE__ */ jsx("p", { className: "text-xs text-rose-400 mt-2", children: couponError })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "lg:col-span-7 space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "bg-[#161b22] border border-[#30363d] rounded-2xl p-6 sm:p-8 shadow-xl", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-white mb-4", children: "Escolha a Forma de Pagamento" }),
            /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3 mb-6", children: [
              /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => setPaymentMethod("pix"), className: `flex items-center justify-center gap-2 p-3.5 rounded-xl border text-sm font-bold transition-all ${paymentMethod === "pix" ? "bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-950/40" : "bg-[#0d1117] border-[#30363d] text-slate-400 hover:text-white"}`, children: [
                /* @__PURE__ */ jsx(QrCode, { className: "w-5 h-5 text-emerald-400" }),
                "PIX (Instantâneo)"
              ] }),
              /* @__PURE__ */ jsxs("button", { type: "button", onClick: () => setPaymentMethod("credit_card"), className: `flex items-center justify-center gap-2 p-3.5 rounded-xl border text-sm font-bold transition-all ${paymentMethod === "credit_card" ? "bg-emerald-500/15 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-950/40" : "bg-[#0d1117] border-[#30363d] text-slate-400 hover:text-white"}`, children: [
                /* @__PURE__ */ jsx(CreditCard, { className: "w-5 h-5 text-emerald-400" }),
                "Cartão de Crédito"
              ] })
            ] }),
            paymentMethod === "pix" && /* @__PURE__ */ jsx("div", { className: "space-y-6", children: !currentOrder ? /* @__PURE__ */ jsxs("div", { className: "text-center py-6", children: [
              /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-4", children: /* @__PURE__ */ jsx(QrCode, { className: "w-8 h-8" }) }),
              /* @__PURE__ */ jsx("h4", { className: "text-base font-bold text-white mb-1", children: "Pague com PIX com liberação imediata" }),
              /* @__PURE__ */ jsxs("p", { className: "text-xs text-slate-400 max-w-sm mx-auto mb-6", children: [
                "Clique abaixo para gerar o QR Code dinâmico e a chave Copia e Cola no valor de",
                " ",
                /* @__PURE__ */ jsxs("strong", { className: "text-white", children: [
                  "R$ ",
                  (finalAmountCents / 100).toFixed(2).replace(".", ",")
                ] }),
                "."
              ] }),
              /* @__PURE__ */ jsx("button", { type: "button", onClick: handleGeneratePixOrder, disabled: creatingOrder, className: "px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-emerald-500/20 transition-all hover:scale-105", children: creatingOrder ? "Gerando PIX..." : "Gerar Chave e QR Code PIX" })
            ] }) : /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
              currentOrder.isSimulated && /* @__PURE__ */ jsxs("div", { className: "p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-xs text-amber-300", children: [
                /* @__PURE__ */ jsx(AlertCircle, { className: "w-4 h-4 shrink-0" }),
                /* @__PURE__ */ jsx("span", { children: "Modo demonstração — sem o Mercado Pago configurado, este Pix não é real. Nenhuma cobrança é feita." })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-between text-xs", children: [
                /* @__PURE__ */ jsxs("span", { className: "text-slate-300", children: [
                  "Referência do Pedido:",
                  " ",
                  /* @__PURE__ */ jsx("strong", { className: "text-white font-mono", children: currentOrder.orderReference })
                ] }),
                /* @__PURE__ */ jsxs("span", { className: "font-bold text-emerald-400", children: [
                  "R$ ",
                  (currentOrder.amountCents / 100).toFixed(2).replace(".", ",")
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "p-6 rounded-2xl bg-[#0d1117] border border-[#30363d] flex flex-col items-center text-center", children: [
                /* @__PURE__ */ jsx("div", { className: "w-48 h-48 bg-white p-3 rounded-xl mb-4 shadow-md flex items-center justify-center", children: /* @__PURE__ */ jsx("img", { src: currentOrder.pixQrCode || "", alt: "QR Code PIX", className: "w-full h-full object-contain" }) }),
                /* @__PURE__ */ jsx("span", { className: "text-xs text-slate-400 mb-2", children: "Código Copia e Cola" }),
                /* @__PURE__ */ jsxs("div", { className: "w-full flex items-center gap-2 max-w-md bg-[#161b22] border border-[#30363d] rounded-xl p-2.5", children: [
                  /* @__PURE__ */ jsx("input", { readOnly: true, value: currentOrder.pixCopiaECola || "", className: "w-full bg-transparent text-xs text-slate-300 font-mono focus:outline-none truncate" }),
                  /* @__PURE__ */ jsxs("button", { onClick: copyPixCode, type: "button", className: "flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 flex-shrink-0", children: [
                    copiedPix ? /* @__PURE__ */ jsx(Check, { className: "w-3.5 h-3.5" }) : /* @__PURE__ */ jsx(Copy, { className: "w-3.5 h-3.5" }),
                    copiedPix ? "Copiado!" : "Copiar"
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsx("div", { className: "text-center space-y-3", children: currentOrder.isSimulated ? /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx("button", { type: "button", onClick: handleConfirmPayment, disabled: confirmingOrder, className: "w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-emerald-500/25 transition-all hover:scale-[1.01]", children: confirmingOrder ? "Validando Pagamento..." : "Já fiz o PIX! Confirmar Assinatura (demonstração)" }),
                /* @__PURE__ */ jsx("p", { className: "text-[11px] text-slate-500", children: "Confirmação manual — modo demonstração, sem Mercado Pago configurado." })
              ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
                /* @__PURE__ */ jsx("button", { type: "button", onClick: () => handleCheckPaymentStatus(false), disabled: confirmingOrder, className: "w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-emerald-500/25 transition-all hover:scale-[1.01]", children: confirmingOrder ? "Verificando..." : "Já fiz o PIX! Verificar pagamento" }),
                /* @__PURE__ */ jsx("p", { className: "text-[11px] text-slate-500", children: "Confirmamos automaticamente assim que o Mercado Pago compensar o Pix — normalmente em segundos. Você também pode clicar para verificar na hora." }),
                checkStatusMessage && /* @__PURE__ */ jsx("p", { className: "text-[11px] text-amber-400", children: checkStatusMessage })
              ] }) })
            ] }) }),
            paymentMethod === "credit_card" && subData?.mercadoPagoEnabled && /* @__PURE__ */ jsxs("div", { className: "space-y-6 text-center py-6", children: [
              /* @__PURE__ */ jsx("div", { className: "w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto", children: /* @__PURE__ */ jsx(ShieldCheck, { className: "w-8 h-8" }) }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("h4", { className: "text-base font-bold text-white mb-1", children: "Pagamento seguro pelo Mercado Pago" }),
                /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400 max-w-sm mx-auto", children: "Você será redirecionado para a página oficial do Mercado Pago para informar os dados do cartão com segurança — o Ritmo nunca armazena nem processa seu número de cartão diretamente." })
              ] }),
              /* @__PURE__ */ jsx("button", { type: "button", onClick: handleCardCheckoutRedirect, disabled: creatingOrder, className: "px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-emerald-500/20 transition-all hover:scale-105", children: creatingOrder ? "Abrindo checkout seguro..." : `Assinar por R$ ${(finalAmountCents / 100).toFixed(2).replace(".", ",")}/mês` }),
              /* @__PURE__ */ jsxs("p", { className: "text-[11px] text-slate-500 flex items-center justify-center gap-1.5", children: [
                /* @__PURE__ */ jsx(Lock, { className: "w-3.5 h-3.5 text-emerald-400" }),
                "Ambiente seguro — página oficial do Mercado Pago"
              ] })
            ] }),
            paymentMethod === "credit_card" && !subData?.mercadoPagoEnabled && /* @__PURE__ */ jsxs("form", { onSubmit: handleProcessCardPayment, className: "space-y-4", children: [
              /* @__PURE__ */ jsxs("div", { className: "p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-xs text-amber-300", children: [
                /* @__PURE__ */ jsx(AlertCircle, { className: "w-4 h-4 shrink-0" }),
                /* @__PURE__ */ jsx("span", { children: "Modo demonstração — sem o Mercado Pago configurado, nenhuma cobrança real é feita aqui." })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-300 mb-1", children: "Número do Cartão de Crédito" }),
                /* @__PURE__ */ jsxs("div", { className: "relative", children: [
                  /* @__PURE__ */ jsx("input", { type: "text", placeholder: "0000 0000 0000 0000", maxLength: 19, required: true, value: cardNumber, onChange: (e) => setCardNumber(e.target.value), className: "w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors" }),
                  /* @__PURE__ */ jsx(CreditCard, { className: "w-4 h-4 text-slate-400 absolute right-3.5 top-3" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-300 mb-1", children: "Nome Impresso no Cartão" }),
                /* @__PURE__ */ jsx("input", { type: "text", placeholder: "Ex: CARLOS SILVEIRA", required: true, value: cardHolder, onChange: (e) => setCardHolder(e.target.value.toUpperCase()), className: "w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors" })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-300 mb-1", children: "Validade" }),
                  /* @__PURE__ */ jsx("input", { type: "text", placeholder: "MM/AA", maxLength: 5, required: true, value: cardExpiry, onChange: (e) => setCardExpiry(e.target.value), className: "w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors" })
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-slate-300 mb-1", children: "CVV / CVC" }),
                  /* @__PURE__ */ jsx("input", { type: "password", placeholder: "123", maxLength: 4, required: true, value: cardCvv, onChange: (e) => setCardCvv(e.target.value), className: "w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors" })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "pt-2", children: [
                /* @__PURE__ */ jsx("button", { type: "submit", disabled: creatingOrder, className: "w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm shadow-xl shadow-emerald-500/25 transition-all hover:scale-[1.01]", children: creatingOrder ? "Processando Cartão..." : `Assinar por R$ ${(finalAmountCents / 100).toFixed(2).replace(".", ",")}/mês` }),
                /* @__PURE__ */ jsxs("p", { className: "text-[11px] text-slate-500 text-center mt-2 flex items-center justify-center gap-1.5", children: [
                  /* @__PURE__ */ jsx(Lock, { className: "w-3.5 h-3.5 text-emerald-400" }),
                  "Ambiente seguro com criptografia de ponta a ponta"
                ] })
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "bg-[#161b22] border border-[#30363d] rounded-2xl p-6 shadow-xl", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-4", children: [
              /* @__PURE__ */ jsx(Receipt, { className: "w-5 h-5 text-emerald-400" }),
              /* @__PURE__ */ jsx("h3", { className: "text-base font-bold text-white", children: "Histórico de Faturas & Recibos" })
            ] }),
            !subData?.invoices || subData.invoices.length === 0 ? /* @__PURE__ */ jsx("div", { className: "text-center py-6 text-xs text-slate-400", children: "Nenhuma fatura registrada até o momento." }) : /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-xs text-left", children: [
              /* @__PURE__ */ jsx("thead", { className: "text-slate-400 uppercase border-b border-[#30363d]", children: /* @__PURE__ */ jsxs("tr", { children: [
                /* @__PURE__ */ jsx("th", { className: "py-2.5 px-3", children: "Referência" }),
                /* @__PURE__ */ jsx("th", { className: "py-2.5 px-3", children: "Data" }),
                /* @__PURE__ */ jsx("th", { className: "py-2.5 px-3", children: "Forma" }),
                /* @__PURE__ */ jsx("th", { className: "py-2.5 px-3", children: "Valor" }),
                /* @__PURE__ */ jsx("th", { className: "py-2.5 px-3", children: "Status" })
              ] }) }),
              /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-[#30363d]/60 text-slate-300", children: subData.invoices.map((inv) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-slate-800/40", children: [
                /* @__PURE__ */ jsx("td", { className: "py-3 px-3 font-mono text-white", children: inv.orderReference }),
                /* @__PURE__ */ jsx("td", { className: "py-3 px-3", children: inv.createdAt ? new Date(inv.createdAt).toLocaleDateString("pt-BR") : "-" }),
                /* @__PURE__ */ jsx("td", { className: "py-3 px-3 uppercase", children: inv.paymentMethod }),
                /* @__PURE__ */ jsxs("td", { className: "py-3 px-3 font-bold text-white", children: [
                  "R$ ",
                  (inv.amountCents / 100).toFixed(2).replace(".", ",")
                ] }),
                /* @__PURE__ */ jsx("td", { className: "py-3 px-3", children: /* @__PURE__ */ jsx("span", { className: `px-2 py-0.5 rounded-full text-[11px] font-semibold ${inv.status === "paid" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"}`, children: inv.status === "paid" ? "Pago" : "Pendente" }) })
              ] }, inv.id)) })
            ] }) })
          ] })
        ] })
      ] })
    ] })
  ] });
}
export {
  CheckoutPage as component
};
