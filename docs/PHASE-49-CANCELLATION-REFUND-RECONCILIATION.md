# Phase 49 — Cancellation and refund reconciliation

## Changes
- Fixed the support-approved cancellation path. Previously it changed the order status without restoring allocated inventory or releasing coupon usage.
- Support approval now uses a conditional order-state update, refuses approval if a verified payment exists, restores only inventory allocated by checkout, releases the coupon redemption counter, and fails outstanding unpaid payment attempts.
- The cancellation transaction records order history/audit information and queues a customer order-status notification.
- The admin receives an actionable conflict when the order has a verified payment: resolve the payment through the refund workflow before approving cancellation.
- Customer custom-order balance now includes successful refunds when calculating the amount still due; the page separately displays successful refunds.
- Customer support copy clarifies that a return/refund enquiry is not an automatic approval or payment.

## Safety boundaries
- Paid-order cancellation is deliberately not automated here; a verified payment must go through the existing refund workflow.
- Return approval does not automatically create a shipping label, reverse inventory, or issue a payment refund.
- No live payment provider, database, browser or phone testing was performed in this phase.
