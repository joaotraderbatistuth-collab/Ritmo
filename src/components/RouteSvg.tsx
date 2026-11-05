import React, { useMemo } from 'react';
import { decodePolyline } from '../lib/workout.js';

/** Projeta a rota num retângulo (equirretangular, bom para trechos de poucos km). */
export function projectRoute(points: { lat: number; lng: number }[], w: number, h: number, pad: number) {
  if (points.length < 2) return [];
  const lat0 = (points.reduce((a, p) => a + p.lat, 0) / points.length) * (Math.PI / 180);
  const xs = points.map((p) => p.lng * Math.cos(lat0));
  const ys = points.map((p) => -p.lat);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const spanX = maxX - minX || 1e-9;
  const spanY = maxY - minY || 1e-9;
  const scale = Math.min((w - pad * 2) / spanX, (h - pad * 2) / spanY);
  const offX = (w - spanX * scale) / 2;
  const offY = (h - spanY * scale) / 2;
  return xs.map((x, i) => ({ x: offX + (x - minX) * scale, y: offY + (ys[i] - minY) * scale }));
}

/** Desenho da rota (sem mapa por baixo): usado no Feed e nos cartões do histórico. */
export const RouteSvg: React.FC<{ route: string; className?: string; strokeWidth?: number }> = ({ route, className = 'w-full h-40', strokeWidth = 4 }) => {
  const W = 400;
  const H = 220;
  const pts = useMemo(() => projectRoute(decodePolyline(route), W, H, 18), [route]);
  if (pts.length < 2) return null;
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const s = pts[0];
  const e = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} role="img" aria-label="Rota do treino" preserveAspectRatio="xMidYMid meet">
      <defs>
        <pattern id="ritmo-grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0H0V20" fill="none" stroke="#21262d" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width={W} height={H} fill="url(#ritmo-grid)" />
      <path d={d} fill="none" stroke="#052e1f" strokeWidth={strokeWidth + 4} strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
      <path d={d} fill="none" stroke="#10b981" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={s.x} cy={s.y} r={strokeWidth + 2} fill="#10b981" stroke="#0d1117" strokeWidth="2.5" />
      <circle cx={e.x} cy={e.y} r={strokeWidth + 2} fill="#f43f5e" stroke="#0d1117" strokeWidth="2.5" />
    </svg>
  );
};
