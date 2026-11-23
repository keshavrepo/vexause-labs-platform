# Phase 27 — Storefront & customer experience

## Delivered

- Added an exact product-ID lookup to the public catalogue API. It is bounded to 48 unique IDs per request and still returns only published products.
- Cart and wishlist pages now hydrate the exact products saved by the customer, rather than fetching the first default catalogue page (which could silently omit saved products beyond page one).
- Long saved lists are loaded in batches of at most 48 IDs.
- Cart and wishlist loading states are explicit, so an empty state is not shown while saved products are still being fetched.
- Product detail now uses the same validated cart/wishlist state hook as the shop. This removes its separate direct `localStorage` JSON parsing and keeps wishlist state visible on the product page.
- Browser storage reads are shape-checked, malformed cache data is handled safely, quantity values are bounded, and storage changes in another browser tab are observed.
- Tracked-inventory cart quantity controls stop at the available stock quantity; non-tracked products retain the UI cap of 99. The server remains authoritative at checkout.
- Added accessible labels and larger touch targets to cart quantity controls.
- Added source-contract tests for exact-ID hydration, shared state, and stock-aware quantity controls.

## Boundaries / not claimed

- No real product/customer data was seeded.
- No payment, order, pricing, or inventory business rules were changed.
- This phase does not constitute a real-device mobile audit, browser end-to-end test, accessibility certification, or production readiness sign-off.
- Full dependency installation, Prisma validation, TypeScript compilation, and Next.js production build remain to be run on the development machine with dependencies installed.

## Verification

Run `npm test` after installing dependencies (the tests use Node's built-in test runner and do not require a database). Run `npm run build` and complete the owner launch checklist before deployment.
