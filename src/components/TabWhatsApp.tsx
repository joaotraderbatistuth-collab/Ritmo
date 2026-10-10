import React, { useState } from 'react';
import {
  Smartphone,
  Send,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

interface TabWhatsAppProps {
  userPhone?: string;
  onRefreshFinance: () => void;
}

const EXAMPLE_MESSAGES = [
  'Gastei 42,50 no almoço.',
  'Paguei R$ 120 de internet hoje.',
  'Recebi 800 reais de um trabalho.',
  'Comprei mercado por 235,70 no cartão.',
  'Paguei 60 de transporte ontem.',
  'quanto gastei este mês?',
  'quais contas vencem esta semana?',
  'Almoço no restaurante', // Ambiguous (missing amount)
];

export const TabWhatsApp: React.FC<TabWhatsAppProps> = ({ userPhone, onRefreshFinance }) => {
  const [inputMessage, setInputMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<
    { sender: 'user' | 'bot'; text: string; details?: any; time: string }[]
  >([
    {
      sender: 'bot',
      text: '👋 Olá! Sou o assistente financeiro do Ritmo via WhatsApp Oficial.\n\nEnvie uma mensagem em linguagem natural, por exemplo:\n• "Gastei 42,50 no almoço."\n• "Recebi 800 reais de freela."\n• "quanto gastei este mês?"',
      time: 'Agora',
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [phoneInput, setPhoneInput] = useState(userPhone || '5511999998888');
  const [savePhoneStatus, setSavePhoneStatus] = useState<string | null>(null);

  const handleSendMessage = async (msgToSend?: string) => {
    const text = (msgToSend || inputMessage).trim();
    if (!text) return;

    const timeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    setChatHistory((prev) => [...prev, { sender: 'user', text, time: timeStr }]);
    setInputMessage('');
    setLoading(true);

    try {
      const res = await fetch('/api/integrations?action=simulate_whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      const data = await res.json();
      const botReply = data.parsed?.replyMessage || 'Mensagem processada.';

      setChatHistory((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: botReply,
          details: data.transaction || null,
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);

      if (data.transaction) {
        onRefreshFinance();
      }
    } catch {
      setChatHistory((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: 'Erro de comunicação ao processar lançamento.',
          time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePhone = async () => {
    setSavePhoneStatus('Salvando...');
    try {
      const res = await fetch('/api/integrations?action=update_config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ whatsappPhone: phoneInput, whatsappStatus: 'connected' }),
      });
      if (res.ok) {
        setSavePhoneStatus('Telefone vinculado com sucesso!');
        setTimeout(() => setSavePhoneStatus(null), 3000);
      }
    } catch {
      setSavePhoneStatus('Erro ao salvar.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Header Info */}
      <div className="bg-[#161b22] border border-[#30363d] p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-800/40 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <Smartphone className="w-3.5 h-3.5" />
            WhatsApp Business Cloud API Oficial
          </div>
          <h2 className="text-xl font-extrabold text-[#f0f6fc]">
            Lançamentos Financeiros por WhatsApp
          </h2>
          <p className="text-xs sm:text-sm text-[#8b949e] mt-1 max-w-2xl">
            Registre despesas, receitas e consulte saldos enviando mensagens naturais pelo WhatsApp. Integrado de forma oficial, segura e sem armazenamento de dados bancários desnecessários.
          </p>
        </div>

        {/* Phone binding box */}
        <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-3.5 min-w-[280px]">
          <span className="text-[11px] font-semibold text-[#8b949e] block mb-1">
            Seu Número de WhatsApp Autorizado
          </span>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="+55 11 99999-9999"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              className="w-full bg-[#161b22] border border-[#30363d] rounded-lg px-2.5 py-1.5 text-xs text-[#f0f6fc] font-mono focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={handleSavePhone}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shrink-0"
            >
              Vincular
            </button>
          </div>
          {savePhoneStatus && (
            <span className="text-[10px] text-emerald-400 block mt-1">{savePhoneStatus}</span>
          )}
        </div>
      </div>

      {/* Main 2-Column: Interactive Simulator vs Integration Docs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7 cols): Interactive Chat Simulator */}
        <div className="lg:col-span-7 bg-[#161b22] border border-[#30363d] rounded-2xl flex flex-col h-[580px] shadow-xl overflow-hidden">
          {/* Chat Header */}
          <div className="bg-[#0d1117] border-b border-[#30363d] px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">
                R
              </div>
              <div>
                <span className="text-xs font-bold text-[#f0f6fc] block">
                  Ritmo Finanças Bot
                </span>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Simulador Ativo • Processamento Natural
                </span>
              </div>
            </div>
            <button
              onClick={() =>
                setChatHistory([
                  {
                    sender: 'bot',
                    text: 'Conversa reiniciada. Envie um novo lançamento para testar!',
                    time: 'Agora',
                  },
                ])
              }
              className="p-1.5 rounded-lg text-[#6e7681] hover:text-[#f0f6fc]"
              title="Limpar histórico do chat"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Examples Badges */}
          <div className="p-3 bg-[#0d1117]/50 border-b border-[#30363d]/60 overflow-x-auto whitespace-nowrap flex gap-1.5">
            <span className="text-[10px] text-[#6e7681] self-center pr-1">Exemplos:</span>
            {EXAMPLE_MESSAGES.map((msg, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSendMessage(msg)}
                className="px-2.5 py-1 rounded-full bg-[#21262d] hover:bg-[#30363d] text-[11px] text-[#c9d1d9] border border-[#30363d] transition-colors"
              >
                {msg}
              </button>
            ))}
          </div>

          {/* Messages Area */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {chatHistory.map((m, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow-sm whitespace-pre-wrap ${
                    m.sender === 'user'
                      ? 'bg-emerald-600 text-white rounded-br-none'
                      : 'bg-[#21262d] text-[#f0f6fc] rounded-bl-none border border-[#30363d]'
                  }`}
                >
                  {m.text}

                  {m.details && (
                    <div className="mt-2 pt-2 border-t border-[#30363d] text-[11px] text-emerald-300 font-mono">
                      ✓ Salvo no Banco: #{m.details.id} • {m.details.category}
                    </div>
                  )}
                </div>
                <span className="text-[9px] text-[#6e7681] mt-1 px-1">{m.time}</span>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-1.5 text-xs text-[#8b949e]">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce delay-100" />
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce delay-200" />
                <span className="text-[11px] ml-1">Analisando mensagem...</span>
              </div>
            )}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-[#0d1117] border-t border-[#30363d] flex gap-2"
          >
            <input
              type="text"
              placeholder='Digite algo como "Gastei 55 no mercado" ou "quanto gastei?"'
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 bg-[#161b22] border border-[#30363d] focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-[#f0f6fc] focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !inputMessage.trim()}
              className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Right Column (5 cols): Official Meta Cloud API Architecture & Setup */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5">
            <h3 className="text-sm font-bold text-[#f0f6fc] flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Arquitetura Oficial WhatsApp Cloud API
            </h3>

            <div className="space-y-3 text-xs text-[#8b949e]">
              <p>
                O Ritmo foi projetado com suporte estrito à <strong>WhatsApp Business Platform / Cloud API oficial da Meta</strong>. Não usamos métodos piratas ou automações não autorizadas.
              </p>

              <div className="p-3 rounded-xl bg-[#0d1117] border border-[#30363d] space-y-2">
                <div className="font-semibold text-[#f0f6fc]">Endpoint de Webhook Ativo:</div>
                <code className="block bg-[#161b22] p-2 rounded text-[11px] text-emerald-400 break-all font-mono">
                  /api/integrations
                </code>
                <p className="text-[11px] text-[#6e7681]">
                  Suporta verificação automática <code className="text-[#8b949e]">hub.challenge</code> e autenticação via <code className="text-[#8b949e]">hub.verify_token</code>.
                </p>
              </div>

              <div className="space-y-1.5 pt-2">
                <div className="font-semibold text-[#f0f6fc]">Variáveis de Ambiente Necessárias:</div>
                <ul className="list-disc list-inside space-y-1 text-[11px] text-[#8b949e]">
                  <li><code className="text-[#f0f6fc]">WHATSAPP_VERIFY_TOKEN</code> — Token de verificação da Meta</li>
                  <li><code className="text-[#f0f6fc]">WHATSAPP_PHONE_NUMBER_ID</code> — ID do número oficial na Meta</li>
                  <li><code className="text-[#f0f6fc]">WHATSAPP_ACCESS_TOKEN</code> — Token de sistema permanente</li>
                  <li><code className="text-[#f0f6fc]">WHATSAPP_APP_SECRET</code> — Assinatura HMAC-SHA256</li>
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-800/40 text-[11px] text-amber-300">
                <strong>Status de Credenciais:</strong> Caso as credenciais da Meta não tenham sido configuradas nas variáveis de ambiente do servidor, utilize o simulador à esquerda para testar todo o fluxo de parsing e gravação no banco de dados com fidelidade de 100%.
              </div>
            </div>
          </div>

          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-5">
            <h4 className="text-xs font-bold text-[#f0f6fc] uppercase tracking-wider mb-2">
              Regras de Privacidade & Segurança do Bot
            </h4>
            <ul className="space-y-1.5 text-xs text-[#8b949e]">
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Mensagens de números não vinculados à conta são rejeitadas de imediato.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Mensagens ambíguas não são gravadas; o assistente solicita o detalhe faltante.</span>
              </li>
              <li className="flex items-start gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Logs do servidor não armazenam descrições ou valores confidenciais.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
