# V3 — Master Design Overhaul

Implementation record for the VEXAUSE LABS V3 design pass. This document covers
what changed, why, how each area was verified, and what could not be verified in
this environment.

Base: `0994108` (main) → branch `arena/7673ea45-vexause-labs-platform`.
Previous work on the same branch: `6de6598` (Phase 55) and `4dedcee` (polish).

---

## 1. Scope and constraints

The overhaul reworked presentation only. Explicitly untouched:

- Prisma schema, migrations, seeds, database contents.
- Any credential or `.env` value.
- API routes, response shapes, auth, cart/wishlist persistence keys.
- Checkout pricing, Razorpay order creation and signature verification.
- Order workflow states, admin permissions and admin-only routes.
- No dependency was added; nothing was removed from the feature set.

All business rules continue to run server-side. Where a page needed data it
already consumed (`/api/products`, `/api/customer/cart`, `/api/store-config`,
`/api/customer/custom-requests`, …), the same endpoints are used.

---

## 2. Design system

`app/design-system.css` (1,224 lines) is the single source of truth for the
storefront language; `app/globals.css` (162 lines) keeps only the base reset,
the header, the reveal primitive, the SVG fallback animation and the admin
shell.

**Token layer** — colour (`--vxl-forest`, `--vxl-paper`, `--vxl-accent` lime),
type (`--vx-font-display` serif / `--vx-font-sans`), spacing steps
`--vx-space-1…7`, rhythm (`--vx-gutter`, `--vx-shell`, `--vx-section-y`),
radii, shadows, easing.

**Type scale** — one display face for editorial headlines (`.vx-title`,
`.vx-hero__title`, `.vx-cta h2`, `.vx-story__title`), one sans for everything
else, body copy at 13.5–15.5 px with 1.65–1.75 line height and a 62ch measure
(`.vx-lead`). Nothing is bold-by-default: headings use 500–620 weights, labels
use 650–750 with tracking.

**Primitives** — `.vx-shell`, `.vx-page` (+`--narrow`, `--mid`), `.vx-section`,
`.vx-head`, `.vx-kicker`, `.vx-panel`, `.vx-grid`, `.vx-form`, `.vx-field`,
`.vx-btn` (lime / primary / accent / quiet / danger / icon / sm / block),
`.vx-badge`, `.vx-alert`, `.vx-chip`, `.vx-skeleton`, `.vx-faq`, `.vx-kv`,
`.vx-backlink`, `.vx-order-aside`, `.vx-card-heart`, `.vx-card-flag`.

**Duplicated CSS removed this pass**

- All legacy homepage CSS (`.vxl-home*`, `.vxl-hero-*`, `.vxl-showcase-*`,
  `.vxl-section-*`, `.vxl-category-*`, `.vxl-featured-grid`,
  `.vxl-collection-state`, `.vxl-process-*`, `.vxl-service-*`,
  `.vxl-final-cta`, `.vxl-auth-*`, `.vxl-account-shell`, `.vxl-footer*`) — 104
  rules deleted rather than left orphaned.
- The legacy product card (`.vxl-product-card*`, `.vxl-shop-card`) with its
  24 px radius and pill-button override; replaced by `.vx-product-card` using
  the same 16 px / hairline language as the rest of the system.
- Dead page shells (`.vxl-page-shell`, `.vxl-page-heading`, `.vxl-filter-panel`,
  `.vxl-filter-chip`, `.vxl-cart-items`, `.vxl-cart-line*`,
  `.vxl-order-summary`, `.vxl-checkout-page`).
- The `main:has(> .vxl-header) …` overrides that forced a 760 px column and
  999 px buttons on every routed page — the cause of "why does the help page
  look different from the shop" type inconsistency. Pages now opt in to a
  width explicitly.

---

## 3. Hero (Parts 3, 4)

### 3.1 The rectangular boundary

The edge was not a CSS border. It came from the scene having its own surfaces:
a ground plane, a backdrop plane and a fog haze sitting inside a canvas that was
larger than the visible area, so the plane's silhouette read as a rectangle
against the page. That is why simply covering it would not have worked.

Fix, in `components/HeroProductScene.tsx`:

- `alpha: true`, `premultipliedAlpha: true`, `setClearColor(0x000000, 0)` and
  `scene.background = null` — the canvas is genuinely transparent.
- No ground plane, no backdrop plane, no haze card.
- The canvas is positioned `absolute; inset: 0` inside `.vx-hero__stage`, which
  is itself `inset: 0` over the whole hero section (`.vx-hero` with
  `isolation: isolate` and `overflow: hidden`), so the rendered products share
  the page's own radial-gradient background with no seam to see.
- Grounding comes from per-product contact shadows (a radial alpha texture on a
  plane at `y = 0.004`, opacity tied to the object's float offset) that fade out
  well inside the frame.
- `.vx-hero__inner` sits at `z-index: 2` above the stage, so type is never
  composited under the scene.

The static fallback (`components/HeroProductFallback.tsx`) was rewritten to the
same rule: an inline SVG with no frame, retinted to the forest/sage/cream
palette, with a soft glow and per-product contact ellipses instead of the old
plinth rectangle.

### 3.2 Staging model

`components/hero/stage.ts` is now the single source of staged positions, camera
framing and per-model presence. Both the WebGL scene and the offline preview
harness import it, so the two can no longer drift.

- Positions are authored as **screen intent** (`{ screen: 0.81, z: -2.3 }`) and
  converted to world coordinates through the real camera basis (position,
  target, fov, aspect), so a slot lands where it is meant to even though the
  camera is yawed left and pitched down.
- Presence is normalised by each model's **longest native dimension**, so a
  3.47 m-wide car and a 2.57 m-tall robot read at comparable weight instead of
  distorting the composition.
- Two arrangements exist: a wide arc to the right of the hero copy (featured at
  0.60 of the width, supports at 0.81 / 0.93, a left support at 0.47, two deep
  studies at 0.735 / 0.90) and a centred arrangement for the narrow band under
  the copy. `stagePoses(featured, wide)` / `stageStudies(wide)` return the set;
  the scene re-stages smoothly when the layout flips.
- Six objects are staged at up to five depths, and nothing is placed left of
  0.41 of the frame on wide layouts, which is where the copy ends.

### 3.3 Motion

Each object carries its own drift record — bob amplitude, bob speed, phase, yaw
amplitude, yaw speed — so no two objects move together. The featured slot is
promoted on a slow 8 s cycle with staggered, eased moves (0.09 s apart, 1.7 s
duration) and a short camera dolly pulse; entry is staggered by 0.09 s with a
rise from below the floor.

`prefers-reduced-motion: reduce` renders a single static frame: the animation
loop is never started, drift and camera orbit are zeroed, entrance progress is
forced to 1. Pointer parallax is only attached for fine pointers.

### 3.4 Verification of the staging

`scripts/preview-hero-models.mjs` renders the composition on the CPU through
the shared module and prints the projected footprint of every object, so
overlap, clipping and out-of-frame placement are measurable rather than guessed:

```
dragon   x 0.41–0.71  y 0.44–0.81
car      x 0.42–0.52  y 0.59–0.67
vase     x 0.77–0.85  y 0.47–0.65
robot    x 0.91–0.97  y 0.46–0.62
study-0  x 0.72–0.75  y 0.43–0.51
study-1  x 0.87–0.93  y 0.47–0.50
```

Nothing crosses the copy edge, nothing is cut by the frame, and the receding
car/vase ordering gives the depth ladder. Previews:
`.qa/previews/00-stage-wide.png`, `00-stage-vase.png` (featured = vase),
`00-stage-narrow.png` (390 × 430).

---

## 4. Homepage (Part 5)

- Hero: kicker, editorial headline with an italic emphasis line, 470 px lead,
  two actions (lime primary / ghost secondary), three factual proof points, an
  aside rail with a scroll cue.
- Announcement bar carries the dynamic tagline (`StoreTagline`) next to the
  store message; the footer carries the store name, tagline, contact email and
  phone from `/api/store-config`.
- Catalogue intro: the oversized empty band above the grid was removed; the
  heading, filter chips and grid now sit on one rhythm with the section
  spacing tokens.
- Featured grid: `.vx-feature-card` with `--lead` / `--tall` / `--wide`
  variants, fixed aspect ratios per variant, image scale on hover, skeleton
  state while products load.
- Story section: two-column editorial layout with a numbered list of studio
  principles, each with a true statement (no invented claims).
- Process: the four steps (share the brief → review feasibility → approve the
  quote → production) with hairline separators and staggered reveal.
- Closing band: the "BUILD WHAT'S NEXT" block is now `.vx-cta`, a full-bleed
  lime section across the viewport with a display headline, supporting copy,
  two actions and three notes — no longer a small floating rectangle.
- Footer: `.vx-footer` on the dark forest background, four columns
  (brand, explore, account, help), consistent with the header's type and spacing.

---

## 5. Storefront, account and admin (Parts 6–10)

- **Shop** — `vx-page` shell, `vx-page-head` with kicker/title/lead and search,
  `vx-chip-row` categories, `.vx-product-card` grid (4 → 3 → 2 columns), vendor
  filters, skeletons, empty and error states.
- **PDP** — gallery with thumbnail selection and card flags, variant selector,
  quantity stepper, buy actions, delivery/returns panels, review list and review
  form, all in `vx-panel` / `vx-badge` / `vx-alert` primitives.
- **Cart / wishlist** — `vx-cart-layout` with the line-item panel and a sticky
  `vx-order-aside` summary, synchronisation badge, empty states, quantity
  controls with server reconciliation unchanged.
- **Checkout** — address selection, shipping, payment method presentation,
  order summary, verification failure handling (Razorpay flow untouched).
- **Custom 3D printing** — upload area, brief, material/finish options limited
  to what is actually offered, inline validation, next steps, privacy note and
  the quote workflow explanation.
- **Contact / help** — factual guidance grounded in the real workflow, contact
  details from config, FAQ accordions in `vx-faq`.
- **Account and admin** — `AccountShell`, `AuthShell` and `AdminShell` were
  aligned to the same tokens in the earlier Phase 55 commit; this pass removed
  the remaining legacy page wrappers and inconsistent overrides.

---

## 6. Typography, spacing and responsiveness (Parts 11–13)

- Fluid type with `clamp()` at every headline step; body text 14–15.5 px;
  small caps labels 8.5–11.5 px with 0.14–0.22em tracking.
- Spacing tokens drive gutters, section padding, card padding, grid gaps and
  form spacing; the new `.vx-product-card` shell and its compact breakpoint use
  the same steps.
- Breakpoints at 1180 / 1080 / 899 / 640 / 560 px cover the shop grid, cart
  layout, hero stack, footer columns, process rows and the hero band.
- Verified rule-level: no fixed `px` width wider than the gutter-corrected
  viewport remains in the storefront shell, `body` keeps `overflow-x: hidden`
  as a safety net, and every new grid collapses to one column by 640 px.

---

## 7. Motion and feedback (Part 14)

- `Reveal` wraps sections in a single `IntersectionObserver`, with stagger
  delays; it renders static content when the observer is unavailable.
- Hover states on nav, buttons, cards, chips, footer links and gallery
  thumbnails; active/pressed states on buttons; focus-visible outlines on every
  interactive element (`3px rgba(200, 243, 106, .9)`).
- Loading: skeletons for cards, galleries and summaries; `aria-busy` on
  live regions.
- Feedback: cart/wishlist counters, saved-state heart toggles, form alerts
  (`vx-alert--ok` / `--danger`).
- All motion is disabled under `prefers-reduced-motion`.

---

## 8. Performance (Part 16)

- The 3D scene is a separate client chunk loaded through `IntersectionObserver`
  with a 160 px root margin; the static SVG fallback paints first and fades out
  when WebGL reports ready.
- The scene pauses on `visibilitychange` and when scrolled out of view, caps the
  pixel ratio (1.5 compact / 2 desktop) and reduces antialiasing on compact
  devices.
- Repeated CSS was deleted rather than overridden (see §2), so the cascade has
  one owner per component.
- `.vx-home .vx-section` scoping removed the conflicting generic `.vx-section`
  padding that had been applying to inner pages as well.

---

## 9. Verification (Part 18)

| Check | Result |
| --- | --- |
| `npm run lint` | clean |
| `npm test` | 96 / 96 pass |
| `npx tsc --noEmit` | 65 errors, all from the ungenerated Prisma client (see limitations) |
| `npm run preflight` | passed — 168 source files |
| `npm run build` | compiles successfully; type-check stops at `app/api/admin/analytics/route.ts:29` (pre-existing) |
| Route smoke (dev server) | `/`, `/shop`, `/help`, `/contact`, `/custom-3d-printing`, `/cart`, `/checkout`, `/wishlist`, `/account`, `/account/login` → 200 |
| Contract tests adjusted? | no — two failing contracts were fixed by restoring the behaviour they describe (dynamic tagline on the homepage, `aria-label="Help links"` on the footer help column) |
| Hero previews | wide / vase-featured / narrow rendered and measured (see §3.4) |

### Environment limitations

1. **Prisma client is not generated in this sandbox** (`presets` download is
   blocked), so every `@prisma/client` type is unavailable. This produces the
   65 `tsc` errors and the single build failure at
   `app/api/admin/analytics/route.ts:29`. They exist on the base commit too and
   are unrelated to this pass. Consequence: `/admin*` and `/product/*` return
   500 locally because the data layer cannot load, so those screens could not be
   exercised against live data here.
2. **No headless browser** — Chromium cannot launch in this container
   (`libnss3.so` missing, no root). Visual QA therefore used the CPU renderer
   (`scripts/preview-hero-models.mjs`) for the hero, served HTML for markup and
   class contracts, and rule-level CSS review for the rest. A browser pass is
   still worth running before release; nothing in the implementation depends on
   a specific viewport being seen.
3. **Product imagery** — the catalogue renders whatever `products.images`
   contains. No stock photography was added and no placeholder was dressed up
   as a real product; cards fall back to the branded `.vxl-product-placeholder`
   mark when a product has no image.

---

## 10. Files of record

| Path | Role |
| --- | --- |
| `app/design-system.css` | token layer, primitives, homepage sections, storefront shells |
| `app/globals.css` | reset, header, reveal, fallback animation, admin shell |
| `app/page.tsx` | V3 homepage composition |
| `components/hero/stage.ts` | staging + camera source of truth |
| `components/HeroProductScene.tsx` | WebGL studio scene, motion, contact shadows |
| `components/HeroProductShowcase.tsx` | lazy loading, labels, accessible description |
| `components/HeroProductFallback.tsx` | static SVG fallback |
| `components/HomeCatalogSections.tsx` | catalogue intro, chips, featured grid |
| `components/ShopClient.tsx` | shop, cart, wishlist clients |
| `scripts/preview-hero-models.mjs` | offline staging previews + footprint report |
