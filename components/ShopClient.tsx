"use client";

import { StoreContactFooter } from "@/components/StorefrontConfig";
import StorefrontHeader from "@/components/StorefrontHeader";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowUpRight, Heart, Minus, Plus, Search, ShoppingBag, SlidersHorizontal, Trash2 } from "lucide-react";
import type { CartLine, ShopProduct } from "@/lib/shop-types";
import { Badge, EmptyState, Panel, StatusBadge } from "@/components/ui/Primitives";

const CART_KEY = "vexause_cart_v1";
const WISH_KEY = "vexause_wishlist_v1";
const money = (paise: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(paise / 100);

async function fetchProductsByIds(ids: string[]): Promise<ShopProduct[]> {
  const unique = Array.from(new Set(ids));
  const batches = Array.from({ length: Math.ceil(unique.length / 48) }, (_, i) => unique.slice(i * 48, (i + 1) * 48));
  const results = await Promise.all(
    batches.map(async (batch) => {
      const params = new URLSearchParams({ ids: batch.join(","), limit: "48" });
      const response = await fetch(`/api/products?${params}`);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not load saved products.");
      return (data.products || []) as ShopProduct[];
    }),
  );
  return results.flat();
}

export function useShopState() {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const read = () => {
      try {
        const c = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
        const w = JSON.parse(localStorage.getItem(WISH_KEY) || "[]");
        if (Array.isArray(c))
          setCart(
            c
              .filter(
                (x) =>
                  x &&
                  typeof x.productId === "string" &&
                  (x.variantId == null || typeof x.variantId === "string") &&
                  Number.isInteger(x.quantity) &&
                  x.quantity > 0,
              )
              .map((x) => ({ ...x, variantId: x.variantId || null, quantity: Math.min(99, x.quantity) })),
          );
        if (Array.isArray(w)) setWishlist(Array.from(new Set(w.filter((x) => typeof x === "string"))));
      } catch {
        setCart([]);
        setWishlist([]);
      }
    };
    read();
    const onStorage = (event: StorageEvent) => {
      if (event.key === CART_KEY || event.key === WISH_KEY || event.key === null) read();
    };
    window.addEventListener("storage", onStorage);
    setReady(true);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  useEffect(() => {
    if (ready) {
      try {
        localStorage.setItem(CART_KEY, JSON.stringify(cart));
      } catch {
        /* Browser storage may be unavailable or full. */
      }
    }
  }, [cart, ready]);
  useEffect(() => {
    if (ready) {
      try {
        localStorage.setItem(WISH_KEY, JSON.stringify(wishlist));
      } catch {
        /* Browser storage may be unavailable or full. */
      }
    }
  }, [wishlist, ready]);
  function add(id: string, max = 99, variantId?: string) {
    setCart((old) => {
      const found = old.find((x) => x.productId === id && (x.variantId || null) === (variantId || null));
      return found
        ? old.map((x) =>
            x.productId === id && (x.variantId || null) === (variantId || null)
              ? { ...x, quantity: Math.min(99, Math.max(1, max), x.quantity + 1) }
              : x,
          )
        : [...old, { productId: id, variantId: variantId || null, quantity: 1 }];
    });
  }
  function qty(id: string, variantId: string | null | undefined, n: number, max = 99) {
    setCart((old) =>
      n <= 0
        ? old.filter((x) => !(x.productId === id && (x.variantId || null) === (variantId || null)))
        : old.map((x) =>
            x.productId === id && (x.variantId || null) === (variantId || null)
              ? { ...x, quantity: Math.min(99, Math.max(1, max), n) }
              : x,
          ),
    );
  }
  function toggleWish(id: string) {
    setWishlist((old) => (old.includes(id) ? old.filter((x) => x !== id) : [...old, id]));
  }
  return { cart, wishlist, add, qty, toggleWish, ready };
}

/* -------------------------------------------------------------------------- */
/* Product card                                                                */
/* -------------------------------------------------------------------------- */

export function ShopProductCard({
  product,
  saved,
  onToggleWish,
  onAdd,
  priority,
}: {
  product: ShopProduct;
  saved: boolean;
  onToggleWish: () => void;
  onAdd: () => void;
  priority?: boolean;
}) {
  const image = product.images?.[0];
  const soldOut = product.available === false;
  return (
    <article className="vx-product-card">
      <div className="vx-product-card__media">
        <Link href={`/product/${product.slug}`} aria-label={`View ${product.name}`} className="vx-product-card__link">
          {image?.url ? (
            <Image
              src={image.url}
              alt={image.altText || product.name}
              fill
              priority={priority}
              sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="vx-product-card__img"
            />
          ) : (
            <span className="vxl-product-placeholder" aria-hidden="true">
              <span>VXL</span>
            </span>
          )}
        </Link>
        <button
          type="button"
          onClick={onToggleWish}
          aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          aria-pressed={saved}
          className="vx-card-heart"
        >
          <Heart size={16} fill={saved ? "currentColor" : "none"} aria-hidden="true" />
        </button>
        {soldOut ? <span className="vx-card-flag">Sold out</span> : null}
      </div>
      <div className="vx-product-card__body">
        <p className="vx-product-card__eyebrow">{product.category?.name || "VEXAUSE LABS"}</p>
        <h2 className="vx-product-card__title">
          <Link href={`/product/${product.slug}`}>{product.name}</Link>
        </h2>
        {product.shortDescription ? <p className="vx-product-card__desc">{product.shortDescription}</p> : null}
        <div className="vx-product-card__price">
          <span>{money(product.pricePaise)}</span>
          {product.compareAtPaise && product.compareAtPaise > product.pricePaise ? (
            <s>{money(product.compareAtPaise)}</s>
          ) : null}
        </div>
        <div className="vx-product-card__actions">
          <button
            type="button"
            onClick={onAdd}
            disabled={soldOut || !!product.hasVariants}
            className="vx-btn vx-btn--primary vx-btn--sm"
          >
            {soldOut ? "Sold out" : product.hasVariants ? "Choose options" : "Add to cart"}
          </button>
          <Link href={`/product/${product.slug}`} className="vx-btn vx-btn--sm">
            Details
          </Link>
        </div>
      </div>
    </article>
  );
}

/* -------------------------------------------------------------------------- */
/* Catalogue                                                                   */
/* -------------------------------------------------------------------------- */

export function ShopPageClient() {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("newest");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const state = useShopState();

  useEffect(() => {
    const initialCategory = new URLSearchParams(window.location.search).get("category");
    if (initialCategory) setCategory(initialCategory);
  }, []);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({ page: String(page), limit: "12", sort });
        if (search.trim()) params.set("q", search.trim());
        if (category) params.set("category", category);
        if (minPrice.trim()) params.set("minPrice", String(Math.round(Number(minPrice) * 100)));
        if (maxPrice.trim()) params.set("maxPrice", String(Math.round(Number(maxPrice) * 100)));
        if (inStockOnly) params.set("inStock", "true");
        const response = await fetch(`/api/products?${params.toString()}`, { signal: controller.signal });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Catalogue unavailable");
        if (active) {
          setProducts(data.products);
          setCategories(data.categories || []);
          setTotal(data.pagination?.total || 0);
          setPageCount(data.pagination?.pageCount || 0);
        }
      } catch (e: any) {
        if (active && e.name !== "AbortError") setError(e.message || "Could not load products.");
      } finally {
        if (active) setLoading(false);
      }
    }, 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [search, category, sort, minPrice, maxPrice, page, inStockOnly]);

  function resetFilters() {
    setSearch("");
    setCategory("");
    setSort("newest");
    setMinPrice("");
    setMaxPrice("");
    setInStockOnly(false);
    setPage(1);
  }

  const count = state.cart.reduce((n, x) => n + x.quantity, 0);
  const filtersUsed = Boolean(search || category || minPrice || maxPrice || inStockOnly);

  return (
    <main className="vx-store-page min-h-screen">
      <StorefrontHeader cartCount={state.ready ? count : null} wishlistCount={state.ready ? state.wishlist.length : null} />
      <div className="vx-page">
        <header className="vx-page-head">
          <div>
            <p className="vx-kicker">VEXAUSE LABS / Store</p>
            <h1 className="vx-title">Explore the collection</h1>
            <p className="vx-lead">
              Original 3D-printed objects, printed to order in our studio. Every listing shows live stock, and prices are
              recalculated on the server at checkout.
            </p>
          </div>
          <div className="vx-actions" style={{ alignItems: "stretch" }}>
            <label className="vx-search">
              <Search size={15} aria-hidden="true" />
              <span className="sr-only">Search products</span>
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search products or SKU"
                className="vx-search__input"
              />
            </label>
          </div>
        </header>

        <div className="vx-catalogue-bar">
          <div className="vx-chip-row" role="group" aria-label="Filter by category">
            <button
              type="button"
              onClick={() => {
                setCategory("");
                setPage(1);
              }}
              aria-pressed={!category}
              className={`vx-chip ${!category ? "is-active" : ""}`}
            >
              All products
            </button>
            {categories.map((c) => (
              <button
                type="button"
                key={c.id}
                onClick={() => {
                  setCategory(c.slug);
                  setPage(1);
                }}
                aria-pressed={category === c.slug}
                className={`vx-chip ${category === c.slug ? "is-active" : ""}`}
              >
                {c.name}
              </button>
            ))}
          </div>
          <div className="vx-catalogue-bar__controls">
            <span className="vx-muted vx-small vx-tabular">{loading ? "Searching…" : `${total.toLocaleString("en-IN")} products`}</span>
            <label className="vx-sort">
              <SlidersHorizontal size={14} aria-hidden="true" />
              <span className="sr-only">Sort products</span>
              <select
                value={sort}
                onChange={(e) => {
                  setSort(e.target.value);
                  setPage(1);
                }}
                className="vx-sort__select"
              >
                <option value="newest">Newest first</option>
                <option value="price-asc">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
                <option value="name-asc">Name: A to Z</option>
              </select>
            </label>
          </div>
        </div>

        <details className="vx-filters" open>
          <summary className="vx-filters__summary">
            <span>Price &amp; availability</span>
            <span className="vx-small vx-muted">{filtersUsed ? "Filters applied" : "Optional"}</span>
          </summary>
          <div className="vx-filters__body">
            <label className="vx-field">
              <span className="vx-label">Minimum price (₹)</span>
              <input
                inputMode="decimal"
                type="number"
                min="0"
                value={minPrice}
                onChange={(e) => {
                  setMinPrice(e.target.value);
                  setPage(1);
                }}
                className="vx-input"
                style={{ maxWidth: 160 }}
              />
            </label>
            <label className="vx-field">
              <span className="vx-label">Maximum price (₹)</span>
              <input
                inputMode="decimal"
                type="number"
                min="0"
                value={maxPrice}
                onChange={(e) => {
                  setMaxPrice(e.target.value);
                  setPage(1);
                }}
                className="vx-input"
                style={{ maxWidth: 160 }}
              />
            </label>
            <label className="vx-check" style={{ alignItems: "center", minHeight: 46 }}>
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => {
                  setInStockOnly(e.target.checked);
                  setPage(1);
                }}
              />
              In stock only
            </label>
            <button type="button" onClick={resetFilters} className="vx-btn vx-btn--quiet vx-btn--sm">
              Clear filters
            </button>
          </div>
        </details>

        {error ? (
          <div className="vx-alert vx-alert--danger" role="alert" style={{ marginTop: 18 }}>
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="vx-product-grid" style={{ marginTop: 24 }} aria-busy="true" aria-live="polite">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="vx-panel" style={{ overflow: "hidden" }}>
                <div className="vx-skeleton" style={{ aspectRatio: "1 / 1.02", borderRadius: 0 }} />
                <div style={{ padding: 16, display: "grid", gap: 8 }}>
                  <div className="vx-skeleton" style={{ height: 9, width: "45%" }} />
                  <div className="vx-skeleton" style={{ height: 13, width: "80%" }} />
                  <div className="vx-skeleton" style={{ height: 11, width: "60%" }} />
                </div>
              </div>
            ))}
            <p className="sr-only">Loading products…</p>
          </div>
        ) : products.length === 0 ? (
          <div style={{ marginTop: 28 }}>
            <EmptyState
              title="No products match these filters"
              text="Try a different search term, widen the price range, or clear the filters to see the whole collection."
              action={
                <button type="button" onClick={resetFilters} className="vx-btn vx-btn--sm">
                  Clear all filters
                </button>
              }
            />
          </div>
        ) : (
          <div className="vx-product-grid" style={{ marginTop: 24 }}>
            {products.map((p, index) => (
              <ShopProductCard
                key={p.id}
                product={p}
                priority={index < 4}
                saved={state.wishlist.includes(p.id)}
                onToggleWish={() => state.toggleWish(p.id)}
                onAdd={() => state.add(p.id, p.trackInventory === false ? 99 : p.stockQuantity, undefined)}
              />
            ))}
          </div>
        )}

        {!loading && pageCount > 1 ? (
          <nav aria-label="Product pages" className="vx-pagination">
            <button type="button" disabled={page <= 1} onClick={() => setPage((v) => Math.max(1, v - 1))} className="vx-btn vx-btn--sm">
              Previous
            </button>
            <span className="vx-small vx-muted vx-tabular">
              Page {page} of {pageCount}
            </span>
            <button type="button" disabled={page >= pageCount} onClick={() => setPage((v) => Math.min(pageCount, v + 1))} className="vx-btn vx-btn--sm">
              Next
            </button>
          </nav>
        ) : null}
      </div>
      <StoreContactFooter />
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* Cart                                                                        */
/* -------------------------------------------------------------------------- */

export function CartPageClient() {
  const state = useShopState();
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [cartSync, setCartSync] = useState<"waiting" | "syncing" | "synced" | "signin" | "error" | "empty">("waiting");
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncAttempt, setSyncAttempt] = useState(0);
  const syncQueue = useRef<Promise<void>>(Promise.resolve());
  const syncVersion = useRef(0);
  const cartIds = state.cart.map((line) => `${line.productId}:${line.variantId || ""}:${line.quantity}`).join(",");

  useEffect(() => {
    if (!state.ready) return;
    let active = true;
    const version = ++syncVersion.current;
    const snapshot = state.cart.map((line) => ({ ...line }));
    const isCurrent = () => active && version === syncVersion.current;
    setCartSync("syncing");
    setSyncError(null);
    syncQueue.current = syncQueue.current
      .catch(() => {})
      .then(async () => {
        let response: Response;
        try {
          response = await fetch("/api/customer/cart", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: snapshot }),
          });
        } catch {
          if (isCurrent()) {
            setSyncError("The request could not reach the server. Check the connection and try again.");
            setCartSync("error");
          }
          return;
        }
        if (!isCurrent()) return;
        if (response.status === 401) {
          // Guests cannot persist a cart. An empty cart is not a problem to
          // solve, a filled one is — so only that case asks them to sign in.
          setCartSync(snapshot.length === 0 ? "empty" : "signin");
          return;
        }
        if (!response.ok) {
          // The server explains why it refused (unavailable product, stock,
          // blocked origin). Keep that reason instead of hiding it.
          const data = await response.json().catch(() => null);
          const reason =
            typeof data?.error === "string" && data.error
              ? data.error
              : response.status >= 500
                ? `The cart service is temporarily unavailable (server error ${response.status}).`
                : `The request was refused (status ${response.status}).`;
          if (isCurrent()) {
            setSyncError(reason);
            setCartSync("error");
          }
          return;
        }
        if (isCurrent()) setCartSync(snapshot.length === 0 ? "empty" : "synced");
      })
      .catch(() => {
        if (isCurrent()) {
          setSyncError("The cart could not be synchronized.");
          setCartSync("error");
        }
      });
    return () => {
      active = false;
    };
  }, [state.ready, state.cart, cartIds, syncAttempt]);

  useEffect(() => {
    if (!state.ready) return;
    if (!cartIds) {
      setProducts([]);
      setProductsLoading(false);
      return;
    }
    let active = true;
    setProductsLoading(true);
    fetchProductsByIds(state.cart.map((line) => line.productId))
      .then((value) => {
        if (active) setProducts(value);
      })
      .catch(() => {
        if (active) setProducts([]);
      })
      .finally(() => {
        if (active) setProductsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [state.ready, state.cart, cartIds]);

  const lines = state.cart
    .map((line) => ({ line, product: products.find((p) => p.id === line.productId) }))
    .filter((x) => x.product)
    .map((x) => ({ ...x, variant: x.product!.variants?.find((v) => v.id === x.line.variantId) }));
  const subtotal = lines.reduce((n, x) => n + (x.variant?.pricePaise ?? x.product!.pricePaise) * x.line.quantity, 0);
  const itemCount = lines.reduce((n, x) => n + x.line.quantity, 0);
  const readyToCheckout = cartSync === "synced" && lines.length > 0;

  return (
    <main className="vx-store-page min-h-screen">
      <StorefrontHeader cartCount={state.ready ? itemCount : null} wishlistCount={state.ready ? state.wishlist.length : null} />
      <div className="vx-page">
        <Link href="/shop" className="vx-backlink">
          <ArrowLeft size={14} aria-hidden="true" /> Continue shopping
        </Link>
        <header className="vx-page-head" style={{ marginTop: 18 }}>
          <div>
            <p className="vx-kicker">Step 01 / Cart</p>
            <h1 className="vx-title">Your cart</h1>
            <p className="vx-lead">
              {state.ready && itemCount > 0
                ? `${itemCount} item${itemCount === 1 ? "" : "s"} reserved in this browser. Stock and pricing are confirmed again at checkout.`
                : "Review your selections before moving to delivery and payment."}
            </p>
          </div>
          <div className="vx-actions">
            <Badge tone={cartSync === "synced" ? "ok" : cartSync === "error" ? "danger" : cartSync === "signin" ? "warn" : "neutral"}>
              {cartSync === "synced"
                ? "Cart synced"
                : cartSync === "error"
                  ? "Sync failed"
                  : cartSync === "signin"
                    ? "Sign-in needed"
                    : cartSync === "empty"
                      ? "Cart empty"
                      : "Syncing"}
            </Badge>
          </div>
        </header>

        <div className="vx-cart-layout">
          <Panel flush>
            {!state.ready || productsLoading ? (
              <div style={{ padding: 22, display: "grid", gap: 14 }} aria-busy="true">
                {[0, 1].map((index) => (
                  <div key={index} className="vx-row" style={{ gap: 16 }}>
                    <div className="vx-skeleton" style={{ width: 88, height: 88 }} />
                    <div style={{ flex: 1, display: "grid", gap: 8 }}>
                      <div className="vx-skeleton" style={{ height: 14, width: "55%" }} />
                      <div className="vx-skeleton" style={{ height: 11, width: "30%" }} />
                      <div className="vx-skeleton" style={{ height: 30, width: 120 }} />
                    </div>
                  </div>
                ))}
                <p className="sr-only">Loading cart…</p>
              </div>
            ) : lines.length === 0 ? (
              <div style={{ padding: 22 }}>
                <EmptyState
                  title="Your cart is empty"
                  text="Browse the collection or start a custom print request — both appear in the same account."
                  action={
                    <div className="vx-actions" style={{ justifyContent: "center" }}>
                      <Link href="/shop" className="vx-btn vx-btn--primary vx-btn--sm">Browse products</Link>
                      <Link href="/custom-3d-printing" className="vx-btn vx-btn--sm">Request a custom print</Link>
                    </div>
                  }
                />
              </div>
            ) : (
              <ul className="vx-cart-list">
                {lines.map(({ line, product, variant }) => {
                  const maxStock = variant
                    ? variant.trackInventory
                      ? variant.stockQuantity
                      : 99
                    : product!.trackInventory === false
                      ? 99
                      : product!.stockQuantity;
                  const unit = variant?.pricePaise ?? product!.pricePaise;
                  return (
                    <li key={`${line.productId}:${line.variantId || "base"}`} className="vx-cart-item">
                      <div className="vx-cart-item__media">
                        {product!.images?.[0]?.url ? (
                          <Image src={product!.images[0].url} alt="" fill sizes="96px" className="object-cover" />
                        ) : (
                          <span aria-hidden="true">VXL</span>
                        )}
                      </div>
                      <div className="vx-cart-item__body">
                        <div className="vx-row vx-row--between" style={{ alignItems: "flex-start" }}>
                          <div style={{ minWidth: 0 }}>
                            <Link href={`/product/${product!.slug}`} className="vx-cart-item__name">
                              {product!.name}
                            </Link>
                            <p className="vx-small vx-muted" style={{ margin: "4px 0 0" }}>
                              {variant
                                ? `${variant.name}${Object.entries(variant.optionValues || {}).length ? ` · ${Object.entries(variant.optionValues).map(([k, v]) => `${k}: ${v}`).join(" · ")}` : ""}`
                                : "Standard finish"}
                            </p>
                            {maxStock <= 5 && maxStock > 0 ? (
                              <p className="vx-small" style={{ margin: "6px 0 0", color: "var(--vx-warn)" }}>
                                Only {maxStock} left in stock
                              </p>
                            ) : null}
                          </div>
                          <div className="vx-cart-item__price vx-tabular">{money(unit * line.quantity)}</div>
                        </div>
                        <div className="vx-row vx-row--between" style={{ marginTop: 12 }}>
                          <div className="vx-stepper">
                            <button
                              type="button"
                              aria-label={`Decrease quantity of ${product!.name}`}
                              onClick={() => state.qty(line.productId, line.variantId, line.quantity - 1)}
                              className="vx-stepper__btn"
                            >
                              <Minus size={13} aria-hidden="true" />
                            </button>
                            <span className="vx-stepper__value vx-tabular" aria-live="polite">{line.quantity}</span>
                            <button
                              type="button"
                              aria-label={`Increase quantity of ${product!.name}`}
                              onClick={() => state.qty(line.productId, line.variantId, line.quantity + 1, maxStock)}
                              disabled={line.quantity >= 99 || line.quantity >= maxStock}
                              className="vx-stepper__btn"
                            >
                              <Plus size={13} aria-hidden="true" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => state.qty(line.productId, line.variantId, 0)}
                            className="vx-btn vx-btn--quiet vx-btn--sm"
                            style={{ color: "var(--vx-danger)" }}
                          >
                            <Trash2 size={13} aria-hidden="true" /> Remove
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <aside className="vx-order-aside">
            <Panel title="Order summary" meta="Shipping and taxes are confirmed server-side at checkout.">
              <div className="vx-summary">
                <div className="vx-summary__row">
                  <span>Subtotal</span>
                  <b>{money(subtotal)}</b>
                </div>
                <div className="vx-summary__row">
                  <span>Shipping</span>
                  <span>Calculated at checkout</span>
                </div>
                <div className="vx-summary__row">
                  <span>Taxes</span>
                  <span>Confirmed at checkout</span>
                </div>
                <div className="vx-summary__row vx-summary__row--total">
                  <span>Estimated total</span>
                  <b>{money(subtotal)}</b>
                </div>
              </div>

              <div className="vx-summary__actions" id="cart-sync">
                {cartSync === "signin" ? (
                  <Link href="/account/login?next=/cart" className="vx-btn vx-btn--primary vx-btn--block">
                    Sign in to continue
                  </Link>
                ) : (
                  <Link
                    aria-disabled={!readyToCheckout}
                    href={readyToCheckout ? "/checkout" : "#cart-sync"}
                    onClick={(e) => {
                      if (!readyToCheckout) e.preventDefault();
                    }}
                    className={`vx-btn vx-btn--primary vx-btn--block${readyToCheckout ? "" : " is-disabled"}`}
                  >
                    {cartSync === "syncing" || cartSync === "waiting" ? "Preparing cart…" : "Continue to checkout"}
                  </Link>
                )}

                {cartSync === "error" ? (
                  <div className="vx-alert vx-alert--danger" role="alert">
                    <div className="vx-stack" style={{ gap: 8 }}>
                      <span>We couldn&apos;t sync your cart. {syncError}</span>
                      <span className="vx-small">Your cart is still saved in this browser — nothing was lost.</span>
                      <div className="vx-actions">
                        <button
                          type="button"
                          className="vx-btn vx-btn--sm"
                          onClick={() => setSyncAttempt((attempt) => attempt + 1)}
                        >
                          Try again
                        </button>
                        <Link href="/shop" className="vx-btn vx-btn--sm vx-btn--quiet">
                          Review the collection
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : null}

                {cartSync === "signin" ? (
                  <p className="vx-summary__note">Sign in first; your saved cart will sync when you return here.</p>
                ) : null}
                {cartSync === "synced" ? (
                  <p className="vx-summary__note">Cart synced to your account. Prices and stock are checked again at checkout.</p>
                ) : null}
              </div>

              <ul className="vx-trust-list">
                <li>Server-side signature verification for online payments</li>
                <li>Private storage for any custom print files</li>
                <li>Order status and invoices in your account</li>
              </ul>
            </Panel>
          </aside>
        </div>
      </div>
      <StoreContactFooter />
    </main>
  );
}

/* -------------------------------------------------------------------------- */
/* Wishlist                                                                    */
/* -------------------------------------------------------------------------- */

export function WishlistPageClient() {
  const state = useShopState();
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const wishlistIds = state.wishlist.join(",");

  useEffect(() => {
    if (!state.ready) return;
    if (!wishlistIds) {
      setProducts([]);
      setProductsLoading(false);
      return;
    }
    let active = true;
    setProductsLoading(true);
    fetchProductsByIds(state.wishlist)
      .then((value) => {
        if (active) setProducts(value);
      })
      .catch(() => {
        if (active) setProducts([]);
      })
      .finally(() => {
        if (active) setProductsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [state.ready, state.wishlist, wishlistIds]);

  const saved = products.filter((p) => state.wishlist.includes(p.id));
  const itemCount = state.cart.reduce((n, x) => n + x.quantity, 0);

  return (
    <main className="vx-store-page min-h-screen">
      <StorefrontHeader cartCount={state.ready ? itemCount : null} wishlistCount={state.ready ? state.wishlist.length : null} />
      <div className="vx-page">
        <Link href="/shop" className="vx-backlink">
          <ArrowLeft size={14} aria-hidden="true" /> Store
        </Link>
        <header className="vx-page-head" style={{ marginTop: 18 }}>
          <div>
            <p className="vx-kicker">Saved for later</p>
            <h1 className="vx-title">Your wishlist</h1>
            <p className="vx-lead">Saved pieces live in this browser. Add them to your cart when you are ready.</p>
          </div>
          <div className="vx-actions">
            <Link href="/shop" className="vx-btn vx-btn--sm">Keep browsing</Link>
          </div>
        </header>

        {productsLoading ? (
          <div className="vx-grid vx-grid--3">
            {[0, 1, 2].map((index) => (
              <div key={index} className="vx-skeleton" style={{ aspectRatio: "1 / 1.25" }} />
            ))}
          </div>
        ) : saved.length === 0 ? (
          <EmptyState
            title="No saved products yet"
            text="Tap the heart on any product to keep it here while you browse."
            action={<Link href="/shop" className="vx-btn vx-btn--primary vx-btn--sm">Explore the collection</Link>}
          />
        ) : (
          <div className="vx-wishlist-grid">
            {saved.map((p) => (
              <ShopProductCard
                key={p.id}
                product={p}
                saved
                onToggleWish={() => state.toggleWish(p.id)}
                onAdd={() => state.add(p.id, p.trackInventory === false ? 99 : p.stockQuantity, undefined)}
              />
            ))}
          </div>
        )}
      </div>
      <StoreContactFooter />
    </main>
  );
}
