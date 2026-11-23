"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Alert, Badge, EmptyState, PageHeader, Panel } from "@/components/ui/Primitives";

type ReviewForm = { rating: number; title: string; body: string };

export default function AccountReviewsPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [forms, setForms] = useState<Record<string, ReviewForm>>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");

  async function load() {
    const [ordersResponse, reviewsResponse] = await Promise.all([
      fetch("/api/customer/orders", { cache: "no-store" }),
      fetch("/api/customer/reviews", { cache: "no-store" }),
    ]);
    const ordersData = await ordersResponse.json();
    const reviewsData = await reviewsResponse.json();
    if (!ordersResponse.ok || !reviewsResponse.ok) {
      throw new Error(ordersData.error || reviewsData.error || "Please sign in to manage reviews.");
    }
    setOrders(ordersData.orders || []);
    setReviews(reviewsData.reviews || []);
  }

  useEffect(() => {
    load().catch((reason) => setError(reason instanceof Error ? reason.message : "Could not load reviews."));
  }, []);

  const reviewed = new Set(reviews.map((review) => review.productId));

  async function submit(productId: string, orderId: string) {
    const form = forms[productId] || { rating: 5, title: "", body: "" };
    setBusy(productId);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/customer/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, orderId, ...form }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not submit review.");
      setMessage("Review submitted. It will appear publicly after moderation.");
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not submit review.");
    } finally {
      setBusy("");
    }
  }

  const delivered = orders.filter((order) => order.status === "DELIVERED" && order.kind === "STORE");
  const purchasedItems = delivered.flatMap((order) => order.items.map((item: any) => ({ order, item })));

  return (
    <div className="vx-page">
      <PageHeader
        kicker="Account"
        title="Product reviews"
        description="Only delivered purchases can be reviewed. Every review is checked before it appears publicly — nothing is auto-published."
        actions={<Link href="/account/orders" className="vx-btn vx-btn--sm">View orders</Link>}
      />

      {error ? <Alert tone="danger">{error}</Alert> : null}
      {message ? <Alert tone="ok">{message}</Alert> : null}

      {purchasedItems.length === 0 ? (
        <EmptyState
          title={error ? "Reviews unavailable" : "Nothing to review yet"}
          text="Reviews become available after an order is marked delivered."
          action={<Link href="/shop" className="vx-btn vx-btn--sm">Browse the collection</Link>}
        />
      ) : (
        <div className="vx-stack">
          {purchasedItems.map(({ order, item }) => {
            const existing = reviews.find((review) => review.productId === item.productId);
            const form = forms[item.productId] || { rating: 5, title: "", body: "" };
            const update = (patch: Partial<ReviewForm>) =>
              setForms((current) => ({
                ...current,
                [item.productId]: { ...(current[item.productId] || { rating: 5, title: "", body: "" }), ...patch },
              }));
            return (
              <Panel key={`${order.id}-${item.id}`} title={item.productName} meta={`Order ${order.orderCode} · delivered`}>
                <div className="vx-panel__body">
                  {reviewed.has(item.productId) ? (
                    <div className="vx-alert vx-alert--ok">
                      Review submitted · status {String(existing?.status || "pending").toLowerCase()}
                      {existing?.rating ? ` · ${existing.rating}/5` : ""}
                    </div>
                  ) : (
                    <div className="vx-form">
                      <div className="vx-grid vx-grid--2" style={{ gap: 12 }}>
                        <label className="vx-field">
                          <span className="vx-label">Rating</span>
                          <select
                            className="vx-select"
                            value={form.rating}
                            onChange={(event) => update({ rating: Number(event.target.value) })}
                          >
                            {[5, 4, 3, 2, 1].map((rating) => (
                              <option key={rating} value={rating}>
                                {rating} star{rating > 1 ? "s" : ""}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="vx-field">
                          <span className="vx-label">Review title <span>(optional)</span></span>
                          <input
                            className="vx-input"
                            placeholder="Summarise your experience"
                            maxLength={100}
                            value={form.title}
                            onChange={(event) => update({ title: event.target.value })}
                          />
                        </label>
                      </div>
                      <label className="vx-field">
                        <span className="vx-label">Your review</span>
                        <textarea
                          className="vx-textarea"
                          placeholder="Share your experience (at least 10 characters)"
                          maxLength={2000}
                          value={form.body}
                          onChange={(event) => update({ body: event.target.value })}
                        />
                        <span className="vx-hint">{form.body.length}/2000 characters</span>
                      </label>
                      <div className="vx-row vx-row--between" style={{ gap: 12 }}>
                        <p className="vx-small vx-muted" style={{ margin: 0 }}>
                          <Badge tone="neutral">Pending review</Badge> Reviews are moderated for accuracy and abuse.
                        </p>
                        <button
                          type="button"
                          disabled={busy === item.productId}
                          onClick={() => submit(item.productId, order.id)}
                          className="vx-btn vx-btn--primary"
                        >
                          {busy === item.productId ? "Submitting…" : "Submit review"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </Panel>
            );
          })}
        </div>
      )}
    </div>
  );
}
