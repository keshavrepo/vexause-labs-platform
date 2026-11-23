"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Printer } from "lucide-react";

type Invoice = {
  invoiceNumber: string;
  issuedAt: string;
  sellerName: string;
  sellerGstin: string | null;
  sellerStateCode: string;
  buyerName: string;
  placeOfSupply: string;
  subtotalPaise: number;
  discountPaise: number;
  taxablePaise: number;
  cgstPaise: number;
  sgstPaise: number;
  igstPaise: number;
  totalTaxPaise: number;
  grandTotalPaise: number;
  linesJson: any[];
  order: { orderCode: string };
};

const money = (p: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(p / 100);

export default function InvoicePage() {
  const params = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/customer/orders/${params.id}/invoice`, { cache: "no-store" })
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw Error(d.error || "Invoice unavailable");
        return d;
      })
      .then((d) => setInvoice(d.invoice))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [params.id]);

  return (
    <div className="vx-page vx-page--mid">
      <div className="vx-row vx-row--between vx-no-print" style={{ marginBottom: 18, gap: 12 }}>
        <Link href={`/account/orders/${params.id}`} className="vx-backlink">← Order details</Link>
        <button type="button" onClick={() => window.print()} className="vx-btn vx-btn--primary vx-btn--sm">
          <Printer size={14} aria-hidden="true" /> Print / save as PDF
        </button>
      </div>

      {loading ? <div className="vx-skeleton" style={{ height: 420 }} aria-busy="true" /> : null}
      {error ? <div className="vx-alert vx-alert--danger" role="alert">{error}</div> : null}

      {invoice ? (
        <article className="vx-invoice">
          <header className="vx-invoice__head">
            <div>
              <p className="vx-invoice__brand">VEXAUSE LABS</p>
              <h1 className="vx-invoice__title">Tax invoice</h1>
              <p className="vx-small vx-muted" style={{ marginTop: 6 }}>{invoice.sellerName}</p>
              {invoice.sellerGstin ? <p className="vx-small vx-muted">GSTIN {invoice.sellerGstin}</p> : null}
            </div>
            <dl className="vx-invoice__meta">
              <div><dt>Invoice</dt><dd>{invoice.invoiceNumber}</dd></div>
              <div><dt>Order</dt><dd>{invoice.order.orderCode}</dd></div>
              <div><dt>Issued</dt><dd>{new Date(invoice.issuedAt).toLocaleDateString("en-IN")}</dd></div>
            </dl>
          </header>

          <section className="vx-invoice__parties">
            <div>
              <p className="vx-label">Billed to</p>
              <p style={{ margin: "6px 0 0", color: "var(--vx-ink-soft)", fontSize: 12.5 }}>{invoice.buyerName}</p>
              <p className="vx-small vx-muted">Place of supply: {invoice.placeOfSupply}</p>
            </div>
            <div>
              <p className="vx-label">Seller state code</p>
              <p style={{ margin: "6px 0 0", color: "var(--vx-ink-soft)", fontSize: 12.5 }}>{invoice.sellerStateCode}</p>
            </div>
          </section>

          <div className="vx-table-wrap">
            <table className="vx-table vx-invoice__table">
              <thead>
                <tr>
                  <th scope="col">Item / HSN</th>
                  <th scope="col">Qty</th>
                  <th scope="col">Taxable value</th>
                  <th scope="col">GST</th>
                  <th scope="col">Tax</th>
                </tr>
              </thead>
              <tbody>
                {invoice.linesJson.map((line: any, index: number) => (
                  <tr key={index}>
                    <td>
                      <span className="vx-table__strong">{line.name}</span>
                      <span className="vx-small vx-muted" style={{ display: "block" }}>{line.hsnCode || "HSN not set"}</span>
                    </td>
                    <td className="vx-table__num">{line.quantity}</td>
                    <td className="vx-table__num">{money(line.taxablePaise)}</td>
                    <td className="vx-table__num">{(line.gstRateBps / 100).toFixed(2)}%</td>
                    <td className="vx-table__num">{money(line.taxPaise)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="vx-invoice__totals">
            <div className="vx-summary">
              <div className="vx-summary__row"><span>Subtotal</span><b>{money(invoice.subtotalPaise)}</b></div>
              <div className="vx-summary__row"><span>Discount</span><b>−{money(invoice.discountPaise)}</b></div>
              <div className="vx-summary__row"><span>Taxable value</span><b>{money(invoice.taxablePaise)}</b></div>
              {invoice.cgstPaise > 0 ? <div className="vx-summary__row"><span>CGST</span><b>{money(invoice.cgstPaise)}</b></div> : null}
              {invoice.sgstPaise > 0 ? <div className="vx-summary__row"><span>SGST</span><b>{money(invoice.sgstPaise)}</b></div> : null}
              {invoice.igstPaise > 0 ? <div className="vx-summary__row"><span>IGST</span><b>{money(invoice.igstPaise)}</b></div> : null}
              <div className="vx-summary__row vx-summary__row--total"><span>Total</span><b>{money(invoice.grandTotalPaise)}</b></div>
            </div>
          </div>

          <footer className="vx-invoice__foot">
            Generated from VEXAUSE LABS order records. Verify seller registration and invoice particulars before statutory use.
          </footer>
        </article>
      ) : null}

      <style jsx global>{`
        @media print {
          body { background: #fff !important; }
          .vx-page { width: 100%; padding: 0; }
          .vx-invoice { border: 0; box-shadow: none; }
        }
      `}</style>
    </div>
  );
}
