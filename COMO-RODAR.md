# Ritmo — Como colocar para rodar

Páginas do site:

| Endereço | O que é |
|---|---|
| `/` | **Página de venda** (apresentação, preço R$ 39,90, 7 dias grátis, afiliados, FAQ) |
| `/login` | **Login / cadastro / recuperar senha** (`/login?modo=cadastro` abre direto no cadastro) |
| `/app` | **O app** (só para quem está logado; teste expirado → vai para `/checkout`) |
| `/checkout` | Assinatura: Pix e cartão (Mercado Pago), cupom, faturas |
| `/tutorial` | Guia de uso |
| `/admin` | **Painel do administrador** (só para quem tem papel admin) |
| `/termos`, `/privacidade` | Termos de Uso e Política de Privacidade (minutas) |

## Parte 1 — Testar no seu computador

1. Instale o **Node.js LTS** (nodejs.org). Feche e abra o terminal depois.
2. Extraia o zip, abra o terminal **dentro da pasta `src_extracted`** e rode:
   ```
   npm install
   copy .env.example .env.local      (Mac/Linux: cp .env.example .env.local)
   npm run dev
   ```
3. Abra http://localhost:3000 — deve aparecer a página de venda.
4. Clique em **Começar 7 dias grátis**, crie uma conta e você cai em `/app`.

Local, sem banco real, os dados ficam só na memória (somem ao reiniciar). O checkout fica em
"modo demonstração" e o código de recuperação de senha aparece na tela. É esperado.
Para virar admin no teste: no `.env.local` deixe `ADMIN_EMAILS` com o e-mail que você vai cadastrar.

## Parte 2 — Publicar na Netlify

1. Crie um repositório no GitHub e envie a pasta `src_extracted` (a raiz do repositório deve conter `package.json`).
2. Netlify → **Add new site → Import an existing project** → escolha o repositório. O `netlify.toml` já tem o build.
3. Ative o **Netlify Database** no painel do site (as migrations rodam sozinhas no deploy).
4. **Site configuration → Environment variables**, crie:
   - `JWT_SECRET` → texto longo e aleatório seu. **Obrigatório**: sem ele o login não funciona em produção.
   - `ADMIN_EMAILS` → seu e-mail (para virar administrador).
   - `CRON_SECRET` → outro texto longo e aleatório (libera o envio diário de lembretes de vencimento).
5. Faça o deploy, abra o site, **cadastre-se com o e-mail do `ADMIN_EMAILS`** e abra `/admin`.
   Depois de confirmar que entrou como admin, **apague** a variável `ADMIN_EMAILS`.

## Parte 3 — Ligar pagamento e e-mail (comece em modo de teste)

1. **Mercado Pago**: crie a aplicação em mercadopago.com.br/developers, pegue o *Access Token*
   (use o de TESTE primeiro). Crie `MERCADOPAGO_ACCESS_TOKEN`. Em Webhooks cadastre
   `https://SEU-SITE/api/webhooks/mercadopago` e copie a chave secreta para `MERCADOPAGO_WEBHOOK_SECRET`.
   Faça um novo deploy. Quando o aviso "Modo demonstração" sumir do checkout, está ativo.
2. **E-mail (Resend)**: crie `RESEND_API_KEY` e `EMAIL_FROM`. Teste "Esqueci minha senha": o código deve
   chegar por e-mail e não aparecer mais na tela.
3. Teste uma compra completa. Só então troque para o Access Token de **produção**.

## Como funciona a cobrança (leia)

- Plano único: **R$ 39,90 por 30 dias**, pago por Pix ou cartão (Mercado Pago).
- A cobrança é **manual a cada ciclo**: não há débito automático recorrente no cartão. O cliente recebe e-mail
  3 dias e 1 dia antes de vencer (e 2 e 1 dia antes do fim do teste) e renova em `/checkout`.
- Pagar antes do vencimento **soma** 30 dias ao que sobrou. Venceu e não pagou → acesso pausado (dados ficam guardados).
- Cancelar (em `/checkout`) mantém o acesso até o fim do período pago.
- Cada pagamento confirmado de um indicado gera 60% de comissão (aprovada para saque manual). A confirmação é
  idempotente: webhook repetido ou polling não duplicam assinatura nem comissão.
- Débito automático no cartão exigiria a API de Assinaturas do Mercado Pago (não incluída nesta versão).

## Transformar em app de celular

O Ritmo já é um **PWA** (instalável), sem custo e sem loja:
- **Android (Chrome):** abra o site → botão “Instalar app” no topo (ou menu ⋮ → Instalar aplicativo).
- **iPhone (Safari):** abra o site → Compartilhar → “Adicionar à Tela de Início”.
O app abre direto em `/app`, em tela cheia.

Para estar na **Google Play / App Store** é preciso empacotar com **Capacitor** (reaproveita este mesmo código):
conta Google Play (US$ 25, única) e Apple Developer (US$ 99/ano), ícones/prints e revisão das lojas. Atenção: a Apple
exige compra dentro do app (In-App Purchase) para assinaturas de conteúdo digital vendidas dentro do app iOS —
planeje isso antes de publicar na App Store.

## Parte 4 — Antes de vender de verdade

- CNPJ/MEI para emitir nota fiscal.
- Preencha os campos `[preencher]` de `/termos` e `/privacidade` e peça revisão de um advogado.
- (Opcional) domínio próprio na Netlify; atualize `MERCADOPAGO_WEBHOOK_URL`.
- Faça uma compra real de R$ 39,90 com você mesmo, confira no `/admin` e peça o estorno.

## Observações importantes

- Mudar o `JWT_SECRET` depois de publicado desloga todos os usuários.
- O saque de comissões é **manual**: o afiliado pede, você paga o Pix pelo seu banco e marca como pago em `/admin → Saques`.
- Este código foi revisado, mas **ainda não foi compilado nem testado de ponta a ponta** — rode a Parte 1 e me envie qualquer erro.
