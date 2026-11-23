import type { Metadata } from "next";
import ProductDetailClient from "@/components/ProductDetailClient";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findFirst({
    where: { slug, isPublished: true },
    select: { name: true, shortDescription: true, description: true, images: { orderBy: { sortOrder: "asc" }, take: 1, select: { storageKey: true, altText: true } } },
  });
  if (!product) return { title: "Product not found | VEXAUSE LABS", robots: { index: false, follow: false } };
  const description = product.shortDescription || product.description.slice(0, 155);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const image = product.images[0] ? `/uploads/${product.images[0].storageKey}` : undefined;
  return {
    title: `${product.name} | VEXAUSE LABS`,
    description,
    alternates: siteUrl ? { canonical: `${siteUrl.replace(/\/$/, "")}/product/${slug}` } : undefined,
    openGraph: { title: product.name, description, type: "website", images: image && siteUrl ? [{ url: `${siteUrl.replace(/\/$/, "")}${image}`, alt: product.images[0].altText }] : undefined },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ProductDetailClient slug={slug} />;
}
