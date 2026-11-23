"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/account", label: "Overview", exact: true },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/addresses", label: "Addresses", exact: true },
  { href: "/account/custom-requests", label: "Custom requests", exact: true },
  { href: "/account/reviews", label: "Reviews", exact: true },
  { href: "/account/notifications", label: "Notifications", exact: true },
  { href: "/account/support", label: "Support", exact: true },
];

export default function CustomerNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Customer account" className="customer-nav mt-5 flex gap-2 overflow-x-auto border-b border-[#DCE4DC] pb-3">
      {links.map(link => {
        const active = link.exact ? pathname === link.href : pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link key={link.href} href={link.href} aria-current={active ? "page" : undefined}
            className={`min-h-10 shrink-0 whitespace-nowrap px-3 py-2 text-xs font-bold transition-colors ${active ? "bg-[#173D32] text-white" : "border border-[#DCE4DC] bg-white text-[#52675A] hover:border-[#78A88C]"}`}>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
