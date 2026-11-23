# Phase 26 — Quality gates and migration foundation

## Implemented

- Added a preserved `prisma/schema.baseline.prisma` snapshot representing the full application schema immediately before the Phase 25 Google identity delta.
- Added `scripts/create-baseline-migration.sh`, which uses the installed Prisma CLI to generate PostgreSQL initial DDL from that baseline schema. It refuses to overwrite an existing baseline and refuses to leave an empty generated migration.
- Kept the Phase 25 Google identity change as a later delta migration.
- Added `prisma/migrations/migration_lock.toml`.
- Added Node's built-in test runner scripts (`npm test`, `npm run test:contracts`).
- Added six executable source-contract tests covering schema delta intent, Google OAuth state/PKCE/nonce/email checks, password reset token hashing/expiry, deployment guard behavior, and absence of real credentials in `.env.example`.
- Updated pre-deployment checks to block deployment until the reviewed initial migration SQL exists. This prevents a fresh database deployment from trying to apply only the Google delta migration.
- Documented a safe workflow for fresh databases and existing databases.

## Migration workflow

After installing dependencies on a development machine:

1. Run `npm install` (or `npm ci` after a reviewed lockfile exists).
2. Run `npm run db:baseline:generate`.
3. Review `prisma/migrations/20261122000000_initial/migration.sql` against `prisma/schema.baseline.prisma`.
4. Commit the generated initial migration, the schema snapshot, and the later Google delta migration together.
5. For a **fresh empty database**, apply migrations with `npx prisma migrate deploy`.
6. For an **existing database**, first verify that its tables and constraints exactly match the baseline schema. Then use Prisma's migration resolve workflow to mark the initial migration as applied; do not run the initial DDL over an already populated database. Apply the later Google delta only after checking whether the Phase 25 fields/table already exist.

The baseline SQL is deliberately not fabricated in this ZIP: Prisma CLI and dependencies are not installed in this environment. The generation script creates the real DDL from the actual schema on the development machine.

## Tests actually run in this phase

- `node --test tests/contracts.test.mjs` — 6 passed, 0 failed.
- Shell syntax checks are included in packaging verification.

## Not run / not claimed

- No `npm install`, package-lock generation, `prisma validate`, Prisma Client generation, migration SQL generation, migration execution, TypeScript compilation, Next.js build, DB integration test, payment test, OAuth provider test, security audit, or browser/device QA was possible here because `node_modules`, `package-lock.json`, database access, and provider credentials are absent.
- The generated initial SQL is still required before the deployment guard will pass.
- This phase is not a production-readiness certification.
