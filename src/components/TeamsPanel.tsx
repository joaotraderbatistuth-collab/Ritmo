import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowLeft, Copy, Check, Crown, Eye, Flame, Lock, Plus, Search, Settings2, Users, QrCode } from 'lucide-react';
import { ritusCover } from '../lib/ritus-covers.js';
import { callApi } from '../lib/client-api.js';
import { FeedView } from './FeedView.js';
import { Achievement } from '../lib/feed-rules.js';
import { TEAM_MAX_PRICE_CENTS, TEAM_MIN_PRICE_CENTS, TEAM_PLATFORM_FEE_PERCENT, TEAM_TERMS, splitTeamPayment, teamPriceLabel } from '../lib/teams-plan.js';
import { brl } from '../lib/commission-plan.js';

const field = 'bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2 text-sm text-[#f0f6fc] w-full focus:outline-none focus:border-emerald-500';
const btn = 'px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm disabled:opacity-40';
const ghost = 'px-4 py-2 rounded-lg border border-[#30363d] text-sm text-[#c9d1d9] hover:bg-[#21262d]';

/** Aceita o link completo (…?ritus=codigo ou o antigo …?equipe=codigo) ou só o código. */
export function extractTeamCode(raw: string): string {
  const t = raw.trim();
  try {
    const u = new URL(t);
    return (u.searchParams.get('ritus') || u.searchParams.get('equipe') || u.pathname.split('/').filter(Boolean).pop() || '').toLowerCase();
  } catch {
    return t.toLowerCase();
  }
}

const teamLink = (code: string, ref: string) => `${typeof window !== 'undefined' ? window.location.origin : ''}/?ref=${encodeURIComponent(ref)}&ritus=${code}`;

/* ------------------------------------------------------------------ */
/* Formulário do Ritus (criar / editar)                                 */
/* ------------------------------------------------------------------ */

const TeamForm: React.FC<{ initial?: any; onSaved: (team: any) => void; onCancel: () => void }> = ({ initial, onSaved, onCancel }) => {
  const [name, setName] = useState(initial?.name || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [price, setPrice] = useState(initial ? (initial.priceCents / 100).toFixed(2).replace('.', ',') : '');
  const [periodDays, setPeriodDays] = useState<number>(initial?.periodDays ?? 0);
  const [freeForReferred, setFreeForReferred] = useState(initial?.freeForReferred ?? true);
  const [membersCanPost, setMembersCanPost] = useState(initial?.membersCanPost ?? false);
  const [listed, setListed] = useState(initial?.listed ?? true);
  const [accepted, setAccepted] = useState(Boolean(initial));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const priceCents = Math.round(Number((price || '0').replace(/\./g, '').replace(',', '.')) * 100);
  const validPrice = Number.isFinite(priceCents) && (priceCents === 0 || (priceCents >= TEAM_MIN_PRICE_CENTS && priceCents <= TEAM_MAX_PRICE_CENTS));
  const split = splitTeamPayment(priceCents || 0);

  const save = async () => {
    setBusy(true);
    setError('');
    const r = await callApi('/api/teams', { action: initial ? 'update_team' : 'create_team', teamId: initial?.id, name, description, priceCents, periodDays, freeForReferred, membersCanPost, listed });
    setBusy(false);
    if (r.ok) onSaved((r.data as any).team);
    else setError((r.data as any).error || 'Não foi possível salvar.');
  };

  return (
    <div className="space-y-4 rounded-2xl border border-[#30363d] bg-[#161b22] p-5">
      <h3 className="text-lg font-extrabold text-[#f0f6fc]">{initial ? 'Editar Ritus' : 'Criar meu Ritus'}</h3>
      <label className="block text-xs text-[#8b949e]">Nome do Ritus<input className={field} value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="Ex.: Treino Funcional com o Carlos" /></label>
      <label className="block text-xs text-[#8b949e]">Descrição do serviço<textarea className={field} rows={5} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={600} placeholder="Explique o que você entrega: ex. 3 treinos novos por semana, planilha de evolução, tira-dúvidas nos comentários e aula ao vivo uma vez por mês." /><span className="block mt-1 text-[11px] text-[#6e7681]">É o que aparece na vitrine &quot;Achar Ritus&quot; antes de a pessoa assinar. {description.length}/600</span></label>
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block text-xs text-[#8b949e]">Preço do Ritus (R$) — 0 para Ritus grátis<input className={field} inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="49,90" /></label>
        <label className="block text-xs text-[#8b949e]">Como cobrar
          <select className={field} value={periodDays} onChange={(e) => setPeriodDays(Number(e.target.value))}>
            <option value={0}>Acesso único (paga uma vez)</option>
            <option value={30}>A cada 30 dias (renovação manual por Pix)</option>
          </select>
        </label>
      </div>
      {!validPrice && <p className="text-xs text-amber-300">O preço deve ser R$ 0 (grátis) ou ficar entre {brl(TEAM_MIN_PRICE_CENTS)} e {brl(TEAM_MAX_PRICE_CENTS)}.</p>}
      {validPrice && priceCents > 0 && (
        <div className="rounded-xl border border-emerald-800/50 bg-emerald-950/20 p-3 text-sm text-[#c9d1d9]">
          Em cada venda de <strong>{brl(priceCents)}</strong>, você recebe <strong className="text-emerald-300">{brl(split.ownerCents)}</strong> e a plataforma retém {TEAM_PLATFORM_FEE_PERCENT}% ({brl(split.platformFeeCents)}).
        </div>
      )}
      <label className="flex gap-3 text-sm text-[#c9d1d9] cursor-pointer"><input type="checkbox" className="mt-1 accent-emerald-500" checked={freeForReferred} onChange={(e) => setFreeForReferred(e.target.checked)} />
        <span><strong>Quem se cadastrar no Ritmo pelo meu link entra de graça.</strong><span className="block text-xs text-[#8b949e]">Quem chegar pelo seu link de indicação ganha o acesso incluso. Quem não veio pelo seu link assina o Ritus.</span></span></label>
      <label className="flex gap-3 text-sm text-[#c9d1d9] cursor-pointer"><input type="checkbox" className="mt-1 accent-emerald-500" checked={membersCanPost} onChange={(e) => setMembersCanPost(e.target.checked)} />
        <span><strong>Assinantes também podem publicar.</strong><span className="block text-xs text-[#8b949e]">Desligado: só você publica o conteúdo exclusivo; os assinantes comentam e curtem.</span></span></label>
      <label className="flex gap-3 text-sm text-[#c9d1d9] cursor-pointer"><input type="checkbox" className="mt-1 accent-emerald-500" checked={listed} onChange={(e) => setListed(e.target.checked)} />
        <span><strong>Mostrar meu Ritus na vitrine &quot;Achar Ritus&quot;.</strong><span className="block text-xs text-[#8b949e]">Qualquer usuário pode encontrar e assinar. Desligado: só quem tiver o seu link chega até ele.</span></span></label>
      {!initial && (
        <div className="rounded-xl border border-[#30363d] bg-[#0d1117] p-3">
          <div className="text-xs font-bold text-[#f0f6fc] mb-1">Regras para criar um Ritus</div>
          <ul className="list-disc pl-5 space-y-1 text-xs text-[#8b949e]">{TEAM_TERMS.map((t) => <li key={t}>{t}</li>)}</ul>
          <label className="mt-3 flex gap-2 text-sm text-[#c9d1d9] cursor-pointer"><input type="checkbox" className="accent-emerald-500" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} /> Li e aceito as regras acima.</label>
        </div>
      )}
      {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" className={ghost} onClick={onCancel}>Cancelar</button>
        <button type="button" className={btn} onClick={save} disabled={busy || !accepted || !validPrice || name.trim().length < 3}>{initial ? 'Salvar alterações' : 'Criar Ritus'}</button>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Compra do acesso (Pix)                                              */
/* ------------------------------------------------------------------ */

const PurchaseModal: React.FC<{ team: any; onClose: () => void; onPaid: () => void }> = ({ team, onClose, onPaid }) => {
  const [payment, setPayment] = useState<any>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<'idle' | 'checking' | 'paid'>('idle');
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    callApi('/api/teams', { action: 'buy', code: team.code }).then((r) => (r.ok ? setPayment((r.data as any).payment) : setError((r.data as any).error || 'Não foi possível gerar o Pix.')));
  }, [team.code]);

  const check = useCallback(async () => {
    if (!payment) return false;
    setStatus('checking');
    const r = await callApi('/api/teams', { action: 'check_payment', orderReference: payment.orderReference });
    if (r.ok && (r.data as any).paid) {
      setStatus('paid');
      setTimeout(onPaid, 1200);
      return true;
    }
    setStatus('idle');
    return false;
  }, [payment, onPaid]);

  // confere sozinho a cada 6 segundos (só no pagamento real)
  useEffect(() => {
    if (!payment || payment.isSimulated || status === 'paid') return;
    const t = setInterval(check, 6000);
    return () => clearInterval(t);
  }, [payment, status, check]);

  const confirmDemo = async () => {
    const r = await callApi('/api/teams', { action: 'confirm_demo', orderReference: payment.orderReference });
    if (r.ok) {
      setStatus('paid');
      setTimeout(onPaid, 900);
    } else setError((r.data as any).error || 'Não foi possível confirmar.');
  };
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(payment.pixCopiaECola);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* sem permissão */
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl w-full max-w-md p-5 max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Pagamento do acesso">
        <h3 className="font-extrabold text-[#f0f6fc]">Assinar o Ritus {team.name}</h3>
        <p className="text-sm text-[#c9d1d9] mt-1">{teamPriceLabel(team.priceCents, team.periodDays)}</p>
        {error && <p role="alert" className="text-sm text-rose-300 mt-3">{error}</p>}
        {!payment && !error && <p className="text-sm text-[#8b949e] mt-4">Gerando o Pix...</p>}
        {payment && status !== 'paid' && (
          <div className="mt-4 space-y-3">
            {payment.pixQrCode ? <img src={payment.pixQrCode} alt="QR Code do Pix" className="w-48 h-48 mx-auto rounded-lg bg-white p-2" /> : <div className="w-48 h-48 mx-auto rounded-lg bg-[#0d1117] border border-[#30363d] flex items-center justify-center text-[#6e7681]"><QrCode className="w-10 h-10" /></div>}
            <p className="text-xs text-[#8b949e]">Pague com Pix copia e cola:</p>
            <div className="rounded-lg bg-[#0d1117] border border-[#30363d] p-2 text-[11px] font-mono text-[#c9d1d9] break-all max-h-24 overflow-y-auto">{payment.pixCopiaECola}</div>
            <button type="button" onClick={copy} className={`${btn} w-full inline-flex items-center justify-center gap-2`}>{copied ? <><Check className="w-4 h-4" /> Copiado</> : <><Copy className="w-4 h-4" /> Copiar código Pix</>}</button>
            <button type="button" onClick={check} disabled={status === 'checking'} className={`${ghost} w-full`}>{status === 'checking' ? 'Conferindo...' : 'Já paguei, conferir agora'}</button>
            {payment.isSimulated && (
              <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-200">
                Modo de demonstração (Mercado Pago não configurado): nenhum dinheiro é cobrado.
                <button type="button" onClick={confirmDemo} className="mt-2 w-full px-3 py-2 rounded-lg bg-amber-400 text-slate-950 font-bold text-sm">Confirmar pagamento de teste</button>
              </div>
            )}
            <p className="text-[11px] text-[#6e7681]">Após o pagamento, o acesso é liberado automaticamente.</p>
          </div>
        )}
        {status === 'paid' && <p className="mt-6 text-center text-emerald-300 font-bold">Pagamento confirmado! Liberando seu acesso...</p>}
        <button type="button" onClick={onClose} className="mt-4 text-xs text-[#8b949e] underline">Fechar</button>
      </div>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Detalhe do Ritus                                                   */
/* ------------------------------------------------------------------ */

const TeamDetail: React.FC<{ code: string; referralCode: string; achievements: Achievement[]; onBack: () => void }> = ({ code, referralCode, achievements, onBack }) => {
  const [team, setTeam] = useState<any>(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [buying, setBuying] = useState(false);
  const [members, setMembers] = useState<any[] | null>(null);
  const [msg, setMsg] = useState('');
  const [copied, setCopied] = useState(false);

  // o acesso só é contado na primeira abertura (recarregar depois de entrar ou pagar não conta de novo)
  const load = useCallback(async (countView = false) => {
    const r = await callApi(`/api/teams?code=${encodeURIComponent(code)}${countView ? '&view=1' : ''}`);
    if (r.ok) setTeam((r.data as any).team);
    else setError((r.data as any).error || 'Ritus não encontrado.');
  }, [code]);
  useEffect(() => {
    load(true);
  }, [load]);

  const joinFree = async () => {
    const r = await callApi('/api/teams', { action: 'join_free', code });
    setMsg((r.data as any).message || (r.data as any).error || '');
    if (r.ok) load();
  };
  const loadMembers = async () => {
    const r = await callApi(`/api/teams?members=${team.id}`);
    if (r.ok) setMembers((r.data as any).members);
  };
  const removeMember = async (userId: number) => {
    if (!confirm('Remover este assinante? Ele perde o acesso ao Ritus.')) return;
    await callApi('/api/teams', { action: 'remove_member', teamId: team.id, userId });
    loadMembers();
  };
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(teamLink(team.code, referralCode));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* sem permissão */
    }
  };

  if (error) return <div className="space-y-3"><button className={ghost} onClick={onBack}><ArrowLeft className="inline w-4 h-4 mr-1" />Voltar</button><p role="alert" className="text-sm text-rose-300">{error}</p></div>;
  if (!team) return <p className="text-sm text-[#8b949e]">Carregando Ritus...</p>;
  if (editing) return <TeamForm initial={team} onCancel={() => setEditing(false)} onSaved={() => { setEditing(false); load(); }} />;

  const v = team.viewer;
  return (
    <div className="space-y-4">
      <button type="button" className="inline-flex items-center gap-1 text-sm text-[#8b949e] hover:text-white" onClick={onBack}><ArrowLeft className="w-4 h-4" /> Voltar</button>
      <div className="rounded-2xl border border-[#30363d] bg-[#161b22] p-5">
        {ritusCover(team.code) && <img src={ritusCover(team.code)!} alt="" className="-mx-5 -mt-5 mb-4 w-[calc(100%+2.5rem)] max-w-none aspect-[16/9] object-cover rounded-t-2xl" />}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-extrabold text-[#f0f6fc]">{team.name}</h3>
            <p className="text-xs text-[#8b949e] flex items-center gap-1.5 mt-0.5"><Crown className="w-3.5 h-3.5 text-amber-300" /> Criado por {team.ownerName} · <Users className="w-3.5 h-3.5" /> {team.membersCount} {team.membersCount === 1 ? 'assinante' : 'assinantes'} · <Eye className="w-3.5 h-3.5" /> {team.viewCount} {team.viewCount === 1 ? 'acesso' : 'acessos'} · {team.postsCount} {team.postsCount === 1 ? 'conteúdo' : 'conteúdos'}</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-300 text-sm font-semibold">{teamPriceLabel(team.priceCents, team.periodDays)}</span>
        </div>
        {team.description && <p className="mt-3 text-sm text-[#c9d1d9] whitespace-pre-wrap">{team.description}</p>}
        {!team.active && <p className="mt-3 text-xs text-amber-300">Este Ritus está suspenso pela moderação: só você o vê.</p>}

        {v.isOwner && (
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className={btn} onClick={copyLink}>{copied ? 'Link copiado!' : 'Copiar link do Ritus'}</button>
            <button type="button" className={ghost} onClick={() => setEditing(true)}><Settings2 className="inline w-4 h-4 mr-1" />Editar</button>
            <button type="button" className={ghost} onClick={loadMembers}>Ver assinantes</button>
          </div>
        )}
        {v.isOwner && <p className="mt-2 text-[11px] text-[#6e7681]">Quem se cadastrar no Ritmo por este link entra de graça{team.freeForReferred ? '' : ' (desligado neste Ritus)'}; quem já tem conta assina o Ritus. As vendas entram no seu saldo (aba Indique e Ganhe &gt; Receber).</p>}

        {!v.isMember && (
          <div className="mt-4">
            {v.canJoinFree && <button type="button" className={btn} onClick={joinFree}>{team.priceCents === 0 ? 'Entrar no Ritus (grátis)' : 'Entrar no Ritus (acesso incluso pelo link do criador)'}</button>}
            {v.mustPay && <button type="button" className={btn} onClick={() => setBuying(true)}><Lock className="inline w-4 h-4 mr-1" />{v.expired ? 'Renovar assinatura' : 'Assinar agora'} · {teamPriceLabel(team.priceCents, team.periodDays)}</button>}
            {v.expired && <p className="text-xs text-amber-300 mt-2">Seu acesso venceu em {v.expiresAt}. Renove para voltar a ver o conteúdo.</p>}
          </div>
        )}
        {v.isMember && !v.isOwner && v.expiresAt && <p className="mt-3 text-xs text-[#8b949e]">Seu acesso vai até {v.expiresAt.split('-').reverse().join('/')}.</p>}
        {msg && <p className="mt-3 text-sm text-emerald-300">{msg}</p>}
      </div>

      {members && (
        <div className="rounded-2xl border border-[#30363d] bg-[#161b22] p-4">
          <h4 className="font-bold text-[#f0f6fc] mb-2">Assinantes ({members.length})</h4>
          {members.length === 0 && <p className="text-sm text-[#8b949e]">Ainda não há assinantes.</p>}
          {members.map((m) => (
            <div key={m.userId} className="flex items-center justify-between text-sm py-1.5 border-t border-[#30363d] first:border-0">
              <span className="text-[#c9d1d9]">{m.name} <span className="text-[11px] text-[#6e7681]">· {m.source === 'purchase' ? 'comprou' : m.source === 'referral' ? 'veio pelo seu link' : 'grátis'}{m.expiresAt ? ` · até ${m.expiresAt}` : ''}{m.status !== 'active' ? ' · removido' : !m.active ? ' · vencido' : ''}</span></span>
              {m.status === 'active' && <button type="button" onClick={() => removeMember(m.userId)} className="text-xs text-rose-400 hover:underline">Remover</button>}
            </div>
          ))}
        </div>
      )}

      {v.isMember || v.canRead ? (
        <FeedView teamId={team.id} canPost={v.isOwner || (team.membersCanPost && v.isMember)} achievements={achievements} emptyText={v.isOwner ? 'Publique o primeiro conteúdo exclusivo para os seus assinantes.' : 'O criador ainda não publicou nada. Volte em breve!'} />
      ) : (
        <div className="rounded-2xl border border-dashed border-emerald-700/50 bg-emerald-950/10 p-8 text-center">
          <Lock className="w-7 h-7 mx-auto mb-2 text-emerald-300" />
          <p className="font-bold text-[#f0f6fc]">Conteúdo exclusivo para assinantes</p>
          <p className="text-sm text-[#8b949e] mt-1">{team.postsCount > 0 ? `${team.postsCount} ${team.postsCount === 1 ? 'publicação exclusiva esperando' : 'publicações exclusivas esperando'} por você.` : 'Assine para receber cada conteúdo novo assim que for publicado.'}</p>
          {v.mustPay && <button type="button" className={`${btn} mt-4`} onClick={() => setBuying(true)}>Assinar · {teamPriceLabel(team.priceCents, team.periodDays)}</button>}
          {v.canJoinFree && <button type="button" className={`${btn} mt-4`} onClick={joinFree}>Entrar no Ritus</button>}
        </div>
      )}

      {buying && <PurchaseModal team={team} onClose={() => setBuying(false)} onPaid={() => { setBuying(false); load(); }} />}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Meus Ritus                                                         */
/* ------------------------------------------------------------------ */

export const TeamsPanel: React.FC<{ referralCode: string; achievements: Achievement[]; inviteCode?: string | null; onInviteHandled?: () => void }> = ({ referralCode, achievements, inviteCode, onInviteHandled }) => {
  const [view, setView] = useState<{ name: 'list' } | { name: 'create' } | { name: 'detail'; code: string }>({ name: 'list' });
  const [data, setData] = useState<{ owned: any[]; joined: any[] } | null>(null);
  const [paste, setPaste] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const r = await callApi('/api/teams');
    if (r.ok) setData(r.data as any);
    else setError((r.data as any).error || 'Não foi possível carregar os Ritus.');
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // link de convite (?ritus=codigo): abre direto a página do Ritus
  useEffect(() => {
    if (inviteCode) {
      setView({ name: 'detail', code: inviteCode });
      onInviteHandled?.();
    }
  }, [inviteCode, onInviteHandled]);

  if (view.name === 'create') return <TeamForm onCancel={() => setView({ name: 'list' })} onSaved={(t) => { load(); setView({ name: 'detail', code: t.code }); }} />;
  if (view.name === 'detail') return <TeamDetail code={view.code} referralCode={referralCode} achievements={achievements} onBack={() => { setView({ name: 'list' }); load(); }} />;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#30363d] bg-[#161b22] p-5">
        <h3 className="text-lg font-extrabold text-[#f0f6fc]">Meus Ritus</h3>
        <p className="text-sm text-[#c9d1d9] mt-1">Crie seu Ritus, defina o preço, descreva o seu serviço e publique conteúdo exclusivo para quem assinar. A plataforma retém {TEAM_PLATFORM_FEE_PERCENT}% de cada venda.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className={btn} onClick={() => setView({ name: 'create' })}><Plus className="inline w-4 h-4 mr-1" />Criar meu Ritus</button>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <input className={`${field} max-w-xs`} value={paste} onChange={(e) => setPaste(e.target.value)} placeholder="Cole o link ou o código de um Ritus" aria-label="Link ou código do Ritus" />
          <button type="button" className={ghost} disabled={!paste.trim()} onClick={() => setView({ name: 'detail', code: extractTeamCode(paste) })}>Abrir</button>
        </div>
      </div>
      {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}

      <section>
        <h4 className="font-bold text-[#f0f6fc] mb-2">Ritus que eu criei</h4>
        {data && data.owned.length === 0 && <p className="text-sm text-[#8b949e]">Você ainda não criou nenhum Ritus.</p>}
        <div className="grid sm:grid-cols-2 gap-3">
          {data?.owned.map((t) => (
            <button key={t.id} type="button" onClick={() => setView({ name: 'detail', code: t.code })} className="text-left rounded-2xl border border-[#30363d] bg-[#161b22] hover:border-emerald-500/60 p-4">
              <div className="font-bold text-[#f0f6fc] flex items-center gap-2"><Crown className="w-4 h-4 text-amber-300" /> {t.name}{!t.active && <span className="text-[10px] text-rose-300">SUSPENSO</span>}</div>
              <div className="text-xs text-[#8b949e] mt-1">{teamPriceLabel(t.priceCents, t.periodDays)} · {t.membersCount} assinante(s)</div>
              <div className="text-xs text-emerald-300 mt-2">{t.salesCount} venda(s) · você recebeu {brl(t.earnedCents)}</div>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h4 className="font-bold text-[#f0f6fc] mb-2">Ritus que eu assino</h4>
        {data && data.joined.length === 0 && <p className="text-sm text-[#8b949e]">Você ainda não assina nenhum Ritus. Encontre um na aba Achar Ritus.</p>}
        <div className="grid sm:grid-cols-2 gap-3">
          {data?.joined.map((t) => (
            <button key={t.id} type="button" onClick={() => setView({ name: 'detail', code: t.code })} className="text-left rounded-2xl border border-[#30363d] bg-[#161b22] hover:border-emerald-500/60 p-4">
              <div className="font-bold text-[#f0f6fc]">{t.name}</div>
              <div className="text-xs text-[#8b949e] mt-1">por {t.ownerName}{t.expiresAt ? ` · até ${t.expiresAt.split('-').reverse().join('/')}` : ''}</div>
              {t.expired && <div className="text-xs text-amber-300 mt-1">Acesso vencido: renove para continuar</div>}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Achar Ritus: mais acessados + pesquisa                              */
/* ------------------------------------------------------------------ */

export const DiscoverRitus: React.FC<{ referralCode: string; achievements: Achievement[] }> = ({ referralCode, achievements }) => {
  const [query, setQuery] = useState('');
  const [list, setList] = useState<any[] | null>(null);
  const [error, setError] = useState('');
  const [open, setOpen] = useState<string | null>(null);
  const [onlyFree, setOnlyFree] = useState(false);
  const seq = useRef(0);

  const load = useCallback(async (q: string) => {
    const my = ++seq.current;
    const r = await callApi(`/api/teams?discover=1&q=${encodeURIComponent(q)}${onlyFree ? '&free=1' : ''}`);
    if (my !== seq.current) return; // resposta de uma busca antiga
    if (r.ok) {
      setList((r.data as any).ritus || []);
      setError('');
    } else setError((r.data as any).error || 'Não foi possível carregar os Ritus.');
  }, [onlyFree]);

  // pesquisa enquanto digita (espera a pessoa parar por um instante)
  useEffect(() => {
    if (open) return;
    const t = setTimeout(() => load(query.trim()), query ? 350 : 0);
    return () => clearTimeout(t);
  }, [query, load, open]);

  if (open) return <TeamDetail code={open} referralCode={referralCode} achievements={achievements} onBack={() => setOpen(null)} />;

  const searching = query.trim().length > 0;
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-[#30363d] bg-gradient-to-br from-emerald-950/40 to-[#161b22] p-5">
        <h3 className="text-lg font-extrabold text-[#f0f6fc] flex items-center gap-2"><Search className="w-5 h-5 text-emerald-300" /> Achar Ritus</h3>
        <p className="text-sm text-[#c9d1d9] mt-1">Treinos, mentorias, estudos e desafios criados pela comunidade. Assine e receba conteúdo exclusivo direto no seu feed.</p>
        <div className="mt-4 relative">
          <Search className="w-4 h-4 text-[#6e7681] absolute left-3 top-1/2 -translate-y-1/2" />
          <input className={`${field} pl-9`} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Pesquisar por tema, nome ou criador" aria-label="Pesquisar Ritus" />
        </div>
        <div className="mt-3 flex gap-2">
          <button type="button" onClick={() => setOnlyFree(false)} className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${!onlyFree ? 'bg-emerald-500 text-slate-950 border-emerald-500' : 'border-[#30363d] text-[#c9d1d9]'}`}>Todos</button>
          <button type="button" onClick={() => setOnlyFree(true)} className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${onlyFree ? 'bg-emerald-500 text-slate-950 border-emerald-500' : 'border-[#30363d] text-[#c9d1d9]'}`}>Só gratuitos</button>
        </div>
      </div>
      {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}

      <section>
        <h4 className="font-bold text-[#f0f6fc] mb-3 flex items-center gap-2">{searching ? <>Resultados para &quot;{query.trim()}&quot;</> : <><Flame className="w-4 h-4 text-amber-300" /> Mais acessados</>}</h4>
        {!list && <p className="text-sm text-[#8b949e]">Carregando...</p>}
        {list && list.length === 0 && (
          <p className="text-sm text-[#8b949e]">{searching ? 'Nenhum Ritus encontrado com esse termo. Tente outra palavra.' : 'Ainda não há Ritus na vitrine. Que tal criar o primeiro na aba Meus Ritus?'}</p>
        )}
        <div className="grid sm:grid-cols-2 gap-3">
          {list?.map((t) => (
            <button key={t.id} type="button" onClick={() => setOpen(t.code)} className="text-left rounded-2xl border border-[#30363d] bg-[#161b22] hover:border-emerald-500/60 p-4 flex flex-col">
              {ritusCover(t.code) && <img src={ritusCover(t.code)!} alt="" loading="lazy" className="-mx-4 -mt-4 mb-3 w-[calc(100%+2rem)] max-w-none aspect-[16/9] object-cover rounded-t-2xl" />}
              <div className="flex items-start justify-between gap-2">
                <div className="font-bold text-[#f0f6fc] flex items-center gap-2">
                  {t.rank && t.rank <= 3 ? <span className="text-xs font-black text-amber-300">#{t.rank}</span> : null}
                  {t.name}
                </div>
                <span className="shrink-0 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 text-[11px] font-semibold">{teamPriceLabel(t.priceCents, t.periodDays)}</span>
              </div>
              <div className="text-xs text-[#8b949e] mt-0.5">por {t.ownerName}</div>
              {t.description && <p className="text-sm text-[#c9d1d9] mt-2 line-clamp-3 whitespace-pre-wrap">{t.description}</p>}
              <div className="mt-auto pt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#8b949e]">
                <span className="inline-flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> {t.viewCount}</span>
                <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {t.membersCount}</span>
                <span className="inline-flex items-center gap-1"><Lock className="w-3.5 h-3.5" /> {t.postsCount} exclusivo(s)</span>
                {t.isOwner ? <span className="text-amber-300 font-semibold">Seu Ritus</span> : t.isMember ? <span className="text-emerald-300 font-semibold">Você assina</span> : null}
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};
