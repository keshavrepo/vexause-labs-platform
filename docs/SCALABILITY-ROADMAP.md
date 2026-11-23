# VEXAUSE LABS — Scalability Roadmap

This is an incremental plan. Do not add paid infrastructure or premature complexity before traffic and operational needs justify it.

## Current foundations\n- Same-origin protection for browser mutations, baseline security headers, and PostgreSQL-backed shared rate limits.
- Next.js App Router + TypeScript; PostgreSQL + Prisma.
- Server-side catalogue filtering/pagination and selected-field responses.
- Persistent VPS media storage; keep customer CAD uploads private and separate.
- Server-side payment verification and webhook idempotency foundation.
- Audit trail foundations for sensitive admin operations.

## Before public launch
1. Tune current PostgreSQL rate limits and add account/email-based abuse controls for high-risk endpoints.
2. Add CSRF/origin checks for cookie-authenticated mutations and security headers.
3. Add structured JSON logging with request IDs; never log passwords, tokens, payment secrets or CAD file contents.
4. Add automated unit/integration tests for pricing, stock, coupon concurrency, payment verification, order transitions and authorization.
5. Add database backup automation, restore drills, disk monitoring and retention policy.
6. Add private-file authorization, malware scanning/quarantine and download audit for customer CAD files.
7. Configure SMTP transaction email and retryable notification jobs.
8. Add health/readiness endpoints and uptime monitoring.

## Growth stages
- Early traffic: single VPS, Nginx, Next.js process manager, PostgreSQL on persistent volume, daily encrypted off-site backups.
- Growing traffic: separate app and database hosts, connection pooler, background worker, Redis only when needed for queues/cache/rate limits, object storage only when local disk operations become a bottleneck.
- High traffic: horizontal app instances, CDN for public assets, cursor pagination, measured PostgreSQL query tuning, read replicas only for proven read pressure, queue-based email/webhook/media processing.
- Search growth: benchmark PostgreSQL `pg_trgm`/full-text search before introducing a dedicated search engine.

## Non-negotiable controls
- Never trust browser-calculated prices, inventory, coupon eligibility or payment success.
- Never expose customer CAD files through `public/`.
- Do not claim payment/refund/shipping actions succeeded until provider/server confirmation.
- No fabricated customer metrics, review counts, delivery promises, stock or certifications.
- Do not buy services or infrastructure without explicit owner approval.
