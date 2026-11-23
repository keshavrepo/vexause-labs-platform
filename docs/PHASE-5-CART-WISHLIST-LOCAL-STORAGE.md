# Phase 5 — PostgreSQL + VPS local storage + shopping cart and wishlist

## Architecture decision
- PostgreSQL remains the only application database (`provider = "postgresql"` in Prisma).
- Prisma remains the ORM.
- Product images are stored on persistent VPS disk under `public/uploads/products`.
- No S3-compatible provider or paid object-storage subscription is required for catalogue images.
- Customer CAD/model uploads will use a separate private directory outside `public/` in a later phase.
- Shopping cart and wishlist currently persist in browser localStorage. This is a free guest-first foundation; cross-device/customer-account synchronisation will be added with customer authentication and PostgreSQL cart/wishlist tables.

## Included
- Removed AWS S3 SDK dependencies and S3 configuration.
- Admin-only multipart image upload endpoint with 8 MB limit and image signature checks.
- Local image deletion endpoint with path traversal protection.
- Storefront product listing with search, category filters and sorting.
- Product detail pages.
- Add to cart, quantity changes, remove from cart.
- Wishlist add/remove.
- Browser persistence for cart and wishlist.
- Stock-aware add-to-cart controls and visible subtotal.
- Checkout deliberately disabled until server-side stock reservation, address validation, tax/shipping calculation, payment verification and order creation are implemented.

## VPS operations
- Ensure the deploy user can write to `public/uploads/products`.
- Mount the application directory on persistent disk (do not use ephemeral container storage).
- Back up uploaded product images off-server as well as backing up PostgreSQL.
- Set upload limits in Nginx and monitor disk usage.
- For multi-server deployment, move media to shared object storage later; this is not needed for a single VPS.

## Known limitations / next phase
- Cart/wishlist are per-browser and can be cleared by the customer; not yet synced across devices.
- Checkout and Buy Now payment flow are not active.
- Price and stock must be revalidated server-side before order creation.
- No coupons, customer login, reviews, product variants or shipping calculations yet.
- Product images are public catalogue media. Never store customer STL/OBJ/3MF files here.
- No dependency installation, TypeScript build or live VPS test was run in this environment.
