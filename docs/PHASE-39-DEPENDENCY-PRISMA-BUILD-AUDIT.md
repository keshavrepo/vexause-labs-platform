# Phase 39 — Dependency, Prisma and Build Readiness Audit

## Implemented
- Declared supported runtime engines in `package.json`: Node.js 20+ and npm 10+.
- Added `scripts/source-preflight.mjs` and `npm run preflight`. It checks internal `@/` and relative imports, required framework/Prisma dependencies, runtime engine metadata, and the presence of a reproducible npm lockfile.
- Added `npm run build:check` as a local release gate: source preflight, tests, migration-chain check, then Next.js production build.
- VPS deployment now runs source preflight after `npm ci` and before Prisma client generation/migrations/build.
- Documented `WORKER_POLL_MS` in `.env.example`.

## Results
- Source import scan found no unresolved internal imports in the current tree.
- The full preflight intentionally exits non-zero on this ZIP because `package-lock.json` is absent. `node scripts/source-preflight.mjs --source-only` passes the internal-import and package-metadata scan without pretending a lockfile exists.
- The dependency installation attempt could not use the offline npm cache: the pinned `@prisma/client` registry metadata was not cached. No lockfile or `node_modules` were created.
- TypeScript transpilation-only syntax check remains 121 files / 0 syntax diagnostics.
- The actual Prisma CLI is unavailable in this environment, so `prisma validate`, client generation, `migrate diff`, database migration tests and Next.js build could not be run.
- Source-contract tests and shell syntax checks are recorded below after execution.

## Verification results\n- `npm test`: 60/60 passed.\n- `node scripts/source-preflight.mjs --source-only`: passed, 127 source files scanned with no unresolved internal imports.\n- `bash -n` on all 7 shell scripts: passed.\n- TypeScript transpilation-only syntax sweep: 121 `.ts`/`.tsx` files, 0 syntax diagnostics.\n- Full preflight correctly remains blocked by the missing `package-lock.json`.\n\n## Required local verification
On a PC with network access:
1. Install Node.js 20+ and npm 10+.
2. Run `npm install`; commit the generated `package-lock.json`.
3. Run `npm run preflight`.
4. Run `npx prisma validate` and `npx prisma generate`.
5. Generate and review the initial baseline SQL with `npm run db:baseline:generate`.
6. Run `npm run db:migration-check`.
7. Test migrations against a fresh disposable PostgreSQL database.
8. Run `npm run build:check` after migration setup is complete.

A successful syntax-only transpilation is not a substitute for TypeScript semantic type-checking or a Next.js production build.
