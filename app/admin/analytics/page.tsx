"use client";
import Link from "next/link";
import {useEffect,useState} from "react";
type Data={kpis:{orders:number;products:number;customers:number;customRequests:number;verifiedRevenuePaise:number;verifiedPayments:number;pendingQuotes:number};orderStatuses:{status:string;count:number}[];customRequestTypes:{type:string;count:number}[];monthlyRevenue:{month:string;label:string;revenuePaise:number}[];recentOrders:{id:string;orderCode:string;status:string;kind:string;totalPaise:number;createdAt:string}[];topProducts:{name:string;quantity:number;salesPaise:number}[]};
const money=(p:number)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(p/100);
export default function AnalyticsPage(){
 const [data,setData]=useState<Data|null>(null);const [error,setError]=useState("");const [loading,setLoading]=useState(true);
 useEffect(()=>{fetch("/api/admin/analytics",{cache:"no-store"}).then(async r=>{if(!r.ok)throw new Error("Admin sign-in required or analytics unavailable.");return r.json()}).then(setData).catch(e=>setError(e.message)).finally(()=>setLoading(false))},[]);
 const max=Math.max(1,...(data?.monthlyRevenue.map(x=>x.revenuePaise)||[]));
 return <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[.2em] text-emerald-800">VEXAUSE LABS / INSIGHTS</p><h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Business analytics</h1><p className="mt-2 text-sm text-neutral-600">Verified revenue and operational activity from your PostgreSQL records.</p></div><Link href="/admin" className="text-sm font-semibold underline">Back to admin</Link></div>
  {loading&&<p className="mt-8 text-sm text-neutral-500">Loading business metrics…</p>}
  {error&&<p role="alert" className="mt-8 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>}
  {data&&<>
   <div className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
    {[
     ["Verified revenue",money(data.kpis.verifiedRevenuePaise),"Captured/verified payment records"],
     ["Orders",String(data.kpis.orders),"All order records"],
     ["Custom requests",String(data.kpis.customRequests),"Design and print enquiries"],
     ["Customers",String(data.kpis.customers),"Registered customer accounts"],
     ["Published products",String(data.kpis.products),"Visible catalogue products"],
     ["Verified payments",String(data.kpis.verifiedPayments),"Payment records marked verified"],
     ["Quotes awaiting response",String(data.kpis.pendingQuotes),"Quotes currently sent"],
    ].map(([label,value,note])=><section key={label} className="min-w-0 rounded-xl border bg-white p-4 shadow-sm sm:p-5"><p className="text-xs font-medium text-neutral-500">{label}</p><p className="mt-2 break-words text-2xl font-semibold tracking-tight text-[#173D32] sm:text-3xl">{value}</p><p className="mt-1 text-[11px] text-neutral-500">{note}</p></section>)}
   </div>
   <div className="mt-6 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
    <section className="min-w-0 rounded-xl border bg-white p-4 sm:p-6"><h2 className="font-semibold">Verified revenue · last 6 months</h2><p className="mt-1 text-xs text-neutral-500">Grouped by payment verification date</p><div className="mt-6 flex h-48 items-end gap-2 sm:gap-4">{data.monthlyRevenue.map(m=><div key={m.month} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-2"><span className="max-w-full truncate text-[10px] text-neutral-500">{m.revenuePaise?money(m.revenuePaise):"—"}</span><div className="flex h-32 w-full items-end rounded-t bg-[#EDF2ED]"><div className="w-full rounded-t bg-[#4E8068]" style={{height:`${Math.max(m.revenuePaise?4:0,m.revenuePaise/max*100)}%`}}/></div><span className="text-xs text-neutral-600">{m.label}</span></div>)}</div></section>
    <section className="min-w-0 rounded-xl border bg-white p-4 sm:p-6"><h2 className="font-semibold">Order status</h2><div className="mt-4 space-y-3">{data.orderStatuses.map(x=><div key={x.status}><div className="flex justify-between gap-3 text-xs"><span className="break-words">{x.status.replaceAll("_"," ")}</span><b>{x.count}</b></div><div className="mt-1 h-2 overflow-hidden rounded-full bg-neutral-100"><div className="h-full rounded-full bg-[#4E8068]" style={{width:`${data.kpis.orders?x.count/data.kpis.orders*100:0}%`}}/></div></div>)}{!data.orderStatuses.length&&<p className="text-sm text-neutral-500">No orders recorded yet.</p>}</div></section>
   </div>
   <div className="mt-5 grid gap-5 lg:grid-cols-2">
    <section className="min-w-0 rounded-xl border bg-white p-4 sm:p-6"><h2 className="font-semibold">Custom request mix</h2><div className="mt-4 space-y-3">{data.customRequestTypes.map(x=><div key={x.type} className="flex items-center justify-between gap-3 border-b pb-3 text-sm"><span className="break-words">{x.type.replaceAll("_"," ")}</span><b>{x.count}</b></div>)}{!data.customRequestTypes.length&&<p className="text-sm text-neutral-500">No custom requests yet.</p>}</div></section>
    <section className="min-w-0 rounded-xl border bg-white p-4 sm:p-6"><h2 className="font-semibold">Top products by units ordered</h2><div className="mt-4 space-y-3">{data.topProducts.map((x,i)=><div key={`${x.name}-${i}`} className="flex items-start justify-between gap-3 border-b pb-3 text-sm"><div className="min-w-0"><p className="break-words font-medium">{x.name}</p><p className="text-xs text-neutral-500">{money(x.salesPaise)} order value</p></div><b className="shrink-0">{x.quantity} units</b></div>)}{!data.topProducts.length&&<p className="text-sm text-neutral-500">No product order data yet.</p>}</div></section>
   </div>
   <section className="mt-5 overflow-hidden rounded-xl border bg-white"><div className="p-4 sm:p-6"><h2 className="font-semibold">Recent orders</h2></div><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="bg-neutral-50 text-xs text-neutral-500"><tr>{["Order","Type","Status","Total","Date"].map(x=><th key={x} className="px-4 py-3">{x}</th>)}</tr></thead><tbody>{data.recentOrders.map(o=><tr key={o.id} className="border-t"><td className="px-4 py-3 font-medium">{o.orderCode}</td><td className="px-4 py-3">{o.kind}</td><td className="px-4 py-3">{o.status.replaceAll("_"," ")}</td><td className="px-4 py-3">{money(o.totalPaise)}</td><td className="px-4 py-3">{new Date(o.createdAt).toLocaleDateString("en-IN")}</td></tr>)}{!data.recentOrders.length&&<tr><td colSpan={5} className="p-5 text-neutral-500">No orders yet.</td></tr>}</tbody></table></div></section>
  </>}
 </main>;
}
