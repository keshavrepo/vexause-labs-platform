# Phase 29 — Product detail & image gallery

## Delivered

- Rebuilt the product detail layout for phone and desktop widths with a dedicated image area and clear purchase-information panel.
- Added a selectable thumbnail gallery using the product's existing ordered `ProductImage` records. The selected image has an accessible label and pressed state; the main image uses the stored alt text.
- Kept the existing product API as the source of truth; no sample or generated product images were added.
- Displayed SKU only when one exists.
- Displayed compare-at price, savings and discount percentage only when the stored compare-at price is greater than the current price. No discount is inferred from missing data.
- Corrected availability presentation for products with inventory tracking disabled: those products can be available even when `stockQuantity` is zero. Tracked products continue to respect stock.
- Added short description, full product details, review summary, wishlist state, add-to-cart action and custom-print request link to the page.
- Added request-race protection when navigating between product slugs.
- Corrected trailing-slash normalization in canonical/Open Graph URL generation.
- Added contract tests for gallery data, conditional compare pricing, inventory-aware availability and canonical URL normalization.

## Product variants/options

The current Prisma `Product` model does not contain product variants, configurable options, option-level stock or variant pricing. This phase deliberately does not fabricate variant selectors. A proper variants feature needs a reviewed schema/API/admin/catalogue/cart/checkout change in a later phase.

## Boundaries / not claimed

- No real product data or image assets were invented.
- No pricing, inventory, checkout or payment server rules were changed.
- This is not a live browser/device test, image-performance audit, or production build.
- Dependency installation, TypeScript compilation, Next.js build and integration tests remain pending on the development machine.

## Verification

Run `npm test` and `npm run build` with dependencies installed. Verify image order, alt text, actual uploaded image access, and inventory states using real admin-created products before launch.
