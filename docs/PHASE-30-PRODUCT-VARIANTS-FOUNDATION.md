# Phase 30 — Product variants foundation

## Delivered

- Added `ProductVariant` to Prisma with product relation, variant label, optional unique SKU, JSON option values, independent price/compare-at price, stock quantity, inventory tracking, active state, sort order and timestamps.
- Added delta migration `20261124000100_product_variants` after the Google identity migration. It creates the variant table, unique SKU index, product/status/order index and cascading product foreign key.
- Added admin-authenticated variant list/create/update/archive API routes. Inputs are validated, compare-at price must exceed variant price, duplicate SKUs return a conflict, and mutations are audited.
- Added an admin variant management screen with option entry in `Key=Value` form (for example `Size=Small, Colour=Black`), price, compare-at price, SKU and stock controls.
- Added a Variants entry point to each admin catalogue row.
- Public product detail API returns active variants only, ordered for display, with option values, SKU, price and inventory availability.
- Product detail displays a variant selector and reflects the selected variant's price, comparison price, SKU and stock.
- Catalogue displays the lowest active variant price, filters by variant price ranges, and calculates availability from active variants. The existing price sort still uses the parent product's base price; a min-variant-price sort is a separate optimization not claimed in this phase.
- Variant products cannot be added to cart through the product detail or catalogue yet. Their purchase CTA is deliberately gated. The authenticated customer cart API and checkout order-creation path also reject variant products until cart persistence, cart UI, order snapshots, checkout validation, stock updates and payment totals all carry a selected `variantId`. This prevents API bypasses that could charge the base product price or deduct the wrong stock.

## Important migration note

This is a delta migration, not the missing generated initial baseline migration described in Phase 26. On the development machine, generate/review the baseline migration first, then run Prisma validation/client generation and apply migrations in order. Do not deploy this migration against an uninitialized database.

## Boundaries / not claimed

- No variants were seeded and no product data was invented.
- Variant update is supported by the API; the initial admin screen supports adding and archiving variants. Editing existing variant fields is not yet exposed in the screen.
- Variant-aware cart and checkout are not complete and remain intentionally disabled for products with variants.
- No dependency installation, Prisma generation, database migration execution, Next.js build or live checkout test was run here.

## Verification

Run `npm test`, `npx prisma validate`, `npx prisma generate`, then review/apply migrations on a backed-up development database. Complete variant-aware cart and checkout before enabling variant products for sale.
