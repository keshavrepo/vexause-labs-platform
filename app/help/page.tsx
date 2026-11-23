import Link from "next/link";
import StorefrontHeader from "@/components/StorefrontHeader";
import { StoreContactFooter } from "@/components/StorefrontConfig";
import { PageHeader, Panel } from "@/components/ui/Primitives";

const faqs = [
  {
    q: "How do I order a listed product?",
    a: "Open the product page, choose an available variant if one is offered, add it to your cart and continue to checkout. The server checks current price and stock again when the order is placed.",
  },
  {
    q: "Can I request a custom 3D print?",
    a: "Yes. Use the Custom 3D Printing page to request printing from an STL, OBJ or 3MF file, design and printing, or design only. The team reviews the request and shares a quote for your approval before work begins.",
  },
  {
    q: "When will my custom order be produced?",
    a: "Custom work follows review, quotation, customer approval, payment and production steps. Timing depends on the approved scope and will need to be confirmed for your order; this site does not promise a universal turnaround time.",
  },
  {
    q: "Which payment methods are available?",
    a: "Online payment is offered through the configured payment gateway. Cash on delivery is shown only when the store administrator has enabled it and the order meets the configured limit.",
  },
  {
    q: "How can I track an order?",
    a: "Sign in and open Account → Orders. Tracking information appears after the team records shipment details for your order.",
  },
  {
    q: "Can I cancel, return or ask about a refund?",
    a: "Sign in and submit a request from Help & Support. Cancellation requests are available for eligible pre-production orders; return and refund enquiries can be submitted for delivered orders. Requests are reviewed and are not automatic approvals.",
  },
  {
    q: "What if I have a problem with a product or order?",
    a: "Sign in and create a support request with the relevant order and details. You can follow its status and any team reply from your account.",
  },
];

const topics: Array<[string, string, string, string]> = [
  ["Orders", "Placing, changing and tracking an order.", "/account/orders", "Open your orders"],
  ["Custom printing", "Files, design work and quotations.", "/custom-3d-printing", "Start a request"],
  ["Payments & invoices", "Payment state, GST invoices and refunds.", "/account/orders", "View invoices"],
  ["Account", "Addresses, notifications and support history.", "/account", "Manage account"],
];

export default function HelpPage() {
  return (
    <>
      <StorefrontHeader />
      <main className="vx-store-page">
        <div className="vx-page vx-page--mid">
          <PageHeader
            kicker="VEXAUSE LABS · Customer help"
            title="Help &amp; frequently asked questions"
            description="Clear information about ordering, custom 3D printing, payments and support. If something is missing, a tracked support request is the fastest route."
            actions={
              <>
                <Link href="/custom-3d-printing" className="vx-btn vx-btn--primary vx-btn--sm">Request a custom print</Link>
                <Link href="/account/support" className="vx-btn vx-btn--sm">Sign in for support</Link>
              </>
            }
          />

          <div className="vx-grid vx-grid--4" style={{ marginBottom: 22 }}>
            {topics.map(([title, text, href, cta]) => (
              <Link key={title} href={href} className="vx-panel" style={{ padding: 16 }}>
                <p style={{ margin: 0, color: "var(--vxl-forest)", fontSize: 12.5, fontWeight: 700 }}>{title}</p>
                <p className="vx-small vx-muted" style={{ margin: "5px 0 10px", lineHeight: 1.6 }}>{text}</p>
                <span className="vx-small" style={{ color: "#356448", fontWeight: 700 }}>{cta} →</span>
              </Link>
            ))}
          </div>

          <Panel title="Frequently asked questions" meta="Answers reflect the platform's current behaviour — no delivery promises are implied.">
            <div className="vx-panel__body" style={{ paddingTop: 6 }}>
              {faqs.map((faq) => (
                <details key={faq.q} className="vx-faq">
                  <summary>
                    <span>{faq.q}</span>
                    <span className="vx-faq__mark" aria-hidden="true">+</span>
                  </summary>
                  <p>{faq.a}</p>
                </details>
              ))}
            </div>
          </Panel>

          <div className="vx-actions" style={{ marginTop: 20 }}>
            <Link href="/custom-3d-printing" className="vx-btn vx-btn--primary vx-btn--sm">Request a custom print</Link>
            <Link href="/contact" className="vx-btn vx-btn--sm">Contact details</Link>
            <Link href="/account/support" className="vx-btn vx-btn--quiet vx-btn--sm">Support history</Link>
          </div>
        </div>
      </main>
      <StoreContactFooter />
    </>
  );
}
