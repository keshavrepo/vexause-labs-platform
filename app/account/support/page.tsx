"use client";

import { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
import { Alert, EmptyState, PageHeader, Panel, StatusBadge } from "@/components/ui/Primitives";

type Request = {
  id: string;
  requestCode: string;
  type: string;
  status: string;
  subject: string;
  message: string;
  adminReply: string | null;
  createdAt: string;
  order: { orderCode: string; status: string } | null;
  events: { actorRole: string; fromStatus: string | null; toStatus: string | null; message: string | null; createdAt: string }[];
};
type Order = { id: string; orderCode: string; status: string };

export default function SupportPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [type, setType] = useState("GENERAL");
  const [orderId, setOrderId] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    const [a, b] = await Promise.all([fetch("/api/customer/support", { cache: "no-store" }), fetch("/api/customer/orders", { cache: "no-store" })]);
    if (a.ok) {
      const d = await a.json();
      setRequests(d.requests || []);
    }
    if (b.ok) {
      const d = await b.json();
      setOrders(d.orders || []);
    }
  }

  useEffect(() => {
    load().catch(() => setError("Could not load support requests."));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/customer/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, orderId: orderId || undefined, subject, message }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Submission failed");
      setSubject("");
      setMessage("");
      setOrderId("");
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  const eligible = orders.filter((o) =>
    type === "CANCELLATION"
      ? ["PENDING_REVIEW", "AWAITING_PAYMENT"].includes(o.status)
      : ["RETURN", "REFUND"].includes(type)
        ? o.status === "DELIVERED"
        : true,
  );

  return (
    <div className="vx-page">
      <PageHeader
        kicker="Account"
        title="Help &amp; support"
        description="Submit a request and follow its review history. Cancellations, returns and refunds are reviewed by the team — they are never automatic."
      />

      {error ? <Alert tone="danger">{error}</Alert> : null}

      <div className="vx-split" style={{ marginTop: 20 }}>
        <div className="vx-stack">
          <Panel title="Create a support request" meta="Requests are linked to your account and, when relevant, to an order." bodyless>
            <form onSubmit={submit} className="vx-panel__body vx-form">
              <div className="vx-grid vx-grid--2" style={{ gap: 12 }}>
                <label className="vx-field">
                  <span className="vx-label">Request type</span>
                  <select
                    value={type}
                    onChange={(e) => {
                      setType(e.target.value);
                      setOrderId("");
                    }}
                    className="vx-select"
                  >
                    <option value="GENERAL">General support</option>
                    <option value="CANCELLATION">Cancel an order</option>
                    <option value="RETURN">Return an order</option>
                    <option value="REFUND">Refund enquiry</option>
                  </select>
                </label>
                {type !== "GENERAL" ? (
                  <label className="vx-field">
                    <span className="vx-label">Order *</span>
                    <select required value={orderId} onChange={(e) => setOrderId(e.target.value)} className="vx-select">
                      <option value="">Choose eligible order</option>
                      {eligible.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.orderCode} · {o.status.replaceAll("_", " ")}
                        </option>
                      ))}
                    </select>
                    <span className="vx-hint">
                      Cancellations are available before production; return and refund enquiries after delivery.
                    </span>
                  </label>
                ) : null}
                <label className="vx-field" style={{ gridColumn: "1 / -1" }}>
                  <span className="vx-label">Subject *</span>
                  <input required minLength={4} maxLength={120} value={subject} onChange={(e) => setSubject(e.target.value)} className="vx-input" />
                </label>
                <label className="vx-field" style={{ gridColumn: "1 / -1" }}>
                  <span className="vx-label">Explain the issue *</span>
                  <textarea required minLength={10} maxLength={2000} rows={5} value={message} onChange={(e) => setMessage(e.target.value)} className="vx-textarea" />
                  <span className="vx-hint">{message.length}/2000 characters</span>
                </label>
              </div>
              <div className="vx-row vx-row--between" style={{ gap: 12 }}>
                <p className="vx-small vx-muted" style={{ margin: 0, maxWidth: "44ch" }}>
                  Submitting a request does not approve a cancellation, return or refund. You will receive a reply in
                  this account.
                </p>
                <button disabled={busy} className="vx-btn vx-btn--primary">
                  {busy ? "Submitting…" : "Submit request"}
                </button>
              </div>
            </form>
          </Panel>

          <div>
            <h2 className="vx-section-title">Your requests</h2>
            {requests.length === 0 ? (
              <EmptyState title="No support requests yet" text="When you raise a request it will appear here with its full review history." />
            ) : (
              <div className="vx-stack" style={{ gap: 12 }}>
                {requests.map((request) => (
                  <Panel key={request.id} flush>
                    <div style={{ padding: "16px 20px" }}>
                      <div className="vx-row vx-row--between" style={{ gap: 10 }}>
                        <p style={{ margin: 0, color: "var(--vxl-forest)", fontSize: 12.5, fontWeight: 700 }}>
                          {request.requestCode}
                          <span className="vx-muted" style={{ fontWeight: 500 }}> · {request.type.replaceAll("_", " ")}</span>
                        </p>
                        <div className="vx-row" style={{ gap: 8 }}>
                          <StatusBadge status={request.status} />
                        </div>
                      </div>
                      <p style={{ margin: "10px 0 0", color: "var(--vxl-forest)", fontSize: 13, fontWeight: 650 }}>{request.subject}</p>
                      <p style={{ margin: "4px 0 0", color: "var(--vx-ink-soft)", fontSize: 12.5, lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
                        {request.message}
                      </p>
                      {request.order ? (
                        <p className="vx-small vx-muted" style={{ margin: "8px 0 0" }}>
                          Order {request.order.orderCode} · {request.order.status.replaceAll("_", " ")}
                        </p>
                      ) : null}
                      {request.adminReply ? (
                        <div className="vx-alert vx-alert--ok" style={{ marginTop: 12, display: "grid", gap: 3 }}>
                          <strong style={{ fontSize: 11.5 }}>Team response</strong>
                          <span style={{ color: "var(--vx-ink-soft)", whiteSpace: "pre-wrap" }}>{request.adminReply}</span>
                        </div>
                      ) : null}
                    </div>
                    {request.events?.length ? (
                      <div className="vx-panel__foot">
                        <p className="vx-label" style={{ marginBottom: 8 }}>Activity</p>
                        <ol className="vx-timeline">
                          {request.events.map((event, index) => (
                            <li className="vx-timeline__item" key={index} style={{ paddingBottom: 12 }}>
                              <span className="vx-timeline__dot" aria-hidden="true" />
                              <div>
                                <p className="vx-timeline__title">{event.toStatus ? event.toStatus.replaceAll("_", " ") : "Update"} · {event.actorRole}</p>
                                <p className="vx-timeline__meta">
                                  {new Date(event.createdAt).toLocaleString("en-IN")}
                                  {event.message ? ` — ${event.message}` : ""}
                                </p>
                              </div>
                            </li>
                          ))}
                        </ol>
                      </div>
                    ) : null}
                  </Panel>
                ))}
              </div>
            )}
          </div>
        </div>

        <aside className="vx-order-aside">
          <Panel tone="quiet" title="How support works" meta="Typical review path for a request.">
            <ol className="vx-timeline">
              {[
                ["Submitted", "Your request is recorded with a reference code."],
                ["Review", "The team checks order state, eligibility and payment records."],
                ["Reply", "A written response is added to the request in this account."],
                ["Action", "Approved refunds and cancellations are processed separately."],
              ].map(([title, text], index) => (
                <li className="vx-timeline__item" key={title}>
                  <span className="vx-timeline__dot" aria-hidden="true" />
                  <div>
                    <p className="vx-timeline__title">{String(index + 1).padStart(2, "0")} · {title}</p>
                    <p className="vx-timeline__meta">{text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Panel>
          <Panel title="Prefer email?" meta="Contact details come from store settings.">
            <p className="vx-small vx-muted" style={{ marginTop: 0 }}>
              Business contact details are published on the contact page. Requests made here stay linked to your order.
            </p>
            <a href="/contact" className="vx-btn vx-btn--sm" style={{ marginTop: 10 }}>
              <MessageSquare size={13} aria-hidden="true" /> Contact details
            </a>
          </Panel>
        </aside>
      </div>
    </div>
  );
}
