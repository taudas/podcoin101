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

## Deployment (Cloudflare Pages — Git Integration)

The app deploys to **Cloudflare Pages** via GitHub integration (push to `main` triggers auto-deploy).

Key config:
- `wrangler.toml` — sets `AUTH_TRUST_HOST=true` (required for NextAuth behind Cloudflare)
- `open-next.config.ts` — OpenNext adapter config
- Always run `npm run build:worker` (not `npm run build`) locally to test the worker build

### Cloudflare Pages Dashboard — Required Environment Variables

`wrangler.toml` `[vars]` are **not** used by Cloudflare Pages git deployments. You must set these in the Cloudflare Dashboard:

1. Go to **Cloudflare Dashboard → Pages → podcoin101 → Settings → Environment variables**
2. Add the following **Production** variables:
   - `GOOGLE_CLIENT_ID` — Your Google OAuth client ID
   - `GOOGLE_CLIENT_SECRET` — Your Google OAuth client secret
   - `NEXTAUTH_SECRET` — NextAuth secret
   - `NEXTAUTH_URL` — `https://demo.podcoin.org`
   - `AUTH_TRUST_HOST` — `true`
3. Also update your **Google Cloud Console** → OAuth consent screen → Authorized redirect URIs to include:
   `https://demo.podcoin.org/api/auth/callback/google`

## Environment Variables (Local Development)

Required in `.env.local`:
- `GOOGLE_CLIENT_ID` — Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` — Google OAuth client secret
- `NEXTAUTH_SECRET` — NextAuth secret (generate with `openssl rand -base64 32`)
- `NEXTAUTH_URL` — `http://localhost:3000`
