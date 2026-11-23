# Phase 34 — Finance and accounting foundation

## What was added

- Added a normalized `FinanceEntry` ledger with CREDIT/DEBIT direction, entry type, paise amount, currency, order/payment/refund references, unique reference key and recorded timestamp.
- Razorpay payment verification and signed capture webhooks write a deduplicated PAYMENT_CAPTURE credit. This also records a capture that arrives after an order was cancelled; the order stays cancelled and Phase 33 marks the payment for refund.
- A successfully processed refund writes a deduplicated REFUND debit from the refund reconciliation helper. Pending, failed and ambiguous refunds are not treated as cash outflow until the provider confirms success.
- Added admin-only COD collection recording. It is restricted to a pending COD payment whose order is SHIPPED or DELIVERED. An operator must enter a collection/receipt reference; the action marks the payment verified, records a COD_COLLECTION credit and creates an audit event. This is a manual evidence entry, not an automated courier reconciliation.
- Added `/admin/finance` with date filters, ledger entries, credits, refunds/debits, net cash movement, and separate order-value context.
- Added admin-only CSV export at `/api/admin/finance/export`, with CSV formula-injection protection and a 10,000-row cap.
- Added navigation to Finance from the admin workspace.

## Accounting interpretation and limits

- Amounts are stored as integer paise. Net cash movement in this screen is ledger credits minus confirmed refund debits for the selected *recorded date* range.
- Order subtotal/discount/shipping/tax/total figures are order values grouped by order creation date. They are not cash receipts and are shown separately to avoid mixing sales with collections.
- This is an operational cash/payment ledger foundation, **not a complete statutory accounting package**. It does not yet record expenses, supplier bills, printer/material COGS, bank settlement fees, GST return liability, TDS, inventory valuation, cash drawer balances, or profit.
- COD collection evidence is manually entered by an authorized admin. A receipt/courier reference is required, but this code does not verify the physical cash or courier remittance.
- Legacy historical payments/refunds are not backfilled into FinanceEntry. New entries are recorded by the new flows; old records need a reviewed reconciliation/import plan to appear in the ledger.
- Existing general analytics verified-payment KPI is unchanged and should not be interpreted as net revenue after refunds. Use the Finance page's credits, confirmed refund debits and net cash movement.
- CSV export includes up to 10,000 ledger entries per selected date range. The on-screen table shows up to 1,000 entries.

## Migration

Apply `20261124000500_finance_ledger_reporting` after the Phase 33 refund migration. Take a database backup first. Phase 26's baseline migration still needs to be generated and reviewed before a first deployment; do not fabricate or skip it.

## Verification limitations

- Contract tests validate source contracts and access/flow guards.
- No npm install, Prisma validate/client generation, database migration, production build, database integration test, browser/device test, courier COD reconciliation or payment-provider sandbox/live test was run.
