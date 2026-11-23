# Phase 40 — Security & Payment Workflow Audit

## Changes implemented
- Admin API sessions now re-check the current database account on each request. Disabled users, deleted users, and users whose role changed after login are denied even if an old JWT remains in the browser.
- Customer API sessions now re-check that the account still exists, is active, and remains a CUSTOMER.
- Razorpay checkout callback no longer treats a valid checkout signature alone as sufficient proof of payment. It fetches the payment server-to-server and requires provider status `captured`, matching payment ID, gateway order ID, INR currency, and exact stored order amount before marking the order paid.
- Online payment creation now accepts only `AWAITING_PAYMENT` orders; the earlier `PENDING_REVIEW` allowance was inconsistent with the COD order lifecycle.
- Admin refund flow now accepts captured payments already marked `REFUND_PENDING`, covering the late-capture-after-cancellation reconciliation path.
- Added static contract tests for current-account session checks, captured-payment verification, order/amount/currency binding, private file ownership and clean-scan checks, and late-capture refund handling.

## Verification
- `npm test`: 65/65 passed.
- Source-only import preflight: passed, 127 source files scanned.
- TypeScript transpilation-only syntax sweep: 121 `.ts`/`.tsx` files, 0 syntax diagnostics.
- `bash -n`: all 7 shell scripts passed.
- No live Razorpay credentials, gateway calls, PostgreSQL integration, concurrency testing, browser QA, or deployed environment were available. These changes are statically tested only.

## Remaining security/release considerations
- The admin API currently treats both ADMIN and STAFF as permitted for all admin API routes. If staff need narrower permissions (for example, production-only vs finance/refund access), introduce explicit permission checks before inviting staff accounts.
- CSP remains report-only pending real storefront, Google OAuth popup, and Razorpay checkout browser testing; do not claim it is enforced.
- Webhook secret and Razorpay key setup, provider dashboard webhook configuration, live/test transactions, and refund reconciliation must be tested with the merchant account before launch.
- Database-backed rate limiting relies on the reverse proxy setting a trustworthy `X-Real-IP`; keep the Next.js process bound to localhost behind the supplied Nginx configuration.
- Private upload files are stored locally and protected by authenticated routes; automated malware scanning is not bundled. The existing scan status must not be marked CLEAN unless an actual review/scanner has occurred.

## Manual release tests
1. Disable a customer account while a session is active; verify customer APIs return 401.
2. Change an admin's role or disable the account while logged in; verify admin APIs return 401.
3. Use Razorpay test mode: attempt verification with a valid signature for a non-captured payment and verify it is rejected.
4. Verify captured payment with a wrong amount, currency, payment ID, or order ID is rejected.
5. Verify a late capture for a cancelled order appears in refund reconciliation and can be submitted for refund.
6. Confirm customers cannot download another customer's custom design files or any file not marked CLEAN.
7. Test webhook duplicate delivery, delayed delivery, refund processed, and refund failed events.
