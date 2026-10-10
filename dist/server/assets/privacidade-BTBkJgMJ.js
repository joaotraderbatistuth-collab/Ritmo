import { jsx, jsxs } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
function PrivacidadePage() {
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-[#0d1117] text-[#f0f6fc]", children: /* @__PURE__ */ jsxs("div", { className: "max-w-2xl mx-auto px-6 py-12", children: [
    /* @__PURE__ */ jsx(Link, { to: "/", className: "text-sm text-emerald-400 hover:underline", children: "← Voltar" }),
    /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold mt-4 mb-6", children: "Política de Privacidade — Ritmo" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-5 text-sm text-[#c9d1d9] leading-relaxed", children: [
      /* @__PURE__ */ jsx("p", { children: /* @__PURE__ */ jsx("em", { children: "Minuta inicial baseada na LGPD (Lei 13.709/2018) — revise com um advogado e preencha os campos indicados antes de publicar." }) }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-base font-semibold text-white mb-1", children: "1. Dados que coletamos" }),
        /* @__PURE__ */ jsx("p", { children: "Dados de cadastro (nome, e-mail, senha com hash), dados de uso do app (tarefas, hábitos, quadros, sessões de foco, diário, lançamentos financeiros), dados de pagamento processados pelo Mercado Pago (não armazenamos número de cartão), e dados técnicos básicos de acesso." })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-base font-semibold text-white mb-1", children: "2. Finalidade do uso" }),
        /* @__PURE__ */ jsx("p", { children: "Fornecer e melhorar o serviço, processar pagamentos e comissões de afiliados, enviar e-mails transacionais (recuperação de senha, confirmação de pagamento) e cumprir obrigações legais." })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-base font-semibold text-white mb-1", children: "3. Compartilhamento" }),
        /* @__PURE__ */ jsx("p", { children: "Compartilhamos dados estritamente necessários com o Mercado Pago (pagamentos) e com o Resend (envio de e-mail transacional). Não vendemos dados pessoais a terceiros." })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-base font-semibold text-white mb-1", children: "4. Seus direitos (LGPD)" }),
        /* @__PURE__ */ jsx("p", { children: "Você pode solicitar a qualquer momento a confirmação, acesso, correção, exclusão ou portabilidade dos seus dados, e revogar consentimentos. Para exercer esses direitos: [preencher e-mail/canal do encarregado de dados (DPO)]." })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-base font-semibold text-white mb-1", children: "5. Segurança" }),
        /* @__PURE__ */ jsx("p", { children: "Senhas são armazenadas com hash (nunca em texto puro). Dados financeiros ficam isolados por usuário e protegidos no servidor, não apenas na interface." })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-base font-semibold text-white mb-1", children: "6. Retenção e exclusão" }),
        /* @__PURE__ */ jsx("p", { children: "Você pode excluir sua conta e todos os seus dados a qualquer momento pelo próprio app, em Perfil." })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-base font-semibold text-white mb-1", children: "7. Contato" }),
        /* @__PURE__ */ jsx("p", { children: "Encarregado de dados (DPO) / contato de privacidade: [preencher]." })
      ] })
    ] })
  ] }) });
}
export {
  PrivacidadePage as component
};
