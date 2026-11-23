"use client";
import { StoreContactFooter, StoreTagline } from "@/components/StorefrontConfig";
import StorefrontHeader from "@/components/StorefrontHeader";
import {useState} from "react";
type RequestType="PRINT_FROM_FILE"|"DESIGN_AND_PRINT"|"DESIGN_ONLY";
export default function Custom3DPrintingPage(){
 const [type,setType]=useState<RequestType>("PRINT_FROM_FILE");
 const [busy,setBusy]=useState(false);const [message,setMessage]=useState("");const [error,setError]=useState("");
 async function submit(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();
  const formElement=e.currentTarget;
  setBusy(true);setError("");setMessage("");
  const form=new FormData(formElement);form.set("requestType",type);
  try {
   const res=await fetch("/api/custom-requests",{method:"POST",body:form});
   const data=await res.json();
   if(!res.ok)throw new Error(data.error||"Could not submit request.");
   setMessage(`Request received! Your reference number is ${data.request.requestCode}. Our team will review it and contact you.`);
   formElement.reset();
  } catch (err) {
   setError(err instanceof Error?err.message:"Could not submit request. Please try again.");
  } finally { setBusy(false); }
 }
 const field="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm";
 return <><StorefrontHeader/><main className="vxl-custom-page mx-auto w-full max-w-4xl px-4 py-7 sm:px-6 sm:py-12">
  <p className="eyebrow">VEXAUSE LABS · BUILDING WHAT&apos;S NEXT.</p>
  <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-[-.05em] text-[#173D32] sm:text-5xl">Custom 3D Printing & Design</h1>
  <p className="mt-3 max-w-2xl text-neutral-600">Have a ready 3D file, or just an idea? Tell us what you need. Our team reviews every request and shares a quotation before work begins.</p>
  <div className="mt-8 grid gap-3 md:grid-cols-3">
   {([
    ["PRINT_FROM_FILE","I have a 3D file","Upload STL, OBJ or 3MF and request printing."],
    ["DESIGN_AND_PRINT","I have an idea","We help design it, then print after your approval."],
    ["DESIGN_ONLY","I need a design file","Request a CAD/3D design without printing."]
   ] as [RequestType,string,string][]).map(([v,title,desc])=><button type="button" key={v} onClick={()=>setType(v)} aria-pressed={type===v} className={`vxl-choice border p-4 text-left ${type===v?"border-[#173D32] bg-[#edf3ec] shadow-[0_8px_24px_rgba(23,61,50,.08)]":"border-neutral-200 bg-white"}`}><span className="block font-semibold text-[#173D32]">{title}</span><span className="mt-2 block text-sm leading-6 text-neutral-600">{desc}</span></button>)}
  </div>
  <form onSubmit={submit} className="vxl-form-section mt-6 space-y-5 p-4 sm:mt-8 sm:p-7">
   <h2 className="text-xl font-semibold tracking-tight text-[#173D32]">Tell us about your project</h2>
   <div className="grid gap-4 md:grid-cols-2">
    <label className="text-sm">Full name<input name="name" required minLength={2} maxLength={100} className={field+" mt-1"} /></label>
    <label className="text-sm">Email<input name="email" type="email" required className={field+" mt-1"} /></label>
    <label className="text-sm">Phone<input name="phone" required minLength={7} maxLength={24} className={field+" mt-1"} /></label>
    <label className="text-sm">Quantity<input name="quantity" type="number" min="1" max="500" defaultValue="1" required className={field+" mt-1"} /></label>
    <label className="text-sm md:col-span-2">Describe your idea / model requirements<textarea name="description" required minLength={15} maxLength={5000} rows={5} placeholder="What should the part look like? What will it be used for?" className={field+" mt-1"} /></label>
    <label className="text-sm">Intended use<input name="intendedUse" maxLength={1500} placeholder="e.g. prototype, display, functional part" className={field+" mt-1"} /></label>
    <label className="text-sm">Approx. dimensions<input name="dimensions" maxLength={200} placeholder="Length × width × height (mm)" className={field+" mt-1"} /></label>
    <label className="text-sm">Material preference<input name="materialPreference" maxLength={80} placeholder="PLA, PETG, ABS, not sure" className={field+" mt-1"} /></label>
    <label className="text-sm">Colour preference<input name="colourPreference" maxLength={80} placeholder="Black, white, etc." className={field+" mt-1"} /></label>
    <label className="text-sm">Budget (₹, optional)<input name="budget" type="number" min="0" step="1" className={field+" mt-1"} /></label>
    <label className="text-sm">Target date (optional)<input name="deadline" type="date" className={field+" mt-1"} /></label>
   </div>
   {type==="PRINT_FROM_FILE"&&<label className="block text-sm">3D model files (STL / OBJ / 3MF) <span className="text-red-600">*</span><input name="modelFiles" type="file" multiple accept=".stl,.obj,.3mf" required className="mt-2 block w-full text-sm" /><span className="mt-1 block text-xs text-neutral-500">Up to 8 files total, 25 MB each. Files are stored privately and are not public product images.</span></label>}
   {type!=="PRINT_FROM_FILE"&&<div className="space-y-2"><label className="block text-sm">Sketches / reference images / PDF (optional)<input name="referenceFiles" type="file" multiple accept=".jpg,.jpeg,.png,.webp,.pdf" className="mt-2 block w-full text-sm" /></label><p className="text-xs text-neutral-500">We will review the brief and confirm design scope, revisions, price and deliverables before starting.</p></div>}
   {error&&<p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
   {message&&<p role="status" className="rounded bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
   <button disabled={busy} aria-live="polite" className="button-primary disabled:opacity-50">{busy?"Submitting…":"Submit custom request"}</button>
   <p className="text-xs text-neutral-500">Submitting a request does not confirm feasibility, price or delivery date. We will review and send a quotation for your approval.</p>
  </form>
 </main><StoreContactFooter /></>;
}
