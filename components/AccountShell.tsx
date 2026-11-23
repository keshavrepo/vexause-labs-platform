"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/account", label: "Overview", exact: true },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/custom-requests", label: "Custom requests" },
  { href: "/account/addresses", label: "Addresses", exact: true },
  { href: "/account/reviews", label: "Reviews" },
  { href: "/account/notifications", label: "Notifications" },
  { href: "/account/support", label: "Support" },
];

const bare = /\/account\/(login|register|forgot-password|reset-password|verify-email)/;

export default function AccountShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/account";
  if (bare.test(pathname)) return <main className="vx-account__body">{children}</main>;

  return (
    <>
      <div className="vx-account__bar">
        <div className="vx-account__bar-inner">
          <div style={{ minWidth: 0 }}>
            <p className="vx-account__eyebrow">VEXAUSE LABS · Customer account</p>
            <p className="vx-small vx-muted" style={{ margin: "3px 0 0" }}>
              Orders, custom requests, invoices and support in one place.
            </p>
          </div>
          <nav className="vx-account__links" aria-label="Customer account">
            {links.map((link) => {
              const active = link.exact ? pathname === link.href : pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link key={link.href} href={link.href} aria-current={active ? "page" : undefined}>
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      <main className="vx-account__body">{children}</main>
    </>
  );
}
