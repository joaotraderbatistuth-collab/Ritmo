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

**Páginas**
- `/vendas`: página de vendas longa, com demonstrações animadas, simulador do programa de indicação e FAQ. Use este endereço nos anúncios.

## Migrations novas (rodam sozinhas no deploy da Netlify)
1. `20261027120000_add_journal_reflections`: duas colunas no diário.
2. `20261027130000_commission_levels_35`: coluna de nível nas comissões e novos padrões (atualiza também o texto de termos guardado em `affiliate_settings`).

3. `20261028120000_admin_panel`: permissões dos administradores (coluna em `users`) e tabela de auditoria `admin_audit_log`.

Se alguma migration não rodar, partes do app podem parar de carregar dados do banco. Confira no painel da Netlify (Database) depois do deploy.

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

## Pendências conhecidas (não são bugs novos, mas vale decidir)
- O acesso de quem pediu reembolso continua ativo (o estorno mexe só nas comissões).
- Não há desconto automático em saques futuros de comissões que já tinham sido pagas antes do estorno.
- O saque mínimo continua em R$ 23,94 (`MIN_PAYOUT_CENTS`), equivalente a 3 indicações diretas.
- Os textos falam em "valor líquido", mas o cálculo usa o valor pago, sem descontar taxa do Mercado Pago.
- O app não guarda UTM no cadastro: para medir anúncios, instale uma ferramenta de análise (GA4, Plausible etc.) em `/` e `/vendas`.
- Termos: revise com um advogado o direito de arrependimento de 7 dias para compras online (CDC, art. 49) e o texto do programa de afiliados antes de divulgar.
