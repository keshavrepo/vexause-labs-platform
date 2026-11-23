# Phase 8 — Inventory operations and order controls

## Added
- Admin inventory overview with catalogue search, stock counts, low-stock and out-of-stock summaries.
- Stock add, remove and set-exact-quantity actions.
- Every adjustment writes an InventoryMovement row and an AuditLog row in the same serializable transaction.
- Prevents negative stock and rejects zero-delta adjustments.
- Low-stock threshold reads StoreSetting `LOW_STOCK_THRESHOLD` (JSON number); default is 5 units.
- Inventory list API includes the three latest movements per product for future history UI.
- Admin order status updates now enforce a transition map.
- Orders cannot be moved to PAID unless a Payment row for that order is already VERIFIED.
- Admin navigation now links to Orders and Inventory.

## Order transition map
- PENDING_REVIEW → AWAITING_PAYMENT or CANCELLED
- QUOTED → AWAITING_PAYMENT or CANCELLED
- AWAITING_PAYMENT → PAID or CANCELLED
- PAID → IN_PRODUCTION or REFUND_PENDING
- IN_PRODUCTION → READY_TO_SHIP or REFUND_PENDING
- READY_TO_SHIP → SHIPPED or REFUND_PENDING
- SHIPPED → DELIVERED or REFUND_PENDING
- REFUND_PENDING → REFUNDED
- DELIVERED, CANCELLED, REFUNDED are terminal here.

## Important caveats
- No automated stock reservation, order-linked stock deduction, cancellation restock, or returns restock yet. Admin adjustments are manual and audited.
- Low-stock threshold is currently read-only in this UI; an administrator can set StoreSetting `LOW_STOCK_THRESHOLD` directly in PostgreSQL.
- Payment verification/webhooks are not implemented, so PAID transition remains blocked until a verified Payment record exists.
- COD collection confirmation is not implemented.
- No email/WhatsApp alerts yet.
- Must run Prisma validation/migrations, install dependencies, type-check/build, and test against PostgreSQL before deployment.
