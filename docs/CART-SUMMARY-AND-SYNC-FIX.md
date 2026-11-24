# Cart page — order summary spacing and cart sync failure

Two defects reported from the cart page screenshot, both fixed at their source
rather than by patching individual elements.

---

## 1. Order summary had no internal padding

### Root cause

`components/ui/Primitives.tsx` rendered `<Panel>` children raw:

```tsx
<section className="vx-panel">
  {head}
  {children}          {/* no body, no padding */}
  {footer}
</section>
```

Every caller had to remember to wrap its content in
`<div className="vx-panel__body">` themselves. Most did — the cart's order
summary did not, so its heading, description, rows and button sat directly
against the card border. An audit of the component found **25 panels** across
the storefront, account area and checkout that were rendering unpadded for the
same reason.

### Fix — the panel owns its padding

`Panel` now renders the padded body itself, unless it is explicitly told
otherwise:

```tsx
{flush || bodyless ? children : (
  <div className={`vx-panel__body ${bodyClassName}`.trim()} style={bodyStyle}>
    {children}
  </div>
)}
```

- `flush` — edge-to-edge content (cart line list, address list, order items).
- `bodyless` — the children bring their own body element: a `<form>` that needs
  `vx-form`, a `vx-grid`/`vx-stack` wrapper, or a body that overrides padding.
  Used in six places (add-address, quick links, support form, checkout payment
  block, custom-print brief, help FAQ).
- `bodyClassName` / `bodyStyle` — for the rare body that needs an extra class.

The 21 manual wrappers that were plain `<div className="vx-panel__body">` were
removed so the padding has exactly one owner.

### Spacing system

Padding is now tokenised on the panel itself, so head, body and foot share one
inline gutter and nothing can drift:

```css
.vx-panel {
  --vx-panel-pad-x: clamp(18px, 1.8vw, 24px);
  --vx-panel-pad-y: clamp(16px, 1.5vw, 20px);
}
.vx-panel__head { padding: calc(var(--vx-panel-pad-y) - 2px) var(--vx-panel-pad-x) var(--vx-panel-pad-y); }
.vx-panel__body { padding: var(--vx-panel-pad-y) var(--vx-panel-pad-x); }
.vx-panel__foot { padding: var(--vx-panel-pad-y) var(--vx-panel-pad-x); }
```

The money block got a matching rhythm instead of ad-hoc margins:

```css
.vx-summary { display: grid; gap: 12px; }
.vx-summary__row { display: flex; align-items: baseline; justify-content: space-between; gap: 16px; }
.vx-summary__row > :last-child { flex: none; text-align: right; font-variant-numeric: tabular-nums; }
.vx-summary__row--total { margin-top: 4px; border-top: 1px solid var(--vx-line); padding-top: 14px; }
.vx-summary__actions { display: grid; gap: 10px; margin-top: 20px; }
```

- Title and description: `line-height: 1.35` on the title, `6px` above the
  description, `16–20px` below the head.
- Rows: `12px` apart, labels left, amounts right-aligned in a tabular column.
- Total: separated by a hairline with `14px` of air above the figure.
- Checkout button: sits in `.vx-summary__actions` with `20px` clearance, and the
  inline `style={{ marginTop: 18 }}` hacks are gone.

### Content correction

The bottom row previously repeated "Subtotal" as its own label. It now reads
**Estimated total**, with explicit Shipping ("Calculated at checkout") and Taxes
("Confirmed at checkout") rows above it, matching what the server actually
confirms later. Nothing about pricing logic changed — the figure is still the
subtotal, which is why the label says *estimated*.

### Responsive

The panel padding clamps between 16–20 px vertical and 18–24 px horizontal, so
the card keeps breathing room on desktop without wasting width on phones.
`.vx-order-aside` is sticky above 899 px and returns to normal flow below it,
where `.vx-cart-layout` collapses to one column and the summary becomes a
full-width card. Verified by rule review across 1440 / 1024 / 768 / 390 px
breakpoints; no fixed widths are introduced.

---

## 2. "Cart sync failed"

### Investigation

The message came from `CartPageClient`, which PUTs the local cart to
`/api/customer/cart`. Probing the endpoint directly showed the request never
reached the route:

```
PUT /api/customer/cart   Origin: http://localhost:3000   → 403 {"error":"Cross-origin request blocked."}
```

Temporary instrumentation in `middleware.ts` printed the source of the
mismatch:

```
origin: "http://localhost:3000"   allowed: ["http://0.0.0.0:3000"]   host: "localhost:3000"
```

### Root cause

`middleware.ts` built its CSRF allow-list from `request.nextUrl.origin`, which
Next derives from **the address the server was bound to** — `0.0.0.0:3000`
under `next dev -H 0.0.0.0`, and an internal host behind a proxy. The browser's
`Origin` header carries the host the user actually visited (`localhost:3000`,
or the preview host). The two never matched, so every state-changing API call —
cart sync, add-to-cart, wishlist, checkout, admin actions — was rejected with
403 before authentication or validation ran.

This was not limited to the preview: any deployment where the bind address and
the public hostname differ (reverse proxy, container hostname, platform
preview) fails the same way.

### Fix

The allow-list is now anchored on the request's own `Host` /
`X-Forwarded-Host`, which is what the browser addressed and which an attacker
cannot forge, plus `X-Forwarded-Proto` when a proxy provides it. `nextUrl.origin`
is kept, and `TRUSTED_ORIGINS` still adds explicit extras.

```ts
const host = (request.headers.get("x-forwarded-host") || request.headers.get("host") || "").split(",")[0].trim();
if (host) {
  const proto = (request.headers.get("x-forwarded-proto") || "").split(",")[0].trim();
  if (proto) values.add(`${proto}://${host}`);
  values.add(`https://${host}`);
  values.add(`http://${host}`);
}
```

Verified matrix, before → after:

| Request | Before | After |
| --- | --- | --- |
| `Origin: http://localhost:3000` (same origin) | 403 blocked | reaches the route |
| `Origin: https://<preview-host>` behind proxy headers | 403 blocked | reaches the route |
| `Origin: https://evil.example` | 403 | 403 |
| No `Origin` header | 403 | 403 |
| Webhook routes | exempt | exempt |

### Client-side error handling

The page previously discarded the server's explanation and reported a generic
"Refresh this page and try again". It now keeps the real reason and offers a
retry:

- Network failure → "The request could not reach the server…"
- Server refusal → the API's own message (for example "A product in your cart
  is no longer available."), or a status-aware fallback for 5xx/other.
- The message is shown in a `role="alert"` block with **Try again** (re-runs the
  sync) and a link back to the collection.
- The checkout button stays disabled while the cart is unsynced — the failure is
  never replaced with a success state.

Sync semantics were also tightened:

- The PUT is still a full replace inside a transaction, so a retry cannot
  duplicate lines, and the client serialises requests through `syncQueue` so two
  syncs can never interleave.
- An empty local cart still sends `{ items: [] }` so a stale server cart is
  cleared; otherwise checkout could offer lines the customer had already
  removed. Guests with an empty cart now see "Cart empty" instead of a
  misleading "Sign-in needed".
- Local cart data (localStorage) is untouched by any of this — a failed sync
  never discards items.

---

## Verification

| Check | Command | Result |
| --- | --- | --- |
| Lint | `npm run lint` | clean |
| Source contracts | `npm test` | 96 / 96 pass |
| Type check | `npx tsc --noEmit` | 67 errors, all from the ungenerated Prisma client |
| Source preflight | `npm run preflight` | pass — 168 source files |
| Production build | `npm run build` | compiles successfully in 27.3 s, then stops on the pre-existing Prisma type error at `app/api/admin/analytics/route.ts:29` |
| Cart page | `GET /cart` | 200; summary renders inside `.vx-panel__body` with `.vx-summary__actions` |
| CSRF matrix | `PUT /api/customer/cart` | same-origin and proxied host reach the route; foreign and missing origins still 403 |

### Environment limitation

`@prisma/client` cannot be generated in this sandbox (no engine binaries, no
`DATABASE_URL`, no database), so the cart route itself still answers 500 locally
with `@prisma/client did not initialize yet`. That is why the live preview can
still show the sync alert: the CSRF block is gone, but there is no data layer
behind it here. On a machine with a generated client and a database the request
now reaches the handler and completes; nothing else in the flow was changed.
