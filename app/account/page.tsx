"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, FileUp, LogOut, MapPin, MessageSquare, Package, ReceiptText } from "lucide-react";
import { Badge, EmptyState, Panel, PageHeader, StatusBadge } from "@/components/ui/Primitives";

type User = { id: string; name: string; email: string; phone: string | null; createdAt: string };
type Order = { id: string; orderCode: string; status: string; totalPaise: number; createdAt: string; kind: string };

const money = (paise: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(paise / 100);

export default function AccountPage() {
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [unread, setUnread] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/customer/me")
      .then(async (r) => {
        if (!r.ok) throw new Error("Please sign in to view your account.");
        return r.json();
      })
      .then((d) => {
        if (active) setUser(d.user);
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    fetch("/api/customer/orders")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (active && d?.orders) setOrders(d.orders);
      })
      .catch(() => {});
    fetch("/api/customer/notifications", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (active && d) setUnread(d.unreadCount ?? 0);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  async function logout() {
    await fetch("/api/customer/logout", { method: "POST" });
    window.location.href = "/account/login";
  }

  if (loading)
    return (
      <div className="vx-page">
        <div className="vx-stack" aria-busy="true">
          <div className="vx-skeleton" style={{ height: 40, width: "40%" }} />
          <div className="vx-skeleton" style={{ height: 160 }} />
        </div>
        <p className="sr-only" role="status">Loading account…</p>
      </div>
    );

  if (error || !user)
    return (
      <div className="vx-page vx-page--narrow">
        <Panel title="Sign in required" meta="Your account details are private and require an active session.">
          <EmptyState
            title="You are not signed in"
            text="Sign in to see your orders, custom 3D requests, invoices and support history."
            action={
              <div className="vx-actions" style={{ justifyContent: "center" }}>
                <Link href="/account/login" className="vx-btn vx-btn--primary vx-btn--sm">Sign in</Link>
                <Link href="/account/register" className="vx-btn vx-btn--sm">Create an account</Link>
              </div>
            }
          />
        </Panel>
      </div>
    );

  const openOrders = orders.filter((order) => !["DELIVERED", "CANCELLED", "REFUNDED"].includes(order.status));

  return (
    <div className="vx-page">
      <PageHeader
        kicker="Customer account"
        title={<>Welcome back, {user.name.split(" ")[0]}.</>}
        description="Everything tied to your account: store orders, custom print requests, invoices and support threads."
        actions={
          <>
            <Link href="/shop" className="vx-btn vx-btn--sm">Browse the collection</Link>
            <button type="button" onClick={logout} className="vx-btn vx-btn--sm">
              <LogOut size={14} aria-hidden="true" /> Sign out
            </button>
          </>
        }
      />

      <div className="vx-grid vx-grid--3" style={{ marginBottom: 22 }}>
        <div className="vx-stat">
          <span className="vx-stat__label">Open orders</span>
          <span className="vx-stat__value">{openOrders.length}</span>
          <span className="vx-stat__note">{orders.length} order{orders.length === 1 ? "" : "s"} on record</span>
        </div>
        <div className="vx-stat">
          <span className="vx-stat__label">Unread notifications</span>
          <span className="vx-stat__value">{unread === null ? "—" : unread}</span>
          <span className="vx-stat__note">Order, quote and support updates</span>
        </div>
        <div className="vx-stat vx-stat--accent">
          <span className="vx-stat__label">Custom requests</span>
          <span className="vx-stat__value">
            <Link href="/account/custom-requests" style={{ color: "inherit" }}>View</Link>
          </span>
          <span className="vx-stat__note">Track quotations and design approvals</span>
        </div>
      </div>

      <div className="vx-split">
        <Panel
          title="Recent orders"
          meta="Live records from your account."
          flush
          actions={<Link href="/account/orders" className="vx-btn vx-btn--sm vx-btn--quiet">All orders</Link>}
        >
          {orders.length === 0 ? (
            <div style={{ padding: 18 }}>
              <EmptyState
                title="No orders yet"
                text="Once you place an order it will appear here with its status, payment state and invoice."
                action={<Link href="/shop" className="vx-btn vx-btn--sm">Start with the collection</Link>}
              />
            </div>
          ) : (
            <div className="vx-table-wrap">
              <table className="vx-table">
                <thead>
                  <tr>
                    <th scope="col">Order</th>
                    <th scope="col">Status</th>
                    <th scope="col">Total</th>
                    <th scope="col">Placed</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 5).map((order) => (
                    <tr key={order.id}>
                      <td className="vx-table__strong">
                        <Link href={`/account/orders/${order.id}`}>{order.orderCode}</Link>
                        <span className="vx-small vx-muted" style={{ display: "block" }}>{order.kind === "CUSTOM" ? "Custom order" : "Store order"}</span>
                      </td>
                      <td><StatusBadge status={order.status} /></td>
                      <td className="vx-table__num">{money(order.totalPaise)}</td>
                      <td>{new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <div className="vx-stack">
          <Panel title="Account details" meta="Contact the studio if any of these need changing.">
            <dl className="vx-kv">
              <div className="vx-kv__row"><dt>Name</dt><dd>{user.name}</dd></div>
              <div className="vx-kv__row"><dt>Email</dt><dd style={{ overflowWrap: "anywhere" }}>{user.email}</dd></div>
              <div className="vx-kv__row"><dt>Phone</dt><dd>{user.phone || "Not added"}</dd></div>
              <div className="vx-kv__row"><dt>Member since</dt><dd>{new Date(user.createdAt).toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</dd></div>
            </dl>
            <div className="vx-actions" style={{ marginTop: 16 }}>
              <Link href="/account/addresses" className="vx-btn vx-btn--sm"><MapPin size={13} aria-hidden="true" /> Addresses</Link>
              <Link href="/account/support" className="vx-btn vx-btn--sm"><MessageSquare size={13} aria-hidden="true" /> Support</Link>
            </div>
          </Panel>

          <Panel tone="quiet" title="Quick links" bodyless>
            <div className="vx-panel__body vx-grid" style={{ gap: 8 }}>
              {[
                { href: "/account/orders", icon: Package, label: "Orders & invoices" },
                { href: "/account/custom-requests", icon: FileUp, label: "Custom 3D requests" },
                { href: "/account/reviews", icon: ReceiptText, label: "Product reviews" },
                { href: "/account/notifications", icon: Bell, label: "Notifications", badge: unread ? <Badge tone="brand">{unread}</Badge> : null },
              ].map(({ href, icon: Icon, label, badge }) => (
                <Link key={href} href={href} className="vx-row vx-row--between" style={{ padding: "9px 0", borderBottom: "1px solid var(--vx-line)", fontSize: 12.5, fontWeight: 600 }}>
                  <span className="vx-row" style={{ gap: 9 }}>
                    <Icon size={15} aria-hidden="true" style={{ color: "#5c8468" }} />
                    {label}
                  </span>
                  {badge}
                </Link>
              ))}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
