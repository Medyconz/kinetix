# Kinetix Backend Setup

This site now expects a Cloudflare Worker with:

- `DB`: a D1 database named `kinetix-db`
- `PRODUCT_IMAGES`: an R2 bucket named `kinetix-product-images`
- `ADMIN_PASSWORD`: Wrangler secret for admin login
- `ADMIN_SESSION_SECRET`: Wrangler secret used to sign admin sessions

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

Copy the returned D1 `database_id` into `wrangler.toml`, replacing:

```toml
database_id = "REPLACE_WITH_D1_DATABASE_ID"
```

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

Admins can manage activities, products, product images, registrations, and coaching booking requests.
