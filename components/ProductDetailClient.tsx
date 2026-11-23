"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Check, Heart, Minus, Plus, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import type { ShopProduct } from "@/lib/shop-types";
import { useShopState } from "@/components/ShopClient";
import StorefrontHeader from "@/components/StorefrontHeader";
import { StoreContactFooter } from "@/components/StorefrontConfig";
import { Badge, EmptyState, Panel } from "@/components/ui/Primitives";

const money = (p: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(p / 100);

type Review = { id: string; rating: number; title: string | null; body: string; createdAt: string; user: { name: string } | null };

export default function ProductDetailClient({ slug }: { slug: string }) {
  const [product, setProduct] = useState<ShopProduct | null>(null);
  const [error, setError] = useState("");
  const [reviewData, setReviewData] = useState<{ average: number | null; count: number }>({ average: null, count: 0 });
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const shop = useShopState();

  useEffect(() => {
    let active = true;
    setProduct(null);
    setError("");
    setActiveImage(0);
    setAdded(false);
    fetch(`/api/products/by-slug/${encodeURIComponent(slug)}`)
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error || "Could not load product.");
        if (!active) return;
        setProduct(d.product || null);
        setSelectedVariantId(d.product?.variants?.[0]?.id || "");
        if (d.product)
          fetch(`/api/products/${d.product.id}/reviews`)
            .then((r) => r.json())
            .then((d) => {
              if (!active) return;
              setReviewData(d.summary || { average: null, count: 0 });
              setReviews(Array.isArray(d.reviews) ? d.reviews : []);
            })
            .catch(() => {});
      })
      .catch((e) => {
        if (active) setError(e.message || "Could not load product.");
      });
    return () => {
      active = false;
    };
  }, [slug]);

  if (error)
    return (
      <main className="vxl-product-page min-h-screen">
        <StorefrontHeader />
        <div className="vx-page vx-page--narrow">
          <div className="vx-alert vx-alert--danger" role="alert">{error}</div>
          <Link href="/shop" className="vx-btn vx-btn--sm" style={{ marginTop: 16 }}>Back to the collection</Link>
        </div>
        <StoreContactFooter />
      </main>
    );

  if (!product)
    return (
      <main className="vxl-product-page min-h-screen">
        <StorefrontHeader />
        <div className="vx-page">
          <div className="vx-pdp" aria-busy="true">
            <div className="vx-skeleton" style={{ aspectRatio: "1 / 1", borderRadius: 20 }} />
            <div style={{ display: "grid", gap: 12 }}>
              <div className="vx-skeleton" style={{ height: 10, width: "30%" }} />
              <div className="vx-skeleton" style={{ height: 30, width: "80%" }} />
              <div className="vx-skeleton" style={{ height: 22, width: "40%" }} />
              <div className="vx-skeleton" style={{ height: 14, width: "100%" }} />
              <div className="vx-skeleton" style={{ height: 48, width: "100%", marginTop: 10 }} />
            </div>
          </div>
          <p className="sr-only" role="status">Loading product…</p>
        </div>
        <StoreContactFooter />
      </main>
    );

  const images = product.images || [];
  const selectedImage = images[activeImage] || images[0];
  const variants = product.variants || [];
  const selectedVariant = variants.find((variant) => variant.id === selectedVariantId) || variants[0];
  const hasVariants = variants.length > 0;
  const tracked = hasVariants ? !!selectedVariant?.trackInventory : product.trackInventory !== false;
  const available = hasVariants ? !!selectedVariant?.available : product.available ?? (!tracked || product.stockQuantity > 0);
  const displayedPrice = hasVariants ? selectedVariant?.pricePaise ?? product.pricePaise : product.pricePaise;
  const comparePrice = hasVariants ? selectedVariant?.compareAtPaise ?? null : product.compareAtPaise;
  const hasDiscount = typeof comparePrice === "number" && comparePrice > displayedPrice;
  const discount = hasDiscount ? Math.round((1 - displayedPrice / comparePrice!) * 100) : 0;
  const stockCount = hasVariants ? selectedVariant?.stockQuantity ?? 0 : product.stockQuantity;
  const maxQuantity = !tracked ? 99 : Math.max(1, Math.min(99, stockCount));

  function add() {
    if (!product) return;
    if (hasVariants && selectedVariant) {
      shop.add(product.id, selectedVariant.trackInventory ? selectedVariant.stockQuantity : 99, selectedVariant.id);
      for (let i = 1; i < quantity; i += 1) {
        shop.add(product.id, selectedVariant.trackInventory ? selectedVariant.stockQuantity : 99, selectedVariant.id);
      }
    } else {
      const max = product.trackInventory === false ? 99 : product.stockQuantity;
      shop.add(product.id, max);
      for (let i = 1; i < quantity; i += 1) shop.add(product.id, max);
    }
    setAdded(true);
  }

  return (
    <main className="vxl-product-page min-h-screen">
      <StorefrontHeader />
      <div className="vx-page">
        <nav aria-label="Breadcrumb" className="vx-backlink" style={{ gap: 10 }}>
          <Link href="/shop" className="vx-backlink">
            <ArrowLeft size={14} aria-hidden="true" /> Store
          </Link>
          <span aria-hidden="true" style={{ opacity: 0.4 }}>/</span>
          <span className="vx-muted vx-small">{product.category?.name || "Collection"}</span>
        </nav>

        <div className="vx-pdp" style={{ marginTop: 20 }}>
          <section aria-label="Product images" className="vx-gallery">
            <div className="vx-gallery__main">
              {selectedImage ? (
                <Image
                  key={selectedImage.id}
                  src={selectedImage.url}
                  alt={selectedImage.altText || product.name}
                  fill
                  sizes="(min-width: 980px) 55vw, 100vw"
                  className="object-contain"
                  fetchPriority="high"
                />
              ) : (
                <div style={{ display: "grid", height: "100%", placeItems: "center", color: "rgba(16,47,38,.45)", fontSize: 11, fontWeight: 700, letterSpacing: ".18em" }}>
                  VEXAUSE / PRODUCT
                </div>
              )}
              {hasDiscount ? <span className="vx-card-flag" style={{ top: 14, bottom: "auto", left: 14 }}>{discount}% off</span> : null}
            </div>
            {images.length > 1 ? (
              <div className="vx-gallery__thumbs" aria-label="Choose product image">
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    aria-label={`View image ${index + 1} of ${images.length}`}
                    aria-pressed={activeImage === index}
                    className="vx-gallery__thumb"
                  >
                    <Image src={image.url} alt="" fill sizes="76px" className="object-cover" />
                  </button>
                ))}
              </div>
            ) : null}
          </section>

          <section aria-label="Product information" style={{ minWidth: 0 }}>
            <p className="vx-kicker">{product.category?.name || "VEXAUSE LABS"}</p>
            <h1 className="vx-title" style={{ fontSize: "clamp(26px, 3.4vw, 38px)", marginTop: 12 }}>{product.name}</h1>
            <div className="vx-row" style={{ marginTop: 10, gap: 8 }}>
              {(hasVariants ? selectedVariant?.sku : product.sku) ? (
                <span className="vx-small vx-muted">SKU {hasVariants ? selectedVariant?.sku : product.sku}</span>
              ) : null}
              <Badge tone={available ? "ok" : "danger"}>{available ? (tracked ? `In stock · ${stockCount}` : "Made to order") : "Unavailable"}</Badge>
            </div>

            <div className="vx-pdp__price">
              <b>{money(displayedPrice)}</b>
              {hasDiscount ? (
                <>
                  <s>{money(comparePrice!)}</s>
                  <span className="vx-small" style={{ color: "var(--vx-success)", fontWeight: 700 }}>Save {money(comparePrice! - displayedPrice)}</span>
                </>
              ) : null}
            </div>

            <p className="vx-small vx-muted" style={{ marginTop: 8 }}>
              {reviewData.count
                ? `${reviewData.average?.toFixed(1)} / 5 from ${reviewData.count} approved review${reviewData.count === 1 ? "" : "s"}`
                : "No approved reviews yet — reviews appear after moderation."}
            </p>

            {product.shortDescription ? (
              <p style={{ marginTop: 16, color: "var(--vx-ink-soft)", fontSize: 13.5, lineHeight: 1.7 }}>{product.shortDescription}</p>
            ) : null}

            {hasVariants ? (
              <div className="vx-variant">
                <span className="vx-label" id="variant-label">Choose an option</span>
                {variants.length <= 6 ? (
                  <div className="vx-variant__options" role="group" aria-labelledby="variant-label">
                    {variants.map((variant) => (
                      <button
                        key={variant.id}
                        type="button"
                        onClick={() => setSelectedVariantId(variant.id)}
                        aria-pressed={selectedVariant?.id === variant.id}
                        disabled={!variant.available}
                        className="vx-variant__option"
                      >
                        {variant.name} · {money(variant.pricePaise)}
                      </button>
                    ))}
                  </div>
                ) : (
                  <select
                    id="product-variant"
                    value={selectedVariant?.id || ""}
                    onChange={(e) => setSelectedVariantId(e.target.value)}
                    className="vx-select"
                    aria-labelledby="variant-label"
                  >
                    {variants.map((variant) => (
                      <option key={variant.id} value={variant.id}>
                        {variant.name} · {money(variant.pricePaise)}
                        {variant.available ? "" : " · Unavailable"}
                      </option>
                    ))}
                  </select>
                )}
                {selectedVariant && Object.entries(selectedVariant.optionValues || {}).length ? (
                  <p className="vx-small vx-muted">
                    {Object.entries(selectedVariant.optionValues).map(([key, value]) => `${key}: ${value}`).join(" · ")}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="vx-buy">
              <div className="vx-row" style={{ gap: 12 }}>
                <div className="vx-stepper" aria-label="Quantity">
                  <button type="button" className="vx-stepper__btn" aria-label="Decrease quantity" onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={quantity <= 1}>
                    <Minus size={13} aria-hidden="true" />
                  </button>
                  <span className="vx-stepper__value vx-tabular" aria-live="polite">{quantity}</span>
                  <button type="button" className="vx-stepper__btn" aria-label="Increase quantity" onClick={() => setQuantity((q) => Math.min(maxQuantity, q + 1))} disabled={quantity >= maxQuantity}>
                    <Plus size={13} aria-hidden="true" />
                  </button>
                </div>
                <button type="button" onClick={add} disabled={!available} className="vx-btn vx-btn--primary" style={{ flex: 1, minHeight: 48 }}>
                  <ShoppingBag size={16} aria-hidden="true" /> Add to cart
                </button>
                <button
                  type="button"
                  onClick={() => shop.toggleWish(product.id)}
                  aria-label={shop.wishlist.includes(product.id) ? "Remove from wishlist" : "Save to wishlist"}
                  aria-pressed={shop.wishlist.includes(product.id)}
                  className="vx-btn vx-btn--icon"
                  style={{ minHeight: 48, width: 48, color: shop.wishlist.includes(product.id) ? "#b3492f" : undefined }}
                >
                  <Heart size={18} fill={shop.wishlist.includes(product.id) ? "currentColor" : "none"} aria-hidden="true" />
                </button>
              </div>
              {added ? (
                <div className="vx-alert vx-alert--ok" role="status">
                  <Check size={15} aria-hidden="true" />
                  <span style={{ flex: 1 }}>Added to your cart.</span>
                  <Link href="/cart" className="vx-btn vx-btn--sm" style={{ marginLeft: "auto" }}>View cart</Link>
                </div>
              ) : null}
            </div>

            <dl className="vx-spec-list">
              <div>
                <dt>Availability</dt>
                <dd>{available ? (tracked ? `${stockCount} in stock` : "Made to order") : "Currently unavailable"}</dd>
              </div>
              <div>
                <dt>Category</dt>
                <dd>{product.category?.name || "Unsorted"}</dd>
              </div>
              <div>
                <dt>SKU</dt>
                <dd>{(hasVariants ? selectedVariant?.sku : product.sku) || "Not assigned"}</dd>
              </div>
            </dl>

            <div className="vx-grid vx-grid--2" style={{ marginTop: 18, gap: 10 }}>
              <div className="vx-panel vx-panel--quiet" style={{ padding: 14 }}>
                <p className="vx-row" style={{ gap: 7, margin: 0, color: "var(--vxl-forest)", fontSize: 12, fontWeight: 700 }}>
                  <ShieldCheck size={15} aria-hidden="true" /> Secure checkout
                </p>
                <p className="vx-small vx-muted" style={{ margin: "5px 0 0" }}>
                  Price and stock are verified again on the server when the order is placed.
                </p>
              </div>
              <div className="vx-panel vx-panel--quiet" style={{ padding: 14 }}>
                <p className="vx-row" style={{ gap: 7, margin: 0, color: "var(--vxl-forest)", fontSize: 12, fontWeight: 700 }}>
                  <Truck size={15} aria-hidden="true" /> Delivery
                </p>
                <p className="vx-small vx-muted" style={{ margin: "5px 0 0" }}>
                  Shipping options and tracking appear in your account after dispatch.
                </p>
              </div>
            </div>
          </section>
        </div>

        <div className="vx-split" style={{ marginTop: 34 }}>
          <Panel title="Product details" meta="Written by the studio — no generated marketing copy.">
            <div className="vx-panel__body">
              <div style={{ whiteSpace: "pre-wrap", color: "var(--vx-ink-soft)", fontSize: 13.5, lineHeight: 1.8 }}>
                {product.description || product.shortDescription || "Product details will be confirmed by the store."}
              </div>
              <p className="vx-small vx-muted" style={{ marginTop: 18, borderTop: "1px solid var(--vx-line)", paddingTop: 14 }}>
                Need something bespoke?{" "}
                <Link href="/custom-3d-printing" style={{ fontWeight: 700, textDecoration: "underline", textUnderlineOffset: 3 }}>
                  Request a custom 3D print
                </Link>{" "}
                and we will quote before any work begins.
              </p>
            </div>
          </Panel>

          <Panel title="Reviews" meta={reviewData.count ? `${reviewData.count} approved review${reviewData.count === 1 ? "" : "s"}` : "Moderated before publishing"}>
            <div className="vx-panel__body">
              {reviews.length > 0 ? (
                <div>
                  {reviews.slice(0, 5).map((review) => (
                    <article key={review.id} className="vx-review">
                      <p className="vx-row" style={{ margin: 0, gap: 8 }}>
                        <span aria-label={`${review.rating} out of 5`} style={{ color: "#3f6b4f", letterSpacing: ".08em" }}>
                          {"★".repeat(Math.max(0, Math.min(5, review.rating)))}
                          <span style={{ color: "#c8d2c7" }}>{"★".repeat(5 - Math.max(0, Math.min(5, review.rating)))}</span>
                        </span>
                        <span className="vx-small vx-muted">{review.user?.name || "Verified customer"}</span>
                      </p>
                      {review.title ? <p style={{ margin: "6px 0 0", color: "var(--vxl-forest)", fontSize: 12.5, fontWeight: 700 }}>{review.title}</p> : null}
                      <p className="vx-small" style={{ margin: "4px 0 0", color: "var(--vx-ink-soft)", lineHeight: 1.65 }}>{review.body}</p>
                    </article>
                  ))}
                </div>
              ) : (
                <EmptyState title="No approved reviews yet" text="Reviews are published only after moderation from verified purchases." />
              )}
              <p className="vx-small vx-muted" style={{ marginTop: 14 }}>
                Purchased this product? Submit a review from{" "}
                <Link href="/account/reviews" style={{ fontWeight: 700, textDecoration: "underline" }}>your account</Link>.
              </p>
            </div>
          </Panel>
        </div>
      </div>
      <StoreContactFooter />
    </main>
  );
}
