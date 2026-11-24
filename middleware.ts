import { NextRequest, NextResponse } from "next/server";

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const WEBHOOK_PREFIX = "/api/webhooks/";

/**
 * Origins that may issue state-changing API calls.
 *
 * `request.nextUrl.origin` follows the address the server was bound to (for
 * example `http://0.0.0.0:3000` under `next dev -H 0.0.0.0`, or an internal
 * host behind a proxy), which is not what the browser reports in `Origin`.
 * The request's own Host / X-Forwarded-Host is what the client actually
 * addressed, so that is the authoritative same-origin comparison; extra
 * origins can still be allowed explicitly through TRUSTED_ORIGINS.
 */
function allowedOrigins(request: NextRequest) {
  const values = new Set<string>([request.nextUrl.origin]);

  const host = (request.headers.get("x-forwarded-host") || request.headers.get("host") || "")
    .split(",")[0]
    .trim();
  if (host) {
    const forwardedProto = (request.headers.get("x-forwarded-proto") || "").split(",")[0].trim();
    if (forwardedProto) values.add(`${forwardedProto}://${host}`);
    // Browsers always send Origin, and the scheme may be terminated by a proxy
    // that does not forward the protocol header; the host is not attacker
    // controllable, so accepting both schemes for it keeps same-origin working
    // without widening the allow-list beyond this site.
    values.add(`https://${host}`);
    values.add(`http://${host}`);
  }

  for (const value of (process.env.TRUSTED_ORIGINS || "").split(",")) {
    const trimmed = value.trim();
    if (!trimmed) continue;
    try { values.add(new URL(trimmed).origin); } catch { /* ignore malformed deployment config */ }
  }
  return values;
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (pathname.startsWith("/api/") && MUTATING.has(request.method) && !pathname.startsWith(WEBHOOK_PREFIX)) {
    const origin = request.headers.get("origin");
    // Browser state-changing requests must carry a same-site or explicitly trusted Origin.
    if (!origin) return NextResponse.json({ error: "Origin header required." }, { status: 403 });
    let parsed: URL;
    try { parsed = new URL(origin); } catch { return NextResponse.json({ error: "Invalid request origin." }, { status: 403 }); }
    if (!allowedOrigins(request).has(parsed.origin))
      return NextResponse.json({ error: "Cross-origin request blocked." }, { status: 403 });
  }

  const response = NextResponse.next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  response.headers.set("X-DNS-Prefetch-Control", "on");
  response.headers.set("Content-Security-Policy-Report-Only",
    "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; img-src 'self' data: https:; font-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com; connect-src 'self' https://api.razorpay.com https://checkout.razorpay.com; frame-src https://api.razorpay.com https://checkout.razorpay.com");
  if (process.env.NODE_ENV === "production") response.headers.set("Strict-Transport-Security", "max-age=31536000");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
