import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Download, Flame, Sparkles, Sun, Moon, LogOut, User, X, Check, Info, Target, Heart, Calendar, Clock, CheckCircle2, Circle, ArrowRight, Coffee, Play, DollarSign, AlertCircle, ChevronLeft, ChevronRight, Plus, RotateCcw, Edit2, Trash2, PhoneOff, Droplet, BookOpen, Activity, Pause, Volume2, VolumeX, Lock, Zap, Smile, ArrowDownLeft, ArrowUpRight, Wallet, Search, Smartphone, RefreshCw, Send, ShieldCheck, FileSpreadsheet, Key, Share2, Copy, Shield, Sliders, TrendingUp, Award, AlertTriangle, Bell, Loader2, LayoutGrid, Tag, CalendarDays, CheckSquare, Pencil, MessageSquare, Settings } from "lucide-react";
import { A as AuthModal } from "./AuthModal-i7J_fnp1.js";
const InstallPwaButton = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);
  useEffect(() => {
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const handleInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);
  if (!deferredPrompt || installed) return null;
  const handleInstall = async () => {
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };
  return /* @__PURE__ */ jsxs(
    "button",
    {
      onClick: handleInstall,
      title: "Instalar o Ritmo como app",
      className: "hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161b22] border border-[#30363d] hover:border-emerald-500/50 text-[#8b949e] hover:text-emerald-400 text-xs font-medium transition-colors",
      children: [
        /* @__PURE__ */ jsx(Download, { className: "w-3.5 h-3.5" }),
        "Instalar app"
      ]
    }
  );
};
const Header = ({
  user,
  activeCycle,
  theme,
  onToggleTheme,
  onOpenAuth,
  onLogout,
  onOpenOnboarding
}) => {
  let cycleDayInfo = "Sem ciclo ativo";
  let cycleProgress = 0;
  if (activeCycle) {
    const start = new Date(activeCycle.startDate);
    const today = /* @__PURE__ */ new Date();
    const diffTime = today.getTime() - start.getTime();
    const currentDay = Math.max(1, Math.min(activeCycle.durationDays, Math.floor(diffTime / (1e3 * 60 * 60 * 24)) + 1));
    cycleProgress = Math.round(currentDay / activeCycle.durationDays * 100);
    cycleDayInfo = `Dia ${currentDay} de ${activeCycle.durationDays}`;
  }
  return /* @__PURE__ */ jsx("header", { className: "sticky top-0 z-40 border-b border-[#30363d] bg-[#0d1117]/90 backdrop-blur-md px-4 sm:px-6 py-3", children: /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto flex items-center justify-between gap-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
      /* @__PURE__ */ jsx("div", { className: "w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-amber-500 flex items-center justify-center shadow-lg shadow-emerald-500/10", children: /* @__PURE__ */ jsx(Flame, { className: "w-5 h-5 text-white animate-pulse" }) }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsx("span", { className: "font-extrabold text-xl tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 bg-clip-text text-transparent", children: "Ritmo" }),
          /* @__PURE__ */ jsx("span", { className: "text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 tracking-wider", children: "Modo Foco" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-[#8b949e] hidden sm:block", children: "Foco, Hábitos & Organização Financeira Equilibrada" })
      ] })
    ] }),
    activeCycle ? /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: onOpenOnboarding,
        className: "hidden md:flex items-center gap-3 px-3.5 py-1.5 rounded-lg bg-[#161b22] border border-[#30363d] hover:border-emerald-500/50 transition-all text-left",
        children: [
          /* @__PURE__ */ jsxs("div", { className: "flex flex-col", children: [
            /* @__PURE__ */ jsxs("span", { className: "text-xs font-semibold text-emerald-400 flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsx("span", { className: "w-2 h-2 rounded-full bg-emerald-500 animate-ping" }),
              cycleDayInfo
            ] }),
            /* @__PURE__ */ jsx("span", { className: "text-[11px] text-[#8b949e] truncate max-w-[200px]", children: activeCycle.mainGoal })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "w-16 bg-[#21262d] h-2 rounded-full overflow-hidden", children: /* @__PURE__ */ jsx(
            "div",
            {
              className: "bg-emerald-500 h-full rounded-full transition-all duration-500",
              style: { width: `${cycleProgress}%` }
            }
          ) })
        ]
      }
    ) : /* @__PURE__ */ jsxs(
      "button",
      {
        onClick: onOpenOnboarding,
        className: "hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 text-xs font-medium transition-colors",
        children: [
          /* @__PURE__ */ jsx(Sparkles, { className: "w-3.5 h-3.5" }),
          "Iniciar Ciclo de Foco (7 a 90 dias)"
        ]
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsx(InstallPwaButton, {}),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: onToggleTheme,
          title: theme === "dark" ? "Mudar para modo claro" : "Mudar para modo escuro",
          className: "p-2 rounded-lg text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d] transition-colors",
          children: theme === "dark" ? /* @__PURE__ */ jsx(Sun, { className: "w-4 h-4" }) : /* @__PURE__ */ jsx(Moon, { className: "w-4 h-4 text-amber-400" })
        }
      ),
      user ? /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        user.role === "admin" && /* @__PURE__ */ jsx("a", { href: "/admin", className: "hidden sm:inline text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30 hover:bg-amber-500/20", children: "Admin" }),
        /* @__PURE__ */ jsx("a", { href: "/checkout", className: "hidden sm:inline text-xs font-medium px-3 py-1.5 rounded-lg text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d]", children: "Assinatura" }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#161b22] border border-[#30363d]", children: [
          /* @__PURE__ */ jsx("div", { className: "w-6 h-6 rounded-full bg-emerald-900/60 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-xs font-bold", children: user.name.charAt(0).toUpperCase() }),
          /* @__PURE__ */ jsx("span", { className: "text-xs font-medium text-[#f0f6fc] hidden sm:inline max-w-[120px] truncate", children: user.name })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: onLogout,
            title: "Sair da conta",
            className: "p-2 rounded-lg text-[#8b949e] hover:text-rose-400 hover:bg-rose-950/20 transition-colors",
            children: /* @__PURE__ */ jsx(LogOut, { className: "w-4 h-4" })
          }
        )
      ] }) : /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: onOpenAuth,
          className: "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors",
          children: [
            /* @__PURE__ */ jsx(User, { className: "w-3.5 h-3.5" }),
            "Entrar / Cadastrar"
          ]
        }
      )
    ] })
  ] }) });
};
const PRESET_HABITS = [
  "Movimento ou exercício físico diário",
  "Leitura ou estudo focado (30 min)",
  "Meditação, respiração consciente ou oração",
  "Sono e horário de descanso regulado (7-8h)",
  "Hidratação consciente ao longo do dia",
  "Desconexão digital matinal (sem redes sociais até o almoço)"
];
const OnboardingModal = ({
  isOpen,
  onClose,
  onSaveCycle,
  existingCycle
}) => {
  const [step, setStep] = useState(1);
  const [durationDays, setDurationDays] = useState(
    existingCycle?.durationDays || 40
  );
  const [title, setTitle] = useState(existingCycle?.title || "");
  const [mainGoal, setMainGoal] = useState(
    existingCycle?.mainGoal || "Concluir projeto principal e estabilizar rotina"
  );
  const [secondaryGoalInput, setSecondaryGoalInput] = useState("");
  const [secondaryGoals, setSecondaryGoals] = useState(
    existingCycle?.secondaryGoals || ["Ler 2 livros técnicos", "Organizar finanças mensais"]
  );
  const [startDate, setStartDate] = useState(
    existingCycle?.startDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
  );
  const [routineLevel, setRoutineLevel] = useState(
    existingCycle?.routineLevel || "equilibrado"
  );
  const [preferredTimes, setPreferredTimes] = useState(
    existingCycle?.preferredTimes || "Manhã (07h - 11h) e Tarde (14h - 18h)"
  );
  const [digitalLimits, setDigitalLimits] = useState(
    existingCycle?.digitalLimits || "Instagram e TikTok limitados a 30 min após as 19h; telas desligadas às 22h."
  );
  const [selectedHabits, setSelectedHabits] = useState(PRESET_HABITS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  if (!isOpen) return null;
  const handleAddSecondaryGoal = () => {
    if (secondaryGoalInput.trim() && secondaryGoals.length < 5) {
      setSecondaryGoals([...secondaryGoals, secondaryGoalInput.trim()]);
      setSecondaryGoalInput("");
    }
  };
  const handleRemoveSecondaryGoal = (index) => {
    setSecondaryGoals(secondaryGoals.filter((_, i) => i !== index));
  };
  const toggleHabit = (habit) => {
    if (selectedHabits.includes(habit)) {
      setSelectedHabits(selectedHabits.filter((h) => h !== habit));
    } else {
      setSelectedHabits([...selectedHabits, habit]);
    }
  };
  const handleSubmit = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/cycles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || `Ciclo de ${durationDays} Dias — Foco Total`,
          mainGoal,
          secondaryGoals,
          durationDays,
          startDate,
          routineLevel,
          preferredTimes,
          digitalLimits
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao registrar ciclo de foco.");
      for (const hName of selectedHabits) {
        await fetch("/api/habits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: hName,
            category: "geral",
            targetFrequency: "diario"
          })
        });
      }
      onSaveCycle(data.cycle);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto", children: /* @__PURE__ */ jsxs("div", { className: "bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-xl p-6 sm:p-8 shadow-2xl relative my-8", children: [
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: onClose,
        className: "absolute top-4 right-4 p-1.5 rounded-lg text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d]",
        children: /* @__PURE__ */ jsx(X, { className: "w-5 h-5" })
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "mb-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2", children: [
        /* @__PURE__ */ jsx(Sparkles, { className: "w-3.5 h-3.5" }),
        "Estrutura do Modo Foco"
      ] }),
      /* @__PURE__ */ jsx("h2", { className: "text-xl sm:text-2xl font-bold text-[#f0f6fc]", children: "Planeje seu Ciclo de Consistência" }),
      /* @__PURE__ */ jsx("p", { className: "text-xs sm:text-sm text-[#8b949e] mt-1", children: 'Inspirado no conceito de imersão ("Modo Caverna"), desenhado para a vida real: sem isolamento extremo, privação ou culpa.' })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between mb-8 pb-4 border-b border-[#30363d]", children: [1, 2, 3].map((s) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsx(
        "div",
        {
          className: `w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${step === s ? "bg-emerald-500 text-black" : step > s ? "bg-emerald-950 border border-emerald-500/50 text-emerald-400" : "bg-[#21262d] text-[#6e7681]"}`,
          children: step > s ? /* @__PURE__ */ jsx(Check, { className: "w-3.5 h-3.5" }) : s
        }
      ),
      /* @__PURE__ */ jsx("span", { className: `text-xs font-medium hidden sm:inline ${step === s ? "text-[#f0f6fc]" : "text-[#6e7681]"}`, children: s === 1 ? "Duração & Intensidade" : s === 2 ? "Metas & Horários" : "Hábitos & Limites" })
    ] }, s)) }),
    error && /* @__PURE__ */ jsx("div", { className: "mb-4 p-3 rounded-lg bg-rose-950/30 border border-rose-800/40 text-rose-300 text-xs", children: error }),
    step === 1 && /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-2", children: "1. Escolha a Duração do Ciclo" }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-3", children: [7, 21, 40, 90].map((days) => /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => setDurationDays(days),
            className: `p-3.5 rounded-xl border text-center transition-all ${durationDays === days ? "border-emerald-500 bg-emerald-950/30 text-emerald-400 font-bold shadow-lg shadow-emerald-500/10" : "border-[#30363d] bg-[#0d1117] text-[#8b949e] hover:border-[#484f58]"}`,
            children: [
              /* @__PURE__ */ jsx("span", { className: "block text-xl font-extrabold", children: days }),
              /* @__PURE__ */ jsx("span", { className: "text-[11px] block mt-0.5", children: "Dias" })
            ]
          },
          days
        )) }),
        /* @__PURE__ */ jsxs("p", { className: "text-[11px] text-[#6e7681] mt-2", children: [
          durationDays === 7 && "Ideal para reiniciar o foco semanal e destravar tarefas represadas.",
          durationDays === 21 && "Excelente para fixar ou eliminar um padrão de hábito específico.",
          durationDays === 40 && "O ciclo clássico de reinvenção e conclusão de grandes projetos.",
          durationDays === 90 && "Transformação profunda e execução de metas trimestrais complexas."
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-2", children: "2. Nível de Rotina" }),
        /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-3", children: [
          { id: "leve", label: "Leve", desc: "1 a 2 blocos de foco. Para rotinas corridas." },
          { id: "equilibrado", label: "Equilibrado", desc: "3 blocos balanceados. Consistência duradoura." },
          { id: "intensivo", label: "Intensivo", desc: "Imersão alta com múltiplos blocos estruturados." }
        ].map((lvl) => /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => setRoutineLevel(lvl.id),
            className: `p-3 rounded-xl border text-left transition-all ${routineLevel === lvl.id ? "border-emerald-500 bg-emerald-950/30 text-emerald-400" : "border-[#30363d] bg-[#0d1117] text-[#8b949e] hover:border-[#484f58]"}`,
            children: [
              /* @__PURE__ */ jsx("div", { className: "font-semibold text-xs text-[#f0f6fc]", children: lvl.label }),
              /* @__PURE__ */ jsx("div", { className: "text-[11px] text-[#8b949e] mt-1", children: lvl.desc })
            ]
          },
          lvl.id
        )) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex justify-end pt-4", children: /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: () => setStep(2),
          className: "px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition-colors",
          children: "Próximo: Metas & Prazos →"
        }
      ) })
    ] }),
    step === 2 && /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-1", children: "Nome do Ciclo (opcional)" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            placeholder: `Ex: Ciclo de ${durationDays} Dias — Foco Q4`,
            value: title,
            onChange: (e) => setTitle(e.target.value),
            className: "w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-[#f0f6fc] focus:outline-none focus:border-emerald-500"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-1", children: "Meta Principal (O Grande Marco) *" }),
        /* @__PURE__ */ jsx(
          "textarea",
          {
            rows: 2,
            required: true,
            placeholder: "Ex: Entregar a versão 1.0 do produto e criar estabilidade financeira",
            value: mainGoal,
            onChange: (e) => setMainGoal(e.target.value),
            className: "w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-[#f0f6fc] focus:outline-none focus:border-emerald-500"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-1", children: "Metas Secundárias (Até 5)" }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2 mb-2", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              placeholder: "Ex: Ler 2 livros ou treinar 4x por semana",
              value: secondaryGoalInput,
              onChange: (e) => setSecondaryGoalInput(e.target.value),
              onKeyDown: (e) => e.key === "Enter" && (e.preventDefault(), handleAddSecondaryGoal()),
              className: "flex-1 bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-[#f0f6fc] focus:outline-none focus:border-emerald-500"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: handleAddSecondaryGoal,
              className: "px-4 py-2 bg-[#21262d] hover:bg-[#30363d] text-xs font-medium text-[#f0f6fc] rounded-lg",
              children: "Adicionar"
            }
          )
        ] }),
        /* @__PURE__ */ jsx("div", { className: "space-y-1.5", children: secondaryGoals.map((g, idx) => /* @__PURE__ */ jsxs(
          "div",
          {
            className: "flex items-center justify-between px-3 py-1.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-xs text-[#f0f6fc]",
            children: [
              /* @__PURE__ */ jsxs("span", { children: [
                "• ",
                g
              ] }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => handleRemoveSecondaryGoal(idx),
                  className: "text-[#6e7681] hover:text-rose-400",
                  children: /* @__PURE__ */ jsx(X, { className: "w-3.5 h-3.5" })
                }
              )
            ]
          },
          idx
        )) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-1", children: "Data de Início" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "date",
              value: startDate,
              onChange: (e) => setStartDate(e.target.value),
              className: "w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-[#f0f6fc] focus:outline-none focus:border-emerald-500"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-1", children: "Horários Preferidos de Foco" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              placeholder: "Ex: Manhã (07h-11h)",
              value: preferredTimes,
              onChange: (e) => setPreferredTimes(e.target.value),
              className: "w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-[#f0f6fc] focus:outline-none focus:border-emerald-500"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between pt-4", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => setStep(1),
            className: "px-4 py-2 text-xs font-medium text-[#8b949e] hover:text-[#f0f6fc]",
            children: "← Voltar"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => setStep(3),
            className: "px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition-colors",
            children: "Próximo: Hábitos & Limites →"
          }
        )
      ] })
    ] }),
    step === 3 && /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-2", children: "Hábitos Recomendados para Ativar no Ciclo" }),
        /* @__PURE__ */ jsx("div", { className: "space-y-2", children: PRESET_HABITS.map((habit) => {
          const active = selectedHabits.includes(habit);
          return /* @__PURE__ */ jsxs(
            "button",
            {
              type: "button",
              onClick: () => toggleHabit(habit),
              className: `w-full flex items-center justify-between p-2.5 rounded-lg border text-left transition-all ${active ? "border-emerald-500/60 bg-emerald-950/20 text-[#f0f6fc]" : "border-[#30363d] bg-[#0d1117] text-[#8b949e]"}`,
              children: [
                /* @__PURE__ */ jsx("span", { className: "text-xs", children: habit }),
                /* @__PURE__ */ jsx(
                  "div",
                  {
                    className: `w-4 h-4 rounded flex items-center justify-center border ${active ? "border-emerald-500 bg-emerald-500 text-black" : "border-[#484f58] bg-[#21262d]"}`,
                    children: active && /* @__PURE__ */ jsx(Check, { className: "w-3 h-3 stroke-[3]" })
                  }
                )
              ]
            },
            habit
          );
        }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-1", children: "Limites Digitais Pessoais (Autodisciplina)" }),
        /* @__PURE__ */ jsx(
          "textarea",
          {
            rows: 2,
            placeholder: "Ex: Notificações silenciosas no horário de trabalho; sem redes sociais na primeira hora da manhã.",
            value: digitalLimits,
            onChange: (e) => setDigitalLimits(e.target.value),
            className: "w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-[#f0f6fc] focus:outline-none focus:border-emerald-500"
          }
        ),
        /* @__PURE__ */ jsx("p", { className: "text-[11px] text-[#6e7681] mt-1", children: "Nota de integridade: definimos combinados pessoais conscientes. O Ritmo não promete bloquear aplicativos no seu sistema operacional." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "p-3 rounded-lg bg-[#21262d] border border-[#30363d] flex items-start gap-2 text-xs text-[#8b949e]", children: [
        /* @__PURE__ */ jsx(Info, { className: "w-4 h-4 text-amber-400 shrink-0 mt-0.5" }),
        /* @__PURE__ */ jsxs("span", { children: [
          /* @__PURE__ */ jsx("strong", { children: "Aviso de Saúde & Flexibilidade:" }),
          " O Ritmo incentiva consistência e autonomia. Não substitui cuidados médicos ou psicológicos. Se imprevistos ocorrerem, ajuste o ritmo sem culpa: consistência supera perfeição rígida."
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-between pt-4", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => setStep(2),
            className: "px-4 py-2 text-xs font-medium text-[#8b949e] hover:text-[#f0f6fc]",
            children: "← Voltar"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            disabled: loading,
            onClick: handleSubmit,
            className: "px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/20 transition-colors disabled:opacity-50",
            children: loading ? "Salvando Ciclo..." : "Iniciar Ciclo de Foco 🚀"
          }
        )
      ] })
    ] })
  ] }) });
};
const TabToday = ({
  activeCycle,
  tasks,
  habits,
  habitLogs,
  transactions,
  onToggleTask,
  onToggleHabit,
  onQuickStartFocus,
  onNavigateTab,
  onOpenOnboarding
}) => {
  const todayStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  let currentDay = 1;
  let totalDays = 40;
  let cyclePercent = 0;
  if (activeCycle) {
    const start = new Date(activeCycle.startDate);
    const today = /* @__PURE__ */ new Date();
    const diff = Math.floor((today.getTime() - start.getTime()) / (1e3 * 60 * 60 * 24)) + 1;
    currentDay = Math.max(1, Math.min(activeCycle.durationDays, diff));
    totalDays = activeCycle.durationDays;
    cyclePercent = Math.round(currentDay / totalDays * 100);
  }
  const todayTasks = tasks.filter((t) => t.date === todayStr);
  const completedTasksCount = todayTasks.filter((t) => t.completed).length;
  const todayHabitLogsMap = new Map(
    habitLogs.filter((l) => l.date === todayStr).map((l) => [l.habitId, l.completed])
  );
  const completedHabitsCount = habits.filter((h) => todayHabitLogsMap.get(h.id)).length;
  const currentMonth = todayStr.substring(0, 7);
  const monthTxs = transactions.filter((t) => t.date.startsWith(currentMonth));
  const monthIncome = monthTxs.filter((t) => t.type === "income").reduce((acc, t) => acc + t.amountCents, 0);
  const monthExpense = monthTxs.filter((t) => t.type === "expense").reduce((acc, t) => acc + t.amountCents, 0);
  const monthBalance = monthIncome - monthExpense;
  const pendingBills = transactions.filter(
    (t) => t.status === "pending" || t.dueDate && t.dueDate >= todayStr && t.status !== "paid"
  );
  const inspirationalQuotes = [
    "Consistência é um músculo diário: pequenos blocos sustentam grandes transformações.",
    "Se o plano falhar hoje, respire e retome amanhã. O progresso não exige perfeição rígida.",
    "Foco não é fazer tudo ao mesmo tempo, mas proteger aquilo que realmente importa agora.",
    "Um passo honesto de cada vez. A clareza mental nasce do compromisso equilibrado."
  ];
  const dailyQuote = inspirationalQuotes[currentDay % inspirationalQuotes.length];
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6 animate-fade-in", children: [
    /* @__PURE__ */ jsxs("div", { className: "relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#161b22] via-[#1c2129] to-[#0d1117] border border-[#30363d] p-6 sm:p-8", children: [
      /* @__PURE__ */ jsxs("div", { className: "relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-2 max-w-2xl", children: [
          /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-800/40 text-emerald-400 text-xs font-semibold uppercase tracking-wider", children: [
            /* @__PURE__ */ jsx(Flame, { className: "w-3.5 h-3.5 text-emerald-400" }),
            activeCycle ? `Modo Foco • Nível ${activeCycle.routineLevel.toUpperCase()}` : "Modo Foco Inativo"
          ] }),
          /* @__PURE__ */ jsx("h1", { className: "text-2xl sm:text-3xl font-extrabold text-[#f0f6fc] tracking-tight", children: activeCycle ? activeCycle.mainGoal : "Inicie seu Ciclo de Foco (7 a 90 dias)" }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-[#8b949e]", children: activeCycle?.notes || "Defina suas metas essenciais, acompanhe hábitos e construa organização sem extremismos." }),
          activeCycle?.secondaryGoals && activeCycle.secondaryGoals.length > 0 && /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2 pt-2", children: activeCycle.secondaryGoals.map((goal, idx) => /* @__PURE__ */ jsxs(
            "span",
            {
              className: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#21262d] text-[#c9d1d9] text-xs border border-[#30363d]",
              children: [
                /* @__PURE__ */ jsx(Target, { className: "w-3 h-3 text-emerald-400" }),
                goal
              ]
            },
            idx
          )) })
        ] }),
        activeCycle ? /* @__PURE__ */ jsxs("div", { className: "bg-[#0d1117]/80 backdrop-blur-sm border border-[#30363d] rounded-2xl p-5 min-w-[200px] text-center shrink-0", children: [
          /* @__PURE__ */ jsx("span", { className: "text-xs text-[#8b949e] font-medium block", children: "Ciclo em Andamento" }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-baseline justify-center gap-1 my-1", children: [
            /* @__PURE__ */ jsx("span", { className: "text-3xl sm:text-4xl font-black text-emerald-400", children: currentDay }),
            /* @__PURE__ */ jsxs("span", { className: "text-sm font-semibold text-[#8b949e]", children: [
              "/ ",
              totalDays,
              " dias"
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "w-full bg-[#21262d] h-2.5 rounded-full overflow-hidden mt-2", children: /* @__PURE__ */ jsx(
            "div",
            {
              className: "bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-700",
              style: { width: `${cyclePercent}%` }
            }
          ) }),
          /* @__PURE__ */ jsxs("span", { className: "text-[11px] text-[#6e7681] block mt-1.5", children: [
            cyclePercent,
            "% concluído"
          ] })
        ] }) : /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: onOpenOnboarding,
            className: "px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-xl shadow-emerald-600/20 transition-all flex items-center gap-2 self-start md:self-auto",
            children: [
              /* @__PURE__ */ jsx(Sparkles, { className: "w-4 h-4" }),
              "Configurar Primeiro Ciclo"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-6 pt-4 border-t border-[#30363d]/60 flex items-center gap-2 text-xs text-[#8b949e]", children: [
        /* @__PURE__ */ jsx(Heart, { className: "w-3.5 h-3.5 text-amber-400 shrink-0" }),
        /* @__PURE__ */ jsx("span", { children: dailyQuote })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "bg-[#161b22] border border-[#30363d] rounded-2xl p-5 flex flex-col justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between pb-3 border-b border-[#30363d] mb-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Calendar, { className: "w-4 h-4 text-emerald-400" }),
              /* @__PURE__ */ jsx("h2", { className: "text-sm font-bold text-[#f0f6fc]", children: "Tarefas de Hoje" })
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "text-xs px-2 py-0.5 rounded-full bg-[#21262d] text-[#8b949e] font-mono", children: [
              completedTasksCount,
              "/",
              todayTasks.length
            ] })
          ] }),
          todayTasks.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "text-center py-8 text-[#6e7681] space-y-2", children: [
            /* @__PURE__ */ jsx(Clock, { className: "w-8 h-8 mx-auto opacity-50" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs", children: "Nenhuma tarefa criada para a data de hoje." }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => onNavigateTab("tasks"),
                className: "text-xs text-emerald-400 hover:underline font-medium",
                children: "+ Adicionar tarefa na rotina"
              }
            )
          ] }) : /* @__PURE__ */ jsx("div", { className: "space-y-2", children: todayTasks.slice(0, 5).map((task) => /* @__PURE__ */ jsxs(
            "div",
            {
              onClick: () => onToggleTask(task.id, !task.completed),
              className: `flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${task.completed ? "border-[#30363d]/50 bg-[#0d1117]/50 opacity-60" : "border-[#30363d] bg-[#0d1117] hover:border-[#484f58]"}`,
              children: [
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    className: "mt-0.5 text-emerald-400 hover:text-emerald-300 transition-colors shrink-0",
                    children: task.completed ? /* @__PURE__ */ jsx(CheckCircle2, { className: "w-4 h-4 text-emerald-500" }) : /* @__PURE__ */ jsx(Circle, { className: "w-4 h-4 text-[#6e7681]" })
                  }
                ),
                /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                  /* @__PURE__ */ jsx(
                    "p",
                    {
                      className: `text-xs font-medium text-[#f0f6fc] truncate ${task.completed ? "line-through text-[#6e7681]" : ""}`,
                      children: task.title
                    }
                  ),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mt-1 text-[11px] text-[#8b949e]", children: [
                    /* @__PURE__ */ jsx("span", { className: "px-1.5 py-0.2 rounded bg-[#21262d] text-[10px]", children: task.timeBlock }),
                    task.startTime && /* @__PURE__ */ jsx("span", { children: task.startTime }),
                    /* @__PURE__ */ jsxs("span", { children: [
                      task.estimatedMinutes,
                      "m"
                    ] })
                  ] })
                ] })
              ]
            },
            task.id
          )) })
        ] }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => onNavigateTab("tasks"),
            className: "w-full mt-4 py-2 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-xs font-semibold text-[#8b949e] hover:text-[#f0f6fc] transition-colors flex items-center justify-center gap-1.5",
            children: [
              "Ver todas as tarefas ",
              /* @__PURE__ */ jsx(ArrowRight, { className: "w-3.5 h-3.5" })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-[#161b22] border border-[#30363d] rounded-2xl p-5 flex flex-col justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between pb-3 border-b border-[#30363d] mb-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Sparkles, { className: "w-4 h-4 text-amber-400" }),
              /* @__PURE__ */ jsx("h2", { className: "text-sm font-bold text-[#f0f6fc]", children: "Hábitos & Consistência" })
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "text-xs px-2 py-0.5 rounded-full bg-[#21262d] text-[#8b949e] font-mono", children: [
              completedHabitsCount,
              "/",
              habits.length
            ] })
          ] }),
          habits.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "text-center py-8 text-[#6e7681] space-y-2", children: [
            /* @__PURE__ */ jsx(Coffee, { className: "w-8 h-8 mx-auto opacity-50" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs", children: "Nenhum hábito cadastrado ainda." }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => onNavigateTab("habits"),
                className: "text-xs text-amber-400 hover:underline font-medium",
                children: "+ Configurar hábitos saudáveis"
              }
            )
          ] }) : /* @__PURE__ */ jsx("div", { className: "space-y-2", children: habits.slice(0, 5).map((habit) => {
            const isDone = Boolean(todayHabitLogsMap.get(habit.id));
            return /* @__PURE__ */ jsxs(
              "div",
              {
                onClick: () => onToggleHabit(habit.id, !isDone),
                className: `flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${isDone ? "border-emerald-500/40 bg-emerald-950/20 text-[#f0f6fc]" : "border-[#30363d] bg-[#0d1117] text-[#8b949e] hover:border-[#484f58]"}`,
                children: [
                  /* @__PURE__ */ jsx("span", { className: "text-xs font-medium truncate max-w-[220px]", children: habit.name }),
                  /* @__PURE__ */ jsx(
                    "div",
                    {
                      className: `w-5 h-5 rounded-lg flex items-center justify-center transition-all ${isDone ? "bg-emerald-500 text-black shadow-sm" : "bg-[#21262d] border border-[#30363d]"}`,
                      children: isDone && /* @__PURE__ */ jsx(CheckCircle2, { className: "w-3.5 h-3.5 stroke-[2.5]" })
                    }
                  )
                ]
              },
              habit.id
            );
          }) })
        ] }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => onNavigateTab("habits"),
            className: "w-full mt-4 py-2 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-xs font-semibold text-[#8b949e] hover:text-[#f0f6fc] transition-colors flex items-center justify-center gap-1.5",
            children: [
              "Acompanhar hábitos ",
              /* @__PURE__ */ jsx(ArrowRight, { className: "w-3.5 h-3.5" })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-[#161b22] border border-[#30363d] rounded-2xl p-5", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between pb-3 border-b border-[#30363d] mb-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(Clock, { className: "w-4 h-4 text-emerald-400" }),
              /* @__PURE__ */ jsx("h2", { className: "text-sm font-bold text-[#f0f6fc]", children: "Sessão de Foco Rápida" })
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => onNavigateTab("focus"),
                className: "text-[11px] text-emerald-400 hover:underline",
                children: "Timer Completo"
              }
            )
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-[#8b949e] mb-3", children: "Escolha uma duração para iniciar um bloco de trabalho focado sem interrupções:" }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2 mb-3", children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => onQuickStartFocus(25, "Bloco de 25 min"),
                className: "p-3 rounded-xl bg-[#0d1117] border border-[#30363d] hover:border-emerald-500/60 transition-all flex items-center justify-center gap-2 text-xs font-bold text-[#f0f6fc]",
                children: [
                  /* @__PURE__ */ jsx(Play, { className: "w-3.5 h-3.5 text-emerald-400" }),
                  "25 min (Pomodoro)"
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => onQuickStartFocus(50, "Imersão de 50 min"),
                className: "p-3 rounded-xl bg-[#0d1117] border border-[#30363d] hover:border-emerald-500/60 transition-all flex items-center justify-center gap-2 text-xs font-bold text-[#f0f6fc]",
                children: [
                  /* @__PURE__ */ jsx(Play, { className: "w-3.5 h-3.5 text-teal-400" }),
                  "50 min (Imersão)"
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-[#161b22] border border-[#30363d] rounded-2xl p-5", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between pb-3 border-b border-[#30363d] mb-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(DollarSign, { className: "w-4 h-4 text-amber-400" }),
              /* @__PURE__ */ jsx("h2", { className: "text-sm font-bold text-[#f0f6fc]", children: "Finanças deste Mês" })
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => onNavigateTab("finance"),
                className: "text-[11px] text-amber-400 hover:underline",
                children: "Ver Finanças"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3 mb-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "bg-[#0d1117] p-3 rounded-xl border border-[#30363d]", children: [
              /* @__PURE__ */ jsx("span", { className: "text-[10px] uppercase font-semibold text-emerald-400 block", children: "Receitas" }),
              /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-[#f0f6fc]", children: (monthIncome / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "bg-[#0d1117] p-3 rounded-xl border border-[#30363d]", children: [
              /* @__PURE__ */ jsx("span", { className: "text-[10px] uppercase font-semibold text-rose-400 block", children: "Despesas" }),
              /* @__PURE__ */ jsx("span", { className: "text-sm font-bold text-[#f0f6fc]", children: (monthExpense / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-[#21262d]", children: [
            /* @__PURE__ */ jsx("span", { className: "text-[#8b949e]", children: "Saldo Líquido" }),
            /* @__PURE__ */ jsx(
              "span",
              {
                className: `font-bold ${monthBalance >= 0 ? "text-emerald-400" : "text-rose-400"}`,
                children: (monthBalance / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
              }
            )
          ] }),
          pendingBills.length > 0 && /* @__PURE__ */ jsxs("div", { className: "mt-2.5 text-[11px] text-amber-300 flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsx(AlertCircle, { className: "w-3.5 h-3.5 shrink-0" }),
            /* @__PURE__ */ jsxs("span", { children: [
              pendingBills.length,
              " conta(s) a pagar/pendente(s) registrada(s)."
            ] })
          ] })
        ] })
      ] })
    ] })
  ] });
};
const CATEGORIES$1 = [
  { id: "geral", label: "Geral", color: "bg-zinc-800 text-zinc-300" },
  { id: "trabalho", label: "Trabalho", color: "bg-blue-950 text-blue-300 border-blue-800" },
  { id: "estudo", label: "Estudo", color: "bg-purple-950 text-purple-300 border-purple-800" },
  { id: "saude", label: "Saúde", color: "bg-emerald-950 text-emerald-300 border-emerald-800" },
  { id: "financas", label: "Finanças", color: "bg-amber-950 text-amber-300 border-amber-800" },
  { id: "pessoal", label: "Pessoal", color: "bg-rose-950 text-rose-300 border-rose-800" }
];
const TIME_BLOCKS = ["Manhã", "Tarde", "Noite", "Flexível"];
const TabTasks = ({
  tasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask
}) => {
  const [selectedDate, setSelectedDate] = useState(
    (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
  );
  const [viewMode, setViewMode] = useState("day");
  const [categoryFilter, setCategoryFilter] = useState("todas");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("geral");
  const [priority, setPriority] = useState("media");
  const [timeBlock, setTimeBlock] = useState("Manhã");
  const [startTime, setStartTime] = useState("");
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState("daily");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const openNewTaskModal = () => {
    setEditingTask(null);
    setTitle("");
    setDescription("");
    setCategory("geral");
    setPriority("media");
    setTimeBlock("Manhã");
    setStartTime("");
    setEstimatedMinutes(30);
    setIsRecurring(false);
    setNotes("");
    setIsModalOpen(true);
  };
  const openEditModal = (t) => {
    setEditingTask(t);
    setTitle(t.title);
    setDescription(t.description || "");
    setCategory(t.category);
    setPriority(t.priority);
    setTimeBlock(t.timeBlock);
    setStartTime(t.startTime || "");
    setEstimatedMinutes(t.estimatedMinutes);
    setIsRecurring(t.isRecurring);
    setRecurrenceRule(t.recurrenceRule || "daily");
    setNotes(t.notes || "");
    setIsModalOpen(true);
  };
  const handleSaveTask = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      if (editingTask) {
        await onUpdateTask(editingTask.id, {
          title,
          description,
          category,
          priority,
          timeBlock,
          startTime,
          estimatedMinutes,
          isRecurring,
          recurrenceRule: isRecurring ? recurrenceRule : "",
          notes,
          date: selectedDate
        });
      } else {
        await onAddTask({
          title,
          description,
          category,
          priority,
          timeBlock,
          startTime,
          estimatedMinutes,
          isRecurring,
          recurrenceRule: isRecurring ? recurrenceRule : "",
          notes,
          date: selectedDate
        });
      }
      setIsModalOpen(false);
    } finally {
      setLoading(false);
    }
  };
  const handleRescheduleToToday = async (task) => {
    const todayStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    await onUpdateTask(task.id, {
      date: todayStr,
      notes: (task.notes ? task.notes + " • " : "") + `Reagendada de ${task.date} para hoje`
    });
  };
  const shiftDay = (days) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split("T")[0]);
  };
  const filteredTasks = tasks.filter((t) => {
    if (viewMode === "day" && t.date !== selectedDate) return false;
    if (categoryFilter !== "todas" && t.category !== categoryFilter) return false;
    return true;
  });
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6 animate-fade-in", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#161b22] border border-[#30363d] p-4 rounded-2xl", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 bg-[#0d1117] border border-[#30363d] rounded-xl p-1", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => shiftDay(-1),
              className: "p-1.5 rounded-lg text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d]",
              children: /* @__PURE__ */ jsx(ChevronLeft, { className: "w-4 h-4" })
            }
          ),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "date",
              value: selectedDate,
              onChange: (e) => setSelectedDate(e.target.value),
              className: "bg-transparent text-xs font-semibold text-[#f0f6fc] px-2 py-1 focus:outline-none"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => shiftDay(1),
              className: "p-1.5 rounded-lg text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#21262d]",
              children: /* @__PURE__ */ jsx(ChevronRight, { className: "w-4 h-4" })
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex bg-[#0d1117] border border-[#30363d] rounded-xl p-1 text-xs", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setViewMode("day"),
              className: `px-3 py-1 rounded-lg font-medium transition-colors ${viewMode === "day" ? "bg-[#21262d] text-emerald-400" : "text-[#8b949e]"}`,
              children: "Dia"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setViewMode("week"),
              className: `px-3 py-1 rounded-lg font-medium transition-colors ${viewMode === "week" ? "bg-[#21262d] text-emerald-400" : "text-[#8b949e]"}`,
              children: "Geral / Semana"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end", children: [
        /* @__PURE__ */ jsxs(
          "select",
          {
            value: categoryFilter,
            onChange: (e) => setCategoryFilter(e.target.value),
            className: "bg-[#0d1117] border border-[#30363d] text-xs text-[#f0f6fc] rounded-xl px-3 py-2 focus:outline-none",
            children: [
              /* @__PURE__ */ jsx("option", { value: "todas", children: "Todas as categorias" }),
              CATEGORIES$1.map((c) => /* @__PURE__ */ jsx("option", { value: c.id, children: c.label }, c.id))
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: openNewTaskModal,
            className: "px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all shrink-0",
            children: [
              /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }),
              "Nova Tarefa"
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", children: TIME_BLOCKS.map((block) => {
      const blockTasks = filteredTasks.filter((t) => t.timeBlock === block);
      return /* @__PURE__ */ jsxs(
        "div",
        {
          className: "bg-[#161b22] border border-[#30363d] rounded-2xl p-4 flex flex-col justify-between",
          children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between pb-2.5 border-b border-[#30363d] mb-3", children: [
                /* @__PURE__ */ jsxs("h3", { className: "text-xs font-bold uppercase tracking-wider text-[#8b949e] flex items-center gap-1.5", children: [
                  /* @__PURE__ */ jsx("span", { className: "w-2 h-2 rounded-full bg-emerald-400" }),
                  "Bloco: ",
                  block
                ] }),
                /* @__PURE__ */ jsx("span", { className: "text-[11px] font-mono text-[#6e7681]", children: blockTasks.length })
              ] }),
              blockTasks.length === 0 ? /* @__PURE__ */ jsx("div", { className: "py-6 text-center text-[#6e7681] text-xs", children: "Nenhuma tarefa neste bloco." }) : /* @__PURE__ */ jsx("div", { className: "space-y-2.5", children: blockTasks.map((t) => /* @__PURE__ */ jsx(
                "div",
                {
                  className: `p-3 rounded-xl border transition-all ${t.completed ? "bg-[#0d1117]/50 border-[#30363d]/60 opacity-60" : "bg-[#0d1117] border-[#30363d] hover:border-[#484f58]"}`,
                  children: /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2.5", children: [
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        type: "button",
                        onClick: () => onUpdateTask(t.id, { completed: !t.completed }),
                        className: "mt-0.5 text-emerald-400 hover:text-emerald-300",
                        children: t.completed ? /* @__PURE__ */ jsx(CheckCircle2, { className: "w-4 h-4 text-emerald-500" }) : /* @__PURE__ */ jsx(Circle, { className: "w-4 h-4 text-[#6e7681]" })
                      }
                    ),
                    /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                      /* @__PURE__ */ jsx(
                        "span",
                        {
                          className: `text-xs font-medium text-[#f0f6fc] block ${t.completed ? "line-through text-[#6e7681]" : ""}`,
                          children: t.title
                        }
                      ),
                      t.description && /* @__PURE__ */ jsx("p", { className: "text-[11px] text-[#8b949e] mt-0.5 line-clamp-2", children: t.description }),
                      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-1.5 mt-2", children: [
                        /* @__PURE__ */ jsx(
                          "span",
                          {
                            className: `text-[10px] font-semibold px-1.5 py-0.2 rounded border ${CATEGORIES$1.find((c) => c.id === t.category)?.color || "bg-zinc-800 text-zinc-300"}`,
                            children: t.category
                          }
                        ),
                        t.startTime && /* @__PURE__ */ jsxs("span", { className: "text-[10px] text-[#8b949e] flex items-center gap-0.5", children: [
                          /* @__PURE__ */ jsx(Clock, { className: "w-3 h-3" }),
                          t.startTime
                        ] }),
                        /* @__PURE__ */ jsxs("span", { className: "text-[10px] text-[#8b949e]", children: [
                          t.estimatedMinutes,
                          "m"
                        ] }),
                        t.priority === "alta" && /* @__PURE__ */ jsx("span", { className: "text-[10px] font-semibold text-rose-400 px-1 py-0.2 rounded bg-rose-950/40 border border-rose-800/40", children: "Alta" })
                      ] }),
                      !t.completed && t.date < selectedDate && /* @__PURE__ */ jsxs(
                        "button",
                        {
                          onClick: () => handleRescheduleToToday(t),
                          className: "mt-2 text-[10px] font-medium text-amber-400 hover:underline flex items-center gap-1",
                          children: [
                            /* @__PURE__ */ jsx(RotateCcw, { className: "w-3 h-3" }),
                            "Reagendar para hoje"
                          ]
                        }
                      )
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1 shrink-0", children: [
                      /* @__PURE__ */ jsx(
                        "button",
                        {
                          onClick: () => openEditModal(t),
                          className: "text-[#6e7681] hover:text-[#f0f6fc] p-1",
                          children: /* @__PURE__ */ jsx(Edit2, { className: "w-3 h-3" })
                        }
                      ),
                      /* @__PURE__ */ jsx(
                        "button",
                        {
                          onClick: () => onDeleteTask(t.id),
                          className: "text-[#6e7681] hover:text-rose-400 p-1",
                          children: /* @__PURE__ */ jsx(Trash2, { className: "w-3 h-3" })
                        }
                      )
                    ] })
                  ] })
                },
                t.id
              )) })
            ] }),
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => {
                  setTimeBlock(block);
                  openNewTaskModal();
                },
                className: "mt-3 w-full py-1.5 rounded-lg border border-dashed border-[#30363d] hover:border-emerald-500/50 text-[11px] text-[#8b949e] hover:text-emerald-400 transition-colors flex items-center justify-center gap-1",
                children: [
                  /* @__PURE__ */ jsx(Plus, { className: "w-3 h-3" }),
                  "Adicionar em ",
                  block
                ]
              }
            )
          ]
        },
        block
      );
    }) }),
    isModalOpen && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in", children: /* @__PURE__ */ jsxs("div", { className: "bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-lg p-6 shadow-2xl relative", children: [
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => setIsModalOpen(false),
          className: "absolute top-4 right-4 p-1.5 rounded-lg text-[#8b949e] hover:text-[#f0f6fc]",
          children: [
            /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4 hidden" }),
            "×"
          ]
        }
      ),
      /* @__PURE__ */ jsx("h3", { className: "text-base font-bold text-[#f0f6fc] mb-4", children: editingTask ? "Editar Tarefa" : "Nova Tarefa na Rotina" }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleSaveTask, className: "space-y-3.5", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-[#8b949e] mb-1", children: "Título da Tarefa *" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              required: true,
              placeholder: "Ex: Revisar documentação do cliente",
              value: title,
              onChange: (e) => setTitle(e.target.value),
              className: "w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-[#f0f6fc] focus:outline-none focus:border-emerald-500"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-[#8b949e] mb-1", children: "Descrição ou notas" }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              rows: 2,
              placeholder: "Instruções, links ou notas de contexto...",
              value: description,
              onChange: (e) => setDescription(e.target.value),
              className: "w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-[#f0f6fc] focus:outline-none focus:border-emerald-500"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-[#8b949e] mb-1", children: "Categoria" }),
            /* @__PURE__ */ jsx(
              "select",
              {
                value: category,
                onChange: (e) => setCategory(e.target.value),
                className: "w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-[#f0f6fc]",
                children: CATEGORIES$1.map((c) => /* @__PURE__ */ jsx("option", { value: c.id, children: c.label }, c.id))
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-[#8b949e] mb-1", children: "Prioridade" }),
            /* @__PURE__ */ jsxs(
              "select",
              {
                value: priority,
                onChange: (e) => setPriority(e.target.value),
                className: "w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-[#f0f6fc]",
                children: [
                  /* @__PURE__ */ jsx("option", { value: "baixa", children: "Baixa" }),
                  /* @__PURE__ */ jsx("option", { value: "media", children: "Média" }),
                  /* @__PURE__ */ jsx("option", { value: "alta", children: "Alta" })
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-[#8b949e] mb-1", children: "Bloco do Dia" }),
            /* @__PURE__ */ jsx(
              "select",
              {
                value: timeBlock,
                onChange: (e) => setTimeBlock(e.target.value),
                className: "w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-[#f0f6fc]",
                children: TIME_BLOCKS.map((b) => /* @__PURE__ */ jsx("option", { value: b, children: b }, b))
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-[#8b949e] mb-1", children: "Horário (HH:MM)" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "time",
                value: startTime,
                onChange: (e) => setStartTime(e.target.value),
                className: "w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-[#f0f6fc]"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-[#8b949e] mb-1", children: "Duração Est." }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "number",
                min: "5",
                step: "5",
                value: estimatedMinutes,
                onChange: (e) => setEstimatedMinutes(Number(e.target.value)),
                className: "w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-[#f0f6fc]"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 pt-2", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "checkbox",
              id: "chk-rec",
              checked: isRecurring,
              onChange: (e) => setIsRecurring(e.target.checked),
              className: "rounded border-[#30363d] bg-[#0d1117] text-emerald-500 focus:ring-0"
            }
          ),
          /* @__PURE__ */ jsx("label", { htmlFor: "chk-rec", className: "text-xs text-[#8b949e] cursor-pointer", children: "Repetir diariamente ou em dias úteis" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2 pt-4 border-t border-[#30363d]", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => setIsModalOpen(false),
              className: "px-4 py-2 rounded-lg text-xs font-medium text-[#8b949e] hover:text-[#f0f6fc]",
              children: "Cancelar"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "submit",
              disabled: loading,
              className: "px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/20",
              children: loading ? "Salvando..." : editingTask ? "Salvar Alterações" : "Criar Tarefa"
            }
          )
        ] })
      ] })
    ] }) })
  ] });
};
const CATEGORY_META = {
  movimento: { label: "Movimento / Corpo", icon: /* @__PURE__ */ jsx(Activity, { className: "w-4 h-4" }), color: "text-emerald-400 bg-emerald-950/40 border-emerald-800/40" },
  estudo: { label: "Estudo / Leitura", icon: /* @__PURE__ */ jsx(BookOpen, { className: "w-4 h-4" }), color: "text-purple-400 bg-purple-950/40 border-purple-800/40" },
  mente: { label: "Mente / Respiração", icon: /* @__PURE__ */ jsx(Heart, { className: "w-4 h-4" }), color: "text-rose-400 bg-rose-950/40 border-rose-800/40" },
  sono: { label: "Sono / Descanso", icon: /* @__PURE__ */ jsx(Moon, { className: "w-4 h-4" }), color: "text-indigo-400 bg-indigo-950/40 border-indigo-800/40" },
  hidratacao: { label: "Hidratação", icon: /* @__PURE__ */ jsx(Droplet, { className: "w-4 h-4" }), color: "text-cyan-400 bg-cyan-950/40 border-cyan-800/40" },
  desconexao: { label: "Desconexão Digital", icon: /* @__PURE__ */ jsx(PhoneOff, { className: "w-4 h-4" }), color: "text-amber-400 bg-amber-950/40 border-amber-800/40" },
  personalizado: { label: "Personalizado", icon: /* @__PURE__ */ jsx(Sparkles, { className: "w-4 h-4" }), color: "text-teal-400 bg-teal-950/40 border-teal-800/40" }
};
const TabHabits = ({
  habits,
  habitLogs,
  onToggleHabit,
  onAddHabit
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("movimento");
  const [targetFrequency, setTargetFrequency] = useState("diario");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const today = /* @__PURE__ */ new Date();
  const past7Days = [];
  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    past7Days.push({
      dateStr,
      dayName: dayNames[d.getDay()],
      dayNum: d.getDate()
    });
  }
  const logLookup = /* @__PURE__ */ new Map();
  for (const l of habitLogs) {
    logLookup.set(`${l.habitId}_${l.date}`, l.completed);
  }
  const handleCreateHabit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      await onAddHabit({
        name,
        category,
        targetFrequency,
        notes
      });
      setName("");
      setNotes("");
      setIsModalOpen(false);
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6 animate-fade-in", children: [
    /* @__PURE__ */ jsxs("div", { className: "p-4 rounded-2xl bg-[#161b22] border border-[#30363d] flex items-start gap-3", children: [
      /* @__PURE__ */ jsx(Info, { className: "w-5 h-5 text-emerald-400 shrink-0 mt-0.5" }),
      /* @__PURE__ */ jsxs("div", { className: "text-xs text-[#8b949e] space-y-1", children: [
        /* @__PURE__ */ jsx("p", { className: "font-semibold text-[#f0f6fc]", children: "Nota de Saúde & Bem-estar Consciente" }),
        /* @__PURE__ */ jsx("p", { children: "O Ritmo incentiva consistência e equilíbrio pessoal com metas flexíveis. Não impomos recomendações médicas, restrições alimentares ou obrigações rígidas. Um dia sem marcar um hábito não é fracasso, apenas parte da rotina real." }),
        /* @__PURE__ */ jsx("p", { className: "text-[11px] text-[#6e7681]", children: "* Esta ferramenta não substitui aconselhamento médico ou psicológico profissional." })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#161b22] border border-[#30363d] p-4 sm:p-5 rounded-2xl", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("h2", { className: "text-base font-bold text-[#f0f6fc] flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Flame, { className: "w-4 h-4 text-emerald-400" }),
          "Matriz Semanal de Hábitos"
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-[#8b949e]", children: "Acompanhe seus últimos 7 dias de consistência com um clique simples." })
      ] }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => setIsModalOpen(true),
          className: "px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all shrink-0",
          children: [
            /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }),
            "Novo Hábito"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsx("div", { className: "bg-[#161b22] border border-[#30363d] rounded-2xl overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
      /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-[#30363d] bg-[#0d1117]", children: [
        /* @__PURE__ */ jsx("th", { className: "py-3 px-4 text-xs font-semibold text-[#8b949e] min-w-[200px]", children: "Hábito & Categoria" }),
        past7Days.map((d, idx) => {
          const isToday = idx === past7Days.length - 1;
          return /* @__PURE__ */ jsxs(
            "th",
            {
              className: `py-3 px-2 text-center text-xs font-mono font-medium ${isToday ? "text-emerald-400 bg-emerald-950/20" : "text-[#8b949e]"}`,
              children: [
                /* @__PURE__ */ jsx("div", { children: d.dayName }),
                /* @__PURE__ */ jsx("div", { className: "text-[10px] text-[#6e7681]", children: d.dayNum })
              ]
            },
            d.dateStr
          );
        })
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-[#30363d]", children: habits.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 8, className: "py-12 text-center text-xs text-[#6e7681]", children: "Nenhum hábito ativo no momento. Clique no botão acima para adicionar." }) }) : habits.map((habit) => {
        const meta = CATEGORY_META[habit.category] || CATEGORY_META.personalizado;
        return /* @__PURE__ */ jsxs("tr", { className: "hover:bg-[#1c2128]/50 transition-colors", children: [
          /* @__PURE__ */ jsxs("td", { className: "py-3.5 px-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "font-semibold text-xs text-[#f0f6fc] flex items-center gap-2", children: [
              /* @__PURE__ */ jsx("span", { className: `p-1 rounded-md border ${meta.color}`, children: meta.icon }),
              /* @__PURE__ */ jsx("span", { children: habit.name })
            ] }),
            habit.notes && /* @__PURE__ */ jsx("p", { className: "text-[11px] text-[#8b949e] ml-7 mt-0.5", children: habit.notes })
          ] }),
          past7Days.map((d) => {
            const done = Boolean(logLookup.get(`${habit.id}_${d.dateStr}`));
            return /* @__PURE__ */ jsx("td", { className: "py-3 px-2 text-center", children: /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => onToggleHabit(habit.id, !done, d.dateStr),
                className: `w-7 h-7 mx-auto rounded-lg flex items-center justify-center transition-all ${done ? "bg-emerald-500 text-black shadow-sm" : "bg-[#21262d] border border-[#30363d] text-transparent hover:border-[#484f58]"}`,
                children: /* @__PURE__ */ jsx(CheckCircle2, { className: "w-4 h-4 stroke-[2.5]" })
              }
            ) }, d.dateStr);
          })
        ] }, habit.id);
      }) })
    ] }) }) }),
    isModalOpen && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in", children: /* @__PURE__ */ jsxs("div", { className: "bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-md p-6 shadow-2xl relative", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => setIsModalOpen(false),
          className: "absolute top-4 right-4 p-1.5 rounded-lg text-[#8b949e] hover:text-[#f0f6fc]",
          children: "×"
        }
      ),
      /* @__PURE__ */ jsx("h3", { className: "text-base font-bold text-[#f0f6fc] mb-4", children: "Novo Hábito Saudável" }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleCreateHabit, className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-[#8b949e] mb-1", children: "Nome do Hábito *" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              required: true,
              placeholder: "Ex: Treino funcional 30 min",
              value: name,
              onChange: (e) => setName(e.target.value),
              className: "w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-[#f0f6fc] focus:outline-none focus:border-emerald-500"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-[#8b949e] mb-1", children: "Categoria" }),
          /* @__PURE__ */ jsxs(
            "select",
            {
              value: category,
              onChange: (e) => setCategory(e.target.value),
              className: "w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-[#f0f6fc]",
              children: [
                /* @__PURE__ */ jsx("option", { value: "movimento", children: "Movimento ou Exercício" }),
                /* @__PURE__ */ jsx("option", { value: "estudo", children: "Estudo e Leitura" }),
                /* @__PURE__ */ jsx("option", { value: "mente", children: "Meditação, Oração ou Respiração" }),
                /* @__PURE__ */ jsx("option", { value: "sono", children: "Sono e Horário de Descanso" }),
                /* @__PURE__ */ jsx("option", { value: "hidratacao", children: "Hidratação Consciente" }),
                /* @__PURE__ */ jsx("option", { value: "desconexao", children: "Tempo Sem Redes Sociais" }),
                /* @__PURE__ */ jsx("option", { value: "personalizado", children: "Personalizado" })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-[#8b949e] mb-1", children: "Frequência Alvo" }),
          /* @__PURE__ */ jsxs(
            "select",
            {
              value: targetFrequency,
              onChange: (e) => setTargetFrequency(e.target.value),
              className: "w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-[#f0f6fc]",
              children: [
                /* @__PURE__ */ jsx("option", { value: "diario", children: "Todos os dias" }),
                /* @__PURE__ */ jsx("option", { value: "5x_semana", children: "5x por semana (dias úteis)" }),
                /* @__PURE__ */ jsx("option", { value: "3x_semana", children: "3x por semana (flexível)" })
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-[#8b949e] mb-1", children: "Notas de motivação ou intenção" }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              rows: 2,
              placeholder: "Ex: Não precisa ser exaustivo, o foco é a consistência.",
              value: notes,
              onChange: (e) => setNotes(e.target.value),
              className: "w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-[#f0f6fc] focus:outline-none focus:border-emerald-500"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2 pt-4 border-t border-[#30363d]", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => setIsModalOpen(false),
              className: "px-4 py-2 rounded-lg text-xs font-medium text-[#8b949e] hover:text-[#f0f6fc]",
              children: "Cancelar"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "submit",
              disabled: loading,
              className: "px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/20",
              children: loading ? "Salvando..." : "Criar Hábito"
            }
          )
        ] })
      ] })
    ] }) })
  ] });
};
const TabFocus = ({
  sessions,
  onRecordSession,
  initialDuration = 25,
  initialTopic = ""
}) => {
  const [sessionType, setSessionType] = useState("25_5");
  const [totalMinutes, setTotalMinutes] = useState(initialDuration);
  const [secondsLeft, setSecondsLeft] = useState(initialDuration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [focusTopic, setFocusTopic] = useState(initialTopic);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const timerRef = useRef(null);
  useEffect(() => {
    if (initialDuration) {
      setTotalMinutes(initialDuration);
      setSecondsLeft(initialDuration * 60);
    }
    if (initialTopic) {
      setFocusTopic(initialTopic);
    }
  }, [initialDuration, initialTopic]);
  const playAlertSound = () => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.8);
    } catch {
    }
  };
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setIsRunning(false);
            playAlertSound();
            onRecordSession({
              durationMinutes: totalMinutes,
              sessionType,
              status: "completed",
              focusTopic: focusTopic || "Sessão de Foco"
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1e3);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRunning, totalMinutes, sessionType, focusTopic]);
  const selectDuration = (type, mins2) => {
    setIsRunning(false);
    setSessionType(type);
    setTotalMinutes(mins2);
    setSecondsLeft(mins2 * 60);
  };
  const handleReset = () => {
    setIsRunning(false);
    setSecondsLeft(totalMinutes * 60);
  };
  const handleFinishEarly = () => {
    setIsRunning(false);
    const elapsedMinutes = Math.max(1, Math.round((totalMinutes * 60 - secondsLeft) / 60));
    onRecordSession({
      durationMinutes: elapsedMinutes,
      sessionType,
      status: "completed",
      focusTopic: focusTopic || "Sessão de Foco"
    });
    setSecondsLeft(totalMinutes * 60);
  };
  const todayStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const todayMinutes = sessions.filter((s) => s.date === todayStr).reduce((acc, s) => acc + s.durationMinutes, 0);
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const timeFormatted = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  const progressPercent = Math.round(
    (totalMinutes * 60 - secondsLeft) / (totalMinutes * 60) * 100
  );
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6 animate-fade-in max-w-4xl mx-auto", children: [
    /* @__PURE__ */ jsxs("div", { className: "bg-[#161b22] border border-[#30363d] rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden text-center", children: [
      isRunning && /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-emerald-500/5 pointer-events-none animate-pulse" }),
      /* @__PURE__ */ jsxs("div", { className: "inline-flex bg-[#0d1117] border border-[#30363d] rounded-2xl p-1 mb-8", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => selectDuration("25_5", 25),
            className: `px-4 py-2 rounded-xl text-xs font-bold transition-all ${sessionType === "25_5" ? "bg-emerald-600 text-white shadow-md" : "text-[#8b949e] hover:text-[#f0f6fc]"}`,
            children: "25 min (Pomodoro)"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => selectDuration("50_10", 50),
            className: `px-4 py-2 rounded-xl text-xs font-bold transition-all ${sessionType === "50_10" ? "bg-emerald-600 text-white shadow-md" : "text-[#8b949e] hover:text-[#f0f6fc]"}`,
            children: "50 min (Imersão)"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => selectDuration("custom", 15),
            className: `px-4 py-2 rounded-xl text-xs font-bold transition-all ${sessionType === "custom" ? "bg-emerald-600 text-white shadow-md" : "text-[#8b949e] hover:text-[#f0f6fc]"}`,
            children: "15 min (Sprint)"
          }
        )
      ] }),
      /* @__PURE__ */ jsx("div", { className: "max-w-md mx-auto mb-8", children: /* @__PURE__ */ jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsx(Target, { className: "w-4 h-4 text-emerald-400 absolute left-3.5 top-3" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            placeholder: "Em que você vai focar agora? (Ex: Redigir proposta)",
            value: focusTopic,
            onChange: (e) => setFocusTopic(e.target.value),
            className: "w-full bg-[#0d1117] border border-[#30363d] focus:border-emerald-500 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[#f0f6fc] text-center focus:outline-none"
          }
        )
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "relative w-64 h-64 sm:w-72 sm:h-72 mx-auto flex items-center justify-center my-4", children: [
        /* @__PURE__ */ jsxs("svg", { className: "w-full h-full transform -rotate-90", viewBox: "0 0 100 100", children: [
          /* @__PURE__ */ jsx(
            "circle",
            {
              cx: "50",
              cy: "50",
              r: "44",
              className: "text-[#21262d]",
              strokeWidth: "5",
              stroke: "currentColor",
              fill: "transparent"
            }
          ),
          /* @__PURE__ */ jsx(
            "circle",
            {
              cx: "50",
              cy: "50",
              r: "44",
              className: "text-emerald-500 transition-all duration-1000 ease-linear",
              strokeWidth: "5",
              strokeDasharray: 276,
              strokeDashoffset: 276 - 276 * progressPercent / 100,
              strokeLinecap: "round",
              stroke: "currentColor",
              fill: "transparent"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center", children: [
          /* @__PURE__ */ jsx("span", { className: "text-5xl sm:text-6xl font-black font-mono tracking-tight text-[#f0f6fc]", children: timeFormatted }),
          /* @__PURE__ */ jsx("span", { className: "text-xs uppercase tracking-widest text-[#8b949e] font-semibold mt-2", children: isRunning ? "Em Andamento" : secondsLeft === 0 ? "Concluído!" : "Pausado" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center gap-3 mt-6", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: handleReset,
            title: "Reiniciar temporizador",
            className: "p-3.5 rounded-2xl bg-[#0d1117] border border-[#30363d] text-[#8b949e] hover:text-[#f0f6fc] hover:border-[#484f58] transition-all",
            children: /* @__PURE__ */ jsx(RotateCcw, { className: "w-5 h-5" })
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setIsRunning(!isRunning),
            className: `px-8 py-3.5 rounded-2xl font-bold text-sm flex items-center gap-2.5 shadow-xl transition-all ${isRunning ? "bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20" : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30 glow-active"}`,
            children: isRunning ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(Pause, { className: "w-5 h-5 fill-current" }),
              " Pausar Foco"
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(Play, { className: "w-5 h-5 fill-current" }),
              " Iniciar Bloco"
            ] })
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: handleFinishEarly,
            title: "Concluir e registrar sessão agora",
            disabled: secondsLeft === totalMinutes * 60,
            className: "p-3.5 rounded-2xl bg-[#0d1117] border border-[#30363d] text-emerald-400 hover:bg-emerald-950/30 hover:border-emerald-500/50 transition-all disabled:opacity-40",
            children: /* @__PURE__ */ jsx(CheckCircle2, { className: "w-5 h-5" })
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setSoundEnabled(!soundEnabled),
            title: soundEnabled ? "Silenciar alerta sonoro" : "Ativar alerta sonoro",
            className: "p-3.5 rounded-2xl bg-[#0d1117] border border-[#30363d] text-[#8b949e] hover:text-[#f0f6fc] transition-all",
            children: soundEnabled ? /* @__PURE__ */ jsx(Volume2, { className: "w-5 h-5 text-emerald-400" }) : /* @__PURE__ */ jsx(VolumeX, { className: "w-5 h-5" })
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "bg-[#161b22] border border-[#30363d] rounded-2xl p-5", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 pb-3 border-b border-[#30363d] mb-4", children: [
          /* @__PURE__ */ jsx(Clock, { className: "w-4 h-4 text-emerald-400" }),
          /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-[#f0f6fc]", children: "Tempo de Foco de Hoje" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-baseline gap-2 mb-2", children: [
          /* @__PURE__ */ jsx("span", { className: "text-4xl font-extrabold text-emerald-400", children: todayMinutes }),
          /* @__PURE__ */ jsx("span", { className: "text-sm font-semibold text-[#8b949e]", children: "minutos focados hoje" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-[#8b949e]", children: todayMinutes >= 50 ? "🔥 Excelente consistência! Seu cérebro concluiu blocos essenciais hoje." : "Comece com 1 ou 2 blocos de 25 minutos para proteger sua atenção." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-[#161b22] border border-[#30363d] rounded-2xl p-5", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 pb-3 border-b border-[#30363d] mb-4", children: [
          /* @__PURE__ */ jsx(CheckCircle2, { className: "w-4 h-4 text-emerald-400" }),
          /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-[#f0f6fc]", children: "Sessões Concluídas Recentes" })
        ] }),
        sessions.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-xs text-[#6e7681] py-4 text-center", children: "Nenhuma sessão registrada ainda. Inicie seu primeiro bloco acima!" }) : /* @__PURE__ */ jsx("div", { className: "space-y-2 max-h-48 overflow-y-auto", children: sessions.slice(0, 5).map((s) => /* @__PURE__ */ jsxs(
          "div",
          {
            className: "flex items-center justify-between p-2.5 rounded-xl bg-[#0d1117] border border-[#30363d] text-xs",
            children: [
              /* @__PURE__ */ jsxs("div", { className: "truncate max-w-[200px]", children: [
                /* @__PURE__ */ jsx("span", { className: "font-semibold text-[#f0f6fc] block truncate", children: s.focusTopic || "Sessão de Foco" }),
                /* @__PURE__ */ jsx("span", { className: "text-[10px] text-[#6e7681]", children: s.date })
              ] }),
              /* @__PURE__ */ jsxs("span", { className: "font-mono font-bold text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-800/40", children: [
                "+",
                s.durationMinutes,
                " min"
              ] })
            ]
          },
          s.id
        )) })
      ] })
    ] })
  ] });
};
const TabJournal = ({ entries, onSaveEntry }) => {
  const todayStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const [selectedTab, setSelectedTab] = useState("daily");
  const [date, setDate] = useState(todayStr);
  const [energyScore, setEnergyScore] = useState(3);
  const [moodScore, setMoodScore] = useState(3);
  const [focusScore, setFocusScore] = useState(3);
  const [workedWell, setWorkedWell] = useState("");
  const [nextStep, setNextStep] = useState("");
  const [notes, setNotes] = useState("");
  const [difficulties, setDifficulties] = useState("");
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const existingTodayEntry = entries.find(
    (e) => e.date === date && e.entryType === (selectedTab === "daily" ? "daily_checkin" : "weekly_review")
  );
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSavedSuccess(false);
    try {
      await onSaveEntry({
        date,
        entryType: selectedTab === "daily" ? "daily_checkin" : "weekly_review",
        energyScore,
        moodScore,
        focusScore,
        workedWell,
        nextStep,
        difficulties: selectedTab === "weekly" ? difficulties : void 0,
        notes
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3e3);
    } finally {
      setLoading(false);
    }
  };
  const loadEntry = (entry) => {
    setDate(entry.date);
    setSelectedTab(entry.entryType === "daily_checkin" ? "daily" : "weekly");
    setEnergyScore(entry.energyScore || 3);
    setMoodScore(entry.moodScore || 3);
    setFocusScore(entry.focusScore || 3);
    setWorkedWell(entry.workedWell || "");
    setNextStep(entry.nextStep || "");
    setDifficulties(entry.difficulties || "");
    setNotes(entry.notes || "");
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6 animate-fade-in max-w-5xl mx-auto", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#161b22] border border-[#30363d] p-5 rounded-2xl", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
          /* @__PURE__ */ jsx(BookOpen, { className: "w-4 h-4 text-emerald-400" }),
          /* @__PURE__ */ jsx("h2", { className: "text-base font-bold text-[#f0f6fc]", children: "Diário de Bordo & Reflexão" })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-[#8b949e]", children: "Pequenos registros diários para manter clareza mental e ajustar a direção semanalmente." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0d1117] border border-[#30363d] text-xs text-[#8b949e]", children: [
        /* @__PURE__ */ jsx(Lock, { className: "w-3.5 h-3.5 text-emerald-400" }),
        /* @__PURE__ */ jsx("span", { children: "Privacidade Total: Apenas você tem acesso." })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-3 gap-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "lg:col-span-2 bg-[#161b22] border border-[#30363d] rounded-2xl p-6", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between pb-4 border-b border-[#30363d] mb-6", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex bg-[#0d1117] border border-[#30363d] rounded-xl p-1 text-xs font-semibold", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setSelectedTab("daily"),
                className: `px-4 py-1.5 rounded-lg transition-colors ${selectedTab === "daily" ? "bg-emerald-600 text-white shadow-sm" : "text-[#8b949e] hover:text-[#f0f6fc]"}`,
                children: "Check-in Diário"
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => setSelectedTab("weekly"),
                className: `px-4 py-1.5 rounded-lg transition-colors ${selectedTab === "weekly" ? "bg-emerald-600 text-white shadow-sm" : "text-[#8b949e] hover:text-[#f0f6fc]"}`,
                children: "Revisão Semanal"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            existingTodayEntry && /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => loadEntry(existingTodayEntry),
                className: "text-xs text-emerald-400 hover:text-emerald-300 underline font-medium",
                children: "Carregar registro desta data"
              }
            ),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "date",
                value: date,
                onChange: (e) => setDate(e.target.value),
                className: "bg-[#0d1117] border border-[#30363d] rounded-xl px-3 py-1.5 text-xs text-[#f0f6fc] focus:outline-none"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-5", children: [
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-[#0d1117] border border-[#30363d]", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("label", { className: "text-xs font-semibold text-[#8b949e] flex items-center gap-1.5 mb-2", children: [
                /* @__PURE__ */ jsx(Zap, { className: "w-3.5 h-3.5 text-amber-400" }),
                "Nível de Energia"
              ] }),
              /* @__PURE__ */ jsx("div", { className: "flex gap-1.5", children: [1, 2, 3, 4, 5].map((val) => /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => setEnergyScore(val),
                  className: `flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${energyScore === val ? "bg-amber-500 text-black shadow-md" : "bg-[#21262d] text-[#8b949e] hover:bg-[#30363d]"}`,
                  children: val
                },
                val
              )) })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("label", { className: "text-xs font-semibold text-[#8b949e] flex items-center gap-1.5 mb-2", children: [
                /* @__PURE__ */ jsx(Smile, { className: "w-3.5 h-3.5 text-emerald-400" }),
                "Humor / Ânimo"
              ] }),
              /* @__PURE__ */ jsx("div", { className: "flex gap-1.5", children: [1, 2, 3, 4, 5].map((val) => /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => setMoodScore(val),
                  className: `flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${moodScore === val ? "bg-emerald-500 text-black shadow-md" : "bg-[#21262d] text-[#8b949e] hover:bg-[#30363d]"}`,
                  children: val
                },
                val
              )) })
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsxs("label", { className: "text-xs font-semibold text-[#8b949e] flex items-center gap-1.5 mb-2", children: [
                /* @__PURE__ */ jsx(Target, { className: "w-3.5 h-3.5 text-indigo-400" }),
                "Foco & Clareza"
              ] }),
              /* @__PURE__ */ jsx("div", { className: "flex gap-1.5", children: [1, 2, 3, 4, 5].map((val) => /* @__PURE__ */ jsx(
                "button",
                {
                  type: "button",
                  onClick: () => setFocusScore(val),
                  className: `flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${focusScore === val ? "bg-indigo-500 text-white shadow-md" : "bg-[#21262d] text-[#8b949e] hover:bg-[#30363d]"}`,
                  children: val
                },
                val
              )) })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-[#f0f6fc] mb-1.5", children: selectedTab === "daily" ? "✨ O que funcionou bem hoje?" : "🏆 O que funcionou bem nesta semana de ciclo?" }),
            /* @__PURE__ */ jsx(
              "textarea",
              {
                rows: 3,
                placeholder: "Ex: Consegui manter a manhã focada sem olhar o celular; o treino matinal me deu disposição...",
                value: workedWell,
                onChange: (e) => setWorkedWell(e.target.value),
                className: "w-full bg-[#0d1117] border border-[#30363d] focus:border-emerald-500 rounded-xl px-3 py-2 text-xs sm:text-sm text-[#f0f6fc] focus:outline-none"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-[#f0f6fc] mb-1.5", children: selectedTab === "daily" ? "🎯 Qual é o próximo passo mais importante para amanhã?" : "🚀 Qual é o foco prioritário para a próxima semana?" }),
            /* @__PURE__ */ jsx(
              "textarea",
              {
                rows: 2,
                placeholder: "Ex: Começar logo às 08h pela tarefa de finanças e não postergar...",
                value: nextStep,
                onChange: (e) => setNextStep(e.target.value),
                className: "w-full bg-[#0d1117] border border-[#30363d] focus:border-emerald-500 rounded-xl px-3 py-2 text-xs sm:text-sm text-[#f0f6fc] focus:outline-none"
              }
            )
          ] }),
          selectedTab === "weekly" && /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-[#f0f6fc] mb-1.5", children: "⚠️ Quais dificuldades surgiram e quais ajustes você fará?" }),
            /* @__PURE__ */ jsx(
              "textarea",
              {
                rows: 2,
                placeholder: "Ex: Tive muitas reuniões quinta-feira; vou blindar as manhãs na próxima semana...",
                value: difficulties,
                onChange: (e) => setDifficulties(e.target.value),
                className: "w-full bg-[#0d1117] border border-[#30363d] focus:border-emerald-500 rounded-xl px-3 py-2 text-xs sm:text-sm text-[#f0f6fc] focus:outline-none"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-[#8b949e] mb-1.5", children: "Notas Livres / Pensamentos" }),
            /* @__PURE__ */ jsx(
              "textarea",
              {
                rows: 2,
                placeholder: "Ideias espontâneas, gratidão, observações...",
                value: notes,
                onChange: (e) => setNotes(e.target.value),
                className: "w-full bg-[#0d1117] border border-[#30363d] focus:border-emerald-500 rounded-xl px-3 py-2 text-xs sm:text-sm text-[#f0f6fc] focus:outline-none"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between pt-2", children: [
            savedSuccess ? /* @__PURE__ */ jsxs("span", { className: "text-xs text-emerald-400 font-semibold flex items-center gap-1.5", children: [
              /* @__PURE__ */ jsx(CheckCircle2, { className: "w-4 h-4" }),
              " Registro gravado com sucesso!"
            ] }) : /* @__PURE__ */ jsx("span", { className: "text-[11px] text-[#6e7681]", children: "Registros podem ser editados a qualquer momento." }),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "submit",
                disabled: loading,
                className: "px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50",
                children: loading ? "Salvando..." : "Salvar Registro"
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-[#161b22] border border-[#30363d] rounded-2xl p-5 flex flex-col", children: [
        /* @__PURE__ */ jsxs("div", { className: "pb-3 border-b border-[#30363d] mb-4", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-[#f0f6fc]", children: "Histórico de Registros" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-[#8b949e]", children: "Clique para carregar e revisar" })
        ] }),
        entries.length === 0 ? /* @__PURE__ */ jsx("div", { className: "py-12 text-center text-[#6e7681] text-xs", children: "Nenhuma anotação registrada ainda. Preencha seu primeiro check-in ao lado!" }) : /* @__PURE__ */ jsx("div", { className: "space-y-2.5 overflow-y-auto max-h-[500px]", children: entries.map((entry) => /* @__PURE__ */ jsxs(
          "div",
          {
            onClick: () => loadEntry(entry),
            className: `p-3 rounded-xl border transition-all cursor-pointer ${entry.date === date ? "border-emerald-500/50 bg-emerald-950/20" : "border-[#30363d] bg-[#0d1117] hover:border-[#484f58]"}`,
            children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-xs mb-1", children: [
                /* @__PURE__ */ jsx("span", { className: "font-bold text-[#f0f6fc]", children: entry.date }),
                /* @__PURE__ */ jsx("span", { className: "text-[10px] px-2 py-0.5 rounded bg-[#21262d] text-emerald-400", children: entry.entryType === "daily_checkin" ? "Check-in Diário" : "Revisão Semanal" })
              ] }),
              entry.workedWell && /* @__PURE__ */ jsx("p", { className: "text-[11px] text-[#8b949e] truncate mt-1", children: entry.workedWell }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 text-[10px] text-[#6e7681] mt-2", children: [
                /* @__PURE__ */ jsxs("span", { children: [
                  "Energia: ",
                  entry.energyScore,
                  "/5"
                ] }),
                /* @__PURE__ */ jsxs("span", { children: [
                  "Humor: ",
                  entry.moodScore,
                  "/5"
                ] }),
                /* @__PURE__ */ jsxs("span", { children: [
                  "Foco: ",
                  entry.focusScore,
                  "/5"
                ] })
              ] })
            ]
          },
          entry.id
        )) })
      ] })
    ] })
  ] });
};
const CATEGORIES = [
  { id: "alimentacao", label: "Alimentação" },
  { id: "moradia", label: "Moradia / Contas" },
  { id: "transporte", label: "Transporte" },
  { id: "saude", label: "Saúde" },
  { id: "educacao", label: "Educação / Livros" },
  { id: "lazer", label: "Lazer & Cultura" },
  { id: "trabalho", label: "Trabalho / Negócios" },
  { id: "renda", label: "Salário / Renda" },
  { id: "servicos", label: "Serviços & Assinaturas" },
  { id: "outros", label: "Outros" }
];
const PAYMENT_METHODS = [
  { id: "pix", label: "PIX" },
  { id: "cartao_credito", label: "Cartão de Crédito" },
  { id: "cartao_debito", label: "Cartão de Débito" },
  { id: "dinheiro", label: "Dinheiro em Espécie" },
  { id: "boleto", label: "Boleto Bancário" },
  { id: "transferencia", label: "Transferência / TED" }
];
const TabFinance = ({
  transactions,
  onAddTransaction,
  onDeleteTransaction
}) => {
  const currentMonth = (/* @__PURE__ */ new Date()).toISOString().substring(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [categoryFilter, setCategoryFilter] = useState("todas");
  const [typeFilter, setTypeFilter] = useState("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [type, setType] = useState("expense");
  const [description, setDescription] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [date, setDate] = useState((/* @__PURE__ */ new Date()).toISOString().split("T")[0]);
  const [category, setCategory] = useState("alimentacao");
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [accountWallet, setAccountWallet] = useState("Conta Principal");
  const [isRecurring, setIsRecurring] = useState(false);
  const [isInstallment, setIsInstallment] = useState(false);
  const [totalInstallments, setTotalInstallments] = useState(1);
  const [status, setStatus] = useState("paid");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const monthTransactions = transactions.filter((t) => t.date.startsWith(selectedMonth));
  const totalIncome = monthTransactions.filter((t) => t.type === "income").reduce((acc, t) => acc + t.amountCents, 0);
  const totalExpense = monthTransactions.filter((t) => t.type === "expense").reduce((acc, t) => acc + t.amountCents, 0);
  const netBalance = totalIncome - totalExpense;
  const todayStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const pendingBills = transactions.filter(
    (t) => t.status === "pending" || t.dueDate && t.dueDate >= todayStr && t.status !== "paid"
  );
  const overdueBills = transactions.filter(
    (t) => t.status === "pending" && t.dueDate && t.dueDate < todayStr
  );
  const filteredTransactions = transactions.filter((t) => {
    if (selectedMonth && !t.date.startsWith(selectedMonth)) return false;
    if (categoryFilter !== "todas" && t.category !== categoryFilter) return false;
    if (typeFilter !== "todos" && t.type !== typeFilter) return false;
    if (searchTerm && !t.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });
  const handleCreateTransaction = async (e) => {
    e.preventDefault();
    if (!description.trim() || !amountInput) return;
    setLoading(true);
    try {
      let cleanAmount = amountInput.replace("R$", "").trim();
      let amountCents = 0;
      if (cleanAmount.includes(",")) {
        const parts = cleanAmount.replace(/\./g, "").split(",");
        const whole = parseInt(parts[0], 10) || 0;
        const dec = (parts[1] + "0").slice(0, 2);
        amountCents = whole * 100 + parseInt(dec, 10);
      } else {
        amountCents = Math.round(parseFloat(cleanAmount) * 100) || 0;
      }
      await onAddTransaction({
        type,
        description,
        amountCents,
        date,
        category,
        paymentMethod,
        accountWallet,
        isRecurring,
        isInstallment,
        currentInstallment: 1,
        totalInstallments: isInstallment ? totalInstallments : 1,
        status,
        dueDate: dueDate || void 0,
        notes,
        source: "web"
      });
      setDescription("");
      setAmountInput("");
      setNotes("");
      setIsModalOpen(false);
    } finally {
      setLoading(false);
    }
  };
  const handleExportCSV = () => {
    window.open(`/api/finance?monthYear=${selectedMonth}&format=csv`, "_blank");
  };
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredTransactions, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `ritmo-financas-${selectedMonth}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6 animate-fade-in", children: [
    /* @__PURE__ */ jsxs("div", { className: "p-4 rounded-2xl bg-[#161b22] border border-[#30363d] flex items-start gap-3", children: [
      /* @__PURE__ */ jsx(Info, { className: "w-5 h-5 text-amber-400 shrink-0 mt-0.5" }),
      /* @__PURE__ */ jsxs("div", { className: "text-xs text-[#8b949e]", children: [
        /* @__PURE__ */ jsx("p", { className: "font-semibold text-[#f0f6fc]", children: "Organização Financeira Consciente" }),
        /* @__PURE__ */ jsx("p", { children: "O módulo financeiro do Ritmo é uma ferramenta de gestão e clareza pessoal de entradas e saídas. Não oferecemos recomendações de crédito, investimentos ou consultoria financeira profissional." })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "bg-[#161b22] border border-[#30363d] rounded-2xl p-5", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-xs text-[#8b949e] mb-1", children: [
          /* @__PURE__ */ jsx("span", { className: "font-semibold uppercase tracking-wider", children: "Receitas do Mês" }),
          /* @__PURE__ */ jsx("div", { className: "w-7 h-7 rounded-lg bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 flex items-center justify-center", children: /* @__PURE__ */ jsx(ArrowDownLeft, { className: "w-4 h-4" }) })
        ] }),
        /* @__PURE__ */ jsx("span", { className: "text-2xl font-black text-[#f0f6fc]", children: (totalIncome / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) }),
        /* @__PURE__ */ jsxs("span", { className: "text-[11px] text-[#6e7681] block mt-1", children: [
          monthTransactions.filter((t) => t.type === "income").length,
          " lançamento(s)"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-[#161b22] border border-[#30363d] rounded-2xl p-5", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-xs text-[#8b949e] mb-1", children: [
          /* @__PURE__ */ jsx("span", { className: "font-semibold uppercase tracking-wider", children: "Despesas do Mês" }),
          /* @__PURE__ */ jsx("div", { className: "w-7 h-7 rounded-lg bg-rose-950/60 border border-rose-800/40 text-rose-400 flex items-center justify-center", children: /* @__PURE__ */ jsx(ArrowUpRight, { className: "w-4 h-4" }) })
        ] }),
        /* @__PURE__ */ jsx("span", { className: "text-2xl font-black text-[#f0f6fc]", children: (totalExpense / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) }),
        /* @__PURE__ */ jsxs("span", { className: "text-[11px] text-[#6e7681] block mt-1", children: [
          monthTransactions.filter((t) => t.type === "expense").length,
          " lançamento(s)"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-[#161b22] border border-[#30363d] rounded-2xl p-5", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-xs text-[#8b949e] mb-1", children: [
          /* @__PURE__ */ jsx("span", { className: "font-semibold uppercase tracking-wider", children: "Saldo Líquido" }),
          /* @__PURE__ */ jsx("div", { className: "w-7 h-7 rounded-lg bg-amber-950/60 border border-amber-800/40 text-amber-400 flex items-center justify-center", children: /* @__PURE__ */ jsx(Wallet, { className: "w-4 h-4" }) })
        ] }),
        /* @__PURE__ */ jsx(
          "span",
          {
            className: `text-2xl font-black ${netBalance >= 0 ? "text-emerald-400" : "text-rose-400"}`,
            children: (netBalance / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
          }
        ),
        /* @__PURE__ */ jsx("span", { className: "text-[11px] text-[#6e7681] block mt-1", children: netBalance >= 0 ? "Superávit no período" : "Atenção aos limites de gastos" })
      ] })
    ] }),
    overdueBills.length > 0 && /* @__PURE__ */ jsxs("div", { className: "p-3.5 rounded-xl bg-rose-950/30 border border-rose-800/40 text-rose-300 text-xs flex items-center gap-2", children: [
      /* @__PURE__ */ jsx(AlertCircle, { className: "w-4 h-4 shrink-0" }),
      /* @__PURE__ */ jsxs("span", { children: [
        "Você tem ",
        /* @__PURE__ */ jsxs("strong", { children: [
          overdueBills.length,
          " conta(s) com vencimento atrasado"
        ] }),
        " que precisa de atenção."
      ] })
    ] }),
    pendingBills.length > 0 && /* @__PURE__ */ jsxs("div", { className: "p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-300 text-xs flex items-center gap-2", children: [
      /* @__PURE__ */ jsx(AlertCircle, { className: "w-4 h-4 shrink-0" }),
      /* @__PURE__ */ jsxs("span", { children: [
        "Você tem ",
        /* @__PURE__ */ jsxs("strong", { children: [
          pendingBills.length,
          " conta(s) pendente(s) ou a pagar"
        ] }),
        " este mês."
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-[#161b22] border border-[#30363d] p-4 rounded-2xl", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "month",
            value: selectedMonth,
            onChange: (e) => setSelectedMonth(e.target.value),
            className: "bg-[#0d1117] border border-[#30363d] rounded-xl px-3 py-2 text-xs font-semibold text-[#f0f6fc] focus:outline-none"
          }
        ),
        /* @__PURE__ */ jsxs(
          "select",
          {
            value: typeFilter,
            onChange: (e) => setTypeFilter(e.target.value),
            className: "bg-[#0d1117] border border-[#30363d] rounded-xl px-3 py-2 text-xs text-[#f0f6fc] focus:outline-none",
            children: [
              /* @__PURE__ */ jsx("option", { value: "todos", children: "Todos os Tipos" }),
              /* @__PURE__ */ jsx("option", { value: "expense", children: "Despesas" }),
              /* @__PURE__ */ jsx("option", { value: "income", children: "Receitas" })
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "select",
          {
            value: categoryFilter,
            onChange: (e) => setCategoryFilter(e.target.value),
            className: "bg-[#0d1117] border border-[#30363d] rounded-xl px-3 py-2 text-xs text-[#f0f6fc] focus:outline-none",
            children: [
              /* @__PURE__ */ jsx("option", { value: "todas", children: "Todas Categorias" }),
              CATEGORIES.map((c) => /* @__PURE__ */ jsx("option", { value: c.id, children: c.label }, c.id))
            ]
          }
        ),
        /* @__PURE__ */ jsxs("div", { className: "relative", children: [
          /* @__PURE__ */ jsx(Search, { className: "w-3.5 h-3.5 text-[#6e7681] absolute left-3 top-3" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              placeholder: "Buscar descrição...",
              value: searchTerm,
              onChange: (e) => setSearchTerm(e.target.value),
              className: "bg-[#0d1117] border border-[#30363d] rounded-xl pl-8 pr-3 py-2 text-xs text-[#f0f6fc] focus:outline-none focus:border-emerald-500 w-44"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 shrink-0", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: handleExportCSV,
            title: "Exportar lançamentos para CSV",
            className: "px-3 py-2 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-xs font-medium text-[#8b949e] hover:text-[#f0f6fc] flex items-center gap-1.5 transition-colors",
            children: [
              /* @__PURE__ */ jsx(Download, { className: "w-3.5 h-3.5" }),
              "CSV"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: handleExportJSON,
            title: "Exportar lançamentos para JSON",
            className: "px-3 py-2 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-xs font-medium text-[#8b949e] hover:text-[#f0f6fc] flex items-center gap-1.5 transition-colors",
            children: [
              /* @__PURE__ */ jsx(Download, { className: "w-3.5 h-3.5" }),
              "JSON"
            ]
          }
        ),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setIsModalOpen(true),
            className: "px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all",
            children: [
              /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }),
              "Novo Lançamento"
            ]
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "bg-[#161b22] border border-[#30363d] rounded-2xl overflow-hidden", children: /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse", children: [
      /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-[#30363d] bg-[#0d1117] text-xs font-semibold text-[#8b949e]", children: [
        /* @__PURE__ */ jsx("th", { className: "py-3 px-4", children: "Data" }),
        /* @__PURE__ */ jsx("th", { className: "py-3 px-4", children: "Descrição" }),
        /* @__PURE__ */ jsx("th", { className: "py-3 px-4", children: "Categoria" }),
        /* @__PURE__ */ jsx("th", { className: "py-3 px-4", children: "Conta / Método" }),
        /* @__PURE__ */ jsx("th", { className: "py-3 px-4", children: "Status / Vencimento" }),
        /* @__PURE__ */ jsx("th", { className: "py-3 px-4 text-right", children: "Valor" }),
        /* @__PURE__ */ jsx("th", { className: "py-3 px-3 text-center", children: "Ações" })
      ] }) }),
      /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-[#30363d]", children: filteredTransactions.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 7, className: "py-12 text-center text-xs text-[#6e7681]", children: "Nenhum lançamento encontrado para os filtros selecionados." }) }) : filteredTransactions.map((tx) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-[#1c2128]/50 transition-colors", children: [
        /* @__PURE__ */ jsx("td", { className: "py-3.5 px-4 text-xs font-mono text-[#8b949e] whitespace-nowrap", children: tx.date }),
        /* @__PURE__ */ jsxs("td", { className: "py-3.5 px-4", children: [
          /* @__PURE__ */ jsx("div", { className: "font-semibold text-xs text-[#f0f6fc]", children: tx.description }),
          tx.notes && /* @__PURE__ */ jsx("div", { className: "text-[11px] text-[#8b949e] truncate max-w-xs", children: tx.notes }),
          tx.isInstallment && /* @__PURE__ */ jsxs("span", { className: "text-[10px] text-amber-400 font-medium", children: [
            "Parcela ",
            tx.currentInstallment,
            "/",
            tx.totalInstallments
          ] })
        ] }),
        /* @__PURE__ */ jsx("td", { className: "py-3.5 px-4 text-xs text-[#8b949e] whitespace-nowrap", children: /* @__PURE__ */ jsx("span", { className: "px-2 py-0.5 rounded-md bg-[#21262d] text-[#c9d1d9] text-[11px]", children: CATEGORIES.find((c) => c.id === tx.category)?.label || tx.category }) }),
        /* @__PURE__ */ jsxs("td", { className: "py-3.5 px-4 text-xs text-[#8b949e] whitespace-nowrap", children: [
          /* @__PURE__ */ jsx("div", { children: tx.accountWallet }),
          /* @__PURE__ */ jsx("div", { className: "text-[10px] text-[#6e7681] uppercase", children: tx.paymentMethod })
        ] }),
        /* @__PURE__ */ jsxs("td", { className: "py-3.5 px-4 text-xs whitespace-nowrap", children: [
          /* @__PURE__ */ jsx(
            "span",
            {
              className: `px-2 py-0.5 rounded-full text-[10px] font-semibold ${tx.status === "paid" || tx.status === "received" ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40" : tx.dueDate && tx.dueDate < todayStr ? "bg-rose-950/60 text-rose-400 border border-rose-800/40" : "bg-amber-950/60 text-amber-400 border border-amber-800/40"}`,
              children: tx.status === "paid" ? "Pago" : tx.status === "received" ? "Recebido" : tx.dueDate && tx.dueDate < todayStr ? "Atrasado" : "Pendente"
            }
          ),
          tx.dueDate && /* @__PURE__ */ jsxs("div", { className: "text-[10px] text-[#6e7681] mt-0.5", children: [
            "Venc: ",
            tx.dueDate
          ] })
        ] }),
        /* @__PURE__ */ jsxs(
          "td",
          {
            className: `py-3.5 px-4 text-right text-xs font-mono font-bold whitespace-nowrap ${tx.type === "income" ? "text-emerald-400" : "text-[#f0f6fc]"}`,
            children: [
              tx.type === "income" ? "+" : "-",
              (tx.amountCents / 100).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL"
              })
            ]
          }
        ),
        /* @__PURE__ */ jsx("td", { className: "py-3.5 px-3 text-center whitespace-nowrap", children: /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => onDeleteTransaction(tx.id),
            className: "p-1 rounded text-[#6e7681] hover:text-rose-400 transition-colors",
            title: "Excluir lançamento",
            children: /* @__PURE__ */ jsx(Trash2, { className: "w-3.5 h-3.5" })
          }
        ) })
      ] }, tx.id)) })
    ] }) }) }),
    isModalOpen && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in", children: /* @__PURE__ */ jsxs("div", { className: "bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-lg p-6 shadow-2xl relative", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => setIsModalOpen(false),
          className: "absolute top-4 right-4 p-1.5 rounded-lg text-[#8b949e] hover:text-[#f0f6fc]",
          children: "×"
        }
      ),
      /* @__PURE__ */ jsx("h3", { className: "text-base font-bold text-[#f0f6fc] mb-4", children: "Novo Lançamento Financeiro" }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleCreateTransaction, className: "space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-2 p-1 bg-[#0d1117] rounded-xl border border-[#30363d]", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => setType("expense"),
              className: `py-2 rounded-lg text-xs font-bold transition-all ${type === "expense" ? "bg-rose-600 text-white shadow-md" : "text-[#8b949e] hover:text-[#f0f6fc]"}`,
              children: "Despesa (-)"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => setType("income"),
              className: `py-2 rounded-lg text-xs font-bold transition-all ${type === "income" ? "bg-emerald-600 text-white shadow-md" : "text-[#8b949e] hover:text-[#f0f6fc]"}`,
              children: "Receita (+)"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-[#8b949e] mb-1", children: "Descrição *" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              required: true,
              placeholder: "Ex: Mercado semanal, Internet, Salário...",
              value: description,
              onChange: (e) => setDescription(e.target.value),
              className: "w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-[#f0f6fc] focus:outline-none focus:border-emerald-500"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-[#8b949e] mb-1", children: "Valor (R$) *" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                required: true,
                placeholder: "Ex: 120,50 ou 800",
                value: amountInput,
                onChange: (e) => setAmountInput(e.target.value),
                className: "w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-[#f0f6fc] font-mono focus:outline-none focus:border-emerald-500"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-[#8b949e] mb-1", children: "Data" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "date",
                value: date,
                onChange: (e) => setDate(e.target.value),
                className: "w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-[#f0f6fc] focus:outline-none"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-[#8b949e] mb-1", children: "Categoria" }),
            /* @__PURE__ */ jsx(
              "select",
              {
                value: category,
                onChange: (e) => setCategory(e.target.value),
                className: "w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-[#f0f6fc]",
                children: CATEGORIES.map((c) => /* @__PURE__ */ jsx("option", { value: c.id, children: c.label }, c.id))
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-[#8b949e] mb-1", children: "Forma de Pagamento" }),
            /* @__PURE__ */ jsx(
              "select",
              {
                value: paymentMethod,
                onChange: (e) => setPaymentMethod(e.target.value),
                className: "w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-[#f0f6fc]",
                children: PAYMENT_METHODS.map((m) => /* @__PURE__ */ jsx("option", { value: m.id, children: m.label }, m.id))
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-[#8b949e] mb-1", children: "Conta / Carteira" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: accountWallet,
                onChange: (e) => setAccountWallet(e.target.value),
                className: "w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-[#f0f6fc]"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-[#8b949e] mb-1", children: "Status" }),
            /* @__PURE__ */ jsxs(
              "select",
              {
                value: status,
                onChange: (e) => setStatus(e.target.value),
                className: "w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-[#f0f6fc]",
                children: [
                  /* @__PURE__ */ jsx("option", { value: "paid", children: "Pago" }),
                  /* @__PURE__ */ jsx("option", { value: "pending", children: "Pendente / A Pagar" }),
                  /* @__PURE__ */ jsx("option", { value: "received", children: "Recebido" })
                ]
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-4 pt-1", children: [
          /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-1.5 text-xs text-[#8b949e] cursor-pointer", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "checkbox",
                checked: isRecurring,
                onChange: (e) => setIsRecurring(e.target.checked),
                className: "rounded border-[#30363d] bg-[#0d1117] text-emerald-500 focus:ring-0"
              }
            ),
            /* @__PURE__ */ jsx("span", { children: "Recorrente" })
          ] }),
          /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-1.5 text-xs text-[#8b949e] cursor-pointer", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "checkbox",
                checked: isInstallment,
                onChange: (e) => setIsInstallment(e.target.checked),
                className: "rounded border-[#30363d] bg-[#0d1117] text-emerald-500 focus:ring-0"
              }
            ),
            /* @__PURE__ */ jsx("span", { children: "Compra Parcelada" })
          ] }),
          isInstallment && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: "text-xs text-[#8b949e]", children: "Total parcelas:" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "number",
                min: "2",
                max: "48",
                value: totalInstallments,
                onChange: (e) => setTotalInstallments(Number(e.target.value)),
                className: "w-16 bg-[#0d1117] border border-[#30363d] rounded-lg px-2 py-1 text-xs text-[#f0f6fc]"
              }
            )
          ] }),
          status === "pending" && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: "text-xs text-[#8b949e]", children: "Vencimento:" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "date",
                value: dueDate,
                onChange: (e) => setDueDate(e.target.value),
                className: "bg-[#0d1117] border border-[#30363d] rounded-lg px-2 py-1 text-xs text-[#f0f6fc]"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-[#8b949e] mb-1", children: "Observações (opcional)" }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              rows: 2,
              placeholder: "Detalhes adicionais...",
              value: notes,
              onChange: (e) => setNotes(e.target.value),
              className: "w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-[#f0f6fc] focus:outline-none"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2 pt-4 border-t border-[#30363d]", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => setIsModalOpen(false),
              className: "px-4 py-2 rounded-lg text-xs font-medium text-[#8b949e] hover:text-[#f0f6fc]",
              children: "Cancelar"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "submit",
              disabled: loading,
              className: "px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/20",
              children: loading ? "Salvando..." : "Salvar Lançamento"
            }
          )
        ] })
      ] })
    ] }) })
  ] });
};
const EXAMPLE_MESSAGES = [
  "Gastei 42,50 no almoço.",
  "Paguei R$ 120 de internet hoje.",
  "Recebi 800 reais de um trabalho.",
  "Comprei mercado por 235,70 no cartão.",
  "Paguei 60 de transporte ontem.",
  "quanto gastei este mês?",
  "quais contas vencem esta semana?",
  "Almoço no restaurante"
  // Ambiguous (missing amount)
];
const TabWhatsApp = ({ userPhone, onRefreshFinance }) => {
  const [inputMessage, setInputMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([
    {
      sender: "bot",
      text: '👋 Olá! Sou o assistente financeiro do Ritmo via WhatsApp Oficial.\n\nEnvie uma mensagem em linguagem natural, por exemplo:\n• "Gastei 42,50 no almoço."\n• "Recebi 800 reais de freela."\n• "quanto gastei este mês?"',
      time: "Agora"
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [phoneInput, setPhoneInput] = useState(userPhone || "5511999998888");
  const [savePhoneStatus, setSavePhoneStatus] = useState(null);
  const handleSendMessage = async (msgToSend) => {
    const text = (msgToSend || inputMessage).trim();
    if (!text) return;
    const timeStr = (/* @__PURE__ */ new Date()).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    setChatHistory((prev) => [...prev, { sender: "user", text, time: timeStr }]);
    setInputMessage("");
    setLoading(true);
    try {
      const res = await fetch("/api/integrations?action=simulate_whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text })
      });
      const data = await res.json();
      const botReply = data.parsed?.replyMessage || "Mensagem processada.";
      setChatHistory((prev) => [
        ...prev,
        {
          sender: "bot",
          text: botReply,
          details: data.transaction || null,
          time: (/* @__PURE__ */ new Date()).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
        }
      ]);
      if (data.transaction) {
        onRefreshFinance();
      }
    } catch {
      setChatHistory((prev) => [
        ...prev,
        {
          sender: "bot",
          text: "Erro de comunicação ao processar lançamento.",
          time: (/* @__PURE__ */ new Date()).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };
  const handleSavePhone = async () => {
    setSavePhoneStatus("Salvando...");
    try {
      const res = await fetch("/api/integrations?action=update_config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsappPhone: phoneInput, whatsappStatus: "connected" })
      });
      if (res.ok) {
        setSavePhoneStatus("Telefone vinculado com sucesso!");
        setTimeout(() => setSavePhoneStatus(null), 3e3);
      }
    } catch {
      setSavePhoneStatus("Erro ao salvar.");
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6 animate-fade-in max-w-5xl mx-auto", children: [
    /* @__PURE__ */ jsxs("div", { className: "bg-[#161b22] border border-[#30363d] p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-800/40 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2", children: [
          /* @__PURE__ */ jsx(Smartphone, { className: "w-3.5 h-3.5" }),
          "WhatsApp Business Cloud API Oficial"
        ] }),
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-extrabold text-[#f0f6fc]", children: "Lançamentos Financeiros por WhatsApp" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs sm:text-sm text-[#8b949e] mt-1 max-w-2xl", children: "Registre despesas, receitas e consulte saldos enviando mensagens naturais pelo WhatsApp. Integrado de forma oficial, segura e sem armazenamento de dados bancários desnecessários." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-[#0d1117] border border-[#30363d] rounded-xl p-3.5 min-w-[280px]", children: [
        /* @__PURE__ */ jsx("span", { className: "text-[11px] font-semibold text-[#8b949e] block mb-1", children: "Seu Número de WhatsApp Autorizado" }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              placeholder: "+55 11 99999-9999",
              value: phoneInput,
              onChange: (e) => setPhoneInput(e.target.value),
              className: "w-full bg-[#161b22] border border-[#30363d] rounded-lg px-2.5 py-1.5 text-xs text-[#f0f6fc] font-mono focus:outline-none focus:border-emerald-500"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: handleSavePhone,
              className: "px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shrink-0",
              children: "Vincular"
            }
          )
        ] }),
        savePhoneStatus && /* @__PURE__ */ jsx("span", { className: "text-[10px] text-emerald-400 block mt-1", children: savePhoneStatus })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-12 gap-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "lg:col-span-7 bg-[#161b22] border border-[#30363d] rounded-2xl flex flex-col h-[580px] shadow-xl overflow-hidden", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-[#0d1117] border-b border-[#30363d] px-4 py-3 flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
            /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xs", children: "R" }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-[#f0f6fc] block", children: "Ritmo Finanças Bot" }),
              /* @__PURE__ */ jsxs("span", { className: "text-[10px] text-emerald-400 flex items-center gap-1", children: [
                /* @__PURE__ */ jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" }),
                "Simulador Ativo • Processamento Natural"
              ] })
            ] })
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setChatHistory([
                {
                  sender: "bot",
                  text: "Conversa reiniciada. Envie um novo lançamento para testar!",
                  time: "Agora"
                }
              ]),
              className: "p-1.5 rounded-lg text-[#6e7681] hover:text-[#f0f6fc]",
              title: "Limpar histórico do chat",
              children: /* @__PURE__ */ jsx(RefreshCw, { className: "w-3.5 h-3.5" })
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "p-3 bg-[#0d1117]/50 border-b border-[#30363d]/60 overflow-x-auto whitespace-nowrap flex gap-1.5", children: [
          /* @__PURE__ */ jsx("span", { className: "text-[10px] text-[#6e7681] self-center pr-1", children: "Exemplos:" }),
          EXAMPLE_MESSAGES.map((msg, i) => /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: () => handleSendMessage(msg),
              className: "px-2.5 py-1 rounded-full bg-[#21262d] hover:bg-[#30363d] text-[11px] text-[#c9d1d9] border border-[#30363d] transition-colors",
              children: msg
            },
            i
          ))
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1 p-4 overflow-y-auto space-y-3", children: [
          chatHistory.map((m, idx) => /* @__PURE__ */ jsxs(
            "div",
            {
              className: `flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`,
              children: [
                /* @__PURE__ */ jsxs(
                  "div",
                  {
                    className: `max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow-sm whitespace-pre-wrap ${m.sender === "user" ? "bg-emerald-600 text-white rounded-br-none" : "bg-[#21262d] text-[#f0f6fc] rounded-bl-none border border-[#30363d]"}`,
                    children: [
                      m.text,
                      m.details && /* @__PURE__ */ jsxs("div", { className: "mt-2 pt-2 border-t border-[#30363d] text-[11px] text-emerald-300 font-mono", children: [
                        "✓ Salvo no Banco: #",
                        m.details.id,
                        " • ",
                        m.details.category
                      ] })
                    ]
                  }
                ),
                /* @__PURE__ */ jsx("span", { className: "text-[9px] text-[#6e7681] mt-1 px-1", children: m.time })
              ]
            },
            idx
          )),
          loading && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-xs text-[#8b949e]", children: [
            /* @__PURE__ */ jsx("span", { className: "w-2 h-2 rounded-full bg-emerald-400 animate-bounce" }),
            /* @__PURE__ */ jsx("span", { className: "w-2 h-2 rounded-full bg-emerald-400 animate-bounce delay-100" }),
            /* @__PURE__ */ jsx("span", { className: "w-2 h-2 rounded-full bg-emerald-400 animate-bounce delay-200" }),
            /* @__PURE__ */ jsx("span", { className: "text-[11px] ml-1", children: "Analisando mensagem..." })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(
          "form",
          {
            onSubmit: (e) => {
              e.preventDefault();
              handleSendMessage();
            },
            className: "p-3 bg-[#0d1117] border-t border-[#30363d] flex gap-2",
            children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  placeholder: 'Digite algo como "Gastei 55 no mercado" ou "quanto gastei?"',
                  value: inputMessage,
                  onChange: (e) => setInputMessage(e.target.value),
                  className: "flex-1 bg-[#161b22] border border-[#30363d] focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-[#f0f6fc] focus:outline-none"
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  type: "submit",
                  disabled: loading || !inputMessage.trim(),
                  className: "p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40 transition-colors",
                  children: /* @__PURE__ */ jsx(Send, { className: "w-4 h-4" })
                }
              )
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "lg:col-span-5 space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "bg-[#161b22] border border-[#30363d] rounded-2xl p-5", children: [
          /* @__PURE__ */ jsxs("h3", { className: "text-sm font-bold text-[#f0f6fc] flex items-center gap-2 mb-3", children: [
            /* @__PURE__ */ jsx(ShieldCheck, { className: "w-4 h-4 text-emerald-400" }),
            "Arquitetura Oficial WhatsApp Cloud API"
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-3 text-xs text-[#8b949e]", children: [
            /* @__PURE__ */ jsxs("p", { children: [
              "O Ritmo foi projetado com suporte estrito à ",
              /* @__PURE__ */ jsx("strong", { children: "WhatsApp Business Platform / Cloud API oficial da Meta" }),
              ". Não usamos métodos piratas ou automações não autorizadas."
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "p-3 rounded-xl bg-[#0d1117] border border-[#30363d] space-y-2", children: [
              /* @__PURE__ */ jsx("div", { className: "font-semibold text-[#f0f6fc]", children: "Endpoint de Webhook Ativo:" }),
              /* @__PURE__ */ jsx("code", { className: "block bg-[#161b22] p-2 rounded text-[11px] text-emerald-400 break-all font-mono", children: "/api/integrations" }),
              /* @__PURE__ */ jsxs("p", { className: "text-[11px] text-[#6e7681]", children: [
                "Suporta verificação automática ",
                /* @__PURE__ */ jsx("code", { className: "text-[#8b949e]", children: "hub.challenge" }),
                " e autenticação via ",
                /* @__PURE__ */ jsx("code", { className: "text-[#8b949e]", children: "hub.verify_token" }),
                "."
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "space-y-1.5 pt-2", children: [
              /* @__PURE__ */ jsx("div", { className: "font-semibold text-[#f0f6fc]", children: "Variáveis de Ambiente Necessárias:" }),
              /* @__PURE__ */ jsxs("ul", { className: "list-disc list-inside space-y-1 text-[11px] text-[#8b949e]", children: [
                /* @__PURE__ */ jsxs("li", { children: [
                  /* @__PURE__ */ jsx("code", { className: "text-[#f0f6fc]", children: "WHATSAPP_VERIFY_TOKEN" }),
                  " — Token de verificação da Meta"
                ] }),
                /* @__PURE__ */ jsxs("li", { children: [
                  /* @__PURE__ */ jsx("code", { className: "text-[#f0f6fc]", children: "WHATSAPP_PHONE_NUMBER_ID" }),
                  " — ID do número oficial na Meta"
                ] }),
                /* @__PURE__ */ jsxs("li", { children: [
                  /* @__PURE__ */ jsx("code", { className: "text-[#f0f6fc]", children: "WHATSAPP_ACCESS_TOKEN" }),
                  " — Token de sistema permanente"
                ] }),
                /* @__PURE__ */ jsxs("li", { children: [
                  /* @__PURE__ */ jsx("code", { className: "text-[#f0f6fc]", children: "WHATSAPP_APP_SECRET" }),
                  " — Assinatura HMAC-SHA256"
                ] })
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "p-3 rounded-xl bg-amber-950/20 border border-amber-800/40 text-[11px] text-amber-300", children: [
              /* @__PURE__ */ jsx("strong", { children: "Status de Credenciais:" }),
              " Caso as credenciais da Meta não tenham sido configuradas nas variáveis de ambiente do servidor, utilize o simulador à esquerda para testar todo o fluxo de parsing e gravação no banco de dados com fidelidade de 100%."
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "bg-[#161b22] border border-[#30363d] rounded-2xl p-5", children: [
          /* @__PURE__ */ jsx("h4", { className: "text-xs font-bold text-[#f0f6fc] uppercase tracking-wider mb-2", children: "Regras de Privacidade & Segurança do Bot" }),
          /* @__PURE__ */ jsxs("ul", { className: "space-y-1.5 text-xs text-[#8b949e]", children: [
            /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-1.5", children: [
              /* @__PURE__ */ jsx(CheckCircle2, { className: "w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" }),
              /* @__PURE__ */ jsx("span", { children: "Mensagens de números não vinculados à conta são rejeitadas de imediato." })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-1.5", children: [
              /* @__PURE__ */ jsx(CheckCircle2, { className: "w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" }),
              /* @__PURE__ */ jsx("span", { children: "Mensagens ambíguas não são gravadas; o assistente solicita o detalhe faltante." })
            ] }),
            /* @__PURE__ */ jsxs("li", { className: "flex items-start gap-1.5", children: [
              /* @__PURE__ */ jsx(CheckCircle2, { className: "w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" }),
              /* @__PURE__ */ jsx("span", { children: "Logs do servidor não armazenam descrições ou valores confidenciais." })
            ] })
          ] })
        ] })
      ] })
    ] })
  ] });
};
const TabSheets = ({ onExportCSV }) => {
  const [spreadsheetId, setSpreadsheetId] = useState("");
  const [spreadsheetName, setSpreadsheetName] = useState("Ritmo - Minhas Finanças");
  const [autoSync, setAutoSync] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);
  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const res = await fetch("/api/integrations?action=sync_sheets", {
        method: "POST"
      });
      const data = await res.json();
      setSyncStatus({
        success: data.success,
        message: data.message || (data.success ? "Sincronização concluída!" : "Falha na sincronização.")
      });
    } catch {
      setSyncStatus({
        success: false,
        message: "Erro de rede ao comunicar com o servidor de sincronização."
      });
    } finally {
      setIsSyncing(false);
    }
  };
  const handleSaveConfig = async () => {
    try {
      await fetch("/api/integrations?action=update_config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sheetsSpreadsheetId: spreadsheetId,
          sheetsSpreadsheetName: spreadsheetName,
          sheetsAutoSync: autoSync,
          sheetsStatus: spreadsheetId ? "configured" : "disconnected"
        })
      });
      setSyncStatus({ success: true, message: "Configurações de planilha salvas com sucesso." });
    } catch {
      setSyncStatus({ success: false, message: "Erro ao salvar configurações." });
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6 animate-fade-in max-w-4xl mx-auto", children: [
    /* @__PURE__ */ jsxs("div", { className: "bg-[#161b22] border border-[#30363d] p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-800/40 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2", children: [
          /* @__PURE__ */ jsx(FileSpreadsheet, { className: "w-3.5 h-3.5" }),
          "Integração com Planilha (Google Sheets)"
        ] }),
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-extrabold text-[#f0f6fc]", children: "Sincronização Automática & Exportação" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs sm:text-sm text-[#8b949e] mt-1 max-w-2xl", children: "Cada lançamento confirmado é gravado primeiro no banco de dados seguro do Ritmo e, opcionalmente, espelhado na sua planilha do Google Sheets." })
      ] }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: onExportCSV,
          className: "px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2 shadow-md transition-all shrink-0",
          children: [
            /* @__PURE__ */ jsx(Download, { className: "w-4 h-4" }),
            "Baixar CSV Direto"
          ]
        }
      )
    ] }),
    syncStatus && /* @__PURE__ */ jsxs(
      "div",
      {
        className: `p-4 rounded-xl border flex items-center gap-2.5 text-xs ${syncStatus.success ? "bg-emerald-950/30 border-emerald-800/40 text-emerald-300" : "bg-amber-950/30 border-amber-800/40 text-amber-300"}`,
        children: [
          syncStatus.success ? /* @__PURE__ */ jsx(CheckCircle2, { className: "w-4 h-4 shrink-0" }) : /* @__PURE__ */ jsx(AlertCircle, { className: "w-4 h-4 shrink-0" }),
          /* @__PURE__ */ jsx("span", { children: syncStatus.message })
        ]
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "bg-[#161b22] border border-[#30363d] rounded-2xl p-6 space-y-5", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-[#f0f6fc]", children: "Configuração da Planilha do Google" }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-[#8b949e] mb-1", children: "ID da Planilha Google (Spreadsheet ID)" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              placeholder: "Ex: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms",
              value: spreadsheetId,
              onChange: (e) => setSpreadsheetId(e.target.value),
              className: "w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-[#f0f6fc] font-mono focus:outline-none focus:border-emerald-500"
            }
          ),
          /* @__PURE__ */ jsx("p", { className: "text-[10px] text-[#6e7681] mt-1", children: 'O código alfanumérico que fica entre "/d/" e "/edit" na URL da sua planilha.' })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-[#8b949e] mb-1", children: "Nome da Aba / Página" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: spreadsheetName,
              onChange: (e) => setSpreadsheetName(e.target.value),
              className: "w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-[#f0f6fc] focus:outline-none focus:border-emerald-500"
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "checkbox",
            id: "chk-auto-sync",
            checked: autoSync,
            onChange: (e) => setAutoSync(e.target.checked),
            className: "rounded border-[#30363d] bg-[#0d1117] text-emerald-500 focus:ring-0"
          }
        ),
        /* @__PURE__ */ jsx("label", { htmlFor: "chk-auto-sync", className: "text-xs text-[#8b949e] cursor-pointer", children: "Sincronizar lançamentos automaticamente quando forem confirmados" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#30363d]", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: handleManualSync,
            disabled: isSyncing,
            className: "px-4 py-2 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-xs font-medium text-[#f0f6fc] flex items-center gap-2 transition-colors disabled:opacity-40",
            children: [
              /* @__PURE__ */ jsx(RefreshCw, { className: `w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}` }),
              isSyncing ? "Sincronizando..." : "Testar Sincronização Agora"
            ]
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: handleSaveConfig,
            className: "px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition-colors",
            children: "Salvar Configurações"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-[#161b22] border border-[#30363d] rounded-2xl p-6 space-y-4", children: [
      /* @__PURE__ */ jsx("h4", { className: "text-xs font-bold text-[#f0f6fc] uppercase tracking-wider", children: "Estrutura Padronizada das Colunas" }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-[#8b949e]", children: "Sua planilha deve conter as seguintes colunas na primeira linha (cabeçalho) para espelhar com integridade idempotente:" }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs font-mono", children: [
        "ID",
        "Data",
        "Tipo",
        "Descrição",
        "Categoria",
        "Valor",
        "Conta",
        "FormaPagamento",
        "Status",
        "Observações"
      ].map((col) => /* @__PURE__ */ jsx("div", { className: "p-2 rounded-lg bg-[#0d1117] border border-[#30363d] text-emerald-400", children: col }, col)) }),
      /* @__PURE__ */ jsxs("div", { className: "p-4 rounded-xl bg-[#0d1117] border border-[#30363d] space-y-2 text-xs text-[#8b949e]", children: [
        /* @__PURE__ */ jsxs("div", { className: "font-semibold text-[#f0f6fc] flex items-center gap-1.5", children: [
          /* @__PURE__ */ jsx(Key, { className: "w-4 h-4 text-emerald-400" }),
          "Configuração de Credenciais Externas:"
        ] }),
        /* @__PURE__ */ jsxs("p", { children: [
          "Para habilitar a escrita em segundo plano pelo servidor, adicione a variável de ambiente ",
          /* @__PURE__ */ jsx("code", { className: "text-[#f0f6fc]", children: "GOOGLE_SERVICE_ACCOUNT_KEY" }),
          " com o JSON da Conta de Serviço do Google Cloud e compartilhe a planilha com o e-mail da conta de serviço com permissão de Editor."
        ] })
      ] })
    ] })
  ] });
};
const TabAffiliates = ({
  affiliateStats,
  commissions
}) => {
  const [copied, setCopied] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [simulatedGross, setSimulatedGross] = useState("97,00");
  const [webhookResult, setWebhookResult] = useState(null);
  const fullShareUrl = typeof window !== "undefined" ? `${window.location.origin}/?ref=${affiliateStats.referralCode}` : `https://meu-ritmo.netlify.app/?ref=${affiliateStats.referralCode}`;
  const handleCopyLink = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(fullShareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };
  const handleSimulateWebhook = async () => {
    try {
      const grossCents = Math.round(parseFloat(simulatedGross.replace(",", ".")) * 100);
      const res = await fetch("/api/affiliates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "process_billing_webhook",
          eventId: "evt_" + Math.random().toString(36).substring(2, 9),
          eventType: "payment_confirmed",
          orderReference: "ORD-" + Math.floor(1e5 + Math.random() * 9e5),
          customerUserId: 999,
          affiliateUserId: 1,
          grossAmountCents: grossCents,
          netAmountCents: grossCents
        })
      });
      const data = await res.json();
      setWebhookResult(data);
    } catch {
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6 animate-fade-in max-w-5xl mx-auto", children: [
    /* @__PURE__ */ jsxs("div", { className: "bg-gradient-to-br from-[#161b22] via-[#1c2129] to-[#0d1117] border border-[#30363d] p-6 sm:p-8 rounded-2xl relative overflow-hidden", children: [
      /* @__PURE__ */ jsxs("div", { className: "max-w-2xl space-y-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-800/40 text-emerald-400 text-xs font-semibold uppercase tracking-wider", children: [
          /* @__PURE__ */ jsx(Share2, { className: "w-3.5 h-3.5" }),
          "Programa de Parceiros & Indicações"
        ] }),
        /* @__PURE__ */ jsx("h1", { className: "text-2xl sm:text-3xl font-extrabold text-[#f0f6fc]", children: "Indique o Ritmo e Ganhe 60% Recorrente" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs sm:text-sm text-[#8b949e]", children: "Compartilhe sua rotina de foco. Para cada assinatura elegível confirmada através do seu link exclusivo, receba 60% de comissão recorrente (R$ 23,94 por assinatura de R$ 39,90) sobre o valor líquido recebido enquanto a assinatura estiver ativa." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-6 pt-6 border-t border-[#30363d] flex flex-col sm:flex-row items-stretch sm:items-center gap-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex-1 bg-[#0d1117] border border-[#30363d] rounded-xl px-3.5 py-2.5 text-xs text-[#f0f6fc] font-mono flex items-center justify-between overflow-hidden", children: [
          /* @__PURE__ */ jsx("span", { className: "truncate", children: fullShareUrl }),
          /* @__PURE__ */ jsxs("span", { className: "text-[10px] text-[#6e7681] ml-2 shrink-0", children: [
            "Código: ",
            /* @__PURE__ */ jsx("strong", { children: affiliateStats.referralCode })
          ] })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: handleCopyLink,
            className: "px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all shrink-0",
            children: copied ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(Check, { className: "w-4 h-4 text-white" }),
              " Copiado!"
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(Copy, { className: "w-4 h-4" }),
              " Copiar Link de Indicação"
            ] })
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "bg-[#161b22] border border-[#30363d] rounded-2xl p-4", children: [
        /* @__PURE__ */ jsx("span", { className: "text-[11px] font-semibold text-[#8b949e] uppercase block", children: "Cliques no Link" }),
        /* @__PURE__ */ jsx("span", { className: "text-2xl font-black text-[#f0f6fc] block mt-1", children: affiliateStats.totalClicks }),
        /* @__PURE__ */ jsx("span", { className: "text-[10px] text-[#6e7681]", children: "Origens válidas" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-[#161b22] border border-[#30363d] rounded-2xl p-4", children: [
        /* @__PURE__ */ jsx("span", { className: "text-[11px] font-semibold text-[#8b949e] uppercase block", children: "Cadastros Atribuídos" }),
        /* @__PURE__ */ jsx("span", { className: "text-2xl font-black text-emerald-400 block mt-1", children: affiliateStats.totalReferrals }),
        /* @__PURE__ */ jsx("span", { className: "text-[10px] text-[#6e7681]", children: "Último link válido" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-[#161b22] border border-[#30363d] rounded-2xl p-4", children: [
        /* @__PURE__ */ jsx("span", { className: "text-[11px] font-semibold text-[#8b949e] uppercase block", children: "Assinaturas Elegíveis" }),
        /* @__PURE__ */ jsx("span", { className: "text-2xl font-black text-teal-400 block mt-1", children: affiliateStats.activeSubscriptions }),
        /* @__PURE__ */ jsx("span", { className: "text-[10px] text-[#6e7681]", children: "Recorrência ativa" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-[#161b22] border border-[#30363d] rounded-2xl p-4", children: [
        /* @__PURE__ */ jsx("span", { className: "text-[11px] font-semibold text-[#8b949e] uppercase block", children: "Saldo Disponível" }),
        /* @__PURE__ */ jsx("span", { className: "text-2xl font-black text-amber-400 block mt-1", children: (affiliateStats.availableBalanceCents / 100).toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL"
        }) }),
        /* @__PURE__ */ jsx("span", { className: "text-[10px] text-[#6e7681]", children: "Saque mínimo: R$ 100,00" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-4", children: [
      /* @__PURE__ */ jsxs("div", { className: "bg-[#161b22] border border-[#30363d] rounded-2xl p-5 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "text-xs text-[#8b949e] block font-semibold", children: "Comissões Pendentes" }),
          /* @__PURE__ */ jsx("span", { className: "text-xl font-bold text-[#f0f6fc] block mt-0.5", children: (affiliateStats.pendingCommissionCents / 100).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
          }) }),
          /* @__PURE__ */ jsx("span", { className: "text-[10px] text-[#6e7681]", children: "Aguardando janela de compensação" })
        ] }),
        /* @__PURE__ */ jsx("span", { className: "px-2.5 py-1 rounded-full bg-amber-950/40 text-amber-400 text-xs font-mono", children: "60%" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-[#161b22] border border-[#30363d] rounded-2xl p-5 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "text-xs text-[#8b949e] block font-semibold", children: "Comissões Aprovadas" }),
          /* @__PURE__ */ jsx("span", { className: "text-xl font-bold text-emerald-400 block mt-0.5", children: (affiliateStats.approvedCommissionCents / 100).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
          }) }),
          /* @__PURE__ */ jsx("span", { className: "text-[10px] text-[#6e7681]", children: "Prontas para repasse mensal" })
        ] }),
        /* @__PURE__ */ jsx("span", { className: "px-2.5 py-1 rounded-full bg-emerald-950/40 text-emerald-400 text-xs font-mono", children: "Aprovado" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-[#161b22] border border-[#30363d] rounded-2xl p-5 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "text-xs text-[#8b949e] block font-semibold", children: "Total Já Pago" }),
          /* @__PURE__ */ jsx("span", { className: "text-xl font-bold text-[#f0f6fc] block mt-0.5", children: (affiliateStats.paidCommissionCents / 100).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
          }) }),
          /* @__PURE__ */ jsx("span", { className: "text-[10px] text-[#6e7681]", children: "Transferido via PIX" })
        ] }),
        /* @__PURE__ */ jsx("span", { className: "px-2.5 py-1 rounded-full bg-[#21262d] text-[#8b949e] text-xs font-mono", children: "Histórico" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-[#161b22] border border-[#30363d] rounded-2xl overflow-hidden", children: [
      /* @__PURE__ */ jsx("div", { className: "p-4 border-b border-[#30363d] flex items-center justify-between", children: /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-[#f0f6fc]", children: "Histórico Detalhado de Comissões" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-[#8b949e]", children: "Transparência completa sobre cada cobrança, base de cálculo e status." })
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "overflow-x-auto", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left border-collapse text-xs", children: [
        /* @__PURE__ */ jsx("thead", { children: /* @__PURE__ */ jsxs("tr", { className: "border-b border-[#30363d] bg-[#0d1117] text-[#8b949e]", children: [
          /* @__PURE__ */ jsx("th", { className: "py-3 px-4", children: "Data" }),
          /* @__PURE__ */ jsx("th", { className: "py-3 px-4", children: "Ref. Pedido" }),
          /* @__PURE__ */ jsx("th", { className: "py-3 px-4", children: "Base de Cálculo" }),
          /* @__PURE__ */ jsx("th", { className: "py-3 px-4 text-center", children: "Taxa" }),
          /* @__PURE__ */ jsx("th", { className: "py-3 px-4 text-right", children: "Comissão" }),
          /* @__PURE__ */ jsx("th", { className: "py-3 px-4 text-center", children: "Status" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y divide-[#30363d]", children: commissions.length === 0 ? /* @__PURE__ */ jsx("tr", { children: /* @__PURE__ */ jsx("td", { colSpan: 6, className: "py-10 text-center text-[#6e7681]", children: "Nenhuma comissão registrada ainda. Compartilhe seu link exclusivo para gerar as primeiras indicações!" }) }) : commissions.map((c) => /* @__PURE__ */ jsxs("tr", { className: "hover:bg-[#1c2128]/50", children: [
          /* @__PURE__ */ jsx("td", { className: "py-3 px-4 font-mono text-[#8b949e]", children: c.createdAt ? new Date(c.createdAt).toLocaleDateString("pt-BR") : "-" }),
          /* @__PURE__ */ jsx("td", { className: "py-3 px-4 font-mono text-[#f0f6fc]", children: c.orderReference }),
          /* @__PURE__ */ jsx("td", { className: "py-3 px-4 text-[#8b949e]", children: (c.baseAmountCents / 100).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
          }) }),
          /* @__PURE__ */ jsxs("td", { className: "py-3 px-4 text-center text-emerald-400 font-mono font-bold", children: [
            c.commissionRatePercent,
            "%"
          ] }),
          /* @__PURE__ */ jsx("td", { className: "py-3 px-4 text-right font-mono font-bold text-[#f0f6fc]", children: (c.commissionCents / 100).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
          }) }),
          /* @__PURE__ */ jsx("td", { className: "py-3 px-4 text-center", children: /* @__PURE__ */ jsx(
            "span",
            {
              className: `px-2 py-0.5 rounded-full text-[10px] font-semibold ${c.status === "approved" ? "bg-emerald-950/60 text-emerald-400 border border-emerald-800/40" : c.status === "paid" ? "bg-teal-950/60 text-teal-400 border border-teal-800/40" : c.status === "refunded" || c.status === "reversed" ? "bg-rose-950/60 text-rose-400 border border-rose-800/40" : "bg-amber-950/60 text-amber-400 border border-amber-800/40"}`,
              children: c.status === "approved" ? "Aprovada" : c.status === "paid" ? "Paga" : c.status === "refunded" ? "Reembolsada" : c.status === "reversed" ? "Estornada" : "Pendente"
            }
          ) })
        ] }, c.id)) })
      ] }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-[#161b22] border border-[#30363d] rounded-2xl p-6 space-y-3", children: [
      /* @__PURE__ */ jsxs("h3", { className: "text-sm font-bold text-[#f0f6fc] flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Shield, { className: "w-4 h-4 text-emerald-400" }),
        "Termos e Condições do Programa de Afiliados Ritmo"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#8b949e]", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsx("h4", { className: "font-semibold text-[#f0f6fc]", children: "Regra de Comissão Recorrente" }),
          /* @__PURE__ */ jsxs("p", { children: [
            "A comissão é fixada em ",
            /* @__PURE__ */ jsx("strong", { children: "60% do valor líquido efetivamente recebido" }),
            " (R$ 23,94 por assinatura de R$ 39,90/mês) em cada cobrança mensal ou anual. Não há promessa de ganhos ou renda garantida."
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsx("h4", { className: "font-semibold text-[#f0f6fc]", children: "Janela e Modelo de Atribuição" }),
          /* @__PURE__ */ jsxs("p", { children: [
            "Atribuição por ",
            /* @__PURE__ */ jsx("strong", { children: "último link válido antes do cadastro" }),
            " com janela de 60 dias. Autoindicação é estritamente proibida e bloqueada pelo sistema."
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsx("h4", { className: "font-semibold text-[#f0f6fc]", children: "Cancelamentos e Estornos" }),
          /* @__PURE__ */ jsx("p", { children: "Pagamentos cancelados, reembolsados ou com chargeback não geram comissão. Se já contabilizada, a comissão é ajustada de forma transparente com histórico preservado." })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-1.5", children: [
          /* @__PURE__ */ jsx("h4", { className: "font-semibold text-[#f0f6fc]", children: "Repasses e Condições de Saque" }),
          /* @__PURE__ */ jsxs("p", { children: [
            "Repasses manuais mensais via PIX para saldos mínimos acumulados a partir de ",
            /* @__PURE__ */ jsx("strong", { children: "R$ 100,00" }),
            "."
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "pt-2", children: /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => setShowAdmin(!showAdmin),
          className: "text-xs text-[#6e7681] hover:text-[#f0f6fc] flex items-center gap-1.5 transition-colors",
          children: [
            /* @__PURE__ */ jsx(Sliders, { className: "w-3.5 h-3.5" }),
            showAdmin ? "Ocultar Ferramentas de Administração" : "Painel de Administração & Webhooks"
          ]
        }
      ) }),
      showAdmin && /* @__PURE__ */ jsxs("div", { className: "mt-4 p-4 rounded-xl bg-[#0d1117] border border-[#30363d] space-y-4 animate-fade-in", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-[#f0f6fc]", children: "Simulador de Eventos de Cobrança (Idempotente)" }),
          /* @__PURE__ */ jsx("span", { className: "text-[10px] text-emerald-400 font-mono", children: "Backend Protegido" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-3", children: [
          /* @__PURE__ */ jsx("span", { className: "text-xs text-[#8b949e]", children: "Valor da Assinatura:" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: simulatedGross,
              onChange: (e) => setSimulatedGross(e.target.value),
              className: "w-24 bg-[#161b22] border border-[#30363d] rounded-lg px-2.5 py-1 text-xs text-[#f0f6fc] font-mono"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: handleSimulateWebhook,
              className: "px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs",
              children: "Disparar Webhook de Pagamento (60%)"
            }
          )
        ] }),
        webhookResult && /* @__PURE__ */ jsx("pre", { className: "p-3 bg-[#161b22] rounded-lg text-[11px] font-mono text-emerald-300 overflow-x-auto", children: JSON.stringify(webhookResult, null, 2) })
      ] })
    ] })
  ] });
};
const TabProgress = ({
  cycles,
  tasks,
  habits,
  habitLogs,
  sessions,
  transactions,
  onDeleteAccount
}) => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [confirmInput, setConfirmInput] = useState("");
  const [deleting, setDeleting] = useState(false);
  const today = /* @__PURE__ */ new Date();
  const past28Days = [];
  for (let i = 27; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const tasksDone = tasks.filter((t) => t.date === dateStr && t.completed).length;
    const habitsDone = habitLogs.filter((l) => l.date === dateStr && l.completed).length;
    const focusDone = sessions.filter((s) => s.date === dateStr).length;
    const totalActivity = tasksDone + habitsDone + focusDone;
    past28Days.push({
      dateStr,
      count: totalActivity,
      dateFormatted: `${d.getDate()}/${d.getMonth() + 1}`
    });
  }
  const totalFocusMinutes = sessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const totalTasksCompleted = tasks.filter((t) => t.completed).length;
  const totalHabitsCompleted = habitLogs.filter((l) => l.completed).length;
  const milestones = [
    {
      title: "Início Consciente",
      desc: "Primeiro ciclo de foco ativado no Ritmo",
      achieved: cycles.length > 0,
      icon: "🌱"
    },
    {
      title: "Bloco de Ouro",
      desc: "Mais de 100 minutos de foco produtivo registrados",
      achieved: totalFocusMinutes >= 100,
      icon: "⏳"
    },
    {
      title: "Ritmo Consistente",
      desc: "10 ou mais tarefas e hábitos concluídos",
      achieved: totalTasksCompleted + totalHabitsCompleted >= 10,
      icon: "🔥"
    },
    {
      title: "Mestre da Gestão",
      desc: "Organização financeira integrada ativada",
      achieved: transactions.length > 0,
      icon: "💎"
    }
  ];
  const handleExportFullData = () => {
    const fullBackup = {
      exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
      platform: "Ritmo — Modo Foco",
      cycles,
      tasks,
      habits,
      habitLogs,
      sessions,
      transactions
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullBackup, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `ritmo-backup-completo-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };
  const handleConfirmDelete = async () => {
    if (confirmInput !== "EXCLUIR MEUS DADOS") return;
    setDeleting(true);
    try {
      await onDeleteAccount();
    } finally {
      setDeleting(false);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6 animate-fade-in max-w-5xl mx-auto", children: [
    /* @__PURE__ */ jsxs("div", { className: "bg-[#161b22] border border-[#30363d] p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("div", { className: "inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-800/40 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2", children: [
          /* @__PURE__ */ jsx(TrendingUp, { className: "w-3.5 h-3.5" }),
          "Evolução Pessoal Sem Cobrança Extrema"
        ] }),
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-extrabold text-[#f0f6fc]", children: "Progresso & Histórico dos Ciclos" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs sm:text-sm text-[#8b949e] mt-1 max-w-2xl", children: "Visualize seu ritmo ao longo das semanas. Sem rankings competitivos ou obsessão por métricas: o objetivo é a autonomia e a paz de espírito." })
      ] }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: handleExportFullData,
          className: "px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2 shadow-md transition-all shrink-0",
          children: [
            /* @__PURE__ */ jsx(Download, { className: "w-4 h-4" }),
            "Exportar Todos os Meus Dados (LGPD)"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-[#161b22] border border-[#30363d] rounded-2xl p-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between pb-4 border-b border-[#30363d] mb-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("h3", { className: "text-sm font-bold text-[#f0f6fc] flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Calendar, { className: "w-4 h-4 text-emerald-400" }),
            "Mapa de Consistência das Últimas 4 Semanas"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-[#8b949e]", children: "Atividades concluídas (tarefas, hábitos saudáveis e sessões de foco)" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 text-[11px] text-[#6e7681]", children: [
          /* @__PURE__ */ jsx("span", { children: "Menos" }),
          /* @__PURE__ */ jsx("span", { className: "w-2.5 h-2.5 rounded bg-[#21262d]" }),
          /* @__PURE__ */ jsx("span", { className: "w-2.5 h-2.5 rounded bg-emerald-900/60" }),
          /* @__PURE__ */ jsx("span", { className: "w-2.5 h-2.5 rounded bg-emerald-600" }),
          /* @__PURE__ */ jsx("span", { className: "w-2.5 h-2.5 rounded bg-emerald-400" }),
          /* @__PURE__ */ jsx("span", { children: "Mais" })
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-7 sm:grid-cols-14 gap-2", children: past28Days.map((d) => {
        const levelClass = d.count === 0 ? "bg-[#21262d] text-[#6e7681]" : d.count <= 2 ? "bg-emerald-900/60 text-emerald-300 border border-emerald-800/40" : d.count <= 5 ? "bg-emerald-600 text-white" : "bg-emerald-400 text-black font-bold";
        return /* @__PURE__ */ jsxs(
          "div",
          {
            title: `${d.dateStr}: ${d.count} atividades`,
            className: `p-2 rounded-xl text-center flex flex-col items-center justify-center transition-all ${levelClass}`,
            children: [
              /* @__PURE__ */ jsx("span", { className: "text-[10px] font-mono opacity-80", children: d.dateFormatted }),
              /* @__PURE__ */ jsx("span", { className: "text-xs font-bold mt-0.5", children: d.count })
            ]
          },
          d.dateStr
        );
      }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "bg-[#161b22] border border-[#30363d] rounded-2xl p-6 space-y-4", children: [
        /* @__PURE__ */ jsxs("h3", { className: "text-sm font-bold text-[#f0f6fc] flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Award, { className: "w-4 h-4 text-amber-400" }),
          "Marcos Alcançados"
        ] }),
        /* @__PURE__ */ jsx("div", { className: "space-y-3", children: milestones.map((m, idx) => /* @__PURE__ */ jsxs(
          "div",
          {
            className: `flex items-start gap-3 p-3.5 rounded-xl border transition-all ${m.achieved ? "bg-emerald-950/20 border-emerald-500/30" : "bg-[#0d1117] border-[#30363d] opacity-50"}`,
            children: [
              /* @__PURE__ */ jsx("span", { className: "text-2xl", children: m.icon }),
              /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                  /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-[#f0f6fc]", children: m.title }),
                  m.achieved && /* @__PURE__ */ jsx("span", { className: "text-[10px] font-semibold text-emerald-400 px-2 py-0.2 rounded-full bg-emerald-950/60 border border-emerald-800/40", children: "Conquistado" })
                ] }),
                /* @__PURE__ */ jsx("p", { className: "text-[11px] text-[#8b949e] mt-0.5", children: m.desc })
              ] })
            ]
          },
          idx
        )) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-[#161b22] border border-[#30363d] rounded-2xl p-6 space-y-4", children: [
        /* @__PURE__ */ jsxs("h3", { className: "text-sm font-bold text-[#f0f6fc] flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(Flame, { className: "w-4 h-4 text-emerald-400" }),
          "Histórico de Ciclos de Foco"
        ] }),
        cycles.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-xs text-[#6e7681] py-8 text-center", children: "Nenhum ciclo registrado até o momento." }) : /* @__PURE__ */ jsx("div", { className: "space-y-3 max-h-[340px] overflow-y-auto", children: cycles.map((c) => /* @__PURE__ */ jsxs(
          "div",
          {
            className: "p-4 rounded-xl bg-[#0d1117] border border-[#30363d] space-y-2",
            children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
                /* @__PURE__ */ jsx("span", { className: "text-xs font-bold text-[#f0f6fc]", children: c.title }),
                /* @__PURE__ */ jsx(
                  "span",
                  {
                    className: `text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${c.status === "active" ? "bg-emerald-950 text-emerald-400 border border-emerald-800" : "bg-[#21262d] text-[#8b949e]"}`,
                    children: c.status === "active" ? "Ativo" : "Concluído"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("p", { className: "text-xs text-emerald-300 font-medium", children: [
                "🎯 ",
                c.mainGoal
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 text-[11px] text-[#8b949e]", children: [
                /* @__PURE__ */ jsxs("span", { children: [
                  "Duração: ",
                  c.durationDays,
                  " dias"
                ] }),
                /* @__PURE__ */ jsxs("span", { children: [
                  "Nível: ",
                  c.routineLevel
                ] }),
                /* @__PURE__ */ jsxs("span", { children: [
                  "Início: ",
                  c.startDate
                ] })
              ] })
            ]
          },
          c.id
        )) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-[#161b22] border border-rose-900/30 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h4", { className: "text-xs font-bold text-rose-400 uppercase tracking-wider mb-1", children: "Privacidade & Exclusão Completa de Dados (LGPD)" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-[#8b949e] max-w-xl", children: "Você tem total soberania sobre suas informações. Ao excluir a conta, todos os seus ciclos, tarefas, hábitos, sessões e lançamentos financeiros são permanentemente destruídos." })
      ] }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => setShowDeleteModal(true),
          className: "px-4 py-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 text-rose-300 text-xs font-semibold flex items-center gap-2 transition-colors shrink-0",
          children: [
            /* @__PURE__ */ jsx(Trash2, { className: "w-3.5 h-3.5" }),
            "Excluir Minha Conta"
          ]
        }
      )
    ] }),
    showDeleteModal && /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in", children: /* @__PURE__ */ jsxs("div", { className: "bg-[#161b22] border border-rose-800/60 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4", children: [
      /* @__PURE__ */ jsx("div", { className: "w-12 h-12 rounded-2xl bg-rose-950/60 border border-rose-800/60 text-rose-400 flex items-center justify-center mx-auto", children: /* @__PURE__ */ jsx(AlertTriangle, { className: "w-6 h-6" }) }),
      /* @__PURE__ */ jsxs("div", { className: "text-center space-y-1", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-base font-bold text-[#f0f6fc]", children: "Confirmar Exclusão de Conta" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-[#8b949e]", children: "Esta ação é irreversível. Todos os dados cadastrados serão permanentemente apagados dos nossos servidores." })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsxs("label", { className: "block text-xs font-semibold text-[#8b949e] mb-1", children: [
          "Digite exatamente ",
          /* @__PURE__ */ jsx("strong", { className: "text-rose-400", children: "EXCLUIR MEUS DADOS" }),
          " para confirmar:"
        ] }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "text",
            value: confirmInput,
            onChange: (e) => setConfirmInput(e.target.value),
            placeholder: "EXCLUIR MEUS DADOS",
            className: "w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-rose-300 focus:outline-none focus:border-rose-500 font-mono"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2 pt-2", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => {
              setShowDeleteModal(false);
              setConfirmInput("");
            },
            className: "px-4 py-2 rounded-lg text-xs font-medium text-[#8b949e] hover:text-[#f0f6fc]",
            children: "Cancelar"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            disabled: confirmInput !== "EXCLUIR MEUS DADOS" || deleting,
            onClick: handleConfirmDelete,
            className: "px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-colors disabled:opacity-40",
            children: deleting ? "Excluindo..." : "Confirmar e Apagar Tudo"
          }
        )
      ] })
    ] }) })
  ] });
};
const TabSettings = ({
  user,
  theme,
  onToggleTheme,
  onUpdateProfile
}) => {
  const [name, setName] = useState(user?.name || "");
  const [timezone, setTimezone] = useState(user?.timezone || "America/Sao_Paulo");
  const [whatsappPhone, setWhatsappPhone] = useState(user?.whatsappPhone || "");
  const [remindTasks, setRemindTasks] = useState(true);
  const [remindHabits, setRemindHabits] = useState(true);
  const [remindFinanceDue, setRemindFinanceDue] = useState(true);
  const [remindWeeklyReview, setRemindWeeklyReview] = useState(true);
  const [notificationPermission, setNotificationPermission] = useState(
    typeof window !== "undefined" && "Notification" in window ? Notification.permission : "default"
  );
  const [saveStatus, setSaveStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const handleRequestNotification = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
      if (perm === "granted") {
        new Notification("Ritmo — Notificações Ativadas!", {
          body: "Lembretes de foco, hábitos e contas configurados com sucesso."
        });
      }
    }
  };
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSaveStatus(null);
    try {
      await onUpdateProfile({
        name,
        timezone,
        whatsappPhone
      });
      await fetch("/api/integrations?action=update_config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          remindersConfig: {
            tasks: remindTasks,
            habits: remindHabits,
            financeDue: remindFinanceDue,
            weeklyReview: remindWeeklyReview
          }
        })
      });
      setSaveStatus("Configurações salvas com sucesso!");
      setTimeout(() => setSaveStatus(null), 3e3);
    } catch {
      setSaveStatus("Erro ao salvar configurações.");
    } finally {
      setLoading(false);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-6 animate-fade-in max-w-4xl mx-auto", children: [
    /* @__PURE__ */ jsxs("div", { className: "bg-[#161b22] border border-[#30363d] p-6 rounded-2xl", children: [
      /* @__PURE__ */ jsx("h2", { className: "text-xl font-extrabold text-[#f0f6fc]", children: "Configurações, Perfil & Lembretes" }),
      /* @__PURE__ */ jsx("p", { className: "text-xs sm:text-sm text-[#8b949e] mt-1", children: "Ajuste preferências de fuso horário, limites e notificações para harmonizar a plataforma com a sua rotina real." })
    ] }),
    saveStatus && /* @__PURE__ */ jsxs("div", { className: "p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 text-xs flex items-center gap-2", children: [
      /* @__PURE__ */ jsx(CheckCircle2, { className: "w-4 h-4 shrink-0" }),
      /* @__PURE__ */ jsx("span", { children: saveStatus })
    ] }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleSaveSettings, className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "bg-[#161b22] border border-[#30363d] rounded-2xl p-6 space-y-4", children: [
        /* @__PURE__ */ jsxs("h3", { className: "text-sm font-bold text-[#f0f6fc] flex items-center gap-2", children: [
          /* @__PURE__ */ jsx(User, { className: "w-4 h-4 text-emerald-400" }),
          "Dados Pessoais"
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-[#8b949e] mb-1", children: "Nome de Exibição" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: name,
                onChange: (e) => setName(e.target.value),
                className: "w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-[#f0f6fc] focus:outline-none focus:border-emerald-500"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-[#8b949e] mb-1", children: "E-mail Cadastrado" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "email",
                disabled: true,
                value: user?.email || "demo@ritmofoco.com.br",
                className: "w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-[#6e7681] cursor-not-allowed"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-[#8b949e] mb-1", children: "Fuso Horário" }),
            /* @__PURE__ */ jsxs(
              "select",
              {
                value: timezone,
                onChange: (e) => setTimezone(e.target.value),
                className: "w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-[#f0f6fc] focus:outline-none",
                children: [
                  /* @__PURE__ */ jsx("option", { value: "America/Sao_Paulo", children: "Horário de Brasília (GMT-3)" }),
                  /* @__PURE__ */ jsx("option", { value: "America/Manaus", children: "Manaus / Amazonas (GMT-4)" }),
                  /* @__PURE__ */ jsx("option", { value: "America/Belem", children: "Belém / Pará (GMT-3)" }),
                  /* @__PURE__ */ jsx("option", { value: "America/Fortaleza", children: "Nordeste / Fortaleza (GMT-3)" }),
                  /* @__PURE__ */ jsx("option", { value: "America/Rio_Branco", children: "Acre / Rio Branco (GMT-5)" }),
                  /* @__PURE__ */ jsx("option", { value: "Europe/Lisbon", children: "Lisboa / Portugal (GMT+0/1)" })
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-xs font-semibold text-[#8b949e] mb-1", children: "WhatsApp Autorizado (para Lançamentos)" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                placeholder: "Ex: 5511999998888",
                value: whatsappPhone,
                onChange: (e) => setWhatsappPhone(e.target.value),
                className: "w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-[#f0f6fc] font-mono focus:outline-none focus:border-emerald-500"
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-[#161b22] border border-[#30363d] rounded-2xl p-6 space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("h3", { className: "text-sm font-bold text-[#f0f6fc] flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(Bell, { className: "w-4 h-4 text-emerald-400" }),
            "Lembretes Configuráveis"
          ] }),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: handleRequestNotification,
              className: `px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${notificationPermission === "granted" ? "bg-emerald-950/60 border-emerald-800 text-emerald-400" : "bg-[#21262d] border-[#30363d] text-[#8b949e] hover:text-[#f0f6fc]"}`,
              children: notificationPermission === "granted" ? "✓ Notificações Navegador Ativas" : "Ativar Notificações no Navegador"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-3 pt-2", children: [
          /* @__PURE__ */ jsxs("label", { className: "flex items-center justify-between p-3 rounded-xl bg-[#0d1117] border border-[#30363d] cursor-pointer", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold text-[#f0f6fc] block", children: "Lembrete de Tarefas do Dia" }),
              /* @__PURE__ */ jsx("span", { className: "text-[11px] text-[#8b949e]", children: "Notificar blocos agendados no início de cada turno (Manhã/Tarde/Noite)" })
            ] }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "checkbox",
                checked: remindTasks,
                onChange: (e) => setRemindTasks(e.target.checked),
                className: "rounded border-[#30363d] bg-[#161b22] text-emerald-500 focus:ring-0"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("label", { className: "flex items-center justify-between p-3 rounded-xl bg-[#0d1117] border border-[#30363d] cursor-pointer", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold text-[#f0f6fc] block", children: "Lembrete de Hábitos & Bem-estar" }),
              /* @__PURE__ */ jsx("span", { className: "text-[11px] text-[#8b949e]", children: "Aviso discreto vespertino para marcar movimento, leitura e descanso" })
            ] }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "checkbox",
                checked: remindHabits,
                onChange: (e) => setRemindHabits(e.target.checked),
                className: "rounded border-[#30363d] bg-[#161b22] text-emerald-500 focus:ring-0"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("label", { className: "flex items-center justify-between p-3 rounded-xl bg-[#0d1117] border border-[#30363d] cursor-pointer", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold text-[#f0f6fc] block", children: "Alerta de Vencimentos Financeiros" }),
              /* @__PURE__ */ jsx("span", { className: "text-[11px] text-[#8b949e]", children: "Avisar sobre contas a pagar com 2 dias de antecedência do vencimento" })
            ] }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "checkbox",
                checked: remindFinanceDue,
                onChange: (e) => setRemindFinanceDue(e.target.checked),
                className: "rounded border-[#30363d] bg-[#161b22] text-emerald-500 focus:ring-0"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("label", { className: "flex items-center justify-between p-3 rounded-xl bg-[#0d1117] border border-[#30363d] cursor-pointer", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("span", { className: "text-xs font-semibold text-[#f0f6fc] block", children: "Revisão Semanal de Ciclo" }),
              /* @__PURE__ */ jsx("span", { className: "text-[11px] text-[#8b949e]", children: "Convite suave aos domingos para refletir o que funcionou e traçar a próxima semana" })
            ] }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "checkbox",
                checked: remindWeeklyReview,
                onChange: (e) => setRemindWeeklyReview(e.target.checked),
                className: "rounded border-[#30363d] bg-[#161b22] text-emerald-500 focus:ring-0"
              }
            )
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "bg-[#161b22] border border-[#30363d] rounded-2xl p-6 flex items-center justify-between", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "text-sm font-bold text-[#f0f6fc]", children: "Tema Visual" }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-[#8b949e]", children: "Alterne entre o modo escuro focado e o modo claro suave." })
        ] }),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: onToggleTheme,
            className: "px-4 py-2 rounded-xl bg-[#0d1117] border border-[#30363d] text-xs font-semibold text-[#f0f6fc] flex items-center gap-2 hover:border-[#484f58] transition-colors",
            children: theme === "dark" ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(Sun, { className: "w-4 h-4 text-amber-400" }),
              " Modo Escuro Ativo"
            ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(Moon, { className: "w-4 h-4 text-indigo-400" }),
              " Modo Claro Ativo"
            ] })
          }
        )
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex justify-end pt-2", children: /* @__PURE__ */ jsx(
        "button",
        {
          type: "submit",
          disabled: loading,
          className: "px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition-colors disabled:opacity-50",
          children: loading ? "Salvando..." : "Salvar Alterações"
        }
      ) })
    ] })
  ] });
};
const PRIORITY_STYLES = {
  baixa: "bg-sky-950 text-sky-300 border-sky-800",
  media: "bg-amber-950 text-amber-300 border-amber-800",
  alta: "bg-rose-950 text-rose-300 border-rose-800"
};
const PRIORITY_LABELS = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta"
};
async function api(action, payload = {}) {
  const res = await fetch("/api/boards", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload })
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Erro ao comunicar com o servidor.");
  return data;
}
const TabBoards = () => {
  const [boards, setBoards] = useState([]);
  const [selectedBoardId, setSelectedBoardId] = useState(null);
  const [boardData, setBoardData] = useState(null);
  const [loadingBoards, setLoadingBoards] = useState(true);
  const [loadingBoard, setLoadingBoard] = useState(false);
  const [error, setError] = useState("");
  const [newBoardTitle, setNewBoardTitle] = useState("");
  const [creatingBoard, setCreatingBoard] = useState(false);
  const [showNewBoardForm, setShowNewBoardForm] = useState(false);
  const [newListTitle, setNewListTitle] = useState("");
  const [addingList, setAddingList] = useState(false);
  const [newCardTitleByList, setNewCardTitleByList] = useState({});
  const [addingCardToList, setAddingCardToList] = useState(null);
  const [activeCardId, setActiveCardId] = useState(null);
  const [draggingCardId, setDraggingCardId] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [filterPriority, setFilterPriority] = useState("todas");
  const [filterListId, setFilterListId] = useState("todas");
  const [filterLabel, setFilterLabel] = useState("todas");
  const fetchBoards = useCallback(async () => {
    setLoadingBoards(true);
    setError("");
    try {
      const res = await fetch("/api/boards");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Não foi possível carregar seus quadros.");
      setBoards(data.boards || []);
      if (data.boards?.length > 0 && !selectedBoardId) {
        setSelectedBoardId(data.boards[0].id);
      }
    } catch (e) {
      setError(e.message || "Não foi possível carregar seus quadros.");
    } finally {
      setLoadingBoards(false);
    }
  }, []);
  const fetchBoard = useCallback(async (boardId) => {
    setLoadingBoard(true);
    setError("");
    try {
      const res = await fetch(`/api/boards?boardId=${boardId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Não foi possível carregar o quadro.");
      setBoardData(data);
    } catch (e) {
      setError(e.message || "Não foi possível carregar o quadro.");
      setBoardData(null);
    } finally {
      setLoadingBoard(false);
    }
  }, []);
  useEffect(() => {
    fetchBoards();
  }, [fetchBoards]);
  useEffect(() => {
    if (selectedBoardId) fetchBoard(selectedBoardId);
    else setBoardData(null);
  }, [selectedBoardId, fetchBoard]);
  const handleCreateBoard = async () => {
    if (!newBoardTitle.trim()) return;
    setCreatingBoard(true);
    try {
      const data = await api("create_board", { title: newBoardTitle.trim() });
      setNewBoardTitle("");
      setShowNewBoardForm(false);
      await fetchBoards();
      setSelectedBoardId(data.board.id);
    } catch (e) {
      setError(e.message);
    } finally {
      setCreatingBoard(false);
    }
  };
  const handleDuplicateBoard = async (boardId) => {
    try {
      const data = await api("duplicate_board", { boardId });
      await fetchBoards();
      setSelectedBoardId(data.board.id);
    } catch (e) {
      setError(e.message);
    }
  };
  const handleDeleteBoard = async (boardId) => {
    if (!confirm("Excluir este quadro e todas as suas listas e cartões? Essa ação não pode ser desfeita.")) return;
    try {
      await api("delete_board", { boardId });
      const remaining = boards.filter((b) => b.id !== boardId);
      setBoards(remaining);
      setSelectedBoardId(remaining[0]?.id ?? null);
    } catch (e) {
      setError(e.message);
    }
  };
  const handleAddList = async () => {
    if (!newListTitle.trim() || !selectedBoardId) return;
    setAddingList(true);
    try {
      await api("create_list", { boardId: selectedBoardId, title: newListTitle.trim() });
      setNewListTitle("");
      await fetchBoard(selectedBoardId);
    } catch (e) {
      setError(e.message);
    } finally {
      setAddingList(false);
    }
  };
  const handleRenameList = async (listId, title) => {
    if (!title.trim() || !selectedBoardId) return;
    try {
      await api("rename_list", { listId, title: title.trim() });
      await fetchBoard(selectedBoardId);
    } catch (e) {
      setError(e.message);
    }
  };
  const handleDeleteList = async (listId) => {
    if (!confirm("Excluir esta lista e todos os cartões dentro dela?")) return;
    if (!selectedBoardId) return;
    try {
      await api("delete_list", { listId });
      await fetchBoard(selectedBoardId);
    } catch (e) {
      setError(e.message);
    }
  };
  const moveListPosition = async (listId, direction) => {
    if (!boardData || !selectedBoardId) return;
    const ids = boardData.lists.map((l) => l.id);
    const idx = ids.indexOf(listId);
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= ids.length) return;
    [ids[idx], ids[newIdx]] = [ids[newIdx], ids[idx]];
    const reordered = ids.map((id) => boardData.lists.find((l) => l.id === id));
    setBoardData({ ...boardData, lists: reordered });
    try {
      await api("reorder_lists", { boardId: selectedBoardId, orderedListIds: ids });
    } catch (e) {
      setError(e.message);
      fetchBoard(selectedBoardId);
    }
  };
  const handleAddCard = async (listId) => {
    const title = (newCardTitleByList[listId] || "").trim();
    if (!title || !selectedBoardId) return;
    setAddingCardToList(listId);
    try {
      await api("create_card", { listId, title });
      setNewCardTitleByList((prev) => ({ ...prev, [listId]: "" }));
      await fetchBoard(selectedBoardId);
    } catch (e) {
      setError(e.message);
    } finally {
      setAddingCardToList(null);
    }
  };
  const handleUpdateCard = async (cardId, updates) => {
    if (!selectedBoardId) return;
    try {
      await api("update_card", { cardId, ...updates });
      await fetchBoard(selectedBoardId);
    } catch (e) {
      setError(e.message);
    }
  };
  const handleDeleteCard = async (cardId) => {
    if (!confirm("Excluir este cartão?")) return;
    if (!selectedBoardId) return;
    try {
      await api("delete_card", { cardId });
      setActiveCardId(null);
      await fetchBoard(selectedBoardId);
    } catch (e) {
      setError(e.message);
    }
  };
  const performMoveCard = async (cardId, targetListId, targetPosition) => {
    if (!boardData || !selectedBoardId) return;
    const card = boardData.cards.find((c) => c.id === cardId);
    if (!card) return;
    const otherCards = boardData.cards.filter((c) => c.id !== cardId);
    const targetListCards = otherCards.filter((c) => c.listId === targetListId).sort((a, b) => a.position - b.position);
    const clamped = Math.max(0, Math.min(targetPosition, targetListCards.length));
    targetListCards.splice(clamped, 0, { ...card, listId: targetListId });
    const rest = otherCards.filter((c) => c.listId !== targetListId);
    const reindexed = targetListCards.map((c, i) => ({ ...c, position: i }));
    setBoardData({ ...boardData, cards: [...rest, ...reindexed] });
    try {
      await api("move_card", { cardId, targetListId, targetPosition: clamped });
    } catch (e) {
      setError(e.message);
      fetchBoard(selectedBoardId);
    }
  };
  const moveCardKeyboard = (card, direction) => {
    if (!boardData) return;
    const lists = boardData.lists;
    const listIdx = lists.findIndex((l) => l.id === card.listId);
    const cardsInList = boardData.cards.filter((c) => c.listId === card.listId).sort((a, b) => a.position - b.position);
    const posInList = cardsInList.findIndex((c) => c.id === card.id);
    if (direction === "left" && listIdx > 0) {
      performMoveCard(card.id, lists[listIdx - 1].id, 0);
    } else if (direction === "right" && listIdx < lists.length - 1) {
      performMoveCard(card.id, lists[listIdx + 1].id, 0);
    } else if (direction === "up" && posInList > 0) {
      performMoveCard(card.id, card.listId, posInList - 1);
    } else if (direction === "down" && posInList < cardsInList.length - 1) {
      performMoveCard(card.id, card.listId, posInList + 1);
    }
  };
  const handleDragStart = (cardId) => setDraggingCardId(cardId);
  const handleDragOverCard = (e, listId, index) => {
    e.preventDefault();
    setDropTarget({ listId, index });
  };
  const handleDragOverList = (e, listId, cardCount) => {
    e.preventDefault();
    if (!dropTarget || dropTarget.listId !== listId) {
      setDropTarget({ listId, index: cardCount });
    }
  };
  const handleDrop = () => {
    if (draggingCardId && dropTarget) {
      performMoveCard(draggingCardId, dropTarget.listId, dropTarget.index);
    }
    setDraggingCardId(null);
    setDropTarget(null);
  };
  const allLabels = useMemo(() => {
    if (!boardData) return [];
    const set = /* @__PURE__ */ new Set();
    boardData.cards.forEach((c) => c.labels.forEach((l) => set.add(l)));
    return Array.from(set);
  }, [boardData]);
  const filteredCards = useMemo(() => {
    if (!boardData) return [];
    return boardData.cards.filter((c) => {
      if (searchText && !c.title.toLowerCase().includes(searchText.toLowerCase()) && !(c.description || "").toLowerCase().includes(searchText.toLowerCase())) {
        return false;
      }
      if (filterPriority !== "todas" && c.priority !== filterPriority) return false;
      if (filterListId !== "todas" && String(c.listId) !== filterListId) return false;
      if (filterLabel !== "todas" && !c.labels.includes(filterLabel)) return false;
      return true;
    });
  }, [boardData, searchText, filterPriority, filterListId, filterLabel]);
  const activeCard = boardData?.cards.find((c) => c.id === activeCardId) || null;
  if (loadingBoards) {
    return /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center py-24 text-[#8b949e]", children: [
      /* @__PURE__ */ jsx(Loader2, { className: "w-5 h-5 animate-spin mr-2" }),
      " Carregando seus quadros..."
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "space-y-5", children: [
    /* @__PURE__ */ jsx("div", { className: "flex items-center justify-between flex-wrap gap-3", children: /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsxs("h2", { className: "text-lg font-bold flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(LayoutGrid, { className: "w-5 h-5 text-emerald-400" }),
        " Quadros"
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-[#8b949e] mt-0.5", children: "Organize tarefas e projetos visualmente, estilo Kanban. Arraste os cartões ou use os botões de mover." })
    ] }) }),
    error && /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2 bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs rounded-xl p-3", children: [
      /* @__PURE__ */ jsx(AlertTriangle, { className: "w-4 h-4 mt-0.5 shrink-0" }),
      /* @__PURE__ */ jsx("span", { children: error }),
      /* @__PURE__ */ jsx("button", { onClick: () => setError(""), className: "ml-auto text-rose-400 hover:text-rose-200", children: /* @__PURE__ */ jsx(X, { className: "w-3.5 h-3.5" }) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 overflow-x-auto pb-1", children: [
      boards.map((b) => /* @__PURE__ */ jsx(
        "button",
        {
          onClick: () => setSelectedBoardId(b.id),
          className: `shrink-0 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-all ${selectedBoardId === b.id ? "bg-emerald-600 border-emerald-500 text-white shadow-md shadow-emerald-600/20" : "bg-[#161b22] border-[#30363d] text-[#8b949e] hover:text-[#f0f6fc] hover:border-[#484f58]"}`,
          children: b.title
        },
        b.id
      )),
      !showNewBoardForm ? /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => setShowNewBoardForm(true),
          className: "shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-dashed border-[#30363d] text-[#8b949e] hover:text-emerald-400 hover:border-emerald-500/50 transition-colors",
          children: [
            /* @__PURE__ */ jsx(Plus, { className: "w-3.5 h-3.5" }),
            " Novo quadro"
          ]
        }
      ) : /* @__PURE__ */ jsxs("div", { className: "shrink-0 flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            autoFocus: true,
            value: newBoardTitle,
            onChange: (e) => setNewBoardTitle(e.target.value),
            onKeyDown: (e) => e.key === "Enter" && handleCreateBoard(),
            placeholder: "Nome do quadro",
            className: "bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-[#f0f6fc] focus:outline-none focus:border-emerald-500 w-40"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: handleCreateBoard,
            disabled: creatingBoard,
            className: "px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold disabled:opacity-50",
            children: creatingBoard ? "..." : "Criar"
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setShowNewBoardForm(false),
            className: "p-2 rounded-lg text-[#8b949e] hover:text-[#f0f6fc]",
            children: /* @__PURE__ */ jsx(X, { className: "w-3.5 h-3.5" })
          }
        )
      ] })
    ] }),
    boards.length === 0 && !showNewBoardForm && /* @__PURE__ */ jsxs("div", { className: "text-center py-16 bg-[#161b22] border border-dashed border-[#30363d] rounded-2xl", children: [
      /* @__PURE__ */ jsx(LayoutGrid, { className: "w-8 h-8 text-[#8b949e] mx-auto mb-3" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-[#f0f6fc] font-medium", children: "Você ainda não tem nenhum quadro" }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-[#8b949e] mt-1 mb-4", children: 'Crie seu primeiro quadro — ele já vem com as colunas "A fazer", "Em andamento" e "Concluído".' }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => setShowNewBoardForm(true),
          className: "inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold",
          children: [
            /* @__PURE__ */ jsx(Plus, { className: "w-3.5 h-3.5" }),
            " Criar meu primeiro quadro"
          ]
        }
      )
    ] }),
    selectedBoardId && /* @__PURE__ */ jsxs(Fragment, { children: [
      boardData && /* @__PURE__ */ jsxs("div", { className: "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-[#161b22] border border-[#30363d] p-3.5 rounded-2xl", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 flex-wrap flex-1 min-w-0", children: [
          /* @__PURE__ */ jsxs("div", { className: "relative", children: [
            /* @__PURE__ */ jsx(Search, { className: "w-3.5 h-3.5 text-[#8b949e] absolute left-2.5 top-1/2 -translate-y-1/2" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                value: searchText,
                onChange: (e) => setSearchText(e.target.value),
                placeholder: "Buscar cartões...",
                className: "bg-[#0d1117] border border-[#30363d] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#f0f6fc] focus:outline-none focus:border-emerald-500 w-40"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs(
            "select",
            {
              value: filterPriority,
              onChange: (e) => setFilterPriority(e.target.value),
              className: "bg-[#0d1117] border border-[#30363d] text-xs text-[#f0f6fc] rounded-lg px-2.5 py-1.5 focus:outline-none",
              children: [
                /* @__PURE__ */ jsx("option", { value: "todas", children: "Toda prioridade" }),
                /* @__PURE__ */ jsx("option", { value: "baixa", children: "Baixa" }),
                /* @__PURE__ */ jsx("option", { value: "media", children: "Média" }),
                /* @__PURE__ */ jsx("option", { value: "alta", children: "Alta" })
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            "select",
            {
              value: filterListId,
              onChange: (e) => setFilterListId(e.target.value),
              className: "bg-[#0d1117] border border-[#30363d] text-xs text-[#f0f6fc] rounded-lg px-2.5 py-1.5 focus:outline-none",
              children: [
                /* @__PURE__ */ jsx("option", { value: "todas", children: "Toda coluna" }),
                boardData.lists.map((l) => /* @__PURE__ */ jsx("option", { value: l.id, children: l.title }, l.id))
              ]
            }
          ),
          allLabels.length > 0 && /* @__PURE__ */ jsxs(
            "select",
            {
              value: filterLabel,
              onChange: (e) => setFilterLabel(e.target.value),
              className: "bg-[#0d1117] border border-[#30363d] text-xs text-[#f0f6fc] rounded-lg px-2.5 py-1.5 focus:outline-none",
              children: [
                /* @__PURE__ */ jsx("option", { value: "todas", children: "Toda etiqueta" }),
                allLabels.map((l) => /* @__PURE__ */ jsx("option", { value: l, children: l }, l))
              ]
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 shrink-0", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleDuplicateBoard(boardData.board.id),
              title: "Duplicar quadro",
              className: "p-2 rounded-lg text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#0d1117] transition-colors",
              children: /* @__PURE__ */ jsx(Copy, { className: "w-4 h-4" })
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => handleDeleteBoard(boardData.board.id),
              title: "Excluir quadro",
              className: "p-2 rounded-lg text-[#8b949e] hover:text-rose-400 hover:bg-rose-950/20 transition-colors",
              children: /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" })
            }
          )
        ] })
      ] }),
      loadingBoard && /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-center py-16 text-[#8b949e]", children: [
        /* @__PURE__ */ jsx(Loader2, { className: "w-5 h-5 animate-spin mr-2" }),
        " Carregando quadro..."
      ] }),
      !loadingBoard && boardData && /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-4 overflow-x-auto pb-4", children: [
        boardData.lists.map((list, listIdx) => {
          const listCards = filteredCards.filter((c) => c.listId === list.id).sort((a, b) => a.position - b.position);
          return /* @__PURE__ */ jsxs(
            "div",
            {
              onDragOver: (e) => handleDragOverList(e, list.id, listCards.length),
              onDrop: handleDrop,
              className: "shrink-0 w-72 bg-[#161b22] border border-[#30363d] rounded-2xl p-3 flex flex-col max-h-[calc(100vh-280px)]",
              children: [
                /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2 pb-2.5 border-b border-[#30363d] mb-2", children: [
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      defaultValue: list.title,
                      onBlur: (e) => e.target.value !== list.title && handleRenameList(list.id, e.target.value),
                      "aria-label": "Nome da coluna",
                      className: "bg-transparent text-sm font-semibold text-[#f0f6fc] focus:outline-none focus:bg-[#0d1117] rounded px-1 -ml-1 w-full"
                    }
                  ),
                  /* @__PURE__ */ jsx("span", { className: "text-[10px] text-[#8b949e] shrink-0", children: listCards.length }),
                  /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-0.5 shrink-0", children: [
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: () => moveListPosition(list.id, -1),
                        disabled: listIdx === 0,
                        title: "Mover coluna para a esquerda",
                        className: "p-1 rounded text-[#8b949e] hover:text-[#f0f6fc] disabled:opacity-20",
                        children: /* @__PURE__ */ jsx(ChevronLeft, { className: "w-3.5 h-3.5" })
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: () => moveListPosition(list.id, 1),
                        disabled: listIdx === boardData.lists.length - 1,
                        title: "Mover coluna para a direita",
                        className: "p-1 rounded text-[#8b949e] hover:text-[#f0f6fc] disabled:opacity-20",
                        children: /* @__PURE__ */ jsx(ChevronRight, { className: "w-3.5 h-3.5" })
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      "button",
                      {
                        onClick: () => handleDeleteList(list.id),
                        title: "Excluir coluna",
                        className: "p-1 rounded text-[#8b949e] hover:text-rose-400",
                        children: /* @__PURE__ */ jsx(Trash2, { className: "w-3.5 h-3.5" })
                      }
                    )
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-y-auto space-y-2 min-h-[40px]", children: [
                  listCards.map((card, cardIdx) => {
                    const checklistForCard = boardData.checklistItems.filter((i) => i.cardId === card.id);
                    const doneCount = checklistForCard.filter((i) => i.done).length;
                    const isOverdue = card.dueDate && card.dueDate < (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
                    return /* @__PURE__ */ jsxs(
                      "div",
                      {
                        draggable: true,
                        onDragStart: () => handleDragStart(card.id),
                        onDragOver: (e) => handleDragOverCard(e, list.id, cardIdx),
                        onDrop: handleDrop,
                        onClick: () => setActiveCardId(card.id),
                        role: "button",
                        tabIndex: 0,
                        onKeyDown: (e) => {
                          if (e.key === "Enter") setActiveCardId(card.id);
                          if (e.key === "ArrowLeft") {
                            e.preventDefault();
                            moveCardKeyboard(card, "left");
                          }
                          if (e.key === "ArrowRight") {
                            e.preventDefault();
                            moveCardKeyboard(card, "right");
                          }
                          if (e.key === "ArrowUp") {
                            e.preventDefault();
                            moveCardKeyboard(card, "up");
                          }
                          if (e.key === "ArrowDown") {
                            e.preventDefault();
                            moveCardKeyboard(card, "down");
                          }
                        },
                        className: `group bg-[#0d1117] border rounded-xl p-2.5 cursor-pointer transition-all ${draggingCardId === card.id ? "opacity-40" : "border-[#30363d] hover:border-emerald-500/50"}`,
                        children: [
                          /* @__PURE__ */ jsx("p", { className: "text-xs font-medium text-[#f0f6fc] mb-1.5", children: card.title }),
                          /* @__PURE__ */ jsxs("div", { className: "flex items-center flex-wrap gap-1 mb-1.5", children: [
                            /* @__PURE__ */ jsx("span", { className: `text-[9px] px-1.5 py-0.5 rounded border font-semibold ${PRIORITY_STYLES[card.priority]}`, children: PRIORITY_LABELS[card.priority] }),
                            card.labels.slice(0, 3).map((l) => /* @__PURE__ */ jsxs("span", { className: "text-[9px] px-1.5 py-0.5 rounded bg-[#21262d] text-[#8b949e] flex items-center gap-0.5", children: [
                              /* @__PURE__ */ jsx(Tag, { className: "w-2.5 h-2.5" }),
                              " ",
                              l
                            ] }, l))
                          ] }),
                          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between text-[10px] text-[#8b949e]", children: [
                            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                              card.dueDate && /* @__PURE__ */ jsxs("span", { className: `flex items-center gap-0.5 ${isOverdue ? "text-rose-400" : ""}`, children: [
                                /* @__PURE__ */ jsx(CalendarDays, { className: "w-3 h-3" }),
                                (/* @__PURE__ */ new Date(card.dueDate + "T00:00:00")).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
                              ] }),
                              checklistForCard.length > 0 && /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-0.5", children: [
                                /* @__PURE__ */ jsx(CheckSquare, { className: "w-3 h-3" }),
                                " ",
                                doneCount,
                                "/",
                                checklistForCard.length
                              ] })
                            ] }),
                            /* @__PURE__ */ jsxs("div", { className: "opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity", children: [
                              /* @__PURE__ */ jsx(
                                "button",
                                {
                                  onClick: (e) => {
                                    e.stopPropagation();
                                    moveCardKeyboard(card, "left");
                                  },
                                  title: "Mover para a coluna anterior",
                                  className: "p-0.5 hover:text-emerald-400",
                                  children: /* @__PURE__ */ jsx(ChevronLeft, { className: "w-3 h-3" })
                                }
                              ),
                              /* @__PURE__ */ jsx(
                                "button",
                                {
                                  onClick: (e) => {
                                    e.stopPropagation();
                                    moveCardKeyboard(card, "right");
                                  },
                                  title: "Mover para a próxima coluna",
                                  className: "p-0.5 hover:text-emerald-400",
                                  children: /* @__PURE__ */ jsx(ChevronRight, { className: "w-3 h-3" })
                                }
                              )
                            ] })
                          ] })
                        ]
                      },
                      card.id
                    );
                  }),
                  listCards.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-[11px] text-[#484f58] text-center py-3", children: "Nenhum cartão aqui" })
                ] }),
                /* @__PURE__ */ jsx("div", { className: "pt-2 mt-1", children: /* @__PURE__ */ jsxs("div", { className: "flex gap-1.5", children: [
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      value: newCardTitleByList[list.id] || "",
                      onChange: (e) => setNewCardTitleByList((prev) => ({ ...prev, [list.id]: e.target.value })),
                      onKeyDown: (e) => e.key === "Enter" && handleAddCard(list.id),
                      placeholder: "+ Adicionar cartão",
                      className: "flex-1 bg-transparent border border-dashed border-[#30363d] rounded-lg px-2.5 py-1.5 text-xs text-[#f0f6fc] placeholder:text-[#484f58] focus:outline-none focus:border-emerald-500/50"
                    }
                  ),
                  newCardTitleByList[list.id]?.trim() && /* @__PURE__ */ jsx(
                    "button",
                    {
                      onClick: () => handleAddCard(list.id),
                      disabled: addingCardToList === list.id,
                      className: "px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold disabled:opacity-50",
                      children: "OK"
                    }
                  )
                ] }) })
              ]
            },
            list.id
          );
        }),
        /* @__PURE__ */ jsx("div", { className: "shrink-0 w-72", children: /* @__PURE__ */ jsxs("div", { className: "flex gap-1.5", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              value: newListTitle,
              onChange: (e) => setNewListTitle(e.target.value),
              onKeyDown: (e) => e.key === "Enter" && handleAddList(),
              placeholder: "+ Adicionar outra coluna",
              className: "flex-1 bg-[#161b22] border border-dashed border-[#30363d] rounded-xl px-3 py-2.5 text-xs text-[#f0f6fc] placeholder:text-[#8b949e] focus:outline-none focus:border-emerald-500/50"
            }
          ),
          newListTitle.trim() && /* @__PURE__ */ jsx(
            "button",
            {
              onClick: handleAddList,
              disabled: addingList,
              className: "px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold disabled:opacity-50",
              children: "OK"
            }
          )
        ] }) })
      ] })
    ] }),
    activeCard && boardData && /* @__PURE__ */ jsx(
      CardDetailModal,
      {
        card: activeCard,
        lists: boardData.lists,
        checklistItems: boardData.checklistItems.filter((i) => i.cardId === activeCard.id),
        comments: boardData.comments.filter((c) => c.cardId === activeCard.id).sort((a, b) => a.createdAt < b.createdAt ? -1 : 1),
        onClose: () => setActiveCardId(null),
        onUpdate: (updates) => handleUpdateCard(activeCard.id, updates),
        onDelete: () => handleDeleteCard(activeCard.id),
        onMove: (targetListId) => performMoveCard(activeCard.id, targetListId, 0),
        onAddChecklistItem: async (text) => {
          try {
            await api("add_checklist_item", { cardId: activeCard.id, text });
            if (selectedBoardId) await fetchBoard(selectedBoardId);
          } catch (e) {
            setError(e.message);
          }
        },
        onToggleChecklistItem: async (itemId, done) => {
          try {
            await api("toggle_checklist_item", { itemId, done });
            if (selectedBoardId) await fetchBoard(selectedBoardId);
          } catch (e) {
            setError(e.message);
          }
        },
        onDeleteChecklistItem: async (itemId) => {
          try {
            await api("delete_checklist_item", { itemId });
            if (selectedBoardId) await fetchBoard(selectedBoardId);
          } catch (e) {
            setError(e.message);
          }
        },
        onAddComment: async (text) => {
          try {
            await api("add_comment", { cardId: activeCard.id, text });
            if (selectedBoardId) await fetchBoard(selectedBoardId);
          } catch (e) {
            setError(e.message);
          }
        }
      }
    )
  ] });
};
const CardDetailModal = ({
  card,
  lists,
  checklistItems,
  comments,
  onClose,
  onUpdate,
  onDelete,
  onMove,
  onAddChecklistItem,
  onToggleChecklistItem,
  onDeleteChecklistItem,
  onAddComment
}) => {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || "");
  const [labelsText, setLabelsText] = useState(card.labels.join(", "));
  const [newChecklistText, setNewChecklistText] = useState("");
  const [newCommentText, setNewCommentText] = useState("");
  const [editingTitle, setEditingTitle] = useState(false);
  const doneCount = checklistItems.filter((i) => i.done).length;
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in", children: /* @__PURE__ */ jsxs("div", { className: "bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto", children: [
    /* @__PURE__ */ jsx("button", { onClick: onClose, className: "absolute top-4 right-4 text-[#8b949e] hover:text-[#f0f6fc]", "aria-label": "Fechar", children: /* @__PURE__ */ jsx(X, { className: "w-5 h-5" }) }),
    editingTitle ? /* @__PURE__ */ jsx(
      "input",
      {
        autoFocus: true,
        value: title,
        onChange: (e) => setTitle(e.target.value),
        onBlur: () => {
          setEditingTitle(false);
          if (title.trim() && title !== card.title) onUpdate({ title: title.trim() });
        },
        onKeyDown: (e) => e.key === "Enter" && e.target.blur(),
        className: "w-full bg-[#0d1117] border border-emerald-500 rounded-lg px-3 py-2 text-base font-bold text-[#f0f6fc] focus:outline-none mb-4"
      }
    ) : /* @__PURE__ */ jsxs("button", { onClick: () => setEditingTitle(true), className: "flex items-start gap-2 text-left mb-4 group", children: [
      /* @__PURE__ */ jsx("h3", { className: "text-base font-bold text-[#f0f6fc] pr-6", children: card.title }),
      /* @__PURE__ */ jsx(Pencil, { className: "w-3.5 h-3.5 text-[#8b949e] opacity-0 group-hover:opacity-100 mt-1 shrink-0" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "text-[10px] uppercase tracking-wide text-[#8b949e] block mb-1", children: "Prioridade" }),
        /* @__PURE__ */ jsxs(
          "select",
          {
            value: card.priority,
            onChange: (e) => onUpdate({ priority: e.target.value }),
            className: "w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-2 py-1.5 text-xs text-[#f0f6fc] focus:outline-none",
            children: [
              /* @__PURE__ */ jsx("option", { value: "baixa", children: "Baixa" }),
              /* @__PURE__ */ jsx("option", { value: "media", children: "Média" }),
              /* @__PURE__ */ jsx("option", { value: "alta", children: "Alta" })
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "text-[10px] uppercase tracking-wide text-[#8b949e] block mb-1", children: "Coluna" }),
        /* @__PURE__ */ jsx(
          "select",
          {
            value: card.listId,
            onChange: (e) => onMove(Number(e.target.value)),
            className: "w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-2 py-1.5 text-xs text-[#f0f6fc] focus:outline-none",
            children: lists.map((l) => /* @__PURE__ */ jsx("option", { value: l.id, children: l.title }, l.id))
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "text-[10px] uppercase tracking-wide text-[#8b949e] block mb-1", children: "Vencimento" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "date",
            value: card.dueDate || "",
            onChange: (e) => onUpdate({ dueDate: e.target.value || void 0 }),
            className: "w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-2 py-1.5 text-xs text-[#f0f6fc] focus:outline-none"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3 mb-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "text-[10px] uppercase tracking-wide text-[#8b949e] block mb-1", children: "Responsável" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            defaultValue: card.assignee || "",
            onBlur: (e) => e.target.value !== card.assignee && onUpdate({ assignee: e.target.value }),
            placeholder: "Opcional",
            className: "w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-2 py-1.5 text-xs text-[#f0f6fc] focus:outline-none"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { className: "text-[10px] uppercase tracking-wide text-[#8b949e] block mb-1", children: "Etiquetas (separadas por vírgula)" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            value: labelsText,
            onChange: (e) => setLabelsText(e.target.value),
            onBlur: () => onUpdate({ labels: labelsText.split(",").map((s) => s.trim()).filter(Boolean) }),
            placeholder: "ex.: urgente, cliente-x",
            className: "w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-2 py-1.5 text-xs text-[#f0f6fc] focus:outline-none"
          }
        )
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
      /* @__PURE__ */ jsx("label", { className: "text-[10px] uppercase tracking-wide text-[#8b949e] block mb-1", children: "Descrição" }),
      /* @__PURE__ */ jsx(
        "textarea",
        {
          value: description,
          onChange: (e) => setDescription(e.target.value),
          onBlur: () => description !== (card.description || "") && onUpdate({ description }),
          rows: 3,
          placeholder: "Detalhes do cartão...",
          className: "w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-[#f0f6fc] focus:outline-none focus:border-emerald-500 resize-none"
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
      /* @__PURE__ */ jsxs("label", { className: "text-[10px] uppercase tracking-wide text-[#8b949e] flex items-center gap-1.5 mb-2", children: [
        /* @__PURE__ */ jsx(CheckSquare, { className: "w-3.5 h-3.5" }),
        " Checklist ",
        checklistItems.length > 0 && `(${doneCount}/${checklistItems.length})`
      ] }),
      /* @__PURE__ */ jsx("div", { className: "space-y-1.5", children: checklistItems.map((item) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 group", children: [
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "checkbox",
            checked: item.done,
            onChange: (e) => onToggleChecklistItem(item.id, e.target.checked),
            className: "rounded border-[#30363d] bg-[#0d1117] text-emerald-500 focus:ring-0"
          }
        ),
        /* @__PURE__ */ jsx("span", { className: `text-xs flex-1 ${item.done ? "line-through text-[#8b949e]" : "text-[#f0f6fc]"}`, children: item.text }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => onDeleteChecklistItem(item.id),
            className: "opacity-0 group-hover:opacity-100 text-[#8b949e] hover:text-rose-400",
            children: /* @__PURE__ */ jsx(X, { className: "w-3 h-3" })
          }
        )
      ] }, item.id)) }),
      /* @__PURE__ */ jsx("div", { className: "flex gap-1.5 mt-2", children: /* @__PURE__ */ jsx(
        "input",
        {
          value: newChecklistText,
          onChange: (e) => setNewChecklistText(e.target.value),
          onKeyDown: (e) => {
            if (e.key === "Enter" && newChecklistText.trim()) {
              onAddChecklistItem(newChecklistText.trim());
              setNewChecklistText("");
            }
          },
          placeholder: "+ Adicionar item",
          className: "flex-1 bg-[#0d1117] border border-[#30363d] rounded-lg px-2.5 py-1.5 text-xs text-[#f0f6fc] focus:outline-none focus:border-emerald-500"
        }
      ) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mb-4", children: [
      /* @__PURE__ */ jsxs("label", { className: "text-[10px] uppercase tracking-wide text-[#8b949e] flex items-center gap-1.5 mb-2", children: [
        /* @__PURE__ */ jsx(MessageSquare, { className: "w-3.5 h-3.5" }),
        " Comentários"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "space-y-2 max-h-32 overflow-y-auto", children: [
        comments.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-[11px] text-[#484f58]", children: "Nenhum comentário ainda." }),
        comments.map((c) => /* @__PURE__ */ jsxs("div", { className: "bg-[#0d1117] border border-[#30363d] rounded-lg p-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
            /* @__PURE__ */ jsx("span", { className: "text-[10px] font-semibold text-emerald-400", children: c.authorName }),
            /* @__PURE__ */ jsx("span", { className: "text-[9px] text-[#8b949e]", children: c.createdAt && new Date(c.createdAt).toLocaleString("pt-BR") })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-xs text-[#f0f6fc] mt-0.5", children: c.text })
        ] }, c.id))
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex gap-1.5 mt-2", children: /* @__PURE__ */ jsx(
        "input",
        {
          value: newCommentText,
          onChange: (e) => setNewCommentText(e.target.value),
          onKeyDown: (e) => {
            if (e.key === "Enter" && newCommentText.trim()) {
              onAddComment(newCommentText.trim());
              setNewCommentText("");
            }
          },
          placeholder: "Escrever um comentário...",
          className: "flex-1 bg-[#0d1117] border border-[#30363d] rounded-lg px-2.5 py-1.5 text-xs text-[#f0f6fc] focus:outline-none focus:border-emerald-500"
        }
      ) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center pt-4 border-t border-[#30363d]", children: [
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: onDelete,
          className: "flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 font-medium",
          children: [
            /* @__PURE__ */ jsx(Trash2, { className: "w-3.5 h-3.5" }),
            " Excluir cartão"
          ]
        }
      ),
      /* @__PURE__ */ jsx("button", { onClick: onClose, className: "px-4 py-2 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-[#f0f6fc] text-xs font-semibold", children: "Fechar" })
    ] })
  ] }) });
};
function RitmoApp() {
  const [activeTab, setActiveTab] = useState("hoje");
  const [theme, setTheme] = useState("dark");
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [activeCycle, setActiveCycle] = useState(null);
  const [allCycles, setAllCycles] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [habits, setHabits] = useState([]);
  const [habitLogs, setHabitLogs] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [journalEntries, setJournalEntries] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [affiliateStats, setAffiliateStats] = useState({
    referralCode: "",
    referralLink: "",
    totalClicks: 0,
    totalReferrals: 0,
    activeSubscriptions: 0,
    commissionRatePercent: 60,
    pendingCommissionCents: 0,
    approvedCommissionCents: 0,
    paidCommissionCents: 0,
    availableBalanceCents: 0
  });
  const [commissions, setCommissions] = useState([]);
  const [refParam, setRefParam] = useState("");
  const [quickFocusConfig, setQuickFocusConfig] = useState({
    duration: 25,
    topic: ""
  });
  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const ref = urlParams.get("ref");
      if (ref) {
        setRefParam(ref);
        localStorage.setItem("ritmo_referral", ref);
      } else {
        const storedRef = localStorage.getItem("ritmo_referral");
        if (storedRef) setRefParam(storedRef);
      }
      loadSessionAndData();
    }
  }, []);
  const loadSessionAndData = async () => {
    try {
      const authRes = await fetch("/api/auth");
      const authData = await authRes.json();
      if (authData.user) {
        setUser(authData.user);
        setAffiliateStats((prev) => ({
          ...prev,
          referralCode: authData.user.referralCode,
          referralLink: `/?ref=${authData.user.referralCode}`
        }));
      } else {
        window.location.href = "/login";
        return;
      }
      if (authData.user.access && authData.user.access.hasAccess === false) {
        window.location.href = "/checkout?bloqueado=1";
        return;
      }
      const cycleRes = await fetch("/api/cycles");
      const cycleData = await cycleRes.json();
      if (cycleData.active) {
        setActiveCycle(cycleData.active);
      } else {
        setActiveCycle(null);
        setAllCycles([]);
      }
      const tasksRes = await fetch("/api/tasks");
      const tasksData = await tasksRes.json();
      const todayStr = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
      if (tasksData.tasks && tasksData.tasks.length > 0) {
        setTasks(tasksData.tasks);
      } else {
        setTasks([]);
      }
      const habitsRes = await fetch("/api/habits");
      const habitsData = await habitsRes.json();
      if (habitsData.habits && habitsData.habits.length > 0) {
        setHabits(habitsData.habits);
        setHabitLogs(habitsData.logs || []);
      } else {
        setHabits([]);
        setHabitLogs([]);
      }
      const focusRes = await fetch("/api/focus");
      const focusData = await focusRes.json();
      if (focusData.sessions && focusData.sessions.length > 0) {
        setSessions(focusData.sessions);
      } else {
        setSessions([]);
      }
      const journalRes = await fetch("/api/journal");
      const journalData = await journalRes.json();
      if (journalData.entries && journalData.entries.length > 0) {
        setJournalEntries(journalData.entries);
      } else {
        setJournalEntries([]);
      }
      const finRes = await fetch("/api/finance");
      const finData = await finRes.json();
      if (finData.transactions && finData.transactions.length > 0) {
        setTransactions(finData.transactions);
      } else {
        setTransactions([]);
      }
      const affRes = await fetch("/api/affiliates");
      const affData = await affRes.json();
      if (affData.stats) {
        setAffiliateStats(affData.stats);
        setCommissions(affData.commissions || []);
      } else {
        setCommissions([]);
      }
    } catch {
    }
  };
  const handleToggleTask = async (taskId, completed) => {
    setTasks((prev) => prev.map((t) => t.id === taskId ? {
      ...t,
      completed
    } : t));
    await fetch("/api/tasks", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        id: taskId,
        completed
      })
    });
  };
  const handleAddTask = async (newTask) => {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(newTask)
    });
    const data = await res.json();
    if (data.task) {
      setTasks((prev) => [data.task, ...prev]);
    }
  };
  const handleUpdateTask = async (id, updates) => {
    setTasks((prev) => prev.map((t) => t.id === id ? {
      ...t,
      ...updates
    } : t));
    await fetch("/api/tasks", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        id,
        ...updates
      })
    });
  };
  const handleDeleteTask = async (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await fetch(`/api/tasks?id=${id}`, {
      method: "DELETE"
    });
  };
  const handleToggleHabit = async (habitId, completed, date) => {
    const targetDate = date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    setHabitLogs((prev) => {
      const existing = prev.find((l) => l.habitId === habitId && l.date === targetDate);
      if (existing) {
        return prev.map((l) => l.habitId === habitId && l.date === targetDate ? {
          ...l,
          completed
        } : l);
      }
      return [...prev, {
        id: Date.now(),
        habitId,
        userId: 1,
        date: targetDate,
        completed
      }];
    });
    await fetch("/api/habits", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action: "toggle_log",
        habitId,
        date: targetDate,
        completed
      })
    });
  };
  const handleAddHabit = async (newHabit) => {
    const res = await fetch("/api/habits", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(newHabit)
    });
    const data = await res.json();
    if (data.habit) {
      setHabits((prev) => [...prev, data.habit]);
    }
  };
  const handleRecordSession = async (session) => {
    const res = await fetch("/api/focus", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(session)
    });
    const data = await res.json();
    if (data.session) {
      setSessions((prev) => [data.session, ...prev]);
    }
  };
  const handleQuickStartFocus = (duration, topic) => {
    setQuickFocusConfig({
      duration,
      topic
    });
    setActiveTab("foco");
  };
  const handleSaveJournalEntry = async (entry) => {
    const res = await fetch("/api/journal", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(entry)
    });
    const data = await res.json();
    if (data.entry) {
      setJournalEntries((prev) => {
        const idx = prev.findIndex((j) => j.date === data.entry.date && j.entryType === data.entry.entryType);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = data.entry;
          return updated;
        }
        return [data.entry, ...prev];
      });
    }
  };
  const handleAddTransaction = async (tx) => {
    const res = await fetch("/api/finance", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(tx)
    });
    const data = await res.json();
    if (data.transaction) {
      setTransactions((prev) => [data.transaction, ...prev]);
    }
  };
  const handleDeleteTransaction = async (id) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    await fetch(`/api/finance?id=${id}`, {
      method: "DELETE"
    });
  };
  const refreshFinance = async () => {
    const res = await fetch("/api/finance");
    const data = await res.json();
    if (data.transactions) {
      setTransactions(data.transactions);
    }
  };
  const handleLogout = async () => {
    await fetch("/api/auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action: "logout"
      })
    });
    setUser(null);
    window.location.href = "/login";
  };
  const handleDeleteAccount = async () => {
    await fetch("/api/auth", {
      method: "DELETE"
    });
    setUser(null);
    setActiveCycle(null);
    setTasks([]);
    setHabits([]);
    setTransactions([]);
    window.location.href = "/";
  };
  const handleUpdateProfile = async (updates) => {
    const res = await fetch("/api/auth", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    if (data.user) {
      setUser(data.user);
    }
  };
  const NAV_ITEMS = [{
    id: "hoje",
    label: "Hoje",
    icon: /* @__PURE__ */ jsx(Flame, { className: "w-4 h-4" })
  }, {
    id: "rotina",
    label: "Rotina & Tarefas",
    icon: /* @__PURE__ */ jsx(Calendar, { className: "w-4 h-4" })
  }, {
    id: "quadros",
    label: "Quadros",
    icon: /* @__PURE__ */ jsx(LayoutGrid, { className: "w-4 h-4" })
  }, {
    id: "habitos",
    label: "Hábitos & Saúde",
    icon: /* @__PURE__ */ jsx(Sparkles, { className: "w-4 h-4" })
  }, {
    id: "foco",
    label: "Sessões de Foco",
    icon: /* @__PURE__ */ jsx(Clock, { className: "w-4 h-4" })
  }, {
    id: "diario",
    label: "Diário & Revisões",
    icon: /* @__PURE__ */ jsx(BookOpen, { className: "w-4 h-4" })
  }, {
    id: "financas",
    label: "Finanças Pessoais",
    icon: /* @__PURE__ */ jsx(DollarSign, { className: "w-4 h-4" })
  }, {
    id: "whatsapp",
    label: "WhatsApp Bot",
    icon: /* @__PURE__ */ jsx(Smartphone, { className: "w-4 h-4" })
  }, {
    id: "planilha",
    label: "Planilhas",
    icon: /* @__PURE__ */ jsx(FileSpreadsheet, { className: "w-4 h-4" })
  }, {
    id: "afiliados",
    label: "Indique e Ganhe",
    icon: /* @__PURE__ */ jsx(Share2, { className: "w-4 h-4" })
  }, {
    id: "progresso",
    label: "Progresso",
    icon: /* @__PURE__ */ jsx(TrendingUp, { className: "w-4 h-4" })
  }, {
    id: "configuracoes",
    label: "Configurações",
    icon: /* @__PURE__ */ jsx(Settings, { className: "w-4 h-4" })
  }];
  return /* @__PURE__ */ jsxs("div", { className: `min-h-screen ${theme === "dark" ? "bg-[#0d1117] text-[#f0f6fc]" : "bg-[#f6f8fa] text-[#1f2328]"}`, children: [
    user && user.role !== "admin" && user.access && (() => {
      const {
        effectiveStatus,
        daysLeft
      } = user.access;
      const showTrial = effectiveStatus === "trial";
      const showRenew = (effectiveStatus === "active" || effectiveStatus === "canceled") && daysLeft <= 5;
      if (!showTrial && !showRenew) return null;
      const plural = daysLeft === 1 ? "dia" : "dias";
      return /* @__PURE__ */ jsxs("div", { className: "bg-emerald-950/60 border-b border-emerald-800/60 text-emerald-200 text-xs sm:text-sm px-4 py-2 flex flex-wrap items-center justify-center gap-x-3 gap-y-1", children: [
        /* @__PURE__ */ jsxs("span", { children: [
          showTrial ? "Teste grátis" : effectiveStatus === "canceled" ? "Seu acesso termina em" : "Sua assinatura vence em",
          ":",
          " ",
          /* @__PURE__ */ jsxs("strong", { children: [
            daysLeft,
            " ",
            plural
          ] })
        ] }),
        /* @__PURE__ */ jsx("a", { href: "/checkout", className: "font-semibold underline hover:text-white", children: showTrial ? "Assinar o Ritmo PRO — R$ 39,90/mês" : "Renovar agora" })
      ] });
    })(),
    /* @__PURE__ */ jsx(Header, { user, activeCycle, theme, onToggleTheme: () => setTheme(theme === "dark" ? "light" : "dark"), onOpenAuth: () => setIsAuthOpen(true), onLogout: handleLogout, onOpenOnboarding: () => setIsOnboardingOpen(true) }),
    /* @__PURE__ */ jsxs("div", { className: "max-w-7xl mx-auto px-4 sm:px-6 py-6", children: [
      /* @__PURE__ */ jsx("div", { className: "mb-6 pb-2 border-b border-[#30363d] overflow-x-auto", children: /* @__PURE__ */ jsx("nav", { className: "flex space-x-1 sm:space-x-2 min-w-max", children: NAV_ITEMS.map((item) => {
        const active = activeTab === item.id;
        return /* @__PURE__ */ jsxs("button", { onClick: () => setActiveTab(item.id), className: `flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${active ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20" : "text-[#8b949e] hover:text-[#f0f6fc] hover:bg-[#161b22]"}`, children: [
          item.icon,
          /* @__PURE__ */ jsx("span", { children: item.label })
        ] }, item.id);
      }) }) }),
      /* @__PURE__ */ jsxs("main", { children: [
        activeTab === "hoje" && /* @__PURE__ */ jsx(TabToday, { activeCycle, tasks, habits, habitLogs, transactions, onToggleTask: handleToggleTask, onToggleHabit: handleToggleHabit, onQuickStartFocus: handleQuickStartFocus, onNavigateTab: (tab) => setActiveTab(tab), onOpenOnboarding: () => setIsOnboardingOpen(true) }),
        activeTab === "rotina" && /* @__PURE__ */ jsx(TabTasks, { tasks, onAddTask: handleAddTask, onUpdateTask: handleUpdateTask, onDeleteTask: handleDeleteTask }),
        activeTab === "quadros" && /* @__PURE__ */ jsx(TabBoards, {}),
        activeTab === "habitos" && /* @__PURE__ */ jsx(TabHabits, { habits, habitLogs, onToggleHabit: handleToggleHabit, onAddHabit: handleAddHabit }),
        activeTab === "foco" && /* @__PURE__ */ jsx(TabFocus, { sessions, onRecordSession: handleRecordSession, initialDuration: quickFocusConfig.duration, initialTopic: quickFocusConfig.topic }),
        activeTab === "diario" && /* @__PURE__ */ jsx(TabJournal, { entries: journalEntries, onSaveEntry: handleSaveJournalEntry }),
        activeTab === "financas" && /* @__PURE__ */ jsx(TabFinance, { transactions, onAddTransaction: handleAddTransaction, onDeleteTransaction: handleDeleteTransaction }),
        activeTab === "whatsapp" && /* @__PURE__ */ jsx(TabWhatsApp, { userPhone: user?.whatsappPhone || void 0, onRefreshFinance: refreshFinance }),
        activeTab === "planilha" && /* @__PURE__ */ jsx(TabSheets, { onExportCSV: () => {
          window.open("/api/finance?format=csv", "_blank");
        } }),
        activeTab === "afiliados" && /* @__PURE__ */ jsx(TabAffiliates, { affiliateStats, commissions }),
        activeTab === "progresso" && /* @__PURE__ */ jsx(TabProgress, { cycles: allCycles.length > 0 ? allCycles : activeCycle ? [activeCycle] : [], tasks, habits, habitLogs, sessions, transactions, onDeleteAccount: handleDeleteAccount }),
        activeTab === "configuracoes" && /* @__PURE__ */ jsx(TabSettings, { user, theme, onToggleTheme: () => setTheme(theme === "dark" ? "light" : "dark"), onUpdateProfile: handleUpdateProfile })
      ] })
    ] }),
    /* @__PURE__ */ jsx(AuthModal, { isOpen: isAuthOpen, onClose: () => setIsAuthOpen(false), onLoginSuccess: (u) => {
      setUser(u);
      loadSessionAndData();
    }, initialReferralCode: refParam }),
    /* @__PURE__ */ jsx(OnboardingModal, { isOpen: isOnboardingOpen, onClose: () => setIsOnboardingOpen(false), existingCycle: activeCycle, onSaveCycle: (cycle) => {
      setActiveCycle(cycle);
      setAllCycles((prev) => [cycle, ...prev]);
    } })
  ] });
}
export {
  RitmoApp as component
};
