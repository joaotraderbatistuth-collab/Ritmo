import { useCallback, useEffect, useState } from 'react';
import { Send, Volume2, RefreshCw, Smartphone, User, Users, AlertTriangle, Info } from 'lucide-react';
import { PushToggle } from '../PushToggle.js';
import { pushSupported, subscribeThisDevice } from '../../lib/push-client.js';
import { playRitmoSound } from '../../lib/notify-sound.js';
import { NOTIFY_LIMITS, NOTIFY_TABS, type NotifyTarget } from '../../lib/admin-notify.js';

// Aba "Notificações" do painel admin: testar e enviar notificações para o celular.

const inputCls = 'bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:border-emerald-500';

interface NotifyInfo {
  people: number;
  devices: number;
  myDevices: number;
  history: { id: number; at: string; admin: string; target: string; to: string | null; title: string; sent: number; people: number }[];
}

const TARGET_LABEL: Record<string, string> = { me: 'Teste (para mim)', email: 'Uma pessoa', all: 'Todos' };

export function NotifyTab() {
  const [info, setInfo] = useState<NotifyInfo | null>(null);
  const [title, setTitle] = useState('Teste do Ritmo 🔔');
  const [body, setBody] = useState('Se você está lendo isto no celular, as notificações estão funcionando!');
  const [tab, setTab] = useState('hoje');
  const [target, setTarget] = useState<NotifyTarget>('me');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [soundBlocked, setSoundBlocked] = useState(false);
  const [diag, setDiag] = useState<{ permission: string; sw: boolean; sub: boolean } | null>(null);
  const [fixing, setFixing] = useState(false);

  const checkDevice = useCallback(async () => {
    if (!pushSupported()) return setDiag({ permission: 'sem suporte', sw: false, sub: false });
    const reg = await navigator.serviceWorker.getRegistration().catch(() => undefined);
    const sub = await reg?.pushManager.getSubscription().catch(() => null);
    setDiag({ permission: Notification.permission, sw: Boolean(reg?.active), sub: Boolean(sub) });
  }, []);

  useEffect(() => {
    checkDevice();
  }, [checkDevice]);

  const fixDevice = async () => {
    setFixing(true);
    setMsg(null);
    try {
      if (Notification.permission !== 'granted') {
        const p = await Notification.requestPermission();
        if (p !== 'granted') throw new Error('A permissão de notificação não foi dada neste navegador.');
      }
      await subscribeThisDevice({ auto: true });
      setMsg({ ok: true, text: 'Este aparelho foi inscrito de novo. Agora envie o teste.' });
      await load();
    } catch (e: any) {
      setMsg({ ok: false, text: e?.message || 'Não foi possível inscrever este aparelho.' });
    } finally {
      setFixing(false);
      checkDevice();
    }
  };

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/admin-notificacoes', { credentials: 'include' });
      const d = await r.json();
      if (r.ok) setInfo(d);
      else setMsg({ ok: false, text: d.error || 'Não foi possível carregar.' });
    } catch {
      setMsg({ ok: false, text: 'Sem conexão.' });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const preview = () => window.dispatchEvent(new CustomEvent('ritmo:push-preview', { detail: { title, body, url: `/app?tab=${tab}` } }));

  const send = async () => {
    setMsg(null);
    let confirm = false;
    if (target === 'all') {
      confirm = window.confirm(`Enviar "${title}" para TODAS as ${info?.people ?? ''} pessoas com notificação ligada?`);
      if (!confirm) return;
    }
    setBusy(true);
    try {
      const r = await fetch('/api/admin-notificacoes', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, body, tab, target, email, confirm }),
      });
      const d = await r.json().catch(() => ({}));
      setMsg({ ok: r.ok && d.success !== false, text: d.message || d.error || 'Pronto.' });
      load();
    } catch {
      setMsg({ ok: false, text: 'Sem conexão.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-sm font-bold flex items-center gap-2"><Smartphone className="w-4 h-4 text-emerald-400" /> Este aparelho</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Para receber o teste, ligue as notificações aqui (abra o /admin no celular para testar no celular). Você tem {info?.myDevices ?? '…'} aparelho(s) ligado(s).
            </p>
          </div>
          <button type="button" onClick={load} className="p-2 rounded-lg border border-[#30363d] text-slate-400 hover:text-white" aria-label="Atualizar">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-3"><PushToggle compact /></div>
        {diag && (
          <div className="mt-3 rounded-xl bg-[#0d1117] border border-[#30363d] p-3 text-xs text-slate-400 flex flex-wrap items-center gap-x-4 gap-y-2">
            <span>Permissão: <strong className={diag.permission === 'granted' ? 'text-emerald-300' : 'text-amber-300'}>{diag.permission === 'granted' ? 'liberada' : diag.permission === 'denied' ? 'bloqueada' : diag.permission === 'default' ? 'não pedida' : diag.permission}</strong></span>
            <span>Serviço do app: <strong className={diag.sw ? 'text-emerald-300' : 'text-amber-300'}>{diag.sw ? 'ativo' : 'inativo'}</strong></span>
            <span>Inscrição: <strong className={diag.sub ? 'text-emerald-300' : 'text-amber-300'}>{diag.sub ? 'ok' : 'nenhuma'}</strong></span>
            <button type="button" onClick={fixDevice} disabled={fixing || diag.permission === 'denied' || diag.permission === 'sem suporte'} className="ml-auto px-3 py-1.5 rounded-lg border border-emerald-500/50 text-emerald-300 font-semibold disabled:opacity-40">
              {fixing ? 'Inscrevendo…' : 'Reinscrever este aparelho'}
            </button>
          </div>
        )}
        <div className="mt-4 grid grid-cols-2 gap-3 max-w-sm">
          <div className="rounded-xl bg-[#0d1117] border border-[#30363d] p-3"><div className="text-[11px] text-slate-500">Pessoas com notificação</div><div className="text-xl font-extrabold">{info?.people ?? '…'}</div></div>
          <div className="rounded-xl bg-[#0d1117] border border-[#30363d] p-3"><div className="text-[11px] text-slate-500">Aparelhos</div><div className="text-xl font-extrabold">{info?.devices ?? '…'}</div></div>
        </div>
      </section>

      <section className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 grid lg:grid-cols-[1fr_340px] gap-6">
        <div className="space-y-4">
          <h3 className="text-sm font-bold flex items-center gap-2"><Send className="w-4 h-4 text-emerald-400" /> Enviar notificação</h3>
          <div className="grid grid-cols-3 gap-2">
            {([['me', User, 'Teste (só eu)'], ['email', User, 'Uma pessoa'], ['all', Users, 'Todos']] as const).map(([id, Icon, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setTarget(id)}
                className={`rounded-xl border px-3 py-2 text-sm font-semibold inline-flex items-center justify-center gap-1.5 ${target === id ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300' : 'border-[#30363d] text-slate-400'}`}
              >
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>
          {target === 'email' && (
            <label className="block text-xs text-slate-400">E-mail da pessoa
              <input className={`${inputCls} mt-1`} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="pessoa@email.com" />
            </label>
          )}
          {target === 'all' && (
            <p className="text-xs text-amber-300 flex gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0" /> Vai para todo mundo que ligou as notificações ({info?.people ?? 0} pessoas). Use com moderação: um envio para todos a cada 10 minutos, no máximo.
            </p>
          )}
          <label className="block text-xs text-slate-400">Título
            <input className={`${inputCls} mt-1`} value={title} maxLength={NOTIFY_LIMITS.title} onChange={(e) => setTitle(e.target.value)} />
            <span className="text-[10px] text-slate-600">{title.length}/{NOTIFY_LIMITS.title}</span>
          </label>
          <label className="block text-xs text-slate-400">Mensagem
            <textarea className={`${inputCls} mt-1 h-20 resize-none`} value={body} maxLength={NOTIFY_LIMITS.body} onChange={(e) => setBody(e.target.value)} />
            <span className="text-[10px] text-slate-600">{body.length}/{NOTIFY_LIMITS.body}</span>
          </label>
          <label className="block text-xs text-slate-400">Ao tocar, abre a aba
            <select className={`${inputCls} mt-1`} value={tab} onChange={(e) => setTab(e.target.value)}>
              {NOTIFY_TABS.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </label>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={busy || !title.trim() || !body.trim()} onClick={send} className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm disabled:opacity-50 inline-flex items-center gap-2">
              <Send className="w-4 h-4" /> {busy ? 'Enviando…' : target === 'me' ? 'Enviar teste para mim' : 'Enviar'}
            </button>
            <button type="button" onClick={preview} className="px-4 py-2 rounded-lg border border-[#30363d] text-sm text-slate-300 hover:bg-[#21262d]">Ver como fica aqui</button>
            <button
              type="button"
              onClick={async () => setSoundBlocked(!(await playRitmoSound()))}
              className="px-4 py-2 rounded-lg border border-[#30363d] text-sm text-slate-300 hover:bg-[#21262d] inline-flex items-center gap-2"
            >
              <Volume2 className="w-4 h-4" /> Ouvir o som do Ritmo
            </button>
          </div>
          {soundBlocked && <p className="text-xs text-amber-300">O navegador bloqueou o som. Toque na página e tente de novo.</p>}
          {msg && <p className={`text-sm ${msg.ok ? 'text-emerald-300' : 'text-rose-300'}`}>{msg.text}</p>}
        </div>

        <div>
          <p className="text-[11px] uppercase tracking-wider text-slate-500 mb-2">Prévia na tela do celular</p>
          <div className="rounded-[2rem] border-[8px] border-[#1f2630] bg-gradient-to-b from-[#1b3a4b] to-[#0d1117] p-3 pt-8 min-h-[220px]">
            <div className="text-center text-white/80 text-3xl font-light tabular-nums mb-4">09:41</div>
            <div className="rounded-2xl bg-white/10 backdrop-blur border border-white/10 p-3 flex gap-3">
              <img src="/icon-192.png" alt="" className="w-9 h-9 rounded-lg" />
              <div className="min-w-0">
                <div className="text-[10px] text-white/60 uppercase">Ritmo · agora</div>
                <div className="text-sm font-bold text-white truncate">{title || 'Título'}</div>
                <div className="text-xs text-white/80 line-clamp-3">{body || 'Mensagem'}</div>
              </div>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-slate-500 flex gap-1.5">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            Com o Ritmo aberto na tela, aparece o aviso no topo com o som do Ritmo. Com o app fechado, o celular mostra a notificação com vibração no ritmo da marca e o som padrão do aparelho (som próprio com o app fechado só no app das lojas). No iPhone, só com o app instalado na Tela de Início.
          </p>
        </div>
      </section>

      <section className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5">
        <h3 className="text-sm font-bold mb-3">Últimos envios</h3>
        {!info?.history.length ? (
          <p className="text-sm text-slate-500">Nenhum envio ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs text-slate-500"><tr><th className="text-left py-2 pr-4">Quando</th><th className="text-left py-2 pr-4">Para</th><th className="text-left py-2 pr-4">Título</th><th className="text-left py-2 pr-4">Aparelhos</th><th className="text-left py-2">Por</th></tr></thead>
              <tbody>
                {info.history.map((h) => (
                  <tr key={h.id} className="border-t border-[#30363d]">
                    <td className="py-2 pr-4 whitespace-nowrap">{new Date(h.at).toLocaleString('pt-BR')}</td>
                    <td className="py-2 pr-4">{TARGET_LABEL[h.target] || h.target}{h.to ? ` · ${h.to}` : ''}</td>
                    <td className="py-2 pr-4">{h.title}</td>
                    <td className="py-2 pr-4 tabular-nums">{h.sent}</td>
                    <td className="py-2 text-slate-400">{h.admin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
