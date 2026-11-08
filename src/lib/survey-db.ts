// Pesquisa de perfil no banco (com fallback em memória como o resto do app).
import { eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import * as schema from '../../db/schema.js';
import { checkDb } from './server-db.js';
import { SURVEY_VERSION, SurveyAnswers, SurveyStatus, answeredCount, normalizeAnswers } from './survey.js';

export interface SurveyRecord extends SurveyStatus {
  userId: number;
  answers: SurveyAnswers;
  version: number;
  updatedAt: string | null;
}

const mem = new Map<number, SurveyRecord>();
const iso = (v: any) => (v instanceof Date ? v.toISOString() : v ? String(v) : null);

function fromRow(r: any): SurveyRecord {
  return {
    userId: r.userId,
    answers: normalizeAnswers(r.answers),
    version: r.version ?? SURVEY_VERSION,
    completedAt: iso(r.completedAt),
    dismissedAt: iso(r.dismissedAt),
    dismissCount: r.dismissCount ?? 0,
    updatedAt: iso(r.updatedAt),
  };
}

export async function getSurvey(userId: number): Promise<SurveyRecord | null> {
  if (await checkDb()) {
    try {
      const [r] = await db.select().from(schema.profileSurveys).where(eq(schema.profileSurveys.userId, userId)).limit(1);
      return r ? fromRow(r) : null;
    } catch (e) {
      console.error('[pesquisa] ler', e);
    }
  }
  return mem.get(userId) || null;
}

async function upsert(userId: number, values: Partial<Record<string, unknown>>) {
  const now = new Date();
  if (await checkDb()) {
    try {
      await db
        .insert(schema.profileSurveys)
        .values({ userId, ...(values as any), updatedAt: now })
        .onConflictDoUpdate({ target: schema.profileSurveys.userId, set: { ...(values as any), updatedAt: now } });
      return;
    } catch (e) {
      console.error('[pesquisa] salvar', e);
    }
  }
  const cur: SurveyRecord = mem.get(userId) || { userId, answers: {}, version: SURVEY_VERSION, completedAt: null, dismissedAt: null, dismissCount: 0, updatedAt: null };
  const next: SurveyRecord = { ...cur, updatedAt: now.toISOString() };
  if ('answers' in values) next.answers = normalizeAnswers(values.answers);
  if ('version' in values) next.version = Number(values.version);
  if ('completedAt' in values) next.completedAt = iso(values.completedAt);
  if ('dismissedAt' in values) next.dismissedAt = iso(values.dismissedAt);
  if ('dismissCount' in values) next.dismissCount = Number(values.dismissCount);
  mem.set(userId, next);
}

/** Salva as respostas (já filtradas). Conta como respondida quando tem pelo menos uma resposta. */
export async function saveSurvey(userId: number, raw: unknown): Promise<SurveyRecord | null> {
  const answers = normalizeAnswers(raw);
  if (answeredCount(answers) === 0) return getSurvey(userId);
  await upsert(userId, { answers: JSON.stringify(answers), version: SURVEY_VERSION, completedAt: new Date() });
  return getSurvey(userId);
}

/** "Agora não": guarda quando foi para perguntar de novo só depois de alguns dias. */
export async function dismissSurvey(userId: number): Promise<SurveyRecord | null> {
  const cur = await getSurvey(userId);
  if (cur?.completedAt) return cur;
  await upsert(userId, { dismissedAt: new Date(), dismissCount: (cur?.dismissCount || 0) + 1 });
  return getSurvey(userId);
}

/** Apagar as respostas (a pessoa pode a qualquer momento). Não pergunta de novo sozinho. */
export async function clearSurvey(userId: number): Promise<void> {
  await upsert(userId, { answers: '{}', completedAt: null, dismissedAt: new Date(), dismissCount: 99 });
}

/** Todas as pesquisas (para o painel: resumo do público e planilha). */
export async function listAllSurveys(): Promise<SurveyRecord[]> {
  if (await checkDb()) {
    try {
      const rows = await db.select().from(schema.profileSurveys);
      return rows.map(fromRow);
    } catch (e) {
      console.error('[pesquisa] listar', e);
    }
  }
  return [...mem.values()];
}
