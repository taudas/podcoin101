# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Podcoin Exchange — a community mutual credit system (LETS) for Alameda, CA. Users get a ₱500 credit limit and can transfer Podcoins peer-to-peer. No blockchain; all ledger data lives in SQLite (`podcoin.db`). Deployable to Cloudflare Workers via OpenNext.

## Commands

```bash
npm run dev           # Next.js dev server (localhost:3000)
npm run build         # Standard Next.js production build
npm run build:worker  # OpenNext/Cloudflare build (use before deploying)
npm run lint          # ESLint
npm run deploy        # build:worker + wrangler deploy
```

Setup:
```bash
npm install
cp .env.example .env.local  # Add OAuth credentials (Google)
npm run dev
```

## Architecture

**Stack:** Next.js 15 App Router · React 19 · NextAuth.js v5 · better-sqlite3 · Tailwind CSS 4 · TypeScript

**Request flow:**
1. `src/auth.ts` — NextAuth config; auto-creates a `users` row on first OAuth login
2. `src/lib/db.ts` — All SQLite queries; database is initialized here with `WAL` mode and FK enforcement; this is the single data access layer
3. `src/app/api/*` — Route handlers call `db.ts`; each folder is one resource (`balance`, `transfer`, `transactions`, `users`, `services`, `profile`, `qr`)
4. `src/app/*` — Page components (client + server); pages call their own `/api/*` routes via `fetch`
5. `src/components/Navbar.tsx` — Shared nav; fetches live balance on mount

**Database tables:** `users` (balance, credit_limit, neighborhood, bio), `transactions` (from/to/amount/note/type), `services` (user listings)

**Transfers** are atomic SQLite transactions in `src/lib/db.ts`; a sender's balance can go negative down to `-credit_limit`.

**QR flow:** `/qr` generates a user's receive code; scanning triggers a POST to `/api/qr` which executes a transfer.

## Deployment

The app deploys to Cloudflare Workers. Key config:
- `wrangler.toml` — sets `AUTH_TRUST_HOST=true` (required for NextAuth behind Cloudflare)
- `open-next.config.ts` — OpenNext adapter config
- Always run `npm run build:worker` (not `npm run build`) before `wrangler deploy`

## Environment Variables

Required in `.env.local`:
- `AUTH_SECRET` — NextAuth secret
- `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` — Google OAuth credentials
- `NEXTAUTH_URL` — App URL (e.g., `http://localhost:3000`)
