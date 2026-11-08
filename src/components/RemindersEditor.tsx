import React, { useState } from 'react';
import { Pencil, Plus, X } from 'lucide-react';
import { callApi } from '../lib/client-api.js';
import { repeatLabel } from '../lib/recurrence.js';
import { localDateStr } from '../lib/chain.js';
import { RepeatPicker } from './RepeatPicker.js';

// Lembretes do secretário: criar e editar à mão, com data, hora e repetição livres.

export interface ReminderRow {
  id: number;
  text: string;
  remindAt: string;
  taskId: number | null;
  sentAt: string | null;
  repeat?: string | null;
}

const pad = (n: number) => String(n).padStart(2, '0');
/** ISO → valor do campo datetime-local (no horário do aparelho). */
const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  return `${localDateStr(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const inOneHour = () => {
  const d = new Date(Date.now() + 3600_000);
  d.setMinutes(0, 0, 0);
  return toLocalInput(d.toISOString());
};

function ReminderForm({ initial, onSaved, onCancel }: { initial?: ReminderRow; onSaved: (r: ReminderRow) => void; onCancel: () => void }) {
  const [text, setText] = useState(initial?.text || '');
  const [when, setWhen] = useState(initial ? toLocalInput(initial.remindAt) : inOneHour());
  const [repeat, setRepeat] = useState(initial?.repeat || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const at = new Date(when); // datetime-local é lido no horário do aparelho
    if (!text.trim()) return setError('Escreva do que devo te lembrar.');
    if (Number.isNaN(at.getTime()) || at.getTime() < Date.now() - 60_000) return setError('Escolha uma data e hora daqui para frente.');
    setBusy(true);
    setError('');
    const body = initial
      ? { action: 'update_reminder', id: initial.id, text: text.trim(), remindAt: at.toISOString(), repeat: repeat || null }
      : { action: 'add_reminder', text: text.trim(), remindAt: at.toISOString(), repeat: repeat || null };
    const r = await callApi<{ reminder?: ReminderRow; error?: string }>('/api/assistant', body);
    setBusy(false);
    if (!r.ok || !r.data.reminder) return setError(r.data.error || 'Não foi possível salvar.');
    onSaved(r.data.reminder);
  };

  const field = 'w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-[#f0f6fc] focus:outline-none focus:border-emerald-500';
  return (
    <form onSubmit={save} className="p-3 rounded-xl border border-[#30363d] bg-[#0d1117]/60 space-y-2">
      <input value={text} onChange={(e) => setText(e.target.value)} maxLength={160} placeholder="Do que devo te lembrar?" className={field} autoFocus />
      <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} aria-label="Data e hora" className={`${field} [color-scheme:dark]`} />
      <RepeatPicker value={repeat} onChange={setRepeat} baseDate={when.slice(0, 10)} />
      {error && <p className="text-xs text-rose-400">{error}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={onCancel} className="flex-1 py-1.5 rounded-lg border border-[#30363d] text-xs text-[#c9d1d9]">Cancelar</button>
        <button type="submit" disabled={busy} className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold">{busy ? 'Salvando...' : 'Salvar'}</button>
      </div>
    </form>
  );
}

export const RemindersEditor: React.FC<{
  reminders: ReminderRow[];
  onChange: (next: ReminderRow[]) => void;
  onDone: (id: number) => void;
}> = ({ reminders, onChange, onDone }) => {
  const [editing, setEditing] = useState<number | 'new' | null>(null);
  const sorted = (list: ReminderRow[]) => [...list].sort((a, b) => a.remindAt.localeCompare(b.remindAt));

  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-xs font-semibold text-[#8b949e]">Lembretes</p>
        {editing !== 'new' && (
          <button type="button" onClick={() => setEditing('new')} className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 hover:underline"><Plus className="w-3.5 h-3.5" /> Novo lembrete</button>
        )}
      </div>
      {editing === 'new' && (
        <div className="mb-2">
          <ReminderForm onCancel={() => setEditing(null)} onSaved={(r) => { onChange(sorted([...reminders, r])); setEditing(null); }} />
        </div>
      )}
      {reminders.length === 0 && editing !== 'new' && <p className="text-xs text-[#6e7681]">Nenhum lembrete. Crie aqui ou fale: "me lembra de pagar a luz dia 10 às 9".</p>}
      <ul className="space-y-1 max-h-60 overflow-y-auto">
        {reminders.map((r) => {
          if (editing === r.id) {
            return (
              <li key={r.id}>
                <ReminderForm initial={r} onCancel={() => setEditing(null)} onSaved={(nr) => { onChange(sorted(reminders.map((x) => (x.id === r.id ? nr : x)))); setEditing(null); }} />
              </li>
            );
          }
          const d = new Date(r.remindAt);
          return (
            <li key={r.id} className="flex items-center gap-2 text-sm">
              <span className="flex-1 min-w-0 truncate text-[#c9d1d9]">{r.text}</span>
              <span className="text-[11px] text-[#8b949e] whitespace-nowrap">
                {r.repeat ? `🔁 ${repeatLabel(r.repeat)}, ` : ''}
                {d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })} {d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </span>
              <button type="button" onClick={() => setEditing(r.id)} aria-label="Editar lembrete" className="p-1 text-[#6e7681] hover:text-emerald-400"><Pencil className="w-3.5 h-3.5" /></button>
              <button type="button" onClick={() => onDone(r.id)} aria-label="Apagar lembrete" className="p-1 text-[#6e7681] hover:text-rose-400"><X className="w-3.5 h-3.5" /></button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
