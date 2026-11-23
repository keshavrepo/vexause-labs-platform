"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ShopProduct } from "@/lib/shop-types";
import Reveal from "@/components/Reveal";

type Category = { id: string; name: string; slug: string };

const money = (paise: number) => new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", maximumFractionDigits: 0,
}).format(paise / 100);

const LAYOUT = ["lead", "tall", "tall", "wide"] as const;

function ProductMedia({ product, priority }: { product: ShopProduct; priority: boolean }) {
  const image = product.images?.[0];
  if (image?.url) {
    return (
      <Image
        src={image.url}
        alt={image.altText || product.name}
        fill
        priority={priority}
        sizes="(min-width: 1100px) 42vw, (min-width: 720px) 30vw, 92vw"
        className="vx-feature-card__img"
      />
    );
  }
  return (
    <div className="vx-feature-card__placeholder" aria-hidden="true">
      <span>{product.name.slice(0, 2).toUpperCase()}</span>
    </div>
  );
}

export default function HomeCatalogSections() {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/products?limit=4&sort=newest", { signal: controller.signal })
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Catalogue unavailable");
        setProducts(Array.isArray(data.products) ? data.products : []);
        setCategories(Array.isArray(data.categories) ? data.categories : []);
      })
      .catch((error) => {
        if (error instanceof Error && error.name !== "AbortError") setUnavailable(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  return (
    <section id="collection" className="vx-section vx-section--soft" aria-labelledby="vx-collection-title">
      <div className="vx-shell">
        <Reveal className="vx-head">
          <div>
            <p className="vx-kicker">The catalogue</p>
            <h2 id="vx-collection-title">
              Small-batch forms,
              <br />
              <em>made to be kept.</em>
            </h2>
          </div>
          <div className="vx-head__aside">
            <p>
              Original 3D-printed objects, produced in the studio and listed with live stock. Prices are recalculated on
              the server when you check out.
            </p>
            {categories.length > 0 ? (
              <div className="vx-chip-row" aria-label="Product categories">
                {categories.slice(0, 6).map((category) => (
                  <Link className="vx-chip vx-chip--link" key={category.id} href={`/shop?category=${encodeURIComponent(category.slug)}`}>
                    {category.name}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        </Reveal>

        <div className="vx-feature-head">
          <p>From the current collection</p>
          <Link href="/shop" className="vx-link-arrow">
            All products <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </div>

        {loading ? (
          <div className="vx-feature-grid" aria-label="Loading featured products" aria-busy="true">
            {LAYOUT.map((shape, index) => (
              <div key={index} className={`vx-feature-card vx-feature-card--${shape} vx-feature-card--loading`}>
                <div className="vx-feature-card__media vx-skeleton" />
                <div className="vx-feature-card__body">
                  <div className="vx-skeleton" style={{ height: 9, width: "38%" }} />
                  <div className="vx-skeleton" style={{ height: 18, width: "72%", marginTop: 12 }} />
                </div>
              </div>
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="vx-feature-grid">
            {products.slice(0, 4).map((product, index) => {
              const shape = LAYOUT[index] ?? "tall";
              const showCopy = shape === "lead" || shape === "wide";
              return (
                <Reveal key={product.id} className={`vx-feature-card vx-feature-card--${shape}`} delay={index * 90} as="article">
                  <Link href={`/product/${product.slug}`} className="vx-feature-card__link" aria-label={`View ${product.name}`}>
                    <div className="vx-feature-card__media">
                      <ProductMedia product={product} priority={index === 0} />
                      <span className="vx-feature-card__arrow" aria-hidden="true">
                        <ArrowUpRight size={16} />
                      </span>
                    </div>
                    <div className="vx-feature-card__body">
                      <p className="vx-feature-card__kicker">{product.category?.name || "VEXAUSE LABS"}</p>
                      <h3 className="vx-feature-card__name">{product.name}</h3>
                      {showCopy && product.shortDescription ? (
                        <p className="vx-feature-card__copy">{product.shortDescription}</p>
                      ) : null}
                      <div className="vx-feature-card__meta">
                        <span>{money(product.pricePaise)}</span>
                        {product.compareAtPaise && product.compareAtPaise > product.pricePaise ? (
                          <s>{money(product.compareAtPaise)}</s>
                        ) : null}
                        <span className="vx-feature-card__stock">
                          {product.available === false ? "Unavailable" : product.hasVariants ? "Options" : "In studio"}
                        </span>
                      </div>
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        ) : (
          <div className="vx-feature-empty">
            <p className="vx-feature-empty__title">
              {unavailable ? "The collection is unavailable right now." : "No products are listed yet."}
            </p>
            <p className="vx-small vx-muted">
              {unavailable
                ? "The catalogue could not be loaded. The store may still be reachable directly."
                : "New pieces appear here as soon as they are published in the studio."}
            </p>
            <Link href="/shop" className="vx-btn vx-btn--sm">
              Browse the store <ArrowUpRight size={15} aria-hidden="true" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
