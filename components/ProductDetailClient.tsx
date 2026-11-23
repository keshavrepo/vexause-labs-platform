"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Heart, ShoppingBag } from "lucide-react";
import type { ShopProduct } from "@/lib/shop-types";
import { useShopState } from "@/components/ShopClient";
import StorefrontHeader from "@/components/StorefrontHeader";
import { StoreContactFooter } from "@/components/StorefrontConfig";

const money=(p:number)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR"}).format(p/100);
export default function ProductDetailClient({slug}:{slug:string}) {
 const [product,setProduct]=useState<ShopProduct|null>(null);
 const [error,setError]=useState("");
 const [reviewData,setReviewData]=useState<{average:number|null,count:number}>({average:null,count:0});
 const [activeImage,setActiveImage]=useState(0);
 const [selectedVariantId,setSelectedVariantId]=useState("");
 const shop=useShopState();
 const [goToCart,setGoToCart]=useState(false);
 useEffect(()=>{if(goToCart)window.location.href="/cart";},[goToCart]);
 useEffect(()=>{let active=true;setProduct(null);setError("");setActiveImage(0);fetch(`/api/products/by-slug/${encodeURIComponent(slug)}`).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error||"Could not load product.");if(!active)return;setProduct(d.product||null);setSelectedVariantId(d.product?.variants?.[0]?.id||"");if(d.product)fetch(`/api/products/${d.product.id}/reviews`).then(r=>r.json()).then(d=>{if(active)setReviewData(d.summary||{average:null,count:0});}).catch(()=>{});}).catch(e=>{if(active)setError(e.message||"Could not load product.");});return()=>{active=false;};},[slug]);
 function add(){if(!product)return;if(hasVariants&&selectedVariant){shop.add(product.id,selectedVariant.trackInventory?selectedVariant.stockQuantity:99,selectedVariant.id);}else{shop.add(product.id,product.trackInventory===false?99:product.stockQuantity);}setGoToCart(true);}
 function wish(){if(product)shop.toggleWish(product.id);}
 if(error)return <main className="vxl-product-page min-h-screen"><StorefrontHeader/><div className="vxl-page-shell text-sm" role="alert">{error}</div><StoreContactFooter/></main>;
 if(!product)return <main className="vxl-product-page min-h-screen"><StorefrontHeader/><div className="vxl-page-shell text-sm" role="status">Loading product…</div><StoreContactFooter/></main>;
 const images=product.images||[];
 const selectedImage=images[activeImage]||images[0];
 const variants=product.variants||[];
 const selectedVariant=variants.find(variant=>variant.id===selectedVariantId)||variants[0];
 const hasVariants=variants.length>0;
 const tracked=hasVariants?!!selectedVariant?.trackInventory:product.trackInventory!==false;
 const available=hasVariants?!!selectedVariant?.available:(product.available??(!tracked||product.stockQuantity>0));
 const displayedPrice=hasVariants?(selectedVariant?.pricePaise??product.pricePaise):product.pricePaise;
 const comparePrice=hasVariants?(selectedVariant?.compareAtPaise??null):product.compareAtPaise;
 const hasDiscount=typeof comparePrice==="number"&&comparePrice>displayedPrice;
 const discount=hasDiscount?Math.round((1-displayedPrice/comparePrice!)*100):0;
 return <main className="vxl-product-page min-h-screen"><StorefrontHeader/>
  <div className="vxl-page-shell">
   <Link href="/shop" className="inline-flex min-h-10 items-center gap-2 text-xs font-bold text-[#668071]"><ArrowLeft size={14}/> Back to store</Link>
   <div className="mt-5 grid gap-7 md:grid-cols-[1.05fr_.95fr] md:gap-10">
    <section aria-label="Product images" className="min-w-0">
     <div className="vxl-product-gallery relative aspect-square">
      {selectedImage?<Image key={selectedImage.id} src={selectedImage.url} alt={selectedImage.altText||product.name} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-contain" fetchPriority="high"/>:<div className="flex h-full items-center justify-center text-xs font-bold tracking-[.18em] text-[#9AA89D]">VEXAUSE / PRODUCT</div>}
      {hasDiscount&&<span className="absolute left-3 top-3 bg-[#173D32] px-3 py-2 text-[10px] font-bold text-white">{discount}% OFF</span>}
     </div>
     {images.length>1&&<div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-6" aria-label="Choose product image">{images.map((image,index)=><button key={image.id} type="button" onClick={()=>setActiveImage(index)} aria-label={`View image ${index+1} of ${images.length}`} aria-pressed={activeImage===index} className={`relative aspect-square overflow-hidden rounded-xl border bg-white transition ${activeImage===index?"border-2 border-[#173D32] shadow":"border-[#DCE4DC]"}`}><Image src={image.url} alt="" fill sizes="96px" className="object-cover transition-transform duration-300 hover:scale-105"/></button>)}</div>}
    </section>
    <section className="vxl-product-info min-w-0">
     <p className="text-[10px] font-bold uppercase tracking-widest text-[#789681]">{product.category?.name||"VEXAUSE LABS"}</p>
     <h1 className="mt-3 text-2xl font-bold leading-tight text-[#173D32] sm:text-3xl">{product.name}</h1>
     {(hasVariants?selectedVariant?.sku:product.sku)&&<p className="mt-2 text-[10px] font-semibold tracking-wider text-[#87938A]">SKU: {hasVariants?selectedVariant?.sku:product.sku}</p>}
     <div className="mt-5 flex flex-wrap items-baseline gap-3"><p className="text-2xl font-bold text-[#173D32]">{money(displayedPrice)}</p>{hasDiscount&&<><p className="text-sm text-[#8B968F] line-through">{money(comparePrice!)}</p><span className="text-xs font-bold text-[#426B52]">Save {money(comparePrice!-displayedPrice)}</span></>}</div>
     <p className="mt-3 text-xs text-[#668071]">{reviewData.count?`${reviewData.average?.toFixed(1)} / 5 ★ · ${reviewData.count} approved review${reviewData.count===1?"":"s"}`:"No approved reviews yet"}</p>
     {product.shortDescription&&<p className="mt-5 text-sm font-semibold leading-6 text-[#45594D]">{product.shortDescription}</p>}
     {hasVariants&&<div className="mt-5"><label htmlFor="product-variant" className="text-xs font-bold text-[#45594D]">Choose an option</label><select id="product-variant" value={selectedVariant?.id||""} onChange={e=>setSelectedVariantId(e.target.value)} className="mt-2 min-h-11 w-full border border-[#DCE4DC] bg-white px-3 text-sm">{variants.map(variant=><option key={variant.id} value={variant.id}>{variant.name} · {money(variant.pricePaise)}{variant.available?"":" · Unavailable"}</option>)}</select><div className="mt-2 flex flex-wrap gap-2">{selectedVariant&&Object.entries(selectedVariant.optionValues||{}).map(([key,value])=><span key={key} className="border border-[#E0E7E0] px-2 py-1 text-[10px] text-[#66776C]">{key}: {value}</span>)}</div></div>}
     <div className="mt-5 border-y border-[#E7ECE7] py-4"><p className={`text-xs font-bold ${available?"text-[#426B52]":"text-[#9A4D42]"}`}>{available?(tracked?`In stock · ${hasVariants?selectedVariant?.stockQuantity:product.stockQuantity} available`:"Available to order"):"Currently unavailable"}</p><p className="mt-2 text-[11px] leading-5 text-[#7B887F]">Final availability and delivery options are confirmed during checkout.</p></div>
     <div className="mt-5 flex gap-3"><button disabled={!available} onClick={add} className="flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-[#173D32] px-4 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"><ShoppingBag size={16}/> Add to cart</button><button type="button" onClick={wish} aria-label={shop.wishlist.includes(product.id)?"Remove from wishlist":"Save to wishlist"} aria-pressed={shop.wishlist.includes(product.id)} className="min-h-12 min-w-12 rounded-full border border-[#DCE4DC] text-[#173D32]"><Heart size={18} fill={shop.wishlist.includes(product.id)?"currentColor":"none"}/></button></div>
     <p className="mt-5 text-[10px] leading-5 text-[#87938A]">{hasVariants?"Your selected option, price and availability will be checked again at checkout.":"Shipping and final availability are confirmed at checkout."} Custom requirements can be submitted separately for a quotation.</p>
     <Link href="/custom-3d-printing" className="mt-3 inline-block text-xs font-bold text-[#426B52] underline underline-offset-4">Need a custom 3D print?</Link>
    </section>
   </div>
   <section className="vxl-details-panel"><h2 className="text-lg font-bold text-[#173D32]">Product details</h2><div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-[#68776E]">{product.description||product.shortDescription||"Product details will be confirmed by the store."}</div><p className="mt-6 border-t border-[#E7ECE7] pt-4 text-xs text-[#668071]">Purchased this product? After delivery, submit a review from <Link href="/account/reviews" className="font-bold underline">My product reviews</Link>.</p></section>
  </div>
 <StoreContactFooter/></main>;
}
