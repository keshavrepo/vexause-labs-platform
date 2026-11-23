# Phase 37 — Codebase Audit and Shipment Lifecycle Hardening

## Scope
This phase audits the cumulative Phase 36 source tree and fixes a concrete order-fulfilment consistency issue. It is a static source audit, not a runtime certification.

## Findings fixed
- Shipment records previously accepted out-of-order status changes. A shipment could be created directly as picked up/delivered, and a delivered shipment could be recorded while its order remained `READY_TO_SHIP`.
- Shipment creation now starts at `LABEL_CREATED`. Subsequent carrier events follow an explicit transition map. Carrier pickup is required before out-for-delivery or delivered; delivered orders cannot be moved backwards.
- Admin order status updates can no longer bypass carrier evidence: `SHIPPED` requires a shipment with a carrier-dispatch status, and `DELIVERED` requires a shipment marked delivered.
- Shipment updates remain admin-only, transactional and audit-logged.

## Static checks performed
- Existing source-contract suite before changes: 56/56 passed.
- Added a regression contract for shipment lifecycle and dispatch evidence.
- Shell scripts and ZIP integrity are checked as part of this phase's delivery process.

## Verification results\n- `npm test`: 58/58 tests passed.\n- `bash -n` on all 6 shell scripts: passed.\n- TypeScript transpilation-only syntax sweep: 121 files, 0 syntax diagnostics.\n- Literal backslash-newline artifact scan across TS/TSX/JS/MJS/CSS: 0 matches.\n\n## Important uncompleted runtime checks
The source bundle has no `node_modules` or `package-lock.json`. This environment did not install dependencies or connect to PostgreSQL. Therefore the following are not claimed:
- Prisma schema validation or generated-client type-checking
- Applying migrations to a fresh or existing PostgreSQL database
- TypeScript/Next.js production build
- API integration tests against PostgreSQL
- Razorpay sandbox/webhook tests, Google OAuth callback test or SMTP delivery
- Desktop/mobile browser QA or real-phone testing

## Migration preparation
The project preserves `prisma/schema.baseline.prisma` and includes `scripts/create-baseline-migration.sh`. The generated initial migration is intentionally not fabricated; it must be generated with the pinned Prisma CLI, reviewed, and committed before a fresh database deployment. The pre-deploy guard blocks deployment until that SQL exists.

## Remaining external launch work
Owner-side credentials and infrastructure remain necessary: PostgreSQL, domain/DNS/TLS, Razorpay merchant credentials/webhook, Google OAuth client, SMTP sender, and optional courier account/API. Never put real secrets in Git.
