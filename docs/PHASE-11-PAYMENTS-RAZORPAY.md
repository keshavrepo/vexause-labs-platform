# Phase 11 — Payment gateway integration (Razorpay)

## Included
- Razorpay Orders API integration through server-side HTTPS requests; no paid SDK dependency.
- Checkout payment option for Razorpay and COD (COD remains disabled unless `COD_ENABLED` store setting is true).
- Customer payment-order creation endpoint scoped to the signed-in customer's own order.
- Checkout signature verification using HMAC-SHA256 and timing-safe comparison.
- Signed webhook endpoint with event-id deduplication for `payment.captured` and `order.paid`.
- Successful verification marks the Payment `VERIFIED` and moves an `AWAITING_PAYMENT` order to `PAID` with status history and audit log.
- Customer can retry online payment from order details if checkout was closed.
- Read-only admin payment ledger at `/admin/payments`.

## Required environment
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET` (separate secret configured in Razorpay dashboard)
- Existing `DATABASE_URL` and `SESSION_SECRET`

Set the webhook URL to `https://YOUR_DOMAIN/api/webhooks/razorpay`, subscribe to `payment.captured` and `order.paid`, and configure test credentials first. Do not commit secrets or use test keys in production.

## Important operational notes
- No live/test payment was performed in this workspace.
- Payment gateway keys are not present; checkout will return a configuration error until supplied.
- Verify callback signature and webhook signature are both checked server-side.
- The webhook handler records provider events idempotently using `x-razorpay-event-id`.
- Refund initiation, refund webhooks, partial refunds, chargebacks, reconciliation reports and settlement matching are not implemented.
- COD remains controlled by `StoreSetting.COD_ENABLED` and optional `COD_MAX_ORDER_PAISE`.
- Before production, validate webhook amount/currency against the stored payment and harden webhook event handling, rate limits, CSRF/origin protections, logging and alerting.
- The current checkout clears the cart at order creation. If a gateway initiation fails, the order remains visible under My Orders and payment can be retried there.
- Run Prisma migrations and generate the client before starting the application.

## Test checklist (not executed)
1. Use Razorpay test keys and test cards only.
2. Create an online order and confirm a Razorpay order is created for the exact amount in paise.
3. Complete payment and verify the checkout callback.
4. Replay the same webhook event; it must not duplicate payment processing.
5. Send an invalid webhook signature; expect HTTP 400.
6. Confirm no order becomes PAID from client-side input alone.
7. Confirm COD is rejected unless explicitly enabled.
