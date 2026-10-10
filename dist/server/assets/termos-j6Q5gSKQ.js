import { jsx, jsxs } from "react/jsx-runtime";
import { Link } from "@tanstack/react-router";
function TermosPage() {
  return /* @__PURE__ */ jsx("div", { className: "min-h-screen bg-[#0d1117] text-[#f0f6fc]", children: /* @__PURE__ */ jsxs("div", { className: "max-w-2xl mx-auto px-6 py-12", children: [
    /* @__PURE__ */ jsx(Link, { to: "/", className: "text-sm text-emerald-400 hover:underline", children: "← Voltar" }),
    /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold mt-4 mb-6", children: "Termos de Uso — Ritmo" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-5 text-sm text-[#c9d1d9] leading-relaxed", children: [
      /* @__PURE__ */ jsx("p", { children: /* @__PURE__ */ jsx("em", { children: "Minuta inicial — revise com um advogado antes de publicar oficialmente. Preencha razão social, CNPJ/CPF, endereço e foro antes de usar em produção." }) }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-base font-semibold text-white mb-1", children: "1. O serviço" }),
        /* @__PURE__ */ jsx("p", { children: "O Ritmo é uma plataforma de produtividade, hábitos e organização financeira pessoal. Todo novo cadastro recebe 7 dias de teste gratuito; após esse período, o acesso às ferramentas principais depende de assinatura ativa no plano mensal de R$ 39,90." })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-base font-semibold text-white mb-1", children: "2. Cadastro e conta" }),
        /* @__PURE__ */ jsx("p", { children: "Você é responsável por manter a confidencialidade da sua senha e por todas as atividades realizadas na sua conta. Informe dados verdadeiros no cadastro." })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-base font-semibold text-white mb-1", children: "3. Assinatura, cobrança e cancelamento" }),
        /* @__PURE__ */ jsx("p", { children: "A assinatura custa R$ 39,90 por período de 30 dias e é paga manualmente, por Pix ou cartão de crédito, a cada ciclo — não há cobrança automática recorrente no cartão. Enviamos lembretes por e-mail antes do vencimento; se o pagamento não for feito, o acesso às ferramentas é pausado, e os dados permanecem guardados. Você pode cancelar a qualquer momento pelo app, sem multa; o acesso continua até o fim do período já pago. Em compras feitas pela internet, você tem direito de arrependimento em até 7 dias corridos a partir da contratação, conforme o art. 49 do Código de Defesa do Consumidor (Lei 8.078/1990), com reembolso integral quando aplicável." })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-base font-semibold text-white mb-1", children: "4. Programa de afiliados" }),
        /* @__PURE__ */ jsx("p", { children: "Usuários podem indicar o Ritmo por um link próprio e receber comissão recorrente de 60% sobre o valor líquido de cada assinatura paga confirmada, enquanto essa assinatura estiver ativa. Comissões são contabilizadas somente após a confirmação do pagamento; estornos, reembolsos ou cancelamentos cancelam ou revertem a comissão correspondente. Não há promessa de renda ou resultado garantido." })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-base font-semibold text-white mb-1", children: "5. Avisos importantes" }),
        /* @__PURE__ */ jsx("p", { children: "O Ritmo não substitui aconselhamento médico, psicológico ou financeiro profissional. O módulo financeiro é uma ferramenta de organização pessoal, não consultoria de investimentos." })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-base font-semibold text-white mb-1", children: "6. Rescisão" }),
        /* @__PURE__ */ jsx("p", { children: "Podemos suspender ou encerrar contas que violem estes termos, com aviso prévio sempre que possível." })
      ] }),
      /* @__PURE__ */ jsxs("section", { children: [
        /* @__PURE__ */ jsx("h2", { className: "text-base font-semibold text-white mb-1", children: "7. Contato" }),
        /* @__PURE__ */ jsx("p", { children: "Dúvidas sobre estes termos: [preencher e-mail de suporte/contato]." })
      ] })
    ] })
  ] }) });
}
export {
  TermosPage as component
};
