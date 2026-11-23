# Phase 16 — Database Reliability

## What this phase adds
- Separate Prisma `DATABASE_URL` (application traffic) and `DIRECT_URL` (Prisma CLI/migrations). If no pooler is used, set both to the same PostgreSQL URL.
- Liveness endpoint: `GET /api/health/live` — process-level response; it does not prove database connectivity.
- Readiness endpoint: `GET /api/health/ready` — executes `SELECT 1`; returns 503 when PostgreSQL is unavailable and never returns database error details.
- PostgreSQL custom-format backup, guarded restore, and connectivity scripts.
- `.gitignore` rules for environment secrets, runtime uploads, customer CAD files, and database backups.

## First database setup (clean database)
1. Install PostgreSQL on the VPS and create an application database plus a least-privilege application role.
2. Configure `.env` with `DATABASE_URL` and `DIRECT_URL`. Keep both out of Git. Use URL-encoded credentials where required.
3. Install dependencies and generate the Prisma client:
   ```bash
   npm ci
   npx prisma generate
   ```
4. The project now preserves the pre-Google baseline schema at `prisma/schema.baseline.prisma`. Generate its real initial migration DDL using `npm run db:baseline:generate`, review and commit it. The Google OAuth change remains a later delta migration:
   ```bash
   npm run db:baseline:generate
   ```
   Review and commit the generated `prisma/migrations/` directory. Do not use `db push` as the production migration process.
5. On the production VPS, after reviewing the committed migration:
   ```bash
   npx prisma migrate deploy
   ```
6. Check readiness:
   ```bash
   curl -i https://YOUR_DOMAIN/api/health/ready
   ```

For future schema changes, create a named migration in development with `prisma migrate dev`, commit it, and apply it in deployment with `prisma migrate deploy`. Never edit an already-applied migration; add a new migration.

## Backups
Set `DATABASE_URL` in a root-readable environment file or protected service environment, then:
```bash
sudo install -d -m 700 -o root -g root /var/backups/vexause/postgres
sudo -E BACKUP_DIR=/var/backups/vexause/postgres RETENTION_DAYS=14 ./scripts/db-backup.sh
```
The script creates a PostgreSQL custom-format dump and SHA-256 checksum. Backups contain customer and business data: restrict access, encrypt them before transfer/storage, and never commit them to Git or put them under `public/`.

A local VPS backup is not sufficient disaster recovery. Copy encrypted backups to a separate owner-controlled server or storage location. Keep the encryption key separate from the backup. Do not put credentials in shell history or log output.

## Restore drill
1. Provision a separate empty staging database.
2. Verify the checksum: `sha256sum -c backup-file.dump.sha256`.
3. Run `scripts/db-restore.sh backup-file.dump 'postgresql://.../staging_db'` and type the exact confirmation phrase.
4. Point a staging copy of the app at that database and verify sign-in, catalogue, checkout/order history, admin operations, and payment records.
5. Only plan production cutover after a successful restore and owner approval.

The restore script is destructive to objects in the selected target database. Never point it at production casually. Prefer restoring into a fresh database first. A restore is not a tested recovery plan until the application has been checked against the restored database.

## Scheduling and retention
Schedule `db-backup.sh` daily using a systemd timer or cron under a restricted service account. Monitor exit status and alert on missed backups. The script defaults to 14-day local retention; choose retention and offsite retention based on legal, business, and storage needs. Test restores at least monthly and before major releases.

## Connection pooling
- Start with direct PostgreSQL connections on a small single VPS deployment.
- If connection counts become a problem, deploy PgBouncer on the private network and use transaction pooling for application traffic.
- Keep `DIRECT_URL` pointed at PostgreSQL directly for Prisma migrations and administrative commands.
- Do not expose PostgreSQL publicly; firewall it to the app host/private network.
- Tune `max_connections` and pool sizes based on measured workload and VPS RAM, not guessed high values.

## Operational boundaries
This phase adds scripts and endpoints only. No VPS, database, backup, restore, migration, monitoring, or load test has been executed from this chat. No real credentials were supplied or stored. Before launch, configure alerting, offsite encrypted backup, restore drills, firewall, PostgreSQL TLS/network policy, and least-privilege roles.
