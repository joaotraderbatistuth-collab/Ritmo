import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState } from "react";
import { X, AlertCircle, CheckCircle2, User, Mail, Key, Lock, ArrowRight } from "lucide-react";
const AuthModal = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialReferralCode = "",
  initialTab = "login"
}) => {
  const [tab, setTab] = useState(initialTab);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState(initialReferralCode);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [resetStep, setResetStep] = useState("request");
  const [resetCode, setResetCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  if (!isOpen) return null;
  const post = async (payload) => {
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Não foi possível concluir a ação. Tente novamente.");
    return data;
  };
  const switchTab = (next) => {
    setTab(next);
    setError(null);
    setSuccessMessage(null);
    setResetStep("request");
    setResetCode("");
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);
    try {
      if (tab === "login") {
        const data = await post({ action: "login", email, password });
        onLoginSuccess(data.user);
      } else if (tab === "register") {
        const data = await post({
          action: "register",
          name,
          email,
          password,
          referralCode: referralCode.trim() || void 0,
          acceptedTerms
        });
        onLoginSuccess(data.user);
      } else if (resetStep === "request") {
        const data = await post({ action: "forgot_password", email });
        setResetStep("confirm");
        setSuccessMessage(
          data.demoMode && data.code ? `Modo demonstração (e-mail não configurado): seu código é ${data.code}` : "Enviamos um código de 6 dígitos para o seu e-mail. Ele vale por 1 hora."
        );
        setPassword("");
      } else {
        const data = await post({ action: "reset_password", code: resetCode.trim(), newPassword: password });
        switchTab("login");
        setPassword("");
        setSuccessMessage(data.message || "Senha atualizada! Você já pode entrar.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  const inputClass = "w-full bg-[#0d1117] border border-[#30363d] rounded-lg pl-9 pr-3 py-2 text-sm text-[#f0f6fc] focus:outline-none focus:border-emerald-500";
  const tabClass = (active) => `pb-2.5 px-4 text-sm font-semibold transition-colors relative ${active ? "text-emerald-400 border-b-2 border-emerald-400" : "text-[#8b949e] hover:text-[#f0f6fc]"}`;
  const submitLabel = tab === "login" ? "Entrar no Ritmo" : tab === "register" ? "Começar meus 7 dias grátis" : resetStep === "request" ? "Enviar código por e-mail" : "Salvar nova senha";
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm", children: /* @__PURE__ */ jsxs("div", { className: "bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-md p-6 shadow-2xl relative max-h-[95vh] overflow-y-auto", children: [
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: onClose,
        "aria-label": "Fechar",
        className: "absolute top-4 right-4 p-1.5 rounded-lg text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d]",
        children: /* @__PURE__ */ jsx(X, { className: "w-5 h-5" })
      }
    ),
    tab !== "forgot" ? /* @__PURE__ */ jsxs("div", { className: "flex border-b border-[#30363d] mb-6", children: [
      /* @__PURE__ */ jsx("button", { onClick: () => switchTab("login"), className: tabClass(tab === "login"), children: "Entrar" }),
      /* @__PURE__ */ jsx("button", { onClick: () => switchTab("register"), className: tabClass(tab === "register"), children: "Criar conta grátis" })
    ] }) : /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-base font-bold text-[#f0f6fc]", children: "Recuperar senha" }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-[#8b949e] mt-1", children: resetStep === "request" ? "Informe seu e-mail e enviaremos um código para criar uma nova senha." : "Digite o código recebido por e-mail e escolha a nova senha." })
    ] }),
    error && /* @__PURE__ */ jsxs("div", { role: "alert", className: "mb-4 flex items-start gap-2 text-xs text-rose-300 bg-rose-950/40 border border-rose-800/60 rounded-lg p-3", children: [
      /* @__PURE__ */ jsx(AlertCircle, { className: "w-4 h-4 shrink-0 mt-0.5" }),
      " ",
      /* @__PURE__ */ jsx("span", { children: error })
    ] }),
    successMessage && /* @__PURE__ */ jsxs("div", { className: "mb-4 flex items-start gap-2 text-xs text-emerald-300 bg-emerald-950/40 border border-emerald-800/60 rounded-lg p-3", children: [
      /* @__PURE__ */ jsx(CheckCircle2, { className: "w-4 h-4 shrink-0 mt-0.5" }),
      " ",
      /* @__PURE__ */ jsx("span", { children: successMessage })
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
      tab === "register" && /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-xs font-medium text-[#8b949e] mb-1", children: "Seu nome completo" }),
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx(User, { className: "w-4 h-4 text-[#6e7681] absolute left-3 top-3" }),
          /* @__PURE__ */ jsx("input", { type: "text", required: true, placeholder: "Ex: Maria Souza", value: name, onChange: (e) => setName(e.target.value), className: inputClass })
        ] })
      ] }),
      !(tab === "forgot" && resetStep === "confirm") && /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-xs font-medium text-[#8b949e] mb-1", children: "E-mail" }),
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx(Mail, { className: "w-4 h-4 text-[#6e7681] absolute left-3 top-3" }),
          /* @__PURE__ */ jsx("input", { type: "email", required: true, placeholder: "seu@email.com", value: email, onChange: (e) => setEmail(e.target.value), className: inputClass, autoComplete: "email" })
        ] })
      ] }),
      tab === "forgot" && resetStep === "confirm" && /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-xs font-medium text-[#8b949e] mb-1", children: "Código recebido por e-mail" }),
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx(Key, { className: "w-4 h-4 text-[#6e7681] absolute left-3 top-3" }),
          /* @__PURE__ */ jsx("input", { type: "text", required: true, inputMode: "numeric", placeholder: "000000", value: resetCode, onChange: (e) => setResetCode(e.target.value), className: inputClass })
        ] })
      ] }),
      !(tab === "forgot" && resetStep === "request") && /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-xs font-medium text-[#8b949e] mb-1", children: tab === "forgot" ? "Nova senha" : "Senha" }),
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx(Lock, { className: "w-4 h-4 text-[#6e7681] absolute left-3 top-3" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "password",
              required: true,
              minLength: 6,
              placeholder: "Mínimo 6 caracteres",
              value: password,
              onChange: (e) => setPassword(e.target.value),
              className: inputClass,
              autoComplete: tab === "login" ? "current-password" : "new-password"
            }
          )
        ] })
      ] }),
      tab === "register" && /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-xs font-medium text-[#8b949e] mb-1", children: "Código de indicação (opcional)" }),
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx(Key, { className: "w-4 h-4 text-[#6e7681] absolute left-3 top-3" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              placeholder: "Ex: RITMO-ABC123",
              value: referralCode,
              onChange: (e) => setReferralCode(e.target.value.toUpperCase()),
              className: `${inputClass} uppercase`
            }
          )
        ] })
      ] }),
      tab === "register" && /* @__PURE__ */ jsxs("label", { className: "flex items-start gap-2 text-[11px] text-[#8b949e]", children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "checkbox",
            required: true,
            checked: acceptedTerms,
            onChange: (e) => setAcceptedTerms(e.target.checked),
            className: "mt-0.5 rounded border-[#30363d] bg-[#0d1117] text-emerald-500 focus:ring-0"
          }
        ),
        /* @__PURE__ */ jsxs("span", { children: [
          "Li e concordo com os",
          " ",
          /* @__PURE__ */ jsx("a", { href: "/termos", target: "_blank", rel: "noopener noreferrer", className: "text-emerald-400 hover:underline", children: "Termos de Uso" }),
          " ",
          "e a",
          " ",
          /* @__PURE__ */ jsx("a", { href: "/privacidade", target: "_blank", rel: "noopener noreferrer", className: "text-emerald-400 hover:underline", children: "Política de Privacidade" }),
          ", incluindo o teste grátis de 7 dias e a assinatura de R$ 39,90/mês depois dele."
        ] })
      ] }),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "submit",
          disabled: loading || tab === "register" && !acceptedTerms,
          className: "w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50",
          children: loading ? "Processando..." : /* @__PURE__ */ jsxs(Fragment, { children: [
            submitLabel,
            " ",
            /* @__PURE__ */ jsx(ArrowRight, { className: "w-4 h-4" })
          ] })
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-5 pt-4 border-t border-[#30363d] flex flex-col gap-2 text-center", children: [
      tab === "login" && /* @__PURE__ */ jsx("button", { onClick: () => switchTab("forgot"), className: "text-xs text-[#8b949e] hover:text-emerald-400", children: "Esqueci minha senha" }),
      tab === "forgot" && /* @__PURE__ */ jsx("button", { onClick: () => switchTab("login"), className: "text-xs text-[#8b949e] hover:text-emerald-400", children: "← Voltar para o login" }),
      tab === "register" && /* @__PURE__ */ jsx("p", { className: "text-[11px] text-[#6e7681]", children: "Sem cartão de crédito para começar. Cancele quando quiser." })
    ] })
  ] }) });
};
export {
  AuthModal as A
};
