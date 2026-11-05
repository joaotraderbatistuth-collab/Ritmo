import React, { useRef, useState } from 'react';
import { Camera, Trash2, Loader2 } from 'lucide-react';
import { LevelAvatar } from './LevelAvatar.js';
import { FRAMES, LEVELS } from '../lib/levels.js';
import { compressAvatar } from '../lib/upload.js';
import { callApi } from '../lib/client-api.js';
import type { XpData } from './LevelUp.js';

// Foto de perfil: aparece no Feed, nos comentários e no cabeçalho, sempre com a moldura do nível.
export const ProfilePhotoCard: React.FC<{ data: XpData | null; initials: string; onChanged: (avatarUrl: string | null) => void }> = ({ data, initials, onChanged }) => {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const level = data?.level.level || 1;
  const avatarUrl = data?.avatarUrl || null;

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
      <h3 className="text-base font-semibold text-[#f0f6fc]">Foto de perfil</h3>
      <p className="text-xs text-[#8b949e] mt-0.5">Aparece no Feed, nos comentários e nos Ritus. A moldura muda conforme você sobe de nível.</p>
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
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
    </section>
  );
};
