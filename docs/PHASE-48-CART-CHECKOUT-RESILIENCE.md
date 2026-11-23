# Phase 48 — Cart and checkout resilience

## Changes
- Cart-to-account synchronization is now serialized so multiple rapid quantity changes are not allowed to race each other on the server.
- Checkout stays unavailable until the latest cart snapshot is successfully synchronized.
- Signed-out customers are directed to sign in and return to the cart before proceeding.
- Cart sync errors are surfaced in the cart summary rather than silently allowing a potentially stale checkout.
- Checkout's place-order button is disabled when the cart subtotal is empty/unavailable.
- Razorpay's asynchronous verification callback now catches failures, resets the busy state and explains that the saved order can be paid again from order details.

## Verification boundaries
- Contract tests and static source checks are included in this phase.
- No live Razorpay session, browser, mobile device, PostgreSQL, Next production build or payment webhook was exercised.
- This phase does not change payment provider configuration or claim that a payment was captured.
