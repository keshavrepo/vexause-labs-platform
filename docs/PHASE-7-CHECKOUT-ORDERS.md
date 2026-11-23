# Phase 7 — Checkout foundation and order management

## Added
- Customer checkout page with account-address selection and optional order notes.
- Server-side order creation API. It reads the signed-in customer's database cart, rechecks published status, current prices, quantity bounds and tracked stock, then snapshots product names/SKUs/prices into OrderItem rows in a serializable transaction.
- Customer order list and private order detail/status history pages.
- Admin order list and status update endpoint with audit log entries.
- Admin dashboard navigation link to Orders.
- Cart page checkout link.
- Fixed missing Prisma reverse relations for customer token/cart/wishlist and product cart/wishlist relations from the prior phase.

## Important operating rules
- COD is OFF by default. An administrator must explicitly create/update StoreSetting `COD_ENABLED` with JSON boolean `true` before COD orders can be accepted.
- Optional `COD_MAX_ORDER_PAISE` is a numeric paise limit. If absent or zero, no additional amount cap is applied.
- Online payment is not connected. No client-side action can mark an order paid.
- Orders are created as `PENDING_REVIEW`; admin must review and move them through the operational statuses.
- This phase does not decrement stock. Stock reservation/decrement and release rules must be implemented with the fulfilment/payment lifecycle before production.
- Shipping and tax are not calculated. Do not launch checkout until real shipping/tax rules and payment choices are configured.
- Custom-print quote acceptance and custom-order payment remain separate future work.

## Not yet production-ready
- No payment gateway, webhook verification, refund workflow, shipping integration, tax/GST calculation, coupon engine, stock reservation, COD risk checks, rate limiting, CSRF/origin protections, email notifications, or customer cancellation request flow.
- Admin status transitions are basic and need a stricter transition matrix plus role-specific permissions.
- Must run Prisma validation/migration, install dependencies, type-check, build and test on a real PostgreSQL VPS before deployment.
