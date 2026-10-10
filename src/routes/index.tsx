import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import {
  Flame, Target, LayoutGrid, Sparkles, Timer, BookOpen, Wallet, Users, ShieldCheck,
  ChevronDown, ArrowRight, Check, X, Smartphone, Dumbbell, Brain, PiggyBank, Repeat2, Heart,
} from 'lucide-react';

export const Route = createFileRoute('/')({
  component: LandingPage,
});

const PAINS = [
  { icon: Dumbbell, title: 'Segunda você começa. Quarta você esquece.', text: 'O treino que ia virar rotina morreu na terceira semana — e ficou aquela sensação de “eu sempre faço isso”.' },
  { icon: PiggyBank, title: '“Pra onde foi meu dinheiro?”', text: 'O mês acaba, a conta fecha e você não sabe explicar onde foi parar o salário. De novo.' },
  { icon: Smartphone, title: 'Abriu o celular “rapidinho”.', text: 'Quarenta minutos depois, o foco do dia foi embora e a tarefa importante continua exatamente onde estava.' },
  { icon: Brain, title: 'A meta mora só na sua cabeça.', text: 'Meta que não vira plano, data e próximo passo é só desejo. E desejo não cumpre prazo.' },
  { icon: Repeat2, title: 'Falhou um dia, jogou a semana fora.', text: 'O famoso “já que quebrei, deixa pra recomeçar mês que vem”. O tudo-ou-nada é o que mais derruba gente boa.' },
  { icon: LayoutGrid, title: 'Dez apps, nenhum plano.', text: 'Notas aqui, planilha ali, lembrete no WhatsApp. Tudo espalhado — e você gasta energia só pra se organizar.' },
];

const PILLARS = [
  { icon: Target, title: 'Metas que viram plano', text: 'Ciclos de 7, 21, 40 ou 90 dias com meta principal, hábitos e o dia exato em que você está. Você sempre sabe o próximo passo.' },
  { icon: Timer, title: 'Foco sem ruído', text: 'Sessões 25/5 ou 50/10, um objetivo por vez e o registro de quanto tempo você realmente focou. Chega de “trabalhei o dia todo e não sei no quê”.' },
  { icon: Dumbbell, title: 'Treino e hábitos que ficam', text: 'Treino, leitura, sono, água, tempo longe das redes: você define as metas e marca o dia. Sem dieta, sem regra imposta, sem culpa.' },
  { icon: LayoutGrid, title: 'Quadros para organizar a vida', text: 'Kanban com colunas, prazos, checklist e comentários. Veja de uma vez o que está pendente, andando e concluído.' },
  { icon: Wallet, title: 'Dinheiro sob controle', text: 'Receitas, despesas, parcelas, contas a vencer e orçamento por categoria. Em um mês você sabe, em reais, para onde vai cada centavo.' },
  { icon: BookOpen, title: 'Diário e revisão semanal', text: 'Energia, humor e foco em 30 segundos por dia. Toda semana você enxerga o que funcionou e ajusta o rumo.' },
];

const TIMELINE = [
  { day: 'Hoje', text: 'Você cria sua conta, escolhe a meta e monta o primeiro ciclo em poucos minutos.' },
  { day: 'Dia 7', text: 'Acabou o teste grátis e você já sabe quanto focou, quantos dias cumpriu e quanto gastou.' },
  { day: 'Dia 21', text: 'O check-in diário virou parte da rotina — e os dias ruins deixaram de derrubar a semana.' },
  { day: 'Dia 40', text: 'O dinheiro tem destino, o treino tem frequência e a meta tem um caminho visível.' },
  { day: 'Dia 90', text: 'Você olha pra trás e tem registro de tudo o que fez. Não é sorte nem motivação: é sistema.' },
];

const COMPARE = [
  ['Meta guardada na cabeça', 'Meta com prazo, hábitos e próximo passo'],
  ['Foco depende do humor', 'Sessões guiadas e tempo focado registrado'],
  ['Dinheiro some no fim do mês', 'Cada gasto e cada conta à vista'],
  ['Falhou um dia = desistiu', 'Dia incompleto não é fracasso: retoma amanhã'],
  ['Vários apps soltos', 'Tudo no mesmo painel, no celular ou no PC'],
];

const FAQ = [
  { q: 'Já tentei outros apps e larguei. Por que seria diferente?', a: 'A maioria cobra perfeição: perdeu um dia, zerou a sequência. O Ritmo foi feito para quem é humano. Dia incompleto não é fracasso, e você ajusta o ciclo quando a vida muda. O teste é grátis justamente para você comprovar isso na prática.' },
  { q: 'Não tenho tempo. Isso vai me dar mais trabalho?', a: 'A ideia é o contrário: cerca de 10 minutos por dia para planejar, marcar o que fez e fechar o dia. O resto do tempo você usa para executar, não para se organizar.' },
  { q: 'Preciso de cartão de crédito para testar?', a: 'Não. Os 7 dias de teste começam assim que você cria a conta, sem cadastrar cartão.' },
  { q: 'Como funciona a cobrança?', a: 'São R$ 39,90 por 30 dias, pagos por Pix ou cartão no Mercado Pago. Não há cobrança automática escondida: você paga a cada ciclo e avisamos por e-mail antes do vencimento.' },
  { q: 'E se eu não gostar?', a: 'Cancele quando quiser, sem multa — o acesso segue até o fim do período pago. E vale o direito de arrependimento de 7 dias do Código de Defesa do Consumidor.' },
  { q: 'Meus dados financeiros e pessoais ficam seguros?', a: 'Cada conta só enxerga os próprios dados, as senhas ficam protegidas e você pode exportar ou excluir tudo pelo app (LGPD). Não pedimos acesso ao seu banco.' },
  { q: 'O Ritmo substitui médico, psicólogo ou educador físico?', a: 'Não. É uma ferramenta de organização pessoal. Não damos recomendação médica, dieta nem conselho de investimento.' },
  { q: 'Como funciona o programa de indicação?', a: 'Cada usuário tem um link próprio. Para cada assinatura paga confirmada por ele, você recebe 60% do valor (R$ 23,94 por pagamento) enquanto o indicado continuar pagando. Saque via Pix, sujeito às regras do programa. Não há promessa de renda: o resultado depende das suas indicações.' },
];

function LandingPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    // Guarda o código de indicação (?ref=) para atribuir a venda ao afiliado no cadastro.
    const ref = new URLSearchParams(window.location.search).get('ref');
    if (ref) localStorage.setItem('ritmo_referral', ref);
    fetch('/api/auth')
      .then((r) => r.json())
      .then((d) => setLoggedIn(Boolean(d?.user)))
      .catch(() => {});
  }, []);

  const cta = loggedIn ? '/app' : '/login?modo=cadastro';
  const ctaLabel = loggedIn ? 'Ir para o meu painel' : 'Começar meus 7 dias grátis';
  const btn =
    'inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-base shadow-xl shadow-emerald-500/25 transition-transform hover:scale-105';

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#f0f6fc] pb-20 md:pb-0">
      <div className="bg-emerald-500 text-slate-950 text-center text-xs sm:text-sm font-bold py-2 px-4">
        7 dias grátis · sem cartão de crédito · cancele quando quiser
      </div>

      <header className="sticky top-0 z-40 border-b border-[#30363d] bg-[#0d1117]/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-amber-500 flex items-center justify-center">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">Ritmo</span>
          </a>
          <nav className="flex items-center gap-2 sm:gap-3 text-sm">
            <a href="#solucao" className="hidden md:inline px-3 py-2 text-slate-300 hover:text-white">Solução</a>
            <a href="#preco" className="hidden md:inline px-3 py-2 text-slate-300 hover:text-white">Preço</a>
            <a href="/tutorial" className="hidden sm:inline px-3 py-2 text-slate-300 hover:text-white">Como funciona</a>
            {!loggedIn && <a href="/login" className="px-3 py-2 rounded-lg border border-[#30363d] text-slate-200 hover:bg-[#161b22] font-medium">Entrar</a>}
            <a href={cta} className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold">{loggedIn ? 'Meu painel' : 'Testar grátis'}</a>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(16,185,129,0.18),transparent)]" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-14 pb-16 text-center">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.1]">
            Você não tem um problema de disciplina.{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">Tem um problema de sistema.</span>
          </h1>
          <p className="mt-6 text-base sm:text-xl text-slate-300 max-w-2xl mx-auto">
            Treino que não vira rotina, meta que fica para segunda, dinheiro que some e foco roubado pelo celular.
            O Ritmo junta tudo num painel que te diz, todo dia, <strong className="text-white">qual é o próximo passo</strong>.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <a href={cta} className={`${btn} w-full sm:w-auto`}>{ctaLabel} <ArrowRight className="w-5 h-5" /></a>
            <a href="/tutorial" className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-xl border border-[#30363d] text-slate-200 hover:bg-[#161b22] font-semibold">Ver como funciona</a>
          </div>
          <p className="mt-4 text-xs text-slate-500">Leva 1 minuto para criar a conta. Depois do teste: R$ 39,90 por mês.</p>
        </div>
      </section>

      {/* DOR */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        <div className="text-center mb-10">
          <p className="text-sm font-bold text-rose-400 uppercase tracking-wider">Reconhece isso?</p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold">Todo mundo já prometeu “agora vai”.</h2>
          <p className="mt-3 text-slate-400">O problema nunca foi falta de vontade.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PAINS.map((p) => (
            <div key={p.title} className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-3"><p.icon className="w-5 h-5" /></div>
              <h3 className="font-bold mb-1">{p.title}</h3>
              <p className="text-sm text-slate-400">{p.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AGITAÇÃO / CUSTO DE NÃO AGIR */}
      <section className="border-y border-[#30363d] bg-[#0b0f14]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-14 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold">O que isso está te custando</h2>
          <div className="mt-6 space-y-4 text-slate-300 text-base sm:text-lg text-left sm:text-center">
            <p>Cada promessa quebrada com você mesmo ensina sua cabeça a <strong className="text-white">não acreditar na próxima</strong>. E aí começar fica cada vez mais pesado.</p>
            <p>Dinheiro que escapa sem você ver. Treino que não acontece. Projeto que fica “para quando der”. Tempo que vai embora na rolagem infinita.</p>
            <p className="text-white font-semibold">Daqui a 90 dias, o calendário vai ter andado de qualquer jeito. A única dúvida é se você vai estar no mesmo lugar ou 90 dias mais perto do que quer.</p>
          </div>
        </div>
      </section>

      {/* SOLUÇÃO */}
      <section id="solucao" className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-10">
          <p className="text-sm font-bold text-emerald-400 uppercase tracking-wider">A solução</p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold">Sistema vence força de vontade</h2>
          <p className="mt-3 text-slate-400 max-w-2xl mx-auto">Força de vontade acaba. Um sistema simples, visível e que perdoa falhas continua funcionando nos dias ruins.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PILLARS.map((f) => (
            <div key={f.title} className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 hover:border-emerald-500/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3"><f.icon className="w-5 h-5" /></div>
              <h3 className="font-bold mb-1">{f.title}</h3>
              <p className="text-sm text-slate-400">{f.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 flex items-start gap-3 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5 max-w-3xl mx-auto">
          <Heart className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
          <p className="text-sm text-slate-300"><strong className="text-white">Sem culpa, sem exageros.</strong> O Ritmo não empurra jejum, privação de sono nem isolamento. A rotina é sua, no nível que cabe na sua vida: leve, equilibrada ou intensiva.</p>
        </div>
      </section>

      {/* PRÉVIA DO PRODUTO */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-16">
        <div className="text-center mb-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold">Seu dia, num só olhar</h2>
          <p className="text-xs text-slate-500 mt-1">Exemplo ilustrativo da tela “Hoje”</p>
        </div>
        <div className="bg-[#161b22] border border-[#30363d] rounded-3xl p-5 sm:p-7 shadow-2xl shadow-emerald-500/5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-bold">Dia 12 de 40</span><span className="text-emerald-400 font-semibold">30%</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-[#21262d] overflow-hidden"><div className="h-full w-[30%] bg-emerald-500" /></div>
          <p className="mt-3 text-xs uppercase tracking-wide text-slate-500">Meta principal</p>
          <p className="font-semibold">Treinar 4x por semana e fechar o mês no azul</p>
          <div className="mt-5 grid sm:grid-cols-3 gap-3 text-sm">
            <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-4"><p className="text-slate-500 text-xs">Tarefas de hoje</p><p className="text-2xl font-extrabold">3/5</p></div>
            <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-4"><p className="text-slate-500 text-xs">Foco hoje</p><p className="text-2xl font-extrabold">75 min</p></div>
            <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-4"><p className="text-slate-500 text-xs">Hábitos feitos</p><p className="text-2xl font-extrabold">4/6</p></div>
          </div>
        </div>
      </section>

      {/* LINHA DO TEMPO */}
      <section className="border-y border-[#30363d] bg-[#0b0f14]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
          <h2 className="text-3xl font-extrabold text-center">Como podem ser seus próximos 90 dias</h2>
          <p className="text-center text-slate-400 mt-2 text-sm">Ciclos de 7, 21, 40 ou 90 dias: curtos para começar hoje, longos para mudar a rotina.</p>
          <ol className="mt-10 space-y-6">
            {TIMELINE.map((t) => (
              <li key={t.day} className="flex gap-4">
                <span className="shrink-0 w-20 text-right font-extrabold text-emerald-400">{t.day}</span>
                <span className="border-l-2 border-emerald-500/40 pl-4 text-slate-300">{t.text}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* COMPARAÇÃO */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <h2 className="text-3xl font-extrabold text-center mb-8">Sem o Ritmo × Com o Ritmo</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-rose-950/20 border border-rose-900/50 rounded-2xl p-5">
            <p className="font-bold text-rose-300 mb-3">Sem o Ritmo</p>
            <ul className="space-y-3 text-sm text-slate-300">{COMPARE.map((c) => <li key={c[0]} className="flex gap-2"><X className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />{c[0]}</li>)}</ul>
          </div>
          <div className="bg-emerald-950/20 border border-emerald-800/50 rounded-2xl p-5">
            <p className="font-bold text-emerald-300 mb-3">Com o Ritmo</p>
            <ul className="space-y-3 text-sm text-slate-300">{COMPARE.map((c) => <li key={c[1]} className="flex gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />{c[1]}</li>)}</ul>
          </div>
        </div>
      </section>

      {/* PREÇO */}
      <section id="preco" className="max-w-4xl mx-auto px-4 sm:px-6 pb-16">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold">Menos que um delivery. Mais que um app.</h2>
          <p className="mt-3 text-slate-400">São R$ 1,33 por dia para ter foco, rotina e dinheiro no mesmo lugar.</p>
        </div>
        <div className="max-w-md mx-auto bg-[#161b22] border border-emerald-500/40 rounded-3xl p-8 shadow-2xl shadow-emerald-500/10">
          <p className="text-sm font-semibold text-emerald-400">Ritmo PRO · plano único</p>
          <p className="mt-2 flex items-end gap-1"><span className="text-5xl font-extrabold">R$ 39,90</span><span className="text-slate-400 mb-1.5">/mês</span></p>
          <p className="mt-1 text-sm text-slate-400">Primeiros 7 dias grátis. Pix ou cartão.</p>
          <ul className="mt-6 space-y-3">
            {[
              'Metas, rotina, quadros, hábitos, foco, diário e finanças',
              'Celular e computador (instalável como app)',
              'Seus dados: exporte ou exclua quando quiser',
              'Programa de indicação com 60% de comissão',
            ].map((i) => <li key={i} className="flex items-start gap-2 text-sm text-slate-300"><Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" /> {i}</li>)}
          </ul>
          <a href={cta} className={`${btn} mt-8 w-full`}>{ctaLabel}</a>
          <div className="mt-5 space-y-2 text-[12px] text-slate-400">
            <p className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" /> Sem cartão para testar</p>
            <p className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" /> Cancele quando quiser, sem multa</p>
            <p className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" /> 7 dias de arrependimento garantidos por lei</p>
            <p className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" /> Pagamento seguro pelo Mercado Pago</p>
          </div>
        </div>
      </section>

      {/* PARA QUEM É */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-16">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6">
            <h3 className="font-bold text-emerald-300 mb-3">O Ritmo é para você se…</h3>
            <ul className="space-y-2 text-sm text-slate-300 list-disc pl-5">
              <li>já começou várias vezes e quer finalmente manter</li>
              <li>quer treinar, estudar ou empreender com constância</li>
              <li>precisa enxergar o próprio dinheiro com clareza</li>
              <li>aceita dar uns minutos por dia ao próprio plano</li>
            </ul>
          </div>
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6">
            <h3 className="font-bold text-rose-300 mb-3">Não é para você se…</h3>
            <ul className="space-y-2 text-sm text-slate-300 list-disc pl-5">
              <li>procura um milagre sem esforço</li>
              <li>espera conselho médico, psicológico ou de investimento</li>
              <li>quer um app que cobra perfeição e te faz sentir culpado</li>
            </ul>
          </div>
        </div>
      </section>

      {/* AFILIADOS */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 pb-16">
        <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-transparent p-8 text-center">
          <Users className="w-8 h-8 text-amber-400 mx-auto mb-3" />
          <h2 className="text-2xl font-extrabold">Gostou? Indique e receba 60% recorrente</h2>
          <p className="mt-3 text-slate-300 max-w-2xl mx-auto text-sm">
            Cada usuário ganha um link único. Quando alguém assina por ele, você recebe 60% do valor — R$ 23,94 por pagamento —
            enquanto a assinatura estiver ativa, com saque por Pix. Sem promessa de renda: o resultado depende das suas indicações.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-16">
        <h2 className="text-3xl font-extrabold text-center mb-8">Perguntas frequentes</h2>
        <div className="space-y-3">
          {FAQ.map((item, i) => (
            <div key={item.q} className="bg-[#161b22] border border-[#30363d] rounded-xl">
              <button onClick={() => setOpenFaq(openFaq === i ? null : i)} aria-expanded={openFaq === i} className="w-full flex items-center justify-between gap-3 text-left px-5 py-4 font-semibold">
                {item.q}<ChevronDown className={`w-4 h-4 shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === i && <p className="px-5 pb-4 text-sm text-slate-400">{item.a}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-20 text-center">
        <Sparkles className="w-8 h-8 text-emerald-400 mx-auto mb-3" />
        <h2 className="text-3xl sm:text-4xl font-extrabold">Daqui a 7 dias você pode ter um sistema funcionando. Ou mais uma semana adiando.</h2>
        <p className="mt-4 text-slate-400">A decisão leva um minuto. O teste é grátis, sem cartão e sem compromisso.</p>
        <a href={cta} className={`${btn} mt-8`}>{ctaLabel} <ArrowRight className="w-5 h-5" /></a>
      </section>

      <footer className="border-t border-[#30363d] py-8 text-center text-xs text-slate-500 space-y-2">
        <div className="flex items-center justify-center gap-4">
          <a href="/termos" className="hover:text-slate-300">Termos de Uso</a>
          <a href="/privacidade" className="hover:text-slate-300">Política de Privacidade</a>
          <a href="/tutorial" className="hover:text-slate-300">Tutorial</a>
        </div>
        <p>O Ritmo não substitui aconselhamento médico, psicológico ou financeiro profissional. Resultados dependem do uso e da rotina de cada pessoa.</p>
        <p>© {new Date().getFullYear()} Ritmo</p>
      </footer>

      {/* Barra fixa no celular */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#0d1117]/95 backdrop-blur border-t border-[#30363d] p-3" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
        <a href={cta} className="block text-center py-3 rounded-xl bg-emerald-500 text-slate-950 font-extrabold">{ctaLabel}</a>
      </div>
    </div>
  );
}
