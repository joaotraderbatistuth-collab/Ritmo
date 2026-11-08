// Exportação de TODOS os dados da pessoa (direito de portabilidade/acesso da LGPD, art. 18).
// Sai em JSON, direto do banco, sem senha, códigos de recuperação nem chaves técnicas.
import { eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import * as schema from '../../db/schema.js';
import { checkDb, findUserById } from './server-db.js';

type AnyTable = any;

/** Tabelas com os dados da pessoa e a coluna que aponta para ela. */
const OWN: [string, AnyTable, string][] = [
  ['ciclos', schema.focusCycles, 'userId'],
  ['marcos_do_roteiro', schema.cycleMilestones, 'userId'],
  ['tarefas', schema.tasks, 'userId'],
  ['habitos', schema.habits, 'userId'],
  ['registros_de_habitos', schema.habitLogs, 'userId'],
  ['sessoes_de_foco', schema.focusSessions, 'userId'],
  ['diario', schema.journalEntries, 'userId'],
  ['lancamentos_financeiros', schema.financeTransactions, 'userId'],
  ['orcamentos', schema.financeBudgets, 'userId'],
  ['quadros', schema.boards, 'userId'],
  ['listas_dos_quadros', schema.boardLists, 'userId'],
  ['cards', schema.boardCards, 'userId'],
  ['checklists', schema.boardChecklistItems, 'userId'],
  ['comentarios_dos_cards', schema.boardCardComments, 'userId'],
  ['treinos', schema.workouts, 'userId'],
  ['lembretes', schema.reminders, 'userId'],
  ['publicacoes_no_feed', schema.feedPosts, 'userId'],
  ['comentarios_no_feed', schema.feedComments, 'userId'],
  ['curtidas', schema.feedLikes, 'userId'],
  ['ritus_criados', schema.teams, 'ownerUserId'],
  ['ritus_que_participa', schema.teamMembers, 'userId'],
  ['pagamentos', schema.payments, 'userId'],
  ['assinaturas', schema.subscriptions, 'userId'],
  ['indicacoes_feitas', schema.affiliateReferrals, 'affiliateUserId'],
  ['comissoes', schema.affiliateCommissions, 'affiliateUserId'],
  ['saques', schema.affiliateWithdrawals, 'affiliateUserId'],
  ['consentimentos', schema.consents, 'userId'],
  ['dias_de_uso', schema.userActivity, 'userId'],
  ['baus_das_missoes', schema.missionDays, 'userId'],
  ['ligas_semanais', schema.leagueWeeks, 'userId'],
  ['pessoas_que_voce_segue', schema.follows, 'followerId'],
  ['pesquisa_de_gostos', schema.profileSurveys, 'userId'],
  ['temporadas_mensais', schema.seasonMonths, 'userId'],
];

/** Campos que nunca saem na exportação. */
const HIDDEN = new Set(['passwordHash', 'p256dh', 'auth', 'data']);

function clean(row: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) if (!HIDDEN.has(k)) out[k] = v instanceof Date ? v.toISOString() : v;
  return out;
}

export async function exportUserData(userId: number) {
  const user = await findUserById(userId);
  if (!user) return null;
  const result: Record<string, unknown> = {
    exportado_em: new Date().toISOString(),
    plataforma: 'Ritmo',
    observacao: 'Cópia de todos os dados ligados à sua conta. Senhas e chaves técnicas não são incluídas.',
    conta: clean(user as any),
  };
  if (!(await checkDb())) return result;
  for (const [name, table, col] of OWN) {
    try {
      const rows = await db.select().from(table).where(eq(table[col], userId));
      result[name] = rows.map((r: any) => clean(r));
    } catch {
      result[name] = [];
    }
  }
  try {
    const media = await db
      .select({ key: schema.media.key, purpose: schema.media.purpose, mime: schema.media.mime, sizeBytes: schema.media.sizeBytes, createdAt: schema.media.createdAt })
      .from(schema.media)
      .where(eq(schema.media.ownerUserId, userId));
    result.fotos_e_arquivos = media.map((m) => ({ ...clean(m as any), url: `/api/media?k=${m.key}` }));
  } catch {
    result.fotos_e_arquivos = [];
  }
  try {
    const subs = await db.select({ createdAt: schema.pushSubscriptions.createdAt, perDay: schema.pushSubscriptions.perDay }).from(schema.pushSubscriptions).where(eq(schema.pushSubscriptions.userId, userId));
    result.aparelhos_com_notificacao = subs.map((x) => clean(x as any));
  } catch {
    result.aparelhos_com_notificacao = [];
  }
  return result;
}
