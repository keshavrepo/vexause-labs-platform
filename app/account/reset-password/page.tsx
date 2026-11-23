"use client";

import { useState } from "react";
import Link from "next/link";
import AuthShell from "@/components/AuthShell";
import { Alert } from "@/components/ui/Primitives";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setError("Reset token is missing.");
      return;
    }
    setBusy(true);
    try {
      const r = await fetch("/api/customer/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Reset failed");
      setMessage(d.message);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to reset password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Customer account"
      title="Choose a new password"
      description="Reset links are single-use and expire. Use at least 10 characters."
    >
      <form onSubmit={submit} className="vx-form">
        <label className="vx-field">
          <span className="vx-label">New password</span>
          <input required minLength={10} maxLength={128} type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="vx-input" />
        </label>
        <label className="vx-field">
          <span className="vx-label">Confirm new password</span>
          <input required type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="vx-input" />
        </label>
        {error ? <Alert tone="danger">{error}</Alert> : null}
        {message ? (
          <Alert tone="ok">
            {message}{" "}
            <Link href="/account/login" style={{ fontWeight: 700, textDecoration: "underline" }}>Sign in</Link>
          </Alert>
        ) : null}
        <button disabled={busy || !!message} className="vx-btn vx-btn--primary vx-btn--block">
          {busy ? "Updating…" : "Update password"}
        </button>
      </form>
    </AuthShell>
  );
}
