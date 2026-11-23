import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/session";

const emailSchema = z.string().trim().email().max(254).transform(v => v.toLowerCase());
export async function GET(request: NextRequest) {
  const auth = await requireAdminApi(request);
  if (auth.response) return auth.response;
  const staff = await prisma.user.findMany({
    where: { role: "STAFF" }, orderBy: { createdAt: "desc" },
    select: { id: true, name: true, email: true, isActive: true, createdAt: true, updatedAt: true }
  });
  return NextResponse.json({ staff }, { headers: { "Cache-Control": "no-store" } });
}
export async function POST(request: NextRequest) {
  const auth = await requireAdminApi(request);
  if (auth.response) return auth.response;
  try {
    const d = z.object({ email: emailSchema }).parse(await request.json());
    const user = await prisma.user.findUnique({ where: { email: d.email }, select: { id: true, role: true, name: true, email: true, isActive: true } });
    if (!user) return NextResponse.json({ error: "No existing account uses that email. Ask the person to register as a customer first." }, { status: 404 });
    if (user.role === "ADMIN") return NextResponse.json({ error: "An administrator account cannot be changed to staff here." }, { status: 409 });
    if (user.role === "STAFF" && user.isActive) return NextResponse.json({ error: "This account is already active staff." }, { status: 409 });
    const updated = await prisma.$transaction(async tx => {
      const row = await tx.user.update({ where: { id: user.id }, data: { role: "STAFF", isActive: true }, select: { id: true, name: true, email: true, role: true, isActive: true } });
      await tx.auditLog.create({ data: { actorId: auth.session!.userId, action: "STAFF_ACCESS_GRANTED", entityType: "User", entityId: user.id, metadata: { email: user.email, previousRole: user.role } } });
      return row;
    });
    return NextResponse.json({ staff: updated }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Enter a valid account email." }, { status: 400 });
    return NextResponse.json({ error: "Could not grant staff access." }, { status: 500 });
  }
}
export async function PATCH(request: NextRequest) {
  const auth = await requireAdminApi(request);
  if (auth.response) return auth.response;
  try {
    const d = z.object({ userId: z.string().min(1), active: z.boolean() }).parse(await request.json());
    if (d.userId === auth.session!.userId) return NextResponse.json({ error: "You cannot change your own access here." }, { status: 409 });
    const target = await prisma.user.findUnique({ where: { id: d.userId }, select: { id: true, role: true, isActive: true, email: true } });
    if (!target || target.role !== "STAFF") return NextResponse.json({ error: "Staff account not found." }, { status: 404 });
    if (target.isActive === d.active) return NextResponse.json({ error: "Staff access is already in that state." }, { status: 409 });
    const updated = await prisma.$transaction(async tx => {
      const row = await tx.user.updateMany({ where: { id: d.userId, role: "STAFF", isActive: target.isActive }, data: { isActive: d.active } });
      if (row.count !== 1) throw new Error("STAFF_STATE_CHANGED");
      await tx.auditLog.create({ data: { actorId: auth.session!.userId, action: d.active ? "STAFF_ACCESS_RESTORED" : "STAFF_ACCESS_REVOKED", entityType: "User", entityId: d.userId, metadata: { email: target.email } } });
      return tx.user.findUnique({ where: { id: d.userId }, select: { id: true, name: true, email: true, role: true, isActive: true } });
    }, { isolationLevel: "Serializable" });
    return NextResponse.json({ staff: updated });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid staff access update." }, { status: 400 });
    if (error instanceof Error && error.message === "STAFF_STATE_CHANGED") return NextResponse.json({ error: "This staff account changed during the update. Refresh and retry." }, { status: 409 });
    return NextResponse.json({ error: "Could not update staff access." }, { status: 500 });
  }
}
