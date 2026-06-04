import { useState } from 'react';
import { useUsers } from '@/lib/useAdminData';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, ShieldCheck, ShieldX, UserX, UserCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

const KYC_COLORS = { VERIFIED: 'bg-emerald-500/20 text-emerald-400', PENDING: 'bg-amber-500/20 text-amber-400', REJECTED: 'bg-red-500/20 text-red-400', NONE: 'bg-slate-500/20 text-slate-400' };
const RISK_COLORS = { STANDARD: 'bg-slate-500/20 text-slate-400', TRUSTED: 'bg-emerald-500/20 text-emerald-400', HIGH_RISK: 'bg-red-500/20 text-red-400' };

function KYCPanel({ userId }) {
  const { data, isLoading } = useQuery({ queryKey: ['kyc', 'pending'], queryFn: () => api.kyc.pending() });
  const pending = data?.applications || data || [];
  const qc = useQueryClient();
  const approve = useMutation({ mutationFn: (id) => api.kyc.approve(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ['kyc'] }); toast.success('KYC approved'); } });
  const reject = useMutation({ mutationFn: ({ id, reason }) => api.kyc.reject(id, reason), onSuccess: () => { qc.invalidateQueries({ queryKey: ['kyc'] }); toast.success('KYC rejected'); } });

  return (
    <div className="space-y-3">
      {isLoading && <p className="text-slate-500 text-sm">Loading…</p>}
      {pending.map((k) => (
        <div key={k.id} className="bg-slate-800 rounded-xl p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-white">{k.userName || k.userId}</p>
            <p className="text-xs text-slate-400 mt-0.5">{k.email} · Submitted {new Date(k.submittedAt).toLocaleDateString()}</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => approve.mutate(k.id)} className="bg-emerald-600 hover:bg-emerald-500 text-white h-8">
              <ShieldCheck className="w-3.5 h-3.5 mr-1.5" /> Approve
            </Button>
            <Button size="sm" variant="outline" onClick={() => { const r = prompt('Reason for rejection?'); if (r) reject.mutate({ id: k.id, reason: r }); }} className="border-red-500/50 text-red-400 hover:bg-red-500/10 h-8">
              <ShieldX className="w-3.5 h-3.5 mr-1.5" /> Reject
            </Button>
          </div>
        </div>
      ))}
      {!isLoading && pending.length === 0 && <p className="text-slate-500 text-sm text-center py-6">No pending KYC applications</p>}
    </div>
  );
}

export default function Users() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('users');
  const { data = {}, isLoading } = useUsers(page, search);
  const { users = [], total = 0 } = data;
  const qc = useQueryClient();

  const banUser = useMutation({
    mutationFn: ({ id, duration }) => api.users.ban(id, duration),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'users'] }); toast.success('User banned'); },
  });
  const changeRole = useMutation({
    mutationFn: ({ id, role }) => api.users.changeRole(id, role),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'users'] }); toast.success('Role updated'); },
  });
  const setRisk = useMutation({
    mutationFn: ({ id, tier }) => api.users.setRiskTier(id, tier),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'users'] }); toast.success('Risk tier updated'); },
  });
  const creditUser = useMutation({
    mutationFn: ({ id, amount }) => api.users.credit(id, amount),
    onSuccess: (data) => { qc.invalidateQueries({ queryKey: ['admin', 'users'] }); toast.success(data.message || 'Balance credited'); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Users and KYC</h1>
        <p className="text-sm text-slate-400 mt-1">{total} total users</p>
      </div>

      <div className="flex gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1 w-fit">
        {['users', 'kyc', 'vendors', 'trade-accounts'].map((t) => (
          <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-1.5 rounded-lg text-sm capitalize transition-colors ${activeTab === t ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
            {t === 'kyc' ? 'Pending KYC' : t === 'trade-accounts' ? 'Trade Accounts' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'kyc' && <KYCPanel />}

      {activeTab === 'vendors' && <VendorPanel />}

      {activeTab === 'trade-accounts' && <TradeAccountsPanel />}

      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-9 bg-slate-900 border-slate-800 text-white"
            />
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="grid grid-cols-6 gap-3 px-4 py-2.5 border-b border-slate-800 text-xs text-slate-500 uppercase tracking-wide">
              <span className="col-span-2">User</span><span>Role</span><span>KYC</span><span>Risk Tier</span><span>Actions</span>
            </div>
            {isLoading && <p className="text-slate-500 text-sm text-center py-8">Loading…</p>}
            {users.map((u) => (
              <div key={u.id} className="grid grid-cols-6 gap-3 px-4 py-3 border-b border-slate-800/50 last:border-0 items-center hover:bg-slate-800/20 transition-colors">
                <div className="col-span-2">
                  <p className="text-sm font-medium text-white">{u.fullName}</p>
                  <p className="text-xs text-slate-500">{u.email}</p>
                </div>
                <span className="text-xs text-slate-300">{u.role}</span>
                <Badge className={`${KYC_COLORS[u.kycStatus] || KYC_COLORS.NONE} border-0 text-xs w-fit`}>{u.kycStatus || 'NONE'}</Badge>
                <select
                  value={u.riskTier || 'STANDARD'}
                  onChange={(e) => setRisk.mutate({ id: u.id, tier: e.target.value })}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                >
                  <option value="STANDARD">Standard</option>
                  <option value="TRUSTED">Trusted</option>
                  <option value="HIGH_RISK">High Risk</option>
                </select>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => { const amt = prompt('Credit USDC amount:'); if (amt && !isNaN(amt)) creditUser.mutate({ id: u.id, amount: parseFloat(amt) }); }} className="h-7 px-2 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10">
                    $+
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { const r = prompt('Change role to (USER/VENDOR/ADMIN)?'); if (r) changeRole.mutate({ id: u.id, role: r.toUpperCase() }); }} className="h-7 px-2 text-xs text-slate-400 hover:text-white hover:bg-slate-700">
                    Role
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { const d = prompt('Ban duration: 24h, 1w, permanent?'); if (d) banUser.mutate({ id: u.id, duration: d }); }} className="h-7 px-2 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10">
                    <UserX className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Showing {users.length} of {total}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)} className="border-slate-700 text-slate-300 h-8">
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} className="border-slate-700 text-slate-300 h-8">
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function VendorPanel() {
  const { data, isLoading } = useQuery({ queryKey: ['vendor', 'apps'], queryFn: () => api.vendors.applications() });
  const apps = data?.applications || data || [];
  const qc = useQueryClient();
  const review = useMutation({
    mutationFn: ({ id, action, reason }) => api.vendors.review(id, action, reason),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vendor'] }); toast.success('Application reviewed'); },
  });

  return (
    <div className="space-y-3">
      {isLoading && <p className="text-slate-500 text-sm">Loading…</p>}
      {apps.map((a) => (
        <div key={a.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-white">{a.userName}</p>
            <p className="text-xs text-slate-400">{a.email} · Applied {new Date(a.createdAt).toLocaleDateString()}</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => review.mutate({ id: a.id, action: 'APPROVE', reason: '' })} className="bg-emerald-600 hover:bg-emerald-500 text-white h-8">
              <UserCheck className="w-3.5 h-3.5 mr-1.5" /> Approve
            </Button>
            <Button size="sm" variant="outline" onClick={() => { const r = prompt('Reason for rejection?'); if (r) review.mutate({ id: a.id, action: 'REJECT', reason: r }); }} className="border-red-500/50 text-red-400 hover:bg-red-500/10 h-8">
              Reject
            </Button>
          </div>
        </div>
      ))}
      {!isLoading && apps.length === 0 && <p className="text-slate-500 text-sm text-center py-6">No pending vendor applications</p>}
    </div>
  );
}


function TradeAccountsPanel() {
  const { data, isLoading } = useQuery({ queryKey: ['admin', 'trade-accounts'], queryFn: () => api.tradeAccounts.pending() });
  const accounts = data?.accounts || [];
  const qc = useQueryClient();
  const approve = useMutation({
    mutationFn: (id) => api.tradeAccounts.approve(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'trade-accounts'] }); toast.success('Trade account approved — vendor notified'); },
  });
  const reject = useMutation({
    mutationFn: ({ id, reason }) => api.tradeAccounts.reject(id, reason),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'trade-accounts'] }); toast.success('Trade account rejected — vendor notified'); },
  });

  return (
    <div className="space-y-3">
      {isLoading && <p className="text-slate-500 text-sm">Loading…</p>}
      {accounts.map((a) => (
        <div key={a.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">{a.user?.username || 'Unknown'}</p>
              <p className="text-xs text-slate-400">{a.methodType} · Submitted {new Date(a.createdAt).toLocaleDateString()}</p>
            </div>
            <Badge className="bg-amber-500/20 text-amber-400 border-0 text-xs">PENDING</Badge>
          </div>
          <div className="bg-slate-800 rounded-lg p-3 text-xs space-y-1">
            {a.accountDetails && Object.entries(a.accountDetails).map(([key, val]) => (
              <div key={key} className="flex justify-between">
                <span className="text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                <span className="text-white">{String(val)}</span>
              </div>
            ))}
          </div>
          {a.verificationScreenshot && (
            <a href={a.verificationScreenshot} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline">
              View verification screenshot →
            </a>
          )}
          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={() => approve.mutate(a.id)} className="bg-emerald-600 hover:bg-emerald-500 text-white h-8">
              Approve
            </Button>
            <Button size="sm" variant="outline" onClick={() => { const r = prompt('Reason for rejection?'); if (r) reject.mutate({ id: a.id, reason: r }); }} className="border-red-500/50 text-red-400 hover:bg-red-500/10 h-8">
              Reject
            </Button>
          </div>
        </div>
      ))}
      {!isLoading && accounts.length === 0 && <p className="text-slate-500 text-sm text-center py-6">No pending trade accounts to review</p>}
    </div>
  );
}
