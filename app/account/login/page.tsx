"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AuthShell from "@/components/AuthShell";
import { Alert } from "@/components/ui/Primitives";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const reason = new URLSearchParams(window.location.search).get("google_error");
    if (reason) setError(reason);
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/customer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error);
      window.location.href = "/account";
    } catch (error) {
      setError(error instanceof Error ? error.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Customer account"
      title="Welcome back"
      description="Sign in to follow orders, approve custom designs and keep your delivery details current."
    >
      <form onSubmit={submit} className="vx-form">
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <label className="vx-field">
          <span className="vx-label">Email</span>
          <input required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="vx-input" />
        </label>
        <label className="vx-field">
          <span className="vx-label">Password</span>
          <input required type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="vx-input" />
        </label>
        <button disabled={busy} className="vx-btn vx-btn--primary vx-btn--block">
          {busy ? "Signing in…" : "Sign in"}
        </button>
        <div className="vx-auth__divider"><span>or</span></div>
        <a href="/api/customer/google/start" className="vx-btn vx-btn--block vx-btn--google">Continue with Google</a>
        <div className="vx-auth__meta">
          <Link href="/account/forgot-password">Forgot password?</Link>
          <span>New here? <Link href="/account/register">Create account</Link></span>
        </div>
      </form>
    </AuthShell>
  );
}
