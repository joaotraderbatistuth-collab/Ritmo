// Modo ajuda de configuração — passos e regras PURAS (sem React), testadas em tests/.
// O guia leva a pessoa por todas as abas, uma de cada vez, dizendo o que configurar em cada uma.

export interface GuideStep {
  id: string;
  /** id da aba do app (o mesmo de NAV_ITEMS em routes/app.tsx). */
  tab: string;
  title: string;
  intro: string;
  /** O que fazer nesta aba, em ordem. */
  tasks: string[];
  action?: { id: 'open_cycle'; label: string };
}

export const GUIDE_STEPS: GuideStep[] = [
  {
    id: 'hoje',
    tab: 'hoje',
    title: 'Sua tela inicial',
    intro: 'Aqui você vê o dia de relance. Ela é sua: dá para mudar a ordem e escolher o que aparece.',
    tasks: ['Toque em “Personalizar”, arraste ou use as setas para organizar os cards.', 'Adicione do catálogo o que fizer sentido, como Metas pessoais e Produtividade da semana.', 'Escolha um hábito no card “Não Quebre a Corrente”.'],
  },
  {
    id: 'roteiro',
    tab: 'roteiro',
    title: 'Roteiro de Metas',
    intro: 'Tudo começa com uma meta clara. O Ritmo transforma ela em marcos ao longo do ciclo.',
    tasks: ['Defina sua meta principal em uma frase.', 'Escolha a duração do ciclo e o ritmo que cabe na sua rotina.', 'Confira os marcos que o roteiro criou.'],
    action: { id: 'open_cycle', label: 'Definir minha meta agora' },
  },
  {
    id: 'rotina',
    tab: 'rotina',
    title: 'Rotina & Tarefas',
    intro: 'Organize o que precisa acontecer em cada dia.',
    tasks: ['Crie sua primeira tarefa.', 'Escolha o horário em 24 horas (hora e minuto).', 'Marque a tarefa como feita quando concluir, para ver o progresso do dia.'],
  },
  {
    id: 'quadros',
    tab: 'quadros',
    title: 'Quadros',
    intro: 'Para projetos com várias etapas, como um quadro Kanban.',
    tasks: ['Crie um quadro para um projeto seu.', 'Adicione um cartão e abra ele.', 'No checklist do cartão, escreva uma etapa e toque em “Adicionar”. O cartão mostra “2 de 3 etapas concluídas”.'],
  },
  {
    id: 'habitos',
    tab: 'habitos',
    title: 'Hábitos & Saúde',
    intro: 'Aqui nasce a corrente: ela conta semanas cumpridas pela sua meta, não dias seguidos.',
    tasks: ['Crie um hábito que você realmente consegue cumprir.', 'Escolha a frequência: 3 vezes por semana, 5 vezes ou todos os dias.', 'Marque o dia de hoje e volte à tela inicial para ver a corrente.'],
  },
  {
    id: 'foco',
    tab: 'foco',
    title: 'Sessões de Foco',
    intro: 'Blocos de tempo com um objetivo só, sem distração.',
    tasks: ['Escreva o objetivo da sessão.', 'Escolha o tempo do bloco e inicie.', 'Ao terminar, o tempo focado fica registrado no seu dia.'],
  },
  {
    id: 'diario',
    tab: 'diario',
    title: 'Diário & Revisões',
    intro: 'Trinta segundos por dia para enxergar o que funciona.',
    tasks: ['Dê notas de 1 a 5 para energia, humor e foco.', 'Responda as duas perguntas da Reflexão do dia.', 'No fim da semana, use a revisão semanal: ela mostra as suas respostas dos últimos 7 dias.'],
  },
  {
    id: 'financas',
    tab: 'financas',
    title: 'Finanças Pessoais',
    intro: 'Dê endereço ao seu dinheiro.',
    tasks: ['Lance suas receitas e algumas despesas recentes.', 'Cadastre contas a vencer e parcelas.', 'Defina um orçamento por categoria para acompanhar o mês.'],
  },
  {
    id: 'afiliados',
    tab: 'afiliados',
    title: 'Indique e Ganhe',
    intro: 'Seu link de indicação gera comissão recorrente sobre pagamentos confirmados. Não há ganho garantido.',
    tasks: [
      'Copie o seu link de indicação.',
      'Na seção “Receber (Pix)”, cadastre sua chave Pix. Saques são pedidos até quarta-feira, 23:59, e pagos na quinta e na sexta.',
      'Na seção “Material de divulgação”, baixe os modelos de story.',
      'Leia o mini curso de 5 minutos.',
    ],
  },
  {
    id: 'feed',
    tab: 'feed',
    title: 'Feed e Ritus',
    intro: 'O Feed é a sua rede social dentro do Ritmo: compartilhe conquistas, acompanhe a comunidade e assine Ritus com conteúdo exclusivo. Nada é publicado sozinho: você escolhe.',
    tasks: [
      'No Feed, escolha uma conquista sua (corrente, foco, tarefas ou meta) e toque em “Publicar”.',
      'Na sub-aba Achar Ritus, veja os mais acessados ou pesquise por tema e assine o que fizer sentido para você.',
      'Se você é professor, personal ou mentor, crie o seu Ritus em Meus Ritus: defina o preço, descreva o serviço e publique conteúdo exclusivo para assinantes. A plataforma retém 40% de cada venda.',
    ],
  },
  {
    id: 'progresso',
    tab: 'progresso',
    title: 'Progresso',
    intro: 'O histórico dos seus ciclos e conquistas.',
    tasks: ['Veja seus marcos e conquistas.', 'Acompanhe o andamento do ciclo atual.', 'Aqui também ficam as opções de privacidade e exclusão de dados.'],
  },
  {
    id: 'configuracoes',
    tab: 'configuracoes',
    title: 'Configurações',
    intro: 'Últimos ajustes: deixe o Ritmo com a sua cara.',
    tasks: ['Escolha o tema visual (escuro ou claro).', 'Confira seu perfil e o fuso horário.', 'Ative os lembretes que quiser receber.', 'Pronto: depois deste passo você concluiu a configuração. Dá para reabrir o modo ajuda a qualquer momento.'],
  },
];

export type GuideStatus = 'open' | 'skipped' | 'done';

export interface GuideState {
  status: GuideStatus;
  step: number;
}

export function parseGuideState(raw: string | null | undefined): GuideState | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw);
    if (!v || !['open', 'skipped', 'done'].includes(v.status)) return null;
    const step = Number.isInteger(v.step) ? Math.min(Math.max(v.step, 0), GUIDE_STEPS.length - 1) : 0;
    return { status: v.status, step };
  } catch {
    return null;
  }
}

/**
 * O guia abre sozinho no primeiro acesso: só para quem nunca interagiu com ele e tem conta recente
 * (até 14 dias). Quem já tinha conta antes do guia existir pode abri-lo pelo botão "Modo ajuda".
 */
export function shouldAutoStartGuide(state: GuideState | null, accountCreatedAt?: string | null, now: Date = new Date()): boolean {
  if (state) return false;
  if (!accountCreatedAt) return true;
  const created = new Date(accountCreatedAt).getTime();
  if (Number.isNaN(created)) return true;
  return now.getTime() - created <= 14 * 86400000;
}
