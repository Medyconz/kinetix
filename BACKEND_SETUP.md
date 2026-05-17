# Kinetix Backend Setup

The admin framework expects a Cloudflare Worker with:

- `DB`: a D1 database named `kinetix-db`
- `PRODUCT_IMAGES`: an R2 bucket named `kinetix-product-images`
- `ADMIN_PASSWORD`: Wrangler secret for admin login
- `ADMIN_SESSION_SECRET`: Wrangler secret used to sign admin sessions

## Admin Framework Included

The `/admin.html` app now includes:

- protected admin shell with sidebar, topbar, mobile drawer, and command search
- central admin resource registry with permission-filtered navigation
- permission-gated Worker endpoints for content, registrations, bookings, exports, audit logs, and backup snapshots
- activities and products management
- product image upload through R2
- searchable registrations/bookings/audit tables with pagination and CSV export
- audit logging for admin mutations, exports, product uploads, deletes, and backup snapshots
- owner-level JSON backup export with a manifest and redaction for secret-like settings
- setup warnings for missing D1, R2, or session secret bindings

## One-time setup

Install Wrangler if it is not available:

```powershell
npm install -D wrangler@latest
```

Create the backend resources:

```powershell
npx wrangler d1 create kinetix-db
npx wrangler r2 bucket create kinetix-product-images
```

Copy the returned D1 `database_id` into `wrangler.backend.example.toml`, replacing:

```toml
database_id = "REPLACE_WITH_D1_DATABASE_ID"
```

Then copy those D1/R2 bindings into the active `wrangler.toml` when R2 is enabled for the account.

Set admin secrets:

```powershell
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put ADMIN_SESSION_SECRET
```

Apply the schema and seed content:

```powershell
npx wrangler d1 execute kinetix-db --remote --file ./migrations/0001_init.sql
npx wrangler d1 execute kinetix-db --remote --file ./seed.sql
```

Deploy:

```powershell
npx wrangler deploy
```

## Admin URL

After deploy, open:

```text
/admin.html
```

The current single-password admin maps to the built-in `owner` role and receives every permission. The schema is ready for future named admin users, roles, permission overrides, and stricter user-specific checks.
