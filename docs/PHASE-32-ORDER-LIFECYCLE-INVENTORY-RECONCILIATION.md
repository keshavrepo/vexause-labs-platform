# Phase 32 — Order lifecycle and inventory reconciliation

## Delivered

- Checkout now snapshots `inventoryAllocated` on every order line. It is true only when the relevant base product or selected variant had inventory tracking enabled and stock was deducted.
- Added `inventoryRestoredAt` as an idempotency marker on order lines.
- Added optional `variantId` to inventory movements so stock-in/out records can identify variant-level changes.
- Added `lib/order-inventory.ts` to restore only stock actually allocated at checkout. The helper claims each order line once inside the surrounding database transaction, restores variant stock to the variant (not the base product), and writes STOCK_IN movement records.
- Customers can cancel their own `PENDING_REVIEW` or `AWAITING_PAYMENT` orders before any verified payment exists. Cancellation changes the order, restores eligible inventory, releases coupon redemption usage, marks outstanding CREATED/PENDING payments failed, writes status history/audit records and queues a customer notification in one serializable transaction.
- Admin cancellation uses the same inventory restoration and coupon release logic. It refuses direct cancellation if a verified payment exists; the refund process must be handled separately.
- Admin orders now expose payment and stock-allocation/restoration state for operational review, and the cancellation UI asks for confirmation.
- Razorpay `payment.failed` webhooks now mark non-verified payment attempts FAILED and create audit records. A retry after a failed attempt creates a fresh gateway order rather than reusing the failed gateway order ID.
- If a valid capture webhook arrives after an order was already cancelled, the payment is recorded as REFUND_PENDING and an audit event is created. It does not silently move the cancelled order back into fulfilment.

## Important limitations / manual operations

- This phase does not call a provider refund API. A payment marked REFUND_PENDING still requires an administrator to process and reconcile the refund with Razorpay.
- A captured payment arriving after cancellation requires prompt manual refund review; stock may already have been returned to sale.
- If the original product or variant record was deleted before restoration, the helper deliberately does not credit a different stock bucket. The order remains identifiable for manual inventory reconciliation.
- Variant inventory movements are recorded, but the existing inventory admin screens may still need a dedicated variant-level ledger view.
- Legacy order lines default `inventoryAllocated=false`. Existing orders created by earlier Phase 31 code before this migration need a deliberate data review before enabling automated cancellation; do not blindly backfill allocation flags from today's tracking settings.
- No automatic expiry/release job for abandoned payment sessions is included. Customers or admins can cancel eligible unpaid orders explicitly.

## Migration order

Apply after `20261124000200_variant_cart_checkout` as `20261124000300_order_inventory_reconciliation`. Generate and review the Phase 26 baseline migration first, then apply all delta migrations in timestamp order on a backed-up development database.

## Verification and limitations

- Contract tests cover allocation markers, idempotent restoration, variant-specific stock restoration, customer/admin cancellation guards, failed-payment webhook handling and fresh payment retry behavior.
- No npm install, Prisma validation/client generation, database migration execution, build, browser test, Razorpay sandbox/live test or real phone test was run in this environment.
- Production deployment remains blocked until the Phase 26 baseline migration is generated and reviewed, package-lock is created, and full integration tests pass.
