import React, { useEffect, useMemo } from 'react';
import { Share2, X } from 'lucide-react';
import { RARITY, type Medal, type Rarity } from '../lib/medals.js';
import { cardFromMedal } from '../lib/share-card.js';
import { openShare } from '../lib/share-feed.js';
import { playFanfare } from './XpBurst.js';
import { postStory } from '../lib/stories-client.js';

// "Conquista desbloqueada!": tela cheia com raios girando, medalha que pula, confete e fanfarra.
// Quanto mais rara, mais brilho e mais longa a música. Daqui dá para compartilhar no Stories/WhatsApp/Feed.

const ORDER: Rarity[] = ['comum', 'rara', 'epica', 'lendaria'];
const CONFETTI = ['#10b981', '#f59e0b', '#22d3ee', '#a855f7', '#f43f5e', '#fde68a'];

export const MedalUnlock: React.FC<{ queue: Medal[]; onNext: () => void }> = ({ queue, onNext }) => {
  const m = queue[0];
  const rarityIdx = m ? ORDER.indexOf(m.rarity) : 0;
  const pieces = useMemo(() => {
    const n = 36 + rarityIdx * 10;
    return Array.from({ length: n }, (_v, i: number) => ({
        id: i,
        color: CONFETTI[i % CONFETTI.length],
        dx: `${Math.round(Math.cos((i / n) * Math.PI * 2) * (140 + (i % 5) * 30))}px`,
        dy: `${Math.round(Math.sin((i / n) * Math.PI * 2) * (140 + (i % 4) * 35))}px`,
        delay: `${(i % 8) * 45}ms`,
      }));
  }, [m?.id, rarityIdx]);

  useEffect(() => {
    if (!m) return;
    playFanfare(rarityIdx);
    postStory(cardFromMedal(m), true); // vai para os stories do Ritmo se a pessoa ligou a opção automática
  }, [m?.id]);

  if (!m) return null;
  const r = RARITY[m.rarity];

  return (
    <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-hidden" role="dialog" aria-modal="true" aria-labelledby="medal-title">
      {/* raios de luz girando atrás */}
      <div
        className="absolute left-1/2 top-1/2 w-[160vmax] h-[160vmax] -translate-x-1/2 -translate-y-1/2 opacity-60 pointer-events-none"
        aria-hidden="true"
      >
        <div
          className="w-full h-full ritmo-rays"
          style={{ background: `repeating-conic-gradient(from 0deg, ${r.glow} 0deg 8deg, transparent 8deg 20deg)`, maskImage: 'radial-gradient(circle, black 10%, transparent 55%)', WebkitMaskImage: 'radial-gradient(circle, black 10%, transparent 55%)' }}
        />
      </div>

      <div className="relative w-full max-w-sm rounded-3xl border bg-[#161b22]/95 p-6 text-center ritmo-level-pop" style={{ borderColor: `${r.color}80`, boxShadow: `0 0 80px ${r.glow}` }}>
        <button type="button" onClick={onNext} aria-label="Fechar" className="absolute top-3 right-3 p-1.5 text-[#8b949e] hover:text-white"><X className="w-5 h-5" /></button>

        <p className="text-[11px] font-black uppercase tracking-[0.25em]" style={{ color: r.color }}>Conquista desbloqueada!</p>

        <div className="relative mx-auto mt-5 w-40 h-40">
          <span className="absolute inset-0 rounded-full blur-2xl ritmo-glow-pulse" style={{ background: r.glow }} aria-hidden="true" />
          {pieces.map((p) => (
            <span key={p.id} className="absolute left-1/2 top-1/2 w-2 h-3 rounded-sm ritmo-confetti" style={{ background: p.color, animationDelay: p.delay, ['--dx' as any]: p.dx, ['--dy' as any]: p.dy }} aria-hidden="true" />
          ))}
          <div
            className="relative w-40 h-40 rounded-full flex items-center justify-center overflow-hidden ritmo-medal-pop"
            style={{ background: `radial-gradient(circle at 35% 30%, #2d333b, #0d1117)`, border: `6px solid ${r.color}`, boxShadow: `0 0 40px ${r.glow}, inset 0 0 30px ${r.glow}` }}
          >
            <span className="text-7xl" aria-hidden="true">{m.emoji}</span>
            <span className="absolute inset-y-0 left-0 w-1/3 bg-white/25 ritmo-shine" aria-hidden="true" />
          </div>
        </div>

        <span className="mt-5 inline-block px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider text-[#0d1117]" style={{ background: r.color }}>{r.name}</span>
        <h2 id="medal-title" className="mt-2 text-2xl font-extrabold text-[#f0f6fc]">{m.name}</h2>
        <p className="mt-1 text-sm text-[#8b949e]">{m.desc}</p>

        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => {
              openShare(cardFromMedal(m));
              onNext();
            }}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-extrabold text-[#0d1117] shadow-lg"
            style={{ background: r.color }}
          >
            <Share2 className="w-4 h-4" /> Compartilhar no Stories, WhatsApp ou Feed
          </button>
          <button type="button" onClick={onNext} className="w-full px-4 py-2 rounded-xl text-sm text-[#8b949e] hover:text-white">
            {queue.length > 1 ? `Próxima conquista (${queue.length - 1})` : 'Continuar'}
          </button>
        </div>
      </div>
    </div>
  );
};
