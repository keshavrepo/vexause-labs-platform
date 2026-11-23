import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/session";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  actorId: z.string().max(100).optional(),
  action: z.string().trim().max(100).optional(),
  entityType: z.string().trim().max(100).optional(),
  entityId: z.string().trim().max(120).optional(),
  page: z.coerce.number().int().min(1).max(100000).default(1),
  pageSize: z.coerce.number().int().min(10).max(100).default(25),
});

const REDACT = /password|secret|token|authorization|cookie|credential|private.?key|api.?key|signature|gstin|email|phone|address|ipaddress/i;
function safeMetadata(value: unknown, depth = 0): unknown {
  if (depth > 4) return "[nested data omitted]";
  if (value === null || typeof value === "boolean" || typeof value === "number") return value;
  if (typeof value === "string") return value.length > 240 ? `${value.slice(0, 237)}…` : value;
  if (Array.isArray(value)) return value.slice(0, 20).map(v => safeMetadata(v, depth + 1));
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>).slice(0, 30)) {
      if (REDACT.test(key)) out[key] = "[redacted]";
      else out[key] = safeMetadata(item, depth + 1);
    }
    return out;
  }
  return String(value);
}

export async function GET(request: NextRequest) {
  const auth = await requireAdminApi(request);
  if (auth.response) return auth.response;
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams.entries()));
  if (!parsed.success) return NextResponse.json({ error: "Invalid audit log filters." }, { status: 400 });
  const q = parsed.data;
  const from = q.from ? new Date(`${q.from}T00:00:00.000Z`) : undefined;
  const to = q.to ? new Date(`${q.to}T00:00:00.000Z`) : undefined;
  if ((from && Number.isNaN(from.getTime())) || (to && Number.isNaN(to.getTime())) || (from && to && from > to)) {
    return NextResponse.json({ error: "Choose a valid date range." }, { status: 400 });
  }
  if (from && to && to.getTime() - from.getTime() > 366 * 86400000) {
    return NextResponse.json({ error: "Date range cannot exceed 366 days." }, { status: 400 });
  }
  const where: any = {
    ...(q.actorId ? { actorId: q.actorId } : {}),
    ...(q.action ? { action: { contains: q.action, mode: "insensitive" } } : {}),
    ...(q.entityType ? { entityType: { contains: q.entityType, mode: "insensitive" } } : {}),
    ...(q.entityId ? { entityId: { contains: q.entityId, mode: "insensitive" } } : {}),
    ...(from || to ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lt: new Date(to.getTime() + 86400000) } : {}) } } : {}),
  };
  const [rows, total, actors] = await Promise.all([
    prisma.auditLog.findMany({
      where, orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      skip: (q.page - 1) * q.pageSize, take: q.pageSize,
      select: { id: true, actorId: true, action: true, entityType: true, entityId: true, metadata: true, createdAt: true,
        actor: { select: { name: true, email: true } } },
    }),
    prisma.auditLog.count({ where }),
    prisma.user.findMany({ where: { role: { in: ["ADMIN", "STAFF"] } }, select: { id: true, name: true, email: true }, orderBy: { name: "asc" }, take: 200 }),
  ]);
  return NextResponse.json({
    logs: rows.map(row => ({ ...row, metadata: safeMetadata(row.metadata), actor: row.actor ? { name: row.actor.name, email: row.actor.email } : null })),
    total, page: q.page, pageSize: q.pageSize, totalPages: Math.max(1, Math.ceil(total / q.pageSize)),
    actors: actors.map(a => ({ id: a.id, label: `${a.name || "Unnamed"} · ${a.email}` })),
  }, { headers: { "Cache-Control": "no-store, private" } });
}
