"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import CustomerNav from "@/components/CustomerNav";

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
      fetch("/api/customer/orders"),
      fetch("/api/customer/reviews"),
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
  const purchasedItems = delivered.flatMap((order) =>
    order.items.map((item: any) => ({ order, item }))
  );

  return (
    <main className="min-h-screen bg-[#F5F7F3] p-5">
      <div className="mx-auto max-w-4xl">
        <Link href="/account" className="text-xs font-bold text-[#668071]">← My account</Link>
        <h1 className="mt-5 text-3xl font-bold text-[#173D32]">My product reviews</h1>
        <CustomerNav />
        <p className="mt-2 text-sm text-[#718078]">
          Only delivered purchases can be reviewed. Reviews are checked before appearing publicly.
        </p>
        {error && <p className="mt-5 bg-white p-4 text-sm text-red-700">{error}</p>}
        {message && <p className="mt-5 bg-white p-4 text-sm text-[#315D49]">{message}</p>}

        <div className="mt-6 space-y-4">
          {purchasedItems.map(({ order, item }) => (
            <section key={`${order.id}-${item.id}`} className="border border-[#E1E7E1] bg-white p-5">
              <div className="flex flex-wrap justify-between gap-2">
                <div>
                  <h2 className="font-bold text-[#173D32]">{item.productName}</h2>
                  <p className="mt-1 text-xs text-[#718078]">Order {order.orderCode}</p>
                </div>
                <span className="text-xs font-semibold text-[#53745E]">Delivered</span>
              </div>

              {reviewed.has(item.productId) ? (
                <p className="mt-4 text-sm text-[#718078]">
                  Review submitted · {reviews.find((review) => review.productId === item.productId)?.status?.toLowerCase()}
                </p>
              ) : (
                <div className="mt-4 grid gap-3">
                  <label className="text-xs font-semibold text-[#52675A]">
                    Rating
                    <select
                      className="ml-3 border p-2"
                      value={(forms[item.productId] || { rating: 5 }).rating}
                      onChange={(event) => setForms((current) => ({
                        ...current,
                        [item.productId]: { ...(current[item.productId] || { title: "", body: "", rating: 5 }), rating: Number(event.target.value) },
                      }))}
                    >
                      {[5, 4, 3, 2, 1].map((rating) => (
                        <option key={rating} value={rating}>{rating} star{rating > 1 ? "s" : ""}</option>
                      ))}
                    </select>
                  </label>
                  <input
                    className="border p-3 text-sm"
                    placeholder="Review title (optional)"
                    maxLength={100}
                    value={(forms[item.productId] || { title: "" }).title}
                    onChange={(event) => setForms((current) => ({
                      ...current,
                      [item.productId]: { ...(current[item.productId] || { rating: 5, body: "" }), title: event.target.value },
                    }))}
                  />
                  <textarea
                    className="min-h-24 border p-3 text-sm"
                    placeholder="Share your experience (at least 10 characters)"
                    maxLength={2000}
                    value={(forms[item.productId] || { body: "" }).body}
                    onChange={(event) => setForms((current) => ({
                      ...current,
                      [item.productId]: { ...(current[item.productId] || { rating: 5, title: "" }), body: event.target.value },
                    }))}
                  />
                  <button
                    disabled={busy === item.productId}
                    onClick={() => submit(item.productId, order.id)}
                    className="w-fit bg-[#173D32] px-5 py-3 text-xs font-bold text-white disabled:opacity-50"
                  >
                    {busy === item.productId ? "Submitting…" : "Submit review"}
                  </button>
                </div>
              )}
            </section>
          ))}
        </div>
        {!delivered.length && (
          <p className="mt-6 bg-white p-6 text-sm text-[#718078]">
            Reviews become available after an order is marked delivered.
          </p>
        )}
      </div>
    </main>
  );
}
