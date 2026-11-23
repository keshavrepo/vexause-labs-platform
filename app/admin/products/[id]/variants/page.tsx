"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

type Variant = { id:string; name:string; sku:string|null; optionValues:Record<string,string>; pricePaise:number; compareAtPaise:number|null; stockQuantity:number; trackInventory:boolean; isActive:boolean };
const money=(p:number)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR"}).format(p/100);
export default function ProductVariantsPage(){
 const {id}=useParams<{id:string}>();
 const [variants,setVariants]=useState<Variant[]>([]);
 const [product,setProduct]=useState<{name:string}|null>(null);
 const [name,setName]=useState(""); const [sku,setSku]=useState("");
 const [options,setOptions]=useState("Size=Standard");
 const [price,setPrice]=useState(""); const [compare,setCompare]=useState("");
 const [stock,setStock]=useState("0"); const [track,setTrack]=useState(true);
 const [busy,setBusy]=useState(false); const [error,setError]=useState(""); const [message,setMessage]=useState("");
 const load=useCallback(async()=>{
  const [p,v]=await Promise.all([fetch("/api/admin/products"),fetch(`/api/admin/products/${id}/variants`)]);
  if(!p.ok||!v.ok)throw new Error("Admin access is required to manage variants.");
  const pd=await p.json(),vd=await v.json();
  setProduct((pd.products||[]).find((x:any)=>x.id===id)||null);setVariants(vd.variants||[]);
 },[id]);
 useEffect(()=>{load().catch(e=>setError(e.message));},[load]);
 function parseOptions(){const out:Record<string,string>={};for(const part of options.split(",")){const [key,...rest]=part.split("=");if(!key?.trim()||!rest.join("=").trim())throw new Error("Enter options as Key=Value, separated by commas.");out[key.trim()]=rest.join("=").trim();}return out;}
 async function create(e:React.FormEvent){e.preventDefault();setBusy(true);setError("");setMessage("");try{
  const body={name,sku:sku||null,optionValues:parseOptions(),pricePaise:Math.round(Number(price)*100),compareAtPaise:compare?Math.round(Number(compare)*100):null,stockQuantity:Number(stock),trackInventory:track};
  const r=await fetch(`/api/admin/products/${id}/variants`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});const d=await r.json();if(!r.ok)throw new Error(d.error||"Could not add variant.");
  setName("");setSku("");setOptions("Size=Standard");setPrice("");setCompare("");setStock("0");setMessage("Variant added.");await load();
 }catch(e){setError(e instanceof Error?e.message:"Could not add variant.");}finally{setBusy(false);}}
 async function archive(variantId:string){if(!window.confirm("Archive this variant? It will no longer appear to customers."))return;const r=await fetch(`/api/admin/products/${id}/variants/${variantId}`,{method:"DELETE"});if(!r.ok){setError("Could not archive variant.");return;}await load();}
 return <main className="min-h-screen bg-[#F4F6F2] p-5"><div className="mx-auto max-w-5xl">
  <Link href="/admin/products" className="text-xs font-bold text-[#668071]">← Product catalogue</Link>
  <h1 className="mt-4 text-2xl font-bold text-[#173D32]">Product variants</h1><p className="mt-1 text-sm text-[#718078]">{product?.name||"Loading product…"}</p>
  {error&&<p role="alert" className="mt-4 bg-red-50 p-3 text-sm text-red-800">{error}</p>}{message&&<p role="status" className="mt-4 bg-white p-3 text-sm text-[#315D49]">{message}</p>}
  <form onSubmit={create} className="mt-6 grid gap-4 border border-[#DCE4DC] bg-white p-5 sm:grid-cols-2">
   <h2 className="font-bold text-[#173D32] sm:col-span-2">Add variant</h2>
   <label className="text-xs font-semibold">Variant label<input required maxLength={120} value={name} onChange={e=>setName(e.target.value)} placeholder="Small / Black" className="mt-1 h-11 w-full border px-3 text-sm"/></label>
   <label className="text-xs font-semibold">SKU (optional)<input value={sku} onChange={e=>setSku(e.target.value)} className="mt-1 h-11 w-full border px-3 text-sm"/></label>
   <label className="text-xs font-semibold sm:col-span-2">Options (comma-separated Key=Value)<input required value={options} onChange={e=>setOptions(e.target.value)} placeholder="Size=Small, Colour=Black" className="mt-1 h-11 w-full border px-3 text-sm"/><span className="mt-1 block text-[10px] text-[#718078]">Example: Size=Small, Colour=Black</span></label>
   <label className="text-xs font-semibold">Price (₹)<input required type="number" min="0.01" step="0.01" value={price} onChange={e=>setPrice(e.target.value)} className="mt-1 h-11 w-full border px-3 text-sm"/></label>
   <label className="text-xs font-semibold">Compare-at price (₹)<input type="number" min="0.01" step="0.01" value={compare} onChange={e=>setCompare(e.target.value)} className="mt-1 h-11 w-full border px-3 text-sm"/></label>
   <label className="text-xs font-semibold">Opening stock<input type="number" min="0" value={stock} onChange={e=>setStock(e.target.value)} className="mt-1 h-11 w-full border px-3 text-sm"/></label>
   <label className="flex items-center gap-2 text-xs font-semibold"><input type="checkbox" checked={track} onChange={e=>setTrack(e.target.checked)}/> Track inventory for this variant</label>
   <button disabled={busy} className="min-h-11 bg-[#173D32] px-4 text-xs font-bold text-white disabled:opacity-50 sm:col-span-2">{busy?"Saving…":"Add variant"}</button>
  </form>
  <section className="mt-7 border border-[#DCE4DC] bg-white"><h2 className="border-b p-4 font-bold text-[#173D32]">Configured variants</h2>
   {variants.length===0?<p className="p-6 text-sm text-[#718078]">No variants configured. This product currently uses its base product price and stock.</p>:variants.map(v=><div key={v.id} className="flex flex-wrap items-center justify-between gap-3 border-b p-4 last:border-0"><div><p className="font-bold text-[#173D32]">{v.name}</p><p className="mt-1 text-xs text-[#718078]">{Object.entries(v.optionValues||{}).map(([k,val])=>`${k}: ${val}`).join(" · ")}{v.sku?` · SKU ${v.sku}`:""}</p><p className="mt-1 text-xs">{money(v.pricePaise)} · {v.trackInventory?`${v.stockQuantity} in stock`:"Inventory not tracked"} · {v.isActive?"Active":"Archived"}</p></div>{v.isActive&&<button onClick={()=>archive(v.id)} className="min-h-10 border border-[#DCE4DC] px-3 text-xs font-bold text-[#8C5143]">Archive</button>}</div>)}
  </section>
  <p className="mt-4 text-xs leading-5 text-[#718078]">Variant pricing and inventory are stored separately from the base product. Variant-aware cart and checkout are not enabled yet; customer purchase buttons remain gated until the next phase.</p>
 </div></main>;
}
