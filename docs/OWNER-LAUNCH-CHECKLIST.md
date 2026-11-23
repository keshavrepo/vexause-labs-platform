# Owner Launch Checklist — External Accounts & Credentials

These steps are intentionally left for the owner at the end, after the application code, final domain and production test environment are ready. No API keys or Google/Razorpay account setup is needed to continue the current coding phases.

## Google sign-in
1. Create/select a Google Cloud project.
2. Configure OAuth consent screen and add the final production domain.
3. Create OAuth Web Client credentials.
4. Register exact authorised JavaScript origins and redirect URI supplied by the final auth implementation.
5. Add client ID/secret to VPS environment only; never commit them.
6. Verify test users, production consent status and privacy policy.

## Razorpay
1. Complete merchant/KYC onboarding in Razorpay.
2. Create/test API keys; first verify in test mode.
3. Add key ID and key secret to VPS environment.
4. Register webhook URL `https://YOUR_DOMAIN/api/webhooks/razorpay`.
5. Subscribe to `payment.captured` and `order.paid`; copy the webhook secret into VPS environment.
6. Run test payments, verify signatures/webhooks, refunds and reconciliation before live mode.
7. Switch to live credentials only after successful end-to-end testing.

## Domain / VPS / email / shipping
- Point DNS to the VPS and enable HTTPS.
- Configure Nginx reverse proxy, firewall, process manager, persistent volumes and backups.
- Set canonical site URL and trusted origins.
- Configure transactional email provider credentials and verify SPF, DKIM, DMARC.
- Configure courier account/API credentials only after selecting a provider and confirming rates/serviceability.
- Never paste secrets into chat, GitHub or source files. Use VPS environment variables or a secrets manager under owner control.
