# Phase 19 — Business Analytics & Mobile Experience

## Analytics
- Protected endpoint: `GET /api/admin/analytics`.
- Admin dashboard: `/admin/analytics`.
- KPI cards: total orders, published products, registered customers, custom requests, verified revenue, verified payment count, quotes awaiting customer response.
- Monthly verified revenue for the last six months, grouped by payment `verifiedAt`.
- Order status distribution.
- Custom request type mix (print from file, design + print, design only).
- Top products by units ordered and order value.
- Recent orders list.

Revenue is deliberately calculated from Payment records whose status is VERIFIED. It is not a complete accounting ledger: COD collections, refunds, gateway settlement fees, taxes, shipping liabilities and reconciliation are not netted into this KPI. Use verified payment value as an operational metric only.

## Mobile experience improvements
- Added responsive viewport-safe global behavior, reduced-motion support, visible keyboard focus and 16px form control sizing to avoid mobile browser zoom.
- Added horizontal mobile admin navigation for Overview, Orders, Custom 3D, Analytics and Inventory.
- Added analytics sidebar link and mobile-friendly metric cards, chart columns and scrollable recent-orders table.
- Refined custom 3D form, admin request queue, customer request page and shop header spacing for small screens.
- Buttons and controls use touch-friendly sizing and layout wrapping.

## Manual phone preview checklist
Test on 360px, 390px and 430px viewport widths:
- Home page hero, navigation and CTA.
- Shop header, search, filters, product cards, cart and wishlist.
- Product detail, account login/register, address and checkout.
- Custom 3D form with all three request types and file upload.
- Customer custom request status, quote acceptance and design preview.
- Admin mobile navigation, orders, custom request cards, inventory and analytics.
- Check no horizontal page overflow, clipped buttons, tiny form controls or unreadable tables.
- Test Android Chrome and iOS Safari where available.

## Validation status
No browser screenshot/visual regression, Lighthouse, accessibility audit, build, or database query test has been run in this environment. The page layouts are responsive by implementation, but final phone preview must be performed against a running app on real devices before launch.
