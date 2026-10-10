import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Key,
} from 'lucide-react';

interface TabSheetsProps {
  onExportCSV: () => void;
}

export const TabSheets: React.FC<TabSheetsProps> = ({ onExportCSV }) => {
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [spreadsheetName, setSpreadsheetName] = useState('Ritmo - Minhas Finanças');
  const [autoSync, setAutoSync] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ success: boolean; message: string } | null>(null);

  const handleManualSync = async () => {
    setIsSyncing(true);
    setSyncStatus(null);
    try {
      const res = await fetch('/api/integrations?action=sync_sheets', {
        method: 'POST',
      });
      const data = await res.json();
      setSyncStatus({
        success: data.success,
        message: data.message || (data.success ? 'Sincronização concluída!' : 'Falha na sincronização.'),
      });
    } catch {
      setSyncStatus({
        success: false,
        message: 'Erro de rede ao comunicar com o servidor de sincronização.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveConfig = async () => {
    try {
      await fetch('/api/integrations?action=update_config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sheetsSpreadsheetId: spreadsheetId,
          sheetsSpreadsheetName: spreadsheetName,
          sheetsAutoSync: autoSync,
          sheetsStatus: spreadsheetId ? 'configured' : 'disconnected',
        }),
      });
      setSyncStatus({ success: true, message: 'Configurações de planilha salvas com sucesso.' });
    } catch {
      setSyncStatus({ success: false, message: 'Erro ao salvar configurações.' });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-[#161b22] border border-[#30363d] p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-800/40 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Integração com Planilha (Google Sheets)
          </div>
          <h2 className="text-xl font-extrabold text-[#f0f6fc]">
            Sincronização Automática & Exportação
          </h2>
          <p className="text-xs sm:text-sm text-[#8b949e] mt-1 max-w-2xl">
            Cada lançamento confirmado é gravado primeiro no banco de dados seguro do Ritmo e, opcionalmente, espelhado na sua planilha do Google Sheets.
          </p>
        </div>

        <button
          onClick={onExportCSV}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2 shadow-md transition-all shrink-0"
        >
          <Download className="w-4 h-4" />
          Baixar CSV Direto
        </button>
      </div>

      {/* Sync Status Banner */}
      {syncStatus && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-2.5 text-xs ${
            syncStatus.success
              ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
              : 'bg-amber-950/30 border-amber-800/40 text-amber-300'
          }`}
        >
          {syncStatus.success ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{syncStatus.message}</span>
        </div>
      )}

      {/* Configuration Form */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 space-y-5">
        <h3 className="text-sm font-bold text-[#f0f6fc]">Configuração da Planilha do Google</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#8b949e] mb-1">
              ID da Planilha Google (Spreadsheet ID)
            </label>
            <input
              type="text"
              placeholder="Ex: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
              value={spreadsheetId}
              onChange={(e) => setSpreadsheetId(e.target.value)}
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-[#f0f6fc] font-mono focus:outline-none focus:border-emerald-500"
            />
            <p className="text-[10px] text-[#6e7681] mt-1">
              O código alfanumérico que fica entre "/d/" e "/edit" na URL da sua planilha.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#8b949e] mb-1">
              Nome da Aba / Página
            </label>
            <input
              type="text"
              value={spreadsheetName}
              onChange={(e) => setSpreadsheetName(e.target.value)}
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-xs text-[#f0f6fc] focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="chk-auto-sync"
            checked={autoSync}
            onChange={(e) => setAutoSync(e.target.checked)}
            className="rounded border-[#30363d] bg-[#0d1117] text-emerald-500 focus:ring-0"
          />
          <label htmlFor="chk-auto-sync" className="text-xs text-[#8b949e] cursor-pointer">
            Sincronizar lançamentos automaticamente quando forem confirmados
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#30363d]">
          <button
            type="button"
            onClick={handleManualSync}
            disabled={isSyncing}
            className="px-4 py-2 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-xs font-medium text-[#f0f6fc] flex items-center gap-2 transition-colors disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Sincronizando...' : 'Testar Sincronização Agora'}
          </button>

          <button
            type="button"
            onClick={handleSaveConfig}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition-colors"
          >
            Salvar Configurações
          </button>
        </div>
      </div>

      {/* Google Sheets Schema Documentation */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 space-y-4">
        <h4 className="text-xs font-bold text-[#f0f6fc] uppercase tracking-wider">
          Estrutura Padronizada das Colunas
        </h4>
        <p className="text-xs text-[#8b949e]">
          Sua planilha deve conter as seguintes colunas na primeira linha (cabeçalho) para espelhar com integridade idempotente:
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs font-mono">
          {[
            'ID',
            'Data',
            'Tipo',
            'Descrição',
            'Categoria',
            'Valor',
            'Conta',
            'FormaPagamento',
            'Status',
            'Observações',
          ].map((col) => (
            <div key={col} className="p-2 rounded-lg bg-[#0d1117] border border-[#30363d] text-emerald-400">
              {col}
            </div>
          ))}
        </div>

        <div className="p-4 rounded-xl bg-[#0d1117] border border-[#30363d] space-y-2 text-xs text-[#8b949e]">
          <div className="font-semibold text-[#f0f6fc] flex items-center gap-1.5">
            <Key className="w-4 h-4 text-emerald-400" />
            Configuração de Credenciais Externas:
          </div>
          <p>
            Para habilitar a escrita em segundo plano pelo servidor, adicione a variável de ambiente <code className="text-[#f0f6fc]">GOOGLE_SERVICE_ACCOUNT_KEY</code> com o JSON da Conta de Serviço do Google Cloud e compartilhe a planilha com o e-mail da conta de serviço com permissão de Editor.
          </p>
        </div>
      </div>
    </div>
  );
};
