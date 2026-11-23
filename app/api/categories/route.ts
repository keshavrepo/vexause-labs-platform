import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET() {
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ categories });
}

const schema = z.object({
  name: z.string().trim().min(2).max(80),
  slug: z.string().trim().min(2).max(90).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
});

export async function POST(request: NextRequest) {
  const auth = await requireAdminApi(request);
  if (auth.response) return auth.response;
  try {
    const data = schema.parse(await request.json());
    const category = await prisma.category.create({ data });
    await prisma.auditLog.create({
      data: { actorId: auth.session!.userId, action: "CATEGORY_CREATED", entityType: "Category", entityId: category.id },
    });
    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid category data", details: error.flatten() }, { status: 400 });
    return NextResponse.json({ error: "Could not create category. Name/slug may already exist." }, { status: 409 });
  }
}
