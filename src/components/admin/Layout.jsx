import { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import {
  LayoutDashboard, Swords, Users, TrendingUp, Wallet,
  Sliders, FileText, Shield, ChevronLeft, ChevronRight,
  Bell, Settings, LogOut, Database, Zap, Bot,
  PiggyBank, Siren, Home
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV = [
  { label: 'Command Center', icon: LayoutDashboard, to: '/' },
  { label: 'War Room', icon: Swords, to: '/war-room', badge: 'disputes' },
  { label: 'Susu Groups', icon: PiggyBank, to: '/susu' },
  { label: 'Susu Incidents', icon: Siren, to: '/susu-incidents' },
  { label: 'Residency Queue', icon: Home, to: '/residency-queue' },
  { label: 'Revenue', icon: TrendingUp, to: '/profits' },
  { label: 'Pool Monitor', icon: Database, to: '/pools' },
  { label: 'Users & KYC', icon: Users, to: '/users', badge: 'kyc' },
  { label: 'Withdrawals', icon: Wallet, to: '/withdrawals', badge: 'withdrawals' },
  { label: 'Fee Engine', icon: Sliders, to: '/fee-engine' },
  { label: 'Fee Profiles', icon: Zap, to: '/fee-profiles' },
  { label: 'AI Operations', icon: Bot, to: '/ai-ops' },
  { label: 'Audit Log', icon: FileText, to: '/audit-log' },
  { label: 'System Config', icon: Settings, to: '/config' },
];

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside className={cn(
        'flex flex-col border-r border-slate-800 transition-all duration-300',
        collapsed ? 'w-16' : 'w-60'
      )}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 h-16 border-b border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0">
            <Shield className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div>
              <p className="text-sm font-bold text-white leading-none">Admin Portal</p>
              <p className="text-xs text-emerald-400 mt-0.5">Control Center</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {NAV.map(({ label, icon: Icon, to }) => {
            const active = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg transition-colors relative group',
                  active
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {!collapsed && <span className="text-sm font-medium">{label}</span>}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50">
                    {label}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Collapse toggle */}
        <div className="border-t border-slate-800 p-3">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-slate-800 text-slate-400 transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {!collapsed && <span className="text-xs">Collapse</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/50">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-slate-400">System Online</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-800 rounded-lg px-3 py-1.5">
              <span className="text-xs text-slate-400">GHS/USD</span>
              <span className="text-xs font-bold text-emerald-400">12.50</span>
            </div>
            <button className="relative p-2 rounded-lg hover:bg-slate-800 transition-colors">
              <Bell className="w-4 h-4 text-slate-400" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors">
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <span className="text-xs text-emerald-400 font-bold">A</span>
              </div>
              {!collapsed && <span className="text-sm text-slate-300">Admin</span>}
            </button>
            <button
              onClick={() => { localStorage.removeItem('admin_token'); window.location.href = '/login'; }}
              className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <LogOut className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-slate-950 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}