import React, { useMemo, useState } from 'react';
import { Newspaper, Users } from 'lucide-react';
import { FeedView } from './FeedView.js';
import { TeamsPanel } from './TeamsPanel.js';
import { computeShareable } from '../lib/achievements.js';

interface Props {
  referralCode: string;
  habits: any[];
  habitLogs: any[];
  sessions: any[];
  tasks: any[];
  activeCycle: any | null;
  inviteCode?: string | null;
  onInviteHandled?: () => void;
}

export const TabFeed: React.FC<Props> = ({ referralCode, habits, habitLogs, sessions, tasks, activeCycle, inviteCode, onInviteHandled }) => {
  const [sub, setSub] = useState<'feed' | 'equipes'>(inviteCode ? 'equipes' : 'feed');
  const achievements = useMemo(() => computeShareable({ habits, habitLogs, sessions, tasks, activeCycle }), [habits, habitLogs, sessions, tasks, activeCycle]);

  // abrir por um link de equipe leva direto à sub-aba Equipes
  React.useEffect(() => {
    if (inviteCode) setSub('equipes');
  }, [inviteCode]);

  const pill = (id: 'feed' | 'equipes', label: string, Icon: any) => (
    <button key={id} role="tab" aria-selected={sub === id} onClick={() => setSub(id)} className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${sub === id ? 'bg-emerald-500 text-slate-950 border-emerald-500' : 'border-[#30363d] text-[#c9d1d9] hover:bg-[#21262d]'}`}>
      <Icon className="w-4 h-4" /> {label}
    </button>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div role="tablist" aria-label="Feed" className="flex gap-2">
        {pill('feed', 'Feed', Newspaper)}
        {pill('equipes', 'Equipes', Users)}
      </div>
      {sub === 'feed' ? (
        <FeedView teamId={null} canPost achievements={achievements} emptyText="Ainda não há publicações. Compartilhe sua primeira conquista!" />
      ) : (
        <TeamsPanel referralCode={referralCode} achievements={achievements} inviteCode={inviteCode} onInviteHandled={onInviteHandled} />
      )}
    </div>
  );
};
