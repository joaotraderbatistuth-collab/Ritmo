// Conteúdo do programa de indicação: modelos de story e mini curso. Dados PUROS (sem React),
// para poderem ser testados. Regra de ouro de todo o texto: só afirmar o que o app faz,
// sem promessa de renda, de saúde ou de resultado.
import { COMMISSION_DIRECT_PERCENT, COMMISSION_NETWORK_PERCENT, MAX_COMMISSION_LEVELS, MIN_PAYOUT_CENTS, DIRECT_EXAMPLE_BRL, brl } from './commission-plan.js';

export type StoryVisual = 'chain' | 'week' | 'bars' | 'panel' | 'price' | 'apps' | 'diary' | 'ring' | 'monday' | 'invite';

export interface StoryModel {
  id: string;
  name: string;
  headline: string;
  sub: string;
  visual: StoryVisual;
  accent: string; // cor de destaque (hex)
  /** Legenda sugerida. {link} é trocado pelo link do afiliado. */
  caption: string;
}

export const STORY_MODELS: StoryModel[] = [
  {
    id: 'corrente',
    name: 'A corrente que perdoa',
    headline: 'Falhou um dia? A corrente continua.',
    sub: 'No Ritmo, a corrente conta semanas cumpridas pela sua meta, não dias seguidos.',
    visual: 'chain',
    accent: '#10b981',
    caption: 'Falhar um dia não precisa zerar tudo. Estou usando o Ritmo, que conta a corrente por semanas cumpridas pela minha meta. 7 dias grátis, sem cartão: {link} (link de indicação)',
  },
  {
    id: 'tres_vezes',
    name: 'Treina 3x por semana',
    headline: 'Treina 3x por semana? Você não quebrou nada.',
    sub: 'Meta de 3 vezes? Cumpriu as 3, a corrente segue.',
    visual: 'week',
    accent: '#14b8a6',
    caption: 'Você escolhe quantas vezes por semana quer cumprir cada hábito, e o Ritmo respeita. Teste 7 dias grátis, sem cartão: {link} (link de indicação)',
  },
  {
    id: 'dinheiro',
    name: 'Pra onde foi o dinheiro',
    headline: 'Pra onde foi o seu dinheiro este mês?',
    sub: 'Gastos por categoria, contas a vencer e orçamento no mesmo painel.',
    visual: 'bars',
    accent: '#f59e0b',
    caption: 'Eu queria enxergar para onde o dinheiro vai sem planilha complicada. O Ritmo mostra gastos por categoria e contas a vencer. 7 dias grátis, sem cartão: {link} (link de indicação)',
  },
  {
    id: 'placar',
    name: 'Placar, não disciplina',
    headline: 'Você não precisa de mais disciplina. Precisa de placar.',
    sub: 'Um painel que mostra o que você já fez e qual é o próximo passo.',
    visual: 'panel',
    accent: '#10b981',
    caption: 'Pra mim o que faltava não era força de vontade, era um placar simples. Estou usando o Ritmo. Teste 7 dias grátis, sem cartão: {link} (link de indicação)',
  },
  {
    id: 'gratis',
    name: '7 dias grátis',
    headline: '7 dias grátis. Sem cartão.',
    sub: 'Teste o Ritmo por uma semana inteira. Só continua se fizer sentido.',
    visual: 'price',
    accent: '#10b981',
    caption: 'Sem cartão, sem renovação automática: você testa por 7 dias e só paga se quiser continuar. Link de indicação: {link}',
  },
  {
    id: 'um_painel',
    name: 'Tudo em um painel',
    headline: 'Metas, hábitos, foco e dinheiro. Um painel só.',
    sub: 'Menos apps abertos, mais coisa feita.',
    visual: 'apps',
    accent: '#0ea5e9',
    caption: 'Troquei vários apps soltos por um painel só: metas, hábitos, foco, quadros, finanças e diário. Teste 7 dias grátis: {link} (link de indicação)',
  },
  {
    id: 'diario',
    name: 'Diário de 30 segundos',
    headline: '30 segundos por dia. Duas perguntas.',
    sub: 'O que tornou minha vida mais fácil hoje? O que não devo repetir?',
    visual: 'diary',
    accent: '#f43f5e',
    caption: 'Duas perguntas no fim do dia mudam o que a gente enxerga da própria rotina. Faço isso no Ritmo, leva 30 segundos. 7 dias grátis: {link} (link de indicação)',
  },
  {
    id: 'foco',
    name: '25 minutos de foco',
    headline: '25 minutos. Um objetivo. Sem celular.',
    sub: 'Sessões de foco com registro do tempo que você realmente focou.',
    visual: 'ring',
    accent: '#f59e0b',
    caption: 'Um objetivo por vez e o registro de quanto tempo eu realmente focei. Estou usando o Ritmo. 7 dias grátis, sem cartão: {link} (link de indicação)',
  },
  {
    id: 'segunda',
    name: 'Começo na segunda',
    headline: '“Começo na segunda” já virou piada?',
    sub: 'Comece hoje com 7 dias grátis e veja o que funciona para você.',
    visual: 'monday',
    accent: '#f43f5e',
    caption: 'Chega de deixar para segunda. Hoje eu comecei de novo, dessa vez com um sistema que perdoa dia ruim. 7 dias grátis, sem cartão: {link} (link de indicação)',
  },
  {
    id: 'convite',
    name: 'Convite pessoal',
    headline: 'Estou usando o Ritmo. Quer testar comigo?',
    sub: '7 dias grátis, sem cartão. Me chama se tiver dúvida.',
    visual: 'invite',
    accent: '#10b981',
    caption: 'Se você também vive tentando se organizar, testa comigo: 7 dias grátis, sem cartão. Me chama se tiver dúvida! {link} (link de indicação)',
  },
];

/* ------------------------------------------------------------------ */
/* Mini curso: como indicar com consistência (leitura de ~5 minutos)    */
/* ------------------------------------------------------------------ */

export interface CourseLesson {
  id: string;
  title: string;
  /** Parágrafos; linhas começando com "• " viram lista. */
  body: string[];
}

export const COURSE_TITLE = 'Mini curso: como indicar o Ritmo com consistência';

export const COURSE_LESSONS: CourseLesson[] = [
  {
    id: 'verdade',
    title: '1. Indique o que é verdade para você',
    body: [
      'A indicação que funciona nasce de uma experiência real. Antes de falar do Ritmo, use o Ritmo: crie uma meta, marque um hábito, faça o diário por alguns dias. Quem indica com a própria história convence mais do que qualquer texto pronto, e ninguém consegue fingir isso por muito tempo.',
      'Faça este exercício de três minutos: escreva três linhas sobre o que mudou na sua rotina, por menor que seja. Exemplo: “eu perdia a semana inteira quando falhava um dia; agora a corrente conta semanas e eu retomo sem culpa”. Essa frase é o seu melhor material, melhor do que qualquer slogan.',
      'Pense também em quem você NÃO deve procurar: quem já disse que não quer app nenhum, quem está passando por um momento difícil e não pediu conselho, quem nunca se interessou por organização. Insistir queima a relação e não rende assinatura.',
      'Seu patrimônio nesse trabalho é a confiança de quem te segue. Uma indicação que decepciona custa mais caro do que dez que deram certo.',
    ],
  },
  {
    id: 'lista',
    title: '2. Comece pela lista dos 20',
    body: [
      'Antes de postar para todo mundo, faça uma lista de 20 pessoas que realmente podem se beneficiar. Três perfis costumam funcionar bem: quem vive dizendo “preciso me organizar”, quem começa as coisas e para no meio, e quem quer entender melhor para onde vai o dinheiro.',
      'Mande uma mensagem pessoal, uma pessoa por vez, e peça licença antes de mandar o link:',
      '• “Oi, [nome]! Lembrei de você. Estou usando um app para organizar metas, hábitos e dinheiro e achei que ia gostar. Posso te mandar o link? Tem 7 dias grátis, sem cartão.”',
      'Só envie o link depois do “pode”. Se a pessoa não responder, mande uma única lembrança gentil depois de três dias e pare por aí. Um “não, obrigado” merece um “tudo bem, valeu” e nada mais.',
      'Mensagem em massa e grupo lotado de desconhecidos cansam as pessoas, podem violar as regras do grupo e prejudicam a sua imagem. Conversa de verdade, com 20 pessoas, rende mais do que um link jogado para 500.',
    ],
  },
  {
    id: 'mostre',
    title: '3. Mostre, não prometa',
    body: [
      'Conteúdo bom mostra o app funcionando: um print da sua corrente, uma sessão de foco, o diário do dia, a tela de gastos por categoria. Os 10 modelos de story desta aba já vêm prontos, com espaço para o seu link. Troque a legenda por algo seu e, se puder, conte o que você mesmo está fazendo no app.',
      'Uma ideia simples para a semana: segunda, a corrente; terça, o dinheiro; quarta, o foco; quinta, o diário; sexta, o convite pessoal. Um story por dia leva dois minutos.',
      'Fale do que o Ritmo faz, não do que ele garante. Use frases como “está me ajudando a enxergar minha semana” ou “testei 7 dias e gostei”. Evite “vai mudar sua vida”, “resultado garantido” e qualquer promessa de dinheiro, de saúde ou de emagrecimento.',
      'Isso protege você e quem te lê. Promessa que não se cumpre vira reclamação, e anúncio com promessa exagerada costuma ser derrubado pelas plataformas. Diga sempre que o link é de indicação: a lei de publicidade exige e as pessoas respeitam a transparência.',
    ],
  },
  {
    id: 'rotina',
    title: '4. Uma rotina de 10 minutos por dia',
    body: [
      'Constância vence esforço concentrado. Uma rotina simples:',
      '• Todo dia útil: 1 story com um dos modelos e 2 conversas pessoais com gente da sua lista.',
      '• No fim de semana: 1 post ou vídeo curto contando sua experiência e uma olhada nos números desta aba.',
      'Acompanhe o que acontece. Muitos cliques e poucos cadastros: a sua mensagem está atraindo gente que não se interessa, então ajuste o convite. Muitos cadastros e poucas assinaturas: as pessoas testaram e não voltaram, então ajude nos primeiros dias, que é quando elas decidem se continuam.',
      'Evite perguntas que acusem o público, como “você está endividado?”. Prefira convites universais, como “quer testar comigo?”. Funciona melhor e as plataformas aprovam com mais facilidade.',
      'Se uma semana for ruim, siga a rotina na semana seguinte. A mesma lógica da corrente do Ritmo vale para quem indica: o que conta é voltar.',
    ],
  },
  {
    id: 'comissao',
    title: '5. Faça seus indicados darem certo, e entenda como recebe',
    body: [
      `A comissão é recorrente: você recebe ${COMMISSION_DIRECT_PERCENT}% de cada pagamento confirmado de quem assinou pelo seu link (${DIRECT_EXAMPLE_BRL} por pagamento no plano de R$ 39,90), e mais uma parte dos ${COMMISSION_NETWORK_PERCENT}% que se dividem entre a rede, até o ${MAX_COMMISSION_LEVELS}º nível. Ela só continua enquanto a pessoa continuar pagando. Por isso, ajudar o seu indicado a usar o app vale mais do que correr atrás do próximo cadastro.`,
      `Só como conta, e não como promessa: dez pessoas pagando por indicação direta somam dez vezes ${DIRECT_EXAMPLE_BRL} em um mês. Quantas pessoas vão assinar, e por quanto tempo, depende de cada uma delas.`,
      'Ajude nos primeiros 7 dias com um combinado simples: criar uma meta, criar um hábito e fazer 3 check-ins. Quem chega nesse ponto entende o valor do sistema e tende a continuar.',
      `Para receber: cadastre sua chave Pix na aba Receber e solicite o saque até quarta-feira, 23:59 (horário de Brasília), com saldo mínimo de ${brl(MIN_PAYOUT_CENTS)}. O pagamento é liberado manualmente na quinta e na sexta-feira daquela semana. Pedido feito depois da quarta, 23:59, entra no ciclo da semana seguinte.`,
      'Regras de ouro: sempre identifique que o link é de indicação, nunca prometa ganho ou resultado, não faça spam, não se passe pela marca e respeite a privacidade das pessoas. Não existe renda garantida: você só recebe quando pessoas reais assinam e continuam pagando.',
    ],
  },
];

export function courseWordCount(): number {
  return COURSE_LESSONS.flatMap((l) => [l.title, ...l.body]).join(' ').split(/\s+/).filter(Boolean).length;
}
