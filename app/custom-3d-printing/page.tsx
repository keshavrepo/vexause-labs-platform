"use client";

import { useState } from "react";
import Link from "next/link";
import { FileUp, PenTool, Boxes, Lock, CheckCircle2 } from "lucide-react";
import { StoreContactFooter } from "@/components/StorefrontConfig";
import StorefrontHeader from "@/components/StorefrontHeader";
import { Alert, PageHeader, Panel } from "@/components/ui/Primitives";

type RequestType = "PRINT_FROM_FILE" | "DESIGN_AND_PRINT" | "DESIGN_ONLY";

const options: Array<{ value: RequestType; title: string; description: string; icon: typeof FileUp; note: string }> = [
  {
    value: "PRINT_FROM_FILE",
    title: "I have a 3D file",
    description: "Upload an STL, OBJ or 3MF and we will review printability, material and finish before quoting.",
    icon: FileUp,
    note: "Attach at least one model file",
  },
  {
    value: "DESIGN_AND_PRINT",
    title: "I have an idea",
    description: "We help shape the model, share a design preview for approval, then print the approved version.",
    icon: PenTool,
    note: "Design preview before printing",
  },
  {
    value: "DESIGN_ONLY",
    title: "I need a design file",
    description: "Request a CAD / 3D model without printing. You receive the agreed deliverables after approval.",
    icon: Boxes,
    note: "File deliverable, no printing",
  },
];

const steps: Array<[string, string]> = [
  ["Share the brief", "Tell us what the part is for, dimensions, quantity and any files you already have."],
  ["Feasibility & quote", "We review printability and send a quotation with scope, price and timeline."],
  ["Approve & produce", "Production starts only after you accept the quotation and complete payment."],
];

const field = "vx-input";

function FileSummary({ files, emptyLabel }: { files: File[]; emptyLabel: string }) {
  if (files.length === 0) return <p className="vx-upload__meta">{emptyLabel}</p>;
  return (
    <div>
      <p className="vx-upload__meta" role="status">
        {files.length} file{files.length === 1 ? "" : "s"} selected ·{" "}
        {(files.reduce((total, file) => total + file.size, 0) / (1024 * 1024)).toFixed(1)} MB total
      </p>
      <ul className="vx-filelist">
        {files.map((file, index) => (
          <li key={`${file.name}-${index}`}>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</span>
            <span className="vx-tabular" style={{ color: "var(--vx-ink-muted)" }}>
              {(file.size / (1024 * 1024)).toFixed(1)} MB
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Custom3DPrintingPage() {
  const [type, setType] = useState<RequestType>("PRINT_FROM_FILE");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");
  const [modelFiles, setModelFiles] = useState<File[]>([]);
  const [referenceFiles, setReferenceFiles] = useState<File[]>([]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formElement = e.currentTarget;
    setBusy(true);
    setError("");
    setMessage("");
    const form = new FormData(formElement);
    form.set("requestType", type);
    try {
      const res = await fetch("/api/custom-requests", { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not submit request.");
      setMessage(`Request received. Your reference number is ${data.request.requestCode}. Our team will review it and contact you.`);
      setReference(data.request.requestCode);
      formElement.reset();
      setModelFiles([]);
      setReferenceFiles([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not submit request. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <StorefrontHeader />
      <main className="vx-custom-page">
        <div className="vx-page">
          <PageHeader
            kicker="VEXAUSE LABS · Custom programme"
            title={<>Custom 3D printing &amp; design</>}
            description="Upload a printable model or bring a rough idea. Every request is reviewed by a person, and a quotation is shared before any production begins."
            actions={
              <>
                <Link href="/help" className="vx-btn vx-btn--sm">How it works</Link>
                <Link href="/account/custom-requests" className="vx-btn vx-btn--sm">Track a request</Link>
              </>
            }
          />

          <div className="vx-steps" style={{ marginBottom: 24 }}>
            {steps.map(([title, text], index) => (
              <div className="vx-step" key={title}>
                <span className="vx-step__index">{String(index + 1).padStart(2, "0")}</span>
                <span className="vx-step__title">{title}</span>
                <p className="vx-step__text">{text}</p>
              </div>
            ))}
          </div>

          <div className="vx-checkout">
            <div className="vx-stack">
              <div>
                <h2 className="vx-section-title">What do you need?</h2>
                <div className="vx-grid vx-grid--3" role="radiogroup" aria-label="Request type">
                  {options.map(({ value, title, description, icon: Icon }) => (
                    <button
                      type="button"
                      key={value}
                      onClick={() => setType(value)}
                      aria-pressed={type === value}
                      className="vx-panel"
                      style={{
                        textAlign: "left",
                        padding: 16,
                        cursor: "pointer",
                        borderColor: type === value ? "#4f7a5e" : undefined,
                        boxShadow: type === value ? "0 0 0 3px rgba(120,168,140,.16)" : undefined,
                        background: type === value ? "#f7fbf2" : undefined,
                      }}
                    >
                      <Icon size={17} aria-hidden="true" style={{ color: type === value ? "#2f6144" : "#6c8774" }} />
                      <span style={{ display: "block", marginTop: 10, color: "var(--vxl-forest)", fontSize: 13, fontWeight: 700 }}>{title}</span>
                      <span className="vx-small vx-muted" style={{ display: "block", marginTop: 5, lineHeight: 1.6 }}>{description}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Panel title="Tell us about your project" meta="Fields marked * are required. Nothing is submitted until you press the button at the end.">
                <form onSubmit={submit} className="vx-panel__body vx-form" noValidate={false}>
                  <div className="vx-grid vx-grid--2" style={{ gap: 14 }}>
                    <label className="vx-field">
                      <span className="vx-label">Full name *</span>
                      <input name="name" required minLength={2} maxLength={100} autoComplete="name" className={field} />
                    </label>
                    <label className="vx-field">
                      <span className="vx-label">Email *</span>
                      <input name="email" type="email" required autoComplete="email" className={field} />
                    </label>
                    <label className="vx-field">
                      <span className="vx-label">Phone *</span>
                      <input name="phone" required minLength={7} maxLength={24} autoComplete="tel" className={field} />
                    </label>
                    <label className="vx-field">
                      <span className="vx-label">Quantity *</span>
                      <input name="quantity" type="number" min="1" max="500" defaultValue="1" required className={field} />
                    </label>
                    <label className="vx-field" style={{ gridColumn: "1 / -1" }}>
                      <span className="vx-label">Describe your idea or model requirements *</span>
                      <textarea
                        name="description"
                        required
                        minLength={15}
                        maxLength={5000}
                        rows={5}
                        placeholder="What should the part look like, and what will it be used for?"
                        className="vx-textarea"
                      />
                    </label>
                    <label className="vx-field">
                      <span className="vx-label">Intended use</span>
                      <input name="intendedUse" maxLength={1500} placeholder="Prototype, display piece, functional part…" className={field} />
                    </label>
                    <label className="vx-field">
                      <span className="vx-label">Approximate dimensions</span>
                      <input name="dimensions" maxLength={200} placeholder="Length × width × height (mm)" className={field} />
                    </label>
                    <label className="vx-field">
                      <span className="vx-label">Material preference</span>
                      <input name="materialPreference" maxLength={80} placeholder="PLA, PETG, ABS, not sure" className={field} />
                    </label>
                    <label className="vx-field">
                      <span className="vx-label">Colour preference</span>
                      <input name="colourPreference" maxLength={80} placeholder="Black, white, sage…" className={field} />
                    </label>
                    <label className="vx-field">
                      <span className="vx-label">Budget (₹, optional)</span>
                      <input name="budget" type="number" min="0" step="1" className={field} />
                    </label>
                    <label className="vx-field">
                      <span className="vx-label">Target date (optional)</span>
                      <input name="deadline" type="date" className={field} />
                    </label>
                  </div>

                  {type === "PRINT_FROM_FILE" ? (
                    <label className="vx-upload">
                      <span className="vx-upload__label">3D model files *</span>
                      <input
                        name="modelFiles"
                        type="file"
                        multiple
                        accept=".stl,.obj,.3mf"
                        required
                        className="vx-input--file"
                        onChange={(event) => setModelFiles(Array.from(event.currentTarget.files || []))}
                      />
                      <span className="vx-upload__meta">
                        STL, OBJ or 3MF · up to 8 files · 25 MB each. Files are stored privately and never appear as public
                        product images.
                      </span>
                      <FileSummary files={modelFiles} emptyLabel="No file selected yet." />
                    </label>
                  ) : (
                    <label className="vx-upload">
                      <span className="vx-upload__label">Sketches, reference images or a PDF (optional)</span>
                      <input
                        name="referenceFiles"
                        type="file"
                        multiple
                        accept=".jpg,.jpeg,.png,.webp,.pdf"
                        className="vx-input--file"
                        onChange={(event) => setReferenceFiles(Array.from(event.currentTarget.files || []))}
                      />
                      <span className="vx-upload__meta">
                        JPG, PNG, WEBP or PDF · up to 8 files · 25 MB each. We review the brief and confirm design scope,
                        revisions, price and deliverables before starting.
                      </span>
                      <FileSummary files={referenceFiles} emptyLabel="No reference attached yet." />
                    </label>
                  )}

                  {error ? <Alert tone="danger">{error}</Alert> : null}
                  {message ? (
                    <div className="vx-alert vx-alert--ok" role="status">
                      <CheckCircle2 size={16} aria-hidden="true" />
                      <span>
                        {message}{" "}
                        {reference ? (
                          <Link href="/account/custom-requests" style={{ fontWeight: 700, textDecoration: "underline" }}>
                            Track this request
                          </Link>
                        ) : null}
                      </span>
                    </div>
                  ) : null}

                  <div className="vx-row vx-row--between" style={{ alignItems: "center", gap: 14 }}>
                    <p className="vx-small vx-muted" style={{ margin: 0, maxWidth: "46ch" }}>
                      Submitting a request does not confirm feasibility, price or a delivery date. We review and send a
                      quotation for your approval.
                    </p>
                    <button disabled={busy} className="vx-btn vx-btn--primary" style={{ minHeight: 48 }}>
                      {busy ? "Submitting…" : "Submit custom request"}
                    </button>
                  </div>
                </form>
              </Panel>
            </div>

            <aside className="vx-order-aside">
              <Panel tone="quiet" title="What happens next" meta="A human reviews every submission.">
                <ol className="vx-timeline">
                  {[
                    ["Reference issued", "You receive a request code immediately after submission."],
                    ["Review", "We check files, printability, material and any constraints."],
                    ["Quotation", "A written quote with scope, price and expected timeline."],
                    ["Production", "Only after you accept the quotation and pay the advance."],
                  ].map(([title, text], index) => (
                    <li className="vx-timeline__item" key={title}>
                      <span className="vx-timeline__dot" aria-hidden="true" />
                      <div>
                        <p className="vx-timeline__title">{String(index + 1).padStart(2, "0")} · {title}</p>
                        <p className="vx-timeline__meta">{text}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </Panel>

              <Panel title="Files stay private" meta="Handled the same way as order data.">
                <ul className="vx-stack" style={{ gap: 12, listStyle: "none", margin: 0, padding: 0 }}>
                  {[
                    ["Private storage", "Uploads are stored outside the public product image folder."],
                    ["Signature checks", "File headers are validated before anything is accepted."],
                    ["Access on request", "Only you and authorised staff can retrieve a submitted file."],
                  ].map(([title, text]) => (
                    <li key={title} style={{ display: "flex", gap: 10 }}>
                      <Lock size={14} aria-hidden="true" style={{ marginTop: 3, color: "#5c8468", flex: "none" }} />
                      <div>
                        <p style={{ margin: 0, color: "var(--vxl-forest)", fontSize: 12, fontWeight: 700 }}>{title}</p>
                        <p className="vx-small vx-muted" style={{ margin: "3px 0 0" }}>{text}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <p className="vx-small vx-muted" style={{ marginTop: 14, borderTop: "1px solid var(--vx-line)", paddingTop: 12 }}>
                  Signed in?{" "}
                  <Link href="/account/custom-requests" style={{ fontWeight: 700, textDecoration: "underline" }}>
                    New requests link to your account automatically
                  </Link>
                  .
                </p>
              </Panel>
            </aside>
          </div>
        </div>
      </main>
      <StoreContactFooter />
    </>
  );
}
