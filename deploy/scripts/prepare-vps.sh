#!/usr/bin/env bash
set -Eeuo pipefail
if [[ "${EUID}" -ne 0 ]]; then echo "Run as root: sudo bash deploy/scripts/prepare-vps.sh" >&2; exit 1; fi
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y nginx postgresql postgresql-contrib curl ca-certificates rsync ufw
if ! id vexause >/dev/null 2>&1; then
  useradd --system --create-home --home-dir /var/lib/vexause --shell /usr/sbin/nologin vexause
fi
install -d -o vexause -g vexause -m 0750 /var/www/vexause/app
install -d -o vexause -g vexause -m 0750 /var/www/vexause/app/public/uploads/products
install -d -o vexause -g vexause -m 0700 /var/lib/vexause/private-uploads
install -d -o vexause -g vexause -m 0700 /var/lib/vexause/backups
echo "Base packages and VEXAUSE directories prepared."
echo "Node.js 20+ must be installed using the official Node.js distribution for your Ubuntu release."
echo "Review firewall policy before enabling UFW; preserve SSH access."
