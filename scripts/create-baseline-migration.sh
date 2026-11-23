#!/usr/bin/env bash
set -Eeuo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
BASELINE_DIR="prisma/migrations/20261122000000_initial"
BASELINE_SCHEMA="prisma/schema.baseline.prisma"
[[ -f "$BASELINE_SCHEMA" ]] || { echo "Missing $BASELINE_SCHEMA" >&2; exit 1; }
[[ ! -e "$BASELINE_DIR" ]] || { echo "Baseline migration already exists; refusing to overwrite it." >&2; exit 1; }
command -v npx >/dev/null || { echo "npm/npx is required. Install the project dependencies first." >&2; exit 1; }
TMP_DIR="$(mktemp -d "${TMPDIR:-/tmp}/vexause-baseline.XXXXXX")"
cleanup(){ rm -rf -- "$TMP_DIR"; }
trap cleanup EXIT
mkdir -p "$BASELINE_DIR"
# Generate into a temporary file first so a failed Prisma command cannot leave
# a misleading empty migration directory that blocks a clean retry.
if ! npx prisma migrate diff --from-empty --to-schema-datamodel "$BASELINE_SCHEMA" --script > "$TMP_DIR/migration.sql"; then
  rmdir "$BASELINE_DIR" 2>/dev/null || true
  echo "Prisma could not generate the baseline. Check dependencies and Prisma schema." >&2
  exit 1
fi
if [[ ! -s "$TMP_DIR/migration.sql" ]]; then
  rmdir "$BASELINE_DIR" 2>/dev/null || true
  echo "Prisma generated an empty baseline; aborting." >&2
  exit 1
fi
install -m 0644 "$TMP_DIR/migration.sql" "$BASELINE_DIR/migration.sql"
echo "Generated baseline SQL from the preserved pre-Google schema."
echo "Review the SQL against the schema and test it on a disposable PostgreSQL database."
echo "Fresh database: npx prisma migrate deploy"
echo "Existing database: verify schema equivalence, then baseline-resolve the initial migration before deploying later deltas."
