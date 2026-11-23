import { NextRequest, NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/session";

export const runtime = "nodejs";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; imageId: string }> }) {
  const auth = await requireAdminApi(request);
  if (auth.response) return auth.response;
  const { id, imageId } = await params;

  const image = await prisma.productImage.findFirst({
    where: { id: imageId, productId: id },
  });
  if (!image) return NextResponse.json({ error: "Image not found" }, { status: 404 });

  const root = path.resolve(process.cwd(), "public", "uploads");
  const filePath = path.resolve(root, image.storageKey);
  if (!filePath.startsWith(root + path.sep)) return NextResponse.json({ error: "Invalid storage path" }, { status: 400 });

  try {
    await unlink(filePath).catch((error: NodeJS.ErrnoException) => { if (error.code !== "ENOENT") throw error; });
    await prisma.productImage.delete({ where: { id: image.id } });
    await prisma.auditLog.create({
      data: { actorId: auth.session!.userId, action: "PRODUCT_IMAGE_DELETED", entityType: "ProductImage", entityId: image.id },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Local image deletion failed", error);
    return NextResponse.json({ error: "Could not delete image" }, { status: 500 });
  }
}
