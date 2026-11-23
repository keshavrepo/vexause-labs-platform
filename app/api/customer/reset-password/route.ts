import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { hashOneTimeToken } from "@/lib/auth-tokens";

const schema = z.object({ token: z.string().min(30).max(200), password: z.string().min(10).max(128) });

export async function POST(request: NextRequest) {
  const rate = await enforceRateLimit(request, { namespace: "customer-reset-password", limit: 8, windowMs: 900000 });
  if (!rate.allowed) return rate.response;
  try {
    const input = schema.parse(await request.json());
    const tokenHash = hashOneTimeToken(input.token);
    const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
    if (!record || record.usedAt || record.expiresAt <= new Date()) {
      return NextResponse.json({ error: "This reset link is invalid or has expired. Request a new one." }, { status: 400 });
    }
    const passwordHash = await bcrypt.hash(input.password, 12);
    const changed = await prisma.$transaction(async tx => {
      const claimed = await tx.passwordResetToken.updateMany({
        where: { id: record.id, usedAt: null, expiresAt: { gt: new Date() } },
        data: { usedAt: new Date() }
      });
      if (!claimed.count) return false;
      await tx.user.update({ where: { id: record.userId }, data: { passwordHash } });
      await tx.passwordResetToken.updateMany({ where: { userId: record.userId, usedAt: null }, data: { usedAt: new Date() } });
      return true;
    });
    if (!changed) return NextResponse.json({ error: "This reset link has already been used or has expired." }, { status: 400 });
    return NextResponse.json({ success: true, message: "Password updated. Please sign in again." });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Use a password with at least 10 characters." }, { status: 400 });
    console.error("Password reset failed", error);
    return NextResponse.json({ error: "Unable to reset password." }, { status: 500 });
  }
}
