import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/session";

const updateSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  slug: z.string().trim().min(2).max(140).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  shortDescription: z.string().trim().min(5).max(240).optional(),
  description: z.string().trim().min(5).max(10000).optional(),
  pricePaise: z.number().int().positive().max(100000000).optional(),
  hsnCode: z.string().trim().max(8).nullable().optional(),
  gstRateBps: z.number().int().min(0).max(2800).optional(),
  compareAtPaise: z.number().int().positive().max(100000000).nullable().optional(),
  sku: z.string().trim().max(80).nullable().optional(),
  stockQuantity: z.number().int().min(0).max(100000).optional(),
  trackInventory: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  categoryId: z.string().nullable().optional(),
});

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { images: { orderBy: { sortOrder: "asc" } }, category: true },
  });
  if (!product || !product.isPublished) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  return NextResponse.json({ product });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi(request);
  if (auth.response) return auth.response;
  try {
    const { id } = await params;
    const data = updateSchema.parse(await request.json());
    const product = await prisma.product.update({ where: { id }, data });
    await prisma.auditLog.create({
      data: { actorId: auth.session!.userId, action: "PRODUCT_UPDATED", entityType: "Product", entityId: product.id },
    });
    return NextResponse.json({ product });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid product data", details: error.flatten() }, { status: 400 });
    console.error("Product update failed", error);
    return NextResponse.json({ error: "Could not update product. Check unique slug/SKU and product ID." }, { status: 409 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi(request);
  if (auth.response) return auth.response;
  try {
    const { id } = await params;
    // Soft-hide products so historical order records remain intact.
    const product = await prisma.product.update({
      where: { id },
      data: { isPublished: false },
      select: { id: true },
    });
    await prisma.auditLog.create({
      data: { actorId: auth.session!.userId, action: "PRODUCT_UNPUBLISHED", entityType: "Product", entityId: product.id },
    });
    return NextResponse.json({ ok: true, message: "Product unpublished" });
  } catch (error) {
    console.error("Product unpublish failed", error);
    return NextResponse.json({ error: "Could not unpublish product" }, { status: 404 });
  }
}
