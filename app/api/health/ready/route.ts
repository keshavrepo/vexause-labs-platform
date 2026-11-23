import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(
      { status: "ready", checks: { database: "ok" } },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    // Deliberately do not expose connection strings, SQL, or database error details.
    return NextResponse.json(
      { status: "not_ready", checks: { database: "unavailable" } },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
