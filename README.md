# Window Spree

A complete online store where nothing costs anything. Users browse, fill a bag, check out with a simulated
payment, get a real order confirmation email, and follow tracking updates (also by email) until "delivery".
Then they're asked whether they still want the item. The account page shows how much money they kept.

All brands and products are fictional. No card details are ever collected.

## Stack

Next.js 16 (App Router, Server Actions) · TypeScript · Tailwind 4 · Drizzle ORM on libSQL (SQLite locally,
Turso in production) · Resend for email.

## Run locally

```bash
pnpm install
cp .env.example .env.local
pnpm db:push        # create tables in local.db
pnpm dev
```

Without `RESEND_API_KEY`, emails are not sent. They show up at http://localhost:3000/dev/outbox, including
the magic sign-in link.

`TRACKING_SPEED=60` in `.env.example` turns hours into minutes, so a standard order is "delivered" in about
an hour. Use `TRACKING_SPEED=1` for realistic timing.

## How it works

| Piece | Where |
| --- | --- |
| Catalog (static, fictional) | `src/lib/catalog.ts`, art in `src/components/product-art.tsx` |
| Cart (httpOnly cookie) | `src/lib/cart.ts` |
| Magic-link auth, DB sessions | `src/lib/auth.ts`, `src/app/login`, `src/app/auth/verify` |
| Checkout & all mutations | `src/app/actions.ts` |
| Tracking timeline | `src/lib/tracking.ts` |
| Tracking emails | `advanceOrders()` in `src/lib/orders.ts` |
| Email templates / sending | `src/lib/email/` |
| Savings dashboard | `src/lib/savings.ts`, `src/app/account` |

Each order stores its scheduled stage times when placed. `advanceOrders()` emails the latest stage reached,
and a conditional update on `notified_stage` makes sure each email goes out only once. It runs:

- when a user views their orders or account,
- every 30s in-process (`src/instrumentation.ts`, on by default in dev; set `INTERNAL_SCHEDULER=on` on a long-lived server),
- via `GET /api/cron/advance` with `Authorization: Bearer $CRON_SECRET` on serverless hosts. Call it every few minutes.

## Production checklist

- `RESEND_API_KEY` and `EMAIL_FROM` on a verified domain
- `APP_URL` set to the public URL (used in email links)
- `DATABASE_URL` / `DATABASE_AUTH_TOKEN` pointing at Turso (or another libSQL server), then `pnpm db:push`
- `CRON_SECRET` plus a scheduler hitting `/api/cron/advance`, or `INTERNAL_SCHEDULER=on`
- `TRACKING_SPEED=1`
