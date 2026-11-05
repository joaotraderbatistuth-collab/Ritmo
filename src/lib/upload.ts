// Envio de fotos e comprovantes a partir do navegador.
// Fotos são reduzidas (lado maior até 1600 px, JPEG ~82%) antes de subir: ficam leves no celular.

const MAX_SIDE = 1600;
const MAX_INPUT_BYTES = 25 * 1024 * 1024;

function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
    r.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Este arquivo não é uma imagem válida.'));
    img.src = src;
  });
}

/** Foto → data URL JPEG reduzida. GIF fica como está (para não perder a animação), se for pequeno. */
export async function compressImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Escolha uma foto (JPG, PNG ou WEBP).');
  if (file.size > MAX_INPUT_BYTES) throw new Error('Foto grande demais.');
  const original = await readAsDataUrl(file);
  if (file.type === 'image/gif' && file.size < 2.5 * 1024 * 1024) return original;
  const img = await loadImage(original);
  const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return original;
  ctx.fillStyle = '#ffffff'; // PNG transparente vira fundo branco no JPEG
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', 0.82);
}

/** Foto de perfil → quadrado de 512 px recortado no centro (JPEG ~85%). */
export async function compressAvatar(file: File, side = 512): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Escolha uma foto (JPG, PNG ou WEBP).');
  if (file.size > MAX_INPUT_BYTES) throw new Error('Foto grande demais.');
  const img = await loadImage(await readAsDataUrl(file));
  const crop = Math.min(img.naturalWidth, img.naturalHeight);
  const sx = Math.round((img.naturalWidth - crop) / 2);
  const sy = Math.round((img.naturalHeight - crop) / 2);
  const out = Math.min(side, crop);
  const canvas = document.createElement('canvas');
  canvas.width = out;
  canvas.height = out;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Não foi possível preparar a foto.');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, out, out);
  ctx.drawImage(img, sx, sy, crop, crop, 0, 0, out, out);
  return canvas.toDataURL('image/jpeg', 0.85);
}

/** Sobe o arquivo e devolve a URL (/api/media?k=...). Comprovante aceita PDF além de foto. */
export async function uploadFile(file: File, purpose: 'feed' | 'receipt' = 'feed'): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  try {
    let dataUrl: string;
    if (purpose === 'receipt' && file.type === 'application/pdf') {
      if (file.size > 3 * 1024 * 1024) return { ok: false, error: 'PDF grande demais (máximo 3 MB).' };
      dataUrl = await readAsDataUrl(file);
    } else {
      dataUrl = await compressImage(file);
    }
    const res = await fetch('/api/media', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dataUrl, purpose }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.error || 'Não foi possível enviar o arquivo.' };
    return { ok: true, url: data.url };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'Não foi possível enviar o arquivo.' };
  }
}
