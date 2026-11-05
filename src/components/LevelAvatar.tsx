import React, { useState } from 'react';
import { frameForLevel } from '../lib/levels.js';

// Foto de perfil com a moldura do nível. Sem foto, mostra as iniciais.
// A moldura muda com o nível: Simples → Bronze → Prata → Ouro → Diamante → Lendária.

const SIZES = {
  xs: { box: 28, ring: 2, text: 'text-[10px]', badge: 0 },
  sm: { box: 36, ring: 2.5, text: 'text-xs', badge: 14 },
  md: { box: 44, ring: 3, text: 'text-sm', badge: 16 },
  lg: { box: 72, ring: 4, text: 'text-xl', badge: 22 },
  xl: { box: 120, ring: 6, text: 'text-4xl', badge: 30 },
} as const;

export interface LevelAvatarProps {
  initials: string;
  avatarUrl?: string | null;
  level?: number | null;
  size?: keyof typeof SIZES;
  /** Mostra o número do nível no cantinho. */
  showLevel?: boolean;
  title?: string;
}

export const LevelAvatar: React.FC<LevelAvatarProps> = ({ initials, avatarUrl, level, size = 'md', showLevel = true, title }) => {
  const [broken, setBroken] = useState(false);
  const lv = Math.max(1, Number(level) || 1);
  const frame = frameForLevel(lv);
  const s = SIZES[size];
  const gradient = `conic-gradient(from 0deg, ${frame.colors.join(', ')})`;
  const glow = frame.id === 'diamante' ? '0 0 14px rgba(34,211,238,0.45)' : frame.id === 'lendaria' ? '0 0 18px rgba(168,85,247,0.55)' : frame.id === 'ouro' ? '0 0 10px rgba(214,158,46,0.35)' : 'none';
  const photo = avatarUrl && !broken ? avatarUrl : null;

  return (
    <span
      className="relative inline-flex shrink-0 rounded-full"
      style={{ width: s.box, height: s.box, boxShadow: glow }}
      title={title || `Nível ${lv} · moldura ${frame.name}`}
    >
      {/* anel da moldura (gira nas molduras animadas) */}
      <span className="absolute inset-0 rounded-full overflow-hidden" aria-hidden="true">
        <span className={`absolute -inset-1/4 ${frame.animated ? 'ritmo-frame-spin' : ''}`} style={{ background: gradient }} />
      </span>
      <span
        className={`absolute rounded-full overflow-hidden bg-[#0d1117] flex items-center justify-center font-bold text-emerald-300 ${s.text}`}
        style={{ inset: s.ring }}
      >
        {photo ? (
          <img src={photo} alt="" className="w-full h-full object-cover" loading="lazy" onError={() => setBroken(true)} />
        ) : (
          <span className="w-full h-full flex items-center justify-center bg-emerald-500/15">{initials || '?'}</span>
        )}
      </span>
      {showLevel && s.badge > 0 && (
        <span
          className="absolute -bottom-0.5 -right-0.5 rounded-full flex items-center justify-center font-extrabold text-white border-2 border-[#0d1117]"
          style={{ width: s.badge, height: s.badge, fontSize: Math.max(8, Math.round(s.badge * 0.5)), background: frame.badge }}
        >
          {lv}
        </span>
      )}
    </span>
  );
};
