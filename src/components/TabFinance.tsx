import React, { useState } from 'react';
import {
  FinanceTransactionItem,
  FinanceCategory,
  PaymentMethod,
  TransactionType,
  TransactionStatus,
} from '../lib/types.js';
import {
  Plus,
  Download,
  Wallet,
  AlertCircle,
  Search,
  Trash2,
  Info,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';

interface TabFinanceProps {
  transactions: FinanceTransactionItem[];
  onAddTransaction: (tx: Partial<FinanceTransactionItem>) => Promise<void>;
  onDeleteTransaction: (id: number) => Promise<void>;
}

const CATEGORIES: { id: FinanceCategory; label: string }[] = [
  { id: 'alimentacao', label: 'Alimentação' },
  { id: 'moradia', label: 'Moradia / Contas' },
  { id: 'transporte', label: 'Transporte' },
  { id: 'saude', label: 'Saúde' },
  { id: 'educacao', label: 'Educação / Livros' },
  { id: 'lazer', label: 'Lazer & Cultura' },
  { id: 'trabalho', label: 'Trabalho / Negócios' },
  { id: 'renda', label: 'Salário / Renda' },
  { id: 'servicos', label: 'Serviços & Assinaturas' },
  { id: 'outros', label: 'Outros' },
];

const PAYMENT_METHODS: { id: PaymentMethod; label: string }[] = [
  { id: 'pix', label: 'PIX' },
  { id: 'cartao_credito', label: 'Cartão de Crédito' },
  { id: 'cartao_debito', label: 'Cartão de Débito' },
  { id: 'dinheiro', label: 'Dinheiro em Espécie' },
  { id: 'boleto', label: 'Boleto Bancário' },
  { id: 'transferencia', label: 'Transferência / TED' },
];

export const TabFinance: React.FC<TabFinanceProps> = ({
  transactions,
  onAddTransaction,
  onDeleteTransaction,
}) => {
  const currentMonth = new Date().toISOString().substring(0, 7);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  const [categoryFilter, setCategoryFilter] = useState<string>('todas');
  const [typeFilter, setTypeFilter] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [type, setType] = useState<TransactionType>('expense');
  const [description, setDescription] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<FinanceCategory>('alimentacao');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [accountWallet, setAccountWallet] = useState('Conta Principal');
  const [isRecurring, setIsRecurring] = useState(false);
  const [isInstallment, setIsInstallment] = useState(false);
  const [totalInstallments, setTotalInstallments] = useState(1);
  const [status, setStatus] = useState<TransactionStatus>('paid');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Financial calculations for the selected month
  const monthTransactions = transactions.filter((t) => t.date.startsWith(selectedMonth));

  const totalIncome = monthTransactions
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amountCents, 0);

  const totalExpense = monthTransactions
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amountCents, 0);

  const netBalance = totalIncome - totalExpense;

  // Overdue / pending bills
  const todayStr = new Date().toISOString().split('T')[0];
  const pendingBills = transactions.filter(
    (t) => t.status === 'pending' || (t.dueDate && t.dueDate >= todayStr && t.status !== 'paid')
  );
  const overdueBills = transactions.filter(
    (t) => t.status === 'pending' && t.dueDate && t.dueDate < todayStr
  );

  // Filtered list
  const filteredTransactions = transactions.filter((t) => {
    if (selectedMonth && !t.date.startsWith(selectedMonth)) return false;
    if (categoryFilter !== 'todas' && t.category !== categoryFilter) return false;
    if (typeFilter !== 'todos' && t.type !== typeFilter) return false;
    if (searchTerm && !t.description.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !amountInput) return;
    setLoading(true);

    try {
      // Parse amount in Brazilian Real: 42,50 or 42.50 or 1200
      let cleanAmount = amountInput.replace('R$', '').trim();
      let amountCents = 0;

      if (cleanAmount.includes(',')) {
        const parts = cleanAmount.replace(/\./g, '').split(',');
        const whole = parseInt(parts[0], 10) || 0;
        const dec = (parts[1] + '0').slice(0, 2);
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
        dueDate: dueDate || undefined,
        notes,
        source: 'web',
      });

      setDescription('');
      setAmountInput('');
      setNotes('');
      setIsModalOpen(false);
    } finally {
      setLoading(false);
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    window.open(`/api/finance?monthYear=${selectedMonth}&format=csv`, '_blank');
  };

  // Export to JSON
  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredTransactions, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `ritmo-financas-${selectedMonth}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Header with Disclaimer Notice */}
      <div className="p-4 rounded-2xl bg-[#161b22] border border-[#30363d] flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-[#8b949e]">
          <p className="font-semibold text-[#f0f6fc]">
            Organização Financeira Consciente
          </p>
          <p>
            O módulo financeiro do Ritmo é uma ferramenta de gestão e clareza pessoal de entradas e saídas. Não oferecemos recomendações de crédito, investimentos ou consultoria financeira profissional.
          </p>
        </div>
      </div>

      {/* 2. Top Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Receitas */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs text-[#8b949e] mb-1">
            <span className="font-semibold uppercase tracking-wider">Receitas do Mês</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 flex items-center justify-center">
              <ArrowDownLeft className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black text-[#f0f6fc]">
            {(totalIncome / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
          <span className="text-[11px] text-[#6e7681] block mt-1">
            {monthTransactions.filter((t) => t.type === 'income').length} lançamento(s)
          </span>
        </div>

        {/* Despesas */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs text-[#8b949e] mb-1">
            <span className="font-semibold uppercase tracking-wider">Despesas do Mês</span>
            <div className="w-7 h-7 rounded-lg bg-rose-950/60 border border-rose-800/40 text-rose-400 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black text-[#f0f6fc]">
            {(totalExpense / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
          <span className="text-[11px] text-[#6e7681] block mt-1">
            {monthTransactions.filter((t) => t.type === 'expense').length} lançamento(s)
          </span>
        </div>

        {/* Saldo Líquido */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5">
          <div className="flex items-center justify-between text-xs text-[#8b949e] mb-1">
            <span className="font-semibold uppercase tracking-wider">Saldo Líquido</span>
            <div className="w-7 h-7 rounded-lg bg-amber-950/60 border border-amber-800/40 text-amber-400 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <span
            className={`text-2xl font-black ${
              netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {(netBalance / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
          <span className="text-[11px] text-[#6e7681] block mt-1">
            {netBalance >= 0 ? 'Superávit no período' : 'Atenção aos limites de gastos'}
          </span>
        </div>
      </div>

      {/* Overdue Alert banner if any */}
      {overdueBills.length > 0 && (
        <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-800/40 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>
            Você tem <strong>{overdueBills.length} conta(s) com vencimento atrasado</strong> que precisa de atenção.
          </span>
        </div>
      )}

      {/* Pending bills notification */}
      {pendingBills.length > 0 && (
        <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>
            Você tem <strong>{pendingBills.length} conta(s) pendente(s) ou a pagar</strong> este mês.
          </span>
        </div>
      )}

      {/* 3. Controls Bar: Month, Filters, Search, Export & New */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-[#161b22] border border-[#30363d] p-4 rounded-2xl">
        <div className="flex flex-wrap items-center gap-3">
          {/* Month selector */}
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-[#0d1117] border border-[#30363d] rounded-xl px-3 py-2 text-xs font-semibold text-[#f0f6fc] focus:outline-none"
          />

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-[#0d1117] border border-[#30363d] rounded-xl px-3 py-2 text-xs text-[#f0f6fc] focus:outline-none"
          >
            <option value="todos">Todos os Tipos</option>
            <option value="expense">Despesas</option>
            <option value="income">Receitas</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#0d1117] border border-[#30363d] rounded-xl px-3 py-2 text-xs text-[#f0f6fc] focus:outline-none"
          >
            <option value="todas">Todas Categorias</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>

          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#6e7681] absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[#0d1117] border border-[#30363d] rounded-xl pl-8 pr-3 py-2 text-xs text-[#f0f6fc] focus:outline-none focus:border-emerald-500 w-44"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportCSV}
            title="Exportar lançamentos para CSV"
            className="px-3 py-2 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-xs font-medium text-[#8b949e] hover:text-[#f0f6fc] flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            CSV
          </button>
          <button
            onClick={handleExportJSON}
            title="Exportar lançamentos para JSON"
            className="px-3 py-2 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-xs font-medium text-[#8b949e] hover:text-[#f0f6fc] flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            JSON
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            Novo Lançamento
          </button>
        </div>
      </div>

      {/* 4. Transactions List */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#30363d] bg-[#0d1117] text-xs font-semibold text-[#8b949e]">
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4">Descrição</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Conta / Método</th>
                <th className="py-3 px-4">Status / Vencimento</th>
                <th className="py-3 px-4 text-right">Valor</th>
                <th className="py-3 px-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#30363d]">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-[#6e7681]">
                    Nenhum lançamento encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[#1c2128]/50 transition-colors">
                    <td className="py-3.5 px-4 text-xs font-mono text-[#8b949e] whitespace-nowrap">
                      {tx.date}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-xs text-[#f0f6fc]">
                        {tx.description}
                      </div>
                      {tx.notes && (
                        <div className="text-[11px] text-[#8b949e] truncate max-w-xs">
                          {tx.notes}
                        </div>
                      )}
                      {tx.isInstallment && (
                        <span className="text-[10px] text-amber-400 font-medium">
                          Parcela {tx.currentInstallment}/{tx.totalInstallments}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-xs text-[#8b949e] whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-[#21262d] text-[#c9d1d9] text-[11px]">
                        {CATEGORIES.find((c) => c.id === tx.category)?.label || tx.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-xs text-[#8b949e] whitespace-nowrap">
                      <div>{tx.accountWallet}</div>
                      <div className="text-[10px] text-[#6e7681] uppercase">{tx.paymentMethod}</div>
                    </td>

                    <td className="py-3.5 px-4 text-xs whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          tx.status === 'paid' || tx.status === 'received'
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                            : tx.dueDate && tx.dueDate < todayStr
                            ? 'bg-rose-950/60 text-rose-400 border border-rose-800/40'
                            : 'bg-amber-950/60 text-amber-400 border border-amber-800/40'
                        }`}
                      >
                        {tx.status === 'paid'
                          ? 'Pago'
                          : tx.status === 'received'
                          ? 'Recebido'
                          : tx.dueDate && tx.dueDate < todayStr
                          ? 'Atrasado'
                          : 'Pendente'}
                      </span>
                      {tx.dueDate && (
                        <div className="text-[10px] text-[#6e7681] mt-0.5">Venc: {tx.dueDate}</div>
                      )}
                    </td>

                    <td
                      className={`py-3.5 px-4 text-right text-xs font-mono font-bold whitespace-nowrap ${
                        tx.type === 'income' ? 'text-emerald-400' : 'text-[#f0f6fc]'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : '-'}
                      {(tx.amountCents / 100).toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </td>

                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => onDeleteTransaction(tx.id)}
                        className="p-1 rounded text-[#6e7681] hover:text-rose-400 transition-colors"
                        title="Excluir lançamento"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Modal Criar Lançamento */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[#8b949e] hover:text-[#f0f6fc]"
            >
              ×
            </button>

            <h3 className="text-base font-bold text-[#f0f6fc] mb-4">Novo Lançamento Financeiro</h3>

            <form onSubmit={handleCreateTransaction} className="space-y-4">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-[#0d1117] rounded-xl border border-[#30363d]">
                <button
                  type="button"
                  onClick={() => setType('expense')}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${
                    type === 'expense'
                      ? 'bg-rose-600 text-white shadow-md'
                      : 'text-[#8b949e] hover:text-[#f0f6fc]'
                  }`}
                >
                  Despesa (-)
                </button>
                <button
                  type="button"
                  onClick={() => setType('income')}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${
                    type === 'income'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-[#8b949e] hover:text-[#f0f6fc]'
                  }`}
                >
                  Receita (+)
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8b949e] mb-1">
                  Descrição *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Mercado semanal, Internet, Salário..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-[#f0f6fc] focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#8b949e] mb-1">
                    Valor (R$) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 120,50 ou 800"
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-[#f0f6fc] font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#8b949e] mb-1">Data</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-[#f0f6fc] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#8b949e] mb-1">
                    Categoria
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as FinanceCategory)}
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-[#f0f6fc]"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#8b949e] mb-1">
                    Forma de Pagamento
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-[#f0f6fc]"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#8b949e] mb-1">
                    Conta / Carteira
                  </label>
                  <input
                    type="text"
                    value={accountWallet}
                    onChange={(e) => setAccountWallet(e.target.value)}
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-[#f0f6fc]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#8b949e] mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TransactionStatus)}
                    className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-[#f0f6fc]"
                  >
                    <option value="paid">Pago</option>
                    <option value="pending">Pendente / A Pagar</option>
                    <option value="received">Recebido</option>
                  </select>
                </div>
              </div>

              {/* Installments & Recurring options */}
              <div className="flex flex-wrap items-center gap-4 pt-1">
                <label className="flex items-center gap-1.5 text-xs text-[#8b949e] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="rounded border-[#30363d] bg-[#0d1117] text-emerald-500 focus:ring-0"
                  />
                  <span>Recorrente</span>
                </label>

                <label className="flex items-center gap-1.5 text-xs text-[#8b949e] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isInstallment}
                    onChange={(e) => setIsInstallment(e.target.checked)}
                    className="rounded border-[#30363d] bg-[#0d1117] text-emerald-500 focus:ring-0"
                  />
                  <span>Compra Parcelada</span>
                </label>

                {isInstallment && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#8b949e]">Total parcelas:</span>
                    <input
                      type="number"
                      min="2"
                      max="48"
                      value={totalInstallments}
                      onChange={(e) => setTotalInstallments(Number(e.target.value))}
                      className="w-16 bg-[#0d1117] border border-[#30363d] rounded-lg px-2 py-1 text-xs text-[#f0f6fc]"
                    />
                  </div>
                )}

                {status === 'pending' && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#8b949e]">Vencimento:</span>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="bg-[#0d1117] border border-[#30363d] rounded-lg px-2 py-1 text-xs text-[#f0f6fc]"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#8b949e] mb-1">
                  Observações (opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalhes adicionais..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-[#f0f6fc] focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[#30363d]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-[#8b949e] hover:text-[#f0f6fc]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/20"
                >
                  {loading ? 'Salvando...' : 'Salvar Lançamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
