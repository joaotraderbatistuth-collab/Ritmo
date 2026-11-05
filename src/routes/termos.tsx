import { createFileRoute, Link } from '@tanstack/react-router';
import { LEGAL_INFO } from '../lib/legal-info.js';
import { LEGAL_VERSION } from '../lib/consent-rules.js';
import { COMMISSION_DIRECT_PERCENT, COMMISSION_LEVELS_TEXT, COMMISSION_NETWORK_PERCENT, COMMISSION_TOTAL_PERCENT, MAX_COMMISSION_LEVELS } from '../lib/commission-plan.js';

export const Route = createFileRoute('/termos')({
  component: TermosPage,
});

function TermosPage() {
  return (
    <div className="min-h-screen bg-[#0d1117] text-[#f0f6fc]">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Link to="/" className="text-sm text-emerald-400 hover:underline">← Voltar</Link>
        <h1 className="text-2xl font-bold mt-4 mb-1">Termos de Uso — Ritmo</h1>
        <p className="text-xs text-[#8b949e] mb-6">Versão de {LEGAL_VERSION.split('-').reverse().join('/')}. Fornecedor: {LEGAL_INFO.controller}, {LEGAL_INFO.document}.</p>
        <div className="space-y-5 text-sm text-[#c9d1d9] leading-relaxed">

          <section>
            <h2 className="text-base font-semibold text-white mb-1">1. O serviço</h2>
            <p>O Ritmo é uma plataforma de produtividade, hábitos e organização financeira pessoal. Todo novo cadastro recebe 7 dias de teste gratuito; após esse período, o acesso às ferramentas principais depende de assinatura ativa no plano mensal de R$ 39,90.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-1">2. Cadastro e conta</h2>
            <p>O Ritmo é para pessoas com 18 anos ou mais. Você é responsável por manter a confidencialidade da sua senha e por todas as atividades realizadas na sua conta. Informe dados verdadeiros no cadastro.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-1">3. Assinatura, cobrança e cancelamento</h2>
            <p>A assinatura custa R$ 39,90 por período de 30 dias e é paga manualmente, por Pix ou cartão de crédito, a cada ciclo — não há cobrança automática recorrente no cartão. Enviamos lembretes por e-mail antes do vencimento; se o pagamento não for feito, o acesso às ferramentas é pausado, e os dados permanecem guardados. Você pode cancelar a qualquer momento pelo app, sem multa; o acesso continua até o fim do período já pago. Em compras feitas pela internet, você tem direito de arrependimento em até 7 dias corridos a partir da contratação, conforme o art. 49 do Código de Defesa do Consumidor (Lei 8.078/1990), com reembolso integral quando aplicável.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-1">4. Programa de afiliados</h2>
            <p>Usuários podem indicar o Ritmo por um link próprio e receber comissão recorrente sobre o valor líquido de cada assinatura paga confirmada, enquanto essa assinatura estiver ativa: {COMMISSION_DIRECT_PERCENT}% para quem indica diretamente (nível 1) e mais até {COMMISSION_NETWORK_PERCENT}% distribuídos pela rede de indicações até o {MAX_COMMISSION_LEVELS}º nível ({COMMISSION_LEVELS_TEXT}), no máximo {COMMISSION_TOTAL_PERCENT}% de cada pagamento. Comissões são contabilizadas somente após a confirmação do pagamento; estornos, reembolsos ou cancelamentos cancelam ou revertem a comissão correspondente. Não há promessa de renda ou resultado garantido.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-1">5. Feed e Ritus</h2>
            <p>O Feed é um espaço de convivência entre usuários. Você só compartilha o que escolher publicar: nenhuma conquista é publicada automaticamente. Os demais usuários veem seu primeiro nome e a inicial do sobrenome. Você é responsável pelo que publica e comenta. É proibido publicar conteúdo ilegal, ofensivo, discriminatório, sexual, enganoso, spam ou dados de outras pessoas sem autorização. Podemos esconder ou excluir conteúdo, silenciar usuários e suspender Ritus que violem estes termos, inclusive após denúncias de outros usuários.</p>
            <p>Qualquer usuário pode criar um Ritus (espaço de conteúdo por assinatura), definir o preço, descrever o serviço e publicar conteúdo exclusivo para os assinantes. Ritus públicos aparecem na vitrine "Achar Ritus", ordenados por número de acessos. A plataforma retém 40% do valor de cada venda e o criador recebe o restante, em saldo sacado por Pix conforme o ciclo semanal de pagamentos. Reembolso ou contestação de um pagamento desfaz o repasse correspondente e remove o acesso comprado. O criador é responsável pelo conteúdo, por suas obrigações fiscais e pelas exigências da sua atividade profissional, e não deve prometer resultados de saúde, financeiros ou de qualquer outra natureza. Quem se cadastra no Ritmo pelo link de indicação do criador pode ter acesso incluso, se o criador permitir. Pedidos de reembolso feitos dentro do prazo legal serão analisados.</p>
          </section>
          <section>
            <h2 className="text-base font-semibold text-white mb-1">6. Perfil, pontos, níveis e missões</h2>
            <p>Seu perfil público mostra primeiro nome e inicial do sobrenome, foto, bio, nível e pontos. Pontos, níveis, molduras, missões, baús, ofensivas e ligas são recursos de motivação dentro do app: não têm valor em dinheiro, não podem ser trocados, vendidos ou sacados, e suas regras podem ser ajustadas para manter o equilíbrio do jogo. Tentativas de burlar a contagem podem levar à correção dos pontos.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-1">7. Treinos com GPS</h2>
            <p>As medições de distância, ritmo, velocidade e subida dependem do GPS do seu aparelho e podem ter erros. Treine com segurança: respeite o trânsito e as regras de circulação, não mexa no celular enquanto pedala ou corre em vias públicas e consulte um profissional de saúde antes de começar uma atividade física nova. Cuidado ao compartilhar rotas: a opção de esconder o começo e o fim vem ligada por padrão.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-1">8. Secretário por voz e lembretes</h2>
            <p>O secretário entende pedidos falados ou escritos e pode lançar gastos, criar compromissos, tarefas e lembretes por você. Confira o que ele registrou (cada ação tem a opção Desfazer). Lembretes dependem das notificações do aparelho, da internet e do navegador; não use o Ritmo como único aviso para compromissos críticos, como remédios ou prazos legais.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-1">9. Avisos importantes</h2>
            <p>O Ritmo não substitui aconselhamento médico, psicológico ou financeiro profissional. O módulo financeiro é uma ferramenta de organização pessoal, não consultoria de investimentos.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-1">10. Seus dados</h2>
            <p>O uso dos seus dados segue a <a href="/privacidade" className="text-emerald-400 hover:underline">Política de Privacidade</a>. Você pode baixar seus dados e excluir sua conta a qualquer momento pelo app.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-1">11. Rescisão e mudanças</h2>
            <p>Podemos suspender ou encerrar contas que violem estes termos, com aviso prévio sempre que possível. Se estes termos mudarem, avisaremos no app e pediremos sua concordância antes de continuar.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-1">12. Contato e foro</h2>
            <p>Dúvidas e suporte: {LEGAL_INFO.contactEmail}. Fica eleito o foro do domicílio do consumidor, conforme o Código de Defesa do Consumidor; para quem não é consumidor, o foro de {LEGAL_INFO.forum}.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
