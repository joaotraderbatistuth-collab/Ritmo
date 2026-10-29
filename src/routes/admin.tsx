import { createFileRoute } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Flame, Users, CreditCard, Ticket, Wallet, LayoutDashboard, Search, X, AlertCircle, CheckCircle2,
  ShieldCheck, Download, History, Network, UserCog, Gift, Power, RotateCcw, Pencil,
} from 'lucide-react';
import { PERMISSIONS, PERMISSION_TEMPLATES } from '../lib/admin-permissions.js';

export const Route = createFileRoute('/admin')({
  component: AdminPage,
});

/* ------------------------------------------------------------------ */
/* Utilidades                                                          */
/* ------------------------------------------------------------------ */

const brl = (cents: number) => ((cents || 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const dateBR = (v?: string | null) => (v ? new Date(v).toLocaleDateString('pt-BR') : '—');
const dateTimeBR = (v?: string | null) => (v ? new Date(v).toLocaleString('pt-BR') : '—');
const dayBR = (v: string) => v.slice(8, 10) + '/' + v.slice(5, 7);

const STATUS_LABEL: Record<string, string> = {
  trial: 'Em teste',
  active: 'Assinante',
  expired: 'Expirado',
  suspended: 'Desativado',
  canceled: 'Cancelado',
};
const STATUS_TONE: Record<string, string> = {
  trial: 'bg-sky-500/15 text-sky-300',
  active: 'bg-emerald-500/15 text-emerald-300',
  expired: 'bg-amber-500/15 text-amber-300',
  suspended: 'bg-rose-500/15 text-rose-300',
  canceled: 'bg-slate-500/20 text-slate-300',
};
const PERM_LABEL: Record<string, string> = Object.fromEntries(PERMISSIONS.map((p) => [p.key, p.label]));

type Act = (body: Record<string, unknown>) => Promise<boolean>;
type Tab = 'geral' | 'usuarios' | 'admins' | 'vendas' | 'cupons' | 'afiliados' | 'saques' | 'planilhas' | 'auditoria';

const inputCls = 'bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:border-emerald-500';
const btnPrimary = 'px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm disabled:opacity-50';
const btnGhost = 'px-4 py-2 rounded-lg border border-[#30363d] text-sm text-slate-300 hover:bg-[#21262d]';
const th = 'px-4 py-3 text-left font-semibold';
const td = 'px-4 py-3';

/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */

function AdminPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [tab, setTab] = useState<Tab>('geral');

  const load = useCallback(async () => {
    const res = await fetch('/api/admin');
    if (res.status === 401) {
      window.location.href = '/login';
      return;
    }
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json.error || 'Não foi possível carregar o painel.');
      return;
    }
    setData(json);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const act: Act = async (body) => {
    setNotice('');
    setError('');
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json.error || 'Ação não concluída.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return false;
    }
    setNotice(json.message || 'Feito.');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    await load();
    return true;
  };

  const perms: string[] = data?.permissions || [];
  const can = (p: string) => perms.includes(p);

  const tabs = useMemo(() => {
    const all: { id: Tab; label: string; icon: any; show: boolean }[] = [
      { id: 'geral', label: 'Visão geral', icon: LayoutDashboard, show: can('overview') || can('finance') },
      { id: 'usuarios', label: 'Usuários', icon: Users, show: can('users_view') || can('users_manage') },
      { id: 'admins', label: 'Administradores', icon: ShieldCheck, show: can('admins_manage') },
      { id: 'vendas', label: 'Vendas', icon: CreditCard, show: can('finance') },
      { id: 'cupons', label: 'Cupons', icon: Ticket, show: can('coupons') },
      { id: 'afiliados', label: 'Afiliados', icon: Network, show: can('affiliates') },
      { id: 'saques', label: 'Saques', icon: Wallet, show: can('withdrawals') },
      { id: 'planilhas', label: 'Planilhas', icon: Download, show: can('exports') },
      { id: 'auditoria', label: 'Auditoria', icon: History, show: can('audit') },
    ];
    return all.filter((t) => t.show);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  useEffect(() => {
    if (tabs.length && !tabs.some((t) => t.id === tab)) setTab(tabs[0].id);
  }, [tabs, tab]);

  if (error && !data) {
    return (
      <div className="min-h-screen bg-[#0d1117] text-[#f0f6fc] flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
          <p className="mb-4">{error}</p>
          <a href="/app" className="text-emerald-400 underline">Voltar ao painel</a>
        </div>
      </div>
    );
  }
  if (!data) {
    return <div className="min-h-screen bg-[#0d1117] text-slate-400 flex items-center justify-center">Carregando painel...</div>;
  }

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#f0f6fc]">
      <header className="border-b border-[#30363d] bg-[#161b22]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 font-bold">
            <Flame className="w-5 h-5 text-emerald-400" /> Ritmo · Administração
            {data.adminUser?.isMaster && (
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">Master</span>
            )}
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden sm:inline text-slate-400">{data.adminUser?.email}</span>
            <a href="/app" className="text-slate-300 hover:text-white">Voltar ao app</a>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <nav className="flex gap-1 overflow-x-auto border-b border-[#30363d] mb-6">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 ${
                tab === t.id ? 'border-emerald-400 text-emerald-400' : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </nav>

        {error && (
          <div role="alert" className="mb-4 flex items-center gap-2 text-sm text-rose-300 bg-rose-950/40 border border-rose-800/60 rounded-lg p-3">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            <button className="ml-auto" onClick={() => setError('')}><X className="w-4 h-4" /></button>
          </div>
        )}
        {notice && (
          <div className="mb-4 flex items-center gap-2 text-sm text-emerald-300 bg-emerald-950/40 border border-emerald-800/60 rounded-lg p-3">
            <CheckCircle2 className="w-4 h-4 shrink-0" /> {notice}
            <button className="ml-auto" onClick={() => setNotice('')}><X className="w-4 h-4" /></button>
          </div>
        )}

        {tab === 'geral' && <Overview data={data} />}
        {tab === 'usuarios' && <UsersTab users={data.users || []} act={act} canManage={can('users_manage')} isMaster={Boolean(data.adminUser?.isMaster)} me={data.adminUser?.id} />}
        {tab === 'admins' && <AdminsTab admins={data.admins || []} act={act} me={data.adminUser?.id} />}
        {tab === 'vendas' && <SalesTab finance={data.finance} payments={data.payments || []} act={act} canRefund={can('refunds')} />}
        {tab === 'cupons' && <CouponsTab coupons={data.coupons || []} act={act} />}
        {tab === 'afiliados' && <AffiliatesTab affiliates={data.affiliates || []} />}
        {tab === 'saques' && <WithdrawalsTab withdrawals={data.withdrawals || []} act={act} />}
        {tab === 'planilhas' && <ExportsTab can={can} />}
        {tab === 'auditoria' && <AuditTab audit={data.audit || []} />}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Componentes comuns                                                  */
/* ------------------------------------------------------------------ */

function Card({ label, value, hint, tone = '' }: { label: string; value: string | number; hint?: string; tone?: string }) {
  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5">
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`text-2xl font-extrabold mt-1 ${tone}`}>{value}</p>
      {hint && <p className="text-[11px] text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}

function BarChart({ title, data, color, format }: { title: string; data: { label: string; value: number }[]; color: string; format: (n: number) => string }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const total = data.reduce((a, d) => a + d.value, 0);
  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5">
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-sm font-bold">{title}</h3>
        <span className="text-xs text-slate-400">Total: {format(total)}</span>
      </div>
      <div className="flex items-end gap-[3px] h-32" role="img" aria-label={title}>
        {data.map((d) => (
          <div key={d.label} className="flex-1 group relative flex items-end h-full">
            <div className={`w-full rounded-t ${color}`} style={{ height: `${Math.max(2, (d.value / max) * 100)}%`, opacity: d.value ? 1 : 0.25 }} />
            <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-black px-1.5 py-0.5 text-[10px] opacity-0 group-hover:opacity-100">
              {dayBR(d.label)}: {format(d.value)}
            </span>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-slate-500 mt-1">
        <span>{data[0] ? dayBR(data[0].label) : ''}</span>
        <span>últimos 30 dias</span>
        <span>{data.length ? dayBR(data[data.length - 1].label) : ''}</span>
      </div>
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-md p-5 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold">{title}</h3>
          <button onClick={onClose} aria-label="Fechar"><X className="w-4 h-4" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Table({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto border border-[#30363d] rounded-2xl">
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}
const Thead = ({ cols }: { cols: string[] }) => (
  <thead className="bg-[#161b22] text-slate-400">
    <tr>{cols.map((c) => <th key={c} className={th}>{c}</th>)}</tr>
  </thead>
);
const Empty = ({ cols, text }: { cols: number; text: string }) => (
  <tr><td colSpan={cols} className="px-4 py-8 text-center text-slate-500">{text}</td></tr>
);

/* ------------------------------------------------------------------ */
/* Visão geral                                                         */
/* ------------------------------------------------------------------ */

function Overview({ data }: { data: any }) {
  const m = data.metrics;
  const f = data.finance;
  return (
    <div className="space-y-6">
      {m && (
        <>
          <section>
            <h2 className="text-sm font-bold text-slate-300 mb-3">Pessoas</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card label="Cadastros" value={m.totalUsers} hint={`${m.newUsers7d} nos últimos 7 dias · ${m.newUsers30d} em 30 dias`} />
              <Card label="Assinantes pagos" value={m.paidSubscribers} tone="text-emerald-300" />
              <Card label="Em período de teste" value={m.trialUsers} tone="text-sky-300" />
              <Card label="Expirados" value={m.expiredUsers} hint="Teste ou pagamento vencido" tone="text-amber-300" />
              <Card label="Conversão em pagantes" value={`${m.conversionPercent}%`} hint={`${m.payersEver} pessoa(s) com pagamento real ÷ cadastros`} />
              <Card label="Usaram o app em 7 dias" value={m.activeLast7d} hint={m.totalUsers ? `${Math.round((m.activeLast7d / m.totalUsers) * 100)}% dos cadastros` : ''} />
              <Card label="Desativados" value={m.suspendedUsers} tone="text-rose-300" />
              <Card label="Administradores" value={m.adminsCount} />
            </div>
          </section>
          {data.signupsByDay && (
            <BarChart title="Cadastros por dia" color="bg-emerald-500" format={(n) => String(n)} data={data.signupsByDay.map((d: any) => ({ label: d.date, value: d.count }))} />
          )}
        </>
      )}

      {f && (
        <>
          <section>
            <h2 className="text-sm font-bold text-slate-300 mb-3">Dinheiro</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <Card label="Receita total (pagamentos reais)" value={brl(f.revenueTotalCents)} hint={`${f.paidCount} pagamento(s)`} tone="text-emerald-300" />
              <Card label="Últimos 30 dias" value={brl(f.revenue30dCents)} />
              <Card label="MRR estimado" value={brl(f.mrrCents)} hint="Assinantes ativos × R$ 39,90" />
              <Card label="Ticket médio" value={brl(f.averageTicketCents)} />
              <Card label="Comissões geradas" value={brl(f.commissionsGeneratedCents)} hint="Aprovadas ou pagas" />
              <Card label="Receita − comissões" value={brl(f.netAfterCommissionsCents)} hint="Antes de taxas, impostos e custos" />
              <Card label="Reembolsado" value={brl(f.refundedCents)} tone="text-rose-300" />
              <Card label="Descontos concedidos" value={brl(f.discountGivenCents)} hint="Cupons usados em pagamentos reais" />
            </div>
            <p className="text-xs text-slate-500 mt-3">
              Só entram aqui pagamentos reais (Mercado Pago). Vendas de teste/simuladas somam {brl(f.simulatedPaidCents)} ({f.simulatedPaidCount}) e ficam de fora.
              Comissões a pagar: {brl(f.pendingCommissionsCents)} · já pagas: {brl(f.totalCommissionsPaidCents)}.
            </p>
          </section>
          <BarChart title="Receita por dia" color="bg-amber-400" format={brl} data={f.revenueByDay.map((d: any) => ({ label: d.date, value: d.cents }))} />
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Usuários                                                            */
/* ------------------------------------------------------------------ */

function StatusBadge({ u }: { u: any }) {
  const key = u.subscriptionStatus === 'suspended' ? 'suspended' : u.access?.effectiveStatus || u.subscriptionStatus;
  return <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUS_TONE[key] || 'bg-slate-500/20 text-slate-300'}`}>{STATUS_LABEL[key] || key}</span>;
}

function UsersTab({ users, act, canManage, isMaster, me }: { users: any[]; act: Act; canManage: boolean; isMaster: boolean; me: number }) {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('todos');
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<any>(null);
  const [granting, setGranting] = useState<any>(null);
  const SIZE = 50;

  const filtered = useMemo(
    () =>
      users.filter((u) => {
        const text = `${u.name} ${u.email}`.toLowerCase();
        const key = u.subscriptionStatus === 'suspended' ? 'suspended' : u.access?.effectiveStatus || u.subscriptionStatus;
        const okStatus = status === 'todos' || key === status || (status === 'admin' && u.role === 'admin');
        return (!q || text.includes(q.toLowerCase())) && okStatus;
      }),
    [users, q, status]
  );
  useEffect(() => setPage(0), [q, status]);
  const pages = Math.max(1, Math.ceil(filtered.length / SIZE));
  const shown = filtered.slice(page * SIZE, page * SIZE + SIZE);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar nome ou e-mail" className="bg-[#0d1117] border border-[#30363d] rounded-lg pl-9 pr-3 py-2 text-sm w-64" />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm">
          <option value="todos">Todos</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          <option value="admin">Administradores</option>
        </select>
        <span className="text-xs text-slate-500 self-center">{filtered.length} usuário(s)</span>
      </div>

      <Table>
        <Thead cols={['Usuário', 'Situação', 'Acesso', 'Indicado por', 'Cadastro', 'Uso', ...(canManage ? ['Ações'] : [])]} />
        <tbody>
          {shown.length === 0 && <Empty cols={7} text="Nenhum usuário encontrado." />}
          {shown.map((u) => {
            const locked = u.role === 'admin' && !isMaster; // só o master mexe em administradores
            const suspended = u.subscriptionStatus === 'suspended';
            return (
              <tr key={u.id} className="border-t border-[#30363d]">
                <td className={td}>
                  <div className="font-semibold">{u.name} {u.isMaster ? <span className="text-[10px] text-amber-300">MASTER</span> : u.role === 'admin' ? <span className="text-[10px] text-amber-300">ADMIN</span> : null}</div>
                  <div className="text-[11px] text-slate-500">{u.email}</div>
                  {u.whatsappPhone && <div className="text-[11px] text-slate-500">WhatsApp {u.whatsappPhone}</div>}
                </td>
                <td className={td}><StatusBadge u={u} /></td>
                <td className={`${td} text-slate-300`}>
                  {u.access?.hasAccess ? (u.role === 'admin' ? 'Livre' : `${u.access.daysLeft} dia(s)`) : 'Sem acesso'}
                  {u.paymentsCount > 0 && <div className="text-[11px] text-slate-500">{u.paymentsCount} pagamento(s)</div>}
                </td>
                <td className={`${td} text-slate-400`}>{u.referredByName || '—'}</td>
                <td className={`${td} text-slate-400`}>{dateBR(u.createdAt)}</td>
                <td className={td}>{u.active7d ? <span className="text-emerald-300 text-xs">Ativo (7d)</span> : <span className="text-slate-500 text-xs">Parado</span>}</td>
                {canManage && (
                  <td className={`${td} whitespace-nowrap space-x-3`}>
                    {locked ? (
                      <span className="text-[11px] text-slate-500">só o master</span>
                    ) : (
                      <>
                        <button className="text-emerald-400 hover:underline inline-flex items-center gap-1" onClick={() => setEditing(u)}><Pencil className="w-3.5 h-3.5" />Editar</button>
                        <button className="text-sky-300 hover:underline inline-flex items-center gap-1" onClick={() => setGranting(u)}><Gift className="w-3.5 h-3.5" />Acesso grátis</button>
                        {suspended ? (
                          <button className="text-emerald-300 hover:underline inline-flex items-center gap-1" onClick={() => act({ action: 'set_user_active', targetUserId: u.id, active: true })}><RotateCcw className="w-3.5 h-3.5" />Reativar</button>
                        ) : (
                          u.id !== me && !u.isMaster && (
                            <button
                              className="text-rose-400 hover:underline inline-flex items-center gap-1"
                              onClick={() => confirm(`Desativar ${u.name}? A pessoa não conseguirá mais entrar nem usar o app.`) && act({ action: 'set_user_active', targetUserId: u.id, active: false })}
                            ><Power className="w-3.5 h-3.5" />Desativar</button>
                          )
                        )}
                      </>
                    )}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </Table>

      {pages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4 text-sm">
          <button className={btnGhost} disabled={page === 0} onClick={() => setPage(page - 1)}>Anterior</button>
          <span className="text-slate-400">Página {page + 1} de {pages}</span>
          <button className={btnGhost} disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>Próxima</button>
        </div>
      )}

      {editing && <EditUserModal user={editing} act={act} onClose={() => setEditing(null)} />}
      {granting && <GrantModal user={granting} act={act} onClose={() => setGranting(null)} />}
    </div>
  );
}

function EditUserModal({ user, act, onClose }: { user: any; act: Act; onClose: () => void }) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [extend, setExtend] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    const ok = await act({ action: 'update_user', targetUserId: user.id, name, email, extendTrialDays: extend || undefined, manualPassword: password || undefined });
    setBusy(false);
    if (ok) onClose();
  };
  return (
    <Modal title="Editar usuário" onClose={onClose}>
      <div className="space-y-3">
        <label className="block text-xs text-slate-400">Nome<input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} /></label>
        <label className="block text-xs text-slate-400">E-mail<input className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label className="block text-xs text-slate-400">Dar mais dias de teste (1 a 365)<input className={inputCls} type="number" min={1} max={365} value={extend} onChange={(e) => setExtend(e.target.value)} placeholder="Ex.: 7" /></label>
        <label className="block text-xs text-slate-400">Nova senha (deixe em branco para não mudar)<input className={inputCls} type="text" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" autoComplete="off" /></label>
        <div className="flex justify-end gap-2 pt-2">
          <button className={btnGhost} onClick={onClose}>Cancelar</button>
          <button className={btnPrimary} onClick={save} disabled={busy}>Salvar</button>
        </div>
      </div>
    </Modal>
  );
}

function GrantModal({ user, act, onClose }: { user: any; act: Act; onClose: () => void }) {
  const [days, setDays] = useState('30');
  const [busy, setBusy] = useState(false);
  const presets: [string, string][] = [['7', '7 dias'], ['30', '30 dias'], ['90', '90 dias'], ['365', '1 ano'], ['3650', 'Vitalício (10 anos)']];
  const go = async () => {
    setBusy(true);
    const ok = await act({ action: 'grant_access', targetUserId: user.id, days: Number(days) });
    setBusy(false);
    if (ok) onClose();
  };
  return (
    <Modal title={`Acesso grátis para ${user.name}`} onClose={onClose}>
      <p className="text-xs text-slate-400 mb-3">O prazo é somado ao que a pessoa já tem pago e ela passa a constar como assinante, sem cobrança.</p>
      <div className="flex flex-wrap gap-2 mb-3">
        {presets.map(([v, l]) => (
          <button key={v} onClick={() => setDays(v)} className={`px-3 py-1.5 rounded-lg text-xs border ${days === v ? 'bg-emerald-500 text-slate-950 border-emerald-500 font-bold' : 'border-[#30363d] text-slate-300'}`}>{l}</button>
        ))}
      </div>
      <label className="block text-xs text-slate-400">Ou informe os dias (1 a 3650)<input className={inputCls} type="number" min={1} max={3650} value={days} onChange={(e) => setDays(e.target.value)} /></label>
      <div className="flex justify-end gap-2 pt-4">
        <button className={btnGhost} onClick={onClose}>Cancelar</button>
        <button className={btnPrimary} onClick={go} disabled={busy}>Conceder</button>
      </div>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Administradores (somente master)                                    */
/* ------------------------------------------------------------------ */

function PermissionPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const toggle = (k: string) => onChange(value.includes(k) ? value.filter((x) => x !== k) : [...value, k]);
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-3">
        {PERMISSION_TEMPLATES.map((t) => (
          <button key={t.id} type="button" onClick={() => onChange([...t.permissions])} className="px-3 py-1 rounded-lg text-xs border border-[#30363d] text-slate-300 hover:bg-[#21262d]">
            Modelo: {t.label}
          </button>
        ))}
        <button type="button" onClick={() => onChange([])} className="px-3 py-1 rounded-lg text-xs border border-[#30363d] text-slate-500 hover:bg-[#21262d]">Limpar</button>
      </div>
      <div className="grid sm:grid-cols-2 gap-2">
        {PERMISSIONS.map((p) => (
          <label key={p.key} className={`flex gap-3 rounded-xl border p-3 cursor-pointer ${value.includes(p.key) ? 'border-emerald-500/60 bg-emerald-500/5' : 'border-[#30363d]'}`}>
            <input type="checkbox" checked={value.includes(p.key)} onChange={() => toggle(p.key)} className="mt-1 accent-emerald-500" />
            <span>
              <span className="block text-sm font-semibold">{p.label}</span>
              <span className="block text-[11px] text-slate-400">{p.description}</span>
            </span>
          </label>
        ))}
      </div>
      <p className="text-[11px] text-slate-500 mt-2">Gerenciar administradores é exclusivo do master e não pode ser concedido.</p>
    </div>
  );
}

function AdminsTab({ admins, act, me }: { admins: any[]; act: Act; me: number }) {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [perms, setPerms] = useState<string[]>(['overview', 'users_view']);
  const [editing, setEditing] = useState<number | null>(null);
  const [editPerms, setEditPerms] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  const create = async () => {
    setBusy(true);
    const ok = await act({ action: 'create_admin', name: form.name, email: form.email, password: form.password, permissions: perms });
    setBusy(false);
    if (ok) setForm({ name: '', email: '', password: '' });
  };

  return (
    <div className="space-y-8">
      <section className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5">
        <h2 className="font-bold flex items-center gap-2"><UserCog className="w-4 h-4 text-emerald-400" /> Novo administrador</h2>
        <p className="text-xs text-slate-400 mt-1 mb-4">Você escolhe exatamente o que ele vê e pode fazer. Se o e-mail já tem conta no Ritmo, a conta é promovida e a senha dela não muda.</p>
        <div className="grid sm:grid-cols-3 gap-3 mb-4">
          <input className={inputCls} placeholder="Nome" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className={inputCls} placeholder="E-mail" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <input className={inputCls} placeholder="Senha provisória (mín. 8)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete="off" />
        </div>
        <PermissionPicker value={perms} onChange={setPerms} />
        <div className="flex justify-end mt-4">
          <button className={btnPrimary} onClick={create} disabled={busy || !form.email || !form.name}>Criar administrador</button>
        </div>
      </section>

      <section>
        <h2 className="font-bold mb-3">Administradores ({admins.length})</h2>
        <div className="space-y-3">
          {admins.map((a) => (
            <div key={a.id} className="bg-[#161b22] border border-[#30363d] rounded-2xl p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">{a.name} {a.isMaster && <span className="text-[10px] text-amber-300 ml-1">MASTER</span>} {a.suspended && <span className="text-[10px] text-rose-300 ml-1">DESATIVADO</span>}</div>
                  <div className="text-xs text-slate-500">{a.email}</div>
                </div>
                {!a.isMaster && (
                  <div className="flex flex-wrap gap-3 text-sm">
                    <button className="text-emerald-400 hover:underline" onClick={() => { setEditing(editing === a.id ? null : a.id); setEditPerms(a.permissions.filter((p: string) => p !== 'admins_manage')); }}>Permissões</button>
                    {a.suspended ? (
                      <button className="text-emerald-300 hover:underline" onClick={() => act({ action: 'set_user_active', targetUserId: a.id, active: true })}>Reativar</button>
                    ) : (
                      a.id !== me && <button className="text-amber-300 hover:underline" onClick={() => confirm(`Desativar ${a.name}?`) && act({ action: 'set_user_active', targetUserId: a.id, active: false })}>Desativar</button>
                    )}
                    <button className="text-rose-400 hover:underline" onClick={() => confirm(`Remover o perfil de administrador de ${a.name}? A conta continua existindo como usuário comum.`) && act({ action: 'remove_admin', targetUserId: a.id })}>Remover admin</button>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {a.isMaster ? (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300">Todas as permissões + gerenciar administradores</span>
                ) : a.permissions.length === 0 ? (
                  <span className="text-[11px] text-slate-500">Sem nenhuma permissão</span>
                ) : (
                  a.permissions.map((p: string) => <span key={p} className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300">{PERM_LABEL[p] || p}</span>)
                )}
              </div>
              {editing === a.id && (
                <div className="mt-4 border-t border-[#30363d] pt-4">
                  <PermissionPicker value={editPerms} onChange={setEditPerms} />
                  <div className="flex justify-end gap-2 mt-4">
                    <button className={btnGhost} onClick={() => setEditing(null)}>Cancelar</button>
                    <button className={btnPrimary} onClick={async () => (await act({ action: 'set_admin_permissions', targetUserId: a.id, permissions: editPerms })) && setEditing(null)}>Salvar permissões</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Vendas e estornos                                                   */
/* ------------------------------------------------------------------ */

const PAY_LABEL: Record<string, string> = { paid: 'Pago', pending: 'Pendente', failed: 'Falhou', refunded: 'Reembolsado' };

function SalesTab({ finance, payments, act, canRefund }: { finance: any; payments: any[]; act: Act; canRefund: boolean }) {
  const [status, setStatus] = useState('todos');
  const [real, setReal] = useState(true);
  const [refunding, setRefunding] = useState<any>(null);
  const [revoke, setRevoke] = useState(true);
  const rows = payments.filter((p) => (status === 'todos' || p.status === status) && (!real || !p.isSimulated));

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card label="Receita total (reais)" value={brl(finance.revenueTotalCents)} tone="text-emerald-300" />
        <Card label="Últimos 30 dias" value={brl(finance.revenue30dCents)} />
        <Card label="Ticket médio" value={brl(finance.averageTicketCents)} />
        <Card label="Reembolsado" value={brl(finance.refundedCents)} tone="text-rose-300" />
      </div>
      <div className="flex flex-wrap gap-3 items-center">
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm">
          <option value="todos">Todos os status</option>
          {Object.entries(PAY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <label className="text-sm text-slate-300 flex items-center gap-2"><input type="checkbox" checked={real} onChange={(e) => setReal(e.target.checked)} className="accent-emerald-500" /> Esconder vendas de teste (simuladas)</label>
      </div>
      <Table>
        <Thead cols={['Data', 'Cliente', 'Pedido', 'Valor', 'Cupom', 'Status', ...(canRefund ? ['Ações'] : [])]} />
        <tbody>
          {rows.length === 0 && <Empty cols={7} text="Nenhum pagamento encontrado." />}
          {rows.map((p) => (
            <tr key={p.id} className="border-t border-[#30363d]">
              <td className={`${td} text-slate-400`}>{dateTimeBR(p.paidAt || p.createdAt)}</td>
              <td className={td}>{p.userName}<div className="text-[11px] text-slate-500">{p.userEmail}</div></td>
              <td className={`${td} font-mono text-[11px] text-slate-400`}>{p.orderReference}{p.isSimulated && <div className="text-amber-300">simulado</div>}</td>
              <td className={td}>{brl(p.amountCents)}{p.discountCents > 0 && <div className="text-[11px] text-slate-500">desconto {brl(p.discountCents)}</div>}</td>
              <td className={`${td} text-slate-400`}>{p.couponCode || '—'}</td>
              <td className={td}>{PAY_LABEL[p.status] || p.status}</td>
              {canRefund && (
                <td className={td}>
                  {p.status === 'paid' && <button className="text-rose-400 hover:underline" onClick={() => setRefunding(p)}>Estornar</button>}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </Table>

      {refunding && (
        <Modal title="Estornar pedido" onClose={() => setRefunding(null)}>
          <p className="text-sm text-slate-300">{refunding.userName} · {brl(refunding.amountCents)}</p>
          <p className="text-xs text-slate-400 mt-2">O estorno reverte as comissões deste pedido (níveis 1 a 4) e marca o pagamento como reembolsado.</p>
          <p className="text-xs text-amber-300 mt-2">Isto não devolve o dinheiro ao cliente: faça o reembolso também no painel do Mercado Pago.</p>
          <label className="flex items-center gap-2 text-sm mt-4"><input type="checkbox" checked={revoke} onChange={(e) => setRevoke(e.target.checked)} className="accent-emerald-500" /> Encerrar também o acesso desta pessoa</label>
          <div className="flex justify-end gap-2 pt-4">
            <button className={btnGhost} onClick={() => setRefunding(null)}>Cancelar</button>
            <button className="px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-400 text-white font-bold text-sm" onClick={async () => (await act({ action: 'refund_order', orderReference: refunding.orderReference, revokeAccess: revoke })) && setRefunding(null)}>Confirmar estorno</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Cupons                                                              */
/* ------------------------------------------------------------------ */

function CouponsTab({ coupons, act }: { coupons: any[]; act: Act }) {
  const [code, setCode] = useState('');
  const [kind, setKind] = useState<'percent' | 'fixed'>('percent');
  const [amount, setAmount] = useState('');
  const [maxUses, setMaxUses] = useState('100');
  const [expiresAt, setExpiresAt] = useState('');
  const [busy, setBusy] = useState(false);

  const create = async () => {
    setBusy(true);
    const n = Number(amount.replace(',', '.'));
    const ok = await act({
      action: 'create_coupon',
      code,
      discountPercent: kind === 'percent' ? n : 0,
      discountCents: kind === 'fixed' ? Math.round(n * 100) : 0,
      maxUses,
      expiresAt: expiresAt || undefined,
    });
    setBusy(false);
    if (ok) { setCode(''); setAmount(''); setExpiresAt(''); }
  };

  return (
    <div className="space-y-6">
      <section className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5">
        <h2 className="font-bold mb-3">Novo cupom de desconto</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <label className="text-xs text-slate-400">Código<input className={inputCls} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="BEMVINDO10" /></label>
          <label className="text-xs text-slate-400">Tipo
            <select className={inputCls} value={kind} onChange={(e) => setKind(e.target.value as any)}>
              <option value="percent">Porcentagem (%)</option>
              <option value="fixed">Valor fixo (R$)</option>
            </select>
          </label>
          <label className="text-xs text-slate-400">{kind === 'percent' ? 'Desconto (1 a 100)' : 'Desconto em R$'}<input className={inputCls} value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder={kind === 'percent' ? '20' : '10,00'} /></label>
          <label className="text-xs text-slate-400">Limite de usos<input className={inputCls} type="number" min={1} value={maxUses} onChange={(e) => setMaxUses(e.target.value)} /></label>
          <label className="text-xs text-slate-400">Vale até (opcional)<input className={inputCls} type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} /></label>
        </div>
        <div className="flex justify-end mt-4"><button className={btnPrimary} onClick={create} disabled={busy || !code || !amount}>Criar cupom</button></div>
      </section>

      <Table>
        <Thead cols={['Código', 'Desconto', 'Usos', 'Validade', 'Situação', 'Ações']} />
        <tbody>
          {coupons.length === 0 && <Empty cols={6} text="Nenhum cupom criado." />}
          {coupons.map((c) => {
            const off = !c.active || c.isExpired || c.isExhausted;
            return (
              <tr key={c.id} className="border-t border-[#30363d]">
                <td className={`${td} font-mono font-semibold`}>{c.code}</td>
                <td className={td}>{c.discountPercent > 0 ? `${c.discountPercent}%` : brl(c.discountCents)}</td>
                <td className={td}>{c.usedCount || 0} / {c.maxUses}</td>
                <td className={`${td} text-slate-400`}>{c.expiresAt ? dateBR(c.expiresAt + 'T12:00:00') : 'Sem validade'}</td>
                <td className={td}>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${off ? 'bg-slate-500/20 text-slate-300' : 'bg-emerald-500/15 text-emerald-300'}`}>
                    {c.isExpired ? 'Expirado' : c.isExhausted ? 'Esgotado' : c.active ? 'Ativo' : 'Desativado'}
                  </span>
                </td>
                <td className={`${td} space-x-3 whitespace-nowrap`}>
                  <button className="text-amber-300 hover:underline" onClick={() => act({ action: 'toggle_coupon', couponId: c.id, active: !c.active })}>{c.active ? 'Desativar' : 'Ativar'}</button>
                  <button className="text-rose-400 hover:underline" onClick={() => confirm(`Excluir o cupom ${c.code}?`) && act({ action: 'delete_coupon', couponId: c.id })}>Excluir</button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Afiliados e saques                                                  */
/* ------------------------------------------------------------------ */

function AffiliatesTab({ affiliates }: { affiliates: any[] }) {
  return (
    <div>
      <Table>
        <Thead cols={['Afiliado', 'Indicados diretos', 'Rede (níveis 2 a 4)', 'Comissões geradas', 'Estornadas', 'Já sacado', 'Saldo']} />
        <tbody>
          {affiliates.length === 0 && <Empty cols={7} text="Ainda não há afiliados com indicações." />}
          {affiliates.map((a) => (
            <tr key={a.id} className="border-t border-[#30363d]">
              <td className={td}>{a.name}<div className="text-[11px] text-slate-500">{a.email} · {a.referralCode}</div>{a.referredByName && <div className="text-[11px] text-slate-500">veio de {a.referredByName}</div>}</td>
              <td className={td}>{a.directReferrals}</td>
              <td className={td}>{a.networkReferrals}</td>
              <td className={`${td} text-emerald-300`}>{brl(a.generatedCents)}</td>
              <td className={`${td} text-rose-300`}>{brl(a.reversedCents)}</td>
              <td className={td}>{brl(a.withdrawnCents)}</td>
              <td className={`${td} font-semibold`}>{brl(a.balanceCents)}</td>
            </tr>
          ))}
        </tbody>
      </Table>
      <p className="text-[11px] text-slate-500 mt-3">Saldo = comissões geradas (aprovadas ou pagas) − saques já pedidos ou pagos.</p>
    </div>
  );
}

function WithdrawalsTab({ withdrawals, act }: { withdrawals: any[]; act: Act }) {
  const label: Record<string, string> = { pending: 'Pendente', approved: 'Aprovado', paid: 'Pago', rejected: 'Recusado' };

  const process = async (w: any, status: 'approved' | 'paid' | 'rejected') => {
    let receipt: string | undefined;
    let notes: string | undefined;
    if (status === 'paid') receipt = prompt('ID/comprovante do Pix enviado (opcional):') || undefined;
    if (status === 'rejected') {
      notes = prompt('Motivo da recusa:') || undefined;
      if (!notes) return;
    }
    await act({ action: 'process_withdrawal', withdrawalId: w.id, status, notes, receiptReference: receipt });
  };

  return (
    <div>
      <Table>
        <Thead cols={['Solicitado', 'Afiliado', 'Valor', 'Chave Pix', 'Status', 'Ações']} />
        <tbody>
          {withdrawals.length === 0 && <Empty cols={6} text="Nenhuma solicitação de saque." />}
          {withdrawals.map((w) => (
            <tr key={w.id} className="border-t border-[#30363d]">
              <td className={`${td} text-slate-400`}>{dateBR(w.requestedAt)}</td>
              <td className={td}>{w.affiliateName}<div className="text-[11px] text-slate-500">{w.affiliateEmail}</div></td>
              <td className={td}>{brl(w.amountCents)}</td>
              <td className={`${td} font-mono text-xs`}>{w.pixKey}<div className="text-[10px] text-slate-500">{w.pixKeyType}</div></td>
              <td className={td}>{label[w.status] || w.status}</td>
              <td className={`${td} space-x-3 whitespace-nowrap`}>
                {w.status === 'pending' && <button className="text-emerald-400 hover:underline" onClick={() => process(w, 'approved')}>Aprovar</button>}
                {(w.status === 'pending' || w.status === 'approved') && <button className="text-amber-300 hover:underline" onClick={() => process(w, 'paid')}>Marcar como pago</button>}
                {(w.status === 'pending' || w.status === 'approved') && <button className="text-rose-400 hover:underline" onClick={() => process(w, 'rejected')}>Recusar</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
      <p className="text-[11px] text-slate-500 mt-3">O Pix é enviado por você, manualmente, pelo seu banco; aqui você registra o resultado. Nenhum pagamento é feito automaticamente.</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Planilhas e auditoria                                               */
/* ------------------------------------------------------------------ */

const EXPORTS: { kind: string; label: string; description: string; needs: string }[] = [
  { kind: 'users', label: 'Usuários', description: 'Todos os cadastros, situação, acesso, indicação e uso.', needs: 'users_view' },
  { kind: 'signups', label: 'Cadastros por dia', description: 'Novos cadastros dos últimos 30 dias.', needs: 'overview' },
  { kind: 'payments', label: 'Vendas e pagamentos', description: 'Todos os pedidos com valor, cupom, status e se foi simulado.', needs: 'finance' },
  { kind: 'commissions', label: 'Comissões', description: 'Cada comissão gerada: nível, percentual, valor e status.', needs: 'finance' },
  { kind: 'affiliates', label: 'Afiliados', description: 'Ranking com indicados, rede, comissões e saldo.', needs: 'affiliates' },
  { kind: 'withdrawals', label: 'Saques', description: 'Pedidos de saque dos afiliados.', needs: 'withdrawals' },
  { kind: 'coupons', label: 'Cupons', description: 'Cupons, usos, limites e validade.', needs: 'coupons' },
  { kind: 'audit', label: 'Auditoria', description: 'Histórico das ações dos administradores.', needs: 'audit' },
];

function ExportsTab({ can }: { can: (p: string) => boolean }) {
  const items = EXPORTS.filter((e) => can(e.needs));
  return (
    <div>
      <p className="text-sm text-slate-400 mb-4">As planilhas abrem direto no Excel ou no Google Planilhas (formato CSV com ponto e vírgula, em português). Cada download fica registrado na auditoria.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((e) => (
          <a key={e.kind} href={`/api/admin?export=${e.kind}`} download className="block bg-[#161b22] border border-[#30363d] hover:border-emerald-500/60 rounded-2xl p-5">
            <div className="flex items-center gap-2 font-bold"><Download className="w-4 h-4 text-emerald-400" /> {e.label}</div>
            <p className="text-xs text-slate-400 mt-1">{e.description}</p>
          </a>
        ))}
      </div>
    </div>
  );
}

function AuditTab({ audit }: { audit: any[] }) {
  const detail = (d?: string | null) => {
    if (!d) return '';
    try {
      return Object.entries(JSON.parse(d)).filter(([, v]) => v !== undefined && v !== null && v !== '').map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' · ');
    } catch {
      return d;
    }
  };
  return (
    <Table>
      <Thead cols={['Quando', 'Administrador', 'Ação', 'Alvo', 'Detalhes']} />
      <tbody>
        {audit.length === 0 && <Empty cols={5} text="Nenhuma ação registrada ainda." />}
        {audit.map((a) => (
          <tr key={a.id} className="border-t border-[#30363d]">
            <td className={`${td} text-slate-400 whitespace-nowrap`}>{dateTimeBR(a.createdAt)}</td>
            <td className={td}>{a.adminEmail}</td>
            <td className={`${td} font-mono text-xs`}>{a.action}</td>
            <td className={`${td} text-slate-400`}>{[a.targetType, a.targetId].filter(Boolean).join(' #')}</td>
            <td className={`${td} text-xs text-slate-400`}>{detail(a.details)}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
