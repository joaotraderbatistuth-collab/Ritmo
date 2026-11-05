// Conversão de valores digitados pela pessoa (pt-BR) para centavos. Lógica PURA, testada em tests/.

/** "1.234,56", "1234,56", "1234.56" ou "50" → centavos. Vazio ou inválido → null. */
export function parseBRLToCents(raw: string): number | null {
  const t = raw.trim().replace(/[R$\s]/g, '');
  if (!t) return null;
  const normalized = t.includes(',') ? t.replace(/\./g, '').replace(',', '.') : t;
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  return Math.round(Number(normalized) * 100);
}
