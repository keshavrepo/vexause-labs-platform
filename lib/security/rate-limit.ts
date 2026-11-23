import { createHash } from "crypto";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RateLimitOptions = { limit: number; windowMs: number; namespace: string };
type RateLimitResult =
  | { allowed: false; response: NextResponse }
  | { allowed: true; remaining: number; resetAt: Date; response: null };

function clientFingerprint(request: NextRequest) {
  // Configure Nginx to overwrite these headers; never trust arbitrary client-supplied forwarding headers.
  const ip = request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  return createHash("sha256").update(ip).digest("hex");
}

/** PostgreSQL-backed atomic counter shared by all app instances. */
export async function enforceRateLimit(request: NextRequest, options: RateLimitOptions): Promise<RateLimitResult> {
  const key = createHash("sha256").update(`${options.namespace}:${clientFingerprint(request)}`).digest("hex");
  const windowMs = Math.max(1000, options.windowMs);
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMs);
  const rows = await prisma.$queryRaw<Array<{ count: number; resetAt: Date }>>(Prisma.sql`
    INSERT INTO "RateLimitBucket" ("key", "count", "resetAt", "updatedAt")
    VALUES (${key}, 1, ${resetAt}, ${now})
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimitBucket"."resetAt" <= ${now} THEN 1 ELSE "RateLimitBucket"."count" + 1 END,
      "resetAt" = CASE WHEN "RateLimitBucket"."resetAt" <= ${now} THEN ${resetAt} ELSE "RateLimitBucket"."resetAt" END,
      "updatedAt" = ${now}
    RETURNING "count", "resetAt"
  `);
  const current = rows[0];
  const remaining = Math.max(0, options.limit - current.count);
  if (current.count > options.limit) {
    const retryAfter = Math.max(1, Math.ceil((current.resetAt.getTime() - now.getTime()) / 1000));
    return {
      allowed: false,
      response: NextResponse.json(
        { error: "Too many requests. Please try again shortly.", retryAfterSeconds: retryAfter },
        { status: 429, headers: { "Retry-After": String(retryAfter), "Cache-Control": "no-store" } }
      ),
    };
  }
  return { allowed: true, remaining, resetAt: current.resetAt, response: null };
}
