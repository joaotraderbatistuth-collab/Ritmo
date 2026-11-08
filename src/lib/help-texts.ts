// Textos do "Saber mais": o que é cada parte do Ritmo, como funciona e o que fazer.
// Linguagem simples, sem promessas e sem culpa. Ao mudar uma regra do jogo, atualize o texto aqui.

export interface HelpText {
  emoji: string;
  title: string;
  /** o que é, em uma ou duas frases */
  what: string;
  /** como funciona (regras) */
  how: string[];
  /** o que fazer agora */
  todo: string[];
  tip?: string;
}

export const HELP: Record<string, HelpText> = {
  /* ---------------- Progresso / jogo ---------------- */
  pontos: {
    emoji: '⚡',
    title: 'Pontos de Ritmo e níveis',
    what: 'Tudo o que você faz no Ritmo vale pontos. Os pontos sobem o seu nível, que muda a moldura da sua foto e o título no Feed.',
    how: [
      'Coisas simples valem pouco (curtir +1, planejar uma tarefa +2) e coisas que pedem mais esforço valem mais (hábito +10, check-in do diário +15, dia de treino +20, foco de 5 a 30).',
      'Cada tipo de ação tem um limite por dia. Fazer 40 tarefas num dia não vale mais que manter o ritmo vários dias.',
      'São 12 níveis, do Semente ao Lenda Eterna. As molduras vão de Simples a Lendária animada.',
      'Os pontos saem do que você fez de verdade: desmarcar um hábito tira os pontos dele.',
      'Voltou depois de 3 dias ou mais parado? Os pontos do dia valem em dobro (até +50).',
      'Em cerca de 2 a cada 3 dias sai um bônus surpresa em uma das suas ações.',
    ],
    todo: ['Toque em "Como ganhar pontos" no cartão de nível para ver a tabela completa.', 'Escolha uma meta de pontos do dia (30, 50, 80 ou 120).'],
    tip: 'Constância vale mais que intensidade: um pouco todo dia sobe o nível mais rápido do que um dia enorme.',
  },
  temporada: {
    emoji: '🏆',
    title: 'Temporada do mês',
    what: 'Uma competição mensal de pontos em divisões, do Bronze até a Lenda. Você disputa num grupo de até 30 pessoas da mesma divisão.',
    how: [
      'Todo mundo começa no Bronze. Os pontos da temporada são os pontos que você ganha no mês.',
      'No fim do mês, a parte de cima do grupo sobe de divisão e a de baixo desce. Quanto mais alta a divisão, mais disputado.',
      'A faixa verde do ranking mostra quem está subindo; a vermelha, quem está descendo.',
      'Só sobe quem fez pontos no mês. Um mês inteiro sem pontos desce uma divisão.',
      'Não quer competir? Dá para sair da temporada com um toque.',
    ],
    todo: ['Veja quantos pontos faltam para entrar na zona de subida.', 'Toque no nome de alguém do grupo para ver o perfil.'],
  },
  passe: {
    emoji: '🎟️',
    title: 'Passe da temporada',
    what: 'Uma trilha de 10 degraus que recomeça todo mês. Cada degrau alcançado dá pontos de prêmio.',
    how: [
      'Os degraus pedem 50, 150, 300, 500, 750, 1.000, 1.300, 1.700, 2.200 e 2.800 pontos no mês.',
      'Os prêmios vão de +10 a +100 pontos e entram no dia em que você chega ao degrau.',
      'O degrau 5 dá o selo "Metade do passe" e o degrau 10 dá o selo "Passe completo" do mês no seu perfil.',
      'Os prêmios do passe não contam para chegar ao próximo degrau.',
    ],
    todo: ['Olhe quantos pontos faltam para o próximo degrau e escolha uma ação que encaixe hoje.'],
  },
  evento: {
    emoji: '🎯',
    title: 'Evento da semana',
    what: 'Toda semana tem um tema em que uma área do app vale pontos em dobro: Foco, Hábitos, Movimento, Organização, Reflexão, Finanças ou Comunidade.',
    how: [
      'O evento vale de segunda a domingo e é o mesmo para todo mundo.',
      'Só as ações do tema rendem em dobro, até +60 pontos extras por dia.',
      'Os limites diários de sempre continuam valendo.',
      'Na segunda seguinte começa outro tema.',
    ],
    todo: ['Toque em "Ir" no cartão do evento para abrir direto a aba do tema.'],
  },
  amigos: {
    emoji: '🤝',
    title: 'Amigos nesta semana',
    what: 'Um ranking só com as pessoas que você segue, pelos pontos da semana (segunda a domingo).',
    how: [
      'Mostra sua posição e quantos pontos faltam para passar a pessoa da frente.',
      'Recomeça toda segunda-feira.',
      'Só entra quem você segue. Ninguém vê seus hábitos, finanças ou diário, só os pontos.',
    ],
    todo: ['Siga pessoas no Feed (toque na foto e em "Seguir") para ter com quem disputar.'],
  },
  bau_semana: {
    emoji: '🧰',
    title: 'Baú da semana',
    what: 'Um baú maior que abre quando você cumpre as 3 missões do dia em 5 dias diferentes da mesma semana.',
    how: [
      'Conta de segunda a domingo. Cada dia em que você abre o baú das missões conta 1.',
      'O prêmio vai de +60 a +150 pontos.',
      'Abre uma vez por semana. Se não der nesta semana, segunda começa outra, sem perder nada.',
    ],
    todo: ['Cumpra as missões do dia no Hoje e abra o baú diário.'],
  },
  mascote: {
    emoji: '🌱',
    title: 'Rit, seu mascote',
    what: 'O Rit é uma plantinha que cresce com a sua constância: de semente até árvore com frutos.',
    how: [
      'Ele cresce com os dias ativos (dias em que você ganhou pontos). Nunca encolhe.',
      'Fases: Semente, Broto (3 dias), Muda (10), Plantinha (25), Árvore jovem (50), Árvore florida (100) e Árvore com frutos (200).',
      'O humor mostra quando você passou por aqui: radiante hoje, tranquilo ontem, com sede depois de 2 ou 3 dias, e cochilando depois disso.',
      'Ele não morre nem fica bravo: quando você volta, ele acorda feliz.',
    ],
    todo: ['Qualquer ação que vale ponto já rega o Rit.'],
  },
  desafios: {
    emoji: '⚔️',
    title: 'Desafios com amigos',
    what: 'Um combinado de até 3 pessoas para cumprir uma meta juntas: dias de treino, hábitos, focos, tarefas, check-ins ou pontos.',
    how: [
      'Escolha o tipo, a duração (3, 7, 14 ou 30 dias) e a meta. O app sugere uma meta possível.',
      'Convide quem você segue ou mande o link do desafio.',
      'Cada um vê o progresso dos outros. Quem bate a meta ganha +50 pontos.',
      'Você pode ter até 3 desafios ativos ao mesmo tempo.',
    ],
    todo: ['Toque em "Novo desafio" e chame alguém que também quer criar constância.'],
  },
  retrospectiva: {
    emoji: '📅',
    title: 'Retrospectiva do mês',
    what: 'O resumo do seu mês: pontos, dias ativos, hábitos, treinos, focos, tarefas e o melhor dia.',
    how: ['Mostra o mês passado e o mês atual até agora.', 'Dá para compartilhar como imagem pronta para o Stories e o WhatsApp, com o seu link de convite.'],
    todo: ['Toque em "Compartilhar no Stories e WhatsApp" no fim do mês.'],
  },
  conquistas: {
    emoji: '🏅',
    title: 'Conquistas',
    what: 'Medalhas que saem sozinhas quando você chega a marcos de verdade: dias ativos, ofensiva, hábitos, foco, treino, diário, finanças, metas, comunidade, nível e temporada.',
    how: [
      'Cada conquista tem uma raridade: Comum, Rara, Épica ou Lendária.',
      'As que faltam aparecem em cinza com uma barrinha de progresso.',
      'Quando sai uma nova, aparece a tela "Conquista desbloqueada!".',
      'No perfil público só aparecem as de Constância, Foco, Metas, Comunidade, Níveis e Temporada.',
    ],
    todo: ['Toque numa conquista ganha para compartilhar no Stories, no WhatsApp ou no Feed.'],
  },
  ofensiva: {
    emoji: '🔥',
    title: 'Ofensiva',
    what: 'Quantos dias seguidos você ganhou pelo menos um ponto.',
    how: [
      'Qualquer ação que vale ponto mantém a ofensiva.',
      'Toda semana você tem 1 dia de descanso grátis: pular um dia não zera nada.',
      'O baú das missões às vezes dá um dia de descanso extra.',
      'Marcos: 3, 7, 14, 30, 60, 100, 180 e 365 dias.',
    ],
    todo: ['Faça uma ação pequena por dia, um hábito ou um check-in já basta.'],
    tip: 'Dia ruim acontece. O descanso semanal existe para isso.',
  },
  semana: {
    emoji: '📈',
    title: 'Resumo da semana',
    what: 'Seus pontos e dias ativos de segunda a domingo, o que você mais fez e a comparação com a semana anterior.',
    how: ['Aparece também no topo do Feed na segunda e na terça.', 'A semana passada pode ser compartilhada.'],
    todo: ['Use o resumo para ver o que funcionou e repetir na próxima semana.'],
  },
  ciclos: {
    emoji: '🗂️',
    title: 'Progresso e histórico',
    what: 'O histórico dos seus ciclos de foco (metas), com números de hábitos, tarefas, focos e finanças ao longo do tempo.',
    how: ['Mostra cada ciclo, quanto foi cumprido e a evolução.', 'No fim desta área fica a opção de excluir a conta (pede confirmação).'],
    todo: ['Compare um ciclo com o anterior e ajuste a próxima meta.'],
  },

  progresso_tab: {
    emoji: '📊',
    title: 'Aba Progresso',
    what: 'O seu lado "jogo" num lugar só: temporada, passe, amigos, baú da semana, mascote, desafios, retrospectiva, conquistas, nível, ofensiva e resumo da semana.',
    how: [
      'Tudo aqui é calculado a partir do que você fez de verdade nas outras abas.',
      'Embaixo de cada cartão tem um "Saber mais" explicando aquela parte.',
      'No fim fica o histórico dos seus ciclos de metas.',
    ],
    todo: ['Comece pela temporada e pelo passe: eles mostram quanto falta para o próximo prêmio.'],
  },

  /* ---------------- Hoje ---------------- */
  stories: {
    emoji: '◎',
    title: 'Stories do Ritmo',
    what: 'Conquistas e atividades que ficam 24 horas no ar para quem usa o Ritmo.',
    how: [
      'Toque no "+" da sua foto para publicar uma conquista. Ou use "Story no Ritmo" na janela de compartilhar.',
      'Anel colorido: tem story novo. Anel vermelho piscando: a pessoa está ao vivo, treinando ou em foco agora.',
      'Quem vê pode aplaudir. Você vê quantas pessoas viram e aplaudiram os seus.',
      'Em Configurações dá para ligar os stories automáticos: conquistas, nível, treinos e focos vão sozinhos e seus amigos veem quando você está ao vivo. Vem desligado.',
      'O story mostra só o tipo de atividade, nunca o trajeto do treino.',
    ],
    todo: ['Toque numa bolinha para ver os stories de alguém.'],
  },
  proximo_passo: {
    emoji: '👉',
    title: 'Próximo passo',
    what: 'A ação mais útil para agora, escolhida pelo app, com um botão grande para fazer na hora.',
    how: [
      'Segue uma ordem: baú pronto, planejar o dia de manhã, hábito pendente, tarefa mais cedo, conta vencendo, treino, foco, check-in (à noite vem primeiro), missões e planejar amanhã.',
      'Hábito e tarefa dá para marcar ali mesmo.',
      'Embaixo aparecem as duas ações seguintes.',
    ],
    todo: ['Toque no botão grande e siga para o próximo.'],
  },
  missoes: {
    emoji: '🎯',
    title: 'Missões do dia e baú',
    what: '3 missões por dia, escolhidas para você. Cumprindo as 3, abre o baú do dia.',
    how: [
      '2 missões são do que você já usa e 1 é para descobrir algo novo do app.',
      'Elas se marcam sozinhas quando você faz a ação. "Fazer agora" abre um atalho.',
      'O baú dá +15, +25, +40, +75 ou 1 dia de descanso extra para a ofensiva.',
      'Baú aberto em 5 dias da semana libera o baú da semana.',
    ],
    todo: ['Comece pela missão mais rápida.'],
  },

  /* ---------------- Abas ---------------- */
  hoje: {
    emoji: '☀️',
    title: 'Aba Hoje',
    what: 'O seu dia num lugar só: próximo passo, evento da semana, desafios, missões, agenda, hábitos e contas.',
    how: ['O app abre aqui.', 'A tela pode ser personalizada.', 'O botão do canto inferior esquerdo é o secretário por voz; o do canto direito mostra seu progresso.'],
    todo: ['Siga o Próximo passo e cumpra as missões.'],
  },
  habitos: {
    emoji: '💧',
    title: 'Hábitos & Saúde',
    what: 'Seus hábitos da semana numa grade: marque o que fez em cada dia.',
    how: [
      'Escolha a frequência: diário ou de 1 a 6 vezes por semana.',
      'Dá para marcar dias de semanas passadas.',
      'Cada hábito marcado vale +10 pontos (até 6 por dia). Criar um hábito vale +5.',
      'Hábito cumprido hoje pode ser compartilhado.',
    ],
    todo: ['Comece com 2 ou 3 hábitos pequenos e possíveis.'],
    tip: 'Melhor um hábito fácil todo dia do que cinco difíceis que cansam.',
  },
  rotina: {
    emoji: '📋',
    title: 'Rotina & Tarefas',
    what: 'Suas tarefas e compromissos por dia, com hora, bloco do dia e repetição.',
    how: [
      'Tarefa pode ter data, hora e repetição (todo dia, dias da semana, todo mês...). Ao concluir uma que se repete, a próxima é criada.',
      'Planejar uma tarefa vale +2 e concluir vale +5.',
      'Com o preenchimento automático ligado, um compromisso com data vira card no quadro Agenda, e uma conta (ex.: "Pagar IPVA terça") vira provisão em Finanças com lembretes na véspera e no dia.',
    ],
    todo: ['À noite, planeje 1 a 3 tarefas para amanhã.'],
  },
  foco: {
    emoji: '⏱️',
    title: 'Sessões de Foco',
    what: 'Um cronômetro para trabalhar ou estudar com atenção total por um tempo definido.',
    how: [
      'Use 25 ou 50 minutos, ou o tempo que quiser.',
      'Foco vale de 5 a 30 pontos pelo tempo (25 min = 15, 50 min = 30).',
      'Esqueceu de ligar o cronômetro? Use "Registrar sessão feita".',
    ],
    todo: ['Escolha uma tarefa, ligue o foco e deixe o celular longe.'],
  },
  financas: {
    emoji: '💰',
    title: 'Finanças Pessoais',
    what: 'Entradas, gastos, contas a pagar e a receber, orçamentos por categoria e saldo do mês.',
    how: [
      'Lançamento vale +3 pontos (até 5 por dia). Orçamento vale +5.',
      'Conta pendente com vencimento aparece no Próximo passo um dia antes.',
      'Com o preenchimento automático ligado, uma conta a pagar vira compromisso na agenda, card no quadro Agenda e lembretes. Marcar como paga conclui tudo junto.',
      'Dá para exportar em CSV e lançar gastos falando com o secretário.',
    ],
    todo: ['Lance os gastos do dia e cadastre as contas fixas do mês.'],
  },
  roteiro: {
    emoji: '🗺️',
    title: 'Roteiro de Metas',
    what: 'Um ciclo de foco com uma meta principal, prazo (de 1 a 365 dias) e marcos no caminho.',
    how: ['Iniciar um ciclo vale +40. Cada marco concluído vale +25 (até 2 por dia).', 'O histórico dos ciclos fica em Progresso.'],
    todo: ['Escolha uma meta, quebre em 3 a 5 marcos e marque cada um.'],
  },
  diario: {
    emoji: '📓',
    title: 'Diário & Revisões',
    what: 'Um check-in rápido do dia e uma revisão da semana.',
    how: ['O check-in do dia vale +15. A revisão da semana vale +30.', 'Ajuda a ver o que funcionou e ajustar a direção.'],
    todo: ['À noite, escreva em uma frase como foi o dia.'],
  },
  quadros: {
    emoji: '🗂️',
    title: 'Quadros',
    what: 'Quadros com listas e cards para organizar projetos, ideias e compromissos.',
    how: [
      'Arraste os cards entre as listas.',
      'Card criado vale +3 pontos (até 5 por dia).',
      'O quadro "Agenda" é preenchido sozinho com seus compromissos e contas. Arrastar um card dele para "Concluído" conclui a tarefa e marca a conta como paga.',
      'Card com data em qualquer quadro também vira compromisso na agenda.',
    ],
    todo: ['Crie um quadro para o seu projeto principal.'],
  },
  treino: {
    emoji: '👟',
    title: 'Treino com GPS',
    what: 'Grave corrida, caminhada, pedal ou trilha com distância, ritmo, mapa e recordes pessoais.',
    how: [
      'Dia de treino vale +20. Do 2º ao 5º dia de treino na semana tem bônus de constância (+5 a +20).',
      'O que conta é treinar em dias diferentes, não a distância.',
      'O app mantém a tela ligada. Com a tela apagada, o celular pode pausar o GPS.',
      'Ao compartilhar, o começo e o fim do trajeto (200 m) ficam escondidos por segurança.',
    ],
    todo: ['Escolha a modalidade e toque em Começar.'],
  },
  feed: {
    emoji: '✨',
    title: 'Feed e Ritus',
    what: 'A rede social do Ritmo: conquistas, fotos e apoio entre as pessoas, além dos Ritus (comunidades com conteúdo).',
    how: [
      'Nada é publicado sozinho no Feed: você revisa e toca em Publicar.',
      'Curtir, comentar, seguir e publicar valem pontos (com limite por dia).',
      'Toque na foto de alguém para ver o perfil: nível, conquistas, temporada e Ritus.',
      'Ritus grátis qualquer um lê e comenta. Ritus pagos: o criador fica com 60% e a plataforma com 40%.',
    ],
    todo: ['Siga algumas pessoas e apoie uma conquista com um comentário.'],
  },
  afiliados: {
    emoji: '🎁',
    title: 'Indique e Ganhe',
    what: 'Seu link de indicação: quem assina pelo seu link gera comissão para você.',
    how: [
      'A comissão total é de 35%: 25% no 1º nível e 10% distribuídos até o 4º nível.',
      'Peça o saque por Pix até quarta-feira 23:59; o pagamento é feito na quinta e na sexta.',
      'Só dá para sacar o saldo liberado.',
      'As imagens de conquista que você compartilha já levam o seu link.',
    ],
    todo: ['Cadastre sua chave Pix e compartilhe suas conquistas com o link.'],
    tip: 'Indique para quem você acha que o Ritmo ajuda de verdade.',
  },
  configuracoes: {
    emoji: '⚙️',
    title: 'Configurações',
    what: 'Seus dados, foto, bio, notificações, preenchimento automático, stories automáticos, gostos e privacidade.',
    how: [
      'Notificações: escolha 1, 2 ou 3 por dia nos horários que quiser (no máximo 4 automáticas por dia).',
      'Preenchimento automático: um compromisso preenche Quadros, Finanças e lembretes sozinho.',
      'Stories automáticos: conquistas e o "ao vivo" vão para os stories do Ritmo (vem desligado).',
      'Você pode baixar todos os seus dados a qualquer momento.',
    ],
    todo: ['Coloque uma foto e ligue as notificações nos horários que fazem sentido para você.'],
  },
  compartilhar: {
    emoji: '📤',
    title: 'Compartilhar conquistas',
    what: 'Toda conquista vira uma imagem pronta para o Stories do Instagram e o WhatsApp, com um QR code e o seu link.',
    how: [
      'WhatsApp: vai a imagem com o texto e o link.',
      'Instagram: o link é copiado sozinho. No Stories, use o adesivo "Link" para colar.',
      'Feed e Story no Ritmo: publica dentro do app.',
      'Quem entra pelo seu link e usa o Ritmo em 2 dias vale +50 pontos para você e conta como indicação.',
    ],
    todo: ['Toque em qualquer botão "Compartilhar" do app.'],
  },
};
