import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashOneTimeToken } from "@/lib/auth-tokens";

const schema = z.object({ token: z.string().min(30).max(200) });

export async function POST(request: NextRequest) {
  try {
    const { token } = schema.parse(await request.json());
    const tokenHash = hashOneTimeToken(token);
    const record = await prisma.emailVerificationToken.findUnique({ where: { tokenHash } });
    if (!record || record.usedAt || record.expiresAt <= new Date()) {
      return NextResponse.json({ error: "This verification link is invalid or has expired." }, { status: 400 });
    }
    const verified = await prisma.$transaction(async tx => {
      const claimed = await tx.emailVerificationToken.updateMany({
        where: { id: record.id, usedAt: null, expiresAt: { gt: new Date() } },
        data: { usedAt: new Date() }
      });
      if (!claimed.count) return false;
      await tx.user.update({ where: { id: record.userId }, data: { emailVerifiedAt: new Date() } });
      await tx.emailVerificationToken.updateMany({ where: { userId: record.userId, usedAt: null }, data: { usedAt: new Date() } });
      return true;
    });
    if (!verified) return NextResponse.json({ error: "This verification link has already been used." }, { status: 400 });
    return NextResponse.json({ success: true, message: "Email address verified." });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Invalid verification link." }, { status: 400 });
    console.error("Email verification failed", error);
    return NextResponse.json({ error: "Unable to verify email." }, { status: 500 });
  }
}
