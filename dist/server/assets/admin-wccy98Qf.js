import { jsx, jsxs } from "react/jsx-runtime";
import { useState, useCallback, useEffect, useMemo } from "react";
import { AlertCircle, Flame, LayoutDashboard, Users, CreditCard, Ticket, Wallet, X, CheckCircle2, Search } from "lucide-react";
const brl = (cents) => (cents / 100).toLocaleString("pt-BR", {
  style: "currency",
  currency: "BRL"
});
const dateBR = (v) => v ? new Date(v).toLocaleDateString("pt-BR") : "—";
const STATUS_LABEL = {
  trial: "Em teste",
  active: "Assinante",
  expired: "Expirado",
  suspended: "Suspenso",
  canceled: "Cancelado"
};
function AdminPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [tab, setTab] = useState("geral");
  const load = useCallback(async () => {
    const res = await fetch("/api/admin");
    if (res.status === 401) {
      window.location.href = "/login";
      return;
    }
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json.error || "Não foi possível carregar o painel.");
      return;
    }
    setData(json);
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  const act = async (body) => {
    setNotice("");
    setError("");
    const res = await fetch("/api/admin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json.error || "Ação não concluída.");
      return false;
    }
    setNotice(json.message || "Feito.");
    await load();
    return true;
  };
  if (error && !data) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-[#0d1117] text-[#f0f6fc] flex items-center justify-center px-4", children: /* @__PURE__ */ jsxs("div", { className: "max-w-md text-center", children: [
      /* @__PURE__ */ jsx(AlertCircle, { className: "w-10 h-10 text-rose-400 mx-auto mb-3" }),
      /* @__PURE__ */ jsx("p", { className: "mb-4", children: error }),
      /* @__PURE__ */ jsx("a", { href: "/app", className: "text-emerald-400 underline", children: "Voltar ao painel" })
    ] }) });
  }
  if (!data) {
    return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-[#0d1117] text-slate-400 flex items-center justify-center", children: "Carregando painel..." });
  }
  const tabs = [{
    id: "geral",
    label: "Visão geral",
    icon: LayoutDashboard
  }, {
    id: "usuarios",
    label: "Usuários",
    icon: Users
  }, {
    id: "pagamentos",
    label: "Pagamentos",
    icon: CreditCard
  }, {
    id: "cupons",
    label: "Cupons",
    icon: Ticket
  }, {
    id: "saques",
    label: "Saques de afiliados",
    icon: Wallet
  }];
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-[#0d1117] text-[#f0f6fc]", children: [
    /* @__PURE__ */ jsx("header", { className: "border-b border-[#30363d] bg-[#161b22]", children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 font-bold", children: [
        /* @__PURE__ */ jsx(Flame, { className: "w-5 h-5 text-emerald-400" }),
        " Ritmo · Administração"
      ] }),
      /* @__PURE__ */ jsx("a", { href: "/app", className: "text-sm text-slate-300 hover:text-white", children: "Voltar ao app" })
    ] }) }),
    /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 py-6", children: [
      /* @__PURE__ */ jsx("nav", { className: "flex gap-1 overflow-x-auto border-b border-[#30363d] mb-6", children: tabs.map((t) => /* @__PURE__ */ jsxs("button", { onClick: () => setTab(t.id), className: `flex items-center gap-2 px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 ${tab === t.id ? "border-emerald-400 text-emerald-400" : "border-transparent text-slate-400 hover:text-white"}`, children: [
        /* @__PURE__ */ jsx(t.icon, { className: "w-4 h-4" }),
        " ",
        t.label
      ] }, t.id)) }),
      error && /* @__PURE__ */ jsxs("div", { role: "alert", className: "mb-4 flex items-center gap-2 text-sm text-rose-300 bg-rose-950/40 border border-rose-800/60 rounded-lg p-3", children: [
        /* @__PURE__ */ jsx(AlertCircle, { className: "w-4 h-4" }),
        " ",
        error,
        /* @__PURE__ */ jsx("button", { className: "ml-auto", onClick: () => setError(""), children: /* @__PURE__ */ jsx(X, { className: "w-4 h-4" }) })
      ] }),
      notice && /* @__PURE__ */ jsxs("div", { className: "mb-4 flex items-center gap-2 text-sm text-emerald-300 bg-emerald-950/40 border border-emerald-800/60 rounded-lg p-3", children: [
        /* @__PURE__ */ jsx(CheckCircle2, { className: "w-4 h-4" }),
        " ",
        notice,
        /* @__PURE__ */ jsx("button", { className: "ml-auto", onClick: () => setNotice(""), children: /* @__PURE__ */ jsx(X, { className: "w-4 h-4" }) })
      ] }),
      tab === "geral" && /* @__PURE__ */ jsx(Overview, { m: data.metrics }),
      tab === "usuarios" && /* @__PURE__ */ jsx(UsersTab, { users: data.users, act }),
      tab === "pagamentos" && /* @__PURE__ */ jsx(PaymentsTab, { payments: data.payments }),
      tab === "cupons" && /* @__PURE__ */ jsx(CouponsTab, { coupons: data.coupons, act }),
      tab === "saques" && /* @__PURE__ */ jsx(WithdrawalsTab, { withdrawals: data.withdrawals, act })
    ] })
  ] });
}
function Card({
  label,
  value,
  hint
}) {
  return /* @__PURE__ */ jsxs("div", { className: "bg-[#161b22] border border-[#30363d] rounded-2xl p-5", children: [
    /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-400", children: label }),
    /* @__PURE__ */ jsx("p", { className: "text-2xl font-extrabold mt-1", children: value }),
    hint && /* @__PURE__ */ jsx("p", { className: "text-[11px] text-slate-500 mt-1", children: hint })
  ] });
}
function Overview({
  m
}) {
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 lg:grid-cols-4 gap-4", children: [
      /* @__PURE__ */ jsx(Card, { label: "Usuários cadastrados", value: m.totalUsers }),
      /* @__PURE__ */ jsx(Card, { label: "Usuários ativos (teste + assinantes)", value: m.activeUsers }),
      /* @__PURE__ */ jsx(Card, { label: "Assinantes pagos", value: m.paidSubscribers }),
      /* @__PURE__ */ jsx(Card, { label: "Em período de teste", value: m.trialUsers }),
      /* @__PURE__ */ jsx(Card, { label: "Receita mensal recorrente (MRR)", value: brl(m.mrrCents), hint: "Assinantes ativos × R$ 39,90" }),
      /* @__PURE__ */ jsx(Card, { label: "Comissões a pagar", value: brl(m.pendingCommissionsCents), hint: "Saques pendentes ou aprovados" }),
      /* @__PURE__ */ jsx(Card, { label: "Comissões já pagas", value: brl(m.totalCommissionsPaidCents) })
    ] }),
    /* @__PURE__ */ jsx("p", { className: "text-xs text-slate-500", children: "O MRR é estimado pelo número de assinantes ativos; cupons e cobranças reais ficam na aba Pagamentos." })
  ] });
}
function UsersTab({
  users,
  act
}) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("todos");
  const [editing, setEditing] = useState(null);
  const filtered = useMemo(() => users.filter((u) => {
    const text = `${u.name} ${u.email}`.toLowerCase();
    return (!q || text.includes(q.toLowerCase())) && (status === "todos" || u.subscriptionStatus === status);
  }), [users, q, status]);
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-2 mb-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsx(Search, { className: "w-4 h-4 text-slate-500 absolute left-3 top-2.5" }),
        /* @__PURE__ */ jsx("input", { value: q, onChange: (e) => setQ(e.target.value), placeholder: "Buscar nome ou e-mail", className: "bg-[#0d1117] border border-[#30363d] rounded-lg pl-9 pr-3 py-2 text-sm w-64" })
      ] }),
      /* @__PURE__ */ jsxs("select", { value: status, onChange: (e) => setStatus(e.target.value), className: "bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm", children: [
        /* @__PURE__ */ jsx("option", { value: "todos", children: "Todos os status" }),
        Object.entries(STATUS_LABEL).map(([k, v]) => /* @__PURE__ */ jsx("option", { value: k, children: v }, k))
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "overflow-x-auto border border-[#30363d] rounded-2xl", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsx("thead", { className: "bg-[#161b22] text-slate-400 text-left", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Nome" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "E-mail" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Status" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Teste" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Papel" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Cadastro" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3" })
      ] }) }),
      /* @__PURE__ */ jsxs("tbody", { children: [
        filtered.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 7, className: "px-4 py-8 text-center text-slate-500", children: "Nenhum usuário encontrado." }) }),
        filtered.map((u) => /* @__PURE__ */ jsxs("tr", { className: "border-t border-[#30363d]", children: [
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: u.name }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-slate-300", children: u.email }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: STATUS_LABEL[u.subscriptionStatus] || u.subscriptionStatus }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: u.subscriptionStatus === "trial" ? `${u.trialDaysRemaining} d` : "—" }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: u.role === "admin" ? "Admin" : "Usuário" }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-slate-400", children: dateBR(u.createdAt) }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-right", children: /* @__PURE__ */ jsx("button", { onClick: () => setEditing(u), className: "text-emerald-400 hover:underline", children: "Editar" }) })
        ] }, u.id))
      ] })
    ] }) }),
    editing && /* @__PURE__ */ jsx(EditUserModal, { user: editing, onClose: () => setEditing(null), act })
  ] });
}
function EditUserModal({
  user,
  onClose,
  act
}) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState(user.role);
  const [status, setStatus] = useState(user.subscriptionStatus);
  const [extend, setExtend] = useState("");
  const [password, setPassword] = useState("");
  const save = async () => {
    const ok = await act({
      action: "update_user",
      targetUserId: user.id,
      name,
      email,
      role,
      subscriptionStatus: status,
      extendTrialDays: extend ? Number(extend) : void 0,
      manualPassword: password || void 0
    });
    if (ok) onClose();
  };
  const field = "w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm";
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4", children: /* @__PURE__ */ jsxs("div", { className: "bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-md p-6 max-h-[92vh] overflow-y-auto", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-4", children: [
      /* @__PURE__ */ jsx("h3", { className: "font-bold", children: "Editar usuário" }),
      /* @__PURE__ */ jsx("button", { onClick: onClose, "aria-label": "Fechar", children: /* @__PURE__ */ jsx(X, { className: "w-5 h-5" }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
      /* @__PURE__ */ jsxs("label", { className: "block text-xs text-slate-400", children: [
        "Nome",
        /* @__PURE__ */ jsx("input", { className: field, value: name, onChange: (e) => setName(e.target.value) })
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "block text-xs text-slate-400", children: [
        "E-mail",
        /* @__PURE__ */ jsx("input", { className: field, value: email, onChange: (e) => setEmail(e.target.value) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
        /* @__PURE__ */ jsxs("label", { className: "block text-xs text-slate-400", children: [
          "Status da conta",
          /* @__PURE__ */ jsxs("select", { className: field, value: status, onChange: (e) => setStatus(e.target.value), children: [
            /* @__PURE__ */ jsx("option", { value: "trial", children: "Em teste" }),
            /* @__PURE__ */ jsx("option", { value: "active", children: "Assinante" }),
            /* @__PURE__ */ jsx("option", { value: "expired", children: "Expirado" }),
            /* @__PURE__ */ jsx("option", { value: "suspended", children: "Suspenso" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("label", { className: "block text-xs text-slate-400", children: [
          "Papel",
          /* @__PURE__ */ jsxs("select", { className: field, value: role, onChange: (e) => setRole(e.target.value), children: [
            /* @__PURE__ */ jsx("option", { value: "user", children: "Usuário" }),
            /* @__PURE__ */ jsx("option", { value: "admin", children: "Administrador" })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "block text-xs text-slate-400", children: [
        "Estender teste (dias)",
        /* @__PURE__ */ jsx("input", { className: field, type: "number", min: 1, placeholder: "Ex.: 7", value: extend, onChange: (e) => setExtend(e.target.value) })
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "block text-xs text-slate-400", children: [
        "Definir nova senha (opcional, mín. 6)",
        /* @__PURE__ */ jsx("input", { className: field, type: "text", placeholder: "Deixe em branco para não alterar", value: password, onChange: (e) => setPassword(e.target.value) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2 mt-5", children: [
      /* @__PURE__ */ jsx("button", { onClick: onClose, className: "px-4 py-2 rounded-lg bg-[#21262d] text-sm", children: "Cancelar" }),
      /* @__PURE__ */ jsx("button", { onClick: save, className: "px-4 py-2 rounded-lg bg-emerald-500 text-slate-950 font-bold text-sm", children: "Salvar" })
    ] })
  ] }) });
}
function PaymentsTab({
  payments
}) {
  const paid = payments.filter((p) => p.status === "paid");
  const total = paid.reduce((a, p) => a + p.amountCents, 0);
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4 mb-4 max-w-md", children: [
      /* @__PURE__ */ jsx(Card, { label: "Pagamentos confirmados", value: paid.length }),
      /* @__PURE__ */ jsx(Card, { label: "Total recebido", value: brl(total) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "overflow-x-auto border border-[#30363d] rounded-2xl", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsx("thead", { className: "bg-[#161b22] text-slate-400 text-left", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Data" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Cliente" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Pedido" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Forma" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Cupom" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Valor" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Status" })
      ] }) }),
      /* @__PURE__ */ jsxs("tbody", { children: [
        payments.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 7, className: "px-4 py-8 text-center text-slate-500", children: "Nenhum pagamento ainda." }) }),
        payments.map((p) => /* @__PURE__ */ jsxs("tr", { className: "border-t border-[#30363d]", children: [
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-slate-400", children: dateBR(p.paidAt || p.createdAt) }),
          /* @__PURE__ */ jsxs("td", { className: "px-4 py-3", children: [
            p.userName,
            /* @__PURE__ */ jsx("div", { className: "text-[11px] text-slate-500", children: p.userEmail })
          ] }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3 font-mono text-xs", children: p.orderReference }),
          /* @__PURE__ */ jsxs("td", { className: "px-4 py-3", children: [
            p.paymentMethod === "pix" ? "Pix" : "Cartão",
            p.isSimulated ? " (demo)" : ""
          ] }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: p.couponCode || "—" }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: brl(p.amountCents) }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: p.status === "paid" ? "Pago" : p.status === "pending" ? "Pendente" : p.status })
        ] }, p.id))
      ] })
    ] }) })
  ] });
}
function CouponsTab({
  coupons,
  act
}) {
  const [code, setCode] = useState("");
  const [percent, setPercent] = useState("");
  const [fixed, setFixed] = useState("");
  const [maxUses, setMaxUses] = useState("100");
  const [expiresAt, setExpiresAt] = useState("");
  const create = async (e) => {
    e.preventDefault();
    const ok = await act({
      action: "create_coupon",
      code: code.trim().toUpperCase(),
      discountPercent: percent ? Number(percent) : 0,
      discountCents: fixed ? Math.round(Number(fixed.replace(",", ".")) * 100) : 0,
      maxUses: Number(maxUses) || 100,
      expiresAt: expiresAt || void 0
    });
    if (ok) {
      setCode("");
      setPercent("");
      setFixed("");
      setExpiresAt("");
    }
  };
  const field = "bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm";
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
    /* @__PURE__ */ jsxs("form", { onSubmit: create, className: "bg-[#161b22] border border-[#30363d] rounded-2xl p-5 grid sm:grid-cols-6 gap-3 items-end", children: [
      /* @__PURE__ */ jsxs("label", { className: "text-xs text-slate-400 sm:col-span-2", children: [
        "Código",
        /* @__PURE__ */ jsx("input", { required: true, className: `${field} w-full uppercase`, value: code, onChange: (e) => setCode(e.target.value), placeholder: "BEMVINDO20" })
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "text-xs text-slate-400", children: [
        "Desconto %",
        /* @__PURE__ */ jsx("input", { className: `${field} w-full`, type: "number", min: 0, max: 100, value: percent, onChange: (e) => setPercent(e.target.value), placeholder: "20" })
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "text-xs text-slate-400", children: [
        "ou R$ fixo",
        /* @__PURE__ */ jsx("input", { className: `${field} w-full`, value: fixed, onChange: (e) => setFixed(e.target.value), placeholder: "10,00" })
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "text-xs text-slate-400", children: [
        "Limite de usos",
        /* @__PURE__ */ jsx("input", { className: `${field} w-full`, type: "number", min: 1, value: maxUses, onChange: (e) => setMaxUses(e.target.value) })
      ] }),
      /* @__PURE__ */ jsxs("label", { className: "text-xs text-slate-400", children: [
        "Validade",
        /* @__PURE__ */ jsx("input", { className: `${field} w-full`, type: "date", value: expiresAt, onChange: (e) => setExpiresAt(e.target.value) })
      ] }),
      /* @__PURE__ */ jsx("button", { className: "sm:col-span-6 sm:justify-self-start px-5 py-2 rounded-lg bg-emerald-500 text-slate-950 font-bold text-sm", children: "Criar cupom" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "overflow-x-auto border border-[#30363d] rounded-2xl", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsx("thead", { className: "bg-[#161b22] text-slate-400 text-left", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Código" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Desconto" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Usos" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Validade" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Status" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3" })
      ] }) }),
      /* @__PURE__ */ jsxs("tbody", { children: [
        coupons.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 6, className: "px-4 py-8 text-center text-slate-500", children: "Nenhum cupom criado." }) }),
        coupons.map((c) => /* @__PURE__ */ jsxs("tr", { className: "border-t border-[#30363d]", children: [
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3 font-mono", children: c.code }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: c.discountPercent ? `${c.discountPercent}%` : brl(c.discountCents || 0) }),
          /* @__PURE__ */ jsxs("td", { className: "px-4 py-3", children: [
            c.usedCount,
            "/",
            c.maxUses
          ] }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-slate-400", children: c.expiresAt || "—" }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: c.active ? "Ativo" : "Desativado" }),
          /* @__PURE__ */ jsxs("td", { className: "px-4 py-3 text-right space-x-3", children: [
            /* @__PURE__ */ jsx("button", { className: "text-emerald-400 hover:underline", onClick: () => act({
              action: "toggle_coupon",
              couponId: c.id,
              active: !c.active
            }), children: c.active ? "Desativar" : "Ativar" }),
            /* @__PURE__ */ jsx("button", { className: "text-rose-400 hover:underline", onClick: () => {
              if (confirm(`Excluir o cupom ${c.code}?`)) act({
                action: "delete_coupon",
                couponId: c.id
              });
            }, children: "Excluir" })
          ] })
        ] }, c.id))
      ] })
    ] }) })
  ] });
}
function WithdrawalsTab({
  withdrawals,
  act
}) {
  const label = {
    pending: "Pendente",
    approved: "Aprovado",
    paid: "Pago",
    rejected: "Rejeitado"
  };
  const process = async (w, status) => {
    let receipt;
    let notes;
    if (status === "paid") {
      receipt = prompt("ID/comprovante do Pix enviado (opcional):") || void 0;
    }
    if (status === "rejected") {
      notes = prompt("Motivo da rejeição:") || void 0;
      if (!notes) return;
    }
    await act({
      action: "process_withdrawal",
      withdrawalId: w.id,
      status,
      notes,
      receiptReference: receipt
    });
  };
  return /* @__PURE__ */ jsxs("div", { className: "overflow-x-auto border border-[#30363d] rounded-2xl", children: [
    /* @__PURE__ */ jsxs("table", { className: "w-full text-sm", children: [
      /* @__PURE__ */ jsx("thead", { className: "bg-[#161b22] text-slate-400 text-left", children: /* @__PURE__ */ jsxs("tr", { children: [
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Solicitado" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Afiliado" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Valor" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Chave Pix" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Status" }),
        /* @__PURE__ */ jsx("th", { className: "px-4 py-3" })
      ] }) }),
      /* @__PURE__ */ jsxs("tbody", { children: [
        withdrawals.length === 0 && /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 6, className: "px-4 py-8 text-center text-slate-500", children: "Nenhuma solicitação de saque." }) }),
        withdrawals.map((w) => /* @__PURE__ */ jsxs("tr", { className: "border-t border-[#30363d]", children: [
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-slate-400", children: dateBR(w.requestedAt) }),
          /* @__PURE__ */ jsxs("td", { className: "px-4 py-3", children: [
            w.affiliateName,
            /* @__PURE__ */ jsx("div", { className: "text-[11px] text-slate-500", children: w.affiliateEmail })
          ] }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: brl(w.amountCents) }),
          /* @__PURE__ */ jsxs("td", { className: "px-4 py-3 font-mono text-xs", children: [
            w.pixKey,
            /* @__PURE__ */ jsx("div", { className: "text-[10px] text-slate-500", children: w.pixKeyType })
          ] }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: label[w.status] || w.status }),
          /* @__PURE__ */ jsxs("td", { className: "px-4 py-3 text-right space-x-3 whitespace-nowrap", children: [
            w.status === "pending" && /* @__PURE__ */ jsx("button", { className: "text-emerald-400 hover:underline", onClick: () => process(w, "approved"), children: "Aprovar" }),
            (w.status === "pending" || w.status === "approved") && /* @__PURE__ */ jsx("button", { className: "text-amber-300 hover:underline", onClick: () => process(w, "paid"), children: "Marcar como pago" }),
            (w.status === "pending" || w.status === "approved") && /* @__PURE__ */ jsx("button", { className: "text-rose-400 hover:underline", onClick: () => process(w, "rejected"), children: "Rejeitar" })
          ] })
        ] }, w.id))
      ] })
    ] }),
    /* @__PURE__ */ jsx("p", { className: "text-[11px] text-slate-500 px-4 py-3 border-t border-[#30363d]", children: "O Pix é enviado por você, manualmente, pelo seu banco; aqui você registra o resultado. Nenhum pagamento é feito automaticamente." })
  ] });
}
export {
  AdminPage as component
};
