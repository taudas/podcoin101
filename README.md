# Podcoin Exchange

**Alameda's Community Currency** — a Local Exchange Trading System (LETS) built with Next.js.

![Podcoin Exchange Landing Page](https://github.com/user-attachments/assets/e8455961-2dd5-4094-9061-ab4f1ac7511e)

## Overview

Podcoin Exchange is a non-crypto, community digital currency system for Alameda, CA. It uses a **mutual credit** model: users start with a zero balance and a ₱500 credit limit, creating currency when they purchase services and earning it back when they sell.

- **Non-crypto** — centralized SQLite ledger, not blockchain
- **1:1 backed** — by voluntary mutual credit within the community
- **Purpose** — community resilience, supporting local individuals, and increasing liquidity for low-income residents

## Features

| Feature | Description |
|---|---|
| 🔐 **OAuth Login** | Sign in with GitHub or Google — no passwords to manage |
| 💰 **Mutual Credit Wallet** | Zero-balance start, ₱500 credit limit, real-time balance display |
| 💸 **P2P Transfers** | Send Podcoin to any community member instantly |
| 📱 **QR Payments** | Generate your personal QR code to receive; scan to pay |
| 🗺️ **Community Directory** | Searchable directory of neighbors, their services, and Podcoin prices |
| 🛠️ **Service Listings** | List services you offer with title, description, price (₱), and category |
| 📊 **Transaction History** | Full ledger of all your transfers |

## Tech Stack

- **[Next.js 15](https://nextjs.org/)** (App Router) — deployable to Cloudflare Pages
- **[NextAuth.js v5](https://authjs.dev/)** — OAuth via GitHub and Google
- **[better-sqlite3](https://github.com/WiseLibs/better-sqlite3)** — SQLite ledger database
- **[react-qr-code](https://github.com/rosskhanas/react-qr-code)** + **[jsqr](https://github.com/cozmo/jsQR)** — QR generation & camera scanning
- **[Tailwind CSS](https://tailwindcss.com/)** — utility-first styling

## Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/taudas/podcoin101.git
cd podcoin101
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env.local` and fill in your OAuth credentials:

```bash
cp .env.example .env.local
```

```env
GITHUB_ID=your_github_oauth_app_id
GITHUB_SECRET=your_github_oauth_app_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXTAUTH_SECRET=generate_with_openssl_rand_base64_32
NEXTAUTH_URL=http://localhost:3000
```

**Creating OAuth Apps:**
- **GitHub**: Settings → Developer settings → OAuth Apps → New. Set callback URL to `http://localhost:3000/api/auth/callback/github`
- **Google**: [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials → OAuth 2.0. Set callback URL to `http://localhost:3000/api/auth/callback/google`

Generate a secret: `openssl rand -base64 32`

### 3. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

### 4. Build for Production

```bash
npm run build
npm start
```

## Database

SQLite database (`podcoin.db`) is created automatically on first run in the project root. Schema:

- **users** — OAuth profile, balance, credit limit, neighborhood, bio
- **services** — service listings offered by each user
- **transactions** — immutable transfer ledger

## Mutual Credit Rules

- All users start with **₱0 balance**
- Maximum deficit: **-₱500** (the credit limit)
- Transfers are atomic — both balances update in a single SQLite transaction
- No fees, no interest, no blockchain

## Deployment (Cloudflare Pages)

This app uses Next.js App Router and can be deployed to Cloudflare Pages using [`@cloudflare/next-on-pages`](https://github.com/cloudflare/next-on-pages). For production, replace `better-sqlite3` with [Cloudflare D1](https://developers.cloudflare.com/d1/) (SQLite-compatible) by updating `src/lib/db.ts`.

## License

See [LICENSE](./LICENSE).
