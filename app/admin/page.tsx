"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowUpRight, Clock3, FileUp, Package, ReceiptText, Wallet } from "lucide-react";
import { Alert, EmptyState, Panel, Stat, StatusBadge } from "@/components/ui/Primitives";

type Overview = {
  kpis: {
    orders: number;
    products: number;
    customers: number;
    customRequests: number;
    verifiedRevenuePaise: number;
    verifiedPayments: number;
    pendingQuotes: number;
  };
  orderStatuses: { status: string; count: number }[];
  recentOrders: { id: string; orderCode: string; status: string; kind: string; totalPaise: number; createdAt: string }[];
};

const money = (paise: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(paise / 100);

const pipeline: Array<[string, string]> = [
  ["New enquiry", "Review uploaded model, references and requirements."],
  ["Feasibility review", "Confirm printability, material and print constraints."],
  ["Quotation sent", "Customer reviews scope, price and timeline."],
  ["Awaiting approval", "Production starts only after customer acceptance."],
];

const safeguards: Array<[string, string]> = [
  ["Payment verification", "Orders mark paid only after server-side signature checks."],
  ["Private customer files", "CAD uploads are never served from public URLs."],
  ["Quote approval", "No custom production without accepted quotation."],
  ["Inventory control", "Server recalculates price and stock when orders are placed."],
];

export default function AdminOverviewPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/admin/analytics", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("Live metrics are unavailable for this session.");
        return response.json();
      })
      .then((payload: Overview) => {
        if (active) setData(payload);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Live metrics are unavailable.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div>
      <header className="vx-page-head" style={{ borderBottom: 0, paddingBottom: 0, marginBottom: 22 }}>
        <div>
          <p className="vx-kicker">Operational overview</p>
          <h2 className="vx-title" style={{ fontSize: "clamp(26px, 3vw, 36px)" }}>A clear view of the studio.</h2>
          <p className="vx-lead">
            Live order, quotation and catalogue signals from your database. Values appear only when the API returns real records.
          </p>
        </div>
        <div className="vx-actions">
          <Link href="/admin/products" className="vx-btn vx-btn--primary">Manage products</Link>
          <Link href="/admin/custom-requests" className="vx-btn">Custom requests queue</Link>
        </div>
      </header>

      {error ? <Alert tone="warn">{error} Figures below are left blank rather than estimated.</Alert> : null}

      <div className="vx-grid vx-grid--4" style={{ marginTop: 18 }}>
        <Stat
          label="Verified revenue"
          value={loading ? "…" : data ? money(data.kpis.verifiedRevenuePaise) : "—"}
          note={data ? `${data.kpis.verifiedPayments} verified payment records` : "Awaiting live payment data"}
          accent
        />
        <Stat
          label="Orders"
          value={loading ? "…" : data ? String(data.kpis.orders) : "—"}
          note={data ? `${data.orderStatuses.length} statuses in use` : "Awaiting order records"}
        />
        <Stat
          label="Custom requests"
          value={loading ? "…" : data ? String(data.kpis.customRequests) : "—"}
          note={data ? `${data.kpis.pendingQuotes} quotes awaiting response` : "Awaiting custom request data"}
        />
        <Stat
          label="Published products"
          value={loading ? "…" : data ? String(data.kpis.products) : "—"}
          note={data ? `${data.kpis.customers} registered customers` : "Awaiting catalogue data"}
        />
      </div>

      <div className="vx-split" style={{ marginTop: 22 }}>
        <Panel
          title="Recent orders"
          meta="Newest records from the order table. No projected or sample figures."
          flush
          actions={<Link href="/admin/orders" className="vx-btn vx-btn--sm vx-btn--quiet">All orders <ArrowUpRight size={14} /></Link>}
        >
          <div style={{ padding: "0 6px 6px" }}>
            {data && data.recentOrders.length > 0 ? (
              <div className="vx-table-wrap">
                <table className="vx-table">
                  <thead>
                    <tr>
                      <th scope="col">Order</th>
                      <th scope="col">Type</th>
                      <th scope="col">Status</th>
                      <th scope="col">Total</th>
                      <th scope="col">Placed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentOrders.slice(0, 6).map((order) => (
                      <tr key={order.id}>
                        <td className="vx-table__strong">{order.orderCode}</td>
                        <td>{order.kind === "CUSTOM" ? "Custom" : "Store"}</td>
                        <td><StatusBadge status={order.status} /></td>
                        <td className="vx-table__num">{money(order.totalPaise)}</td>
                        <td>{new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: 18 }}>
                <EmptyState
                  title={loading ? "Loading order records…" : "No orders recorded yet"}
                  text="Orders appear here as soon as a verified checkout is completed. Nothing is simulated."
                />
              </div>
            )}
          </div>
        </Panel>

        <div className="vx-stack">
          <Panel title="Quote-first workflow" meta="How every custom 3D print request moves through the studio.">
            <ol className="vx-timeline">
              {pipeline.map(([title, text], index) => (
                <li className="vx-timeline__item" key={title}>
                  <span className="vx-timeline__dot" aria-hidden="true" />
                  <div>
                    <p className="vx-timeline__title">
                      {String(index + 1).padStart(2, "0")} · {title}
                    </p>
                    <p className="vx-timeline__meta">{text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Panel>

          <Panel tone="quiet" title="Safeguards" meta="Controls that protect customers and the business.">
            <ul className="vx-stack" style={{ gap: 14, listStyle: "none", margin: 0, padding: 0 }}>
              {safeguards.map(([title, text]) => (
                <li key={title} style={{ display: "flex", gap: 10 }}>
                  <Clock3 size={15} style={{ marginTop: 2, color: "#5c8468", flex: "none" }} aria-hidden="true" />
                  <div>
                    <p style={{ margin: 0, color: "var(--vxl-forest)", fontSize: 12, fontWeight: 700 }}>{title}</p>
                    <p className="vx-small vx-muted" style={{ margin: "3px 0 0" }}>{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      </div>

      <div className="vx-grid vx-grid--3" style={{ marginTop: 22 }}>
        {[
          { href: "/admin/custom-requests", icon: FileUp, title: "Custom 3D queue", text: "Review files, send quotations and approve designs." },
          { href: "/admin/production", icon: Package, title: "Production board", text: "Track accepted work through the workshop." },
          { href: "/admin/finance", icon: Wallet, title: "Finance ledger", text: "Verified collections, refunds and reconciliation." },
          { href: "/admin/tax-settings", icon: ReceiptText, title: "GST & invoices", text: "Tax rates, place of supply and printable invoices." },
        ].map(({ href, icon: Icon, title, text }) => (
          <Link key={href} href={href} className="vx-panel" style={{ padding: 18 }}>
            <Icon size={18} style={{ color: "#5c8468" }} aria-hidden="true" />
            <p style={{ margin: "12px 0 0", color: "var(--vxl-forest)", fontSize: 13, fontWeight: 700 }}>{title}</p>
            <p className="vx-small vx-muted" style={{ margin: "5px 0 0" }}>{text}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
