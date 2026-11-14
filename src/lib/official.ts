// Contas oficiais do Ritmo (os fundadores): todo mundo segue e recebe aviso no celular quando elas publicam.
// Regras puras (testadas em tests/ritmo.test.ts). O banco fica em official-db.ts.

export const OFFICIAL_MAX = 5;

/** Lê a lista guardada em app_settings ("[1,7]"). Valor ausente ou quebrado = null (usa o padrão: o master). */
export function parseOfficialIds(raw: string | null | undefined): number[] | null {
  if (raw == null) return null;
  try {
    const v = JSON.parse(raw);
    if (!Array.isArray(v)) return null;
    return [...new Set(v.map(Number).filter((n) => Number.isInteger(n) && n > 0))].slice(0, OFFICIAL_MAX);
  } catch {
    return null;
  }
}

/** Liga ou desliga uma conta na lista, sem repetir e respeitando o máximo. */
export function toggleOfficial(list: number[], userId: number, on: boolean): number[] {
  const rest = list.filter((id) => id !== userId);
  if (!on) return rest;
  if (rest.length >= OFFICIAL_MAX) throw new Error(`No máximo ${OFFICIAL_MAX} contas oficiais.`);
  return [...rest, userId];
}

/** Texto da notificação de uma publicação nova de conta oficial. */
export function officialPostPush(authorName: string, body: string | null | undefined, kind: 'text' | 'photo' | 'achievement' | string) {
  const name = (authorName || 'Ritmo').trim().split(/\s+/)[0] || 'Ritmo';
  const clean = String(body || '').replace(/\s+/g, ' ').trim();
  const text = clean ? (clean.length > 120 ? clean.slice(0, 117).trimEnd() + '...' : clean) : kind === 'photo' ? 'Publicou uma foto nova. Toque para ver.' : kind === 'achievement' ? 'Compartilhou uma conquista. Toque para ver.' : 'Toque para ver a publicação.';
  return { title: `${name} publicou no Ritmo`, body: text };
}
