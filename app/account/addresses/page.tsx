"use client";

import { useEffect, useState } from "react";
import { MapPin, Plus } from "lucide-react";
import { Alert, Badge, EmptyState, PageHeader, Panel } from "@/components/ui/Primitives";

type Address = {
  id: string;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  isDefault: boolean;
};

const initialForm = {
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  postalCode: "",
  label: "Home",
  isDefault: true,
};

const labels: Record<string, string> = {
  fullName: "Full name",
  phone: "Phone number",
  line1: "Address line 1",
  line2: "Address line 2 (optional)",
  city: "City",
  state: "State",
  postalCode: "PIN code",
  label: "Label (e.g. Home, Studio)",
};

export default function AddressesPage() {
  const [items, setItems] = useState<Address[]>([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(initialForm);

  async function load() {
    const r = await fetch("/api/customer/addresses", { cache: "no-store" });
    if (!r.ok) {
      setError("Please sign in to manage addresses.");
      return;
    }
    const d = await r.json().catch(() => ({}));
    setItems(d.addresses || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const r = await fetch("/api/customer/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "Could not save address");
      setForm(initialForm);
      setMessage("Address saved to your address book.");
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not save address");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="vx-page">
      <PageHeader
        kicker="Account"
        title="Address book"
        description="Delivery addresses used at checkout. The default address is preselected when you place an order."
        actions={<a href="#new-address" className="vx-btn vx-btn--sm"><Plus size={14} aria-hidden="true" /> New address</a>}
      />

      {error ? <Alert tone="danger">{error}</Alert> : null}
      {message ? <Alert tone="ok">{message}</Alert> : null}

      <div className="vx-split" style={{ marginTop: 20 }}>
        <Panel title="Saved addresses" meta={`${items.length} address${items.length === 1 ? "" : "es"} on file`} flush>
          {items.length === 0 ? (
            <div style={{ padding: 18 }}>
              <EmptyState title="No addresses saved" text="Add a delivery address using the form to speed up checkout." />
            </div>
          ) : (
            <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
              {items.map((address) => (
                <li key={address.id} style={{ borderBottom: "1px solid var(--vx-line)", padding: "16px 20px" }}>
                  <div className="vx-row" style={{ gap: 10, alignItems: "flex-start" }}>
                    <span className="vx-order-icon" aria-hidden="true"><MapPin size={16} /></span>
                    <div style={{ minWidth: 0 }}>
                      <p className="vx-row" style={{ margin: 0, gap: 8 }}>
                        <strong style={{ color: "var(--vxl-forest)", fontSize: 13 }}>{address.fullName}</strong>
                        {address.isDefault ? <Badge tone="brand">Default</Badge> : null}
                      </p>
                      <p className="vx-small vx-muted" style={{ margin: "4px 0 0", lineHeight: 1.6 }}>
                        {address.line1}
                        {address.line2 ? `, ${address.line2}` : ""}
                        <br />
                        {address.city}, {address.state} {address.postalCode} · {address.phone}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Add an address" meta="Only business or delivery details are needed here.">
          <form onSubmit={save} className="vx-panel__body vx-form" id="new-address">
            <div className="vx-grid vx-grid--2" style={{ gap: 12 }}>
              {Object.entries(form)
                .filter(([key]) => key !== "isDefault")
                .map(([key, value]) => (
                  <label className="vx-field" key={key} style={key === "line1" || key === "line2" ? { gridColumn: "1 / -1" } : undefined}>
                    <span className="vx-label">
                      {labels[key] || key} {!["line2", "label"].includes(key) ? "*" : null}
                    </span>
                    <input
                      required={!["line2", "label"].includes(key)}
                      value={String(value)}
                      onChange={(e) => setForm((old) => ({ ...old, [key]: e.target.value }))}
                      className="vx-input"
                      autoComplete={key === "fullName" ? "name" : key === "phone" ? "tel" : key === "postalCode" ? "postal-code" : "address-line1"}
                    />
                  </label>
                ))}
            </div>
            <label className="vx-check">
              <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm((o) => ({ ...o, isDefault: e.target.checked }))} />
              Set this as my default delivery address
            </label>
            <button disabled={busy} className="vx-btn vx-btn--primary vx-btn--block">
              {busy ? "Saving…" : "Save address"}
            </button>
          </form>
        </Panel>
      </div>
    </div>
  );
}
