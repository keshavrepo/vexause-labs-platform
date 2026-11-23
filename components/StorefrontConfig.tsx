"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

type Store = { name: string; tagline: string; supportEmail: string; supportPhone: string; businessAddress: string };
const fallback: Store = { name: "VEXAUSE LABS", tagline: "BUILDING WHAT'S NEXT.", supportEmail: "", supportPhone: "", businessAddress: "" };

function useStore() {
  const [store, setStore] = useState(fallback);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let active = true;
    fetch("/api/store-config", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (active && d?.store) setStore({ ...fallback, ...d.store });
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => { active = false; };
  }, []);
  return { store, loaded };
}

export function StoreBrand({ compact = false }: { compact?: boolean }) {
  const { store } = useStore();
  const words = store.name.trim().split(/\s+/);
  const first = words.shift() || "VEXAUSE";
  const rest = words.join(" ");
  return (
    <span className="vx-brand-wordmark">
      <span className="vx-brand-wordmark__first">{first}</span>
      {rest ? <span className="vx-brand-wordmark__rest">{rest}</span> : null}
      {!compact ? <span className="sr-only"> {store.tagline}</span> : null}
    </span>
  );
}

export function StoreTagline({ className = "" }: { className?: string }) {
  const { store } = useStore();
  return <span className={className}>{store.tagline}</span>;
}

export function StoreContactFooter() {
  const { store } = useStore();
  const tel = store.supportPhone ? store.supportPhone.replace(/[^+0-9]/g, "") : "";
  return (
    <footer className="vx-footer">
      <div className="vx-footer__top">
        <div className="vx-footer__brand">
          <p className="vx-footer__name">{store.name}</p>
          <p className="vx-footer__tag">{store.tagline}</p>
          <p className="vx-footer__copy">
            Thoughtful 3D printing, clear steps and a quotation before work begins. Custom parts are reviewed before they
            are quoted.
          </p>
          <div className="vx-footer__contact">
            {store.supportEmail ? <a href={`mailto:${store.supportEmail}`}>{store.supportEmail}</a> : null}
            {store.supportPhone ? <a href={`tel:${tel}`}>{store.supportPhone}</a> : null}
            {store.businessAddress ? <p>{store.businessAddress}</p> : null}
          </div>
        </div>

        <nav className="vx-footer__col" aria-label="Store links">
          <p className="vx-footer__label">Explore</p>
          <Link href="/shop">Store</Link>
          <Link href="/custom-3d-printing">Custom 3D printing</Link>
          <Link href="/wishlist">Wishlist</Link>
          <Link href="/cart">Cart</Link>
        </nav>

        <nav className="vx-footer__col" aria-label="Account links">
          <p className="vx-footer__label">Account</p>
          <Link href="/account">Overview</Link>
          <Link href="/account/orders">Orders</Link>
          <Link href="/account/custom-requests">Custom requests</Link>
          <Link href="/account/support">Support requests</Link>
        </nav>

        <nav className="vx-footer__col" aria-label="Help links">
          <p className="vx-footer__label">Support</p>
          <Link href="/help">Help &amp; FAQs</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/account/login">Sign in</Link>
          <Link href="/account/register">Create account</Link>
        </nav>
      </div>

      <div className="vx-footer__bottom">
        <span>© {new Date().getFullYear()} {store.name}</span>
        <span>Custom requirements are reviewed before quotation.</span>
        <span>3D printing only — no other manufacturing services are offered.</span>
      </div>
    </footer>
  );
}

export function StoreContactDetails() {
  const { store, loaded } = useStore();
  const tel = store.supportPhone ? store.supportPhone.replace(/[^+0-9]/g, "") : "";
  const empty = loaded && !store.supportEmail && !store.supportPhone && !store.businessAddress;

  return (
    <div className="vx-contact-grid">
      {store.supportEmail ? (
        <a className="vx-contact-card" href={`mailto:${store.supportEmail}`}>
          <span className="vx-kicker">Email</span>
          <span className="vx-contact-card__value">{store.supportEmail}</span>
          <span className="vx-contact-card__hint">Quotations, order questions, file checks</span>
        </a>
      ) : null}
      {store.supportPhone ? (
        <a className="vx-contact-card" href={`tel:${tel}`}>
          <span className="vx-kicker">Phone</span>
          <span className="vx-contact-card__value">{store.supportPhone}</span>
          <span className="vx-contact-card__hint">Studio hours as configured by the team</span>
        </a>
      ) : null}
      {store.businessAddress ? (
        <div className="vx-contact-card vx-contact-card--wide">
          <span className="vx-kicker">Studio address</span>
          <span className="vx-contact-card__value" style={{ whiteSpace: "pre-line" }}>{store.businessAddress}</span>
        </div>
      ) : null}
      {empty ? (
        <div className="vx-contact-card vx-contact-card--wide">
          <span className="vx-kicker">Contact details</span>
          <span className="vx-contact-card__hint">
            The studio has not published contact details yet. Signed-in customers can still raise a tracked support
            request.
          </span>
        </div>
      ) : null}
    </div>
  );
}
