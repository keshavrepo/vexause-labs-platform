import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/session";

export async function GET(request: NextRequest) {
  const auth = await requireAdminApi(request);
  if (auth.response) return auth.response;
  const status = request.nextUrl.searchParams.get("status");
  const reviews = await prisma.productReview.findMany({
    where: status && ["PENDING","APPROVED","REJECTED"].includes(status) ? { status: status as any } : {},
    orderBy: { createdAt: "desc" },
    include: { product: { select: { name: true, slug: true } }, user: { select: { name: true, email: true } }, order: { select: { orderCode: true, status: true } } }
  });
  return NextResponse.json({ reviews });
}

const updateSchema = z.object({ reviewId: z.string().min(1), status: z.enum(["APPROVED","REJECTED"]), adminNote: z.string().max(500).optional() });
export async function PATCH(request: NextRequest) {
  const auth = await requireAdminApi(request);
  if (auth.response) return auth.response;
  try {
    const input = updateSchema.parse(await request.json());
    const review = await prisma.productReview.update({
      where: { id: input.reviewId },
      data: { status: input.status, adminNote: input.adminNote?.trim() || null },
      select: { id: true, status: true, adminNote: true }
    });
    return NextResponse.json({ review });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid moderation details." }, { status: 400 });
    return NextResponse.json({ error: "Could not update review." }, { status: 500 });
  }
}
