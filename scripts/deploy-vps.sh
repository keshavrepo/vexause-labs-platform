#!/usr/bin/env bash
set -Eeuo pipefail
APP_DIR="${APP_DIR:-/var/www/vexause/app}"
SERVICE="${APP_SERVICE:-vexause-web}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:3000/api/health/ready}"
cd "$APP_DIR"
[[ -f .env ]] || { echo "Missing $APP_DIR/.env" >&2; exit 1; }
[[ -f package.json ]] || { echo "Missing package.json in $APP_DIR" >&2; exit 1; }
[[ -f package-lock.json ]] || { echo "Missing package-lock.json. Generate and commit it before deployment." >&2; exit 1; }
[[ -d prisma/migrations ]] && find prisma/migrations -mindepth 1 -maxdepth 1 -type d | grep -q . || { echo "No committed Prisma migrations found. Create/review/commit migrations in development first." >&2; exit 1; }
echo "[1/6] Installing dependencies"
npm ci
echo "[2/7] Checking source imports and package metadata"
npm run preflight
echo "[3/7] Generating Prisma client"
npx prisma generate
echo "[4/7] Applying committed database migrations"
npx prisma migrate deploy
echo "[5/7] Building Next.js production output"
npm run build
echo "[6/7] Restarting application service"
sudo systemctl restart "$SERVICE"
echo "[7/7] Waiting for readiness endpoint"
for attempt in $(seq 1 30); do
  if curl --fail --silent --show-error "$HEALTH_URL" >/dev/null 2>&1; then
    echo "Deployment completed; readiness check passed."
    exit 0
  fi
  sleep 2
done
echo "Readiness check failed. Recent service logs:" >&2
sudo journalctl -u "$SERVICE" -n 80 --no-pager >&2 || true
exit 1
