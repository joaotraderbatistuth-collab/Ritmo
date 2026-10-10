import { createFileRoute, Link } from '@tanstack/react-router';

export const Route = createFileRoute('/termos')({
  component: TermosPage,
});

function TermosPage() {
  return (
    <div className="min-h-screen bg-[#0d1117] text-[#f0f6fc]">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Link to="/" className="text-sm text-emerald-400 hover:underline">← Voltar</Link>
        <h1 className="text-2xl font-bold mt-4 mb-6">Termos de Uso — Ritmo</h1>
        <div className="space-y-5 text-sm text-[#c9d1d9] leading-relaxed">
          <p><em>Minuta inicial — revise com um advogado antes de publicar oficialmente. Preencha razão social, CNPJ/CPF, endereço e foro antes de usar em produção.</em></p>

          <section>
            <h2 className="text-base font-semibold text-white mb-1">1. O serviço</h2>
            <p>O Ritmo é uma plataforma de produtividade, hábitos e organização financeira pessoal. Todo novo cadastro recebe 7 dias de teste gratuito; após esse período, o acesso às ferramentas principais depende de assinatura ativa no plano mensal de R$ 39,90.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-1">2. Cadastro e conta</h2>
            <p>Você é responsável por manter a confidencialidade da sua senha e por todas as atividades realizadas na sua conta. Informe dados verdadeiros no cadastro.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-1">3. Assinatura, cobrança e cancelamento</h2>
            <p>A assinatura custa R$ 39,90 por período de 30 dias e é paga manualmente, por Pix ou cartão de crédito, a cada ciclo — não há cobrança automática recorrente no cartão. Enviamos lembretes por e-mail antes do vencimento; se o pagamento não for feito, o acesso às ferramentas é pausado, e os dados permanecem guardados. Você pode cancelar a qualquer momento pelo app, sem multa; o acesso continua até o fim do período já pago. Em compras feitas pela internet, você tem direito de arrependimento em até 7 dias corridos a partir da contratação, conforme o art. 49 do Código de Defesa do Consumidor (Lei 8.078/1990), com reembolso integral quando aplicável.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-1">4. Programa de afiliados</h2>
            <p>Usuários podem indicar o Ritmo por um link próprio e receber comissão recorrente de 60% sobre o valor líquido de cada assinatura paga confirmada, enquanto essa assinatura estiver ativa. Comissões são contabilizadas somente após a confirmação do pagamento; estornos, reembolsos ou cancelamentos cancelam ou revertem a comissão correspondente. Não há promessa de renda ou resultado garantido.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-1">5. Avisos importantes</h2>
            <p>O Ritmo não substitui aconselhamento médico, psicológico ou financeiro profissional. O módulo financeiro é uma ferramenta de organização pessoal, não consultoria de investimentos.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-1">6. Rescisão</h2>
            <p>Podemos suspender ou encerrar contas que violem estes termos, com aviso prévio sempre que possível.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-1">7. Contato</h2>
            <p>Dúvidas sobre estes termos: [preencher e-mail de suporte/contato].</p>
          </section>
        </div>
      </div>
    </div>
  );
}
