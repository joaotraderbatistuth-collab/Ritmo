// Treinos: gravar, listar e apagar. Usa o banco; sem banco, guarda na memória do servidor
// (igual ao resto do app), para nada quebrar durante a configuração inicial.
import { and, desc, eq } from 'drizzle-orm';
import { db } from '../../db/index.js';
import * as schema from '../../db/schema.js';
import { checkDb } from './server-db.js';
import type { Split, SportId, WorkoutInput } from './workout.js';

export interface WorkoutItem {
  id: number;
  userId: number;
  sport: SportId;
  title: string;
  notes: string;
  startedAt: string;
  movingS: number;
  elapsedS: number;
  distanceM: number;
  elevationGainM: number | null;
  route: string;
  splits: Split[];
  source: 'gps' | 'manual';
  createdAt: string;
}

const mem: WorkoutItem[] = [];
let memId = 0;

const iso = (v: any) => (v instanceof Date ? v.toISOString() : String(v || ''));

function parseSplits(raw: unknown): Split[] {
  try {
    const arr = JSON.parse(String(raw || '[]'));
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function fromRow(r: typeof schema.workouts.$inferSelect): WorkoutItem {
  return {
    id: r.id,
    userId: r.userId,
    sport: r.sport as SportId,
    title: r.title,
    notes: r.notes,
    startedAt: iso(r.startedAt),
    movingS: r.movingS,
    elapsedS: r.elapsedS,
    distanceM: r.distanceM,
    elevationGainM: r.elevationGainM ?? null,
    route: r.route,
    splits: parseSplits(r.splits),
    source: r.source === 'manual' ? 'manual' : 'gps',
    createdAt: iso(r.createdAt),
  };
}

/** Lista os treinos (mais recentes primeiro). `withRoute=false` deixa a resposta leve. */
export async function listWorkouts(userId: number, limit = 200): Promise<WorkoutItem[]> {
  if (await checkDb()) {
    try {
      const rows = await db.select().from(schema.workouts).where(eq(schema.workouts.userId, userId)).orderBy(desc(schema.workouts.startedAt)).limit(limit);
      return rows.map(fromRow);
    } catch (e) {
      console.error('[treinos] listar', e);
    }
  }
  return mem.filter((w) => w.userId === userId).sort((a, b) => b.startedAt.localeCompare(a.startedAt)).slice(0, limit);
}

export async function getWorkout(userId: number, id: number): Promise<WorkoutItem | null> {
  if (await checkDb()) {
    try {
      const [row] = await db.select().from(schema.workouts).where(and(eq(schema.workouts.id, id), eq(schema.workouts.userId, userId)));
      return row ? fromRow(row) : null;
    } catch (e) {
      console.error('[treinos] abrir', e);
    }
  }
  return mem.find((w) => w.id === id && w.userId === userId) || null;
}

export async function createWorkout(userId: number, w: WorkoutInput): Promise<WorkoutItem> {
  if (await checkDb()) {
    try {
      const [row] = await db
        .insert(schema.workouts)
        .values({
          userId,
          sport: w.sport,
          title: w.title,
          notes: w.notes,
          startedAt: new Date(w.startedAt),
          movingS: w.movingS,
          elapsedS: w.elapsedS,
          distanceM: w.distanceM,
          elevationGainM: w.elevationGainM,
          route: w.route,
          splits: JSON.stringify(w.splits),
          source: w.source,
        })
        .returning();
      return fromRow(row);
    } catch (e) {
      console.error('[treinos] salvar', e);
    }
  }
  const item: WorkoutItem = { id: ++memId, userId, ...w, createdAt: new Date().toISOString() };
  mem.push(item);
  return item;
}

/** Edita título, notas e data/hora de início de um treino da própria pessoa. */
export async function updateWorkout(userId: number, id: number, patch: { title?: string; notes?: string; startedAt?: Date }): Promise<WorkoutItem | null> {
  if (!Object.keys(patch).length) return null;
  if (await checkDb()) {
    try {
      const [row] = await db.update(schema.workouts).set(patch).where(and(eq(schema.workouts.id, id), eq(schema.workouts.userId, userId))).returning();
      return row ? fromRow(row) : null;
    } catch (e) {
      console.error('[treinos] editar', e);
    }
  }
  const w = mem.find((x) => x.id === id && x.userId === userId);
  if (!w) return null;
  if (patch.title !== undefined) w.title = patch.title;
  if (patch.notes !== undefined) w.notes = patch.notes;
  if (patch.startedAt) w.startedAt = patch.startedAt.toISOString();
  return w;
}

export async function deleteWorkout(userId: number, id: number): Promise<boolean> {
  if (await checkDb()) {
    try {
      const removed = await db.delete(schema.workouts).where(and(eq(schema.workouts.id, id), eq(schema.workouts.userId, userId))).returning({ id: schema.workouts.id });
      return removed.length > 0;
    } catch (e) {
      console.error('[treinos] apagar', e);
    }
  }
  const i = mem.findIndex((w) => w.id === id && w.userId === userId);
  if (i < 0) return false;
  mem.splice(i, 1);
  return true;
}

/** Quantos treinos a pessoa salvou na última hora (evita abuso). */
export async function recentWorkoutCount(userId: number): Promise<number> {
  const hourAgo = Date.now() - 3600_000;
  const list = await listWorkouts(userId, 50);
  return list.filter((w) => new Date(w.createdAt).getTime() > hourAgo).length;
}
