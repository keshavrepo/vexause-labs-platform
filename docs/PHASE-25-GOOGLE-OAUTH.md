# Phase 25 — Google customer sign-in

## Implemented in source

- Customer login page now offers a Google sign-in action.
- OAuth authorization-code flow with `state`, `nonce`, PKCE S256 challenge/verifier, and a short-lived, HttpOnly, signed state cookie.
- Callback exchanges the authorization code server-side; client secret is never sent to the browser.
- Google ID token is checked through Google's token-info endpoint for audience, issuer, expiry, nonce and verified email.
- Google provider subject is stored as a unique `GoogleAccount.providerAccountId`, linked to the internal customer user.
- Existing active customer account with the same Google-verified email can be linked; staff/admin accounts are not accepted for customer sign-in.
- New Google customer accounts receive a random, unusable local password hash and a verified-email timestamp.
- OAuth state cookie is cleared after callback/failure.
- Added Google OAuth environment keys and a Prisma migration for `emailVerifiedAt` and `GoogleAccount`.

## Required Google Cloud setup

Create an OAuth 2.0 Client ID of type Web application. Configure the authorized redirect URI to exactly match:

`https://YOUR_DOMAIN/api/customer/google/callback`

Set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `GOOGLE_REDIRECT_URI` on the web application server. Never expose the client secret in a `NEXT_PUBLIC_` variable or commit it. Add the production origin to the Google OAuth consent-screen configuration and complete Google's required publishing/verification steps for the intended audience.

## Security and account-linking notes

- OAuth state cookie is signed with `SESSION_SECRET`, HttpOnly, SameSite=Lax and expires after 10 minutes.
- PKCE uses S256.
- Callback requires a Google-verified email and rejects admin/staff identities.
- Google account linking by email is permitted only after Google's token response verifies the email.
- This flow does not request offline access or store Google access/refresh tokens.
- Google sign-in is not considered operational until a real Google Cloud client is configured and callback tested over HTTPS.
- The login page still supports password sign-in. Email verification is not globally enforced.

## Verification status

Source structure and ZIP integrity checks were performed. The delta migration must be reviewed against the live schema and cannot bootstrap an empty database by itself. No Google credentials were available; no live OAuth consent, callback, account-linking, Prisma migration execution, TypeScript build, automated test, or browser/device test was performed. Do not advertise Google sign-in as live until those tests pass.
