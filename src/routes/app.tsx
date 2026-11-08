import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect, useMemo } from 'react';
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
import { TabRoadmap } from '../components/TabRoadmap.js';
import { WelcomeTour } from '../components/WelcomeTour.js';
import { SetupGuide } from '../components/SetupGuide.js';
import { TabFeed } from '../components/TabFeed.js';
import { SHARE_EVENT, OPEN_PROFILE_EVENT } from '../lib/share-feed.js';
import { ProfileModal } from '../components/FeedView.js';
import type { Achievement } from '../lib/feed-rules.js';
import { NoticeBell } from '../components/NoticeBell.js';
import { computeNotices } from '../lib/notices.js';
import { personalize, pickNudge, slotForHour } from '../lib/nudges.js';
import { parseGuideState, shouldAutoStartGuide } from '../lib/setup-guide.js';
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
  Map as MapIcon,
  Lightbulb,
  ListChecks,
  Users as UsersIcon,
  Activity,
} from 'lucide-react';

import { localDateStr } from '../lib/chain.js';
import { nextDateAfter, normalizeTaskRule } from '../lib/recurrence.js';
import { ScrollableNav } from '../components/ScrollableNav.js';
import { LevelCard, LevelUpModal, useXp } from '../components/LevelUp.js';
import { XpBurst } from '../components/XpBurst.js';
import { MissionsCard, LastWeekBanner, LeagueCard, StreakCard, WeekSummaryCard } from '../components/Missions.js';
import { ProfilePhotoCard } from '../components/ProfilePhotoCard.js';
import { TabWorkout, WorkoutLiveBar } from '../components/TabWorkout.js';
import { Assistant } from '../components/Assistant.js';
import { InstallBanner } from '../components/InstallPwaButton.js';
import { PushAutoPrompt } from '../components/PushAutoPrompt.js';
import { LegalUpdateModal, PrivacyCard } from '../components/Consents.js';
import { callApi } from '../lib/client-api.js';
import { ProfileSurveyModal, ProfileSurveyCard } from '../components/ProfileSurvey.js';
import { initials as initialsOf } from '../lib/feed-rules.js';

export const Route = createFileRoute('/app')({
  component: RitmoApp,
});

function RitmoApp() {
  const [activeTab, setActiveTab] = useState<string>('feed');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  // Pesquisa de perfil: 'checking' até o servidor responder; a apresentação só abre depois ('done').
  const [surveyStage, setSurveyStage] = useState<'checking' | 'open' | 'done'>('checking');
  const [teamInvite, setTeamInvite] = useState<string | null>(null);
  const [feedPrefill, setFeedPrefill] = useState<Achievement | null>(null);

  // "Compartilhar no Feed" vindo de qualquer aba (Foco, Quadros, Hábitos, Rotina...)
  useEffect(() => {
    const onShare = (e: Event) => {
      const a = (e as CustomEvent<Achievement>).detail;
      if (!a) return;
      setFeedPrefill(a);
      setActiveTab('feed');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener(SHARE_EVENT, onShare);
    return () => window.removeEventListener(SHARE_EVENT, onShare);
  }, []);
  const [guideTab, setGuideTab] = useState<string | null>(null);

  // Perfil de um membro (toque na foto ou no nome no Feed)
  const [profileUserId, setProfileUserId] = useState<number | null>(null);
  useEffect(() => {
    const onOpen = (e: Event) => {
      const id = (e as CustomEvent<number>).detail;
      if (Number.isInteger(id) && id > 0) setProfileUserId(id);
    };
    window.addEventListener(OPEN_PROFILE_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_PROFILE_EVENT, onOpen);
  }, []);

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
    commissionRatePercent: 25,
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

  // Pontos de Ritmo: recalcula quando a pessoa marca hábito, conclui tarefa, foca, escreve ou lança gasto
  const xpSignature = useMemo(
    () =>
      [
        habitLogs.filter((l) => l.completed).length,
        tasks.filter((t) => t.completed).length,
        sessions.length,
        journalEntries.length,
        transactions.length,
        activeTab,
      ].join('|'),
    [habitLogs, tasks, sessions, journalEntries, transactions, activeTab]
  );
  const xp = useXp(user?.id ?? null, xpSignature);
  const userInitials = initialsOf(user?.name);

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

      // Link de Ritus (?ritus=codigo, ou o antigo ?equipe=codigo): guarda e abre o Ritus depois do login
      const equipe = urlParams.get('ritus') || urlParams.get('equipe');
      try {
        if (equipe && /^[a-z0-9-]{3,40}$/.test(equipe)) localStorage.setItem('ritmo_team_invite', equipe);
      } catch {}

      // Notificação tocada (/app?tab=foco): abre direto na aba certa
      const tabParam = urlParams.get('tab');
      if (tabParam && /^[a-z]{3,20}$/.test(tabParam)) setActiveTab(tabParam);

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

  // Primeiro acesso: 1) apresentação (WelcomeTour) e 2) modo ajuda de configuração, que guia por todas as abas.
  const guideShouldAutoStart = () => {
    try {
      return shouldAutoStartGuide(parseGuideState(localStorage.getItem(`ritmo_guide_v1_${user?.id ?? 'anon'}`)), user?.createdAt);
    } catch {
      return false;
    }
  };

  // Primeiro de tudo: a pesquisa rápida de gostos (só para quem ainda não respondeu; tudo opcional).
  useEffect(() => {
    if (!user) return;
    let alive = true;
    setSurveyStage('checking');
    callApi<{ ask?: boolean }>('/api/survey').then((r) => {
      if (!alive) return;
      setSurveyStage(r.ok && r.data.ask ? 'open' : 'done');
    });
    return () => {
      alive = false;
    };
  }, [user?.id]);

  useEffect(() => {
    if (!user || surveyStage !== 'done') return;
    try {
      if (!localStorage.getItem(`ritmo_tour_v1_${user.id}`)) {
        const t = setTimeout(() => setIsTourOpen(true), 600);
        return () => clearTimeout(t);
      }
      // já viu a apresentação: se for conta nova e ainda não viu o modo ajuda, abre ele
      if (guideShouldAutoStart()) {
        const t = setTimeout(() => setIsGuideOpen(true), 900);
        return () => clearTimeout(t);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, surveyStage]);

  useEffect(() => {
    if (!user) return;
    try {
      const invite = localStorage.getItem('ritmo_team_invite');
      if (invite) {
        setTeamInvite(invite);
        setActiveTab('feed');
      }
    } catch {}
  }, [user?.id]);

  // Avisos do sino: recalculados com os dados da tela (sem chamada extra ao servidor)
  const notices = useMemo(() => {
    if (!user) return [];
    const nowD = new Date();
    const list = computeNotices({
      now: nowD,
      today: localDateStr(),
      hour: nowD.getHours(),
      minutes: nowD.getMinutes(),
      isAdmin: user.role === 'admin',
      access: user.access || null,
      config: (user as any).remindersConfig || null,
      tasks: tasks as any,
      transactions: transactions as any,
      habits: habits as any,
      habitLogs: habitLogs as any,
      journalToday: journalEntries.some((e: any) => e.date === localDateStr() && e.entryType === 'daily_checkin'),
      affiliateBalanceCents: affiliateStats.availableBalanceCents,
    });
    // um "empurrãozinho" por período do dia (manhã, tarde, noite), girando a cada dia
    const slot = slotForHour(nowD.getHours());
    if (slot) {
      const n = pickNudge(slot, localDateStr(), user.id || 0);
      list.push({ id: `nudge-${n.id}`, level: 'info', title: personalize(n.title, user.name), detail: personalize(n.body, user.name), tab: n.tab });
    }
    return list;
  }, [user, tasks, transactions, habits, habitLogs, journalEntries, affiliateStats]);

  const closeTour = () => {
    setIsTourOpen(false);
    try {
      if (user) localStorage.setItem(`ritmo_tour_v1_${user.id}`, '1');
    } catch {}
    if (guideShouldAutoStart()) setTimeout(() => setIsGuideOpen(true), 400);
  };

  // Handlers for Tasks
  const handleToggleTask = async (taskId: number, completed: boolean) => {
    await handleUpdateTask(taskId, { completed });
  };

  // Tarefa que se repete: ao concluir, cria a próxima no dia certo (pela regra escolhida pela pessoa).
  // A concluída deixa de "puxar" a série, então desmarcar e marcar de novo não duplica.
  const spawnNextOccurrence = async (task: TaskItem) => {
    if (!task.isRecurring || !task.recurrenceRule) return false;
    const next = nextDateAfter(task.recurrenceRule, task.date);
    if (!next) return false;
    const rule = normalizeTaskRule(task.recurrenceRule, task.date) || task.recurrenceRule;
    const exists = tasks.some((t) => t.id !== task.id && t.date === next && t.title === task.title && !t.completed);
    if (!exists) {
      await handleAddTask({
        title: task.title,
        description: task.description,
        category: task.category,
        priority: task.priority,
        timeBlock: task.timeBlock,
        startTime: task.startTime,
        estimatedMinutes: task.estimatedMinutes,
        isRecurring: true,
        recurrenceRule: rule,
        notes: task.notes,
        date: next,
      });
    }
    return true;
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
    const current = tasks.find((t) => t.id === id);
    if (updates.completed === true && current && !current.completed && current.isRecurring) {
      if (await spawnNextOccurrence(current)) updates = { ...updates, isRecurring: false };
    }
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
    const targetDate = date || localDateStr();
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

  const handleUpdateHabit = async (habitId: number, updates: Partial<HabitItem>) => {
    setHabits((prev) => prev.map((h) => (h.id === habitId ? { ...h, ...updates } : h)));
    const r = await callApi<{ habit?: HabitItem }>('/api/habits', { action: 'update_habit', habitId, ...updates });
    if (r.ok && r.data.habit) setHabits((prev) => prev.map((h) => (h.id === habitId ? r.data.habit! : h)));
  };

  // Handlers for Focus Sessions
  const handleRecordSession = async (session: Partial<FocusSessionItem>) => {
    const res = await fetch('/api/focus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // data no fuso do aparelho (o servidor usava UTC e jogava as sessões da noite para o dia seguinte)
      body: JSON.stringify({ date: localDateStr(), ...session }),
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

  const handleUpdateTransaction = async (id: number, updates: Partial<FinanceTransactionItem>) => {
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    const res = await fetch('/api/finance', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...updates }),
    });
    const data = await res.json().catch(() => ({}));
    if (data.transaction) setTransactions((prev) => prev.map((t) => (t.id === id ? data.transaction : t)));
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

  // Botão "Ir" das missões: abre a aba certa (ou o secretário)
  const goMission = (tab: string) => {
    if (tab === 'secretario') {
      window.dispatchEvent(new Event('ritmo:open-assistant'));
      return;
    }
    setActiveTab(tab as any);
    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch {}
  };

  // Navigation items definition
  const NAV_ITEMS = [
    { id: 'feed', label: 'Feed', icon: <UsersIcon className="w-4 h-4" /> },
    { id: 'hoje', label: 'Hoje', icon: <Flame className="w-4 h-4" /> },
    { id: 'roteiro', label: 'Roteiro de Metas', icon: <MapIcon className="w-4 h-4" /> },
    { id: 'rotina', label: 'Rotina & Tarefas', icon: <Calendar className="w-4 h-4" /> },
    { id: 'quadros', label: 'Quadros', icon: <LayoutGrid className="w-4 h-4" /> },
    { id: 'habitos', label: 'Hábitos & Saúde', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'treino', label: 'Treino', icon: <Activity className="w-4 h-4" /> },
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
        xp={xp.data}
        onOpenLevel={() => {
          setActiveTab('progresso');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {user && <InstallBanner />}
        {user && <PushAutoPrompt />}
        {/* Navigation Bar Tabs */}
        <ScrollableNav dark={theme === 'dark'}>
          <nav className="flex space-x-1 sm:space-x-2 min-w-max px-1">
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
                  } ${isGuideOpen && guideTab === item.id ? 'ring-2 ring-amber-300 ring-offset-2 ring-offset-[#0d1117]' : ''}`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              );
            })}
            <NoticeBell notices={notices} onOpenTab={(tab) => setActiveTab(tab)} />
            <button
              onClick={() => setIsGuideOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-emerald-300 hover:bg-emerald-500/10 transition-all"
            >
              <ListChecks className="w-4 h-4" />
              <span>Modo ajuda</span>
            </button>
            <button
              onClick={() => setIsTourOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold text-amber-300 hover:bg-amber-500/10 transition-all"
            >
              <Lightbulb className="w-4 h-4" />
              <span>Como usar</span>
            </button>
          </nav>
        </ScrollableNav>

        {/* Tab Content Display */}
        <main>
          {(activeTab === 'feed' || activeTab === 'hoje') && user && (
            <div className="max-w-5xl mx-auto">
              {activeTab === 'feed' && <LastWeekBanner data={xp.data} />}
              <MissionsCard
                data={xp.data}
                onGo={goMission}
                onChanged={() => xp.refresh()}
                actions={{
                  habits,
                  habitLogs,
                  tasks,
                  onToggleHabit: (id, completed) => handleToggleHabit(id, completed),
                  onToggleTask: handleToggleTask,
                  onAddTask: handleAddTask,
                  onStartFocus: (minutes, topic) => {
                    handleQuickStartFocus(minutes, topic);
                    try { window.scrollTo({ top: 0, behavior: 'smooth' }); } catch {}
                  },
                }}
              />
            </div>
          )}

          {activeTab === 'hoje' && (
            <TabToday
              activeCycle={activeCycle}
              tasks={tasks}
              habits={habits}
              habitLogs={habitLogs}
              transactions={transactions}
              sessions={sessions}
              userId={user?.id ?? null}
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

          {activeTab === 'roteiro' && (
            <TabRoadmap activeCycle={activeCycle} onOpenOnboarding={() => setIsOnboardingOpen(true)} />
          )}

          {activeTab === 'quadros' && <TabBoards />}

          {activeTab === 'habitos' && (
            <TabHabits
              habits={habits}
              habitLogs={habitLogs}
              onToggleHabit={handleToggleHabit}
              onAddHabit={handleAddHabit}
              onUpdateHabit={handleUpdateHabit}
            />
          )}

          {activeTab === 'treino' && <TabWorkout onSaved={() => xp.refresh()} />}

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
              onUpdateTransaction={handleUpdateTransaction}
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

          {activeTab === 'feed' && (
            <TabFeed
              referralCode={user?.referralCode || ''}
              habits={habits}
              habitLogs={habitLogs}
              sessions={sessions}
              tasks={tasks}
              activeCycle={activeCycle}
              inviteCode={teamInvite}
              prefill={feedPrefill}
              onPrefillUsed={() => setFeedPrefill(null)}
              onInviteHandled={() => {
                setTeamInvite(null);
                try { localStorage.removeItem('ritmo_team_invite'); } catch {}
              }}
            />
          )}

          {activeTab === 'afiliados' && (
            <TabAffiliates
              affiliateStats={affiliateStats}
              commissions={commissions}
            />
          )}

          {activeTab === 'progresso' && user && (
            <div className="mb-6 max-w-5xl mx-auto">
              <LevelCard data={xp.data} initials={userInitials} onEditPhoto={() => setActiveTab('configuracoes')} />
              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <div className="space-y-6">
                  <StreakCard data={xp.data} />
                  <WeekSummaryCard week={xp.data?.week} title="Esta semana" />
                  {xp.data?.lastWeek && xp.data.lastWeek.xp > 0 && <WeekSummaryCard week={xp.data.lastWeek} title="Semana passada" shareable />}
                </div>
                <LeagueCard data={xp.data} onChanged={() => xp.refresh()} />
              </div>
            </div>
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

          {activeTab === 'configuracoes' && user && (
            <ProfilePhotoCard
              data={xp.data}
              initials={userInitials}
              userId={user.id}
              onChanged={(avatarUrl) => xp.setData((d) => (d ? { ...d, avatarUrl } : d))}
              onBioChanged={(bio) => xp.setData((d) => (d ? { ...d, bio } : d))}
            />
          )}

          {activeTab === 'configuracoes' && user && <ProfileSurveyCard />}

          {activeTab === 'configuracoes' && user && <PrivacyCard />}

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

      <ProfileModal
        userId={profileUserId}
        onClose={() => setProfileUserId(null)}
        onEditMine={() => {
          setActiveTab('configuracoes');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
      {activeTab !== 'treino' && (
        <WorkoutLiveBar
          onOpen={() => {
            setActiveTab('treino');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}
      {user && (
        <Assistant
          userName={user.name}
          tasks={tasks}
          transactions={transactions}
          habits={habits}
          habitLogs={habitLogs}
          xp={xp.data}
          onDataChanged={() => {
            loadSessionAndData();
          }}
          onNavigate={(tab) => {
            setActiveTab(tab);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onStartFocus={(minutes, topic) => {
            handleQuickStartFocus(minutes, topic);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}
      {user && <LegalUpdateModal />}
      <XpBurst burst={xp.burst} />
      <LevelUpModal info={xp.levelUp} initials={userInitials} avatarUrl={xp.data?.avatarUrl} onClose={xp.closeLevelUp} />

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

      <ProfileSurveyModal isOpen={Boolean(user) && surveyStage === 'open'} onClose={() => setSurveyStage('done')} />

      <WelcomeTour
        isOpen={isTourOpen}
        userName={user?.name}
        trialDaysLeft={user?.access?.effectiveStatus === 'trial' ? user.access.daysLeft : null}
        hasCycle={Boolean(activeCycle)}
        onClose={closeTour}
        onNavigate={(tab) => setActiveTab(tab)}
        onStartCycle={() => setIsOnboardingOpen(true)}
      />

      <SetupGuide
        isOpen={isGuideOpen}
        userId={user?.id}
        onClose={() => setIsGuideOpen(false)}
        onNavigate={(tab) => setActiveTab(tab)}
        onStepTab={setGuideTab}
        onAction={(id) => id === 'open_cycle' && setIsOnboardingOpen(true)}
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
