import React, { useMemo, useState } from 'react';
import { Crown, Newspaper, Search } from 'lucide-react';
import { FeedView } from './FeedView.js';
import { DiscoverRitus, TeamsPanel } from './TeamsPanel.js';
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

type Sub = 'feed' | 'achar' | 'ritus';

export const TabFeed: React.FC<Props> = ({ referralCode, habits, habitLogs, sessions, tasks, activeCycle, inviteCode, onInviteHandled }) => {
  const [sub, setSub] = useState<Sub>(inviteCode ? 'ritus' : 'feed');
  const achievements = useMemo(() => computeShareable({ habits, habitLogs, sessions, tasks, activeCycle }), [habits, habitLogs, sessions, tasks, activeCycle]);

  // abrir por um link de Ritus leva direto à página dele
  React.useEffect(() => {
    if (inviteCode) setSub('ritus');
  }, [inviteCode]);

  const pill = (id: Sub, label: string, Icon: any) => (
    <button key={id} role="tab" aria-selected={sub === id} onClick={() => setSub(id)} className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-colors whitespace-nowrap ${sub === id ? 'bg-emerald-500 text-slate-950 border-emerald-500' : 'border-[#30363d] text-[#c9d1d9] hover:bg-[#21262d]'}`}>
      <Icon className="w-4 h-4" /> {label}
    </button>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div role="tablist" aria-label="Feed" className="flex gap-2 overflow-x-auto pb-1">
        {pill('feed', 'Feed', Newspaper)}
        {pill('achar', 'Achar Ritus', Search)}
        {pill('ritus', 'Meus Ritus', Crown)}
      </div>
      {sub === 'feed' && <FeedView teamId={null} canPost achievements={achievements} emptyText="Ainda não há publicações. Compartilhe sua primeira conquista!" />}
      {sub === 'achar' && <DiscoverRitus referralCode={referralCode} achievements={achievements} />}
      {sub === 'ritus' && <TeamsPanel referralCode={referralCode} achievements={achievements} inviteCode={inviteCode} onInviteHandled={onInviteHandled} />}
    </div>
  );
};
