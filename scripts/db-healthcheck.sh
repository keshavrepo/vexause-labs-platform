#!/usr/bin/env bash
set -Eeuo pipefail
: "${DATABASE_URL:?DATABASE_URL must be set}"
command -v psql >/dev/null || { echo "ERROR: psql is required" >&2; exit 1; }
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -Atqc \
  "SELECT CASE WHEN 1 = 1 THEN 'database_ok' END;" | grep -qx 'database_ok'
echo "PostgreSQL connectivity: OK"
