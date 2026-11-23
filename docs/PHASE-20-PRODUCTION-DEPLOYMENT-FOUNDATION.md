# Phase 20 — Production Deployment Foundation

This phase adds self-hosted VPS deployment templates. It does not provision a VPS, create DNS records, install a domain certificate, or deploy the app.

## Target layout
- App: `/var/www/vexause/app`
- Product images: `/var/www/vexause/app/public/uploads/products` (persistent; back up)
- Customer CAD/reference/design files: `/var/lib/vexause/private-uploads` (private; back up)
- Database backups: `/var/lib/vexause/backups`
- Web process: `vexause-web.service`
- Background worker: `vexause-worker.service`
- Next.js listens only on `127.0.0.1:3000`; Nginx is the public reverse proxy.

## VPS baseline
Recommended starting point for a small launch: Ubuntu LTS, 2 vCPU, 4 GB RAM and SSD storage, then scale based on measured traffic, image storage and build memory. PostgreSQL should be on the same VPS initially only if resources and backup strategy are adequate; a separate database VPS can be introduced later. This is a planning baseline, not a guaranteed capacity estimate.

Run as root:
```bash
sudo bash deploy/scripts/prepare-vps.sh
```
This installs Nginx, PostgreSQL, curl, rsync and UFW packages and creates the `vexause` service user/directories. It intentionally does not configure PostgreSQL roles/passwords, Node.js, firewall rules or DNS.

Install Node.js 20+ using the official distribution suitable for the chosen Ubuntu LTS. Verify:
```bash
node --version
npm --version
```

## App setup
1. Place the complete project in `/var/www/vexause/app`, owned by `vexause:vexause`.
2. Create `.env` from `.env.example`; edit it on the VPS and set permissions `chmod 600 .env`.
3. Configure `DATABASE_URL`, `DIRECT_URL`, `SESSION_SECRET`, `NEXT_PUBLIC_SITE_URL`, `TRUSTED_ORIGINS`, and private storage path. Do not add real credentials to Git.
4. Set `PRIVATE_UPLOAD_DIR=/var/lib/vexause/private-uploads`.
5. Ensure PostgreSQL is running and a dedicated least-privilege database/user exists.
6. Generate and commit `package-lock.json` from a trusted development environment before production deployment. It is not included yet in this project snapshot.
7. Create and review the initial Prisma migration from the final schema on a clean development database, commit `prisma/migrations`, and test it on staging. The current archive does not include migrations. Production deployment uses `prisma migrate deploy`; it must not generate migrations on the live server.
8. Install systemd units:
```bash
sudo bash deploy/scripts/install-services.sh
```
9. Configure Nginx using `deploy/nginx/vexause.conf`, replacing `YOUR_DOMAIN`. Validate with `sudo nginx -t`.
10. Point DNS and enable HTTPS using the separate guide `deploy/nginx/HTTPS-ENABLEMENT.md`.
11. Ensure app directories are owned by `vexause` and `.env` is readable only by the service user/root.
12. Start the first deployment by running `scripts/deploy-vps.sh` as an operator with sudo access. Review logs and readiness.

## Deploy and health checks
```bash
npm run deploy:check
bash scripts/deploy-vps.sh
sudo systemctl status vexause-web vexause-worker
sudo journalctl -u vexause-web -n 100 --no-pager
curl -fsS http://127.0.0.1:3000/api/health/live
curl -fsS http://127.0.0.1:3000/api/health/ready
```
The deploy script requires a committed lockfile and at least one committed Prisma migration, runs `npm ci`, generates Prisma client, applies already-committed migrations, builds Next.js, restarts the web service and waits for readiness. If readiness fails, it prints recent service logs. It does not implement automatic release rollback; take a VPS snapshot and database backup before each release.

## Nginx and proxy trust
The Nginx template overwrites `X-Real-IP` and `X-Forwarded-For` with the direct remote address. This is important because Phase 15 rate limiting derives a client fingerprint from proxy headers. If another load balancer/CDN is placed in front, configure trusted proxy ranges and adjust this deliberately; never trust arbitrary client-supplied forwarding headers.

The Nginx template permits 30 MB request bodies to support custom CAD uploads (application validation still caps individual files at 25 MB). Nginx is the only public ingress; port 3000 must not be exposed publicly.

## Security and operations
- Allow inbound SSH, HTTP and HTTPS only; choose firewall rules carefully and preserve SSH before enabling UFW.
- Keep PostgreSQL bound to localhost unless there is a deliberate private-network architecture.
- Keep private uploads outside `public/`; never serve CAD files as static assets.
- Product images and private CAD uploads must be included in separate backup policies.
- Use the Phase 16 backup/restore scripts and conduct a restore drill before launch.
- Monitor `vexause-web` and `vexause-worker`; worker should run as a separate service.
- Configure log rotation/retention and disk monitoring.
- Do not enable production CSP enforcement until report-only observations and payment/auth flows have been tested.
- Keep Razorpay, Google OAuth, SMTP and courier account credentials for the final integration stage as requested.

## Rollback
No automatic rollback is included. Before each release:
1. Take a verified database backup and backup uploads.
2. Keep the previous source release available.
3. Apply only backward-compatible migrations where possible.
4. If app code fails, restore the previous code release and restart services.
5. Never restore a database backup over production without a reviewed recovery plan; migrations may have changed schema/data.

## Validation status
No VPS, domain, DNS, TLS certificate, PostgreSQL instance, systemd service or Nginx site was provisioned by this phase. No production build or live deployment test has been executed. This phase provides reviewed starting templates, not a live launch.
