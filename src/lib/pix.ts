// Validação e normalização de chave Pix — lógica PURA, usada na tela e no servidor.

export type PixKeyType = 'cpf' | 'email' | 'telefone' | 'aleatoria';

export const PIX_TYPES: { value: PixKeyType; label: string; placeholder: string }[] = [
  { value: 'cpf', label: 'CPF', placeholder: '000.000.000-00' },
  { value: 'email', label: 'E-mail', placeholder: 'voce@email.com' },
  { value: 'telefone', label: 'Celular', placeholder: '(24) 99999-9999' },
  { value: 'aleatoria', label: 'Chave aleatória', placeholder: '123e4567-e89b-12d3-a456-426614174000' },
];

function isValidCpf(digits: string): boolean {
  if (!/^\d{11}$/.test(digits) || /^(\d)\1{10}$/.test(digits)) return false;
  const calc = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(digits[i]) * (len + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return calc(9) === Number(digits[9]) && calc(10) === Number(digits[10]);
}

export interface PixResult {
  ok: boolean;
  /** Chave no formato guardado (CPF e celular só com números, e-mail em minúsculas). */
  value: string;
  error?: string;
}

export function validatePix(rawKey: string, type: PixKeyType): PixResult {
  const raw = (rawKey || '').trim();
  if (!raw) return { ok: false, value: '', error: 'Informe a chave Pix.' };

  if (type === 'cpf') {
    const digits = raw.replace(/\D/g, '');
    return isValidCpf(digits) ? { ok: true, value: digits } : { ok: false, value: digits, error: 'CPF inválido. Confira os 11 números.' };
  }
  if (type === 'email') {
    const v = raw.toLowerCase();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && v.length <= 120 ? { ok: true, value: v } : { ok: false, value: v, error: 'E-mail inválido.' };
  }
  if (type === 'telefone') {
    let d = raw.replace(/\D/g, '');
    if ((d.length === 12 || d.length === 13) && d.startsWith('55')) d = d.slice(2); // tira o +55
    const ddd = Number(d.slice(0, 2));
    const okLen = d.length === 10 || (d.length === 11 && d[2] === '9');
    return okLen && ddd >= 11 && ddd <= 99 ? { ok: true, value: d } : { ok: false, value: d, error: 'Celular inválido. Use DDD + número, por exemplo (24) 99999-9999.' };
  }
  const v = raw.toLowerCase();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(v)
    ? { ok: true, value: v }
    : { ok: false, value: v, error: 'Chave aleatória inválida. Copie exatamente como aparece no seu banco.' };
}

/** Mostra a chave de forma legível (CPF e celular formatados). */
export function formatPix(value: string, type: PixKeyType): string {
  if (type === 'cpf' && /^\d{11}$/.test(value)) return value.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  if (type === 'telefone') {
    if (/^\d{11}$/.test(value)) return value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    if (/^\d{10}$/.test(value)) return value.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return value;
}
