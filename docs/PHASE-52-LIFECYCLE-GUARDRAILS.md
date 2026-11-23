# Phase 52 — Lifecycle and reconciliation guardrails

## Changes
- Inventory restoration now fails closed when an allocated order line has lost its original product or variant stock target. Cancellation/support approval rolls back instead of silently completing while stock remains unreconciled.
- Razorpay failed-payment webhooks no longer downgrade a payment already verified or awaiting refund after a late capture.
- Capture webhooks no longer reprocess payments already verified or awaiting refund.
- Refund webhooks no longer move terminal SUCCEEDED/FAILED refunds backwards when provider events arrive out of order.
- Updated contract coverage for terminal payment states and added Phase 52 lifecycle guardrail tests.

## Verification
- `npm test`: 89 passed, 0 failed.
- `node scripts/source-preflight.mjs --source-only`: passed, 145 source files.
- All 9 shell scripts passed `bash -n`.
- ZIP integrity checked after packaging.

## Remaining external verification
No live PostgreSQL transaction/race test, Razorpay webhook delivery test, provider refund test, Next.js production build, browser or physical phone test was run. The migration-chain check still blocks on the missing initial baseline SQL; the npm lockfile is also absent. See Phase 51 release handoff.
