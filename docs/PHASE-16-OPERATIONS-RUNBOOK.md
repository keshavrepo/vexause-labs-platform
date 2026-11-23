# Database Operations Runbook

## Daily checks
- Confirm `/api/health/ready` returns HTTP 200.
- Confirm the latest backup exists and its checksum file is present.
- Confirm an offsite encrypted copy completed successfully.
- Review PostgreSQL disk usage and logs.

## Before deployment
- Take a fresh backup.
- Review the migration SQL generated in development.
- Confirm sufficient free disk space.
- Deploy code and run `npx prisma migrate deploy`.
- Check readiness and a small set of storefront/admin smoke tests.

## Incident: database unavailable
1. Check VPS disk, PostgreSQL service status, network/firewall, and PostgreSQL logs.
2. Do not repeatedly restart services without checking disk and recovery state.
3. Check `/api/health/ready`; `/api/health/live` only confirms the web process responds.
4. Restore only after confirming the failure mode and selecting a known-good backup.
5. Record incident time, recovery point, data loss (if any), and corrective action.

## Recovery objectives
Set explicit owner-approved RPO (maximum acceptable data loss) and RTO (maximum acceptable downtime) before launch. The backup cadence and offsite replication must meet those objectives. This project does not yet promise an RPO or RTO.
