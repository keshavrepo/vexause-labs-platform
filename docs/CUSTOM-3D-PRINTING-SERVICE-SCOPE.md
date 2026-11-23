# Custom 3D Printing — File Upload and Design-From-Idea Service

The custom print journey must support two clear customer paths:

## Path A — Customer has a ready 3D file
- Upload STL, OBJ, or 3MF (subject to validated file limits).
- Enter quantity, approximate dimensions, material/colour preference, finish and notes.
- Attach reference photos if useful.
- Admin reviews manufacturability, material, print time and finishing needs, then sends a quote.
- Customer approves quote and pays the required advance before production.

## Path B — Customer has no 3D file and needs design help
- A prominent “I have an idea, help me design it” / “Need 3D design?” option.
- Customer describes the idea in plain language, intended use, approximate size, quantity, budget range (optional), deadline (optional), and uploads sketches/reference photos.
- Customer can select “I need design + 3D printing” or “Design file only”.
- Admin reviews the brief, asks clarifying questions, estimates design effort and sends a separate design + printing quote.
- Do not auto-promise feasibility, design cost, turnaround, ownership/licensing, or print price. Admin must review and quote.
- Design service may be charged separately; make the scope, revisions, deliverables, and rights explicit in the quote before work begins.
- After customer approval and advance payment, move to design work, share a preview for approval, then print only after customer approves the final design.

## Privacy and safety
- Uploaded CAD, sketches and reference images are private customer assets, not public product images.
- Store them outside the public web root with random storage keys and authenticated, short-lived download access.
- Validate file signatures, extension, size and ownership; scan uploads before staff download.
- Never execute or render uploaded files on the server without a sandboxed processing pipeline.
- Keep separate statuses for design brief, design review, customer design approval, quote, and production.
- Preserve original customer brief and versioned design deliverables for dispute resolution.

This is a planned product capability. Phase 17 adds the notification/job foundation; the customer-facing design-from-idea workflow is scheduled for the Custom 3D Printing phase.
