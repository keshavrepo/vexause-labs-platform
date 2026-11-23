"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function LoginPage() {
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);

  useEffect(()=>{
    const reason=new URLSearchParams(window.location.search).get("google_error");
    if(reason)setError(reason);
  },[]);

  async function submit(e:React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r=await fetch("/api/customer/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,password})});
      const d=await r.json();
      if(!r.ok)throw new Error(d.error);
      window.location.href="/account";
    } catch(e) {
      setError(e instanceof Error?e.message:"Login failed");
    } finally {
      setBusy(false);
    }
  }

  return <main className="vxl-auth-page">
    <div className="vxl-auth-layout">
      <aside className="vxl-auth-aside">
        <Link href="/" aria-label="VEXAUSE LABS home" className="inline-flex w-fit items-center gap-3 text-xs font-bold tracking-[.16em]"><span className="grid h-9 w-9 place-items-center rounded-[12px_12px_12px_4px] border border-[#c8f36a]/40 text-lg text-[#c8f36a]">V</span> VEXAUSE LABS</Link>
        <div><p className="eyebrow !text-[#c8f36a]">Your workspace</p><h1>Pick up where your next idea begins.</h1><p className="mt-5">Sign in to manage your details, orders and custom requests.</p></div>
        <Link href="/shop" className="relative z-10 text-xs font-semibold text-[#d9e3d9] underline underline-offset-4">Browse the store</Link>
      </aside>
      <form onSubmit={submit} className="vxl-auth-form">
        <Link href="/shop" className="text-xs font-bold text-[#668071]">← Return to store</Link>
        <h2 className="mt-6 text-3xl font-semibold tracking-tight text-[#173D32]">Welcome back</h2>
        <p className="mt-2 text-sm text-[#748178]">Sign in to your VEXAUSE account.</p>
        {error&&<p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">{error}</p>}
        <label className="mt-6 block text-xs font-bold text-[#3e5045]">Email<input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-2 h-12 w-full border border-[#dce4dc] bg-[#fbfcf9] px-3 text-sm"/></label>
        <label className="mt-4 block text-xs font-bold text-[#3e5045]">Password<input required type="password" autoComplete="current-password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-2 h-12 w-full border border-[#dce4dc] bg-[#fbfcf9] px-3 text-sm"/></label>
        <button disabled={busy} className="button-primary mt-6 w-full disabled:opacity-50">{busy?"Signing in…":"Sign in"}</button>
        <div className="my-5 flex items-center gap-3 text-[10px] text-[#89948C]"><span className="h-px flex-1 bg-[#E0E7E0]"/><span>OR</span><span className="h-px flex-1 bg-[#E0E7E0]"/></div>
        <a href="/api/customer/google/start" className="flex min-h-12 w-full items-center justify-center rounded-full border border-[#D5DDD6] text-xs font-bold text-[#173D32] transition hover:bg-[#f4f7f2]">Continue with Google</a>
        <p className="mt-5 flex justify-between text-xs"><Link href="/account/forgot-password" className="font-bold text-[#315D49] underline">Forgot password?</Link><span className="text-[#718078]">New here? <Link href="/account/register" className="font-bold text-[#173D32]">Create account</Link></span></p>
      </form>
    </div>
  </main>;
}
