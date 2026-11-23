"use client";
import { useEffect,useState } from "react";
import Link from "next/link";
export default function VerifyEmailPage(){
 const [message,setMessage]=useState("Verifying your email link…");const [error,setError]=useState("");
 useEffect(()=>{const token=new URLSearchParams(window.location.search).get("token");if(!token){setError("Verification token is missing.");setMessage("");return;}fetch("/api/customer/verify-email",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token})}).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error||"Verification failed.");setMessage(d.message);}).catch(e=>{setError(e instanceof Error?e.message:"Unable to verify email.");setMessage("");});},[]);
 return <main className="min-h-screen bg-[#F1F3EF] px-5 py-12"><div className="mx-auto max-w-md border bg-white p-7"><h1 className="text-2xl font-bold text-[#173D32]">Email verification</h1>{message&&<p className="mt-4 text-sm text-[#315D49]">{message}</p>}{error&&<p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}<Link href="/account/login" className="mt-6 inline-block text-sm font-bold text-[#315D49] underline">Continue to sign in</Link></div></main>;
}
