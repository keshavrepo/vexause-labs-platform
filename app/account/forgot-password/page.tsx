"use client";

import { useState } from "react";
import Link from "next/link";
import AuthShell from "@/components/AuthShell";
import { Alert } from "@/components/ui/Primitives";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const r = await fetch("/api/customer/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Request failed");
      setMessage(d.message);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to submit request.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Customer account"
      title="Reset your password"
      description="Enter the email address linked to your account. If it exists, a single-use reset link is emailed to it."
    >
      <form onSubmit={submit} className="vx-form">
        <label className="vx-field">
          <span className="vx-label">Email address</span>
          <input required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="vx-input" />
        </label>
        {error ? <Alert tone="danger">{error}</Alert> : null}
        {message ? <Alert tone="ok">{message}</Alert> : null}
        <button disabled={busy} className="vx-btn vx-btn--primary vx-btn--block">
          {busy ? "Sending…" : "Send reset link"}
        </button>
        <p className="vx-small vx-muted" style={{ textAlign: "center", margin: 0 }}>
          Remembered it? <Link href="/account/login" style={{ fontWeight: 700, textDecoration: "underline" }}>Sign in</Link>
        </p>
      </form>
    </AuthShell>
  );
}
