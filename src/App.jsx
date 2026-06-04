import { Toaster } from "@/components/ui/sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import AdminLayout from '@/components/admin/Layout';
import Dashboard from '@/pages/Dashboard';
import Profits from '@/pages/Profits';
import Pools from '@/pages/Pools';
import FeeEngine from '@/pages/FeeEngine';
import FeeProfiles from '@/pages/FeeProfiles';
import WarRoom from '@/pages/WarRoom';
import Users from '@/pages/Users';
import Withdrawals from '@/pages/Withdrawals';
import AuditLog from '@/pages/AuditLog';
import Config from '@/pages/Config';
import AiOps from '@/pages/AiOps';
import SusuGroups from '@/pages/SusuGroups';
import SusuIncidents from '@/pages/SusuIncidents';
import ResidencyQueue from '@/pages/ResidencyQueue';
import Login from '@/pages/Login';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isAuthenticated, authError } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-slate-700 border-t-emerald-400 rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-slate-400 mt-4">Verifying credentials...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/profits" element={<Profits />} />
        <Route path="/pools" element={<Pools />} />
        <Route path="/fee-engine" element={<FeeEngine />} />
        <Route path="/fee-profiles" element={<FeeProfiles />} />
        <Route path="/war-room" element={<WarRoom />} />
        <Route path="/susu" element={<SusuGroups />} />
        <Route path="/susu-incidents" element={<SusuIncidents />} />
        <Route path="/residency-queue" element={<ResidencyQueue />} />
        <Route path="/users" element={<Users />} />
        <Route path="/withdrawals" element={<Withdrawals />} />
        <Route path="/audit-log" element={<AuditLog />} />
        <Route path="/config" element={<Config />} />
        <Route path="/ai-ops" element={<AiOps />} />
      </Route>
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster richColors position="top-right" />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
