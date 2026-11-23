"use client";
import {useEffect,useState} from "react";
type Store={name:string;tagline:string;supportEmail:string;supportPhone:string;businessAddress:string};
const fallback:Store={name:"VEXAUSE LABS",tagline:"BUILDING WHAT'S NEXT.",supportEmail:"",supportPhone:"",businessAddress:""};
export function StoreBrand({compact=false}:{compact?:boolean}){
 const [store,setStore]=useState(fallback);
 useEffect(()=>{let active=true;fetch("/api/store-config",{cache:"no-store"}).then(r=>r.ok?r.json():null).then(d=>{if(active&&d?.store)setStore({...fallback,...d.store})}).catch(()=>{});return()=>{active=false}},[]);
 const words=store.name.trim().split(/\s+/);const first=words.shift()||"VEXAUSE";const rest=words.join(" ");
 return <span className="leading-tight"><span className="block text-[15px] font-bold tracking-[.12em] text-forest">{first}</span>{rest&&<span className="block text-[9px] font-bold tracking-[.32em] text-[#6D8177]">{rest}</span>}{!compact&&<span className="sr-only"> {store.tagline}</span>}</span>;
}
export function StoreTagline({className=""}:{className?:string}){
 const [tagline,setTagline]=useState(fallback.tagline);
 useEffect(()=>{let active=true;fetch("/api/store-config",{cache:"no-store"}).then(r=>r.ok?r.json():null).then(d=>{if(active&&typeof d?.store?.tagline==="string")setTagline(d.store.tagline)}).catch(()=>{});return()=>{active=false}},[]);
 return <span className={className}>{tagline}</span>;
}
export function StoreContactFooter(){
 const [store,setStore]=useState(fallback);
 useEffect(()=>{let active=true;fetch("/api/store-config",{cache:"no-store"}).then(r=>r.ok?r.json():null).then(d=>{if(active&&d?.store)setStore({...fallback,...d.store})}).catch(()=>{});return()=>{active=false}},[]);
 return <footer className="vxl-footer">
  <div className="vxl-footer__inner">
   <div className="vxl-footer__brand-block"><p className="vxl-footer__brand text-sm font-bold tracking-[.16em]">{store.name}</p><p className="mt-3 vxl-footer__copy">{store.tagline} Thoughtful 3D printing, clear steps, and a quotation before work begins.</p></div>
   <div><p className="vxl-footer__label">Explore</p><nav aria-label="Store links" className="vxl-footer__links mt-4"><a href="/shop">Store</a><a href="/custom-3d-printing">Custom 3D printing</a><a href="/account">My account</a></nav></div>
   <div><p className="vxl-footer__label">Support</p><nav aria-label="Help links" className="vxl-footer__links mt-4"><a href="/help">Help & FAQs</a><a href="/contact">Contact</a><a href="/account/support">Customer support</a></nav>
    <div className="mt-5 space-y-2 text-xs text-[#c5d0c5]">{store.supportEmail&&<p><a className="underline underline-offset-4" href={`mailto:${store.supportEmail}`}>{store.supportEmail}</a></p>}{store.supportPhone&&<p><a className="underline underline-offset-4" href={`tel:${store.supportPhone.replace(/[^+0-9]/g,"")}`}>{store.supportPhone}</a></p>}{store.businessAddress&&<p className="max-w-sm whitespace-pre-line">{store.businessAddress}</p>}</div>
   </div>
  </div>
  <div className="vxl-footer__bottom"><span>© {new Date().getFullYear()} {store.name}</span><span>Custom requirements are reviewed before quotation.</span></div>
 </footer>;
}

export function StoreContactDetails(){
 const [store,setStore]=useState(fallback);
 const [loaded,setLoaded]=useState(false);
 useEffect(()=>{let active=true;fetch("/api/store-config",{cache:"no-store"}).then(r=>r.ok?r.json():null).then(d=>{if(active&&d?.store)setStore({...fallback,...d.store})}).catch(()=>{}).finally(()=>{if(active)setLoaded(true)});return()=>{active=false}},[]);
 return <section className="mt-6 grid gap-3 sm:grid-cols-2">
  {store.supportEmail&&<a className="rounded-2xl border border-[#DCE4DC] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#789681] hover:shadow-soft" href={`mailto:${store.supportEmail}`}><span className="block text-[10px] font-bold uppercase tracking-widest text-[#789681]">Email</span><span className="mt-2 block break-all text-sm font-semibold text-[#173D32]">{store.supportEmail}</span></a>}
  {store.supportPhone&&<a className="rounded-2xl border border-[#DCE4DC] bg-white p-5 transition hover:-translate-y-0.5 hover:border-[#789681] hover:shadow-soft" href={`tel:${store.supportPhone.replace(/[^+0-9]/g,"")}`}><span className="block text-[10px] font-bold uppercase tracking-widest text-[#789681]">Phone</span><span className="mt-2 block text-sm font-semibold text-[#173D32]">{store.supportPhone}</span></a>}
  {store.businessAddress&&<div className="rounded-2xl border border-[#DCE4DC] bg-white p-5 sm:col-span-2"><span className="block text-[10px] font-bold uppercase tracking-widest text-[#789681]">Business address</span><span className="mt-2 block whitespace-pre-line text-sm text-[#173D32]">{store.businessAddress}</span></div>}
  {loaded&&!store.supportEmail&&!store.supportPhone&&!store.businessAddress&&<p className="rounded-2xl border border-[#DCE4DC] bg-white p-5 text-sm text-[#718078] sm:col-span-2">Contact details have not been configured yet. You can still submit a support request after signing in.</p>}
 </section>;
}
