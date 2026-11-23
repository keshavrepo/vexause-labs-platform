"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AuthShell from "@/components/AuthShell";
import { Alert } from "@/components/ui/Primitives";

export default function VerifyEmailPage() {
  const [message, setMessage] = useState("Verifying your email link…");
  const [error, setError] = useState("");

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setError("Verification token is missing.");
      setMessage("");
      return;
    }
    fetch("/api/customer/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error || "Verification failed.");
        return d;
      })
      .then((d) => setMessage(d.message))
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Unable to verify email.");
        setMessage("");
      });
  }, []);

  return (
    <AuthShell eyebrow="Customer account" title="Email verification" description="Confirming the address linked to your VEXAUSE LABS account.">
      {message ? <Alert tone="info">{message}</Alert> : null}
      {error ? <Alert tone="danger">{error}</Alert> : null}
      <div className="vx-actions" style={{ marginTop: 18 }}>
        <Link href="/account/login" className="vx-btn vx-btn--primary vx-btn--sm">Continue to sign in</Link>
        <Link href="/shop" className="vx-btn vx-btn--sm">Browse store</Link>
      </div>
    </AuthShell>
  );
}
