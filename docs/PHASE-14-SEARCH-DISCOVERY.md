# Phase 14 — Search, Filters & Product Discovery

## Implemented
- Added a dedicated `/api/products/by-slug/[slug]` endpoint so product detail pages are not limited to the first catalogue page.\n- Catalogue API is server-side paginated (`page`, `limit`; maximum page size 48).
- Search across product name, short description, description and SKU; query length capped at 80.
- Category filter uses active category slug.
- Min/max price filters use paise, with validation for invalid ranges.
- Sorting: newest, price ascending, price descending, name ascending; deterministic ID tie-breakers.
- In-stock-only filter is applied in the database query (including products that do not track stock).
- Catalogue response returns only required product fields, one lead image, approved-review count, availability, category facets and pagination metadata.
- Search input is debounced and in-flight requests are aborted when filters change.
- Product cards lazy-load images.
- Product detail pages now emit product-specific title/description, canonical URL when `NEXT_PUBLIC_SITE_URL` is configured, and Open Graph metadata.
- Added PostgreSQL indexes for published+created, published+price, category+published and product name.
- API response has short shared-cache headers with stale-while-revalidate.

## Product detail route compatibility

The slug endpoint moved from `GET /api/products/:slug` (`app/api/products/[slug]`) to `GET /api/products/by-slug/:slug` (`app/api/products/by-slug/[slug]`) because Next.js does not allow `[slug]` and `[id]` routes at the same path level. The storefront now calls the new slug URL. The ID-based `GET/PATCH/DELETE /api/products/:id` and `GET /api/products/:id/reviews` URLs are unchanged.

## API
`GET /api/products?q=...&category=...&minPrice=...&maxPrice=...&inStock=true&sort=newest&page=1&limit=12`

- `minPrice` and `maxPrice` are integer paise.
- `limit` is clamped by schema to 1–48.
- Search and filters are validated server-side.
- The server owns filtering, sorting and pagination; browser only renders the current page.

## Scalability notes
- This phase removes the need to download the entire catalogue to every browser.
- PostgreSQL indexes help common category, price and newest-first access paths.
- Current search uses case-insensitive substring matching. For a very large catalogue, add PostgreSQL `pg_trgm` GIN indexes or a dedicated search service after measuring query plans; do not install an external paid search SaaS by default.
- Current pagination uses offset/limit and exact count. This is practical for early growth; at very high page depths or very large catalogues, move to cursor/keyset pagination and optionally cached/approximate counts.
- Cache TTL is intentionally short; invalidate/revalidate catalogue cache on product publish, unpublish, price, stock and image changes before increasing TTL.
- Add database connection pooling (PgBouncer or PostgreSQL-compatible pooler) and monitor slow queries when traffic grows. Keep secrets server-side.
- Add rate limiting and abuse protection at the reverse proxy/API layer before public launch.

## Required local setup
The existing project does not contain checked-in Prisma migration history. After installing dependencies and configuring PostgreSQL, generate/apply a migration locally:
1. `npx prisma migrate dev --name phase_14_search_discovery`
2. `npx prisma generate`

## Not implemented
- Autocomplete/suggestion endpoint and recent searches.
- Faceted price buckets and category counts.
- Cursor pagination and search analytics.
- Full-text/trigram index migration (needs an explicit PostgreSQL extension migration and query-plan testing).
- No dependency installation, Prisma validation, build, load test or browser test was run in this phase.
