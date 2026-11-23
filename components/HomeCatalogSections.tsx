"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import type { ShopProduct } from "@/lib/shop-types";
import Reveal from "@/components/Reveal";

type Category = { id: string; name: string; slug: string };

const money = (paise: number) => new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", maximumFractionDigits: 2,
}).format(paise / 100);

export default function HomeCatalogSections() {
  const [products, setProducts] = useState<ShopProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/products?limit=4&sort=newest", { signal: controller.signal })
      .then(async response => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || "Catalogue unavailable");
        setProducts(Array.isArray(data.products) ? data.products : []);
        setCategories(Array.isArray(data.categories) ? data.categories : []);
      })
      .catch(error => {
        if (error instanceof Error && error.name !== "AbortError") setUnavailable(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  return <>
    <section id="collection" className="vxl-home-section vxl-home-section--soft" aria-labelledby="vxl-categories-title">
      <div className="vxl-section-shell">
        <Reveal>
          <div className="vxl-section-heading">
            <div>
              <p className="eyebrow">Explore the catalogue</p>
              <h2 id="vxl-categories-title">Small-batch forms.<br/>Made to be kept.</h2>
            </div>
            <p>Browse the products and categories currently available from VEXAUSE LABS.</p>
          </div>
          {categories.length > 0 && <div className="vxl-category-list" aria-label="Product categories">
            {categories.map(category => <Link className="vxl-category-pill" key={category.id} href={`/shop?category=${encodeURIComponent(category.slug)}`}>{category.name}</Link>)}
          </div>}
        </Reveal>
      </div>
    </section>

    <section className="vxl-home-section" aria-labelledby="vxl-featured-title">
      <div className="vxl-section-shell">
        <Reveal>
          <div className="vxl-section-heading">
            <div>
              <p className="eyebrow">From the current collection</p>
              <h2 id="vxl-featured-title">Featured creations.</h2>
            </div>
            <Link href="/shop" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold text-[#173D32]">Explore the store <ArrowUpRight size={16}/></Link>
          </div>
        </Reveal>
        {loading ? <div className="vxl-featured-grid" aria-label="Loading featured products">
          {Array.from({ length: 4 }, (_, index) => <div key={index} className="vxl-product-card" aria-hidden="true"><div className="vxl-product-card__image animate-pulse bg-[#e8ede5]"/><div className="p-5"><div className="h-3 w-1/3 animate-pulse rounded-full bg-[#e6ebe4]"/><div className="mt-4 h-4 w-3/4 animate-pulse rounded-full bg-[#e6ebe4]"/></div></div>)}
        </div> : products.length > 0 ? <div className="vxl-featured-grid vxl-grid-stagger">
          {products.map(product => <Reveal key={product.id}>
            <article className="vxl-product-card">
              <Link href={`/product/${product.slug}`} className="block" aria-label={`View ${product.name}`}>
                <div className="vxl-product-card__image">
                  {product.images?.[0]?.url
                    ? <Image src={product.images[0].url} alt={product.images[0].altText || product.name} fill sizes="(min-width: 1100px) 25vw, (min-width: 640px) 50vw, 50vw" className="object-cover"/>
                    : <div className="vxl-product-placeholder" aria-hidden="true"><span>VXL</span></div>}
                </div>
                <div className="vxl-product-card__body">
                  <p className="!mt-0 text-[10px] font-bold uppercase tracking-[.16em]">{product.category?.name || "VEXAUSE LABS"}</p>
                  <h3>{product.name}</h3>
                  <p>{product.shortDescription}</p>
                  <div className="vxl-product-card__meta"><span>{money(product.pricePaise)}</span><ArrowRight size={16}/></div>
                </div>
              </Link>
            </article>
          </Reveal>)}
        </div> : <div className="vxl-collection-state">
          <p className="font-semibold text-[#173D32]">{unavailable ? "The collection is unavailable right now." : "No products are available to feature yet."}</p>
          <p className="mt-2 text-sm">Visit the store to browse the current catalogue.</p>
          <Link className="mt-4 inline-flex min-h-10 items-center gap-2 font-bold text-[#173D32]" href="/shop">Browse the store <ArrowUpRight size={15}/></Link>
        </div>}
      </div>
    </section>
  </>;
}
