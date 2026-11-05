// Regras PURAS do envio de notificação pelo painel admin (sem banco, testadas).

export const NOTIFY_TABS = [
  { id: 'feed', label: 'Feed' },
  { id: 'hoje', label: 'Hoje' },
  { id: 'roteiro', label: 'Roteiro de Metas' },
  { id: 'rotina', label: 'Rotina & Tarefas' },
  { id: 'quadros', label: 'Quadros' },
  { id: 'habitos', label: 'Hábitos & Saúde' },
  { id: 'treino', label: 'Treino' },
  { id: 'foco', label: 'Sessões de Foco' },
  { id: 'diario', label: 'Diário & Revisões' },
  { id: 'financas', label: 'Finanças Pessoais' },
  { id: 'afiliados', label: 'Indique e Ganhe' },
  { id: 'progresso', label: 'Progresso' },
  { id: 'configuracoes', label: 'Configurações' },
] as const;

export type NotifyTarget = 'me' | 'email' | 'all';

export const NOTIFY_LIMITS = { title: 60, body: 180 };
/** Intervalo mínimo entre dois envios para TODOS (minutos). */
export const BROADCAST_COOLDOWN_MIN = 10;

export interface AdminNotification {
  title: string;
  body: string;
  tab: string;
  target: NotifyTarget;
  email: string | null;
}

const clean = (v: unknown) => String(v ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim();

export function validateAdminNotification(input: any): { ok: true; value: AdminNotification } | { ok: false; error: string } {
  const title = clean(input?.title);
  const body = clean(input?.body);
  if (!title) return { ok: false, error: 'Escreva o título da notificação.' };
  if (title.length > NOTIFY_LIMITS.title) return { ok: false, error: `O título pode ter até ${NOTIFY_LIMITS.title} caracteres.` };
  if (!body) return { ok: false, error: 'Escreva a mensagem da notificação.' };
  if (body.length > NOTIFY_LIMITS.body) return { ok: false, error: `A mensagem pode ter até ${NOTIFY_LIMITS.body} caracteres.` };
  const tab = NOTIFY_TABS.some((t) => t.id === input?.tab) ? String(input.tab) : 'hoje';
  const target: NotifyTarget = input?.target === 'all' || input?.target === 'email' ? input.target : 'me';
  let email: string | null = null;
  if (target === 'email') {
    email = clean(input?.email).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) return { ok: false, error: 'Informe um e-mail válido.' };
  }
  if (target === 'all' && input?.confirm !== true) return { ok: false, error: 'Confirme o envio para todos.' };
  return { ok: true, value: { title, body, tab, target, email } };
}

/** Minutos que ainda faltam para poder enviar para todos de novo (0 = liberado). */
export function broadcastWaitMinutes(lastSentAt: Date | null, now: Date = new Date()): number {
  if (!lastSentAt) return 0;
  const passed = (now.getTime() - lastSentAt.getTime()) / 60000;
  return passed >= BROADCAST_COOLDOWN_MIN ? 0 : Math.ceil(BROADCAST_COOLDOWN_MIN - passed);
}
