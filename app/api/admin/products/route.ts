import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireAdminApi(request);
  if (auth.response) return auth.response;
  const products = await prisma.product.findMany({
    include: { category: true, images: { orderBy: { sortOrder: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
  const safeProducts = products.map(product => ({
    ...product,
    images: product.images.map(image => ({
      id: image.id, altText: image.altText, sortOrder: image.sortOrder,
      url: `/uploads/${image.storageKey}`,
    })),
  }));
  return NextResponse.json({ products: safeProducts });
}
