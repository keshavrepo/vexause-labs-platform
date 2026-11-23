#!/usr/bin/env bash
set -Eeuo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
fail(){ echo "MIGRATION CHECK FAILED: $*" >&2; exit 1; }
[[ -f prisma/schema.prisma ]] || fail "prisma/schema.prisma is missing"
[[ -f prisma/schema.baseline.prisma ]] || fail "preserved baseline schema is missing"
[[ -f prisma/migrations/migration_lock.toml ]] || fail "Prisma migration provider lock is missing"
grep -Eq '^provider[[:space:]]*=[[:space:]]*"postgresql"' prisma/migrations/migration_lock.toml || fail "migration provider must be PostgreSQL"
[[ -f prisma/migrations/20261122000000_initial/migration.sql ]] || fail "initial baseline SQL is missing; generate and review it before deployment"
mapfile -t migrations < <(find prisma/migrations -mindepth 2 -maxdepth 2 -name migration.sql -printf '%h\n' | sort)
(( ${#migrations[@]} >= 2 )) || fail "expected the baseline and at least one delta migration"
previous=""
for dir in "${migrations[@]}"; do
  name="$(basename "$dir")"
  [[ "$name" =~ ^[0-9]{14}_[a-z0-9_]+$ ]] || fail "invalid migration directory name: $name"
  [[ -s "$dir/migration.sql" ]] || fail "empty migration SQL: $name"
  if [[ -n "$previous" && "$name" == "$previous" ]]; then fail "duplicate migration name: $name"; fi
  previous="$name"
done
echo "Migration chain structure: OK (${#migrations[@]} migrations)."
echo "This check does not replace prisma validate, migrate diff review, or applying migrations to a disposable PostgreSQL database."
