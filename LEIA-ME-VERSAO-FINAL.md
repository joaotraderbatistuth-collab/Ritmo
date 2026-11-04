# Ritmo — versão final (outubro de 2026)

## O que tem nesta versão

**Tela inicial**
- Cards personalizáveis: arrastar (computador) ou usar as setas (celular), ocultar e adicionar do catálogo. A ordem fica salva no aparelho.
- Card **Não Quebre a Corrente**: conta semanas seguidas cumprindo a meta de cada hábito (semana de segunda a domingo; troque em `src/lib/chain.ts`, constante `WEEK_STARTS_ON`).
- Novos cards no catálogo: Evolução dos hábitos, Produtividade da semana e Metas pessoais.
- Botões da tela "Hoje" corrigidos (levavam a uma aba em branco).

**Usabilidade**
- Menu horizontal com setas e degradê nas bordas.
- Horário das rotinas em 24h (hora e minuto), sem AM/PM.
- Checklist do Kanban: botão "Adicionar", excluir sempre visível e edição de itens.
- Datas de hábitos, progresso e diário agora usam o dia local (antes caíam no dia seguinte depois das 21h).

**Diário**
- Reflexão do dia com as duas perguntas: "O que fiz hoje que tornou minha vida mais fácil?" e "O que fiz hoje que não devo repetir?". A revisão semanal mostra as respostas dos últimos 7 dias.

**Comissões**
- Plano em rede: 25% nível 1 + 10% até o nível 4 (5% / 3% / 2%), no máximo 35% de cada pagamento. Tudo em `src/lib/commission-plan.ts`.
- Estorno: reembolso ou chargeback no Mercado Pago reverte as comissões do pedido (níveis 1 a 4). Comissão já paga recebe aviso para descontar de saques futuros.
- Textos públicos, termos, tutorial, checkout e aba Afiliados atualizados.

**Painel de administração (`/admin`)**
- Administrador MASTER: `batistuth@live.com` (padrão; pode ser trocado pela variável `MASTER_ADMIN_EMAIL` na Netlify). Tem acesso total e grátis, e é o único que cria outros administradores e escolhe o que cada um vê e pode fazer. O master não pode ser desativado, removido nem editado por outros administradores.
- Abas: Visão geral (pessoas, conversão, uso em 7 dias, receita, gráficos), Usuários (buscar, editar, desativar/reativar, acesso grátis), Administradores (criar e definir permissões), Vendas (pagamentos reais x simulados, estorno), Cupons, Afiliados (ranking e rede), Saques, Planilhas (CSV) e Auditoria (quem fez o quê).
- Permissões por administrador: visão geral, valores e vendas, ver usuários, gerir usuários, cupons, afiliados, saques, estornos, planilhas e auditoria. Tudo é checado no servidor, não só escondido na tela. Só o master mexe em contas de administrador.
- Usuário desativado perde o login e a API na hora.
- Cupons: valida código, desconto (% OU R$), limite de usos e validade. O checkout agora respeita validade e limite.
- Segurança: antes, qualquer e-mail que CONTIVESSE "admin" virava administrador no cadastro. Isso foi removido. Depois do deploy, confira a aba Administradores e remova quem você não reconhecer.

**Aba "Indique e Ganhe" (para o usuário)**
- Seção **Receber (Pix)**: cadastro da chave Pix (CPF, e-mail, celular ou chave aleatória, com validação), pedido de saque e histórico. A regra aparece em destaque: pedir até quarta-feira 23:59 (horário de Brasília); pagamento manual na quinta e na sexta da mesma semana; pedido depois disso entra na semana seguinte. Há contador de tempo até o prazo. O saque sempre usa a chave cadastrada.
- Seção **Material de divulgação**: 10 modelos de story (PNG 1080x1920) gerados no navegador, com espaço para o link: deixar espaço para o adesivo do Instagram, deixar limpo ou escrever o link do usuário na imagem. Cada modelo tem legenda sugerida com o espaço do link e a identificação de link de indicação.
- Seção **Mini curso**: 5 lições, leitura de cerca de 5 minutos, com progresso salvo no aparelho.
- No painel de administração, a aba Saques mostra o ciclo (quinta e sexta), quanto pagar agora e os pedidos atrasados.
- Removido da tela do usuário o antigo "Painel de Administração & Webhooks" (simulador), que não era para clientes.

**Feed e Equipes (aba "Feed")**
- **Feed:** publicações de texto e conquistas (corrente, foco da semana, tarefas da semana, dia da meta). A pessoa escolhe o que compartilhar: nada é publicado sozinho. Curtir, comentar, excluir o próprio conteúdo e denunciar. Os outros veem só o primeiro nome e a inicial do sobrenome, nunca e-mail.
- **Equipes:** qualquer usuário cria uma equipe (nome, descrição, preço de R$ 5,00 a R$ 2.000,00 ou grátis, acesso único ou renovado a cada 30 dias, e se os membros também podem publicar). Cada equipe tem um link (`/?ref=SEU_CODIGO&equipe=CODIGO`).
- **Quem entra de graça:** quem se cadastra no Ritmo pelo link de indicação do criador (se ele deixar a opção ligada). **Quem não veio pelo link compra o acesso por Pix** (no modo de demonstração, sem Mercado Pago, há um botão de confirmação de teste).
- **Comissão:** a plataforma retém **40%** de cada venda; o criador fica com 60% (a diferença de centavos fica com o criador). O repasse entra no mesmo saldo das comissões de afiliado e é sacado por Pix com o mesmo ciclo (pedir até quarta 23:59, pago na quinta e na sexta).
- **Estorno:** reembolso ou contestação reverte o repasse do criador e remove o acesso comprado.
- **Moderação (nova permissão "Moderação do Feed" no painel admin):** 3 denúncias de pessoas diferentes escondem o conteúdo até a análise. O admin restaura, ignora, exclui, silencia o autor ou suspende a equipe. A aba Vendas mostra a comissão das equipes.
- **Limites anti-spam:** 10 publicações e 40 comentários por hora por pessoa; 20 denúncias por dia; até 5 equipes por criador.
- **Termos:** nova seção 5 em `/termos` (Feed e equipes).

**Modo ajuda de configuração**
- No primeiro acesso (conta com até 14 dias), depois da apresentação, abre o guia que leva por todas as 13 abas, uma por vez, dizendo o que configurar. O passo da meta tem botão para abrir o ciclo. Dá para minimizar, pausar (Esc ou X) e retomar. Usuários antigos usam o botão "Modo ajuda" do menu.

**Segurança (revisada nesta versão)**
- **Acesso expirado no servidor:** as rotas de dados (tarefas, hábitos, finanças, foco, quadros, diário, ciclos, marcos, integrações) respondem 402 quando o teste ou a assinatura venceu, e 401 para conta desativada. Antes, só a tela bloqueava; quem chamasse a API direto continuava usando.
- **Recuperação de senha:** responde igual exista ou não o e-mail (não revela quem tem conta); o código de 6 dígitos usa aleatoriedade criptográfica, é guardado só como hash, exige e-mail + código, vale 1 hora, só o mais recente funciona, 5 erros o invalidam e há no máximo 3 pedidos por hora. O código só aparece na resposta em desenvolvimento, nunca em produção.
- **Reembolso ou contestação no Mercado Pago:** além de reverter comissões e repasses, encerra o acesso da assinatura reembolsada (a pessoa pode assinar de novo).
- **Banco indisponível por instantes:** antes, uma falha na partida mandava a instância toda para a memória (onde os dados se perdem); agora o app tenta de novo depois de 20 segundos.

**Avisos (sino no menu)**
- Mostra na hora, sem chamar o servidor: teste ou assinatura vencendo, contas atrasadas e a vencer, recebimentos previstos, tarefa com horário nas próximas 2 horas ou que passou, corrente em risco, hábitos sem marcar à noite, diário, revisão de domingo e o prazo do saque na quarta. Respeita as opções de lembretes das Configurações.

**Páginas**
- `/vendas`: página de vendas longa, com demonstrações animadas, simulador do programa de indicação e FAQ. Use este endereço nos anúncios.

## Banco de dados: atualiza sozinho
Esta versão **não depende de migrações novas**. Na primeira vez que o app fala com o banco, ele roda `src/lib/schema-sync.ts`: instruções que só ACRESCENTAM o que falta (`IF NOT EXISTS`), sem apagar nem alterar dados. Por isso o pacote funciona sobre QUALQUER versão anterior do banco, tenha ou não recebido as migrações antigas. Foi testado partindo do banco antigo (anterior a 11/10), do completo, de um parcial e rodando duas vezes, conferindo as 32 tabelas e todas as colunas do código; e verificando que usuários, senhas, diário, pagamentos e comissões antigas continuam intactos.
- **Nunca apague nem altere a pasta `netlify/database/migrations` do repositório.** A Netlify exige que as migrações já aplicadas continuem lá. O script de atualização não toca nela.
- **Não adicione depois as migrações antigas** (`feed_and_teams`, `admin_panel` etc.): o esquema delas já é criado pelo app, e uma migração com `CREATE TABLE` sem `IF NOT EXISTS` falharia no deploy.
- Para criar coluna ou tabela no futuro, acrescente a instrução (com `IF NOT EXISTS`) em `schema-sync.ts` e no `db/schema.ts`.

## Roteiro de testes depois do deploy (15 minutos)
1. Criar uma conta nova, concluir o onboarding e abrir `/app`, `/vendas`, `/termos` e `/tutorial`.
2. Tela "Hoje": Personalizar, mover um card, ocultar, adicionar "Metas pessoais", recarregar e conferir que ficou salvo.
3. Criar um hábito de 3x por semana, marcar 3 dias e ver o card da corrente preservada.
4. Diário: salvar o check-in com as duas reflexões, recarregar e conferir.
5. Quadros: abrir um cartão, adicionar 3 itens no checklist, marcar, editar e excluir.
6. Rotina: criar uma tarefa com horário e conferir que não aparece AM/PM.
7. Afiliados: criar 3 contas encadeadas (A indicou B, B indicou C), pagar a assinatura de C com o ambiente de TESTE do Mercado Pago e conferir as comissões de B (25%) e A (5%) na aba Afiliados.
8. Estorno: reembolsar esse pagamento de teste no painel do Mercado Pago e conferir que as comissões viram "estornada" e o saldo zera.
9. Pedir um saque de teste e conferir o valor mínimo.
10. Painel admin: entrar com `batistuth@live.com` (se a conta ainda não existir, crie em `/login`), abrir `/admin` e conferir que aparecem todas as abas.
11. Criar um administrador de teste só com "Cupons", entrar com ele em outra janela anônima e conferir que só vê a aba Cupons e que `/api/admin?export=users` responde "sem permissão".
12. Desativar um usuário de teste e conferir que ele não consegue entrar. Reativar e conferir que volta.
13. Criar um cupom com validade ontem e conferir que o checkout recusa.
14. Baixar a planilha de usuários e abrir no Excel (acentos e colunas devem aparecer certos).
15. Criar uma conta nova: depois da apresentação, o modo ajuda deve abrir e passar pelas 13 abas. Pausar, fechar a página e voltar: ele retoma do mesmo passo.
16. Indique e Ganhe > Receber: tentar um CPF inválido (deve recusar), salvar um CPF válido e conferir que aparece formatado.
17. Com saldo de afiliado acima de R$ 23,94, pedir saque e conferir a mensagem (quinta e sexta) e o pedido no histórico. No admin > Saques, conferir a data de pagamento e o valor "para pagar agora".
18. Indique e Ganhe > Material de divulgação: baixar um modelo, abrir o PNG no celular e conferir o espaço do link. Testar os três modos de link.
19. Indique e Ganhe > Mini curso: abrir as 5 lições e marcar como concluídas.
20. Feed: publicar um texto e uma conquista, curtir, comentar, excluir o próprio post e denunciar o de outra conta.
21. Equipes: com duas contas, criar uma equipe (R$ 49,90), abrir o link com uma conta que NÃO veio pelo link (deve pedir compra), pagar (Pix de teste do Mercado Pago ou o botão de demonstração) e conferir que o conteúdo libera. Conferir que o criador recebeu R$ 29,94 (60%) no saldo e que o admin mostra R$ 19,96 de comissão da plataforma.
22. Cadastrar uma conta nova pelo link de indicação do criador e conferir que ela entra na equipe de graça.
23. Estornar o pedido da equipe pelo admin (aba Vendas) e conferir que o comprador perde o acesso e o saldo do criador cai.
24. Moderação: com 3 contas diferentes denunciar o mesmo post (ele deve sumir do feed), depois restaurar pelo admin > Moderação.

## Pendências conhecidas (não são bugs novos, mas vale decidir)
- O acesso de quem pediu reembolso continua ativo (o estorno mexe só nas comissões).
- Não há desconto automático em saques futuros de comissões que já tinham sido pagas antes do estorno.
- O saque mínimo continua em R$ 23,94 (`MIN_PAYOUT_CENTS`), equivalente a 3 indicações diretas.
- Os textos falam em "valor líquido", mas o cálculo usa o valor pago, sem descontar taxa do Mercado Pago.
- O app não guarda UTM no cadastro: para medir anúncios, instale uma ferramenta de análise (GA4, Plausible etc.) em `/` e `/vendas`.
- Feed e Equipes: sem imagens nas publicações (só texto e conquistas), compra de acesso só por Pix e sem renovação automática (o membro renova pagando de novo). Não há repasse automático ao criador: o dinheiro entra na plataforma e é sacado por Pix, como nas comissões.
- Equipes viram um marketplace: o criador tem obrigações fiscais sobre o que recebe e a plataforma sobre os 40% retidos. Combine com um contador a emissão de nota, o recolhimento de impostos e o que informar ao criador. Revise também a responsabilidade pelo conteúdo publicado por terceiros com um advogado.
- Moderação: com muito uso, vale ter alguém olhando a aba Moderação todos os dias.
- Ainda não feito: conexão com Strava e Spotify (cada uma exige que você crie um app de desenvolvedor no serviço e me passe as chaves), débito automático no cartão (contradiz o argumento de venda "sem renovação automática" e exige a assinatura recorrente do Mercado Pago), app empacotado com Capacitor (exige Android Studio/Xcode e conta de loja), imagens no Feed, divisão automática do pagamento e e-mail diário de resumo.
- Termos: revise com um advogado o direito de arrependimento de 7 dias para compras online (CDC, art. 49) e o texto do programa de afiliados antes de divulgar.
