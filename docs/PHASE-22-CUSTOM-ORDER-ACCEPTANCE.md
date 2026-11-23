# Phase 22 — Custom Quote Acceptance & Order Creation

## Implemented
- Accepting a valid, unexpired SENT quote now creates a CUSTOM order linked to the custom request and quote.
- Quote acceptance and order creation occur in one serializable transaction.
- Repeated acceptance returns the existing order instead of creating a duplicate.
- The order total preserves the complete approved quote amount.
- The initial payment record uses the quote advance amount; if no advance is specified, the full quote total is due.
- Custom orders are Razorpay-only in this workflow; COD is never enabled for custom jobs.
- Razorpay order creation uses the payment record amount, allowing the advance to differ from the full quote total.
- Customer is redirected to the created order detail page, where the payment action and remaining balance summary are shown.
- Order detail API returns quote and payment records to the authenticated owner.
- Audit trail and order status history record quote acceptance and initial amount due.

## Not included yet
- Automatic collection of the remaining balance after production/preview approval.
- Guest quote acceptance and secure guest order lookup.
- Shipping address capture for custom jobs if no account address exists.
- Automated custom production scheduling, material/capacity validation or instant pricing.
- Refund/partial refund automation and payment settlement reconciliation.

## Payment behavior
The accepted quote's full value remains the order total. A Payment row is created for the advance amount (or full amount if advance is zero). Razorpay checkout charges the Payment row amount. After successful verification, the order enters PAID, but for an advance payment this indicates the initial payment was received, not that the complete quoted balance is settled. The customer order page displays verified payments and remaining balance. The team must confirm balance collection before dispatch until the dedicated balance-payment phase is implemented.

## Validation
No dependency installation, Prisma generation, database migration, application build, automated tests or live Razorpay transaction has been run in this environment. Prisma schema is unchanged in this phase.
