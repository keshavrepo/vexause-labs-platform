"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Box,
  ClipboardList,
  CreditCard,
  FileUp,
  Gauge,
  Package,
  Settings,
  ShieldCheck,
  Tags,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

type Role = "ADMIN" | "STAFF" | string;

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  adminOnly?: boolean;
};

const workspace: NavItem[] = [
  { href: "/admin", label: "Overview", icon: Gauge, exact: true },
  { href: "/admin/orders", label: "Orders", icon: ClipboardList },
  { href: "/admin/production", label: "Production", icon: Package },
  { href: "/admin/custom-requests", label: "Custom requests", icon: FileUp },
  { href: "/admin/support", label: "Customer support", icon: Users },
  { href: "/admin/products", label: "Products", icon: Tags },
  { href: "/admin/inventory", label: "Inventory", icon: Box },
  { href: "/admin/reviews", label: "Reviews", icon: ShieldCheck },
];

const finance: NavItem[] = [
  { href: "/admin/payments", label: "Payments", icon: CreditCard },
  { href: "/admin/finance", label: "Finance", icon: Wallet },
  { href: "/admin/tax-settings", label: "GST & tax", icon: Settings },
  { href: "/admin/refunds", label: "Refunds", icon: Wallet },
  { href: "/admin/coupons", label: "Coupons", icon: Tags },
  { href: "/admin/analytics", label: "Analytics", icon: Activity },
];

const management: NavItem[] = [
  { href: "/admin/store-settings", label: "Store settings", icon: Settings },
  { href: "/admin/jobs", label: "Background jobs", icon: Activity, adminOnly: true },
  { href: "/admin/audit-logs", label: "Audit history", icon: ShieldCheck, adminOnly: true },
  { href: "/admin/access", label: "Staff access", icon: ShieldCheck, adminOnly: true },
];

const titles: Array<[string, string, string]> = [
  ["/admin/analytics", "Analytics", "Insights"],
  ["/admin/orders", "Orders", "Fulfilment"],
  ["/admin/production", "Production", "Workshop"],
  ["/admin/custom-requests", "Custom requests", "Quote workflow"],
  ["/admin/support", "Customer support", "Service"],
  ["/admin/products", "Products", "Catalogue"],
  ["/admin/inventory", "Inventory", "Stock control"],
  ["/admin/reviews", "Reviews", "Moderation"],
  ["/admin/payments", "Payments", "Money in"],
  ["/admin/finance", "Finance", "Ledger"],
  ["/admin/tax-settings", "GST & tax", "Compliance"],
  ["/admin/refunds", "Refunds", "Money out"],
  ["/admin/coupons", "Coupons", "Promotions"],
  ["/admin/store-settings", "Store settings", "Configuration"],
  ["/admin/jobs", "Background jobs", "Operations"],
  ["/admin/audit-logs", "Audit history", "Security"],
  ["/admin/access", "Staff access", "Security"],
  ["/admin", "Overview", "Workspace"],
];

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminShell({ role, children }: { role: Role; children: React.ReactNode }) {
  const pathname = usePathname() || "/admin";
  const match = titles.find(([href]) => isActive(pathname, href, href === "/admin"));
  const title = match?.[1] ?? "Admin";
  const group = match?.[2] ?? "Workspace";
  const links = (items: typeof workspace) => items.filter((item) => !item.adminOnly || role === "ADMIN");

  const renderLink = ({ href, label, icon: Icon }: { href: string; label: string; icon: typeof Gauge }) => {
    const active = isActive(pathname, href, href === "/admin");
    return (
      <Link key={href} href={href} className="vx-admin__link" aria-current={active ? "page" : undefined}>
        <Icon size={16} strokeWidth={1.9} aria-hidden="true" />
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <div className="vx-admin">
      <a href="#admin-content" className="sr-only focus:not-sr-only">Skip to admin content</a>
      <aside className="vx-admin__aside" aria-label="Admin navigation">
        <div className="vx-admin__brand">
          <span className="vx-admin__mark" aria-hidden="true">V</span>
          <span>
            <span className="vx-admin__brand-name">VEXAUSE</span>
            <span className="vx-admin__brand-sub">LABS ADMIN</span>
          </span>
        </div>
        <p className="vx-admin__group">Workspace</p>
        <nav className="vx-admin__nav">{links(workspace).map(renderLink)}</nav>
        <p className="vx-admin__group">Money &amp; insight</p>
        <nav className="vx-admin__nav">{links(finance).map(renderLink)}</nav>
        <p className="vx-admin__group">Management</p>
        <nav className="vx-admin__nav">{links(management).map(renderLink)}</nav>
        <div className="vx-admin__aside-foot">
          <p style={{ color: "#dbe8de", fontWeight: 700, letterSpacing: ".06em" }}>VEXAUSE LABS</p>
          <p style={{ marginTop: 4 }}>{role === "ADMIN" ? "Administrator access" : "Staff access"} · Operations workspace</p>
          <Link href="/" style={{ display: "inline-block", marginTop: 10, color: "#c8f36a", textDecoration: "underline" }}>
            View storefront
          </Link>
        </div>
      </aside>

      <div className="vx-admin__main">
        <nav className="vx-admin__mobile-nav" aria-label="Admin mobile navigation">
          {links([...workspace, ...finance, ...management]).map(({ href, label }) => (
            <Link key={href} href={href} aria-current={isActive(pathname, href, href === "/admin") ? "page" : undefined}>
              {label}
            </Link>
          ))}
        </nav>
        <header className="vx-admin__topbar">
          <div>
            <p className="vx-admin__breadcrumb">VEXAUSE LABS / {group}</p>
            <h1 className="vx-admin__page-title">{title}</h1>
          </div>
          <div className="vx-row" style={{ gap: 8 }}>
            <span className={`vx-badge vx-badge--${role === "ADMIN" ? "brand" : "neutral"}`}>{role === "ADMIN" ? "Administrator" : "Staff"}</span>
            <Link href="/admin/store-settings" className="vx-btn vx-btn--sm">Settings</Link>
          </div>
        </header>
        <div className="vx-admin__body" id="admin-content">
          {children}
        </div>
      </div>
    </div>
  );
}
