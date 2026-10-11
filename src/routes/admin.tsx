import { createFileRoute } from '@tanstack/react-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Flame, Users, CreditCard, Ticket, Wallet, LayoutDashboard, Search, X, AlertCircle, CheckCircle2 } from 'lucide-react';

export const Route = createFileRoute('/admin')({
  component: AdminPage,
});

const brl = (cents: number) => (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const dateBR = (v?: string | null) => (v ? new Date(v).toLocaleDateString('pt-BR') : '—');

const STATUS_LABEL: Record<string, string> = {
  trial: 'Em teste',
  active: 'Assinante',
  expired: 'Expirado',
  suspended: 'Suspenso',
  canceled: 'Cancelado',
};

type Tab = 'geral' | 'usuarios' | 'pagamentos' | 'cupons' | 'saques';

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

  const act = async (body: Record<string, unknown>) => {
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
      return false;
    }
    setNotice(json.message || 'Feito.');
    await load();
    return true;
  };

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

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'geral', label: 'Visão geral', icon: LayoutDashboard },
    { id: 'usuarios', label: 'Usuários', icon: Users },
    { id: 'pagamentos', label: 'Pagamentos', icon: CreditCard },
    { id: 'cupons', label: 'Cupons', icon: Ticket },
    { id: 'saques', label: 'Saques de afiliados', icon: Wallet },
  ];

  return (
    <div className="min-h-screen bg-[#0d1117] text-[#f0f6fc]">
      <header className="border-b border-[#30363d] bg-[#161b22]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold">
            <Flame className="w-5 h-5 text-emerald-400" /> Ritmo · Administração
          </div>
          <a href="/app" className="text-sm text-slate-300 hover:text-white">Voltar ao app</a>
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
            <AlertCircle className="w-4 h-4" /> {error}
            <button className="ml-auto" onClick={() => setError('')}><X className="w-4 h-4" /></button>
          </div>
        )}
        {notice && (
          <div className="mb-4 flex items-center gap-2 text-sm text-emerald-300 bg-emerald-950/40 border border-emerald-800/60 rounded-lg p-3">
            <CheckCircle2 className="w-4 h-4" /> {notice}
            <button className="ml-auto" onClick={() => setNotice('')}><X className="w-4 h-4" /></button>
          </div>
        )}

        {tab === 'geral' && <Overview m={data.metrics} />}
        {tab === 'usuarios' && <UsersTab users={data.users} act={act} />}
        {tab === 'pagamentos' && <PaymentsTab payments={data.payments} />}
        {tab === 'cupons' && <CouponsTab coupons={data.coupons} act={act} />}
        {tab === 'saques' && <WithdrawalsTab withdrawals={data.withdrawals} act={act} />}
      </div>
    </div>
  );
}

function Card({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="text-2xl font-extrabold mt-1">{value}</p>
      {hint && <p className="text-[11px] text-slate-500 mt-1">{hint}</p>}
    </div>
  );
}

function Overview({ m }: { m: any }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card label="Usuários cadastrados" value={m.totalUsers} />
        <Card label="Usuários ativos (teste + assinantes)" value={m.activeUsers} />
        <Card label="Assinantes pagos" value={m.paidSubscribers} />
        <Card label="Em período de teste" value={m.trialUsers} />
        <Card label="Receita mensal recorrente (MRR)" value={brl(m.mrrCents)} hint="Assinantes ativos × R$ 39,90" />
        <Card label="Comissões a pagar" value={brl(m.pendingCommissionsCents)} hint="Saques pendentes ou aprovados" />
        <Card label="Comissões já pagas" value={brl(m.totalCommissionsPaidCents)} />
      </div>
      <p className="text-xs text-slate-500">
        O MRR é estimado pelo número de assinantes ativos; cupons e cobranças reais ficam na aba Pagamentos.
      </p>
    </div>
  );
}

function UsersTab({ users, act }: { users: any[]; act: (b: Record<string, unknown>) => Promise<boolean> }) {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('todos');
  const [editing, setEditing] = useState<any>(null);

  const filtered = useMemo(
    () =>
      users.filter((u) => {
        const text = `${u.name} ${u.email}`.toLowerCase();
        return (!q || text.includes(q.toLowerCase())) && (status === 'todos' || u.subscriptionStatus === status);
      }),
    [users, q, status]
  );

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar nome ou e-mail"
            className="bg-[#0d1117] border border-[#30363d] rounded-lg pl-9 pr-3 py-2 text-sm w-64"
          />
        </div>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm">
          <option value="todos">Todos os status</option>
          {Object.entries(STATUS_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
      </div>
      <div className="overflow-x-auto border border-[#30363d] rounded-2xl">
        <table className="w-full text-sm">
          <thead className="bg-[#161b22] text-slate-400 text-left">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">E-mail</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Teste</th>
              <th className="px-4 py-3">Papel</th>
              <th className="px-4 py-3">Cadastro</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">Nenhum usuário encontrado.</td></tr>
            )}
            {filtered.map((u) => (
              <tr key={u.id} className="border-t border-[#30363d]">
                <td className="px-4 py-3">{u.name}</td>
                <td className="px-4 py-3 text-slate-300">{u.email}</td>
                <td className="px-4 py-3">{STATUS_LABEL[u.subscriptionStatus] || u.subscriptionStatus}</td>
                <td className="px-4 py-3">{u.subscriptionStatus === 'trial' ? `${u.trialDaysRemaining} d` : '—'}</td>
                <td className="px-4 py-3">{u.role === 'admin' ? 'Admin' : 'Usuário'}</td>
                <td className="px-4 py-3 text-slate-400">{dateBR(u.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setEditing(u)} className="text-emerald-400 hover:underline">Editar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editing && <EditUserModal user={editing} onClose={() => setEditing(null)} act={act} />}
    </div>
  );
}

function EditUserModal({ user, onClose, act }: { user: any; onClose: () => void; act: (b: Record<string, unknown>) => Promise<boolean> }) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState(user.role);
  const [status, setStatus] = useState(user.subscriptionStatus);
  const [extend, setExtend] = useState('');
  const [password, setPassword] = useState('');

  const save = async () => {
    const ok = await act({
      action: 'update_user',
      targetUserId: user.id,
      name,
      email,
      role,
      subscriptionStatus: status,
      extendTrialDays: extend ? Number(extend) : undefined,
      manualPassword: password || undefined,
    });
    if (ok) onClose();
  };

  const field = 'w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm';
  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-md p-6 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold">Editar usuário</h3>
          <button onClick={onClose} aria-label="Fechar"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-3">
          <label className="block text-xs text-slate-400">Nome<input className={field} value={name} onChange={(e) => setName(e.target.value)} /></label>
          <label className="block text-xs text-slate-400">E-mail<input className={field} value={email} onChange={(e) => setEmail(e.target.value)} /></label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-xs text-slate-400">Status da conta
              <select className={field} value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="trial">Em teste</option>
                <option value="active">Assinante</option>
                <option value="expired">Expirado</option>
                <option value="suspended">Suspenso</option>
              </select>
            </label>
            <label className="block text-xs text-slate-400">Papel
              <select className={field} value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="user">Usuário</option>
                <option value="admin">Administrador</option>
              </select>
            </label>
          </div>
          <label className="block text-xs text-slate-400">Estender teste (dias)
            <input className={field} type="number" min={1} placeholder="Ex.: 7" value={extend} onChange={(e) => setExtend(e.target.value)} />
          </label>
          <label className="block text-xs text-slate-400">Definir nova senha (opcional, mín. 6)
            <input className={field} type="text" placeholder="Deixe em branco para não alterar" value={password} onChange={(e) => setPassword(e.target.value)} />
          </label>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={onClose} className="px-4 py-2 rounded-lg bg-[#21262d] text-sm">Cancelar</button>
          <button onClick={save} className="px-4 py-2 rounded-lg bg-emerald-500 text-slate-950 font-bold text-sm">Salvar</button>
        </div>
      </div>
    </div>
  );
}

function PaymentsTab({ payments }: { payments: any[] }) {
  const paid = payments.filter((p) => p.status === 'paid');
  const total = paid.reduce((a, p) => a + p.amountCents, 0);
  return (
    <div>
      <div className="grid grid-cols-2 gap-4 mb-4 max-w-md">
        <Card label="Pagamentos confirmados" value={paid.length} />
        <Card label="Total recebido" value={brl(total)} />
      </div>
      <div className="overflow-x-auto border border-[#30363d] rounded-2xl">
        <table className="w-full text-sm">
          <thead className="bg-[#161b22] text-slate-400 text-left">
            <tr>
              <th className="px-4 py-3">Data</th><th className="px-4 py-3">Cliente</th><th className="px-4 py-3">Pedido</th>
              <th className="px-4 py-3">Forma</th><th className="px-4 py-3">Cupom</th><th className="px-4 py-3">Valor</th><th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-500">Nenhum pagamento ainda.</td></tr>}
            {payments.map((p) => (
              <tr key={p.id} className="border-t border-[#30363d]">
                <td className="px-4 py-3 text-slate-400">{dateBR(p.paidAt || p.createdAt)}</td>
                <td className="px-4 py-3">{p.userName}<div className="text-[11px] text-slate-500">{p.userEmail}</div></td>
                <td className="px-4 py-3 font-mono text-xs">{p.orderReference}</td>
                <td className="px-4 py-3">{p.paymentMethod === 'pix' ? 'Pix' : 'Cartão'}{p.isSimulated ? ' (demo)' : ''}</td>
                <td className="px-4 py-3">{p.couponCode || '—'}</td>
                <td className="px-4 py-3">{brl(p.amountCents)}</td>
                <td className="px-4 py-3">{p.status === 'paid' ? 'Pago' : p.status === 'pending' ? 'Pendente' : p.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CouponsTab({ coupons, act }: { coupons: any[]; act: (b: Record<string, unknown>) => Promise<boolean> }) {
  const [code, setCode] = useState('');
  const [percent, setPercent] = useState('');
  const [fixed, setFixed] = useState('');
  const [maxUses, setMaxUses] = useState('100');
  const [expiresAt, setExpiresAt] = useState('');

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await act({
      action: 'create_coupon',
      code: code.trim().toUpperCase(),
      discountPercent: percent ? Number(percent) : 0,
      discountCents: fixed ? Math.round(Number(fixed.replace(',', '.')) * 100) : 0,
      maxUses: Number(maxUses) || 100,
      expiresAt: expiresAt || undefined,
    });
    if (ok) { setCode(''); setPercent(''); setFixed(''); setExpiresAt(''); }
  };

  const field = 'bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm';
  return (
    <div className="space-y-6">
      <form onSubmit={create} className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5 grid sm:grid-cols-6 gap-3 items-end">
        <label className="text-xs text-slate-400 sm:col-span-2">Código<input required className={`${field} w-full uppercase`} value={code} onChange={(e) => setCode(e.target.value)} placeholder="BEMVINDO20" /></label>
        <label className="text-xs text-slate-400">Desconto %<input className={`${field} w-full`} type="number" min={0} max={100} value={percent} onChange={(e) => setPercent(e.target.value)} placeholder="20" /></label>
        <label className="text-xs text-slate-400">ou R$ fixo<input className={`${field} w-full`} value={fixed} onChange={(e) => setFixed(e.target.value)} placeholder="10,00" /></label>
        <label className="text-xs text-slate-400">Limite de usos<input className={`${field} w-full`} type="number" min={1} value={maxUses} onChange={(e) => setMaxUses(e.target.value)} /></label>
        <label className="text-xs text-slate-400">Validade<input className={`${field} w-full`} type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} /></label>
        <button className="sm:col-span-6 sm:justify-self-start px-5 py-2 rounded-lg bg-emerald-500 text-slate-950 font-bold text-sm">Criar cupom</button>
      </form>

      <div className="overflow-x-auto border border-[#30363d] rounded-2xl">
        <table className="w-full text-sm">
          <thead className="bg-[#161b22] text-slate-400 text-left">
            <tr><th className="px-4 py-3">Código</th><th className="px-4 py-3">Desconto</th><th className="px-4 py-3">Usos</th><th className="px-4 py-3">Validade</th><th className="px-4 py-3">Status</th><th className="px-4 py-3" /></tr>
          </thead>
          <tbody>
            {coupons.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Nenhum cupom criado.</td></tr>}
            {coupons.map((c) => (
              <tr key={c.id} className="border-t border-[#30363d]">
                <td className="px-4 py-3 font-mono">{c.code}</td>
                <td className="px-4 py-3">{c.discountPercent ? `${c.discountPercent}%` : brl(c.discountCents || 0)}</td>
                <td className="px-4 py-3">{c.usedCount}/{c.maxUses}</td>
                <td className="px-4 py-3 text-slate-400">{c.expiresAt || '—'}</td>
                <td className="px-4 py-3">{c.active ? 'Ativo' : 'Desativado'}</td>
                <td className="px-4 py-3 text-right space-x-3">
                  <button className="text-emerald-400 hover:underline" onClick={() => act({ action: 'toggle_coupon', couponId: c.id, active: !c.active })}>
                    {c.active ? 'Desativar' : 'Ativar'}
                  </button>
                  <button
                    className="text-rose-400 hover:underline"
                    onClick={() => { if (confirm(`Excluir o cupom ${c.code}?`)) act({ action: 'delete_coupon', couponId: c.id }); }}
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function WithdrawalsTab({ withdrawals, act }: { withdrawals: any[]; act: (b: Record<string, unknown>) => Promise<boolean> }) {
  const label: Record<string, string> = { pending: 'Pendente', approved: 'Aprovado', paid: 'Pago', rejected: 'Rejeitado' };

  const process = async (w: any, status: 'approved' | 'paid' | 'rejected') => {
    let receipt: string | undefined;
    let notes: string | undefined;
    if (status === 'paid') {
      receipt = prompt('ID/comprovante do Pix enviado (opcional):') || undefined;
    }
    if (status === 'rejected') {
      notes = prompt('Motivo da rejeição:') || undefined;
      if (!notes) return;
    }
    await act({ action: 'process_withdrawal', withdrawalId: w.id, status, notes, receiptReference: receipt });
  };

  return (
    <div className="overflow-x-auto border border-[#30363d] rounded-2xl">
      <table className="w-full text-sm">
        <thead className="bg-[#161b22] text-slate-400 text-left">
          <tr><th className="px-4 py-3">Solicitado</th><th className="px-4 py-3">Afiliado</th><th className="px-4 py-3">Valor</th><th className="px-4 py-3">Chave Pix</th><th className="px-4 py-3">Status</th><th className="px-4 py-3" /></tr>
        </thead>
        <tbody>
          {withdrawals.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-500">Nenhuma solicitação de saque.</td></tr>}
          {withdrawals.map((w) => (
            <tr key={w.id} className="border-t border-[#30363d]">
              <td className="px-4 py-3 text-slate-400">{dateBR(w.requestedAt)}</td>
              <td className="px-4 py-3">{w.affiliateName}<div className="text-[11px] text-slate-500">{w.affiliateEmail}</div></td>
              <td className="px-4 py-3">{brl(w.amountCents)}</td>
              <td className="px-4 py-3 font-mono text-xs">{w.pixKey}<div className="text-[10px] text-slate-500">{w.pixKeyType}</div></td>
              <td className="px-4 py-3">{label[w.status] || w.status}</td>
              <td className="px-4 py-3 text-right space-x-3 whitespace-nowrap">
                {w.status === 'pending' && <button className="text-emerald-400 hover:underline" onClick={() => process(w, 'approved')}>Aprovar</button>}
                {(w.status === 'pending' || w.status === 'approved') && <button className="text-amber-300 hover:underline" onClick={() => process(w, 'paid')}>Marcar como pago</button>}
                {(w.status === 'pending' || w.status === 'approved') && <button className="text-rose-400 hover:underline" onClick={() => process(w, 'rejected')}>Rejeitar</button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-[11px] text-slate-500 px-4 py-3 border-t border-[#30363d]">
        O Pix é enviado por você, manualmente, pelo seu banco; aqui você registra o resultado. Nenhum pagamento é feito automaticamente.
      </p>
    </div>
  );
}
