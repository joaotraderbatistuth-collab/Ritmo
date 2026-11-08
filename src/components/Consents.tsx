import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { ShieldCheck, MapPin, Mic, FileText, Download, HeartPulse, Sparkles } from 'lucide-react';
import { callApi } from '../lib/client-api.js';
import { CONSENT_TEXT, ConsentKind, LEGAL_VERSION } from '../lib/consent-rules.js';

// Consentimentos da LGPD no navegador: um "armazém" simples compartilhado pelas telas.

interface ConsentItem {
  kind: string;
  version: string;
  grantedAt: string;
  revokedAt: string | null;
}

let state: { loaded: boolean; consents: ConsentItem[]; needsAcceptance: boolean } = { loaded: false, consents: [], needsAcceptance: false };
const subs = new Set<() => void>();
let loading: Promise<void> | null = null;

function set(next: Partial<typeof state>) {
  state = { ...state, ...next };
  subs.forEach((f) => f());
}

export function loadConsents(force = false) {
  if (loading && !force) return loading;
  loading = callApi<{ consents?: ConsentItem[]; needsAcceptance?: boolean }>('/api/consents').then((r) => {
    if (r.ok) set({ loaded: true, consents: r.data.consents || [], needsAcceptance: Boolean(r.data.needsAcceptance) });
    else set({ loaded: true });
  });
  return loading;
}

/** Registra no servidor e já atualiza a tela (sem esperar a resposta). */
export function grant(kinds: ConsentKind[]) {
  const now = new Date().toISOString();
  set({
    consents: [...kinds.map((k) => ({ kind: k, version: LEGAL_VERSION, grantedAt: now, revokedAt: null })), ...state.consents.filter((c) => !kinds.includes(c.kind as ConsentKind))],
    needsAcceptance: kinds.includes('termos') ? false : state.needsAcceptance,
  });
  return callApi('/api/consents', { action: 'grant', kinds });
}

export function revoke(kinds: ConsentKind[]) {
  set({ consents: state.consents.map((c) => (kinds.includes(c.kind as ConsentKind) ? { ...c, revokedAt: new Date().toISOString() } : c)) });
  return callApi('/api/consents', { action: 'revoke', kinds });
}

export function hasConsent(kind: ConsentKind) {
  return state.consents.some((c) => c.kind === kind && !c.revokedAt);
}

export function useConsents() {
  const snap = useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    () => state,
    () => state
  );
  useEffect(() => {
    if (!state.loaded) loadConsents();
  }, []);
  return { ...snap, has: (k: ConsentKind) => snap.consents.some((c) => c.kind === k && !c.revokedAt) };
}

/* ------------------------------------------------------------------ */
/* Termos atualizados: aceitar para continuar                          */
/* ------------------------------------------------------------------ */

export const LegalUpdateModal: React.FC = () => {
  const c = useConsents();
  const [checked, setChecked] = useState(false);
  if (!c.loaded || !c.needsAcceptance) return null;
  return (
    <div className="fixed inset-0 z-[80] bg-black/80 flex items-end sm:items-center justify-center p-3" role="dialog" aria-modal="true" aria-label="Termos atualizados">
      <div className="w-full max-w-md rounded-2xl border border-[#30363d] bg-[#161b22] p-5 text-[#f0f6fc] max-h-[90vh] overflow-y-auto">
        <h3 className="font-bold text-lg flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-emerald-400" /> Atualizamos nossos termos</h3>
        <p className="text-sm text-[#8b949e] mt-1">O Ritmo ganhou treinos com GPS, secretário por voz, lembretes, perfil e níveis. Explicamos com clareza o que é guardado e como você controla tudo.</p>
        <ul className="mt-4 space-y-2.5 text-sm">
          <li className="flex gap-2.5"><HeartPulse className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /><span><strong>Bem-estar:</strong> hábitos, treinos e diário servem só para o app funcionar para você.</span></li>
          <li className="flex gap-2.5"><MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /><span><strong>Localização:</strong> só durante um treino, e só com a sua permissão.</span></li>
          <li className="flex gap-2.5"><Mic className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /><span><strong>Voz:</strong> o navegador vira a fala em texto; não gravamos áudio.</span></li>
          <li className="flex gap-2.5"><Download className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" /><span><strong>Seus direitos:</strong> baixar todos os seus dados, mudar permissões e excluir a conta a qualquer momento.</span></li>
        </ul>
        <div className="mt-4 flex gap-3 text-sm">
          <a href="/termos" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-emerald-400 hover:underline"><FileText className="w-4 h-4" /> Termos de Uso</a>
          <a href="/privacidade" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-emerald-400 hover:underline"><ShieldCheck className="w-4 h-4" /> Privacidade</a>
        </div>
        <label className="mt-4 flex items-start gap-2 text-sm text-[#c9d1d9] cursor-pointer">
          <input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} className="mt-1 accent-emerald-500" />
          <span>Li e concordo com os Termos de Uso e a Política de Privacidade, e autorizo o uso dos meus dados de bem-estar só para o app funcionar para mim.</span>
        </label>
        <button type="button" disabled={!checked} onClick={() => grant(['termos', 'saude'])} className="mt-4 w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold">Aceitar e continuar</button>
        <p className="mt-2 text-[11px] text-[#6e7681] text-center">Se não concordar, você pode baixar seus dados e excluir a conta em Progresso.</p>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Pedido de permissão (GPS, voz)                                       */
/* ------------------------------------------------------------------ */

export const ConsentPrompt: React.FC<{ kind: 'gps' | 'voz'; onAccept: () => void; onCancel: () => void }> = ({ kind, onAccept, onCancel }) => {
  const t = CONSENT_TEXT[kind];
  const Icon = kind === 'gps' ? MapPin : Mic;
  return (
    <div className="fixed inset-0 z-[80] bg-black/70 flex items-end sm:items-center justify-center p-3" role="dialog" aria-modal="true" aria-label={t.title}>
      <div className="w-full max-w-sm rounded-2xl border border-[#30363d] bg-[#161b22] p-5 text-[#f0f6fc]">
        <span className="w-11 h-11 rounded-full bg-emerald-500/15 text-emerald-300 flex items-center justify-center"><Icon className="w-5 h-5" /></span>
        <h3 className="mt-3 font-bold text-lg">{t.title}</h3>
        <p className="mt-1 text-sm text-[#c9d1d9]">{t.body}</p>
        <p className="mt-2 text-xs text-[#8b949e]">Você pode desligar quando quiser em Configurações → Privacidade.</p>
        <div className="mt-4 flex gap-2">
          <button type="button" onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-[#30363d] text-sm text-[#c9d1d9]">Agora não</button>
          <button
            type="button"
            onClick={() => {
              grant([kind]);
              onAccept();
            }}
            className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm"
          >
            Permitir
          </button>
        </div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Configurações → Privacidade                                         */
/* ------------------------------------------------------------------ */

export const PrivacyCard: React.FC = () => {
  const c = useConsents();
  const row = (kind: ConsentKind, Icon: any, toggle: boolean) => {
    const item = c.consents.find((x) => x.kind === kind);
    const on = Boolean(item && !item.revokedAt);
    return (
      <li key={kind} className="flex items-start gap-3 py-3 border-t border-[#21262d] first:border-t-0">
        <Icon className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#f0f6fc]">{CONSENT_TEXT[kind].title}</p>
          <p className="text-xs text-[#8b949e]">{CONSENT_TEXT[kind].body}</p>
          <p className="text-[11px] text-[#6e7681] mt-0.5">{on ? `Permitido em ${new Date(item!.grantedAt).toLocaleDateString('pt-BR')}` : item ? 'Desligado' : 'Ainda não pedido'}</p>
        </div>
        {toggle && (
          <button type="button" onClick={() => (on ? revoke([kind]) : grant([kind]))} className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold border ${on ? 'border-[#30363d] text-[#c9d1d9] hover:text-rose-400' : 'border-emerald-500/50 text-emerald-300'}`}>
            {on ? 'Desligar' : 'Permitir'}
          </button>
        )}
      </li>
    );
  };
  return (
    <section className="rounded-2xl border border-[#30363d] bg-[#161b22] p-5 mb-6 max-w-4xl mx-auto">
      <h3 className="text-base font-semibold text-[#f0f6fc] flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-emerald-400" /> Privacidade e permissões</h3>
      <p className="text-xs text-[#8b949e] mt-0.5">Você decide o que o Ritmo pode usar. Seus dados nunca são vendidos.</p>
      <ul className="mt-3">
        {row('gps', MapPin, true)}
        {row('voz', Mic, true)}
        {row('saude', HeartPulse, false)}
        {row('perfil', Sparkles, false)}
        {row('termos', FileText, false)}
      </ul>
      <div className="mt-3 flex flex-wrap gap-2">
        <a href="/api/meus-dados" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#30363d] text-sm text-[#c9d1d9] hover:bg-[#21262d]"><Download className="w-4 h-4" /> Baixar todos os meus dados</a>
        <a href="/privacidade" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#30363d] text-sm text-[#c9d1d9] hover:bg-[#21262d]"><ShieldCheck className="w-4 h-4" /> Política de Privacidade</a>
      </div>
      <p className="mt-2 text-[11px] text-[#6e7681]">Para excluir a conta e todos os dados, vá em Progresso → Excluir conta.</p>
    </section>
  );
};
