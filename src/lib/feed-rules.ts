// Regras PURAS do Feed (texto, conquistas, limites e datas), testadas em tests/.
import { levelDef, MAX_LEVEL } from './levels.js';

export const FEED_LIMITS = {
  postMax: 2000,
  commentMax: 500,
  reportReasonMax: 300,
  postsPerHour: 10,
  commentsPerHour: 40,
  reportsPerDay: 20,
  /** Quantas denúncias de pessoas diferentes escondem o conteúdo até a análise. */
  autoHideReports: 3,
} as const;

/** Tira caracteres de controle, apara e limita. Devolve '' se sobrar nada. Nunca interpreta HTML. */
export function normalizeText(raw: unknown, max: number): string {
  const t = String(raw ?? '')
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u200B-\u200F\u202A-\u202E]/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return t.slice(0, max);
}

/** "João Batista da Silva" -> "João S." (privacidade: não mostra o nome completo no feed). */
export function displayName(name: string | null | undefined): string {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'Usuário';
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

export function initials(name: string | null | undefined): string {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

/* ---------------- Conquistas compartilháveis ---------------- */

export type Achievement =
  | { type: 'corrente'; habit: string; weeks: number }
  | { type: 'foco'; minutes: number }
  | { type: 'tarefas'; done: number; total: number }
  | { type: 'meta'; title: string; day: number; totalDays: number }
  | { type: 'sessao'; minutes: number; goal?: string }
  | { type: 'card'; title: string; board?: string }
  | { type: 'habito'; habit: string }
  | { type: 'tarefa'; title: string }
  | { type: 'nivel'; level: number; name: string };

const int = (v: unknown, min: number, max: number): number | null => {
  const n = Number(v);
  return Number.isInteger(n) && n >= min && n <= max ? n : null;
};

/** Valida e limpa a conquista vinda do navegador. Qualquer coisa fora do formato vira null. */
export function sanitizeAchievement(raw: unknown): Achievement | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  switch (r.type) {
    case 'corrente': {
      const weeks = int(r.weeks, 1, 520);
      const habit = normalizeText(r.habit, 60);
      return weeks && habit ? { type: 'corrente', habit, weeks } : null;
    }
    case 'foco': {
      const minutes = int(r.minutes, 1, 100000);
      return minutes ? { type: 'foco', minutes } : null;
    }
    case 'tarefas': {
      const total = int(r.total, 1, 10000);
      const done = int(r.done, 0, 10000);
      return total && done !== null && done <= total ? { type: 'tarefas', done, total } : null;
    }
    case 'meta': {
      const title = normalizeText(r.title, 120);
      const totalDays = int(r.totalDays, 1, 3650);
      const day = int(r.day, 1, 3650);
      return title && totalDays && day && day <= totalDays ? { type: 'meta', title, day, totalDays } : null;
    }
    case 'sessao': {
      const minutes = int(r.minutes, 1, 1440);
      const goal = normalizeText(r.goal, 80);
      return minutes ? { type: 'sessao', minutes, ...(goal ? { goal } : {}) } : null;
    }
    case 'card': {
      const title = normalizeText(r.title, 100);
      const board = normalizeText(r.board, 60);
      return title ? { type: 'card', title, ...(board ? { board } : {}) } : null;
    }
    case 'habito': {
      const habit = normalizeText(r.habit, 60);
      return habit ? { type: 'habito', habit } : null;
    }
    case 'tarefa': {
      const title = normalizeText(r.title, 100);
      return title ? { type: 'tarefa', title } : null;
    }
    case 'nivel': {
      // o nome vem sempre da tabela de níveis, nunca do navegador
      const level = int(r.level, 2, MAX_LEVEL);
      return level ? { type: 'nivel', level, name: levelDef(level).name } : null;
    }
    default:
      return null;
  }
}

export function achievementHeadline(a: Achievement): string {
  switch (a.type) {
    case 'corrente':
      return `${a.weeks} ${a.weeks === 1 ? 'semana seguida' : 'semanas seguidas'} cumprindo a meta de “${a.habit}”`;
    case 'foco':
      return `${a.minutes} minutos de foco nesta semana`;
    case 'tarefas':
      return `${a.done} de ${a.total} tarefas concluídas nesta semana`;
    case 'meta':
      return `Dia ${a.day} de ${a.totalDays} da meta “${a.title}”`;
    case 'sessao':
      return `Sessão de foco de ${a.minutes} minutos concluída${a.goal ? `: “${a.goal}”` : ''}`;
    case 'card':
      return `Card concluído: “${a.title}”${a.board ? ` (${a.board})` : ''}`;
    case 'habito':
      return `Hábito de hoje cumprido: “${a.habit}”`;
    case 'tarefa':
      return `Tarefa concluída: “${a.title}”`;
    case 'nivel':
      return `Subiu para o nível ${a.level}: ${a.name}`;
  }
}

export function parsePayload(raw: string | null | undefined): Achievement | null {
  if (!raw) return null;
  try {
    return sanitizeAchievement(JSON.parse(raw));
  } catch {
    return null;
  }
}

/* ---------------- Limites e datas ---------------- */

/** true se já houve `max` ou mais ações dentro da janela. `timestamps` em ms. */
export function rateLimited(timestamps: number[], windowMs: number, max: number, now: number = Date.now()): boolean {
  return timestamps.filter((t) => now - t < windowMs).length >= max;
}

export function timeAgo(iso: string | Date | null | undefined, now: Date = new Date()): string {
  if (!iso) return '';
  const diff = now.getTime() - new Date(iso).getTime();
  if (Number.isNaN(diff)) return '';
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'agora há pouco';
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `há ${d} ${d === 1 ? 'dia' : 'dias'}`;
  return new Date(iso).toLocaleDateString('pt-BR');
}

export const REPORT_REASONS = ['Spam ou propaganda', 'Ofensa ou assédio', 'Conteúdo enganoso ou perigoso', 'Conteúdo sexual ou impróprio', 'Outro motivo'] as const;
