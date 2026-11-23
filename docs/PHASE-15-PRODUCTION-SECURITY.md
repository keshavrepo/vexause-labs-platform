# Phase 15 — Production Security & API Protection

## Implemented
- Global middleware adds baseline security headers: nosniff, frame denial, referrer policy, permissions policy, COOP, HSTS in production.
- Content Security Policy is initially `Report-Only` to avoid breaking Next.js or Razorpay checkout before the real domain and required script/connect sources are confirmed.
- Middleware checks Origin on browser state-changing `/api/*` requests (POST/PUT/PATCH/DELETE); only same-origin or explicitly configured `TRUSTED_ORIGINS` are allowed.
- Razorpay webhook path is excluded from Origin validation because providers authenticate webhooks with their signature; webhook signature verification remains the security control.
- PostgreSQL-backed atomic rate-limit buckets are shared across app instances (not per-process memory).
- Rate limits applied to admin login, customer login/registration, custom print enquiry, catalogue search, order creation and Razorpay create/verify endpoints.
- Rate-limit keys store SHA-256 hashes, not raw IP addresses.
- 429 responses include Retry-After and no-store headers.

## Rate limits currently configured
| Endpoint group | Limit | Window |
|---|---:|---:|
| Admin login | 10 | 15 minutes |
| Customer login | 10 | 15 minutes |
| Customer registration | 5 | 1 hour |
| Custom print enquiry | 5 | 1 hour |\n| Coupon validation | 30 | 1 hour |\n| Product image upload | 30 | 1 hour |\n| Customer review submission | 10 | 1 hour |
| Catalogue search | 120 | 1 minute |
| Order creation | 10 | 1 hour |
| Payment create | 15 | 1 hour |
| Payment verify | 30 | 1 hour |

Limits are per client fingerprint and endpoint namespace. They are conservative starting values and should be tuned after observing real traffic. Configure Nginx to overwrite `X-Real-IP` and `X-Forwarded-For`; do not blindly trust user-supplied forwarding headers.

## Required database migration
The `RateLimitBucket` model is new. Project currently has no checked-in Prisma migration history. After dependencies and PostgreSQL are configured, generate and apply one migration covering all pending schema changes:
`npx prisma migrate dev --name phase_15_security_rate_limits`
Then run `npx prisma generate`.

## VPS / deployment configuration
- Set `TRUSTED_ORIGINS` only for actual browser origins, comma-separated with scheme, e.g. `https://shop.example.com,https://www.shop.example.com`.
- Set `NEXT_PUBLIC_SITE_URL` to the canonical HTTPS origin.
- Nginx must terminate TLS, redirect HTTP to HTTPS, set trustworthy proxy headers, cap request body sizes, and restrict access to sensitive server paths.
- Schedule `scripts/cleanup-rate-limits.sql` daily after the migration is applied.
- Keep `SESSION_SECRET`, database credentials and payment secrets only in the VPS environment.
- Back up PostgreSQL and persistent uploads separately; test restoration.

## Important limitations / follow-up hardening
- CSP remains Report-Only until production browser testing confirms all Next.js, fonts, image, Razorpay and OAuth requirements. Do not switch to enforcing CSP blindly.
- Rate limiting currently uses the database; for extremely high request volumes, move counters to Redis only if/when the VPS load justifies it. This remains self-hostable/open-source.
- IP-based limits can be affected by shared networks and proxy configuration. Add account/email-based throttles and abuse monitoring before public launch.
- Add CAPTCHA only if abuse is observed and choose a provider after owner approval.
- Add structured logging, alerting, audit entries for every sensitive admin mutation, automated security tests, dependency scanning and penetration testing before production.
- This phase does not implement Google OAuth, Razorpay merchant onboarding, live API credentials, domain DNS, SMTP, courier credentials or production deployment. These require owner accounts, consent, secrets and external configuration.
- No dependency install, Prisma validation, build, automated tests or load tests were run in this phase.
