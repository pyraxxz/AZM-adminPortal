import { useState } from 'react';
import { useSusuList, useSusuDetail, useResolveSusu } from '@/lib/useAdminData';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import MemberDetailDialog from '@/components/admin/MemberDetailDialog';
import {
  PiggyBank, RefreshCw, Snowflake, Users, CalendarClock, Eye,
  Play, RotateCcw, AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

const STATUS_STYLES = {
  CONFIGURING: 'bg-blue-500/20 text-blue-400',
  ACTIVE: 'bg-emerald-500/20 text-emerald-400',
  COMPLETED: 'bg-slate-600/30 text-slate-300',
  CANCELLED: 'bg-slate-600/30 text-slate-400',
  FROZEN_DISPUTE: 'bg-red-500/20 text-red-400',
};
const CYCLE_STYLES = {
  PENDING: 'bg-slate-600/30 text-slate-300',
  COLLECTING: 'bg-amber-500/20 text-amber-400',
  COLLECTING_GRACE: 'bg-red-500/20 text-red-400',
  PAID_OUT: 'bg-emerald-500/20 text-emerald-400',
  DEFAULTED: 'bg-red-500/20 text-red-400',
};
const MEMBER_STYLES = {
  PENDING_VOUCH: 'bg-slate-600/30 text-slate-400',
  PENDING_CONTRACT: 'bg-amber-500/20 text-amber-400',
  ACTIVE: 'bg-emerald-500/20 text-emerald-400',
  DEFAULTED: 'bg-red-500/20 text-red-400',
  REMOVED: 'bg-slate-600/30 text-slate-500',
};

const FILTERS = ['ALL', 'ACTIVE', 'CONFIGURING', 'FROZEN_DISPUTE', 'COMPLETED', 'CANCELLED'];

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function ResolveDialog({ susu, open, onOpenChange }) {
  const [action, setAction] = useState('REFUND_AND_CLOSE');
  const [notes, setNotes] = useState('');
  const resolve = useResolveSusu();

  function submit() {
    resolve.mutate({ id: susu.id, action, notes }, {
      onSuccess: (r) => {
        toast.success(action === 'RESUME'
          ? 'Susu resumed'
          : `Closed & refunded ${r.data?.refundedMembers ?? 0} member(s)`);
        onOpenChange(false);
        setNotes('');
      },
      onError: (e) => toast.error(e.message || 'Resolve failed'),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-slate-100">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Snowflake className="w-4 h-4 text-red-400" /> Resolve Frozen Susu
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            "{susu?.name}" is frozen ({susu?.frozenReason || 'dispute'}). Choose how to resolve the incident.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setAction('REFUND_AND_CLOSE')}
              className={`p-3 rounded-lg border text-left transition-colors ${action === 'REFUND_AND_CLOSE' ? 'border-red-500 bg-red-500/10' : 'border-slate-700 hover:border-slate-600'}`}>
              <RotateCcw className="w-4 h-4 text-red-400 mb-1.5" />
              <p className="text-sm font-medium text-white">Refund & Close</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Refund the open cycle's contributions, cancel the Susu.</p>
            </button>
            <button onClick={() => setAction('RESUME')}
              className={`p-3 rounded-lg border text-left transition-colors ${action === 'RESUME' ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-700 hover:border-slate-600'}`}>
              <Play className="w-4 h-4 text-emerald-400 mb-1.5" />
              <p className="text-sm font-medium text-white">Resume</p>
              <p className="text-[11px] text-slate-500 mt-0.5">Lift the freeze and let cycles continue.</p>
            </button>
          </div>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
            placeholder="Resolution notes (required, recorded against the incident)…"
            className="bg-slate-800 border-slate-700 text-white text-sm resize-none" />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-slate-400">Cancel</Button>
          <Button onClick={submit} disabled={!notes.trim() || resolve.isPending}
            className={action === 'RESUME' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-red-600 hover:bg-red-500'}>
            {action === 'RESUME' ? 'Resume Susu' : 'Refund & Close'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DetailDialog({ susuId, open, onOpenChange, onResolve, onMember }) {
  const { data: susu, isLoading } = useSusuDetail(open ? susuId : null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PiggyBank className="w-4 h-4 text-emerald-400" />
            {susu?.groupChat?.name || 'Susu'} detail
          </DialogTitle>
        </DialogHeader>

        {isLoading && <p className="text-slate-500 text-sm py-6 text-center">Loading…</p>}

        {susu && (
          <div className="space-y-5">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={`${STATUS_STYLES[susu.status]} border-0`}>{susu.status}</Badge>
              <span className="text-sm text-slate-400">${Number(susu.contributionUsdc).toFixed(2)} / {susu.frequency.toLowerCase()}</span>
              <span className="text-sm text-slate-500">· pool ${Number(susu.projectedPool).toFixed(2)}</span>
              <span className="text-sm text-slate-500">· {susu.totalCycles} cycles</span>
            </div>

            {susu.status === 'FROZEN_DISPUTE' && (
              <div className="flex items-center justify-between bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <div className="flex items-center gap-2 text-sm text-red-300">
                  <Snowflake className="w-4 h-4" /> Frozen: {susu.frozenReason} · {fmtDate(susu.frozenAt)}
                </div>
                <Button size="sm" onClick={() => onResolve(susu)} className="bg-red-600 hover:bg-red-500 h-8">Resolve</Button>
              </div>
            )}

            {/* Members */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-2">
                <Users className="w-3.5 h-3.5" /> Members ({susu.members.length})
              </h4>
              <div className="space-y-1.5">
                {susu.members.map((m) => (
                  <button key={m.susuMemberId} onClick={() => onMember(m.userId)}
                    className="w-full flex items-center justify-between bg-slate-800/40 hover:bg-slate-800 rounded-lg px-3 py-2 text-sm transition-colors">
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge className="bg-slate-700 text-slate-300 border-0 text-[10px]">#{m.payoutSlot ?? '—'}</Badge>
                      <span className="text-slate-200 truncate">{m.displayName}</span>
                      {m.autoRetainNextCycle && <Badge className="bg-blue-500/20 text-blue-400 border-0 text-[10px]">auto-retain</Badge>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge className={`${MEMBER_STYLES[m.status]} border-0 text-[10px]`}>{m.status}</Badge>
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Cycle schedule */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-2">
                <CalendarClock className="w-3.5 h-3.5" /> Cycle Schedule ({susu.cycles.length})
              </h4>
              <div className="bg-slate-800/40 rounded-lg overflow-hidden">
                <div className="grid grid-cols-5 gap-2 px-3 py-2 border-b border-slate-700/50 text-[11px] text-slate-500 uppercase">
                  <span>#</span><span>Date</span><span>Recipient</span><span>Amount</span><span>Status</span>
                </div>
                {susu.cycles.map((c) => (
                  <div key={c.id} className="grid grid-cols-5 gap-2 px-3 py-2 border-b border-slate-700/30 last:border-0 text-xs items-center">
                    <span className="text-slate-400">{c.cycleNumber}</span>
                    <span className="text-slate-400">{fmtDate(c.collectionDate)}</span>
                    <span className="text-slate-400">#{c.payoutUserId}</span>
                    <span className="text-slate-300">${Number(c.payoutAmount).toFixed(2)}</span>
                    <span>
                      <Badge className={`${CYCLE_STYLES[c.status]} border-0 text-[10px]`}>
                        {c.status === 'COLLECTING_GRACE' ? 'GRACE 24H' : c.status}
                      </Badge>
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Incidents */}
            {susu.warRoomAlerts?.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wide flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5" /> Incidents ({susu.warRoomAlerts.length})
                </h4>
                <div className="space-y-1.5">
                  {susu.warRoomAlerts.map((a) => (
                    <div key={a.id} className="flex items-center justify-between bg-slate-800/40 rounded-lg px-3 py-2 text-xs">
                      <span className="text-slate-300">{a.alertType.replace(/_/g, ' ')}</span>
                      <div className="flex items-center gap-2">
                        {a.resolution
                          ? <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-[10px]">{a.resolution}</Badge>
                          : a.acknowledgedAt
                            ? <Badge className="bg-amber-500/20 text-amber-400 border-0 text-[10px]">ACK</Badge>
                            : <Badge className="bg-red-500/20 text-red-400 border-0 text-[10px]">OPEN</Badge>}
                        <span className="text-slate-500">{fmtDate(a.createdAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default function SusuGroups() {
  const [filter, setFilter] = useState('ALL');
  const { data: susus = [], isLoading, refetch } = useSusuList(filter === 'ALL' ? undefined : filter);
  const [detailId, setDetailId] = useState(null);
  const [resolveSusu, setResolveSusu] = useState(null);
  const [memberId, setMemberId] = useState(null);

  const frozenCount = susus.filter((s) => s.frozen).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
            <PiggyBank className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Susu Groups Monitor</h1>
            <p className="text-sm text-slate-400">
              {susus.length} groups{frozenCount > 0 && <span className="text-red-400"> · {frozenCount} frozen</span>}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="border-slate-700 text-slate-300 hover:bg-slate-800">
          <RefreshCw className="w-3.5 h-3.5 mr-2" /> Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-1.5 flex-wrap">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${filter === f ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400' : 'border-slate-700 text-slate-400 hover:border-slate-600'}`}>
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="grid grid-cols-12 gap-3 px-4 py-2.5 border-b border-slate-800 text-[11px] text-slate-500 uppercase">
          <span className="col-span-3">Group</span>
          <span className="col-span-2">Status</span>
          <span className="col-span-2">Contribution</span>
          <span className="col-span-2">Members</span>
          <span className="col-span-2">Next Cycle</span>
          <span className="col-span-1 text-right">View</span>
        </div>
        {isLoading && <p className="text-slate-500 text-sm text-center py-8">Loading…</p>}
        {susus.map((s) => (
          <div key={s.id} className="grid grid-cols-12 gap-3 px-4 py-3 border-b border-slate-800/50 last:border-0 text-sm hover:bg-slate-800/30 transition-colors items-center">
            <div className="col-span-3 min-w-0">
              <p className="text-slate-200 truncate font-medium">{s.name}</p>
              <p className="text-[11px] text-slate-500">created {fmtDate(s.createdAt)}</p>
            </div>
            <div className="col-span-2 flex items-center gap-1.5">
              <Badge className={`${STATUS_STYLES[s.status]} border-0 text-xs`}>{s.status === 'FROZEN_DISPUTE' ? 'FROZEN' : s.status}</Badge>
              {s.frozen && <Snowflake className="w-3.5 h-3.5 text-red-400" />}
            </div>
            <div className="col-span-2">
              <span className="text-slate-300">${Number(s.contributionUsdc).toFixed(2)}</span>
              <span className="text-[11px] text-slate-500"> /{s.frequency.toLowerCase()}</span>
            </div>
            <div className="col-span-2 text-slate-300">
              {s.activeMembers}/{s.memberCount}
              {s.defaultedMembers > 0 && <span className="text-red-400 text-xs"> · {s.defaultedMembers} def</span>}
            </div>
            <div className="col-span-2 text-xs text-slate-400">
              {s.nextCycle
                ? <>#{s.nextCycle.cycleNumber} · {fmtDate(s.nextCycle.collectionDate)}{s.nextCycle.status === 'COLLECTING_GRACE' && <span className="text-red-400"> (grace)</span>}</>
                : '—'}
            </div>
            <div className="col-span-1 flex justify-end gap-1.5">
              {s.frozen && (
                <Button size="sm" variant="ghost" onClick={() => setResolveSusu(s)} className="h-7 px-2 text-red-400 hover:bg-red-500/10">
                  <Snowflake className="w-3.5 h-3.5" />
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={() => setDetailId(s.id)} className="h-7 px-2 text-slate-400 hover:bg-slate-700">
                <Eye className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}
        {!isLoading && susus.length === 0 && (
          <p className="text-slate-500 text-sm text-center py-10">No Susu groups for this filter</p>
        )}
      </div>

      <DetailDialog
        susuId={detailId}
        open={!!detailId}
        onOpenChange={(o) => !o && setDetailId(null)}
        onResolve={(s) => { setDetailId(null); setResolveSusu(s); }}
        onMember={(uid) => setMemberId(uid)}
      />
      {resolveSusu && (
        <ResolveDialog susu={resolveSusu} open={!!resolveSusu} onOpenChange={(o) => !o && setResolveSusu(null)} />
      )}
      <MemberDetailDialog userId={memberId} open={!!memberId} onOpenChange={(o) => !o && setMemberId(null)} />
    </div>
  );
}
