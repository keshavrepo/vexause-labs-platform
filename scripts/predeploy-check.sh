#!/usr/bin/env bash
set -Eeuo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
fail(){ echo "PREDEPLOY CHECK FAILED: $*" >&2; exit 1; }
command -v node >/dev/null || fail "Node.js is missing"
command -v npm >/dev/null || fail "npm is missing"
node -e 'const [a,b]=process.versions.node.split(".").map(Number); if(a<20) process.exit(1)' || fail "Node.js 20 or newer is required"
[[ -f .env ]] || fail ".env is missing; copy .env.example and configure production values"
[[ -d node_modules ]] || fail "Dependencies are not installed; run npm install"
[[ -n "${DATABASE_URL:-}" || -f .env ]] || fail "DATABASE_URL must be configured"
if grep -Eq 'replace-with|example\.com|USER:PASSWORD|rzp_test_replace_me' .env; then
  fail ".env still contains example placeholder values"
fi
if [[ "${NODE_ENV:-production}" == "production" ]]; then
  grep -Eq '^SESSION_SECRET=.+' .env || fail "SESSION_SECRET is missing"
  grep -Eq '^DATABASE_URL=.+' .env || fail "DATABASE_URL is missing"
  grep -Eq '^DIRECT_URL=.+' .env || fail "DIRECT_URL is missing"
  grep -Eq '^NEXT_PUBLIC_SITE_URL=https://[^ ]+' .env || fail "NEXT_PUBLIC_SITE_URL must be a production HTTPS URL"
fi
if [[ ! -f package-lock.json ]]; then
  echo "WARNING: package-lock.json is absent. Generate and commit it before production release for reproducible installs." >&2
fi
if [[ ! -f prisma/schema.baseline.prisma ]]; then
  fail "Preserved baseline Prisma schema is missing"
fi
if [[ ! -f prisma/migrations/20261123000100_google_account/migration.sql ]]; then
  fail "Google account schema migration is missing"
fi
if [[ ! -f prisma/migrations/20261122000000_initial/migration.sql ]]; then
  fail "Initial migration SQL is missing. Run scripts/create-baseline-migration.sh, review and commit it before deployment."
fi
bash scripts/check-migration-chain.sh
echo "Pre-deployment configuration checks passed."
