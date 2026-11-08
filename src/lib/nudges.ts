// Lembretes motivacionais do Ritmo ("empurrõezinhos"): convidam a pessoa a usar o app,
// um de cada vez, em horários diferentes do dia. Lógica PURA, testada em tests/.
//
// Como são entregues aos poucos:
//  • no sino do app aparece só 1 por período (manhã, tarde, noite);
//  • no celular (notificação), no máximo 1, 2 ou 3 por dia, conforme a escolha da pessoa;
//  • a ordem gira por dia e por pessoa, então ela leva semanas para ver uma repetição.

export type NudgeSlot = 'manha' | 'tarde' | 'noite';

export interface Nudge {
  id: string;
  slot: NudgeSlot;
  title: string;
  body: string;
  /** Aba do app que abre ao tocar. */
  tab: string;
}

const N = (id: string, slot: NudgeSlot, tab: string, title: string, body: string): Nudge => ({ id, slot, tab, title, body });

export const NUDGES: Nudge[] = [
  // ---------------- MANHÃ (planejar e começar) ----------------
  N('m01', 'manha', 'hoje', 'Bom dia, {nome}! ☀️', 'Qual é a única tarefa que, feita hoje, já faz o dia valer? Coloque ela no topo.'),
  N('m02', 'manha', 'quadros', 'Bom dia! Que tal criar um card?', 'Tem algo rodando na cabeça? Tira de lá: vira um card no seu quadro em 10 segundos.'),
  N('m03', 'manha', 'foco', 'Primeiro bloco do dia', 'Que tal 25 minutos de foco antes de abrir as redes sociais? O resto do dia agradece.'),
  N('m04', 'manha', 'rotina', 'Planeje em 2 minutos', 'Três tarefas para hoje: uma grande, uma média, uma pequena. Pronto, dia planejado.'),
  N('m05', 'manha', 'habitos', 'Bom dia, {nome}!', 'Um copo de água agora e um check no hábito. Começar ganhando muda o resto do dia.'),
  N('m06', 'manha', 'hoje', 'Hoje é dia de quê?', 'Abra o Ritmo, veja o que já está agendado e escolha a prioridade nº 1.'),
  N('m07', 'manha', 'habitos', 'Que tal um treino hoje?', 'Nem que seja 15 minutos. Marque no hábito e mantenha a corrente da semana.'),
  N('m08', 'manha', 'financas', 'Bom dia! Algum gasto ontem?', 'Leva 10 segundos registrar. No fim do mês você vai saber exatamente para onde foi o dinheiro.'),
  N('m09', 'manha', 'feed', 'A comunidade já acordou 🌅', 'Veja o que o pessoal conquistou ontem e deixe um “bora!” para alguém.'),
  N('m10', 'manha', 'quadros', 'Card parado é peso na cabeça', 'Escolha um card de “A fazer” e mova para “Em andamento”. Só isso já destrava.'),
  N('m11', 'manha', 'foco', 'Seu cérebro rende mais agora', 'As primeiras horas costumam ser as mais claras. Proteja 25 minutos para o que importa.'),
  N('m12', 'manha', 'rotina', 'Bom dia, {nome}! Bloco da manhã', 'Separe o que é da manhã, da tarde e da noite. Dia dividido é dia que anda.'),
  N('m13', 'manha', 'habitos', 'Sua corrente está te esperando 🔗', 'Cada semana cumprida é um elo. Que tal garantir o de hoje cedo?'),
  N('m14', 'manha', 'feed', 'Conheça um Ritus gratuito', 'Clube do Livro, Treino em Casa, Cozinha Prática... Entre em um e receba conteúdo novo no Feed.'),
  N('m15', 'manha', 'diario', 'Como você acordou?', 'Energia, humor e foco de 1 a 5. Em uma semana você enxerga padrões que nunca viu.'),
  N('m16', 'manha', 'hoje', 'Segunda chance de começar', 'Ontem não foi como queria? Tudo bem. Hoje é um novo dia na sua meta.'),
  N('m17', 'manha', 'quadros', 'Quebre a tarefa grande', 'Abra um card e crie um checklist com 3 passos pequenos. O primeiro leva 5 minutos.'),
  N('m18', 'manha', 'foco', 'Celular em outro cômodo', 'Experimente hoje: 1 bloco de foco com o celular longe. Depois conte no Feed como foi.'),
  N('m19', 'manha', 'habitos', 'Leitura de 10 minutos?', 'Dez páginas por dia são mais de 15 livros por ano. Que tal começar agora?'),
  N('m20', 'manha', 'financas', 'Tem conta vencendo?', 'Dê uma olhada nas contas a pagar desta semana e evite juros bobos.'),
  N('m21', 'manha', 'hoje', 'Bom dia! Uma frase para hoje', 'Feito é melhor que perfeito. Escolha a tarefa e comece mal, mas comece.'),
  N('m22', 'manha', 'rotina', 'Água, luz e a tarefa nº 1', 'Três coisas para os primeiros 30 minutos. A terceira está no seu app.'),

  // ---------------- TARDE (retomar e avançar) ----------------
  N('t01', 'tarde', 'foco', 'Hora de um ciclo de foco?', 'O pós-almoço é traiçoeiro. 25 minutos de foco agora salvam a tarde.'),
  N('t02', 'tarde', 'quadros', 'Que tal fechar um card hoje?', 'Escolha o card mais perto de terminar e leve até “Concluído”. Depois compartilhe no Feed!'),
  N('t03', 'tarde', 'rotina', 'Como está o seu dia, {nome}?', 'Metade do dia passou. Marque o que já fez e reorganize o que falta.'),
  N('t04', 'tarde', 'habitos', 'Já bebeu água hoje? 💧', 'Se o hábito de água está na sua lista, é um bom momento para marcar.'),
  N('t05', 'tarde', 'feed', 'Alguém precisa do seu incentivo', 'Passe no Feed e comente na conquista de alguém. Leva 20 segundos e faz o dia da pessoa.'),
  N('t06', 'tarde', 'foco', 'Uma tarefa, 25 minutos', 'Feche as abas, escolha uma tarefa e aperte o play. Você consegue.'),
  N('t07', 'tarde', 'financas', 'Almoçou fora?', 'Registre o gasto agora, antes de esquecer. Pequenos valores somam no fim do mês.'),
  N('t08', 'tarde', 'quadros', 'Tem card atrasado?', 'Reveja o vencimento ou divida em partes menores. Card atrasado parado só pesa.'),
  N('t09', 'tarde', 'habitos', 'Que tal um treino hoje?', 'Uma caminhada de 20 minutos depois do trabalho já conta. Marque no hábito!'),
  N('t10', 'tarde', 'feed', 'Poste uma foto do seu dia 📸', 'Mesa arrumada, treino feito, comida caprichada: mostre no Feed o que deu certo hoje.'),
  N('t11', 'tarde', 'rotina', 'Remarque sem culpa', 'Tarefa que não vai dar hoje? Mude para amanhã. Dia incompleto não é fracasso.'),
  N('t12', 'tarde', 'foco', 'Seu recorde de foco', 'Quantos minutos você focou hoje? Mais um bloco pode bater o seu melhor dia.'),
  N('t13', 'tarde', 'feed', 'Novidade nos Ritus', 'Veja o que saiu de novo nos Ritus que você segue. Comente e tire suas dúvidas.'),
  N('t14', 'tarde', 'quadros', 'Organize o quadro em 3 minutos', 'Arraste cada card para a coluna certa. Quadro em dia, cabeça leve.'),
  N('t15', 'tarde', 'hoje', 'Pausa consciente', 'Levante, estique, respire. Depois volte e faça mais um bloco curto.'),
  N('t16', 'tarde', 'afiliados', 'Seu link pode render', 'Conhece alguém que vive dizendo “preciso me organizar”? Mande o seu link do Ritmo.'),
  N('t17', 'tarde', 'habitos', 'A corrente da semana', 'Veja quantos dias faltam para fechar a meta da semana em cada hábito.'),
  N('t18', 'tarde', 'foco', 'Tarde produtiva começa agora', 'Escreva o objetivo do próximo bloco em uma frase e comece.'),
  N('t19', 'tarde', 'feed', 'Crie o seu Ritus', 'Sabe ensinar algo? Crie um Ritus, defina o preço e publique conteúdo exclusivo.'),
  N('t20', 'tarde', 'quadros', 'Ideia nova? Card novo!', 'Não deixe a ideia se perder: crie um card com título e uma linha de descrição.'),
  N('t21', 'tarde', 'financas', 'Seu orçamento da semana', 'Dê uma olhada na categoria em que você mais gastou. Dá para ajustar algo?'),

  // ---------------- NOITE (fechar o dia e preparar o próximo) ----------------
  N('n01', 'noite', 'diario', 'Como foi o seu dia, {nome}?', 'Três notas e duas perguntas no diário. Trinta segundos que mudam o que você enxerga.'),
  N('n02', 'noite', 'habitos', 'Marque seus hábitos de hoje ✅', 'O que você já fez hoje? Marque antes de dormir e não perca o elo da semana.'),
  N('n03', 'noite', 'rotina', 'Deixe o amanhã pronto', 'Escolha agora a tarefa nº 1 de amanhã. Você acorda sabendo por onde começar.'),
  N('n04', 'noite', 'feed', 'Compartilhe uma conquista 🏆', 'Fechou um card, focou, treinou? Mostre no Feed e inspire alguém.'),
  N('n05', 'noite', 'financas', 'Fechamento do dia', 'Registre os gastos de hoje. Leva um minuto e evita a surpresa no fim do mês.'),
  N('n06', 'noite', 'quadros', 'Mova o que você terminou', 'Leve para “Concluído” os cards de hoje. Ver o progresso motiva para amanhã.'),
  N('n07', 'noite', 'diario', 'O que tornou seu dia mais fácil?', 'Anote no diário. Repetir o que funciona é o caminho mais curto.'),
  N('n08', 'noite', 'habitos', 'Ainda dá tempo', 'Um hábito pequeno ainda cabe hoje: 10 páginas, 10 minutos de alongamento, um copo de água.'),
  N('n09', 'noite', 'feed', 'Veja quem mandou bem hoje', 'Passe no Feed, curta e comente. Comunidade forte é a que comemora junto.'),
  N('n10', 'noite', 'rotina', 'Celular longe da cama 📵', 'Deixe carregando em outro lugar hoje. Amanhã você conta como acordou.'),
  N('n11', 'noite', 'diario', 'O que você não deve repetir?', 'Uma frase no diário e amanhã você já começa melhor.'),
  N('n12', 'noite', 'hoje', 'Boa noite, {nome}', 'Seja gentil com você: o que não deu hoje vai para amanhã. Descanse bem.'),
  N('n13', 'noite', 'feed', 'Leia uma resenha no Clube do Livro', 'Antes de dormir, troque a rolagem infinita por uma resenha curta e um capítulo.'),
  N('n14', 'noite', 'quadros', 'Planeje a semana no quadro', 'Crie os cards dos próximos dias. Semana planejada rende o dobro.'),
  N('n15', 'noite', 'progresso', 'Olhe o seu progresso', 'Veja o calendário de consistência. Você fez mais do que imagina.'),
  N('n16', 'noite', 'financas', 'Quanto sobrou este mês?', 'Confira o saldo do mês e quanto já foi para a reserva.'),
  N('n17', 'noite', 'habitos', 'Faltam poucos dias para fechar a semana', 'Veja os hábitos que precisam de mais um check até domingo.'),
  N('n18', 'noite', 'diario', 'Domingo é dia de revisão', 'Se for domingo, faça a revisão da semana: o que funcionou e o que ajustar.'),
  N('n19', 'noite', 'feed', 'Poste a foto do treino ou da janta', 'Uma foto vale mais que mil intenções. Mostre no Feed o que você fez hoje.'),
  N('n20', 'noite', 'rotina', 'Amanhã começa agora', 'Três tarefas para amanhã, separadas por manhã, tarde e noite. Pronto.'),
  N('n21', 'noite', 'foco', 'Quanto você focou hoje?', 'Veja os minutos de foco do dia. Amanhã tente um bloco a mais.'),
];

/** Período do dia a partir da hora local (0–23). Madrugada não recebe lembrete. */
export function slotForHour(hour: number): NudgeSlot | null {
  if (hour >= 6 && hour < 12) return 'manha';
  if (hour >= 12 && hour < 18) return 'tarde';
  if (hour >= 18 && hour < 23) return 'noite';
  return null;
}

/** Horários (locais) em que a notificação no celular é enviada, conforme quantas por dia a pessoa quer. */
export const PUSH_HOURS: Record<number, number[]> = { 1: [8], 2: [8, 19], 3: [8, 13, 19] };

/** Horários escolhidos pela pessoa (0 a 23, até 3, sem repetir). Vazio/ inválido → o padrão para `perDay`. */
export function normalizePushHours(raw: unknown, perDay = 3): number[] {
  const list = (Array.isArray(raw) ? raw : typeof raw === 'string' ? raw.split(',') : [])
    .map((v) => Number(String(v).trim()))
    .filter((n) => Number.isInteger(n) && n >= 0 && n <= 23);
  const uniq = [...new Set(list)].sort((a, b) => a - b).slice(0, 3);
  return uniq.length ? uniq : PUSH_HOURS[[1, 2, 3].includes(perDay) ? perDay : 3];
}

/** Período do lembrete para QUALQUER hora escolhida (madrugada usa os da noite). */
export function slotForAnyHour(hour: number): NudgeSlot {
  if (hour >= 5 && hour < 12) return 'manha';
  if (hour >= 12 && hour < 18) return 'tarde';
  return 'noite';
}

const dayNumber = (ymd: string) => Math.floor(new Date(`${ymd}T12:00:00Z`).getTime() / 86400000);

/** Escolhe o lembrete do período: gira por dia e varia por pessoa (seed = id do usuário). */
export function pickNudge(slot: NudgeSlot, ymd: string, seed = 0): Nudge {
  const list = NUDGES.filter((n) => n.slot === slot);
  const i = (((dayNumber(ymd) + seed * 7) % list.length) + list.length) % list.length;
  return list[i];
}

/** Troca {nome} pelo primeiro nome (ou tira a vírgula quando não há nome). */
export function personalize(text: string, fullName?: string | null): string {
  const first = String(fullName || '').trim().split(/\s+/)[0] || '';
  return first ? text.replace(/\{nome\}/g, first) : text.replace(/,? ?\{nome\}/g, '');
}
