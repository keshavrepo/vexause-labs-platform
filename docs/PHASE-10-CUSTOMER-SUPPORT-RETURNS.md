# Phase 10 — Customer support, cancellations and returns

## Included
- Customer support request model with request code, type, status, optional order, customer message and admin response.
- Append-only request event history with actor role, status transition and message.
- Customer API to list and submit requests, scoped to the signed-in customer.
- Customer `/account/support` page to submit and track requests.
- Admin API and `/admin/support` page to review and decide requests.
- AuditLog entries for request creation and admin decisions.

## Business rules implemented
- Cancellation requests require an order in `PENDING_REVIEW` or `AWAITING_PAYMENT`.
- Admin approval of an eligible cancellation changes the order to `CANCELLED` and writes order status history in the same transaction.
- Return/refund requests require an order marked `DELIVERED`.
- Return/refund approval only records the support decision. It does not issue money, create a return label, or mark an order refunded.
- No return-period duration or shipping policy is invented; no configurable time window exists yet.
- General support requests may be submitted without an order.

## Important limitations / next work
- No customer email/SMS/WhatsApp notifications.
- No attachments in support tickets.
- No return pickup, inspection, reverse logistics or restocking workflow.
- Refund gateway execution and reconciliation are not implemented.
- Cancellation after production starts is not supported in this request flow; customer is directed to contact support.
- Add rate limits, CSRF/origin checks, spam protection and operational policy configuration before production.

## Database
New Prisma enums: `ServiceRequestType`, `ServiceRequestStatus`.
New models: `OrderServiceRequest`, `OrderServiceRequestEvent`.
Run Prisma migration and regenerate client on the development machine before using these APIs.
