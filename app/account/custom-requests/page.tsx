"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, FileUp, ScrollText } from "lucide-react";
import { Alert, Badge, EmptyState, PageHeader, Panel, StatusBadge } from "@/components/ui/Primitives";

type FileRow = { id: string; purpose: string; originalName: string; sizeBytes: number; scanStatus: string };
type Quote = { id: string; quoteCode: string; status: string; totalPaise: number; advancePaise: number; customerMessage: string | null; validUntil: string | null };
type Request = {
  id: string;
  requestCode: string;
  requestType: string;
  status: string;
  designStatus: string;
  description: string;
  createdAt: string;
  files: FileRow[];
  quotes: Quote[];
};

const money = (paise: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(paise / 100);
const size = (bytes: number) => (bytes > 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

export default function CustomerCustomRequestsPage() {
  const [rows, setRows] = useState<Request[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    const r = await fetch("/api/customer/custom-requests", { cache: "no-store" });
    if (!r.ok) {
      setError("Please sign in to view requests linked to your account.");
      setLoading(false);
      return;
    }
    const d = await r.json().catch(() => ({}));
    setRows(d.requests || []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function decideQuote(requestId: string, quoteId: string) {
    setBusy(quoteId);
    setError("");
    const r = await fetch("/api/customer/custom-requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, action: "ACCEPT_QUOTE", quoteId }),
    });
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      setError(d.error || "Could not accept quote.");
      setBusy("");
      return;
    }
    const d = await r.json().catch(() => ({}));
    await load();
    if (d.order?.id) window.location.href = `/account/orders/${d.order.id}`;
    setBusy("");
  }

  async function decide(requestId: string, action: "APPROVE_DESIGN" | "REQUEST_REVISION") {
    setBusy(requestId + action);
    setError("");
    const r = await fetch("/api/customer/custom-requests", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, action }),
    });
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      setError(d.error || "Could not save decision.");
      setBusy("");
      return;
    }
    await load();
    setBusy("");
  }

  return (
    <div className="vx-page">
      <PageHeader
        kicker="Custom programme"
        title="My custom 3D requests"
        description="Design briefs, previews and quotations for your made-to-order work. Accepting a quotation creates a custom order linked to your account."
        actions={<Link href="/custom-3d-printing" className="vx-btn vx-btn--primary vx-btn--sm"><FileUp size={14} aria-hidden="true" /> New request</Link>}
      />

      {error ? <Alert tone="danger">{error}</Alert> : null}

      {loading ? (
        <div className="vx-stack" aria-busy="true">
          {[0, 1].map((index) => (
            <div key={index} className="vx-skeleton" style={{ height: 178 }} />
          ))}
          <p className="sr-only" role="status">Loading requests…</p>
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          title="No custom requests yet"
          text="Start with a ready STL/OBJ/3MF file or a brief, and the team will review printability before quoting."
          action={<Link href="/custom-3d-printing" className="vx-btn vx-btn--primary vx-btn--sm">Request a custom print</Link>}
        />
      ) : (
        <div className="vx-stack">
          {rows.map((request) => (
            <Panel key={request.id} flush>
              <div className="vx-panel__head">
                <div>
                  <h2 className="vx-panel__title">
                    {request.requestCode}
                    <span className="vx-small vx-muted" style={{ marginLeft: 8, fontWeight: 500 }}>
                      {request.requestType.replaceAll("_", " ")}
                    </span>
                  </h2>
                  <p className="vx-panel__meta">
                    Submitted {new Date(request.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })} ·
                    design {request.designStatus.replaceAll("_", " ").toLowerCase()}
                  </p>
                </div>
                <div className="vx-row" style={{ gap: 8 }}>
                  <StatusBadge status={request.status} />
                  {request.designStatus === "PREVIEW_READY" ? <Badge tone="brand">Preview ready</Badge> : null}
                </div>
              </div>

                <p style={{ margin: 0, color: "var(--vx-ink-soft)", fontSize: 12.5, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                  {request.description}
                </p>

                {request.files.length > 0 ? (
                  <div style={{ marginTop: 14 }}>
                    <p className="vx-label">Files</p>
                    <ul className="vx-filelist">
                      {request.files.map((file) => (
                        <li key={file.id}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                            <ScrollText size={13} aria-hidden="true" style={{ color: "#5c8468", flex: "none" }} />
                            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.originalName}</span>
                          </span>
                          <span className="vx-row" style={{ gap: 8, flex: "none" }}>
                            <span className="vx-muted vx-tabular">{size(file.sizeBytes)}</span>
                            <Badge tone={file.scanStatus === "CLEAN" ? "ok" : "warn"}>{file.scanStatus}</Badge>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {request.designStatus === "PREVIEW_READY" ? (
                  <div className="vx-alert vx-alert--info" style={{ marginTop: 14, display: "grid", gap: 10 }}>
                    <span>A design preview is ready for your review. Approve it to move to production, or ask for a revision.</span>
                    <div className="vx-actions">
                      <button
                        type="button"
                        disabled={busy === request.id + "APPROVE_DESIGN"}
                        onClick={() => decide(request.id, "APPROVE_DESIGN")}
                        className="vx-btn vx-btn--primary vx-btn--sm"
                      >
                        {busy === request.id + "APPROVE_DESIGN" ? "Saving…" : "Approve design"}
                      </button>
                      <button
                        type="button"
                        disabled={busy === request.id + "REQUEST_REVISION"}
                        onClick={() => decide(request.id, "REQUEST_REVISION")}
                        className="vx-btn vx-btn--sm"
                      >
                        Request revision
                      </button>
                    </div>
                  </div>
                ) : null}

                {request.files
                  .filter((f) => f.purpose === "DESIGN_DELIVERABLE" && f.scanStatus === "CLEAN")
                  .map((f) => (
                    <a
                      key={f.id}
                      className="vx-btn vx-btn--sm"
                      style={{ marginTop: 12 }}
                      href={`/api/customer/custom-requests/${request.id}/files/${f.id}`}
                    >
                      <Download size={13} aria-hidden="true" /> Download preview · {f.originalName}
                    </a>
                  ))}

                {request.quotes.length > 0 ? (
                  <div className="vx-stack" style={{ marginTop: 16, gap: 10 }}>
                    {request.quotes.map((quote) => (
                      <div key={quote.id} className="vx-panel vx-panel--quiet" style={{ padding: 16 }}>
                        <div className="vx-row vx-row--between" style={{ gap: 10 }}>
                          <p style={{ margin: 0, color: "var(--vxl-forest)", fontSize: 12.5, fontWeight: 700 }}>
                            Quote {quote.quoteCode}
                            {quote.validUntil ? (
                              <span className="vx-muted" style={{ fontWeight: 500 }}>
                                {" "}· valid until {new Date(quote.validUntil).toLocaleDateString("en-IN")}
                              </span>
                            ) : null}
                          </p>
                          <StatusBadge status={quote.status} />
                        </div>
                        <div className="vx-summary" style={{ marginTop: 10 }}>
                          <div className="vx-summary__row"><span>Quoted total</span><b>{money(quote.totalPaise)}</b></div>
                          <div className="vx-summary__row"><span>Advance to start</span><b>{money(quote.advancePaise)}</b></div>
                        </div>
                        {quote.customerMessage ? (
                          <p className="vx-small vx-muted" style={{ margin: "8px 0 0" }}>{quote.customerMessage}</p>
                        ) : null}
                        {quote.status === "SENT" ? (
                          <>
                            <p className="vx-small vx-muted" style={{ marginTop: 10 }}>
                              Accepting creates a custom order. The initial payment is the quoted advance (or the full amount
                              if no advance is specified).
                            </p>
                            <button
                              type="button"
                              disabled={busy === quote.id}
                              onClick={() => decideQuote(request.id, quote.id)}
                              className="vx-btn vx-btn--primary vx-btn--sm"
                              style={{ marginTop: 10 }}
                            >
                              {busy === quote.id ? "Creating order…" : "Accept quotation & create order"}
                            </button>
                          </>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : null}
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
