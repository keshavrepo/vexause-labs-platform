"use client";

import { useState } from "react";
import Link from "next/link";

export default function RegisterPage() {
  const [name,setName]=useState("");
  const [email,setEmail]=useState("");
  const [phone,setPhone]=useState("");
  const [password,setPassword]=useState("");
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);

  async function submit(e:React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r=await fetch("/api/customer/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,email,phone:phone||undefined,password})});
      const d=await r.json();
      if(!r.ok)throw new Error(d.error);
      window.location.href="/account";
    } catch(e) {
      setError(e instanceof Error?e.message:"Registration failed");
    } finally {
      setBusy(false);
    }
  }

  return <main className="vxl-auth-page">
    <div className="vxl-auth-layout">
      <aside className="vxl-auth-aside">
        <Link href="/" aria-label="VEXAUSE LABS home" className="inline-flex w-fit items-center gap-3 text-xs font-bold tracking-[.16em]"><span className="grid h-9 w-9 place-items-center rounded-[12px_12px_12px_4px] border border-[#c8f36a]/40 text-lg text-[#c8f36a]">V</span> VEXAUSE LABS</Link>
        <div><p className="eyebrow !text-[#c8f36a]">Create an account</p><h1>Your projects and orders, in one place.</h1><p className="mt-5">Save your details and follow your order journey from your account.</p></div>
        <Link href="/shop" className="relative z-10 text-xs font-semibold text-[#d9e3d9] underline underline-offset-4">Browse the store</Link>
      </aside>
      <form onSubmit={submit} className="vxl-auth-form">
        <Link href="/shop" className="text-xs font-bold text-[#668071]">← Return to store</Link>
        <h2 className="mt-6 text-3xl font-semibold tracking-tight text-[#173D32]">Create your account</h2>
        <p className="mt-2 text-sm text-[#748178]">Save your details and manage your orders.</p>
        {error&&<p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">{error}</p>}
        <label className="mt-6 block text-xs font-bold text-[#3e5045]">Full name<input required minLength={2} value={name} onChange={e=>setName(e.target.value)} className="mt-2 h-12 w-full border border-[#dce4dc] bg-[#fbfcf9] px-3 text-sm"/></label>
        <label className="mt-4 block text-xs font-bold text-[#3e5045]">Email<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-2 h-12 w-full border border-[#dce4dc] bg-[#fbfcf9] px-3 text-sm"/></label>
        <label className="mt-4 block text-xs font-bold text-[#3e5045]">Phone (optional)<input value={phone} onChange={e=>setPhone(e.target.value)} className="mt-2 h-12 w-full border border-[#dce4dc] bg-[#fbfcf9] px-3 text-sm"/></label>
        <label className="mt-4 block text-xs font-bold text-[#3e5045]">Password (minimum 10 characters)<input required minLength={10} type="password" autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} className="mt-2 h-12 w-full border border-[#dce4dc] bg-[#fbfcf9] px-3 text-sm"/></label>
        <button disabled={busy} className="button-primary mt-6 w-full disabled:opacity-50">{busy?"Creating account…":"Create account"}</button>
        <p className="mt-5 text-center text-xs text-[#718078]">Already registered? <Link href="/account/login" className="font-bold text-[#173D32] underline underline-offset-4">Sign in</Link></p>
      </form>
    </div>
  </main>;
}
