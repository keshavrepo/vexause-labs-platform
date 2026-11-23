# Admin and order architecture

## Admin areas
- Overview: database-backed KPIs only; never show placeholder/demo values as real metrics.
- Orders: search, filters, status timeline, customer/address view, item and payment detail.
- Custom requests: private file metadata, signed download flow, feasibility review, admin-only notes.
- Quotes: draft, send, revise, accept/reject/expire; quote total and advance stored in paise.
- Products: product/category CRUD, publication state, images, stock controls.
- Payments: Razorpay order creation on server, signature verification, webhook idempotency, refunds and reconciliation.
- COD: feature flag, configurable order value/area rules, confirmation workflow; custom orders default to advance payment and require explicit admin override to permit COD.
- Shipping: carrier, tracking reference, dispatch/delivery timestamps.
- Customers: account, addresses and order history.
- Settings: payment gateway keys stored only as server secrets, tax/shipping policy, COD rules.
- Security: role-based authorization, audit log, MFA-ready admin sign-in, rate limiting.

## Custom request lifecycle
SUBMITTED -> UNDER_REVIEW -> NEEDS_INFORMATION (optional) -> QUOTED -> ACCEPTED -> order/payment -> IN_PRODUCTION -> READY_TO_SHIP -> SHIPPED -> DELIVERED.
Rejected or closed requests are retained with an audit trail.

## Trust and security requirements
- Store uploaded files in private object storage; persist storage keys, never public URLs.
- Validate extension, MIME type, file size and content; malware scan before admin download.
- Use short-lived signed URLs and access checks for downloads.
- Never trust client-side payment success. Verify Razorpay signatures server-side and process webhooks idempotently.
- Keep amounts in integer paise.
- Use audit events for admin changes to quotes, payments, order states and settings.
- Never expose API keys or secrets in browser code or repository.
- COD eligibility is explicit and checked server-side at checkout.
- Avoid fabricated reviews, company claims, certifications or service capabilities.

## Current status
This schema and admin page are a foundation, not a completed production system. Authentication, API routes, validation, migrations, storage integration and payment workflows remain to be implemented and tested.
