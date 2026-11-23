# Phase 55 — Visual design system and interface refresh

## Purpose

Bring the whole product onto one coherent visual language: a shared token/primitive layer, consistent storefront,
account and admin chrome, and a rebuild of the customer account area that matches the data the platform actually
exposes. Phase 55 is a presentation-layer change — no business rule, API contract, database model or migration was
altered.

## Design system layer

- `app/design-system.css` — a new, unlayered stylesheet imported after `app/globals.css` in `app/layout.tsx`. Because
  Tailwind emits utilities inside `@layer utilities`, these rules win where they intentionally restyle legacy markup.
- Tokens (`--vx-*`, brand colours reused from `--vxl-*`): surfaces, lines, radii, shadows, spacing, motion easing and
  type scale, plus breakpoints at 1180 / 1024 / 900 / 640 px.
- Layout primitives: `.vx-page` (`--narrow`, `--mid`), `.vx-page-head`, `.vx-kicker/.vx-title/.vx-lead`,
  `.vx-grid--2/3/4`, `.vx-split`, `.vx-stack`, `.vx-actions`.
- Surfaces and data: `.vx-panel`, `.vx-stat`, `.vx-table`, `.vx-badge--*`, `.vx-summary`, `.vx-timeline`,
  `.vx-kv`, `.vx-empty`, `.vx-skeleton`, `.vx-alert--*`.
- Controls: `.vx-btn` (`--primary`, `--danger`, `--quiet`, `--sm`, `--block`, `--google`), `.vx-field/.vx-label/.vx-input`,
  `.vx-steps`, `.vx-upload`, `.vx-filelist`, `.vx-checkout`, `.vx-address-option`.
- Storefront components: `.vx-card`, `.vx-catalogue-bar`, `.vx-filters`, `.vx-sort`, `.vx-chip(-row)`, `.vx-stepper`,
  `.vx-cart-list`, `.vx-pagination`, `.vx-pdp`/`.vx-gallery*`/`.vx-variant*`, `.vx-review`, `.vx-faq`, `.vx-invoice*`.
- Print rules: `@media print` hides storefront/admin chrome and flattens panels for the tax invoice.

## Shared components

| File | Role |
| --- | --- |
| `components/ui/Primitives.tsx` | Presentational-only building blocks (`Panel`, `PageHeader`, `StatusBadge`, `Badge`, `Alert`, `EmptyState`, `Stat`, …). No hooks, so usable from server and client components. |
| `components/AuthShell.tsx` | Centred customer-auth card used by sign-in, registration, reset and verification screens. |
| `components/AccountShell.tsx` | Route-aware customer account bar; renders auth routes without the bar. The account layout supplies the `<main>` landmark. |
| `components/AdminShell.tsx` | Fixed forest sidebar (grouped navigation, `aria-current`, ADMIN-only links), topbar, mobile nav strip and skip link. |
| `app/admin/layout.tsx` | Marks `/admin/*` dynamic, enforces the ADMIN/STAFF session check and wraps every admin page in `AdminShell`. |
| `app/account/layout.tsx` | Storefront header + account bar + contact footer for every `/account/*` route. |

## Screens rebuilt

- **Storefront** — catalogue (`components/ShopClient.tsx`), product detail (`components/ProductDetailClient.tsx`),
  cart, wishlist, checkout (`app/checkout/page.tsx`) and the custom print brief (`app/custom-3d-printing/page.tsx`).
- **Account** — overview, order history, new order detail (payments, shipments, status history, balance, retry payment,
  cancellation, invoice link), new printable tax invoice, addresses, custom requests (quote acceptance, design
  approval/revision, deliverable downloads), reviews, notifications and support.
- **Admin** — new overview reading `/api/admin/analytics`, shared frame for all admin workspaces, legacy back-links and
  duplicated page chrome removed, plus a conservative typography/table/input layer for the existing workspaces.
- **Content** — help centre and contact page rewritten around real workflow behaviour and configured business contact
  details.
- **Hero** — `components/hero/HeroModels.ts`, `HeroProductScene`, `HeroProductShowcase` and the CPU preview harness
  (`scripts/preview-hero-models.mjs`) now share one composition: featured product plus two supports, tail fin and folded
  wings corrected, supports moved back (`x ±2.28, z −2, scale ×0.56`) so both flanking products stay inside the hero
  camera frame.

## Deliberately unchanged

- All API routes, Prisma schema, migrations, worker jobs, validation, authentication, payment/refund and inventory logic.
- Copy rules: no invented reviews, ratings, certifications, delivery promises or business metrics. Figures shown in the UI
  come from API responses; empty and error states are explicit.

## Verification

See `TEST-REPORT.md` for the commands, results and the environment limits that prevented end-to-end API verification in
this workspace. `docs/PHASE-55-CHANGELOG.md` holds the short change list.
