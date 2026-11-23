import Link from "next/link";

export default function AuthShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="vx-auth">
      <div className="vx-auth__card">
        <Link href="/" className="vx-auth__brand" aria-label="VEXAUSE LABS home">
          <span className="vx-auth__mark" aria-hidden="true">V</span>
          <span>
            <span className="vx-auth__name">VEXAUSE</span>
            <span className="vx-auth__sub">LABS</span>
          </span>
        </Link>
        <div style={{ marginTop: 26 }}>
          <p className="vx-kicker">{eyebrow}</p>
          <h1 className="vx-title" style={{ fontSize: "clamp(24px, 5vw, 32px)" }}>{title}</h1>
          {description ? <p className="vx-lead" style={{ marginTop: 10 }}>{description}</p> : null}
        </div>
        <div style={{ marginTop: 22 }}>{children}</div>
      </div>
      <p className="vx-small vx-muted" style={{ marginTop: 18, textAlign: "center" }}>
        <Link href="/shop" style={{ fontWeight: 700, textDecoration: "underline" }}>Return to the store</Link>
      </p>
    </main>
  );
}
