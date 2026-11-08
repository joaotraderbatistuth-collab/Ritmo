import React, { useCallback, useEffect, useState } from 'react';
import { Swords, Plus, X, Share2, Check, Users, CalendarClock } from 'lucide-react';
import { callApi } from '../lib/client-api.js';
import { LevelAvatar } from './LevelAvatar.js';
import { CHALLENGE_DURATIONS, CHALLENGE_KINDS, ChallengeKind, suggestedTarget } from '../lib/challenges.js';

// Desafios em dupla ou trio: criar, convidar (link ou quem você segue), aceitar e acompanhar juntos.

interface Member {
  userId: number;
  name: string;
  initials: string;
  avatarUrl: string | null;
  level: number;
  value: number;
  done: boolean;
  invited: boolean;
  me: boolean;
}

interface ChallengeView {
  id: number;
  code: string;
  title: string;
  kind: ChallengeKind;
  emoji: string;
  unit: string;
  target: number;
  days: number;
  status: 'upcoming' | 'active' | 'ended';
  daysLeft: number;
  myStatus: 'active' | 'invited';
  members: Member[];
  nudge: string;
}

const linkFor = (code: string) => `${typeof location !== 'undefined' ? location.origin : 'https://meu-ritmo.netlify.app'}/app?desafio=${code}`;

async function shareLink(code: string, title: string): Promise<string> {
  const url = linkFor(code);
  const text = `Topa um desafio comigo no Ritmo? ${title}`;
  try {
    const nav = navigator as any;
    if (nav.share) {
      await nav.share({ title: 'Desafio no Ritmo', text, url });
      return '';
    }
    await navigator.clipboard.writeText(`${text} ${url}`);
    return 'Link copiado! Cole no WhatsApp de quem você quer desafiar.';
  } catch (e: any) {
    return e?.name === 'AbortError' ? '' : url;
  }
}

export const ChallengesCard: React.FC<{ refreshKey?: string; compact?: boolean; onChanged?: () => void }> = ({ refreshKey, compact, onChanged }) => {
  const [list, setList] = useState<ChallengeView[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [msg, setMsg] = useState('');
  const load = useCallback(async () => {
    const r = await callApi<{ challenges?: ChallengeView[] }>('/api/challenges');
    setList(r.ok ? r.data.challenges || [] : []);
  }, []);
  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const act = async (action: string, id: number) => {
    const r = await callApi<{ error?: string }>('/api/challenges', { action, id });
    if (!r.ok) setMsg(r.data.error || 'Não deu certo agora.');
    await load();
    onChanged?.();
  };

  if (list === null) return compact ? null : <section className="rounded-3xl border border-[#30363d] bg-[#161b22] p-5 text-sm text-[#8b949e]">Carregando desafios...</section>;
  const visible = compact ? list.filter((c) => c.status !== 'ended') : list;
  if (compact && !visible.length) return null;

  return (
    <section className={`rounded-3xl border border-orange-500/30 bg-gradient-to-br from-orange-500/10 via-[#161b22] to-[#0d1117] p-5`}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-bold text-[#f0f6fc] flex items-center gap-2"><Swords className="w-5 h-5 text-orange-300" /> Desafios com amigos</h3>
        {!compact && (
          <button type="button" onClick={() => setCreating(true)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 text-[#0d1117] text-xs font-bold"><Plus className="w-3.5 h-3.5" /> Novo desafio</button>
        )}
      </div>
      {!visible.length && (
        <div className="mt-3 text-sm text-[#c9d1d9]">
          <p>Junto fica mais fácil. Chame 1 ou 2 amigos para um desafio: “5 dias de treino nesta semana”, “14 hábitos em 7 dias”...</p>
          <p className="mt-1 text-xs text-[#8b949e]">Quem cumpre a própria meta ganha +50 pontos.</p>
        </div>
      )}
      <div className="mt-3 space-y-3">
        {visible.map((c) => (
          <div key={c.id} className="rounded-2xl border border-[#30363d] bg-[#0d1117]/70 p-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-bold text-[#f0f6fc] truncate"><span aria-hidden="true">{c.emoji}</span> {c.title}</p>
                <p className="text-[11px] text-[#8b949e] inline-flex items-center gap-1"><CalendarClock className="w-3 h-3" /> {c.status === 'ended' ? 'Terminou' : c.daysLeft === 1 ? 'Último dia!' : `Faltam ${c.daysLeft} dias`} · meta: {c.target} {c.unit}</p>
              </div>
              {c.myStatus === 'active' && c.status !== 'ended' && c.members.filter((m) => !m.invited).length < 3 && (
                <button type="button" onClick={async () => setMsg(await shareLink(c.code, c.title))} className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-orange-300 hover:underline"><Share2 className="w-3.5 h-3.5" /> Convidar</button>
              )}
            </div>
            {c.myStatus === 'invited' ? (
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={() => act('decline', c.id)} className="flex-1 py-2 rounded-lg border border-[#30363d] text-sm text-[#c9d1d9]">Agora não</button>
                <button type="button" onClick={() => act('accept', c.id)} className="flex-1 py-2 rounded-lg bg-orange-500 hover:bg-orange-400 text-[#0d1117] text-sm font-bold">Aceitar desafio</button>
              </div>
            ) : (
              <>
                <ul className="mt-3 space-y-2">
                  {c.members.map((m) => (
                    <li key={m.userId} className="flex items-center gap-2.5">
                      <LevelAvatar initials={m.initials} avatarUrl={m.avatarUrl} level={m.level} size="xs" showLevel={false} />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between text-xs">
                          <span className={`truncate ${m.me ? 'font-bold text-[#f0f6fc]' : 'text-[#c9d1d9]'}`}>{m.me ? 'Você' : m.name}{m.invited ? ' (convidado)' : ''}</span>
                          <span className={`tabular-nums font-bold ${m.done ? 'text-emerald-400' : 'text-[#c9d1d9]'}`}>{m.done ? <Check className="w-3.5 h-3.5 inline" /> : null} {m.value}/{c.target}</span>
                        </div>
                        <div className="mt-1 h-2 rounded-full bg-[#21262d] overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-700 ${m.done ? 'bg-emerald-400' : m.me ? 'bg-orange-400' : 'bg-sky-400'}`} style={{ width: `${Math.min(100, Math.round((m.value / c.target) * 100))}%` }} />
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                {c.nudge && <p className="mt-3 text-xs font-semibold text-orange-200">{c.nudge}</p>}
                {!compact && c.status !== 'ended' && (
                  <button type="button" onClick={() => confirm('Sair deste desafio?') && act('leave', c.id)} className="mt-2 text-[11px] text-[#6e7681] hover:text-[#c9d1d9]">Sair do desafio</button>
                )}
              </>
            )}
          </div>
        ))}
      </div>
      {msg && <p className="mt-3 text-xs text-emerald-300 break-all">{msg}</p>}
      {compact && <p className="mt-2 text-[11px] text-[#6e7681]">Crie e acompanhe desafios em Progresso.</p>}
      {creating && (
        <CreateChallengeModal
          onClose={() => setCreating(false)}
          onCreated={async (code, title) => {
            setCreating(false);
            await load();
            onChanged?.();
            setMsg(await shareLink(code, title));
          }}
        />
      )}
    </section>
  );
};

const CreateChallengeModal: React.FC<{ onClose: () => void; onCreated: (code: string, title: string) => void }> = ({ onClose, onCreated }) => {
  const [kind, setKind] = useState<ChallengeKind>('treino');
  const [days, setDays] = useState(7);
  const [target, setTarget] = useState(suggestedTarget('treino', 7));
  const [people, setPeople] = useState<{ id: number; name: string; initials: string; avatarUrl: string | null; level: number }[] | null>(null);
  const [invite, setInvite] = useState<number[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    callApi<{ people?: any[] }>('/api/challenges?following=1').then((r) => setPeople(r.ok ? r.data.people || [] : []));
  }, []);
  useEffect(() => setTarget(suggestedTarget(kind, days)), [kind, days]);
  const def = CHALLENGE_KINDS.find((k) => k.id === kind)!;
  const title = `${def.label}: ${target} em ${days} dias`;

  const create = async () => {
    setBusy(true);
    setError('');
    const r = await callApi<{ code?: string; error?: string }>('/api/challenges', { action: 'create', kind, days, target, invite });
    setBusy(false);
    if (!r.ok || !r.data.code) return setError(r.data.error || 'Não foi possível criar agora.');
    onCreated(r.data.code, title);
  };

  return (
    <div className="fixed inset-0 z-[70] bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-3" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Novo desafio" onClick={(e) => e.stopPropagation()} className="w-full max-w-md max-h-[92vh] overflow-y-auto rounded-3xl border border-[#30363d] bg-[#161b22] p-5 text-[#f0f6fc]">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg flex items-center gap-2"><Swords className="w-5 h-5 text-orange-300" /> Novo desafio</h3>
          <button type="button" onClick={onClose} aria-label="Fechar" className="p-1 text-[#8b949e] hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <p className="mt-4 text-xs font-semibold text-[#8b949e]">O que vocês vão fazer?</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {CHALLENGE_KINDS.map((k) => (
            <button key={k.id} type="button" onClick={() => setKind(k.id)} className={`text-left rounded-xl border px-3 py-2 text-sm ${kind === k.id ? 'border-orange-400 bg-orange-500/15 text-orange-100' : 'border-[#30363d] text-[#c9d1d9]'}`}>
              <span aria-hidden="true">{k.emoji}</span> {k.label}
            </button>
          ))}
        </div>
        <p className="mt-4 text-xs font-semibold text-[#8b949e]">Por quantos dias?</p>
        <div className="mt-2 flex gap-2">
          {CHALLENGE_DURATIONS.map((d) => (
            <button key={d} type="button" onClick={() => setDays(d)} className={`flex-1 py-2 rounded-xl border text-sm font-semibold ${days === d ? 'border-orange-400 bg-orange-500/15 text-orange-100' : 'border-[#30363d] text-[#c9d1d9]'}`}>{d} dias</button>
          ))}
        </div>
        <label className="mt-4 block text-xs font-semibold text-[#8b949e]">
          Meta de cada um ({def.unit})
          <input type="number" min={1} value={target} onChange={(e) => setTarget(Math.max(1, Math.round(Number(e.target.value) || 1)))} className="mt-1 w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-[#f0f6fc]" />
        </label>
        <p className="mt-1 text-[11px] text-[#6e7681]">Sugestão para {days} dias: {suggestedTarget(kind, days)}. Quem cumpre ganha +50 pontos.</p>

        <p className="mt-4 text-xs font-semibold text-[#8b949e] inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Convidar quem você segue (até 2)</p>
        {people === null ? (
          <p className="mt-2 text-xs text-[#6e7681]">Carregando...</p>
        ) : people.length === 0 ? (
          <p className="mt-2 text-xs text-[#6e7681]">Você ainda não segue ninguém. Sem problema: depois de criar, mande o link pelo WhatsApp.</p>
        ) : (
          <div className="mt-2 flex flex-wrap gap-2 max-h-40 overflow-y-auto">
            {people.map((p) => {
              const on = invite.includes(p.id);
              return (
                <button key={p.id} type="button" onClick={() => setInvite(on ? invite.filter((x) => x !== p.id) : invite.length < 2 ? [...invite, p.id] : invite)} className={`inline-flex items-center gap-1.5 pl-1 pr-3 py-1 rounded-full border text-xs ${on ? 'border-orange-400 bg-orange-500/15 text-orange-100' : 'border-[#30363d] text-[#c9d1d9]'}`}>
                  <LevelAvatar initials={p.initials} avatarUrl={p.avatarUrl} level={p.level} size="xs" showLevel={false} /> {p.name}
                </button>
              );
            })}
          </div>
        )}
        {error && <p className="mt-3 text-xs text-rose-300">{error}</p>}
        <button type="button" onClick={create} disabled={busy} className="mt-5 w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-[#0d1117] font-extrabold">{busy ? 'Criando...' : 'Criar e convidar'}</button>
        <p className="mt-2 text-[11px] text-center text-[#6e7681]">Depois você também pode mandar o link do desafio pelo WhatsApp.</p>
      </div>
    </div>
  );
};

/** Quem abriu um link de desafio (?desafio=CODIGO): mostra o convite e entra com um toque. */
export const JoinChallengeModal: React.FC<{ code: string | null; onDone: () => void }> = ({ code, onDone }) => {
  const [c, setC] = useState<any>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!code) return;
    callApi<{ challenge?: any; error?: string }>(`/api/challenges?code=${encodeURIComponent(code)}`).then((r) => (r.ok ? setC(r.data.challenge) : setError(r.data.error || 'Convite inválido.')));
  }, [code]);
  if (!code) return null;
  const def = c ? CHALLENGE_KINDS.find((k) => k.id === c.kind) : null;
  const join = async () => {
    setBusy(true);
    const r = await callApi<{ error?: string }>('/api/challenges', { action: 'join', code });
    setBusy(false);
    if (!r.ok) return setError(r.data.error || 'Não foi possível entrar.');
    onDone();
  };
  return (
    <div className="fixed inset-0 z-[72] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div role="dialog" aria-modal="true" aria-label="Convite para desafio" className="w-full max-w-sm rounded-3xl border border-orange-400/50 bg-[#161b22] p-6 text-center text-[#f0f6fc] ritmo-level-pop">
        <span className="text-6xl block" aria-hidden="true">{def?.emoji || '⚔️'}</span>
        <p className="mt-3 text-xs font-bold uppercase tracking-widest text-orange-300">Você foi desafiado</p>
        {c ? (
          <>
            <h2 className="mt-1 text-xl font-extrabold">{c.creator} te chamou</h2>
            <p className="mt-2 text-sm text-[#c9d1d9]">{c.title}</p>
            <p className="mt-1 text-xs text-[#8b949e]">{c.days} dias · {c.members.length} {c.members.length === 1 ? 'pessoa' : 'pessoas'} no desafio · quem cumpre ganha +50 pontos</p>
          </>
        ) : (
          !error && <p className="mt-2 text-sm text-[#8b949e]">Carregando o convite...</p>
        )}
        {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}
        <div className="mt-5 flex flex-col gap-2">
          {c && !c.full && <button type="button" onClick={join} disabled={busy} className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-[#0d1117] font-extrabold disabled:opacity-50">{busy ? 'Entrando...' : 'Aceitar o desafio'}</button>}
          <button type="button" onClick={onDone} className="w-full py-2 text-sm text-[#8b949e] hover:text-white">Agora não</button>
        </div>
      </div>
    </div>
  );
};


