# Phase 23 — Customer notification centre

## Implemented in this phase

- Added the signed-in customer page at `/account/notifications`.
- Displays up to the latest 50 notifications from the database, newest first.
- Shows unread count and visibly distinguishes read from unread items.
- Supports marking one notification as read.
- Supports marking all of the signed-in customer's unread notifications as read.
- Added an account navigation link to the notification centre.
- API requests remain scoped to the authenticated customer; a customer cannot read or update another customer's notifications.
- Notification links are rendered only for same-origin relative paths, not arbitrary external or script URLs.
- The page redirects unauthenticated visitors to customer sign-in and uses no-store fetching for current notification state.

## What makes notifications appear

This phase consumes the existing `Notification` records. Existing background worker handlers create in-app notifications for `ORDER_STATUS_NOTIFICATION` and `SERVICE_REQUEST_NOTIFICATION` jobs. This phase does not fabricate notifications or seed sample records.

## Explicitly not implemented / not claimed

- Email delivery is not active. The existing worker's `EMAIL_DELIVERY` handler still reports that SMTP is not configured.
- Google sign-in is not implemented.
- Email verification and password reset are not presented as working because a secure end-to-end flow needs a configured delivery channel and tested token links.
- No notification will appear unless a real application workflow or an authorized operator creates the corresponding notification/job.
- No production deployment or browser/device QA was performed in this phase.

## Verification status

Source files and ZIP packaging were checked. Dependency installation, TypeScript compilation, Prisma validation, automated tests, and end-to-end browser tests were not run in this environment. Run the project's deployment checks and full build/test suite after installing dependencies and configuring the database.
