import React, { useCallback, useEffect, useRef, useState } from 'react';
import { RARITY, type Rarity } from '../lib/medals.js';
import { openStories } from './Stories.js';
import { openShare } from '../lib/share-feed.js';
import { cardFromMedal } from '../lib/share-card.js';
import { Flag, Heart, Link2, MessageCircle, Send, Sparkles, Timer, Trash2, Target, ListChecks, Crown, ImagePlus, X, KanbanSquare, CheckCircle2, Flame, Trophy, Activity, UserPlus, UserCheck, Award } from 'lucide-react';
import { RouteSvg } from './RouteSvg.js';
import { SPORTS, formatDuration, formatKm, formatPace, paceSPerKm, speedKmh } from '../lib/workout.js';
import { LevelAvatar } from './LevelAvatar.js';
import { frameForLevel, levelInfo } from '../lib/levels.js';
import { openProfile } from '../lib/share-feed.js';
import { callApi } from '../lib/client-api.js';
import { uploadFile } from '../lib/upload.js';
import { Achievement, FEED_LIMITS, REPORT_REASONS, achievementHeadline, timeAgo } from '../lib/feed-rules.js';

export interface FeedAuthor {
  id: number;
  name: string;
  initials: string;
  isTeamOwner: boolean;
  avatarUrl?: string | null;
  level?: number;
  levelName?: string;
}

export interface FeedPostData {
  id: number;
  body: string;
  achievement: Achievement | null;
  imageUrl?: string | null;
  createdAt: string;
  author: FeedAuthor;
  likes: number;
  liked: boolean;
  comments: number;
  mine: boolean;
  canDelete: boolean;
}

const ICONS: Record<Achievement['type'], any> = { corrente: Link2, foco: Timer, tarefas: ListChecks, meta: Target, sessao: Flame, card: KanbanSquare, habito: CheckCircle2, tarefa: CheckCircle2, nivel: Trophy, treino: Activity, ofensiva: Flame, semana: Trophy, divisao: Trophy, medalha: Award };

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

/** Treino no Feed: rota desenhada + distância, tempo e ritmo. */
const WorkoutAchievement: React.FC<{ a: Extract<Achievement, { type: 'treino' }> }> = ({ a }) => {
  const sp = SPORTS[a.sport];
  const rate = sp.usesPace ? { label: 'Ritmo', value: formatPace(paceSPerKm(a.distanceM, a.durationS)), unit: '/km' } : { label: 'Velocidade', value: speedKmh(a.distanceM, a.durationS).toFixed(1).replace('.', ','), unit: 'km/h' };
  const cells: [string, string, string?][] = [['Distância', formatKm(a.distanceM), 'km'], ['Tempo', formatDuration(a.durationS)], [rate.label, rate.value, rate.unit]];
  if (a.elevationGainM) cells.push(['Subida', String(a.elevationGainM), 'm']);
  return (
    <div className="mt-3 rounded-xl border border-emerald-500/40 bg-[#0d1117] overflow-hidden">
      <div className="px-4 pt-3 text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1"><Activity className="w-3.5 h-3.5" /> {sp.label}</div>
      <div className={`px-4 py-3 grid gap-2 ${cells.length === 4 ? 'grid-cols-4' : 'grid-cols-3'}`}>
        {cells.map(([label, value, unit]) => (
          <div key={label}>
            <div className="text-[11px] text-[#8b949e]">{label}</div>
            <div className="text-lg font-extrabold text-[#f0f6fc] tabular-nums leading-tight">{value}{unit && <span className="text-xs font-semibold text-[#8b949e] ml-0.5">{unit}</span>}</div>
          </div>
        ))}
      </div>
      {a.route && <RouteSvg route={a.route} className="w-full h-48 border-t border-[#21262d]" />}
    </div>
  );
};

export const AchievementCard: React.FC<{ a: Achievement }> = ({ a }) => {
  if (a.type === 'treino') return <WorkoutAchievement a={a} />;
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
    if (r.ok) window.dispatchEvent(new Event('ritmo:xp-refresh'));
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

const Avatar = ({ author, small }: { author: FeedAuthor; small?: boolean }) => (
  <button type="button" onClick={() => openProfile(author.id)} aria-label={`Ver perfil de ${author.name}`} className="shrink-0 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
    <LevelAvatar initials={author.initials} avatarUrl={author.avatarUrl} level={author.level} size={small ? 'sm' : 'md'} />
  </button>
);

/** Nome do autor que abre o perfil. */
const AuthorName = ({ author, className }: { author: FeedAuthor; className: string }) => (
  <button type="button" onClick={() => openProfile(author.id)} className={`${className} hover:underline text-left`}>{author.name}</button>
);

/** Título do nível ao lado do nome (a partir do nível 2), na cor da moldura. */
const LevelTag = ({ author }: { author: FeedAuthor }) => {
  const lv = author.level || 1;
  if (lv < 2) return null;
  const frame = frameForLevel(lv);
  return (
    <span className="inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap" style={{ color: frame.badge === '#484f58' ? '#8b949e' : frame.badge, background: 'rgba(255,255,255,0.05)' }}>
      Nv {lv} · {author.levelName}
    </span>
  );
};

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
    if (r.ok) window.dispatchEvent(new Event('ritmo:xp-refresh'));
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
        <Avatar author={post.author} />
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-[#f0f6fc] flex items-center gap-1.5 flex-wrap"><AuthorName author={post.author} className="font-semibold text-[#f0f6fc]" /><LevelTag author={post.author} />{post.author.isTeamOwner && <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-400/10 px-1.5 py-0.5 rounded-full"><Crown className="w-3 h-3" /> Criador</span>}</div>
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
              <Avatar author={c.author} small />
              <div className="flex-1 min-w-0 rounded-xl bg-[#0d1117] px-3 py-2">
                <div className="flex items-center gap-2 text-xs"><AuthorName author={c.author} className="font-bold text-[#f0f6fc]" /><LevelTag author={c.author} /><span className="text-[#6e7681]">{timeAgo(c.createdAt)}</span>
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
        <div className="fixed inset-0 z-[65] bg-black/70 flex items-center justify-center p-4" onClick={() => setReporting(null)}>
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
  // Feed geral: "Todos" ou só quem eu sigo (lembra a escolha no aparelho)
  const [onlyFollowing, setOnlyFollowing] = useState(false);
  useEffect(() => {
    try { setOnlyFollowing(!teamId && localStorage.getItem('ritmo_feed_following') === '1'); } catch {}
  }, [teamId]);
  const chooseFollowing = (v: boolean) => {
    setOnlyFollowing(v);
    try { localStorage.setItem('ritmo_feed_following', v ? '1' : '0'); } catch {}
  };

  const load = useCallback(async (before?: number) => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (teamId) qs.set('teamId', String(teamId));
    else if (onlyFollowing) qs.set('following', '1');
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
  }, [teamId, onlyFollowing]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      {canPost && <Composer teamId={teamId} achievements={achievements} prefill={prefill} onPosted={() => { onPrefillUsed?.(); load(); }} />}
      {notice && <div role="status" className={`text-sm rounded-lg p-3 border ${notice.ok ? 'text-emerald-300 bg-emerald-950/40 border-emerald-800/60' : 'text-rose-300 bg-rose-950/40 border-rose-800/60'}`}>{notice.text}</div>}
      {error && <div role="alert" className="text-sm text-rose-300 bg-rose-950/40 border border-rose-800/60 rounded-lg p-3">{error}</div>}
      {!teamId && (
        <div className="flex gap-1 p-1 rounded-xl bg-[#161b22] border border-[#30363d] w-fit" role="tablist" aria-label="Filtrar o Feed">
          {[{ v: false, label: 'Todos' }, { v: true, label: 'Seguindo' }].map((o) => (
            <button key={o.label} type="button" role="tab" aria-selected={onlyFollowing === o.v} onClick={() => chooseFollowing(o.v)} className={`px-4 py-1.5 rounded-lg text-sm font-semibold ${onlyFollowing === o.v ? 'bg-emerald-600 text-white' : 'text-[#8b949e] hover:text-white'}`}>{o.label}</button>
          ))}
        </div>
      )}
      {!loading && !error && posts.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[#30363d] p-8 text-center text-sm text-[#8b949e]">
          {onlyFollowing && !teamId ? 'Você ainda não segue ninguém (ou quem você segue não publicou). Toque na foto de alguém no Feed e depois em Seguir.' : emptyText}
        </div>
      )}
      {posts.map((p) => <PostCard key={p.id} post={p} onChanged={() => load()} onNotice={(text, ok) => setNotice({ text, ok })} />)}
      {loading && <p className="text-center text-xs text-[#6e7681]">Carregando...</p>}
      {hasMore && !loading && <div className="text-center"><button type="button" onClick={() => load(posts[posts.length - 1]?.id)} className="px-4 py-2 rounded-lg border border-[#30363d] text-sm text-[#c9d1d9] hover:bg-[#21262d]">Carregar mais</button></div>}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Perfil de um membro (abre ao tocar na foto ou no nome)              */
/* ------------------------------------------------------------------ */

interface PublicProfile {
  id: number;
  name: string;
  initials: string;
  avatarUrl: string | null;
  level: number;
  levelName: string;
  xp: number;
  bio: string;
  memberSince: string | null;
  posts: number;
  likesReceived: number;
  followers?: number;
  following?: number;
  followedByMe?: boolean;
  isMe: boolean;
  medals?: { id: string; emoji: string; name: string; desc: string; rarity: Rarity; group: string }[];
  game?: {
    activeDays: number;
    streak: { days: number; best: number };
    week: { xp: number; activeDays: number };
    medalsEarned: number;
    medalsTotal: number;
    challengesDone: number;
    division: { name: string; emoji: string; color: string; best: string; bestEmoji: string } | null;
    pass: { step: number };
    seals: { month: string; steps: number; label: string }[];
    mascot: { emoji: string; name: string; stage: number; stages: number; mood: string } | null;
  } | null;
  ritus?: { owned: { code: string; name: string; free: boolean; members: number }[]; member: { code: string; name: string; free: boolean }[] };
  story?: { any: boolean; live: boolean };
}

const monthYear = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
};

export const ProfileModal: React.FC<{ userId: number | null; onClose: () => void; onEditMine?: () => void }> = ({ userId, onClose, onEditMine }) => {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [posts, setPosts] = useState<FeedPostData[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState<{ text: string; ok: boolean } | null>(null);

  const load = useCallback(async (before?: number) => {
    if (!userId) return;
    setLoading(true);
    const r = await callApi(`/api/profile?id=${userId}${before ? `&before=${before}` : ''}`);
    setLoading(false);
    if (!r.ok) {
      setError((r.data as any).error || 'Não foi possível abrir o perfil.');
      return;
    }
    const d = r.data as any;
    if (d.profile) setProfile(d.profile);
    setPosts((prev) => (before ? [...prev, ...d.posts] : d.posts));
    setHasMore(Boolean(d.hasMore));
  }, [userId]);

  useEffect(() => {
    setProfile(null);
    setPosts([]);
    setError('');
    setNotice(null);
    if (userId) load();
  }, [userId, load]);

  useEffect(() => {
    if (!userId) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [userId, onClose]);

  const [followBusy, setFollowBusy] = useState(false);
  const toggleFollow = async () => {
    if (!profile) return;
    setFollowBusy(true);
    const r = await callApi<{ following?: boolean; followers?: number; error?: string }>('/api/feed', { action: 'toggle_follow', userId: profile.id });
    setFollowBusy(false);
    if (r.ok) setProfile({ ...profile, followedByMe: Boolean(r.data.following), followers: r.data.followers ?? profile.followers });
    else setNotice({ text: r.data.error || 'Não foi possível seguir agora.', ok: false });
  };

  if (!userId) return null;
  const info = profile ? levelInfo(profile.xp) : null;
  const frame = profile ? frameForLevel(profile.level) : null;

  return (
    <div className="fixed inset-0 z-[55] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={profile ? `Perfil de ${profile.name}` : 'Perfil'}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-xl max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-[#30363d] bg-[#0d1117]"
      >
        <div className="sticky top-0 z-10 flex justify-end p-2 bg-gradient-to-b from-[#0d1117] to-transparent">
          <button type="button" onClick={onClose} aria-label="Fechar perfil" className="p-2 rounded-full text-[#8b949e] hover:text-white hover:bg-[#21262d]"><X className="w-5 h-5" /></button>
        </div>

        {error && <div role="alert" className="mx-5 mb-5 text-sm text-rose-300 bg-rose-950/40 border border-rose-800/60 rounded-lg p-3">{error}</div>}
        {!profile && !error && <p className="text-center text-sm text-[#8b949e] pb-10">Carregando perfil...</p>}

        {profile && info && frame && (
          <>
            <ProfileHeader profile={profile} info={info} frame={frame} followBusy={followBusy} onFollow={toggleFollow} onClose={onClose} onEditMine={onEditMine} />

            <section className="px-3 sm:px-5 pb-6 space-y-3 border-t border-[#21262d] pt-4">
              <h3 className="px-1 text-sm font-semibold text-[#f0f6fc]">Publicações no Feed</h3>
              {notice && <div role="status" className={`text-sm rounded-lg p-3 border ${notice.ok ? 'text-emerald-300 bg-emerald-950/40 border-emerald-800/60' : 'text-rose-300 bg-rose-950/40 border-rose-800/60'}`}>{notice.text}</div>}
              {!loading && posts.length === 0 && <p className="text-center text-sm text-[#6e7681] py-6">{profile.isMe ? 'Você ainda não publicou no Feed.' : 'Ainda não publicou no Feed.'}</p>}
              {posts.map((p) => <PostCard key={p.id} post={p} onChanged={() => load()} onNotice={(text, ok) => setNotice({ text, ok })} />)}
              {loading && profile && <p className="text-center text-xs text-[#6e7681]">Carregando...</p>}
              {hasMore && !loading && <div className="text-center"><button type="button" onClick={() => load(posts[posts.length - 1]?.id)} className="px-4 py-2 rounded-lg border border-[#30363d] text-sm text-[#c9d1d9] hover:bg-[#21262d]">Carregar mais</button></div>}
            </section>
          </>
        )}
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Cabeçalho do perfil: quem é, como está no jogo, conquistas e Ritus   */
/* ------------------------------------------------------------------ */

const Stat: React.FC<{ label: string; value: React.ReactNode; hint?: string }> = ({ label, value, hint }) => (
  <div className="rounded-2xl bg-[#161b22] border border-[#21262d] px-2 py-2.5 text-center" title={hint}>
    <dd className="text-lg font-extrabold text-[#f0f6fc] tabular-nums leading-tight">{value}</dd>
    <dt className="text-[10px] text-[#8b949e] leading-tight mt-0.5">{label}</dt>
  </div>
);

const ProfileHeader: React.FC<{
  profile: PublicProfile;
  info: ReturnType<typeof levelInfo>;
  frame: ReturnType<typeof frameForLevel>;
  followBusy: boolean;
  onFollow: () => void;
  onClose: () => void;
  onEditMine?: () => void;
}> = ({ profile, info, frame, followBusy, onFollow, onClose, onEditMine }) => {
  const [allMedals, setAllMedals] = useState(false);
  const g = profile.game;
  const color = frame.badge === '#484f58' ? '#34d399' : frame.badge;
  const order: Record<Rarity, number> = { lendaria: 0, epica: 1, rara: 2, comum: 3 };
  const medals = [...(profile.medals || [])].sort((a, b) => order[a.rarity] - order[b.rarity]);
  const rarest = medals[0];
  const shownMedals = allMedals ? medals : medals.slice(0, 8);
  const ritus = profile.ritus || { owned: [], member: [] };
  const goRitus = (code: string) => {
    window.location.href = `/app?ritus=${encodeURIComponent(code)}`;
  };

  return (
    <section className="-mt-14 pb-5">
      {/* capa com a cor da moldura do nível */}
      <div className="h-24 sm:h-28 rounded-t-3xl" style={{ background: `linear-gradient(135deg, ${color}55, #0d1117 70%), radial-gradient(circle at 80% 20%, ${color}44, transparent 50%)` }} aria-hidden="true" />
      <div className="px-5 -mt-12 flex flex-col items-center text-center">
        <button
          type="button"
          onClick={() => profile.story?.any && (onClose(), openStories(profile.id))}
          className={`rounded-full p-[3px] ${profile.story?.live ? 'bg-gradient-to-tr from-red-500 via-orange-400 to-red-500 animate-pulse' : profile.story?.any ? 'bg-gradient-to-tr from-emerald-400 via-teal-300 to-amber-300' : 'bg-transparent'}`}
          aria-label={profile.story?.any ? `Ver stories de ${profile.name}` : profile.name}
          disabled={!profile.story?.any}
        >
          <span className="block rounded-full bg-[#0d1117] p-[3px]"><LevelAvatar initials={profile.initials} avatarUrl={profile.avatarUrl} level={profile.level} size="xl" /></span>
        </button>
        {profile.story?.live && <span className="-mt-3 relative px-2 py-0.5 rounded bg-red-500 text-[10px] font-black text-white">AO VIVO</span>}
        <h2 className="mt-2 text-xl font-extrabold text-[#f0f6fc]">{profile.name}</h2>
        <div className="mt-1 flex flex-wrap items-center justify-center gap-1.5">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold" style={{ background: `${color}22`, color, border: `1px solid ${color}55` }}>Nível {profile.level} · {profile.levelName}</span>
          {g?.division && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold" style={{ background: `${g.division.color}22`, color: g.division.color, border: `1px solid ${g.division.color}55` }}>
              {g.division.emoji} {g.division.name}
            </span>
          )}
          {g && g.streak.days > 0 && <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-500/15 text-orange-300 border border-orange-400/40">🔥 {g.streak.days} {g.streak.days === 1 ? 'dia' : 'dias'}</span>}
          {g?.mascot && <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-400/30" title={`Rit: ${g.mascot.name}`}>{g.mascot.emoji} {g.mascot.name}</span>}
        </div>
        {profile.bio ? (
          <p className="mt-3 text-sm text-[#c9d1d9] max-w-sm whitespace-pre-wrap break-words">{profile.bio}</p>
        ) : (
          profile.isMe && <p className="mt-3 text-sm text-[#6e7681]">Você ainda não escreveu sua bio.</p>
        )}

        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          {!profile.isMe && (
            <button
              type="button"
              onClick={onFollow}
              disabled={followBusy}
              aria-pressed={Boolean(profile.followedByMe)}
              className={`inline-flex items-center gap-1.5 px-5 py-2 rounded-full text-sm font-bold ${profile.followedByMe ? 'border border-[#30363d] text-[#c9d1d9] hover:border-rose-400/60 hover:text-rose-300' : 'bg-emerald-600 hover:bg-emerald-500 text-white'}`}
            >
              {profile.followedByMe ? <><UserCheck className="w-4 h-4" /> Seguindo</> : <><UserPlus className="w-4 h-4" /> Seguir</>}
            </button>
          )}
          {profile.story?.any && (
            <button type="button" onClick={() => { onClose(); openStories(profile.id); }} className="px-4 py-2 rounded-full text-sm font-bold border border-emerald-400/50 text-emerald-300 hover:bg-emerald-500/10">◎ Ver stories</button>
          )}
          {profile.isMe && onEditMine && (
            <button type="button" onClick={() => { onClose(); onEditMine(); }} className="px-4 py-2 rounded-full border border-[#30363d] text-sm text-[#c9d1d9] hover:bg-[#21262d]">Editar meu perfil</button>
          )}
        </div>
        <p className="mt-2 text-sm text-[#8b949e]">
          <strong className="text-[#f0f6fc]">{profile.followers ?? 0}</strong> {(profile.followers ?? 0) === 1 ? 'seguidor' : 'seguidores'} · <strong className="text-[#f0f6fc]">{profile.following ?? 0}</strong> seguindo
          {profile.memberSince && <> · desde {monthYear(profile.memberSince)}</>}
        </p>

        {/* nível */}
        <div className="mt-4 w-full max-w-sm">
          <div className="h-2 rounded-full bg-[#21262d] overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-300" style={{ width: `${Math.round(info.progress * 100)}%` }} />
          </div>
          <p className="mt-1 text-[11px] text-[#6e7681]">{info.nextName ? `${info.xp.toLocaleString('pt-BR')} pontos · faltam ${info.xpToNext} para ${info.nextName}` : `${info.xp.toLocaleString('pt-BR')} pontos · nível máximo`}</p>
        </div>

        {/* números */}
        <dl className="mt-4 grid grid-cols-3 gap-2 w-full max-w-md">
          <Stat label="Dias ativos" value={g?.activeDays ?? '—'} />
          <Stat label="Maior ofensiva" value={g ? `${g.streak.best}🔥` : '—'} />
          <Stat label="Conquistas" value={g ? `${g.medalsEarned}/${g.medalsTotal}` : medals.length} />
          <Stat label="Pontos na semana" value={g?.week.xp ?? '—'} hint={g ? `${g.week.activeDays} dias ativos nesta semana` : undefined} />
          <Stat label="Desafios cumpridos" value={g?.challengesDone ?? '—'} />
          <Stat label="Publicações" value={profile.posts} hint={`${profile.likesReceived} curtidas recebidas`} />
        </dl>
      </div>

      {/* temporada e selos */}
      {g && (g.division || g.seals.length > 0 || g.pass.step > 0) && (
        <div className="mx-5 mt-4 rounded-2xl border border-[#21262d] bg-[#161b22] p-4 text-left">
          <h3 className="text-sm font-bold text-[#f0f6fc]">Temporada</h3>
          <p className="mt-1 text-xs text-[#8b949e]">
            {g.division ? <>Divisão atual: <strong style={{ color: g.division.color }}>{g.division.emoji} {g.division.name}</strong> · melhor: {g.division.bestEmoji} {g.division.best}. </> : null}
            Passe deste mês: degrau <strong className="text-amber-200">{g.pass.step}/10</strong>.
          </p>
          {g.seals.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {g.seals.map((s) => (
                <span key={s.month} className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border ${s.steps >= 10 ? 'bg-amber-400/15 border-amber-400/50 text-amber-200' : 'bg-[#0d1117] border-[#30363d] text-[#c9d1d9]'}`}>
                  {s.steps >= 10 ? '👑 Passe completo' : '🏵️ Metade do passe'} · {s.label}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* conquistas */}
      <div className="mx-5 mt-4 rounded-2xl border border-[#21262d] bg-[#161b22] p-4 text-left">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#f0f6fc]">Conquistas</h3>
          {rarest && <span className="text-[11px] font-bold" style={{ color: RARITY[rarest.rarity].color }}>Mais rara: {rarest.emoji} {rarest.name}</span>}
        </div>
        {medals.length === 0 ? (
          <p className="mt-2 text-xs text-[#6e7681]">{profile.isMe ? 'Suas conquistas aparecem aqui.' : 'Ainda sem conquistas para mostrar.'}</p>
        ) : (
          <>
            <div className="mt-3 grid grid-cols-4 gap-2">
              {shownMedals.map((m) => {
                const r = RARITY[m.rarity];
                const Tag: any = profile.isMe ? 'button' : 'div';
                return (
                  <Tag
                    key={m.id}
                    {...(profile.isMe ? { type: 'button', onClick: () => openShare(cardFromMedal(m)) } : {})}
                    title={`${m.name}: ${m.desc} (${r.name})`}
                    className="rounded-xl border p-2 text-center"
                    style={{ borderColor: `${r.color}66`, background: `linear-gradient(160deg, ${r.color}1f, transparent)` }}
                  >
                    <span className="block text-2xl" aria-hidden="true">{m.emoji}</span>
                    <span className="block mt-0.5 text-[10px] font-semibold leading-tight text-[#e6edf3]">{m.name}</span>
                    <span className="block text-[9px] font-black uppercase" style={{ color: r.color }}>{r.name}</span>
                  </Tag>
                );
              })}
            </div>
            {medals.length > 8 && (
              <button type="button" onClick={() => setAllMedals((v) => !v)} className="mt-2 text-xs font-semibold text-emerald-400 hover:underline">
                {allMedals ? 'Mostrar menos' : `Ver todas (${medals.length})`}
              </button>
            )}
          </>
        )}
      </div>

      {/* Ritus */}
      {(ritus.owned.length > 0 || ritus.member.length > 0) && (
        <div className="mx-5 mt-4 rounded-2xl border border-[#21262d] bg-[#161b22] p-4 text-left space-y-3">
          {ritus.owned.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-[#f0f6fc] flex items-center gap-1.5"><Crown className="w-4 h-4 text-amber-300" /> Ritus que criou</h3>
              <ul className="mt-2 space-y-1.5">
                {ritus.owned.map((t) => (
                  <li key={t.code}>
                    <button type="button" onClick={() => goRitus(t.code)} className="w-full flex items-center gap-2 rounded-xl border border-[#30363d] bg-[#0d1117] px-3 py-2 text-left hover:border-emerald-500/50">
                      <span className="flex-1 min-w-0 truncate text-sm font-semibold text-[#e6edf3]">{t.name}</span>
                      <span className="text-[11px] text-[#8b949e]">{t.members} {t.members === 1 ? 'membro' : 'membros'}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${t.free ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'}`}>{t.free ? 'Grátis' : 'Pago'}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {ritus.member.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-[#f0f6fc]">Ritus de que participa</h3>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {ritus.member.map((t) => (
                  <button key={t.code} type="button" onClick={() => goRitus(t.code)} className="px-2.5 py-1 rounded-full text-xs font-semibold border border-[#30363d] bg-[#0d1117] text-[#c9d1d9] hover:border-emerald-500/50">
                    {t.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
