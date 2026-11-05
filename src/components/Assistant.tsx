import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Send, X, Settings2, Volume2, VolumeX, Bell, Check, Undo2, Sparkles, MessageSquareText } from 'lucide-react';
import { PushToggle } from './PushToggle.js';
import { ConsentPrompt, hasConsent, loadConsents } from './Consents.js';
import { callApi } from '../lib/client-api.js';
import {
  AssistantTab,
  Intent,
  NAME_SUGGESTIONS,
  ASSISTANT_NAME_MAX,
  brl,
  completeWith,
  dayLabel,
  fold,
  parseCommand,
  resolveDateTime,
  timeBlockFor,
  timeLabel,
  ymd,
} from '../lib/assistant-parser.js';
import * as recorder from '../lib/workout-recorder.js';
import { SPORTS } from '../lib/workout.js';
import type { FinanceTransactionItem, HabitItem, HabitLogItem, TaskItem } from '../lib/types.js';
import type { XpData } from './LevelUp.js';

interface Reminder {
  id: number;
  text: string;
  remindAt: string;
  taskId: number | null;
  sentAt: string | null;
}

interface Msg {
  id: number;
  from: 'me' | 'bot';
  text: string;
  undo?: { label: string; run: () => Promise<void> };
}

const CATEGORY_LABEL: Record<string, string> = {
  alimentacao: 'alimentação',
  moradia: 'moradia',
  transporte: 'transporte',
  saude: 'saúde',
  educacao: 'educação',
  lazer: 'lazer',
  trabalho: 'trabalho',
  renda: 'renda',
  servicos: 'serviços',
  outros: 'outros',
};

const EXAMPLES = ['Gastei 32 reais no almoço', 'Agenda dentista amanhã às 3 da tarde', 'Me lembra de pagar a luz dia 10', 'O que eu tenho hoje?', 'Quanto gastei este mês?', 'Começar corrida'];

/* ---------------- Voz ---------------- */

function getRecognition(): any | null {
  if (typeof window === 'undefined') return null;
  const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  return SR ? new SR() : null;
}

function speak(text: string) {
  try {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const clean = text.replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '').replace(/R\$\s?/g, '').replace(/\n+/g, '. ');
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = 'pt-BR';
    const v = window.speechSynthesis.getVoices().find((x) => x.lang?.toLowerCase().startsWith('pt-br')) || window.speechSynthesis.getVoices().find((x) => x.lang?.toLowerCase().startsWith('pt'));
    if (v) u.voice = v;
    u.rate = 1.05;
    window.speechSynthesis.speak(u);
  } catch {
    // sem voz no aparelho: só o texto aparece
  }
}

const readPref = (k: string, d: boolean) => {
  try {
    const v = localStorage.getItem(k);
    return v === null ? d : v === '1';
  } catch {
    return d;
  }
};

/* ---------------- Componente ---------------- */

export const Assistant: React.FC<{
  userName: string;
  tasks: TaskItem[];
  transactions: FinanceTransactionItem[];
  habits: HabitItem[];
  habitLogs: HabitLogItem[];
  xp: XpData | null;
  onDataChanged: () => void;
  onNavigate: (tab: AssistantTab) => void;
  onStartFocus: (minutes: number, topic: string) => void;
}> = ({ userName, tasks, transactions, habits, habitLogs, xp, onDataChanged, onNavigate, onStartFocus }) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState<string | null>(null);
  const [naming, setNaming] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState('');
  const [voiceOn, setVoiceOn] = useState(true);
  const [settings, setSettings] = useState(false);
  const [alert, setAlert] = useState<Reminder | null>(null);
  const [busy, setBusy] = useState(false);
  const [toasts, setToasts] = useState<{ id: number; heard: string; text: string; undo?: Msg['undo'] }[]>([]);
  const lastHeard = useRef('');
  const openRef = useRef(false);
  openRef.current = open;
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressed = useRef(false);
  const pending = useRef<Intent | null>(null);
  const recRef = useRef<any>(null);
  const msgId = useRef(0);
  const listEnd = useRef<HTMLDivElement>(null);
  const supportsVoice = typeof window !== 'undefined' && Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  const firstName = (userName || '').split(' ')[0];
  const botName = name || 'Secretário';

  useEffect(() => setVoiceOn(readPref('ritmo_assistant_voice', true)), []);

  const loadAssistant = useCallback(async () => {
    const r = await callApi<{ name?: string; reminders?: Reminder[] }>('/api/assistant');
    if (r.ok) {
      setName(r.data.name || '');
      setReminders(r.data.reminders || []);
    }
  }, []);
  useEffect(() => {
    loadAssistant();
  }, [loadAssistant]);

  useEffect(() => {
    listEnd.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [msgs, interim]);

  const say = useCallback(
    (text: string, undo?: Msg['undo']) => {
      const id = ++msgId.current;
      setMsgs((m) => [...m.slice(-40), { id, from: 'bot', text, undo }]);
      // com a conversa fechada, a resposta aparece como notificação no topo da tela
      if (!openRef.current) {
        const heard = lastHeard.current;
        lastHeard.current = '';
        setToasts((t) => [...t.slice(-2), { id, heard, text, undo }]);
        setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), undo ? 15000 : 9000);
      }
      if (voiceOn) speak(text);
    },
    [voiceOn]
  );

  /* ---------- lembrete tocando com o app aberto ---------- */
  useEffect(() => {
    const check = () => {
      let alerted: number[] = [];
      try { alerted = JSON.parse(localStorage.getItem('ritmo_reminders_alerted') || '[]'); } catch {}
      const due = reminders.find((r) => new Date(r.remindAt).getTime() <= Date.now() && Date.now() - new Date(r.remindAt).getTime() < 3 * 3600_000 && !alerted.includes(r.id));
      if (due) {
        setAlert(due);
        try { localStorage.setItem('ritmo_reminders_alerted', JSON.stringify([...alerted, due.id].slice(-200))); } catch {}
        if (readPref('ritmo_assistant_voice', true)) speak(`${firstName ? firstName + ', ' : ''}lembrete: ${due.text}`);
      }
    };
    check();
    const t = setInterval(check, 20_000);
    return () => clearInterval(t);
  }, [reminders, firstName]);

  const doneReminder = async (id: number) => {
    await callApi('/api/assistant', { action: 'done_reminder', id });
    setReminders((list) => list.filter((r) => r.id !== id));
    if (alert?.id === id) setAlert(null);
  };

  /* ---------- ações ---------- */

  const today = () => ymd(new Date());
  const pushTip = () => (typeof Notification !== 'undefined' && Notification.permission !== 'granted' ? ' Dica: ligue as notificações no sino para eu te avisar mesmo com o app fechado.' : '');

  const addReminder = async (text: string, at: Date, taskId: number | null = null) => {
    const r = await callApi<{ reminder?: Reminder; error?: string }>('/api/assistant', { action: 'add_reminder', text, remindAt: at.toISOString(), taskId });
    if (r.ok && r.data.reminder) {
      setReminders((list) => [...list, r.data.reminder!].sort((a, b) => a.remindAt.localeCompare(b.remindAt)));
      return r.data.reminder;
    }
    throw new Error(r.data.error || 'Não consegui criar o lembrete.');
  };

  const run = async (intent: Intent): Promise<void> => {
    const now = new Date();
    switch (intent.kind) {
      case 'expense':
      case 'income': {
        if (intent.amountCents === null) {
          pending.current = intent;
          return say(intent.kind === 'income' ? `Quanto você recebeu de ${intent.description.toLowerCase()}?` : `Qual foi o valor de ${intent.description.toLowerCase()}?`);
        }
        const res = await fetch('/api/finance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: intent.kind, description: intent.description, amountCents: intent.amountCents, date: intent.date, category: intent.category, paymentMethod: 'pix', status: intent.kind === 'income' ? 'received' : 'paid', source: 'web' }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return say(data.error || 'Não consegui lançar agora.');
        onDataChanged();
        const id = data.transaction?.id;
        return say(
          `${intent.kind === 'income' ? 'Entrada lançada' : 'Gasto lançado'}: ${brl(intent.amountCents)} em ${intent.description} (${CATEGORY_LABEL[intent.category] || intent.category}), ${dayLabel(intent.date, now)}.`,
          id ? { label: 'Desfazer', run: async () => { await fetch(`/api/finance?id=${id}`, { method: 'DELETE' }); onDataChanged(); say('Pronto, apaguei esse lançamento.'); } } : undefined
        );
      }

      case 'appointment': {
        if (!intent.date && !intent.time) {
          pending.current = intent;
          return say(`Para quando é ${intent.title.toLowerCase()}? Pode falar "amanhã às 15h", por exemplo.`);
        }
        const when = resolveDateTime(intent.date, intent.time, now);
        const res = await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: intent.title, date: when.date, startTime: intent.time || '', timeBlock: timeBlockFor(intent.time), category: 'pessoal', priority: 'media', estimatedMinutes: 60 }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return say(data.error || 'Não consegui agendar agora.');
        onDataChanged();
        const taskId = data.task?.id ?? null;
        let reminderId: number | null = null;
        let extra = '';
        if (intent.time) {
          const before = new Date(when.at.getTime() - 30 * 60_000);
          const at = before.getTime() > now.getTime() ? before : when.at.getTime() > now.getTime() ? when.at : null;
          if (at) {
            try {
              reminderId = (await addReminder(`${intent.title} às ${timeLabel(intent.time)}`, at, taskId)).id;
              extra = at === before ? ' Te aviso 30 minutos antes.' : ' Te aviso na hora.';
            } catch {}
          }
        }
        return say(
          `Agendei ${intent.title} ${dayLabel(when.date, now)}${intent.time ? ` às ${timeLabel(intent.time)}` : ''}.${extra}${extra ? pushTip() : ''}`,
          taskId
            ? { label: 'Desfazer', run: async () => { await fetch(`/api/tasks?id=${taskId}`, { method: 'DELETE' }); if (reminderId) await doneReminder(reminderId); onDataChanged(); say('Desmarquei esse compromisso.'); } }
            : undefined
        );
      }

      case 'reminder': {
        if (!intent.text) return say('Do que você quer que eu te lembre?');
        if (!intent.date && !intent.time) {
          pending.current = intent;
          return say(`Quando devo te lembrar de ${intent.text.toLowerCase()}?`);
        }
        const when = resolveDateTime(intent.date, intent.time, now);
        if (when.at.getTime() < now.getTime() - 60_000) return say('Esse horário já passou. Me diga outro horário.');
        try {
          const r = await addReminder(intent.text, when.at);
          return say(`Combinado! Vou te lembrar de ${intent.text.toLowerCase()} ${dayLabel(when.date, now)} às ${timeLabel(when.time)}.${pushTip()}`, {
            label: 'Desfazer',
            run: async () => { await doneReminder(r.id); say('Lembrete cancelado.'); },
          });
        } catch (e: any) {
          return say(e.message);
        }
      }

      case 'task': {
        const res = await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: intent.title, date: intent.date, timeBlock: 'Flexível', category: 'geral', priority: 'media' }) });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) return say(data.error || 'Não consegui criar a tarefa.');
        onDataChanged();
        const id = data.task?.id;
        return say(`Anotei a tarefa "${intent.title}" para ${dayLabel(intent.date, now)}.`, id ? { label: 'Desfazer', run: async () => { await fetch(`/api/tasks?id=${id}`, { method: 'DELETE' }); onDataChanged(); say('Tarefa apagada.'); } } : undefined);
      }

      case 'habit_done': {
        const active = habits.filter((h) => h.isActive !== false);
        const want = fold(intent.name);
        const habit = active.find((h) => fold(h.name) === want) || active.find((h) => fold(h.name).includes(want) || want.includes(fold(h.name)));
        if (!habit) return say(active.length ? `Não achei esse hábito. Os seus são: ${active.map((h) => h.name).join(', ')}.` : 'Você ainda não tem hábitos cadastrados. Crie na aba Hábitos & Saúde.');
        const r = await callApi('/api/habits', { action: 'toggle_log', habitId: habit.id, date: today(), completed: true });
        if (!r.ok) return say((r.data as any).error || 'Não consegui marcar o hábito.');
        onDataChanged();
        return say(`Marquei "${habit.name}" como feito hoje. Mandou bem!`, {
          label: 'Desfazer',
          run: async () => { await callApi('/api/habits', { action: 'toggle_log', habitId: habit.id, date: today(), completed: false }); onDataChanged(); say('Desmarquei.'); },
        });
      }

      case 'agenda': {
        const items = tasks
          .filter((t) => t.date === intent.date)
          .sort((a, b) => (a.startTime || '99').localeCompare(b.startTime || '99'));
        const rem = reminders.filter((r) => ymd(new Date(r.remindAt)) === intent.date);
        const label = dayLabel(intent.date, now);
        if (!items.length && !rem.length) return say(`Nada marcado para ${label}. Dia livre!`);
        const open = items.filter((t) => !t.completed);
        const parts = open.slice(0, 8).map((t) => (t.startTime ? `${timeLabel(t.startTime)} ${t.title}` : t.title));
        const done = items.length - open.length;
        let txt = open.length ? `Para ${label} você tem ${open.length} ${open.length === 1 ? 'item' : 'itens'}: ${parts.join('; ')}.` : `Tudo concluído para ${label}.`;
        if (done && open.length) txt += ` Já concluiu ${done}.`;
        if (rem.length) txt += ` E ${rem.length} ${rem.length === 1 ? 'lembrete' : 'lembretes'}: ${rem.slice(0, 5).map((r) => `${timeLabel(new Date(r.remindAt).toTimeString().slice(0, 5))} ${r.text}`).join('; ')}.`;
        return say(txt);
      }

      case 'spent': {
        const t = today();
        const d = new Date();
        const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7), 12);
        const yest = ymd(new Date(d.getFullYear(), d.getMonth(), d.getDate() - 1, 12));
        const inPeriod = (date: string) =>
          intent.period === 'hoje' ? date === t : intent.period === 'ontem' ? date === yest : intent.period === 'semana' ? date >= ymd(monday) && date <= t : date.slice(0, 7) === t.slice(0, 7);
        const list = transactions.filter((x) => x.type === 'expense' && inPeriod(x.date));
        const total = list.reduce((a, x) => a + x.amountCents, 0);
        const label = { hoje: 'hoje', ontem: 'ontem', semana: 'nesta semana', mes: 'neste mês' }[intent.period];
        if (!list.length) return say(`Nenhum gasto lançado ${label}.`);
        const byCat = new Map<string, number>();
        list.forEach((x) => byCat.set(x.category, (byCat.get(x.category) || 0) + x.amountCents));
        const [topCat, topVal] = [...byCat.entries()].sort((a, b) => b[1] - a[1])[0];
        return say(`Você gastou ${brl(total)} ${label}, em ${list.length} ${list.length === 1 ? 'lançamento' : 'lançamentos'}. O maior peso foi ${CATEGORY_LABEL[topCat] || topCat}: ${brl(topVal)}.`);
      }

      case 'balance': {
        const m = today().slice(0, 7);
        const month = transactions.filter((x) => x.date.slice(0, 7) === m);
        const inc = month.filter((x) => x.type === 'income').reduce((a, x) => a + x.amountCents, 0);
        const exp = month.filter((x) => x.type === 'expense').reduce((a, x) => a + x.amountCents, 0);
        const bal = inc - exp;
        return say(`Neste mês: entraram ${brl(inc)} e saíram ${brl(exp)}. ${bal >= 0 ? `Sobram ${brl(bal)}.` : `Está ${brl(-bal)} no negativo.`}`);
      }

      case 'bills': {
        const t = today();
        const limit = ymd(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 12));
        const due = transactions
          .filter((x) => x.type === 'expense' && (x.status === 'pending' || x.status === 'overdue') && x.dueDate && x.dueDate <= limit)
          .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
        if (!due.length) return say('Nenhuma conta vencendo nos próximos 7 dias.');
        return say(`Contas a pagar: ${due.slice(0, 6).map((x) => `${x.description}, ${brl(x.amountCents)}, ${x.dueDate! < t ? 'atrasada' : dayLabel(x.dueDate!, now)}`).join('; ')}.`);
      }

      case 'points': {
        if (!xp) return say('Ainda estou calculando seus pontos. Tente de novo em instantes.');
        return say(`Você tem ${xp.level.xp.toLocaleString('pt-BR')} pontos e está no nível ${xp.level.level}, ${xp.level.name}.${xp.level.nextName ? ` Faltam ${xp.level.xpToNext} para ${xp.level.nextName}.` : ''} Hoje você fez ${xp.todayXp}.`);
      }

      case 'reminders': {
        const next = reminders.filter((r) => new Date(r.remindAt).getTime() > now.getTime());
        if (!next.length) return say('Você não tem lembretes marcados.');
        return say(`Seus lembretes: ${next.slice(0, 6).map((r) => { const d = new Date(r.remindAt); return `${r.text}, ${dayLabel(ymd(d), now)} às ${timeLabel(d.toTimeString().slice(0, 5))}`; }).join('; ')}.`);
      }

      case 'start_workout': {
        if (!hasConsent('gps')) {
          onNavigate('treino');
          return say('Antes do primeiro treino, permita a localização na aba Treino. Depois é só pedir de novo.');
        }
        if (recorder.getState().status !== 'idle') {
          onNavigate('treino');
          return say('Você já tem um treino em andamento. Abri a aba Treino.');
        }
        recorder.start(intent.sport);
        onNavigate('treino');
        setOpen(false);
        return say(`Bora! Gravando sua ${SPORTS[intent.sport].label.toLowerCase()}. Bom treino!`);
      }

      case 'start_focus': {
        onStartFocus(intent.minutes, intent.topic);
        setOpen(false);
        return say(`Abri uma sessão de foco de ${intent.minutes} minutos${intent.topic ? ` em ${intent.topic}` : ''}. É só tocar em iniciar.`);
      }

      case 'open_tab': {
        onNavigate(intent.tab);
        setOpen(false);
        return say('Abrindo.');
      }

      case 'briefing': {
        const h = now.getHours();
        const hello = h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite';
        const t = today();
        const open = tasks.filter((x) => x.date === t && !x.completed).sort((a, b) => (a.startTime || '99').localeCompare(b.startTime || '99'));
        const nextTimed = open.find((x) => x.startTime && x.startTime >= `${String(h).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
        const doneToday = new Set(habitLogs.filter((l) => l.date === t && l.completed).map((l) => l.habitId));
        const pendingHabits = habits.filter((x) => x.isActive !== false && !doneToday.has(x.id));
        const limit = ymd(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 3, 12));
        const bills = transactions.filter((x) => x.type === 'expense' && (x.status === 'pending' || x.status === 'overdue') && x.dueDate && x.dueDate <= limit);
        const parts = [`${hello}${firstName ? `, ${firstName}` : ''}!`];
        parts.push(open.length ? `Hoje você tem ${open.length} ${open.length === 1 ? 'tarefa' : 'tarefas'} em aberto.` : 'Nenhuma tarefa pendente para hoje.');
        if (nextTimed) parts.push(`O próximo compromisso é ${nextTimed.title} às ${timeLabel(nextTimed.startTime!)}.`);
        if (pendingHabits.length) parts.push(`Faltam ${pendingHabits.length} ${pendingHabits.length === 1 ? 'hábito' : 'hábitos'}: ${pendingHabits.slice(0, 3).map((x) => x.name).join(', ')}.`);
        if (bills.length) parts.push(`${bills.length === 1 ? 'Uma conta vence' : `${bills.length} contas vencem`} até ${dayLabel(limit, now)}.`);
        parts.push('Um passo de cada vez.');
        return say(parts.join(' '));
      }

      case 'help':
        return say(`Eu lanço gastos e entradas, agendo compromissos, crio lembretes e tarefas, marco hábitos, conto o que você tem no dia, quanto gastou e começo treinos e focos. Experimente: "${EXAMPLES[0]}", "${EXAMPLES[1]}" ou "${EXAMPLES[2]}".`);
      case 'thanks':
        return say(`Por nada${firstName ? `, ${firstName}` : ''}! Tô aqui.`);
      case 'cancel':
        pending.current = null;
        return say('Tudo bem, deixei pra lá.');
      default:
        return say(`Não entendi bem. Você pode dizer, por exemplo: "${EXAMPLES[Math.floor(Math.random() * EXAMPLES.length)]}".`);
    }
  };

  const handle = async (raw: string) => {
    const text = raw.trim();
    if (!text || busy) return;
    setMsgs((m) => [...m.slice(-40), { id: ++msgId.current, from: 'me', text }]);
    lastHeard.current = text;
    setInput('');
    setInterim('');
    setBusy(true);
    try {
      let intent: Intent | null = null;
      if (pending.current) {
        intent = completeWith(pending.current, text);
        pending.current = null;
      }
      if (!intent) intent = parseCommand(text, new Date(), name || '');
      await run(intent);
    } catch {
      say('Ops, algo deu errado. Tente de novo.');
    } finally {
      setBusy(false);
    }
  };

  /* ---------- microfone ---------- */
  const [askVoice, setAskVoice] = useState(false);
  useEffect(() => {
    loadConsents();
  }, []);
  const toggleMic = (skipConsent = false) => {
    if (listening) {
      recRef.current?.stop();
      return;
    }
    if (!skipConsent && !hasConsent('voz')) {
      setAskVoice(true);
      return;
    }
    const rec = getRecognition();
    if (!rec) {
      say('Seu navegador não tem reconhecimento de voz. Digite aqui embaixo, ou use o Chrome no Android ou o Safari no iPhone.');
      return;
    }
    try { window.speechSynthesis?.cancel(); } catch {}
    rec.lang = 'pt-BR';
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;
    let finalText = '';
    rec.onresult = (e: any) => {
      let inter = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript;
        else inter += r[0].transcript;
      }
      setInterim(inter || finalText);
    };
    rec.onerror = (e: any) => {
      setListening(false);
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') say('Preciso de permissão para usar o microfone. Libere nas configurações do navegador.');
      else if (e.error === 'no-speech') setInterim('');
    };
    rec.onend = () => {
      setListening(false);
      if (finalText.trim()) handle(finalText);
      else setInterim('');
    };
    recRef.current = rec;
    setListening(true);
    setInterim('');
    try {
      rec.start();
    } catch {
      setListening(false);
    }
  };

  const openPanel = () => {
    setOpen(true);
    if (name === '') setNaming(true);
    else if (msgs.length === 0) {
      const h = new Date().getHours();
      setMsgs([{ id: ++msgId.current, from: 'bot', text: `${h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'}${firstName ? `, ${firstName}` : ''}! Sou ${name || 'seu secretário'}. Toque no microfone e fale, ou digite. Diga "resumo do dia" para eu te contar o que tem hoje.` }]);
    }
  };

  const saveName = async (n: string) => {
    const r = await callApi<{ name?: string; error?: string }>('/api/assistant', { action: 'set_name', name: n });
    if (!r.ok) return;
    const nn = r.data.name || n;
    const wasNaming = naming;
    setName(nn);
    setNaming(false);
    setSettings(false);
    if (wasNaming) setOpen(false);
    openRef.current = wasNaming ? false : openRef.current;
    say(`Prazer${firstName ? `, ${firstName}` : ''}! Agora eu sou ${nn}. É só tocar no meu botão e falar: eu lanço gastos, agendo compromissos, crio lembretes e te conto como está o seu dia.`);
  };

  const upcoming = reminders.filter((r) => new Date(r.remindAt).getTime() > Date.now()).slice(0, 3);

  return (
    <>
      {askVoice && (
        <ConsentPrompt
          kind="voz"
          onCancel={() => setAskVoice(false)}
          onAccept={() => {
            setAskVoice(false);
            toggleMic(true);
          }}
        />
      )}

      {/* lembrete tocando */}
      {alert && (
        <div role="alertdialog" aria-label="Lembrete" className="fixed z-[75] top-20 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-amber-400/50 bg-[#161b22] shadow-2xl shadow-black/50 p-4 ritmo-level-pop">
          <div className="flex items-start gap-3">
            <span className="w-10 h-10 rounded-full bg-amber-400/15 text-amber-300 flex items-center justify-center shrink-0"><Bell className="w-5 h-5" /></span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-300">{botName} lembrando</p>
              <p className="text-sm font-semibold text-[#f0f6fc] break-words">{alert.text}</p>
            </div>
          </div>
          <div className="mt-3 flex gap-2 justify-end">
            <button type="button" onClick={() => setAlert(null)} className="px-3 py-1.5 rounded-lg text-sm text-[#8b949e] hover:text-white">Fechar</button>
            <button type="button" onClick={() => doneReminder(alert.id)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold"><Check className="w-4 h-4" /> Feito</button>
          </div>
        </div>
      )}

      {/* notificações com as respostas (conversa fechada) */}
      {!open && toasts.length > 0 && (
        <div className="fixed z-[70] top-3 left-1/2 -translate-x-1/2 w-[calc(100%-1.5rem)] max-w-md space-y-2" aria-live="polite">
          {toasts.map((t) => (
            <div key={t.id} className="rounded-2xl border border-emerald-500/40 bg-[#161b22]/95 backdrop-blur shadow-2xl shadow-black/50 p-3.5 ritmo-level-pop">
              <div className="flex items-start gap-3">
                <span className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 text-[#0d1117] flex items-center justify-center font-extrabold shrink-0">{(name || 'S')[0].toUpperCase()}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-emerald-400">{botName}</p>
                  {t.heard && <p className="text-xs text-[#8b949e] italic truncate">“{t.heard}”</p>}
                  <p className="text-sm text-[#f0f6fc] break-words">{t.text}</p>
                  {t.undo && (
                    <button
                      type="button"
                      onClick={async () => {
                        const u = t.undo!;
                        setToasts((list) => list.filter((x) => x.id !== t.id));
                        await u.run();
                      }}
                      className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:underline"
                    >
                      <Undo2 className="w-3.5 h-3.5" /> {t.undo.label}
                    </button>
                  )}
                </div>
                <button type="button" onClick={() => setToasts((list) => list.filter((x) => x.id !== t.id))} aria-label="Fechar notificação" className="p-1 text-[#6e7681] hover:text-white"><X className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* botão flutuante: toque = falar · segurar = abrir a conversa */}
      {!open && (
        <div className="fixed z-50 bottom-5 left-5 flex items-end gap-2">
          {(listening || busy) && (
            <div className="absolute bottom-16 left-0 w-[min(80vw,320px)] rounded-2xl rounded-bl-md border border-[#30363d] bg-[#161b22]/95 backdrop-blur px-3.5 py-2.5 shadow-xl text-sm">
              <p className="text-[11px] font-bold text-rose-300">{listening ? 'Ouvindo... fale agora' : 'Entendendo...'}</p>
              <p className="text-[#f0f6fc] italic break-words">{interim || (listening ? 'Ex.: “gastei 30 reais no almoço”' : '')}</p>
            </div>
          )}
          <button
            type="button"
            onPointerDown={() => {
              longPressed.current = false;
              pressTimer.current = setTimeout(() => {
                longPressed.current = true;
                openPanel();
              }, 650);
            }}
            onPointerUp={() => {
              if (pressTimer.current) clearTimeout(pressTimer.current);
              if (longPressed.current) return;
              if (name === '' || !supportsVoice) openPanel();
              else toggleMic();
            }}
            onPointerLeave={() => pressTimer.current && clearTimeout(pressTimer.current)}
            onContextMenu={(e) => e.preventDefault()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (name === '' || !supportsVoice) openPanel();
                else toggleMic();
              }
            }}
            aria-label={listening ? 'Parar e enviar' : `Falar com ${botName}`}
            className={`relative h-16 w-16 sm:w-auto sm:pl-3 sm:pr-5 rounded-full font-bold shadow-xl inline-flex items-center justify-center gap-2 select-none touch-manipulation transition-transform active:scale-95 ${
              listening ? 'bg-rose-500 text-white shadow-rose-500/30 animate-pulse' : 'bg-gradient-to-tr from-emerald-600 to-teal-400 text-[#0d1117] shadow-emerald-500/25'
            }`}
          >
            <span className="w-10 h-10 rounded-full bg-black/10 flex items-center justify-center">{listening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}</span>
            <span className="hidden sm:inline text-sm">{listening ? 'Ouvindo...' : name || 'Secretário'}</span>
            {upcoming.length > 0 && !listening && <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-amber-400 text-[#0d1117] text-[10px] font-extrabold flex items-center justify-center border-2 border-[#0d1117]">{upcoming.length}</span>}
          </button>
          <button type="button" onClick={openPanel} aria-label={`Abrir conversa com ${botName}`} title="Conversa, lembretes e ajustes" className="mb-1 w-9 h-9 rounded-full bg-[#161b22] border border-[#30363d] text-[#8b949e] hover:text-white flex items-center justify-center shadow-lg">
            <MessageSquareText className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* painel */}
      {open && (
        <div className="fixed z-[60] inset-x-0 bottom-0 sm:inset-auto sm:bottom-5 sm:left-5 sm:w-[400px] h-[78vh] sm:h-[620px] flex flex-col rounded-t-3xl sm:rounded-3xl border border-[#30363d] bg-[#0d1117] shadow-2xl shadow-black/60" role="dialog" aria-label={`Conversa com ${botName}`}>
          <header className="flex items-center gap-3 px-4 py-3 border-b border-[#21262d]">
            <span className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 to-teal-400 text-[#0d1117] flex items-center justify-center font-extrabold">{(name || 'S')[0].toUpperCase()}</span>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-[#f0f6fc] truncate">{botName}</p>
              <p className="text-[11px] text-emerald-400">{listening ? 'Ouvindo...' : busy ? 'Pensando...' : 'Seu secretário no Ritmo'}</p>
            </div>
            <button type="button" onClick={() => { const v = !voiceOn; setVoiceOn(v); try { localStorage.setItem('ritmo_assistant_voice', v ? '1' : '0'); } catch {} if (!v) window.speechSynthesis?.cancel(); }} aria-label={voiceOn ? 'Desligar resposta em voz' : 'Ligar resposta em voz'} title={voiceOn ? 'Respondendo em voz' : 'Voz desligada'} className="p-2 rounded-full text-[#8b949e] hover:text-white hover:bg-[#21262d]">
              {voiceOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
            <button type="button" onClick={() => { setSettings(!settings); setNameDraft(name || ''); }} aria-label="Ajustes do secretário" className="p-2 rounded-full text-[#8b949e] hover:text-white hover:bg-[#21262d]"><Settings2 className="w-5 h-5" /></button>
            <button type="button" onClick={() => { setOpen(false); recRef.current?.stop(); window.speechSynthesis?.cancel(); }} aria-label="Fechar" className="p-2 rounded-full text-[#8b949e] hover:text-white hover:bg-[#21262d]"><X className="w-5 h-5" /></button>
          </header>

          {(naming || settings) && (
            <div className="px-4 py-4 border-b border-[#21262d] bg-[#161b22] space-y-3">
              <p className="text-sm font-semibold text-[#f0f6fc]">{naming ? 'Como você quer chamar o seu secretário?' : 'Nome do secretário'}</p>
              <div className="flex flex-wrap gap-2">
                {NAME_SUGGESTIONS.map((s) => (
                  <button key={s} type="button" onClick={() => setNameDraft(s)} className={`px-3 py-1 rounded-full border text-sm ${nameDraft === s ? 'border-emerald-500 text-emerald-300 bg-emerald-500/10' : 'border-[#30363d] text-[#c9d1d9]'}`}>{s}</button>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} maxLength={ASSISTANT_NAME_MAX} placeholder="Ou escreva um nome" className="flex-1 bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-[#f0f6fc] focus:outline-none focus:border-emerald-500" />
                <button type="button" disabled={!nameDraft.trim()} onClick={() => saveName(nameDraft)} className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-sm font-semibold">Salvar</button>
              </div>
              <div className="pt-1">
                <p className="text-xs text-[#8b949e] mb-1.5">Notificações: ligue para eu te avisar dos lembretes mesmo com o app fechado.</p>
                <PushToggle compact />
              </div>
              {settings && reminders.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-[#8b949e] mb-1.5">Lembretes ativos</p>
                  <ul className="space-y-1 max-h-36 overflow-y-auto">
                    {reminders.map((r) => {
                      const d = new Date(r.remindAt);
                      return (
                        <li key={r.id} className="flex items-center gap-2 text-sm">
                          <span className="flex-1 min-w-0 truncate text-[#c9d1d9]">{r.text}</span>
                          <span className="text-[11px] text-[#8b949e] whitespace-nowrap">{dayLabel(ymd(d))} {timeLabel(d.toTimeString().slice(0, 5))}</span>
                          <button type="button" onClick={() => doneReminder(r.id)} aria-label="Apagar lembrete" className="p-1 text-[#6e7681] hover:text-rose-400"><X className="w-3.5 h-3.5" /></button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {msgs.map((m) => (
              <div key={m.id} className={`flex ${m.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap break-words ${m.from === 'me' ? 'bg-emerald-600 text-white rounded-br-md' : 'bg-[#161b22] border border-[#21262d] text-[#e6edf3] rounded-bl-md'}`}>
                  {m.text}
                  {m.undo && (
                    <button
                      type="button"
                      onClick={async () => {
                        const u = m.undo!;
                        setMsgs((list) => list.map((x) => (x.id === m.id ? { ...x, undo: undefined } : x)));
                        await u.run();
                      }}
                      className="mt-1.5 flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:underline"
                    >
                      <Undo2 className="w-3.5 h-3.5" /> {m.undo.label}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {interim && <div className="flex justify-end"><div className="max-w-[85%] rounded-2xl px-3.5 py-2 text-sm bg-emerald-600/40 text-white/90 italic">{interim}</div></div>}
            {!naming && msgs.length <= 1 && (
              <div className="pt-1">
                <p className="text-[11px] text-[#6e7681] mb-1.5 flex items-center gap-1"><Sparkles className="w-3 h-3" /> Experimente</p>
                <div className="flex flex-wrap gap-1.5">
                  {['Resumo do dia', ...EXAMPLES].map((e) => (
                    <button key={e} type="button" onClick={() => handle(e)} className="px-2.5 py-1 rounded-full border border-[#30363d] text-xs text-[#c9d1d9] hover:border-emerald-500/60">{e}</button>
                  ))}
                </div>
              </div>
            )}
            <div ref={listEnd} />
          </div>

          <div className="px-3 pb-[max(env(safe-area-inset-bottom),12px)] pt-2 border-t border-[#21262d] space-y-2">
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handle(input)}
                placeholder={`Fale ou escreva para ${botName}...`}
                maxLength={300}
                className="flex-1 min-w-0 bg-[#161b22] border border-[#30363d] rounded-full px-4 py-2.5 text-sm text-[#f0f6fc] focus:outline-none focus:border-emerald-500"
                aria-label="Mensagem"
              />
              {input.trim() ? (
                <button type="button" onClick={() => handle(input)} aria-label="Enviar" className="w-12 h-12 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shrink-0"><Send className="w-5 h-5" /></button>
              ) : (
                <button
                  type="button"
                  onClick={() => toggleMic()}
                  aria-label={listening ? 'Parar de ouvir' : 'Falar'}
                  className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-white ${listening ? 'bg-rose-500 animate-pulse' : supportsVoice ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-[#30363d]'}`}
                >
                  {listening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
