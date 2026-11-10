import { useEffect, useRef, useState } from 'react';
import {
  Flame, ArrowRight, Check, ChevronDown, Crown, Infinity as InfinityIcon, Droplets, FlaskConical, Mic, MapPin, Trophy,
  Wallet, ListChecks, Timer, NotebookPen, LayoutGrid, Newspaper, Users, Bell, Smartphone, Sparkles, Share2, Banknote,
  ShieldCheck, Hourglass, Lock, Gift, Target, CalendarCheck, Heart, Zap, Hammer, MessageCircle,
} from 'lucide-react';
import { FOUNDER_SPOTS } from '../lib/access.js';
import { TEAM_PLATFORM_FEE_PERCENT } from '../lib/teams-plan.js';
import {
  COMMISSION_DIRECT_PERCENT, COMMISSION_NETWORK_PERCENT, COMMISSION_TOTAL_PERCENT, MAX_COMMISSION_LEVELS,
  PLAN_PRICE_CENTS, brl, commissionCentsFor,
} from '../lib/commission-plan.js';

// Página inicial da fase de validação: as primeiras contas viram Fundadoras (acesso vitalício).
// Regras do jogo e da indicação vêm das mesmas constantes do app (nada de número solto no texto).
// Sem depoimentos inventados, sem promessa de ganho; o exemplo de comissão é marcado como exemplo.

const css = `
@keyframes fRise { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }
@keyframes fGlow { 0%,100% { box-shadow: 0 0 0 0 rgba(245,158,11,.55); } 50% { box-shadow: 0 0 0 14px rgba(245,158,11,0); } }
@keyframes fShine { from { background-position: 200% 0; } to { background-position: -200% 0; } }
@keyframes fDrop { 0% { transform: translateY(-6px); opacity: 0; } 30% { opacity: 1; } 100% { transform: translateY(10px); opacity: 0; } }
.f-reveal { opacity: 0; transform: translateY(20px); transition: opacity .7s ease, transform .7s ease; }
.f-reveal.f-in { opacity: 1; transform: none; }
.f-rise { animation: fRise .6s ease both; }
.f-glow { animation: fGlow 2s infinite; }
.f-shine { background: linear-gradient(90deg,#fbbf24,#fde68a,#34d399,#fde68a,#fbbf24); background-size: 200% 100%; -webkit-background-clip: text; background-clip: text; color: transparent; animation: fShine 6s linear infinite; }
.f-drop { animation: fDrop 1.8s ease-in infinite; }
@media (prefers-reduced-motion: reduce) {
  .f-reveal { opacity: 1; transform: none; transition: none; }
  .f-rise, .f-glow, .f-shine, .f-drop { animation: none !important; }
  .f-shine { color: #fbbf24; }
}
`;

function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ transitionDelay: `${delay}ms` }} className={`f-reveal ${inView ? 'f-in' : ''} ${className}`}>
      {children}
    </div>
  );
}

const FEATURES: { icon: React.ReactNode; title: string; text: string }[] = [
  { icon: <Mic className="w-6 h-6" />, title: 'Secretário por voz', text: 'Você fala “paguei 45 no mercado”, “dentista quinta às 15h”, “me lembra de ligar pra minha mãe amanhã” e o Ritmo anota, agenda e te avisa. Sem digitar.' },
  { icon: <MapPin className="w-6 h-6" />, title: 'Treino com GPS', text: 'Corrida, caminhada, pedal e trilha com mapa da rota, distância, ritmo por km, subida e recordes pessoais. Aqui ganha ponto quem é constante, não quem se mata de treinar.' },
  { icon: <CalendarCheck className="w-6 h-6" />, title: 'Hoje: o próximo passo', text: 'O app abre mostrando a próxima coisa certa a fazer agora, com um botão. Acabou a paralisia de “por onde eu começo?”.' },
  { icon: <Heart className="w-6 h-6" />, title: 'Hábitos & Saúde', text: 'Hábitos de 1 a 6 vezes por semana ou diários, alimentação, sequência de dias e 1 dia de descanso grátis por semana. Constância sem culpa.' },
  { icon: <ListChecks className="w-6 h-6" />, title: 'Rotina & Tarefas', text: 'Tarefas com data, hora e repetição livre. Concluiu uma que se repete? A próxima já nasce sozinha.' },
  { icon: <Timer className="w-6 h-6" />, title: 'Sessões de Foco', text: 'Cronômetro de foco com o tempo que você escolher, ciclos de 1 a 365 dias e histórico de quanto você realmente produziu.' },
  { icon: <Wallet className="w-6 h-6" />, title: 'Finanças Pessoais', text: 'Gastos, entradas, orçamento e contas a pagar com lembrete na véspera e no dia. Fale “pagar IPVA terça R$ 1.250” e está feito.' },
  { icon: <Sparkles className="w-6 h-6" />, title: 'Preenchimento automático', text: 'Uma conta vira lembrete, card na agenda e provisão em Finanças ao mesmo tempo. Pagou? Tudo se atualiza junto.' },
  { icon: <Target className="w-6 h-6" />, title: 'Roteiro de Metas', text: 'Quebre o objetivo grande em marcos e veja o caminho ficando menor a cada semana.' },
  { icon: <NotebookPen className="w-6 h-6" />, title: 'Diário & Revisões', text: 'Check-in do dia em segundos e revisão semanal para enxergar o que funcionou.' },
  { icon: <LayoutGrid className="w-6 h-6" />, title: 'Quadros', text: 'Quadros estilo kanban para projetos, estudos e casa. Compromisso com data já cai sozinho na “Agenda”.' },
  { icon: <Trophy className="w-6 h-6" />, title: 'Tudo vale ponto', text: '12 níveis da Semente à Lenda Eterna, missões diárias, baú, ofensiva, conquistas raras e temporada mensal do Bronze à Lenda.' },
  { icon: <Users className="w-6 h-6" />, title: 'Desafios com amigos', text: 'Monte desafios de 3 a 30 dias com até 3 pessoas e veja quem está cumprindo. Ninguém quer ser o que parou.' },
  { icon: <Newspaper className="w-6 h-6" />, title: 'Feed, Stories e Ritus', text: 'Uma rede social só de gente evoluindo: conquistas, fotos, stories de 24 h e os Ritus, grupos de conteúdo (grátis ou pagos).' },
  { icon: <Bell className="w-6 h-6" />, title: 'Lembretes que respeitam você', text: 'Até 4 notificações por dia, nos horários que você escolher. Sem bombardeio.' },
  { icon: <Smartphone className="w-6 h-6" />, title: 'App no celular', text: 'Instala na tela inicial do Android e do iPhone em 1 toque e se atualiza sozinho.' },
];

const FAQ = [
  {
    q: 'O acesso vitalício é de verdade?',
    a: `Sim. As ${FOUNDER_SPOTS} primeiras contas ficam marcadas como Fundadoras e usam o Ritmo completo sem pagar a mensalidade, enquanto o Ritmo existir. Não pedimos cartão e não existe cobrança escondida.`,
  },
  {
    q: 'Por que vocês estão dando isso?',
    a: 'Porque estamos em fase de validação. Precisamos de gente real usando todos os dias, achando o que pode melhorar e dizendo o que falta. Você ajuda a construir o Ritmo e, em troca, nunca paga por ele.',
  },
  {
    q: 'O que eu preciso fazer como Fundador?',
    a: 'Só usar o Ritmo de verdade. Se algo der errado ou você tiver uma ideia, conte para a gente. Não existe meta obrigatória, prova nem tarefa escondida.',
  },
  {
    q: 'Pode ter algum erro no app?',
    a: 'Pode. É uma fase de teste e algumas coisas ainda estão sendo ajustadas. Erros são registrados automaticamente e corrigidos com frequência. As atualizações chegam sozinhas no seu celular.',
  },
  {
    q: 'Como eu posso lucrar com isso?',
    a: `Com o Indique e Ganhe: cada assinatura confirmada de quem entrar pelo seu link rende ${COMMISSION_DIRECT_PERCENT}% para você, todo mês enquanto a pessoa continuar assinando, e mais ${COMMISSION_NETWORK_PERCENT}% distribuídos até o ${MAX_COMMISSION_LEVELS}º nível da rede. Você também pode criar um Ritus pago e ficar com ${100 - TEAM_PLATFORM_FEE_PERCENT}% de cada venda. O saque é por Pix. Os ganhos dependem só das assinaturas reais que vierem pelo seu link: não há renda garantida.`,
  },
  {
    q: 'E se as vagas acabarem?',
    a: 'O cadastro fecha e vira uma lista de espera. Quem ficar de fora entra quando abrirmos novas vagas, mas aí já sem o acesso vitalício de Fundador.',
  },
  {
    q: 'Meus dados ficam seguros?',
    a: 'Senha guardada só como código criptografado, consentimentos registrados conforme a LGPD, e você baixa ou apaga seus dados quando quiser. Seu diário, finanças, hábitos e treinos nunca aparecem no Feed.',
  },
];

export function FoundersPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [status, setStatus] = useState<{ open: boolean; founderOpen: boolean; founderLeft: number | null } | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // Guarda o código de indicação (?ref=) e o convite de Ritus para o cadastro.
    try {
      const ref = params.get('ref');
      if (ref) localStorage.setItem('ritmo_referral', ref);
      const ritus = params.get('ritus') || params.get('equipe');
      if (ritus && /^[a-z0-9-]{3,40}$/.test(ritus)) localStorage.setItem('ritmo_team_invite', ritus);
    } catch {
      /* ignora */
    }
    fetch('/api/auth')
      .then((r) => r.json())
      .then((d) => setLoggedIn(Boolean(d?.user)))
      .catch(() => {});
    fetch('/api/vagas')
      .then((r) => r.json())
      .then((d) => {
        if (d && typeof d.open === 'boolean') {
          setStatus({ open: d.open, founderOpen: d.founderOpen !== false && d.open, founderLeft: typeof d.founderLeft === 'number' ? d.founderLeft : null });
        }
      })
      .catch(() => {});
  }, []);

  const soldOut = status ? !status.founderOpen : false;
  const cta = loggedIn ? '/app' : '/login?modo=cadastro';
  const ctaLabel = loggedIn ? 'Ir para o meu painel' : soldOut ? 'Entrar na lista de espera' : 'Garantir minha vaga de Fundador';
  const left = status?.founderLeft ?? null;
  const yearCents = PLAN_PRICE_CENTS * 12;
  const exampleCents = commissionCentsFor(PLAN_PRICE_CENTS, COMMISSION_DIRECT_PERCENT);

  const btn =
    'inline-flex items-center justify-center gap-2 px-7 py-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-extrabold text-base sm:text-lg shadow-xl shadow-amber-500/25 transition-transform hover:scale-[1.02]';

  const Spots = ({ big = false }: { big?: boolean }) => {
    if (soldOut) {
      return (
        <p className={`${big ? 'text-base' : 'text-sm'} font-bold text-rose-300`}>
          As vagas de Fundador acabaram. Entre na lista de espera para a próxima fase.
        </p>
      );
    }
    if (left !== null) {
      const pct = Math.round(((FOUNDER_SPOTS - left) / FOUNDER_SPOTS) * 100);
      return (
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between text-sm font-bold">
            <span className="text-rose-300">🔥 Restam só {left} {left === 1 ? 'vaga' : 'vagas'} de Fundador</span>
            <span className="text-slate-400">{pct}% preenchido</span>
          </div>
          <div className="mt-2 h-2.5 rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-rose-500" style={{ width: `${pct}%` }} />
          </div>
        </div>
      );
    }
    return (
      <p className={`${big ? 'text-base' : 'text-sm'} font-bold text-amber-300`}>
        Apenas {FOUNDER_SPOTS} vagas. Quando acabar, o cadastro fecha.
      </p>
    );
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#f0f6fc] pb-24 md:pb-0 overflow-x-hidden">
      <style>{css}</style>

      {/* Faixa de urgência */}
      <div className="bg-amber-400 text-slate-950 text-center text-xs sm:text-sm font-bold py-2 px-4">
        <FlaskConical className="inline w-4 h-4 -mt-0.5 mr-1" />
        Fase de validação · {FOUNDER_SPOTS} vagas de Fundador · acesso vitalício · sem cartão
      </div>

      <header className="border-b border-[#30363d]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <a href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-amber-500 flex items-center justify-center">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-xl tracking-tight">Ritmo</span>
          </a>
          <nav className="flex items-center gap-1 text-sm">
            <a href="#tudo" className="hidden md:inline px-3 py-2 text-slate-300 hover:text-white">O que faz</a>
            <a href="#lucrar" className="hidden md:inline px-3 py-2 text-slate-300 hover:text-white">Lucrar</a>
            <a href="#duvidas" className="hidden md:inline px-3 py-2 text-slate-300 hover:text-white">Dúvidas</a>
            {!loggedIn && <a href="/login" className="px-3 py-2 rounded-lg border border-[#30363d] text-slate-200 hover:bg-[#161b22] font-medium">Entrar</a>}
            <a href={cta} className="hidden sm:inline-flex px-4 py-2 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold">
              {loggedIn ? 'Meu painel' : soldOut ? 'Lista de espera' : 'Quero ser Fundador'}
            </a>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(245,158,11,0.16),transparent_60%)] pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 pt-14 pb-16 text-center">
          <div className="f-rise inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-400/40 bg-amber-400/10 text-amber-200 text-xs sm:text-sm font-semibold">
            <Crown className="w-4 h-4" /> Convite para os {FOUNDER_SPOTS} Fundadores do Ritmo
          </div>
          <h1 className="f-rise mt-6 text-4xl sm:text-6xl font-extrabold leading-[1.05] tracking-tight">
            Os {FOUNDER_SPOTS} primeiros nunca vão pagar pelo Ritmo.{' '}
            <span className="f-shine">E ainda podem lucrar com ele.</span>
          </h1>
          <p className="f-rise mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto">
            O Ritmo é o app que junta <strong className="text-white">rotina, hábitos, treino com GPS, foco, finanças, um secretário que obedece à sua voz</strong> e uma comunidade que te puxa para cima. Estamos em fase de validação e escolhemos começar com poucas pessoas. Quem entrar agora ganha <strong className="text-amber-300">acesso vitalício</strong>.
          </p>
          <div className="f-rise mt-8 flex flex-col items-center gap-4">
            <a href={cta} className={`${btn} ${soldOut ? '' : 'f-glow'} w-full sm:w-auto`}>
              {ctaLabel} <ArrowRight className="w-5 h-5" />
            </a>
            <Spots big />
            <p className="text-xs text-slate-500">Sem cartão · cadastro em 1 minuto · nada de cobrança escondida</p>
          </div>
        </div>
      </section>

      {/* ÁGUA LIMPA */}
      <section className="border-y border-sky-500/20 bg-gradient-to-b from-sky-500/[0.08] to-transparent">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 grid md:grid-cols-[auto,1fr] gap-8 items-center">
          <Reveal className="flex justify-center">
            <div className="relative w-28 h-28 rounded-full bg-sky-500/15 border border-sky-400/40 flex items-center justify-center">
              <Droplets className="w-14 h-14 text-sky-300" />
              <span className="f-drop absolute -bottom-1 left-1/2 w-2 h-3 rounded-full bg-sky-300" />
            </div>
          </Reveal>
          <Reveal delay={100}>
            <h2 className="text-3xl sm:text-5xl font-extrabold leading-tight">Quem chega na frente bebe água limpa.</h2>
            <p className="mt-4 text-lg text-slate-300">
              Todo produto que dá certo tem um momento em que poucos sabem dele. É nesse momento que se pega a melhor condição, o melhor lugar e a melhor história para contar. Depois que todo mundo descobre, o preço é cheio e a fila é longa.
            </p>
            <p className="mt-3 text-lg text-white font-semibold">Esse momento do Ritmo é agora. E ele tem só {FOUNDER_SPOTS} lugares.</p>
          </Reveal>
        </div>
      </section>

      {/* O QUE O FUNDADOR GANHA */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <Reveal>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-center">O que só os Fundadores levam</h2>
          <p className="mt-3 text-center text-slate-400 max-w-2xl mx-auto">Depois desta fase, nenhuma destas condições volta.</p>
        </Reveal>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: <InfinityIcon className="w-6 h-6" />, t: 'Acesso vitalício', d: `O Ritmo completo, para sempre, sem a mensalidade de ${brl(PLAN_PRICE_CENTS)}.` },
            { icon: <Crown className="w-6 h-6" />, t: 'Conta de Fundador', d: 'Sua conta fica registrada como uma das primeiras que acreditaram no Ritmo.' },
            { icon: <Hammer className="w-6 h-6" />, t: 'Voz na construção', d: 'Suas ideias e os problemas que você achar entram direto na fila do que vamos melhorar.' },
            { icon: <Banknote className="w-6 h-6" />, t: 'Pode lucrar', d: `${COMMISSION_TOTAL_PERCENT}% de comissão na rede de indicações e ${100 - TEAM_PLATFORM_FEE_PERCENT}% de cada venda dos seus Ritus pagos.` },
          ].map((b, i) => (
            <Reveal key={b.t} delay={i * 80}>
              <div className="h-full min-w-0 rounded-2xl border border-amber-400/30 bg-gradient-to-b from-amber-400/10 to-[#161b22] p-5">
                <div className="w-11 h-11 rounded-xl bg-amber-400/15 text-amber-300 flex items-center justify-center">{b.icon}</div>
                <h3 className="mt-4 font-extrabold text-lg">{b.t}</h3>
                <p className="mt-1 text-sm text-slate-400">{b.d}</p>
              </div>
            </Reveal>
          ))}
        </div>

        {/* Ancoragem de preço */}
        <Reveal delay={120}>
          <div className="mt-10 max-w-3xl mx-auto rounded-3xl border border-[#30363d] bg-[#161b22] p-6 sm:p-8">
            <div className="grid sm:grid-cols-3 gap-4 text-center">
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-wider text-slate-500">Quem chegar depois</div>
                <div className="mt-1 text-2xl font-extrabold text-slate-300">{brl(PLAN_PRICE_CENTS)}<span className="text-sm font-semibold">/mês</span></div>
              </div>
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-wider text-slate-500">Em 1 ano</div>
                <div className="mt-1 text-2xl font-extrabold text-slate-300 line-through decoration-rose-400/70">{brl(yearCents)}</div>
              </div>
              <div className="min-w-0">
                <div className="text-xs uppercase tracking-wider text-amber-300">Fundador</div>
                <div className="mt-1 text-3xl font-extrabold text-amber-300">R$ 0</div>
                <div className="text-xs text-slate-400">para sempre</div>
              </div>
            </div>
            <p className="mt-6 text-center text-sm text-slate-400">
              Em 5 anos, quem chegar depois terá pago {brl(yearCents * 5)}. Você, nada.
            </p>
          </div>
        </Reveal>
      </section>

      {/* FASE DE VALIDAÇÃO */}
      <section className="border-y border-[#30363d] bg-[#0b0f14]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
          <Reveal>
            <div className="inline-flex items-center gap-2 text-emerald-300 font-bold text-sm"><FlaskConical className="w-5 h-5" /> Sendo transparente com você</div>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold">Por que dar acesso vitalício?</h2>
            <p className="mt-4 text-lg text-slate-300">
              O Ritmo já está pronto e funcionando, mas um app só fica excelente com gente de verdade usando no dia a dia. Por isso estamos em <strong className="text-white">fase de validação</strong>: limitamos o cadastro a {FOUNDER_SPOTS} pessoas para acompanhar cada uma de perto, corrigir rápido e construir junto.
            </p>
            <p className="mt-3 text-lg text-slate-300">
              É uma troca justa: você usa, nos conta o que achou e ajuda a moldar o Ritmo. Nós nunca cobramos de você.
            </p>
          </Reveal>
          <div className="mt-8 grid sm:grid-cols-3 gap-4">
            {[
              { n: '1', t: 'Crie sua conta', d: 'Nome, e-mail e senha. Sem cartão.' },
              { n: '2', t: 'Use todo dia', d: 'O app te mostra o próximo passo assim que abre.' },
              { n: '3', t: 'Conte o que achou', d: 'Ideias e problemas viram melhorias nas próximas versões.' },
            ].map((s, i) => (
              <Reveal key={s.n} delay={i * 80}>
                <div className="h-full min-w-0 rounded-2xl border border-[#30363d] bg-[#161b22] p-5">
                  <div className="w-9 h-9 rounded-full bg-emerald-500 text-slate-950 font-extrabold flex items-center justify-center">{s.n}</div>
                  <h3 className="mt-3 font-bold">{s.t}</h3>
                  <p className="mt-1 text-sm text-slate-400">{s.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* TUDO QUE O APP FAZ */}
      <section id="tudo" className="scroll-mt-4 max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <Reveal>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-center">Um app no lugar de dez</h2>
          <p className="mt-3 text-center text-slate-400 max-w-2xl mx-auto">
            Agenda, lista de tarefas, app de hábitos, de corrida, de foco, de finanças, diário e rede social. Tudo conversando entre si, num lugar só.
          </p>
        </Reveal>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={(i % 3) * 70}>
              <div className="h-full min-w-0 rounded-2xl border border-[#30363d] bg-[#161b22] p-5 hover:border-emerald-500/40 transition-colors">
                <div className="w-11 h-11 rounded-xl bg-emerald-500/15 text-emerald-300 flex items-center justify-center">{f.icon}</div>
                <h3 className="mt-4 font-bold text-lg">{f.title}</h3>
                <p className="mt-1 text-sm text-slate-400">{f.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal>
          <div className="mt-10 text-center">
            <a href={cta} className={btn}>
              {ctaLabel} <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </Reveal>
      </section>

      {/* JOGO / CONSTÂNCIA */}
      <section className="border-y border-emerald-500/20 bg-gradient-to-b from-emerald-500/[0.07] to-transparent">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 grid md:grid-cols-2 gap-10 items-center">
          <Reveal>
            <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight">Um pouco melhor a cada dia. Sem extremismo.</h2>
            <p className="mt-4 text-slate-300 text-lg">
              Nada de acordar às 4h, cortar comida ou se culpar por um dia ruim. No Ritmo, cada coisa boa que você faz vale ponto, e o que conta é voltar amanhã.
            </p>
            <ul className="mt-5 space-y-2 text-slate-300">
              {[
                'Missões do dia que se marcam sozinhas',
                'Baú diário e semanal com prêmios',
                'Ofensiva com 1 dia de descanso grátis por semana',
                'Voltou depois de dias parado? Os pontos valem em dobro',
                'Temporada mensal: do Bronze à Lenda',
              ].map((t) => (
                <li key={t} className="flex gap-2"><Check className="w-5 h-5 text-emerald-400 shrink-0" /> {t}</li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={120}>
            <div className="rounded-3xl border border-[#30363d] bg-[#161b22] p-5">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Seu dia no Ritmo</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">exemplo</span>
              </div>
              <div className="mt-4 space-y-2.5">
                {[
                  { t: 'Caminhada de 3 km', p: '+20' },
                  { t: 'Hábito: beber água', p: '+10' },
                  { t: 'Foco de 25 min', p: '+15' },
                  { t: 'Conta de luz paga', p: '+5' },
                  { t: 'Check-in do diário', p: '+15' },
                ].map((r) => (
                  <div key={r.t} className="flex items-center justify-between rounded-xl bg-[#0d1117] border border-[#30363d] px-4 py-3">
                    <span className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-emerald-400" /> {r.t}</span>
                    <span className="text-emerald-300 font-extrabold text-sm">{r.p}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-slate-400">Missões do dia: 3/3</span>
                <span className="inline-flex items-center gap-1 text-amber-300 font-bold"><Gift className="w-4 h-4" /> Baú liberado</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* LUCRAR */}
      <section id="lucrar" className="scroll-mt-4 max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <Reveal>
          <div className="text-center">
            <div className="inline-flex items-center gap-2 text-amber-300 font-bold text-sm"><Banknote className="w-5 h-5" /> Além de não pagar</div>
            <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold">Você pode lucrar com o Ritmo</h2>
            <p className="mt-3 text-slate-400 max-w-2xl mx-auto">
              Você não paga nada. Mas, quando outras pessoas assinarem pelo seu link, uma parte de cada mensalidade é sua.
            </p>
          </div>
        </Reveal>
        <div className="mt-10 grid md:grid-cols-2 gap-5">
          <Reveal>
            <div className="h-full min-w-0 rounded-3xl border border-amber-400/30 bg-gradient-to-br from-amber-400/10 to-[#161b22] p-6">
              <div className="flex items-center gap-2 font-extrabold text-xl"><Share2 className="w-6 h-6 text-amber-300" /> Indique e Ganhe</div>
              <ul className="mt-4 space-y-2 text-slate-300 text-sm">
                <li className="flex gap-2"><Check className="w-5 h-5 text-amber-300 shrink-0" /> <span><strong className="text-white">{COMMISSION_DIRECT_PERCENT}%</strong> de cada mensalidade de quem você indicar, todo mês enquanto a pessoa assinar.</span></li>
                <li className="flex gap-2"><Check className="w-5 h-5 text-amber-300 shrink-0" /> <span>Mais <strong className="text-white">{COMMISSION_NETWORK_PERCENT}%</strong> distribuídos até o {MAX_COMMISSION_LEVELS}º nível: ganha também com quem os seus indicados trouxerem.</span></li>
                <li className="flex gap-2"><Check className="w-5 h-5 text-amber-300 shrink-0" /> <span>Seu link e um painel com indicados e saldo já vêm prontos no app.</span></li>
                <li className="flex gap-2"><Check className="w-5 h-5 text-amber-300 shrink-0" /> <span>Saque por Pix toda semana.</span></li>
              </ul>
              <div className="mt-5 rounded-xl border border-[#30363d] bg-[#0d1117] p-4 text-sm">
                <div className="flex items-center justify-between text-xs text-slate-500"><span>Como a conta funciona</span><span className="px-2 py-0.5 rounded-full bg-slate-800">exemplo</span></div>
                <p className="mt-2 text-slate-300">
                  1 pessoa assinando por {brl(PLAN_PRICE_CENTS)} → <strong className="text-amber-300">{brl(exampleCents)}</strong> para você naquele mês.
                </p>
              </div>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div className="h-full min-w-0 rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-[#161b22] p-6">
              <div className="flex items-center gap-2 font-extrabold text-xl"><Zap className="w-6 h-6 text-emerald-300" /> Ritus pagos</div>
              <p className="mt-4 text-slate-300 text-sm">
                Sabe ensinar algo? Treino, receitas, finanças, estudos, organização da casa. Crie o seu Ritus, defina o preço e venda o acesso dentro do Ritmo.
              </p>
              <ul className="mt-4 space-y-2 text-slate-300 text-sm">
                <li className="flex gap-2"><Check className="w-5 h-5 text-emerald-400 shrink-0" /> <span>Você fica com <strong className="text-white">{100 - TEAM_PLATFORM_FEE_PERCENT}%</strong> de cada venda.</span></li>
                <li className="flex gap-2"><Check className="w-5 h-5 text-emerald-400 shrink-0" /> <span>Vitrine dentro do app para ser encontrado.</span></li>
                <li className="flex gap-2"><Check className="w-5 h-5 text-emerald-400 shrink-0" /> <span>Quem assina o Ritmo pelo seu link entra no seu Ritus sem pagar a mais.</span></li>
              </ul>
            </div>
          </Reveal>
        </div>
        <p className="mt-6 text-center text-xs text-slate-500 max-w-2xl mx-auto">
          Os ganhos não são garantidos: dependem de assinaturas e vendas reais e confirmadas. Fundadores não pagam mensalidade, então as comissões vêm de quem assinar o plano pago.
        </p>
      </section>

      {/* COMUNIDADE / PRIVACIDADE */}
      <section className="border-y border-[#30363d] bg-[#0b0f14]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 grid md:grid-cols-3 gap-4">
          {[
            { icon: <MessageCircle className="w-6 h-6" />, t: 'Comunidade que puxa para cima', d: 'Feed só de gente evoluindo, com moderação e denúncia. Nada é publicado sem você querer.' },
            { icon: <Lock className="w-6 h-6" />, t: 'O que é seu fica com você', d: 'Diário, finanças, hábitos e trajetos de treino nunca aparecem para os outros.' },
            { icon: <ShieldCheck className="w-6 h-6" />, t: 'LGPD de verdade', d: 'Você escolhe o que autoriza, baixa todos os seus dados e apaga quando quiser.' },
          ].map((c, i) => (
            <Reveal key={c.t} delay={i * 80}>
              <div className="h-full min-w-0 rounded-2xl border border-[#30363d] bg-[#161b22] p-5">
                <div className="w-11 h-11 rounded-xl bg-sky-500/15 text-sky-300 flex items-center justify-center">{c.icon}</div>
                <h3 className="mt-4 font-bold">{c.t}</h3>
                <p className="mt-1 text-sm text-slate-400">{c.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* DOIS CAMINHOS */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <Reveal>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-center">Daqui a alguns meses, você vai estar em um destes lados</h2>
        </Reveal>
        <div className="mt-8 grid md:grid-cols-2 gap-5">
          <Reveal>
            <div className="h-full rounded-2xl border border-rose-500/30 bg-rose-500/5 p-6">
              <div className="flex items-center gap-2 text-rose-300 font-bold"><Hourglass className="w-5 h-5" /> Quem deixou para depois</div>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                <li>Descobre o Ritmo quando todo mundo já usa.</li>
                <li>Encontra o cadastro fechado ou a lista de espera.</li>
                <li>Paga {brl(PLAN_PRICE_CENTS)} todo mês, como qualquer um.</li>
                <li>Começa do zero enquanto os primeiros já subiram de nível.</li>
              </ul>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div className="h-full rounded-2xl border border-amber-400/40 bg-amber-400/5 p-6">
              <div className="flex items-center gap-2 text-amber-300 font-bold"><Crown className="w-5 h-5" /> Quem chegou na frente</div>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                <li>Usa tudo, para sempre, sem pagar.</li>
                <li>Ajudou a decidir como o Ritmo ficou.</li>
                <li>Já tem o link de indicação pronto quando a procura aumentar.</li>
                <li>Bebeu a água limpa.</li>
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FAQ */}
      <section id="duvidas" className="scroll-mt-4 max-w-3xl mx-auto px-4 sm:px-6 pb-16">
        <Reveal>
          <h2 className="text-3xl font-extrabold text-center">Perguntas rápidas</h2>
        </Reveal>
        <div className="mt-8 space-y-3">
          {FAQ.map((f, i) => (
            <div key={f.q} className="rounded-xl border border-[#30363d] bg-[#161b22] overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between gap-3 text-left px-5 py-4 font-semibold"
                aria-expanded={openFaq === i}
              >
                {f.q}
                <ChevronDown className={`w-5 h-5 shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
              </button>
              {openFaq === i && <p className="px-5 pb-4 text-sm text-slate-400">{f.a}</p>}
            </div>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="px-4 sm:px-6 pb-20">
        <Reveal>
          <div className="max-w-3xl mx-auto rounded-3xl border border-amber-400/40 bg-gradient-to-br from-amber-400/15 via-transparent to-emerald-500/10 p-8 sm:p-12 text-center">
            <Droplets className="w-10 h-10 text-sky-300 mx-auto" />
            <h2 className="mt-4 text-3xl sm:text-5xl font-extrabold leading-tight">A água ainda está limpa.</h2>
            <p className="mt-4 text-lg text-slate-300">
              São só {FOUNDER_SPOTS} lugares. Quando acabar, acabou: quem vier depois paga mensalidade. Leva 1 minuto e não pede cartão.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4">
              <a href={cta} className={`${btn} ${soldOut ? '' : 'f-glow'} w-full sm:w-auto`}>
                {ctaLabel} <ArrowRight className="w-5 h-5" />
              </a>
              <Spots />
            </div>
          </div>
        </Reveal>
        <p className="max-w-3xl mx-auto mt-8 text-center text-xs text-slate-600">
          O Ritmo é uma ferramenta de organização pessoal em fase de validação: algumas funções ainda podem mudar. Não oferece recomendação médica, nutricional ou de investimento, e não garante resultados. Os números marcados como exemplo são ilustrativos. Pontos, níveis e divisões não valem dinheiro. Ganhos do programa de indicação e das vendas de Ritus não são garantidos e dependem de assinaturas reais confirmadas.{' '}
          <a href="/vendas" className="underline">Conheça o Ritmo em detalhes</a> · <a href="/termos" className="underline">Termos</a> · <a href="/privacidade" className="underline">Privacidade</a>
        </p>
      </section>

      {/* BARRA FIXA MOBILE */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-[#30363d] bg-[#0d1117]/95 backdrop-blur px-4 py-3">
        {left !== null && !soldOut && <p className="text-center text-[11px] font-bold text-rose-300 mb-1.5">Restam {left} {left === 1 ? 'vaga' : 'vagas'} de Fundador</p>}
        <a href={cta} className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-amber-400 text-slate-950 font-extrabold">
          {ctaLabel} <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
