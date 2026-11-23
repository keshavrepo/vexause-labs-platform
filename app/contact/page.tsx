import Link from "next/link";
import StorefrontHeader from "@/components/StorefrontHeader";
import { StoreContactDetails, StoreContactFooter } from "@/components/StorefrontConfig";
import { PageHeader, Panel } from "@/components/ui/Primitives";

export default function ContactPage() {
  return (
    <>
      <StorefrontHeader />
      <main className="min-h-[65vh] bg-[#F5F7F3]">
        <div className="vx-page vx-page--mid">
          <PageHeader
            kicker="VEXAUSE LABS · Contact"
            title="Talk to the studio"
            description="For product, custom 3D printing and order enquiries, use the business contact details configured by the store team. Signed-in customers can raise a tracked support request instead."
            actions={
              <>
                <Link href="/account/support" className="vx-btn vx-btn--primary vx-btn--sm">Tracked support request</Link>
                <Link href="/help" className="vx-btn vx-btn--sm">Help &amp; FAQs</Link>
              </>
            }
          />

          <StoreContactDetails />

          <div className="vx-grid vx-grid--2" style={{ marginTop: 20 }}>
            <Panel title="Order or delivery issue" meta="Signed-in support keeps the conversation linked to the order.">
              <div className="vx-panel__body">
                <p className="vx-small vx-muted" style={{ marginTop: 0 }}>
                  Submit a request from your account and follow its status. Cancellation, return and refund requests are
                  reviewed by the team — they are not automatic.
                </p>
                <Link href="/account/support" className="vx-btn vx-btn--sm" style={{ marginTop: 12 }}>Go to help &amp; support</Link>
              </div>
            </Panel>
            <Panel title="Custom 3D printing" meta="Quote-first workflow, no obligation.">
              <div className="vx-panel__body">
                <p className="vx-small vx-muted" style={{ marginTop: 0 }}>
                  Send a printable model or a brief. We review feasibility and share a quotation before any production
                  begins.
                </p>
                <Link href="/custom-3d-printing" className="vx-btn vx-btn--sm" style={{ marginTop: 12 }}>Request a custom print</Link>
              </div>
            </Panel>
          </div>

          <p className="vx-small vx-muted" style={{ marginTop: 18 }}>
            Looking for common answers? Visit <Link href="/help" style={{ fontWeight: 700, textDecoration: "underline" }}>Help &amp; FAQs</Link>.
          </p>
        </div>
      </main>
      <StoreContactFooter />
    </>
  );
}
