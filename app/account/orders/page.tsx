"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Package } from "lucide-react";
import { EmptyState, PageHeader, Panel, StatusBadge } from "@/components/ui/Primitives";

type OrderItem = { id: string; productName: string; quantity: number; lineTotalPaise: number };
type Order = { id: string; orderCode: string; status: string; totalPaise: number; createdAt: string; kind?: string; items: OrderItem[] };

const money = (p: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(p / 100);

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/customer/orders", { cache: "no-store" })
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error || "Please sign in to view orders.");
        return d;
      })
      .then((d) => {
        if (active) setOrders(d.orders || []);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="vx-page">
      <PageHeader
        kicker="Orders"
        title="Order history"
        description="Every store and custom order placed with your account. Open an order for tracking, payment state and its tax invoice."
        actions={<Link href="/shop" className="vx-btn vx-btn--sm">Continue shopping</Link>}
      />

      {error ? (
        <Panel title="Orders unavailable">
          <EmptyState
            title={error}
            text="Sign in with the account used at checkout to see its order history."
            action={<Link href="/account/login" className="vx-btn vx-btn--primary vx-btn--sm">Sign in</Link>}
          />
        </Panel>
      ) : loading ? (
        <div className="vx-stack" aria-busy="true">
          {[0, 1, 2].map((index) => (
            <div key={index} className="vx-skeleton" style={{ height: 116 }} />
          ))}
          <p className="sr-only" role="status">Loading orders…</p>
        </div>
      ) : orders.length === 0 ? (
        <Panel>
          <EmptyState
            title="No orders yet"
            text="Orders appear here as soon as checkout completes. Custom 3D requests are tracked separately."
            action={
              <div className="vx-actions" style={{ justifyContent: "center" }}>
                <Link href="/shop" className="vx-btn vx-btn--primary vx-btn--sm">Browse products</Link>
                <Link href="/custom-3d-printing" className="vx-btn vx-btn--sm">Custom print</Link>
              </div>
            }
          />
        </Panel>
      ) : (
        <div className="vx-stack">
          {orders.map((order) => (
            <Panel key={order.id} flush>
              <div className="vx-row vx-row--between" style={{ padding: "16px 20px", gap: 14, alignItems: "flex-start" }}>
                <div className="vx-row" style={{ gap: 14, alignItems: "flex-start" }}>
                  <span className="vx-order-icon" aria-hidden="true">
                    <Package size={17} />
                  </span>
                  <div>
                    <p style={{ margin: 0, color: "var(--vxl-forest)", fontSize: 14, fontWeight: 700 }}>
                      {order.orderCode}
                      <span className="vx-small vx-muted" style={{ marginLeft: 8, fontWeight: 500 }}>
                        {order.kind === "CUSTOM" ? "Custom order" : "Store order"}
                      </span>
                    </p>
                    <p className="vx-small vx-muted" style={{ margin: "4px 0 0" }}>
                      Placed {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} ·{" "}
                      {order.items.reduce((n, item) => n + item.quantity, 0)} item(s)
                    </p>
                    <ul className="vx-small" style={{ margin: "8px 0 0", padding: 0, listStyle: "none", color: "var(--vx-ink-soft)" }}>
                      {order.items.slice(0, 3).map((item) => (
                        <li key={item.id}>
                          {item.productName} × {item.quantity}
                        </li>
                      ))}
                      {order.items.length > 3 ? <li className="vx-muted">+{order.items.length - 3} more</li> : null}
                    </ul>
                  </div>
                </div>
                <div style={{ textAlign: "right", display: "grid", gap: 8, justifyItems: "end" }}>
                  <StatusBadge status={order.status} />
                  <p className="vx-tabular" style={{ margin: 0, color: "var(--vxl-forest)", fontSize: 15, fontWeight: 700 }}>
                    {money(order.totalPaise)}
                  </p>
                  <Link href={`/account/orders/${order.id}`} className="vx-btn vx-btn--sm">
                    Order details <ArrowUpRight size={13} aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
