import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Flag, Heart, Link2, MessageCircle, Send, Sparkles, Timer, Trash2, Target, ListChecks, Crown, ImagePlus, X, KanbanSquare, CheckCircle2, Flame } from 'lucide-react';
import { callApi } from '../lib/client-api.js';
import { uploadFile } from '../lib/upload.js';
import { Achievement, FEED_LIMITS, REPORT_REASONS, achievementHeadline, timeAgo } from '../lib/feed-rules.js';

export interface FeedPostData {
  id: number;
  body: string;
  achievement: Achievement | null;
  imageUrl?: string | null;
  createdAt: string;
  author: { id: number; name: string; initials: string; isTeamOwner: boolean };
  likes: number;
  liked: boolean;
  comments: number;
  mine: boolean;
  canDelete: boolean;
}

const ICONS: Record<Achievement['type'], any> = { corrente: Link2, foco: Timer, tarefas: ListChecks, meta: Target, sessao: Flame, card: KanbanSquare, habito: CheckCircle2, tarefa: CheckCircle2 };

/* ------------------------------------------------------------------ */
/* Foto: escolher, enviar e mostrar                                    */
/* ------------------------------------------------------------------ */

/** Botão de foto: abre a galeria/câmera, comprime e envia. Devolve a URL pronta. */
export const PhotoPicker: React.FC<{ onUploaded: (url: string) => void; onError: (msg: string) => void; label?: string; compact?: boolean }> = ({ onUploaded, onError, label = 'Foto', compact }) => {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    const r = await uploadFile(file, 'feed');
    setBusy(false);
    if (r.ok) onUploaded(r.url);
    else onError(r.error);
  };
  return (
    <>
      <input ref={input} type="file" accept="image/*" className="hidden" onChange={pick} />
      <button type="button" onClick={() => input.current?.click()} disabled={busy} aria-label="Colocar foto" className={`inline-flex items-center gap-1.5 rounded-lg border border-[#30363d] text-[#c9d1d9] hover:bg-[#21262d] disabled:opacity-50 ${compact ? 'px-2.5 py-2' : 'px-3 py-1.5 text-xs'}`}>
        <ImagePlus className="w-4 h-4" />{!compact && (busy ? 'Enviando...' : label)}
      </button>
    </>
  );
};

/** Foto da publicação: toque para ver em tela cheia. */
export const PostImage: React.FC<{ src: string; small?: boolean }> = ({ src, small }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={`mt-3 block w-full overflow-hidden rounded-xl border border-[#30363d] bg-[#0d1117] ${small ? 'max-w-[220px]' : ''}`} aria-label="Ver foto em tela cheia">
        <img src={src} alt="" loading="lazy" className={`w-full object-cover ${small ? 'max-h-40' : 'max-h-[460px]'}`} />
      </button>
      {open && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-3" onClick={() => setOpen(false)} role="dialog" aria-label="Foto">
          <button type="button" className="absolute top-3 right-3 p-2 text-white" aria-label="Fechar"><X className="w-6 h-6" /></button>
          <img src={src} alt="" className="max-w-full max-h-full object-contain rounded-lg" />
        </div>
      )}
    </>
  );
};

export const AchievementCard: React.FC<{ a: Achievement }> = ({ a }) => {
  const Icon = ICONS[a.type];
  return (
    <div className="mt-3 flex items-center gap-3 rounded-xl border border-emerald-500/40 bg-gradient-to-r from-emerald-500/15 to-teal-500/5 p-4">
      <span className="w-11 h-11 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0"><Icon className="w-5 h-5" /></span>
      <div>
        <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1"><Sparkles className="w-3 h-3" /> Conquista</div>
        <div className="font-semibold text-[#f0f6fc]">{achievementHeadline(a)}</div>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Composer                                                            */
/* ------------------------------------------------------------------ */

const Composer: React.FC<{ teamId: number | null; achievements: Achievement[]; prefill?: Achievement | null; onPosted: () => void }> = ({ teamId, achievements: base, prefill, onPosted }) => {
  const [text, setText] = useState('');
  const [pick, setPick] = useState<number | ''>('');
  const [image, setImage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const box = useRef<HTMLDivElement>(null);
  // conquista enviada de outra aba (ex.: "Compartilhar no Feed" no Foco) entra no topo da lista
  const achievements = React.useMemo(() => {
    if (!prefill || base.some((a) => JSON.stringify(a) === JSON.stringify(prefill))) return base;
    return [prefill, ...base];
  }, [base, prefill]);
  const chosen = pick === '' ? null : achievements[pick] || null;

  useEffect(() => {
    if (prefill) {
      const i = achievements.findIndex((a) => JSON.stringify(a) === JSON.stringify(prefill));
      if (i >= 0) setPick(i);
      box.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [prefill, achievements]);

  const publish = async () => {
    setBusy(true);
    setMsg(null);
    const r = await callApi('/api/feed', { action: 'create_post', body: text, teamId, achievement: chosen || undefined, imageUrl: image || undefined });
    setBusy(false);
    if (r.ok) {
      setText('');
      setPick('');
      setImage(null);
      onPosted();
    } else setMsg({ ok: false, text: (r.data as any).error || 'Não foi possível publicar.' });
  };

  return (
    <div ref={box} className="rounded-2xl border border-[#30363d] bg-[#161b22] p-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={FEED_LIMITS.postMax}
        rows={3}
        placeholder={teamId ? 'Publique um conteúdo exclusivo, um aviso ou uma conquista para os assinantes...' : 'Compartilhe uma conquista ou escreva algo para a comunidade...'}
        className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3 py-2 text-sm text-[#f0f6fc] focus:outline-none focus:border-emerald-500 resize-y"
        aria-label="Nova publicação"
      />
      {image && (
        <div className="relative">
          <PostImage src={image} />
          <button type="button" onClick={() => setImage(null)} aria-label="Tirar a foto" className="absolute top-5 right-2 p-1.5 rounded-full bg-black/70 text-white"><X className="w-4 h-4" /></button>
        </div>
      )}
      {chosen && (
        <div className="relative">
          <AchievementCard a={chosen} />
          <button type="button" onClick={() => setPick('')} className="absolute top-2 right-2 text-xs text-[#8b949e] hover:text-white">remover</button>
        </div>
      )}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <PhotoPicker onUploaded={setImage} onError={(t) => setMsg({ ok: false, text: t })} />
          {achievements.length > 0 ? (
            <select value={pick} onChange={(e) => setPick(e.target.value === '' ? '' : Number(e.target.value))} className="bg-[#0d1117] border border-[#30363d] rounded-lg px-2.5 py-1.5 text-xs text-[#c9d1d9] max-w-[230px]" aria-label="Compartilhar uma conquista">
              <option value="">Compartilhar uma conquista...</option>
              {achievements.map((a, i) => <option key={i} value={i}>{achievementHeadline(a)}</option>)}
            </select>
          ) : (
            <span className="text-xs text-[#6e7681]">Suas conquistas aparecem aqui para você compartilhar.</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-[#6e7681]">{text.length}/{FEED_LIMITS.postMax}</span>
          <button type="button" onClick={publish} disabled={busy || (!text.trim() && !chosen && !image)} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm disabled:opacity-40">
            <Send className="w-4 h-4" /> Publicar
          </button>
        </div>
      </div>
      <p className="text-[11px] text-[#6e7681] mt-2">Nada é publicado automaticamente: você escolhe o que compartilhar. Outras pessoas veem seu primeiro nome e a inicial do sobrenome.</p>
      {msg && <p role="alert" className="text-xs text-rose-300 mt-2">{msg.text}</p>}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Publicação                                                          */
/* ------------------------------------------------------------------ */

const Avatar = ({ initials, owner }: { initials: string; owner?: boolean }) => (
  <span className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${owner ? 'bg-amber-400/20 text-amber-300' : 'bg-emerald-500/15 text-emerald-300'}`}>{initials}</span>
);

const PostCard: React.FC<{ post: FeedPostData; onChanged: () => void; onNotice: (t: string, ok: boolean) => void }> = ({ post, onChanged, onNotice }) => {
  const [liked, setLiked] = useState(post.liked);
  const [likes, setLikes] = useState(post.likes);
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<any[] | null>(null);
  const [count, setCount] = useState(post.comments);
  const [draft, setDraft] = useState('');
  const [draftImage, setDraftImage] = useState<string | null>(null);
  const [reporting, setReporting] = useState<{ type: 'post' | 'comment'; id: number } | null>(null);

  const loadComments = useCallback(async () => {
    const r = await callApi(`/api/feed?comments=${post.id}`);
    if (r.ok) setComments((r.data as any).comments);
  }, [post.id]);

  const like = async () => {
    const r = await callApi('/api/feed', { action: 'toggle_like', postId: post.id });
    if (r.ok) {
      setLiked((r.data as any).liked);
      setLikes((r.data as any).likes);
    } else onNotice((r.data as any).error || 'Não foi possível curtir.', false);
  };
  const toggleComments = () => {
    setOpen(!open);
    if (!open && comments === null) loadComments();
  };
  const send = async () => {
    const r = await callApi('/api/feed', { action: 'add_comment', postId: post.id, body: draft, imageUrl: draftImage || undefined });
    if (r.ok) {
      setDraft('');
      setDraftImage(null);
      setCount((n) => n + 1);
      loadComments();
    } else onNotice((r.data as any).error || 'Não foi possível comentar.', false);
  };
  const del = async () => {
    if (!confirm('Excluir esta publicação?')) return;
    const r = await callApi('/api/feed', { action: 'delete_post', postId: post.id });
    r.ok ? onChanged() : onNotice((r.data as any).error || 'Não foi possível excluir.', false);
  };
  const delComment = async (id: number) => {
    const r = await callApi('/api/feed', { action: 'delete_comment', commentId: id });
    if (r.ok) {
      setCount((n) => Math.max(0, n - 1));
      loadComments();
    }
  };
  const report = async (reason: string) => {
    if (!reporting) return;
    const r = await callApi('/api/feed', { action: 'report', targetType: reporting.type, targetId: reporting.id, reason });
    setReporting(null);
    onNotice((r.data as any).message || (r.data as any).error || 'Pronto.', r.ok);
    if (r.ok && (r.data as any).hidden) onChanged();
  };

  return (
    <article className="rounded-2xl border border-[#30363d] bg-[#161b22] p-4">
      <header className="flex items-center gap-3">
        <Avatar initials={post.author.initials} owner={post.author.isTeamOwner} />
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-[#f0f6fc] flex items-center gap-1.5">{post.author.name}{post.author.isTeamOwner && <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-400/10 px-1.5 py-0.5 rounded-full"><Crown className="w-3 h-3" /> Criador</span>}</div>
          <div className="text-xs text-[#8b949e]">{timeAgo(post.createdAt)}</div>
        </div>
        {post.canDelete && <button type="button" onClick={del} aria-label="Excluir publicação" className="p-1.5 text-[#8b949e] hover:text-rose-400"><Trash2 className="w-4 h-4" /></button>}
        {!post.mine && <button type="button" onClick={() => setReporting({ type: 'post', id: post.id })} aria-label="Denunciar publicação" className="p-1.5 text-[#6e7681] hover:text-amber-300"><Flag className="w-4 h-4" /></button>}
      </header>

      {post.body && <p className="mt-3 text-sm text-[#e6edf3] whitespace-pre-wrap break-words">{post.body}</p>}
      {post.imageUrl && <PostImage src={post.imageUrl} />}
      {post.achievement && <AchievementCard a={post.achievement} />}

      <footer className="mt-3 flex items-center gap-5 text-sm text-[#8b949e]">
        <button type="button" onClick={like} aria-pressed={liked} className={`inline-flex items-center gap-1.5 ${liked ? 'text-rose-400' : 'hover:text-white'}`}><Heart className={`w-4 h-4 ${liked ? 'fill-rose-400' : ''}`} /> {likes}</button>
        <button type="button" onClick={toggleComments} className="inline-flex items-center gap-1.5 hover:text-white"><MessageCircle className="w-4 h-4" /> {count}</button>
      </footer>

      {open && (
        <div className="mt-3 border-t border-[#30363d] pt-3 space-y-3">
          {comments === null && <p className="text-xs text-[#6e7681]">Carregando...</p>}
          {comments?.map((c) => (
            <div key={c.id} className="flex gap-2.5">
              <Avatar initials={c.author.initials} owner={c.author.isTeamOwner} />
              <div className="flex-1 min-w-0 rounded-xl bg-[#0d1117] px-3 py-2">
                <div className="flex items-center gap-2 text-xs"><strong className="text-[#f0f6fc]">{c.author.name}</strong><span className="text-[#6e7681]">{timeAgo(c.createdAt)}</span>
                  <span className="ml-auto flex items-center gap-1">
                    {c.canDelete && <button type="button" onClick={() => delComment(c.id)} aria-label="Excluir comentário" className="text-[#6e7681] hover:text-rose-400"><Trash2 className="w-3.5 h-3.5" /></button>}
                    {!c.mine && <button type="button" onClick={() => setReporting({ type: 'comment', id: c.id })} aria-label="Denunciar comentário" className="text-[#6e7681] hover:text-amber-300"><Flag className="w-3.5 h-3.5" /></button>}
                  </span>
                </div>
                {c.body && <p className="text-sm text-[#c9d1d9] whitespace-pre-wrap break-words">{c.body}</p>}
                {c.imageUrl && <PostImage src={c.imageUrl} small />}
              </div>
            </div>
          ))}
          {draftImage && (
            <div className="relative inline-block">
              <PostImage src={draftImage} small />
              <button type="button" onClick={() => setDraftImage(null)} aria-label="Tirar a foto" className="absolute top-5 right-2 p-1 rounded-full bg-black/70 text-white"><X className="w-3.5 h-3.5" /></button>
            </div>
          )}
          <div className="flex gap-2">
            <PhotoPicker compact onUploaded={setDraftImage} onError={(t) => onNotice(t, false)} />
            <input value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={FEED_LIMITS.commentMax} onKeyDown={(e) => e.key === 'Enter' && (draft.trim() || draftImage) && send()} placeholder="Escreva um comentário..." className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-[#f0f6fc] focus:outline-none focus:border-emerald-500" aria-label="Comentário" />
            <button type="button" onClick={send} disabled={!draft.trim() && !draftImage} className="px-3 py-2 rounded-lg bg-emerald-500 text-slate-950 font-bold text-sm disabled:opacity-40">Enviar</button>
          </div>
        </div>
      )}

      {reporting && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setReporting(null)}>
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Denunciar">
            <h3 className="font-bold text-[#f0f6fc]">Por que você está denunciando?</h3>
            <p className="text-xs text-[#8b949e] mt-1">A moderação analisa. Se várias pessoas denunciarem, o conteúdo é escondido até a análise.</p>
            <div className="mt-3 space-y-2">
              {REPORT_REASONS.map((r) => <button key={r} type="button" onClick={() => report(r)} className="w-full text-left px-3 py-2 rounded-lg border border-[#30363d] text-sm text-[#c9d1d9] hover:bg-[#21262d]">{r}</button>)}
            </div>
            <button type="button" onClick={() => setReporting(null)} className="mt-3 text-xs text-[#8b949e] underline">Cancelar</button>
          </div>
        </div>
      )}
    </article>
  );
};

/* ------------------------------------------------------------------ */
/* Lista do feed (geral ou de uma equipe)                              */
/* ------------------------------------------------------------------ */

export const FeedView: React.FC<{ teamId: number | null; canPost: boolean; achievements: Achievement[]; prefill?: Achievement | null; onPrefillUsed?: () => void; emptyText: string }> = ({ teamId, canPost, achievements, prefill, onPrefillUsed, emptyText }) => {
  const [posts, setPosts] = useState<FeedPostData[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState<{ text: string; ok: boolean } | null>(null);

  const load = useCallback(async (before?: number) => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (teamId) qs.set('teamId', String(teamId));
    if (before) qs.set('before', String(before));
    const r = await callApi(`/api/feed?${qs.toString()}`);
    setLoading(false);
    if (!r.ok) {
      setError((r.data as any).error || 'Não foi possível carregar o feed.');
      return;
    }
    setError('');
    const d = r.data as any;
    setPosts((prev) => (before ? [...prev, ...d.posts] : d.posts));
    setHasMore(d.hasMore);
  }, [teamId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      {canPost && <Composer teamId={teamId} achievements={achievements} prefill={prefill} onPosted={() => { onPrefillUsed?.(); load(); }} />}
      {notice && <div role="status" className={`text-sm rounded-lg p-3 border ${notice.ok ? 'text-emerald-300 bg-emerald-950/40 border-emerald-800/60' : 'text-rose-300 bg-rose-950/40 border-rose-800/60'}`}>{notice.text}</div>}
      {error && <div role="alert" className="text-sm text-rose-300 bg-rose-950/40 border border-rose-800/60 rounded-lg p-3">{error}</div>}
      {!loading && !error && posts.length === 0 && <div className="rounded-2xl border border-dashed border-[#30363d] p-8 text-center text-sm text-[#8b949e]">{emptyText}</div>}
      {posts.map((p) => <PostCard key={p.id} post={p} onChanged={() => load()} onNotice={(text, ok) => setNotice({ text, ok })} />)}
      {loading && <p className="text-center text-xs text-[#6e7681]">Carregando...</p>}
      {hasMore && !loading && <div className="text-center"><button type="button" onClick={() => load(posts[posts.length - 1]?.id)} className="px-4 py-2 rounded-lg border border-[#30363d] text-sm text-[#c9d1d9] hover:bg-[#21262d]">Carregar mais</button></div>}
    </div>
  );
};
