# Phase 6 — Customer Accounts and Address Book

## Included
- Customer registration and login.
- Password hashing with bcrypt (cost factor 12).
- Separate customer session cookie from admin session cookie.
- HttpOnly, SameSite=Lax, Secure-in-production session cookie with 30-day expiry.
- Customer account page and sign-out.
- Customer profile endpoint.
- Address book: list and add addresses; set default address.
- PostgreSQL tables for carts, cart items, wishlists, wishlist items, email verification tokens and password reset tokens.
- Customer-authenticated cart and wishlist APIs.
- Store navigation link to customer account.

## PostgreSQL migration
Review the schema, then run:
`npx prisma migrate dev --name customer_accounts_cart_wishlist`
`npx prisma generate`

## Important production gaps
- Email verification and password-reset token tables exist, but email delivery and token workflows are not implemented.
- Rate limiting, login attempt throttling, bot protection, CSRF/origin protections and security headers must be added before public launch.
- Customer session revocation/device management is not yet implemented.
- Address edit/delete endpoints are not yet implemented.
- Cart/wishlist browser state has not yet been merged into PostgreSQL on login. Authenticated cart/wishlist APIs are available as a foundation.
- Checkout/order creation is not implemented in this phase. Never trust client-supplied prices or stock; the server must load current product prices and recheck inventory in a transaction.
- No production build or integration tests were run in this environment.
