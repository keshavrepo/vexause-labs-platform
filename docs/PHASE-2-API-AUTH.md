# Phase 2 — API and Admin Authentication Foundation

## Included
- Prisma client singleton.
- Admin/staff login endpoint using bcrypt password verification.
- Signed, HTTP-only, same-site session cookie (8-hour expiry).
- Role check for protected admin API routes.
- Public product listing endpoint and protected product creation endpoint.
- Custom 3D-printing enquiry submission endpoint.
- Admin bootstrap script that hashes the password before storing it.
- Environment variable example.

## API routes
- `POST /api/auth/login` — admin/staff login.
- `GET /api/products` — published storefront products.
- `POST /api/products` — create product (ADMIN/STAFF session required).
- `POST /api/custom-requests` — submit a custom printing enquiry.

## Setup
1. Copy `.env.example` to `.env` and fill in a real PostgreSQL `DATABASE_URL`.
2. Generate a strong session secret (32+ characters); never commit `.env`.
3. Install packages: `npm install`.
4. Generate Prisma client: `npx prisma generate`.
5. After reviewing schema, create and apply a migration: `npx prisma migrate dev --name initial`.
6. Create an admin account in a trusted local environment:
   `ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run admin:create`
7. Start locally: `npm run dev`.

## Security boundaries / not yet implemented
- Do not expose uploaded model files through public URLs. Private object storage and short-lived signed URLs are a separate phase.
- The custom request endpoint currently accepts metadata only; file upload is not yet wired.
- Login currently has no rate limiter or CAPTCHA. Add a persistent rate limit before public production launch.
- Add CSRF/origin protections to state-changing cookie-authenticated endpoints before production.
- STAFF is currently allowed to create products; refine granular permissions before inviting staff.
- No password reset, logout UI, email verification, or customer account flow yet.
- No payment endpoint is implemented in this phase. Never mark an order paid based on browser input.
- Run dependency audit, migrations, tests, and security review before deployment.
