import type { CSSProperties, ReactNode } from "react";

/**
 * Shared VEXAUSE LABS UI primitives.
 *
 * Presentational only — no hooks, no data fetching — so they can be used from
 * server and client components alike. All colours come from the existing brand
 * tokens in globals.css / design-system.css.
 */

export function PageHeader({
  kicker,
  title,
  description,
  actions,
}: {
  kicker?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="vx-page-head">
      <div style={{ minWidth: 0 }}>
        {kicker ? <p className="vx-kicker">{kicker}</p> : null}
        <h1 className="vx-title">{title}</h1>
        {description ? <p className="vx-lead">{description}</p> : null}
      </div>
      {actions ? <div className="vx-actions">{actions}</div> : null}
    </header>
  );
}

export function Panel({
  title,
  meta,
  actions,
  children,
  footer,
  tone,
  flush,
  bodyless,
  bodyClassName = "",
  bodyStyle,
  className = "",
}: {
  title?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  tone?: "quiet" | "accent";
  flush?: boolean;
  /** Skip the padded body when the children bring their own body element. */
  bodyless?: boolean;
  bodyClassName?: string;
  bodyStyle?: CSSProperties;
  className?: string;
}) {
  return (
    <section className={`vx-panel${tone ? ` vx-panel--${tone}` : ""}${flush ? " vx-panel--flush" : ""} ${className}`.trim()}>
      {title || meta || actions ? (
        <div className="vx-panel__head">
          <div style={{ minWidth: 0 }}>
            {title ? <h2 className="vx-panel__title">{title}</h2> : null}
            {meta ? <p className="vx-panel__meta">{meta}</p> : null}
          </div>
          {actions ? <div className="vx-actions">{actions}</div> : null}
        </div>
      ) : null}
      {flush || bodyless ? (
        children
      ) : (
        <div className={`vx-panel__body ${bodyClassName}`.trim()} style={bodyStyle}>
          {children}
        </div>
      )}
      {footer ? <div className="vx-panel__foot">{footer}</div> : null}
    </section>
  );
}

export function Stat({
  label,
  value,
  note,
  accent,
}: {
  label: string;
  value: ReactNode;
  note?: ReactNode;
  accent?: boolean;
}) {
  return (
    <div className={`vx-stat${accent ? " vx-stat--accent" : ""}`}>
      <span className="vx-stat__label">{label}</span>
      <span className="vx-stat__value">{value}</span>
      {note ? <span className="vx-stat__note">{note}</span> : null}
    </div>
  );
}

export type Tone = "neutral" | "ok" | "warn" | "danger" | "info" | "brand";

export function Badge({ tone = "neutral", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`vx-badge vx-badge--${tone}`}>{children}</span>;
}

/** Maps an order/request/payment status string onto a badge tone. */
export function statusTone(status: string): Tone {
  const value = status.toUpperCase();
  if (/(PAID|VERIFIED|DELIVERED|COMPLETED|CLEAN|APPROVED|ACTIVE|SUCCEEDED|PUBLISHED|SENT)/.test(value)) return "ok";
  if (/(PENDING|AWAITING|REVIEW|QUOTED|IN_PROGRESS|PROCESSING|SCANNING|DRAFT|IN_PRODUCTION|CONFIRMED|PAID_PARTIAL)/.test(value)) return "warn";
  if (/(CANCEL|REFUND|FAILED|REJECT|DISPUTE|BLOCKED|INFEASIBLE|EXPIRED)/.test(value)) return "danger";
  if (/(SHIPPED|DISPATCHED|READY|OUT_FOR_DELIVERY)/.test(value)) return "info";
  return "neutral";
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={statusTone(status)}>{status.replaceAll("_", " ")}</Badge>;
}

export function EmptyState({ title, text, action }: { title: string; text?: ReactNode; action?: ReactNode }) {
  return (
    <div className="vx-empty">
      <p className="vx-empty__title">{title}</p>
      {text ? <p className="vx-empty__text">{text}</p> : null}
      {action}
    </div>
  );
}

export function Field({
  label,
  hint,
  required,
  htmlFor,
  children,
  hintId,
}: {
  label: ReactNode;
  hint?: ReactNode;
  required?: boolean;
  htmlFor?: string;
  hintId?: string;
  children: ReactNode;
}) {
  return (
    <div className="vx-field">
      <label className="vx-label" htmlFor={htmlFor}>
        {label} {required ? <span aria-hidden="true">*</span> : null}
      </label>
      {children}
      {hint ? (
        <p className="vx-hint" id={hintId}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function Alert({ tone = "info", children }: { tone?: "ok" | "warn" | "danger" | "info"; children: ReactNode }) {
  return (
    <p className={`vx-alert vx-alert--${tone}`} role={tone === "danger" ? "alert" : "status"}>
      {children}
    </p>
  );
}

export function KeyValue({ rows }: { rows: Array<[ReactNode, ReactNode]> }) {
  return (
    <dl className="vx-kv">
      {rows.map(([key, value], index) => (
        <div className="vx-kv__row" key={index}>
          <dt>{key}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
