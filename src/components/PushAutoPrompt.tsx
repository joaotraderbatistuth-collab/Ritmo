import { useEffect, useState } from 'react';
import { BellRing, X } from 'lucide-react';
import { autoEnablePush, subscribeThisDevice } from '../lib/push-client.js';

const LATER_KEY = 'ritmo_push_prompt_later';
const LATER_DAYS = 3;

/**
 * Notificações ligadas por padrão. Ao abrir o app:
 * - se a permissão já existe, liga sozinho (sem perguntar);
 * - se ainda não foi pedida, mostra este convite de um toque (o navegador só deixa pedir com um toque);
 * - quem desligou de propósito não vê nada.
 */
export function PushAutoPrompt() {
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    let alive = true;
    autoEnablePush().then((r) => {
      if (!alive || r !== 'ask') return;
      try {
        const later = Number(localStorage.getItem(LATER_KEY) || 0);
        if (later && Date.now() - later < LATER_DAYS * 86400000) return;
      } catch {
        /* sem armazenamento: mostra */
      }
      setShow(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!show) return null;

  const enable = async () => {
    setBusy(true);
    setMsg('');
    try {
      const p = await Notification.requestPermission();
      if (p !== 'granted') {
        setMsg(p === 'denied' ? 'O navegador bloqueou. Para ligar depois, libere as notificações nas configurações do site.' : 'Tudo bem, você pode ligar depois em Configurações.');
        try {
          localStorage.setItem(LATER_KEY, String(Date.now()));
        } catch {
          /* ignora */
        }
        setTimeout(() => setShow(false), 3500);
        return;
      }
      await subscribeThisDevice();
      setShow(false);
    } catch (e: any) {
      setMsg(e?.message || 'Não foi possível ligar agora.');
    } finally {
      setBusy(false);
    }
  };

  const later = () => {
    try {
      localStorage.setItem(LATER_KEY, String(Date.now()));
    } catch {
      /* ignora */
    }
    setShow(false);
  };

  return (
    <div className="mb-4 rounded-2xl border border-emerald-500/40 bg-gradient-to-r from-emerald-500/15 to-teal-500/5 p-4 flex items-start gap-3" role="region" aria-label="Ativar notificações">
      <span className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
        <BellRing className="w-5 h-5 text-slate-950" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="font-bold">As notificações do Ritmo vêm ligadas</p>
        <p className="text-sm opacity-75 mt-0.5">Falta só o seu toque para o celular deixar: lembretes do secretário, contas a vencer e até 3 empurrõezinhos por dia. Dá para desligar quando quiser em Configurações.</p>
        {msg && <p className="text-xs text-amber-500 mt-2">{msg}</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={enable} disabled={busy} className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm disabled:opacity-50">
            {busy ? 'Ativando…' : 'Ativar notificações'}
          </button>
          <button type="button" onClick={later} className="px-4 py-2 rounded-lg border border-current/20 text-sm opacity-80">Agora não</button>
        </div>
      </div>
      <button type="button" onClick={later} aria-label="Fechar" className="p-1 opacity-60 hover:opacity-100">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
