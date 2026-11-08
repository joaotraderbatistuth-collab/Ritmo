import { createFileRoute, Link } from '@tanstack/react-router';
import { LEGAL_INFO } from '../lib/legal-info.js';
import { LEGAL_VERSION } from '../lib/consent-rules.js';

export const Route = createFileRoute('/privacidade')({
  component: PrivacidadePage,
});

const H = ({ children }: { children: React.ReactNode }) => <h2 className="text-base font-semibold text-white mb-1">{children}</h2>;

function PrivacidadePage() {
  const v = LEGAL_VERSION.split('-').reverse().join('/');
  return (
    <div className="min-h-screen bg-[#0d1117] text-[#f0f6fc]">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <Link to="/" className="text-sm text-emerald-400 hover:underline">← Voltar</Link>
        <h1 className="text-2xl font-bold mt-4 mb-1">Política de Privacidade — Ritmo</h1>
        <p className="text-xs text-[#8b949e] mb-6">Versão de {v}. Feita com base na Lei Geral de Proteção de Dados (Lei 13.709/2018).</p>
        <div className="space-y-5 text-sm text-[#c9d1d9] leading-relaxed">
          <section>
            <H>1. Quem cuida dos seus dados</H>
            <p>O controlador dos dados é {LEGAL_INFO.controller}, {LEGAL_INFO.document}, {LEGAL_INFO.address}. Contato do encarregado de dados (privacidade): {LEGAL_INFO.contactEmail}.</p>
          </section>

          <section>
            <H>2. Dados que coletamos e por quê</H>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong>Cadastro:</strong> nome, e-mail, senha (guardada só como hash, nunca em texto), fuso horário. Para criar e proteger sua conta.</li>
              <li><strong>Organização:</strong> metas, tarefas, compromissos, quadros, sessões de foco, lembretes. Para o app funcionar.</li>
              <li><strong>Finanças pessoais:</strong> lançamentos, orçamentos e contas que você registrar. Só para você organizar seu dinheiro.</li>
              <li><strong>Bem-estar (dados que podem ser sensíveis):</strong> hábitos, treinos, diário e humor. Tratados com o seu consentimento específico, só para o app funcionar para você (progresso, lembretes, pontos).</li>
              <li><strong>Localização (GPS):</strong> lida somente durante um treino que você iniciar, depois de você permitir. Guardamos a rota do treino na sua conta.</li>
              <li><strong>Voz:</strong> ao tocar no microfone, o seu navegador (Google, no Chrome; Apple, no Safari) transforma a fala em texto. O Ritmo recebe só o texto e não grava áudio.</li>
              <li><strong>Pesquisa de gostos (opcional):</strong> faixa de idade, como você se identifica, estado, ocupação, faixa de renda, atividades físicas, estilos de música, objetivos, interesses e melhor horário. Com o seu consentimento, para entender o público e personalizar conteúdos (inclusive com análises estatísticas e modelos de recomendação feitos pelo próprio Ritmo). Nunca aparecem para outras pessoas nem são vendidas; você pode mudar ou apagar em Configurações.</li>
                            <li><strong>Perfil e comunidade:</strong> foto, bio, nível, pontos, publicações, comentários e curtidas no Feed e nos Ritus.</li>
              <li><strong>Pagamentos e afiliados:</strong> histórico de assinaturas e pagamentos (processados pelo Mercado Pago; não guardamos número de cartão), indicações, comissões e chave Pix para saques.</li>
              <li><strong>Notificações:</strong> o endereço técnico do aparelho que você autorizar a receber lembretes.</li>
              <li><strong>Técnicos:</strong> registros de erros e de acesso necessários para segurança e para corrigir falhas.</li>
            </ul>
          </section>

          <section>
            <H>3. Bases legais</H>
            <p>Execução do contrato (para prestar o serviço que você contratou), consentimento (dados de bem-estar, localização, voz, notificações e pesquisa de gostos), cumprimento de obrigação legal (registros fiscais e de pagamento) e legítimo interesse (segurança, prevenção de fraudes e melhoria do serviço, sempre respeitando seus direitos).</p>
          </section>

          <section>
            <H>4. O que outras pessoas veem</H>
            <p>Nada é publicado automaticamente. No Feed e nos Ritus, outros membros veem só o que você publicar, além do seu perfil público: primeiro nome e inicial do sobrenome, foto, bio, nível e pontos. Hábitos, finanças, diário, lembretes e treinos não compartilhados nunca aparecem para outras pessoas. Ao compartilhar um treino, você pode esconder os primeiros e os últimos 200 metros da rota (opção ligada por padrão).</p>
          </section>

          <section>
            <H>5. Com quem compartilhamos</H>
            <p>Somente com fornecedores necessários para o serviço funcionar, que tratam os dados em nosso nome: Netlify (hospedagem e banco de dados), Mercado Pago (pagamentos), Resend (e-mails como recuperação de senha), serviços de notificação do seu aparelho (Google, Apple ou Mozilla), serviços de mapa (CARTO e OpenStreetMap, que recebem a região do mapa exibida) e o serviço de voz do seu navegador. Integrações que você ligar por conta própria (Google Planilhas, WhatsApp) recebem os dados necessários para funcionar. Alguns desses fornecedores podem guardar dados fora do Brasil, com as garantias previstas na LGPD. Não vendemos dados pessoais.</p>
          </section>

          <section>
            <H>6. Seus direitos</H>
            <p>Você pode, a qualquer momento: confirmar e acessar seus dados; corrigir dados; <strong>baixar todos os seus dados</strong> (Configurações → Privacidade → Baixar todos os meus dados); revogar permissões de localização e voz (Configurações → Privacidade); e <strong>excluir sua conta e todos os dados</strong> (Progresso → Excluir conta). Para outros pedidos ou reclamações, escreva para {LEGAL_INFO.contactEmail}. Você também pode recorrer à Autoridade Nacional de Proteção de Dados (ANPD).</p>
          </section>

          <section>
            <H>7. Segurança</H>
            <p>Senhas com hash, conexão criptografada (HTTPS), dados isolados por conta e conferidos no servidor, limite de tentativas de login e acesso restrito ao painel administrativo. Nenhum sistema é 100% invulnerável; se houver incidente que traga risco relevante, avisaremos você e a ANPD.</p>
          </section>

          <section>
            <H>8. Por quanto tempo guardamos</H>
            <p>Enquanto sua conta existir. Ao excluir a conta, apagamos seus dados, exceto os que a lei exige guardar por mais tempo (por exemplo, registros de pagamento para fins fiscais), que ficam só pelo prazo legal.</p>
          </section>

          <section>
            <H>9. Idade mínima</H>
            <p>O Ritmo é destinado a pessoas com 18 anos ou mais.</p>
          </section>

          <section>
            <H>10. Mudanças nesta política</H>
            <p>Se esta política mudar, avisaremos no app e pediremos sua concordância antes de continuar.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
