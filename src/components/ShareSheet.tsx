import React, { useEffect, useRef, useState } from 'react';
import { X, Download, Link2, Check, Loader2, Eye, Users, Gift } from 'lucide-react';
import { OPEN_SHARE_EVENT, shareToFeed } from '../lib/share-feed.js';
import { shareMessage, type ShareCard } from '../lib/share-card.js';
import { canvasBlob, previewDataUrl, renderStory, type StoryPerson } from '../lib/story-image.js';
import { callApi } from '../lib/client-api.js';

// "Compartilhar em redes sociais": story pronto (1080×1920) com QR code e o link da pessoa.
// WhatsApp e Instagram recebem a imagem + o link; o Feed do Ritmo recebe a conquista.

const WaIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor" aria-hidden="true">
    <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.1l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.2c0-.1-.2-.2-.5-.3Z" />
  </svg>
);
const IgIcon = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
  </svg>
);

interface Stats {
  shares: number;
  views: number;
  friends: number;
  activeFriends: number;
}

export const ShareSheet: React.FC<{ person: StoryPerson | null; referralCode: string }> = ({ person, referralCode }) => {
  const [card, setCard] = useState<ShareCard | null>(null);
  const [url, setUrl] = useState('');
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const blob = useRef<Blob | null>(null);
  const run = useRef(0);
  // a pessoa e o código mudam de objeto a cada render do app: guarda em ref para não refazer a imagem
  const personRef = useRef(person);
  personRef.current = person;
  const codeRef = useRef(referralCode);
  codeRef.current = referralCode;

  useEffect(() => {
    const h = (e: Event) => setCard((e as CustomEvent<ShareCard>).detail);
    window.addEventListener(OPEN_SHARE_EVENT, h);
    return () => window.removeEventListener(OPEN_SHARE_EVENT, h);
  }, []);

  // monta o link e a imagem quando abre
  useEffect(() => {
    const person = personRef.current;
    const referralCode = codeRef.current;
    if (!card || !person) return;
    const id = ++run.current;
    setBusy(true);
    setMsg('');
    setCopied(false);
    setPreview('');
    blob.current = null;
    const fallback = `${window.location.origin}/?ref=${encodeURIComponent(referralCode)}`;
    (async () => {
      let link = fallback;
      let slug = '';
      const r = await callApi<{ url?: string; slug?: string }>('/api/share', {
        action: 'create',
        card: { kind: card.kind, emoji: card.emoji, title: card.title, subtitle: card.subtitle },
      });
      if (r.ok && r.data.url) {
        link = r.data.url;
        slug = r.data.slug || '';
      }
      if (id !== run.current) return;
      setUrl(link);
      try {
        const cv = await renderStory(card, person, link);
        if (id !== run.current) return;
        blob.current = await canvasBlob(cv);
        setPreview(URL.createObjectURL(blob.current));
        if (slug) callApi('/api/share', { action: 'image', slug, image: previewDataUrl(cv) }).catch(() => null);
      } catch {
        setMsg('Não deu para montar a imagem agora, mas o link já está pronto.');
      }
      setBusy(false);
    })();
    fetch('/api/share')
      .then((x) => x.json())
      .then((d) => d?.stats && setStats(d.stats))
      .catch(() => null);
  }, [card]);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  if (!card) return null;
  const close = () => {
    run.current++;
    setCard(null);
  };
  const file = () => (blob.current ? new File([blob.current], `ritmo-${card.kind}.png`, { type: 'image/png' }) : null);
  const nav = typeof navigator !== 'undefined' ? (navigator as any) : null;
  const canShareFile = () => {
    const f = file();
    return Boolean(f && nav?.canShare?.({ files: [f] }));
  };
  const text = shareMessage(card, url);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      return true;
    } catch {
      return false;
    }
  };
  const download = () => {
    if (!blob.current) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob.current);
    a.download = `ritmo-${card.kind}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  };

  const whatsapp = async () => {
    setMsg('');
    try {
      if (canShareFile()) {
        await nav.share({ files: [file()], text });
        return;
      }
    } catch (e: any) {
      if (e?.name === 'AbortError') return;
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  };

  const instagram = async () => {
    setMsg('');
    const ok = await copyLink();
    try {
      if (canShareFile()) {
        await nav.share({ files: [file()] });
        setMsg(ok ? 'Link copiado! No Stories, toque no adesivo "Link" e cole. O QR code já está na imagem.' : 'No Stories, use o adesivo "Link" com o seu link. O QR code já está na imagem.');
        return;
      }
    } catch (e: any) {
      if (e?.name === 'AbortError') return;
    }
    download();
    setMsg(`Imagem baixada${ok ? ' e link copiado' : ''}. Abra o Instagram, poste no Stories e use o adesivo "Link" para colar o link.`);
  };

  const feed = () => {
    if (!card.feed) return;
    shareToFeed(card.feed);
    close();
  };

  const btn = 'flex flex-col items-center justify-center gap-1.5 rounded-2xl py-3 text-xs font-bold transition-transform active:scale-95 disabled:opacity-40';

  return (
    <div className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="share-title" onClick={close}>
      <div className="w-full sm:max-w-md max-h-[94vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-[#30363d] bg-[#161b22] p-5 pb-8 ritmo-sheet-up" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 id="share-title" className="text-base font-extrabold text-[#f0f6fc]">Compartilhar em redes sociais</h2>
          <button type="button" onClick={close} aria-label="Fechar" className="p-1.5 text-[#8b949e] hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="mt-3 mx-auto w-44 aspect-[9/16] rounded-2xl overflow-hidden border border-[#30363d] bg-[#0d1117] flex items-center justify-center">
          {preview ? <img src={preview} alt={`Story: ${card.title}`} className="w-full h-full object-cover" /> : <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />}
        </div>
        <p className="mt-2 text-center text-sm font-bold text-[#f0f6fc]">{card.emoji} {card.title}</p>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <button type="button" onClick={whatsapp} disabled={busy} className={`${btn} bg-[#25d366] text-[#052e1f]`}><WaIcon />WhatsApp</button>
          <button type="button" onClick={instagram} disabled={busy} className={`${btn} text-white bg-gradient-to-br from-[#f58529] via-[#dd2a7b] to-[#8134af]`}><IgIcon />Instagram</button>
          <button type="button" onClick={feed} disabled={!card.feed} className={`${btn} bg-emerald-600 text-white`}>
            <span className="text-xl leading-6" aria-hidden="true">✨</span>Feed do Ritmo
          </button>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button type="button" onClick={copyLink} disabled={!url} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#30363d] py-2.5 text-xs font-semibold text-[#c9d1d9] hover:text-white">
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Link2 className="w-4 h-4" />} {copied ? 'Link copiado' : 'Copiar link'}
          </button>
          <button type="button" onClick={download} disabled={busy || !preview} className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#30363d] py-2.5 text-xs font-semibold text-[#c9d1d9] hover:text-white disabled:opacity-40">
            <Download className="w-4 h-4" /> Baixar imagem
          </button>
        </div>
        {msg && <p className="mt-3 text-xs text-emerald-300 text-center" role="status">{msg}</p>}

        <div className="mt-4 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-3 text-xs text-[#e6edf3]">
          <p className="flex items-start gap-2"><Gift className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" /> A imagem leva o seu link. Quem entrar por ele e usar o Ritmo em 2 dias vale <strong className="text-amber-200">+50 pontos</strong> para você, e conta como sua indicação no Indique e Ganhe.</p>
          {stats && (stats.views > 0 || stats.friends > 0) && (
            <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[#c9d1d9]">
              <span className="inline-flex items-center gap-1"><Eye className="w-3.5 h-3.5 text-sky-300" /> {stats.views} {stats.views === 1 ? 'visualização' : 'visualizações'}</span>
              <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5 text-emerald-300" /> {stats.friends} {stats.friends === 1 ? 'amigo entrou' : 'amigos entraram'}</span>
            </p>
          )}
        </div>
        <p className="mt-2 text-[11px] text-[#6e7681] text-center">A imagem e o link mostram seu primeiro nome, sua foto de perfil, seu nível e esta conquista.</p>
      </div>
    </div>
  );
};
