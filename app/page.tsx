import Link from "next/link";
import { ArrowDown, ArrowUpRight, CheckCircle2, FileUp, PackageCheck, ShieldCheck } from "lucide-react";
import HomeCatalogSections from "@/components/HomeCatalogSections";
import HeroProductShowcase from "@/components/HeroProductShowcase";
import Reveal from "@/components/Reveal";
import StorefrontHeader from "@/components/StorefrontHeader";
import { StoreContactFooter, StoreTagline } from "@/components/StorefrontConfig";

const process = [
  ["01", "Share the brief", "Send a model or tell us what you are looking to make."],
  ["02", "Review feasibility", "We assess the request and confirm the scope before quoting."],
  ["03", "Approve the quote", "Review the price and details before choosing to proceed."],
  ["04", "Move into production", "Work begins after the required approval and payment."],
];

export default function HomePage() {
  return <main className="vxl-home min-h-screen">
    <div className="flex min-h-9 items-center justify-center bg-[#c8f36a] px-4 text-center text-[9px] font-bold tracking-[.17em] text-[#101713] sm:text-[10px]">
      <span>VEXAUSE LABS</span><span className="mx-2 opacity-50">/</span><StoreTagline/>
    </div>
    <StorefrontHeader/>

    <section className="vxl-home-hero">
      <div className="vxl-home-hero__inner">
        <div className="vxl-hero-copy">
          <p className="vxl-hero-kicker">Design / prototype / custom 3D printing</p>
          <h1 className="vxl-hero-title">Custom <em>3D prints.</em><br/>Made tangible.</h1>
          <p className="vxl-hero-description">From articulated collectibles and miniature models to functional prototypes. Bring a 3D file or a brief; we&apos;ll review the requirements and share a quotation before production.</p>
          <div className="vxl-hero-actions">
            <Link href="/custom-3d-printing" className="button-primary">Start a custom request <ArrowUpRight size={16}/></Link>
            <Link href="/shop" className="button-secondary">Explore the store <ArrowUpRight size={15}/></Link>
          </div>
          <div className="vxl-home-proof">
            <span><CheckCircle2 size={15}/> Quote before production</span>
            <span><CheckCircle2 size={15}/> Clear approval steps</span>
          </div>
        </div>
        <HeroProductShowcase/>
      </div>
      <a href="#collection" className="absolute bottom-7 left-1/2 hidden -translate-x-1/2 items-center gap-2 text-[9px] font-bold tracking-[.2em] text-[#bac8ba] md:flex">SCROLL TO EXPLORE <ArrowDown size={13}/></a>
    </section>

    <HomeCatalogSections/>

    <section className="vxl-home-section" aria-labelledby="vxl-process-title">
      <div className="vxl-section-shell">
        <Reveal>
          <div className="vxl-section-heading">
            <div><p className="eyebrow">Simple by design</p><h2 id="vxl-process-title">A clear path from idea to object.</h2></div>
            <p>Each custom request is reviewed before a quotation is shared. Production moves forward only after the scope is approved.</p>
          </div>
          <div id="process" className="vxl-process-grid vxl-grid-stagger">
            {process.map(([number,title,description])=><Reveal key={number} className="vxl-process-step">
              <span className="vxl-process-step__number">{number} / PROCESS</span>
              <h3>{title}</h3>
              <p>{description}</p>
            </Reveal>)}
          </div>
        </Reveal>
      </div>
    </section>

    <section className="vxl-home-section vxl-home-section--soft" aria-labelledby="vxl-approach-title">
      <div className="vxl-section-shell">
        <Reveal>
          <div className="vxl-section-heading">
            <div><p className="eyebrow">The VEXAUSE approach</p><h2 id="vxl-approach-title">Good work starts with a clear brief.</h2></div>
            <p>3D printing is requirement-led. Feasibility, material options, finish and lead time are confirmed against the part itself.</p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            <div className="border-t border-[#b9c8b9] pt-5"><ShieldCheck size={21} className="text-[#47745b]"/><h3 className="mt-5 text-lg font-semibold tracking-tight">Clarity before commitment</h3><p className="mt-2 text-sm leading-7 text-[#68766d]">Review the quotation and scope before deciding whether to proceed.</p></div>
            <div className="border-t border-[#b9c8b9] pt-5"><FileUp size={21} className="text-[#47745b]"/><h3 className="mt-5 text-lg font-semibold tracking-tight">Designed around the brief</h3><p className="mt-2 text-sm leading-7 text-[#68766d]">Share a 3D file, reference or an idea for the team to assess.</p></div>
            <div className="border-t border-[#b9c8b9] pt-5"><PackageCheck size={21} className="text-[#47745b]"/><h3 className="mt-5 text-lg font-semibold tracking-tight">A visible order journey</h3><p className="mt-2 text-sm leading-7 text-[#68766d]">Quotation, approval, payment and fulfilment have distinct steps.</p></div>
          </div>
        </Reveal>
      </div>
    </section>

    <section className="vxl-home-section">
      <div className="vxl-section-shell">
        <Reveal className="vxl-service-panel">
          <div className="relative z-10">
            <p className="eyebrow !text-[#c8f36a]">Custom 3D printing</p>
            <h2>Bring us the file.<br/>Or just the idea.</h2>
            <p className="mt-5">Tell us about the part, its intended use and any references. The team will review the request and share a quotation before work begins.</p>
            <Link href="/custom-3d-printing" className="button-primary mt-5 !bg-[#c8f36a] !text-[#101713]">Tell us what you need <ArrowUpRight size={16}/></Link>
          </div>
          <div className="vxl-service-points">
            <p className="vxl-service-point"><CheckCircle2 size={17}/> Upload an STL, OBJ or 3MF model, or send reference material.</p>
            <p className="vxl-service-point"><CheckCircle2 size={17}/> Share dimensions, quantity and intended use.</p>
            <p className="vxl-service-point"><CheckCircle2 size={17}/> Review the proposed scope and quotation before approval.</p>
          </div>
        </Reveal>
      </div>
    </section>

    <section className="vxl-home-section pt-0">
      <div className="vxl-section-shell">
        <Reveal className="vxl-final-cta">
          <div><p className="eyebrow">Ready when you are</p><h2>Make the next step a real one.</h2></div>
          <Link href="/custom-3d-printing" className="button-primary shrink-0">Start a request <ArrowUpRight size={16}/></Link>
        </Reveal>
      </div>
    </section>

    <StoreContactFooter/>
  </main>;
}
