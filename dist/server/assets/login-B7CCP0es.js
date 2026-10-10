import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { Flame } from "lucide-react";
import { A as AuthModal } from "./AuthModal-i7J_fnp1.js";
function LoginPage() {
  const [ready, setReady] = useState(false);
  const [initialTab, setInitialTab] = useState("login");
  const [referral, setReferral] = useState("");
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("modo") === "cadastro") setInitialTab("register");
    const ref = params.get("ref");
    if (ref) localStorage.setItem("ritmo_referral", ref);
    setReferral(ref || localStorage.getItem("ritmo_referral") || "");
    fetch("/api/auth").then((r) => r.json()).then((d) => {
      if (d?.user) window.location.href = "/app";
      else setReady(true);
    }).catch(() => setReady(true));
  }, []);
  const goToApp = () => {
    window.location.href = "/app";
  };
  return /* @__PURE__ */ jsxs("div", { className: "min-h-screen bg-[#0d1117] text-[#f0f6fc] flex flex-col items-center justify-center px-4", children: [
    /* @__PURE__ */ jsxs("a", { href: "/", className: "flex items-center gap-3 mb-6", children: [
      /* @__PURE__ */ jsx("div", { className: "w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-amber-500 flex items-center justify-center shadow-lg shadow-emerald-500/10", children: /* @__PURE__ */ jsx(Flame, { className: "w-6 h-6 text-white" }) }),
      /* @__PURE__ */ jsx("span", { className: "font-extrabold text-2xl tracking-tight bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 bg-clip-text text-transparent", children: "Ritmo" })
    ] }),
    ready && /* @__PURE__ */ jsx(AuthModal, { isOpen: true, initialTab, initialReferralCode: referral, onClose: () => {
      window.location.href = "/";
    }, onLoginSuccess: goToApp }, initialTab + referral),
    !ready && /* @__PURE__ */ jsx("p", { className: "text-sm text-[#8b949e]", children: "Carregando..." })
  ] });
}
export {
  LoginPage as component
};
