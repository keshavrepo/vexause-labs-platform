# VEXAUSE LABS Platform

Trust-first, mobile-first 3D printing storefront and custom-order platform.

## Current business scope

VEXAUSE LABS currently offers **3D printing only**. CNC, electronics, IoT and other manufacturing services are not active services and must not be advertised as current offerings.

## Product principles

- Trust through accurate information, transparent pricing and clear order status.
- Premium industrial palette: Forest Green `#173D32`, Sage `#78A88C`, Titanium `#AEB8B5`, Off White `#F1F3EF`, Charcoal `#0B0F0E`.
- Mobile-first, accessible, fast, calm and easy to use.
- Custom orders use a quote-first workflow.
- COD is configurable and eligibility-based. Custom orders do not use COD.
- Never fabricate reviews, certifications, capacity, materials, tolerances, stock, delivery promises or business metrics.
- Customer CAD uploads are stored separately from public product images.

## Stack

- Next.js 14, React, TypeScript and Tailwind CSS
- PostgreSQL and Prisma 5
- Customer/admin authentication, API routes and background worker
- Razorpay integration code (requires merchant credentials and live testing)
- Local persistent VPS storage for product images and private customer design files
- Nginx and systemd deployment foundation

## Implemented platform areas

The cumulative project contains storefront/catalogue, product imagery upload, cart and wishlist, customer accounts and addresses, checkout/order workflows, inventory operations, manual shipment tracking, customer support requests, Razorpay integration code, coupons, moderated product reviews, search/discovery, security controls, database health/backup scripts, background jobs, custom 3D-print quote workflow, analytics UI, responsive layouts, deployment scripts, custom quote acceptance and a customer notification centre, secure password-reset and email-verification token flows, SMTP-backed email worker code, and Google OAuth customer sign-in implementation.

See `docs/PHASE-*.md` for scope and limitations of each phase. Run `npm test` for the dependency-free source-contract checks. Before deployment, generate and review the initial Prisma migration using `npm run db:baseline:generate`; the deployment guard intentionally blocks until this migration exists.

## Important limitations

This repository is **not certified production-ready**. No live VPS deployment, domain/DNS/TLS setup, Razorpay merchant verification, payment end-to-end test, live SMTP delivery (credentials required), Google OAuth live credentials and callback test, malware scanner, courier API, or real-device browser QA is claimed. Some features require credentials and operational setup. The code must pass dependency installation, Prisma validation/migrations, build, automated tests and end-to-end testing before accepting real customer orders or payments.

There are no seeded fake reviews or fake customer metrics. The app must show only real database-backed data.

## Local development

1. Use a supported Node.js LTS release.
2. Copy `.env.example` to `.env` and fill the required local values.
3. Install dependencies with `npm install`.
4. Configure PostgreSQL and apply the project's migration workflow.
5. Run `npm run dev`.

Do not commit secrets or customer-uploaded CAD files.


## Latest cumulative delivery — Phase 34

See `docs/PHASE-34-FINANCE-ACCOUNTING-FOUNDATION.md` for the finance ledger, COD collection evidence workflow, reporting and CSV export. This is an operational finance foundation, not statutory accounting software. Apply the new migration only after backup and reviewed migration preparation.


## Latest cumulative delivery — Phase 35

See `docs/PHASE-35-GST-TAX-INVOICE-FOUNDATION.md` for configurable product GST rates, order tax snapshots, CGST/SGST/IGST split, and customer printable invoices. GST is off by default and must be professionally reviewed before enabling.


## Latest cumulative delivery — Phase 36

See `docs/PHASE-36-PRODUCTION-FULFILMENT-MANAGEMENT.md` for the manual production queue, machine registry, verified material balances and consumption, five-point QC inspection, and dispatch-readiness gates. This is operator-driven; it does not integrate with slicers, printers, telemetry or courier systems.


## Latest cumulative delivery — Phase 37

See `docs/PHASE-37-CODEBASE-AUDIT.md` for static audit findings and shipment lifecycle hardening. This phase does not replace dependency installation, Prisma validation, migration execution, production build or browser/device testing.


## Latest cumulative delivery — Phase 38

See `docs/PHASE-38-DATABASE-MIGRATION-READINESS.md` for the retry-safe baseline migration generator and migration-chain deployment guard. The generated initial migration SQL and package lockfile remain to be produced on a machine with the pinned npm dependencies available.


## Latest cumulative delivery — Phase 39

See `docs/PHASE-39-DEPENDENCY-PRISMA-BUILD-AUDIT.md` for the Node/npm engine requirements, source-import preflight and build release gate. A generated npm lockfile, Prisma CLI validation/client generation, baseline migration SQL and production build still require a dependency-enabled local environment.


## Latest cumulative delivery — Phase 40

Phase 40 hardens API session revocation and the Razorpay checkout verification path. See `docs/PHASE-40-SECURITY-PAYMENT-WORKFLOW-AUDIT.md` for implemented changes, limits and mandatory merchant-account tests. Live gateway, database and browser validation remain outstanding.


## Latest cumulative delivery — Phase 41

Phase 41 closes the custom-order advance-to-balance payment gap. Customers can pay the remaining custom quote balance after an initial advance, while dispatch remains gated on full net payment. See `docs/PHASE-41-END-TO-END-BUSINESS-WORKFLOW-AUDIT.md`. Provider, database, production build and real browser tests remain outstanding.


## Latest cumulative delivery — Phase 42

Phase 42 changes admin APIs to default to ADMIN-only and explicitly allow STAFF only on selected operational endpoints. It adds an admin-only staff access screen for promoting existing accounts and revoking/restoring staff access. See `docs/PHASE-42-ADMIN-OPERATIONS-STAFF-PERMISSIONS.md` for the exact access matrix and limitations.


## Phase 43 — Audit history

Administrator-only searchable audit history and metadata redaction: see `docs/PHASE-43-AUDIT-HISTORY.md`.


## Phase 44 — Store settings

Admin-managed store identity, business contact and selected operational defaults: `docs/PHASE-44-STORE-SETTINGS.md`. Public-safe configuration is available at `GET /api/store-config`.


## Phase 45 — Dynamic storefront information

Homepage, custom request page and shop wordmark consume safe business details from `/api/store-config`: see `docs/PHASE-45-STOREFRONT-DYNAMIC-CONFIG.md`.


## Latest implementation checkpoint
Phase 46 adds shared storefront navigation and customer-page layout consistency. See `docs/PHASE-46-STOREFRONT-NAVIGATION-CONSISTENCY.md`. This remains a development checkpoint, not a production-ready deployment.


Phase 47 adds a public customer Help Centre and dynamic Contact page. See `docs/PHASE-47-HELP-CENTRE-CONTACT.md`.


Phase 48 improves cart synchronization and checkout failure handling. See `docs/PHASE-48-CART-CHECKOUT-RESILIENCE.md`.


Phase 49 fixes support-approved unpaid cancellation reconciliation and refund-aware custom-order balance display. See `docs/PHASE-49-CANCELLATION-REFUND-RECONCILIATION.md`.


Phase 50 improves production/shipping order history, conditional transitions and customer in-app notifications. See `docs/PHASE-50-PRODUCTION-SHIPPING-CUSTOMER-UPDATES.md`.


## Final integration checkpoint — Phase 53

Phase 53 repaired escaped command separators in the VPS deployment scripts, added the missing ESLint toolchain/configuration, and added an explicit TypeScript typecheck command. Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run preflight`, `npm run db:migration-check`, and `npm run build` after installing dependencies. The source-only tests do not replace those real toolchain checks.

The project remains **not production-ready** until the lockfile and reviewed initial baseline migration are generated, the full dependency install/typecheck/lint/Prisma validation/build succeed, the migration chain is rehearsed on disposable PostgreSQL, and all live payment/email/OAuth/VPS/browser/mobile checks in `docs/PHASE-51-RELEASE-READINESS-HANDOFF.md` are completed.


## Final owner handoff — Phase 54

Phase 54 aligns the release audit with all owner-configured environment settings. The final source-level suite is 93/93 passing; source preflight covers 147 files; TypeScript syntax transpilation covers 136 files with zero syntax errors; all 9 shell scripts pass syntax checks. The release audit reports 28/30 checks, with only the missing npm lockfile and generated/reviewed initial Prisma baseline SQL as structural blockers. Full dependency-enabled build, database/provider integration and live device testing remain external launch gates.
