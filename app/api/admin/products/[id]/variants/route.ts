import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/session";

const optionValuesSchema = z.record(z.string(), z.string().trim().min(1).max(60)).refine(v => Object.keys(v).length > 0 && Object.keys(v).length <= 8);
const createSchema = z.object({
  name: z.string().trim().min(1).max(120),
  sku: z.string().trim().max(80).nullable().optional(),
  optionValues: optionValuesSchema,
  pricePaise: z.number().int().positive().max(100000000),
  compareAtPaise: z.number().int().positive().max(100000000).nullable().optional(),
  stockQuantity: z.number().int().min(0).max(1000000).default(0),
  trackInventory: z.boolean().default(true),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().min(0).max(10000).default(0),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi(request); if (auth.response) return auth.response;
  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id }, select: { id: true } });
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });
  const variants = await prisma.productVariant.findMany({ where: { productId: id }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] });
  return NextResponse.json({ variants });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminApi(request); if (auth.response) return auth.response;
  try {
    const { id } = await params;
    const data = createSchema.parse(await request.json());
    if (data.compareAtPaise != null && data.compareAtPaise <= data.pricePaise)
      return NextResponse.json({ error: "Compare-at price must be greater than variant price." }, { status: 400 });
    const product = await prisma.product.findUnique({ where: { id }, select: { id: true } });
    if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });
    const variant = await prisma.productVariant.create({ data: { ...data, sku: data.sku || null, productId: id } });
    await prisma.auditLog.create({ data: { actorId: auth.session!.userId, action: "PRODUCT_VARIANT_CREATED", entityType: "ProductVariant", entityId: variant.id, metadata: { productId: id, name: variant.name } } });
    return NextResponse.json({ variant }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid variant details." }, { status: 400 });
    if ((error as { code?: string })?.code === "P2002") return NextResponse.json({ error: "That variant SKU is already in use." }, { status: 409 });
    return NextResponse.json({ error: "Could not create product variant." }, { status: 500 });
  }
}
