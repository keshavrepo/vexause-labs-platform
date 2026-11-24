"use client";

import StorefrontHeader from "@/components/StorefrontHeader";
import { StoreContactFooter } from "@/components/StorefrontConfig";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Lock, Plus, Tag } from "lucide-react";
import { Alert, Badge, EmptyState, Panel } from "@/components/ui/Primitives";

declare global {
  interface Window {
    Razorpay?: new (options: any) => { open: () => void };
  }
}

type Address = { id: string; fullName: string; phone: string; line1: string; city: string; state: string; postalCode: string; isDefault: boolean };
type CartItem = { id: string; quantity: number; variant?: { pricePaise?: number | null; name?: string } | null; product?: { name?: string; pricePaise?: number | null } | null };

const money = (paise: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(paise / 100);

export default function CheckoutPage() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState("");
  const [method, setMethod] = useState("RAZORPAY");
  const [couponCode, setCouponCode] = useState("");
  const [couponInfo, setCouponInfo] = useState<any>(null);
  const [subtotalPaise, setSubtotalPaise] = useState(0);
  const [couponBusy, setCouponBusy] = useState(false);
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    Promise.all([fetch("/api/customer/addresses"), fetch("/api/customer/cart")])
      .then(async ([a, c]) => {
        if (a.status === 401 || c.status === 401) {
          router.push("/account/login?next=/checkout");
          return;
        }
        const ad = await a.json();
        const cd = await c.json();
        setAddresses(ad.addresses || []);
        setSelected((ad.addresses || []).find((x: Address) => x.isDefault)?.id || (ad.addresses || [])[0]?.id || "");
        if (!cd.cart?.items?.length) setError("Your cart is empty.");
        setItems(cd.cart?.items || []);
        setSubtotalPaise(
          (cd.cart?.items || []).reduce(
            (sum: number, item: any) => sum + ((item.variant?.pricePaise ?? item.product?.pricePaise) || 0) * item.quantity,
            0,
          ),
        );
      })
      .catch(() => setError("Could not load checkout details."))
      .finally(() => setLoading(false));
  }, [router]);

  async function startRazorpay(orderId: string) {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
    await new Promise<void>((resolve, reject) => {
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Could not load secure payment checkout."));
    });
    const r = await fetch("/api/customer/payments/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(d.error || "Could not start payment");
    if (!window.Razorpay) throw new Error("Payment checkout is unavailable");
    const checkout = new window.Razorpay({
      key: d.keyId,
      amount: d.amount,
      currency: d.currency,
      name: "VEXAUSE LABS",
      description: "Store order payment",
      order_id: d.razorpayOrderId,
      theme: { color: "#173D32" },
      handler: async (response: any) => {
        try {
          const vr = await fetch("/api/customer/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          const vd = await vr.json().catch(() => ({}));
          if (!vr.ok) throw new Error(vd.error || "Payment verification failed");
          router.push(`/account/orders/${orderId}?payment=verified`);
        } catch (err) {
          setBusy(false);
          setError(
            err instanceof Error
              ? `${err.message} Your order is saved; you can retry payment from order details.`
              : "Payment verification failed. Your order is saved; retry from order details.",
          );
        }
      },
      modal: {
        ondismiss: () => {
          setBusy(false);
          setError("Payment window closed. Your order is saved and payment can be retried from order details.");
        },
      },
    });
    checkout.open();
  }

  async function applyCoupon() {
    setCouponBusy(true);
    setError("");
    setCouponInfo(null);
    try {
      const r = await fetch("/api/customer/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode, subtotalPaise }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Coupon could not be applied");
      setCouponInfo(d);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCouponBusy(false);
    }
  }

  async function place() {
    if (!selected) {
      setError("Add a delivery address first.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/customer/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          addressId: selected,
          paymentMethod: method,
          customerNotes: notes,
          couponCode: couponInfo?.code || undefined,
        }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Order could not be placed");
      if (method === "RAZORPAY") {
        await startRazorpay(d.order.id);
        return;
      }
      router.push(`/account/orders/${d.order.id}`);
    } catch (e: any) {
      setError(e.message);
      setBusy(false);
    }
  }

  const payLabel = subtotalPaise <= 0 ? "Cart unavailable" : method === "COD" ? "Place COD order" : "Continue to secure payment";

  return (
    <main className="vx-store-page">
      <StorefrontHeader />
      <div className="vx-page vx-page--mid">
        <Link href="/cart" className="vx-backlink">
          <ArrowLeft size={14} aria-hidden="true" /> Back to cart
        </Link>
        <header className="vx-page-head" style={{ marginTop: 18 }}>
          <div>
            <p className="vx-kicker">Step 02 / Checkout</p>
            <h1 className="vx-title">Delivery &amp; payment</h1>
            <p className="vx-lead">
              The server recalculates prices and stock when you place the order. An order is marked paid only after
              signature verification or a valid signed provider webhook.
            </p>
          </div>
          <div className="vx-actions">
            <Badge tone="neutral"><Lock size={11} aria-hidden="true" /> Secure checkout</Badge>
          </div>
        </header>

        {loading ? (
          <div className="vx-stack" aria-busy="true">
            {[0, 1, 2].map((index) => (
              <div key={index} className="vx-skeleton" style={{ height: 120 }} />
            ))}
            <p className="sr-only" role="status">Loading checkout…</p>
          </div>
        ) : (
          <div className="vx-checkout">
            <div className="vx-stack">
              <Panel
                title="Delivery address"
                meta="Addresses are managed from your account."
                actions={<Link href="/account/addresses" className="vx-btn vx-btn--sm"><Plus size={13} aria-hidden="true" /> Manage</Link>}
              >
                {addresses.length === 0 ? (
                  <EmptyState
                    title="Add a delivery address first"
                    text="An address is required before an order can be created."
                    action={<Link href="/account/addresses" className="vx-btn vx-btn--primary vx-btn--sm">Add an address</Link>}
                  />
                ) : (
                  <div role="radiogroup" aria-label="Delivery address" className="vx-stack" style={{ gap: 10 }}>
                    {addresses.map((a) => (
                      <label key={a.id} className="vx-address-option" data-selected={selected === a.id}>
                        <input type="radio" name="address" checked={selected === a.id} onChange={() => setSelected(a.id)} />
                        <span>
                          <strong>
                            {a.fullName} {a.isDefault ? <span className="vx-badge vx-badge--brand" style={{ marginLeft: 6 }}>Default</span> : null}
                          </strong>
                          <p>
                            {a.line1}, {a.city}, {a.state} {a.postalCode}
                            <br />
                            {a.phone}
                          </p>
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </Panel>

              <Panel title="Payment method" meta="Available options depend on administrator configuration." bodyless>
                <div className="vx-panel__body vx-stack" style={{ gap: 10 }}>
                  <label className="vx-radio-card" data-selected={method === "RAZORPAY"}>
                    <input type="radio" name="payment" checked={method === "RAZORPAY"} onChange={() => setMethod("RAZORPAY")} />
                    <span>
                      <strong>Pay online</strong>
                      <span>Secure checkout powered by Razorpay (when merchant keys are configured).</span>
                    </span>
                  </label>
                  <label className="vx-radio-card" data-selected={method === "COD"}>
                    <input type="radio" name="payment" checked={method === "COD"} onChange={() => setMethod("COD")} />
                    <span>
                      <strong>Cash on delivery</strong>
                      <span>Available only when enabled by the store administrator and within the COD limit.</span>
                    </span>
                  </label>
                </div>
              </Panel>

              <Panel title="Order notes" meta="Optional delivery instructions for the studio.">
                <label className="vx-field">
                  <span className="vx-label">Notes for this order</span>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    maxLength={500}
                    rows={3}
                    placeholder="Delivery instructions or notes"
                    className="vx-textarea"
                  />
                  <span className="vx-hint">{notes.length}/500 characters</span>
                </label>
              </Panel>

              <Panel title="Discount coupon" meta="Validated against live coupon rules.">
                <div className="vx-row" style={{ gap: 8 }}>
                  <label className="vx-search" style={{ flex: 1 }}>
                    <Tag size={15} aria-hidden="true" />
                    <span className="sr-only">Coupon code</span>
                    <input
                      value={couponCode}
                      onChange={(e) => {
                        setCouponCode(e.target.value.toUpperCase());
                        setCouponInfo(null);
                      }}
                      maxLength={40}
                      placeholder="Enter coupon code"
                      className="vx-search__input"
                    />
                  </label>
                  <button
                    type="button"
                    disabled={couponBusy || !couponCode.trim() || subtotalPaise <= 0}
                    onClick={applyCoupon}
                    className="vx-btn vx-btn--primary"
                  >
                    {couponBusy ? "Checking…" : "Apply"}
                  </button>
                </div>
                {couponInfo ? (
                  <div className="vx-alert vx-alert--ok" style={{ marginTop: 12 }} role="status">
                    <span>
                      <strong>{couponInfo.code} applied.</strong> Discount {money(couponInfo.discountPaise)} · new subtotal{" "}
                      {money(couponInfo.newTotalPaise)}
                    </span>
                  </div>
                ) : null}
              </Panel>
            </div>

            <aside className="vx-order-aside">
              <Panel title="Order summary" meta={`${items.reduce((n, i) => n + i.quantity, 0)} item(s) in this order`}>
                <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: 10 }}>
                  {items.map((item) => (
                    <li key={item.id} style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 12.5 }}>
                      <span style={{ color: "var(--vx-ink-soft)", minWidth: 0 }}>
                        {item.product?.name || "Item"}
                        {item.variant?.name ? <span className="vx-muted"> · {item.variant.name}</span> : null}
                        <span className="vx-muted"> × {item.quantity}</span>
                      </span>
                      <b className="vx-tabular" style={{ whiteSpace: "nowrap" }}>
                        {money(((item.variant?.pricePaise ?? item.product?.pricePaise) || 0) * item.quantity)}
                      </b>
                    </li>
                  ))}
                </ul>
                <div className="vx-summary" style={{ marginTop: 16 }}>
                  <div className="vx-summary__row">
                    <span>Subtotal</span>
                    <b>{money(couponInfo?.newTotalPaise ?? subtotalPaise)}</b>
                  </div>
                  {couponInfo ? (
                    <div className="vx-summary__row vx-summary__row--credit">
                      <span>Coupon {couponInfo.code}</span>
                      <b>−{money(couponInfo.discountPaise)}</b>
                    </div>
                  ) : null}
                  <div className="vx-summary__row">
                    <span>Shipping &amp; tax</span>
                    <b>Calculated by the server</b>
                  </div>
                  <div className="vx-summary__row vx-summary__row--total">
                    <span>Order total</span>
                    <b>{money(couponInfo?.newTotalPaise ?? subtotalPaise)}</b>
                  </div>
                </div>

                {error ? <Alert tone="danger">{error}</Alert> : null}

                <button
                  onClick={place}
                  disabled={busy || addresses.length === 0 || subtotalPaise <= 0}
                  className="vx-btn vx-btn--primary vx-btn--block"
                  style={{ marginTop: 16 }}
                >
                  {busy ? "Processing…" : payLabel}
                </button>
                <p className="vx-small vx-muted" style={{ marginTop: 12, lineHeight: 1.6 }}>
                  {method === "COD"
                    ? "COD orders are confirmed only when the administrator has enabled COD and the order is within the configured limit."
                    : "You will be redirected to the payment provider. Closing it keeps your order saved so payment can be retried."}
                </p>
                <ul className="vx-trust-list">
                  <li>Prices and stock verified again on the server</li>
                  <li>Invoice and order history in your account</li>
                  <li>No card details are handled by VEXAUSE LABS</li>
                </ul>
              </Panel>
            </aside>
          </div>
        )}
      </div>
      <StoreContactFooter />
    </main>
  );
}
