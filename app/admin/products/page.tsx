"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, Plus, Package, Eye, EyeOff, Pencil, Tag } from "lucide-react";

type Product = {
  id: string; name: string; slug: string; sku: string | null; pricePaise: number;
  stockQuantity: number; isPublished: boolean; shortDescription: string; hsnCode: string | null; gstRateBps: number;
  category: { name: string } | null; createdAt: string; images?: { id: string; altText: string }[];
};

const money = (paise: number) => new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", maximumFractionDigits: 0,
}).format(paise / 100);

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{id:string;name:string;slug:string}[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [taxDrafts,setTaxDrafts]=useState<Record<string,{hsn:string;rate:string}>>({});
  const [taxSaving,setTaxSaving]=useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "", slug: "", shortDescription: "", description: "", price: "",
    sku: "", stock: "0", categoryId: "", isPublished: false,
  });

  async function load() {
    setLoading(true); setError("");
    try {
      const [p, c] = await Promise.all([fetch("/api/admin/products"), fetch("/api/categories")]);
      if (p.status === 401 || p.status === 403) throw new Error("Admin session required. Sign in to manage products.");
      if (!p.ok || !c.ok) throw new Error("Could not load catalogue data.");
      const pd = await p.json(); const cd = await c.json();
      setProducts(pd.products || []); setCategories(cd.categories || []);
    } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong."); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => products.filter(p =>
    `${p.name} ${p.sku || ""} ${p.slug}`.toLowerCase().includes(search.toLowerCase())
  ), [products, search]);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm(old => ({ ...old, [key]: value }));
  }

  async function createProduct(event: React.FormEvent) {
    event.preventDefault(); setSaving(true); setError("");
    try {
      const response = await fetch("/api/products", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name, slug: form.slug, shortDescription: form.shortDescription,
          description: form.description, pricePaise: Math.round(Number(form.price) * 100),
          sku: form.sku || null, stockQuantity: Number(form.stock),
          categoryId: form.categoryId || null, isPublished: form.isPublished,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Product could not be created.");
      setShowForm(false);
      setForm({ name:"", slug:"", shortDescription:"", description:"", price:"", sku:"", stock:"0", categoryId:"", isPublished:false });
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save product."); }
    finally { setSaving(false); }
  }

  async function uploadImage(productId: string, file?: File) {
    if (!file) return;
    setError("");
    if (!["image/jpeg", "image/png", "image/webp", "image/avif"].includes(file.type) || file.size > 8 * 1024 * 1024) {
      setError("Choose a JPG, PNG, WebP or AVIF image up to 8 MB."); return;
    }
    try {
      const sign = await fetch(`/api/admin/products/${productId}/images/upload-url`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, contentType: file.type, sizeBytes: file.size }),
      });
      const signed = await sign.json();
      if (!sign.ok) throw new Error(signed.error || "Could not prepare image upload.");
      const uploaded = await fetch(signed.uploadUrl, {
        method: "PUT", headers: { "Content-Type": file.type }, body: file,
      });
      if (!uploaded.ok) throw new Error("Image upload failed. Check your storage CORS settings.");
      const complete = await fetch(`/api/admin/products/${productId}/images/complete`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storageKey: signed.storageKey, originalName: file.name, altText: file.name.replace(/\\.[^.]+$/, "").slice(0, 180) || "Product image" }),
      });
      const result = await complete.json();
      if (!complete.ok) throw new Error(result.error || "Could not save image record.");
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Image upload failed."); }
  }

  function taxDraft(product:Product){return taxDrafts[product.id]||{hsn:product.hsnCode||"",rate:String(product.gstRateBps/100)};}
  async function saveTax(product:Product){
    const draft=taxDraft(product);const rate=Number(draft.rate);
    if(!Number.isFinite(rate)||rate<0||rate>28){setError("GST rate must be between 0% and 28%.");return;}
    setTaxSaving(product.id);setError("");
    try{const r=await fetch(`/api/admin/products/${product.id}/tax`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({hsnCode:draft.hsn.trim()||null,gstRateBps:Math.round(rate*100)})});const d=await r.json();if(!r.ok)throw new Error(d.error||"Could not save product tax");await load();}catch(e){setError(e instanceof Error?e.message:"Could not save product tax");}finally{setTaxSaving("");}
  }

  async function unpublish(id: string) {
    if (!window.confirm("Hide this product from the public storefront?")) return;
    const response = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (!response.ok) { setError("Could not hide product. Check your admin session."); return; }
    await load();
  }

  return <main className="min-h-screen bg-[#F3F5F1] text-[#0B0F0E]">
    <header className="border-b border-[#E0E6E0] bg-white px-5 py-5 sm:px-9">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
        <div>
          
          <h1 className="mt-3 text-2xl font-bold text-[#173D32]">Product catalogue</h1>
          <p className="mt-1 text-sm text-[#718078]">Manage the products customers can discover and order.</p>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="inline-flex h-11 items-center gap-2 bg-[#173D32] px-4 text-xs font-bold text-white"><Plus size={15}/> Add product</button>
      </div>
    </header>

    <div className="mx-auto max-w-7xl p-5 sm:p-9">
      {error && <div role="alert" className="mb-5 border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</div>}

      {showForm && <form onSubmit={createProduct} className="mb-7 rounded-lg border border-[#DDE5DD] bg-white p-5 sm:p-7">
        <div className="mb-5 flex items-center justify-between"><div><h2 className="font-bold text-[#173D32]">Create product</h2><p className="mt-1 text-xs text-[#829087]">Enter accurate details; price is in INR.</p></div><Tag className="text-[#648B73]"/></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-xs font-semibold text-[#52665A]">Product name<input required minLength={2} maxLength={120} value={form.name} onChange={e=>update("name",e.target.value)} className="mt-2 h-11 w-full border border-[#D8E1D9] px-3 text-sm outline-none focus:border-[#527D62]"/></label>
          <label className="text-xs font-semibold text-[#52665A]">URL slug<input required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={form.slug} onChange={e=>update("slug",e.target.value.toLowerCase().replace(/\\s+/g,"-"))} placeholder="desk-organiser" className="mt-2 h-11 w-full border border-[#D8E1D9] px-3 text-sm outline-none focus:border-[#527D62]"/></label>
          <label className="text-xs font-semibold text-[#52665A]">Price (₹)<input required type="number" min="1" step="0.01" value={form.price} onChange={e=>update("price",e.target.value)} className="mt-2 h-11 w-full border border-[#D8E1D9] px-3 text-sm outline-none focus:border-[#527D62]"/></label>
          <label className="text-xs font-semibold text-[#52665A]">SKU (optional)<input value={form.sku} onChange={e=>update("sku",e.target.value)} className="mt-2 h-11 w-full border border-[#D8E1D9] px-3 text-sm outline-none focus:border-[#527D62]"/></label>
          <label className="text-xs font-semibold text-[#52665A]">Opening stock<input type="number" min="0" value={form.stock} onChange={e=>update("stock",e.target.value)} className="mt-2 h-11 w-full border border-[#D8E1D9] px-3 text-sm outline-none focus:border-[#527D62]"/></label>
          <label className="text-xs font-semibold text-[#52665A]">Category<select value={form.categoryId} onChange={e=>update("categoryId",e.target.value)} className="mt-2 h-11 w-full border border-[#D8E1D9] bg-white px-3 text-sm"><option value="">Uncategorised</option>{categories.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
          <label className="text-xs font-semibold text-[#52665A] sm:col-span-2">Short description<input required minLength={5} maxLength={240} value={form.shortDescription} onChange={e=>update("shortDescription",e.target.value)} className="mt-2 h-11 w-full border border-[#D8E1D9] px-3 text-sm"/></label>
          <label className="text-xs font-semibold text-[#52665A] sm:col-span-2">Full description<textarea required minLength={5} rows={4} value={form.description} onChange={e=>update("description",e.target.value)} className="mt-2 w-full border border-[#D8E1D9] p-3 text-sm"/></label>
          <label className="flex items-center gap-2 text-xs font-semibold text-[#52665A] sm:col-span-2"><input type="checkbox" checked={form.isPublished} onChange={e=>update("isPublished",e.target.checked)}/> Publish immediately</label>
        </div>
        <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={()=>setShowForm(false)} className="h-10 border border-[#D5DED6] px-4 text-xs font-bold">Cancel</button><button disabled={saving} className="h-10 bg-[#173D32] px-5 text-xs font-bold text-white disabled:opacity-50">{saving ? "Saving…" : "Save product"}</button></div>
      </form>}

      <section className="overflow-hidden rounded-lg border border-[#E1E7E1] bg-white">
        <div className="flex flex-col gap-3 border-b border-[#E8ECE8] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="font-bold text-[#173D32]">All products</p><p className="mt-1 text-xs text-[#829087]">{products.length} catalogue entries</p></div>
          <div className="relative"><Search size={15} className="absolute left-3 top-3 text-[#829087]"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search name, SKU or slug" className="h-10 w-full border border-[#D8E1D9] pl-9 pr-3 text-xs sm:w-72"/></div>
        </div>
        {loading ? <div className="p-10 text-center text-sm text-[#829087]">Loading catalogue…</div> :
          filtered.length === 0 ? <div className="p-12 text-center"><Package className="mx-auto text-[#8AA494]"/><p className="mt-3 text-sm font-semibold text-[#385545]">No products found</p><p className="mt-1 text-xs text-[#829087]">Add your first product or adjust the search.</p></div> :
          <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-xs">
            <thead className="bg-[#F7F9F6] text-[10px] uppercase tracking-wider text-[#718078]"><tr><th className="px-5 py-4">Product</th><th className="px-5 py-4">SKU</th><th className="px-5 py-4">Category</th><th className="px-5 py-4">Price</th><th className="px-5 py-4">Stock</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Images</th><th className="px-5 py-4">HSN / GST</th><th className="px-5 py-4">Action</th></tr></thead>
            <tbody>{filtered.map(p=><tr key={p.id} className="border-t border-[#EDF0ED]">
              <td className="px-5 py-4"><p className="font-bold text-[#274A39]">{p.name}</p><p className="mt-1 text-[10px] text-[#89968E]">/{p.slug}</p></td>
              <td className="px-5 py-4 text-[#66776C]">{p.sku || "—"}</td><td className="px-5 py-4 text-[#66776C]">{p.category?.name || "—"}</td>
              <td className="px-5 py-4 font-semibold text-[#274A39]">{money(p.pricePaise)}</td><td className="px-5 py-4 text-[#66776C]">{p.stockQuantity}</td>
              <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${p.isPublished ? "bg-[#E9F2EA] text-[#386247]" : "bg-[#F0F1EF] text-[#727B74]"}`}>{p.isPublished ? "Published" : "Draft"}</span></td>
              <td className="px-5 py-4"><label className="cursor-pointer text-[10px] font-bold text-[#386247]">{p.images?.length || 0} · Upload<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="hidden" onChange={e=>{ uploadImage(p.id,e.target.files?.[0]); e.currentTarget.value=""; }}/></label></td><td className="px-5 py-3"><div className="flex items-center gap-1"><input aria-label={`HSN for ${p.name}`} value={taxDraft(p).hsn} onChange={e=>setTaxDrafts(v=>({...v,[p.id]:{...taxDraft(p),hsn:e.target.value}}))} placeholder="HSN" className="h-8 w-20 border px-2 text-[10px]"/><input aria-label={`GST rate for ${p.name}`} type="number" min="0" max="28" step="0.01" value={taxDraft(p).rate} onChange={e=>setTaxDrafts(v=>({...v,[p.id]:{...taxDraft(p),rate:e.target.value}}))} className="h-8 w-14 border px-1 text-[10px]"/><span className="text-[10px]">%</span><button onClick={()=>saveTax(p)} disabled={taxSaving===p.id} className="text-[10px] font-bold text-[#386247] disabled:opacity-40">{taxSaving===p.id?"…":"Save"}</button></div></td><td className="px-5 py-4"><Link href={`/admin/products/${p.id}/variants`} className="mr-3 inline-flex items-center gap-1 text-[10px] font-bold text-[#386247]"><Tag size={13}/> Variants</Link><button title="Hide product" onClick={()=>unpublish(p.id)} className="inline-flex items-center gap-1 text-[10px] font-bold text-[#9A5A43]"><EyeOff size={13}/> Hide</button></td>
            </tr>)}</tbody>
          </table></div>}
      </section>
      <p className="mt-4 text-[10px] text-[#89968E]">Product deletion is implemented as unpublishing so existing order records remain intact.</p>
    </div>
  </main>;
}
