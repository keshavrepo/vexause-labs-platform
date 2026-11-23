#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

: "${DATABASE_URL:?DATABASE_URL must be set}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/vexause/postgres}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

command -v pg_dump >/dev/null || { echo "ERROR: pg_dump is required" >&2; exit 1; }
command -v sha256sum >/dev/null || { echo "ERROR: sha256sum is required" >&2; exit 1; }

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
tmp_file="$BACKUP_DIR/.vexause-${timestamp}.dump.tmp"
final_file="$BACKUP_DIR/vexause-${timestamp}.dump"

cleanup() { rm -f "$tmp_file"; }
trap cleanup EXIT

echo "Starting PostgreSQL backup (UTC: $timestamp)"
pg_dump --dbname="$DATABASE_URL" --format=custom --no-owner --no-acl \
  --file="$tmp_file"
test -s "$tmp_file"
mv "$tmp_file" "$final_file"
chmod 600 "$final_file"
sha256sum "$final_file" > "${final_file}.sha256"
chmod 600 "${final_file}.sha256"

# Retention only touches files with this script's exact naming pattern.
find "$BACKUP_DIR" -maxdepth 1 -type f \
  -name 'vexause-????????T??????Z.dump' -mtime "+$RETENTION_DAYS" -delete
find "$BACKUP_DIR" -maxdepth 1 -type f \
  -name 'vexause-????????T??????Z.dump.sha256' -mtime "+$RETENTION_DAYS" -delete

echo "Backup completed: $final_file"
echo "Copy this backup and checksum off the VPS; local-only backups do not protect against VPS loss."
