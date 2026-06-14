# Podcoin Exchange - Project Context

## Project Overview

Podcoin Exchange is a **mutual credit community currency system** for Alameda, CA. It enables neighbors to trade services using a digital ledger-based currency (₱) without cryptocurrencies or bank accounts.

### Key Concepts

- **Mutual Credit Model**: Users start with ₱0 balance and ₱500 credit limit. Currency is created when users spend beyond their balance.
- **Non-Crypto**: Centralized SQLite database, not blockchain
- **Purpose**: Community resilience, supporting local individuals, increasing liquidity for low-income residents

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Auth | NextAuth.js v5 (Google OAuth) |
| Database | SQLite via Cloudflare D1 (production) / better-sqlite3 (local dev) |
| Styling | Tailwind CSS v4 |
| QR Features | `react-qr-code`, `jsqr`, `html5-qrcode` |
| Deployment | Cloudflare Pages with OpenNext |

### Project Structure

```
podcoin101/
├── src/
│   ├── app/                    # Next.js App Router routes
│   │   ├── api/               # API routes (auth, transfer, transactions)
│   │   ├── dashboard/         # User dashboard
│   │   ├── directory/         # Community directoryBrowse services
│   │   ├── profile/           # User profile management
│   │   ├── qr/                # QR code generation/scanning
│   │   └── transfer/          # P2P transfers
│   ├── components/            # React components (Navbar.tsx)
│   ├── lib/                   # Database layer (db.ts), utilities
│   └── auth.ts                # NextAuth configuration
├── public/                    # Static assets
├── wrangler.toml              # Cloudflare Workers configuration
└── open-next.config.ts        # OpenNext conversion config
```

## Building and Running

### Prerequisites

- Node.js 20+
-npm install
- Google OAuth credentials (for production; dev works without)

### Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Visit http://localhost:3000
```

For local SQLite development (not using Cloudflare bindings), the database is created automatically as `podcoin.db` in the project root on first run.

### Environment Variables

Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

Required variables:
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `NEXTAUTH_URL` - Set to `http://localhost:3000` for local dev

### Production Build (Cloudflare Pages)

The project uses OpenNext to convert Next.js to Cloudflare Workers:

```bash
# Build for Cloudflare Workers
npm run build:worker

# Deploy via Wrangler
npx wrangler deploy

# Or use the convenience script
npm run deploy
```

**Important**: For Cloudflare Pages git integration, set environment variables in the **Cloudflare Dashboard** (not `wrangler.toml`):
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` - e.g., `https://demo.podcoin.org`
- `AUTH_TRUST_HOST` = `true`

## Database Schema

SQLite database with three main tables:

### users
- `id` (TEXT PRIMARY KEY) - OAuth providerAccountId
- `name`, `email`, `image`
- `balance` (REAL NOT NULL DEFAULT 0)
- `credit_limit` (REAL NOT NULL DEFAULT 500)
- `neighborhood`, `bio`
- `created_at`, `updated_at`

### services
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `user_id` (TEXT REFERENCES users(id))
- `title`, `description`
- `price_podcoin` (REAL)
- `category`, `active` (DEFAULT 1)

### transactions
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `from_user_id`, `to_user_id` (TEXT)
- `amount` (REAL NOT NULL)
- `note`, `type` (DEFAULT 'transfer')
- `created_at`

## Key Features & Implementation Notes

### Authentication
- Google OAuth via NextAuth.js v5-beta
- Users created automatically on first sign-in
- OAuth callback URL: `/api/auth/callback/google`

### Core Functions (in `src/lib/db.ts`)
- `getOrCreateUser()` - Create or update user on OAuth login
- `transfer()` - Atomic P2P transfer with validation:
  - Sender must have sufficient credit (balance ≥ -credit_limit)
  - Atomic batch execution via SQLite `db.batch()`
  - Updates both balances and creates transaction record
- `getUserBalance()` - Get balance and credit limit
- `getTransactions()` - Fetch user's transaction history
- `getUsers()` - Search and list users with services
- CRUD operations for services (add/update/delete/get)

### Mutual Credit Rules
1. All users start with **₱0 balance** and **₱500 credit limit**
2. Transfers are atomic—SQLite batches ensure consistency
3. No fees, no interest, no blockchain

## Development Conventions

### Code Style
- TypeScript strict mode enabled
- Next.js 15 App Router patterns (Server Actions, async components)
- Tailwind utility classes for styling
- ESLint configured with `eslint-config-next`

### Naming Conventions
- Database: snake_case (`user_id`, `created_at`)
- TypeScript/JS: camelCase
- Component files: PascalCase (e.g., `Navbar.tsx`)

### API Routes
All API routes are under `/api/`:
- `/api/auth/*` - NextAuth handlers
- `/api/balance` - Get user balance
- `/api/transfer` - Execute transfers
- `/api/transactions` - Get transaction history
- `/api/users` - Search users, list directory
- `/api/services` - CRUD for service listings

### Cloudflare Workers Compatibility
- Uses D1 database binding (Cloudflare's SQLite)
- OpenNext converts to Workers at `.open-next/worker.js`
- Environment variables read via `getCloudflareContext()` in db.ts

## Testing

No automated tests configured yet. Manual testing via DevTools browser interaction.

## Deployment URL

Production: https://demo.podcoin.org

## Known Considerations

1. **TOCTOU window**: Balance checks happen before atomic batch (acceptable for this app's scale)
2. **Local vs Production DB**: Uses better-sqlite3 locally; Cloudflare D1 in production
3. **Dev Secret**: Default NextAuth secret should be replaced with `NEXTAUTH_SECRET` env var
