import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const revalidate = 60;

export async function GET(_request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await prisma.product.findFirst({
    where: { slug, isPublished: true },
    select: {
      id: true, name: true, slug: true, shortDescription: true, description: true,
      pricePaise: true, compareAtPaise: true, sku: true, stockQuantity: true,
      trackInventory: true,
      category: { select: { id: true, name: true, slug: true } },
      images: { orderBy: { sortOrder: "asc" }, select: { id: true, altText: true, storageKey: true } },
      variants: { where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }], select: {
        id: true, name: true, sku: true, optionValues: true, pricePaise: true, compareAtPaise: true,
        stockQuantity: true, trackInventory: true,
      } },
      _count: { select: { reviews: { where: { status: "APPROVED" } } } },
    },
  });
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });
  return NextResponse.json({
    product: {
      ...product,
      images: product.images.map(image => ({ id: image.id, altText: image.altText, url: `/uploads/${image.storageKey}` })),
      reviewCount: product._count.reviews,
      variants: product.variants.map(variant => ({ ...variant, available: !variant.trackInventory || variant.stockQuantity > 0 })),
      available: !product.trackInventory || product.stockQuantity > 0,
    },
  }, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } });
}
