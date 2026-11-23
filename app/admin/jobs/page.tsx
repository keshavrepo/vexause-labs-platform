"use client";
import { useEffect, useState } from "react";

type Job = { id: string; type: string; status: string; attempts: number; maxAttempts: number; runAt: string; lastError: string | null; createdAt: string; completedAt: string | null };
export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  async function load() {
    const response = await fetch("/api/admin/jobs", { cache: "no-store" });
    if (!response.ok) { setError("Could not load background jobs. Sign in as admin."); return; }
    const data = await response.json().catch(() => ({})); setJobs(data.jobs || []); setError("");
  }
  useEffect(() => { void load(); }, []);
  async function retry(jobId: string) {
    setBusy(jobId);
    const response = await fetch("/api/admin/jobs", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jobId }) });
    setBusy("");
    if (!response.ok) { setError("Could not retry this job."); return; }
    await load();
  }
  return <main className="mx-auto max-w-6xl px-5 py-10">
    <div className="mb-8"><p className="text-sm uppercase tracking-[.2em] text-emerald-700">Operations</p><h1 className="mt-2 text-3xl font-semibold">Background jobs</h1><p className="mt-2 text-sm text-neutral-600">Monitor queued notifications and delivery tasks.</p></div>
    {error && <p role="alert" className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <div className="overflow-x-auto rounded-xl border"><table className="w-full text-left text-sm"><thead className="bg-neutral-50"><tr>{["Type","Status","Attempts","Created","Last error","Action"].map(x=><th key={x} className="p-3 font-medium">{x}</th>)}</tr></thead><tbody>
      {jobs.map(job=><tr key={job.id} className="border-t"><td className="p-3">{job.type}</td><td className="p-3">{job.status}</td><td className="p-3">{job.attempts}/{job.maxAttempts}</td><td className="p-3">{new Date(job.createdAt).toLocaleString()}</td><td className="max-w-xs p-3 text-red-700">{job.lastError || "—"}</td><td className="p-3">{job.status==="FAILED"&&<button disabled={busy===job.id} onClick={()=>retry(job.id)} className="rounded border px-3 py-1 disabled:opacity-50">{busy===job.id?"Retrying…":"Retry"}</button>}</td></tr>)}
      {!jobs.length&&<tr><td className="p-5 text-neutral-500" colSpan={6}>No jobs yet.</td></tr>}
    </tbody></table></div>
  </main>;
}
