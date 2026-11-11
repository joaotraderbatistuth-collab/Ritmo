import React, { useEffect, useState } from 'react';
import { Bell, Heart, MessageCircle, UserPlus, UserCheck, X, Sparkles } from 'lucide-react';
import { LevelAvatar } from './LevelAvatar.js';
import { callApi } from '../lib/client-api.js';
import { openProfile } from '../lib/share-feed.js';
import { timeAgo } from '../lib/feed-rules.js';
import { activityText, badgeLabel } from '../lib/social.js';
import type { SocialKind } from '../lib/social.js';
import { setSocialUnread, useSocialUnread } from '../lib/social-client.js';

interface Person {
  id: number;
  name: string;
  initials: string;
  avatarUrl: string | null;
  level: number;
  levelName: string;
}

interface ActivityItem {
  kind: SocialKind;
  at: string;
  text?: string | null;
  fresh: boolean;
  actor: Person;
  followedByMe: boolean;
}

const KIND_ICON: Record<SocialKind, React.ReactNode> = {
  like: <Heart className="w-3 h-3 fill-rose-400 text-rose-400" />,
  comment: <MessageCircle className="w-3 h-3 text-sky-300" />,
  follow: <UserPlus className="w-3 h-3 text-emerald-300" />,
  clap: <span className="text-[10px] leading-none">👏</span>,
};

/** Botão Seguir / Seguindo usado na Atividade e nas sugestões. */
const FollowButton: React.FC<{ userId: number; initial: boolean; back?: boolean; onChange?: (following: boolean) => void }> = ({ userId, initial, back, onChange }) => {
  const [following, setFollowing] = useState(initial);
  const [busy, setBusy] = useState(false);
  const toggle = async () => {
    setBusy(true);
    const r = await callApi<{ following?: boolean }>('/api/feed', { action: 'toggle_follow', userId });
    setBusy(false);
    if (r.ok) {
      setFollowing(Boolean(r.data.following));
      onChange?.(Boolean(r.data.following));
    }
  };
  return (
    <button type="button" onClick={toggle} disabled={busy} className={`shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold disabled:opacity-60 ${following ? 'border border-[#30363d] text-[#8b949e]' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}>
      {following ? <><UserCheck className="w-3.5 h-3.5" /> Seguindo</> : <><UserPlus className="w-3.5 h-3.5" /> {back ? 'Seguir de volta' : 'Seguir'}</>}
    </button>
  );
};

/** Sino da parte social: mostra quantas novidades há e abre a lista de quem interagiu com você. */
export const ActivityButton: React.FC = () => {
  const unread = useSocialUnread();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ActivityItem[] | null>(null);
  const [error, setError] = useState('');

  const show = async () => {
    setOpen(true);
    setItems(null);
    setError('');
    const r = await callApi<{ items?: ActivityItem[]; error?: string }>('/api/feed?activity=1');
    if (r.ok) {
      setItems(r.data.items || []);
      setSocialUnread(0);
    } else setError(r.data.error || 'Não foi possível carregar a atividade.');
  };

  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [open]);

  return (
    <>
      <button type="button" onClick={show} aria-label={unread ? `Atividade: ${unread} ${unread === 1 ? 'novidade' : 'novidades'}` : 'Atividade'} className={`relative inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold ${unread ? 'border-rose-400/60 bg-rose-500/10 text-rose-200' : 'border-[#30363d] bg-[#161b22] text-[#c9d1d9] hover:text-white'}`}>
        <Bell className={`w-4 h-4 ${unread ? 'animate-pulse' : ''}`} /> Atividade
        {unread > 0 && <span className="min-w-5 h-5 px-1.5 rounded-full bg-rose-500 text-white text-[11px] font-extrabold inline-flex items-center justify-center">{badgeLabel(unread)}</span>}
      </button>
      {open && (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4" onClick={() => setOpen(false)}>
          <div role="dialog" aria-modal="true" aria-label="Atividade" onClick={(e) => e.stopPropagation()} className="w-full sm:max-w-md max-h-[85vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-[#30363d] bg-[#0d1117] p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-extrabold text-[#f0f6fc]">Atividade</h3>
              <button type="button" onClick={() => setOpen(false)} aria-label="Fechar" className="p-2 rounded-full text-[#8b949e] hover:text-white hover:bg-[#21262d]"><X className="w-5 h-5" /></button>
            </div>
            {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
            {!items && !error && <p className="text-sm text-[#8b949e]">Carregando...</p>}
            {items?.length === 0 && (
              <div className="rounded-2xl border border-dashed border-[#30363d] p-6 text-center text-sm text-[#8b949e]">
                Quando alguém curtir, comentar, aplaudir seu story ou começar a seguir você, aparece aqui. Publique uma conquista para começar a conversa.
              </div>
            )}
            <ul className="space-y-1">
              {items?.map((it, i) => (
                <li key={`${it.kind}-${it.actor.id}-${it.at}-${i}`} className={`flex items-center gap-3 rounded-xl p-2.5 ${it.fresh ? 'bg-emerald-500/10' : ''}`}>
                  <button type="button" onClick={() => { setOpen(false); openProfile(it.actor.id); }} aria-label={`Ver perfil de ${it.actor.name}`} className="relative shrink-0 rounded-full">
                    <LevelAvatar initials={it.actor.initials} avatarUrl={it.actor.avatarUrl} level={it.actor.level} size="md" />
                    <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-[#0d1117] border border-[#30363d] flex items-center justify-center">{KIND_ICON[it.kind]}</span>
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#c9d1d9] break-words"><strong className="text-[#f0f6fc]">{it.actor.name}</strong> {activityText(it.kind, it.text)}</p>
                    <p className="text-[11px] text-[#6e7681]">{timeAgo(it.at)}{it.fresh ? ' · novo' : ''}</p>
                  </div>
                  {it.kind === 'follow' && !it.followedByMe && <FollowButton userId={it.actor.id} initial={false} back />}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
};

interface Suggestion extends Person {
  bio: string;
  followsMe: boolean;
  weekXp: number;
}

/** "Quem seguir": gente ativa que você ainda não segue. Some quando não há ninguém para sugerir. */
export const FollowSuggestions: React.FC<{ onFollowed?: () => void }> = ({ onFollowed }) => {
  const [people, setPeople] = useState<Suggestion[]>([]);
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    let alive = true;
    try { if (sessionStorage.getItem('ritmo_suggest_hidden') === '1') setHidden(true); } catch {}
    callApi<{ people?: Suggestion[] }>('/api/feed?suggest=1').then((r) => alive && r.ok && setPeople(r.data.people || []));
    return () => { alive = false; };
  }, []);
  if (hidden || people.length === 0) return null;
  const hide = () => {
    setHidden(true);
    try { sessionStorage.setItem('ritmo_suggest_hidden', '1'); } catch {}
  };
  return (
    <section className="rounded-2xl border border-[#30363d] bg-[#161b22] p-4" aria-label="Quem seguir">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="text-sm font-bold text-[#f0f6fc] inline-flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-emerald-400" /> Quem seguir</h3>
        <button type="button" onClick={hide} aria-label="Esconder sugestões" className="p-1 text-[#6e7681] hover:text-white"><X className="w-4 h-4" /></button>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
        {people.map((p) => (
          <div key={p.id} className="shrink-0 w-36 rounded-xl border border-[#21262d] bg-[#0d1117] p-3 flex flex-col items-center text-center gap-1.5">
            <button type="button" onClick={() => openProfile(p.id)} aria-label={`Ver perfil de ${p.name}`} className="rounded-full"><LevelAvatar initials={p.initials} avatarUrl={p.avatarUrl} level={p.level} size="lg" /></button>
            <p className="text-sm font-bold text-[#f0f6fc] truncate w-full">{p.name}</p>
            <p className="text-[11px] text-[#8b949e] truncate w-full">{p.followsMe ? 'Segue você' : p.weekXp > 0 ? `+${p.weekXp} pts na semana` : `Nv ${p.level} · ${p.levelName}`}</p>
            <FollowButton userId={p.id} initial={false} back={p.followsMe} onChange={(f) => f && onFollowed?.()} />
          </div>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-[#6e7681]">Seguindo alguém, você vê as conquistas e os stories dela e entra no ranking de amigos da semana.</p>
    </section>
  );
};
