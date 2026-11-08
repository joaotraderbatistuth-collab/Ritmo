import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Plus, X, Trash2, Eye, Radio } from 'lucide-react';
import { LevelAvatar } from './LevelAvatar.js';
import { callApi } from '../lib/client-api.js';
import { STORIES_CHANGED, postStory } from '../lib/stories-client.js';
import { openProfile } from '../lib/share-feed.js';
import { timeAgo } from '../lib/feed-rules.js';
import type { ShareCard } from '../lib/share-card.js';

// Stories dentro do Ritmo: faixa de bolinhas no topo do Feed (e do Hoje) e o visualizador em tela cheia.
// Somem em 24 h. "Ao vivo" = a pessoa está treinando ou em foco agora.

export interface RailItem {
  userId: number;
  name: string;
  initials: string;
  avatarUrl: string | null;
  level: number;
  count: number;
  live: boolean;
  unseen: boolean;
  me: boolean;
}

interface StoryItem {
  id: number;
  kind: string;
  emoji: string;
  tag: string;
  title: string;
  subtitle: string;
  big: string | null;
  bigLabel: string | null;
  color: string;
  live: boolean;
  createdAt: string;
  seen: boolean;
  clappedByMe: boolean;
  claps: number;
  views: number | null;
}

const OPEN_STORY = 'ritmo:open-story';
/** Abre os stories de uma pessoa (do perfil, por exemplo). */
export function openStories(userId: number) {
  window.dispatchEvent(new CustomEvent<number>(OPEN_STORY, { detail: userId }));
}

/** O cartão do story, igual ao da imagem do Instagram, mas em HTML (leve e nítido). */
export const StoryCard: React.FC<{ s: Pick<StoryItem, 'emoji' | 'tag' | 'title' | 'subtitle' | 'big' | 'bigLabel' | 'color' | 'live'> }> = ({ s }) => (
  <div className="relative w-full h-full flex flex-col items-center justify-center text-center px-6 overflow-hidden" style={{ background: `radial-gradient(circle at 50% 38%, ${s.color}55 0%, #0d1117 62%)` }}>
    <div className="absolute inset-0 opacity-40 ritmo-rays pointer-events-none" style={{ background: `repeating-conic-gradient(from 0deg at 50% 38%, ${s.color}33 0deg 7deg, transparent 7deg 20deg)`, maskImage: 'radial-gradient(circle at 50% 38%, black 5%, transparent 60%)', WebkitMaskImage: 'radial-gradient(circle at 50% 38%, black 5%, transparent 60%)' }} aria-hidden="true" />
    <span className={`relative px-3 py-1 rounded-full text-[11px] font-black tracking-widest text-[#0d1117] ${s.live ? 'animate-pulse' : ''}`} style={{ background: s.live ? '#ef4444' : s.color, color: s.live ? '#fff' : '#0d1117' }}>
      {s.live ? '● AO VIVO' : s.tag || 'CONQUISTA'}
    </span>
    <div className="relative mt-6 w-44 h-44 rounded-full flex flex-col items-center justify-center ritmo-medal-pop" style={{ background: '#161b22', border: `6px solid ${s.color}`, boxShadow: `0 0 50px ${s.color}88` }}>
      {s.big ? (
        <>
          <span className="text-5xl font-black text-white tabular-nums leading-none">{s.big}</span>
          <span className="mt-1 text-sm font-extrabold" style={{ color: s.color }}>{s.bigLabel}</span>
          <span className="absolute -top-2 -right-2 text-4xl" aria-hidden="true">{s.emoji}</span>
        </>
      ) : (
        <span className="text-7xl" aria-hidden="true">{s.emoji}</span>
      )}
    </div>
    <h3 className="relative mt-6 text-2xl font-extrabold text-white leading-tight">{s.title}</h3>
    {s.subtitle && <p className="relative mt-2 text-sm text-[#c9d1d9]">{s.subtitle}</p>}
  </div>
);

/* ------------------------------------------------------------------ */
/* Faixa de stories                                                    */
/* ------------------------------------------------------------------ */

export const StoriesBar: React.FC<{ me: { initials: string; avatarUrl: string | null; level: number }; quick: ShareCard[] }> = ({ me, quick }) => {
  const [rail, setRail] = useState<RailItem[]>([]);
  const [viewer, setViewer] = useState<{ order: number[]; index: number } | null>(null);
  const [picker, setPicker] = useState(false);

  const load = useCallback(() => {
    fetch('/api/stories')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && Array.isArray(d.rail) && setRail(d.rail))
      .catch(() => null);
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 60_000); // o "ao vivo" aparece sem precisar recarregar
    const h = () => load();
    const open = (e: Event) => {
      const id = (e as CustomEvent<number>).detail;
      setViewer({ order: [id], index: 0 });
    };
    window.addEventListener(STORIES_CHANGED, h);
    window.addEventListener(OPEN_STORY, open);
    return () => {
      clearInterval(t);
      window.removeEventListener(STORIES_CHANGED, h);
      window.removeEventListener(OPEN_STORY, open);
    };
  }, [load]);

  const mine = rail.find((r) => r.me);
  const others = rail.filter((r) => !r.me);
  const openAt = (userId: number) => {
    const order = others.map((r) => r.userId);
    const i = order.indexOf(userId);
    setViewer(i >= 0 ? { order, index: i } : { order: [userId], index: 0 });
  };

  const ring = (r: { live: boolean; unseen: boolean }) =>
    r.live ? 'bg-gradient-to-tr from-red-500 via-orange-400 to-red-500 animate-pulse' : r.unseen ? 'bg-gradient-to-tr from-emerald-400 via-teal-300 to-amber-300' : 'bg-[#30363d]';

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none" role="list" aria-label="Stories">
        <div className="flex flex-col items-center gap-1 shrink-0 w-16" role="listitem">
          <button
            type="button"
            onClick={() => (mine ? setViewer({ order: [mine.userId], index: 0 }) : setPicker(true))}
            className={`relative p-[3px] rounded-full ${mine ? ring({ live: mine.live, unseen: true }) : 'bg-[#30363d]'}`}
            aria-label={mine ? 'Ver seu story' : 'Publicar story'}
          >
            <span className="block rounded-full bg-[#0d1117] p-[2px]"><LevelAvatar initials={me.initials} avatarUrl={me.avatarUrl} level={me.level} size="sm" /></span>
            <span
              onClick={(e) => {
                e.stopPropagation();
                setPicker(true);
              }}
              className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#0d1117] flex items-center justify-center"
              aria-hidden="true"
            >
              <Plus className="w-3 h-3 text-[#0d1117]" strokeWidth={3} />
            </span>
          </button>
          <span className="text-[10px] text-[#8b949e] truncate w-full text-center">Seu story</span>
        </div>
        {others.map((r) => (
          <div key={r.userId} className="flex flex-col items-center gap-1 shrink-0 w-16" role="listitem">
            <button type="button" onClick={() => openAt(r.userId)} className={`relative p-[3px] rounded-full ${ring(r)}`} aria-label={`Stories de ${r.name}${r.live ? ' (ao vivo)' : ''}`}>
              <span className="block rounded-full bg-[#0d1117] p-[2px]"><LevelAvatar initials={r.initials} avatarUrl={r.avatarUrl} level={r.level} size="sm" /></span>
              {r.live && <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 rounded bg-red-500 text-[8px] font-black text-white">AO VIVO</span>}
            </button>
            <span className={`text-[10px] truncate w-full text-center ${r.unseen || r.live ? 'text-[#e6edf3] font-semibold' : 'text-[#8b949e]'}`}>{r.name}</span>
          </div>
        ))}
        {others.length === 0 && (
          <div className="flex items-center text-xs text-[#6e7681] pl-1">Siga pessoas no Feed para ver os stories delas aqui.</div>
        )}
      </div>
      {viewer && (
        <StoryViewer
          order={viewer.order}
          start={viewer.index}
          onClose={() => {
            setViewer(null);
            load();
          }}
        />
      )}
      {picker && <StoryPicker quick={quick} onClose={() => setPicker(false)} />}
    </>
  );
};

/* ------------------------------------------------------------------ */
/* Escolher o que publicar                                              */
/* ------------------------------------------------------------------ */

const StoryPicker: React.FC<{ quick: ShareCard[]; onClose: () => void }> = ({ quick, onClose }) => {
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState('');
  const pub = async (c: ShareCard) => {
    setBusy(c.title);
    const r = await postStory(c);
    setBusy(null);
    if (r.ok) onClose();
    else setMsg(r.error || 'Não deu para publicar agora.');
  };
  return (
    <div className="fixed inset-0 z-[85] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Publicar story" onClick={onClose}>
      <div className="w-full sm:max-w-md max-h-[85vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-[#30363d] bg-[#161b22] p-5 pb-8 ritmo-sheet-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-[#f0f6fc]">Publicar no seu story</h2>
          <button type="button" onClick={onClose} aria-label="Fechar" className="p-1.5 text-[#8b949e] hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <p className="mt-1 text-xs text-[#8b949e]">Fica 24 horas no ar para quem usa o Ritmo. Escolha uma conquista:</p>
        <div className="mt-3 space-y-2">
          {quick.map((c) => (
            <button key={`${c.kind}-${c.title}`} type="button" disabled={Boolean(busy)} onClick={() => pub(c)} className="w-full flex items-center gap-3 rounded-2xl border border-[#30363d] bg-[#0d1117] p-3 text-left hover:border-emerald-500/50 disabled:opacity-50">
              <span className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0" style={{ background: `${c.color}22`, border: `1px solid ${c.color}66` }} aria-hidden="true">{c.emoji}</span>
              <span className="min-w-0">
                <span className="block text-[10px] font-black tracking-wider" style={{ color: c.color }}>{c.tag}</span>
                <span className="block text-sm font-bold text-[#f0f6fc] truncate">{c.title}</span>
              </span>
              <span className="ml-auto text-xs font-bold text-emerald-400">{busy === c.title ? '...' : 'Publicar'}</span>
            </button>
          ))}
          {!quick.length && <p className="text-sm text-[#8b949e]">Faça uma ação hoje (um hábito, um foco, um treino) e sua primeira conquista aparece aqui.</p>}
        </div>
        {msg && <p className="mt-3 text-xs text-amber-300">{msg}</p>}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Visualizador em tela cheia                                           */
/* ------------------------------------------------------------------ */

const DURATION = 6000;

const StoryViewer: React.FC<{ order: number[]; start: number; onClose: () => void }> = ({ order, start, onClose }) => {
  const [authorIdx, setAuthorIdx] = useState(start);
  const [data, setData] = useState<{ author: RailItem & { me: boolean }; stories: StoryItem[] } | null>(null);
  const [i, setI] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const last = useRef(Date.now());
  const userId = order[authorIdx];

  useEffect(() => {
    let alive = true;
    setData(null);
    setI(0);
    setElapsed(0);
    fetch(`/api/stories?user=${userId}`)
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        if (!d?.author || !d.stories?.length) return next();
        setData(d);
        const firstUnseen = d.stories.findIndex((s: StoryItem) => !s.seen);
        setI(firstUnseen > 0 ? firstUnseen : 0);
      })
      .catch(() => alive && onClose());
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const story = data?.stories[i];
  useEffect(() => {
    if (story && !story.seen && !data?.author.me) callApi('/api/stories', { action: 'view', storyId: story.id }).catch(() => null);
  }, [story?.id]);

  const next = () => {
    if (data && i < data.stories.length - 1) {
      setI(i + 1);
      setElapsed(0);
    } else if (authorIdx < order.length - 1) setAuthorIdx(authorIdx + 1);
    else onClose();
  };
  const prev = () => {
    if (i > 0) {
      setI(i - 1);
      setElapsed(0);
    } else if (authorIdx > 0) setAuthorIdx(authorIdx - 1);
    else setElapsed(0);
  };

  // relógio da barrinha
  const nextRef = useRef(next);
  nextRef.current = next;
  useEffect(() => {
    last.current = Date.now();
    const t = setInterval(() => {
      const now = Date.now();
      const dt = now - last.current;
      last.current = now;
      if (paused || !story) return;
      setElapsed((e) => {
        if (e + dt >= DURATION) {
          setTimeout(() => nextRef.current(), 0);
          return 0;
        }
        return e + dt;
      });
    }, 80);
    return () => clearInterval(t);
  }, [paused, story?.id]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') nextRef.current();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  });

  const clap = async () => {
    if (!story || !data) return;
    const r = await callApi<{ clapped?: boolean; claps?: number }>('/api/stories', { action: 'clap', storyId: story.id });
    if (r.ok) setData({ ...data, stories: data.stories.map((s) => (s.id === story.id ? { ...s, clappedByMe: Boolean(r.data.clapped), claps: r.data.claps ?? s.claps } : s)) });
    try { navigator.vibrate?.(20); } catch {}
  };
  const remove = async () => {
    if (!story || !data) return;
    await callApi('/api/stories', { action: 'delete', storyId: story.id });
    const rest = data.stories.filter((s) => s.id !== story.id);
    if (!rest.length) return onClose();
    setData({ ...data, stories: rest });
    setI(Math.min(i, rest.length - 1));
  };

  return (
    <div className="fixed inset-0 z-[90] bg-black flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Stories">
      <div className="relative w-full h-full sm:h-[92vh] sm:max-w-sm sm:rounded-3xl overflow-hidden bg-[#0d1117]">
        {story ? <StoryCard s={story} /> : <div className="w-full h-full flex items-center justify-center text-[#8b949e] text-sm">Carregando...</div>}

        {/* barrinhas */}
        <div className="absolute top-2 inset-x-2 flex gap-1">
          {(data?.stories || []).map((s, k) => (
            <span key={s.id} className="flex-1 h-1 rounded-full bg-white/25 overflow-hidden">
              <span className="block h-full bg-white" style={{ width: k < i ? '100%' : k === i ? `${(elapsed / DURATION) * 100}%` : '0%' }} />
            </span>
          ))}
        </div>

        {/* quem postou */}
        {data && (
          <div className="absolute top-5 inset-x-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                openProfile(data.author.userId);
              }}
              className="flex items-center gap-2 min-w-0"
            >
              <LevelAvatar initials={data.author.initials} avatarUrl={data.author.avatarUrl} level={data.author.level} size="sm" />
              <span className="text-sm font-bold text-white truncate">{data.author.name}</span>
            </button>
            {story && <span className="text-xs text-white/60 shrink-0">{story.live ? <span className="inline-flex items-center gap-1 text-red-400"><Radio className="w-3 h-3" /> agora</span> : timeAgo(story.createdAt)}</span>}
            <button type="button" onClick={onClose} aria-label="Fechar" className="ml-auto p-1.5 text-white/80 hover:text-white"><X className="w-6 h-6" /></button>
          </div>
        )}

        {/* toque à esquerda volta, à direita avança, segurar pausa */}
        <button type="button" aria-label="Anterior" className="absolute left-0 top-16 bottom-24 w-1/3" onClick={prev} onPointerDown={() => setPaused(true)} onPointerUp={() => setPaused(false)} onPointerLeave={() => setPaused(false)} />
        <button type="button" aria-label="Próximo" className="absolute right-0 top-16 bottom-24 w-2/3" onClick={next} onPointerDown={() => setPaused(true)} onPointerUp={() => setPaused(false)} onPointerLeave={() => setPaused(false)} />

        {/* rodapé */}
        {story && data && (
          <div className="absolute bottom-0 inset-x-0 p-4 pb-6 flex items-center justify-between gap-3 bg-gradient-to-t from-black/70 to-transparent">
            {data.author.me ? (
              <>
                <span className="inline-flex items-center gap-1.5 text-sm text-white/80"><Eye className="w-4 h-4" /> {story.views ?? 0} · 👏 {story.claps}</span>
                <button type="button" onClick={remove} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/10 text-sm text-white hover:bg-white/20"><Trash2 className="w-4 h-4" /> Apagar</button>
              </>
            ) : (
              <button
                type="button"
                onClick={clap}
                className={`mx-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-base font-extrabold transition-transform active:scale-90 ${story.clappedByMe ? 'bg-amber-400 text-[#0d1117]' : 'bg-white/15 text-white'}`}
              >
                👏 {story.clappedByMe ? 'Aplaudido' : 'Aplaudir'}{story.claps > 0 ? ` · ${story.claps}` : ''}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
