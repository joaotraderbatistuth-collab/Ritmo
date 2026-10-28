# Ritmo — Foco, Hábitos & Organização Financeira Pessoal

**Ritmo** é uma aplicação web completa e equilibrada de produtividade, acompanhamento de hábitos e controle financeiro pessoal, inspirada no conceito de imersão ("Modo Caverna").

Diferente de abordagens extremistas, o Ritmo foi desenhado para incentivar consistência, foco e autonomia sustentáveis — sem promover isolamento social extremo, privação de sono, dietas restritivas ou culpa por metas não cumpridas.

---

## 🚀 Funcionalidades Principais

1. **Autenticação & Privacidade (LGPD)**
   - Cadastro, login, logout e recuperação de senha.
   - Dados totalmente privados e isolados por usuário no backend e no banco de dados.
   - Opção de exportação completa (JSON/CSV) e exclusão definitiva de conta.

2. **Onboarding & Ciclos de Foco (7, 21, 40 ou 90 Dias)**
   - Definição da meta principal e secundárias.
   - Seleção de nível de intensidade: *Leve*, *Equilibrado* ou *Intensivo*.
   - Limites digitais conscientes estabelecidos pelo próprio usuário.

3. **Painel Principal ("Hoje")**
   - Dia atual do ciclo, progresso percentual e meta em destaque.
   - Tarefas e hábitos do dia organizados em blocos de tempo (Manhã, Tarde, Noite).
   - Início rápido de blocos de foco de 25 min (Pomodoro) ou 50 min (Imersão).
   - Resumo financeiro do mês e mensagens de incentivo suaves.

4. **Rotina & Tarefas**
   - Criação, edição, conclusão e exclusão de tarefas.
   - Reagendamento com 1 clique de tarefas pendentes sem perder o histórico.
   - Filtros por categoria (Trabalho, Estudo, Saúde, Finanças, Pessoal) e prioridade.

5. **Hábitos & Saúde**
   - Acompanhamento flexível de movimento/exercício, estudo/leitura, meditação/respiração, sono regular, hidratação e desconexão digital.
   - Matriz visual dos últimos 7 dias.
   - Nota visível de integridade: não substitui cuidados médicos ou psicológicos.

6. **Sessões de Foco (Pomodoro)**
   - Temporizador interativo com modos 25/5, 50/10 e duração personalizada.
   - Ring visual de progresso, alerta sonoro via Web Audio API e descrição do foco.
   - Histórico e métricas de minutos focados por dia e semana.

7. **Diário de Bordo & Revisões**
   - Check-in diário com notas de Energia, Humor e Foco (1 a 5).
   - Perguntas de reflexão: *"O que funcionou hoje?"* e *"Qual é o próximo passo?"*.
   - Revisão semanal de metas e ajustes.

8. **Controle Financeiro Pessoal**
   - Registro de receitas e despesas com categoria, conta/carteira, forma de pagamento, recorrência e compras parceladas.
   - Acompanhamento de contas a pagar, vencimentos futuros e contas atrasadas.
   - Exportação completa dos lançamentos em **CSV** e **JSON**.
   - Aviso legal: ferramenta de organização pessoal, sem aconselhamento de investimentos.

9. **Registro Financeiro pelo WhatsApp (Cloud API Oficial)**
   - Simulador interativo em tempo real para testar frases em português do Brasil:
     - *"Gastei 42,50 no almoço."*
     - *"Paguei R$ 120 de internet hoje."*
     - *"Recebi 800 reais de um trabalho."*
     - *"quanto gastei este mês?"*
   - Detecção de ambiguidades que solicita informações complementares antes de salvar.
   - Endpoint de webhook seguro `/api/integrations` compatível com a Meta Cloud API.

10. **Sincronização com Planilhas (Google Sheets)**
    - Estrutura de colunas padronizadas (`ID`, `Data`, `Tipo`, `Descrição`, `Categoria`, `Valor`, `Conta`, `FormaPagamento`, `Status`, `Observações`).
    - Sincronização automática e exportação direta em CSV.

11. **Módulo de Afiliados ("Indique e Ganhe")**
    - Comissão padrão de **30% recorrente** sobre o valor líquido recebido.
    - Atribuição transparente via último link válido antes do cadastro.
    - Prevenção rigorosa de autoindicação e tratamento de reembolsos/estornos.
    - Painel com link único, cliques, conversões, comissões aprovadas e histórico detalhado.

12. **Lembretes & Acessibilidade**
    - Suporte a notificações no navegador para tarefas, hábitos e vencimentos financeiros.
    - Tema escuro e claro ajustável com contraste ideal e layout responsivo mobile-first.

---

## 🛠️ Tecnologias Utilizadas

- **Framework**: TanStack Start + React 19 + TypeScript
- **Roteamento**: TanStack Router (rotas de páginas e endpoints de API `/api/*`)
- **Estilização**: Tailwind CSS v4 com variáveis customizadas para design focado
- **Banco de Dados**: Netlify Database (PostgreSQL gerenciado) com **Drizzle ORM** (`@beta`)
- **Migrações**: Geradas via `drizzle-kit` em `netlify/database/migrations/`
- **Autenticação**: Criptografia de senhas com `bcryptjs` e tokens de sessão JWT com `jose`
- **Ícones**: `lucide-react`

---

## 💻 Como Executar Localmente

1. **Clonar e instalar dependências**:
   ```bash
   git clone <url-do-repositorio>
   cd ritmo
   npm install
   ```

2. **Configurar variáveis de ambiente**:
   ```bash
   cp .env.example .env
   ```

3. **Iniciar o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```
   A aplicação estará disponível em `http://localhost:3000`.

---

## 🗄️ Banco de Dados & Migrações

O Ritmo utiliza o **Netlify Database** (PostgreSQL nativo).
- O esquema de tabelas está definido em `db/schema.ts`.
- As migrações automáticas ficam em `netlify/database/migrations/`.
- Ao alterar o esquema, gere a nova migração com:
  ```bash
  npx drizzle-kit generate --name nome_da_migracao
  ```
- No deploy para a Netlify, as migrações são aplicadas automaticamente pela plataforma.

---

## 🔌 Configuração de Serviços Externos

### 1. WhatsApp Business Cloud API (Meta)
1. Acesse o portal [Meta for Developers](https://developers.facebook.com/).
2. Crie um aplicativo do tipo **Business** e adicione o produto **WhatsApp**.
3. No painel de Webhooks do WhatsApp:
   - **URL de Retorno de Chamada**: `https://seu-site.netlify.app/api/integrations`
   - **Token de Verificação**: o mesmo valor definido em `WHATSAPP_VERIFY_TOKEN`.
   - Assine os eventos do campo `messages`.
4. Defina as variáveis no Netlify: `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_APP_SECRET`.

### 2. Google Sheets
1. No [Google Cloud Console](https://console.cloud.google.com/), ative a **Google Sheets API**.
2. Crie uma **Conta de Serviço (Service Account)** e baixe a chave JSON.
3. Configure o JSON na variável `GOOGLE_SERVICE_ACCOUNT_KEY`.
4. Compartilhe sua planilha Google com o e-mail da Conta de Serviço concedendo acesso de **Editor**.

---

## 🧪 Testes Executados

A suíte de testes em `tests/ritmo.test.ts` valida:
- Reconhecimento e extração de valores, categorias, tipos e datas em português do Brasil pelo parser do WhatsApp.
- Detecção de ambiguidades e geração de respostas explicativas.
- Cálculo de comissões de afiliados (30% sobre valor líquido), rejeição de autoindicações e formatação monetária BRL.
- Formatação de dados para sincronização com planilhas e serialização CSV consistente.

---

## 🚀 Publicação (Deploy)

A publicação na Netlify é contínua e automática:
1. Conecte o repositório ao painel da Netlify.
2. O arquivo `netlify.toml` já está configurado com o comando de build `vite build` e publicação em `dist/client`.
3. O Netlify Database é provisionado automaticamente na primeira publicação e as migrações em `netlify/database/migrations/` são aplicadas de forma segura.
