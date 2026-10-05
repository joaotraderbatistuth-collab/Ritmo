import { eq, desc, and, sql } from 'drizzle-orm';
import { db } from '../../db/index.js';
import * as schema from '../../db/schema.js';
import {
  FocusCycle,
  TaskItem,
  HabitItem,
  HabitLogItem,
  FocusSessionItem,
  JournalEntryItem,
  FinanceTransactionItem,
  IntegrationsConfigItem,
  AffiliateCommissionItem,
  AffiliateReferralItem,
  BoardItem,
  BoardListItem,
  BoardCardItem,
  BoardChecklistItemType,
  BoardCardCommentItem,
} from './types.js';

// In-memory fallback store if database is offline or in provisioning
const nowIso = new Date().toISOString();
const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

const memStore = {
  users: [
    {
      id: 1,
      name: 'Carlos Silveira',
      email: 'carlos@ritmofoco.com.br',
      passwordHash: '$2a$10$wT6w14E6cIom1R/U6R8VTuS3j9gE26iF92rBqN81U2wG5Vl1fN06S', // hashed 'senha123'
      role: 'user',
      subscriptionStatus: 'trial',
      trialEndsAt: sevenDaysLater,
      subscriptionRenewalDate: null,
      pixKey: 'carlos@ritmofoco.com.br',
      pixKeyType: 'email',
      timezone: 'America/Sao_Paulo',
      themePreference: 'dark',
      referralCode: 'RITMO-CARLOS',
      referredBy: null,
      whatsappPhone: '11987654321',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 2,
      name: 'Administrador Ritmo',
      email: 'admin@ritmofoco.com.br',
      passwordHash: '$2a$10$wT6w14E6cIom1R/U6R8VTuS3j9gE26iF92rBqN81U2wG5Vl1fN06S', // hashed 'senha123'
      role: 'admin',
      subscriptionStatus: 'active',
      trialEndsAt: null,
      subscriptionRenewalDate: thirtyDaysLater,
      pixKey: 'admin@ritmofoco.com.br',
      pixKeyType: 'email',
      timezone: 'America/Sao_Paulo',
      themePreference: 'dark',
      referralCode: 'RITMO-ADMIN',
      referredBy: null,
      whatsappPhone: '11999998888',
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 3,
      name: 'Mariana Duarte',
      email: 'mariana.duarte@email.com',
      passwordHash: '$2a$10$wT6w14E6cIom1R/U6R8VTuS3j9gE26iF92rBqN81U2wG5Vl1fN06S',
      role: 'user',
      subscriptionStatus: 'active',
      trialEndsAt: null,
      subscriptionRenewalDate: thirtyDaysLater,
      pixKey: '12345678909',
      pixKeyType: 'cpf',
      timezone: 'America/Sao_Paulo',
      themePreference: 'dark',
      referralCode: 'RITMO-MARI',
      referredBy: 'RITMO-CARLOS',
      whatsappPhone: '21988887777',
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
      updatedAt: nowIso,
    },
    {
      id: 4,
      name: 'Lucas Ferreira',
      email: 'lucas.dev@email.com',
      passwordHash: '$2a$10$wT6w14E6cIom1R/U6R8VTuS3j9gE26iF92rBqN81U2wG5Vl1fN06S',
      role: 'user',
      subscriptionStatus: 'trial',
      trialEndsAt: new Date(Date.now() + 3 * 86400000).toISOString(),
      subscriptionRenewalDate: null,
      pixKey: null,
      pixKeyType: 'cpf',
      timezone: 'America/Sao_Paulo',
      themePreference: 'dark',
      referralCode: 'RITMO-LUCAS',
      referredBy: 'RITMO-CARLOS',
      whatsappPhone: null,
      createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
      updatedAt: nowIso,
    },
  ] as any[],
  cycles: [] as any[],
  tasks: [] as any[],
  habits: [] as any[],
  habitLogs: [] as any[],
  focusSessions: [] as any[],
  journalEntries: [] as any[],
  financeTransactions: [] as any[],
  financeBudgets: [] as any[],
  integrations: [] as any[],
  boards: [] as any[],
  boardLists: [] as any[],
  boardCards: [] as any[],
  boardChecklistItems: [] as any[],
  boardCardComments: [] as any[],
  affiliateReferrals: [
    {
      id: 1,
      affiliateUserId: 1,
      referredUserId: 3,
      referralCode: 'RITMO-CARLOS',
      clickCount: 14,
      status: 'converted',
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    },
    {
      id: 2,
      affiliateUserId: 1,
      referredUserId: 4,
      referralCode: 'RITMO-CARLOS',
      clickCount: 8,
      status: 'active',
      createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    },
  ] as any[],
  affiliateCommissions: [
    {
      id: 1,
      affiliateUserId: 1,
      referredUserId: 3,
      orderReference: 'ORD-RTM-INIT-01',
      baseAmountCents: 3990,
      commissionRatePercent: 60,
      commissionCents: 2394, // 60% of R$ 39,90 = R$ 23,94
      status: 'approved',
      payoutReference: null,
      payoutStatus: 'manual',
      notes: 'Indicação convertida em assinatura PRO',
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    },
  ] as any[],
  affiliateSettings: {
    commissionRatePercent: 60,
    attributionWindowDays: 60,
    minPayoutCents: 2394,
    terms: 'Comissão de 60% (R$ 23,94) sobre pagamentos recorrentes líquidos elegíveis de novos assinantes pagos indicados via link único. Resgate via chave PIX.',
  },
  passwordResetTokens: [] as any[],
  subscriptions: [
    {
      id: 1,
      userId: 2,
      plan: 'pro_monthly',
      amountCents: 3990,
      status: 'active',
      provider: 'pix_mercadopago',
      renewalDate: thirtyDaysLater,
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    {
      id: 2,
      userId: 3,
      plan: 'pro_monthly',
      amountCents: 3990,
      status: 'active',
      provider: 'pix_mercadopago',
      renewalDate: thirtyDaysLater,
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
      updatedAt: nowIso,
    },
  ] as any[],
  payments: [
    {
      id: 1,
      userId: 3,
      orderReference: 'ORD-RTM-INIT-01',
      amountCents: 3990,
      discountCents: 0,
      couponCode: null,
      status: 'paid',
      paymentMethod: 'pix',
      paidAt: new Date(Date.now() - 15 * 86400000).toISOString(),
      pixQrCode: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"></svg>',
      pixCopiaECola: '00020126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-426614174000520400005303986540539.905802BR5913Ritmo Foco6009Sao Paulo62070503***6304ABCD',
      invoiceUrl: '#fatura-01',
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
    },
  ] as any[],
  coupons: [
    {
      id: 1,
      code: 'RITMO10',
      discountPercent: 10,
      discountCents: 0,
      active: true,
      maxUses: 100,
      usedCount: 12,
      expiresAt: '2026-12-31',
      createdAt: nowIso,
    },
    {
      id: 2,
      code: 'FOCO20',
      discountPercent: 20,
      discountCents: 0,
      active: true,
      maxUses: 50,
      usedCount: 7,
      expiresAt: '2026-12-31',
      createdAt: nowIso,
    },
    {
      id: 3,
      code: 'PRIMEIROMES',
      discountPercent: 0,
      discountCents: 1990, // R$ 19,90 de desconto no 1º mês
      active: true,
      maxUses: 200,
      usedCount: 23,
      expiresAt: '2026-12-31',
      createdAt: nowIso,
    },
  ] as any[],
  affiliateWithdrawals: [
    {
      id: 1,
      affiliateUserId: 1,
      amountCents: 2394,
      pixKey: 'carlos@ritmofoco.com.br',
      pixKeyType: 'email',
      status: 'pending',
      notes: 'Solicitação de saque de 1 comissão (60%)',
      receiptReference: null,
      requestedAt: new Date(Date.now() - 86400000).toISOString(),
      processedAt: null,
    },
  ] as any[],
};

let dbAvailable: boolean | null = null;

async function checkDb(): Promise<boolean> {
  if (dbAvailable !== null) return dbAvailable;
  try {
    await db.select({ count: sql`1` }).from(schema.users).limit(1);
    dbAvailable = true;
    return true;
  } catch (err) {
    dbAvailable = false;
    return false;
  }
}

// -------------------------------------------------------------
// USER OPERATIONS
// -------------------------------------------------------------
export async function findUserByEmail(email: string) {
  const isDb = await checkDb();
  if (isDb) {
    try {
      const [user] = await db.select().from(schema.users).where(eq(schema.users.email, email.toLowerCase()));
      return user || null;
    } catch {
      // fallback
    }
  }
  return memStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
}

export async function findUserById(id: number) {
  const isDb = await checkDb();
  if (isDb) {
    try {
      const [user] = await db.select().from(schema.users).where(eq(schema.users.id, id));
      return user || null;
    } catch {
      // fallback
    }
  }
  return memStore.users.find((u) => u.id === id) || null;
}

export async function findUserByPhone(phone: string) {
  const cleanPhone = phone.replace(/\D/g, '');
  const isDb = await checkDb();
  if (isDb) {
    try {
      const allUsers = await db.select().from(schema.users);
      return allUsers.find((u) => u.whatsappPhone && u.whatsappPhone.replace(/\D/g, '') === cleanPhone) || null;
    } catch {
      // fallback
    }
  }
  return memStore.users.find((u) => u.whatsappPhone && u.whatsappPhone.replace(/\D/g, '') === cleanPhone) || null;
}

export async function createUserRecord(data: {
  email: string;
  name: string;
  passwordHash: string;
  role?: 'admin' | 'user';
  timezone?: string;
  themePreference?: 'dark' | 'light';
  referralCode: string;
  referredBy?: string | null;
}) {
  const trialDays = 7;
  const trialEndsAtDate = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000);
  const userRole = data.role || (data.email.toLowerCase().includes('admin') ? 'admin' : 'user');

  const isDb = await checkDb();
  if (isDb) {
    try {
      const [newUser] = await db
        .insert(schema.users)
        .values({
          email: data.email.toLowerCase(),
          name: data.name,
          passwordHash: data.passwordHash,
          role: userRole,
          subscriptionStatus: 'trial',
          trialEndsAt: trialEndsAtDate,
          timezone: data.timezone || 'America/Sao_Paulo',
          themePreference: data.themePreference || 'dark',
          referralCode: data.referralCode,
          referredBy: data.referredBy || null,
        })
        .returning();
      return newUser;
    } catch (e) {
      console.error('Error inserting user to DB:', e);
    }
  }

  const id = memStore.users.length + 1;
  const newUser = {
    id,
    email: data.email.toLowerCase(),
    name: data.name,
    passwordHash: data.passwordHash,
    role: userRole,
    subscriptionStatus: 'trial',
    trialEndsAt: trialEndsAtDate.toISOString(),
    subscriptionRenewalDate: null,
    pixKey: null,
    pixKeyType: 'cpf',
    timezone: data.timezone || 'America/Sao_Paulo',
    themePreference: data.themePreference || 'dark',
    referralCode: data.referralCode,
    referredBy: data.referredBy || null,
    whatsappPhone: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  memStore.users.push(newUser);
  return newUser;
}

export async function updateUserRecord(id: number, data: Partial<typeof schema.users.$inferInsert>) {
  const isDb = await checkDb();
  if (isDb) {
    try {
      const [updated] = await db
        .update(schema.users)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(schema.users.id, id))
        .returning();
      return updated;
    } catch {
      // fallback
    }
  }
  const user = memStore.users.find((u) => u.id === id);
  if (user) {
    Object.assign(user, data, { updatedAt: new Date().toISOString() });
    return user;
  }
  return null;
}

export async function deleteUserData(userId: number) {
  const isDb = await checkDb();
  if (isDb) {
    try {
      await db.delete(schema.users).where(eq(schema.users.id, userId));
      return true;
    } catch {
      // fallback
    }
  }
  memStore.users = memStore.users.filter((u) => u.id !== userId);
  memStore.cycles = memStore.cycles.filter((c) => c.userId !== userId);
  memStore.tasks = memStore.tasks.filter((t) => t.userId !== userId);
  memStore.habits = memStore.habits.filter((h) => h.userId !== userId);
  memStore.habitLogs = memStore.habitLogs.filter((l) => l.userId !== userId);
  memStore.focusSessions = memStore.focusSessions.filter((s) => s.userId !== userId);
  memStore.journalEntries = memStore.journalEntries.filter((j) => j.userId !== userId);
  memStore.financeTransactions = memStore.financeTransactions.filter((f) => f.userId !== userId);
  memStore.financeBudgets = memStore.financeBudgets.filter((b) => b.userId !== userId);
  memStore.integrations = memStore.integrations.filter((i) => i.userId !== userId);
  return true;
}

// -------------------------------------------------------------
// FOCUS CYCLES
// -------------------------------------------------------------
export async function getActiveFocusCycle(userId: number): Promise<FocusCycle | null> {
  const isDb = await checkDb();
  if (isDb) {
    try {
      const [cycle] = await db
        .select()
        .from(schema.focusCycles)
        .where(and(eq(schema.focusCycles.userId, userId), eq(schema.focusCycles.status, 'active')))
        .orderBy(desc(schema.focusCycles.id))
        .limit(1);
      if (cycle) {
        return {
          ...cycle,
          secondaryGoals: JSON.parse(cycle.secondaryGoals || '[]'),
          durationDays: cycle.durationDays as any,
          routineLevel: cycle.routineLevel as any,
          status: cycle.status as any,
          notes: cycle.notes || undefined,
          createdAt: cycle.createdAt ? cycle.createdAt.toISOString() : undefined,
        };
      }
      return null;
    } catch {
      // fallback
    }
  }

  const cycle = memStore.cycles.find((c) => c.userId === userId && c.status === 'active');
  return cycle || null;
}

export async function getAllFocusCycles(userId: number): Promise<FocusCycle[]> {
  const isDb = await checkDb();
  if (isDb) {
    try {
      const cycles = await db
        .select()
        .from(schema.focusCycles)
        .where(eq(schema.focusCycles.userId, userId))
        .orderBy(desc(schema.focusCycles.id));
      return cycles.map((c) => ({
        ...c,
        secondaryGoals: JSON.parse(c.secondaryGoals || '[]'),
        durationDays: c.durationDays as any,
        routineLevel: c.routineLevel as any,
        status: c.status as any,
        notes: c.notes || undefined,
        createdAt: c.createdAt ? c.createdAt.toISOString() : undefined,
      }));
    } catch {
      // fallback
    }
  }
  return memStore.cycles.filter((c) => c.userId === userId);
}

export async function createFocusCycle(userId: number, data: Omit<FocusCycle, 'id' | 'userId'>): Promise<FocusCycle> {
  const isDb = await checkDb();
  if (isDb) {
    try {
      const [created] = await db
        .insert(schema.focusCycles)
        .values({
          userId,
          title: data.title,
          mainGoal: data.mainGoal,
          secondaryGoals: JSON.stringify(data.secondaryGoals || []),
          durationDays: data.durationDays,
          startDate: data.startDate,
          endDate: data.endDate,
          routineLevel: data.routineLevel,
          preferredTimes: data.preferredTimes,
          digitalLimits: data.digitalLimits,
          status: data.status || 'active',
          notes: data.notes || '',
        })
        .returning();

      return {
        ...created,
        secondaryGoals: JSON.parse(created.secondaryGoals || '[]'),
        durationDays: created.durationDays as any,
        routineLevel: created.routineLevel as any,
        status: created.status as any,
        notes: created.notes || undefined,
        createdAt: created.createdAt.toISOString(),
      };
    } catch {
      // fallback
    }
  }

  const id = memStore.cycles.length + 1;
  const newCycle: FocusCycle = {
    ...data,
    id,
    userId,
    secondaryGoals: data.secondaryGoals || [],
    createdAt: new Date().toISOString(),
  };
  memStore.cycles.push(newCycle);
  return newCycle;
}

// -------------------------------------------------------------
// TASKS
// -------------------------------------------------------------
export async function getTasks(userId: number, filterDate?: string): Promise<TaskItem[]> {
  const isDb = await checkDb();
  if (isDb) {
    try {
      const conditions = [eq(schema.tasks.userId, userId)];
      if (filterDate) {
        conditions.push(eq(schema.tasks.date, filterDate));
      }
      const items = await db
        .select()
        .from(schema.tasks)
        .where(and(...conditions))
        .orderBy(desc(schema.tasks.id));
      return items.map((t) => ({
        ...t,
        category: t.category as any,
        priority: t.priority as any,
        timeBlock: (t.timeBlock || 'Manhã') as any,
        completedAt: t.completedAt ? t.completedAt.toISOString() : null,
        notes: t.notes || undefined,
        description: t.description || undefined,
        startTime: t.startTime || undefined,
        estimatedMinutes: t.estimatedMinutes || 30,
        recurrenceRule: t.recurrenceRule || undefined,
        createdAt: t.createdAt.toISOString(),
      }));
    } catch {
      // fallback
    }
  }

  return memStore.tasks.filter((t) => t.userId === userId && (!filterDate || t.date === filterDate));
}

export async function createTask(userId: number, data: Partial<TaskItem>): Promise<TaskItem> {
  const isDb = await checkDb();
  if (isDb) {
    try {
      const [task] = await db
        .insert(schema.tasks)
        .values({
          userId,
          cycleId: data.cycleId || null,
          title: data.title!,
          description: data.description || '',
          category: data.category || 'geral',
          priority: data.priority || 'media',
          date: data.date || new Date().toISOString().split('T')[0],
          startTime: data.startTime || '',
          estimatedMinutes: data.estimatedMinutes || 30,
          completed: false,
          isRecurring: data.isRecurring || false,
          recurrenceRule: data.recurrenceRule || '',
          timeBlock: data.timeBlock || 'Manhã',
          notes: data.notes || '',
        })
        .returning();

      return {
        ...task,
        category: task.category as any,
        priority: task.priority as any,
        timeBlock: (task.timeBlock || 'Manhã') as any,
        estimatedMinutes: task.estimatedMinutes || 30,
        completedAt: task.completedAt ? task.completedAt.toISOString() : null,
        createdAt: task.createdAt.toISOString(),
      };
    } catch {
      // fallback
    }
  }

  const id = memStore.tasks.length + 1;
  const newTask: TaskItem = {
    id,
    userId,
    cycleId: data.cycleId || null,
    title: data.title!,
    description: data.description || '',
    category: data.category || 'geral',
    priority: data.priority || 'media',
    date: data.date || new Date().toISOString().split('T')[0],
    startTime: data.startTime || '',
    estimatedMinutes: data.estimatedMinutes || 30,
    completed: false,
    completedAt: null,
    isRecurring: data.isRecurring || false,
    recurrenceRule: data.recurrenceRule || '',
    timeBlock: data.timeBlock || 'Manhã',
    notes: data.notes || '',
    createdAt: new Date().toISOString(),
  };
  memStore.tasks.push(newTask);
  return newTask;
}

export async function updateTask(taskId: number, userId: number, updates: Partial<TaskItem>): Promise<TaskItem | null> {
  const isDb = await checkDb();
  if (isDb) {
    try {
      const patch: any = { ...updates };
      if (updates.completed !== undefined) {
        patch.completedAt = updates.completed ? new Date() : null;
      }
      const [updated] = await db
        .update(schema.tasks)
        .set(patch)
        .where(and(eq(schema.tasks.id, taskId), eq(schema.tasks.userId, userId)))
        .returning();

      if (!updated) return null;
      return {
        ...updated,
        category: updated.category as any,
        priority: updated.priority as any,
        timeBlock: (updated.timeBlock || 'Manhã') as any,
        estimatedMinutes: updated.estimatedMinutes || 30,
        completedAt: updated.completedAt ? updated.completedAt.toISOString() : null,
        createdAt: updated.createdAt.toISOString(),
      };
    } catch {
      // fallback
    }
  }

  const task = memStore.tasks.find((t) => t.id === taskId && t.userId === userId);
  if (!task) return null;
  Object.assign(task, updates);
  if (updates.completed !== undefined) {
    task.completedAt = updates.completed ? new Date().toISOString() : null;
  }
  return task;
}

export async function deleteTask(taskId: number, userId: number): Promise<boolean> {
  const isDb = await checkDb();
  if (isDb) {
    try {
      await db.delete(schema.tasks).where(and(eq(schema.tasks.id, taskId), eq(schema.tasks.userId, userId)));
      return true;
    } catch {
      // fallback
    }
  }
  memStore.tasks = memStore.tasks.filter((t) => !(t.id === taskId && t.userId === userId));
  return true;
}

// -------------------------------------------------------------
// HABITS & HABIT LOGS
// -------------------------------------------------------------
export async function getHabits(userId: number): Promise<{ habits: HabitItem[]; logs: HabitLogItem[] }> {
  const isDb = await checkDb();
  if (isDb) {
    try {
      const habitList = await db
        .select()
        .from(schema.habits)
        .where(and(eq(schema.habits.userId, userId), eq(schema.habits.isActive, true)))
        .orderBy(schema.habits.id);

      const logsList = await db
        .select()
        .from(schema.habitLogs)
        .where(eq(schema.habitLogs.userId, userId))
        .orderBy(desc(schema.habitLogs.date));

      return {
        habits: habitList.map((h) => ({
          ...h,
          category: h.category as any,
          targetFrequency: h.targetFrequency as any,
          notes: h.notes || undefined,
          createdAt: h.createdAt.toISOString(),
        })),
        logs: logsList.map((l) => ({
          ...l,
          value: l.value || undefined,
          notes: l.notes || undefined,
          createdAt: l.createdAt.toISOString(),
        })),
      };
    } catch {
      // fallback
    }
  }

  return {
    habits: memStore.habits.filter((h) => h.userId === userId && h.isActive),
    logs: memStore.habitLogs.filter((l) => l.userId === userId),
  };
}

export async function createHabit(userId: number, data: Partial<HabitItem>): Promise<HabitItem> {
  const isDb = await checkDb();
  if (isDb) {
    try {
      const [habit] = await db
        .insert(schema.habits)
        .values({
          userId,
          cycleId: data.cycleId || null,
          name: data.name!,
          category: data.category || 'geral',
          targetFrequency: data.targetFrequency || 'diario',
          notes: data.notes || '',
          isActive: true,
        })
        .returning();

      return {
        ...habit,
        category: habit.category as any,
        targetFrequency: habit.targetFrequency as any,
        createdAt: habit.createdAt.toISOString(),
      };
    } catch {
      // fallback
    }
  }

  const id = memStore.habits.length + 1;
  const newHabit: HabitItem = {
    id,
    userId,
    cycleId: data.cycleId || null,
    name: data.name!,
    category: data.category || 'personalizado',
    targetFrequency: data.targetFrequency || 'diario',
    notes: data.notes || '',
    isActive: true,
    createdAt: new Date().toISOString(),
  };
  memStore.habits.push(newHabit);
  return newHabit;
}

export async function toggleHabitLog(userId: number, habitId: number, date: string, completed: boolean): Promise<HabitLogItem> {
  const isDb = await checkDb();
  if (isDb) {
    try {
      const [existing] = await db
        .select()
        .from(schema.habitLogs)
        .where(
          and(
            eq(schema.habitLogs.userId, userId),
            eq(schema.habitLogs.habitId, habitId),
            eq(schema.habitLogs.date, date)
          )
        );

      if (existing) {
        const [updated] = await db
          .update(schema.habitLogs)
          .set({ completed })
          .where(eq(schema.habitLogs.id, existing.id))
          .returning();
        return {
          ...updated,
          value: updated.value || undefined,
          notes: updated.notes || undefined,
          createdAt: updated.createdAt.toISOString(),
        };
      } else {
        const [inserted] = await db
          .insert(schema.habitLogs)
          .values({
            userId,
            habitId,
            date,
            completed,
          })
          .returning();
        return {
          ...inserted,
          value: inserted.value || undefined,
          notes: inserted.notes || undefined,
          createdAt: inserted.createdAt.toISOString(),
        };
      }
    } catch {
      // fallback
    }
  }

  let log = memStore.habitLogs.find((l) => l.userId === userId && l.habitId === habitId && l.date === date);
  if (log) {
    log.completed = completed;
    return log;
  }
  const id = memStore.habitLogs.length + 1;
  const newLog: HabitLogItem = {
    id,
    userId,
    habitId,
    date,
    completed,
    createdAt: new Date().toISOString(),
  };
  memStore.habitLogs.push(newLog);
  return newLog;
}

// -------------------------------------------------------------
// FOCUS SESSIONS
// -------------------------------------------------------------
export async function getFocusSessions(userId: number): Promise<FocusSessionItem[]> {
  const isDb = await checkDb();
  if (isDb) {
    try {
      const list = await db
        .select()
        .from(schema.focusSessions)
        .where(eq(schema.focusSessions.userId, userId))
        .orderBy(desc(schema.focusSessions.id));
      return list.map((s) => ({
        ...s,
        sessionType: s.sessionType as any,
        status: s.status as any,
        focusTopic: s.focusTopic || '',
        createdAt: s.createdAt.toISOString(),
      }));
    } catch {
      // fallback
    }
  }
  return memStore.focusSessions.filter((s) => s.userId === userId);
}

export async function createFocusSession(userId: number, data: Partial<FocusSessionItem>): Promise<FocusSessionItem> {
  const isDb = await checkDb();
  if (isDb) {
    try {
      const [session] = await db
        .insert(schema.focusSessions)
        .values({
          userId,
          cycleId: data.cycleId || null,
          focusTopic: data.focusTopic || 'Sessão de Foco',
          durationMinutes: data.durationMinutes || 25,
          sessionType: data.sessionType || 'custom',
          status: data.status || 'completed',
          date: data.date || new Date().toISOString().split('T')[0],
        })
        .returning();

      return {
        ...session,
        sessionType: session.sessionType as any,
        status: session.status as any,
        focusTopic: session.focusTopic || '',
        createdAt: session.createdAt.toISOString(),
      };
    } catch {
      // fallback
    }
  }

  const id = memStore.focusSessions.length + 1;
  const newSession: FocusSessionItem = {
    id,
    userId,
    cycleId: data.cycleId || null,
    focusTopic: data.focusTopic || 'Sessão de Foco',
    durationMinutes: data.durationMinutes || 25,
    sessionType: data.sessionType || 'custom',
    status: data.status || 'completed',
    date: data.date || new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
  };
  memStore.focusSessions.push(newSession);
  return newSession;
}

// -------------------------------------------------------------
// JOURNAL ENTRIES
// -------------------------------------------------------------
export async function getJournalEntries(userId: number): Promise<JournalEntryItem[]> {
  const isDb = await checkDb();
  if (isDb) {
    try {
      const entries = await db
        .select()
        .from(schema.journalEntries)
        .where(eq(schema.journalEntries.userId, userId))
        .orderBy(desc(schema.journalEntries.date));
      return entries.map((e) => ({
        ...e,
        entryType: e.entryType as any,
        energyScore: e.energyScore || 3,
        moodScore: e.moodScore || 3,
        focusScore: e.focusScore || 3,
        workedWell: e.workedWell || '',
        nextStep: e.nextStep || '',
        difficulties: e.difficulties || undefined,
        notes: e.notes || undefined,
        createdAt: e.createdAt.toISOString(),
      }));
    } catch {
      // fallback
    }
  }
  return memStore.journalEntries.filter((j) => j.userId === userId);
}

export async function upsertJournalEntry(userId: number, data: Partial<JournalEntryItem>): Promise<JournalEntryItem> {
  const date = data.date || new Date().toISOString().split('T')[0];
  const entryType = data.entryType || 'daily_checkin';

  const isDb = await checkDb();
  if (isDb) {
    try {
      const [existing] = await db
        .select()
        .from(schema.journalEntries)
        .where(
          and(
            eq(schema.journalEntries.userId, userId),
            eq(schema.journalEntries.date, date),
            eq(schema.journalEntries.entryType, entryType)
          )
        );

      if (existing) {
        const [updated] = await db
          .update(schema.journalEntries)
          .set({
            energyScore: data.energyScore,
            moodScore: data.moodScore,
            focusScore: data.focusScore,
            workedWell: data.workedWell || '',
            nextStep: data.nextStep || '',
            difficulties: data.difficulties || '',
            notes: data.notes || '',
          })
          .where(eq(schema.journalEntries.id, existing.id))
          .returning();

        return {
          ...updated,
          entryType: updated.entryType as any,
          energyScore: updated.energyScore || 3,
          moodScore: updated.moodScore || 3,
          focusScore: updated.focusScore || 3,
          workedWell: updated.workedWell || '',
          nextStep: updated.nextStep || '',
          difficulties: updated.difficulties || undefined,
          notes: updated.notes || undefined,
          createdAt: updated.createdAt.toISOString(),
        };
      } else {
        const [created] = await db
          .insert(schema.journalEntries)
          .values({
            userId,
            cycleId: data.cycleId || null,
            date,
            entryType,
            energyScore: data.energyScore || 3,
            moodScore: data.moodScore || 3,
            focusScore: data.focusScore || 3,
            workedWell: data.workedWell || '',
            nextStep: data.nextStep || '',
            difficulties: data.difficulties || '',
            notes: data.notes || '',
          })
          .returning();

        return {
          ...created,
          entryType: created.entryType as any,
          energyScore: created.energyScore || 3,
          moodScore: created.moodScore || 3,
          focusScore: created.focusScore || 3,
          workedWell: created.workedWell || '',
          nextStep: created.nextStep || '',
          difficulties: created.difficulties || undefined,
          notes: created.notes || undefined,
          createdAt: created.createdAt.toISOString(),
        };
      }
    } catch {
      // fallback
    }
  }

  let entry = memStore.journalEntries.find(
    (j) => j.userId === userId && j.date === date && j.entryType === entryType
  );
  if (entry) {
    Object.assign(entry, data);
    return entry;
  }

  const id = memStore.journalEntries.length + 1;
  const newEntry: JournalEntryItem = {
    id,
    userId,
    cycleId: data.cycleId || null,
    date,
    entryType,
    energyScore: data.energyScore || 3,
    moodScore: data.moodScore || 3,
    focusScore: data.focusScore || 3,
    workedWell: data.workedWell || '',
    nextStep: data.nextStep || '',
    difficulties: data.difficulties || '',
    notes: data.notes || '',
    createdAt: new Date().toISOString(),
  };
  memStore.journalEntries.push(newEntry);
  return newEntry;
}

// -------------------------------------------------------------
// FINANCE TRANSACTIONS & BUDGETS
// -------------------------------------------------------------
export async function getFinanceTransactions(
  userId: number,
  filter?: { monthYear?: string; category?: string; type?: string; search?: string }
): Promise<FinanceTransactionItem[]> {
  const isDb = await checkDb();
  if (isDb) {
    try {
      const conditions = [eq(schema.financeTransactions.userId, userId)];
      const list = await db
        .select()
        .from(schema.financeTransactions)
        .where(and(...conditions))
        .orderBy(desc(schema.financeTransactions.date), desc(schema.financeTransactions.id));

      let results: FinanceTransactionItem[] = list.map((tx) => ({
        ...tx,
        type: tx.type as any,
        status: tx.status as any,
        source: tx.source as any,
        notes: tx.notes || undefined,
        dueDate: tx.dueDate || undefined,
        currentInstallment: tx.currentInstallment || undefined,
        totalInstallments: tx.totalInstallments || undefined,
        recurrenceInterval: tx.recurrenceInterval || undefined,
        sheetsRowId: tx.sheetsRowId || null,
        createdAt: tx.createdAt.toISOString(),
      }));

      if (filter?.monthYear) {
        results = results.filter((tx) => tx.date.startsWith(filter.monthYear!));
      }
      if (filter?.category && filter.category !== 'todas') {
        results = results.filter((tx) => tx.category === filter.category);
      }
      if (filter?.type && filter.type !== 'todos') {
        results = results.filter((tx) => tx.type === filter.type);
      }
      if (filter?.search) {
        const q = filter.search.toLowerCase();
        results = results.filter((tx) => tx.description.toLowerCase().includes(q));
      }

      return results;
    } catch {
      // fallback
    }
  }

  let list = memStore.financeTransactions.filter((tx) => tx.userId === userId);
  if (filter?.monthYear) {
    list = list.filter((tx) => tx.date.startsWith(filter.monthYear!));
  }
  if (filter?.category && filter.category !== 'todas') {
    list = list.filter((tx) => tx.category === filter.category);
  }
  if (filter?.type && filter.type !== 'todos') {
    list = list.filter((tx) => tx.type === filter.type);
  }
  if (filter?.search) {
    const q = filter.search.toLowerCase();
    list = list.filter((tx) => tx.description.toLowerCase().includes(q));
  }
  return list.sort((a, b) => b.date.localeCompare(a.date));
}

export async function createFinanceTransaction(
  userId: number,
  data: Partial<FinanceTransactionItem>
): Promise<FinanceTransactionItem> {
  const isDb = await checkDb();
  if (isDb) {
    try {
      const [tx] = await db
        .insert(schema.financeTransactions)
        .values({
          userId,
          type: data.type || 'expense',
          description: data.description!,
          amountCents: data.amountCents || 0,
          date: data.date || new Date().toISOString().split('T')[0],
          category: data.category || 'outros',
          paymentMethod: data.paymentMethod || 'pix',
          accountWallet: data.accountWallet || 'Principal',
          isRecurring: data.isRecurring || false,
          recurrenceInterval: data.recurrenceInterval || 'mensal',
          isInstallment: data.isInstallment || false,
          currentInstallment: data.currentInstallment || 1,
          totalInstallments: data.totalInstallments || 1,
          status: data.status || 'paid',
          dueDate: data.dueDate || null,
          notes: data.notes || '',
          source: data.source || 'web',
          syncedToSheets: false,
        })
        .returning();

      return {
        ...tx,
        type: tx.type as any,
        status: tx.status as any,
        source: tx.source as any,
        createdAt: tx.createdAt.toISOString(),
      };
    } catch {
      // fallback
    }
  }

  const id = memStore.financeTransactions.length + 1;
  const newTx: FinanceTransactionItem = {
    id,
    userId,
    type: data.type || 'expense',
    description: data.description!,
    amountCents: data.amountCents || 0,
    date: data.date || new Date().toISOString().split('T')[0],
    category: data.category || 'outros',
    paymentMethod: data.paymentMethod || 'pix',
    accountWallet: data.accountWallet || 'Principal',
    isRecurring: data.isRecurring || false,
    recurrenceInterval: data.recurrenceInterval || 'mensal',
    isInstallment: data.isInstallment || false,
    currentInstallment: data.currentInstallment || 1,
    totalInstallments: data.totalInstallments || 1,
    status: data.status || 'paid',
    dueDate: data.dueDate,
    notes: data.notes || '',
    source: data.source || 'web',
    syncedToSheets: false,
    createdAt: new Date().toISOString(),
  };
  memStore.financeTransactions.push(newTx);
  return newTx;
}

export async function deleteFinanceTransaction(txId: number, userId: number): Promise<boolean> {
  const isDb = await checkDb();
  if (isDb) {
    try {
      await db
        .delete(schema.financeTransactions)
        .where(
          and(
            eq(schema.financeTransactions.id, txId),
            eq(schema.financeTransactions.userId, userId)
          )
        );
      return true;
    } catch {
      // fallback
    }
  }
  memStore.financeTransactions = memStore.financeTransactions.filter(
    (tx) => !(tx.id === txId && tx.userId === userId)
  );
  return true;
}

// -------------------------------------------------------------
// AFFILIATE SYSTEM
// -------------------------------------------------------------
export async function getAffiliateData(userId: number, userReferralCode: string): Promise<{
  stats: any;
  commissions: AffiliateCommissionItem[];
  referrals: AffiliateReferralItem[];
  withdrawals: any[];
}> {
  const isDb = await checkDb();
  let referralsList: any[] = [];
  let commissionsList: any[] = [];

  if (isDb) {
    try {
      referralsList = await db
        .select()
        .from(schema.affiliateReferrals)
        .where(eq(schema.affiliateReferrals.affiliateUserId, userId));

      commissionsList = await db
        .select()
        .from(schema.affiliateCommissions)
        .where(eq(schema.affiliateCommissions.affiliateUserId, userId))
        .orderBy(desc(schema.affiliateCommissions.id));
    } catch {
      // fallback
    }
  } else {
    referralsList = memStore.affiliateReferrals.filter((r) => r.affiliateUserId === userId);
    commissionsList = memStore.affiliateCommissions.filter((c) => c.affiliateUserId === userId);
  }

  const totalClicks = referralsList.reduce((acc, r) => acc + (r.clickCount || 1), 0);
  const totalReferrals = referralsList.length;
  const activeSubscriptions = commissionsList.filter((c) => c.status === 'approved' || c.status === 'paid').length;

  const pendingCommissionCents = commissionsList
    .filter((c) => c.status === 'pending')
    .reduce((acc, c) => acc + c.commissionCents, 0);

  const approvedCommissionCents = commissionsList
    .filter((c) => c.status === 'approved')
    .reduce((acc, c) => acc + c.commissionCents, 0);

  const paidCommissionCents = commissionsList
    .filter((c) => c.status === 'paid')
    .reduce((acc, c) => acc + c.commissionCents, 0);

  // Calculate withdrawals
  let userWithdrawals: any[] = [];
  if (isDb) {
    try {
      userWithdrawals = await db
        .select()
        .from(schema.affiliateWithdrawals)
        .where(eq(schema.affiliateWithdrawals.affiliateUserId, userId))
        .orderBy(desc(schema.affiliateWithdrawals.id));
    } catch {}
  } else {
    userWithdrawals = memStore.affiliateWithdrawals.filter((w) => w.affiliateUserId === userId);
  }

  const withdrawnOrPendingCents = userWithdrawals
    .filter((w) => w.status === 'pending' || w.status === 'approved' || w.status === 'paid')
    .reduce((acc, w) => acc + w.amountCents, 0);

  const availableBalanceCents = Math.max(0, approvedCommissionCents - withdrawnOrPendingCents);

  return {
    stats: {
      referralCode: userReferralCode,
      referralLink: `/?ref=${userReferralCode}`,
      totalClicks,
      totalReferrals,
      activeSubscriptions,
      commissionRatePercent: 60,
      pendingCommissionCents,
      approvedCommissionCents,
      paidCommissionCents,
      availableBalanceCents,
    },
    commissions: commissionsList.map((c) => ({
      ...c,
      status: c.status as any,
      payoutStatus: (c.payoutStatus || 'manual') as any,
      createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
    })),
    referrals: referralsList.map((r) => ({
      ...r,
      status: r.status as any,
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt,
    })),
    withdrawals: userWithdrawals.map((w) => ({
      ...w,
      requestedAt: w.requestedAt instanceof Date ? w.requestedAt.toISOString() : w.requestedAt,
      processedAt: w.processedAt instanceof Date ? w.processedAt.toISOString() : w.processedAt,
    })),
  };
}

export async function recordAffiliateClick(referralCode: string, ip?: string, ua?: string) {
  const code = referralCode.trim().toUpperCase();
  const isDb = await checkDb();
  let ownerId: number | null = null;

  if (isDb) {
    try {
      const [owner] = await db.select().from(schema.users).where(eq(schema.users.referralCode, code));
      if (owner) ownerId = owner.id;
    } catch {}
  } else {
    const owner = memStore.users.find((u) => u.referralCode === code);
    if (owner) ownerId = owner.id;
  }

  if (!ownerId) return false;

  if (isDb) {
    try {
      await db.insert(schema.affiliateReferrals).values({
        affiliateUserId: ownerId,
        referralCode: code,
        ipAddress: ip || null,
        userAgent: ua ? ua.slice(0, 200) : null,
        clickCount: 1,
        status: 'active',
      });
      return true;
    } catch {}
  }

  memStore.affiliateReferrals.push({
    id: memStore.affiliateReferrals.length + 1,
    affiliateUserId: ownerId,
    referralCode: code,
    ipAddress: ip || null,
    userAgent: ua ? ua.slice(0, 200) : null,
    clickCount: 1,
    status: 'active',
    createdAt: new Date().toISOString(),
  });
  return true;
}

// -------------------------------------------------------------
// INTEGRATIONS CONFIG
// -------------------------------------------------------------
export async function getIntegrationsConfig(userId: number): Promise<IntegrationsConfigItem> {
  const isDb = await checkDb();
  if (isDb) {
    try {
      const [config] = await db
        .select()
        .from(schema.integrationsConfig)
        .where(eq(schema.integrationsConfig.userId, userId));
      if (config) {
        return {
          userId,
          whatsappPhone: config.whatsappPhone || undefined,
          whatsappStatus: config.whatsappStatus as any,
          sheetsStatus: config.sheetsStatus as any,
          sheetsSpreadsheetId: config.sheetsSpreadsheetId || undefined,
          sheetsSpreadsheetName: config.sheetsSpreadsheetName || 'Ritmo - Finanças Pessoais',
          sheetsAutoSync: config.sheetsAutoSync,
          remindersConfig: JSON.parse(config.remindersConfig || '{}'),
        };
      }
    } catch {}
  }

  const existing = memStore.integrations.find((i) => i.userId === userId);
  if (existing) return existing;

  const defaultConfig: IntegrationsConfigItem = {
    userId,
    whatsappStatus: 'disconnected',
    sheetsStatus: 'disconnected',
    sheetsSpreadsheetName: 'Ritmo - Finanças Pessoais',
    sheetsAutoSync: true,
    remindersConfig: {
      tasks: true,
      habits: true,
      financeDue: true,
      weeklyReview: true,
    },
  };
  memStore.integrations.push(defaultConfig);
  return defaultConfig;
}

export async function updateIntegrationsConfig(userId: number, updates: Partial<IntegrationsConfigItem>) {
  const isDb = await checkDb();
  if (isDb) {
    try {
      const patch: any = { ...updates, updatedAt: new Date() };
      if (updates.remindersConfig) {
        patch.remindersConfig = JSON.stringify(updates.remindersConfig);
      }
      await db
        .insert(schema.integrationsConfig)
        .values({
          userId,
          whatsappPhone: updates.whatsappPhone,
          whatsappStatus: updates.whatsappStatus || 'disconnected',
          sheetsStatus: updates.sheetsStatus || 'disconnected',
          sheetsSpreadsheetId: updates.sheetsSpreadsheetId,
          sheetsSpreadsheetName: updates.sheetsSpreadsheetName || 'Ritmo - Finanças Pessoais',
          sheetsAutoSync: updates.sheetsAutoSync ?? true,
          remindersConfig: JSON.stringify(updates.remindersConfig || {}),
        })
        .onConflictDoUpdate({
          target: schema.integrationsConfig.userId,
          set: patch,
        });
    } catch {}
  }

  let existing = memStore.integrations.find((i) => i.userId === userId);
  if (!existing) {
    existing = {
      userId,
      whatsappStatus: 'disconnected',
      sheetsStatus: 'disconnected',
      sheetsSpreadsheetName: 'Ritmo - Finanças Pessoais',
      sheetsAutoSync: true,
      remindersConfig: {
        tasks: true,
        habits: true,
        financeDue: true,
        weeklyReview: true,
      },
      ...updates,
    };
    memStore.integrations.push(existing);
  } else {
    Object.assign(existing, updates);
  }
  return existing;
}

// -------------------------------------------------------------
// PASSWORD RECOVERY / RESET
// -------------------------------------------------------------
export async function createPasswordResetRequest(email: string) {
  const cleanEmail = email.toLowerCase().trim();
  const user = await findUserByEmail(cleanEmail);
  if (!user) {
    return { success: false, error: 'E-mail não encontrado no sistema.' };
  }

  // 6-digit numeric recovery code + random unique token
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const token = 'rst_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  const isDb = await checkDb();
  if (isDb) {
    try {
      await db.insert(schema.passwordResetTokens).values({
        userId: user.id,
        email: cleanEmail,
        code,
        token,
        expiresAt,
        used: false,
      });
    } catch {}
  }

  memStore.passwordResetTokens.push({
    id: memStore.passwordResetTokens.length + 1,
    userId: user.id,
    email: cleanEmail,
    code,
    token,
    expiresAt: expiresAt.toISOString(),
    used: false,
    createdAt: new Date().toISOString(),
  });

  return {
    success: true,
    code,
    token,
    email: cleanEmail,
    message: `Código de recuperação gerado com sucesso: ${code}`,
  };
}

export async function resetPasswordWithToken(code: string, newPasswordHash: string) {
  const cleanCode = code.trim();
  const isDb = await checkDb();
  let tokenRecord: any = null;

  if (isDb) {
    try {
      const [record] = await db
        .select()
        .from(schema.passwordResetTokens)
        .where(and(eq(schema.passwordResetTokens.code, cleanCode), eq(schema.passwordResetTokens.used, false)))
        .orderBy(desc(schema.passwordResetTokens.id));
      tokenRecord = record;
    } catch {}
  } else {
    tokenRecord = memStore.passwordResetTokens
      .filter((t) => t.code === cleanCode && !t.used)
      .sort((a, b) => b.id - a.id)[0];
  }

  if (!tokenRecord) {
    return { success: false, error: 'Código de recuperação inválido ou já utilizado.' };
  }

  const expTime = new Date(tokenRecord.expiresAt).getTime();
  if (Date.now() > expTime) {
    return { success: false, error: 'Código de recuperação expirou. Solicite um novo código.' };
  }

  // Update user password
  await updateUserRecord(tokenRecord.userId, { passwordHash: newPasswordHash });

  // Mark token as used
  if (isDb) {
    try {
      await db
        .update(schema.passwordResetTokens)
        .set({ used: true })
        .where(eq(schema.passwordResetTokens.id, tokenRecord.id));
    } catch {}
  }
  const memTok = memStore.passwordResetTokens.find((t) => t.id === tokenRecord.id);
  if (memTok) memTok.used = true;

  return { success: true, message: 'Senha atualizada com sucesso!' };
}

// -------------------------------------------------------------
// CHECKOUT, SUBSCRIPTION & PAYMENTS
// -------------------------------------------------------------
export async function validateCoupon(code: string) {
  const cleanCode = code.trim().toUpperCase();
  const isDb = await checkDb();
  let coupon: any = null;

  if (isDb) {
    try {
      const [c] = await db
        .select()
        .from(schema.coupons)
        .where(and(eq(schema.coupons.code, cleanCode), eq(schema.coupons.active, true)));
      coupon = c;
    } catch {}
  } else {
    coupon = memStore.coupons.find((c) => c.code === cleanCode && c.active);
  }

  if (!coupon) {
    return { valid: false, error: 'Cupom inválido ou expirado.' };
  }

  return {
    valid: true,
    code: coupon.code,
    discountPercent: coupon.discountPercent || 0,
    discountCents: coupon.discountCents || 0,
  };
}

export async function createCheckoutPayment(
  userId: number,
  paymentMethod: 'pix' | 'credit_card',
  couponCode?: string
) {
  const basePriceCents = 3990; // R$ 39,90
  let discountCents = 0;
  let appliedCoupon: string | null = null;

  if (couponCode) {
    const couponRes = await validateCoupon(couponCode);
    if (couponRes.valid) {
      appliedCoupon = couponRes.code || null;
      if (couponRes.discountPercent && couponRes.discountPercent > 0) {
        discountCents = Math.round((basePriceCents * couponRes.discountPercent) / 100);
      } else if (couponRes.discountCents && couponRes.discountCents > 0) {
        discountCents = couponRes.discountCents;
      }
    }
  }

  const finalAmountCents = Math.max(100, basePriceCents - discountCents);
  const orderReference = `ORD-RTM-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  // Generate PIX QR Code & Copia-e-Cola string
  const pixCopiaECola = `00020126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-4266141740005204000053039865405${(
    finalAmountCents / 100
  ).toFixed(2)}5802BR5913Ritmo Foco6009Sao Paulo62140510${orderReference.slice(-10)}6304ABCD`;

  const pixQrCode = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220" viewBox="0 0 220 220"><rect width="220" height="220" fill="white"/><text x="50%" y="45%" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#0f172a" font-weight="bold">PIX RITMO PRO</text><text x="50%" y="60%" text-anchor="middle" font-family="sans-serif" font-size="18" fill="#10b981" font-weight="bold">R$ ${(
    finalAmountCents / 100
  ).toFixed(2).replace('.', ',')}</text><text x="50%" y="75%" text-anchor="middle" font-family="sans-serif" font-size="10" fill="#64748b">Escaneie no app do seu banco</text></svg>`;

  const isDb = await checkDb();
  if (isDb) {
    try {
      const [newPayment] = await db
        .insert(schema.payments)
        .values({
          userId,
          orderReference,
          amountCents: finalAmountCents,
          discountCents,
          couponCode: appliedCoupon,
          status: 'pending',
          paymentMethod,
          pixQrCode,
          pixCopiaECola,
          invoiceUrl: `#fatura-${orderReference}`,
        })
        .returning();
      return newPayment;
    } catch {}
  }

  const newPayment = {
    id: memStore.payments.length + 1,
    userId,
    orderReference,
    amountCents: finalAmountCents,
    discountCents,
    couponCode: appliedCoupon,
    status: 'pending',
    paymentMethod,
    paidAt: null,
    pixQrCode,
    pixCopiaECola,
    invoiceUrl: `#fatura-${orderReference}`,
    createdAt: new Date().toISOString(),
  };
  memStore.payments.push(newPayment);
  return newPayment;
}

export async function confirmCheckoutPayment(orderReference: string) {
  const isDb = await checkDb();
  let payment: any = null;

  if (isDb) {
    try {
      const [p] = await db
        .select()
        .from(schema.payments)
        .where(eq(schema.payments.orderReference, orderReference));
      payment = p;
    } catch {}
  } else {
    payment = memStore.payments.find((p) => p.orderReference === orderReference);
  }

  if (!payment) {
    return { success: false, error: 'Pagamento não encontrado.' };
  }

  const now = new Date();
  const renewalDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // 1. Mark payment as paid
  if (isDb) {
    try {
      await db
        .update(schema.payments)
        .set({ status: 'paid', paidAt: now })
        .where(eq(schema.payments.orderReference, orderReference));
    } catch {}
  }
  payment.status = 'paid';
  payment.paidAt = now.toISOString();

  // 2. Activate user subscription
  const user = await findUserById(payment.userId);
  if (user) {
    await updateUserRecord(user.id, {
      subscriptionStatus: 'active',
      subscriptionRenewalDate: renewalDate,
    });

    // 3. Update or create subscriptions record
    if (isDb) {
      try {
        await db.insert(schema.subscriptions).values({
          userId: user.id,
          plan: 'pro_monthly',
          amountCents: payment.amountCents,
          status: 'active',
          provider: payment.paymentMethod === 'pix' ? 'pix_mercadopago' : 'card_stripe',
          renewalDate,
        });
      } catch {}
    } else {
      const sub = memStore.subscriptions.find((s) => s.userId === user.id);
      if (sub) {
        sub.status = 'active';
        sub.renewalDate = renewalDate;
      } else {
        memStore.subscriptions.push({
          id: memStore.subscriptions.length + 1,
          userId: user.id,
          plan: 'pro_monthly',
          amountCents: payment.amountCents,
          status: 'active',
          provider: payment.paymentMethod === 'pix' ? 'pix_mercadopago' : 'card_stripe',
          renewalDate,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        });
      }
    }

    // 4. Attribution of 60% Commission to Referrer (if user was referred)
    if (user.referredBy) {
      const referrer = await findUserByReferralCode(user.referredBy);
      if (referrer && referrer.id !== user.id) {
        // 60% of base amount paid (60% of R$ 39,90 = R$ 23,94 = 2394 cents)
        const commissionCents = Math.round((payment.amountCents * 60) / 100);

        if (isDb) {
          try {
            await db.insert(schema.affiliateCommissions).values({
              affiliateUserId: referrer.id,
              referredUserId: user.id,
              orderReference: payment.orderReference,
              baseAmountCents: payment.amountCents,
              commissionRatePercent: 60,
              commissionCents,
              status: 'approved',
              payoutStatus: 'manual',
              notes: 'Comissão de 60% gerada pela assinatura do indicado.',
            });
          } catch {}
        }

        memStore.affiliateCommissions.push({
          id: memStore.affiliateCommissions.length + 1,
          affiliateUserId: referrer.id,
          referredUserId: user.id,
          orderReference: payment.orderReference,
          baseAmountCents: payment.amountCents,
          commissionRatePercent: 60,
          commissionCents,
          status: 'approved',
          payoutStatus: 'manual',
          notes: 'Comissão de 60% gerada pela assinatura do indicado.',
          createdAt: now.toISOString(),
        });
      }
    }
  }

  return {
    success: true,
    message: 'Pagamento confirmado com sucesso! Sua assinatura PRO está ativa por 30 dias.',
    payment,
    renewalDate,
  };
}

export async function findUserByReferralCode(code: string) {
  const cleanCode = code.trim().toUpperCase();
  const isDb = await checkDb();
  if (isDb) {
    try {
      const [u] = await db.select().from(schema.users).where(eq(schema.users.referralCode, cleanCode));
      return u || null;
    } catch {}
  }
  return memStore.users.find((u) => u.referralCode === cleanCode) || null;
}

export async function getUserSubscriptionAndInvoices(userId: number) {
  const user = await findUserById(userId);
  if (!user) return null;

  const isDb = await checkDb();
  let invoices: any[] = [];
  let subscription: any = null;

  if (isDb) {
    try {
      invoices = await db
        .select()
        .from(schema.payments)
        .where(eq(schema.payments.userId, userId))
        .orderBy(desc(schema.payments.id));

      const [s] = await db
        .select()
        .from(schema.subscriptions)
        .where(eq(schema.subscriptions.userId, userId))
        .orderBy(desc(schema.subscriptions.id));
      subscription = s;
    } catch {}
  } else {
    invoices = memStore.payments.filter((p) => p.userId === userId);
    subscription = memStore.subscriptions.find((s) => s.userId === userId);
  }

  // Calculate trial days remaining
  let trialDaysRemaining = 0;
  let isTrialActive = false;
  let isExpired = false;

  if (user.subscriptionStatus === 'active') {
    // Paid active subscription
    isTrialActive = false;
    isExpired = false;
  } else if (user.subscriptionStatus === 'trial') {
    if (user.trialEndsAt) {
      const trialEnd = new Date(user.trialEndsAt).getTime();
      const diffMs = trialEnd - Date.now();
      trialDaysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      isTrialActive = trialDaysRemaining > 0;
      isExpired = trialDaysRemaining === 0;
    } else {
      trialDaysRemaining = 7;
      isTrialActive = true;
    }
  } else if (user.subscriptionStatus === 'expired') {
    isExpired = true;
  }

  return {
    subscriptionStatus: isExpired ? 'expired' : user.subscriptionStatus,
    trialDaysRemaining,
    isTrialActive,
    isExpired,
    plan: 'Ritmo PRO Mensal (R$ 39,90/mês)',
    amountCents: 3990,
    renewalDate: user.subscriptionRenewalDate || (subscription ? subscription.renewalDate : null),
    invoices: invoices.map((inv) => ({
      ...inv,
      createdAt: inv.createdAt instanceof Date ? inv.createdAt.toISOString() : inv.createdAt,
      paidAt: inv.paidAt instanceof Date ? inv.paidAt.toISOString() : inv.paidAt,
    })),
  };
}

// -------------------------------------------------------------
// AFFILIATE WITHDRAWALS & PIX SETTINGS
// -------------------------------------------------------------
export async function updateUserPixKey(
  userId: number,
  pixKey: string,
  pixKeyType: 'cpf' | 'email' | 'telefone' | 'aleatoria'
) {
  const updated = await updateUserRecord(userId, {
    pixKey: pixKey.trim(),
    pixKeyType,
  });
  return updated;
}

export async function requestAffiliateWithdrawal(
  userId: number,
  amountCents: number,
  pixKey: string,
  pixKeyType: 'cpf' | 'email' | 'telefone' | 'aleatoria'
) {
  const user = await findUserById(userId);
  if (!user) return { success: false, error: 'Usuário não encontrado.' };

  const affData = await getAffiliateData(userId, user.referralCode);
  if (affData.stats.availableBalanceCents < amountCents) {
    return {
      success: false,
      error: `Saldo insuficiente. Saldo disponível para saque: R$ ${(
        affData.stats.availableBalanceCents / 100
      ).toFixed(2).replace('.', ',')}.`,
    };
  }

  if (amountCents < 2394) {
    return {
      success: false,
      error: 'O valor mínimo para resgate de comissão é R$ 23,94 (valor de 1 indicação PRO).',
    };
  }

  const isDb = await checkDb();
  if (isDb) {
    try {
      const [w] = await db
        .insert(schema.affiliateWithdrawals)
        .values({
          affiliateUserId: userId,
          amountCents,
          pixKey: pixKey.trim(),
          pixKeyType,
          status: 'pending',
          notes: 'Solicitação de saque de comissão de 60%',
        })
        .returning();
      return { success: true, withdrawal: w };
    } catch {}
  }

  const newWithdrawal = {
    id: memStore.affiliateWithdrawals.length + 1,
    affiliateUserId: userId,
    amountCents,
    pixKey: pixKey.trim(),
    pixKeyType,
    status: 'pending',
    notes: 'Solicitação de saque de comissão de 60%',
    receiptReference: null,
    requestedAt: new Date().toISOString(),
    processedAt: null,
  };
  memStore.affiliateWithdrawals.push(newWithdrawal);
  return { success: true, withdrawal: newWithdrawal };
}

// -------------------------------------------------------------
// ADMIN MANAGEMENT & METRICS
// -------------------------------------------------------------
export async function getAdminDashboardData() {
  const isDb = await checkDb();
  let allUsers: any[] = [];
  let allPayments: any[] = [];
  let allWithdrawals: any[] = [];
  let allCoupons: any[] = [];

  if (isDb) {
    try {
      allUsers = await db.select().from(schema.users).orderBy(desc(schema.users.id));
      allPayments = await db.select().from(schema.payments).orderBy(desc(schema.payments.id));
      allWithdrawals = await db.select().from(schema.affiliateWithdrawals).orderBy(desc(schema.affiliateWithdrawals.id));
      allCoupons = await db.select().from(schema.coupons).orderBy(desc(schema.coupons.id));
    } catch {}
  } else {
    allUsers = [...memStore.users];
    allPayments = [...memStore.payments];
    allWithdrawals = [...memStore.affiliateWithdrawals];
    allCoupons = [...memStore.coupons];
  }

  const totalUsers = allUsers.length;
  const activeUsers = allUsers.filter((u) => u.subscriptionStatus === 'active' || u.subscriptionStatus === 'trial').length;
  const paidSubscribers = allUsers.filter((u) => u.subscriptionStatus === 'active').length;
  const trialUsers = allUsers.filter((u) => u.subscriptionStatus === 'trial').length;

  // Monthly Recurring Revenue: paidSubscribers * R$ 39,90 (3990 cents)
  const mrrCents = paidSubscribers * 3990;

  // Pending affiliate commissions to pay (pending withdrawals)
  const pendingCommissionsCents = allWithdrawals
    .filter((w) => w.status === 'pending' || w.status === 'approved')
    .reduce((acc, w) => acc + w.amountCents, 0);

  const totalCommissionsPaidCents = allWithdrawals
    .filter((w) => w.status === 'paid')
    .reduce((acc, w) => acc + w.amountCents, 0);

  // Map users with safe presentation
  const safeUsers = allUsers.map((u) => {
    let daysRemaining = 0;
    if (u.trialEndsAt) {
      const diff = new Date(u.trialEndsAt).getTime() - Date.now();
      daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role || 'user',
      subscriptionStatus: u.subscriptionStatus || 'trial',
      trialEndsAt: u.trialEndsAt instanceof Date ? u.trialEndsAt.toISOString() : u.trialEndsAt,
      trialDaysRemaining: daysRemaining,
      subscriptionRenewalDate: u.subscriptionRenewalDate,
      referralCode: u.referralCode,
      referredBy: u.referredBy,
      pixKey: u.pixKey,
      pixKeyType: u.pixKeyType,
      whatsappPhone: u.whatsappPhone,
      createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : u.createdAt,
    };
  });

  // Map payments with customer name
  const enrichedPayments = allPayments.map((p) => {
    const cust = allUsers.find((u) => u.id === p.userId);
    return {
      ...p,
      userName: cust ? cust.name : 'Cliente',
      userEmail: cust ? cust.email : '',
      createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
      paidAt: p.paidAt instanceof Date ? p.paidAt.toISOString() : p.paidAt,
    };
  });

  // Map withdrawals with affiliate name
  const enrichedWithdrawals = allWithdrawals.map((w) => {
    const aff = allUsers.find((u) => u.id === w.affiliateUserId);
    return {
      ...w,
      affiliateName: aff ? aff.name : 'Afiliado',
      affiliateEmail: aff ? aff.email : '',
      requestedAt: w.requestedAt instanceof Date ? w.requestedAt.toISOString() : w.requestedAt,
      processedAt: w.processedAt instanceof Date ? w.processedAt.toISOString() : w.processedAt,
    };
  });

  return {
    metrics: {
      totalUsers,
      activeUsers,
      paidSubscribers,
      trialUsers,
      mrrCents,
      pendingCommissionsCents,
      totalCommissionsPaidCents,
    },
    users: safeUsers,
    payments: enrichedPayments,
    withdrawals: enrichedWithdrawals,
    coupons: allCoupons,
  };
}

export async function adminUpdateUser(
  userId: number,
  data: {
    name?: string;
    email?: string;
    role?: 'admin' | 'user';
    subscriptionStatus?: 'trial' | 'active' | 'expired' | 'suspended';
    extendTrialDays?: number;
    newPasswordHash?: string;
  }
) {
  const updates: any = {};
  if (data.name) updates.name = data.name;
  if (data.email) updates.email = data.email.toLowerCase();
  if (data.role) updates.role = data.role;
  if (data.subscriptionStatus) updates.subscriptionStatus = data.subscriptionStatus;
  if (data.newPasswordHash) updates.passwordHash = data.newPasswordHash;

  if (data.extendTrialDays && data.extendTrialDays > 0) {
    const newTrialDate = new Date(Date.now() + data.extendTrialDays * 24 * 60 * 60 * 1000);
    updates.trialEndsAt = newTrialDate;
    updates.subscriptionStatus = 'trial';
  }

  const updated = await updateUserRecord(userId, updates);
  return updated;
}

export async function adminCreateCoupon(coupon: {
  code: string;
  discountPercent?: number;
  discountCents?: number;
  maxUses?: number;
  expiresAt?: string;
}) {
  const cleanCode = coupon.code.trim().toUpperCase();
  const isDb = await checkDb();

  if (isDb) {
    try {
      const [newC] = await db
        .insert(schema.coupons)
        .values({
          code: cleanCode,
          discountPercent: coupon.discountPercent || 0,
          discountCents: coupon.discountCents || 0,
          maxUses: coupon.maxUses || 100,
          expiresAt: coupon.expiresAt || null,
          active: true,
        })
        .returning();
      return newC;
    } catch {}
  }

  const newC = {
    id: memStore.coupons.length + 1,
    code: cleanCode,
    discountPercent: coupon.discountPercent || 0,
    discountCents: coupon.discountCents || 0,
    active: true,
    maxUses: coupon.maxUses || 100,
    usedCount: 0,
    expiresAt: coupon.expiresAt || null,
    createdAt: new Date().toISOString(),
  };
  memStore.coupons.push(newC);
  return newC;
}

export async function adminToggleCoupon(couponId: number, active: boolean) {
  const isDb = await checkDb();
  if (isDb) {
    try {
      await db.update(schema.coupons).set({ active }).where(eq(schema.coupons.id, couponId));
    } catch {}
  }
  const c = memStore.coupons.find((x) => x.id === couponId);
  if (c) c.active = active;
  return true;
}

export async function adminDeleteCoupon(couponId: number) {
  const isDb = await checkDb();
  if (isDb) {
    try {
      await db.delete(schema.coupons).where(eq(schema.coupons.id, couponId));
    } catch {}
  }
  memStore.coupons = memStore.coupons.filter((x) => x.id !== couponId);
  return true;
}

export async function adminProcessWithdrawal(
  withdrawalId: number,
  status: 'approved' | 'paid' | 'rejected',
  notes?: string,
  receiptReference?: string
) {
  const isDb = await checkDb();
  const processedAt = new Date();

  if (isDb) {
    try {
      await db
        .update(schema.affiliateWithdrawals)
        .set({
          status,
          notes: notes || undefined,
          receiptReference: receiptReference || undefined,
          processedAt,
        })
        .where(eq(schema.affiliateWithdrawals.id, withdrawalId));
    } catch {}
  }

  const w = memStore.affiliateWithdrawals.find((x) => x.id === withdrawalId);
  if (w) {
    w.status = status;
    if (notes) w.notes = notes;
    if (receiptReference) w.receiptReference = receiptReference;
    w.processedAt = processedAt.toISOString();
  }
  return true;
}


// ===============================================================
// KANBAN BOARDS ("Quadros") — CRUD completo com isolamento por usuário
// ===============================================================

const DEFAULT_BOARD_LISTS = ['A fazer', 'Em andamento', 'Concluído'];

function mapBoard(b: any): BoardItem {
  return {
    ...b,
    description: b.description || '',
    createdAt: b.createdAt instanceof Date ? b.createdAt.toISOString() : b.createdAt,
    updatedAt: b.updatedAt instanceof Date ? b.updatedAt.toISOString() : b.updatedAt,
  };
}
function mapList(l: any): BoardListItem {
  return { ...l, createdAt: l.createdAt instanceof Date ? l.createdAt.toISOString() : l.createdAt };
}
function mapCard(c: any): BoardCardItem {
  let labels: string[] = [];
  try {
    labels = typeof c.labels === 'string' ? JSON.parse(c.labels) : c.labels || [];
  } catch {
    labels = [];
  }
  return {
    ...c,
    labels,
    description: c.description || '',
    assignee: c.assignee || '',
    createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
    updatedAt: c.updatedAt instanceof Date ? c.updatedAt.toISOString() : c.updatedAt,
  };
}
function mapChecklistItem(i: any): BoardChecklistItemType {
  return { ...i, createdAt: i.createdAt instanceof Date ? i.createdAt.toISOString() : i.createdAt };
}
function mapComment(c: any): BoardCardCommentItem {
  return { ...c, createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt };
}

// ---- Boards ----
export async function getBoards(userId: number): Promise<BoardItem[]> {
  const isDb = await checkDb();
  if (isDb) {
    try {
      const rows = await db
        .select()
        .from(schema.boards)
        .where(and(eq(schema.boards.userId, userId), eq(schema.boards.archived, false)))
        .orderBy(schema.boards.position, schema.boards.id);
      return rows.map(mapBoard);
    } catch {
      // fallback
    }
  }
  return memStore.boards
    .filter((b) => b.userId === userId && !b.archived)
    .sort((a, b) => a.position - b.position || a.id - b.id)
    .map(mapBoard);
}

export async function createBoard(
  userId: number,
  data: { title: string; description?: string; color?: string }
): Promise<BoardItem> {
  const isDb = await checkDb();
  let board: BoardItem;

  if (isDb) {
    try {
      const existing = await db.select().from(schema.boards).where(eq(schema.boards.userId, userId));
      const [row] = await db
        .insert(schema.boards)
        .values({
          userId,
          title: data.title,
          description: data.description || '',
          color: data.color || 'emerald',
          position: existing.length,
        })
        .returning();
      board = mapBoard(row);
    } catch {
      board = createBoardInMemory(userId, data);
    }
  } else {
    board = createBoardInMemory(userId, data);
  }

  // Semeia as 3 colunas padrão (A fazer / Em andamento / Concluído)
  for (let i = 0; i < DEFAULT_BOARD_LISTS.length; i++) {
    await createList(board.id, userId, DEFAULT_BOARD_LISTS[i], i);
  }

  return board;
}

function createBoardInMemory(userId: number, data: { title: string; description?: string; color?: string }): BoardItem {
  const id = memStore.boards.length > 0 ? Math.max(...memStore.boards.map((b) => b.id)) + 1 : 1;
  const position = memStore.boards.filter((b) => b.userId === userId).length;
  const now = new Date().toISOString();
  const board = {
    id,
    userId,
    title: data.title,
    description: data.description || '',
    color: data.color || 'emerald',
    position,
    archived: false,
    createdAt: now,
    updatedAt: now,
  };
  memStore.boards.push(board);
  return mapBoard(board);
}

export async function getBoardById(boardId: number, userId: number): Promise<BoardItem | null> {
  const isDb = await checkDb();
  if (isDb) {
    try {
      const [row] = await db
        .select()
        .from(schema.boards)
        .where(and(eq(schema.boards.id, boardId), eq(schema.boards.userId, userId)));
      if (row) return mapBoard(row);
    } catch {
      // fallback
    }
  }
  const b = memStore.boards.find((x) => x.id === boardId && x.userId === userId);
  return b ? mapBoard(b) : null;
}

export async function updateBoard(
  boardId: number,
  userId: number,
  updates: { title?: string; description?: string; color?: string; archived?: boolean }
): Promise<BoardItem | null> {
  const isDb = await checkDb();
  if (isDb) {
    try {
      const [updated] = await db
        .update(schema.boards)
        .set({ ...updates, updatedAt: new Date() })
        .where(and(eq(schema.boards.id, boardId), eq(schema.boards.userId, userId)))
        .returning();
      if (updated) return mapBoard(updated);
    } catch {
      // fallback
    }
  }
  const b = memStore.boards.find((x) => x.id === boardId && x.userId === userId);
  if (!b) return null;
  Object.assign(b, updates, { updatedAt: new Date().toISOString() });
  return mapBoard(b);
}

export async function duplicateBoard(boardId: number, userId: number): Promise<BoardItem | null> {
  const original = await getBoardById(boardId, userId);
  if (!original) return null;

  const { lists, cards, checklistItems } = await getBoardFullData(boardId, userId);
  const newBoard = await createBoardForDuplication(userId, `${original.title} (cópia)`, original.description || '', original.color);

  // remove as 3 colunas padrão criadas automaticamente — vamos recriar as colunas originais
  const autoLists = await getBoardLists(newBoard.id, userId);
  for (const l of autoLists) await deleteList(l.id, userId);

  const listIdMap = new Map<number, number>();
  for (const list of lists.sort((a, b) => a.position - b.position)) {
    const newList = await createList(newBoard.id, userId, list.title, list.position);
    listIdMap.set(list.id, newList.id);
  }

  for (const card of cards.filter((c) => !c.archived)) {
    const newListId = listIdMap.get(card.listId);
    if (!newListId) continue;
    const newCard = await createCard(newListId, userId, {
      title: card.title,
      description: card.description || '',
      priority: card.priority,
      labels: card.labels,
      assignee: card.assignee || '',
      dueDate: card.dueDate || undefined,
      position: card.position,
    });
    const items = checklistItems.filter((i) => i.cardId === card.id);
    for (const item of items) {
      await addChecklistItem(newCard.id, userId, item.text, item.done);
    }
  }

  return newBoard;
}

async function createBoardForDuplication(userId: number, title: string, description: string, color: string): Promise<BoardItem> {
  const isDb = await checkDb();
  if (isDb) {
    try {
      const existing = await db.select().from(schema.boards).where(eq(schema.boards.userId, userId));
      const [row] = await db
        .insert(schema.boards)
        .values({ userId, title, description, color, position: existing.length })
        .returning();
      return mapBoard(row);
    } catch {
      // fallback
    }
  }
  return createBoardInMemory(userId, { title, description, color });
}

export async function deleteBoard(boardId: number, userId: number): Promise<boolean> {
  const isDb = await checkDb();
  if (isDb) {
    try {
      await db.delete(schema.boards).where(and(eq(schema.boards.id, boardId), eq(schema.boards.userId, userId)));
      return true;
    } catch {
      // fallback
    }
  }
  const listIds = memStore.boardLists.filter((l) => l.boardId === boardId && l.userId === userId).map((l) => l.id);
  const cardIds = memStore.boardCards.filter((c) => c.boardId === boardId && c.userId === userId).map((c) => c.id);
  memStore.boardCardComments = memStore.boardCardComments.filter((c) => !cardIds.includes(c.cardId));
  memStore.boardChecklistItems = memStore.boardChecklistItems.filter((i) => !cardIds.includes(i.cardId));
  memStore.boardCards = memStore.boardCards.filter((c) => !(c.boardId === boardId && c.userId === userId));
  memStore.boardLists = memStore.boardLists.filter((l) => !(l.boardId === boardId && l.userId === userId));
  memStore.boards = memStore.boards.filter((b) => !(b.id === boardId && b.userId === userId));
  return true;
}

// ---- Full board (lists + cards + checklist + comments) ----
export async function getBoardFullData(
  boardId: number,
  userId: number
): Promise<{ lists: BoardListItem[]; cards: BoardCardItem[]; checklistItems: BoardChecklistItemType[]; comments: BoardCardCommentItem[] }> {
  const lists = await getBoardLists(boardId, userId);
  const cards = await getBoardCards(boardId, userId);
  const cardIds = cards.map((c) => c.id);

  const isDb = await checkDb();
  if (isDb) {
    try {
      const checklistRows = cardIds.length
        ? await db.select().from(schema.boardChecklistItems).where(eq(schema.boardChecklistItems.userId, userId))
        : [];
      const commentRows = cardIds.length
        ? await db.select().from(schema.boardCardComments).where(eq(schema.boardCardComments.userId, userId))
        : [];
      return {
        lists,
        cards,
        checklistItems: checklistRows.filter((i) => cardIds.includes(i.cardId)).map(mapChecklistItem),
        comments: commentRows.filter((c) => cardIds.includes(c.cardId)).map(mapComment),
      };
    } catch {
      // fallback
    }
  }

  return {
    lists,
    cards,
    checklistItems: memStore.boardChecklistItems
      .filter((i) => cardIds.includes(i.cardId) && i.userId === userId)
      .map(mapChecklistItem),
    comments: memStore.boardCardComments.filter((c) => cardIds.includes(c.cardId) && c.userId === userId).map(mapComment),
  };
}

// ---- Lists ----
export async function getBoardLists(boardId: number, userId: number): Promise<BoardListItem[]> {
  const isDb = await checkDb();
  if (isDb) {
    try {
      const rows = await db
        .select()
        .from(schema.boardLists)
        .where(and(eq(schema.boardLists.boardId, boardId), eq(schema.boardLists.userId, userId), eq(schema.boardLists.archived, false)))
        .orderBy(schema.boardLists.position, schema.boardLists.id);
      return rows.map(mapList);
    } catch {
      // fallback
    }
  }
  return memStore.boardLists
    .filter((l) => l.boardId === boardId && l.userId === userId && !l.archived)
    .sort((a, b) => a.position - b.position || a.id - b.id)
    .map(mapList);
}

export async function createList(boardId: number, userId: number, title: string, position?: number): Promise<BoardListItem> {
  const isDb = await checkDb();
  const pos = position ?? (await getBoardLists(boardId, userId)).length;

  if (isDb) {
    try {
      const [row] = await db.insert(schema.boardLists).values({ boardId, userId, title, position: pos }).returning();
      return mapList(row);
    } catch {
      // fallback
    }
  }
  const id = memStore.boardLists.length > 0 ? Math.max(...memStore.boardLists.map((l) => l.id)) + 1 : 1;
  const list = { id, boardId, userId, title, position: pos, archived: false, createdAt: new Date().toISOString() };
  memStore.boardLists.push(list);
  return mapList(list);
}

export async function updateList(
  listId: number,
  userId: number,
  updates: { title?: string; position?: number; archived?: boolean }
): Promise<BoardListItem | null> {
  const isDb = await checkDb();
  if (isDb) {
    try {
      const [updated] = await db
        .update(schema.boardLists)
        .set(updates)
        .where(and(eq(schema.boardLists.id, listId), eq(schema.boardLists.userId, userId)))
        .returning();
      if (updated) return mapList(updated);
    } catch {
      // fallback
    }
  }
  const l = memStore.boardLists.find((x) => x.id === listId && x.userId === userId);
  if (!l) return null;
  Object.assign(l, updates);
  return mapList(l);
}

export async function reorderLists(boardId: number, userId: number, orderedListIds: number[]): Promise<boolean> {
  for (let i = 0; i < orderedListIds.length; i++) {
    await updateList(orderedListIds[i], userId, { position: i });
  }
  return true;
}

export async function deleteList(listId: number, userId: number): Promise<boolean> {
  const isDb = await checkDb();
  if (isDb) {
    try {
      await db.delete(schema.boardLists).where(and(eq(schema.boardLists.id, listId), eq(schema.boardLists.userId, userId)));
      return true;
    } catch {
      // fallback
    }
  }
  const cardIds = memStore.boardCards.filter((c) => c.listId === listId && c.userId === userId).map((c) => c.id);
  memStore.boardCardComments = memStore.boardCardComments.filter((c) => !cardIds.includes(c.cardId));
  memStore.boardChecklistItems = memStore.boardChecklistItems.filter((i) => !cardIds.includes(i.cardId));
  memStore.boardCards = memStore.boardCards.filter((c) => !(c.listId === listId && c.userId === userId));
  memStore.boardLists = memStore.boardLists.filter((l) => !(l.id === listId && l.userId === userId));
  return true;
}

// ---- Cards ----
export async function getBoardCards(boardId: number, userId: number): Promise<BoardCardItem[]> {
  const isDb = await checkDb();
  if (isDb) {
    try {
      const rows = await db
        .select()
        .from(schema.boardCards)
        .where(and(eq(schema.boardCards.boardId, boardId), eq(schema.boardCards.userId, userId), eq(schema.boardCards.archived, false)))
        .orderBy(schema.boardCards.position, schema.boardCards.id);
      return rows.map(mapCard);
    } catch {
      // fallback
    }
  }
  return memStore.boardCards
    .filter((c) => c.boardId === boardId && c.userId === userId && !c.archived)
    .sort((a, b) => a.position - b.position || a.id - b.id)
    .map(mapCard);
}

export async function createCard(
  listId: number,
  userId: number,
  data: Partial<BoardCardItem> & { title: string }
): Promise<BoardCardItem> {
  const isDb = await checkDb();
  if (isDb) {
    try {
      const [list] = await db.select().from(schema.boardLists).where(and(eq(schema.boardLists.id, listId), eq(schema.boardLists.userId, userId)));
      if (!list) throw new Error('Lista não encontrada ou não pertence ao usuário.');

      const existing = await db.select().from(schema.boardCards).where(eq(schema.boardCards.listId, listId));
      const [row] = await db
        .insert(schema.boardCards)
        .values({
          listId,
          boardId: list.boardId,
          userId,
          title: data.title,
          description: data.description || '',
          priority: data.priority || 'media',
          labels: JSON.stringify(data.labels || []),
          assignee: data.assignee || '',
          dueDate: data.dueDate || null,
          position: data.position ?? existing.length,
        })
        .returning();
      return mapCard(row);
    } catch {
      // fallback
    }
  }

  const list = memStore.boardLists.find((l) => l.id === listId && l.userId === userId);
  if (!list) throw new Error('Lista não encontrada ou não pertence ao usuário.');

  const id = memStore.boardCards.length > 0 ? Math.max(...memStore.boardCards.map((c) => c.id)) + 1 : 1;
  const position = data.position ?? memStore.boardCards.filter((c) => c.listId === listId).length;
  const now = new Date().toISOString();
  const card = {
    id,
    listId,
    boardId: list.boardId,
    userId,
    title: data.title,
    description: data.description || '',
    priority: data.priority || 'media',
    labels: JSON.stringify(data.labels || []),
    assignee: data.assignee || '',
    dueDate: data.dueDate || null,
    position,
    archived: false,
    createdAt: now,
    updatedAt: now,
  };
  memStore.boardCards.push(card);
  return mapCard(card);
}

export async function updateCard(
  cardId: number,
  userId: number,
  updates: Partial<Pick<BoardCardItem, 'title' | 'description' | 'priority' | 'labels' | 'assignee' | 'dueDate' | 'archived'>>
): Promise<BoardCardItem | null> {
  const isDb = await checkDb();
  const patch: any = { ...updates, updatedAt: new Date() };
  if (updates.labels !== undefined) patch.labels = JSON.stringify(updates.labels);

  if (isDb) {
    try {
      const [updated] = await db
        .update(schema.boardCards)
        .set(patch)
        .where(and(eq(schema.boardCards.id, cardId), eq(schema.boardCards.userId, userId)))
        .returning();
      if (updated) return mapCard(updated);
    } catch {
      // fallback
    }
  }
  const c = memStore.boardCards.find((x) => x.id === cardId && x.userId === userId);
  if (!c) return null;
  Object.assign(c, { ...updates, labels: updates.labels !== undefined ? JSON.stringify(updates.labels) : c.labels, updatedAt: new Date().toISOString() });
  return mapCard(c);
}

// Move um cartão para (possivelmente) outra lista, numa posição específica,
// reindexando as posições de forma estável na(s) lista(s) afetada(s).
export async function moveCard(cardId: number, userId: number, targetListId: number, targetPosition: number): Promise<boolean> {
  const isDb = await checkDb();

  if (isDb) {
    try {
      const [card] = await db.select().from(schema.boardCards).where(and(eq(schema.boardCards.id, cardId), eq(schema.boardCards.userId, userId)));
      if (!card) return false;
      const [targetList] = await db
        .select()
        .from(schema.boardLists)
        .where(and(eq(schema.boardLists.id, targetListId), eq(schema.boardLists.userId, userId)));
      if (!targetList) return false;

      const sourceListId = card.listId;
      await db.update(schema.boardCards).set({ listId: targetListId }).where(eq(schema.boardCards.id, cardId));

      const targetCards = (await db.select().from(schema.boardCards).where(and(eq(schema.boardCards.listId, targetListId), eq(schema.boardCards.archived, false))))
        .filter((c) => c.id !== cardId)
        .sort((a, b) => a.position - b.position);
      const clampedPos = Math.max(0, Math.min(targetPosition, targetCards.length));
      targetCards.splice(clampedPos, 0, { ...card, listId: targetListId } as any);

      for (let i = 0; i < targetCards.length; i++) {
        await db.update(schema.boardCards).set({ position: i }).where(eq(schema.boardCards.id, targetCards[i].id));
      }

      if (sourceListId !== targetListId) {
        const sourceCards = (await db.select().from(schema.boardCards).where(and(eq(schema.boardCards.listId, sourceListId), eq(schema.boardCards.archived, false))))
          .sort((a, b) => a.position - b.position);
        for (let i = 0; i < sourceCards.length; i++) {
          await db.update(schema.boardCards).set({ position: i }).where(eq(schema.boardCards.id, sourceCards[i].id));
        }
      }
      return true;
    } catch {
      // fallback
    }
  }

  const card = memStore.boardCards.find((c) => c.id === cardId && c.userId === userId);
  if (!card) return false;
  const targetList = memStore.boardLists.find((l) => l.id === targetListId && l.userId === userId);
  if (!targetList) return false;

  const sourceListId = card.listId;
  card.listId = targetListId;

  const targetCards = memStore.boardCards
    .filter((c) => c.listId === targetListId && c.id !== cardId && !c.archived)
    .sort((a, b) => a.position - b.position);
  const clampedPos = Math.max(0, Math.min(targetPosition, targetCards.length));
  targetCards.splice(clampedPos, 0, card);
  targetCards.forEach((c, i) => (c.position = i));

  if (sourceListId !== targetListId) {
    const sourceCards = memStore.boardCards
      .filter((c) => c.listId === sourceListId && !c.archived)
      .sort((a, b) => a.position - b.position);
    sourceCards.forEach((c, i) => (c.position = i));
  }
  return true;
}

export async function deleteCard(cardId: number, userId: number): Promise<boolean> {
  const isDb = await checkDb();
  if (isDb) {
    try {
      await db.delete(schema.boardCards).where(and(eq(schema.boardCards.id, cardId), eq(schema.boardCards.userId, userId)));
      return true;
    } catch {
      // fallback
    }
  }
  memStore.boardCardComments = memStore.boardCardComments.filter((c) => c.cardId !== cardId);
  memStore.boardChecklistItems = memStore.boardChecklistItems.filter((i) => i.cardId !== cardId);
  memStore.boardCards = memStore.boardCards.filter((c) => !(c.id === cardId && c.userId === userId));
  return true;
}

// ---- Checklist items ----
export async function addChecklistItem(cardId: number, userId: number, text: string, done = false): Promise<BoardChecklistItemType> {
  const isDb = await checkDb();
  if (isDb) {
    try {
      const [card] = await db.select().from(schema.boardCards).where(and(eq(schema.boardCards.id, cardId), eq(schema.boardCards.userId, userId)));
      if (!card) throw new Error('Cartão não encontrado ou não pertence ao usuário.');
      const existing = await db.select().from(schema.boardChecklistItems).where(eq(schema.boardChecklistItems.cardId, cardId));
      const [row] = await db
        .insert(schema.boardChecklistItems)
        .values({ cardId, userId, text, done, position: existing.length })
        .returning();
      return mapChecklistItem(row);
    } catch {
      // fallback
    }
  }
  const card = memStore.boardCards.find((c) => c.id === cardId && c.userId === userId);
  if (!card) throw new Error('Cartão não encontrado ou não pertence ao usuário.');
  const id = memStore.boardChecklistItems.length > 0 ? Math.max(...memStore.boardChecklistItems.map((i) => i.id)) + 1 : 1;
  const position = memStore.boardChecklistItems.filter((i) => i.cardId === cardId).length;
  const item = { id, cardId, userId, text, done, position, createdAt: new Date().toISOString() };
  memStore.boardChecklistItems.push(item);
  return mapChecklistItem(item);
}

export async function toggleChecklistItem(itemId: number, userId: number, done: boolean): Promise<boolean> {
  const isDb = await checkDb();
  if (isDb) {
    try {
      await db
        .update(schema.boardChecklistItems)
        .set({ done })
        .where(and(eq(schema.boardChecklistItems.id, itemId), eq(schema.boardChecklistItems.userId, userId)));
      return true;
    } catch {
      // fallback
    }
  }
  const item = memStore.boardChecklistItems.find((i) => i.id === itemId && i.userId === userId);
  if (!item) return false;
  item.done = done;
  return true;
}

export async function deleteChecklistItem(itemId: number, userId: number): Promise<boolean> {
  const isDb = await checkDb();
  if (isDb) {
    try {
      await db.delete(schema.boardChecklistItems).where(and(eq(schema.boardChecklistItems.id, itemId), eq(schema.boardChecklistItems.userId, userId)));
      return true;
    } catch {
      // fallback
    }
  }
  memStore.boardChecklistItems = memStore.boardChecklistItems.filter((i) => !(i.id === itemId && i.userId === userId));
  return true;
}

// ---- Comments / activity ----
export async function addComment(cardId: number, userId: number, authorName: string, text: string): Promise<BoardCardCommentItem> {
  const isDb = await checkDb();
  if (isDb) {
    try {
      const [card] = await db.select().from(schema.boardCards).where(and(eq(schema.boardCards.id, cardId), eq(schema.boardCards.userId, userId)));
      if (!card) throw new Error('Cartão não encontrado ou não pertence ao usuário.');
      const [row] = await db.insert(schema.boardCardComments).values({ cardId, userId, authorName, text }).returning();
      return mapComment(row);
    } catch {
      // fallback
    }
  }
  const card = memStore.boardCards.find((c) => c.id === cardId && c.userId === userId);
  if (!card) throw new Error('Cartão não encontrado ou não pertence ao usuário.');
  const id = memStore.boardCardComments.length > 0 ? Math.max(...memStore.boardCardComments.map((c) => c.id)) + 1 : 1;
  const comment = { id, cardId, userId, authorName, text, createdAt: new Date().toISOString() };
  memStore.boardCardComments.push(comment);
  return mapComment(comment);
}

export async function deleteComment(commentId: number, userId: number): Promise<boolean> {
  const isDb = await checkDb();
  if (isDb) {
    try {
      await db.delete(schema.boardCardComments).where(and(eq(schema.boardCardComments.id, commentId), eq(schema.boardCardComments.userId, userId)));
      return true;
    } catch {
      // fallback
    }
  }
  memStore.boardCardComments = memStore.boardCardComments.filter((c) => !(c.id === commentId && c.userId === userId));
  return true;
}
