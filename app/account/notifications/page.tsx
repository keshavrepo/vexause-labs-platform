"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import CustomerNav from "@/components/CustomerNav";
type Notice = {
  id: string;
  title: string;
  message: string;
  href: string | null;
  readAt: string | null;
  createdAt: string;
};

export default function NotificationsPage() {
  const [items, setItems] = useState<Notice[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/customer/notifications", { cache: "no-store" });
      if (response.status === 401) {
        window.location.href = "/account/login";
        return;
      }
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load notifications.");
      setItems(data.notifications || []);
      setUnread(data.unreadCount || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function markRead(id: string) {
    const response = await fetch("/api/customer/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId: id }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error || "Could not update notification.");
      return;
    }
    setItems(current => current.map(item => item.id === id ? { ...item, readAt: new Date().toISOString() } : item));
    setUnread(value => Math.max(0, value - 1));
  }

  async function markAllRead() {
    const response = await fetch("/api/customer/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.error || "Could not mark notifications as read.");
      return;
    }
    const now = new Date().toISOString();
    setItems(current => current.map(item => item.readAt ? item : { ...item, readAt: now }));
    setUnread(0);
  }

  return (
    <main className="min-h-screen bg-[#F1F3EF] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Link href="/account" className="text-sm font-semibold text-[#315D49]">← My account</Link>
        <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#78A88C]">VEXAUSE LABS</p>
            <h1 className="mt-2 text-3xl font-bold text-[#0B0F0E]">Notifications</h1><CustomerNav />
            <p className="mt-2 text-sm text-[#68776E]">{unread} unread notification{unread === 1 ? "" : "s"}</p>
          </div>
          <button onClick={markAllRead} disabled={unread === 0}
            className="border border-[#173D32] px-4 py-2.5 text-xs font-bold text-[#173D32] disabled:cursor-not-allowed disabled:opacity-40">
            Mark all as read
          </button>
        </div>

        {error && <p role="alert" className="mt-5 border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
        {loading ? <p className="mt-8 text-sm text-[#68776E]">Loading notifications…</p> :
          items.length === 0 ? (
            <div className="mt-8 border border-[#DCE4DC] bg-white p-8 text-center">
              <h2 className="font-bold text-[#173D32]">You’re all caught up</h2>
              <p className="mt-2 text-sm text-[#68776E]">Order and support updates will appear here when they are generated.</p>
              <Link href="/shop" className="mt-5 inline-block bg-[#173D32] px-5 py-3 text-xs font-bold text-white">Explore 3D prints</Link>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {items.map(item => (
                <article key={item.id} className={`border bg-white p-4 sm:p-5 ${item.readAt ? "border-[#E0E7E0]" : "border-[#78A88C]"}`}>
                  <div className="flex items-start gap-3">
                    <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${item.readAt ? "bg-[#C8D0CA]" : "bg-[#78A88C]"}`} aria-label={item.readAt ? "Read" : "Unread"} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h2 className="font-bold text-[#173D32]">{item.title}</h2>
                        <time className="text-xs text-[#7A857E]" dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</time>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#4F5D54]">{item.message}</p>
                      <div className="mt-4 flex flex-wrap gap-4 text-xs font-bold">
                        {item.href && item.href.startsWith("/") && !item.href.startsWith("//") && <Link href={item.href} className="text-[#315D49] underline underline-offset-4">View details</Link>}
                        {!item.readAt && <button onClick={() => markRead(item.id)} className="text-[#315D49] underline underline-offset-4">Mark as read</button>}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        <p className="mt-6 text-xs text-[#7A857E]">Showing the latest 50 notifications.</p>
      </div>
    </main>
  );
}
