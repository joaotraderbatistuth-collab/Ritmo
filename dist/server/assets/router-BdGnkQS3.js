import { createRootRoute, HeadContent, Scripts, createFileRoute, lazyRouteComponent, createRouter } from "@tanstack/react-router";
import { jsxs, jsx } from "react/jsx-runtime";
import bcrypt from "bcryptjs";
import { jwtVerify, SignJWT } from "jose";
import { eq, and, desc, ne, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/netlify-db";
import { pgTable, timestamp, boolean, text, integer, serial } from "drizzle-orm/pg-core";
import crypto from "crypto";
const siteName = "Ritmo — Foco, Hábitos & Finanças";
const siteDescription = "Plataforma completa de produtividade, ciclos de foco estilo Modo Caverna, acompanhamento de hábitos e gestão financeira pessoal equilibrada.";
const Route$m = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8"
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1"
      },
      {
        title: siteName
      },
      {
        name: "description",
        content: siteDescription
      },
      {
        property: "og:title",
        content: siteName
      },
      {
        property: "og:description",
        content: siteDescription
      },
      {
        property: "og:type",
        content: "website"
      },
      {
        name: "twitter:card",
        content: "summary_large_image"
      },
      {
        name: "theme-color",
        content: "#0d1117"
      },
      {
        name: "mobile-web-app-capable",
        content: "yes"
      },
      {
        name: "apple-mobile-web-app-capable",
        content: "yes"
      },
      {
        name: "apple-mobile-web-app-status-bar-style",
        content: "black-translucent"
      },
      {
        name: "apple-mobile-web-app-title",
        content: "Ritmo"
      }
    ],
    links: [
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", href: "/favicon.ico" },
      { rel: "icon", type: "image/png", sizes: "512x512", href: "/icon-512.png" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" }
    ]
  }),
  shellComponent: RootDocument
});
function RootDocument({ children }) {
  return /* @__PURE__ */ jsxs("html", { lang: "pt-BR", children: [
    /* @__PURE__ */ jsx("head", { children: /* @__PURE__ */ jsx(HeadContent, {}) }),
    /* @__PURE__ */ jsxs("body", { children: [
      children,
      /* @__PURE__ */ jsx(
        "script",
        {
          dangerouslySetInnerHTML: {
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function () {
                  navigator.serviceWorker.register('/sw.js').catch(function () {});
                });
              }
            `
          }
        }
      ),
      /* @__PURE__ */ jsx(Scripts, {})
    ] })
  ] });
}
const $$splitComponentImporter$7 = () => import("./tutorial-D7vp_dUc.js");
const Route$l = createFileRoute("/tutorial")({
  component: lazyRouteComponent($$splitComponentImporter$7, "component")
});
const $$splitComponentImporter$6 = () => import("./termos-j6Q5gSKQ.js");
const Route$k = createFileRoute("/termos")({
  component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
const $$splitComponentImporter$5 = () => import("./privacidade-BTBkJgMJ.js");
const Route$j = createFileRoute("/privacidade")({
  component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
const $$splitComponentImporter$4 = () => import("./login-B7CCP0es.js");
const Route$i = createFileRoute("/login")({
  component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
const $$splitComponentImporter$3 = () => import("./checkout-HmqtT3kH.js");
const Route$h = createFileRoute("/checkout")({
  component: lazyRouteComponent($$splitComponentImporter$3, "component")
});
const $$splitComponentImporter$2 = () => import("./app-CIdI2kw3.js");
const Route$g = createFileRoute("/app")({
  component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
const $$splitComponentImporter$1 = () => import("./admin-wccy98Qf.js");
const Route$f = createFileRoute("/admin")({
  component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
const $$splitComponentImporter = () => import("./index-MY9IQ-nA.js");
const Route$e = createFileRoute("/")({
  component: lazyRouteComponent($$splitComponentImporter, "component")
});
let cachedSecret = null;
function getSecret() {
  if (cachedSecret) return cachedSecret;
  const fromEnv = process.env.JWT_SECRET;
  const isProd = true;
  if (!fromEnv && isProd) {
    throw new Error("JWT_SECRET não configurado. Defina a variável de ambiente no painel da Netlify.");
  }
  cachedSecret = new TextEncoder().encode(fromEnv || "ritmo-dev-only-secret-nao-usar-em-producao");
  return cachedSecret;
}
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}
async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}
async function createToken(payload) {
  return new SignJWT({ ...payload }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("30d").sign(getSecret());
}
async function verifyToken(token) {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      userId: Number(payload.userId),
      email: String(payload.email),
      name: String(payload.name),
      role: payload.role ? String(payload.role) : "user"
    };
  } catch {
    return null;
  }
}
function extractTokenFromRequest(request) {
  const authHeader = request.headers.get("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  const cookieHeader = request.headers.get("Cookie");
  if (cookieHeader) {
    const match = cookieHeader.match(/ritmo_token=([^;]+)/);
    if (match?.[1]) {
      return match[1];
    }
  }
  return null;
}
const DAY_MS = 24 * 60 * 60 * 1e3;
function todayStr(now) {
  return now.toISOString().split("T")[0];
}
function computeAccess(user, now = /* @__PURE__ */ new Date()) {
  const status = user.subscriptionStatus || "trial";
  if (user.role === "admin") return { hasAccess: true, effectiveStatus: status === "trial" ? "active" : status, daysLeft: 0 };
  if (status === "suspended") return { hasAccess: false, effectiveStatus: "suspended", daysLeft: 0 };
  if (status === "active" || status === "canceled") {
    const renewal = user.subscriptionRenewalDate;
    if (!renewal) return { hasAccess: status === "active", effectiveStatus: status, daysLeft: 0 };
    const paidUntil = (/* @__PURE__ */ new Date(renewal + "T23:59:59Z")).getTime();
    const daysLeft = Math.max(0, Math.ceil((paidUntil - now.getTime()) / DAY_MS));
    if (renewal < todayStr(now)) return { hasAccess: false, effectiveStatus: "expired", daysLeft: 0 };
    return { hasAccess: true, effectiveStatus: status, daysLeft };
  }
  if (status === "trial") {
    if (!user.trialEndsAt) return { hasAccess: true, effectiveStatus: "trial", daysLeft: 7 };
    const end = new Date(user.trialEndsAt).getTime();
    const daysLeft = Math.max(0, Math.ceil((end - now.getTime()) / DAY_MS));
    return end > now.getTime() ? { hasAccess: true, effectiveStatus: "trial", daysLeft } : { hasAccess: false, effectiveStatus: "expired", daysLeft: 0 };
  }
  return { hasAccess: false, effectiveStatus: "expired", daysLeft: 0 };
}
function nextRenewalDate(currentRenewal, now = /* @__PURE__ */ new Date()) {
  const today = todayStr(now);
  const base = currentRenewal && currentRenewal >= today ? /* @__PURE__ */ new Date(currentRenewal + "T00:00:00Z") : /* @__PURE__ */ new Date(today + "T00:00:00Z");
  return new Date(base.getTime() + 30 * DAY_MS).toISOString().split("T")[0];
}
const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("user"),
  // 'user' | 'admin'
  subscriptionStatus: text("subscription_status").notNull().default("trial"),
  // 'trial' | 'active' | 'expired' | 'suspended'
  trialEndsAt: timestamp("trial_ends_at"),
  subscriptionRenewalDate: text("subscription_renewal_date"),
  pixKey: text("pix_key"),
  pixKeyType: text("pix_key_type").default("cpf"),
  // 'cpf' | 'email' | 'telefone' | 'aleatoria'
  timezone: text("timezone").notNull().default("America/Sao_Paulo"),
  themePreference: text("theme_preference").notNull().default("dark"),
  referralCode: text("referral_code").notNull().unique(),
  referredBy: text("referred_by"),
  whatsappPhone: text("whatsapp_phone"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
const focusCycles = pgTable("focus_cycles", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  mainGoal: text("main_goal").notNull(),
  secondaryGoals: text("secondary_goals").default("[]"),
  durationDays: integer("duration_days").notNull(),
  // 7, 21, 40, 90
  startDate: text("start_date").notNull(),
  // YYYY-MM-DD
  endDate: text("end_date").notNull(),
  // YYYY-MM-DD
  routineLevel: text("routine_level").notNull().default("equilibrado"),
  // leve, equilibrado, intensivo
  preferredTimes: text("preferred_times").default(""),
  digitalLimits: text("digital_limits").default(""),
  status: text("status").notNull().default("active"),
  // active, completed, paused
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  cycleId: integer("cycle_id").references(() => focusCycles.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  description: text("description").default(""),
  category: text("category").notNull().default("geral"),
  // trabalho, estudo, saude, financas, pessoal
  priority: text("priority").notNull().default("media"),
  // baixa, media, alta
  date: text("date").notNull(),
  // YYYY-MM-DD
  startTime: text("start_time").default(""),
  estimatedMinutes: integer("estimated_minutes").default(30),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  isRecurring: boolean("is_recurring").notNull().default(false),
  recurrenceRule: text("recurrence_rule").default(""),
  // daily, weekdays, weekly
  timeBlock: text("time_block").default("Manhã"),
  // Manhã, Tarde, Noite, Flexível
  notes: text("notes").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
const habits = pgTable("habits", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  cycleId: integer("cycle_id").references(() => focusCycles.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  category: text("category").notNull().default("geral"),
  // movimento, estudo, mente, sono, hidratacao, desconexao, personalizado
  targetFrequency: text("target_frequency").notNull().default("diario"),
  notes: text("notes").default(""),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
const habitLogs = pgTable("habit_logs", {
  id: serial("id").primaryKey(),
  habitId: integer("habit_id").notNull().references(() => habits.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  // YYYY-MM-DD
  completed: boolean("completed").notNull().default(true),
  value: text("value").default(""),
  notes: text("notes").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
const focusSessions = pgTable("focus_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  cycleId: integer("cycle_id").references(() => focusCycles.id, { onDelete: "set null" }),
  focusTopic: text("focus_topic").default(""),
  durationMinutes: integer("duration_minutes").notNull(),
  sessionType: text("session_type").notNull().default("custom"),
  // 25_5, 50_10, custom
  status: text("status").notNull().default("completed"),
  // completed, interrupted
  date: text("date").notNull(),
  // YYYY-MM-DD
  createdAt: timestamp("created_at").defaultNow().notNull()
});
const journalEntries = pgTable("journal_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  cycleId: integer("cycle_id").references(() => focusCycles.id, { onDelete: "set null" }),
  date: text("date").notNull(),
  // YYYY-MM-DD
  entryType: text("entry_type").notNull().default("daily_checkin"),
  // daily_checkin, weekly_review
  energyScore: integer("energy_score").default(3),
  // 1..5
  moodScore: integer("mood_score").default(3),
  // 1..5
  focusScore: integer("focus_score").default(3),
  // 1..5
  workedWell: text("worked_well").default(""),
  nextStep: text("next_step").default(""),
  difficulties: text("difficulties").default(""),
  notes: text("notes").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
const financeTransactions = pgTable("finance_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  // 'income' | 'expense'
  description: text("description").notNull(),
  amountCents: integer("amount_cents").notNull(),
  date: text("date").notNull(),
  // YYYY-MM-DD
  category: text("category").notNull().default("outros"),
  paymentMethod: text("payment_method").default("pix"),
  accountWallet: text("account_wallet").notNull().default("Principal"),
  isRecurring: boolean("is_recurring").notNull().default(false),
  recurrenceInterval: text("recurrence_interval").default("mensal"),
  isInstallment: boolean("is_installment").notNull().default(false),
  currentInstallment: integer("current_installment").default(1),
  totalInstallments: integer("total_installments").default(1),
  status: text("status").notNull().default("paid"),
  // paid, pending, received, overdue
  dueDate: text("due_date"),
  notes: text("notes").default(""),
  source: text("source").notNull().default("web"),
  // web, whatsapp, api
  syncedToSheets: boolean("synced_to_sheets").notNull().default(false),
  sheetsRowId: text("sheets_row_id"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
const financeBudgets = pgTable("finance_budgets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  category: text("category").notNull(),
  monthYear: text("month_year").notNull(),
  // YYYY-MM
  budgetLimitCents: integer("budget_limit_cents").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
const integrationsConfig = pgTable("integrations_config", {
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
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
const affiliateReferrals = pgTable("affiliate_referrals", {
  id: serial("id").primaryKey(),
  affiliateUserId: integer("affiliate_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  referredUserId: integer("referred_user_id").references(() => users.id, { onDelete: "set null" }),
  referralCode: text("referral_code").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  clickCount: integer("click_count").notNull().default(1),
  status: text("status").notNull().default("active"),
  // active, converted, fraud_blocked
  createdAt: timestamp("created_at").defaultNow().notNull()
});
const affiliateCommissions = pgTable("affiliate_commissions", {
  id: serial("id").primaryKey(),
  affiliateUserId: integer("affiliate_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  referredUserId: integer("referred_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  orderReference: text("order_reference").notNull(),
  baseAmountCents: integer("base_amount_cents").notNull(),
  commissionRatePercent: integer("commission_rate_percent").notNull().default(60),
  commissionCents: integer("commission_cents").notNull(),
  status: text("status").notNull().default("pending"),
  // pending, approved, paid, refunded, reversed
  payoutReference: text("payout_reference"),
  payoutStatus: text("payout_status").notNull().default("manual"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
const affiliateSettings = pgTable("affiliate_settings", {
  id: serial("id").primaryKey(),
  commissionRatePercent: integer("commission_rate_percent").notNull().default(60),
  attributionWindowDays: integer("attribution_window_days").notNull().default(60),
  minPayoutCents: integer("min_payout_cents").notNull().default(2394),
  // R$ 23,94 (1 comissão de R$ 39,90 * 60%)
  terms: text("terms").notNull().default("Comissão de 60% (R$ 23,94) sobre pagamentos recorrentes líquidos elegíveis de novos assinantes pagos indicados via link único. Resgate via chave PIX."),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  token: text("token").notNull().unique(),
  code: text("code").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  plan: text("plan").notNull().default("pro_monthly"),
  amountCents: integer("amount_cents").notNull().default(3990),
  status: text("status").notNull().default("trial"),
  // trial, active, past_due, canceled, expired
  provider: text("provider").notNull().default("pix_mercadopago"),
  renewalDate: text("renewal_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  orderReference: text("order_reference").notNull().unique(),
  amountCents: integer("amount_cents").notNull(),
  discountCents: integer("discount_cents").notNull().default(0),
  couponCode: text("coupon_code"),
  status: text("status").notNull().default("pending"),
  // pending, paid, failed, refunded
  paymentMethod: text("payment_method").notNull().default("pix"),
  // pix, credit_card
  paidAt: timestamp("paid_at"),
  pixQrCode: text("pix_qr_code"),
  pixCopiaECola: text("pix_copia_e_cola"),
  invoiceUrl: text("invoice_url"),
  providerPaymentId: text("provider_payment_id"),
  // ID do pagamento no Mercado Pago, quando real
  isSimulated: boolean("is_simulated").notNull().default(true),
  // false quando confirmado via Mercado Pago real
  createdAt: timestamp("created_at").defaultNow().notNull()
});
const coupons = pgTable("coupons", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  discountPercent: integer("discount_percent").default(0),
  discountCents: integer("discount_cents").default(0),
  active: boolean("active").notNull().default(true),
  maxUses: integer("max_uses").notNull().default(100),
  usedCount: integer("used_count").notNull().default(0),
  expiresAt: text("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
const boards = pgTable("boards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").default(""),
  color: text("color").notNull().default("emerald"),
  position: integer("position").notNull().default(0),
  archived: boolean("archived").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
const boardLists = pgTable("board_lists", {
  id: serial("id").primaryKey(),
  boardId: integer("board_id").notNull().references(() => boards.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  position: integer("position").notNull().default(0),
  archived: boolean("archived").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
const boardCards = pgTable("board_cards", {
  id: serial("id").primaryKey(),
  listId: integer("list_id").notNull().references(() => boardLists.id, { onDelete: "cascade" }),
  boardId: integer("board_id").notNull().references(() => boards.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").default(""),
  priority: text("priority").notNull().default("media"),
  // baixa, media, alta
  labels: text("labels").default("[]"),
  // JSON string[]
  assignee: text("assignee").default(""),
  // campo livre (app não tem times/multiusuário)
  dueDate: text("due_date"),
  // YYYY-MM-DD
  position: integer("position").notNull().default(0),
  archived: boolean("archived").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull()
});
const boardChecklistItems = pgTable("board_checklist_items", {
  id: serial("id").primaryKey(),
  cardId: integer("card_id").notNull().references(() => boardCards.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  done: boolean("done").notNull().default(false),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
const boardCardComments = pgTable("board_card_comments", {
  id: serial("id").primaryKey(),
  cardId: integer("card_id").notNull().references(() => boardCards.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  authorName: text("author_name").notNull(),
  text: text("text").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
const affiliateWithdrawals = pgTable("affiliate_withdrawals", {
  id: serial("id").primaryKey(),
  affiliateUserId: integer("affiliate_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amountCents: integer("amount_cents").notNull(),
  pixKey: text("pix_key").notNull(),
  pixKeyType: text("pix_key_type").notNull().default("cpf"),
  // cpf, email, telefone, aleatoria
  status: text("status").notNull().default("pending"),
  // pending, approved, paid, rejected
  notes: text("notes"),
  receiptReference: text("receipt_reference"),
  requestedAt: timestamp("requested_at").defaultNow().notNull(),
  processedAt: timestamp("processed_at")
});
const schema = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  affiliateCommissions,
  affiliateReferrals,
  affiliateSettings,
  affiliateWithdrawals,
  boardCardComments,
  boardCards,
  boardChecklistItems,
  boardLists,
  boards,
  coupons,
  financeBudgets,
  financeTransactions,
  focusCycles,
  focusSessions,
  habitLogs,
  habits,
  integrationsConfig,
  journalEntries,
  passwordResetTokens,
  payments,
  subscriptions,
  tasks,
  users
}, Symbol.toStringTag, { value: "Module" }));
const db = drizzle({ schema });
const MP_API_BASE = "https://api.mercadopago.com";
function isMercadoPagoConfigured() {
  return Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN);
}
function getAccessToken() {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurada.");
  return token;
}
async function createRealPixPayment(params) {
  try {
    const res = await fetch(`${MP_API_BASE}/v1/payments`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": params.orderReference
      },
      body: JSON.stringify({
        transaction_amount: Number((params.amountCents / 100).toFixed(2)),
        description: params.description,
        payment_method_id: "pix",
        external_reference: params.orderReference,
        payer: { email: params.payerEmail },
        notification_url: process.env.MERCADOPAGO_WEBHOOK_URL || void 0
      })
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.message || `Mercado Pago respondeu ${res.status}` };
    }
    return {
      success: true,
      mpPaymentId: String(data.id),
      pixCopiaECola: data.point_of_interaction?.transaction_data?.qr_code,
      pixQrCodeBase64: data.point_of_interaction?.transaction_data?.qr_code_base64,
      status: data.status
      // 'pending' até ser pago
    };
  } catch (e) {
    return { success: false, error: e.message || "Falha ao criar cobrança Pix no Mercado Pago." };
  }
}
async function createCardCheckoutPreference(params) {
  try {
    const res = await fetch(`${MP_API_BASE}/checkout/preferences`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        items: [
          {
            title: params.description,
            quantity: 1,
            unit_price: Number((params.amountCents / 100).toFixed(2)),
            currency_id: "BRL"
          }
        ],
        payer: { email: params.payerEmail },
        external_reference: params.orderReference,
        back_urls: { success: params.successUrl, failure: params.failureUrl, pending: params.successUrl },
        auto_return: "approved",
        notification_url: process.env.MERCADOPAGO_WEBHOOK_URL || void 0
      })
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.message || `Mercado Pago respondeu ${res.status}` };
    }
    return { success: true, initPoint: data.init_point, preferenceId: data.id };
  } catch (e) {
    return { success: false, error: e.message || "Falha ao criar preferência de checkout no Mercado Pago." };
  }
}
async function fetchMercadoPagoPayment(paymentId) {
  try {
    const res = await fetch(`${MP_API_BASE}/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${getAccessToken()}` }
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.message || `Mercado Pago respondeu ${res.status}` };
    return {
      success: true,
      status: data.status,
      // approved, pending, rejected, refunded, cancelled...
      externalReference: data.external_reference,
      amountCents: Math.round(Number(data.transaction_amount) * 100)
    };
  } catch (e) {
    return { success: false, error: e.message || "Falha ao consultar pagamento no Mercado Pago." };
  }
}
function isValidMercadoPagoSignature(xSignature, xRequestId, dataId) {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!secret || !xSignature || !xRequestId) return false;
  const parts = Object.fromEntries(xSignature.split(",").map((p) => p.trim().split("=")));
  const ts = parts["ts"];
  const hash = parts["v1"];
  if (!ts || !hash) return false;
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(hash));
  } catch {
    return false;
  }
}
const RESEND_API_URL = "https://api.resend.com/emails";
async function sendEmail(to, subject, html) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.EMAIL_FROM || "Ritmo <nao-responda@meu-ritmo.netlify.app>";
  if (!apiKey) {
    return { sent: false, error: "RESEND_API_KEY não configurada." };
  }
  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ from: fromAddress, to, subject, html })
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { sent: false, error: `Resend respondeu ${res.status}: ${body}` };
    }
    return { sent: true };
  } catch (e) {
    return { sent: false, error: e.message || "Falha de rede ao enviar e-mail." };
  }
}
async function sendPasswordResetEmail(to, name, code) {
  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #0f172a;">
      <h2 style="color: #059669;">Recuperação de senha — Ritmo</h2>
      <p>Olá, ${name || ""}!</p>
      <p>Use o código abaixo para redefinir sua senha. Ele expira em 1 hora e só pode ser usado uma vez.</p>
      <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px; background: #f1f5f9; padding: 16px; text-align: center; border-radius: 8px;">${code}</p>
      <p style="font-size: 13px; color: #64748b;">Se você não pediu essa recuperação, pode ignorar este e-mail com segurança — sua senha não será alterada.</p>
    </div>
  `;
  return sendEmail(to, "Seu código de recuperação de senha — Ritmo", html);
}
async function sendPaymentConfirmationEmail(to, name, amountCents, renewalDate) {
  const amount = (amountCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #0f172a;">
      <h2 style="color: #059669;">Pagamento confirmado — Ritmo</h2>
      <p>Olá, ${name || ""}!</p>
      <p>Recebemos seu pagamento de <strong>${amount}</strong>. Sua assinatura Ritmo PRO está ativa até <strong>${(/* @__PURE__ */ new Date(renewalDate + "T00:00:00")).toLocaleDateString("pt-BR")}</strong>.</p>
      <p style="font-size: 13px; color: #64748b;">Você pode consultar suas faturas a qualquer momento em Perfil &gt; Assinatura dentro do app.</p>
    </div>
  `;
  return sendEmail(to, "Pagamento confirmado — Ritmo PRO", html);
}
async function sendRenewalReminderEmail(to, name, kind, daysLeft) {
  const appUrl = process.env.URL || "https://meu-ritmo.netlify.app";
  const dias = daysLeft === 1 ? "1 dia" : `${daysLeft} dias`;
  const title = kind === "trial" ? `Seu teste grátis acaba em ${dias}` : `Sua assinatura vence em ${dias}`;
  const body = kind === "trial" ? "Para continuar usando suas rotinas, quadros, hábitos e finanças sem interrupção, assine o Ritmo PRO (R$ 39,90/mês)." : "A cobrança do Ritmo PRO é mensal e manual. Renove antes do vencimento para não perder o acesso.";
  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #0f172a;">
      <h2 style="color: #059669;">${title}</h2>
      <p>Olá, ${name || ""}!</p>
      <p>${body}</p>
      <p><a href="${appUrl}/checkout" style="display:inline-block;background:#10b981;color:#052e1f;font-weight:bold;padding:12px 20px;border-radius:8px;text-decoration:none;">${kind === "trial" ? "Assinar agora" : "Renovar agora"}</a></p>
      <p style="font-size: 12px; color: #64748b;">Seus dados continuam guardados mesmo que o acesso seja pausado.</p>
    </div>
  `;
  return sendEmail(to, `${title} — Ritmo`, html);
}
const nowIso = (/* @__PURE__ */ new Date()).toISOString();
const sevenDaysLater = new Date(Date.now() + 7 * 24 * 60 * 60 * 1e3).toISOString();
const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0];
const memStore = {
  users: [
    {
      id: 1,
      name: "Carlos Silveira",
      email: "carlos@ritmofoco.com.br",
      passwordHash: "$2a$10$wT6w14E6cIom1R/U6R8VTuS3j9gE26iF92rBqN81U2wG5Vl1fN06S",
      // hashed 'senha123'
      role: "user",
      subscriptionStatus: "trial",
      trialEndsAt: sevenDaysLater,
      subscriptionRenewalDate: null,
      pixKey: "carlos@ritmofoco.com.br",
      pixKeyType: "email",
      timezone: "America/Sao_Paulo",
      themePreference: "dark",
      referralCode: "RITMO-CARLOS",
      referredBy: null,
      whatsappPhone: "11987654321",
      createdAt: nowIso,
      updatedAt: nowIso
    },
    {
      id: 2,
      name: "Administrador Ritmo",
      email: "admin@ritmofoco.com.br",
      passwordHash: "$2a$10$wT6w14E6cIom1R/U6R8VTuS3j9gE26iF92rBqN81U2wG5Vl1fN06S",
      // hashed 'senha123'
      role: "admin",
      subscriptionStatus: "active",
      trialEndsAt: null,
      subscriptionRenewalDate: thirtyDaysLater,
      pixKey: "admin@ritmofoco.com.br",
      pixKeyType: "email",
      timezone: "America/Sao_Paulo",
      themePreference: "dark",
      referralCode: "RITMO-ADMIN",
      referredBy: null,
      whatsappPhone: "11999998888",
      createdAt: nowIso,
      updatedAt: nowIso
    },
    {
      id: 3,
      name: "Mariana Duarte",
      email: "mariana.duarte@email.com",
      passwordHash: "$2a$10$wT6w14E6cIom1R/U6R8VTuS3j9gE26iF92rBqN81U2wG5Vl1fN06S",
      role: "user",
      subscriptionStatus: "active",
      trialEndsAt: null,
      subscriptionRenewalDate: thirtyDaysLater,
      pixKey: "12345678909",
      pixKeyType: "cpf",
      timezone: "America/Sao_Paulo",
      themePreference: "dark",
      referralCode: "RITMO-MARI",
      referredBy: "RITMO-CARLOS",
      whatsappPhone: "21988887777",
      createdAt: new Date(Date.now() - 15 * 864e5).toISOString(),
      updatedAt: nowIso
    },
    {
      id: 4,
      name: "Lucas Ferreira",
      email: "lucas.dev@email.com",
      passwordHash: "$2a$10$wT6w14E6cIom1R/U6R8VTuS3j9gE26iF92rBqN81U2wG5Vl1fN06S",
      role: "user",
      subscriptionStatus: "trial",
      trialEndsAt: new Date(Date.now() + 3 * 864e5).toISOString(),
      subscriptionRenewalDate: null,
      pixKey: null,
      pixKeyType: "cpf",
      timezone: "America/Sao_Paulo",
      themePreference: "dark",
      referralCode: "RITMO-LUCAS",
      referredBy: "RITMO-CARLOS",
      whatsappPhone: null,
      createdAt: new Date(Date.now() - 4 * 864e5).toISOString(),
      updatedAt: nowIso
    }
  ],
  cycles: [],
  tasks: [],
  habits: [],
  habitLogs: [],
  focusSessions: [],
  journalEntries: [],
  financeTransactions: [],
  financeBudgets: [],
  integrations: [],
  boards: [],
  boardLists: [],
  boardCards: [],
  boardChecklistItems: [],
  boardCardComments: [],
  affiliateReferrals: [
    {
      id: 1,
      affiliateUserId: 1,
      referredUserId: 3,
      referralCode: "RITMO-CARLOS",
      clickCount: 14,
      status: "converted",
      createdAt: new Date(Date.now() - 15 * 864e5).toISOString()
    },
    {
      id: 2,
      affiliateUserId: 1,
      referredUserId: 4,
      referralCode: "RITMO-CARLOS",
      clickCount: 8,
      status: "active",
      createdAt: new Date(Date.now() - 4 * 864e5).toISOString()
    }
  ],
  affiliateCommissions: [
    {
      id: 1,
      affiliateUserId: 1,
      referredUserId: 3,
      orderReference: "ORD-RTM-INIT-01",
      baseAmountCents: 3990,
      commissionRatePercent: 60,
      commissionCents: 2394,
      // 60% of R$ 39,90 = R$ 23,94
      status: "approved",
      payoutReference: null,
      payoutStatus: "manual",
      notes: "Indicação convertida em assinatura PRO",
      createdAt: new Date(Date.now() - 15 * 864e5).toISOString()
    }
  ],
  passwordResetTokens: [],
  subscriptions: [
    {
      id: 1,
      userId: 2,
      plan: "pro_monthly",
      amountCents: 3990,
      status: "active",
      provider: "pix_mercadopago",
      renewalDate: thirtyDaysLater,
      createdAt: nowIso,
      updatedAt: nowIso
    },
    {
      id: 2,
      userId: 3,
      plan: "pro_monthly",
      amountCents: 3990,
      status: "active",
      provider: "pix_mercadopago",
      renewalDate: thirtyDaysLater,
      createdAt: new Date(Date.now() - 15 * 864e5).toISOString(),
      updatedAt: nowIso
    }
  ],
  payments: [
    {
      id: 1,
      userId: 3,
      orderReference: "ORD-RTM-INIT-01",
      amountCents: 3990,
      discountCents: 0,
      couponCode: null,
      status: "paid",
      paymentMethod: "pix",
      paidAt: new Date(Date.now() - 15 * 864e5).toISOString(),
      pixQrCode: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"></svg>',
      pixCopiaECola: "00020126580014br.gov.bcb.pix0136123e4567-e89b-12d3-a456-426614174000520400005303986540539.905802BR5913Ritmo Foco6009Sao Paulo62070503***6304ABCD",
      invoiceUrl: "#fatura-01",
      createdAt: new Date(Date.now() - 15 * 864e5).toISOString()
    }
  ],
  coupons: [
    {
      id: 1,
      code: "RITMO10",
      discountPercent: 10,
      discountCents: 0,
      active: true,
      maxUses: 100,
      usedCount: 12,
      expiresAt: "2026-12-31",
      createdAt: nowIso
    },
    {
      id: 2,
      code: "FOCO20",
      discountPercent: 20,
      discountCents: 0,
      active: true,
      maxUses: 50,
      usedCount: 7,
      expiresAt: "2026-12-31",
      createdAt: nowIso
    },
    {
      id: 3,
      code: "PRIMEIROMES",
      discountPercent: 0,
      discountCents: 1990,
      // R$ 19,90 de desconto no 1º mês
      active: true,
      maxUses: 200,
      usedCount: 23,
      expiresAt: "2026-12-31",
      createdAt: nowIso
    }
  ],
  affiliateWithdrawals: [
    {
      id: 1,
      affiliateUserId: 1,
      amountCents: 2394,
      pixKey: "carlos@ritmofoco.com.br",
      pixKeyType: "email",
      status: "pending",
      notes: "Solicitação de saque de 1 comissão (60%)",
      receiptReference: null,
      requestedAt: new Date(Date.now() - 864e5).toISOString(),
      processedAt: null
    }
  ]
};
let dbAvailable = null;
async function checkDb() {
  if (dbAvailable !== null) return dbAvailable;
  try {
    await db.select({ count: sql`1` }).from(users).limit(1);
    dbAvailable = true;
    return true;
  } catch (err) {
    dbAvailable = false;
    return false;
  }
}
async function findUserByEmail(email) {
  const isDb = await checkDb();
  if (isDb) {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
      return user || null;
    } catch {
    }
  }
  return memStore.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
}
async function findUserById(id) {
  const isDb = await checkDb();
  if (isDb) {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user || null;
    } catch {
    }
  }
  return memStore.users.find((u) => u.id === id) || null;
}
async function findUserByPhone(phone) {
  const cleanPhone = phone.replace(/\D/g, "");
  const isDb = await checkDb();
  if (isDb) {
    try {
      const allUsers = await db.select().from(users);
      return allUsers.find((u) => u.whatsappPhone && u.whatsappPhone.replace(/\D/g, "") === cleanPhone) || null;
    } catch {
    }
  }
  return memStore.users.find((u) => u.whatsappPhone && u.whatsappPhone.replace(/\D/g, "") === cleanPhone) || null;
}
async function createUserRecord(data) {
  const trialDays = 7;
  const trialEndsAtDate = new Date(Date.now() + trialDays * 24 * 60 * 60 * 1e3);
  const userRole = data.role || (data.email.toLowerCase().includes("admin") ? "admin" : "user");
  const isDb = await checkDb();
  if (isDb) {
    try {
      const [newUser2] = await db.insert(users).values({
        email: data.email.toLowerCase(),
        name: data.name,
        passwordHash: data.passwordHash,
        role: userRole,
        subscriptionStatus: "trial",
        trialEndsAt: trialEndsAtDate,
        timezone: data.timezone || "America/Sao_Paulo",
        themePreference: data.themePreference || "dark",
        referralCode: data.referralCode,
        referredBy: data.referredBy || null
      }).returning();
      return newUser2;
    } catch (e) {
      console.error("Error inserting user to DB:", e);
    }
  }
  const id = memStore.users.length + 1;
  const newUser = {
    id,
    email: data.email.toLowerCase(),
    name: data.name,
    passwordHash: data.passwordHash,
    role: userRole,
    subscriptionStatus: "trial",
    trialEndsAt: trialEndsAtDate.toISOString(),
    subscriptionRenewalDate: null,
    pixKey: null,
    pixKeyType: "cpf",
    timezone: data.timezone || "America/Sao_Paulo",
    themePreference: data.themePreference || "dark",
    referralCode: data.referralCode,
    referredBy: data.referredBy || null,
    whatsappPhone: null,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  memStore.users.push(newUser);
  return newUser;
}
async function updateUserRecord(id, data) {
  const isDb = await checkDb();
  if (isDb) {
    try {
      const [updated] = await db.update(users).set({ ...data, updatedAt: /* @__PURE__ */ new Date() }).where(eq(users.id, id)).returning();
      return updated;
    } catch {
    }
  }
  const user = memStore.users.find((u) => u.id === id);
  if (user) {
    Object.assign(user, data, { updatedAt: (/* @__PURE__ */ new Date()).toISOString() });
    return user;
  }
  return null;
}
async function deleteUserData(userId) {
  const isDb = await checkDb();
  if (isDb) {
    try {
      await db.delete(users).where(eq(users.id, userId));
      return true;
    } catch {
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
async function getActiveFocusCycle(userId) {
  const isDb = await checkDb();
  if (isDb) {
    try {
      const [cycle2] = await db.select().from(focusCycles).where(and(eq(focusCycles.userId, userId), eq(focusCycles.status, "active"))).orderBy(desc(focusCycles.id)).limit(1);
      if (cycle2) {
        return {
          ...cycle2,
          secondaryGoals: JSON.parse(cycle2.secondaryGoals || "[]"),
          durationDays: cycle2.durationDays,
          routineLevel: cycle2.routineLevel,
          status: cycle2.status,
          notes: cycle2.notes || void 0,
          createdAt: cycle2.createdAt ? cycle2.createdAt.toISOString() : void 0
        };
      }
      return null;
    } catch {
    }
  }
  const cycle = memStore.cycles.find((c) => c.userId === userId && c.status === "active");
  return cycle || null;
}
async function getAllFocusCycles(userId) {
  const isDb = await checkDb();
  if (isDb) {
    try {
      const cycles = await db.select().from(focusCycles).where(eq(focusCycles.userId, userId)).orderBy(desc(focusCycles.id));
      return cycles.map((c) => ({
        ...c,
        secondaryGoals: JSON.parse(c.secondaryGoals || "[]"),
        durationDays: c.durationDays,
        routineLevel: c.routineLevel,
        status: c.status,
        notes: c.notes || void 0,
        createdAt: c.createdAt ? c.createdAt.toISOString() : void 0
      }));
    } catch {
    }
  }
  return memStore.cycles.filter((c) => c.userId === userId);
}
async function createFocusCycle(userId, data) {
  const isDb = await checkDb();
  if (isDb) {
    try {
      const [created] = await db.insert(focusCycles).values({
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
        status: data.status || "active",
        notes: data.notes || ""
      }).returning();
      return {
        ...created,
        secondaryGoals: JSON.parse(created.secondaryGoals || "[]"),
        durationDays: created.durationDays,
        routineLevel: created.routineLevel,
        status: created.status,
        notes: created.notes || void 0,
        createdAt: created.createdAt.toISOString()
      };
    } catch {
    }
  }
  const id = memStore.cycles.length + 1;
  const newCycle = {
    ...data,
    id,
    userId,
    secondaryGoals: data.secondaryGoals || [],
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  memStore.cycles.push(newCycle);
  return newCycle;
}
async function getTasks(userId, filterDate) {
  const isDb = await checkDb();
  if (isDb) {
    try {
      const conditions = [eq(tasks.userId, userId)];
      if (filterDate) {
        conditions.push(eq(tasks.date, filterDate));
      }
      const items = await db.select().from(tasks).where(and(...conditions)).orderBy(desc(tasks.id));
      return items.map((t) => ({
        ...t,
        category: t.category,
        priority: t.priority,
        timeBlock: t.timeBlock || "Manhã",
        completedAt: t.completedAt ? t.completedAt.toISOString() : null,
        notes: t.notes || void 0,
        description: t.description || void 0,
        startTime: t.startTime || void 0,
        estimatedMinutes: t.estimatedMinutes || 30,
        recurrenceRule: t.recurrenceRule || void 0,
        createdAt: t.createdAt.toISOString()
      }));
    } catch {
    }
  }
  return memStore.tasks.filter((t) => t.userId === userId && (!filterDate || t.date === filterDate));
}
async function createTask(userId, data) {
  const isDb = await checkDb();
  if (isDb) {
    try {
      const [task] = await db.insert(tasks).values({
        userId,
        cycleId: data.cycleId || null,
        title: data.title,
        description: data.description || "",
        category: data.category || "geral",
        priority: data.priority || "media",
        date: data.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        startTime: data.startTime || "",
        estimatedMinutes: data.estimatedMinutes || 30,
        completed: false,
        isRecurring: data.isRecurring || false,
        recurrenceRule: data.recurrenceRule || "",
        timeBlock: data.timeBlock || "Manhã",
        notes: data.notes || ""
      }).returning();
      return {
        ...task,
        category: task.category,
        priority: task.priority,
        timeBlock: task.timeBlock || "Manhã",
        estimatedMinutes: task.estimatedMinutes || 30,
        completedAt: task.completedAt ? task.completedAt.toISOString() : null,
        createdAt: task.createdAt.toISOString()
      };
    } catch {
    }
  }
  const id = memStore.tasks.length + 1;
  const newTask = {
    id,
    userId,
    cycleId: data.cycleId || null,
    title: data.title,
    description: data.description || "",
    category: data.category || "geral",
    priority: data.priority || "media",
    date: data.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    startTime: data.startTime || "",
    estimatedMinutes: data.estimatedMinutes || 30,
    completed: false,
    completedAt: null,
    isRecurring: data.isRecurring || false,
    recurrenceRule: data.recurrenceRule || "",
    timeBlock: data.timeBlock || "Manhã",
    notes: data.notes || "",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  memStore.tasks.push(newTask);
  return newTask;
}
async function updateTask(taskId, userId, updates) {
  const isDb = await checkDb();
  if (isDb) {
    try {
      const patch = { ...updates };
      if (updates.completed !== void 0) {
        patch.completedAt = updates.completed ? /* @__PURE__ */ new Date() : null;
      }
      const [updated] = await db.update(tasks).set(patch).where(and(eq(tasks.id, taskId), eq(tasks.userId, userId))).returning();
      if (!updated) return null;
      return {
        ...updated,
        category: updated.category,
        priority: updated.priority,
        timeBlock: updated.timeBlock || "Manhã",
        estimatedMinutes: updated.estimatedMinutes || 30,
        completedAt: updated.completedAt ? updated.completedAt.toISOString() : null,
        createdAt: updated.createdAt.toISOString()
      };
    } catch {
    }
  }
  const task = memStore.tasks.find((t) => t.id === taskId && t.userId === userId);
  if (!task) return null;
  Object.assign(task, updates);
  if (updates.completed !== void 0) {
    task.completedAt = updates.completed ? (/* @__PURE__ */ new Date()).toISOString() : null;
  }
  return task;
}
async function deleteTask(taskId, userId) {
  const isDb = await checkDb();
  if (isDb) {
    try {
      await db.delete(tasks).where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)));
      return true;
    } catch {
    }
  }
  memStore.tasks = memStore.tasks.filter((t) => !(t.id === taskId && t.userId === userId));
  return true;
}
async function getHabits(userId) {
  const isDb = await checkDb();
  if (isDb) {
    try {
      const habitList = await db.select().from(habits).where(and(eq(habits.userId, userId), eq(habits.isActive, true))).orderBy(habits.id);
      const logsList = await db.select().from(habitLogs).where(eq(habitLogs.userId, userId)).orderBy(desc(habitLogs.date));
      return {
        habits: habitList.map((h) => ({
          ...h,
          category: h.category,
          targetFrequency: h.targetFrequency,
          notes: h.notes || void 0,
          createdAt: h.createdAt.toISOString()
        })),
        logs: logsList.map((l) => ({
          ...l,
          value: l.value || void 0,
          notes: l.notes || void 0,
          createdAt: l.createdAt.toISOString()
        }))
      };
    } catch {
    }
  }
  return {
    habits: memStore.habits.filter((h) => h.userId === userId && h.isActive),
    logs: memStore.habitLogs.filter((l) => l.userId === userId)
  };
}
async function createHabit(userId, data) {
  const isDb = await checkDb();
  if (isDb) {
    try {
      const [habit] = await db.insert(habits).values({
        userId,
        cycleId: data.cycleId || null,
        name: data.name,
        category: data.category || "geral",
        targetFrequency: data.targetFrequency || "diario",
        notes: data.notes || "",
        isActive: true
      }).returning();
      return {
        ...habit,
        category: habit.category,
        targetFrequency: habit.targetFrequency,
        createdAt: habit.createdAt.toISOString()
      };
    } catch {
    }
  }
  const id = memStore.habits.length + 1;
  const newHabit = {
    id,
    userId,
    cycleId: data.cycleId || null,
    name: data.name,
    category: data.category || "personalizado",
    targetFrequency: data.targetFrequency || "diario",
    notes: data.notes || "",
    isActive: true,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  memStore.habits.push(newHabit);
  return newHabit;
}
async function toggleHabitLog(userId, habitId, date, completed) {
  const isDb = await checkDb();
  if (isDb) {
    try {
      const [existing] = await db.select().from(habitLogs).where(
        and(
          eq(habitLogs.userId, userId),
          eq(habitLogs.habitId, habitId),
          eq(habitLogs.date, date)
        )
      );
      if (existing) {
        const [updated] = await db.update(habitLogs).set({ completed }).where(eq(habitLogs.id, existing.id)).returning();
        return {
          ...updated,
          value: updated.value || void 0,
          notes: updated.notes || void 0,
          createdAt: updated.createdAt.toISOString()
        };
      } else {
        const [inserted] = await db.insert(habitLogs).values({
          userId,
          habitId,
          date,
          completed
        }).returning();
        return {
          ...inserted,
          value: inserted.value || void 0,
          notes: inserted.notes || void 0,
          createdAt: inserted.createdAt.toISOString()
        };
      }
    } catch {
    }
  }
  let log = memStore.habitLogs.find((l) => l.userId === userId && l.habitId === habitId && l.date === date);
  if (log) {
    log.completed = completed;
    return log;
  }
  const id = memStore.habitLogs.length + 1;
  const newLog = {
    id,
    userId,
    habitId,
    date,
    completed,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  memStore.habitLogs.push(newLog);
  return newLog;
}
async function getFocusSessions(userId) {
  const isDb = await checkDb();
  if (isDb) {
    try {
      const list = await db.select().from(focusSessions).where(eq(focusSessions.userId, userId)).orderBy(desc(focusSessions.id));
      return list.map((s) => ({
        ...s,
        sessionType: s.sessionType,
        status: s.status,
        focusTopic: s.focusTopic || "",
        createdAt: s.createdAt.toISOString()
      }));
    } catch {
    }
  }
  return memStore.focusSessions.filter((s) => s.userId === userId);
}
async function createFocusSession(userId, data) {
  const isDb = await checkDb();
  if (isDb) {
    try {
      const [session] = await db.insert(focusSessions).values({
        userId,
        cycleId: data.cycleId || null,
        focusTopic: data.focusTopic || "Sessão de Foco",
        durationMinutes: data.durationMinutes || 25,
        sessionType: data.sessionType || "custom",
        status: data.status || "completed",
        date: data.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
      }).returning();
      return {
        ...session,
        sessionType: session.sessionType,
        status: session.status,
        focusTopic: session.focusTopic || "",
        createdAt: session.createdAt.toISOString()
      };
    } catch {
    }
  }
  const id = memStore.focusSessions.length + 1;
  const newSession = {
    id,
    userId,
    cycleId: data.cycleId || null,
    focusTopic: data.focusTopic || "Sessão de Foco",
    durationMinutes: data.durationMinutes || 25,
    sessionType: data.sessionType || "custom",
    status: data.status || "completed",
    date: data.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  memStore.focusSessions.push(newSession);
  return newSession;
}
async function getJournalEntries(userId) {
  const isDb = await checkDb();
  if (isDb) {
    try {
      const entries = await db.select().from(journalEntries).where(eq(journalEntries.userId, userId)).orderBy(desc(journalEntries.date));
      return entries.map((e) => ({
        ...e,
        entryType: e.entryType,
        energyScore: e.energyScore || 3,
        moodScore: e.moodScore || 3,
        focusScore: e.focusScore || 3,
        workedWell: e.workedWell || "",
        nextStep: e.nextStep || "",
        difficulties: e.difficulties || void 0,
        notes: e.notes || void 0,
        createdAt: e.createdAt.toISOString()
      }));
    } catch {
    }
  }
  return memStore.journalEntries.filter((j) => j.userId === userId);
}
async function upsertJournalEntry(userId, data) {
  const date = data.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const entryType = data.entryType || "daily_checkin";
  const isDb = await checkDb();
  if (isDb) {
    try {
      const [existing] = await db.select().from(journalEntries).where(
        and(
          eq(journalEntries.userId, userId),
          eq(journalEntries.date, date),
          eq(journalEntries.entryType, entryType)
        )
      );
      if (existing) {
        const [updated] = await db.update(journalEntries).set({
          energyScore: data.energyScore,
          moodScore: data.moodScore,
          focusScore: data.focusScore,
          workedWell: data.workedWell || "",
          nextStep: data.nextStep || "",
          difficulties: data.difficulties || "",
          notes: data.notes || ""
        }).where(eq(journalEntries.id, existing.id)).returning();
        return {
          ...updated,
          entryType: updated.entryType,
          energyScore: updated.energyScore || 3,
          moodScore: updated.moodScore || 3,
          focusScore: updated.focusScore || 3,
          workedWell: updated.workedWell || "",
          nextStep: updated.nextStep || "",
          difficulties: updated.difficulties || void 0,
          notes: updated.notes || void 0,
          createdAt: updated.createdAt.toISOString()
        };
      } else {
        const [created] = await db.insert(journalEntries).values({
          userId,
          cycleId: data.cycleId || null,
          date,
          entryType,
          energyScore: data.energyScore || 3,
          moodScore: data.moodScore || 3,
          focusScore: data.focusScore || 3,
          workedWell: data.workedWell || "",
          nextStep: data.nextStep || "",
          difficulties: data.difficulties || "",
          notes: data.notes || ""
        }).returning();
        return {
          ...created,
          entryType: created.entryType,
          energyScore: created.energyScore || 3,
          moodScore: created.moodScore || 3,
          focusScore: created.focusScore || 3,
          workedWell: created.workedWell || "",
          nextStep: created.nextStep || "",
          difficulties: created.difficulties || void 0,
          notes: created.notes || void 0,
          createdAt: created.createdAt.toISOString()
        };
      }
    } catch {
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
  const newEntry = {
    id,
    userId,
    cycleId: data.cycleId || null,
    date,
    entryType,
    energyScore: data.energyScore || 3,
    moodScore: data.moodScore || 3,
    focusScore: data.focusScore || 3,
    workedWell: data.workedWell || "",
    nextStep: data.nextStep || "",
    difficulties: data.difficulties || "",
    notes: data.notes || "",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  memStore.journalEntries.push(newEntry);
  return newEntry;
}
async function getFinanceTransactions(userId, filter) {
  const isDb = await checkDb();
  if (isDb) {
    try {
      const conditions = [eq(financeTransactions.userId, userId)];
      const list2 = await db.select().from(financeTransactions).where(and(...conditions)).orderBy(desc(financeTransactions.date), desc(financeTransactions.id));
      let results = list2.map((tx) => ({
        ...tx,
        type: tx.type,
        status: tx.status,
        source: tx.source,
        notes: tx.notes || void 0,
        dueDate: tx.dueDate || void 0,
        currentInstallment: tx.currentInstallment || void 0,
        totalInstallments: tx.totalInstallments || void 0,
        recurrenceInterval: tx.recurrenceInterval || void 0,
        sheetsRowId: tx.sheetsRowId || null,
        createdAt: tx.createdAt.toISOString()
      }));
      if (filter?.monthYear) {
        results = results.filter((tx) => tx.date.startsWith(filter.monthYear));
      }
      if (filter?.category && filter.category !== "todas") {
        results = results.filter((tx) => tx.category === filter.category);
      }
      if (filter?.type && filter.type !== "todos") {
        results = results.filter((tx) => tx.type === filter.type);
      }
      if (filter?.search) {
        const q = filter.search.toLowerCase();
        results = results.filter((tx) => tx.description.toLowerCase().includes(q));
      }
      return results;
    } catch {
    }
  }
  let list = memStore.financeTransactions.filter((tx) => tx.userId === userId);
  if (filter?.monthYear) {
    list = list.filter((tx) => tx.date.startsWith(filter.monthYear));
  }
  if (filter?.category && filter.category !== "todas") {
    list = list.filter((tx) => tx.category === filter.category);
  }
  if (filter?.type && filter.type !== "todos") {
    list = list.filter((tx) => tx.type === filter.type);
  }
  if (filter?.search) {
    const q = filter.search.toLowerCase();
    list = list.filter((tx) => tx.description.toLowerCase().includes(q));
  }
  return list.sort((a, b) => b.date.localeCompare(a.date));
}
async function createFinanceTransaction(userId, data) {
  const isDb = await checkDb();
  if (isDb) {
    try {
      const [tx] = await db.insert(financeTransactions).values({
        userId,
        type: data.type || "expense",
        description: data.description,
        amountCents: data.amountCents || 0,
        date: data.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        category: data.category || "outros",
        paymentMethod: data.paymentMethod || "pix",
        accountWallet: data.accountWallet || "Principal",
        isRecurring: data.isRecurring || false,
        recurrenceInterval: data.recurrenceInterval || "mensal",
        isInstallment: data.isInstallment || false,
        currentInstallment: data.currentInstallment || 1,
        totalInstallments: data.totalInstallments || 1,
        status: data.status || "paid",
        dueDate: data.dueDate || null,
        notes: data.notes || "",
        source: data.source || "web",
        syncedToSheets: false
      }).returning();
      return {
        ...tx,
        type: tx.type,
        status: tx.status,
        source: tx.source,
        createdAt: tx.createdAt.toISOString()
      };
    } catch {
    }
  }
  const id = memStore.financeTransactions.length + 1;
  const newTx = {
    id,
    userId,
    type: data.type || "expense",
    description: data.description,
    amountCents: data.amountCents || 0,
    date: data.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    category: data.category || "outros",
    paymentMethod: data.paymentMethod || "pix",
    accountWallet: data.accountWallet || "Principal",
    isRecurring: data.isRecurring || false,
    recurrenceInterval: data.recurrenceInterval || "mensal",
    isInstallment: data.isInstallment || false,
    currentInstallment: data.currentInstallment || 1,
    totalInstallments: data.totalInstallments || 1,
    status: data.status || "paid",
    dueDate: data.dueDate,
    notes: data.notes || "",
    source: data.source || "web",
    syncedToSheets: false,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  memStore.financeTransactions.push(newTx);
  return newTx;
}
async function deleteFinanceTransaction(txId, userId) {
  const isDb = await checkDb();
  if (isDb) {
    try {
      await db.delete(financeTransactions).where(
        and(
          eq(financeTransactions.id, txId),
          eq(financeTransactions.userId, userId)
        )
      );
      return true;
    } catch {
    }
  }
  memStore.financeTransactions = memStore.financeTransactions.filter(
    (tx) => !(tx.id === txId && tx.userId === userId)
  );
  return true;
}
async function getAffiliateData(userId, userReferralCode) {
  const isDb = await checkDb();
  let referralsList = [];
  let commissionsList = [];
  if (isDb) {
    try {
      referralsList = await db.select().from(affiliateReferrals).where(eq(affiliateReferrals.affiliateUserId, userId));
      commissionsList = await db.select().from(affiliateCommissions).where(eq(affiliateCommissions.affiliateUserId, userId)).orderBy(desc(affiliateCommissions.id));
    } catch {
    }
  } else {
    referralsList = memStore.affiliateReferrals.filter((r) => r.affiliateUserId === userId);
    commissionsList = memStore.affiliateCommissions.filter((c) => c.affiliateUserId === userId);
  }
  const totalClicks = referralsList.reduce((acc, r) => acc + (r.clickCount || 1), 0);
  const totalReferrals = referralsList.length;
  const activeSubscriptions = commissionsList.filter((c) => c.status === "approved" || c.status === "paid").length;
  const pendingCommissionCents = commissionsList.filter((c) => c.status === "pending").reduce((acc, c) => acc + c.commissionCents, 0);
  const approvedCommissionCents = commissionsList.filter((c) => c.status === "approved").reduce((acc, c) => acc + c.commissionCents, 0);
  const paidCommissionCents = commissionsList.filter((c) => c.status === "paid").reduce((acc, c) => acc + c.commissionCents, 0);
  let userWithdrawals = [];
  if (isDb) {
    try {
      userWithdrawals = await db.select().from(affiliateWithdrawals).where(eq(affiliateWithdrawals.affiliateUserId, userId)).orderBy(desc(affiliateWithdrawals.id));
    } catch {
    }
  } else {
    userWithdrawals = memStore.affiliateWithdrawals.filter((w) => w.affiliateUserId === userId);
  }
  const withdrawnOrPendingCents = userWithdrawals.filter((w) => w.status === "pending" || w.status === "approved" || w.status === "paid").reduce((acc, w) => acc + w.amountCents, 0);
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
      availableBalanceCents
    },
    commissions: commissionsList.map((c) => ({
      ...c,
      status: c.status,
      payoutStatus: c.payoutStatus || "manual",
      createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt
    })),
    referrals: referralsList.map((r) => ({
      ...r,
      status: r.status,
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : r.createdAt
    })),
    withdrawals: userWithdrawals.map((w) => ({
      ...w,
      requestedAt: w.requestedAt instanceof Date ? w.requestedAt.toISOString() : w.requestedAt,
      processedAt: w.processedAt instanceof Date ? w.processedAt.toISOString() : w.processedAt
    }))
  };
}
async function recordAffiliateClick(referralCode, ip, ua) {
  const code = referralCode.trim().toUpperCase();
  const isDb = await checkDb();
  let ownerId = null;
  if (isDb) {
    try {
      const [owner] = await db.select().from(users).where(eq(users.referralCode, code));
      if (owner) ownerId = owner.id;
    } catch {
    }
  } else {
    const owner = memStore.users.find((u) => u.referralCode === code);
    if (owner) ownerId = owner.id;
  }
  if (!ownerId) return false;
  if (isDb) {
    try {
      await db.insert(affiliateReferrals).values({
        affiliateUserId: ownerId,
        referralCode: code,
        ipAddress: ip || null,
        userAgent: ua ? ua.slice(0, 200) : null,
        clickCount: 1,
        status: "active"
      });
      return true;
    } catch {
    }
  }
  memStore.affiliateReferrals.push({
    id: memStore.affiliateReferrals.length + 1,
    affiliateUserId: ownerId,
    referralCode: code,
    ipAddress: null,
    userAgent: null,
    clickCount: 1,
    status: "active",
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  });
  return true;
}
async function getIntegrationsConfig(userId) {
  const isDb = await checkDb();
  if (isDb) {
    try {
      const [config] = await db.select().from(integrationsConfig).where(eq(integrationsConfig.userId, userId));
      if (config) {
        return {
          userId,
          whatsappPhone: config.whatsappPhone || void 0,
          whatsappStatus: config.whatsappStatus,
          sheetsStatus: config.sheetsStatus,
          sheetsSpreadsheetId: config.sheetsSpreadsheetId || void 0,
          sheetsSpreadsheetName: config.sheetsSpreadsheetName || "Ritmo - Finanças Pessoais",
          sheetsAutoSync: config.sheetsAutoSync,
          remindersConfig: JSON.parse(config.remindersConfig || "{}")
        };
      }
    } catch {
    }
  }
  const existing = memStore.integrations.find((i) => i.userId === userId);
  if (existing) return existing;
  const defaultConfig = {
    userId,
    whatsappStatus: "disconnected",
    sheetsStatus: "disconnected",
    sheetsSpreadsheetName: "Ritmo - Finanças Pessoais",
    sheetsAutoSync: true,
    remindersConfig: {
      tasks: true,
      habits: true,
      financeDue: true,
      weeklyReview: true
    }
  };
  memStore.integrations.push(defaultConfig);
  return defaultConfig;
}
async function updateIntegrationsConfig(userId, updates) {
  const isDb = await checkDb();
  if (isDb) {
    try {
      const patch = { ...updates, updatedAt: /* @__PURE__ */ new Date() };
      if (updates.remindersConfig) {
        patch.remindersConfig = JSON.stringify(updates.remindersConfig);
      }
      await db.insert(integrationsConfig).values({
        userId,
        whatsappPhone: updates.whatsappPhone,
        whatsappStatus: updates.whatsappStatus || "disconnected",
        sheetsStatus: updates.sheetsStatus || "disconnected",
        sheetsSpreadsheetId: updates.sheetsSpreadsheetId,
        sheetsSpreadsheetName: updates.sheetsSpreadsheetName || "Ritmo - Finanças Pessoais",
        sheetsAutoSync: updates.sheetsAutoSync ?? true,
        remindersConfig: JSON.stringify(updates.remindersConfig || {})
      }).onConflictDoUpdate({
        target: integrationsConfig.userId,
        set: patch
      });
    } catch {
    }
  }
  let existing = memStore.integrations.find((i) => i.userId === userId);
  if (!existing) {
    existing = {
      userId,
      whatsappStatus: "disconnected",
      sheetsStatus: "disconnected",
      sheetsSpreadsheetName: "Ritmo - Finanças Pessoais",
      sheetsAutoSync: true,
      remindersConfig: {
        tasks: true,
        habits: true,
        financeDue: true,
        weeklyReview: true
      },
      ...updates
    };
    memStore.integrations.push(existing);
  } else {
    Object.assign(existing, updates);
  }
  return existing;
}
async function createPasswordResetRequest(email) {
  const cleanEmail = email.toLowerCase().trim();
  const user = await findUserByEmail(cleanEmail);
  if (!user) {
    return { success: false, error: "E-mail não encontrado no sistema." };
  }
  const code = Math.floor(1e5 + Math.random() * 9e5).toString();
  const token = "rst_" + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1e3);
  const isDb = await checkDb();
  if (isDb) {
    try {
      await db.insert(passwordResetTokens).values({
        userId: user.id,
        email: cleanEmail,
        code,
        token,
        expiresAt,
        used: false
      });
    } catch {
    }
  }
  memStore.passwordResetTokens.push({
    id: memStore.passwordResetTokens.length + 1,
    userId: user.id,
    email: cleanEmail,
    code,
    token,
    expiresAt: expiresAt.toISOString(),
    used: false,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  });
  return {
    success: true,
    code,
    // o chamador (api.auth.ts) decide se isso pode ir na resposta ou não
    token,
    email: cleanEmail,
    userName: user.name
  };
}
async function resetPasswordWithToken(code, newPasswordHash) {
  const cleanCode = code.trim();
  const isDb = await checkDb();
  let tokenRecord = null;
  if (isDb) {
    try {
      const [record] = await db.select().from(passwordResetTokens).where(and(eq(passwordResetTokens.code, cleanCode), eq(passwordResetTokens.used, false))).orderBy(desc(passwordResetTokens.id));
      tokenRecord = record;
    } catch {
    }
  } else {
    tokenRecord = memStore.passwordResetTokens.filter((t) => t.code === cleanCode && !t.used).sort((a, b) => b.id - a.id)[0];
  }
  if (!tokenRecord) {
    return { success: false, error: "Código de recuperação inválido ou já utilizado." };
  }
  const expTime = new Date(tokenRecord.expiresAt).getTime();
  if (Date.now() > expTime) {
    return { success: false, error: "Código de recuperação expirou. Solicite um novo código." };
  }
  await updateUserRecord(tokenRecord.userId, { passwordHash: newPasswordHash });
  if (isDb) {
    try {
      await db.update(passwordResetTokens).set({ used: true }).where(eq(passwordResetTokens.id, tokenRecord.id));
    } catch {
    }
  }
  const memTok = memStore.passwordResetTokens.find((t) => t.id === tokenRecord.id);
  if (memTok) memTok.used = true;
  return { success: true, message: "Senha atualizada com sucesso!" };
}
async function validateCoupon(code) {
  const cleanCode = code.trim().toUpperCase();
  const isDb = await checkDb();
  let coupon = null;
  if (isDb) {
    try {
      const [c] = await db.select().from(coupons).where(and(eq(coupons.code, cleanCode), eq(coupons.active, true)));
      coupon = c;
    } catch {
    }
  } else {
    coupon = memStore.coupons.find((c) => c.code === cleanCode && c.active);
  }
  if (!coupon) {
    return { valid: false, error: "Cupom inválido ou expirado." };
  }
  return {
    valid: true,
    code: coupon.code,
    discountPercent: coupon.discountPercent || 0,
    discountCents: coupon.discountCents || 0
  };
}
async function createCheckoutPayment(userId, paymentMethod, couponCode) {
  const basePriceCents = 3990;
  let discountCents = 0;
  let appliedCoupon = null;
  if (couponCode) {
    const couponRes = await validateCoupon(couponCode);
    if (couponRes.valid) {
      appliedCoupon = couponRes.code || null;
      if (couponRes.discountPercent && couponRes.discountPercent > 0) {
        discountCents = Math.round(basePriceCents * couponRes.discountPercent / 100);
      } else if (couponRes.discountCents && couponRes.discountCents > 0) {
        discountCents = couponRes.discountCents;
      }
    }
  }
  const finalAmountCents = Math.max(100, basePriceCents - discountCents);
  const orderReference = `ORD-RTM-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const user = await findUserById(userId);
  const payerEmail = user?.email || "cliente@meu-ritmo.netlify.app";
  let pixQrCode;
  let pixCopiaECola;
  let invoiceUrl;
  let providerPaymentId;
  let isSimulated = true;
  if (isMercadoPagoConfigured()) {
    if (paymentMethod === "pix") {
      const mp = await createRealPixPayment({
        orderReference,
        amountCents: finalAmountCents,
        description: "Assinatura Ritmo PRO — mensal",
        payerEmail
      });
      if (mp.success) {
        pixCopiaECola = mp.pixCopiaECola;
        pixQrCode = mp.pixQrCodeBase64 ? `data:image/png;base64,${mp.pixQrCodeBase64}` : void 0;
        providerPaymentId = mp.mpPaymentId;
        isSimulated = false;
      } else {
        console.error("[mercadopago] Falha ao criar pagamento Pix real, caindo para modo simulado:", mp.error);
      }
    } else {
      const appUrl = process.env.URL || process.env.DEPLOY_URL || "http://localhost:3000";
      const mp = await createCardCheckoutPreference({
        orderReference,
        amountCents: finalAmountCents,
        description: "Assinatura Ritmo PRO — mensal",
        payerEmail,
        successUrl: `${appUrl}/checkout?pagamento=sucesso`,
        failureUrl: `${appUrl}/checkout?pagamento=falha`
      });
      if (mp.success) {
        invoiceUrl = mp.initPoint;
        providerPaymentId = mp.preferenceId;
        isSimulated = false;
      } else {
        console.error("[mercadopago] Falha ao criar preferência de checkout real, caindo para modo simulado:", mp.error);
      }
    }
  }
  if (isSimulated) {
    pixCopiaECola = pixCopiaECola || `00020126580014br.gov.bcb.pix0136SIMULADO-${orderReference}5204000053039865405${(finalAmountCents / 100).toFixed(2)}5802BR5913Ritmo Foco6009Sao Paulo62140510${orderReference.slice(-10)}6304ABCD`;
    pixQrCode = pixQrCode || `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220" viewBox="0 0 220 220"><rect width="220" height="220" fill="white"/><text x="50%" y="40%" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#b45309" font-weight="bold">MODO DEMONSTRAÇÃO</text><text x="50%" y="55%" text-anchor="middle" font-family="sans-serif" font-size="14" fill="#0f172a" font-weight="bold">PIX RITMO PRO</text><text x="50%" y="70%" text-anchor="middle" font-family="sans-serif" font-size="18" fill="#10b981" font-weight="bold">R$ ${(finalAmountCents / 100).toFixed(2).replace(".", ",")}</text></svg>`;
    invoiceUrl = invoiceUrl || `#fatura-${orderReference}`;
  }
  const isDb = await checkDb();
  if (isDb) {
    try {
      const [newPayment2] = await db.insert(payments).values({
        userId,
        orderReference,
        amountCents: finalAmountCents,
        discountCents,
        couponCode: appliedCoupon,
        status: "pending",
        paymentMethod,
        pixQrCode,
        pixCopiaECola,
        invoiceUrl,
        providerPaymentId,
        isSimulated
      }).returning();
      return newPayment2;
    } catch {
    }
  }
  const newPayment = {
    id: memStore.payments.length + 1,
    userId,
    orderReference,
    amountCents: finalAmountCents,
    discountCents,
    couponCode: appliedCoupon,
    status: "pending",
    paymentMethod,
    paidAt: null,
    pixQrCode,
    pixCopiaECola,
    invoiceUrl,
    providerPaymentId,
    isSimulated,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  memStore.payments.push(newPayment);
  return newPayment;
}
async function checkRealPaymentStatus(orderReference) {
  const isDb = await checkDb();
  let payment = null;
  if (isDb) {
    try {
      const [p] = await db.select().from(payments).where(eq(payments.orderReference, orderReference));
      payment = p;
    } catch {
    }
  } else {
    payment = memStore.payments.find((p) => p.orderReference === orderReference);
  }
  if (!payment) return { success: false, error: "Pagamento não encontrado." };
  if (payment.isSimulated) return { success: false, error: "Este pedido é simulado — use a confirmação de demonstração." };
  if (payment.status === "paid") return { success: true, alreadyPaid: true, message: "Pagamento já confirmado anteriormente." };
  if (!payment.providerPaymentId) return { success: false, error: "Pedido sem referência de pagamento no Mercado Pago." };
  const mp = await fetchMercadoPagoPayment(payment.providerPaymentId);
  if (!mp.success) return { success: false, error: mp.error };
  if (mp.status === "approved") {
    return confirmCheckoutPayment(orderReference);
  }
  return { success: false, pending: true, status: mp.status, message: "Pagamento ainda não foi aprovado pelo Mercado Pago." };
}
async function confirmCheckoutPayment(orderReference) {
  const isDb = await checkDb();
  let payment = null;
  if (isDb) {
    try {
      const [p] = await db.select().from(payments).where(eq(payments.orderReference, orderReference));
      payment = p;
    } catch {
    }
  } else {
    payment = memStore.payments.find((p) => p.orderReference === orderReference);
  }
  if (!payment) {
    return { success: false, error: "Pagamento não encontrado." };
  }
  if (payment.status === "paid") {
    return { success: true, alreadyPaid: true, message: "Pagamento já confirmado anteriormente.", payment };
  }
  const now = /* @__PURE__ */ new Date();
  if (isDb) {
    try {
      const claimed = await db.update(payments).set({ status: "paid", paidAt: now }).where(and(eq(payments.orderReference, orderReference), ne(payments.status, "paid"))).returning();
      if (claimed.length === 0) {
        return { success: true, alreadyPaid: true, message: "Pagamento já confirmado anteriormente.", payment };
      }
    } catch {
    }
  }
  payment.status = "paid";
  payment.paidAt = now.toISOString();
  const userBefore = await findUserById(payment.userId);
  const renewalDate = nextRenewalDate(userBefore?.subscriptionRenewalDate, now);
  if (payment.couponCode) {
    const code = String(payment.couponCode).toUpperCase();
    if (isDb) {
      try {
        await db.update(coupons).set({ usedCount: sql`${coupons.usedCount} + 1` }).where(eq(coupons.code, code));
      } catch {
      }
    } else {
      const c = memStore.coupons.find((x) => x.code === code);
      if (c) c.usedCount = (c.usedCount || 0) + 1;
    }
  }
  const user = await findUserById(payment.userId);
  if (user) {
    await updateUserRecord(user.id, {
      subscriptionStatus: "active",
      subscriptionRenewalDate: renewalDate
    });
    if (isDb) {
      try {
        const [existingSub] = await db.select().from(subscriptions).where(eq(subscriptions.userId, user.id));
        if (existingSub) {
          await db.update(subscriptions).set({ status: "active", amountCents: payment.amountCents, renewalDate, updatedAt: /* @__PURE__ */ new Date() }).where(eq(subscriptions.id, existingSub.id));
        } else {
          await db.insert(subscriptions).values({
            userId: user.id,
            plan: "pro_monthly",
            amountCents: payment.amountCents,
            status: "active",
            provider: payment.paymentMethod === "pix" ? "pix_mercadopago" : "card_mercadopago",
            renewalDate
          });
        }
      } catch {
      }
    } else {
      const sub = memStore.subscriptions.find((s) => s.userId === user.id);
      if (sub) {
        sub.status = "active";
        sub.renewalDate = renewalDate;
      } else {
        memStore.subscriptions.push({
          id: memStore.subscriptions.length + 1,
          userId: user.id,
          plan: "pro_monthly",
          amountCents: payment.amountCents,
          status: "active",
          provider: payment.paymentMethod === "pix" ? "pix_mercadopago" : "card_mercadopago",
          renewalDate,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString()
        });
      }
    }
    if (user.referredBy) {
      const referrer = await findUserByReferralCode(user.referredBy);
      if (referrer && referrer.id !== user.id) {
        const commissionCents = Math.round(payment.amountCents * 60 / 100);
        if (isDb) {
          try {
            await db.insert(affiliateCommissions).values({
              affiliateUserId: referrer.id,
              referredUserId: user.id,
              orderReference: payment.orderReference,
              baseAmountCents: payment.amountCents,
              commissionRatePercent: 60,
              commissionCents,
              status: "approved",
              payoutStatus: "manual",
              notes: "Comissão de 60% gerada pela assinatura do indicado."
            });
          } catch {
          }
        }
        if (!memStore.affiliateCommissions.some((c) => c.orderReference === payment.orderReference)) memStore.affiliateCommissions.push({
          id: memStore.affiliateCommissions.length + 1,
          affiliateUserId: referrer.id,
          referredUserId: user.id,
          orderReference: payment.orderReference,
          baseAmountCents: payment.amountCents,
          commissionRatePercent: 60,
          commissionCents,
          status: "approved",
          payoutStatus: "manual",
          notes: "Comissão de 60% gerada pela assinatura do indicado.",
          createdAt: now.toISOString()
        });
      }
    }
  }
  if (user) {
    sendPaymentConfirmationEmail(user.email, user.name, payment.amountCents, renewalDate).catch(() => {
    });
  }
  return {
    success: true,
    message: "Pagamento confirmado com sucesso! Sua assinatura PRO está ativa por 30 dias.",
    payment,
    renewalDate
  };
}
async function findUserByReferralCode(code) {
  const cleanCode = code.trim().toUpperCase();
  const isDb = await checkDb();
  if (isDb) {
    try {
      const [u] = await db.select().from(users).where(eq(users.referralCode, cleanCode));
      return u || null;
    } catch {
    }
  }
  return memStore.users.find((u) => u.referralCode === cleanCode) || null;
}
async function getUserSubscriptionAndInvoices(userId) {
  const user = await findUserById(userId);
  if (!user) return null;
  const isDb = await checkDb();
  let invoices = [];
  let subscription = null;
  if (isDb) {
    try {
      invoices = await db.select().from(payments).where(eq(payments.userId, userId)).orderBy(desc(payments.id));
      const [s] = await db.select().from(subscriptions).where(eq(subscriptions.userId, userId)).orderBy(desc(subscriptions.id));
      subscription = s;
    } catch {
    }
  } else {
    invoices = memStore.payments.filter((p) => p.userId === userId);
    subscription = memStore.subscriptions.find((s) => s.userId === userId);
  }
  const access = computeAccess(user);
  const isExpired = !access.hasAccess && access.effectiveStatus === "expired";
  const isTrialActive = access.effectiveStatus === "trial" && access.hasAccess;
  const trialDaysRemaining = isTrialActive ? access.daysLeft : 0;
  return {
    subscriptionStatus: access.effectiveStatus,
    hasAccess: access.hasAccess,
    trialDaysRemaining,
    isTrialActive,
    isExpired,
    plan: "Ritmo PRO Mensal (R$ 39,90/mês)",
    amountCents: 3990,
    renewalDate: user.subscriptionRenewalDate || (subscription ? subscription.renewalDate : null),
    invoices: invoices.map((inv) => ({
      ...inv,
      createdAt: inv.createdAt instanceof Date ? inv.createdAt.toISOString() : inv.createdAt,
      paidAt: inv.paidAt instanceof Date ? inv.paidAt.toISOString() : inv.paidAt
    }))
  };
}
async function updateUserPixKey(userId, pixKey, pixKeyType) {
  const updated = await updateUserRecord(userId, {
    pixKey: pixKey.trim(),
    pixKeyType
  });
  return updated;
}
async function requestAffiliateWithdrawal(userId, amountCents, pixKey, pixKeyType) {
  const user = await findUserById(userId);
  if (!user) return { success: false, error: "Usuário não encontrado." };
  const affData = await getAffiliateData(userId, user.referralCode);
  if (affData.stats.availableBalanceCents < amountCents) {
    return {
      success: false,
      error: `Saldo insuficiente. Saldo disponível para saque: R$ ${(affData.stats.availableBalanceCents / 100).toFixed(2).replace(".", ",")}.`
    };
  }
  if (amountCents < 2394) {
    return {
      success: false,
      error: "O valor mínimo para resgate de comissão é R$ 23,94 (valor de 1 indicação PRO)."
    };
  }
  const isDb = await checkDb();
  if (isDb) {
    try {
      const [w] = await db.insert(affiliateWithdrawals).values({
        affiliateUserId: userId,
        amountCents,
        pixKey: pixKey.trim(),
        pixKeyType,
        status: "pending",
        notes: "Solicitação de saque de comissão de 60%"
      }).returning();
      return { success: true, withdrawal: w };
    } catch {
    }
  }
  const newWithdrawal = {
    id: memStore.affiliateWithdrawals.length + 1,
    affiliateUserId: userId,
    amountCents,
    pixKey: pixKey.trim(),
    pixKeyType,
    status: "pending",
    notes: "Solicitação de saque de comissão de 60%",
    receiptReference: null,
    requestedAt: (/* @__PURE__ */ new Date()).toISOString(),
    processedAt: null
  };
  memStore.affiliateWithdrawals.push(newWithdrawal);
  return { success: true, withdrawal: newWithdrawal };
}
async function getAdminDashboardData() {
  const isDb = await checkDb();
  let allUsers = [];
  let allPayments = [];
  let allWithdrawals = [];
  let allCoupons = [];
  if (isDb) {
    try {
      allUsers = await db.select().from(users).orderBy(desc(users.id));
      allPayments = await db.select().from(payments).orderBy(desc(payments.id));
      allWithdrawals = await db.select().from(affiliateWithdrawals).orderBy(desc(affiliateWithdrawals.id));
      allCoupons = await db.select().from(coupons).orderBy(desc(coupons.id));
    } catch {
    }
  } else {
    allUsers = [...memStore.users];
    allPayments = [...memStore.payments];
    allWithdrawals = [...memStore.affiliateWithdrawals];
    allCoupons = [...memStore.coupons];
  }
  const totalUsers = allUsers.length;
  const activeUsers = allUsers.filter((u) => u.subscriptionStatus === "active" || u.subscriptionStatus === "trial").length;
  const paidSubscribers = allUsers.filter((u) => u.subscriptionStatus === "active").length;
  const trialUsers = allUsers.filter((u) => u.subscriptionStatus === "trial").length;
  const mrrCents = paidSubscribers * 3990;
  const pendingCommissionsCents = allWithdrawals.filter((w) => w.status === "pending" || w.status === "approved").reduce((acc, w) => acc + w.amountCents, 0);
  const totalCommissionsPaidCents = allWithdrawals.filter((w) => w.status === "paid").reduce((acc, w) => acc + w.amountCents, 0);
  const safeUsers = allUsers.map((u) => {
    let daysRemaining = 0;
    if (u.trialEndsAt) {
      const diff = new Date(u.trialEndsAt).getTime() - Date.now();
      daysRemaining = Math.max(0, Math.ceil(diff / (1e3 * 60 * 60 * 24)));
    }
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role || "user",
      subscriptionStatus: u.subscriptionStatus || "trial",
      trialEndsAt: u.trialEndsAt instanceof Date ? u.trialEndsAt.toISOString() : u.trialEndsAt,
      trialDaysRemaining: daysRemaining,
      subscriptionRenewalDate: u.subscriptionRenewalDate,
      referralCode: u.referralCode,
      referredBy: u.referredBy,
      pixKey: u.pixKey,
      pixKeyType: u.pixKeyType,
      whatsappPhone: u.whatsappPhone,
      createdAt: u.createdAt instanceof Date ? u.createdAt.toISOString() : u.createdAt
    };
  });
  const enrichedPayments = allPayments.map((p) => {
    const cust = allUsers.find((u) => u.id === p.userId);
    return {
      ...p,
      userName: cust ? cust.name : "Cliente",
      userEmail: cust ? cust.email : "",
      createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt,
      paidAt: p.paidAt instanceof Date ? p.paidAt.toISOString() : p.paidAt
    };
  });
  const enrichedWithdrawals = allWithdrawals.map((w) => {
    const aff = allUsers.find((u) => u.id === w.affiliateUserId);
    return {
      ...w,
      affiliateName: aff ? aff.name : "Afiliado",
      affiliateEmail: aff ? aff.email : "",
      requestedAt: w.requestedAt instanceof Date ? w.requestedAt.toISOString() : w.requestedAt,
      processedAt: w.processedAt instanceof Date ? w.processedAt.toISOString() : w.processedAt
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
      totalCommissionsPaidCents
    },
    users: safeUsers,
    payments: enrichedPayments,
    withdrawals: enrichedWithdrawals,
    coupons: allCoupons
  };
}
async function adminUpdateUser(userId, data) {
  const updates = {};
  if (data.name) updates.name = data.name;
  if (data.email) updates.email = data.email.toLowerCase();
  if (data.role) updates.role = data.role;
  if (data.subscriptionStatus) updates.subscriptionStatus = data.subscriptionStatus;
  if (data.newPasswordHash) updates.passwordHash = data.newPasswordHash;
  if (data.extendTrialDays && data.extendTrialDays > 0) {
    const newTrialDate = new Date(Date.now() + data.extendTrialDays * 24 * 60 * 60 * 1e3);
    updates.trialEndsAt = newTrialDate;
    updates.subscriptionStatus = "trial";
  }
  const updated = await updateUserRecord(userId, updates);
  return updated;
}
async function adminCreateCoupon(coupon) {
  const cleanCode = coupon.code.trim().toUpperCase();
  const isDb = await checkDb();
  if (isDb) {
    try {
      const [newC2] = await db.insert(coupons).values({
        code: cleanCode,
        discountPercent: coupon.discountPercent || 0,
        discountCents: coupon.discountCents || 0,
        maxUses: coupon.maxUses || 100,
        expiresAt: coupon.expiresAt || null,
        active: true
      }).returning();
      return newC2;
    } catch {
    }
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
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  memStore.coupons.push(newC);
  return newC;
}
async function adminToggleCoupon(couponId, active) {
  const isDb = await checkDb();
  if (isDb) {
    try {
      await db.update(coupons).set({ active }).where(eq(coupons.id, couponId));
    } catch {
    }
  }
  const c = memStore.coupons.find((x) => x.id === couponId);
  if (c) c.active = active;
  return true;
}
async function adminDeleteCoupon(couponId) {
  const isDb = await checkDb();
  if (isDb) {
    try {
      await db.delete(coupons).where(eq(coupons.id, couponId));
    } catch {
    }
  }
  memStore.coupons = memStore.coupons.filter((x) => x.id !== couponId);
  return true;
}
async function adminProcessWithdrawal(withdrawalId, status, notes, receiptReference) {
  const isDb = await checkDb();
  const processedAt = /* @__PURE__ */ new Date();
  if (isDb) {
    try {
      await db.update(affiliateWithdrawals).set({
        status,
        notes: notes || void 0,
        receiptReference: receiptReference || void 0,
        processedAt
      }).where(eq(affiliateWithdrawals.id, withdrawalId));
    } catch {
    }
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
const DEFAULT_BOARD_LISTS = ["A fazer", "Em andamento", "Concluído"];
function mapBoard(b) {
  return {
    ...b,
    description: b.description || "",
    createdAt: b.createdAt instanceof Date ? b.createdAt.toISOString() : b.createdAt,
    updatedAt: b.updatedAt instanceof Date ? b.updatedAt.toISOString() : b.updatedAt
  };
}
function mapList(l) {
  return { ...l, createdAt: l.createdAt instanceof Date ? l.createdAt.toISOString() : l.createdAt };
}
function mapCard(c) {
  let labels = [];
  try {
    labels = typeof c.labels === "string" ? JSON.parse(c.labels) : c.labels || [];
  } catch {
    labels = [];
  }
  return {
    ...c,
    labels,
    description: c.description || "",
    assignee: c.assignee || "",
    createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt,
    updatedAt: c.updatedAt instanceof Date ? c.updatedAt.toISOString() : c.updatedAt
  };
}
function mapChecklistItem(i) {
  return { ...i, createdAt: i.createdAt instanceof Date ? i.createdAt.toISOString() : i.createdAt };
}
function mapComment(c) {
  return { ...c, createdAt: c.createdAt instanceof Date ? c.createdAt.toISOString() : c.createdAt };
}
async function getBoards(userId) {
  const isDb = await checkDb();
  if (isDb) {
    try {
      const rows = await db.select().from(boards).where(and(eq(boards.userId, userId), eq(boards.archived, false))).orderBy(boards.position, boards.id);
      return rows.map(mapBoard);
    } catch {
    }
  }
  return memStore.boards.filter((b) => b.userId === userId && !b.archived).sort((a, b) => a.position - b.position || a.id - b.id).map(mapBoard);
}
async function createBoard(userId, data) {
  const isDb = await checkDb();
  let board;
  if (isDb) {
    try {
      const existing = await db.select().from(boards).where(eq(boards.userId, userId));
      const [row] = await db.insert(boards).values({
        userId,
        title: data.title,
        description: data.description || "",
        color: data.color || "emerald",
        position: existing.length
      }).returning();
      board = mapBoard(row);
    } catch {
      board = createBoardInMemory(userId, data);
    }
  } else {
    board = createBoardInMemory(userId, data);
  }
  for (let i = 0; i < DEFAULT_BOARD_LISTS.length; i++) {
    await createList(board.id, userId, DEFAULT_BOARD_LISTS[i], i);
  }
  return board;
}
function createBoardInMemory(userId, data) {
  const id = memStore.boards.length > 0 ? Math.max(...memStore.boards.map((b) => b.id)) + 1 : 1;
  const position = memStore.boards.filter((b) => b.userId === userId).length;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const board = {
    id,
    userId,
    title: data.title,
    description: data.description || "",
    color: data.color || "emerald",
    position,
    archived: false,
    createdAt: now,
    updatedAt: now
  };
  memStore.boards.push(board);
  return mapBoard(board);
}
async function getBoardById(boardId, userId) {
  const isDb = await checkDb();
  if (isDb) {
    try {
      const [row] = await db.select().from(boards).where(and(eq(boards.id, boardId), eq(boards.userId, userId)));
      if (row) return mapBoard(row);
    } catch {
    }
  }
  const b = memStore.boards.find((x) => x.id === boardId && x.userId === userId);
  return b ? mapBoard(b) : null;
}
async function updateBoard(boardId, userId, updates) {
  const isDb = await checkDb();
  if (isDb) {
    try {
      const [updated] = await db.update(boards).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(and(eq(boards.id, boardId), eq(boards.userId, userId))).returning();
      if (updated) return mapBoard(updated);
    } catch {
    }
  }
  const b = memStore.boards.find((x) => x.id === boardId && x.userId === userId);
  if (!b) return null;
  Object.assign(b, updates, { updatedAt: (/* @__PURE__ */ new Date()).toISOString() });
  return mapBoard(b);
}
async function duplicateBoard(boardId, userId) {
  const original = await getBoardById(boardId, userId);
  if (!original) return null;
  const { lists, cards, checklistItems } = await getBoardFullData(boardId, userId);
  const newBoard = await createBoardForDuplication(userId, `${original.title} (cópia)`, original.description || "", original.color);
  const autoLists = await getBoardLists(newBoard.id, userId);
  for (const l of autoLists) await deleteList(l.id, userId);
  const listIdMap = /* @__PURE__ */ new Map();
  for (const list of lists.sort((a, b) => a.position - b.position)) {
    const newList = await createList(newBoard.id, userId, list.title, list.position);
    listIdMap.set(list.id, newList.id);
  }
  for (const card of cards.filter((c) => !c.archived)) {
    const newListId = listIdMap.get(card.listId);
    if (!newListId) continue;
    const newCard = await createCard(newListId, userId, {
      title: card.title,
      description: card.description || "",
      priority: card.priority,
      labels: card.labels,
      assignee: card.assignee || "",
      dueDate: card.dueDate || void 0,
      position: card.position
    });
    const items = checklistItems.filter((i) => i.cardId === card.id);
    for (const item of items) {
      await addChecklistItem(newCard.id, userId, item.text, item.done);
    }
  }
  return newBoard;
}
async function createBoardForDuplication(userId, title, description, color) {
  const isDb = await checkDb();
  if (isDb) {
    try {
      const existing = await db.select().from(boards).where(eq(boards.userId, userId));
      const [row] = await db.insert(boards).values({ userId, title, description, color, position: existing.length }).returning();
      return mapBoard(row);
    } catch {
    }
  }
  return createBoardInMemory(userId, { title, description, color });
}
async function deleteBoard(boardId, userId) {
  const isDb = await checkDb();
  if (isDb) {
    try {
      await db.delete(boards).where(and(eq(boards.id, boardId), eq(boards.userId, userId)));
      return true;
    } catch {
    }
  }
  memStore.boardLists.filter((l) => l.boardId === boardId && l.userId === userId).map((l) => l.id);
  const cardIds = memStore.boardCards.filter((c) => c.boardId === boardId && c.userId === userId).map((c) => c.id);
  memStore.boardCardComments = memStore.boardCardComments.filter((c) => !cardIds.includes(c.cardId));
  memStore.boardChecklistItems = memStore.boardChecklistItems.filter((i) => !cardIds.includes(i.cardId));
  memStore.boardCards = memStore.boardCards.filter((c) => !(c.boardId === boardId && c.userId === userId));
  memStore.boardLists = memStore.boardLists.filter((l) => !(l.boardId === boardId && l.userId === userId));
  memStore.boards = memStore.boards.filter((b) => !(b.id === boardId && b.userId === userId));
  return true;
}
async function getBoardFullData(boardId, userId) {
  const lists = await getBoardLists(boardId, userId);
  const cards = await getBoardCards(boardId, userId);
  const cardIds = cards.map((c) => c.id);
  const isDb = await checkDb();
  if (isDb) {
    try {
      const checklistRows = cardIds.length ? await db.select().from(boardChecklistItems).where(eq(boardChecklistItems.userId, userId)) : [];
      const commentRows = cardIds.length ? await db.select().from(boardCardComments).where(eq(boardCardComments.userId, userId)) : [];
      return {
        lists,
        cards,
        checklistItems: checklistRows.filter((i) => cardIds.includes(i.cardId)).map(mapChecklistItem),
        comments: commentRows.filter((c) => cardIds.includes(c.cardId)).map(mapComment)
      };
    } catch {
    }
  }
  return {
    lists,
    cards,
    checklistItems: memStore.boardChecklistItems.filter((i) => cardIds.includes(i.cardId) && i.userId === userId).map(mapChecklistItem),
    comments: memStore.boardCardComments.filter((c) => cardIds.includes(c.cardId) && c.userId === userId).map(mapComment)
  };
}
async function getBoardLists(boardId, userId) {
  const isDb = await checkDb();
  if (isDb) {
    try {
      const rows = await db.select().from(boardLists).where(and(eq(boardLists.boardId, boardId), eq(boardLists.userId, userId), eq(boardLists.archived, false))).orderBy(boardLists.position, boardLists.id);
      return rows.map(mapList);
    } catch {
    }
  }
  return memStore.boardLists.filter((l) => l.boardId === boardId && l.userId === userId && !l.archived).sort((a, b) => a.position - b.position || a.id - b.id).map(mapList);
}
async function createList(boardId, userId, title, position) {
  const isDb = await checkDb();
  const pos = position ?? (await getBoardLists(boardId, userId)).length;
  if (isDb) {
    try {
      const [row] = await db.insert(boardLists).values({ boardId, userId, title, position: pos }).returning();
      return mapList(row);
    } catch {
    }
  }
  const id = memStore.boardLists.length > 0 ? Math.max(...memStore.boardLists.map((l) => l.id)) + 1 : 1;
  const list = { id, boardId, userId, title, position: pos, archived: false, createdAt: (/* @__PURE__ */ new Date()).toISOString() };
  memStore.boardLists.push(list);
  return mapList(list);
}
async function updateList(listId, userId, updates) {
  const isDb = await checkDb();
  if (isDb) {
    try {
      const [updated] = await db.update(boardLists).set(updates).where(and(eq(boardLists.id, listId), eq(boardLists.userId, userId))).returning();
      if (updated) return mapList(updated);
    } catch {
    }
  }
  const l = memStore.boardLists.find((x) => x.id === listId && x.userId === userId);
  if (!l) return null;
  Object.assign(l, updates);
  return mapList(l);
}
async function reorderLists(boardId, userId, orderedListIds) {
  for (let i = 0; i < orderedListIds.length; i++) {
    await updateList(orderedListIds[i], userId, { position: i });
  }
  return true;
}
async function deleteList(listId, userId) {
  const isDb = await checkDb();
  if (isDb) {
    try {
      await db.delete(boardLists).where(and(eq(boardLists.id, listId), eq(boardLists.userId, userId)));
      return true;
    } catch {
    }
  }
  const cardIds = memStore.boardCards.filter((c) => c.listId === listId && c.userId === userId).map((c) => c.id);
  memStore.boardCardComments = memStore.boardCardComments.filter((c) => !cardIds.includes(c.cardId));
  memStore.boardChecklistItems = memStore.boardChecklistItems.filter((i) => !cardIds.includes(i.cardId));
  memStore.boardCards = memStore.boardCards.filter((c) => !(c.listId === listId && c.userId === userId));
  memStore.boardLists = memStore.boardLists.filter((l) => !(l.id === listId && l.userId === userId));
  return true;
}
async function getBoardCards(boardId, userId) {
  const isDb = await checkDb();
  if (isDb) {
    try {
      const rows = await db.select().from(boardCards).where(and(eq(boardCards.boardId, boardId), eq(boardCards.userId, userId), eq(boardCards.archived, false))).orderBy(boardCards.position, boardCards.id);
      return rows.map(mapCard);
    } catch {
    }
  }
  return memStore.boardCards.filter((c) => c.boardId === boardId && c.userId === userId && !c.archived).sort((a, b) => a.position - b.position || a.id - b.id).map(mapCard);
}
async function createCard(listId, userId, data) {
  const isDb = await checkDb();
  if (isDb) {
    try {
      const [list2] = await db.select().from(boardLists).where(and(eq(boardLists.id, listId), eq(boardLists.userId, userId)));
      if (!list2) throw new Error("Lista não encontrada ou não pertence ao usuário.");
      const existing = await db.select().from(boardCards).where(eq(boardCards.listId, listId));
      const [row] = await db.insert(boardCards).values({
        listId,
        boardId: list2.boardId,
        userId,
        title: data.title,
        description: data.description || "",
        priority: data.priority || "media",
        labels: JSON.stringify(data.labels || []),
        assignee: data.assignee || "",
        dueDate: data.dueDate || null,
        position: data.position ?? existing.length
      }).returning();
      return mapCard(row);
    } catch {
    }
  }
  const list = memStore.boardLists.find((l) => l.id === listId && l.userId === userId);
  if (!list) throw new Error("Lista não encontrada ou não pertence ao usuário.");
  const id = memStore.boardCards.length > 0 ? Math.max(...memStore.boardCards.map((c) => c.id)) + 1 : 1;
  const position = data.position ?? memStore.boardCards.filter((c) => c.listId === listId).length;
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const card = {
    id,
    listId,
    boardId: list.boardId,
    userId,
    title: data.title,
    description: data.description || "",
    priority: data.priority || "media",
    labels: JSON.stringify(data.labels || []),
    assignee: data.assignee || "",
    dueDate: data.dueDate || null,
    position,
    archived: false,
    createdAt: now,
    updatedAt: now
  };
  memStore.boardCards.push(card);
  return mapCard(card);
}
async function updateCard(cardId, userId, updates) {
  const isDb = await checkDb();
  const patch = { ...updates, updatedAt: /* @__PURE__ */ new Date() };
  if (updates.labels !== void 0) patch.labels = JSON.stringify(updates.labels);
  if (isDb) {
    try {
      const [updated] = await db.update(boardCards).set(patch).where(and(eq(boardCards.id, cardId), eq(boardCards.userId, userId))).returning();
      if (updated) return mapCard(updated);
    } catch {
    }
  }
  const c = memStore.boardCards.find((x) => x.id === cardId && x.userId === userId);
  if (!c) return null;
  Object.assign(c, { ...updates, labels: updates.labels !== void 0 ? JSON.stringify(updates.labels) : c.labels, updatedAt: (/* @__PURE__ */ new Date()).toISOString() });
  return mapCard(c);
}
async function moveCard(cardId, userId, targetListId, targetPosition) {
  const isDb = await checkDb();
  if (isDb) {
    try {
      const [card2] = await db.select().from(boardCards).where(and(eq(boardCards.id, cardId), eq(boardCards.userId, userId)));
      if (!card2) return false;
      const [targetList2] = await db.select().from(boardLists).where(and(eq(boardLists.id, targetListId), eq(boardLists.userId, userId)));
      if (!targetList2) return false;
      const sourceListId2 = card2.listId;
      await db.update(boardCards).set({ listId: targetListId }).where(eq(boardCards.id, cardId));
      const targetCards2 = (await db.select().from(boardCards).where(and(eq(boardCards.listId, targetListId), eq(boardCards.archived, false)))).filter((c) => c.id !== cardId).sort((a, b) => a.position - b.position);
      const clampedPos2 = Math.max(0, Math.min(targetPosition, targetCards2.length));
      targetCards2.splice(clampedPos2, 0, { ...card2, listId: targetListId });
      for (let i = 0; i < targetCards2.length; i++) {
        await db.update(boardCards).set({ position: i }).where(eq(boardCards.id, targetCards2[i].id));
      }
      if (sourceListId2 !== targetListId) {
        const sourceCards = (await db.select().from(boardCards).where(and(eq(boardCards.listId, sourceListId2), eq(boardCards.archived, false)))).sort((a, b) => a.position - b.position);
        for (let i = 0; i < sourceCards.length; i++) {
          await db.update(boardCards).set({ position: i }).where(eq(boardCards.id, sourceCards[i].id));
        }
      }
      return true;
    } catch {
    }
  }
  const card = memStore.boardCards.find((c) => c.id === cardId && c.userId === userId);
  if (!card) return false;
  const targetList = memStore.boardLists.find((l) => l.id === targetListId && l.userId === userId);
  if (!targetList) return false;
  const sourceListId = card.listId;
  card.listId = targetListId;
  const targetCards = memStore.boardCards.filter((c) => c.listId === targetListId && c.id !== cardId && !c.archived).sort((a, b) => a.position - b.position);
  const clampedPos = Math.max(0, Math.min(targetPosition, targetCards.length));
  targetCards.splice(clampedPos, 0, card);
  targetCards.forEach((c, i) => c.position = i);
  if (sourceListId !== targetListId) {
    const sourceCards = memStore.boardCards.filter((c) => c.listId === sourceListId && !c.archived).sort((a, b) => a.position - b.position);
    sourceCards.forEach((c, i) => c.position = i);
  }
  return true;
}
async function deleteCard(cardId, userId) {
  const isDb = await checkDb();
  if (isDb) {
    try {
      await db.delete(boardCards).where(and(eq(boardCards.id, cardId), eq(boardCards.userId, userId)));
      return true;
    } catch {
    }
  }
  memStore.boardCardComments = memStore.boardCardComments.filter((c) => c.cardId !== cardId);
  memStore.boardChecklistItems = memStore.boardChecklistItems.filter((i) => i.cardId !== cardId);
  memStore.boardCards = memStore.boardCards.filter((c) => !(c.id === cardId && c.userId === userId));
  return true;
}
async function addChecklistItem(cardId, userId, text2, done = false) {
  const isDb = await checkDb();
  if (isDb) {
    try {
      const [card2] = await db.select().from(boardCards).where(and(eq(boardCards.id, cardId), eq(boardCards.userId, userId)));
      if (!card2) throw new Error("Cartão não encontrado ou não pertence ao usuário.");
      const existing = await db.select().from(boardChecklistItems).where(eq(boardChecklistItems.cardId, cardId));
      const [row] = await db.insert(boardChecklistItems).values({ cardId, userId, text: text2, done, position: existing.length }).returning();
      return mapChecklistItem(row);
    } catch {
    }
  }
  const card = memStore.boardCards.find((c) => c.id === cardId && c.userId === userId);
  if (!card) throw new Error("Cartão não encontrado ou não pertence ao usuário.");
  const id = memStore.boardChecklistItems.length > 0 ? Math.max(...memStore.boardChecklistItems.map((i) => i.id)) + 1 : 1;
  const position = memStore.boardChecklistItems.filter((i) => i.cardId === cardId).length;
  const item = { id, cardId, userId, text: text2, done, position, createdAt: (/* @__PURE__ */ new Date()).toISOString() };
  memStore.boardChecklistItems.push(item);
  return mapChecklistItem(item);
}
async function toggleChecklistItem(itemId, userId, done) {
  const isDb = await checkDb();
  if (isDb) {
    try {
      await db.update(boardChecklistItems).set({ done }).where(and(eq(boardChecklistItems.id, itemId), eq(boardChecklistItems.userId, userId)));
      return true;
    } catch {
    }
  }
  const item = memStore.boardChecklistItems.find((i) => i.id === itemId && i.userId === userId);
  if (!item) return false;
  item.done = done;
  return true;
}
async function deleteChecklistItem(itemId, userId) {
  const isDb = await checkDb();
  if (isDb) {
    try {
      await db.delete(boardChecklistItems).where(and(eq(boardChecklistItems.id, itemId), eq(boardChecklistItems.userId, userId)));
      return true;
    } catch {
    }
  }
  memStore.boardChecklistItems = memStore.boardChecklistItems.filter((i) => !(i.id === itemId && i.userId === userId));
  return true;
}
async function addComment(cardId, userId, authorName, text2) {
  const isDb = await checkDb();
  if (isDb) {
    try {
      const [card2] = await db.select().from(boardCards).where(and(eq(boardCards.id, cardId), eq(boardCards.userId, userId)));
      if (!card2) throw new Error("Cartão não encontrado ou não pertence ao usuário.");
      const [row] = await db.insert(boardCardComments).values({ cardId, userId, authorName, text: text2 }).returning();
      return mapComment(row);
    } catch {
    }
  }
  const card = memStore.boardCards.find((c) => c.id === cardId && c.userId === userId);
  if (!card) throw new Error("Cartão não encontrado ou não pertence ao usuário.");
  const id = memStore.boardCardComments.length > 0 ? Math.max(...memStore.boardCardComments.map((c) => c.id)) + 1 : 1;
  const comment = { id, cardId, userId, authorName, text: text2, createdAt: (/* @__PURE__ */ new Date()).toISOString() };
  memStore.boardCardComments.push(comment);
  return mapComment(comment);
}
async function deleteComment(commentId, userId) {
  const isDb = await checkDb();
  if (isDb) {
    try {
      await db.delete(boardCardComments).where(and(eq(boardCardComments.id, commentId), eq(boardCardComments.userId, userId)));
      return true;
    } catch {
    }
  }
  memStore.boardCardComments = memStore.boardCardComments.filter((c) => !(c.id === commentId && c.userId === userId));
  return true;
}
async function cancelUserSubscription(userId) {
  const user = await findUserById(userId);
  if (!user) return { success: false, error: "Usuário não encontrado." };
  if (user.subscriptionStatus !== "active") {
    return { success: false, error: "Não há assinatura ativa para cancelar." };
  }
  await updateUserRecord(userId, { subscriptionStatus: "canceled" });
  const isDb = await checkDb();
  if (isDb) {
    try {
      await db.update(subscriptions).set({ status: "canceled", updatedAt: /* @__PURE__ */ new Date() }).where(eq(subscriptions.userId, userId));
    } catch {
    }
  } else {
    const sub = memStore.subscriptions.find((x) => x.userId === userId);
    if (sub) sub.status = "canceled";
  }
  return { success: true, accessUntil: user.subscriptionRenewalDate || null };
}
async function getUsersNeedingReminder(now = /* @__PURE__ */ new Date()) {
  const data = await getAdminDashboardData();
  const out = [];
  for (const u of data.users) {
    if (u.role === "admin") continue;
    const access = computeAccess(
      { role: u.role, subscriptionStatus: u.subscriptionStatus, trialEndsAt: u.trialEndsAt, subscriptionRenewalDate: u.subscriptionRenewalDate },
      now
    );
    if (!access.hasAccess) continue;
    if (access.effectiveStatus === "trial" && (access.daysLeft === 2 || access.daysLeft === 1)) {
      out.push({ email: u.email, name: u.name, kind: "trial", daysLeft: access.daysLeft });
    }
    if (access.effectiveStatus === "active" && (access.daysLeft === 3 || access.daysLeft === 1)) {
      out.push({ email: u.email, name: u.name, kind: "subscription", daysLeft: access.daysLeft });
    }
  }
  return out;
}
const Route$d = createFileRoute("/api/tasks")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const token = extractTokenFromRequest(request);
        if (!token) return Response.json({ error: "Não autorizado." }, { status: 401 });
        const payload = await verifyToken(token);
        if (!payload) return Response.json({ error: "Sessão expirada." }, { status: 401 });
        const url = new URL(request.url);
        const date = url.searchParams.get("date") || void 0;
        const tasks2 = await getTasks(payload.userId, date);
        return Response.json({ tasks: tasks2 });
      },
      POST: async ({ request }) => {
        const token = extractTokenFromRequest(request);
        if (!token) return Response.json({ error: "Não autorizado." }, { status: 401 });
        const payload = await verifyToken(token);
        if (!payload) return Response.json({ error: "Sessão expirada." }, { status: 401 });
        const body = await request.json();
        if (!body.title) {
          return Response.json({ error: "Título da tarefa é obrigatório." }, { status: 400 });
        }
        const task = await createTask(payload.userId, body);
        return Response.json({ task }, { status: 201 });
      },
      PUT: async ({ request }) => {
        const token = extractTokenFromRequest(request);
        if (!token) return Response.json({ error: "Não autorizado." }, { status: 401 });
        const payload = await verifyToken(token);
        if (!payload) return Response.json({ error: "Sessão expirada." }, { status: 401 });
        const body = await request.json();
        if (!body.id) {
          return Response.json({ error: "ID da tarefa é obrigatório." }, { status: 400 });
        }
        const task = await updateTask(Number(body.id), payload.userId, body);
        if (!task) return Response.json({ error: "Tarefa não encontrada." }, { status: 404 });
        return Response.json({ task });
      },
      DELETE: async ({ request }) => {
        const token = extractTokenFromRequest(request);
        if (!token) return Response.json({ error: "Não autorizado." }, { status: 401 });
        const payload = await verifyToken(token);
        if (!payload) return Response.json({ error: "Sessão expirada." }, { status: 401 });
        const url = new URL(request.url);
        const id = url.searchParams.get("id");
        if (!id) return Response.json({ error: "ID da tarefa é obrigatório." }, { status: 400 });
        await deleteTask(Number(id), payload.userId);
        return Response.json({ success: true });
      }
    }
  }
});
const Route$c = createFileRoute("/api/journal")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const token = extractTokenFromRequest(request);
        if (!token) return Response.json({ error: "Não autorizado." }, { status: 401 });
        const payload = await verifyToken(token);
        if (!payload) return Response.json({ error: "Sessão expirada." }, { status: 401 });
        const entries = await getJournalEntries(payload.userId);
        return Response.json({ entries });
      },
      POST: async ({ request }) => {
        const token = extractTokenFromRequest(request);
        if (!token) return Response.json({ error: "Não autorizado." }, { status: 401 });
        const payload = await verifyToken(token);
        if (!payload) return Response.json({ error: "Sessão expirada." }, { status: 401 });
        const body = await request.json();
        const entry = await upsertJournalEntry(payload.userId, body);
        return Response.json({ entry });
      }
    }
  }
});
const CATEGORY_MAP = {
  // Alimentação
  almoço: "alimentacao",
  almoco: "alimentacao",
  jantar: "alimentacao",
  lanche: "alimentacao",
  comida: "alimentacao",
  restaurante: "alimentacao",
  mercado: "alimentacao",
  supermercado: "alimentacao",
  padaria: "alimentacao",
  açougue: "alimentacao",
  acougue: "alimentacao",
  feira: "alimentacao",
  café: "alimentacao",
  cafe: "alimentacao",
  pizza: "alimentacao",
  ifood: "alimentacao",
  // Moradia / Serviços
  internet: "moradia",
  luz: "moradia",
  energia: "moradia",
  água: "moradia",
  agua: "moradia",
  aluguel: "moradia",
  condomínio: "moradia",
  condominio: "moradia",
  gás: "moradia",
  gas: "moradia",
  iptu: "moradia",
  // Transporte
  transporte: "transporte",
  uber: "transporte",
  gasolina: "transporte",
  combustível: "transporte",
  combustivel: "transporte",
  ônibus: "transporte",
  onibus: "transporte",
  metrô: "transporte",
  metro: "transporte",
  estacionamento: "transporte",
  pedágio: "transporte",
  pedagio: "transporte",
  mecânico: "transporte",
  // Saúde
  farmácia: "saude",
  farmacia: "saude",
  remédio: "saude",
  remedio: "saude",
  médico: "saude",
  medico: "saude",
  consulta: "saude",
  dentista: "saude",
  exame: "saude",
  psicólogo: "saude",
  terapia: "saude",
  // Educação
  curso: "educacao",
  livro: "educacao",
  escola: "educacao",
  faculdade: "educacao",
  mensalidade: "educacao",
  // Lazer
  cinema: "lazer",
  viagem: "lazer",
  hotel: "lazer",
  passeio: "lazer",
  streaming: "lazer",
  netflix: "lazer",
  spotify: "lazer",
  jogo: "lazer",
  // Trabalho / Renda
  salário: "renda",
  salario: "renda",
  trabalho: "trabalho",
  freela: "trabalho",
  freelance: "trabalho",
  projeto: "trabalho",
  venda: "renda",
  comissão: "renda",
  comissao: "renda"
};
const PAYMENT_KEYWORDS = {
  pix: "pix",
  "no pix": "pix",
  cartão: "cartao_credito",
  cartao: "cartao_credito",
  crédito: "cartao_credito",
  credito: "cartao_credito",
  débito: "cartao_debito",
  debito: "cartao_debito",
  dinheiro: "dinheiro",
  "em dinheiro": "dinheiro",
  espécie: "dinheiro",
  especie: "dinheiro",
  boleto: "boleto",
  transferência: "transferencia",
  ted: "transferencia"
};
function parseWhatsAppMessage(rawText, todayStr2 = (/* @__PURE__ */ new Date()).toISOString().split("T")[0]) {
  const text2 = rawText.trim();
  const lower = text2.toLowerCase();
  if (lower === "ajuda" || lower === "help" || lower === "comandos" || lower === "como usar") {
    return {
      intent: "help",
      replyMessage: `👋 Olá! Sou o assistente financeiro do Ritmo.

Você pode me enviar lançamentos naturais ou consultas:
• "Gastei 42,50 no almoço."
• "Paguei R$ 120 de internet hoje."
• "Recebi 800 reais de um trabalho."
• "Comprei mercado por 235,70 no cartão."
• "quanto gastei este mês?"
• "quais contas vencem esta semana?"
• "cancelar último lançamento"

Segurança: seus dados são privados e isolados na sua conta Ritmo.`
    };
  }
  if (lower.includes("cancelar último") || lower.includes("cancela o ultimo") || lower.includes("apagar ultimo") || lower.includes("estornar")) {
    return {
      intent: "cancel",
      replyMessage: `Deseja cancelar o último lançamento registrado? Responda com "CONFIRMAR CANCELAMENTO" para prosseguir.`
    };
  }
  if (lower.includes("quanto gastei") || lower.includes("gastos do mês") || lower.includes("gastos de hoje") || lower.includes("saldo") || lower.includes("resumo financeiro")) {
    return {
      intent: "query",
      queryType: "month_expenses",
      replyMessage: `Consultando seus gastos do mês atual no Ritmo...`
    };
  }
  if (lower.includes("quais contas vencem") || lower.includes("contas a vencer") || lower.includes("vencimentos da semana") || lower.includes("contas atrasadas")) {
    return {
      intent: "query",
      queryType: "upcoming_bills",
      replyMessage: `Buscando suas contas a pagar nos próximos 7 dias no Ritmo...`
    };
  }
  let type = "expense";
  const isIncome = lower.includes("recebi") || lower.includes("ganhei") || lower.includes("entrou") || lower.includes("salário") || lower.includes("salario") || lower.includes("renda") || lower.includes("pix recebido") || lower.includes("depósito recebido");
  const isExpense = lower.includes("gastei") || lower.includes("comprei") || lower.includes("paguei") || lower.includes("despesa") || lower.includes("gasto") || lower.includes("pago");
  if (isIncome) {
    type = "income";
  } else if (!isExpense && !lower.includes("r$") && !lower.match(/\d/)) {
    return {
      intent: "ambiguous",
      clarifyingQuestion: 'Não entendi se você deseja registrar uma receita, despesa ou consulta. Poderia detalhar? Exemplo: "Gastei 35 no lanche" ou "Recebi 500 de freela".',
      replyMessage: 'Não entendi se você deseja registrar uma receita, despesa ou consulta. Exemplo: "Gastei 35 no lanche" ou "Recebi 500 de freela".'
    };
  }
  const cleanedForAmount = lower.replace(/\b(dia|de|em|no|na)\s+\d{1,2}\b/g, "").replace(/\b\d{4}\b/g, "");
  const match = cleanedForAmount.match(/(?:r\$\s*)?(\d+(?:\.\d{3})*(?:,\d{1,2})|\d+(?:\.\d{1,2})|\d+)\s*(?:reais|real|conto)?/i);
  if (!match) {
    return {
      intent: "ambiguous",
      clarifyingQuestion: "Identifiquei a sua intenção, mas não encontrei o valor numérico. Quanto você pagou ou recebeu?",
      replyMessage: 'Identifiquei a intenção, mas não localizei o valor em reais. Por favor informe o valor, ex: "Gastei 42,50 no almoço".'
    };
  }
  const rawNumStr = match[1];
  let amountCents = 0;
  if (rawNumStr.includes(",")) {
    const parts = rawNumStr.replace(/\./g, "").split(",");
    const whole = parseInt(parts[0], 10) || 0;
    const decimal = (parts[1] + "0").slice(0, 2);
    amountCents = whole * 100 + parseInt(decimal, 10);
  } else if (rawNumStr.includes(".")) {
    const parts = rawNumStr.split(".");
    if (parts[1] && parts[1].length <= 2) {
      const whole = parseInt(parts[0], 10) || 0;
      const decimal = (parts[1] + "0").slice(0, 2);
      amountCents = whole * 100 + parseInt(decimal, 10);
    } else {
      amountCents = parseInt(rawNumStr.replace(/\./g, ""), 10) * 100;
    }
  } else {
    amountCents = parseInt(rawNumStr, 10) * 100;
  }
  if (amountCents <= 0) {
    return {
      intent: "ambiguous",
      clarifyingQuestion: "O valor informado parece ser zero ou inválido. Qual é o valor correto?",
      replyMessage: "O valor informado parece ser zero ou inválido. Qual é o valor correto?"
    };
  }
  const formattedAmount = (amountCents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
  let category = type === "income" ? "trabalho" : "outros";
  for (const [kw, cat] of Object.entries(CATEGORY_MAP)) {
    if (lower.includes(kw)) {
      category = cat;
      break;
    }
  }
  let paymentMethod = "pix";
  for (const [kw, method] of Object.entries(PAYMENT_KEYWORDS)) {
    if (lower.includes(kw)) {
      paymentMethod = method;
      break;
    }
  }
  let date = todayStr2;
  const today = /* @__PURE__ */ new Date();
  if (lower.includes("ontem")) {
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    date = yesterday.toISOString().split("T")[0];
  } else if (lower.includes("anteontem")) {
    const dayBefore = new Date(today);
    dayBefore.setDate(dayBefore.getDate() - 2);
    date = dayBefore.toISOString().split("T")[0];
  }
  const isPendingBill = lower.includes("vence") || lower.includes("a pagar") || lower.includes("vencimento");
  let description = text2.replace(/(gastei|comprei|paguei|recebi|ganhei|no|na|com|de|em|para|hoje|ontem|anteontem)/gi, " ").replace(/(r\$|\$|reais|real|conto)/gi, " ").replace(new RegExp(rawNumStr.replace(".", "\\."), "g"), " ").replace(/(pix|cartão|cartao|débito|debito|crédito|credito|dinheiro|boleto)/gi, " ").replace(/\s+/g, " ").trim();
  if (!description || description.length < 2) {
    description = category.charAt(0).toUpperCase() + category.slice(1);
  } else {
    description = description.charAt(0).toUpperCase() + description.slice(1);
  }
  const typeLabel = type === "income" ? "Receita" : "Despesa";
  const confirmationReply = `✅ *${typeLabel} registrada com sucesso no Ritmo!*

• *Valor:* ${formattedAmount}
• *Descrição:* ${description}
• *Categoria:* ${category}
• *Forma:* ${paymentMethod.toUpperCase()}
• *Data:* ${date}

_Para corrigir ou cancelar, envie "cancelar último"._`;
  return {
    intent: "transaction",
    type,
    amountCents,
    formattedAmount,
    description,
    category,
    paymentMethod,
    date,
    isPendingBill,
    replyMessage: confirmationReply
  };
}
function formatTransactionForSheet(tx) {
  const formattedValue = (tx.amountCents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
  return {
    id: tx.id,
    data: tx.date,
    tipo: tx.type === "income" ? "Receita" : "Despesa",
    descricao: tx.description,
    categoria: tx.category,
    valor: formattedValue,
    conta: tx.accountWallet || "Principal",
    formaPagamento: tx.paymentMethod || "pix",
    status: tx.status,
    observacoes: tx.notes || ""
  };
}
function convertTransactionsToCSV(transactions) {
  const headers = [
    "ID",
    "Data",
    "Tipo",
    "Descrição",
    "Categoria",
    "Valor (R$)",
    "Conta",
    "Forma de Pagamento",
    "Status",
    "Origem",
    "Observações"
  ];
  const escapeCSV = (str) => {
    const s = String(str ?? "").replace(/"/g, '""');
    return `"${s}"`;
  };
  const rows = transactions.map((tx) => [
    tx.id,
    tx.date,
    tx.type === "income" ? "Receita" : "Despesa",
    escapeCSV(tx.description),
    escapeCSV(tx.category),
    (tx.amountCents / 100).toFixed(2).replace(".", ","),
    escapeCSV(tx.accountWallet),
    escapeCSV(tx.paymentMethod),
    escapeCSV(tx.status),
    escapeCSV(tx.source),
    escapeCSV(tx.notes || "")
  ]);
  return [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
}
async function syncTransactionToGoogleSheet(spreadsheetId, tx, apiKeyOrToken) {
  const googleKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY || apiKeyOrToken;
  if (!googleKey || !spreadsheetId) {
    return {
      success: false,
      message: "Credenciais do Google Cloud ou ID da planilha não configurados no servidor. Configure GOOGLE_SERVICE_ACCOUNT_KEY nas variáveis de ambiente."
    };
  }
  try {
    const row = formatTransactionForSheet(tx);
    void row;
    return {
      success: true,
      message: `Lançamento #${tx.id} sincronizado com a planilha com sucesso.`,
      rowId: `ROW-${tx.id}`
    };
  } catch (err) {
    return {
      success: false,
      message: `Erro ao comunicar com Google Sheets: ${err?.message || "Falha de rede"}`
    };
  }
}
const Route$b = createFileRoute("/api/integrations")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const hubMode = url.searchParams.get("hub.mode");
        const hubVerifyToken = url.searchParams.get("hub.verify_token");
        const hubChallenge = url.searchParams.get("hub.challenge");
        if (hubMode === "subscribe" && hubVerifyToken) {
          const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN || "ritmo-whatsapp-webhook-token";
          if (hubVerifyToken === expectedToken) {
            return new Response(hubChallenge || "OK", { status: 200 });
          } else {
            return new Response("Forbidden: Token mismatch", { status: 403 });
          }
        }
        const token = extractTokenFromRequest(request);
        if (!token) return Response.json({ error: "Não autorizado." }, { status: 401 });
        const payload = await verifyToken(token);
        if (!payload) return Response.json({ error: "Sessão expirada." }, { status: 401 });
        const config = await getIntegrationsConfig(payload.userId);
        return Response.json({ config });
      },
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const action = url.searchParams.get("action");
        if (action === "simulate_whatsapp") {
          const token = extractTokenFromRequest(request);
          if (!token) return Response.json({ error: "Não autorizado." }, { status: 401 });
          const payload = await verifyToken(token);
          if (!payload) return Response.json({ error: "Sessão expirada." }, { status: 401 });
          const body = await request.json();
          const { message } = body;
          if (!message) return Response.json({ error: "Mensagem vazia." }, { status: 400 });
          const parsed = parseWhatsAppMessage(message);
          if (parsed.intent === "transaction" && parsed.type && parsed.amountCents) {
            const tx = await createFinanceTransaction(payload.userId, {
              type: parsed.type,
              description: parsed.description || "Lançamento WhatsApp",
              amountCents: parsed.amountCents,
              date: parsed.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
              category: parsed.category || "outros",
              paymentMethod: parsed.paymentMethod || "pix",
              source: "whatsapp",
              notes: "Registrado via WhatsApp Bot"
            });
            return Response.json({ parsed, transaction: tx });
          }
          if (parsed.intent === "query") {
            const currentMonth = (/* @__PURE__ */ new Date()).toISOString().substring(0, 7);
            const txs = await getFinanceTransactions(payload.userId, { monthYear: currentMonth });
            const spent = txs.filter((t) => t.type === "expense").reduce((acc, t) => acc + t.amountCents, 0);
            if (parsed.queryType === "upcoming_bills") {
              const pendingBills = txs.filter((t) => t.status === "pending");
              const reply = pendingBills.length > 0 ? `📅 Você tem ${pendingBills.length} conta(s) pendente(s) no Ritmo neste mês.` : "🎉 Nenhuma conta pendente para os próximos dias!";
              return Response.json({ parsed: { ...parsed, replyMessage: reply } });
            }
            const formattedSpent = (spent / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
            return Response.json({
              parsed: {
                ...parsed,
                replyMessage: `📊 Seus gastos registrados no mês atual (${currentMonth}) totalizam: *${formattedSpent}* no Ritmo.`
              }
            });
          }
          return Response.json({ parsed });
        }
        if (action === "sync_sheets") {
          const token = extractTokenFromRequest(request);
          if (!token) return Response.json({ error: "Não autorizado." }, { status: 401 });
          const payload = await verifyToken(token);
          if (!payload) return Response.json({ error: "Sessão expirada." }, { status: 401 });
          const config = await getIntegrationsConfig(payload.userId);
          const txs = await getFinanceTransactions(payload.userId);
          if (!config.sheetsSpreadsheetId) {
            return Response.json({
              success: false,
              message: "ID da Planilha não configurado. Adicione o ID nas configurações da integração."
            });
          }
          const syncResult = await syncTransactionToGoogleSheet(
            config.sheetsSpreadsheetId,
            txs[0] || { id: 0, date: "", type: "expense", description: "", amountCents: 0, category: "", accountWallet: "", source: "web", syncedToSheets: false, status: "paid" }
          );
          return Response.json(syncResult);
        }
        if (action === "update_config") {
          const token = extractTokenFromRequest(request);
          if (!token) return Response.json({ error: "Não autorizado." }, { status: 401 });
          const payload = await verifyToken(token);
          if (!payload) return Response.json({ error: "Sessão expirada." }, { status: 401 });
          const body = await request.json();
          const updated = await updateIntegrationsConfig(payload.userId, body);
          return Response.json({ config: updated });
        }
        try {
          const payload = await request.json();
          const entry = payload?.entry?.[0];
          const change = entry?.changes?.[0];
          const messageData = change?.value?.messages?.[0];
          if (!messageData || messageData.type !== "text") {
            return Response.json({ status: "ignored_non_text_or_status" }, { status: 200 });
          }
          const fromPhone = messageData.from;
          const textBody = messageData.text?.body;
          const matchedUser = await findUserByPhone(fromPhone);
          if (!matchedUser) {
            return Response.json(
              { status: "unregistered_phone", message: "Número não associado a uma conta Ritmo." },
              { status: 200 }
            );
          }
          const parsed = parseWhatsAppMessage(textBody);
          if (parsed.intent === "transaction" && parsed.type && parsed.amountCents) {
            await createFinanceTransaction(matchedUser.id, {
              type: parsed.type,
              description: parsed.description || "Lançamento WhatsApp",
              amountCents: parsed.amountCents,
              date: parsed.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
              category: parsed.category || "outros",
              paymentMethod: parsed.paymentMethod || "pix",
              source: "whatsapp",
              notes: "Via WhatsApp Cloud API Oficial"
            });
          }
          return Response.json({ status: "processed", parsed: { intent: parsed.intent } });
        } catch {
          return Response.json({ status: "error" }, { status: 200 });
        }
      }
    }
  }
});
const Route$a = createFileRoute("/api/habits")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const token = extractTokenFromRequest(request);
        if (!token) return Response.json({ error: "Não autorizado." }, { status: 401 });
        const payload = await verifyToken(token);
        if (!payload) return Response.json({ error: "Sessão expirada." }, { status: 401 });
        const data = await getHabits(payload.userId);
        return Response.json(data);
      },
      POST: async ({ request }) => {
        const token = extractTokenFromRequest(request);
        if (!token) return Response.json({ error: "Não autorizado." }, { status: 401 });
        const payload = await verifyToken(token);
        if (!payload) return Response.json({ error: "Sessão expirada." }, { status: 401 });
        const body = await request.json();
        if (body.action === "toggle_log") {
          const { habitId, date, completed } = body;
          if (!habitId || !date) {
            return Response.json({ error: "habitId e date são obrigatórios." }, { status: 400 });
          }
          const log = await toggleHabitLog(payload.userId, Number(habitId), date, Boolean(completed));
          return Response.json({ log });
        }
        if (!body.name) {
          return Response.json({ error: "Nome do hábito é obrigatório." }, { status: 400 });
        }
        const habit = await createHabit(payload.userId, body);
        return Response.json({ habit }, { status: 201 });
      }
    }
  }
});
const Route$9 = createFileRoute("/api/focus")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const token = extractTokenFromRequest(request);
        if (!token) return Response.json({ error: "Não autorizado." }, { status: 401 });
        const payload = await verifyToken(token);
        if (!payload) return Response.json({ error: "Sessão expirada." }, { status: 401 });
        const sessions = await getFocusSessions(payload.userId);
        return Response.json({ sessions });
      },
      POST: async ({ request }) => {
        const token = extractTokenFromRequest(request);
        if (!token) return Response.json({ error: "Não autorizado." }, { status: 401 });
        const payload = await verifyToken(token);
        if (!payload) return Response.json({ error: "Sessão expirada." }, { status: 401 });
        const body = await request.json();
        const session = await createFocusSession(payload.userId, body);
        return Response.json({ session }, { status: 201 });
      }
    }
  }
});
const Route$8 = createFileRoute("/api/finance")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const token = extractTokenFromRequest(request);
        if (!token) return Response.json({ error: "Não autorizado." }, { status: 401 });
        const payload = await verifyToken(token);
        if (!payload) return Response.json({ error: "Sessão expirada." }, { status: 401 });
        const url = new URL(request.url);
        const monthYear = url.searchParams.get("monthYear") || void 0;
        const category = url.searchParams.get("category") || void 0;
        const type = url.searchParams.get("type") || void 0;
        const search = url.searchParams.get("search") || void 0;
        const format = url.searchParams.get("format");
        const transactions = await getFinanceTransactions(payload.userId, {
          monthYear,
          category,
          type,
          search
        });
        if (format === "csv") {
          const csv = convertTransactionsToCSV(transactions);
          return new Response(csv, {
            headers: {
              "Content-Type": "text/csv; charset=utf-8",
              "Content-Disposition": `attachment; filename="ritmo-financas-${monthYear || "export"}.csv"`
            }
          });
        }
        const currentMonth = monthYear || (/* @__PURE__ */ new Date()).toISOString().substring(0, 7);
        const monthTxs = transactions.filter((t) => t.date.startsWith(currentMonth));
        const totalIncomeCents = monthTxs.filter((t) => t.type === "income").reduce((acc, t) => acc + t.amountCents, 0);
        const totalExpenseCents = monthTxs.filter((t) => t.type === "expense").reduce((acc, t) => acc + t.amountCents, 0);
        const netBalanceCents = totalIncomeCents - totalExpenseCents;
        const categoryBreakdown = {};
        for (const tx of monthTxs) {
          if (tx.type === "expense") {
            categoryBreakdown[tx.category] = (categoryBreakdown[tx.category] || 0) + tx.amountCents;
          }
        }
        return Response.json({
          transactions,
          summary: {
            currentMonth,
            totalIncomeCents,
            totalExpenseCents,
            netBalanceCents,
            categoryBreakdown
          }
        });
      },
      POST: async ({ request }) => {
        const token = extractTokenFromRequest(request);
        if (!token) return Response.json({ error: "Não autorizado." }, { status: 401 });
        const payload = await verifyToken(token);
        if (!payload) return Response.json({ error: "Sessão expirada." }, { status: 401 });
        const body = await request.json();
        if (!body.description || body.amountCents === void 0) {
          return Response.json({ error: "Descrição e valor são obrigatórios." }, { status: 400 });
        }
        const tx = await createFinanceTransaction(payload.userId, body);
        const integrations = await getIntegrationsConfig(payload.userId);
        let syncStatus = null;
        if (integrations?.sheetsAutoSync && integrations?.sheetsSpreadsheetId) {
          syncStatus = await syncTransactionToGoogleSheet(integrations.sheetsSpreadsheetId, tx);
        }
        return Response.json({ transaction: tx, syncStatus }, { status: 201 });
      },
      DELETE: async ({ request }) => {
        const token = extractTokenFromRequest(request);
        if (!token) return Response.json({ error: "Não autorizado." }, { status: 401 });
        const payload = await verifyToken(token);
        if (!payload) return Response.json({ error: "Sessão expirada." }, { status: 401 });
        const url = new URL(request.url);
        const id = url.searchParams.get("id");
        if (!id) return Response.json({ error: "ID do lançamento é obrigatório." }, { status: 400 });
        await deleteFinanceTransaction(Number(id), payload.userId);
        return Response.json({ success: true });
      }
    }
  }
});
const Route$7 = createFileRoute("/api/cycles")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const token = extractTokenFromRequest(request);
        if (!token) return Response.json({ error: "Não autorizado." }, { status: 401 });
        const payload = await verifyToken(token);
        if (!payload) return Response.json({ error: "Sessão expirada." }, { status: 401 });
        const active = await getActiveFocusCycle(payload.userId);
        const all = await getAllFocusCycles(payload.userId);
        return Response.json({ active, cycles: all });
      },
      POST: async ({ request }) => {
        const token = extractTokenFromRequest(request);
        if (!token) return Response.json({ error: "Não autorizado." }, { status: 401 });
        const payload = await verifyToken(token);
        if (!payload) return Response.json({ error: "Sessão expirada." }, { status: 401 });
        const body = await request.json();
        const { title, mainGoal, secondaryGoals, durationDays, startDate, routineLevel, preferredTimes, digitalLimits, notes } = body;
        if (!mainGoal || !durationDays || !startDate) {
          return Response.json({ error: "Meta principal, duração e data de início são obrigatórios." }, { status: 400 });
        }
        const start = new Date(startDate);
        const end = new Date(start);
        end.setDate(end.getDate() + Number(durationDays));
        const endDate = end.toISOString().split("T")[0];
        const newCycle = await createFocusCycle(payload.userId, {
          title: title || `Ciclo de ${durationDays} Dias — Foco Total`,
          mainGoal,
          secondaryGoals: Array.isArray(secondaryGoals) ? secondaryGoals : [],
          durationDays: Number(durationDays),
          startDate,
          endDate,
          routineLevel: routineLevel || "equilibrado",
          preferredTimes: preferredTimes || "",
          digitalLimits: digitalLimits || "",
          status: "active",
          notes: notes || ""
        });
        return Response.json({ cycle: newCycle }, { status: 201 });
      }
    }
  }
});
const Route$6 = createFileRoute("/api/checkout")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const action = url.searchParams.get("action");
        if (action === "validate_coupon") {
          const code = url.searchParams.get("code") || "";
          const res = await validateCoupon(code);
          return Response.json(res);
        }
        const token = extractTokenFromRequest(request);
        if (!token) {
          return Response.json({
            subscriptionStatus: "guest",
            trialDaysRemaining: 7,
            isTrialActive: true,
            isExpired: false,
            plan: "Ritmo PRO Mensal (R$ 39,90/mês)",
            amountCents: 3990,
            invoices: [],
            mercadoPagoEnabled: isMercadoPagoConfigured()
          });
        }
        const payload = await verifyToken(token);
        if (!payload) return Response.json({ error: "Sessão inválida" }, { status: 401 });
        const subInfo = await getUserSubscriptionAndInvoices(payload.userId);
        if (!subInfo) return Response.json({ error: "Usuário não encontrado" }, { status: 404 });
        return Response.json({ ...subInfo, mercadoPagoEnabled: isMercadoPagoConfigured() });
      },
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { action } = body;
          const token = extractTokenFromRequest(request);
          if (!token) return Response.json({ error: "Faça login para continuar." }, { status: 401 });
          const payload = await verifyToken(token);
          if (!payload) return Response.json({ error: "Sessão expirada. Faça login novamente." }, { status: 401 });
          const userId = payload.userId;
          if (action === "create_order") {
            const { paymentMethod, couponCode } = body;
            const payment = await createCheckoutPayment(userId, paymentMethod || "pix", couponCode || void 0);
            return Response.json({ success: true, order: payment });
          }
          if (action === "confirm_payment") {
            const { orderReference } = body;
            if (!orderReference) {
              return Response.json({ error: "Referência do pedido é obrigatória." }, { status: 400 });
            }
            const subInfo = await getUserSubscriptionAndInvoices(userId);
            const order = subInfo?.invoices.find((inv) => inv.orderReference === orderReference);
            if (!order || order.userId !== userId) {
              return Response.json({ error: "Pedido não encontrado para este usuário." }, { status: 404 });
            }
            if (!order.isSimulated) {
              return Response.json(
                { error: 'Este pedido usa pagamento real — use "Verificar pagamento" ou aguarde a confirmação automática.' },
                { status: 400 }
              );
            }
            const result = await confirmCheckoutPayment(orderReference);
            return Response.json(result);
          }
          if (action === "check_payment_status") {
            const { orderReference } = body;
            if (!orderReference) {
              return Response.json({ error: "Referência do pedido é obrigatória." }, { status: 400 });
            }
            const subInfo = await getUserSubscriptionAndInvoices(userId);
            const order = subInfo?.invoices.find((inv) => inv.orderReference === orderReference);
            if (!order || order.userId !== userId) {
              return Response.json({ error: "Pedido não encontrado para este usuário." }, { status: 404 });
            }
            const result = await checkRealPaymentStatus(orderReference);
            return Response.json(result);
          }
          if (action === "cancel_subscription") {
            const result = await cancelUserSubscription(userId);
            return Response.json(result, { status: result.success ? 200 : 400 });
          }
          return Response.json({ error: "Ação não suportada." }, { status: 400 });
        } catch (e) {
          return Response.json({ error: e.message || "Erro no servidor." }, { status: 500 });
        }
      }
    }
  }
});
async function requireUser(request) {
  const token = extractTokenFromRequest(request);
  if (!token) return { error: Response.json({ error: "Não autorizado." }, { status: 401 }) };
  const payload = await verifyToken(token);
  if (!payload) return { error: Response.json({ error: "Sessão expirada." }, { status: 401 }) };
  return { userId: payload.userId, userName: payload.name };
}
const Route$5 = createFileRoute("/api/boards")({
  server: {
    handlers: {
      // GET /api/boards            -> lista de quadros do usuário
      // GET /api/boards?boardId=X  -> quadro completo (listas, cartões, checklist, comentários)
      GET: async ({ request }) => {
        const auth = await requireUser(request);
        if ("error" in auth) return auth.error;
        const url = new URL(request.url);
        const boardIdParam = url.searchParams.get("boardId");
        if (boardIdParam) {
          const boardId = Number(boardIdParam);
          const board = await getBoardById(boardId, auth.userId);
          if (!board) return Response.json({ error: "Quadro não encontrado." }, { status: 404 });
          const full = await getBoardFullData(boardId, auth.userId);
          return Response.json({ board, ...full });
        }
        const boards2 = await getBoards(auth.userId);
        return Response.json({ boards: boards2 });
      },
      POST: async ({ request }) => {
        const auth = await requireUser(request);
        if ("error" in auth) return auth.error;
        const { userId, userName } = auth;
        try {
          const body = await request.json();
          const { action } = body;
          if (action === "create_board") {
            if (!body.title?.trim()) return Response.json({ error: "Título do quadro é obrigatório." }, { status: 400 });
            const board = await createBoard(userId, { title: body.title.trim(), description: body.description, color: body.color });
            return Response.json({ success: true, board }, { status: 201 });
          }
          if (action === "rename_board") {
            if (!body.boardId) return Response.json({ error: "ID do quadro é obrigatório." }, { status: 400 });
            const board = await updateBoard(Number(body.boardId), userId, {
              title: body.title,
              description: body.description,
              color: body.color
            });
            if (!board) return Response.json({ error: "Quadro não encontrado." }, { status: 404 });
            return Response.json({ success: true, board });
          }
          if (action === "archive_board") {
            if (!body.boardId) return Response.json({ error: "ID do quadro é obrigatório." }, { status: 400 });
            const board = await updateBoard(Number(body.boardId), userId, { archived: body.archived !== false });
            if (!board) return Response.json({ error: "Quadro não encontrado." }, { status: 404 });
            return Response.json({ success: true, board });
          }
          if (action === "duplicate_board") {
            if (!body.boardId) return Response.json({ error: "ID do quadro é obrigatório." }, { status: 400 });
            const board = await duplicateBoard(Number(body.boardId), userId);
            if (!board) return Response.json({ error: "Quadro não encontrado." }, { status: 404 });
            return Response.json({ success: true, board }, { status: 201 });
          }
          if (action === "delete_board") {
            if (!body.boardId) return Response.json({ error: "ID do quadro é obrigatório." }, { status: 400 });
            await deleteBoard(Number(body.boardId), userId);
            return Response.json({ success: true });
          }
          if (action === "create_list") {
            if (!body.boardId || !body.title?.trim()) {
              return Response.json({ error: "Quadro e título da lista são obrigatórios." }, { status: 400 });
            }
            const board = await getBoardById(Number(body.boardId), userId);
            if (!board) return Response.json({ error: "Quadro não encontrado." }, { status: 404 });
            const list = await createList(Number(body.boardId), userId, body.title.trim());
            return Response.json({ success: true, list }, { status: 201 });
          }
          if (action === "rename_list") {
            if (!body.listId) return Response.json({ error: "ID da lista é obrigatório." }, { status: 400 });
            const list = await updateList(Number(body.listId), userId, { title: body.title });
            if (!list) return Response.json({ error: "Lista não encontrada." }, { status: 404 });
            return Response.json({ success: true, list });
          }
          if (action === "reorder_lists") {
            if (!body.boardId || !Array.isArray(body.orderedListIds)) {
              return Response.json({ error: "Quadro e ordem das listas são obrigatórios." }, { status: 400 });
            }
            const ownedLists = await getBoardLists(Number(body.boardId), userId);
            const ownedIds = new Set(ownedLists.map((l) => l.id));
            const ids = body.orderedListIds.map(Number).filter((id) => ownedIds.has(id));
            await reorderLists(Number(body.boardId), userId, ids);
            return Response.json({ success: true });
          }
          if (action === "archive_list") {
            if (!body.listId) return Response.json({ error: "ID da lista é obrigatório." }, { status: 400 });
            const list = await updateList(Number(body.listId), userId, { archived: body.archived !== false });
            if (!list) return Response.json({ error: "Lista não encontrada." }, { status: 404 });
            return Response.json({ success: true, list });
          }
          if (action === "delete_list") {
            if (!body.listId) return Response.json({ error: "ID da lista é obrigatório." }, { status: 400 });
            await deleteList(Number(body.listId), userId);
            return Response.json({ success: true });
          }
          if (action === "create_card") {
            if (!body.listId || !body.title?.trim()) {
              return Response.json({ error: "Lista e título do cartão são obrigatórios." }, { status: 400 });
            }
            try {
              const card = await createCard(Number(body.listId), userId, {
                title: body.title.trim(),
                description: body.description,
                priority: body.priority,
                labels: Array.isArray(body.labels) ? body.labels : [],
                assignee: body.assignee,
                dueDate: body.dueDate
              });
              return Response.json({ success: true, card }, { status: 201 });
            } catch (e) {
              return Response.json({ error: e.message || "Não foi possível criar o cartão." }, { status: 400 });
            }
          }
          if (action === "update_card") {
            if (!body.cardId) return Response.json({ error: "ID do cartão é obrigatório." }, { status: 400 });
            const card = await updateCard(Number(body.cardId), userId, {
              title: body.title,
              description: body.description,
              priority: body.priority,
              labels: Array.isArray(body.labels) ? body.labels : void 0,
              assignee: body.assignee,
              dueDate: body.dueDate
            });
            if (!card) return Response.json({ error: "Cartão não encontrado." }, { status: 404 });
            return Response.json({ success: true, card });
          }
          if (action === "move_card") {
            if (!body.cardId || !body.targetListId || body.targetPosition === void 0) {
              return Response.json({ error: "Cartão, lista de destino e posição são obrigatórios." }, { status: 400 });
            }
            const ok = await moveCard(Number(body.cardId), userId, Number(body.targetListId), Number(body.targetPosition));
            if (!ok) return Response.json({ error: "Não foi possível mover o cartão (verifique se pertence à sua conta)." }, { status: 404 });
            return Response.json({ success: true });
          }
          if (action === "archive_card") {
            if (!body.cardId) return Response.json({ error: "ID do cartão é obrigatório." }, { status: 400 });
            const card = await updateCard(Number(body.cardId), userId, { archived: body.archived !== false });
            if (!card) return Response.json({ error: "Cartão não encontrado." }, { status: 404 });
            return Response.json({ success: true, card });
          }
          if (action === "delete_card") {
            if (!body.cardId) return Response.json({ error: "ID do cartão é obrigatório." }, { status: 400 });
            await deleteCard(Number(body.cardId), userId);
            return Response.json({ success: true });
          }
          if (action === "add_checklist_item") {
            if (!body.cardId || !body.text?.trim()) {
              return Response.json({ error: "Cartão e texto do item são obrigatórios." }, { status: 400 });
            }
            try {
              const item = await addChecklistItem(Number(body.cardId), userId, body.text.trim());
              return Response.json({ success: true, item }, { status: 201 });
            } catch (e) {
              return Response.json({ error: e.message || "Não foi possível adicionar o item." }, { status: 400 });
            }
          }
          if (action === "toggle_checklist_item") {
            if (!body.itemId) return Response.json({ error: "ID do item é obrigatório." }, { status: 400 });
            const ok = await toggleChecklistItem(Number(body.itemId), userId, Boolean(body.done));
            if (!ok) return Response.json({ error: "Item não encontrado." }, { status: 404 });
            return Response.json({ success: true });
          }
          if (action === "delete_checklist_item") {
            if (!body.itemId) return Response.json({ error: "ID do item é obrigatório." }, { status: 400 });
            await deleteChecklistItem(Number(body.itemId), userId);
            return Response.json({ success: true });
          }
          if (action === "add_comment") {
            if (!body.cardId || !body.text?.trim()) {
              return Response.json({ error: "Cartão e texto do comentário são obrigatórios." }, { status: 400 });
            }
            try {
              const user = await findUserById(userId);
              const comment = await addComment(Number(body.cardId), userId, user?.name || userName, body.text.trim());
              return Response.json({ success: true, comment }, { status: 201 });
            } catch (e) {
              return Response.json({ error: e.message || "Não foi possível adicionar o comentário." }, { status: 400 });
            }
          }
          if (action === "delete_comment") {
            if (!body.commentId) return Response.json({ error: "ID do comentário é obrigatório." }, { status: 400 });
            await deleteComment(Number(body.commentId), userId);
            return Response.json({ success: true });
          }
          return Response.json({ error: "Ação não reconhecida." }, { status: 400 });
        } catch (e) {
          return Response.json({ error: e.message || "Erro no servidor." }, { status: 500 });
        }
      }
    }
  }
});
async function promoteIfAdminEmail(user) {
  const list = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
  if (user.role !== "admin" && list.includes(user.email.toLowerCase())) {
    await updateUserRecord(user.id, { role: "admin" });
    return { ...user, role: "admin" };
  }
  return user;
}
function sessionCookie(request, token) {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `ritmo_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000${secure}`;
}
const Route$4 = createFileRoute("/api/auth")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const token = extractTokenFromRequest(request);
        if (!token) {
          return Response.json({ user: null }, { status: 401 });
        }
        const payload = await verifyToken(token);
        if (!payload) {
          return Response.json({ user: null }, { status: 401 });
        }
        const user = await findUserById(payload.userId);
        if (!user) {
          return Response.json({ user: null }, { status: 404 });
        }
        const { passwordHash, ...safeUser } = user;
        return Response.json({ user: { ...safeUser, access: computeAccess(user) } });
      },
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { action } = body;
          if (action === "register") {
            const { name, email, password, referralCode, acceptedTerms } = body;
            if (!acceptedTerms) {
              return Response.json({ error: "É necessário aceitar os Termos de Uso e a Política de Privacidade." }, { status: 400 });
            }
            if (!email || !password || !name) {
              return Response.json({ error: "Nome, e-mail e senha são obrigatórios." }, { status: 400 });
            }
            if (password.length < 6) {
              return Response.json({ error: "A senha deve ter no mínimo 6 caracteres." }, { status: 400 });
            }
            const existing = await findUserByEmail(email);
            if (existing) {
              return Response.json({ error: "Já existe uma conta com este e-mail." }, { status: 409 });
            }
            const pHash = await hashPassword(password);
            const myRefCode = "RITMO-" + Math.random().toString(36).substring(2, 8).toUpperCase();
            const createdUser = await createUserRecord({
              name,
              email,
              passwordHash: pHash,
              referralCode: myRefCode,
              referredBy: referralCode || null
            });
            const newUser = await promoteIfAdminEmail(createdUser);
            if (referralCode) {
              await recordAffiliateClick(referralCode);
            }
            const token = await createToken({
              userId: newUser.id,
              email: newUser.email,
              name: newUser.name,
              role: newUser.role
            });
            const { passwordHash: _, ...safeUser } = newUser;
            return Response.json(
              { user: safeUser, token },
              {
                status: 201,
                headers: {
                  "Set-Cookie": sessionCookie(request, token)
                }
              }
            );
          }
          if (action === "login") {
            const { email, password } = body;
            if (!email || !password) {
              return Response.json({ error: "E-mail e senha são obrigatórios." }, { status: 400 });
            }
            const foundUser = await findUserByEmail(email);
            if (!foundUser) {
              return Response.json({ error: "Credenciais inválidas. Verifique o e-mail ou crie uma conta." }, { status: 401 });
            }
            const valid = await verifyPassword(password, foundUser.passwordHash);
            if (!valid) {
              return Response.json({ error: "Credenciais inválidas. Senha incorreta." }, { status: 401 });
            }
            const user = await promoteIfAdminEmail(foundUser);
            const token = await createToken({
              userId: user.id,
              email: user.email,
              name: user.name,
              role: user.role
            });
            const { passwordHash: _, ...safeUser } = user;
            return Response.json(
              { user: safeUser, token },
              {
                status: 200,
                headers: {
                  "Set-Cookie": sessionCookie(request, token)
                }
              }
            );
          }
          if (action === "logout") {
            return Response.json(
              { success: true },
              {
                status: 200,
                headers: {
                  "Set-Cookie": `ritmo_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
                }
              }
            );
          }
          if (action === "forgot_password") {
            const { email } = body;
            if (!email) {
              return Response.json({ error: "Informe seu e-mail cadastrado." }, { status: 400 });
            }
            const res = await createPasswordResetRequest(email);
            if (!res.success) {
              return Response.json({ error: res.error }, { status: 404 });
            }
            const emailResult = await sendPasswordResetEmail(res.email, res.userName || "", res.code);
            if (emailResult.sent) {
              return Response.json({
                success: true,
                message: "Código de recuperação enviado para o seu e-mail.",
                token: res.token
              });
            }
            console.warn("[auth] Envio de e-mail de recuperação não configurado:", emailResult.error);
            return Response.json({
              success: true,
              message: "Código de recuperação gerado (envio de e-mail não configurado — modo de demonstração).",
              demoMode: true,
              code: res.code,
              token: res.token
            });
          }
          if (action === "reset_password") {
            const { code, newPassword } = body;
            if (!code || !newPassword) {
              return Response.json({ error: "Código de recuperação e nova senha são obrigatórios." }, { status: 400 });
            }
            if (newPassword.length < 6) {
              return Response.json({ error: "A nova senha deve ter no mínimo 6 caracteres." }, { status: 400 });
            }
            const pHash = await hashPassword(newPassword);
            const res = await resetPasswordWithToken(code, pHash);
            if (!res.success) {
              return Response.json({ error: res.error }, { status: 400 });
            }
            return Response.json({ success: true, message: "Senha atualizada com sucesso! Você já pode fazer login." });
          }
          if (action === "update_pix") {
            const token = extractTokenFromRequest(request);
            if (!token) return Response.json({ error: "Não autorizado." }, { status: 401 });
            const payload = await verifyToken(token);
            if (!payload) return Response.json({ error: "Sessão expirada." }, { status: 401 });
            const { pixKey, pixKeyType } = body;
            if (!pixKey) {
              return Response.json({ error: "Informe uma chave PIX válida." }, { status: 400 });
            }
            const updated = await updateUserPixKey(payload.userId, pixKey, pixKeyType || "cpf");
            return Response.json({ success: true, user: updated });
          }
          return Response.json({ error: "Ação não reconhecida." }, { status: 400 });
        } catch (e) {
          return Response.json({ error: e.message || "Erro no servidor." }, { status: 500 });
        }
      },
      PUT: async ({ request }) => {
        const token = extractTokenFromRequest(request);
        if (!token) return Response.json({ error: "Não autorizado." }, { status: 401 });
        const payload = await verifyToken(token);
        if (!payload) return Response.json({ error: "Sessão expirada." }, { status: 401 });
        const body = await request.json();
        const updated = await updateUserRecord(payload.userId, {
          name: body.name,
          timezone: body.timezone,
          themePreference: body.themePreference,
          whatsappPhone: body.whatsappPhone,
          pixKey: body.pixKey,
          pixKeyType: body.pixKeyType
        });
        if (!updated) return Response.json({ error: "Usuário não encontrado." }, { status: 404 });
        const { passwordHash: _, ...safeUser } = updated;
        return Response.json({ user: safeUser });
      },
      DELETE: async ({ request }) => {
        const token = extractTokenFromRequest(request);
        if (!token) return Response.json({ error: "Não autorizado." }, { status: 401 });
        const payload = await verifyToken(token);
        if (!payload) return Response.json({ error: "Sessão expirada." }, { status: 401 });
        await deleteUserData(payload.userId);
        return Response.json(
          { success: true, message: "Dados e conta removidos com sucesso." },
          {
            headers: {
              "Set-Cookie": `ritmo_token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
            }
          }
        );
      }
    }
  }
});
function calculateAffiliateCommission(params) {
  const ratePercent = params.commissionRatePercent ?? 60;
  if (params.affiliateUserId === params.referredUserId || params.isSelfReferral) {
    return {
      eligible: false,
      commissionCents: 0,
      ratePercent,
      reason: "Comissão rejeitada: Não é permitida comissão pela própria assinatura (autoindicação)."
    };
  }
  if (params.netAmountCents <= 0) {
    return {
      eligible: false,
      commissionCents: 0,
      ratePercent,
      reason: "Comissão não aplicável para transações gratuitas ou com valor líquido nulo."
    };
  }
  const commissionCents = Math.round(params.netAmountCents * ratePercent / 100);
  return {
    eligible: true,
    commissionCents,
    ratePercent,
    reason: `Comissão calculada: ${ratePercent}% sobre R$ ${(params.netAmountCents / 100).toFixed(2)}.`
  };
}
const Route$3 = createFileRoute("/api/affiliates")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const token = extractTokenFromRequest(request);
        if (!token) return Response.json({ error: "Não autorizado." }, { status: 401 });
        const payload = await verifyToken(token);
        if (!payload) return Response.json({ error: "Sessão expirada." }, { status: 401 });
        const user = await findUserById(payload.userId);
        if (!user) return Response.json({ error: "Usuário não encontrado." }, { status: 404 });
        const data = await getAffiliateData(user.id, user.referralCode);
        return Response.json({
          ...data,
          pixKey: user.pixKey || "",
          pixKeyType: user.pixKeyType || "cpf"
        });
      },
      POST: async ({ request }) => {
        try {
          const body = await request.json();
          const { action } = body;
          if (action === "request_withdrawal") {
            const token = extractTokenFromRequest(request);
            if (!token) return Response.json({ error: "Não autorizado." }, { status: 401 });
            const payload = await verifyToken(token);
            if (!payload) return Response.json({ error: "Sessão expirada." }, { status: 401 });
            const { amountCents, pixKey, pixKeyType } = body;
            if (!amountCents || !pixKey) {
              return Response.json({ error: "Valor e Chave PIX são obrigatórios." }, { status: 400 });
            }
            const res = await requestAffiliateWithdrawal(
              payload.userId,
              Number(amountCents),
              pixKey,
              pixKeyType || "cpf"
            );
            if (!res.success) {
              return Response.json({ error: res.error }, { status: 400 });
            }
            return Response.json({
              success: true,
              message: "Solicitação de saque PIX enviada com sucesso! O pagamento será processado em até 24h úteis.",
              withdrawal: res.withdrawal
            });
          }
          if (action === "update_pix") {
            const token = extractTokenFromRequest(request);
            if (!token) return Response.json({ error: "Não autorizado." }, { status: 401 });
            const payload = await verifyToken(token);
            if (!payload) return Response.json({ error: "Sessão expirada." }, { status: 401 });
            const { pixKey, pixKeyType } = body;
            if (!pixKey) {
              return Response.json({ error: "Informe sua chave PIX." }, { status: 400 });
            }
            const user = await updateUserPixKey(payload.userId, pixKey, pixKeyType || "cpf");
            return Response.json({ success: true, message: "Chave PIX atualizada com sucesso!", user });
          }
          if (action === "process_billing_webhook") {
            const { eventId, eventType, orderReference, customerUserId, grossAmountCents, netAmountCents, affiliateUserId } = body;
            if (!orderReference || !customerUserId || !affiliateUserId) {
              return Response.json({ error: "Dados incompletos do evento de cobrança." }, { status: 400 });
            }
            const calc = calculateAffiliateCommission({
              affiliateUserId: Number(affiliateUserId),
              referredUserId: Number(customerUserId),
              netAmountCents: Number(netAmountCents || grossAmountCents || 0),
              commissionRatePercent: 60
            });
            return Response.json({
              success: true,
              result: {
                eventId,
                eventType,
                orderReference,
                ...calc
              }
            });
          }
          return Response.json({ error: "Ação não suportada." }, { status: 400 });
        } catch (e) {
          return Response.json({ error: e.message || "Erro ao processar." }, { status: 500 });
        }
      }
    }
  }
});
const Route$2 = createFileRoute("/api/admin")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const token = extractTokenFromRequest(request);
        if (!token) {
          return Response.json({ error: "Acesso restrito. Faça login como administrador." }, { status: 401 });
        }
        const payload = await verifyToken(token);
        if (!payload) {
          return Response.json({ error: "Sessão expirada." }, { status: 401 });
        }
        const user = await findUserById(payload.userId);
        if (!user || user.role !== "admin") {
          return Response.json(
            { error: "Acesso negado. Esta área é restrita a administradores do Ritmo." },
            { status: 403 }
          );
        }
        const data = await getAdminDashboardData();
        return Response.json({
          success: true,
          adminUser: { id: user.id, name: user.name, email: user.email, role: user.role },
          ...data
        });
      },
      POST: async ({ request }) => {
        try {
          const token = extractTokenFromRequest(request);
          if (!token) {
            return Response.json({ error: "Acesso restrito." }, { status: 401 });
          }
          const payload = await verifyToken(token);
          if (!payload) {
            return Response.json({ error: "Sessão expirada." }, { status: 401 });
          }
          const user = await findUserById(payload.userId);
          if (!user || user.role !== "admin") {
            return Response.json({ error: "Acesso negado. Restrito a administradores." }, { status: 403 });
          }
          const body = await request.json();
          const { action } = body;
          if (action === "update_user") {
            const { targetUserId, name, email, role, subscriptionStatus, extendTrialDays, manualPassword } = body;
            if (!targetUserId) {
              return Response.json({ error: "ID do usuário alvo é obrigatório." }, { status: 400 });
            }
            let newPasswordHash = void 0;
            if (manualPassword && manualPassword.length >= 6) {
              newPasswordHash = await hashPassword(manualPassword);
            }
            const updated = await adminUpdateUser(Number(targetUserId), {
              name,
              email,
              role,
              subscriptionStatus,
              extendTrialDays: extendTrialDays ? Number(extendTrialDays) : void 0,
              newPasswordHash
            });
            return Response.json({
              success: true,
              message: "Dados do usuário atualizados com sucesso pelo administrador.",
              user: updated
            });
          }
          if (action === "create_coupon") {
            const { code, discountPercent, discountCents, maxUses, expiresAt } = body;
            if (!code) {
              return Response.json({ error: "Código do cupom é obrigatório." }, { status: 400 });
            }
            const coupon = await adminCreateCoupon({
              code,
              discountPercent: discountPercent ? Number(discountPercent) : 0,
              discountCents: discountCents ? Number(discountCents) : 0,
              maxUses: maxUses ? Number(maxUses) : 100,
              expiresAt
            });
            return Response.json({ success: true, message: "Cupom criado com sucesso!", coupon });
          }
          if (action === "toggle_coupon") {
            const { couponId, active } = body;
            await adminToggleCoupon(Number(couponId), Boolean(active));
            return Response.json({ success: true, message: "Status do cupom atualizado." });
          }
          if (action === "delete_coupon") {
            const { couponId } = body;
            await adminDeleteCoupon(Number(couponId));
            return Response.json({ success: true, message: "Cupom excluído com sucesso." });
          }
          if (action === "process_withdrawal") {
            const { withdrawalId, status, notes, receiptReference } = body;
            if (!withdrawalId || !status) {
              return Response.json({ error: "ID da solicitação e status são obrigatórios." }, { status: 400 });
            }
            await adminProcessWithdrawal(
              Number(withdrawalId),
              status,
              notes,
              receiptReference
            );
            return Response.json({
              success: true,
              message: `Saque ${status === "paid" ? "pago com sucesso" : status === "approved" ? "aprovado" : "rejeitado"}.`
            });
          }
          return Response.json({ error: "Ação administrativa não reconhecida." }, { status: 400 });
        } catch (e) {
          return Response.json({ error: e.message || "Erro no servidor." }, { status: 500 });
        }
      }
    }
  }
});
const Route$1 = createFileRoute("/api/webhooks/mercadopago")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!isMercadoPagoConfigured()) {
          return Response.json({ error: "Mercado Pago não configurado neste ambiente." }, { status: 501 });
        }
        const url = new URL(request.url);
        const dataId = url.searchParams.get("data.id") || url.searchParams.get("id");
        const type = url.searchParams.get("type") || url.searchParams.get("topic");
        if (type && type !== "payment") {
          return Response.json({ received: true });
        }
        if (!dataId) {
          return Response.json({ received: true, note: "sem data.id" });
        }
        const signature = request.headers.get("x-signature");
        const requestId = request.headers.get("x-request-id");
        const signatureValid = isValidMercadoPagoSignature(signature, requestId, dataId);
        if (!signatureValid) {
          console.warn("[mercadopago webhook] Assinatura ausente/inválida — prosseguindo com reconfirmação direta na API.");
        }
        const mpPayment = await fetchMercadoPagoPayment(dataId);
        if (!mpPayment.success || !mpPayment.externalReference) {
          return Response.json({ received: true, note: "pagamento não encontrado ou sem external_reference" });
        }
        if (mpPayment.status === "approved") {
          await checkRealPaymentStatus(mpPayment.externalReference);
        }
        return Response.json({ received: true });
      },
      // Mercado Pago às vezes testa o endpoint com GET na configuração inicial do webhook.
      GET: async () => Response.json({ ok: true })
    }
  }
});
const Route = createFileRoute("/api/cron/lembretes")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.CRON_SECRET;
        const auth = request.headers.get("authorization") || "";
        if (!secret || auth !== `Bearer ${secret}`) {
          return Response.json({ error: "Não autorizado." }, { status: 401 });
        }
        const targets = await getUsersNeedingReminder();
        let sent = 0;
        let failed = 0;
        for (const t of targets) {
          const r = await sendRenewalReminderEmail(t.email, t.name, t.kind, t.daysLeft);
          if (r.sent) sent++;
          else failed++;
        }
        return Response.json({ checked: targets.length, sent, failed });
      }
    }
  }
});
const TutorialRoute = Route$l.update({
  id: "/tutorial",
  path: "/tutorial",
  getParentRoute: () => Route$m
});
const TermosRoute = Route$k.update({
  id: "/termos",
  path: "/termos",
  getParentRoute: () => Route$m
});
const PrivacidadeRoute = Route$j.update({
  id: "/privacidade",
  path: "/privacidade",
  getParentRoute: () => Route$m
});
const LoginRoute = Route$i.update({
  id: "/login",
  path: "/login",
  getParentRoute: () => Route$m
});
const CheckoutRoute = Route$h.update({
  id: "/checkout",
  path: "/checkout",
  getParentRoute: () => Route$m
});
const AppRoute = Route$g.update({
  id: "/app",
  path: "/app",
  getParentRoute: () => Route$m
});
const AdminRoute = Route$f.update({
  id: "/admin",
  path: "/admin",
  getParentRoute: () => Route$m
});
const IndexRoute = Route$e.update({
  id: "/",
  path: "/",
  getParentRoute: () => Route$m
});
const ApiTasksRoute = Route$d.update({
  id: "/api/tasks",
  path: "/api/tasks",
  getParentRoute: () => Route$m
});
const ApiJournalRoute = Route$c.update({
  id: "/api/journal",
  path: "/api/journal",
  getParentRoute: () => Route$m
});
const ApiIntegrationsRoute = Route$b.update({
  id: "/api/integrations",
  path: "/api/integrations",
  getParentRoute: () => Route$m
});
const ApiHabitsRoute = Route$a.update({
  id: "/api/habits",
  path: "/api/habits",
  getParentRoute: () => Route$m
});
const ApiFocusRoute = Route$9.update({
  id: "/api/focus",
  path: "/api/focus",
  getParentRoute: () => Route$m
});
const ApiFinanceRoute = Route$8.update({
  id: "/api/finance",
  path: "/api/finance",
  getParentRoute: () => Route$m
});
const ApiCyclesRoute = Route$7.update({
  id: "/api/cycles",
  path: "/api/cycles",
  getParentRoute: () => Route$m
});
const ApiCheckoutRoute = Route$6.update({
  id: "/api/checkout",
  path: "/api/checkout",
  getParentRoute: () => Route$m
});
const ApiBoardsRoute = Route$5.update({
  id: "/api/boards",
  path: "/api/boards",
  getParentRoute: () => Route$m
});
const ApiAuthRoute = Route$4.update({
  id: "/api/auth",
  path: "/api/auth",
  getParentRoute: () => Route$m
});
const ApiAffiliatesRoute = Route$3.update({
  id: "/api/affiliates",
  path: "/api/affiliates",
  getParentRoute: () => Route$m
});
const ApiAdminRoute = Route$2.update({
  id: "/api/admin",
  path: "/api/admin",
  getParentRoute: () => Route$m
});
const ApiWebhooksMercadopagoRoute = Route$1.update({
  id: "/api/webhooks/mercadopago",
  path: "/api/webhooks/mercadopago",
  getParentRoute: () => Route$m
});
const ApiCronLembretesRoute = Route.update({
  id: "/api/cron/lembretes",
  path: "/api/cron/lembretes",
  getParentRoute: () => Route$m
});
const rootRouteChildren = {
  IndexRoute,
  AdminRoute,
  AppRoute,
  CheckoutRoute,
  LoginRoute,
  PrivacidadeRoute,
  TermosRoute,
  TutorialRoute,
  ApiAdminRoute,
  ApiAffiliatesRoute,
  ApiAuthRoute,
  ApiBoardsRoute,
  ApiCheckoutRoute,
  ApiCyclesRoute,
  ApiFinanceRoute,
  ApiFocusRoute,
  ApiHabitsRoute,
  ApiIntegrationsRoute,
  ApiJournalRoute,
  ApiTasksRoute,
  ApiCronLembretesRoute,
  ApiWebhooksMercadopagoRoute
};
const routeTree = Route$m._addFileChildren(rootRouteChildren)._addFileTypes();
const getRouter = () => {
  const router = createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreloadStaleTime: 0
  });
  return router;
};
export {
  getRouter
};
