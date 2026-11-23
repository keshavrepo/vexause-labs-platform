# Phase 24 — Account recovery and transactional email

## Implemented

- Password-reset request endpoint with generic response to reduce account enumeration.
- Password-reset tokens are generated with cryptographic randomness, stored only as SHA-256 hashes, expire after 30 minutes, and are consumed atomically once.
- Password reset hashes the new password with bcrypt and invalidates other outstanding reset tokens for that account.
- Email-verification tokens are cryptographically random, stored as hashes, expire after 24 hours, and are consumed atomically once.
- New customer registration queues an email-verification message when `NEXT_PUBLIC_SITE_URL` is configured.
- Customer-facing forgot-password, reset-password and verification pages.
- PostgreSQL-backed rate limits on password-reset requests and submissions.
- Background worker now sends `EMAIL_DELIVERY` jobs through Nodemailer using SMTP credentials from the process environment. It fails visibly when required SMTP settings are missing.
- Added `emailVerifiedAt` to the Prisma User model.
- SMTP configuration keys added to `.env.example`.

## Critical operational policy

- Existing customer login is intentionally **not blocked** on email verification in this phase. This avoids locking out existing accounts and avoids pretending delivery is operational before SMTP is configured and tested. Do not advertise mandatory verified-email login yet.
- Google OAuth is not implemented in this phase.
- SMTP is code-complete but cannot deliver until a real SMTP provider/account and sender domain are configured and tested.
- Password reset and verification links require a correct `NEXT_PUBLIC_SITE_URL` using HTTPS in production.
- Do not expose tokens in API responses, logs, or admin screens.
- The schema change requires a Prisma migration before deployment.

## Required final integration

Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM`, and `NEXT_PUBLIC_SITE_URL` in the server/worker environment. Ensure the worker systemd service receives the same SMTP environment. Apply a reviewed Prisma migration, test delivery to controlled inboxes, test expiry/replay/rate-limit behavior, and only then consider enabling any mandatory verification policy.

## Verification status

Basic source presence and ZIP integrity checks were run. Dependency installation, Nodemailer delivery, Prisma schema validation, migration execution, TypeScript compilation, automated tests, security penetration testing, and end-to-end browser testing were not run. This phase is not a production-readiness certification.
