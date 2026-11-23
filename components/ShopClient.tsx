"use client";
import { StoreContactFooter } from "@/components/StorefrontConfig";
import StorefrontHeader from "@/components/StorefrontHeader";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingBag, Search, Trash2, Minus, Plus, ArrowLeft } from "lucide-react";
import type { CartLine, ShopProduct } from "@/lib/shop-types";

const CART_KEY = "vexause_cart_v1";
const WISH_KEY = "vexause_wishlist_v1";
const money = (paise:number) => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:2}).format(paise/100);

async function fetchProductsByIds(ids:string[]):Promise<ShopProduct[]> {
  const unique=Array.from(new Set(ids));
  const batches=Array.from({length:Math.ceil(unique.length/48)},(_,i)=>unique.slice(i*48,(i+1)*48));
  const results=await Promise.all(batches.map(async batch=>{
    const params=new URLSearchParams({ids:batch.join(","),limit:"48"});
    const response=await fetch(`/api/products?${params}`);
    const data=await response.json();
    if(!response.ok)throw new Error(data.error||"Could not load saved products.");
    return (data.products||[]) as ShopProduct[];
  }));
  return results.flat();
}

export function useShopState() {
  const [cart,setCart] = useState<CartLine[]>([]);
  const [wishlist,setWishlist] = useState<string[]>([]);
  const [ready,setReady] = useState(false);
  useEffect(() => {
    const read = () => {
      try {
        const c=JSON.parse(localStorage.getItem(CART_KEY)||"[]");
        const w=JSON.parse(localStorage.getItem(WISH_KEY)||"[]");
        if(Array.isArray(c)) setCart(c.filter(x=>x && typeof x.productId==="string" && (x.variantId==null||typeof x.variantId==="string") && Number.isInteger(x.quantity) && x.quantity>0).map(x=>({...x,variantId:x.variantId||null,quantity:Math.min(99,x.quantity)})));
        if(Array.isArray(w)) setWishlist(Array.from(new Set(w.filter(x=>typeof x==="string"))));
      } catch { setCart([]); setWishlist([]); }
    };
    read();
    const onStorage=(event:StorageEvent)=>{if(event.key===CART_KEY||event.key===WISH_KEY||event.key===null)read();};
    window.addEventListener("storage",onStorage);
    setReady(true);
    return ()=>window.removeEventListener("storage",onStorage);
  },[]);
  useEffect(()=>{if(ready){try{localStorage.setItem(CART_KEY,JSON.stringify(cart));}catch{/* Browser storage may be unavailable or full. */}}},[cart,ready]);
  useEffect(()=>{if(ready){try{localStorage.setItem(WISH_KEY,JSON.stringify(wishlist));}catch{/* Browser storage may be unavailable or full. */}}},[wishlist,ready]);
  function add(id:string,max=99,variantId?:string) { setCart(old=>{const found=old.find(x=>x.productId===id&&(x.variantId||null)===(variantId||null));return found?old.map(x=>x.productId===id&&(x.variantId||null)===(variantId||null)?{...x,quantity:Math.min(99,Math.max(1,max),x.quantity+1)}:x):[...old,{productId:id,variantId:variantId||null,quantity:1}]}); }
  function qty(id:string,variantId:string|null|undefined,n:number,max=99) { setCart(old=>n<=0?old.filter(x=>!(x.productId===id&&(x.variantId||null)===(variantId||null))):old.map(x=>x.productId===id&&(x.variantId||null)===(variantId||null)?{...x,quantity:Math.min(99,Math.max(1,max),n)}:x)); }
  function toggleWish(id:string) { setWishlist(old=>old.includes(id)?old.filter(x=>x!==id):[...old,id]); }
  return {cart,wishlist,add,qty,toggleWish,ready};
}

export function ShopPageClient() {
  const [products,setProducts]=useState<ShopProduct[]>([]);
  const [categories,setCategories]=useState<{id:string,name:string,slug:string}[]>([]);
  const [search,setSearch]=useState("");
  const [category,setCategory]=useState("");
  const [sort,setSort]=useState("newest");
  const [minPrice,setMinPrice]=useState("");
  const [maxPrice,setMaxPrice]=useState("");
  const [inStockOnly,setInStockOnly]=useState(false);
  const [page,setPage]=useState(1);
  const [pageCount,setPageCount]=useState(0);
  const [total,setTotal]=useState(0);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const state=useShopState();
  useEffect(()=>{
    const initialCategory=new URLSearchParams(window.location.search).get("category");
    if(initialCategory)setCategory(initialCategory);
  },[]);
  useEffect(()=>{
    let active=true;
    const controller=new AbortController();
    const timer=window.setTimeout(async()=>{
      setLoading(true);setError("");
      try{
        const params=new URLSearchParams({page:String(page),limit:"12",sort});
        if(search.trim())params.set("q",search.trim());
        if(category)params.set("category",category);
        if(minPrice.trim())params.set("minPrice",String(Math.round(Number(minPrice)*100)));
        if(maxPrice.trim())params.set("maxPrice",String(Math.round(Number(maxPrice)*100)));
        if(inStockOnly)params.set("inStock","true");
        const response=await fetch(`/api/products?${params.toString()}`,{signal:controller.signal});
        const data=await response.json();
        if(!response.ok)throw new Error(data.error||"Catalogue unavailable");
        if(active){
          setProducts(data.products);
          setCategories(data.categories||[]);
          setTotal(data.pagination?.total||0);
          setPageCount(data.pagination?.pageCount||0);
        }
      }catch(e:any){if(active&&e.name!=="AbortError")setError(e.message||"Could not load products.");}
      finally{if(active)setLoading(false);}
    },250);
    return ()=>{active=false;window.clearTimeout(timer);controller.abort();};
  },[search,category,sort,minPrice,maxPrice,page,inStockOnly]);
  function resetFilters(){setSearch("");setCategory("");setSort("newest");setMinPrice("");setMaxPrice("");setInStockOnly(false);setPage(1);}
  const count=state.cart.reduce((n,x)=>n+x.quantity,0);
  return <main className="vxl-store-page min-h-screen text-[#0B0F0E]">
    <StorefrontHeader cartCount={state.ready?count:null} wishlistCount={state.ready?state.wishlist.length:null}/>
    <div className="vxl-page-shell">
      <div className="vxl-page-heading"><div><p className="eyebrow">VEXAUSE LABS / STORE</p><h1>Explore the collection</h1><p>Thoughtfully made 3D-printed products.</p></div>
        <div className="relative"><Search size={16} className="absolute left-3 top-3 text-[#849187]"/><input value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}} placeholder="Search products, SKU or details" aria-label="Search products" className="h-11 w-full border border-[#DCE4DC] bg-white pl-10 pr-3 text-sm outline-none focus:border-[#648A70] sm:w-80"/></div></div>
      <div className="vxl-filter-panel grid gap-4 md:grid-cols-[1fr_220px]">
        <div className="flex flex-wrap items-center gap-2"><button onClick={()=>{setCategory("");setPage(1)}} className={`vxl-filter-chip ${!category?"is-active":""}`}>All categories</button>{categories.map(c=><button key={c.id} onClick={()=>{setCategory(c.slug);setPage(1)}} className={`vxl-filter-chip ${category===c.slug?"is-active":""}`}>{c.name}</button>)}</div>
        <select value={sort} onChange={e=>{setSort(e.target.value);setPage(1)}} aria-label="Sort products" className="h-10 border border-[#DCE4DC] bg-white px-3 text-xs"><option value="newest">Newest first</option><option value="price-asc">Price: Low to high</option><option value="price-desc">Price: High to low</option><option value="name-asc">Name: A to Z</option></select>
      </div>
      <div className="mt-5 flex flex-wrap items-end gap-3 border-b border-[#E3E9E3] pb-5">
        <label className="text-[10px] font-bold uppercase tracking-wider text-[#718078]">Min price (₹)<input inputMode="decimal" type="number" min="0" value={minPrice} onChange={e=>{setMinPrice(e.target.value);setPage(1)}} className="mt-1 block h-10 w-28 border border-[#DCE4DC] bg-white px-3 text-sm"/></label>
        <label className="text-[10px] font-bold uppercase tracking-wider text-[#718078]">Max price (₹)<input inputMode="decimal" type="number" min="0" value={maxPrice} onChange={e=>{setMaxPrice(e.target.value);setPage(1)}} className="mt-1 block h-10 w-28 border border-[#DCE4DC] bg-white px-3 text-sm"/></label>
        <label className="flex h-10 items-center gap-2 px-2 text-xs font-semibold text-[#52675A]"><input type="checkbox" checked={inStockOnly} onChange={e=>{setInStockOnly(e.target.checked);setPage(1)}}/> In stock only</label>
        <button onClick={resetFilters} className="h-10 px-3 text-xs font-bold text-[#52675A] underline">Clear filters</button>
        <p className="ml-auto text-xs text-[#718078]">{total.toLocaleString("en-IN")} matching products</p>
      </div>
      {error&&<p className="mt-6 border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
      {loading?<p className="py-20 text-center text-sm text-[#78877D]">Loading products…</p>:products.length===0?<div className="py-20 text-center"><p className="font-semibold text-[#173D32]">No products match these filters</p><p className="mt-2 text-sm text-[#7A887F]">Try a different search or clear the filters.</p><button onClick={resetFilters} className="mt-4 text-xs font-bold text-[#315D49] underline">Clear all filters</button></div>:
      <div className="vxl-product-grid mt-7">{products.map(p=><article key={p.id} className="vxl-product-card vxl-shop-card">
        <div className="vxl-product-card__image">{p.images?.[0]?.url?<Image src={p.images[0].url} alt={p.images[0].altText} fill sizes="(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover"/>:<div className="vxl-product-placeholder" aria-hidden="true"><span>VXL</span></div>}
          <button onClick={()=>state.toggleWish(p.id)} aria-label="Toggle wishlist" className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#173D32] shadow"><Heart size={17} fill={state.wishlist.includes(p.id)?"currentColor":"none"}/></button>
        </div>
        <div className="vxl-product-card__body"><p className="!mt-0 text-[9px] font-bold uppercase tracking-[.16em] text-[#789681]">{p.category?.name||"VEXAUSE LABS"}</p><h2 className="mt-2 font-bold text-[#173D32]">{p.name}</h2><p className="mt-1 min-h-10 text-xs leading-5 text-[#758279]">{p.shortDescription}</p><p className="mt-3 text-base font-bold text-[#173D32]">{money(p.pricePaise)}</p><p className="mt-1 text-[10px] text-[#718078]">{p.available?"Available":"Out of stock"}{p.reviewCount?` · ${p.reviewCount} reviews`:""}</p>
          <div className="mt-4 grid grid-cols-2 gap-2"><button onClick={()=>{if(!p.hasVariants)state.add(p.id)}} disabled={!p.available||!!p.hasVariants} className="h-10 bg-[#173D32] text-[10px] font-bold text-white disabled:cursor-not-allowed disabled:bg-[#AAB5AC]">{!p.available?"Out of stock":p.hasVariants?"Choose options":"Add to cart"}</button><Link href={`/product/${p.slug}`} className="flex h-10 items-center justify-center border border-[#D6E0D7] text-[10px] font-bold text-[#355544]">{p.hasVariants?"View options":"View details"}</Link></div>
        </div>
      </article>)}</div>}
      {!loading&&pageCount>1&&<nav aria-label="Product pages" className="mt-9 flex flex-wrap items-center justify-center gap-2"><button disabled={page<=1} onClick={()=>setPage(v=>Math.max(1,v-1))} className="border bg-white px-4 py-2 text-xs font-bold disabled:opacity-40">Previous</button><span className="px-3 text-xs text-[#52675A]">Page {page} of {pageCount}</span><button disabled={page>=pageCount} onClick={()=>setPage(v=>Math.min(pageCount,v+1))} className="border bg-white px-4 py-2 text-xs font-bold disabled:opacity-40">Next</button></nav>}
      </div>
  <StoreContactFooter/></main>;
}

export function CartPageClient() {
  const state=useShopState();
  const [products,setProducts]=useState<ShopProduct[]>([]);
  const [productsLoading,setProductsLoading]=useState(true);
  const [cartSync,setCartSync]=useState<"waiting"|"syncing"|"synced"|"signin"|"error">("waiting");
  const syncQueue=useRef<Promise<void>>(Promise.resolve());
  const syncVersion=useRef(0);
  const cartIds=state.cart.map(line=>`${line.productId}:${line.variantId||""}:${line.quantity}`).join(",");
  useEffect(()=>{
    if(!state.ready)return;
    let active=true;
    const version=++syncVersion.current;
    const snapshot=state.cart.map(line=>({...line}));
    setCartSync("syncing");
    syncQueue.current=syncQueue.current.catch(()=>{}).then(async()=>{
      const response=await fetch("/api/customer/cart",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({items:snapshot})});
      if(!active)return;
      if(response.status===401){if(version===syncVersion.current)setCartSync("signin");return;}
      if(!response.ok){const data=await response.json().catch(()=>({}));throw new Error(data.error||"Cart could not be synchronized.");}
      if(version===syncVersion.current)setCartSync("synced");
    }).catch(()=>{if(active&&version===syncVersion.current)setCartSync("error");});
    return()=>{active=false;};
  },[state.ready,state.cart,cartIds]);
  useEffect(()=>{if(!state.ready)return; if(!cartIds){setProducts([]);setProductsLoading(false);return;}let active=true;setProductsLoading(true);fetchProductsByIds(state.cart.map(line=>line.productId)).then(value=>{if(active)setProducts(value);}).catch(()=>{if(active)setProducts([]);}).finally(()=>{if(active)setProductsLoading(false);});return()=>{active=false;};},[state.ready,state.cart,cartIds]);
  const lines=state.cart.map(line=>({line,product:products.find(p=>p.id===line.productId)})).filter(x=>x.product).map(x=>({...x,variant:x.product!.variants?.find(v=>v.id===x.line.variantId)}));
  const subtotal=lines.reduce((n,x)=>n+(x.variant?.pricePaise??x.product!.pricePaise)*x.line.quantity,0);
  return <main className="vxl-store-page min-h-screen"><StorefrontHeader/><div className="vxl-page-shell">
    <Link href="/shop" className="inline-flex items-center gap-2 text-xs font-bold text-[#668071]"><ArrowLeft size={14}/> Continue shopping</Link>
    <h1 className="mt-5 text-3xl font-bold text-[#173D32]">Your shopping cart</h1>
    <div className="vxl-cart-layout mt-7">
      <section className="vxl-cart-items">{!state.ready||productsLoading?<p className="p-8 text-sm">Loading cart…</p>:lines.length===0?<div className="p-12 text-center"><ShoppingBag className="mx-auto text-[#8AA494]"/><p className="mt-3 font-bold text-[#173D32]">Your cart is empty</p><Link href="/shop" className="mt-4 inline-block bg-[#173D32] px-5 py-3 text-xs font-bold text-white">Browse products</Link></div>:lines.map(({line,product,variant})=><div key={`${line.productId}:${line.variantId||"base"}`} className="vxl-cart-line">
        <div className="vxl-cart-line__image relative h-24 w-24 shrink-0 bg-[#EDF1EC]">{product!.images?.[0]?.url&&<Image src={product!.images[0].url} alt="" fill sizes="96px" className="object-cover"/>}</div>
        <div className="min-w-0 flex-1"><p className="font-bold text-[#173D32]">{product!.name}</p>{variant&&<p className="mt-1 text-xs text-[#718078]">{variant.name} · {Object.entries(variant.optionValues||{}).map(([k,v])=>`${k}: ${v}`).join(" · ")}</p>}<p className="mt-1 text-sm font-semibold">{money(variant?.pricePaise??product!.pricePaise)}</p><div className="mt-3 flex items-center gap-3"><button aria-label={`Decrease quantity of ${product!.name}`} onClick={()=>state.qty(line.productId,line.variantId,line.quantity-1)} className="min-h-9 min-w-9 border px-2 py-1"><Minus size={13}/></button><span className="text-xs">{line.quantity}</span><button aria-label={`Increase quantity of ${product!.name}`} onClick={()=>state.qty(line.productId,line.variantId,line.quantity+1,variant?(variant.trackInventory?variant.stockQuantity:99):(product!.trackInventory===false?99:product!.stockQuantity))} disabled={line.quantity>=99||(variant?(variant.trackInventory&&line.quantity>=variant.stockQuantity):(product!.trackInventory!==false&&line.quantity>=product!.stockQuantity))} className="min-h-9 min-w-9 border px-2 py-1 disabled:opacity-40"><Plus size={13}/></button><button onClick={()=>state.qty(line.productId,line.variantId,0)} className="ml-2 text-xs text-red-700"><Trash2 size={14}/></button></div></div>
        <p className="font-bold text-[#173D32]">{money((variant?.pricePaise??product!.pricePaise)*line.quantity)}</p>
      </div>)}</section>
      <aside className="vxl-order-summary"><h2 className="font-bold text-[#173D32]">Order summary</h2><div className="mt-5 flex justify-between text-sm"><span className="text-[#718078]">Subtotal</span><b>{money(subtotal)}</b></div><p className="mt-3 text-[11px] leading-5 text-[#839087]">Shipping and any applicable taxes will be calculated at checkout.</p><div className="mt-5 border-t pt-4"><div className="flex justify-between font-bold text-[#173D32]"><span>Subtotal</span><span>{money(subtotal)}</span></div>{cartSync==="signin"?<Link href="/account/login?next=/cart" className="mt-5 flex h-12 w-full items-center justify-center bg-[#173D32] text-xs font-bold text-white">Sign in to continue</Link>:<Link aria-disabled={cartSync!=="synced"||lines.length===0} href={cartSync==="synced"&&lines.length>0?"/checkout":"#cart-sync"} onClick={e=>{if(cartSync!=="synced"||lines.length===0)e.preventDefault()}} className={`mt-5 flex h-12 w-full items-center justify-center text-xs font-bold text-white ${cartSync==="synced"&&lines.length>0?"bg-[#173D32]":"cursor-not-allowed bg-[#8A9B90]"}`}>{cartSync==="syncing"||cartSync==="waiting"?"Preparing cart…":cartSync==="error"?"Cart sync failed":"Continue to checkout"}</Link>}
      {cartSync==="error"&&<p role="alert" className="mt-2 text-xs text-red-700">We couldn&apos;t sync your cart. Refresh this page and try again.</p>}
      {cartSync==="signin"&&<p className="mt-2 text-xs text-[#718078]">Sign in first; your saved cart will sync when you return here.</p>}<p className="mt-3 text-center text-[10px] text-[#8A968D]">Payment options depend on admin configuration.</p></div></aside>
    </div>
  </div><StoreContactFooter/></main>;
}

export function WishlistPageClient() {
  const state=useShopState();
  const [products,setProducts]=useState<ShopProduct[]>([]);
  const [productsLoading,setProductsLoading]=useState(true);
  const wishlistIds=state.wishlist.join(",");
  useEffect(()=>{if(!state.ready)return; if(!wishlistIds){setProducts([]);setProductsLoading(false);return;}let active=true;setProductsLoading(true);fetchProductsByIds(state.wishlist).then(value=>{if(active)setProducts(value);}).catch(()=>{if(active)setProducts([]);}).finally(()=>{if(active)setProductsLoading(false);});return()=>{active=false;};},[state.ready,state.wishlist,wishlistIds]);
  const saved=products.filter(p=>state.wishlist.includes(p.id));
  return <main className="vxl-store-page min-h-screen"><StorefrontHeader/><div className="vxl-page-shell"><Link href="/shop" className="inline-flex items-center gap-2 text-xs font-bold text-[#668071]"><ArrowLeft size={14}/> Store</Link><div className="vxl-page-heading mt-5"><div><p className="eyebrow">Saved for later</p><h1>Your wishlist</h1></div></div>
    {productsLoading?<p className="surface-card mt-8 p-10 text-center text-sm text-[#718078]">Loading saved products…</p>:saved.length===0?<p className="surface-card mt-8 p-10 text-center text-sm text-[#718078]">No saved products yet. Tap the heart on a product to save it here.</p>:<div className="vxl-wishlist-grid mt-7">{saved.map(p=><article key={p.id} className="vxl-product-card"><Link href={`/product/${p.slug}`} className="block"><div className="vxl-product-card__image">{p.images?.[0]?.url?<Image src={p.images[0].url} alt={p.images[0].altText||p.name} fill sizes="(min-width: 900px) 33vw, 50vw" className="object-cover"/>:<div className="vxl-product-placeholder" aria-hidden="true"><span>VXL</span></div>}</div><div className="vxl-product-card__body"><p className="!mt-0 text-[9px] font-bold uppercase tracking-[.16em] text-[#789681]">{p.category?.name||"VEXAUSE LABS"}</p><h2 className="mt-2 font-bold text-[#173D32]">{p.name}</h2><p className="mt-2 text-sm font-bold">{money(p.pricePaise)}</p></div></Link><div className="flex gap-2 px-4 pb-4"><button onClick={()=>{if(!p.hasVariants)state.add(p.id)}} disabled={!!p.hasVariants} className="flex-1 bg-[#173D32] py-3 text-xs font-bold text-white disabled:opacity-40">{p.hasVariants?"Choose options":"Add to cart"}</button><button onClick={()=>state.toggleWish(p.id)} aria-label={`Remove ${p.name} from wishlist`} className="rounded-full border border-[#DCE4DC] px-4 text-red-700"><Trash2 size={15}/></button></div></article>)}</div>}
  </div><StoreContactFooter/></main>;
}
