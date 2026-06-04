/**
 * Mock data for UI development. Replace API calls with real endpoints.
 * All values mirror your actual data shapes from the backend.
 */

export const mockStats = {
  totalUsers: 1247,
  activeVendors: 89,
  pendingKYC: 14,
  liveTrades: 23,
  disputes: 5,
  pendingWithdrawals: 8,
  fiatVolume24h: 48200,
  cryptoVolume24h: 12400,
  totalProfit: 94320,
  ghsRate: 12.5,
};

export const mockSystemHealth = {
  pools: {
    masterCrypto: { balance: 85420, currency: 'USDC', status: 'HEALTHY' },
    hotWallet: { balance: 12300, currency: 'USDC', status: 'HEALTHY' },
    fiatPool: { balance: 245000, currency: 'GHS', status: 'WARNING' },
    profitFees: { balance: 9420, currency: 'USD', status: 'HEALTHY' },
  },
  oracle: {
    usdToGhs: 12.5,
    retailRate: 12.8,
    corporateRate: 12.2,
    source: 'MOCK',
    lastSync: new Date().toISOString(),
  },
  engine: {
    online: true,
    nodeVersion: 'v18.17.0',
    uptime: '14d 6h 32m',
    memoryMB: 312,
  },
};

export const mockGlobalSettings = {
  p2pFeePct: 0.02,
  bankMargin: 0.03,
  thirdPartyMargin: 0.02,
  vendorShareUnder1k: 0.40,
  vendorShareOver1k: 0.50,
  tierThreshold: 1000,
  baseExitFeePct: 0.02,
  cryptoPlatformFeePct: 0.00,
  fiatWithdrawalFeePct: 0.02,
  cryptoWithdrawalFeePct: 0.01,
};

export const mockFeeProfiles = [
  {
    id: 1, name: 'Global Default', targetScope: 'ALL', targetValue: null,
    platformFeePct: 0.02, adminSplitPct: 0.60, vendorSplitPct: 0.40,
    exitFeePct: 0.02, priority: 0, isActive: true,
    validFrom: null, validUntil: null,
  },
  {
    id: 2, name: 'High Value Trades', targetScope: 'ALL', targetValue: null,
    platformFeePct: 0.015, adminSplitPct: 0.50, vendorSplitPct: 0.50,
    exitFeePct: 0.02, priority: 10, isActive: true,
    validFrom: null, validUntil: null,
  },
];

export const mockProfitBreakdown = {
  totalProfit30d: 94320,
  avgDailyRevenue: 3144,
  totalTransactions30d: 1823,
  dailyPnL: Array.from({ length: 30 }, (_, i) => ({
    date: new Date(Date.now() - (29 - i) * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    usd: Math.floor(Math.random() * 4000 + 1500),
    ghs: Math.floor(Math.random() * 50000 + 18000),
  })),
  bySource: [
    { source: 'P2P_MARGIN', usd: 52400, ghs: 655000 },
    { source: 'EXIT_FEE', usd: 28100, ghs: 351250 },
    { source: 'GAS_FEE_REVENUE', usd: 9200, ghs: 115000 },
    { source: 'ARBITRAGE_SPREAD', usd: 4620, ghs: 57750 },
  ],
};

export const mockUsers = [
  { id: 'u1', fullName: 'Kwame Asante', email: 'kwame@example.com', role: 'VENDOR', kycStatus: 'VERIFIED', riskTier: 'STANDARD', tradeCount: 42, joinedAt: '2024-03-12' },
  { id: 'u2', fullName: 'Ama Owusu', email: 'ama@example.com', role: 'USER', kycStatus: 'PENDING', riskTier: 'STANDARD', tradeCount: 3, joinedAt: '2024-05-01' },
  { id: 'u3', fullName: 'Kofi Mensah', email: 'kofi@example.com', role: 'USER', kycStatus: 'VERIFIED', riskTier: 'HIGH_RISK', tradeCount: 17, joinedAt: '2024-01-20' },
];

export const mockDisputes = [
  {
    id: 'tr_abc123', amount: 450, currency: 'USD', status: 'DISPUTED',
    buyer: { name: 'Kwame Asante', email: 'kwame@example.com' },
    vendor: { name: 'Ama Owusu', email: 'ama@example.com' },
    paymentMethod: 'CashApp', createdAt: new Date(Date.now() - 3600000).toISOString(),
    messages: [
      { sender: 'buyer', text: 'I sent the payment but vendor is not releasing', time: '10:22 AM' },
      { sender: 'vendor', text: 'I did not receive the payment', time: '10:35 AM' },
    ],
  },
];

export const mockWithdrawals = [
  { id: 'wd_1', userId: 'u2', userName: 'Ama Owusu', amount: 200, currency: 'USD', type: 'FIAT', method: 'MTN_MOMO', status: 'PENDING', requestedAt: new Date().toISOString() },
  { id: 'wd_2', userId: 'u3', userName: 'Kofi Mensah', amount: 50, currency: 'USDC', type: 'CRYPTO', wallet: '0xabc...def', status: 'PENDING', requestedAt: new Date().toISOString() },
];