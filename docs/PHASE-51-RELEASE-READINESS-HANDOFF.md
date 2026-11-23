# Phase 51 — Release readiness and final owner handoff

## Purpose
This phase adds a repeatable static release gate and consolidates the remaining owner-side launch work. It does not claim that the platform is production-ready merely because source-level tests pass.

## Static release gate
Run:

```bash
npm run release:audit
npm test
npm run preflight
npm run db:migration-check
```

`release:audit` checks the package manifest, lockfile, Prisma migration lock and baseline SQL, environment template, deployment runbook, owner checklist, and required integration variable names. It intentionally exits non-zero while a required static prerequisite is missing.

## Current verified state in this archive
- Contract/workflow tests: 86 passed, 0 failed.
- Source-only preflight: 142 source files checked.
- Shell syntax: all 9 shell scripts passed `bash -n`.
- ZIP archive integrity checked after packaging.
- Migration chain check currently blocks release because the initial baseline migration SQL is absent. The later feature migrations are present. Do not run migrations against a real database until the baseline is generated, reviewed and the target database has been backed up/reconciled.
- No npm lockfile is present in this archive. Generate and commit `package-lock.json` using a supported network environment, then use `npm ci`.
- Dependencies are not installed in the build environment; Prisma validation/client generation and a Next.js production build have not been performed.

## Owner-side launch gates — do not skip
1. **Repository**: create the first GitHub commit, push the complete project, protect the default branch, and keep secrets out of Git.
2. **Dependencies**: on a supported Node.js LTS/npm environment, run `npm install`, commit the resulting lockfile, then verify clean `npm ci`.
3. **Database**: generate the initial baseline SQL with the supplied script, review it against the complete Prisma schema, create a disposable PostgreSQL database, validate/generate Prisma Client, test the full migration chain, rehearse backup/restore, then plan production adoption. Never blindly apply a fresh baseline to an existing database.
4. **Build**: run lint/type checks available in the installed toolchain, `npm test`, `npm run preflight`, `npm run db:migration-check`, and `npm run build`; fix every failure.
5. **Secrets and integrations**: configure strong session secret, PostgreSQL URLs, Razorpay test credentials/webhook, Google OAuth client and exact callback URL, SMTP sender/credentials, canonical HTTPS site URL, trusted origins and private upload directory on the VPS.
6. **Payments**: complete Razorpay test-mode checkout, duplicate webhook, failed payment, late capture, refund, partial refund (if enabled), custom-order advance and balance payment, COD collection and ledger reconciliation tests before live mode.
7. **Email/OAuth**: test registration verification, password reset, expiry/replay protection, SMTP delivery/bounces, Google sign-in, account linking, disabled users and admin/staff restrictions.
8. **Operations**: test admin/staff permissions, audit redaction, inventory reservation/restoration, coupon release, production state transitions, QC dispatch gate, shipment handoff/delivery, customer notifications and support cancellation/return/refund paths.
9. **Files and security**: test CAD upload limits, private storage permissions, download ownership, clean-scan gate, backup/restore of product images and private uploads, rate limits, origin checks, HTTPS, headers and log redaction.
10. **User experience**: test all public/customer/admin routes in desktop and real Android/iOS-sized browsers; verify keyboard/accessibility, loading/error/empty states, cart persistence, address forms, checkout, tracking and support flows.
11. **VPS launch**: configure Ubuntu, Nginx, TLS, systemd app and worker, persistent directories, firewall, process restart, health checks, log rotation, monitoring, scheduled backups and a tested rollback.
12. **Business content**: confirm actual products, prices, stock, shipping charges/policy, cancellation/return policy, support contacts, legal pages, GST configuration and tax invoice wording with the owner/CA. Do not publish placeholder values or unverified claims.

## Known boundaries
- Courier integration is manual shipment/tracking; no carrier API is configured.
- Product and private customer files use local persistent storage; VPS backups must include them.
- GST/tax configuration is a foundation, not tax/legal advice or a complete statutory compliance engine. Obtain CA review before issuing statutory invoices.
- Finance ledger is operational reconciliation support, not full statutory accounting.
- No live credentials, domain, VPS, production database, courier account or real customer data are included.
- No physical phone/browser, live provider, production database or full Next.js production-build test was possible in this source-only environment.

## Definition of done
Do not call VEXAUSE launched until all owner-side launch gates are checked with evidence, the release audit is clean, the complete build succeeds, the production database is migrated safely, and end-to-end tests pass on the actual deployment.
