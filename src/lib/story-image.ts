// Imagem 1080×1920 para Stories do Instagram e status do WhatsApp, desenhada no navegador.
// Vai com o QR code e o link da pessoa: quem vê aponta a câmera (ou toca no adesivo de link) e cai no cadastro.
import qrcode from 'qrcode-generator';
import type { ShareCard } from './share-card.js';
import { shortLink } from './share-card.js';
import { FRAMES, levelDef } from './levels.js';

const W = 1080;
const H = 1920;
const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif';

export interface StoryPerson {
  name: string;
  level: number;
  levelName: string;
  avatarUrl?: string | null;
  initials: string;
}

function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

/** Quebra o texto em até `maxLines` linhas que cabem em `width`. */
function wrap(g: CanvasRenderingContext2D, text: string, width: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (g.measureText(test).width <= width || !line) line = test;
    else {
      lines.push(line);
      line = w;
      if (lines.length === maxLines) break;
    }
  }
  if (lines.length < maxLines && line) lines.push(line);
  if (lines.length === maxLines && words.join(' ') !== lines.join(' ')) {
    let last = lines[maxLines - 1];
    while (last.length > 1 && g.measureText(`${last}…`).width > width) last = last.slice(0, -1);
    lines[maxLines - 1] = `${last.replace(/[\s,.;:]+$/, '')}…`;
  }
  return lines;
}

async function loadImage(url: string): Promise<CanvasImageSource | null> {
  try {
    const res = await fetch(url, { credentials: 'same-origin' });
    if (!res.ok) return null;
    return await createImageBitmap(await res.blob());
  } catch {
    return null;
  }
}

function drawQr(g: CanvasRenderingContext2D, text: string, x: number, y: number, size: number) {
  const qr = qrcode(0, 'M');
  qr.addData(text);
  qr.make();
  const n = qr.getModuleCount();
  const cell = size / (n + 2); // margem de 1 módulo
  g.fillStyle = '#ffffff';
  roundRect(g, x, y, size, size, 18);
  g.fill();
  g.fillStyle = '#0d1117';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) g.fillRect(x + (c + 1) * cell, y + (r + 1) * cell, Math.ceil(cell), Math.ceil(cell));
}

/** Desenha o story. `url` é o link público da conquista (com o convite da pessoa). */
export async function renderStory(card: ShareCard, person: StoryPerson, url: string): Promise<HTMLCanvasElement> {
  const cv = document.createElement('canvas');
  cv.width = W;
  cv.height = H;
  const g = cv.getContext('2d')!;
  const color = /^#[0-9a-f]{6}$/i.test(card.color || '') ? card.color : '#34d399';
  // com números (retrospectiva) a medalha fica menor para caber tudo
  const compact = Boolean(card.stats?.length);
  const MY = compact ? 560 : 600;
  const MR = compact ? 210 : 250;

  // fundo: escuro com brilho da cor da conquista
  const bg = g.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#0b1220');
  bg.addColorStop(1, '#0d1117');
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  const glow = g.createRadialGradient(W / 2, 640, 40, W / 2, 640, 760);
  glow.addColorStop(0, `${color}88`);
  glow.addColorStop(0.45, `${color}22`);
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = glow;
  g.fillRect(0, 0, W, H);

  // raios de luz (cara de "desbloqueou!")
  g.save();
  g.translate(W / 2, 640);
  for (let i = 0; i < 18; i++) {
    g.rotate((Math.PI * 2) / 18);
    const ray = g.createLinearGradient(0, 0, 0, -900);
    ray.addColorStop(0, `${color}33`);
    ray.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = ray;
    g.beginPath();
    g.moveTo(-28, 0);
    g.lineTo(28, 0);
    g.lineTo(90, -900);
    g.lineTo(-90, -900);
    g.closePath();
    g.fill();
  }
  g.restore();

  // confete parado
  const conf = ['#34d399', '#f59e0b', '#38bdf8', '#a855f7', '#f43f5e', '#fde68a'];
  for (let i = 0; i < 46; i++) {
    const rnd = (k: number) => { const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v); };
    const x = 30 + rnd(1) * (W - 60);
    const y = 300 + rnd(2) * (MY + MR - 320);
    if (Math.hypot(x - W / 2, y - MY) < MR + 40) continue; // não cobre a medalha
    g.save();
    g.translate(x, y);
    g.rotate(i);
    g.fillStyle = conf[i % conf.length];
    g.globalAlpha = 0.55;
    g.fillRect(-8, -14, 16, 28);
    g.restore();
  }
  g.globalAlpha = 1;

  // topo: marca e selo
  g.textAlign = 'center';
  g.fillStyle = '#34d399';
  g.font = `900 46px ${FONT}`;
  g.fillText('R I T M O', W / 2, 140);
  g.font = `800 34px ${FONT}`;
  const tag = card.tag || 'CONQUISTA';
  const tw = g.measureText(tag).width + 70;
  g.fillStyle = color;
  roundRect(g, (W - tw) / 2, 186, tw, 70, 35);
  g.fill();
  g.fillStyle = '#0d1117';
  g.fillText(tag, W / 2, 233);

  // medalha: círculo com brilho + emoji (ou número grande)
  g.save();
  g.shadowColor = color;
  g.shadowBlur = 90;
  g.fillStyle = '#161b22';
  g.beginPath();
  g.arc(W / 2, MY, MR, 0, Math.PI * 2);
  g.fill();
  g.restore();
  const ring = g.createLinearGradient(W / 2 - MR, MY - MR, W / 2 + MR, MY + MR);
  ring.addColorStop(0, color);
  ring.addColorStop(0.5, '#ffffff');
  ring.addColorStop(1, color);
  g.lineWidth = 22;
  g.strokeStyle = ring;
  g.beginPath();
  g.arc(W / 2, MY, MR, 0, Math.PI * 2);
  g.stroke();
  if (card.big) {
    g.fillStyle = '#ffffff';
    g.font = `900 ${Math.round((card.big.length > 4 ? 150 : 200) * (MR / 250))}px ${FONT}`;
    g.fillText(card.big, W / 2, MY + 40);
    g.fillStyle = color;
    g.font = `800 ${Math.round(52 * (MR / 250))}px ${FONT}`;
    g.fillText(card.bigLabel || '', W / 2, MY + Math.round(112 * (MR / 250)));
    g.font = `120px ${FONT}`;
    g.fillText(card.emoji, W / 2 + MR * 0.78, MY - MR * 0.62);
  } else {
    g.font = `250px ${FONT}`;
    g.fillText(card.emoji, W / 2, MY + 90);
  }

  // título e detalhe
  g.fillStyle = '#ffffff';
  g.font = `900 78px ${FONT}`;
  let y = MY + MR + 110;
  for (const line of wrap(g, card.title, W - 140, 3)) {
    g.fillText(line, W / 2, y);
    y += 90;
  }
  if (card.subtitle) {
    g.fillStyle = '#c9d1d9';
    g.font = `500 42px ${FONT}`;
    y += 6;
    for (const line of wrap(g, card.subtitle, W - 180, 2)) {
      g.fillText(line, W / 2, y);
      y += 56;
    }
  }

  // números (retrospectiva)
  if (card.stats?.length) {
    const stats = card.stats.slice(0, 6);
    const cols = 3;
    const cw = 300;
    const startX = (W - cols * cw - (cols - 1) * 20) / 2;
    y += 20;
    stats.forEach(([label, value], i) => {
      const cx = startX + (i % cols) * (cw + 20);
      const cy = y + Math.floor(i / cols) * 145;
      g.fillStyle = 'rgba(255,255,255,0.07)';
      roundRect(g, cx, cy, cw, 130, 26);
      g.fill();
      g.fillStyle = '#ffffff';
      g.font = `900 56px ${FONT}`;
      g.fillText(value, cx + cw / 2, cy + 68);
      g.fillStyle = '#8b949e';
      g.font = `500 28px ${FONT}`;
      g.fillText(label, cx + cw / 2, cy + 108);
    });
    y += Math.ceil(stats.length / cols) * 145;
  }

  // pessoa: foto com a moldura do nível
  const py = compact ? Math.min(y + 85, H - 530) : Math.max(y + 100, 1220);
  const frame = FRAMES[levelDef(person.level).frame];
  const ax = W / 2 - 250;
  const ring2 = g.createLinearGradient(ax - 60, py - 60, ax + 60, py + 60);
  frame.colors.forEach((c, i) => ring2.addColorStop(i / Math.max(1, frame.colors.length - 1), c));
  g.fillStyle = ring2;
  g.beginPath();
  g.arc(ax, py, 62, 0, Math.PI * 2);
  g.fill();
  const avatar = person.avatarUrl ? await loadImage(person.avatarUrl) : null;
  g.save();
  g.beginPath();
  g.arc(ax, py, 52, 0, Math.PI * 2);
  g.clip();
  if (avatar) g.drawImage(avatar, ax - 52, py - 52, 104, 104);
  else {
    g.fillStyle = '#065f46';
    g.fillRect(ax - 52, py - 52, 104, 104);
    g.fillStyle = '#d1fae5';
    g.font = `800 40px ${FONT}`;
    g.fillText(person.initials.slice(0, 2), ax, py + 14);
  }
  g.restore();
  g.textAlign = 'left';
  g.fillStyle = '#ffffff';
  g.font = `800 46px ${FONT}`;
  g.fillText(person.name.slice(0, 22), ax + 90, py - 6);
  g.fillStyle = color;
  g.font = `700 34px ${FONT}`;
  g.fillText(`Nível ${person.level} · ${person.levelName}`, ax + 90, py + 42);
  g.textAlign = 'center';

  // convite com QR code e link
  const by = H - 440;
  g.fillStyle = 'rgba(255,255,255,0.08)';
  roundRect(g, 70, by, W - 140, 300, 40);
  g.fill();
  g.strokeStyle = `${color}88`;
  g.lineWidth = 3;
  g.stroke();
  drawQr(g, url, 110, by + 30, 240);
  g.textAlign = 'left';
  g.fillStyle = '#ffffff';
  g.font = `900 48px ${FONT}`;
  g.fillText('Vem comigo no Ritmo!', 390, by + 100);
  g.fillStyle = '#c9d1d9';
  g.font = `500 34px ${FONT}`;
  g.fillText('7 dias grátis, sem cartão.', 390, by + 152);
  g.fillStyle = color;
  const link = shortLink(url);
  let fs = 34;
  do {
    g.font = `800 ${fs}px ${FONT}`;
    fs -= 2;
  } while (g.measureText(link).width > W - 140 - 320 - 40 && fs > 18);
  g.fillText(link, 390, by + 214);
  g.fillStyle = '#8b949e';
  g.font = `500 26px ${FONT}`;
  g.fillText('Aponte a câmera ou toque no link', 390, by + 258);
  g.textAlign = 'center';
  g.fillStyle = '#6e7681';
  g.font = `600 34px ${FONT}`;
  g.fillText('Um pouco melhor a cada dia.', W / 2, H - 70);
  return cv;
}

export const canvasBlob = (cv: HTMLCanvasElement, type = 'image/png', q?: number) =>
  new Promise<Blob>((res, rej) => cv.toBlob((b) => (b ? res(b) : rej(new Error('imagem'))), type, q));

/** Prévia pequena em JPEG (para o WhatsApp mostrar quando o link é colado). */
export function previewDataUrl(cv: HTMLCanvasElement): string {
  const small = document.createElement('canvas');
  small.width = 540;
  small.height = 960;
  small.getContext('2d')!.drawImage(cv, 0, 0, 540, 960);
  return small.toDataURL('image/jpeg', 0.78);
}
