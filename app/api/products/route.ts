import { enforceRateLimit } from "@/lib/security/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const querySchema = z.object({
  q: z.string().trim().max(80).optional().default(""),
  category: z.string().trim().max(80).optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  sort: z.enum(["newest", "price-asc", "price-desc", "name-asc"]).optional().default("newest"),
  page: z.coerce.number().int().min(1).max(100000).optional().default(1),
  limit: z.coerce.number().int().min(1).max(48).optional().default(12),
  inStock: z.enum(["true", "false"]).optional().default("false"),
  ids: z.string().max(4000).optional(),
});

export async function GET(request: NextRequest) {
  const rate = await enforceRateLimit(request, { namespace: "catalogue-search", limit: 120, windowMs: 60000 });
  if (!rate.allowed) return rate.response;
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams.entries()));
  if (!parsed.success) return NextResponse.json({ error: "Invalid catalogue filters." }, { status: 400 });
  const { q, category, minPrice, maxPrice, sort, page, limit, inStock, ids: idsRaw } = parsed.data;
  const ids = idsRaw ? Array.from(new Set(idsRaw.split(",").map(value => value.trim()).filter(Boolean))) : [];
  if (idsRaw !== undefined && (ids.length === 0 || ids.length > 48 || ids.some(id => id.length > 64)))
    return NextResponse.json({ error: "Product lookup accepts between 1 and 48 valid IDs." }, { status: 400 });
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice)
    return NextResponse.json({ error: "Minimum price cannot exceed maximum price." }, { status: 400 });

  const conditions: Prisma.ProductWhereInput[] = [];
  if (inStock === "true") conditions.push({ OR: [
    { AND: [{ variants: { none: { isActive: true } } }, { OR: [{ trackInventory: false }, { stockQuantity: { gt: 0 } }] }] },
    { variants: { some: { isActive: true, OR: [{ trackInventory: false }, { stockQuantity: { gt: 0 } }] } } },
  ] });
  if (minPrice !== undefined || maxPrice !== undefined) {
    const range = { ...(minPrice !== undefined ? { gte: minPrice } : {}), ...(maxPrice !== undefined ? { lte: maxPrice } : {}) };
    conditions.push({ OR: [
      { AND: [{ variants: { none: { isActive: true } } }, { pricePaise: range }] },
      { variants: { some: { isActive: true, pricePaise: range } } },
    ] });
  }
  if (q) conditions.push({ OR: [
    { name: { contains: q, mode: "insensitive" } },
    { shortDescription: { contains: q, mode: "insensitive" } },
    { description: { contains: q, mode: "insensitive" } },
    { sku: { contains: q, mode: "insensitive" } },
  ] });
  const where: Prisma.ProductWhereInput = {
    isPublished: true,
    ...(idsRaw !== undefined ? { id: { in: ids } } : {}),
    ...(category ? { category: { is: { slug: category, isActive: true } } } : {}),
    ...(conditions.length ? { AND: conditions } : {}),
  };
  const orderBy: Prisma.ProductOrderByWithRelationInput[] =
    sort === "price-asc" ? [{ pricePaise: "asc" }, { id: "asc" }] :
    sort === "price-desc" ? [{ pricePaise: "desc" }, { id: "asc" }] :
    sort === "name-asc" ? [{ name: "asc" }, { id: "asc" }] :
    [{ createdAt: "desc" }, { id: "desc" }];

  const skip = (page - 1) * limit;
  const [total, products, categories] = await prisma.$transaction([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where, orderBy, skip, take: limit,
      select: {
        id: true, name: true, slug: true, shortDescription: true, description: true,
        pricePaise: true, compareAtPaise: true, sku: true, stockQuantity: true,
        trackInventory: true, createdAt: true,
        category: { select: { id: true, name: true, slug: true } },
        images: { orderBy: { sortOrder: "asc" }, take: 1, select: { id: true, altText: true, storageKey: true } },
        variants: { where: { isActive: true }, orderBy: [{ pricePaise: "asc" }, { sortOrder: "asc" }], select: { id: true, name: true, sku: true, optionValues: true, pricePaise: true, compareAtPaise: true, stockQuantity: true, trackInventory: true } },
        _count: { select: { reviews: { where: { status: "APPROVED" } } } },
      },
    }),
    prisma.category.findMany({
      where: { isActive: true, products: { some: { isPublished: true } } },
      orderBy: { name: "asc" }, select: { id: true, name: true, slug: true },
    }),
  ]);
  const pageCount = Math.ceil(total / limit);
  return NextResponse.json({
    products: products.map(product => ({
      ...product,
      images: product.images.map(image => ({ id: image.id, altText: image.altText, url: `/uploads/${image.storageKey}` })),
      reviewCount: product._count.reviews,
      hasVariants: product.variants.length > 0,
      variants: product.variants.map(variant => ({ ...variant, available: !variant.trackInventory || variant.stockQuantity > 0 })),
      pricePaise: product.variants[0]?.pricePaise ?? product.pricePaise,
      available: product.variants.length > 0
        ? product.variants.some(variant => !variant.trackInventory || variant.stockQuantity > 0)
        : (!product.trackInventory || product.stockQuantity > 0),
    })),
    pagination: { page, limit, total, pageCount, hasNextPage: page < pageCount, hasPreviousPage: page > 1 },
    categories,
    applied: { q, category: category || null, minPrice: minPrice ?? null, maxPrice: maxPrice ?? null, sort, inStock: inStock === "true" },
  }, { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" } });
}
