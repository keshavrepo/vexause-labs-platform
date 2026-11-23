# Phase 16 Change Log

1. Added separate direct Prisma connection URL for migrations.
2. Added liveness and database readiness API endpoints.
3. Added PostgreSQL backup, guarded restore, and connectivity scripts.
4. Added backup/restore and operations runbooks.
5. Added package scripts for Prisma generate/migrate/status and DB health.
6. Added Git ignore rules for secrets, backups, product uploads, and private CAD uploads.

No database migration was generated because no database is configured in this environment. The initial migration must be created and reviewed on a clean development database.
