import React, { useEffect, useRef, useState } from 'react';
import { COMMISSION_DIRECT_PERCENT, COMMISSION_NETWORK_PERCENT, MAX_COMMISSION_LEVELS, DIRECT_EXAMPLE_BRL } from '../lib/commission-plan.js';
import {
  X, ArrowRight, ArrowLeft, Check, Sparkles, Target, Map as MapIcon, Flame, Calendar, Clock,
  BookOpen, DollarSign, Share2, Rocket,
} from 'lucide-react';

// Apresentação guiada do app: abre no primeiro login e pode ser reaberta pelo botão "Como usar".
// Cada passo explica uma área e leva direto para ela. Navegação por teclado: ← → e Esc.

interface TourStep {
  icon: React.ElementType;
  title: string;
  text: string;
  bullets: string[];
  tab?: string; // aba que o botão "Abrir" leva
  action?: 'cycle'; // abre a criação de ciclo
  cta?: string;
}

interface WelcomeTourProps {
  isOpen: boolean;
  userName?: string;
  trialDaysLeft?: number | null; // só quando está em teste grátis
  hasCycle: boolean;
  onClose: () => void;
  onNavigate: (tabId: string) => void;
  onStartCycle: () => void;
}

export const WelcomeTour: React.FC<WelcomeTourProps> = ({
  isOpen,
  userName,
  trialDaysLeft,
  hasCycle,
  onClose,
  onNavigate,
  onStartCycle,
}) => {
  const [index, setIndex] = useState(0);
  const primaryRef = useRef<HTMLButtonElement>(null);
  const firstName = (userName || '').trim().split(' ')[0];

  const steps: TourStep[] = [
    {
      icon: Sparkles,
      title: firstName ? `Bem-vindo(a), ${firstName}!` : 'Bem-vindo(a) ao Ritmo!',
      text: 'Em cerca de 2 minutos você vê como usar cada parte do app. Dá para pular agora e rever quando quiser, no botão "Como usar".',
      bullets: [
        trialDaysLeft != null
          ? `Você tem ${trialDaysLeft} ${trialDaysLeft === 1 ? 'dia' : 'dias'} de teste grátis, sem cartão.`
          : 'Seu acesso está ativo.',
        'Tudo é seu: dados privados, exportáveis e que você pode apagar quando quiser.',
        'Sem cobrança nem culpa: um dia incompleto não é fracasso, é só um dia.',
      ],
    },
    {
      icon: Target,
      title: '1. Comece pelo seu ciclo de foco',
      text: 'O ciclo é o coração do Ritmo: um período com uma meta principal, para você ter direção.',
      bullets: [
        'Escolha a meta, a duração (7, 21, 40 ou 90 dias) e o nível de rotina (leve, equilibrado ou intensivo).',
        'Adicione metas secundárias e os hábitos que quer acompanhar.',
        'Dá para criar um novo ciclo quando o atual terminar.',
      ],
      action: 'cycle',
      cta: hasCycle ? 'Criar um novo ciclo' : 'Criar meu primeiro ciclo',
    },
    {
      icon: MapIcon,
      title: '2. Seu roteiro de metas',
      text: 'Ao criar o ciclo, o Ritmo monta um roteiro com marcos nos dias certos, do começo até a revisão final.',
      bullets: [
        'Marque cada marco como concluído quando chegar lá.',
        'Edite, adicione ou apague marcos: o roteiro é seu.',
        'Passou da data? Sem problema, é só ajustar o dia e seguir.',
      ],
      tab: 'roteiro',
      cta: 'Abrir o Roteiro',
    },
    {
      icon: Flame,
      title: '3. "Hoje" é o seu painel diário',
      text: 'Abra por aqui todo dia. É a tela que mostra o que importa agora.',
      bullets: [
        'Dia atual do ciclo, progresso e a meta em destaque.',
        'Tarefas e hábitos de hoje, com um toque para concluir.',
        'Início rápido de uma sessão de foco e resumo financeiro do mês.',
      ],
      tab: 'hoje',
      cta: 'Ir para Hoje',
    },
    {
      icon: Calendar,
      title: '4. Rotina, tarefas e quadros',
      text: 'Organize o que precisa ser feito, do jeito que preferir.',
      bullets: [
        'Rotina & Tarefas: horário, prioridade, categoria, repetição e reagendamento sem perder o histórico.',
        'Quadros: Kanban com colunas, prazos, checklist e comentários. Arraste os cartões ou use os botões.',
        'Use as tarefas para o dia a dia e os quadros para projetos maiores.',
      ],
      tab: 'rotina',
      cta: 'Abrir Rotina & Tarefas',
    },
    {
      icon: Clock,
      title: '5. Hábitos e sessões de foco',
      text: 'Constância vem de pequenos passos repetidos, e de tempo protegido para o que importa.',
      bullets: [
        'Hábitos: treino, leitura, sono, água, tempo sem redes. Você define a meta de cada um.',
        'Foco: temporizador 25/5, 50/10 ou personalizado, com o tempo focado registrado.',
        'O app não dá recomendação médica nem impõe metas de saúde: você decide.',
      ],
      tab: 'habitos',
      cta: 'Abrir Hábitos',
    },
    {
      icon: BookOpen,
      title: '6. Diário e progresso',
      text: 'Entender o que funciona vale mais do que se cobrar.',
      bullets: [
        'Diário: check-in de energia, humor e foco em poucos segundos, e a revisão semanal.',
        'Progresso: calendário de consistência, gráficos simples e histórico de ciclos.',
        'Sem ranking e sem comparação com outras pessoas.',
      ],
      tab: 'diario',
      cta: 'Abrir o Diário',
    },
    {
      icon: DollarSign,
      title: '7. Finanças pessoais',
      text: 'Veja para onde vai o seu dinheiro, em reais, sem complicação.',
      bullets: [
        'Registre receitas e despesas, parcelas, contas a pagar e orçamento por categoria.',
        'Filtre por período e exporte em CSV.',
        'Opcional: registrar gastos pelo WhatsApp e sincronizar com uma planilha.',
        'É uma ferramenta de organização, não consultoria financeira.',
      ],
      tab: 'financas',
      cta: 'Abrir Finanças',
    },
    {
      icon: Share2,
      title: `8. Indique e ganhe ${COMMISSION_DIRECT_PERCENT}%`,
      text: 'Cada pessoa tem um link próprio de indicação.',
      bullets: [
        `Quando alguém assina pelo seu link, você recebe ${COMMISSION_DIRECT_PERCENT}% de cada pagamento (${DIRECT_EXAMPLE_BRL} por mês) e mais até ${COMMISSION_NETWORK_PERCENT}% quando sua rede indica outras pessoas, até o ${MAX_COMMISSION_LEVELS}º nível.`,
        'Acompanhe cliques, cadastros e comissões, e peça o saque por Pix.',
        'Não há promessa de renda: o resultado depende das suas indicações.',
      ],
      tab: 'afiliados',
      cta: 'Ver meu link',
    },
    {
      icon: Rocket,
      title: 'Tudo pronto! Seu dia em 3 passos',
      text: 'Um ritmo simples para começar hoje mesmo:',
      bullets: [
        'Abra "Hoje" e veja o próximo passo.',
        'Faça uma sessão de foco na tarefa mais importante.',
        'Feche o dia com o check-in no Diário.',
        'Dica: instale o Ritmo no celular pelo menu do navegador ("Instalar app" ou "Adicionar à tela inicial").',
      ],
      action: hasCycle ? undefined : 'cycle',
      tab: hasCycle ? 'hoje' : undefined,
      cta: hasCycle ? 'Começar a usar' : 'Criar meu primeiro ciclo',
    },
  ];

  const last = steps.length - 1;
  const step = steps[index];

  // Sempre abre no primeiro passo
  useEffect(() => {
    if (isOpen) setIndex(0);
  }, [isOpen]);

  // Teclado: Esc fecha, setas navegam
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(last, i + 1));
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, last, onClose]);

  useEffect(() => {
    if (isOpen) primaryRef.current?.focus();
  }, [index, isOpen]);

  if (!isOpen) return null;

  const Icon = step.icon;

  const runCta = () => {
    if (step.action === 'cycle') onStartCycle();
    else if (step.tab) onNavigate(step.tab);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        className="bg-[#161b22] border border-[#30363d] sm:rounded-3xl rounded-t-3xl w-full max-w-lg shadow-2xl max-h-[94vh] overflow-y-auto"
      >
        {/* Topo: progresso + fechar */}
        <div className="sticky top-0 bg-[#161b22] px-5 pt-4 pb-3 border-b border-[#30363d]">
          <div className="flex items-center justify-between text-xs text-[#8b949e] mb-2">
            <span>Passo {index + 1} de {steps.length}</span>
            <button onClick={onClose} className="flex items-center gap-1 hover:text-[#f0f6fc]" aria-label="Pular apresentação">
              Pular <X className="w-4 h-4" />
            </button>
          </div>
          <div className="h-1.5 rounded-full bg-[#21262d] overflow-hidden">
            <div className="h-full bg-emerald-500 transition-all" style={{ width: `${((index + 1) / steps.length) * 100}%` }} />
          </div>
        </div>

        {/* Conteúdo */}
        <div className="px-5 py-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/20">
            <Icon className="w-7 h-7 text-white" />
          </div>
          <h2 id="tour-title" className="text-xl font-extrabold text-[#f0f6fc]">{step.title}</h2>
          <p className="mt-2 text-sm text-[#8b949e] leading-relaxed">{step.text}</p>
          <ul className="mt-4 space-y-2.5">
            {step.bullets.map((b) => (
              <li key={b} className="flex items-start gap-2.5 text-sm text-[#c9d1d9]">
                <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <span>{b}</span>
              </li>
            ))}
          </ul>

          {step.cta && (
            <button
              onClick={runCta}
              className="mt-5 w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2"
            >
              {step.cta} <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Rodapé: navegação */}
        <div className="px-5 pb-5 flex items-center justify-between gap-3">
          <button
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm text-[#8b949e] hover:text-[#f0f6fc] disabled:opacity-30"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>

          <div className="flex items-center gap-1.5" aria-hidden>
            {steps.map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all ${i === index ? 'w-5 bg-emerald-400' : 'w-1.5 bg-[#30363d]'}`} />
            ))}
          </div>

          {index < last ? (
            <button
              ref={primaryRef}
              onClick={() => setIndex((i) => Math.min(last, i + 1))}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-sm font-semibold text-[#f0f6fc]"
            >
              Próximo <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              ref={primaryRef}
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-sm font-semibold text-[#f0f6fc]"
            >
              Concluir
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
