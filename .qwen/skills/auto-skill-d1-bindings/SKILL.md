---
name: d1-bindings
description: >
  Diagnose and fix Cloudflare D1 database binding issues in production deployments.
  Trigger: "database not found", "access denied", "DB undefined", D1-related errors.
---

## When to use this skill

When fixing **"access denied"**, **"D1 Database not configured"**, or similar database connection errors in Cloudflare Pages/Workers deployment. This skill covers:

- D1 binding misconfiguration
- Missing environment variables
- Wrong variable names (`DB` vs `podcoin-db`)
- Dev/prod environment differences

## Common Problems & Fixes

| Symptom | Cause | Fix |
|---------|-------|-----|
| `"D1 Database not configured"` | `env.DB` is undefined in Workers | Bind D1 database in Cloudflare Dashboard |
| `access denied` on login | D1 binding missing at runtime | Add `DB = <database-id>` as environment variable |
| Works locally, fails in prod | Using `wrangler.toml` vars for Pages | Set env vars in Pages Dashboard, not wrangler |

## Key Files to Check

```
src/lib/db.ts          # Database connection logic
wrangler.toml          # Local dev config (ignored by Pages)
.env.example           # Template for required variables
src/app/api/db-health  # Health check endpoint (if exists)
```

## Diagnostic Steps

1. **Check `db.ts`**:
   - Does `getDb()` properly access `env.DB`?
   - Is it exported? (`export async function getDb()`)
   - Add error message when DB is missing

2. **Verify D1 binding**:
   ```bash
   npx wrangler d1 list
   ```

3. **Cloudflare Pages Setup** (critical!):
   - Dashboard → Pages → Settings → Environment variables
   - Add: `DB` = `<d1-database-id>` (as a binding)
   - Plain text env vars like `NEXTAUTH_SECRET` go in same screen

4. **Test endpoint**:
   ```
   https://your-app.pages.dev/api/db-health
   ```

## Code Pattern Fix

Before (broken):
```ts
const db = env.DB as D1Database  // Could be undefined
```

After (fixed):
```ts
export async function getDb(): Promise<D1Database> {
  const { env } = getCloudflareContext()
  if (!dbInstance) {
    const db = env.DB as D1Database
    if (!db) {
      throw new Error("D1 Database not configured. Check env.DB is bound.")
    }
    // ... init
  }
  return dbInstance
}
```

## Checklist

- [ ] `getDb()` is exported
- [ ] Error message tells user to check `env.DB` binding
- [ ] D1 database created: `npx wrangler d1 create <name>`
- [ ] Database ID added as `DB` environment variable in Pages Dashboard
- [ ] Test endpoint `/api/db-health` returns `{status:"ok"}`
