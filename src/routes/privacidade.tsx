import { createFileRoute, Link } from '@tanstack/react-router';

export const Route = createFileRoute('/privacidade')({
  component: PrivacidadePage,
});

function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-[#0d1117] text-[#f0f6fc]">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Link to="/" className="text-sm text-emerald-400 hover:underline">← Voltar</Link>
        <h1 className="text-2xl font-bold mt-4 mb-6">Política de Privacidade — Ritmo</h1>
        <div className="space-y-5 text-sm text-[#c9d1d9] leading-relaxed">
          <p><em>Minuta inicial baseada na LGPD (Lei 13.709/2018) — revise com um advogado e preencha os campos indicados antes de publicar.</em></p>

          <section>
            <h2 className="text-base font-semibold text-white mb-1">1. Dados que coletamos</h2>
            <p>Dados de cadastro (nome, e-mail, senha com hash), dados de uso do app (tarefas, hábitos, quadros, sessões de foco, diário, lançamentos financeiros), dados de pagamento processados pelo Mercado Pago (não armazenamos número de cartão), e dados técnicos básicos de acesso.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-1">2. Finalidade do uso</h2>
            <p>Fornecer e melhorar o serviço, processar pagamentos e comissões de afiliados, enviar e-mails transacionais (recuperação de senha, confirmação de pagamento) e cumprir obrigações legais.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-1">3. Compartilhamento</h2>
            <p>Compartilhamos dados estritamente necessários com o Mercado Pago (pagamentos) e com o Resend (envio de e-mail transacional). Não vendemos dados pessoais a terceiros.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-1">4. Seus direitos (LGPD)</h2>
            <p>Você pode solicitar a qualquer momento a confirmação, acesso, correção, exclusão ou portabilidade dos seus dados, e revogar consentimentos. Para exercer esses direitos: [preencher e-mail/canal do encarregado de dados (DPO)].</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-1">5. Segurança</h2>
            <p>Senhas são armazenadas com hash (nunca em texto puro). Dados financeiros ficam isolados por usuário e protegidos no servidor, não apenas na interface.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-1">6. Retenção e exclusão</h2>
            <p>Você pode excluir sua conta e todos os seus dados a qualquer momento pelo próprio app, em Perfil.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-1">7. Contato</h2>
            <p>Encarregado de dados (DPO) / contato de privacidade: [preencher].</p>
          </section>
        </div>
      </div>
    </div>
  );
}
