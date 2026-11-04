import React, { useEffect, useRef, useState } from 'react';
import { Download, Copy, Check, Instagram } from 'lucide-react';
import { STORY_MODELS, StoryModel } from '../lib/affiliate-content.js';

type LinkMode = 'espaco' | 'limpo' | 'texto';

const W = 1080;
const H = 1920;
const FONT = '"Inter", "Segoe UI", system-ui, -apple-system, Arial, sans-serif';

/* ------------------------------------------------------------------ */
/* Desenho (tudo em coordenadas 1080x1920; o contexto já vem escalado)  */
/* ------------------------------------------------------------------ */

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

function check(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = size / 5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - size / 2, cy);
  ctx.lineTo(cx - size / 8, cy + size / 2.6);
  ctx.lineTo(cx + size / 2, cy - size / 2.4);
  ctx.stroke();
}

function centerText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, font: string, color: string) {
  ctx.font = font;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.fillText(text, x, y);
  ctx.textAlign = 'left';
}

const DARK = '#04130d';
const MUTED = '#9aa7b5';

function drawVisual(ctx: CanvasRenderingContext2D, m: StoryModel, top: number) {
  const a = m.accent;
  const cx = W / 2;

  switch (m.visual) {
    case 'chain': {
      const cy = top + 110;
      for (let i = 0; i < 6; i++) {
        const x = 235 + i * 128;
        ctx.strokeStyle = a;
        ctx.lineWidth = 18;
        ctx.globalAlpha = i === 5 ? 1 : 0.85;
        if (i % 2 === 0) roundRect(ctx, x - 75, cy - 38, 150, 76, 38);
        else roundRect(ctx, x - 38, cy - 75, 76, 150, 38);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      centerText(ctx, '6 semanas seguidas', cx, cy + 150, `700 42px ${FONT}`, a);
      break;
    }
    case 'week': {
      const cy = top + 70;
      const days = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
      const marked = [0, 2, 4];
      days.forEach((d, i) => {
        const x = 168 + i * 124;
        ctx.beginPath();
        ctx.arc(x, cy, 52, 0, Math.PI * 2);
        if (marked.includes(i)) {
          ctx.fillStyle = a;
          ctx.fill();
          check(ctx, x, cy, 44, DARK);
        } else {
          ctx.strokeStyle = '#30363d';
          ctx.lineWidth = 6;
          ctx.stroke();
          centerText(ctx, d, x, cy + 14, `700 40px ${FONT}`, '#6e7681');
        }
      });
      centerText(ctx, 'Meta: 3x  ·  Feito: 3/3', cx, cy + 150, `700 44px ${FONT}`, '#f0f6fc');
      centerText(ctx, 'Corrente preservada!', cx, cy + 210, `700 40px ${FONT}`, a);
      break;
    }
    case 'bars': {
      const rows: [string, number][] = [['Moradia', 0.9], ['Mercado', 0.62], ['Lazer', 0.48], ['Transporte', 0.3]];
      rows.forEach(([label, v], i) => {
        const y = top + i * 66;
        ctx.font = `600 36px ${FONT}`;
        ctx.fillStyle = '#c9d1d9';
        ctx.fillText(label, 110, y + 36);
        roundRect(ctx, 400, y + 6, 580, 36, 18);
        ctx.fillStyle = '#21262d';
        ctx.fill();
        roundRect(ctx, 400, y + 6, 580 * v, 36, 18);
        ctx.fillStyle = a;
        ctx.globalAlpha = 1 - i * 0.14;
        ctx.fill();
        ctx.globalAlpha = 1;
      });
      centerText(ctx, 'dados de exemplo', cx, top + 296, `500 26px ${FONT}`, '#6e7681');
      break;
    }
    case 'panel': {
      const items: [string, boolean][] = [['Próximo passo: enviar a proposta', false], ['Hábito de hoje: treino', true], ['Foco: 25 minutos', true]];
      items.forEach(([text, done], i) => {
        const y = top + i * 96;
        roundRect(ctx, 130, y, 820, 78, 24);
        ctx.fillStyle = '#161b22';
        ctx.fill();
        ctx.strokeStyle = '#30363d';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(190, y + 39, 22, 0, Math.PI * 2);
        if (done) {
          ctx.fillStyle = a;
          ctx.fill();
          check(ctx, 190, y + 39, 22, DARK);
        } else {
          ctx.strokeStyle = '#484f58';
          ctx.lineWidth = 4;
          ctx.stroke();
        }
        ctx.font = `600 36px ${FONT}`;
        ctx.fillStyle = done ? '#8b949e' : '#f0f6fc';
        ctx.fillText(text, 240, y + 51);
      });
      break;
    }
    case 'price': {
      roundRect(ctx, 190, top + 10, 700, 150, 75);
      ctx.fillStyle = a;
      ctx.fill();
      centerText(ctx, '7 dias grátis', cx, top + 112, `800 78px ${FONT}`, DARK);
      centerText(ctx, 'depois, R$ 39,90 por 30 dias, só se você quiser', cx, top + 225, `500 34px ${FONT}`, MUTED);
      centerText(ctx, 'sem cartão · sem renovação automática', cx, top + 280, `700 34px ${FONT}`, a);
      break;
    }
    case 'apps': {
      const labels = ['Metas', 'Hábitos', 'Foco', 'Quadros', 'Finanças', 'Diário'];
      labels.forEach((label, i) => {
        const x = 90 + (i % 3) * 315;
        const y = top + 20 + Math.floor(i / 3) * 135;
        roundRect(ctx, x, y, 270, 108, 28);
        ctx.fillStyle = '#161b22';
        ctx.fill();
        ctx.strokeStyle = a;
        ctx.lineWidth = 4;
        ctx.stroke();
        centerText(ctx, label, x + 135, y + 68, `700 40px ${FONT}`, '#f0f6fc');
      });
      break;
    }
    case 'diary': {
      const rows: [string, number][] = [['Energia', 4], ['Humor', 3], ['Foco', 5]];
      rows.forEach(([label, v], i) => {
        const y = top + 5 + i * 96;
        ctx.font = `600 42px ${FONT}`;
        ctx.fillStyle = '#c9d1d9';
        ctx.fillText(label, 120, y + 56);
        for (let n = 1; n <= 5; n++) {
          const x = 440 + (n - 1) * 100;
          roundRect(ctx, x, y, 80, 80, 20);
          if (n <= v) {
            ctx.fillStyle = a;
            ctx.fill();
            centerText(ctx, String(n), x + 40, y + 55, `800 38px ${FONT}`, DARK);
          } else {
            ctx.strokeStyle = '#484f58';
            ctx.lineWidth = 4;
            ctx.stroke();
            centerText(ctx, String(n), x + 40, y + 55, `600 38px ${FONT}`, '#6e7681');
          }
        }
      });
      break;
    }
    case 'ring': {
      const cy = top + 150;
      ctx.lineWidth = 28;
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#21262d';
      ctx.beginPath();
      ctx.arc(cx, cy, 138, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = a;
      ctx.beginPath();
      ctx.arc(cx, cy, 138, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * 0.7);
      ctx.stroke();
      centerText(ctx, '17:30', cx, cy + 16, `800 66px ${FONT}`, '#f0f6fc');
      centerText(ctx, 'em foco', cx, cy + 62, `500 30px ${FONT}`, MUTED);
      break;
    }
    case 'monday': {
      const cy = top + 170;
      centerText(ctx, 'SEG', cx - 230, cy, `800 150px ${FONT}`, '#6e7681');
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 16;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx - 400, cy - 55);
      ctx.lineTo(cx - 60, cy - 55);
      ctx.stroke();
      centerText(ctx, '→', cx, cy - 30, `700 80px ${FONT}`, MUTED);
      ctx.shadowColor = a;
      ctx.shadowBlur = 40;
      centerText(ctx, 'HOJE', cx + 235, cy, `800 150px ${FONT}`, a);
      ctx.shadowBlur = 0;
      break;
    }
    case 'invite': {
      roundRect(ctx, 110, top + 10, 650, 110, 40);
      ctx.fillStyle = '#21262d';
      ctx.fill();
      ctx.font = `600 40px ${FONT}`;
      ctx.fillStyle = '#f0f6fc';
      ctx.fillText('Quer testar comigo?', 150, top + 78);
      roundRect(ctx, 320, top + 150, 650, 110, 40);
      ctx.fillStyle = a;
      ctx.fill();
      ctx.font = `700 40px ${FONT}`;
      ctx.fillStyle = DARK;
      ctx.fillText('Bora! Manda o link', 360, top + 218);
      break;
    }
  }
}

export function drawStory(ctx: CanvasRenderingContext2D, m: StoryModel, mode: LinkMode, linkText: string) {
  // fundo
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#0b1220');
  bg.addColorStop(1, '#0d1117');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  const glow = ctx.createRadialGradient(W / 2, 420, 40, W / 2, 420, 760);
  glow.addColorStop(0, `${m.accent}38`);
  glow.addColorStop(1, `${m.accent}00`);
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // marca
  const logo = ctx.createLinearGradient(90, 290, 174, 374);
  logo.addColorStop(0, '#059669');
  logo.addColorStop(1, '#14b8a6');
  roundRect(ctx, 90, 290, 84, 84, 24);
  ctx.fillStyle = logo;
  ctx.fill();
  centerText(ctx, 'R', 132, 350, `800 54px ${FONT}`, '#ffffff');
  ctx.font = `800 48px ${FONT}`;
  ctx.fillStyle = '#e6edf3';
  ctx.fillText('Ritmo', 196, 348);

  // título (cabe em até 3 linhas: reduz a fonte se precisar)
  ctx.textBaseline = 'alphabetic';
  let size = 88;
  let lines: string[] = [];
  for (const s of [88, 80, 72, 64, 56]) {
    size = s;
    ctx.font = `800 ${s}px ${FONT}`;
    lines = wrapLines(ctx, m.headline, 900);
    if (lines.length <= 3) break;
  }
  ctx.fillStyle = '#f0f6fc';
  lines.forEach((l, i) => ctx.fillText(l, 90, 520 + i * (size + 12)));
  const headBottom = 520 + (lines.length - 1) * (size + 12);

  // subtítulo
  ctx.font = `500 40px ${FONT}`;
  ctx.fillStyle = MUTED;
  const subLines = wrapLines(ctx, m.sub, 900).slice(0, 3);
  subLines.forEach((l, i) => ctx.fillText(l, 90, headBottom + 100 + i * 56));
  const subBottom = headBottom + 100 + (subLines.length - 1) * 56;

  // o desenho sobe um pouco quando o texto é curto, mas nunca invade o espaço do link
  drawVisual(ctx, m, Math.max(1010, Math.min(1090, subBottom + 100)));

  // espaço do link
  const lx = 90, ly = 1420, lw = 900, lh = 160;
  if (mode === 'espaco') {
    roundRect(ctx, lx, ly, lw, lh, 40);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fill();
    ctx.setLineDash([22, 16]);
    ctx.strokeStyle = m.accent;
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.setLineDash([]);
    centerText(ctx, 'SEU LINK AQUI', W / 2, ly + 78, `800 46px ${FONT}`, m.accent);
    centerText(ctx, 'cole o adesivo de link do Instagram por cima', W / 2, ly + 126, `500 28px ${FONT}`, MUTED);
  } else if (mode === 'texto') {
    roundRect(ctx, lx, ly, lw, lh, 40);
    ctx.fillStyle = m.accent;
    ctx.fill();
    centerText(ctx, 'Teste 7 dias grátis:', W / 2, ly + 58, `600 32px ${FONT}`, DARK);
    let fs = 54;
    ctx.font = `800 ${fs}px ${FONT}`;
    while (ctx.measureText(linkText).width > lw - 70 && fs > 24) {
      fs -= 2;
      ctx.font = `800 ${fs}px ${FONT}`;
    }
    centerText(ctx, linkText, W / 2, ly + 122, `800 ${fs}px ${FONT}`, DARK);
  }

  centerText(ctx, '7 dias grátis · sem cartão · link de indicação', W / 2, 1635, `500 30px ${FONT}`, '#6e7681');
}

/* ------------------------------------------------------------------ */
/* Componente                                                          */
/* ------------------------------------------------------------------ */

const PREVIEW_W = 216;
const PREVIEW_H = 384;

function Preview({ model, mode, linkText }: { model: StoryModel; mode: LinkMode; linkText: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    const ctx = c?.getContext('2d');
    if (!c || !ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = PREVIEW_W * dpr;
    c.height = PREVIEW_H * dpr;
    ctx.setTransform((PREVIEW_W * dpr) / W, 0, 0, (PREVIEW_H * dpr) / H, 0, 0);
    drawStory(ctx, model, mode, linkText);
  }, [model, mode, linkText]);
  return <canvas ref={ref} role="img" aria-label={`Modelo de story: ${model.headline}`} className="w-full rounded-xl border border-[#30363d]" style={{ aspectRatio: '9 / 16' }} />;
}

function downloadStory(model: StoryModel, mode: LinkMode, linkText: string, index: number) {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  if (!ctx) return;
  drawStory(ctx, model, mode, linkText);
  c.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ritmo-story-${String(index + 1).padStart(2, '0')}-${model.id}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  }, 'image/png');
}

export const StoryGenerator: React.FC<{ referralLink: string }> = ({ referralLink }) => {
  const [mode, setMode] = useState<LinkMode>('espaco');
  const [copied, setCopied] = useState<string | null>(null);
  const linkText = referralLink.replace(/^https?:\/\//, '');

  const copy = async (m: StoryModel) => {
    try {
      await navigator.clipboard.writeText(m.caption.replace('{link}', referralLink));
      setCopied(m.id);
      setTimeout(() => setCopied(null), 1800);
    } catch {
      /* sem permissão de área de transferência */
    }
  };

  const all = () => STORY_MODELS.forEach((m, i) => setTimeout(() => downloadStory(m, mode, linkText, i), i * 450));

  const options: { id: LinkMode; label: string; hint: string }[] = [
    { id: 'espaco', label: 'Deixar espaço para o adesivo de link', hint: 'Recomendado: o Instagram abre o link clicável pelo adesivo.' },
    { id: 'limpo', label: 'Deixar o espaço limpo', hint: 'Sem texto nenhum na área do link.' },
    { id: 'texto', label: 'Escrever o meu link na imagem', hint: 'Útil onde não há adesivo de link (o link na imagem não é clicável).' },
  ];

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-[#30363d] bg-[#161b22] p-5">
        <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider"><Instagram className="w-4 h-4" /> 10 modelos de story</div>
        <h3 className="text-lg font-extrabold text-[#f0f6fc] mt-1">Baixe, poste e adicione o seu link</h3>
        <ol className="text-sm text-[#c9d1d9] mt-2 list-decimal pl-5 space-y-0.5">
          <li>Escolha como quer o espaço do link e baixe o modelo (PNG 1080×1920).</li>
          <li>No Instagram, abra Stories, escolha a imagem e toque no adesivo de <strong>Link</strong>.</li>
          <li>Cole o seu link de indicação e posicione sobre o espaço marcado. Copie a legenda sugerida se quiser.</li>
        </ol>
        <div className="mt-4 grid sm:grid-cols-3 gap-2" role="radiogroup" aria-label="Espaço do link">
          {options.map((o) => (
            <label key={o.id} className={`rounded-xl border p-3 cursor-pointer ${mode === o.id ? 'border-emerald-500/70 bg-emerald-500/10' : 'border-[#30363d]'}`}>
              <input type="radio" name="linkmode" className="sr-only" checked={mode === o.id} onChange={() => setMode(o.id)} />
              <span className="block text-sm font-semibold text-[#f0f6fc]">{o.label}</span>
              <span className="block text-[11px] text-[#8b949e] mt-0.5">{o.hint}</span>
            </label>
          ))}
        </div>
        <button type="button" onClick={all} className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm">
          <Download className="w-4 h-4" /> Baixar os 10 modelos
        </button>
        <p className="text-[11px] text-[#8b949e] mt-2">O navegador pode pedir permissão para baixar vários arquivos de uma vez. Todos os modelos já dizem “link de indicação” e “7 dias grátis, sem cartão”, e nenhum promete ganho.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {STORY_MODELS.map((m, i) => (
          <div key={m.id} className="space-y-2">
            <Preview model={m} mode={mode} linkText={linkText} />
            <div className="text-xs font-semibold text-[#f0f6fc] leading-tight">{i + 1}. {m.name}</div>
            <div className="flex gap-2">
              <button type="button" onClick={() => downloadStory(m, mode, linkText, i)} className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-[11px] font-semibold text-[#f0f6fc]">
                <Download className="w-3.5 h-3.5" /> PNG
              </button>
              <button type="button" onClick={() => copy(m)} className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg border border-[#30363d] text-[11px] font-semibold text-[#c9d1d9] hover:bg-[#21262d]">
                {copied === m.id ? <><Check className="w-3.5 h-3.5 text-emerald-400" /> Copiada</> : <><Copy className="w-3.5 h-3.5" /> Legenda</>}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
