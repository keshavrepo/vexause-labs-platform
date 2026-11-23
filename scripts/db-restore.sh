#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

if [[ $# -lt 1 || $# -gt 2 ]]; then
  echo "Usage: $0 /path/to/backup.dump [TARGET_DATABASE_URL]" >&2
  exit 2
fi
BACKUP_FILE="$1"
TARGET_DATABASE_URL="${2:-${DIRECT_URL:-${DATABASE_URL:-}}}"
: "${TARGET_DATABASE_URL:?Set DIRECT_URL or DATABASE_URL, or pass target URL}"
[[ -s "$BACKUP_FILE" ]] || { echo "ERROR: backup file missing/empty" >&2; exit 1; }
command -v pg_restore >/dev/null || { echo "ERROR: pg_restore is required" >&2; exit 1; }

echo "WARNING: this operation replaces objects in the TARGET database."
echo "Recommended: restore into a NEW empty database first, validate it, then plan cutover."
read -r -p "Type RESTORE-TO-THIS-DATABASE to continue: " confirmation
[[ "$confirmation" == "RESTORE-TO-THIS-DATABASE" ]] || { echo "Cancelled."; exit 1; }

# --single-transaction avoids a half-applied restore when PostgreSQL supports it.
# --clean removes objects present in the target; use only against the intended target.
pg_restore --dbname="$TARGET_DATABASE_URL" --clean --if-exists \
  --no-owner --no-acl --single-transaction "$BACKUP_FILE"
echo "Restore command completed. Run application smoke tests before switching traffic."
