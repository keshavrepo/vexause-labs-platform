"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

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
      const data = await response.json().catch(() => ({}));
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
    <div className="vx-page vx-page--mid">
      <header className="vx-page-head">
        <div>
          <p className="vx-kicker">Account · Updates</p>
          <h1 className="vx-title">Notifications</h1>
          <p className="vx-lead">
            Order, quotation and support updates for your account. {unread} unread notification{unread === 1 ? "" : "s"}.
          </p>
        </div>
        <div className="vx-actions">
          <button onClick={markAllRead} disabled={unread === 0} className="vx-btn vx-btn--sm">
            Mark all as read
          </button>
        </div>
      </header>

        {error && <p role="alert" className="vx-alert vx-alert--danger">{error}</p>}
        {loading ? <div className="vx-stack" aria-busy="true">{[0, 1, 2].map((index) => <div key={index} className="vx-skeleton" style={{ height: 108 }} />)}<p className="sr-only" role="status">Loading notifications…</p></div> :
          items.length === 0 ? (
            <div className="vx-empty">
              <p className="vx-empty__title">You&apos;re all caught up</p>
              <p className="vx-empty__text">Order and support updates will appear here when they are generated.</p>
              <Link href="/shop" className="vx-btn vx-btn--sm">Explore 3D prints</Link>
            </div>
          ) : (
            <div className="vx-stack" style={{ gap: 12 }}>
              {items.map(item => (
                <article key={item.id} className="vx-panel" style={{ padding: "16px 18px", borderColor: item.readAt ? undefined : "#b9d3c0" }}>
                  <div className="flex items-start gap-3">
                    <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${item.readAt ? "bg-[#C8D0CA]" : "bg-[#78A88C]"}`} aria-label={item.readAt ? "Read" : "Unread"} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h2 className="font-bold text-[#173D32]">{item.title}</h2>
                        <time className="text-xs text-[#7A857E]" dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</time>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#4F5D54]">{item.message}</p>
                      <div className="vx-row" style={{ marginTop: 12, gap: 14 }}>
                        {item.href && item.href.startsWith("/") && !item.href.startsWith("//") && <Link href={item.href} className="text-[#315D49] underline underline-offset-4">View details</Link>}
                        {!item.readAt && <button onClick={() => markRead(item.id)} className="text-[#315D49] underline underline-offset-4">Mark as read</button>}
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        <p className="vx-small vx-muted" style={{ marginTop: 20 }}>Showing the latest 50 notifications.</p>
    </div>
  );
}
