import Link from "next/link";
import { ArrowDown, ArrowUpRight, CheckCircle2, FileUp, PackageCheck, ShieldCheck } from "lucide-react";
import HomeCatalogSections from "@/components/HomeCatalogSections";
import HeroProductShowcase from "@/components/HeroProductShowcase";
import Reveal from "@/components/Reveal";
import StorefrontHeader from "@/components/StorefrontHeader";
import { StoreContactFooter, StoreTagline } from "@/components/StorefrontConfig";

const process = [
  ["01", "Share the brief", "Send a printable model or describe the part. STL, OBJ and 3MF files are accepted with your request."],
  ["02", "Review feasibility", "The team checks the geometry, the intended use and the quantity before anything is quoted."],
  ["03", "Approve the quote", "You see the scope and the price first. Nothing is produced until you accept the quotation."],
  ["04", "Move into production", "Work begins after approval and payment, then follows the tracked production and shipment steps."],
];

const principles = [
  ["Quote first", "Every custom request is reviewed and priced before production. No silent charges, no surprise invoices."],
  ["Made in the studio", "Parts are printed, finished and checked in-house, with the order status reflecting each step."],
  ["One visible journey", "Quotation, approval, payment, production and delivery are separate, recorded stages of your order."],
];

export default function HomePage() {
  return (
    <main className="vx-home">
      <div className="vx-announce">
        <span className="vx-announce__dot" aria-hidden="true" />
        <span>Quote-first custom 3D printing</span>
        <span className="vx-announce__rule" aria-hidden="true" />
        <StoreTagline className="vx-announce__tagline" />
        <Link href="/custom-3d-printing">Start a request</Link>
      </div>

      <StorefrontHeader />

      <section className="vx-hero" aria-labelledby="vx-hero-title">
        <HeroProductShowcase />

        <div className="vx-hero__inner">
          <div className="vx-hero__copy">
            <p className="vx-hero__kicker">Independent 3D printing studio</p>
            <h1 id="vx-hero-title" className="vx-hero__title">
              Custom <em>3D prints,</em>
              <br />
              made tangible.
            </h1>
            <p className="vx-hero__lead">
              From articulated collectibles and miniature models to functional prototypes. Bring a 3D file or a brief;
              every request is reviewed and quoted before anything is printed.
            </p>
            <div className="vx-hero__actions">
              <Link href="/custom-3d-printing" className="vx-btn vx-btn--lime">
                Start a custom request <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
              <Link href="/shop" className="vx-btn vx-btn--ghost">
                Explore the store <ArrowUpRight size={15} aria-hidden="true" />
              </Link>
            </div>
            <div className="vx-hero__proof">
              <span><CheckCircle2 size={15} aria-hidden="true" /> Quote before production</span>
              <span><CheckCircle2 size={15} aria-hidden="true" /> Clear approval steps</span>
              <span><CheckCircle2 size={15} aria-hidden="true" /> Tracked order journey</span>
            </div>
          </div>

          <div className="vx-hero__aside" aria-hidden="true">
            <span className="vx-hero__aside-line" />
            <span>Form / material / motion</span>
            <a href="#collection" className="vx-hero__scroll">
              Scroll <ArrowDown size={13} />
            </a>
          </div>
        </div>
      </section>

      <HomeCatalogSections />

      <section className="vx-section" aria-labelledby="vx-story-title">
        <div className="vx-shell">
          <div className="vx-story">
            <Reveal>
              <p className="vx-kicker">The studio</p>
              <h2 id="vx-story-title" className="vx-story__title">
                A small studio,
                <br id="vx-story-detail" />
                <em>not a marketplace.</em>
              </h2>
              <p className="vx-story__lead">
                VEXAUSE LABS prints its own product line and takes on custom work directly. That means the person who
                reviews your file is the person responsible for how the part comes out.
              </p>
              <Link href="/contact" className="vx-link-arrow">
                Talk to the studio <ArrowUpRight size={15} aria-hidden="true" />
              </Link>
            </Reveal>

            <div className="vx-story__list">
              {principles.map(([title, copy], index) => (
                <Reveal key={title} className="vx-story__item" delay={index * 80}>
                  <span className="vx-story__num">0{index + 1}</span>
                  <div>
                    <h3>{title}</h3>
                    <p>{copy}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="vx-section vx-section--soft" aria-labelledby="vx-process-title">
        <div className="vx-shell">
          <Reveal className="vx-head">
            <div>
              <p className="vx-kicker">How it works</p>
              <h2 id="vx-process-title">A clear path from idea to object.</h2>
            </div>
            <p>
              Custom work is requirement-led: feasibility, material, finish and timing are confirmed against the part
              itself before a quotation is shared.
            </p>
          </Reveal>

          <div className="vx-process">
            {process.map(([number, title, description], index) => (
              <Reveal key={number} className="vx-process__step" delay={index * 70}>
                <span className="vx-process__index">{number}</span>
                <span className="vx-process__mark" aria-hidden="true" />
                <h3>{title}</h3>
                <p>{description}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="vx-band" aria-labelledby="vx-service-title">
        <div className="vx-band__inner">
          <Reveal>
            <p className="vx-kicker vx-kicker--lime">Custom 3D printing</p>
            <h2 id="vx-service-title">
              Bring us the file.
              <br />
              <em>Or just the idea.</em>
            </h2>
            <p className="vx-band__lead">
              Tell us about the part, its intended use and any references. The team reviews the request and shares a
              quotation before work begins.
            </p>
            <Link href="/custom-3d-printing" className="vx-btn vx-btn--lime">
              Tell us what you need <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </Reveal>

          <ul className="vx-band__points">
            {[
              ["Upload a model or brief", "STL, OBJ and 3MF files, plus reference images, up to the limits the request form enforces."],
              ["Share the constraints", "Dimensions, quantity, intended use and any deadline you are working to."],
              ["Review before approval", "You see the proposed scope and quotation, and decide whether to proceed."],
            ].map(([title, copy]) => (
              <li key={title} className="vx-band__point">
                <CheckCircle2 size={17} aria-hidden="true" />
                <span>
                  <b>{title}</b>
                  {copy}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="vx-cta" aria-labelledby="vx-cta-title">
        <div className="vx-cta__inner">
          <div>
            <p className="vx-kicker vx-kicker--ink">VEXAUSE LABS</p>
            <h2 id="vx-cta-title">
              Building
              <br />
              what&apos;s next.
            </h2>
          </div>
          <div className="vx-cta__actions">
            <p>Quote-first custom printing, a documented studio collection and tracked orders — start with whichever fits.</p>
            <div className="vx-actions">
              <Link href="/custom-3d-printing" className="vx-btn vx-btn--dark">
                Start a request <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
              <Link href="/shop" className="vx-btn vx-btn--outline-dark">
                Browse the store
              </Link>
            </div>
            <div className="vx-cta__notes">
              <span><FileUp size={14} aria-hidden="true" /> Files reviewed before quoting</span>
              <span><ShieldCheck size={14} aria-hidden="true" /> Private uploads</span>
              <span><PackageCheck size={14} aria-hidden="true" /> Tracked production</span>
            </div>
          </div>
        </div>
      </section>

      <StoreContactFooter />
    </main>
  );
}
