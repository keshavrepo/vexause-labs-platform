"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CreditCard, MapPin, Package, ReceiptText, Truck } from "lucide-react";
import { Alert, Badge, EmptyState, Panel, StatusBadge } from "@/components/ui/Primitives";

const money = (p: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(p / 100);

declare global {
  interface Window {
    Razorpay?: new (options: any) => { open: () => void };
  }
}

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  async function cancelOrder() {
    if (!window.confirm("Cancel this unpaid order?")) return;
    setBusy(true);
    setError("");
    try {
      const r = await fetch(`/api/customer/orders/${params.id}/cancel`, { method: "POST" });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Cancellation failed");
      window.location.reload();
    } catch (e: any) {
      setError(e.message);
      setBusy(false);
    }
  }

  async function retryPayment() {
    setBusy(true);
    setError("");
    try {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      document.body.appendChild(script);
      await new Promise<void>((resolve, reject) => {
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Could not load payment checkout."));
      });
      const r = await fetch("/api/customer/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: params.id }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Payment retry unavailable");
      if (!window.Razorpay) throw new Error("Payment checkout unavailable");
      new window.Razorpay({
        key: d.keyId,
        amount: d.amount,
        currency: d.currency,
        name: "VEXAUSE LABS",
        description: order?.kind === "CUSTOM" ? "Custom order advance" : "Order payment",
        order_id: d.razorpayOrderId,
        theme: { color: "#173D32" },
        handler: async (response: any) => {
          const vr = await fetch("/api/customer/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          const vd = await vr.json().catch(() => ({}));
          if (!vr.ok) throw new Error(vd.error || "Verification failed");
          window.location.reload();
        },
        modal: { ondismiss: () => setBusy(false) },
      }).open();
    } catch (e: any) {
      setError(e.message);
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!params.id) return;
    const query = new URLSearchParams(window.location.search).get("payment");
    if (query === "verified") setStatus("Payment verified. Your order status will update as the team processes it.");
    fetch(`/api/customer/orders/${params.id}`, { cache: "no-store" })
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error || "Could not load order");
        return d;
      })
      .then((d) => setOrder(d.order))
      .catch((e) => setError(e.message));
  }, [params.id]);

  if (error && !order)
    return (
      <div className="vx-page vx-page--narrow">
        <div className="vx-alert vx-alert--danger" role="alert">{error}</div>
        <Link href="/account/orders" className="vx-btn vx-btn--sm" style={{ marginTop: 14 }}>Back to orders</Link>
      </div>
    );

  if (!order)
    return (
      <div className="vx-page" aria-busy="true">
        <div className="vx-stack">
          <div className="vx-skeleton" style={{ height: 22, width: 140 }} />
          <div className="vx-skeleton" style={{ height: 180 }} />
          <div className="vx-skeleton" style={{ height: 220 }} />
        </div>
        <p className="sr-only" role="status">Loading order…</p>
      </div>
    );

  const verifiedPaise = (order.payments || []).filter((p: any) => p.status === "VERIFIED").reduce((n: number, p: any) => n + p.amountPaise, 0);
  const refundedPaise = (order.refunds || []).filter((r: any) => r.status === "SUCCEEDED").reduce((n: number, r: any) => n + r.amountPaise, 0);
  const balancePaise = Math.max(0, order.totalPaise - verifiedPaise + refundedPaise);
  const canRetry =
    order.paymentMethod === "RAZORPAY" &&
    (order.status === "AWAITING_PAYMENT" ||
      (order.kind === "CUSTOM" && ["PAID", "IN_PRODUCTION"].includes(order.status) && balancePaise > 0));
  const canCancel = ["PENDING_REVIEW", "AWAITING_PAYMENT"].includes(order.status) && verifiedPaise === 0;

  return (
    <div className="vx-page">
      <Link href="/account/orders" className="vx-backlink">
        <ArrowLeft size={14} aria-hidden="true" /> All orders
      </Link>

      <header className="vx-page-head" style={{ marginTop: 16 }}>
        <div>
          <p className="vx-kicker">{order.kind === "CUSTOM" ? "Custom order" : "Store order"}</p>
          <h1 className="vx-title" style={{ fontSize: "clamp(26px, 3.2vw, 36px)" }}>{order.orderCode}</h1>
          <div className="vx-row" style={{ marginTop: 10 }}>
            <StatusBadge status={order.status} />
            <Badge tone="neutral">{order.paymentMethod === "COD" ? "Cash on delivery" : "Online payment"}</Badge>
            <span className="vx-small vx-muted">
              Placed {new Date(order.createdAt || Date.now()).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}
            </span>
          </div>
        </div>
        <div className="vx-actions">
          {canRetry ? (
            <button type="button" disabled={busy} onClick={retryPayment} className="vx-btn vx-btn--primary vx-btn--sm">
              <CreditCard size={14} aria-hidden="true" /> {busy ? "Opening…" : "Retry payment"}
            </button>
          ) : null}
          {canCancel ? (
            <button type="button" disabled={busy} onClick={cancelOrder} className="vx-btn vx-btn--danger vx-btn--sm">
              Cancel order
            </button>
          ) : null}
          {order.invoice ? (
            <Link href={`/account/orders/${params.id}/invoice`} className="vx-btn vx-btn--sm">
              <ReceiptText size={14} aria-hidden="true" /> Tax invoice
            </Link>
          ) : null}
        </div>
      </header>

      {status ? <Alert tone="ok">{status}</Alert> : null}
      {error ? <Alert tone="danger">{error}</Alert> : null}
      {!canCancel && ["PENDING_REVIEW", "AWAITING_PAYMENT"].includes(order.status) ? (
        <Alert tone="warn">
          A payment has been verified for this order, so it can no longer be cancelled online. Open a support request and the
          team will review it.
        </Alert>
      ) : null}

      <div className="vx-split" style={{ marginTop: 20 }}>
        <div className="vx-stack">
          <Panel title="Items" meta={`${order.items.reduce((n: number, i: any) => n + i.quantity, 0)} item(s)`} flush>
            <ul style={{ margin: 0, padding: "6px 20px", listStyle: "none" }}>
              {order.items.map((item: any) => (
                <li key={item.id} className="vx-row vx-row--between" style={{ borderBottom: "1px solid var(--vx-line)", padding: "11px 0", fontSize: 12.5 }}>
                  <span style={{ color: "var(--vx-ink-soft)" }}>
                    {item.productName}
                    <span className="vx-muted"> × {item.quantity}</span>
                  </span>
                  <b className="vx-tabular">{money(item.lineTotalPaise)}</b>
                </li>
              ))}
            </ul>
            <div className="vx-panel__body" style={{ borderTop: "1px solid var(--vx-line)" }}>
              <div className="vx-summary">
                <div className="vx-summary__row">
                  <span>Subtotal</span>
                  <b>{money(order.subtotalPaise ?? order.totalPaise)}</b>
                </div>
                {order.discountPaise > 0 ? (
                  <div className="vx-summary__row vx-summary__row--credit">
                    <span>Coupon {order.couponCode || "discount"}</span>
                    <b>−{money(order.discountPaise)}</b>
                  </div>
                ) : null}
                {order.taxPaise > 0 ? (
                  <div className="vx-summary__row">
                    <span>GST</span>
                    <b>{money(order.taxPaise)}</b>
                  </div>
                ) : null}
                <div className="vx-summary__row vx-summary__row--total">
                  <span>Order total</span>
                  <b>{money(order.totalPaise)}</b>
                </div>
              </div>
            </div>
          </Panel>

          {order.kind === "CUSTOM" ? (
            <Panel title="Custom 3D order payment" meta="Advances are collected against the accepted quotation.">
              <div className="vx-panel__body">
                <div className="vx-summary">
                  <div className="vx-summary__row"><span>Quoted total</span><b>{money(order.totalPaise)}</b></div>
                  <div className="vx-summary__row"><span>Verified payments</span><b>{money(verifiedPaise)}</b></div>
                  <div className="vx-summary__row"><span>Successful refunds</span><b>{money(refundedPaise)}</b></div>
                  <div className="vx-summary__row vx-summary__row--total"><span>Remaining balance</span><b>{money(balancePaise)}</b></div>
                </div>
                <p className="vx-small vx-muted" style={{ marginTop: 12 }}>
                  Any initial advance is collected against the accepted quotation. The remaining balance must be paid before dispatch.
                </p>
                {["PAID", "IN_PRODUCTION"].includes(order.status) && balancePaise > 0 ? (
                  <button type="button" disabled={busy} onClick={retryPayment} className="vx-btn vx-btn--primary vx-btn--sm" style={{ marginTop: 12 }}>
                    {busy ? "Opening…" : "Pay remaining balance"}
                  </button>
                ) : null}
              </div>
            </Panel>
          ) : null}

          <Panel title="Delivery address" meta="Used for this order only.">
            <div className="vx-panel__body">
              {order.address ? (
                <div className="vx-row" style={{ alignItems: "flex-start", gap: 10 }}>
                  <MapPin size={15} aria-hidden="true" style={{ color: "#5c8468", marginTop: 2 }} />
                  <address style={{ margin: 0, fontStyle: "normal", color: "var(--vx-ink-soft)", fontSize: 12.5, lineHeight: 1.7 }}>
                    <strong style={{ display: "block", color: "var(--vxl-forest)" }}>{order.address.fullName}</strong>
                    {order.address.line1}
                    {order.address.line2 ? `, ${order.address.line2}` : ""}
                    <br />
                    {order.address.city}, {order.address.state} {order.address.postalCode}
                    <br />
                    {order.address.phone}
                  </address>
                </div>
              ) : (
                <p className="vx-small vx-muted">No address on record for this order.</p>
              )}
            </div>
          </Panel>
        </div>

        <div className="vx-stack">
          <Panel title="Progress" meta="Every status change recorded by the team.">
            <div className="vx-panel__body">
              {order.statusHistory?.length ? (
                <ol className="vx-timeline">
                  {[...order.statusHistory].reverse().map((entry: any, index: number) => (
                    <li className="vx-timeline__item" key={`${entry.status}-${index}`}>
                      <span className="vx-timeline__dot" aria-hidden="true" />
                      <div>
                        <p className="vx-timeline__title">{String(entry.status).replaceAll("_", " ")}</p>
                        <p className="vx-timeline__meta">
                          {entry.note || "Order update"} · {new Date(entry.createdAt).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="vx-small vx-muted">No status updates recorded yet.</p>
              )}
            </div>
          </Panel>

          <Panel title="Shipment" meta="Tracking appears once the order is dispatched.">
            <div className="vx-panel__body">
              {order.shipments?.length ? (
                <div className="vx-stack" style={{ gap: 12 }}>
                  {order.shipments.map((shipment: any) => (
                    <div key={shipment.id} className="vx-panel vx-panel--quiet" style={{ padding: 14 }}>
                      <p className="vx-row" style={{ gap: 7, margin: 0, color: "var(--vxl-forest)", fontSize: 12.5, fontWeight: 700 }}>
                        <Truck size={14} aria-hidden="true" /> {shipment.carrier || "Carrier"}
                      </p>
                      <p className="vx-small vx-muted" style={{ margin: "5px 0 0" }}>
                        Status: {String(shipment.status).replaceAll("_", " ")}
                      </p>
                      <p className="vx-small vx-muted" style={{ margin: "3px 0 0" }}>
                        Tracking number: {shipment.trackingNumber || "Not available"}
                      </p>
                      {shipment.trackingUrl ? (
                        <a href={shipment.trackingUrl} target="_blank" rel="noreferrer" className="vx-btn vx-btn--sm" style={{ marginTop: 10 }}>
                          Track shipment
                        </a>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="Not dispatched yet" text="Tracking details will appear here once your order leaves the studio." />
              )}
            </div>
          </Panel>

          <Panel tone="quiet" title="Need help?" meta="Requests are reviewed, not auto-approved.">
            <div className="vx-panel__body">
              <p className="vx-small vx-muted" style={{ marginTop: 0 }}>
                Open a support request for cancellations, returns or refund enquiries. The team reviews each request and
                replies in your account.
              </p>
              <Link href="/account/support" className="vx-btn vx-btn--sm" style={{ marginTop: 10 }}>
                <Package size={13} aria-hidden="true" /> Open support
              </Link>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
