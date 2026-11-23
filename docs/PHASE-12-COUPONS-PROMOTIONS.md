# Phase 12 — Coupons, discounts and promotions

## Included
- Coupon schema with percentage/fixed discounts, optional percentage cap, minimum order, active window, global usage limit and per-customer limit.
- Admin API and `/admin/coupons` UI to create inactive coupons and activate/deactivate them.
- Customer coupon validation endpoint and checkout coupon application.
- Discount is recalculated server-side inside the order transaction; browser preview is informational only.
- Order snapshots `couponId`, `couponCode`, `discountPaise` and discounted `totalPaise`.
- Coupon redemption row is linked to order and customer; global used count is atomically claimed during checkout.
- Audit log entries for admin coupon create/update.
- Customer order detail displays coupon discount.

## Rules
- Coupon codes are normalized to uppercase with whitespace removed.
- Percentage discount accepts 1–100 integer percent; fixed discount is an integer amount in paise.
- Percentage coupons can have a maximum discount cap.
- Fixed coupons do not use a maximum-discount cap.
- Discounts cannot exceed subtotal; checkout rejects a coupon that produces zero or invalid payable total.
- Coupons are created inactive. Admin must explicitly activate them.
- Global and per-customer usage limits are enforced during order creation, not only during the preview request.
- Coupon usage is consumed when the order is created. Cancelled-order coupon release/reinstatement is not automated yet.
- Discount applies to product subtotal only. Shipping and tax rules are not implemented and no tax/shipping discount is inferred.

## Migration and testing
- This project bundle currently has no checked-in Prisma migration history. On the development machine, inspect the schema, then run `npx prisma migrate dev --name phase_12_coupons_promotions` and `npx prisma generate`.
- Test percentage and fixed coupons, max cap, minimum order, start/expiry, global usage limit, per-customer limit, concurrent attempts and COD/online totals.
- No dependency installation, Prisma validation, migration, build or automated tests were executed in this environment.
