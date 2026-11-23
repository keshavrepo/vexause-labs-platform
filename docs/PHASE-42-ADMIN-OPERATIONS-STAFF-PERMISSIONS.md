# Phase 42 — Admin Operations & Staff Permission Audit

## Access model
- `ADMIN` is the only role allowed to use administrative APIs by default.
- `STAFF` is explicitly allowed only where the route opts in. Supported staff operations:
  - View order records (`GET /api/admin/orders`) but cannot change order status.
  - Manage shipment/tracking events (`POST /api/admin/orders/[id]/shipment`).
  - Use production queue, machine/material records, material consumption, quality inspection and dispatch-readiness workflow.
  - View inventory (`GET /api/admin/inventory`), without stock adjustment.
  - View custom print requests, upload design deliverables and download customer files only when the file is marked CLEAN.
- Finance, ledger export, payments, COD collection, refunds, coupons, GST/tax settings, analytics, reviews, support, staff management, product/catalogue changes, file scan-status review, inventory adjustment, order status changes and background-job retry remain ADMIN-only.

## Implementation
- `requireAdminApi` now defaults to ADMIN-only. Individual operational routes must explicitly opt in to STAFF access or specify allowed HTTP methods.
- Admin page layout checks the current database-backed session and admits only active ADMIN/STAFF users.
- Admin access-management page is ADMIN-only.
- `GET /api/admin/staff` lists staff accounts. `POST` promotes an existing account by email to STAFF. `PATCH` enables/disables only STAFF accounts.
- Staff role changes and enable/disable operations are audit logged. Users cannot change their own staff access through this endpoint.
- `getSession()` now revalidates user existence, active status and current role against PostgreSQL, so stale JWT claims do not grant page access.
- Order page hides manual order-status controls from STAFF. Shipment controls remain available to staff.

## Important operational notes
- Staff are existing registered accounts; there is no invitation email or staff password reset flow in this phase. The user must already have an account.
- Revoking staff access takes effect on the next authenticated request because API/page session checks read current user state from the database.
- The staff role is not a granular permission matrix yet. All opted-in staff can perform all operations on those operational routes. Do not grant STAFF to untrusted users.
- The existing dashboard may still display links to administrator-only pages for staff; the server/API denies access, but navigation visibility can be further polished.
- No PostgreSQL integration, build, browser, mobile, or multi-user concurrency tests were run.

## Verification
- `npm test`: 70/70 passed.
- Source-only import preflight: passed, 131 source files.
- TypeScript transpilation-only syntax sweep: 125 `.ts`/`.tsx` files, zero syntax diagnostics.
- `bash -n`: all 7 shell scripts passed.
