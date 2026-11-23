import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/customer-session";

const schema = z.object({ productId: z.string().min(1), variantId: z.string().min(1).nullable().optional(), quantity: z.number().int().min(1).max(99) });

export async function GET(request: NextRequest) {
  const auth = await requireCustomer(request); if (auth.response) return auth.response;
  const cart = await prisma.cart.findUnique({ where: { userId: auth.userId! }, include: { items: { include: {
    product: { include: { images: { orderBy: { sortOrder: "asc" } } } },
    variant: true,
  } } } });
  return NextResponse.json({ cart });
}

export async function POST(request: NextRequest) {
  const auth = await requireCustomer(request); if (auth.response) return auth.response;
  try {
    const data = schema.parse(await request.json());
    const product = await prisma.product.findFirst({ where: { id: data.productId, isPublished: true }, include: { variants: { where: { isActive: true }, select: { id: true } } } });
    if (!product) return NextResponse.json({ error: "Product unavailable." }, { status: 404 });
    let variant: { id: string; stockQuantity: number; trackInventory: boolean } | null = null;
    if (product.variants.length) {
      if (!data.variantId) return NextResponse.json({ error: "Choose a product option first." }, { status: 400 });
      variant = await prisma.productVariant.findFirst({ where: { id: data.variantId, productId: product.id, isActive: true }, select: { id: true, stockQuantity: true, trackInventory: true } });
      if (!variant) return NextResponse.json({ error: "Selected product option is unavailable." }, { status: 409 });
      if (variant.trackInventory && data.quantity > variant.stockQuantity) return NextResponse.json({ error: "Requested quantity exceeds variant stock." }, { status: 409 });
    } else if (data.variantId) return NextResponse.json({ error: "This product does not have selectable options." }, { status: 400 });
    else if (product.trackInventory && data.quantity > product.stockQuantity) return NextResponse.json({ error: "Requested quantity exceeds available stock." }, { status: 409 });

    const cart = await prisma.cart.upsert({ where: { userId: auth.userId! }, create: { userId: auth.userId! }, update: {} });
    const existing = await prisma.cartItem.findFirst({ where: { cartId: cart.id, productId: data.productId, variantId: variant?.id ?? null } });
    const item = existing
      ? await prisma.cartItem.update({ where: { id: existing.id }, data: { quantity: data.quantity } })
      : await prisma.cartItem.create({ data: { cartId: cart.id, productId: data.productId, variantId: variant?.id ?? null, quantity: data.quantity } });
    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid cart item." }, { status: 400 });
    return NextResponse.json({ error: "Could not update cart." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireCustomer(request); if (auth.response) return auth.response;
  try {
    const body = z.object({ productId: z.string().min(1), variantId: z.string().min(1).nullable().optional() }).parse(await request.json());
    const cart = await prisma.cart.findUnique({ where: { userId: auth.userId! } });
    if (cart) await prisma.cartItem.deleteMany({ where: { cartId: cart.id, productId: body.productId, variantId: body.variantId ?? null } });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Invalid cart item." }, { status: 400 }); }
}


const replaceSchema = z.object({ items: z.array(schema).max(100) });
export async function PUT(request: NextRequest) {
  const auth = await requireCustomer(request); if (auth.response) return auth.response;
  try {
    const input = replaceSchema.parse(await request.json());
    const dedupe = new Set<string>();
    for (const line of input.items) {
      const key = `${line.productId}:${line.variantId || ""}`;
      if (dedupe.has(key)) return NextResponse.json({ error: "Duplicate cart line." }, { status: 400 });
      dedupe.add(key);
      const product = await prisma.product.findFirst({ where: { id: line.productId, isPublished: true }, include: { variants: { where: { isActive: true }, select: { id: true } } } });
      if (!product) return NextResponse.json({ error: "A product in your cart is no longer available." }, { status: 409 });
      if (product.variants.length) {
        if (!line.variantId) return NextResponse.json({ error: "Choose an option for every configurable product." }, { status: 409 });
        const variant = await prisma.productVariant.findFirst({ where: { id: line.variantId, productId: product.id, isActive: true } });
        if (!variant || (variant.trackInventory && line.quantity > variant.stockQuantity)) return NextResponse.json({ error: "A selected option is unavailable or has insufficient stock." }, { status: 409 });
      } else if (line.variantId) return NextResponse.json({ error: "A cart option no longer exists." }, { status: 409 });
      else if (product.trackInventory && line.quantity > product.stockQuantity) return NextResponse.json({ error: "A product has insufficient stock." }, { status: 409 });
    }
    const cart = await prisma.$transaction(async tx => {
      const saved = await tx.cart.upsert({ where: { userId: auth.userId! }, create: { userId: auth.userId! }, update: {} });
      await tx.cartItem.deleteMany({ where: { cartId: saved.id } });
      if (input.items.length) await tx.cartItem.createMany({ data: input.items.map(line => ({ cartId: saved.id, productId: line.productId, variantId: line.variantId || null, quantity: line.quantity })) });
      return tx.cart.findUnique({ where: { id: saved.id }, include: { items: { include: { product: true, variant: true } } } });
    });
    return NextResponse.json({ cart });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid cart contents." }, { status: 400 });
    return NextResponse.json({ error: "Could not synchronize cart." }, { status: 500 });
  }
}
