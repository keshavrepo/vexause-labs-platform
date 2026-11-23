# Phase 50 — Production, shipping and customer updates

## Changes
- Starting production from the PRINTING stage now records the order's IN_PRODUCTION status history when the order transitions from PAID.
- Customers receive an in-app notification when production starts.
- Completing production and passing the latest QC inspection now uses a conditional order-state update before moving the order to READY_TO_SHIP.
- Customers receive an in-app notification when production and QC are complete and the order is ready for dispatch.
- Shipment handoff and delivery transitions now use conditional order-state updates to avoid silently overwriting a concurrent order-state change.
- Customers receive in-app notifications when the order is handed to the carrier and when it is marked delivered.
- Existing shipment state transition rules, carrier tracking fields and dispatch/payment/QC checks remain in force.

## Verification boundaries
- Contract tests, source-only import preflight and TypeScript/TSX syntax transpilation are run during packaging.
- No real carrier API, email/SMS delivery, live database transaction, Next production build, browser test or physical phone test was run.
- Shipment status still depends on staff entering carrier events; there is no automatic carrier tracking sync.
