# Phase 3 — Product Catalogue Management

## Included
- Admin product catalogue page at `/admin/products`.
- Search products by name, SKU, and slug.
- Create products with INR pricing, stock, category, descriptions, and draft/published state.
- Protected admin product listing endpoint.
- Product detail read endpoint for published products.
- Product update endpoint with validation.
- Safe unpublish endpoint instead of destructive deletion.
- Category listing and protected category creation.
- Audit log entries for product and category actions.

## APIs
- `GET /api/admin/products` — admin-only catalogue listing.
- `GET /api/products` — public published catalogue.
- `POST /api/products` — admin/staff product creation.
- `GET /api/products/:id` — public published product detail.
- `PATCH /api/products/:id` — admin/staff update.
- `DELETE /api/products/:id` — admin/staff unpublish (soft hide).
- `GET /api/categories` — active categories.
- `POST /api/categories` — admin/staff create category.

## Notes
- Money is stored as integer paise, not floating-point currency.
- Product images are represented in the Prisma schema, but image upload/storage is not implemented yet.
- No fake product listings or ratings are seeded.
- This is an admin foundation, not a finished Amazon/Flipkart clone.
- Before production: add rate limiting, CSRF/origin validation, granular staff permissions, product image storage, category update/archive UI, inventory movement transactions, automated tests, and accessibility review.
