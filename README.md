# Azaman Admin Portal

React 18 web dashboard for Azaman platform operations.

## Stack

- **Framework**: React 18, Vite 6
- **State / Data**: Tanstack Query 5 (React Query)
- **UI**: Tailwind CSS 3 + Radix UI + shadcn/ui + Lucide icons
- **Real-time**: Socket.io-client 4.8 (admin spy room alerts)
- **Forms**: react-hook-form + Zod
- **Charts**: Recharts

## Getting Started

```bash
npm install
cp .env.example .env.local   # or create manually
npm run dev
```

### Required Environment Variable

```
VITE_API_URL=http://localhost:3000   # Backend base URL
```

## Features

| Section | Description |
|---|---|
| **Command Center** | Live platform stats: users, trades, volume, revenue |
| **War Room** | Active disputes, force-release/cancel, dispute resolution |
| **Susu Groups** | Private savings circles — monitor, resolve incidents |
| **Susu Incidents** | War-room alerts from the Susu cycle engine |
| **Residency Queue** | Proof-of-residency document review |
| **Notifications** | Unified notification center — all "needs attention" sources |
| **Revenue** | Profit breakdown by source (P2P fees, gas, withdrawal fees, Susu) |
| **Pool Monitor** | System fiat pool, hot wallet, cold storage levels |
| **Users & KYC** | User management, KYC approval/rejection, vendor applications |
| **Withdrawals** | Pending withdrawals queue + manual review (NEEDS_REVIEW payouts) |
| **Fee Engine** | Platform-wide fee parameters (platform fee %, admin/vendor split) |
| **Fee Profiles** | Scoped fee overrides (holiday promos, influencer codes, vendor tiers) |
| **AI Operations** | AI CFO insights, discount candidates |
| **Audit Log** | Full admin action audit trail |
| **System Config** | GlobalSettings management, KYC provider, payout settings, Susu fee |

## Notification Center

The bell icon in the topbar opens a live-aggregated notification feed. There is no persisted admin-notification table — the feed is derived in real time from the live data endpoints (pending withdrawals, disputes, Susu incidents, KYC queue, vendor applications, PoR queue, low system pools). Read/unread state is tracked per-admin in `localStorage`.

## Auth

Login via `POST /api/auth/login`. The JWT is stored in `localStorage` as `admin_token`. On 401, the portal automatically clears the token and redirects to `/login`. Access tokens are short-lived (15 min); the portal currently doesn't implement silent refresh — if the session expires, users are bounced to login.

## Build

```bash
npm run build    # outputs to dist/
npm run preview  # preview the production build locally
```
