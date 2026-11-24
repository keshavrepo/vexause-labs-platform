# Test report — Phase 55 and V3 design overhaul

The V3 pass is recorded in `docs/V3-MASTER-DESIGN-OVERHAUL.md`. Its verification
on this branch: `npm run lint` clean, `npm test` 96/96, `npm run preflight`
168 source files, `npx tsc --noEmit` 65 Prisma-client-only errors,
`npm run build` compiling successfully before the same pre-existing Prisma
type-check stop, and a route smoke of the storefront pages at 200.

## Cart summary and cart-sync fixes

`docs/CART-SUMMARY-AND-SYNC-FIX.md` records the two cart defects fixed on top of
V3: panels now own their internal padding (25 previously unpadded panels across
storefront, account and checkout), and the CSRF origin check no longer rejects
same-origin API calls because it compared the browser's `Origin` against the
server's bind address. Lint clean, 96/96 contracts, preflight 168 files, build
compiles before the pre-existing Prisma type stop.

## Phase 55 — UI design system refresh

Date: 2026-11-23 · Branch: `arena/7673ea45-vexause-labs-platform` · Base commit: `0994108`
Environment: Node v22.22.3, npm 10.9.8, no browser/Chromium available, outbound network limited to the npm registry,
GitHub and PyPI.

## Summary

| Check | Command | Result |
| --- | --- | --- |
| Dependencies | `npm install --no-audit --no-fund` | Pass — 391 packages |
| Source preflight | `npm run preflight` | Pass — 162 source files, imports/package metadata consistent |
| Source contracts | `npm test` | Pass — 96 tests, 0 failures (17 contract assertions updated to the new markup) |
| Lint | `npm run lint` | Pass — no output |
| Type check | `npx tsc --noEmit` | 67 errors, all pre-existing Prisma-client fallbacks (see below); no errors in the rewritten UI |
| Production build | `npm run build` | Compiles ("Compiled successfully in 19.2s"), then fails the type-check step on the same Prisma errors |
| Prisma client | `npx prisma generate` | Blocked — `binaries.prisma.sh` is not reachable from this sandbox |
| Hero previews | `node scripts/preview-hero-models.mjs` | Pass — 6 renders in ~9 s (vase 58,688 tris, robot 23,928, dragon 37,808, car 30,860) |

## Environment limit that shapes this report

`node_modules/@prisma/client` is installed but the generated client is not, and `prisma generate` cannot download its
engines because the sandbox only allows a fixed host list:

```text
Error: request to https://binaries.prisma.sh/all_commits/6051973.../debian-openssl-3.0.x/libquery_engine.so.node.gz.sha256 failed,
reason: Client network socket disconnected before secure TLS connection was established
```

Consequences, all pre-existing and unrelated to the UI work:

- `Prisma`, `PrismaClient` and the generated model types are missing, so every `prisma.$transaction((tx) => …)` callback
  degrades to an implicit `any`. Those 67 `tsc` errors are the whole remaining error set; filtering them leaves zero
  diagnostics for `app/**/page.tsx`, `components/**`, `app/design-system.css` consumers and `tests/`.
- `new PrismaClient()` throws at import time, so every API route returns 500 and any server component that queries the
  database fails. That is why `/admin/*` and `/product/[slug]` return 500 in this sandbox while all client-fetching pages
  render.

## Route smoke test (development server, `next dev` on 0.0.0.0:3000)

| Route | Status | Route | Status |
| --- | --- | --- | --- |
| `/` | 200 | `/account` | 200 |
| `/shop` | 200 | `/account/orders` | 200 |
| `/cart` | 200 | `/account/orders/:id/invoice` | 200 (shell) |
| `/wishlist` | 200 | `/account/addresses` | 200 |
| `/checkout` | 200 | `/account/custom-requests` | 200 |
| `/custom-3d-printing` | 200 | `/account/reviews` | 200 |
| `/help` | 200 | `/account/notifications` | 200 |
| `/this-page-does-not-exist` | 404 (branded page) | `/account/support` | 200 |
| `/contact` | 200 | | |
| `/account/(login, register, forgot-password, reset-password, verify-email)` | 200 each | `/admin`, `/admin/orders` | 500 (Prisma client missing) |

Each 200 page was also inspected as rendered HTML: one `<main>` landmark per storefront page, one account `<main>`,
no leftover `CustomerNav`, no duplicate nested `<main>` in admin pages, and every page composes from `vx-*` classes.

## Contract checks performed by reading the real API code

The account surfaces were written against routes that were verified to exist and to return the shapes the pages read:

- `/api/customer/me` → `{ user }`; `/api/customer/orders` → `{ orders[] }`; `/api/customer/orders/[id]` → `{ order }` with
  `items`, `payments`, `refunds`, `shipments`, `statusHistory`, `address`, `invoice`, plus `subtotalPaise`, `taxPaise`,
  `discountPaise`, `couponCode`, `kind`, `paymentMethod`.
- `POST /api/customer/orders/[id]/cancel` → cancellable only in `PENDING_REVIEW`/`AWAITING_PAYMENT` **and** with no verified
  payment; the UI now uses exactly that condition.
- `POST /api/customer/payments/create` → `{ keyId, razorpayOrderId, amount, currency }`; `POST …/verify` accepts the gateway
  response object. Custom orders can be topped up while `PAID`/`IN_PRODUCTION` with an outstanding balance, so the order
  page offers "Retry payment" there too.
- `/api/customer/orders/[id]/invoice` → `{ invoice }` with `TaxInvoice` columns (`linesJson`, `cgstPaise`, `sgstPaise`,
  `igstPaise`, `grandTotalPaise`, `placeOfSupply`, …).
- `/api/customer/custom-requests` → `GET { requests[] }` (files + quotes) and `PATCH { requestId, action, quoteId }` with
  `ACCEPT_QUOTE`/`APPROVE_DESIGN`/`REQUEST_REVISION`, returning `{ order }` with the created order on acceptance.
- `/api/customer/custom-requests/[id]/files/[fileId]`, `/api/customer/notifications`, `/api/customer/addresses`,
  `/api/customer/support`, `/api/admin/analytics` — all present with the fields the UI reads.

## Not verified in this sandbox

- No database, so no API response, order flow, payment, refund, coupon, review or admin action was executed end to end.
- No browser, so no pixel-level or interactive QA (focus, hover, mobile breakpoints, sticky headers) and no screenshot
  comparison. Layout was checked by reading rendered HTML/CSS and by the CPU rasteriser for the 3D hero, which ignores
  transparency and environment lighting and therefore overstates ground darkness and shows glass as opaque.
- Razorpay, SMTP, Google OAuth and file-scanning integrations need credentials and live network access; none were tested.
- `next build` cannot complete here; run `npm run db:generate && npm run build:check` in a networked environment to finish
  CI-grade verification.
