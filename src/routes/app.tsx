import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { Header } from '../components/Header.js';
import { AuthModal } from '../components/AuthModal.js';
import { OnboardingModal } from '../components/OnboardingModal.js';
import { TabToday } from '../components/TabToday.js';
import { TabTasks } from '../components/TabTasks.js';
import { TabHabits } from '../components/TabHabits.js';
import { TabFocus } from '../components/TabFocus.js';
import { TabJournal } from '../components/TabJournal.js';
import { TabFinance } from '../components/TabFinance.js';
import { TabWhatsApp } from '../components/TabWhatsApp.js';
import { TabSheets } from '../components/TabSheets.js';
import { TabAffiliates } from '../components/TabAffiliates.js';
import { TabProgress } from '../components/TabProgress.js';
import { TabSettings } from '../components/TabSettings.js';
import { TabBoards } from '../components/TabBoards.js';
import {
  User,
  FocusCycle,
  TaskItem,
  HabitItem,
  HabitLogItem,
  FocusSessionItem,
  JournalEntryItem,
  FinanceTransactionItem,
  AffiliateStats,
  AffiliateCommissionItem,
} from '../lib/types.js';
import {
  Calendar,
  Clock,
  Sparkles,
  BookOpen,
  DollarSign,
  Smartphone,
  FileSpreadsheet,
  Share2,
  TrendingUp,
  Settings,
  Flame,
  LayoutGrid,
} from 'lucide-react';

export const Route = createFileRoute('/app')({
  component: RitmoApp,
});

function RitmoApp() {
  const [activeTab, setActiveTab] = useState<string>('hoje');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // App State
  const [user, setUser] = useState<User | null>(null);
  const [activeCycle, setActiveCycle] = useState<FocusCycle | null>(null);
  const [allCycles, setAllCycles] = useState<FocusCycle[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [habits, setHabits] = useState<HabitItem[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLogItem[]>([]);
  const [sessions, setSessions] = useState<FocusSessionItem[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntryItem[]>([]);
  const [transactions, setTransactions] = useState<FinanceTransactionItem[]>([]);
  const [affiliateStats, setAffiliateStats] = useState<AffiliateStats>({
    referralCode: '',
    referralLink: '',
    totalClicks: 0,
    totalReferrals: 0,
    activeSubscriptions: 0,
    commissionRatePercent: 60,
    pendingCommissionCents: 0,
    approvedCommissionCents: 0,
    paidCommissionCents: 0,
    availableBalanceCents: 0,
  });
  const [commissions, setCommissions] = useState<AffiliateCommissionItem[]>([]);
  const [refParam, setRefParam] = useState<string>('');
  const [quickFocusConfig, setQuickFocusConfig] = useState<{ duration: number; topic: string }>({
    duration: 25,
    topic: '',
  });

  // 1. Initial Load & Referral Capture
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const ref = urlParams.get('ref');
      if (ref) {
        setRefParam(ref);
        localStorage.setItem('ritmo_referral', ref);
      } else {
        const storedRef = localStorage.getItem('ritmo_referral');
        if (storedRef) setRefParam(storedRef);
      }

      // Check session
      loadSessionAndData();
    }
  }, []);

  const loadSessionAndData = async () => {
    try {
      // 1. Fetch current user
      const authRes = await fetch('/api/auth');
      const authData = await authRes.json();

      if (authData.user) {
        setUser(authData.user);
        setAffiliateStats((prev) => ({
          ...prev,
          referralCode: authData.user.referralCode,
          referralLink: `/?ref=${authData.user.referralCode}`,
        }));
      } else {
        // Sem sessão válida: o painel é privado, volta para o login.
        window.location.href = '/login';
        return;
      }

      // Acesso bloqueado: teste vencido, assinatura vencida ou conta suspensa.
      if (authData.user.access && authData.user.access.hasAccess === false) {
        window.location.href = '/checkout?bloqueado=1';
        return;
      }

      // 2. Fetch cycles
      const cycleRes = await fetch('/api/cycles');
      const cycleData = await cycleRes.json();
      if (cycleData.active) {
        setActiveCycle(cycleData.active);
      } else {
        setActiveCycle(null);
        setAllCycles([]);
      }

      // 3. Fetch Tasks
      const tasksRes = await fetch('/api/tasks');
      const tasksData = await tasksRes.json();
      const todayStr = new Date().toISOString().split('T')[0];

      if (tasksData.tasks && tasksData.tasks.length > 0) {
        setTasks(tasksData.tasks);
      } else {
        setTasks([]);
      }

      // 4. Fetch Habits
      const habitsRes = await fetch('/api/habits');
      const habitsData = await habitsRes.json();
      if (habitsData.habits && habitsData.habits.length > 0) {
        setHabits(habitsData.habits);
        setHabitLogs(habitsData.logs || []);
      } else {
        setHabits([]);
        setHabitLogs([]);
      }

      // 5. Fetch Focus Sessions
      const focusRes = await fetch('/api/focus');
      const focusData = await focusRes.json();
      if (focusData.sessions && focusData.sessions.length > 0) {
        setSessions(focusData.sessions);
      } else {
        setSessions([]);
      }

      // 6. Fetch Journal
      const journalRes = await fetch('/api/journal');
      const journalData = await journalRes.json();
      if (journalData.entries && journalData.entries.length > 0) {
        setJournalEntries(journalData.entries);
      } else {
        setJournalEntries([]);
      }

      // 7. Fetch Finance
      const finRes = await fetch('/api/finance');
      const finData = await finRes.json();
      if (finData.transactions && finData.transactions.length > 0) {
        setTransactions(finData.transactions);
      } else {
        setTransactions([]);
      }

      // 8. Fetch Affiliates
      const affRes = await fetch('/api/affiliates');
      const affData = await affRes.json();
      if (affData.stats) {
        setAffiliateStats(affData.stats);
        setCommissions(affData.commissions || []);
      } else {
        setCommissions([]);
      }
    } catch {}
  };

  // Handlers for Tasks
  const handleToggleTask = async (taskId: number, completed: boolean) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, completed } : t)));
    await fetch('/api/tasks', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: taskId, completed }),
    });
  };

  const handleAddTask = async (newTask: Partial<TaskItem>) => {
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTask),
    });
    const data = await res.json();
    if (data.task) {
      setTasks((prev) => [data.task, ...prev]);
    }
  };

  const handleUpdateTask = async (id: number, updates: Partial<TaskItem>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    await fetch('/api/tasks', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
  };

  const handleDeleteTask = async (id: number) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' });
  };

  // Handlers for Habits
  const handleToggleHabit = async (habitId: number, completed: boolean, date?: string) => {
    const targetDate = date || new Date().toISOString().split('T')[0];
    setHabitLogs((prev) => {
      const existing = prev.find((l) => l.habitId === habitId && l.date === targetDate);
      if (existing) {
        return prev.map((l) =>
          l.habitId === habitId && l.date === targetDate ? { ...l, completed } : l
        );
      }
      return [...prev, { id: Date.now(), habitId, userId: 1, date: targetDate, completed }];
    });

    await fetch('/api/habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'toggle_log',
        habitId,
        date: targetDate,
        completed,
      }),
    });
  };

  const handleAddHabit = async (newHabit: Partial<HabitItem>) => {
    const res = await fetch('/api/habits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newHabit),
    });
    const data = await res.json();
    if (data.habit) {
      setHabits((prev) => [...prev, data.habit]);
    }
  };

  // Handlers for Focus Sessions
  const handleRecordSession = async (session: Partial<FocusSessionItem>) => {
    const res = await fetch('/api/focus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(session),
    });
    const data = await res.json();
    if (data.session) {
      setSessions((prev) => [data.session, ...prev]);
    }
  };

  const handleQuickStartFocus = (duration: number, topic: string) => {
    setQuickFocusConfig({ duration, topic });
    setActiveTab('foco');
  };

  // Handlers for Journal
  const handleSaveJournalEntry = async (entry: Partial<JournalEntryItem>) => {
    const res = await fetch('/api/journal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry),
    });
    const data = await res.json();
    if (data.entry) {
      setJournalEntries((prev) => {
        const idx = prev.findIndex(
          (j) => j.date === data.entry.date && j.entryType === data.entry.entryType
        );
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = data.entry;
          return updated;
        }
        return [data.entry, ...prev];
      });
    }
  };

  // Handlers for Finance
  const handleAddTransaction = async (tx: Partial<FinanceTransactionItem>) => {
    const res = await fetch('/api/finance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tx),
    });
    const data = await res.json();
    if (data.transaction) {
      setTransactions((prev) => [data.transaction, ...prev]);
    }
  };

  const handleDeleteTransaction = async (id: number) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    await fetch(`/api/finance?id=${id}`, { method: 'DELETE' });
  };

  const refreshFinance = async () => {
    const res = await fetch('/api/finance');
    const data = await res.json();
    if (data.transactions) {
      setTransactions(data.transactions);
    }
  };

  // Handlers for User & Account
  const handleLogout = async () => {
    await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'logout' }),
    });
    setUser(null);
    window.location.href = '/login';
  };

  const handleDeleteAccount = async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    setUser(null);
    setActiveCycle(null);
    setTasks([]);
    setHabits([]);
    setTransactions([]);
    window.location.href = '/';
  };

  const handleUpdateProfile = async (updates: Partial<User>) => {
    const res = await fetch('/api/auth', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (data.user) {
      setUser(data.user);
    }
  };

  // Navigation items definition
  const NAV_ITEMS = [
    { id: 'hoje', label: 'Hoje', icon: <Flame className="w-4 h-4" /> },
    { id: 'rotina', label: 'Rotina & Tarefas', icon: <Calendar className="w-4 h-4" /> },
    { id: 'quadros', label: 'Quadros', icon: <LayoutGrid className="w-4 h-4" /> },
    { id: 'habitos', label: 'Hábitos & Saúde', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'foco', label: 'Sessões de Foco', icon: <Clock className="w-4 h-4" /> },
    { id: 'diario', label: 'Diário & Revisões', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'financas', label: 'Finanças Pessoais', icon: <DollarSign className="w-4 h-4" /> },
    { id: 'whatsapp', label: 'WhatsApp Bot', icon: <Smartphone className="w-4 h-4" /> },
    { id: 'planilha', label: 'Planilhas', icon: <FileSpreadsheet className="w-4 h-4" /> },
    { id: 'afiliados', label: 'Indique e Ganhe', icon: <Share2 className="w-4 h-4" /> },
    { id: 'progresso', label: 'Progresso', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'configuracoes', label: 'Configurações', icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#0d1117] text-[#f0f6fc]' : 'bg-[#f6f8fa] text-[#1f2328]'}`}>
      {/* Faixa de teste grátis / renovação */}
      {user && user.role !== 'admin' && user.access && (() => {
        const { effectiveStatus, daysLeft } = user.access;
        const showTrial = effectiveStatus === 'trial';
        const showRenew = (effectiveStatus === 'active' || effectiveStatus === 'canceled') && daysLeft <= 5;
        if (!showTrial && !showRenew) return null;
        const plural = daysLeft === 1 ? 'dia' : 'dias';
        return (
          <div className="bg-emerald-950/60 border-b border-emerald-800/60 text-emerald-200 text-xs sm:text-sm px-4 py-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <span>
              {showTrial ? 'Teste grátis' : effectiveStatus === 'canceled' ? 'Seu acesso termina em' : 'Sua assinatura vence em'}:{' '}
              <strong>{daysLeft} {plural}</strong>
            </span>
            <a href="/checkout" className="font-semibold underline hover:text-white">
              {showTrial ? 'Assinar o Ritmo PRO — R$ 39,90/mês' : 'Renovar agora'}
            </a>
          </div>
        );
      })()}

      {/* Top Header */}
      <Header
        user={user}
        activeCycle={activeCycle}
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
      />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Navigation Bar Tabs */}
        <div className="mb-6 pb-2 border-b border-[#30363d] overflow-x-auto">
          <nav className="flex space-x-1 sm:space-x-2 min-w-max">
            {NAV_ITEMS.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    active
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                      : 'text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#161b22]'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content Display */}
        <main>
          {activeTab === 'hoje' && (
            <TabToday
              activeCycle={activeCycle}
              tasks={tasks}
              habits={habits}
              habitLogs={habitLogs}
              transactions={transactions}
              onToggleTask={handleToggleTask}
              onToggleHabit={handleToggleHabit}
              onQuickStartFocus={handleQuickStartFocus}
              onNavigateTab={(tab) => setActiveTab(tab)}
              onOpenOnboarding={() => setIsOnboardingOpen(true)}
            />
          )}

          {activeTab === 'rotina' && (
            <TabTasks
              tasks={tasks}
              onAddTask={handleAddTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
            />
          )}

          {activeTab === 'quadros' && <TabBoards />}

          {activeTab === 'habitos' && (
            <TabHabits
              habits={habits}
              habitLogs={habitLogs}
              onToggleHabit={handleToggleHabit}
              onAddHabit={handleAddHabit}
            />
          )}

          {activeTab === 'foco' && (
            <TabFocus
              sessions={sessions}
              onRecordSession={handleRecordSession}
              initialDuration={quickFocusConfig.duration}
              initialTopic={quickFocusConfig.topic}
            />
          )}

          {activeTab === 'diario' && (
            <TabJournal
              entries={journalEntries}
              onSaveEntry={handleSaveJournalEntry}
            />
          )}

          {activeTab === 'financas' && (
            <TabFinance
              transactions={transactions}
              onAddTransaction={handleAddTransaction}
              onDeleteTransaction={handleDeleteTransaction}
            />
          )}

          {activeTab === 'whatsapp' && (
            <TabWhatsApp
              userPhone={user?.whatsappPhone || undefined}
              onRefreshFinance={refreshFinance}
            />
          )}

          {activeTab === 'planilha' && (
            <TabSheets
              onExportCSV={() => {
                window.open('/api/finance?format=csv', '_blank');
              }}
            />
          )}

          {activeTab === 'afiliados' && (
            <TabAffiliates
              affiliateStats={affiliateStats}
              commissions={commissions}
            />
          )}

          {activeTab === 'progresso' && (
            <TabProgress
              cycles={allCycles.length > 0 ? allCycles : activeCycle ? [activeCycle] : []}
              tasks={tasks}
              habits={habits}
              habitLogs={habitLogs}
              sessions={sessions}
              transactions={transactions}
              onDeleteAccount={handleDeleteAccount}
            />
          )}

          {activeTab === 'configuracoes' && (
            <TabSettings
              user={user}
              theme={theme}
              onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              onUpdateProfile={handleUpdateProfile}
            />
          )}
        </main>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={(u) => {
          setUser(u);
          loadSessionAndData();
        }}
        initialReferralCode={refParam}
      />

      {/* Onboarding / Focus Cycle Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        existingCycle={activeCycle}
        onSaveCycle={(cycle) => {
          setActiveCycle(cycle);
          setAllCycles((prev) => [cycle, ...prev]);
        }}
      />
    </div>
  );
}
