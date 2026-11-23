# Phase 17 — Background Jobs & Notifications

## Added
- PostgreSQL-backed `BackgroundJob` queue with pending/processing/completed/failed states, attempts, scheduled run time, lock metadata and last error.
- Worker process `npm run worker` and one-pass command `npm run worker:once`.
- Atomic claim operation prevents two workers from claiming the same pending job at once.
- Exponential retry delay and stale-lock recovery after a worker crash.
- Customer notification inbox API at `GET /api/customer/notifications`; mark one read with `PATCH`.
- Admin job monitor at `/admin/jobs` and protected API `/api/admin/jobs`, including failed-job retry.
- Order status changes enqueue customer notifications in the same database transaction.
- Support request status changes enqueue customer notifications in the same database transaction.
- SMTP/email job type is reserved but intentionally fails visibly until the SMTP adapter is configured in the final integration phase.

## Run locally after migration
```bash
npx prisma migrate dev --name phase_17_background_jobs
npm run worker
```
Run the worker as a separate supervised process on the VPS (systemd recommended), not inside a Next.js request handler. Use one worker initially; scale carefully after observing queue latency and database load.

## Job behavior
- Queue writes are durable in PostgreSQL.
- The worker claims a job with a conditional update, so multiple workers do not normally process the same pending job.
- Retries use bounded exponential backoff, up to the job's configured max attempts.
- Failed jobs remain visible to administrators and can be manually requeued.
- If a worker dies while holding a lock, a lock older than five minutes is recovered by the next worker poll.
- Notification creation is idempotency-limited by job claiming, but a crash after creating the notification and before marking the job complete can result in a duplicate notification. A future hardening pass should add a unique notification source/event key and transactional completion.

## Current limits
- No SMTP provider or credentials are configured; no email has been sent.
- No SMS or WhatsApp provider configured.
- No automated email templates or customer preference centre.
- Admin UI is a basic operational monitor, not a full observability dashboard.
- Worker has not been run because no database is configured in this environment.
