// Regras PURAS do alerta de erros (testadas): limpar, agrupar e ignorar ruído.

export const ERROR_LIMITS = { messageMax: 500, stackMax: 4000, urlMax: 300, uaMax: 300 } as const;

/** Erros que não são do Ritmo (extensões, rede caindo, navegadores antigos) e só fariam barulho. */
const NOISE = [
  /ResizeObserver loop/i,
  /^Script error\.?$/i,
  /chrome-extension:|moz-extension:|safari-extension:/i,
  /Failed to fetch|NetworkError|Load failed|network connection was lost|The Internet connection appears to be offline/i,
  /AbortError|The user aborted a request|The operation was aborted/i,
  /Non-Error promise rejection captured/i,
  /Loading chunk \d+ failed|Failed to fetch dynamically imported module|Importing a module script failed/i,
];

export function isNoise(message: string, stack = ''): boolean {
  return NOISE.some((re) => re.test(message) || re.test(stack));
}

const clip = (v: unknown, max: number) =>
  String(v ?? '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .slice(0, max);

/** Tira dados pessoais óbvios do texto (e-mails, tokens, números longos). */
export function scrub(t: string): string {
  return t
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, '[email]')
    .replace(/\b(eyJ[\w-]+\.[\w-]+\.[\w-]+)\b/g, '[token]')
    .replace(/([?&](?:token|code|k|key|senha|password)=)[^&\s]+/gi, '$1[oculto]')
    .replace(/\b\d{11,}\b/g, '[número]');
}

/** Identifica o "mesmo erro": mensagem sem números + primeira linha útil da pilha. */
export function fingerprint(source: string, message: string, stack: string): string {
  const msg = message.replace(/\d+/g, '#').replace(/["'`].*?["'`]/g, '"…"').slice(0, 200);
  const frame = (stack.split('\n').find((l) => /\bat\b|@/.test(l) && !/node_modules/.test(l)) || '')
    .replace(/https?:\/\/[^/\s]+/g, '')
    .replace(/[?#][^:\s)]*/g, '')
    .replace(/:\d+:\d+/g, '')
    .replace(/-[A-Za-z0-9_-]{6,}\.js/g, '.js')
    .trim()
    .slice(0, 200);
  let h = 2166136261;
  const key = `${source}|${msg}|${frame}`;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36) + ':' + msg.length;
}

export interface CleanError {
  source: 'navegador' | 'servidor';
  message: string;
  stack: string;
  url: string;
  userAgent: string;
}

export function cleanError(raw: any, source: 'navegador' | 'servidor'): CleanError | null {
  const message = scrub(clip(raw?.message, ERROR_LIMITS.messageMax)).trim();
  if (!message) return null;
  const stack = scrub(clip(raw?.stack, ERROR_LIMITS.stackMax));
  if (isNoise(message, stack)) return null;
  return { source, message, stack, url: scrub(clip(raw?.url, ERROR_LIMITS.urlMax)), userAgent: clip(raw?.userAgent, ERROR_LIMITS.uaMax) };
}
