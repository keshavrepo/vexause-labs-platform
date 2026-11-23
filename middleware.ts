import { NextRequest, NextResponse } from "next/server";

const MUTATING = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const WEBHOOK_PREFIX = "/api/webhooks/";

function allowedOrigins(request: NextRequest) {
  const values = new Set<string>([request.nextUrl.origin]);
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
