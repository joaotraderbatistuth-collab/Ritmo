import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useRef, useState } from 'react';
import {
  Flame, ArrowRight, Check, X, ChevronDown, Link2, Timer, ShieldCheck, Clock, Quote, Sparkles, Wallet, Share2, BadgeCheck, Banknote,
} from 'lucide-react';
import {
  COMMISSION_DIRECT_PERCENT, COMMISSION_NETWORK_PERCENT, COMMISSION_TOTAL_PERCENT, MAX_COMMISSION_LEVELS,
  MIN_PAYOUT_CENTS, PLAN_PRICE_CENTS, brl, commissionCentsFor, levelPercent,
} from '../lib/commission-plan.js';

export const Route = createFileRoute('/vendas')({
  component: SalesPage,
});

/* ------------------------------------------------------------------ */
/* Utilidades de animação                                              */
/* ------------------------------------------------------------------ */

const css = `
@keyframes rise { from { opacity: 0; transform: translateY(22px); } to { opacity: 1; transform: translateY(0); } }
@keyframes pop { 0% { transform: scale(0.3); opacity: 0; } 70% { transform: scale(1.15); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
@keyframes pulseGlow { 0%,100% { box-shadow: 0 0 0 0 rgba(16,185,129,0.55); } 50% { box-shadow: 0 0 0 14px rgba(16,185,129,0); } }
@keyframes blink { 0%,49% { opacity: 1; } 50%,100% { opacity: 0; } }
@keyframes floaty { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
.v-reveal { opacity: 0; transform: translateY(22px); transition: opacity .7s ease, transform .7s ease; }
.v-reveal.v-in { opacity: 1; transform: translateY(0); }
.v-pop { animation: pop .45s ease-out both; }
.v-glow { animation: pulseGlow 2s infinite; }
.v-caret { animation: blink 1s steps(1) infinite; }
.v-float { animation: floaty 5s ease-in-out infinite; }
@media (prefers-reduced-motion: reduce) {
  .v-reveal { opacity: 1; transform: none; transition: none; }
  .v-pop, .v-glow, .v-caret, .v-float { animation: none !important; }
}
`;

/** true quando o elemento entrou na tela (uma vez) */
function useInView<T extends HTMLElement>(once = true) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          if (once) io.disconnect();
        } else if (!once) setInView(false);
      },
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [once]);
  return { ref, inView };
}

function Reveal({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const { ref, inView } = useInView<HTMLDivElement>();
  return (
    <div ref={ref} style={{ transitionDelay: `${delay}ms` }} className={`v-reveal ${inView ? 'v-in' : ''} ${className}`}>
      {children}
    </div>
  );
}

/** passo 0..length-1 que avança sozinho, só enquanto o bloco está visível */
function useLoop(length: number, ms: number) {
  const { ref, inView } = useInView<HTMLDivElement>(false);
  const [step, setStep] = useState(0);
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    setReduced(typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  }, []);
  useEffect(() => {
    if (!inView || reduced) return;
    const t = setInterval(() => setStep((s) => (s + 1) % length), ms);
    return () => clearInterval(t);
  }, [inView, reduced, length, ms]);
  return { ref, step: reduced ? Math.floor(length * 0.75) : step };
}

/* ------------------------------------------------------------------ */
/* Demonstrações animadas do sistema (dados de exemplo)                */
/* ------------------------------------------------------------------ */

const frame = 'rounded-2xl border border-[#30363d] bg-[#161b22] p-4 sm:p-5 shadow-2xl shadow-black/40';
const tagExemplo = <span className="text-[10px] uppercase tracking-wider text-slate-500">dados de exemplo</span>;

function ChainDemo() {
  const { ref, step } = useLoop(8, 900);
  const habits = ['Treino', 'Leitura · 20 min', 'Sem celular após 22h'];
  const done = Math.min(step, 3);
  const met = step >= 3;
  const links = met ? 6 : 5;
  return (
    <div ref={ref} className={frame}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
          <Link2 className="w-4 h-4" /> Não Quebre a Corrente
        </div>
        {tagExemplo}
      </div>
      <div className="space-y-2">
        {habits.map((h, i) => (
          <div key={h} className="flex items-center gap-3 rounded-xl bg-[#0d1117] border border-[#30363d] px-3 py-2.5">
            <span className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all duration-300 ${i < done ? 'bg-emerald-500 border-emerald-500' : 'border-[#484f58]'}`}>
              {i < done && <Check className="w-3.5 h-3.5 text-slate-950" />}
            </span>
            <span className={`text-sm transition-colors ${i < done ? 'text-slate-500 line-through' : 'text-slate-200'}`}>{h}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center min-h-[34px] pl-1.5">
        {Array.from({ length: links }, (_, i) => (
          <span
            key={`${i}-${i === links - 1 && met ? 'new' : 'old'}`}
            aria-hidden
            className={`inline-block rounded-full border-[3px] border-emerald-500 bg-emerald-500/10 ${i % 2 ? 'w-4 h-7' : 'w-8 h-4'} ${i > 0 ? '-ml-1.5' : ''} ${i === links - 1 && met ? 'v-pop' : ''}`}
          />
        ))}
      </div>
      <p className={`mt-2 text-sm font-bold transition-colors ${met ? 'text-emerald-400' : 'text-amber-300'}`}>
        {met ? `Corrente preservada! ${links} semanas seguidas.` : `Faltam ${3 - done} para preservar a corrente.`}
      </p>
    </div>
  );
}

function KanbanDemo() {
  const { ref, step } = useLoop(8, 1000);
  const col = step < 1 ? 0 : step < 5 ? 1 : 2;
  const checks = step < 2 ? 0 : step < 3 ? 1 : step < 4 ? 2 : 3;
  const Card = ({ title, ghost = false }: { title: string; ghost?: boolean }) => (
    <div className={`rounded-lg border px-2.5 py-2 text-xs ${ghost ? 'border-[#30363d] bg-[#0d1117] text-slate-500' : 'border-emerald-500/50 bg-emerald-500/10 text-slate-100 v-pop'}`}>{title}</div>
  );
  return (
    <div ref={ref} className={frame}>
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-bold uppercase tracking-wider text-teal-400">Quadros</div>
        {tagExemplo}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {['A fazer', 'Fazendo', 'Feito'].map((name, c) => (
          <div key={name} className="rounded-xl bg-[#0d1117] border border-[#30363d] p-2 min-h-[150px] space-y-2">
            <div className="text-[10px] font-bold uppercase text-slate-500">{name}</div>
            {c === 0 && <Card title="Pagar IPVA" ghost />}
            {c === 2 && <Card title="Marcar médico" ghost />}
            {col === c && <Card title="Fechar proposta do cliente" />}
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-xl bg-[#0d1117] border border-[#30363d] p-3 space-y-1.5">
        {['Revisar números', 'Montar apresentação', 'Enviar ao cliente'].map((t, i) => (
          <div key={t} className="flex items-center gap-2 text-xs">
            <span className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${i < checks ? 'bg-emerald-500 border-emerald-500' : 'border-[#484f58]'}`}>
              {i < checks && <Check className="w-3 h-3 text-slate-950" />}
            </span>
            <span className={i < checks ? 'line-through text-slate-500' : 'text-slate-300'}>{t}</span>
          </div>
        ))}
        <div className="text-[11px] font-semibold text-emerald-400 pt-1">{checks} de 3 etapas concluídas</div>
      </div>
    </div>
  );
}

function FocusDemo() {
  const { ref, step } = useLoop(13, 450);
  const total = 12;
  const p = Math.min(step, total) / total;
  const left = Math.round((1 - p) * 25 * 60);
  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');
  const r = 52;
  const c = 2 * Math.PI * r;
  const finished = step >= total;
  return (
    <div ref={ref} className={frame}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
          <Timer className="w-4 h-4" /> Foco
        </div>
        {tagExemplo}
      </div>
      <div className="flex flex-col items-center py-2">
        <div className="relative w-36 h-36">
          <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
            <circle cx="60" cy="60" r={r} fill="none" stroke="#21262d" strokeWidth="9" />
            <circle
              cx="60" cy="60" r={r} fill="none" stroke="#10b981" strokeWidth="9" strokeLinecap="round"
              strokeDasharray={c} strokeDashoffset={c * (1 - p)} style={{ transition: 'stroke-dashoffset .45s linear' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-extrabold tabular-nums">{mm}:{ss}</span>
            <span className="text-[10px] text-slate-500 uppercase">{finished ? 'concluída' : 'em foco'}</span>
          </div>
        </div>
        <p className="mt-3 text-xs text-slate-400">Objetivo: terminar o relatório</p>
        <p className={`mt-1 text-sm font-bold transition-opacity ${finished ? 'text-emerald-400 opacity-100' : 'opacity-0'}`}>+25 min de foco registrados</p>
      </div>
    </div>
  );
}

function FinanceDemo() {
  const { ref, step } = useLoop(8, 700);
  const rows = [
    { name: 'Moradia', v: 38, color: 'bg-teal-500' },
    { name: 'Mercado', v: 24, color: 'bg-emerald-500' },
    { name: 'Lazer', v: 21, color: 'bg-amber-400' },
    { name: 'Transporte', v: 11, color: 'bg-sky-400' },
  ];
  const grown = Math.min(step, 4);
  return (
    <div ref={ref} className={frame}>
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">Finanças</div>
        {tagExemplo}
      </div>
      <div className="space-y-2.5">
        {rows.map((r, i) => (
          <div key={r.name}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300">{r.name}</span>
              <span className="text-slate-500 tabular-nums">{i < grown ? `${r.v}%` : '—'}</span>
            </div>
            <div className="h-2.5 rounded-full bg-[#21262d] overflow-hidden">
              <div className={`h-full rounded-full ${r.color}`} style={{ width: i < grown ? `${r.v * 2.2}%` : '0%', transition: 'width .7s ease' }} />
            </div>
          </div>
        ))}
      </div>
      <p className={`mt-4 text-sm font-semibold transition-opacity duration-500 ${grown >= 4 ? 'opacity-100 text-emerald-400' : 'opacity-0'}`}>
        Agora você sabe para onde foi cada real.
      </p>
    </div>
  );
}

function JournalDemo() {
  const { ref, step } = useLoop(40, 140);
  const scores = [
    { label: 'Energia', v: step >= 3 ? 4 : 0 },
    { label: 'Humor', v: step >= 5 ? 3 : 0 },
    { label: 'Foco', v: step >= 7 ? 5 : 0 },
  ];
  const full = 'Separei a roupa do treino na noite anterior.';
  const typed = step < 9 ? '' : full.slice(0, Math.min(full.length, (step - 9) * 2));
  return (
    <div ref={ref} className={frame}>
      <div className="flex items-center justify-between mb-3">
        <div className="text-xs font-bold uppercase tracking-wider text-rose-300">Diário · 30 segundos</div>
        {tagExemplo}
      </div>
      <div className="space-y-2">
        {scores.map((s) => (
          <div key={s.label} className="flex items-center justify-between text-xs">
            <span className="text-slate-300 w-16">{s.label}</span>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <span key={n} className={`w-6 h-6 rounded-md border text-[11px] flex items-center justify-center transition-all duration-300 ${n <= s.v ? 'bg-emerald-500 border-emerald-500 text-slate-950 font-bold' : 'border-[#484f58] text-slate-600'}`}>
                  {n}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-xl border border-emerald-800/40 bg-emerald-950/20 p-3">
        <div className="text-[11px] font-semibold text-slate-200 mb-1.5">💡 O que fiz hoje que tornou minha vida mais fácil?</div>
        <div className="text-xs text-emerald-300 min-h-[18px]">
          {typed}
          <span className="v-caret">|</span>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Contagem do ano + calculadora                                       */
/* ------------------------------------------------------------------ */

function YearCounter() {
  const [info, setInfo] = useState<{ year: number; passed: number; left: number } | null>(null);
  const [shown, setShown] = useState(0);
  useEffect(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    const end = new Date(now.getFullYear(), 11, 31);
    const day = Math.floor((now.getTime() - start.getTime()) / 86400000) + 1;
    const left = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86400000));
    setInfo({ year: now.getFullYear(), passed: day, left });
  }, []);
  useEffect(() => {
    if (!info) return;
    let n = 0;
    const t = setInterval(() => {
      n += Math.max(1, Math.round(info.passed / 40));
      if (n >= info.passed) {
        n = info.passed;
        clearInterval(t);
      }
      setShown(n);
    }, 30);
    return () => clearInterval(t);
  }, [info]);
  if (!info) return <div className="h-40" />;
  const pct = Math.round((info.passed / 365) * 100);
  return (
    <div className="text-center">
      <div className="text-6xl sm:text-8xl font-extrabold tabular-nums text-rose-400">{shown}</div>
      <p className="mt-1 text-slate-300 text-lg">dias de {info.year} já foram embora.</p>
      <div className="mt-5 max-w-md mx-auto h-3 rounded-full bg-[#21262d] overflow-hidden">
        <div className="h-full bg-gradient-to-r from-rose-500 to-amber-400 rounded-full" style={{ width: `${(shown / 365) * 100}%`, transition: 'width .1s linear' }} />
      </div>
      <p className="mt-3 text-sm text-slate-400">
        {pct}% do ano. Restam <strong className="text-white">{info.left} dias</strong>. Você sabe dizer o que construiu nos outros {info.passed}?
      </p>
    </div>
  );
}

function Calculator() {
  const [lost, setLost] = useState(400);
  const year = lost * 12;
  const price = 39.9 * 12;
  const fmt = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  return (
    <div className={`${frame} max-w-2xl mx-auto`}>
      <p className="text-sm font-bold text-amber-300 uppercase tracking-wider">A conta que você evita fazer</p>
      <label htmlFor="lost" className="mt-3 block text-slate-200">
        Todo mês sobra aquela sensação de “pra onde foi?”. Quanto você acha que escorre sem destino?
      </label>
      <div className="mt-4 flex items-center gap-4">
        <input id="lost" type="range" min={100} max={3000} step={50} value={lost} onChange={(e) => setLost(Number(e.target.value))} className="flex-1 accent-emerald-500" />
        <span className="w-28 text-right text-xl font-extrabold tabular-nums text-white">{fmt(lost)}</span>
      </div>
      <div className="mt-5 grid sm:grid-cols-2 gap-3">
        <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-4">
          <div className="text-xs uppercase text-rose-300 font-bold">Por ano, sem endereço</div>
          <div className="text-2xl font-extrabold text-rose-300 tabular-nums">{fmt(year)}</div>
        </div>
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4">
          <div className="text-xs uppercase text-emerald-300 font-bold">O Ritmo por ano</div>
          <div className="text-2xl font-extrabold text-emerald-300 tabular-nums">{fmt(price)}</div>
        </div>
      </div>
      <p className="mt-4 text-xs text-slate-500">
        É só aritmética sobre o número que você mesmo escolheu. O Ritmo não promete devolver esse dinheiro: ele mostra para onde ele vai, e isso você decide o que fazer.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Programa de indicação: demo animada + simulador                     */
/* ------------------------------------------------------------------ */

const lvlCents = (n: number) => commissionCentsFor(PLAN_PRICE_CENTS, levelPercent(n));

function AffiliateDemo() {
  const { ref, step } = useLoop(14, 800);
  // comissões que "caem" em sequência (exemplo): nível 1, nível 2, nível 1, nível 2, nível 4
  const events = [
    { level: 1, cents: lvlCents(1) },
    { level: 2, cents: lvlCents(2) },
    { level: 1, cents: lvlCents(1) },
    { level: 2, cents: lvlCents(2) },
    { level: 4, cents: lvlCents(4) },
  ];
  const count = step < 1 ? 0 : Math.min(events.length, Math.floor((step - 1) / 2) + 1);
  const balance = events.slice(0, count).reduce((a, e) => a + e.cents, 0);
  const pct = Math.min(100, (balance / MIN_PAYOUT_CENTS) * 100);
  const ready = balance >= MIN_PAYOUT_CENTS;
  const last = count > 0 ? events[count - 1] : null;
  return (
    <div ref={ref} className={frame}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-300">
          <Wallet className="w-4 h-4" /> Seu painel de afiliado
        </div>
        {tagExemplo}
      </div>
      <div className="rounded-xl bg-[#0d1117] border border-[#30363d] px-3 py-2 text-[11px] font-mono text-slate-400 flex items-center gap-2">
        <Share2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> seu-link-exclusivo/?ref=SEUCODIGO
      </div>
      <div className="mt-4 text-center">
        <div className="text-xs uppercase text-slate-500">Saldo de comissões aprovadas</div>
        <div className="text-4xl font-extrabold tabular-nums text-emerald-400">{brl(balance)}</div>
      </div>
      <div className="mt-3 h-14 flex items-center justify-center">
        {last && (
          <div key={count} className="v-pop rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200 flex items-center gap-2">
            <BadgeCheck className="w-4 h-4" /> Assinatura confirmada · nível {last.level} · <strong>+{brl(last.cents)}</strong>
          </div>
        )}
      </div>
      <div className="mt-2">
        <div className="flex justify-between text-[11px] text-slate-500 mb-1">
          <span>Mínimo para saque via Pix</span>
          <span>{brl(MIN_PAYOUT_CENTS)}</span>
        </div>
        <div className="h-2.5 rounded-full bg-[#21262d] overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-amber-300" style={{ width: `${pct}%`, transition: 'width .6s ease' }} />
        </div>
      </div>
      <div className={`mt-4 rounded-xl py-2.5 text-center text-sm font-bold transition-all duration-500 ${ready ? 'bg-emerald-500 text-slate-950 v-glow' : 'bg-[#21262d] text-slate-500'}`}>
        {ready ? 'Sacar via Pix' : 'Saque ainda não liberado'}
      </div>
    </div>
  );
}

function EarningsSimulator() {
  const [direct, setDirect] = useState(10);
  const [network, setNetwork] = useState(0);
  const netAvg = (lvlCents(2) + lvlCents(3) + lvlCents(4)) / 3;
  const monthly = (direct * lvlCents(1) + network * netAvg) / 100;
  const fmt = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  return (
    <div className={`${frame} max-w-2xl mx-auto`}>
      <p className="text-sm font-bold text-amber-300 uppercase tracking-wider">Simulador: faça a conta você mesmo</p>
      <div className="mt-4 space-y-5">
        <div>
          <div className="flex justify-between text-sm text-slate-200">
            <label htmlFor="direct">Pessoas que assinaram direto pelo seu link</label>
            <strong className="tabular-nums">{direct}</strong>
          </div>
          <input id="direct" type="range" min={1} max={200} value={direct} onChange={(e) => setDirect(Number(e.target.value))} className="mt-2 w-full accent-emerald-500" />
        </div>
        <div>
          <div className="flex justify-between text-sm text-slate-200">
            <label htmlFor="network">Pessoas que a sua rede trouxe (níveis 2 a {MAX_COMMISSION_LEVELS})</label>
            <strong className="tabular-nums">{network}</strong>
          </div>
          <input id="network" type="range" min={0} max={200} value={network} onChange={(e) => setNetwork(Number(e.target.value))} className="mt-2 w-full accent-amber-400" />
        </div>
      </div>
      <div className="mt-6 grid sm:grid-cols-2 gap-3">
        <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-4">
          <div className="text-xs uppercase font-bold text-emerald-300">Por mês</div>
          <div className="text-3xl font-extrabold text-emerald-300 tabular-nums">{fmt(monthly)}</div>
        </div>
        <div className="rounded-xl bg-amber-400/10 border border-amber-400/30 p-4">
          <div className="text-xs uppercase font-bold text-amber-300">Em 12 meses</div>
          <div className="text-3xl font-extrabold text-amber-300 tabular-nums">{fmt(monthly * 12)}</div>
        </div>
      </div>
      <p className="mt-4 text-xs text-slate-500">
        Aritmética pura: considera que todas essas pessoas continuem pagando durante os 12 meses e divide a rede igualmente entre os níveis 2, 3 e 4. <strong className="text-slate-300">Não é promessa de ganho:</strong> se ninguém assinar pelo seu link, você não recebe nada. O quanto você ganha depende de quantas pessoas realmente assinam e continuam pagando.
      </p>
    </div>
  );
}

const AFF_STEPS = [
  { icon: Sparkles, title: 'Crie sua conta', text: 'É grátis para começar. Seu link exclusivo já nasce com ela.' },
  { icon: Link2, title: 'Pegue o seu link', text: 'Fica na aba Afiliados do painel, pronto para copiar e compartilhar.' },
  { icon: Share2, title: 'Compartilhe', text: 'Mande para quem vive dizendo “preciso me organizar”: amigos, colegas, grupo, redes sociais.' },
  { icon: BadgeCheck, title: 'Alguém assina', text: 'Quando o primeiro pagamento da pessoa é confirmado, a sua comissão é gerada e aprovada.' },
  { icon: Banknote, title: 'Saque via Pix', text: `Com ${brl(MIN_PAYOUT_CENTS)} de saldo ou mais, você pede o saque e recebe na sua chave Pix.` },
];

/* ------------------------------------------------------------------ */
/* Conteúdo                                                            */
/* ------------------------------------------------------------------ */

const TRUTHS = [
  'Ninguém vai te cobrar. Nem o chefe, nem o espelho, nem o domingo à noite.',
  'A motivação de segunda-feira não paga a conta de sexta.',
  'Você já sabe o que fazer. Sempre soube. O que falta é um sistema que não dependa do seu humor.',
  'Cada “começo na segunda” que não começou ensinou ao seu cérebro que a sua palavra não vale nada.',
  'Daqui a cinco anos, a diferença entre você e a pessoa que você queria ser não vai ser talento. Vai ser quantos dias ela voltou depois de falhar.',
];

const COMPARE = [
  ['Meta guardada na cabeça', 'Meta com prazo, hábitos e próximo passo'],
  ['Foco depende do humor', 'Sessões guiadas e tempo focado registrado'],
  ['Dinheiro some no fim do mês', 'Cada gasto e cada conta à vista'],
  ['Falhou um dia = desistiu', 'Dia incompleto não é fracasso: retoma amanhã'],
  ['Dez apps soltos', 'Tudo no mesmo painel, no celular ou no PC'],
];

const FAQ = [
  { q: 'Já tentei outros apps e larguei. Por que seria diferente?', a: 'A maioria cobra perfeição: perdeu um dia, zerou a sequência. No Ritmo, a corrente conta semanas cumpridas pela meta que você mesmo definiu, não dias seguidos. Quem treina três vezes por semana não quebra nada nos dias de descanso. E o teste é grátis justamente para você comprovar na prática.' },
  { q: 'Preciso de cartão para testar?', a: 'Não. Os 7 dias de teste começam assim que você cria a conta, sem cadastrar cartão.' },
  { q: 'Vai renovar sozinho e cobrar no meu cartão?', a: 'Não. A assinatura é paga manualmente, por Pix ou cartão, a cada 30 dias. Não existe cobrança automática recorrente escondida. Se você não pagar, o acesso é pausado e os seus dados ficam guardados.' },
  { q: 'Não tenho tempo. Isso vai me dar mais trabalho?', a: 'A ideia é o contrário: cerca de 10 minutos por dia para planejar, marcar o que fez e fechar o dia. O resto do tempo é para executar, não para se organizar.' },
  { q: 'E se eu não gostar?', a: 'Você usa 7 dias inteiros sem pagar nada. Se não fizer sentido, não paga e pronto. Seus dados podem ser exportados ou excluídos pelo próprio app.' },
  { q: 'Dá mesmo para ganhar dinheiro indicando? Quanto?', a: `Dá, se pessoas reais assinarem pelo seu link. Para cada pagamento confirmado, quem indicou diretamente recebe ${COMMISSION_DIRECT_PERCENT}% (${brl(lvlCents(1))} no plano de ${brl(PLAN_PRICE_CENTS)}), todo mês em que a pessoa continuar pagando, e a rede até o ${MAX_COMMISSION_LEVELS}º nível divide mais ${COMMISSION_NETWORK_PERCENT}%. O saque é por Pix a partir de ${brl(MIN_PAYOUT_CENTS)}. Não existe ganho garantido: se ninguém assinar pelo seu link, você não recebe nada.` },
  { q: 'O Ritmo me garante resultado?', a: 'Não, e desconfie de quem garante. Ele é uma ferramenta: mostra o que você fez, o que falta e para onde o seu dinheiro e o seu tempo estão indo. O resultado depende de você abrir o app e agir.' },
];

/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */

function SalesPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  useEffect(() => {
    // Guarda o código de indicação (?ref=) para atribuir a venda ao afiliado no cadastro.
    const ref = new URLSearchParams(window.location.search).get('ref');
    if (ref) {
      try {
        localStorage.setItem('ritmo_referral', ref);
      } catch {
        /* ignora */
      }
    }
    fetch('/api/auth')
      .then((r) => r.json())
      .then((d) => setLoggedIn(Boolean(d?.user)))
      .catch(() => {});
  }, []);

  const cta = loggedIn ? '/app' : '/login?modo=cadastro';
  const ctaLabel = loggedIn ? 'Ir para o meu painel' : 'Começar meus 7 dias grátis';
  const btn =
    'inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-base sm:text-lg shadow-xl shadow-emerald-500/25 transition-transform hover:scale-[1.02]';

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#f0f6fc] pb-24 md:pb-0 overflow-x-hidden">
      <style>{css}</style>

      <div className="bg-emerald-500 text-slate-950 text-center text-xs sm:text-sm font-bold py-2 px-4">
        7 dias grátis · sem cartão de crédito · sem renovação automática
      </div>

      <header className="border-b border-[#30363d]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-amber-500 flex items-center justify-center">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold text-lg bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">Ritmo</span>
          </a>
          <a href={cta} className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm">
            {loggedIn ? 'Meu painel' : 'Testar grátis'}
          </a>
        </div>
      </header>

      {/* HERO */}
      <section className="relative">
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(244,63,94,0.14),transparent)]" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-14 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="text-sm font-bold text-rose-400 uppercase tracking-wider">Leia com calma. Dói um pouco.</p>
            <h1 className="mt-3 text-4xl sm:text-6xl font-extrabold tracking-tight leading-[1.05]">
              Daqui a um ano, você vai estar{' '}
              <span className="bg-gradient-to-r from-rose-400 to-amber-300 bg-clip-text text-transparent">exatamente onde está hoje.</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-slate-300">
              A menos que algo mude agora. Não a sua motivação, que oscila. <strong className="text-white">O seu sistema.</strong>
            </p>
            <p className="mt-3 text-slate-400">
              Treino que morre na terceira semana. Meta que fica “para segunda”. Dinheiro que some. Foco roubado pelo celular.
              Você não é preguiçoso. Você está tentando vencer o jogo sem placar.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <a href={cta} className={`${btn} v-glow`}>
                {ctaLabel} <ArrowRight className="w-5 h-5" />
              </a>
            </div>
            <p className="mt-3 text-xs text-slate-500">Leva 1 minuto. Depois do teste: R$ 39,90 por 30 dias, pago por Pix ou cartão quando você quiser continuar.</p>
          </div>
          <div className="v-float max-w-md w-full mx-auto">
            <ChainDemo />
          </div>
        </div>
      </section>

      {/* CONTAGEM DO ANO */}
      <section className="border-y border-[#30363d] bg-[#0b0f14]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
          <Reveal>
            <p className="text-center text-sm font-bold text-rose-400 uppercase tracking-wider mb-6">O relógio não espera a sua motivação voltar</p>
            <YearCounter />
          </Reveal>
        </div>
      </section>

      {/* VERDADES */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <Reveal>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-center">Algumas verdades que ninguém te conta.</h2>
        </Reveal>
        <div className="mt-10 space-y-5">
          {TRUTHS.map((t, i) => (
            <Reveal key={t} delay={i * 80}>
              <div className="flex gap-4 rounded-2xl border border-[#30363d] bg-[#161b22] p-5">
                <Quote className="w-5 h-5 text-rose-400 shrink-0 mt-1" />
                <p className="text-lg text-slate-200">{t}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal>
          <p className="mt-10 text-center text-xl text-slate-300">
            A boa notícia: <strong className="text-white">isso tem conserto.</strong> E não passa por virar outra pessoa.
          </p>
        </Reveal>
      </section>

      {/* CALCULADORA */}
      <section className="border-y border-[#30363d] bg-[#0b0f14] px-4 sm:px-6 py-16">
        <Reveal>
          <Calculator />
        </Reveal>
      </section>

      {/* DEMOS */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <Reveal>
          <p className="text-center text-sm font-bold text-emerald-400 uppercase tracking-wider">O Ritmo</p>
          <h2 className="mt-2 text-3xl sm:text-5xl font-extrabold text-center">Um painel. Todos os dias. O próximo passo sempre à vista.</h2>
          <p className="mt-4 text-center text-slate-400 max-w-2xl mx-auto">Veja o sistema funcionando. Nada de promessa solta: é assim, por dentro.</p>
        </Reveal>

        <div className="mt-12 grid lg:grid-cols-2 gap-8 items-center">
          <Reveal>
            <h3 className="text-2xl font-extrabold">Falhou um dia? A corrente continua.</h3>
            <p className="mt-3 text-slate-400">
              O Ritmo não exige perfeição. Você define quantas vezes por semana quer cumprir cada hábito, e a corrente cresce a cada semana em que você honra o <em>seu</em> combinado. Quem treina três vezes não perde nada nos dias de descanso. O tudo-ou-nada que derrubou você tantas vezes não existe aqui.
            </p>
          </Reveal>
          <Reveal delay={100}>
            <ChainDemo />
          </Reveal>
        </div>

        <div className="mt-16 grid lg:grid-cols-2 gap-8 items-center">
          <Reveal className="lg:order-2">
            <h3 className="text-2xl font-extrabold">Pare de carregar tudo na cabeça.</h3>
            <p className="mt-3 text-slate-400">
              Tarefas grandes viram etapas pequenas, com checklist e andamento visível: “2 de 3 etapas concluídas”. A sensação de estar sempre atrasado diminui quando você enxerga o que já foi feito.
            </p>
          </Reveal>
          <Reveal delay={100} className="lg:order-1">
            <KanbanDemo />
          </Reveal>
        </div>

        <div className="mt-16 grid lg:grid-cols-2 gap-8 items-center">
          <Reveal>
            <h3 className="text-2xl font-extrabold">Vinte e cinco minutos sem o celular te puxar.</h3>
            <p className="mt-3 text-slate-400">
              Um objetivo por vez, um cronômetro e o registro honesto de quanto tempo você realmente focou. No fim da semana, você para de dizer “trabalhei o dia todo e não sei no quê”.
            </p>
          </Reveal>
          <Reveal delay={100}>
            <FocusDemo />
          </Reveal>
        </div>

        <div className="mt-16 grid lg:grid-cols-2 gap-8 items-center">
          <Reveal className="lg:order-2">
            <h3 className="text-2xl font-extrabold">O dinheiro com endereço.</h3>
            <p className="mt-3 text-slate-400">
              Receitas, despesas, parcelas, contas a vencer e orçamento por categoria. Em um mês você sabe, em reais, para onde vai cada centavo. Sem planilha de 14 abas.
            </p>
          </Reveal>
          <Reveal delay={100} className="lg:order-1">
            <FinanceDemo />
          </Reveal>
        </div>

        <div className="mt-16 grid lg:grid-cols-2 gap-8 items-center">
          <Reveal>
            <h3 className="text-2xl font-extrabold">30 segundos por dia que mudam o que você enxerga.</h3>
            <p className="mt-3 text-slate-400">
              Energia, humor e foco de 1 a 5, e duas perguntas que obrigam você a olhar para o próprio dia: o que tornou a sua vida mais fácil, e o que você não deve repetir. Toda semana, a revisão mostra o que funcionou e onde ajustar.
            </p>
          </Reveal>
          <Reveal delay={100}>
            <JournalDemo />
          </Reveal>
        </div>
      </section>

      {/* E TEM MAIS: PROGRAMA DE INDICAÇÃO */}
      <section className="border-y border-amber-500/20 bg-gradient-to-b from-amber-500/[0.06] to-transparent">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <Reveal>
            <p className="text-center text-sm font-bold text-amber-300 uppercase tracking-wider">E tem mais</p>
            <h2 className="mt-2 text-3xl sm:text-5xl font-extrabold text-center leading-tight">
              Além de organizar a sua vida,{' '}
              <span className="bg-gradient-to-r from-amber-300 to-emerald-400 bg-clip-text text-transparent">o Ritmo pode pagar você.</span>
            </h2>
            <p className="mt-5 text-center text-lg text-slate-300 max-w-3xl mx-auto">
              Cada pessoa que assina pelo seu link coloca <strong className="text-white">dinheiro de verdade no seu bolso</strong>, via Pix,
              <strong className="text-white"> todo mês</strong> em que ela continuar pagando. Você usa o sistema, mostra para quem precisa e é pago por isso.
            </p>
          </Reveal>

          <div className="mt-12 grid lg:grid-cols-2 gap-10 items-center">
            <Reveal>
              <h3 className="text-2xl font-extrabold">Como funciona, passo a passo</h3>
              <ol className="mt-5 space-y-4">
                {AFF_STEPS.map((st, i) => (
                  <li key={st.title} className="flex gap-4">
                    <span className="w-10 h-10 shrink-0 rounded-xl bg-amber-400/10 text-amber-300 flex items-center justify-center">
                      <st.icon className="w-5 h-5" />
                    </span>
                    <div>
                      <div className="font-bold">{i + 1}. {st.title}</div>
                      <p className="text-sm text-slate-400">{st.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </Reveal>
            <Reveal delay={100}>
              <AffiliateDemo />
            </Reveal>
          </div>

          <Reveal>
            <h3 className="mt-16 text-2xl font-extrabold text-center">Quanto cada assinatura paga a você</h3>
            <p className="mt-2 text-center text-slate-400 max-w-2xl mx-auto">
              O Ritmo paga até <strong className="text-white">{COMMISSION_TOTAL_PERCENT}% de cada pagamento</strong>: {COMMISSION_DIRECT_PERCENT}% vão para quem indicou diretamente
              e mais {COMMISSION_NETWORK_PERCENT}% se dividem entre a rede, até o {MAX_COMMISSION_LEVELS}º nível. Exemplo com o plano de {brl(PLAN_PRICE_CENTS)}:
            </p>
            <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className={`rounded-2xl border p-5 text-center ${n === 1 ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-[#30363d] bg-[#161b22]'}`}>
                  <div className="text-xs uppercase font-bold text-slate-400">{n === 1 ? 'Nível 1 · você indicou' : `Nível ${n} · rede`}</div>
                  <div className={`mt-1 text-4xl font-extrabold ${n === 1 ? 'text-emerald-300' : 'text-white'}`}>{levelPercent(n)}%</div>
                  <div className="text-sm text-slate-300 mt-1">{brl(lvlCents(n))} por pagamento</div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-center text-sm text-slate-400">
              <strong className="text-white">Nível 1</strong> é quem assina pelo seu link. <strong className="text-white">Níveis 2 a {MAX_COMMISSION_LEVELS}</strong> são as pessoas que{' '}
              quem veio pelo seu link indicou, e as que elas indicaram, e assim por diante. É recorrente: a comissão se repete a cada pagamento confirmado.
            </p>
          </Reveal>

          <Reveal className="mt-14">
            <EarningsSimulator />
          </Reveal>

          <Reveal>
            <h3 className="mt-16 text-2xl font-extrabold text-center">As regras, sem letra miúda</h3>
            <div className="mt-6 grid sm:grid-cols-2 gap-4 max-w-4xl mx-auto text-sm">
              {[
                ['Só paga quando o pagamento é confirmado', 'A comissão só nasce depois que o pagamento da pessoa é confirmado. Cada pagamento mensal confirmado gera uma nova comissão.'],
                ['Atribuição pelo último link', 'Vale o último link válido antes do cadastro, com janela de 60 dias.'],
                ['Reembolso desfaz a comissão', 'Se o pagamento for reembolsado ou contestado, as comissões daquele pedido são revertidas.'],
                ['Saque por Pix', `Valor mínimo de ${brl(MIN_PAYOUT_CENTS)}. O pedido é feito no próprio painel, na aba Afiliados.`],
                ['Autoindicação não vale', 'Indicar a si mesmo é bloqueado pelo sistema.'],
                ['Sem promessa de renda', 'Quem ganha é quem consegue assinaturas reais. Ninguém é pago por cadastro, só por pagamento confirmado.'],
              ].map(([t, d]) => (
                <div key={t} className="rounded-xl border border-[#30363d] bg-[#161b22] p-4">
                  <div className="font-bold flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" /> {t}</div>
                  <p className="mt-1 text-slate-400">{d}</p>
                </div>
              ))}
            </div>
            <div className="mt-10 text-center">
              <a href={cta} className={`${btn} v-glow`}>
                {ctaLabel} e pegar meu link <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* COMPARAÇÃO */}
      <section className="border-y border-[#30363d] bg-[#0b0f14]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
          <Reveal>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-center">Continuar como está tem um preço também.</h2>
          </Reveal>
          <div className="mt-10 rounded-2xl border border-[#30363d] overflow-hidden">
            <div className="grid grid-cols-2 text-xs sm:text-sm font-bold uppercase tracking-wider">
              <div className="bg-rose-500/10 text-rose-300 px-4 py-3">Do jeito que está</div>
              <div className="bg-emerald-500/10 text-emerald-300 px-4 py-3">Com o Ritmo</div>
            </div>
            {COMPARE.map(([a, b]) => (
              <div key={a} className="grid grid-cols-2 border-t border-[#30363d] text-sm">
                <div className="flex gap-2 px-4 py-3.5 text-slate-400"><X className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" /> {a}</div>
                <div className="flex gap-2 px-4 py-3.5 text-slate-200"><Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> {b}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PREÇO */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16 text-center">
        <Reveal>
          <p className="text-sm font-bold text-amber-300 uppercase tracking-wider">O preço da decisão</p>
          <div className="mt-4 rounded-3xl border border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 to-transparent p-8">
            <div className="text-6xl font-extrabold">R$ 39,90<span className="text-xl text-slate-400 font-medium"> / 30 dias</span></div>
            <p className="mt-2 text-slate-300">Cerca de <strong className="text-white">R$ 1,33 por dia</strong>. Tudo incluído, plano único.</p>
            <ul className="mt-6 text-left max-w-sm mx-auto space-y-2 text-sm text-slate-300">
              {[
                '7 dias grátis, sem cartão',
                'Metas, rotina, quadros, hábitos, foco, diário e finanças',
                'Celular e computador',
                `Programa de indicação: ${COMMISSION_DIRECT_PERCENT}% recorrente por assinatura, mais a sua rede até o ${MAX_COMMISSION_LEVELS}º nível`,
                'Pagamento manual por Pix ou cartão: sem renovação automática',
                'Seus dados: exporte ou exclua quando quiser',
              ].map((i) => (
                <li key={i} className="flex gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /> {i}</li>
              ))}
            </ul>
            <a href={cta} className={`${btn} mt-8 w-full sm:w-auto`}>
              {ctaLabel} <ArrowRight className="w-5 h-5" />
            </a>
            <p className="mt-3 text-xs text-slate-500 flex items-center justify-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5" /> Se não fizer sentido nos 7 dias, você não paga nada.</p>
          </div>
        </Reveal>
      </section>

      {/* LINHA DO TEMPO */}
      <section className="border-y border-[#30363d] bg-[#0b0f14]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
          <Reveal>
            <h2 className="text-3xl font-extrabold text-center">Dois caminhos a partir de hoje.</h2>
          </Reveal>
          <div className="mt-10 grid sm:grid-cols-2 gap-5">
            <Reveal>
              <div className="h-full rounded-2xl border border-rose-500/30 bg-rose-500/5 p-6">
                <div className="flex items-center gap-2 text-rose-300 font-bold"><Clock className="w-5 h-5" /> Se nada mudar</div>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  <li>Em 7 dias: o mesmo “vou me organizar”.</li>
                  <li>Em 30 dias: mais um mês sem saber onde foi o dinheiro.</li>
                  <li>Em 1 ano: a mesma conversa consigo mesmo, só que mais cansada.</li>
                </ul>
              </div>
            </Reveal>
            <Reveal delay={120}>
              <div className="h-full rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6">
                <div className="flex items-center gap-2 text-emerald-300 font-bold"><Sparkles className="w-5 h-5" /> Se você começar hoje</div>
                <ul className="mt-3 space-y-2 text-sm text-slate-300">
                  <li>Em 7 dias: você sabe quanto focou, quantos dias cumpriu e quanto gastou.</li>
                  <li>Em 40 dias: o dinheiro tem destino e o treino tem frequência.</li>
                  <li>Em 90 dias: você tem registro de tudo o que fez. Não é sorte: é sistema.</li>
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <Reveal>
          <h2 className="text-3xl font-extrabold text-center">Ainda com dúvida? Normal. Respondemos.</h2>
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
          <div className="max-w-3xl mx-auto rounded-3xl border border-rose-500/30 bg-gradient-to-br from-rose-500/10 via-transparent to-amber-500/10 p-8 sm:p-12 text-center">
            <h2 className="text-3xl sm:text-5xl font-extrabold leading-tight">Você já esperou tempo demais pelo “momento certo”.</h2>
            <p className="mt-5 text-lg text-slate-300">
              O momento certo é uma história que a gente conta para não começar. Daqui a 7 dias você já sabe se isso funciona para você. A alternativa é continuar achando que “qualquer hora” resolve.
            </p>
            <a href={cta} className={`${btn} mt-8 v-glow`}>
              {ctaLabel} <ArrowRight className="w-5 h-5" />
            </a>
            <p className="mt-4 text-xs text-slate-500">Sem cartão. Sem renovação automática. Leva 1 minuto.</p>
          </div>
        </Reveal>
        <p className="max-w-3xl mx-auto mt-8 text-center text-xs text-slate-600">
          O Ritmo é uma ferramenta de organização pessoal. Não oferece recomendação médica, nutricional ou de investimento, e não garante resultados: eles dependem do uso. Os dados nas animações são exemplos. Ganhos do programa de indicação não são garantidos e dependem de assinaturas reais confirmadas.{' '}
          <a href="/termos" className="underline">Termos</a> · <a href="/privacidade" className="underline">Privacidade</a>
        </p>
      </section>

      {/* BARRA FIXA MOBILE */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-[#30363d] bg-[#0d1117]/95 backdrop-blur px-4 py-3">
        <a href={cta} className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-emerald-500 text-slate-950 font-extrabold">
          {ctaLabel} <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
