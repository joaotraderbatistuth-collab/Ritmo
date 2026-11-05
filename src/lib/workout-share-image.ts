// Imagem do treino para compartilhar fora do app (Stories, WhatsApp): rota + números + marca Ritmo.
// Desenhada no navegador (canvas 1080x1350), sem mapa por baixo, para não expor ruas e endereço.
import { SPORTS, SportId, formatDuration, formatKm, formatPace, paceSPerKm, speedKmh } from './workout.js';

function project(points: { lat: number; lng: number }[], x: number, y: number, w: number, h: number) {
  const lat0 = (points.reduce((a, p) => a + p.lat, 0) / points.length) * (Math.PI / 180);
  const xs = points.map((p) => p.lng * Math.cos(lat0));
  const ys = points.map((p) => -p.lat);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const sx = maxX - minX || 1e-9, sy = maxY - minY || 1e-9;
  const scale = Math.min(w / sx, h / sy);
  const ox = x + (w - sx * scale) / 2, oy = y + (h - sy * scale) / 2;
  return xs.map((v, i) => ({ x: ox + (v - minX) * scale, y: oy + (ys[i] - minY) * scale }));
}

export async function workoutImage(w: {
  sport: SportId;
  title: string;
  startedAt: string;
  distanceM: number;
  movingS: number;
  elevationGainM: number | null;
  points: { lat: number; lng: number }[];
}): Promise<Blob> {
  const W = 1080, H = 1350;
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;
  const font = (wgt: number, px: number) => `${wgt} ${px}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif`;

  // fundo
  const bg = g.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#0d1117');
  bg.addColorStop(1, '#06281d');
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(255,255,255,0.04)';
  g.lineWidth = 1;
  for (let i = 0; i <= W; i += 54) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, H); g.stroke(); }
  for (let i = 0; i <= H; i += 54) { g.beginPath(); g.moveTo(0, i); g.lineTo(W, i); g.stroke(); }

  // cabeçalho
  const sp = SPORTS[w.sport];
  g.fillStyle = '#10b981';
  g.font = font(800, 34);
  g.fillText(sp.label.toUpperCase(), 80, 120);
  g.fillStyle = '#f0f6fc';
  g.font = font(800, 58);
  g.fillText(w.title.slice(0, 32), 80, 190);
  g.fillStyle = '#8b949e';
  g.font = font(500, 32);
  g.fillText(new Date(w.startedAt).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }), 80, 240);

  // rota
  if (w.points.length >= 2) {
    const pts = project(w.points, 110, 300, W - 220, 640);
    const path = () => {
      g.beginPath();
      pts.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)));
    };
    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.shadowColor = 'rgba(16,185,129,0.6)';
    g.shadowBlur = 30;
    g.strokeStyle = '#10b981';
    g.lineWidth = 12;
    path();
    g.stroke();
    g.shadowBlur = 0;
    for (const [p, color] of [[pts[0], '#10b981'], [pts[pts.length - 1], '#f43f5e']] as const) {
      g.beginPath();
      g.arc(p.x, p.y, 16, 0, Math.PI * 2);
      g.fillStyle = color;
      g.fill();
      g.lineWidth = 6;
      g.strokeStyle = '#0d1117';
      g.stroke();
    }
  }

  // números
  const rate = sp.usesPace ? formatPace(paceSPerKm(w.distanceM, w.movingS)) : speedKmh(w.distanceM, w.movingS).toFixed(1).replace('.', ',');
  const stats: [string, string][] = [
    ['Distância', `${formatKm(w.distanceM)} km`],
    ['Tempo', formatDuration(w.movingS)],
    [sp.usesPace ? 'Ritmo' : 'Velocidade', sp.usesPace ? `${rate} /km` : `${rate} km/h`],
  ];
  const colW = (W - 160) / 3;
  stats.forEach(([label, value], i) => {
    const x = 80 + i * colW;
    g.fillStyle = '#8b949e';
    g.font = font(600, 30);
    g.fillText(label, x, 1080);
    g.fillStyle = '#f0f6fc';
    g.font = font(800, 60);
    g.fillText(value, x, 1150);
  });
  if (w.elevationGainM) {
    g.fillStyle = '#8b949e';
    g.font = font(500, 30);
    g.fillText(`Subida: ${w.elevationGainM} m`, 80, 1210);
  }

  // marca
  g.fillStyle = '#10b981';
  g.font = font(900, 44);
  g.fillText('Ritmo', 80, 1290);
  g.fillStyle = '#6e7681';
  g.font = font(500, 26);
  g.fillText('constância sem extremismos', 225, 1288);

  return new Promise((resolve, reject) => c.toBlob((b) => (b ? resolve(b) : reject(new Error('Não foi possível gerar a imagem.'))), 'image/png'));
}
