/**
 * Central API layer for the Admin Dashboard.
 * Update BASE_URL to point to your backend.
 * All functions return the response data directly or throw on error.
 */

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function request(path, options = {}) {
  const token = localStorage.getItem('admin_token');
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'Request failed');
  }
  return res.json();
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export const auth = {
  login: (email, password) =>
    request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: () => request('/api/auth/logout', { method: 'POST' }),
};

// ── Admin Stats & Health ──────────────────────────────────────────────────────
export const admin = {
  stats: () => request('/api/admin/stats'),
  systemHealth: () => request('/api/admin/system-health'),
  profitBreakdown: () => request('/api/admin/profit-breakdown'),
};

// ── Global Settings (Financial Parameters) ───────────────────────────────────
export const settings = {
  get: () => request('/api/admin/settings'),
  update: (data) => request('/api/admin/settings', { method: 'PUT', body: JSON.stringify(data) }),
};

// ── Fee Profiles ──────────────────────────────────────────────────────────────
export const feeProfiles = {
  list: () => request('/api/admin/fee-profiles'),
  create: (data) => request('/api/admin/fee-profiles', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data) => request(`/api/admin/fee-profiles/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id) => request(`/api/admin/fee-profiles/${id}`, { method: 'DELETE' }),
  resolve: (context) => request(`/api/admin/fee-profiles/resolve?${new URLSearchParams(context)}`),
};

// ── Trades ────────────────────────────────────────────────────────────────────
export const trades = {
  live: (page = 1) => request(`/api/admin/trades/live?page=${page}`),
  disputes: (page = 1) => request(`/api/admin/disputes?page=${page}`),
  forceRelease: (tradeId, reason) =>
    request('/api/admin/disputes/force-release', { method: 'POST', body: JSON.stringify({ tradeId, reason }) }),
  forceCancel: (tradeId, reason) =>
    request('/api/admin/disputes/force-cancel', { method: 'POST', body: JSON.stringify({ tradeId, reason }) }),
  resolve: (tradeId, ruling, reason, buyerPercent) =>
    request(`/api/admin/disputes/${tradeId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ ruling, reason, buyerPercent }),
    }),
  resolutions: () => request('/api/admin/disputes/resolutions'),
  injectMessage: (tradeId, message) =>
    request('/api/admin/chat/inject', { method: 'POST', body: JSON.stringify({ tradeId, message }) }),
};

// ── Users ─────────────────────────────────────────────────────────────────────
export const users = {
  list: (page = 1, search = '') => request(`/api/admin/users?page=${page}&search=${search}`),
  ban: (id, duration) =>
    request(`/api/admin/users/${id}/ban`, { method: 'POST', body: JSON.stringify({ duration }) }),
  changeRole: (id, role) =>
    request(`/api/admin/users/${id}/role`, { method: 'POST', body: JSON.stringify({ role }) }),
  setRiskTier: (id, tier) =>
    request(`/api/admin/users/${id}/risk-tier`, { method: 'POST', body: JSON.stringify({ tier }) }),
  credit: (id, amount) =>
    request(`/api/admin/users/${id}/credit`, { method: 'POST', body: JSON.stringify({ amount, reason: 'Admin credit via portal' }) }),
};

// ── KYC ───────────────────────────────────────────────────────────────────────
export const kyc = {
  pending: () => request('/api/admin/kyc/pending'),
  approve: (id) => request('/api/admin/kyc/approve', { method: 'POST', body: JSON.stringify({ id }) }),
  reject: (id, reason) =>
    request('/api/admin/kyc/reject', { method: 'POST', body: JSON.stringify({ id, reason }) }),
};

// ── Withdrawals ───────────────────────────────────────────────────────────────
export const withdrawals = {
  pending: () => request('/api/admin/withdrawals/pending'),
  approve: (id) => request(`/api/admin/withdrawals/${id}/approve`, { method: 'POST' }),
  reject: (id, reason) =>
    request(`/api/admin/withdrawals/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
  needsReview: () => request('/api/admin/payouts/needs-review'),
};

// ── Payout Settings ───────────────────────────────────────────────────────────
export const payouts = {
  getSettings: () => request('/api/admin/payouts/settings'),
  updateSettings: (data) =>
    request('/api/admin/payouts/settings', { method: 'PUT', body: JSON.stringify(data) }),
  batchProcess: () => request('/api/admin/payouts/batch-process', { method: 'POST' }),
};

// ── Vendors ───────────────────────────────────────────────────────────────────
export const vendors = {
  applications: (status = 'PENDING') => request(`/api/vendor/applications?status=${status}`),
  review: (id, action, reason) =>
    request(`/api/vendor/applications/${id}/review`, {
      method: 'POST',
      body: JSON.stringify({ action, reason }),
    }),
};

// ── Trade Accounts ────────────────────────────────────────────────────────────
export const tradeAccounts = {
  pending: () => request('/api/admin/trade-accounts/pending'),
  approve: (id) => request(`/api/admin/trade-accounts/${id}/approve`, { method: 'POST' }),
  reject: (id, reason) =>
    request(`/api/admin/trade-accounts/${id}/reject`, { method: 'POST', body: JSON.stringify({ reason }) }),
};

// ── War Room ──────────────────────────────────────────────────────────────────
export const warRoom = {
  corporatePurchase: (data) =>
    request('/api/war-room/corporate-purchase', { method: 'POST', body: JSON.stringify(data) }),
  liquidateProfits: (data) =>
    request('/api/war-room/liquidate-profits', { method: 'POST', body: JSON.stringify(data) }),
  coldStorage: (data) =>
    request('/api/war-room/cold-storage', { method: 'POST', body: JSON.stringify(data) }),
};

// ── Susu Incidents (War Room alerts feed) ─────────────────────────────────────
export const susuIncidents = {
  // acknowledged: undefined = all, false = open only, true = resolved
  alerts: (acknowledged) => {
    const qs = acknowledged === undefined ? '' : `?acknowledged=${acknowledged}`;
    return request(`/api/admin/war-room/alerts${qs}`);
  },
  acknowledge: (id) =>
    request(`/api/admin/war-room/alerts/${id}/acknowledge`, { method: 'POST' }),
};

// ── Private Susu Ecosystem — Admin Monitor (Phase 5 / Workstream E) ───────────
export const susuAdmin = {
  list: (status) =>
    request(`/api/admin/susu${status ? `?status=${status}` : ''}`),
  detail: (id) => request(`/api/admin/susu/${id}`),
  member: (userId) => request(`/api/admin/susu/members/${userId}`),
  // action: 'RESUME' | 'REFUND_AND_CLOSE'
  resolve: (id, action, notes, alertId) =>
    request(`/api/admin/susu/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ action, notes, alertId }),
    }),
};

// ── Proof of Residency Review Queue (Phase 5 / Workstream A) ──────────────────
export const proofOfResidency = {
  queue: () => request('/api/admin/proof-of-residency/queue'),
  approve: (userId) =>
    request(`/api/admin/proof-of-residency/${userId}/review`, {
      method: 'POST',
      body: JSON.stringify({ decision: 'approve' }),
    }),
  reject: (userId, reason) =>
    request(`/api/admin/proof-of-residency/${userId}/review`, {
      method: 'POST',
      body: JSON.stringify({ decision: 'reject', reason }),
    }),
};

// ── Version Gate ──────────────────────────────────────────────────────────────
export const versionGate = {
  get: () => request('/api/admin/version-gate'),
  update: (data) =>
    request('/api/admin/version-gate', { method: 'PUT', body: JSON.stringify(data) }),
};

// ── Audit Log ─────────────────────────────────────────────────────────────────
export const auditLog = {
  list: (page = 1, filters = {}) =>
    request(`/api/admin/audit-log?page=${page}&${new URLSearchParams(filters)}`),
};

// ── AI Operations ─────────────────────────────────────────────────────────────
export const aiOps = {
  cfoInsights: () => request('/api/admin/ai/cfo-insights'),
  discountCandidates: () => request('/api/admin/ai/discount-candidates'),
  approveDiscount: (userId, amount, duration) =>
    request('/api/admin/ai/approve-discount', {
      method: 'POST',
      body: JSON.stringify({ userId, amount, duration }),
    }),
};

export default {
  auth, admin, settings, feeProfiles, trades, users, kyc, withdrawals,
  payouts, vendors, tradeAccounts, warRoom, susuIncidents, susuAdmin,
  proofOfResidency, versionGate, auditLog, aiOps,
};