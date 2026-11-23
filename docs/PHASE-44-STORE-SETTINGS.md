# Phase 44 — Store settings and business configuration

## Delivered
- Added administrator-only `GET/PUT /api/admin/store-settings` using a strict key allowlist and Zod validation.
- Added `/admin/store-settings` UI for store name/tagline, public business support contact/address, low-stock threshold, COD enablement and COD order cap.
- Existing inventory and checkout code already reads `LOW_STOCK_THRESHOLD`, `COD_ENABLED` and `COD_MAX_ORDER_PAISE`; this page provides the admin controls for those existing keys.
- COD remains disabled by default. A zero COD cap means no configured maximum.
- Platform timezone is fixed to `Asia/Kolkata`; currency remains INR and is not user-editable.
- Added public `GET /api/store-config` exposing only approved store identity/contact fields. GSTIN, tax settings, COD controls and operational values are not returned.
- Store settings saves are transactionally persisted and create an audit log event.
- Added desktop and mobile dashboard navigation links.

## Boundaries
- Public business contact fields are intended for public display. Enter business contact information only.
- This phase does not configure payment credentials, OAuth secrets, SMTP, courier credentials, domain, legal registrations or GST details. GST remains on its existing separate admin page.
- No maintenance mode, arbitrary feature flags, arbitrary key/value editor or user-editable currency/timezone was added.
- Storefront components are not yet wired to consume the public config endpoint; the endpoint is ready for a later integration pass.
- No database migration was needed because the existing `StoreSetting` key/value table is used.

## Verification
- Added source-contract tests for admin protection, allowlisted public projection and dashboard links.
- Does not claim full production build, database integration, browser/mobile QA or external service testing.
