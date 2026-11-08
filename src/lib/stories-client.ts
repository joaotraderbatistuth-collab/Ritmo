// Lado do app dos stories: publicar, "ao vivo" e a opção automática.
import type { ShareCard } from './share-card.js';

let autoOn = false;
/** O app avisa se a pessoa ligou "publicar minhas conquistas nos stories" (padrão: desligado). */
export function setStoryAutoFlag(v: boolean) {
  autoOn = Boolean(v);
}
export const storyAutoOn = () => autoOn;

export const STORIES_CHANGED = 'ritmo:stories-changed';
const changed = () => {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(STORIES_CHANGED));
};

async function post(body: Record<string, unknown>) {
  try {
    const res = await fetch('/api/stories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, data };
  } catch {
    return { ok: false, data: { error: 'Sem conexão.' } as any };
  }
}

const cardBody = (c: ShareCard) => ({ kind: c.kind, emoji: c.emoji, tag: c.tag, title: c.title, subtitle: c.subtitle, big: c.big, bigLabel: c.bigLabel, color: c.color });

/** Publica nos stories do Ritmo (24 h). `auto` = veio de uma conquista, só se a pessoa ligou a opção. */
export async function postStory(card: ShareCard, auto = false): Promise<{ ok: boolean; error?: string }> {
  if (auto && !autoOn) return { ok: false };
  const r = await post({ action: 'create', card: cardBody(card), auto });
  if (r.ok) changed();
  return { ok: r.ok, error: r.data?.error };
}

/** "Treinando agora" / "Em foco agora" (só com a opção automática ligada). */
export function liveStart(kind: 'treino' | 'foco', detail: string, minutes?: number) {
  if (!autoOn) return;
  post({ action: 'live_start', kind, detail, minutes }).then((r) => r.ok && changed());
}

export function liveStop() {
  if (!autoOn) return;
  post({ action: 'live_stop' }).then((r) => r.ok && changed());
}
