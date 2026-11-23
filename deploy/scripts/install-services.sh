#!/usr/bin/env bash
set -Eeuo pipefail
if [[ "${EUID}" -ne 0 ]]; then echo "Run as root: sudo bash deploy/scripts/install-services.sh" >&2; exit 1; fi
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
install -m 0644 "$ROOT/deploy/systemd/vexause-web.service" /etc/systemd/system/vexause-web.service
install -m 0644 "$ROOT/deploy/systemd/vexause-worker.service" /etc/systemd/system/vexause-worker.service
systemctl daemon-reload
systemctl enable vexause-web.service vexause-worker.service
echo "Services installed and enabled. They will start after the app and .env are configured."
