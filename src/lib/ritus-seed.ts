// Ritus GRATUITOS que já nascem prontos na plataforma (criados pela conta master).
// Entram no banco pelo schema-sync uma única vez (marcador "seed_ritus_v1" na auditoria):
// se o administrador apagar ou editar algo depois, nada é recriado.
// As imagens ficam em public/ritus/ (ilustrações próprias, não são capas oficiais).

export interface SeedPost {
  body: string;
  image?: string;
}

export interface SeedRitus {
  code: string;
  name: string;
  description: string;
  /** Publicações na ordem em que aparecem no Ritus (a primeira fica no topo). */
  posts: SeedPost[];
}

export const SEED_RITUS: SeedRitus[] = [
  {
    code: 'clube-do-livro',
    name: 'Clube do Livro',
    description:
      'Um livro por vez, lido sem pressa e discutido nos comentários. Aqui entram livros sobre risco, acaso, dinheiro, decisões e disciplina: Taleb, Max Gunther, Kahneman, Housel e outros. Cada publicação traz uma resenha curta, a ideia principal e uma pergunta para conversar. Grátis para todo mundo do Ritmo.',
    posts: [
      {
        image: '/ritus/clube-do-livro.svg',
        body:
          'Bem-vindo ao Clube do Livro! 📚\n\nComo funciona: abaixo estão 10 resenhas de livros que mudam o jeito de pensar sobre risco, sorte, dinheiro e hábitos. Escolha um, leia no seu ritmo (20 páginas por dia já fecham um livro por mês) e comente o que achou na publicação dele.\n\nDica: crie um hábito "Leitura · 20 min" na aba Hábitos e acompanhe a corrente. Qual livro você vai começar?',
      },
      {
        image: '/ritus/livro-iludido-pelo-acaso.svg',
        body:
          '📖 Iludido pelo Acaso — Nassim Nicholas Taleb\n\nO primeiro livro da série de Taleb sobre incerteza. A tese: confundimos sorte com competência o tempo todo, principalmente no mercado financeiro. O trader que ganhou dez anos seguidos pode ser só o sobrevivente de uma multidão que quebrou e ninguém contou.\n\nO que fica: olhe para os "caminhos alternativos" — o que poderia ter acontecido — e não só para o resultado. Um bom resultado não prova uma boa decisão.\n\nPara conversar: qual conquista sua você acha que teve mais sorte do que admite?',
      },
      {
        image: '/ritus/livro-antifragil.svg',
        body:
          '📖 Antifrágil — Nassim Nicholas Taleb\n\nFrágil quebra com o impacto. Robusto aguenta. Antifrágil melhora com ele: músculos, sistemas que aprendem com erros pequenos, quem tem opções baratas com muito a ganhar. O livro defende expor-se a pequenos estresses e evitar a ruína a qualquer custo.\n\nO que fica: a "estratégia do haltere" — muita segurança de um lado, pequenas apostas ousadas do outro, e nada no meio morno.\n\nPara conversar: que área da sua vida está frágil hoje (uma única fonte de renda, um único cliente, nenhuma reserva)?',
      },
      {
        image: '/ritus/livro-cisne-negro.svg',
        body:
          '📖 A Lógica do Cisne Negro — Nassim Nicholas Taleb\n\nCisne negro é o evento raro, de impacto enorme, que todo mundo "explica" depois que acontece. O livro mostra como modelos bem comportados ignoram justamente o que mais importa: o extremo.\n\nO que fica: não tente prever o imprevisível; prepare-se para ele. Reserva de emergência, margem de segurança e humildade com previsões.\n\nPara conversar: qual foi o maior "cisne negro" da sua vida até agora?',
      },
      {
        image: '/ritus/livro-arriscando-a-propria-pele.svg',
        body:
          '📖 Arriscando a Própria Pele — Nassim Nicholas Taleb\n\nNão confie em quem dá conselho sem sofrer as consequências dele. O livro é sobre simetria: quem ganha com o acerto deve perder com o erro. Vale para consultores, políticos, gestores e para nós.\n\nO que fica: pergunte "o que essa pessoa perde se estiver errada?" antes de seguir uma recomendação.\n\nPara conversar: em que decisão você está ouvindo alguém que não tem nada em jogo?',
      },
      {
        image: '/ritus/livro-axiomas-de-zurique.svg',
        body:
          '📖 Os Axiomas de Zurique — Max Gunther\n\nDoze regras curtas sobre risco, escritas a partir da experiência de especuladores suíços. Algumas das mais marcantes: arrisque o suficiente para que faça diferença; realize lucros cedo; corte a perda sem orgulho; desconfie de padrões que parecem certos demais.\n\nO que fica: decidir sob risco é aceitar que você vai errar às vezes e montar regras para errar barato.\n\nPara conversar: qual axioma você mais quebra no dia a dia?',
      },
      {
        image: '/ritus/livro-submundo-do-futebol.svg',
        body:
          '📖 O Submundo do Futebol — Wilson Raj Perumal\n\nO relato, em primeira pessoa, de um dos maiores manipuladores de resultados do futebol mundial: jogos combinados, árbitros comprados, casas de apostas na Ásia e redes que atravessavam países. É um livro de bastidores, desconfortável e revelador.\n\nO que fica: onde há muito dinheiro e pouca transparência, os incentivos falam mais alto. Ótimo complemento a Taleb sobre "quem ganha com o quê".\n\nPara conversar: depois de ler, você ainda aposta em resultado de jogo?',
      },
      {
        image: '/ritus/livro-rapido-e-devagar.svg',
        body:
          '📖 Rápido e Devagar — Daniel Kahneman\n\nO cérebro trabalha com dois sistemas: o rápido (intuitivo, automático) e o devagar (analítico, cansativo). Quase todos os nossos vieses nascem quando o rápido responde uma pergunta que era do devagar.\n\nO que fica: ancoragem, aversão à perda e excesso de confiança afetam até especialistas. Desacelere nas decisões caras.\n\nPara conversar: que viés você percebeu em você mesmo esta semana?',
      },
      {
        image: '/ritus/livro-psicologia-financeira.svg',
        body:
          '📖 A Psicologia Financeira — Morgan Housel\n\nFazer bem com dinheiro tem pouco a ver com inteligência e muito a ver com comportamento. Housel conta histórias curtas sobre juros compostos, sorte, ganância e o poder de "ter o suficiente".\n\nO que fica: a riqueza é o que você não vê: o dinheiro que não foi gasto. E sobreviver no jogo vale mais do que ganhar rápido.\n\nPara conversar: qual é o seu "suficiente"?',
      },
      {
        image: '/ritus/livro-homem-mais-rico-da-babilonia.svg',
        body:
          '📖 O Homem Mais Rico da Babilônia — George S. Clason\n\nParábolas antigas com lições financeiras simples: guarde ao menos uma parte de tudo o que ganha, controle os gastos, faça o dinheiro trabalhar e proteja-o de aventuras.\n\nO que fica: "pague-se primeiro". Antes das contas, separe a sua parte. Use a aba Finanças para ver quanto isso dá por mês.\n\nPara conversar: quanto por cento da sua renda você consegue guardar hoje?',
      },
      {
        image: '/ritus/livro-habitos-atomicos.svg',
        body:
          '📖 Hábitos Atômicos — James Clear\n\nPequenas melhorias diárias se acumulam como juros compostos. O livro ensina a tornar o hábito óbvio, atraente, fácil e satisfatório, e a focar em quem você quer se tornar, não só no resultado.\n\nO que fica: não dependa de motivação; mude o ambiente. É exatamente o que a corrente semanal do Ritmo faz.\n\nPara conversar: qual hábito de 2 minutos você vai começar hoje?',
      },
    ],
  },
  {
    code: 'cozinha-pratica',
    name: 'Cozinha Prática da Semana',
    description:
      'Comida de verdade sem passar o domingo inteiro no fogão. Marmitas da semana, receitas com poucos ingredientes, lista de mercado e como gastar menos. Nada de dieta restritiva: é organização para comer bem com o tempo e o dinheiro que você tem. Grátis.',
    posts: [
      {
        image: '/ritus/cozinha-pratica.svg',
        body:
          'Bem-vindo à Cozinha Prática! 🍳\n\nA proposta: 2 horas no fim de semana para ter almoço garantido de segunda a sexta. Aqui você encontra o método das marmitas, receitas base e dicas para o mercado.\n\nCompartilhe nos comentários a foto da sua marmita da semana!\n\n(Conteúdo de organização culinária, não é orientação nutricional. Restrições e dietas específicas: fale com um nutricionista.)',
      },
      {
        image: '/ritus/marmitas.svg',
        body:
          '🥡 Método das 5 marmitas em 2 horas\n\n1. Uma base: arroz ou macarrão (panela grande).\n2. Uma leguminosa: feijão ou grão-de-bico (panela de pressão).\n3. Duas proteínas diferentes: frango desfiado e carne moída, por exemplo.\n4. Legumes assados no forno numa só assadeira (abóbora, cenoura, brócolis).\n5. Monte 5 potes combinando as opções para não enjoar.\n\nGeladeira: até 3 dias. Freezer: o resto da semana.',
      },
      {
        image: '/ritus/lista-mercado.svg',
        body:
          '🛒 Lista de mercado que economiza\n\n• Planeje o cardápio antes de sair de casa.\n• Compre por receita, não por vontade.\n• Legumes da estação costumam ser mais baratos.\n• Proteína em quantidade maior e porcione em casa.\n• Registre o valor na aba Finanças (categoria Mercado) e veja a média do mês.\n\nQuanto você gasta de mercado por semana? Conta aqui!',
      },
    ],
  },
  {
    code: 'treino-em-casa',
    name: 'Treino em Casa 20 min',
    description:
      'Treinos curtos com o peso do corpo para fazer na sala, sem equipamento. Três vezes por semana já fecham a corrente no Ritmo. Para iniciantes que querem constância, não perfeição. Grátis.',
    posts: [
      {
        image: '/ritus/treino-em-casa.svg',
        body:
          'Bem-vindo ao Treino em Casa! 💪\n\nAqui o combinado é simples: 20 minutos, 3 vezes por semana. Crie o hábito "Treino 20 min" com meta 3x por semana e deixe a corrente cuidar da motivação.\n\nAntes de começar qualquer programa de exercícios, especialmente se você tem alguma condição de saúde, converse com um profissional. Respeite seus limites: dor não é meta.',
      },
      {
        image: '/ritus/treino-a.svg',
        body:
          '🏋️ Treino A (iniciante) — 4 voltas\n\n• 10 agachamentos\n• 8 flexões (pode apoiar os joelhos)\n• 20 segundos de prancha\n• 10 afundos (5 cada perna)\n• 30 segundos de polichinelo\n\nDescanse 1 minuto entre as voltas. Terminou? Marque o hábito e compartilhe no Feed.',
      },
      {
        image: '/ritus/treino-b.svg',
        body:
          '🔥 Treino B (alternar com o A) — 4 voltas\n\n• 12 elevações de quadril no chão\n• 10 remadas com mochila (coloque livros dentro)\n• 20 segundos de prancha lateral (cada lado)\n• 10 subidas no degrau ou no sofá firme\n• 30 segundos de corrida parada\n\nSemana 1: A, B, A. Semana 2: B, A, B. Simples assim.',
      },
    ],
  },
  {
    code: 'caminhada-e-corrida',
    name: 'Caminhada e Corrida para Iniciantes',
    description:
      'Do sofá aos primeiros 5 km, alternando caminhada e corrida leve, em 8 semanas. Sem pressa, sem pace de atleta: o objetivo é sair três vezes por semana e terminar bem. Grátis.',
    posts: [
      {
        image: '/ritus/caminhada-e-corrida.svg',
        body:
          'Bem-vindo! 👟\n\nO plano alterna caminhada e trote. Se em algum dia ficar pesado, repita a semana: não é corrida contra ninguém.\n\nUse um tênis confortável, hidrate-se e, se tiver qualquer condição de saúde, consulte um profissional antes de começar.',
      },
      {
        image: '/ritus/plano-corrida.svg',
        body:
          '🗓️ Plano de 8 semanas (3 dias por semana)\n\nSemanas 1-2: 1 min trote + 2 min caminhada, 8 vezes.\nSemanas 3-4: 2 min trote + 2 min caminhada, 7 vezes.\nSemanas 5-6: 4 min trote + 1 min caminhada, 5 vezes.\nSemana 7: 8 min trote + 2 min caminhada, 3 vezes.\nSemana 8: 25 a 30 min de trote leve.\n\nSempre 5 minutos de caminhada antes e depois.',
      },
      {
        image: '/ritus/ritmo-conversa.svg',
        body:
          '💬 O teste da conversa\n\nNo começo, corra num ritmo em que você ainda consegue falar frases curtas. Se não dá para falar, diminua. A maioria dos iniciantes desiste porque corre rápido demais, não porque corre pouco.\n\nPoste aqui a foto do seu primeiro treino da semana!',
      },
    ],
  },
  {
    code: 'foco-profundo',
    name: 'Foco Profundo',
    description:
      'Para quem quer render mais em menos tempo: blocos de 25 ou 50 minutos, celular longe, uma tarefa por vez. Desafios semanais de foco usando a aba Foco do Ritmo. Grátis.',
    posts: [
      {
        image: '/ritus/foco-profundo.svg',
        body:
          'Bem-vindo ao Foco Profundo! 🎯\n\nDesafio da semana: 10 blocos de 25 minutos (pouco mais de 4 horas de foco de verdade). Use a aba Foco, escreva o objetivo de cada bloco e, ao terminar, toque em "Compartilhar no Feed".',
      },
      {
        image: '/ritus/pomodoro.svg',
        body:
          '⏱️ Como fazer um bom bloco de foco\n\n1. Escolha UMA tarefa e escreva o resultado esperado.\n2. Celular em outro cômodo (não só virado para baixo).\n3. Feche abas e notificações.\n4. 25 minutos sem parar. Lembrou de outra coisa? Anote num papel e volte.\n5. 5 minutos de pausa longe da tela.\n\nDepois de 4 blocos, pausa de 15 a 30 minutos.',
      },
      {
        image: '/ritus/manha-de-foco.svg',
        body:
          '🌅 O primeiro bloco do dia vale ouro\n\nFaça o bloco mais importante antes de abrir e-mail e redes sociais. Quem começa reagindo passa o dia reagindo.\n\nComente: qual é a sua tarefa do primeiro bloco amanhã?',
      },
    ],
  },
  {
    code: 'financas-do-mes',
    name: 'Finanças do Mês sem Planilha',
    description:
      'Organização financeira pessoal na prática: fechar o mês, montar reserva de emergência, sair das dívidas caras e saber para onde vai cada real, usando a aba Finanças do Ritmo. Conteúdo educativo, não é recomendação de investimento. Grátis.',
    posts: [
      {
        image: '/ritus/financas-do-mes.svg',
        body:
          'Bem-vindo! 💰\n\nAqui a regra é: primeiro enxergar, depois cortar, depois guardar. Durante 30 dias, registre todos os gastos na aba Finanças, até o cafezinho. No fim do mês você vai ver números que nenhuma planilha esquecida mostrou.\n\nConteúdo educativo: para investimentos, procure um profissional certificado.',
      },
      {
        image: '/ritus/reserva-emergencia.svg',
        body:
          '🛟 Reserva de emergência em 4 passos\n\n1. Some seus gastos fixos do mês.\n2. Meta inicial: 1 mês desses gastos guardado. Depois 3. Depois 6.\n3. Guarde num lugar seguro e com liquidez diária.\n4. Automatize: no dia em que o dinheiro entra, separe a parte da reserva.\n\nReserva não é investimento para ganhar: é para você não se endividar quando o imprevisto chegar.',
      },
      {
        image: '/ritus/dividas.svg',
        body:
          '📉 Saindo das dívidas caras\n\n• Liste todas: valor, juros ao mês e parcela.\n• Ataque primeiro as de juros mais altos (cartão rotativo e cheque especial costumam ser as piores).\n• Negocie: muitas empresas oferecem desconto à vista ou parcelamento com juros menores.\n• Cadastre as parcelas na aba Finanças com vencimento: o Ritmo avisa antes de vencer.',
      },
    ],
  },
  {
    code: 'desafio-21-dias',
    name: 'Desafio 21 Dias de Hábitos',
    description:
      'Escolha um hábito, defina a meta da semana e cumpra por 3 semanas seguidas com a comunidade. Check-in nos comentários todo domingo. Corrente semanal, sem culpa por dia ruim. Grátis.',
    posts: [
      {
        image: '/ritus/desafio-21-dias.svg',
        body:
          'Bem-vindo ao Desafio 21 Dias! 🔗\n\nRegras:\n1. Escolha UM hábito (leitura, treino, água, dormir no horário...).\n2. Crie na aba Hábitos com uma meta realista (ex.: 4x por semana).\n3. Toda semana fechada aumenta a sua corrente.\n4. Domingo: comente aqui como foi.\n\nFalhou um dia? Tudo bem: o que conta é fechar a meta da semana.',
      },
      {
        image: '/ritus/habito-minimo.svg',
        body:
          '🌱 A regra dos 2 minutos\n\nNos dias difíceis, faça a versão mínima: 1 página de leitura, 1 série de agachamento, 1 copo de água. A versão mínima mantém a identidade ("eu sou alguém que treina") viva até o dia bom voltar.',
      },
      {
        image: '/ritus/checkin-domingo.svg',
        body:
          '📋 Check-in de domingo\n\nResponda nos comentários:\n• Qual hábito?\n• Quantas vezes cumpriu nesta semana?\n• O que atrapalhou?\n• O que você vai mudar na próxima?\n\nQuem comenta toda semana tem muito mais chance de chegar ao dia 21.',
      },
    ],
  },
  {
    code: 'ingles-15-minutos',
    name: 'Inglês 15 Minutos por Dia',
    description:
      'Constância vence intensidade: 15 minutos por dia de inglês, com uma expressão nova por publicação, desafios de escuta e prática de escrita nos comentários. Grátis.',
    posts: [
      {
        image: '/ritus/ingles-15-minutos.svg',
        body:
          'Welcome! 🇬🇧\n\nO plano: 5 minutos ouvindo (podcast, vídeo com legenda em inglês), 5 lendo em voz alta e 5 escrevendo 3 frases. Crie o hábito "Inglês 15 min" e comente suas frases aqui para praticar.',
      },
      {
        image: '/ritus/expressao-get-the-hang.svg',
        body:
          '💡 Expressão da semana: "to get the hang of something"\n\nSignifica pegar o jeito de algo.\n\nExemplo: "It took me a week, but I finally got the hang of the Pomodoro technique."\n\nDesafio: escreva nos comentários uma frase sua usando a expressão.',
      },
      {
        image: '/ritus/expressao-on-track.svg',
        body:
          '💡 Expressão: "to be on track"\n\nSignifica estar no caminho certo, dentro do planejado.\n\nExemplo: "I\'m on track with my reading goal this month."\n\nE você, está on track com qual meta?',
      },
    ],
  },
  {
    code: 'manhas-com-ritmo',
    name: 'Manhãs com Ritmo',
    description:
      'Uma rotina da manhã simples e realista, sem acordar às 4h nem cortar sono: água, luz natural, movimento leve e o primeiro bloco de foco. Grátis.',
    posts: [
      {
        image: '/ritus/manhas-com-ritmo.svg',
        body:
          'Bom dia! ☀️\n\nAqui não tem rotina de celebridade. A ideia é ganhar os primeiros 30 minutos do dia com 4 coisas: um copo de água, luz natural (janela ou rua), 5 minutos de movimento e decidir a tarefa mais importante. Dormir bem continua sendo prioridade.',
      },
      {
        image: '/ritus/noite-anterior.svg',
        body:
          '🌙 A manhã começa na noite anterior\n\n• Deixe a roupa separada.\n• Escreva a tarefa nº 1 de amanhã na aba Rotina.\n• Celular carregando longe da cama.\n• Mesmo horário para dormir, quando der.\n\nPequenas decisões tomadas de noite são decisões a menos de manhã.',
      },
      {
        image: '/ritus/cafe-da-manha.svg',
        body:
          '📸 Desafio da semana: poste a foto da sua manhã\n\nPode ser o café, a janela, o tênis na porta. Mostre aqui o primeiro momento bom do seu dia e inspire alguém a começar o dele.',
      },
    ],
  },
  {
    code: 'casa-organizada',
    name: 'Casa Organizada',
    description:
      'Organização da casa em pequenas doses: 15 minutos por dia, um cômodo por semana, menos coisas e mais espaço. Antes e depois nos comentários. Grátis.',
    posts: [
      {
        image: '/ritus/casa-organizada.svg',
        body:
          'Bem-vindo à Casa Organizada! 🏠\n\nA regra de ouro: 15 minutos por dia valem mais que um sábado inteiro de faxina que nunca acontece. Crie a tarefa recorrente "Organizar 15 min" e poste o antes e depois.',
      },
      {
        image: '/ritus/tres-caixas.svg',
        body:
          '📦 Método das 3 caixas\n\nPegue três caixas: FICA, DOA, DESCARTA. Escolha uma gaveta ou prateleira e decida cada item em até 5 segundos. O que ficou ganha um lugar fixo. A caixa de doação sai de casa no mesmo dia.',
      },
      {
        image: '/ritus/um-entra-um-sai.svg',
        body:
          '🔁 Regra do "um entra, um sai"\n\nComprou uma camiseta? Uma sai do armário. Chegou um livro? Um vai para doação. É o jeito mais simples de a casa não voltar a encher, e ainda segura as compras por impulso.',
      },
    ],
  },
];

/** Escapa nada: o texto vai entre $ritus$ ... $ritus$ (dollar quoting do Postgres). */
const q = (t: string) => {
  if (t.includes('$ritus$')) throw new Error('Texto do seed contém o delimitador.');
  return `$ritus$${t}$ritus$`;
};

/**
 * Instruções SQL do seed. Os Ritus usam ON CONFLICT (code) DO NOTHING; as publicações só entram
 * enquanto não existir o marcador "seed_ritus_v1" na auditoria (o último comando o grava).
 */
export function seedRitusStatements(masterEmail: string): string[] {
  const out: string[] = [];
  const guard = `NOT EXISTS (SELECT 1 FROM "admin_audit_log" WHERE "action" = 'seed_ritus_v1')`;
  for (const r of SEED_RITUS) {
    out.push(
      `INSERT INTO "teams" ("owner_user_id","code","name","description","price_cents","period_days","free_for_referred","members_can_post","active","listed")
       SELECT u."id", ${q(r.code)}, ${q(r.name)}, ${q(r.description)}, 0, 0, true, false, true, true
       FROM "users" u WHERE u."email" = '${masterEmail}' AND ${guard}
       ON CONFLICT ("code") DO NOTHING`
    );
    out.push(
      `INSERT INTO "team_members" ("team_id","user_id","source","status")
       SELECT t."id", t."owner_user_id", 'owner', 'active' FROM "teams" t
       WHERE t."code" = ${q(r.code)} AND ${guard}
         AND NOT EXISTS (SELECT 1 FROM "team_members" m WHERE m."team_id" = t."id" AND m."user_id" = t."owner_user_id")`
    );
    // publicações: inseridas de trás para frente, para a primeira ficar no topo do Ritus
    r.posts
      .map((p, i) => ({ p, i }))
      .reverse()
      .forEach(({ p, i }) => {
        out.push(
          `INSERT INTO "feed_posts" ("user_id","team_id","kind","body","image_url","status","created_at")
           SELECT t."owner_user_id", t."id", '${p.image ? 'photo' : 'text'}', ${q(p.body)}, ${p.image ? q(p.image) : 'NULL'}, 'visible', now() - interval '${(i + 1) * 7} minutes'
           FROM "teams" t WHERE t."code" = ${q(r.code)} AND ${guard}
             AND NOT EXISTS (SELECT 1 FROM "feed_posts" fp WHERE fp."team_id" = t."id" AND fp."body" = ${q(p.body)})`
        );
      });
  }
  out.push(
    `INSERT INTO "admin_audit_log" ("admin_email","action","details")
     SELECT '${masterEmail}','seed_ritus_v1','Criados os 10 Ritus gratuitos iniciais com publicações'
     WHERE ${guard} AND EXISTS (SELECT 1 FROM "teams" WHERE "code" = 'clube-do-livro')`
  );
  return out;
}
