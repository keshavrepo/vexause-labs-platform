import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/session";

const schema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  sku: z.string().trim().max(80).nullable().optional(),
  optionValues: z.record(z.string(), z.string().trim().min(1).max(60)).refine(v => Object.keys(v).length > 0 && Object.keys(v).length <= 8).optional(),
  pricePaise: z.number().int().positive().max(100000000).optional(),
  compareAtPaise: z.number().int().positive().max(100000000).nullable().optional(),
  stockQuantity: z.number().int().min(0).max(1000000).optional(),
  trackInventory: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(10000).optional(),
});
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string; variantId: string }> }) {
  const auth = await requireAdminApi(request); if (auth.response) return auth.response;
  try {
    const { id, variantId } = await params;
    const data = schema.parse(await request.json());
    const current = await prisma.productVariant.findFirst({ where: { id: variantId, productId: id } });
    if (!current) return NextResponse.json({ error: "Variant not found." }, { status: 404 });
    const price = data.pricePaise ?? current.pricePaise;
    const compare = data.compareAtPaise === undefined ? current.compareAtPaise : data.compareAtPaise;
    if (compare != null && compare <= price) return NextResponse.json({ error: "Compare-at price must be greater than variant price." }, { status: 400 });
    const variant = await prisma.productVariant.update({ where: { id: current.id }, data });
    await prisma.auditLog.create({ data: { actorId: auth.session!.userId, action: "PRODUCT_VARIANT_UPDATED", entityType: "ProductVariant", entityId: variant.id, metadata: { productId: id } } });
    return NextResponse.json({ variant });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid variant details." }, { status: 400 });
    if ((error as { code?: string })?.code === "P2002") return NextResponse.json({ error: "That variant SKU is already in use." }, { status: 409 });
    return NextResponse.json({ error: "Could not update product variant." }, { status: 500 });
  }
}
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; variantId: string }> }) {
  const auth = await requireAdminApi(request); if (auth.response) return auth.response;
  const { id, variantId } = await params;
  const result = await prisma.productVariant.updateMany({ where: { id: variantId, productId: id }, data: { isActive: false } });
  if (!result.count) return NextResponse.json({ error: "Variant not found." }, { status: 404 });
  await prisma.auditLog.create({ data: { actorId: auth.session!.userId, action: "PRODUCT_VARIANT_ARCHIVED", entityType: "ProductVariant", entityId: variantId, metadata: { productId: id } } });
  return NextResponse.json({ ok: true });
}
