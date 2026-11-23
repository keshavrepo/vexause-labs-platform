# Phase 13 — Product Reviews & Ratings

## Implemented
- Customer review submission requires an authenticated account.
- Server verifies the customer owns a delivered STORE order containing the product.
- One review per customer per product (database unique constraint).
- 1–5 star rating, optional title, 10–2,000 character review body.
- New reviews default to PENDING and are not public.
- Public product review endpoint returns APPROVED reviews only, latest 50, plus aggregate average/count.
- Admin moderation endpoint and `/admin/reviews` screen support approve/reject and optional admin note.
- Customer `/account/reviews` screen lists delivered purchases and allows review submission.
- Product detail shows approved average/count and links customers to their review area.

## Security / integrity notes
- Purchase eligibility is checked server-side against `OrderItem` and an order owned by the signed-in user with status `DELIVERED` and kind `STORE`.
- A unique `(productId, userId)` constraint prevents duplicate reviews even under concurrent requests.
- Review content is plain text; React renders it as text, not HTML.
- Moderation is mandatory before public display.
- Admin endpoints use the existing admin/staff session guard.

## Required local setup
This project currently has no checked-in Prisma migration history. On the development machine, after installing dependencies and configuring PostgreSQL:
1. `npx prisma migrate dev --name phase_13_product_reviews`
2. `npx prisma generate`

## Not implemented / later work
- Review edit/delete workflow.
- Image/video attachments.
- Helpful votes, review reporting, automated spam scoring, profanity moderation.
- Review response by seller/admin.
- Pagination and filtering on public reviews.
- Admin audit log entries for review moderation.
- No dependency installation, Prisma validation, build or tests were run in this phase.
