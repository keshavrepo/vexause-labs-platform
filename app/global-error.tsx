"use client";

import Link from "next/link";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <main className="vx-page vx-page--narrow" style={{ padding: "80px 20px" }}>
          <p className="vx-kicker">VEXAUSE LABS · Something went wrong</p>
          <h1 className="vx-title" style={{ fontSize: "clamp(26px, 4vw, 38px)", marginTop: 8 }}>
            The page could not be loaded.
          </h1>
          <p className="vx-lead" style={{ marginTop: 12 }}>
            This is usually temporary. Try again, or return to the store.
          </p>
          {error.digest ? (
            <p className="vx-small vx-muted" style={{ marginTop: 10 }}>Reference: {error.digest}</p>
          ) : null}
          <div className="vx-actions" style={{ marginTop: 22 }}>
            <button type="button" onClick={reset} className="vx-btn vx-btn--primary vx-btn--sm">Try again</button>
            <Link href="/" className="vx-btn vx-btn--sm">Return home</Link>
            <Link href="/shop" className="vx-btn vx-btn--quiet vx-btn--sm">Browse the store</Link>
          </div>
        </main>
      </body>
    </html>
  );
}
