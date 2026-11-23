# Phase 35 — GST, tax configuration and invoice foundation

## Delivered

- Added product-level HSN code and GST rate (basis points). Defaults are blank HSN and 0% tax; no tax category/rate is guessed.
- Added admin product-row controls to edit HSN and GST percentage, plus an authenticated API with a 0–28% guard and audit event.
- Added admin GST settings for enable/disable, seller legal name, GSTIN, seller state name/code and invoice prefix.
- GST is disabled by default. When enabled, checkout calculates tax on each line after proportional coupon discount allocation, rounds each line to paise, and snapshots product HSN/rate and line tax.
- Intra-state orders split each line's tax into CGST and SGST; inter-state orders record IGST. The seller state name is compared with the delivery address state. Seller state configuration is mandatory before taxable checkouts.
- Order totals now include tax in addition to discounted subtotal. Existing orders are not rewritten.
- Added a unique tax invoice record and a PostgreSQL sequence for invoice numbering. Invoices are created after a verified Razorpay payment or recorded COD collection, only when GST is enabled and the order has non-zero tax.
- Added customer ownership-protected invoice retrieval and a printable invoice page with a browser Print / Save PDF action.

## Important limitations / professional review

- **GST is disabled by default.** Admin must confirm registration status, legal name, GSTIN, state code, product HSN and applicable rate with a qualified tax professional before enabling it.
- Rates are manually configured per product; this software does not determine legal GST classification or eligibility. The supported rate input is 0–28%, which is a technical validation range, not a claim that all products use those rates.
- The intra/inter-state split compares configured seller state name with the delivery address state string. Address normalization/state-code validation is not yet implemented; standardize state names before enabling tax. Seller state code is stored for invoice display.
- Customer GSTIN capture, buyer state-code validation, place-of-supply rule engine, reverse charge, exemptions, cess, exports/SEZ, credit/debit notes, e-invoicing/IRN, e-way bills, GSTR reporting and accounting integration are not implemented.
- Tax invoice is a printable HTML view; user can print/save as PDF from the browser. There is no server-generated PDF binary.
- Invoice records are issued on verified online payment or recorded COD collection. Historical orders/payments are not backfilled. Custom quotation orders that have no recorded taxable order lines are not automatically invoiced by this phase.
- Invoice sequence is global and backed by PostgreSQL. Prefix/year format is configurable only through current settings; numbering/legal format should be reviewed before statutory use.
- Existing product tax rate defaults to 0%. Product variants inherit their parent product's HSN/rate; variant-specific tax classifications are not supported.
- No legal/tax compliance certification is claimed.

## Migration

Apply `20261124000600_gst_tax_invoice_foundation` after Phase 34. It creates the TaxInvoice table and PostgreSQL invoice-number sequence, and adds tax snapshot fields to products, orders and order items. Back up the database first.

## Verification limitations

- 51 source-contract tests passed.
- Six shell scripts passed `bash -n`.
- No npm install, Prisma validate/client generation, database migration, production build, browser/phone test, tax-professional review or live payment/COD integration test was run.
