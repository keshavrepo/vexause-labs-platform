import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/session";

export async function GET(request: NextRequest) {
  const auth = await requireAdminApi(request);
  if (auth.response) return auth.response;
  const [jobs, counts] = await Promise.all([
    prisma.backgroundJob.findMany({
      orderBy: { createdAt: "desc" }, take: 100,
      select: { id: true, type: true, status: true, attempts: true, maxAttempts: true, runAt: true, lastError: true, createdAt: true, completedAt: true },
    }),
    prisma.backgroundJob.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  return NextResponse.json({ jobs, counts });
}
const schema = z.object({ jobId: z.string().min(1) });
export async function PATCH(request: NextRequest) {
  const auth = await requireAdminApi(request);
  if (auth.response) return auth.response;
  try {
    const { jobId } = schema.parse(await request.json());
    const updated = await prisma.backgroundJob.updateMany({
      where: { id: jobId, status: "FAILED" },
      data: { status: "PENDING", attempts: 0, runAt: new Date(), lockedAt: null, lockedBy: null, lastError: null },
    });
    if (!updated.count) return NextResponse.json({ error: "Failed job not found." }, { status: 404 });
    await prisma.auditLog.create({
      data: { actorId: auth.session!.userId, action: "BACKGROUND_JOB_REQUEUED", entityType: "BackgroundJob", entityId: jobId },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Invalid retry request." }, { status: 400 });
  }
}
