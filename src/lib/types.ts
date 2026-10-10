export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'user';
  subscriptionStatus: 'trial' | 'active' | 'expired' | 'suspended' | 'canceled';
  trialEndsAt?: string | null;
  subscriptionRenewalDate?: string | null;
  pixKey?: string | null;
  pixKeyType?: 'cpf' | 'email' | 'telefone' | 'aleatoria' | null;
  timezone: string;
  themePreference: 'dark' | 'light';
  referralCode: string;
  referredBy?: string | null;
  whatsappPhone?: string | null;
  access?: { hasAccess: boolean; effectiveStatus: string; daysLeft: number };
  createdAt?: string;
  updatedAt?: string;
}

export type FocusCycleDuration = 7 | 21 | 40 | 90;
export type RoutineLevel = 'leve' | 'equilibrado' | 'intensivo';

export interface FocusCycle {
  id: number;
  userId: number;
  title: string;
  mainGoal: string;
  secondaryGoals: string[];
  durationDays: FocusCycleDuration;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  routineLevel: RoutineLevel;
  preferredTimes?: string | null;
  digitalLimits?: string | null;
  status: 'active' | 'completed' | 'paused';
  notes?: string | null;
  createdAt?: string;
}

export type TaskCategory = 'geral' | 'trabalho' | 'estudo' | 'saude' | 'financas' | 'pessoal';
export type TaskPriority = 'baixa' | 'media' | 'alta';
export type TimeBlock = 'Manhã' | 'Tarde' | 'Noite' | 'Flexível';

export interface TaskItem {
  id: number;
  userId: number;
  cycleId?: number | null;
  title: string;
  description?: string | null;
  category: TaskCategory;
  priority: TaskPriority;
  date: string; // YYYY-MM-DD
  startTime?: string | null; // HH:MM
  estimatedMinutes: number;
  completed: boolean;
  completedAt?: string | null;
  isRecurring: boolean;
  recurrenceRule?: string | null; // 'daily' | 'weekdays' | 'weekly' | ''
  timeBlock: TimeBlock;
  notes?: string | null;
  createdAt?: string;
}

export type HabitCategory = 'movimento' | 'estudo' | 'mente' | 'sono' | 'hidratacao' | 'desconexao' | 'personalizado';

export interface HabitItem {
  id: number;
  userId: number;
  cycleId?: number | null;
  name: string;
  category: HabitCategory;
  targetFrequency: 'diario' | '5x_semana' | '3x_semana';
  notes?: string | null;
  isActive: boolean;
  createdAt?: string;
}

export interface HabitLogItem {
  id: number;
  habitId: number;
  userId: number;
  date: string; // YYYY-MM-DD
  completed: boolean;
  value?: string | null;
  notes?: string | null;
  createdAt?: string;
}

export interface FocusSessionItem {
  id: number;
  userId: number;
  cycleId?: number | null;
  focusTopic: string;
  durationMinutes: number;
  sessionType: '25_5' | '50_10' | 'custom';
  status: 'completed' | 'interrupted';
  date: string; // YYYY-MM-DD
  createdAt?: string;
}

export interface JournalEntryItem {
  id: number;
  userId: number;
  cycleId?: number | null;
  date: string; // YYYY-MM-DD
  entryType: 'daily_checkin' | 'weekly_review';
  energyScore: number; // 1..5
  moodScore: number; // 1..5
  focusScore: number; // 1..5
  workedWell: string;
  nextStep: string;
  difficulties?: string | null;
  notes?: string | null;
  createdAt?: string;
}

export type TransactionType = 'income' | 'expense';
export type FinanceCategory =
  | 'alimentacao'
  | 'moradia'
  | 'transporte'
  | 'saude'
  | 'educacao'
  | 'lazer'
  | 'trabalho'
  | 'renda'
  | 'servicos'
  | 'outros';

export type PaymentMethod = 'pix' | 'cartao_credito' | 'cartao_debito' | 'dinheiro' | 'boleto' | 'transferencia';
export type TransactionStatus = 'paid' | 'pending' | 'received' | 'overdue';

export interface FinanceTransactionItem {
  id: number;
  userId: number;
  type: TransactionType;
  description: string;
  amountCents: number;
  date: string; // YYYY-MM-DD
  category: FinanceCategory | string;
  paymentMethod?: PaymentMethod | string | null;
  accountWallet?: string | null;
  isRecurring: boolean;
  recurrenceInterval?: string | null;
  isInstallment: boolean;
  currentInstallment?: number | null;
  totalInstallments?: number | null;
  status: TransactionStatus;
  dueDate?: string | null; // YYYY-MM-DD
  notes?: string | null;
  source: 'web' | 'whatsapp' | 'api';
  syncedToSheets: boolean;
  sheetsRowId?: string | null;
  createdAt?: string;
}

export interface FinanceBudgetItem {
  id: number;
  userId: number;
  category: string;
  monthYear: string; // YYYY-MM
  budgetLimitCents: number;
  createdAt?: string;
}

export interface IntegrationsConfigItem {
  userId: number;
  whatsappPhone?: string;
  whatsappStatus: 'connected' | 'disconnected' | 'pending';
  sheetsStatus: 'connected' | 'disconnected' | 'configured';
  sheetsSpreadsheetId?: string;
  sheetsSpreadsheetName: string;
  sheetsAutoSync: boolean;
  remindersConfig: {
    tasks: boolean;
    habits: boolean;
    financeDue: boolean;
    weeklyReview: boolean;
  };
}

export interface AffiliateStats {
  referralCode: string;
  referralLink: string;
  totalClicks: number;
  totalReferrals: number;
  activeSubscriptions: number;
  commissionRatePercent: number;
  pendingCommissionCents: number;
  approvedCommissionCents: number;
  paidCommissionCents: number;
  availableBalanceCents: number;
}

export interface AffiliateCommissionItem {
  id: number;
  affiliateUserId: number;
  referredUserId: number;
  orderReference: string;
  baseAmountCents: number;
  commissionRatePercent: number;
  commissionCents: number;
  status: 'pending' | 'approved' | 'paid' | 'refunded' | 'reversed';
  payoutReference?: string | null;
  payoutStatus: 'manual' | 'processed';
  notes?: string | null;
  createdAt?: string;
}

export interface AffiliateReferralItem {
  id: number;
  affiliateUserId: number;
  referredUserId?: number | null;
  referralCode: string;
  clickCount: number;
  status: 'active' | 'converted' | 'fraud_blocked';
  createdAt?: string;
}

export interface SubscriptionItem {
  id: number;
  userId: number;
  plan: string;
  amountCents: number;
  status: 'trial' | 'active' | 'past_due' | 'canceled' | 'expired';
  provider: string;
  renewalDate?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaymentItem {
  id: number;
  userId: number;
  orderReference: string;
  amountCents: number;
  discountCents: number;
  couponCode?: string | null;
  status: 'pending' | 'paid' | 'failed' | 'refunded';
  paymentMethod: 'pix' | 'credit_card';
  paidAt?: string | null;
  pixQrCode?: string | null;
  pixCopiaECola?: string | null;
  invoiceUrl?: string | null;
  providerPaymentId?: string | null;
  isSimulated: boolean;
  createdAt: string;
  userName?: string;
  userEmail?: string;
}

export interface CouponItem {
  id: number;
  code: string;
  discountPercent: number;
  discountCents: number;
  active: boolean;
  maxUses: number;
  usedCount: number;
  expiresAt?: string | null;
  createdAt?: string;
}

export interface AffiliateWithdrawalItem {
  id: number;
  affiliateUserId: number;
  amountCents: number;
  pixKey: string;
  pixKeyType: 'cpf' | 'email' | 'telefone' | 'aleatoria';
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  notes?: string | null;
  receiptReference?: string | null;
  requestedAt: string;
  processedAt?: string | null;
  affiliateName?: string;
  affiliateEmail?: string;
}

// ---------------------------------------------------------------------------
// KANBAN BOARDS ("Quadros")
// ---------------------------------------------------------------------------
export interface BoardItem {
  id: number;
  userId: number;
  title: string;
  description?: string | null;
  color: string;
  position: number;
  archived: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface BoardListItem {
  id: number;
  boardId: number;
  userId: number;
  title: string;
  position: number;
  archived: boolean;
  createdAt?: string;
}

export type BoardCardPriority = 'baixa' | 'media' | 'alta';

export interface BoardCardItem {
  id: number;
  listId: number;
  boardId: number;
  userId: number;
  title: string;
  description?: string | null;
  priority: BoardCardPriority;
  labels: string[];
  assignee?: string | null;
  dueDate?: string | null; // YYYY-MM-DD
  position: number;
  archived: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface BoardChecklistItemType {
  id: number;
  cardId: number;
  userId: number;
  text: string;
  done: boolean;
  position: number;
  createdAt?: string;
}

export interface BoardCardCommentItem {
  id: number;
  cardId: number;
  userId: number;
  authorName: string;
  text: string;
  createdAt?: string;
}

// Agregado retornado por GET /api/boards?boardId=X — um quadro completo
export interface BoardFullData {
  board: BoardItem;
  lists: BoardListItem[];
  cards: BoardCardItem[];
  checklistItems: BoardChecklistItemType[];
  comments: BoardCardCommentItem[];
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  paidSubscribers: number;
  trialUsers: number;
  mrrCents: number;
  pendingCommissionsCents: number;
  totalCommissionsPaidCents: number;
}

