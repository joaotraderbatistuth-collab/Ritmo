import { createFileRoute, Link } from '@tanstack/react-router';
import { useState } from 'react';
import {
  Flame,
  CheckCircle2,
  Calendar,
  Clock,
  Sparkles,
  BookOpen,
  DollarSign,
  Smartphone,
  FileSpreadsheet,
  Share2,
  ShieldCheck,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Zap,
  Target,
  Heart,
  TrendingUp,
} from 'lucide-react';

export const Route = createFileRoute('/tutorial')({
  component: TutorialPage,
});

function TutorialPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const steps = [
    {
      title: '1. Crie seu Primeiro Ciclo de Foco',
      badge: 'Fundação',
      icon: Target,
      color: 'emerald',
      description:
        'Escolha a duração ideal para o seu momento: 7 dias (reset rápido), 21 dias (consolidação de rotina), 40 dias (foco intermediário) ou 90 dias (transformação profunda). Defina sua meta principal e limites digitais saudáveis sem exageros.',
      highlights: [
        'Metas claras e realizáveis sem pressão irrealista',
        'Nível de rotina: Leve, Equilibrado ou Intensivo',
        'Limites de tela sem bloqueios invasivos no celular',
      ],
      previewContent: {
        title: 'Ciclo de 40 Dias — Modo Caverna Equilibrado',
        meta: 'Meta: Finalizar projeto profissional e regularizar rotina matinal',
        status: 'Ativo • Dia 14 de 40',
      },
    },
    {
      title: '2. Organize Tarefas por Time-Blocking',
      badge: 'Produtividade',
      icon: Clock,
      color: 'amber',
      description:
        'Distribua suas prioridades em blocos temporais estratégicos: Manhã (energia máxima para tarefas cruciais), Tarde (execução e reuniões) e Noite (desaceleração e planejamento).',
      highlights: [
        'Divisão intuitiva em Manhã, Tarde, Noite e Flexível',
        'Estimativa de tempo em minutos para evitar sobrecarga',
        'Prioridades alta, média e baixa com marcação rápida de conclusão',
      ],
      previewContent: {
        title: 'Bloco da Manhã',
        meta: '08:00 • 50 min — Arquitetura de software e foco sem notificações',
        status: 'Prioridade Alta',
      },
    },
    {
      title: '3. Acompanhe Hábitos com Leveza e Saúde',
      badge: 'Constância',
      icon: Heart,
      color: 'rose',
      description:
        'Monitore hábitos fundamentais: exercício físico, hidratação, meditação, leitura e sono. O Ritmo inclui avisos de saúde para lembrar que descanso adequado e equilíbrio superam o esgotamento (burnout).',
      highlights: [
        'Matriz de consistência dos últimos 7 e 28 dias',
        'Alerta médico preventivo: sem dietas ou restrições extremas',
        'Comemoração de micro-vitórias diárias',
      ],
      previewContent: {
        title: 'Hábitos do Dia',
        meta: 'Hidratação 2L+, 30 min de caminhada e sono restaurador (7-8h)',
        status: '5/6 completados hoje',
      },
    },
    {
      title: '4. Domine suas Finanças Pessoais',
      badge: 'Controle Financeiro',
      icon: DollarSign,
      color: 'indigo',
      description:
        'Tenha controle total de despesas e receitas organizadas por categoria, carteira e forma de pagamento. Acompanhe orçamentos mensais com alertas visuais de limite.',
      highlights: [
        'Entradas, saídas e previsões de vencimento',
        'Orçamentos por categoria com barra de progresso em tempo real',
        'Exportação limpa em CSV compatível com Excel e Google Sheets',
      ],
      previewContent: {
        title: 'Painel Financeiro',
        meta: 'Saldo do mês: +R$ 1.840,00 • Orçamento de alimentação: 68% utilizado',
        status: 'Equilíbrio Financeiro Positivo',
      },
    },
    {
      title: '5. Automatize com WhatsApp e Planilhas',
      badge: 'Automação',
      icon: Smartphone,
      color: 'emerald',
      description:
        'Envie despesas diretamente pelo WhatsApp em português natural ("Gastei 42,50 no almoço") e nosso robô registra automaticamente. Seus dados podem ser sincronizados em tempo real com o Google Sheets.',
      highlights: [
        'Parser inteligente que entende gírias e valores brasileiros (ex: "80 conto")',
        'Sincronização bidirecional e backup transparente em nuvem',
        'Sem necessidade de abrir o aplicativo toda vez que fizer uma compra',
      ],
      previewContent: {
        title: 'Mensagem WhatsApp',
        meta: '"Paguei 120 de luz hoje no pix" ➔ Registrado em Moradia (R$ 120,00)',
        status: 'Conciliado e Sincronizado',
      },
    },
    {
      title: '6. Lucre 60% Indicando Novos Membros',
      badge: 'Afiliados & Renda',
      icon: Share2,
      color: 'amber',
      description:
        'Compartilhe seu link exclusivo com colegas e receba comissão recorrente de 60% (R$ 23,94/mês) por cada assinatura do plano de R$ 39,90. Resgate seus ganhos direto na sua conta via PIX.',
      highlights: [
        'Link de indicação exclusivo gerado no seu cadastro',
        'Comissão automática de 60% recorrente enquanto o indicado for assinante',
        'Solicitação de saque PIX simplificada com histórico completo',
      ],
      previewContent: {
        title: 'Programa de Afiliados Ritmo',
        meta: 'Saldo Disponível: R$ 143,64 (6 indicações ativas)',
        status: 'Saque PIX Disponível',
      },
    },
  ];

  const faqs = [
    {
      q: 'Como funciona o período de teste gratuito de 7 dias?',
      a: 'Assim que você cria sua conta no Ritmo, você recebe automaticamente 7 dias de acesso total e irrestrito a todas as ferramentas (Ciclos, Tarefas, Hábitos, Pomodoro, Finanças, WhatsApp e Afiliados). Não é necessário cadastrar cartão de crédito para iniciar o teste.',
    },
    {
      q: 'O que acontece quando o período de 7 dias expira?',
      a: 'Ao final dos 7 dias, suas informações continuam salvas com total segurança. Para continuar utilizando os módulos e sincronizando dados, basta ativar a assinatura do Ritmo PRO por R$ 39,90/mês. Você pode pagar via PIX ou Cartão de Crédito.',
    },
    {
      q: 'Como funciona a comissão de 60% no Sistema de Afiliados?',
      a: 'Cada usuário cadastrado possui um link de indicação único. Quando alguém assina o Ritmo PRO (R$ 39,90/mês) através do seu link, você recebe automaticamente 60% do valor (R$ 23,94) todos os meses enquanto a assinatura continuar ativa. O resgate é feito diretamente para a sua chave PIX.',
    },
    {
      q: 'O que diferencia o Ritmo de métodos extremos como o "Modo Caverna" tradicional?',
      a: 'O Ritmo valoriza a alta performance sustentável. Não incentivamos privação de sono, isolamento social excessivo ou culpa por tarefas incompletas. Focamos em clareza, limites saudáveis de tela e consistência realista a longo prazo.',
    },
    {
      q: 'Posso cancelar minha assinatura a qualquer momento?',
      a: 'Sim, a qualquer momento sem burocracia ou taxas de fidelidade. Você gerencia seu plano diretamente no seu painel de configurações ou checkout.',
    },
    {
      q: 'Meus dados financeiros e tarefas estão seguros?',
      a: 'Sim. Todas as conexões utilizam criptografia de ponta a ponta (HTTPS/TLS) e senhas com hash bcrypt. Você pode exportar todos os seus dados em CSV ou solicitar a exclusão definitiva a qualquer momento conforme as diretrizes da LGPD.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#f0f6fc]">
      {/* Top Navigation */}
      <header className="border-b border-[#30363d] bg-[#161b22]/90 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-900/30">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-white via-emerald-100 to-emerald-400 bg-clip-text text-transparent">
                Ritmo
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Guia & Tutorial
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <a
              href="/app"
              className="text-sm font-medium text-slate-300 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              Ir para o App
            </a>
            <Link
              to="/checkout"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Plano PRO (R$ 39,90)
            </Link>
            <a
              href="/login?modo=cadastro"
              className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02]"
            >
              Começar Agora
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24 border-b border-[#30363d]/60">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-emerald-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-medium mb-6 animate-pulse">
            <Zap className="w-3.5 h-3.5" />
            Guia Completo da Plataforma Ritmo
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
            Clareza mental, foco equilibrado e{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">
              suas finanças no lugar certo
            </span>
            .
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-3xl mx-auto mb-8 leading-relaxed">
            O Ritmo foi desenvolvido para quem busca alta produtividade sem cair nas armadilhas de exaustão e extremismos.
            Descubra como estruturar sua rotina com ciclos de foco, hábitos saudáveis e controle financeiro automático.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/login?modo=cadastro"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-base shadow-xl shadow-emerald-500/20 transition-all hover:scale-105"
            >
              <Sparkles className="w-5 h-5" />
              Começar agora — 7 Dias Grátis
            </a>
            <a
              href="#passo-a-passo"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-semibold text-base border border-slate-700 transition-colors"
            >
              Ver Passo a Passo
              <ChevronDown className="w-4 h-4" />
            </a>
          </div>

          {/* Quick Metrics highlight */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
            <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d]">
              <div className="text-emerald-400 font-bold text-xl">7 Dias</div>
              <div className="text-xs text-slate-400 mt-1">Trial gratuito com acesso a 100% dos recursos</div>
            </div>
            <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d]">
              <div className="text-amber-400 font-bold text-xl">R$ 39,90</div>
              <div className="text-xs text-slate-400 mt-1">Plano único mensal, sem taxas escondidas</div>
            </div>
            <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d]">
              <div className="text-teal-400 font-bold text-xl">60% Comissão</div>
              <div className="text-xs text-slate-400 mt-1">R$ 23,94/mês por indicação via PIX</div>
            </div>
            <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d]">
              <div className="text-indigo-400 font-bold text-xl">100% Ético</div>
              <div className="text-xs text-slate-400 mt-1">Produtividade saudável com alertas médicos</div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Step-by-Step Walkthrough */}
      <section id="passo-a-passo" className="py-16 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-4xl font-bold text-white mb-3">
            Como Funciona o Aplicativo: Passo a Passo
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
            Navegue pelos módulos abaixo para ver exatamente como transformar seus dias com o Ritmo.
          </p>
        </div>

        {/* Step Selector Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-8">
          {steps.map((st, idx) => {
            const Icon = st.icon;
            const isSelected = activeStep === idx;
            return (
              <button
                key={st.title}
                onClick={() => setActiveStep(idx)}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all ${
                  isSelected
                    ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 shadow-md shadow-emerald-950/40'
                    : 'bg-[#161b22] border-[#30363d] text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-5 h-5 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span className="text-xs font-semibold leading-tight">{st.badge}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Step Card */}
        {(() => {
          const cur = steps[activeStep];
          const CurIcon = cur.icon;
          return (
            <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 sm:p-8 shadow-xl">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-7">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-3">
                    Passo {activeStep + 1} de {steps.length} • {cur.badge}
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4 flex items-center gap-3">
                    <CurIcon className="w-7 h-7 text-emerald-400 flex-shrink-0" />
                    {cur.title}
                  </h3>
                  <p className="text-slate-300 text-base leading-relaxed mb-6">
                    {cur.description}
                  </p>

                  <div className="space-y-3 mb-6">
                    {cur.highlights.map((h, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-sm text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      disabled={activeStep === 0}
                      onClick={() => setActiveStep((prev) => Math.max(0, prev - 1))}
                      className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Anterior
                    </button>
                    <button
                      disabled={activeStep === steps.length - 1}
                      onClick={() => setActiveStep((prev) => Math.min(steps.length - 1, prev + 1))}
                      className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      Próximo Passo
                    </button>
                  </div>
                </div>

                {/* Visual Preview Box */}
                <div className="lg:col-span-5 bg-[#0d1117] border border-[#30363d] rounded-xl p-5 shadow-inner">
                  <div className="flex items-center justify-between pb-3 border-b border-[#30363d] mb-4">
                    <span className="text-xs font-medium text-slate-400">Visualização da Interface</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-medium">
                      Simulação
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="p-3.5 rounded-lg bg-[#161b22] border border-[#30363d]">
                      <div className="text-xs text-slate-400 mb-1">Módulo</div>
                      <div className="text-sm font-bold text-white">{cur.previewContent.title}</div>
                    </div>
                    <div className="p-3.5 rounded-lg bg-[#161b22] border border-[#30363d]">
                      <div className="text-xs text-slate-400 mb-1">Detalhes Operacionais</div>
                      <div className="text-xs text-slate-300 leading-relaxed">{cur.previewContent.meta}</div>
                    </div>
                    <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium flex items-center justify-between">
                      <span>Status do Registro:</span>
                      <span className="font-bold">{cur.previewContent.status}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </section>

      {/* Feature Pillars Grid */}
      <section className="py-16 bg-[#161b22]/50 border-t border-b border-[#30363d]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-4xl font-bold text-white mb-3">
              Tudo o que Você Precisa em um Único Lugar
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Projetado para substituir dezenas de ferramentas desconectadas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-[#161b22] border border-[#30363d] hover:border-emerald-500/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
                <Target className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Ciclos & Time-Blocking</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Metas com início e fim para manter seu foco aguçado sem perder a motivação com o passar dos meses.
              </p>
              <ul className="text-xs text-slate-300 space-y-1.5">
                <li>• Ciclos de 7, 21, 40 ou 90 dias</li>
                <li>• Blocos Manhã, Tarde e Noite</li>
                <li>• Estimativas realistas em minutos</li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-[#161b22] border border-[#30363d] hover:border-amber-500/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4">
                <DollarSign className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Gestão Financeira Sem Estresse</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Organize despesas, orçamentos e contas a pagar com suporte nativo a linguagem natural e WhatsApp.
              </p>
              <ul className="text-xs text-slate-300 space-y-1.5">
                <li>• Orçamentos por categorias</li>
                <li>• Exportação em CSV instantânea</li>
                <li>• Notificações de vencimento</li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl bg-[#161b22] border border-[#30363d] hover:border-indigo-500/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
                <Share2 className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Afiliados com 60% Recorrente</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Indique amigos e parceiros para o Ritmo e receba R$ 23,94 todos os meses por cada membro ativo via PIX.
              </p>
              <ul className="text-xs text-slate-300 space-y-1.5">
                <li>• Link exclusivo gerado na hora</li>
                <li>• Rastreamento transparente de cliques e vendas</li>
                <li>• Resgate rápido para sua chave PIX</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-semibold mb-2">
            <HelpCircle className="w-4 h-4" />
            Tire Suas Dúvidas
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Perguntas Frequentes sobre o Ritmo
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="rounded-xl border border-[#30363d] bg-[#161b22] overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-semibold text-white hover:text-emerald-400 transition-colors"
                >
                  <span className="text-sm sm:text-base">{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 text-sm text-slate-300 leading-relaxed border-t border-[#30363d]/60 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Prominent CTA Footer Banner */}
      <section className="py-16 bg-gradient-to-b from-[#161b22] to-[#0d1117] border-t border-[#30363d]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-950/50">
            <Flame className="w-8 h-8 text-white" />
          </div>

          <h2 className="text-2xl sm:text-4xl font-extrabold text-white mb-4">
            Pronto para ter total controle do seu dia?
          </h2>

          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto mb-8">
            Comece agora com seus 7 dias de acesso gratuito. Sem cadastrar cartão, sem burocracia, com clareza imediata.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/login?modo=cadastro"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-base shadow-xl shadow-emerald-500/25 transition-all hover:scale-105"
            >
              <Sparkles className="w-5 h-5" />
              Começar Agora — 7 Dias Grátis
            </a>
            <Link
              to="/checkout"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-base border border-slate-700 transition-colors"
            >
              Conhecer o Plano PRO (R$ 39,90)
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
