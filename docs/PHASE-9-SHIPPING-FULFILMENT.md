# Phase 9 — Shipping and fulfilment foundation

## Added
- Admin can attach or update carrier name, tracking number, tracking URL and shipment status for orders in READY_TO_SHIP, SHIPPED or DELIVERED.
- Shipment writes are transactional and audited.
- Shipment statuses: LABEL_CREATED, PICKED_UP, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED, EXCEPTION.
- Moving a READY_TO_SHIP order to PICKED_UP / IN_TRANSIT / OUT_FOR_DELIVERY automatically advances the order to SHIPPED and writes status history.
- Marking a SHIPPED order's shipment DELIVERED automatically advances the order to DELIVERED and writes status history.
- Admin Orders page displays shipment information and provides a tracking editor.
- Customer order detail page displays shipment carrier, status, tracking number and external tracking link.
- Admin orders API now includes the latest shipment.

## Important boundaries
- This is manual carrier/tracking entry. No courier API, label purchase, pickup scheduling, shipping-rate quote, ETA calculation, or automatic tracking sync is connected.
- Admin must verify tracking URLs and carrier data before saving; only HTTP/HTTPS URLs are accepted.
- No automatic customer email/SMS/WhatsApp notifications are sent.
- Existing order transition rules still apply; shipment update only auto-advances the two documented cases.
- Run Prisma validation/migrations, install dependencies, type-check/build, and test against PostgreSQL before deployment.
