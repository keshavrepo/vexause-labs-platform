"use client";

import { useState } from "react";
import Link from "next/link";
import AuthShell from "@/components/AuthShell";
import { Alert } from "@/components/ui/Primitives";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/customer/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone: phone || undefined, password }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error);
      window.location.href = "/account";
    } catch (error) {
      setError(error instanceof Error ? error.message : "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Create an account"
      title="Your projects and orders, in one place"
      description="Save your delivery details and follow each order from approval through to delivery."
    >
      <form onSubmit={submit} className="vx-form">
        {error ? <Alert tone="danger">{error}</Alert> : null}
        <label className="vx-field">
          <span className="vx-label">Full name</span>
          <input required minLength={2} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} className="vx-input" />
        </label>
        <label className="vx-field">
          <span className="vx-label">Email</span>
          <input required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="vx-input" />
        </label>
        <label className="vx-field">
          <span className="vx-label">Phone <span className="vx-muted">(optional)</span></span>
          <input autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="vx-input" />
        </label>
        <label className="vx-field">
          <span className="vx-label">Password <span className="vx-muted">(minimum 10 characters)</span></span>
          <input required minLength={10} type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="vx-input" />
        </label>
        <button disabled={busy} className="vx-btn vx-btn--primary vx-btn--block">
          {busy ? "Creating account…" : "Create account"}
        </button>
        <div className="vx-auth__divider"><span>or</span></div>
        <a href="/api/customer/google/start" className="vx-btn vx-btn--block vx-btn--google">Continue with Google</a>
        <div className="vx-auth__meta">
          <span>Already registered? <Link href="/account/login">Sign in</Link></span>
        </div>
      </form>
    </AuthShell>
  );
}
