# Phase 36 — Production & Fulfilment Management

## Delivered

- Admin production queue at `/admin/production` and an admin-only API at `/api/admin/production`.
- One production job per eligible order, with order-line snapshots and unique order linkage.
- Manual production stages: QUEUED, PREPARATION, PRINTING, POST_PROCESSING, QUALITY_CHECK, PACKAGING, READY_FOR_DISPATCH and ON_HOLD.
- Manual machine registry and assignment; machine name is unique. No assumed printer count, capacity, availability or telemetry.
- Material register with administrator-entered verified gram balances and reorder thresholds.
- Transactional material consumption that decrements the recorded balance only when sufficient stock exists, and stores a usage record.
- Five-part quality inspection: surface finish, dimensions, fit/function, visual inspection and quantity. A failed check does not qualify for dispatch.
- Dispatch readiness requires the job to be in PACKAGING and its latest inspection to pass. For CUSTOM orders, verified payment totals must cover the full order total before dispatch readiness.
- Order status is moved to IN_PRODUCTION when the job enters PRINTING. READY_TO_SHIP is set only after the production readiness checks pass.
- The admin order-status API also checks production/QC and custom-order payment balance, preventing the ordinary status editor from bypassing those gates.

## Important operating rules and limitations

- Jobs are created manually from orders in PAID or IN_PRODUCTION status. A single job per order is enforced.
- CUSTOM orders may have been marked PAID after an advance payment in the earlier quote workflow. They can enter production, but the full verified balance is required before dispatch readiness.
- Store/COD order eligibility still follows the existing order/payment workflow. This phase does not invent COD payment collection or settlement.
- Machine and material records are manually entered by an administrator. No machine discovery, slicer integration, G-code generation, print monitoring, maintenance calendar, automatic capacity planning or live machine telemetry exists.
- Material quantities are entered by the operator after checking physical stock. There is no automatic spool weight detection, purchasing, supplier integration, material costing or automatic waste calculation.
- Quality inspection is a manual checklist. It is not a calibrated dimensional measurement, certification or guarantee.
- The system does not automatically create production jobs, schedule due dates, calculate print time, or generate courier labels.
- No photos are captured in this QC checklist. Use the existing private customer-file workflow for customer-submitted files; do not upload inspection photos to a public path.
- Migration is included but has not been applied to a live database in this environment.

## Migration

`prisma/migrations/20261124000700_production_fulfilment_management/migration.sql`

Run migrations only after backing up the database and following the deployment checklist.
