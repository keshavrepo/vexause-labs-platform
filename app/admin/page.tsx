import { getSession } from "@/lib/session";
import Link from "next/link";
import { Activity, ArrowDownRight, ArrowUpRight, Box, ClipboardList, CreditCard, FileUp, Package, Plus, Settings, ShieldCheck, Users, Wallet, Clock3, Search, Bell, ChevronDown } from "lucide-react";

const stats = [
  { label: "Total orders", value: "—", note: "Connected after database setup", icon: ClipboardList },
  { label: "Custom requests", value: "—", note: "Awaiting live data connection", icon: FileUp },
  { label: "Revenue", value: "—", note: "Verified payments only", icon: Wallet },
  { label: "Products", value: "—", note: "Catalogue not connected yet", icon: Package }
];

const pipeline = [
  ["New enquiry", "Review uploaded model and requirements", "01"],
  ["Feasibility review", "Confirm printability, options and constraints", "02"],
  ["Quotation sent", "Customer reviews scope, price and timeline", "03"],
  ["Awaiting approval", "Proceed only after customer acceptance", "04"]
];

export default async function AdminPage() {
  const session = await getSession();
  return <main className="vxl-admin-overview min-h-screen bg-[#F3F5F1] text-[#0B0F0E]">
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-[248px] flex-col bg-[#102F26] text-white lg:flex">
      <div className="flex h-[82px] items-center gap-3 border-b border-white/10 px-6">
        <div className="flex h-10 w-10 items-center justify-center border border-[#78A88C] text-xl font-bold">V</div>
        <div><p className="text-sm font-bold tracking-[.14em]">VEXAUSE</p><p className="text-[9px] tracking-[.34em] text-[#A8C1B0]">LABS ADMIN</p></div>
      </div>
      <div className="px-4 py-6">
        <p className="px-3 text-[9px] font-bold tracking-[.2em] text-[#83A995]">WORKSPACE</p>
        <nav className="mt-3 space-y-1 text-[13px]">
          <a className="flex items-center gap-3 rounded-md bg-white/10 px-3 py-3 font-semibold text-white"><Activity size={17}/> Overview</a>
          <Link href="/admin/orders" className="flex items-center gap-3 rounded-md px-3 py-3 text-[#C0D0C6] hover:bg-white/5"><ClipboardList size={17}/> Orders</Link><Link href="/admin/production" className="flex items-center gap-3 rounded-md px-3 py-3 text-[#C0D0C6] hover:bg-white/5"><Package size={17}/> Production</Link><Link href="/admin/support" className="flex items-center gap-3 rounded-md px-3 py-3 text-[#C0D0C6] hover:bg-white/5"><Users size={17}/> Customer support</Link>
          <Link href="/admin/custom-requests" className="flex items-center gap-3 rounded-md px-3 py-3 text-[#C0D0C6] hover:bg-white/5"><FileUp size={17}/> Custom requests</Link>
          <Link href="/admin/products" className="flex items-center gap-3 rounded-md px-3 py-3 text-[#C0D0C6] hover:bg-white/5"><Package size={17}/> Products</Link>
          <a className="flex items-center gap-3 rounded-md px-3 py-3 text-[#C0D0C6] hover:bg-white/5"><Users size={17}/> Customers</a>
          <Link href="/admin/payments" className="flex items-center gap-3 rounded-md px-3 py-3 text-[#C0D0C6] hover:bg-white/5"><CreditCard size={17}/> Payments</Link><Link href="/admin/finance" className="flex items-center gap-3 rounded-md px-3 py-3 text-[#C0D0C6] hover:bg-white/5"><Wallet size={17}/> Finance</Link><Link href="/admin/tax-settings" className="flex items-center gap-3 rounded-md px-3 py-3 text-[#C0D0C6] hover:bg-white/5"><Settings size={17}/> GST & Tax</Link><Link href="/admin/refunds" className="flex items-center gap-3 rounded-md px-3 py-3 text-[#C0D0C6] hover:bg-white/5"><Wallet size={17}/> Refunds</Link><Link href="/admin/coupons" className="flex items-center gap-3 rounded-md px-3 py-3 text-[#C0D0C6] hover:bg-white/5"><Wallet size={17}/> Coupons & offers</Link><Link href="/admin/reviews" className="flex items-center gap-3 rounded-md px-3 py-3 text-[#C0D0C6] hover:bg-white/5"><ShieldCheck size={17}/> Reviews</Link><Link href="/admin/analytics" className="flex items-center gap-3 rounded-md px-3 py-3 text-[#C0D0C6] hover:bg-white/5"><Activity size={17}/> Analytics</Link>
        </nav>
        <p className="mt-9 px-3 text-[9px] font-bold tracking-[.2em] text-[#83A995]">MANAGEMENT</p>
        <nav className="mt-3 space-y-1 text-[13px]">
          <Link href="/admin/inventory" className="flex items-center gap-3 rounded-md px-3 py-3 text-[#C0D0C6] hover:bg-white/5"><Box size={17}/> Inventory</Link>
          <Link href="/admin/store-settings" className="flex items-center gap-3 rounded-md px-3 py-3 text-[#C0D0C6] hover:bg-white/5"><Settings size={17}/> Store settings</Link>
          {session?.role === "ADMIN" && <Link href="/admin/audit-logs" className="flex items-center gap-3 rounded-md px-3 py-3 text-[#C0D0C6] hover:bg-white/5"><ShieldCheck size={17}/> Audit history</Link>}
          {session?.role === "ADMIN" && <Link href="/admin/access" className="flex items-center gap-3 rounded-md px-3 py-3 text-[#C0D0C6] hover:bg-white/5"><ShieldCheck size={17}/> Staff access</Link>}
        </nav>
      </div>
      <div className="mt-auto border-t border-white/10 p-5"><p className="text-xs font-semibold">VEXAUSE LABS</p><p className="mt-1 text-[10px] text-[#A8C1B0]">Operations workspace · Preview</p></div>
    </aside>

    <section className="min-w-0 lg:pl-[248px]">
      <nav aria-label="Admin mobile navigation" className="mobile-scroll-row flex gap-2 border-b border-[#E0E6E0] bg-[#102F26] px-4 py-3 text-xs text-white lg:hidden">
        <Link className="shrink-0 rounded-full bg-white/15 px-3 py-2" href="/admin">Overview</Link>
        <Link className="shrink-0 rounded-full px-3 py-2" href="/admin/orders">Orders</Link><Link className="shrink-0 rounded-full px-3 py-2" href="/admin/production">Production</Link>
        <Link className="shrink-0 rounded-full px-3 py-2" href="/admin/custom-requests">Custom 3D</Link>
        <Link className="shrink-0 rounded-full px-3 py-2" href="/admin/analytics">Analytics</Link><Link className="shrink-0 rounded-full px-3 py-2" href="/admin/finance">Finance</Link><Link className="shrink-0 rounded-full px-3 py-2" href="/admin/tax-settings">GST & Tax</Link><Link className="shrink-0 rounded-full px-3 py-2" href="/admin/refunds">Refunds</Link>
        <Link className="shrink-0 rounded-full px-3 py-2" href="/admin/inventory">Inventory</Link><Link className="shrink-0 rounded-full px-3 py-2" href="/admin/store-settings">Settings</Link>
      </nav>
      <header className="flex h-[82px] items-center justify-between border-b border-[#E0E6E0] bg-white px-5 sm:px-9">
        <div><p className="text-[10px] font-bold tracking-[.18em] text-[#668071]">VEXAUSE LABS / ADMIN</p><h1 className="mt-1 text-xl font-bold tracking-tight text-[#173D32]">Overview</h1></div>
        <div className="flex items-center gap-4"><button aria-label="Notifications" className="relative rounded-full border border-[#E3E8E3] p-2.5 text-[#476054]"><Bell size={17}/><span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#78A88C]"/></button><div className="hidden items-center gap-2 border-l border-[#E2E7E2] pl-4 sm:flex"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E8EFE9] text-sm font-bold text-[#173D32]">K</div><div><p className="text-xs font-bold">Administrator</p><p className="text-[10px] text-[#718078]">Owner access · Preview</p></div><ChevronDown size={14}/></div></div>
      </header>

      <div className="mx-auto max-w-[1440px] p-5 sm:p-9">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div><p className="text-xs font-semibold text-[#789083]">MONITOR YOUR BUSINESS</p><h2 className="mt-2 text-2xl font-bold tracking-tight text-[#173D32] sm:text-3xl">Good to see you.</h2><p className="mt-2 text-sm text-[#718078]">A clear view of orders, custom print requests and operations.</p></div>
          <div className="flex gap-2"><button className="inline-flex h-11 items-center gap-2 border border-[#CBD5CD] bg-white px-4 text-xs font-bold text-[#254B3C]"><Search size={15}/> Search</button><Link href="/admin/products" className="inline-flex h-11 items-center gap-2 bg-[#173D32] px-4 text-xs font-bold text-white"><Plus size={15}/> Manage products</Link></div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map(({label,value,note,icon:Icon})=><article key={label} className="rounded-lg border border-[#E1E7E1] bg-white p-5 shadow-[0_8px_30px_rgba(20,48,35,.035)]"><div className="flex items-center justify-between"><p className="text-xs font-semibold text-[#697A70]">{label}</p><span className="flex h-9 w-9 items-center justify-center bg-[#EDF2ED] text-[#315D49]"><Icon size={17}/></span></div><p className="mt-5 text-3xl font-bold tracking-tight text-[#173D32]">{value}</p><p className="mt-2 text-[10px] text-[#89968E]">{note}</p></article>)}
        </div>

        <div className="mt-7 grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
          <section className="rounded-lg border border-[#E1E7E1] bg-white p-5 sm:p-6">
            <div className="flex items-center justify-between"><div><h3 className="font-bold text-[#173D32]">Custom request pipeline</h3><p className="mt-1 text-xs text-[#829087]">Quote-first workflow for made-to-order prints</p></div><span className="rounded-full bg-[#EDF2ED] px-3 py-1 text-[9px] font-bold text-[#42634F]">WORKFLOW</span></div>
            <div className="mt-6 space-y-3">{pipeline.map(([title,desc,n])=><div key={n} className="flex items-center gap-4 border border-[#E8ECE8] p-4"><span className="flex h-9 w-9 shrink-0 items-center justify-center bg-[#173D32] text-xs font-bold text-white">{n}</span><div className="min-w-0 flex-1"><p className="text-sm font-bold text-[#274A39]">{title}</p><p className="mt-1 text-xs text-[#7B8981]">{desc}</p></div><ArrowUpRight size={16} className="text-[#89A393]"/></div>)}</div>
          </section>

          <section className="rounded-lg border border-[#E1E7E1] bg-white p-5 sm:p-6">
            <h3 className="font-bold text-[#173D32]">Operational safeguards</h3><p className="mt-1 text-xs text-[#829087]">Trust and control checks</p>
            <div className="mt-6 space-y-5">
              {[
                ["Payment verification","Server-side confirmation required",CreditCard],
                ["Private customer files","No public or guessable file URLs",ShieldCheck],
                ["Quote approval","Customer approval before production",ClipboardList],
                ["COD eligibility","Configurable by order type and risk",Wallet]
              ].map(([title,desc,Icon]:any)=><div key={title} className="flex gap-3"><span className="mt-0.5 text-[#648B73]"><Icon size={17}/></span><div><p className="text-xs font-bold text-[#385545]">{title}</p><p className="mt-1 text-[10px] text-[#89968E]">{desc}</p></div></div>)}
            </div>
          </section>
        </div>

        <section className="mt-7 rounded-lg border border-dashed border-[#B9C8BC] bg-[#EDF2ED] p-5 sm:p-6">
          <div className="flex items-start gap-3"><Clock3 className="mt-0.5 text-[#537761]" size={19}/><div><h3 className="text-sm font-bold text-[#244A38]">Dashboard preview — awaiting backend connection</h3><p className="mt-1 max-w-3xl text-xs leading-5 text-[#66776D]">This is the first admin UI foundation. Live order totals, customer records, file review, quotations, Razorpay, COD and role permissions will activate only after the database, authentication and server-side workflows are implemented and tested. No demo figures are presented as real business data.</p></div></div>
        </section>
      </div>
    </section>
  </main>;
}
