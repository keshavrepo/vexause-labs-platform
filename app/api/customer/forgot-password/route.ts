import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { createOneTimeToken, siteUrl } from "@/lib/auth-tokens";

const schema = z.object({ email: z.string().email().max(254) });
const generic = { message: "If an eligible account exists, password reset instructions will be sent." };

export async function POST(request: NextRequest) {
  const rate = await enforceRateLimit(request, { namespace: "customer-forgot-password", limit: 5, windowMs: 3600000 });
  if (!rate.allowed) return rate.response;
  try {
    const { email } = schema.parse(await request.json());
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() }, select: { id: true, email: true, role: true, isActive: true } });
    if (user && user.role === "CUSTOMER" && user.isActive) {
      const { token, tokenHash } = createOneTimeToken();
      const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
      const url = new URL("/account/reset-password", siteUrl());
      url.searchParams.set("token", token);
      await prisma.$transaction(async tx => {
        await tx.passwordResetToken.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: new Date() } });
        await tx.passwordResetToken.create({ data: { userId: user.id, tokenHash, expiresAt } });
        await tx.backgroundJob.create({ data: { type: "EMAIL_DELIVERY", payload: {
          to: user.email, subject: "Reset your VEXAUSE LABS password",
          text: `Use this link within 30 minutes to reset your password: ${url.toString()}`,
          html: `<p>We received a request to reset your VEXAUSE LABS password.</p><p><a href="${url.toString()}">Reset password</a></p><p>This link expires in 30 minutes. If you did not request this, ignore this email.</p>`
        } } });
      });
    }
    return NextResponse.json(generic, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    console.error("Password reset request failed", error);
    return NextResponse.json({ error: "Unable to process the request right now." }, { status: 503 });
  }
}
