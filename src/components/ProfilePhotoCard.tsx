import React, { useEffect, useRef, useState } from 'react';
import { Camera, Trash2, Loader2, Eye } from 'lucide-react';
import { FEED_LIMITS } from '../lib/feed-rules.js';
import { openProfile } from '../lib/share-feed.js';
import { LevelAvatar } from './LevelAvatar.js';
import { FRAMES, LEVELS } from '../lib/levels.js';
import { compressAvatar } from '../lib/upload.js';
import { callApi } from '../lib/client-api.js';
import type { XpData } from './LevelUp.js';

// Perfil: foto (sempre com a moldura do nível) e bio. Outros membros veem ao tocar no seu nome no Feed.
export const ProfilePhotoCard: React.FC<{
  data: XpData | null;
  initials: string;
  userId: number;
  onChanged: (avatarUrl: string | null) => void;
  onBioChanged: (bio: string) => void;
}> = ({ data, initials, userId, onChanged, onBioChanged }) => {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const level = data?.level.level || 1;
  const avatarUrl = data?.avatarUrl || null;
  const [bio, setBio] = useState(data?.bio || '');
  const [bioBusy, setBioBusy] = useState(false);
  const [bioMsg, setBioMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const savedBio = data?.bio || '';
  useEffect(() => setBio(savedBio), [savedBio]);

  const saveBio = async () => {
    setBioBusy(true);
    setBioMsg(null);
    const r = await callApi<{ bio?: string; error?: string; message?: string }>('/api/profile', { action: 'set_bio', bio });
    setBioBusy(false);
    if (r.ok) {
      onBioChanged(r.data.bio || '');
      setBioMsg({ text: r.data.message || 'Bio salva!', ok: true });
    } else setBioMsg({ text: r.data.error || 'Não foi possível salvar a bio.', ok: false });
  };

  // próxima moldura que a pessoa ainda não tem
  const nextFrame = LEVELS.find((l) => l.level > level && FRAMES[l.frame].id !== data?.level.frame.id);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setMsg(null);
    try {
      const dataUrl = await compressAvatar(file);
      const up = await callApi<{ url?: string; error?: string }>('/api/media', { dataUrl, purpose: 'feed' });
      if (!up.ok || !up.data.url) throw new Error(up.data.error || 'Não foi possível enviar a foto.');
      const r = await callApi<{ avatarUrl?: string; error?: string; message?: string }>('/api/xp', { action: 'set_avatar', imageUrl: up.data.url });
      if (!r.ok) throw new Error(r.data.error || 'Não foi possível salvar a foto.');
      onChanged(r.data.avatarUrl || up.data.url);
      setMsg({ text: 'Foto de perfil atualizada!', ok: true });
    } catch (e: any) {
      setMsg({ text: e?.message || 'Não foi possível enviar a foto.', ok: false });
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };

  const remove = async () => {
    setBusy(true);
    const r = await callApi<{ error?: string }>('/api/xp', { action: 'remove_avatar' });
    setBusy(false);
    if (r.ok) {
      onChanged(null);
      setMsg({ text: 'Foto removida.', ok: true });
    } else setMsg({ text: r.data.error || 'Não foi possível remover.', ok: false });
  };

  return (
    <section className="rounded-2xl border border-[#30363d] bg-[#161b22] p-5 mb-6 max-w-4xl mx-auto">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-[#f0f6fc]">Seu perfil</h3>
          <p className="text-xs text-[#8b949e] mt-0.5">Outros membros veem sua foto, sua bio, seu nível e suas publicações do Feed ao tocar no seu nome. A moldura muda conforme você sobe de nível.</p>
        </div>
        <button type="button" onClick={() => openProfile(userId)} className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#30363d] text-sm text-[#c9d1d9] hover:bg-[#21262d]">
          <Eye className="w-4 h-4" /> Ver como os outros veem
        </button>
      </div>
      <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-5">
        <button type="button" onClick={() => input.current?.click()} disabled={busy} className="relative w-fit group" aria-label="Escolher foto de perfil">
          <LevelAvatar initials={initials} avatarUrl={avatarUrl} level={level} size="xl" />
          <span className="absolute inset-[6px] rounded-full bg-black/0 group-hover:bg-black/45 flex items-center justify-center transition-colors">
            {busy ? <Loader2 className="w-7 h-7 text-white animate-spin" /> : <Camera className="w-7 h-7 text-white opacity-0 group-hover:opacity-100 transition-opacity" />}
          </span>
        </button>
        <div className="space-y-2">
          <p className="text-sm text-[#e6edf3]">
            Moldura atual: <strong>{data?.level.frame.name || 'Simples'}</strong> (nível {level})
          </p>
          {nextFrame && <p className="text-xs text-[#8b949e]">Próxima moldura: <strong className="text-[#f0f6fc]">{FRAMES[nextFrame.frame].name}</strong> no nível {nextFrame.level} ({nextFrame.name}).</p>}
          <div className="flex flex-wrap gap-2 pt-1">
            <button type="button" onClick={() => input.current?.click()} disabled={busy} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-sm font-semibold">
              <Camera className="w-4 h-4" /> {avatarUrl ? 'Trocar foto' : 'Colocar foto'}
            </button>
            {avatarUrl && (
              <button type="button" onClick={remove} disabled={busy} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#30363d] text-sm text-[#8b949e] hover:text-rose-400">
                <Trash2 className="w-4 h-4" /> Remover
              </button>
            )}
          </div>
          {msg && <p className={`text-xs ${msg.ok ? 'text-emerald-400' : 'text-rose-400'}`}>{msg.text}</p>}
        </div>
      </div>
      <div className="mt-5">
        <label htmlFor="ritmo-bio" className="text-sm font-semibold text-[#f0f6fc]">Bio</label>
        <p className="text-xs text-[#8b949e]">Uma frase sobre você ou o que está construindo. Ex.: "Lendo 10 páginas por dia e organizando as finanças."</p>
        <textarea
          id="ritmo-bio"
          value={bio}
          onChange={(e) => setBio(e.target.value.replace(/\n/g, ' '))}
          maxLength={FEED_LIMITS.bioMax}
          rows={2}
          placeholder="Escreva sua bio..."
          className="mt-2 w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-[#f0f6fc] focus:outline-none focus:border-emerald-500 resize-none"
        />
        <div className="mt-1 flex items-center justify-between gap-3">
          <span className="text-[11px] text-[#6e7681]">{bio.length}/{FEED_LIMITS.bioMax}</span>
          <div className="flex items-center gap-3">
            {bioMsg && <span className={`text-xs ${bioMsg.ok ? 'text-emerald-400' : 'text-rose-400'}`}>{bioMsg.text}</span>}
            <button type="button" onClick={saveBio} disabled={bioBusy || bio.trim() === savedBio.trim()} className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-sm font-semibold">
              {bioBusy ? 'Salvando...' : 'Salvar bio'}
            </button>
          </div>
        </div>
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
    </section>
  );
};
