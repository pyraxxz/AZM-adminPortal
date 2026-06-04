import { useState } from 'react';
import { useDisputes } from '@/lib/useAdminData';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Swords, MessageSquare, CheckCircle, XCircle, Divide, RefreshCw, Eye } from 'lucide-react';
import { toast } from 'sonner';

const RULINGS = [
  { value: 'BUYER_WINS', label: 'Buyer Wins', color: 'text-emerald-400' },
  { value: 'VENDOR_WINS', label: 'Vendor Wins', color: 'text-blue-400' },
  { value: 'SPLIT', label: 'Split Funds', color: 'text-amber-400' },
];

function DisputeCard({ dispute, onAction }) {
  const [expanded, setExpanded] = useState(false);
  const [ruling, setRuling] = useState('BUYER_WINS');
  const [reason, setReason] = useState('');
  const [buyerPct, setBuyerPct] = useState(100);
  const [injectMsg, setInjectMsg] = useState('');
  const [tab, setTab] = useState('resolve');

  const qc = useQueryClient();
  const forceRelease = useMutation({ mutationFn: ({ id, reason }) => api.trades.forceRelease(id, reason), onSuccess: () => { toast.success('Escrow released to buyer'); qc.invalidateQueries({ queryKey: ['admin', 'disputes'] }); } });
  const forceCancel = useMutation({ mutationFn: ({ id, reason }) => api.trades.forceCancel(id, reason), onSuccess: () => { toast.success('Trade cancelled, escrow returned to vendor'); qc.invalidateQueries({ queryKey: ['admin', 'disputes'] }); } });
  const resolve = useMutation({ mutationFn: ({ id, ruling, reason, buyerPct }) => api.trades.resolve(id, ruling, reason, buyerPct), onSuccess: () => { toast.success('Dispute resolved'); qc.invalidateQueries({ queryKey: ['admin', 'disputes'] }); } });
  const inject = useMutation({ mutationFn: ({ id, message }) => api.trades.injectMessage(id, message), onSuccess: () => { toast.success('Message injected'); setInjectMsg(''); } });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
      <div className="p-4 flex items-start justify-between gap-4 cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-mono text-slate-400">{dispute.id}</span>
            <Badge className="bg-red-500/20 text-red-400 border-0 text-xs">DISPUTED</Badge>
            <span className="text-sm font-bold text-white">${dispute.amount} {dispute.currency}</span>
            <span className="text-xs text-slate-500">{dispute.paymentMethod}</span>
          </div>
          <div className="flex gap-4 mt-2 text-xs text-slate-500">
            <span>Buyer: <span className="text-slate-300">{dispute.buyer?.name}</span></span>
            <span>Vendor: <span className="text-slate-300">{dispute.vendor?.name}</span></span>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="text-slate-400 h-8">
          {expanded ? 'Collapse' : 'Expand'}
        </Button>
      </div>

      {expanded && (
        <div className="border-t border-slate-800 p-4 space-y-4">
          {/* Messages */}
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {(dispute.messages || []).map((m, i) => (
              <div key={i} className={`flex ${m.sender === 'buyer' ? 'justify-start' : 'justify-end'}`}>
                <div className={`rounded-lg px-3 py-2 max-w-xs text-xs ${m.sender === 'buyer' ? 'bg-slate-800 text-slate-300' : 'bg-blue-500/20 text-blue-300'}`}>
                  <p className="font-medium mb-0.5 capitalize">{m.sender}</p>
                  <p>{m.text}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Action tabs */}
          <div className="flex gap-1 bg-slate-800 rounded-lg p-1">
            {['resolve', 'inject', 'quick'].map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`flex-1 text-xs py-1.5 rounded-md capitalize transition-colors ${tab === t ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}>{t === 'quick' ? 'Quick Actions' : t}</button>
            ))}
          </div>

          {tab === 'resolve' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                {RULINGS.map((r) => (
                  <button key={r.value} onClick={() => setRuling(r.value)} className={`flex-1 text-xs py-2 rounded-lg border transition-colors ${ruling === r.value ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-slate-700 text-slate-400 hover:border-slate-600'}`}>{r.label}</button>
                ))}
              </div>
              {ruling === 'SPLIT' && (
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Buyer % (Vendor gets the rest)</label>
                  <Input type="number" min={0} max={100} value={buyerPct} onChange={(e) => setBuyerPct(e.target.value)} className="bg-slate-800 border-slate-700 text-white" />
                </div>
              )}
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason for ruling (recorded in audit log)..." className="bg-slate-800 border-slate-700 text-white text-xs resize-none" rows={2} />
              <Button onClick={() => resolve.mutate({ id: dispute.id, ruling, reason, buyerPct: parseInt(buyerPct) })} disabled={!reason} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm">
                <CheckCircle className="w-3.5 h-3.5 mr-2" /> Resolve Dispute
              </Button>
            </div>
          )}

          {tab === 'inject' && (
            <div className="space-y-2">
              <Input value={injectMsg} onChange={(e) => setInjectMsg(e.target.value)} placeholder="Type admin message to inject into trade chat..." className="bg-slate-800 border-slate-700 text-white" />
              <Button onClick={() => inject.mutate({ id: dispute.id, message: injectMsg })} disabled={!injectMsg} className="w-full bg-blue-600 hover:bg-blue-500 text-white text-sm">
                <MessageSquare className="w-3.5 h-3.5 mr-2" /> Inject Message
              </Button>
            </div>
          )}

          {tab === 'quick' && (
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={() => { const r = prompt('Reason for force release?'); if (r) forceRelease.mutate({ id: dispute.id, reason: r }); }} variant="outline" className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10 text-sm">
                <CheckCircle className="w-3.5 h-3.5 mr-2" /> Force Release
              </Button>
              <Button onClick={() => { const r = prompt('Reason for cancellation?'); if (r) forceCancel.mutate({ id: dispute.id, reason: r }); }} variant="outline" className="border-red-500/50 text-red-400 hover:bg-red-500/10 text-sm">
                <XCircle className="w-3.5 h-3.5 mr-2" /> Force Cancel
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function WarRoom() {
  const { data: disputes = [], isLoading, refetch } = useDisputes();
  const { data: liveTrades = [] } = useQuery({ queryKey: ['admin', 'live-trades'], queryFn: () => api.trades.live(), refetchInterval: 15000 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center">
            <Swords className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">War Room</h1>
            <p className="text-sm text-slate-400">{disputes.length} active disputes · {liveTrades.length || 0} live trades</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="border-slate-700 text-slate-300 hover:bg-slate-800">
          <RefreshCw className="w-3.5 h-3.5 mr-2" /> Refresh
        </Button>
      </div>

      {/* Active Disputes */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Active Disputes</h2>
        {isLoading && <p className="text-slate-500 text-sm">Loading…</p>}
        {disputes.map((d) => <DisputeCard key={d.id} dispute={d} />)}
        {!isLoading && disputes.length === 0 && (
          <div className="text-center py-10 text-slate-500 text-sm bg-slate-900 border border-slate-800 rounded-xl">
            No active disputes — the platform is clean ✓
          </div>
        )}
      </div>

      {/* Live Trades */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">Live Trades ({liveTrades.length || 0})</h2>
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="grid grid-cols-5 gap-4 px-4 py-2 border-b border-slate-800 text-xs text-slate-500 uppercase">
            <span>ID</span><span>Amount</span><span>Status</span><span>Buyer</span><span>Vendor</span>
          </div>
          {(liveTrades.slice ? liveTrades : []).map((t) => (
            <div key={t.id} className="grid grid-cols-5 gap-4 px-4 py-3 border-b border-slate-800/50 last:border-0 text-sm hover:bg-slate-800/30 transition-colors">
              <span className="font-mono text-xs text-slate-400 truncate">{t.id}</span>
              <span className="font-medium text-white">${t.amount}</span>
              <Badge className="bg-amber-500/20 text-amber-400 border-0 text-xs w-fit">{t.status}</Badge>
              <span className="text-slate-300 truncate">{t.buyer?.name || '–'}</span>
              <span className="text-slate-300 truncate">{t.vendor?.name || '–'}</span>
            </div>
          ))}
          {(liveTrades.length === 0) && <p className="text-slate-500 text-sm text-center py-6">No live trades</p>}
        </div>
      </div>
    </div>
  );
}