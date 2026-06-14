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
| 🔐 **OAuth Login** | Sign in with Google — no passwords to manage |
| 💰 **Mutual Credit Wallet** | Zero-balance start, ₱500 credit limit, real-time balance display |
| 💸 **P2P Transfers** | Send Podcoin to any community member instantly |
| 📱 **QR Payments** | Generate your personal QR code to receive; scan to pay |
| 🗺️ **Community Directory** | Searchable directory of neighbors, their services, and Podcoin prices |
| 🛠️ **Service Listings** | List services you offer with title, description, price (₱), and category |
| 📊 **Transaction History** | Full ledger of all your transfers |

## Tech Stack

- **[Next.js 15](https://nextjs.org/)** (App Router) — deployable to Cloudflare Pages
- **[NextAuth.js v5](https://authjs.dev/)** — OAuth via Google
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

Then edit `.env.local`:

```env
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
NEXTAUTH_SECRET=generate_with_openssl_rand_base64_32
NEXTAUTH_URL=http://localhost:3000
```

**Creating a Google OAuth App:**
[console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials → OAuth 2.0. Set the callback URL to `http://localhost:3000/api/auth/callback/google`.

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

## Deployment (Cloudflare Pages — Git Integration)

The app auto-deploys to Cloudflare Pages from GitHub on every push to `main`. The build command (`npm run build:worker`) runs in the Cloudflare Pages pipeline.

### Required: Set Environment Variables in Cloudflare Dashboard

Cloudflare Pages does **not** read `wrangler.toml` `[vars]` at runtime. Environment variables **must** be configured in the Cloudflare Dashboard:

1. Go to **Cloudflare Dashboard → Pages → podcoin101 → Settings → Environment variables**
2. Add the following **Production** variables:
   - `GOOGLE_CLIENT_ID` — Your Google OAuth client ID
   - `GOOGLE_CLIENT_SECRET` — Your Google OAuth client secret
   - `NEXTAUTH_SECRET` — NextAuth secret
   - `NEXTAUTH_URL` — `https://demo.podcoin.org`
   - `AUTH_TRUST_HOST` — `true`
3. Also add the production callback URL to your **Google Cloud Console** → OAuth 2.0 credentials:
   `https://demo.podcoin.org/api/auth/callback/google`

### Database Setup (D1)

For production, the app uses Cloudflare D1 instead of `better-sqlite3`. You must bind a D1 database:

1. Create a D1 database: `npx wrangler d1 create podcoin-db`
2. Copy the database ID from the output
3. In Cloudflare Dashboard → Pages Settings → Environment variables, add:
   - `DB` — The D1 database ID (this is a binding, not a plain text variable)

The database schema is auto-created on first access.

### Database Note

For local development, you can continue using `better-sqlite3`. For production (Cloudflare Pages), replace it with [Cloudflare D1](https://developers.cloudflare.com/d1/) (SQLite-compatible) by updating `src/lib/db.ts`.

## License

See [LICENSE](./LICENSE).
