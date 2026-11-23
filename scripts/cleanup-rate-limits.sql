-- Run daily via VPS cron after Phase 15 migration is applied.
-- Retain active buckets; remove expired rows to keep the table compact.
DELETE FROM "RateLimitBucket" WHERE "resetAt" < NOW() - INTERVAL '1 day';
