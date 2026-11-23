import { enforceRateLimit } from "@/lib/security/rate-limit";
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/session";

export const runtime = "nodejs";
const MAX_BYTES = 8 * 1024 * 1024;
const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/avif": "avif",
};

function hasValidSignature(bytes: Buffer, mime: string) {
  if (mime === "image/jpeg") return bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mime === "image/png") return bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  if (mime === "image/webp") return bytes.toString("ascii",0,4) === "RIFF" && bytes.toString("ascii",8,12) === "WEBP";
  if (mime === "image/avif") return bytes.toString("ascii",4,12).includes("ftypavif") || bytes.toString("ascii",4,16).includes("ftypavis");
  return false;
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const rate = await enforceRateLimit(request, { namespace: "admin-product-image-upload", limit: 30, windowMs: 3600000 });
  if (!rate.allowed) return rate.response;
  const auth = await requireAdminApi(request);
  if (auth.response) return auth.response;

  const { id } = await params;
  const product = await prisma.product.findUnique({ where: { id }, select: { id: true } });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  try {
    const form = await request.formData();
    const file = form.get("file");
    const altText = String(form.get("altText") || "").trim().slice(0,180);
    if (!(file instanceof File)) return NextResponse.json({ error: "Image file is required" }, { status: 400 });
    if (!MIME_EXT[file.type] || file.size < 1 || file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Use JPG, PNG, WebP or AVIF up to 8 MB" }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    if (!hasValidSignature(bytes, file.type)) return NextResponse.json({ error: "File content does not match its image type" }, { status: 400 });

    const folder = path.join(process.cwd(), "public", "uploads", "products", product.id);
    await mkdir(folder, { recursive: true });
    const fileName = `${randomUUID()}.${MIME_EXT[file.type]}`;
    await writeFile(path.join(folder, fileName), bytes, { flag: "wx" });

    const storageKey = `products/${product.id}/${fileName}`;
    try {
      const last = await prisma.productImage.findFirst({
        where: { productId: product.id }, orderBy: { sortOrder: "desc" }, select: { sortOrder: true },
      });
      const image = await prisma.productImage.create({
        data: { productId: product.id, storageKey, altText: altText || file.name.slice(0,180), sortOrder: (last?.sortOrder ?? -1) + 1 },
      });
      await prisma.auditLog.create({
        data: { actorId: auth.session!.userId, action: "PRODUCT_IMAGE_ADDED", entityType: "ProductImage", entityId: image.id },
      });
      return NextResponse.json({ image: { id: image.id, altText: image.altText, url: `/uploads/${storageKey}` } }, { status: 201 });
    } catch (dbError) {
      const { unlink } = await import("fs/promises");
      await unlink(path.join(folder, fileName)).catch(() => undefined);
      throw dbError;
    }
  } catch (error) {
    console.error("Local product image upload failed", error);
    return NextResponse.json({ error: "Could not save product image on this server" }, { status: 500 });
  }
}
