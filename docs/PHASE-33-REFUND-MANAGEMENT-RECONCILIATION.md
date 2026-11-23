# Phase 33 — Refund management and payment reconciliation

## Delivered

- Added a `Refund` ledger linked to the original verified `Payment` and `Order`, with amount in paise, reason, internal idempotency key, provider refund ID/status, failure reason, operator and timestamps.
- Added an admin-only refund API and `/admin/refunds` workspace.
- The admin workspace lists eligible Razorpay captures, existing refund reservations and refund history. The operator enters an amount and reason before initiating.
- The API only accepts a verified Razorpay payment with a captured gateway payment ID. It checks remaining refundable value and creates an internal refund record in a Serializable transaction before calling the Razorpay refund endpoint.
- Provider `processed` responses become SUCCEEDED; pending provider responses remain PROCESSING; provider rejection becomes FAILED; unknown network outcome becomes MANUAL_REVIEW and must be checked in the Razorpay dashboard before any retry.
- Signed Razorpay `refund.processed` and `refund.failed` webhook events update the matching refund record. Refund completion is recalculated against all verified payments on the order.
- Payment status becomes REFUNDED only when its successful refund total covers that payment. Order status becomes REFUNDED only when all captured payments for the order are fully refunded; otherwise it remains REFUND_PENDING.
- Added audit events for refund initiation, provider submission/rejection and webhook updates.

## Safety / operational notes

- **This API performs a real refund request** against Razorpay. Only an authorized admin can submit it. Review the selected order, payment, amount and reason carefully.
- Do not retry a MANUAL_REVIEW refund blindly. Its network result may be ambiguous; first reconcile the refund ID and amount in the Razorpay dashboard.
- A FAILED provider refund releases the reserved amount back to the remaining refundable balance after reconciliation.
- COD/manual offline collections are not automatically refundable in this workflow because this platform does not yet record verified cash collection evidence. Process such cases outside this API and retain separate accounting evidence.
- Partial refunds remain REFUND_PENDING until all verified payment amounts are fully refunded. No partial-refund order status was added.
- The provider refund endpoint and webhook lifecycle have not been exercised with live or sandbox credentials in this environment.
- Provider webhook event delivery must be configured for `refund.processed` and `refund.failed`.

## Migration

Apply `20261124000400_refund_management` after the Phase 32 migration. Generate and review the Phase 26 baseline migration first and apply all delta migrations in timestamp order on a backed-up development database.

## Verification limitations

- Contract tests check schema relations, migration, admin authorization, verified-payment guard, refund cap, provider submission, webhook updates and full-refund reconciliation.
- No npm install, Prisma validate/client generation, database migration, build, browser/device test, Razorpay sandbox/live request or live webhook test was run.
