import Link from "next/link";
import StorefrontHeader from "@/components/StorefrontHeader";
import { StoreContactFooter } from "@/components/StorefrontConfig";

export default function NotFound() {
  return (
    <>
      <StorefrontHeader />
      <main className="vx-page vx-page--narrow" style={{ padding: "72px 20px 96px" }}>
        <p className="vx-kicker">404 · Page not found</p>
        <h1 className="vx-title" style={{ fontSize: "clamp(28px, 4vw, 44px)", marginTop: 8 }}>
          This page has come off the build plate.
        </h1>
        <p className="vx-lead" style={{ marginTop: 12, maxWidth: "58ch" }}>
          The address you followed does not exist, or the item is no longer listed. The catalogue and the custom print
          request form are the quickest ways back.
        </p>
        <div className="vx-actions" style={{ marginTop: 22 }}>
          <Link href="/shop" className="vx-btn vx-btn--primary vx-btn--sm">Browse the store</Link>
          <Link href="/custom-3d-printing" className="vx-btn vx-btn--sm">Request a custom print</Link>
          <Link href="/help" className="vx-btn vx-btn--quiet vx-btn--sm">Help &amp; FAQs</Link>
        </div>
      </main>
      <StoreContactFooter />
    </>
  );
}
