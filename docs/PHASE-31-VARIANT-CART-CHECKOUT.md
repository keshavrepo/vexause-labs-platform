# Phase 31 — Variant-aware cart and checkout

## Delivered

- Extended `CartItem` with optional `variantId` and a ProductVariant relation.
- Cart identity now distinguishes each product/variant pair. Migration drops the old product-only unique index, adds a composite unique index, and adds a partial unique index for one base-product line when `variantId` is NULL (PostgreSQL NULL uniqueness behavior).
- Extended `OrderItem` with optional `variantId` and `variantName` snapshot fields; order line product name and SKU also capture the selected variant at purchase time.
- Customer cart GET returns the selected variant. POST validates product/variant ownership, active status and stock. DELETE identifies the exact product/variant line. PUT replaces/synchronizes the authenticated customer's cart after validating all lines.
- Browser cart supports multiple variants of the same product, variant-specific quantities, prices, availability and cart totals.
- Product detail Add to Cart now adds the currently selected variant. Wishlist and catalogue shortcuts do not bypass required option selection.
- Cart page synchronizes its current local cart to the signed-in customer's database cart; unauthenticated visitors retain their local cart and are redirected to sign in at checkout.
- Checkout recalculates every line using the selected variant's current database price, validates the selected variant and inventory, applies coupons to the correct subtotal, and stores variant-aware order line snapshots.
- Checkout atomically decrements tracked variant or base-product stock in the same database transaction as order creation. Base-product stock-out movements are recorded in the existing inventory movement table.

## Inventory allocation caveat

Stock is allocated when the order is created, including Razorpay orders that are still awaiting payment. This prevents overselling between checkout and payment, but automatic stock release for abandoned/failed online orders or admin-rejected/cancelled COD orders is not implemented in this phase. Until a later expiry/reversal workflow exists, staff must reconcile and restore stock deliberately when cancelling such orders. Variant-level stock movements are not yet represented in the existing product-only InventoryMovement table.

## Migration order

The new migration `20261124000200_variant_cart_checkout` follows `20261124000100_product_variants`. Generate and review the Phase 26 baseline migration first, then apply the Google, ProductVariant, and variant-cart migrations in order on a backed-up development database.

## Verification and limitations

- Contract tests cover variant identity, cart synchronization, selected pricing, order snapshots and atomic stock update code paths.
- No npm install, Prisma validation/client generation, database migration execution, build, browser test, Razorpay test or real phone test was run in this environment.
- The existing deployment baseline migration generation requirement remains unresolved; do not deploy until it is generated and reviewed.
