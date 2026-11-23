# Phase 41 — End-to-End Business Workflow Audit

## Workflow reviewed
Customer checkout and COD/online payment, custom quote acceptance and advance, production job creation, material consumption, quality inspection, dispatch readiness, shipment events, delivery, refunds and COD collection.

## Implemented correction: custom-order balance collection
The earlier custom quote flow could collect the quote's initial advance, but the normal payment-create endpoint only allowed `AWAITING_PAYMENT` orders. Once the advance was verified, the order moved to `PAID`, so the customer had no supported way to pay the remaining balance. The production dispatch gate correctly blocked dispatch until the full net amount was captured, leaving a dead end.

Phase 41 adds:
- For custom orders in `AWAITING_PAYMENT`, `PAID`, or `IN_PRODUCTION`, payment creation calculates outstanding balance from the accepted quote total, verified Razorpay captures, and successful refunds.
- A pending/created provider payment is reused. Once an advance payment is verified, a separate payment record is created for the outstanding amount rather than overwriting the verified advance record.
- The verification route accepts a custom balance payment while the order is `PAID` or `IN_PRODUCTION`, still checks Razorpay's captured status and exact provider order/payment/amount/currency match, records the payment and ledger credit, and does not regress the order status.
- Customer order detail now loads refund totals and exposes **Pay remaining balance** while a custom order is in production or paid and has a positive net balance.
- Dispatch remains blocked until verified captures minus successful refunds cover the full custom quote total.

## Verification
- `npm test`: 67/67 passed.
- Source-only import preflight: passed, 127 source files.
- TypeScript transpilation-only syntax sweep: 121 `.ts`/`.tsx` files, 0 syntax diagnostics.
- `bash -n`: all 7 shell scripts passed.
- These are source/contract and syntax checks, not full integration tests.

## Still needs real environment testing
- Run a Razorpay test-mode custom quote from acceptance through advance capture, second balance capture, and dispatch gate.
- Test a failed balance attempt followed by retry, duplicate callbacks, delayed webhook, partial refund, and full refund.
- Test COD collection after shipment and ensure only one collection ledger credit is recorded.
- Test concurrent balance-payment creation and provider timeout/retry behavior before production.
- Run PostgreSQL migrations, Prisma validation/client generation, Next.js production build, and browser/mobile QA.
- Confirm GST invoice rules for advance/partial payments with a qualified tax professional before enabling GST invoicing for custom quotes.

## Explicit workflow limits
- Courier status updates are manual; there is no carrier integration.
- Production scheduling, machine telemetry, slicer/G-code generation, and automated material weighing are not included.
- A COD collection entry records an administrator's supplied collection reference; it is not independently confirmed by a courier or bank.
- Refund completion still depends on Razorpay webhook/provider reconciliation.
