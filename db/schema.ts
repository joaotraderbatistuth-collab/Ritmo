import { pgTable, serial, text, timestamp, integer, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("user"), // 'user' | 'admin'
  subscriptionStatus: text("subscription_status").notNull().default("trial"), // 'trial' | 'active' | 'expired' | 'suspended'
  trialEndsAt: timestamp("trial_ends_at"),
  subscriptionRenewalDate: text("subscription_renewal_date"),
  pixKey: text("pix_key"),
  pixKeyType: text("pix_key_type").default("cpf"), // 'cpf' | 'email' | 'telefone' | 'aleatoria'
  timezone: text("timezone").notNull().default("America/Sao_Paulo"),
  themePreference: text("theme_preference").notNull().default("dark"),
  referralCode: text("referral_code").notNull().unique(),
  referredBy: text("referred_by"),
  whatsappPhone: text("whatsapp_phone"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const focusCycles = pgTable("focus_cycles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  mainGoal: text("main_goal").notNull(),
  secondaryGoals: text("secondary_goals").default("[]"),
  durationDays: integer("duration_days").notNull(), // 7, 21, 40, 90
  startDate: text("start_date").notNull(), // YYYY-MM-DD
  endDate: text("end_date").notNull(), // YYYY-MM-DD
  routineLevel: text("routine_level").notNull().default("equilibrado"), // leve, equilibrado, intensivo
  preferredTimes: text("preferred_times").default(""),
  digitalLimits: text("digital_limits").default(""),
  status: text("status").notNull().default("active"), // active, completed, paused
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  cycleId: integer("cycle_id").references(() => focusCycles.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description").default(""),
  category: text("category").notNull().default("geral"), // trabalho, estudo, saude, financas, pessoal
  priority: text("priority").notNull().default("media"), // baixa, media, alta
  date: text("date").notNull(), // YYYY-MM-DD
  startTime: text("start_time").default(""),
  estimatedMinutes: integer("estimated_minutes").default(30),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  isRecurring: boolean("is_recurring").notNull().default(false),
  recurrenceRule: text("recurrence_rule").default(""), // daily, weekdays, weekly
  timeBlock: text("time_block").default("Manhã"), // Manhã, Tarde, Noite, Flexível
  notes: text("notes").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const habits = pgTable("habits", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  cycleId: integer("cycle_id").references(() => focusCycles.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  category: text("category").notNull().default("geral"), // movimento, estudo, mente, sono, hidratacao, desconexao, personalizado
  targetFrequency: text("target_frequency").notNull().default("diario"),
  notes: text("notes").default(""),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const habitLogs = pgTable("habit_logs", {
  id: serial("id").primaryKey(),
  habitId: integer("habit_id").notNull().references(() => habits.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: text("date").notNull(), // YYYY-MM-DD
  completed: boolean("completed").notNull().default(true),
  value: text("value").default(""),
  notes: text("notes").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const focusSessions = pgTable("focus_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  cycleId: integer("cycle_id").references(() => focusCycles.id, { onDelete: "set null" }),
  focusTopic: text("focus_topic").default(""),
  durationMinutes: integer("duration_minutes").notNull(),
  sessionType: text("session_type").notNull().default("custom"), // 25_5, 50_10, custom
  status: text("status").notNull().default("completed"), // completed, interrupted
  date: text("date").notNull(), // YYYY-MM-DD
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const journalEntries = pgTable("journal_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  cycleId: integer("cycle_id").references(() => focusCycles.id, { onDelete: "set null" }),
  date: text("date").notNull(), // YYYY-MM-DD
  entryType: text("entry_type").notNull().default("daily_checkin"), // daily_checkin, weekly_review
  energyScore: integer("energy_score").default(3), // 1..5
  moodScore: integer("mood_score").default(3), // 1..5
  focusScore: integer("focus_score").default(3), // 1..5
  workedWell: text("worked_well").default(""),
  nextStep: text("next_step").default(""),
  difficulties: text("difficulties").default(""),
  notes: text("notes").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const financeTransactions = pgTable("finance_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'income' | 'expense'
  description: text("description").notNull(),
  amountCents: integer("amount_cents").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD
  category: text("category").notNull().default("outros"),
  paymentMethod: text("payment_method").default("pix"),
  accountWallet: text("account_wallet").notNull().default("Principal"),
  isRecurring: boolean("is_recurring").notNull().default(false),
  recurrenceInterval: text("recurrence_interval").default("mensal"),
  isInstallment: boolean("is_installment").notNull().default(false),
  currentInstallment: integer("current_installment").default(1),
  totalInstallments: integer("total_installments").default(1),
  status: text("status").notNull().default("paid"), // paid, pending, received, overdue
  dueDate: text("due_date"),
  notes: text("notes").default(""),
  source: text("source").notNull().default("web"), // web, whatsapp, api
  syncedToSheets: boolean("synced_to_sheets").notNull().default(false),
  sheetsRowId: text("sheets_row_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const financeBudgets = pgTable("finance_budgets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  category: text("category").notNull(),
  monthYear: text("month_year").notNull(), // YYYY-MM
  budgetLimitCents: integer("budget_limit_cents").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const integrationsConfig = pgTable("integrations_config", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),
  whatsappPhone: text("whatsapp_phone"),
  whatsappStatus: text("whatsapp_status").notNull().default("disconnected"),
  sheetsStatus: text("sheets_status").notNull().default("disconnected"),
  sheetsSpreadsheetId: text("sheets_spreadsheet_id"),
  sheetsSpreadsheetName: text("sheets_spreadsheet_name").default("Ritmo - Finanças Pessoais"),
  sheetsAutoSync: boolean("sheets_auto_sync").notNull().default(true),
  remindersConfig: text("reminders_config").default('{"tasks":true,"habits":true,"financeDue":true,"weeklyReview":true}'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const affiliateReferrals = pgTable("affiliate_referrals", {
  id: serial("id").primaryKey(),
  affiliateUserId: integer("affiliate_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  referredUserId: integer("referred_user_id").references(() => users.id, { onDelete: "set null" }),
  referralCode: text("referral_code").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  clickCount: integer("click_count").notNull().default(1),
  status: text("status").notNull().default("active"), // active, converted, fraud_blocked
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const affiliateCommissions = pgTable("affiliate_commissions", {
  id: serial("id").primaryKey(),
  affiliateUserId: integer("affiliate_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  referredUserId: integer("referred_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  orderReference: text("order_reference").notNull(),
  baseAmountCents: integer("base_amount_cents").notNull(),
  commissionRatePercent: integer("commission_rate_percent").notNull().default(60),
  commissionCents: integer("commission_cents").notNull(),
  status: text("status").notNull().default("pending"), // pending, approved, paid, refunded, reversed
  payoutReference: text("payout_reference"),
  payoutStatus: text("payout_status").notNull().default("manual"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const affiliateSettings = pgTable("affiliate_settings", {
  id: serial("id").primaryKey(),
  commissionRatePercent: integer("commission_rate_percent").notNull().default(60),
  attributionWindowDays: integer("attribution_window_days").notNull().default(60),
  minPayoutCents: integer("min_payout_cents").notNull().default(2394), // R$ 23,94 (1 comissão de R$ 39,90 * 60%)
  terms: text("terms").notNull().default("Comissão de 60% (R$ 23,94) sobre pagamentos recorrentes líquidos elegíveis de novos assinantes pagos indicados via link único. Resgate via chave PIX."),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  token: text("token").notNull().unique(),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  plan: text("plan").notNull().default("pro_monthly"),
  amountCents: integer("amount_cents").notNull().default(3990),
  status: text("status").notNull().default("trial"), // trial, active, past_due, canceled, expired
  provider: text("provider").notNull().default("pix_mercadopago"),
  renewalDate: text("renewal_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  orderReference: text("order_reference").notNull().unique(),
  amountCents: integer("amount_cents").notNull(),
  discountCents: integer("discount_cents").notNull().default(0),
  couponCode: text("coupon_code"),
  status: text("status").notNull().default("pending"), // pending, paid, failed, refunded
  paymentMethod: text("payment_method").notNull().default("pix"), // pix, credit_card
  paidAt: timestamp("paid_at"),
  pixQrCode: text("pix_qr_code"),
  pixCopiaECola: text("pix_copia_e_cola"),
  invoiceUrl: text("invoice_url"),
  providerPaymentId: text("provider_payment_id"), // ID do pagamento no Mercado Pago, quando real
  isSimulated: boolean("is_simulated").notNull().default(true), // false quando confirmado via Mercado Pago real
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  discountPercent: integer("discount_percent").default(0),
  discountCents: integer("discount_cents").default(0),
  active: boolean("active").notNull().default(true),
  maxUses: integer("max_uses").notNull().default(100),
  usedCount: integer("used_count").notNull().default(0),
  expiresAt: text("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// KANBAN BOARDS ("Quadros") — módulo de organização visual estilo Trello
// ---------------------------------------------------------------------------
export const boards = pgTable("boards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").default(""),
  color: text("color").notNull().default("emerald"),
  position: integer("position").notNull().default(0),
  archived: boolean("archived").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const boardLists = pgTable("board_lists", {
  id: serial("id").primaryKey(),
  boardId: integer("board_id").notNull().references(() => boards.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  position: integer("position").notNull().default(0),
  archived: boolean("archived").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const boardCards = pgTable("board_cards", {
  id: serial("id").primaryKey(),
  listId: integer("list_id").notNull().references(() => boardLists.id, { onDelete: "cascade" }),
  boardId: integer("board_id").notNull().references(() => boards.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").default(""),
  priority: text("priority").notNull().default("media"), // baixa, media, alta
  labels: text("labels").default("[]"), // JSON string[]
  assignee: text("assignee").default(""), // campo livre (app não tem times/multiusuário)
  dueDate: text("due_date"), // YYYY-MM-DD
  position: integer("position").notNull().default(0),
  archived: boolean("archived").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const boardChecklistItems = pgTable("board_checklist_items", {
  id: serial("id").primaryKey(),
  cardId: integer("card_id").notNull().references(() => boardCards.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  done: boolean("done").notNull().default(false),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const boardCardComments = pgTable("board_card_comments", {
  id: serial("id").primaryKey(),
  cardId: integer("card_id").notNull().references(() => boardCards.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  authorName: text("author_name").notNull(),
  text: text("text").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const affiliateWithdrawals = pgTable("affiliate_withdrawals", {
  id: serial("id").primaryKey(),
  affiliateUserId: integer("affiliate_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amountCents: integer("amount_cents").notNull(),
  pixKey: text("pix_key").notNull(),
  pixKeyType: text("pix_key_type").notNull().default("cpf"), // cpf, email, telefone, aleatoria
  status: text("status").notNull().default("pending"), // pending, approved, paid, rejected
  notes: text("notes"),
  receiptReference: text("receipt_reference"),
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at"),
});
