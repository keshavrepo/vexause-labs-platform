# Phase 18 — Custom 3D Printing & Design Studio

## Customer paths
1. **Print from file** — customer uploads STL, OBJ or 3MF and describes quantity, dimensions, material and colour preferences.
2. **Design + print** — customer submits a plain-language idea brief and optional sketches/reference images; VEXAUSE reviews the scope, designs a model, shares a preview, and only proceeds to print after customer approval.
3. **Design only** — customer requests a CAD/3D design deliverable without a print order.

The new public page is `/custom-3d-printing`. The old `/custom-order` CTA path redirects there. A customer can submit as a guest; if logged in, the request is linked to their account and appears at `/account/custom-requests`.

## Admin workflow
- `/admin/custom-requests` lists requests and private-file metadata.
- Admin can update request status and design status, add internal/design notes, create a quotation with subtotal, shipping, tax, advance and customer-facing scope notes.
- A quote is saved as SENT and the customer can accept it from their account page.
- Admin can upload a design preview/deliverable. The upload remains private and scan-pending.
- Staff must review uploaded files with an approved malware scanning process and mark CLEAN or REJECTED. Only CLEAN source files can be downloaded by admins; only CLEAN design deliverables can be downloaded by the owning customer.
- Customer can approve a preview or request a revision. Quote acceptance currently records acceptance and prompts the team to coordinate payment/next steps; it does not yet automatically create a custom order or initiate payment.

## Private file handling
- Files are stored outside `public/` under `PRIVATE_UPLOAD_DIR` (default `/var/lib/vexause/private-uploads`).
- Random storage keys, restricted file permissions, extension/signature checks, size limits and ownership checks are used.
- Maximum 8 files per request, 25 MB per file.
- Model file types: STL, OBJ, 3MF. Reference files: JPEG, PNG, WebP, PDF. Design deliverable extensions include STL, OBJ, 3MF, STEP/STP, PDF and common images.
- Files are never served by a public static URL.
- `scanStatus` starts as PENDING. There is no malware scanner integrated in this phase. Do not mark files CLEAN until an actual scanning/review process is completed.
- CAD parsing, thumbnail rendering and slicing are not performed by the web server.

## Commercial safeguards
- No instant price, feasibility, printability or delivery estimate is promised.
- Admin must define design scope, included revisions, deliverable formats, usage/IP ownership terms, production scope and payment milestones in the quote message/contract.
- Design fees and printing fees may be separate. Shipping/tax amounts are explicit quote fields.
- No production should begin before the customer approves the design (where applicable), accepts the quotation, and completes the required advance/payment process.

## Migration and testing
After dependencies and PostgreSQL are configured:
```bash
npx prisma migrate dev --name phase_18_custom_3d_design_studio
npx prisma generate
npm run build
```
Then test guest submissions, authenticated submissions, invalid file signatures, size limits, private file access, file scan state, quote creation/expiry, quote acceptance, design approval and revision requests.

## Known limitations
- No real malware scanner, 3D preview renderer, CAD validation/slicer or automatic print-time/cost calculator.
- No online payment/order creation flow after quote acceptance yet.
- No customer email or SMS is sent; notification jobs depend on the Phase 17 worker, while SMTP is deferred to final integration.
- Guest request tracking is by reference number and contact follow-up; guest self-service lookup is not implemented.
- Design preview download is enabled only after staff marks the deliverable CLEAN.
