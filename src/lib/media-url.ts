// Regras PURAS dos endereços de fotos e comprovantes (testadas em tests/).

/** URL pública (exige login) de um arquivo salvo. */
export const mediaUrl = (key: string) => `/api/media?k=${key}`;

/** Aceita só o formato que o próprio app gera: /api/media?k=<32 hex>. */
export function parseMediaUrl(url: unknown): string | null {
  const m = /^\/api\/media\?k=([a-f0-9]{32})$/.exec(String(url || ''));
  return m ? m[1] : null;
}

/** Imagens que acompanham as publicações iniciais dos Ritus gratuitos (pasta public/ritus). */
export function isBundledImage(url: unknown): boolean {
  return /^\/ritus\/[a-z0-9-]+\.(svg|png|jpg|webp)$/.test(String(url || ''));
}
