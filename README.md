# Kinetix

Kinetix is a responsive sports/body kinetics website with a Cloudflare Worker backend.

## What is included

- Public pages: Home, Coaching, Activities, Merch, About / Contact
- Admin portal: `/admin.html`
- Cloudflare Worker API: activities, products, registrations, bookings, product image upload
- D1 schema: `migrations/0001_init.sql`
- Starter seed data: `seed.sql`
- R2 product image support

## Cloudflare setup

Follow `BACKEND_SETUP.md` before the first production deploy:

1. Create the D1 database.
2. Create the R2 bucket.
3. Replace the D1 `database_id` in `wrangler.toml`.
4. Set `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET`.
5. Apply the migration and seed data.

## Scripts

```bash
npm run check
npm run deploy
npm run dev
```

Cloudflare can deploy this Worker from GitHub with:

- Build command: `npm install`
- Deploy command: `npm run deploy`
- Root directory: `/`
