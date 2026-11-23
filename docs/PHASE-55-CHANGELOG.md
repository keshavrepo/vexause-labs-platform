# Phase 55 changelog

- Added `app/design-system.css` (tokens, layout, surfaces, controls, storefront, account, admin, invoice and print layers) and imported it after `globals.css`.
- Added presentational primitives (`components/ui/Primitives.tsx`), `AuthShell`, `AccountShell` and `AdminShell`.
- Added `app/admin/layout.tsx` (dynamic ADMIN/STAFF session guard + shell) and `app/account/layout.tsx` (storefront chrome + account bar).
- Rebuilt storefront catalogue, product detail, cart, wishlist, checkout and custom-print brief on the new primitives.
- Rebuilt the customer account area: overview, order history, order detail, printable GST invoice, addresses, custom requests, reviews, notifications and support; added `/account/custom-requests` and `/account/orders/[id]/invoice`.
- Aligned account actions with the live API: cancellation only while no payment is verified, payment retry also for custom-order balances, invoice and deliverable downloads behind their existing endpoints.
- Rebuilt the admin overview on `/api/admin/analytics` and removed per-page back-links and duplicated frames now that `AdminShell` provides navigation.
- Rewrote the help centre and contact page around factual workflow guidance and configured contact details.
- Retuned the hero composition: wing and tail-fin geometry corrected, supports moved back to `z −2` at `×0.56` so the flanking products stay inside the camera frame; harness mirrors the scene constants.
- Added root metadata (title template, description, viewport/theme colour) and a `<main>` landmark for account pages.
- Updated the source-contract tests that pinned the previous storefront/account/admin markup to the new implementation (96 tests pass).
- Ignored local visual-QA renders (`.qa/`) and reverted accidental lockfile/tsbuildinfo noise.
